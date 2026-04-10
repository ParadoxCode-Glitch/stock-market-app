import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import StockPage from "./pages/StockPage";
import ComparePage from "./pages/ComparePage";
import Portfolio from "./pages/Portfolio";
import LandingPage from "./pages/LandingPage";

// Guard: redirect to /landing if user hasn't accepted the disclaimer
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accepted = sessionStorage.getItem("disclaimer_accepted") === "true";
  if (!accepted) return <Navigate to="/landing" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing — no Navbar */}
        <Route path="/landing" element={<LandingPage />} />
        
        {/* Protected routes — redirect to /landing until disclaimer is accepted */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Navbar />
              <Routes>
                <Route path="/home" element={<Home />} />
                <Route path="/stock/:symbol" element={<StockPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/portfolio" element={<Portfolio />} />
                {/* Redirect / to /home if already accepted */}
                <Route path="/" element={<Navigate to="/home" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}