import torch
import torch.nn as nn
import numpy as np
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
import math

# 🔹 Positional Encoding for Transformer
class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=5000):
        super(PositionalEncoding, self).__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0).transpose(0, 1)
        self.register_buffer('pe', pe)

    def forward(self, x):
        return x + self.pe[:x.size(0), :]

# 🔹 Manual Transformer Model for Time-Series
class TransformerForecaster(nn.Module):
    def __init__(self, input_dim=1, d_model=64, nhead=4, num_layers=2, dim_feedforward=128, dropout=0.1):
        super(TransformerForecaster, self).__init__()
        self.encoder_input_layer = nn.Linear(input_dim, d_model)
        self.pos_encoder = PositionalEncoding(d_model)
        encoder_layers = nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward, dropout)
        self.transformer_encoder = nn.TransformerEncoder(encoder_layers, num_layers)
        self.decoder_output_layer = nn.Linear(d_model, 5) # Predict 5 days at once

    def forward(self, src):
        # src shape: [batch, seq_len, 1]
        src = src.transpose(0, 1) # [seq_len, batch, 1]
        src = self.encoder_input_layer(src) # [seq_len, batch, d_model]
        src = self.pos_encoder(src)
        output = self.transformer_encoder(src) # [seq_len, batch, d_model]
        output = output[-1, :, :] # [batch, d_model] (take the last output of sequence)
        output = self.decoder_output_layer(output) # [batch, 5]
        return output


def predict_transformer(symbol: str):
    # 📥 Fetch data (last year for better training context)
    data = yf.download(f"{symbol}.NS", period="1y", progress=False)

    if data.empty:
        return {"error": f"No historical data available for {symbol}"}

    # 🧹 Clean data: Drop NaNs which break training/scaling
    # This is critical for stocks with trading holidays or gaps
    clean_data = data["Close"].dropna()
    
    if len(clean_data) < 35: # window size (30) + forecast_len (5)
        return {"error": "Insufficient trading history for Transformer analysis"}

    close_prices = clean_data.values.reshape(-1, 1)

    # 🔄 Handle Constant Prices (Penny stocks or price freezes)
    # MinMaxScaler fails if high == low (division by zero -> NaN)
    if np.all(close_prices == close_prices[0]):
        current_val = float(close_prices[-1][0])
        return {
            "current_price": current_val,
            "forecast": [current_val] * 5,
            "trend": "Sideways",
            "conviction_score": 0.0,
            "model_type": "Static-Baseline"
        }

    # 🔄 Normalize
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(close_prices)

    # 🧠 Prepare dataset (Sequence Length 30)
    X, y = [], []
    window = 30
    forecast_len = 5

    for i in range(window, len(scaled) - forecast_len + 1):
        X.append(scaled[i-window:i])
        y.append(scaled[i:i+forecast_len].flatten())

    if len(X) < 10:
        return {"error": "Insufficient history for Transformer training sequence"}

    X_tensor = torch.tensor(np.array(X), dtype=torch.float32)
    y_tensor = torch.tensor(np.array(y), dtype=torch.float32)

    # 🧠 Model Initialization
    model = TransformerForecaster()
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    # 🔁 Training Loop (Lightweight on-the-fly training)
    # Note: In production, models would be pre-trained and fine-tuned
    model.train()
    for epoch in range(50): # Reduced slightly for faster response
        optimizer.zero_grad()
        output = model(X_tensor)
        loss = criterion(output, y_tensor)
        loss.backward()
        optimizer.step()

    # 🔮 Predict next 5 values
    model.eval()
    with torch.no_grad():
        last_seq = scaled[-window:]
        last_seq_tensor = torch.tensor(last_seq, dtype=torch.float32).unsqueeze(0)
        pred_scaled = model(last_seq_tensor).numpy()
        
    # Inverse scaling for the next 5 days
    predicted_prices = scaler.inverse_transform(pred_scaled.reshape(-1, 1)).flatten().tolist()
    # Post-process to ensure no negative prices (clipping)
    predicted_prices = [max(0.01, round(p, 2)) for p in predicted_prices]
    
    current_price = float(close_prices[-1][0])
    
    # Calculate trend based on avg forecast vs current
    avg_pred = sum(predicted_prices) / len(predicted_prices)
    trend = "Uptrend" if avg_pred > current_price else "Downtrend"
    if abs(avg_pred - current_price) / current_price < 0.005:
        trend = "Sideways"
        
    conviction = round(min(100, abs(avg_pred - current_price) / current_price * 500), 2)

    return {
        "current_price": current_price,
        "forecast": predicted_prices,
        "trend": trend,
        "conviction_score": conviction,
        "model_type": "Self-Attention-Transformer"
    }
