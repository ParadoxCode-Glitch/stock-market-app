# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies needed for libraries like newspaper3k and project tools
RUN apt-get update && apt-get install -y \
    build-essential \
    libxml2-dev \
    libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Create a non-root user (Hugging Face preference)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy the app to the user's home directory
COPY --chown=user . $HOME/app

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Run the app with uvicorn on the specified port
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
