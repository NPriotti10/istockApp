import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErr("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch {
      setErr("Usuario o contraseña inválidos");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 24,
      // fondo con gradiente sutil
      background:
        "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.12))",
    },
    card: {
      width: "100%",
      maxWidth: 380,
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
      padding: 24,
      border: "1px solid rgba(0,0,0,0.06)",
    },
    brand: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    logo: {
      width: 36,
      height: 36,
      borderRadius: 8,
      display: "grid",
      placeItems: "center",
      background:
        "linear-gradient(135deg, rgb(14,165,233), rgb(99,102,241))",
      color: "#fff",
      fontWeight: 800,
    },
    title: {
      fontSize: 18,
      fontWeight: 700,
      color: "#111827",
      margin: 0,
    },
    subtitle: {
      fontSize: 13,
      color: "#6B7280",
      marginBottom: 16,
      marginTop: 4,
    },
    alert: {
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.35)",
      color: "#B91C1C",
      padding: "8px 10px",
      borderRadius: 10,
      fontSize: 13,
      marginBottom: 12,
    },
    label: {
      display: "block",
      fontSize: 13,
      fontWeight: 600,
      color: "#374151",
      marginBottom: 6,
      marginTop: 10,
    },
    inputWrap: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      fontSize: 14,
      borderRadius: 10,
      border: "1px solid #D1D5DB",
      outline: "none",
      transition: "box-shadow .15s, border-color .15s",
    },
    inputFocus: {
      boxShadow: "0 0 0 4px rgba(59,130,246,0.15)",
      borderColor: "#3B82F6",
    },
    eyeBtn: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      border: "none",
      background: "transparent",
      color: "#4B5563",
      fontSize: 13,
      cursor: "pointer",
      padding: 6,
      borderRadius: 8,
    },
    submit: {
      width: "100%",
      marginTop: 16,
      padding: "10px 12px",
      fontWeight: 700,
      fontSize: 14,
      border: "none",
      borderRadius: 10,
      color: "#fff",
      background:
        "linear-gradient(135deg, rgb(59,130,246), rgb(99,102,241))",
      boxShadow: "0 8px 18px rgba(59,130,246,0.35)",
      cursor: "pointer",
      transition: "transform .06s ease",
    },
    submitDisabled: {
      opacity: 0.6,
      cursor: "not-allowed",
      boxShadow: "none",
    },
    footerRow: {
      marginTop: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 12.5,
      color: "#6B7280",
    },
    linkBtn: {
      border: "none",
      background: "transparent",
      color: "#3B82F6",
      fontWeight: 600,
      cursor: "pointer",
      padding: 0,
    },
  };

  const [uFocus, setUFocus] = useState(false);
  const [pFocus, setPFocus] = useState(false);

  const canSubmit = username.trim() && password.trim() && !loading;

  return (
    <div style={styles.page}>
      <form onSubmit={onSubmit} style={styles.card} noValidate>
        <div style={styles.brand}>
          <div style={styles.logo}>iS</div>
          <div>
            <h1 style={styles.title}>iStock · Iniciar sesión</h1>
            
          </div>
        </div>

        {err ? <div style={styles.alert}>{err}</div> : null}

        <label style={styles.label} htmlFor="usuario">
          Usuario
        </label>
        <div style={styles.inputWrap}>
          <input
            id="usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            style={{ ...styles.input, ...(uFocus ? styles.inputFocus : {}) }}
            onFocus={() => setUFocus(true)}
            onBlur={() => setUFocus(false)}
            placeholder="Usuario"
            inputMode="text"
            required
          />
        </div>

        <label style={styles.label} htmlFor="password">
          Contraseña
        </label>
        <div style={styles.inputWrap}>
          <input
            id="password"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ ...styles.input, ...(pFocus ? styles.inputFocus : {}) }}
            onFocus={() => setPFocus(true)}
            onBlur={() => setPFocus(false)}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
            style={styles.eyeBtn}
          >
            {showPwd ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{ ...styles.submit, ...(canSubmit ? {} : styles.submitDisabled) }}
          onMouseDown={(e) => canSubmit && (e.currentTarget.style.transform = "scale(0.99)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>

        
      </form>
    </div>
  );
}
