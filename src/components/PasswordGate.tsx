import React, { useState, useEffect } from "react";

const STORAGE_KEY = "ux-tracker-auth";
const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD || "uxtracker2025";

const PasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      setAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === SITE_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "true");
      setAuthenticated(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#141412",
        fontFamily: "Lexend, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#1e1d1a",
          border: "1px solid #2e2c27",
          borderRadius: 16,
          padding: "40px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          minWidth: 320,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: "#f0ede6", letterSpacing: -0.5 }}>
          UX Feature Tracker
        </div>
        <div style={{ fontSize: 13, color: "#9e9a91" }}>
          Entrez le mot de passe pour accéder au site
        </div>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: error ? "1.5px solid #ef4444" : "1px solid #3d3b34",
            background: "#252420",
            color: "#f0ede6",
            fontSize: 15,
            fontFamily: "Lexend, sans-serif",
            outline: "none",
            transition: "border 0.2s",
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: "#ef4444", marginTop: -12 }}>
            Mot de passe incorrect
          </div>
        )}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: "#f0ede6",
            color: "#141412",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "Lexend, sans-serif",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Accéder
        </button>
      </form>
    </div>
  );
};

export default PasswordGate;
