import {
  Activity,
  Eye,
  EyeOff,
  Globe,
  Shield,
  Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const TRUST_POINTS = [
  {
    icon: Shield,
    en: "Enterprise-grade encryption",
    fr: "Chiffrement de niveau entreprise",
  },
  { icon: Activity, en: "99.9% platform uptime", fr: "99,9% de disponibilité" },
  {
    icon: Stethoscope,
    en: "15 hospitals connected nationally",
    fr: "15 hôpitaux connectés nationalement",
  },
];

export default function LoginPage() {
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.user, data.accessToken);
      navigate("/dashboard");
    } catch {
      setError(
        lang === "FR"
          ? "Identifiants incorrects. Veuillez réessayer."
          : "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all`;

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* ── Left: Branding panel ─────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 lg:w-5/12 xl:w-2/5"
        style={{
          background:
            "linear-gradient(160deg, #0c1a3a 0%, #091228 50%, #060d1c 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #38bdf8, #6366f1)",
              boxShadow: "0 0 20px rgba(56,189,248,0.3)",
            }}
          >
            <Stethoscope size={20} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-lg leading-none">
              M.E.D.I.C.
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Healthcare Interoperability Platform
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="space-y-6">
          <div>
            <h1
              className="font-display font-bold text-white leading-tight"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}
            >
              {lang === "FR"
                ? "Vos patients. Partout."
                : "Your patients.\nEverywhere."}
            </h1>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {lang === "FR"
                ? "Un dossier médical unifié qui suit le patient de Yaoundé à Bamenda. Conçu pour les soignants camerounais."
                : "One unified medical record that follows the patient from Yaoundé to Bamenda. Built for Cameroonian caregivers."}
            </p>
          </div>

          {/* Trust points */}
          <div className="space-y-3">
            {TRUST_POINTS.map(({ icon: Icon, en, fr }) => (
              <div key={en} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(56,189,248,0.12)",
                    border: "1px solid rgba(56,189,248,0.2)",
                  }}
                >
                  <Icon size={14} style={{ color: "#38bdf8" }} />
                </div>
                <span
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {lang === "FR" ? fr : en}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            © 2026 M.E.D.I.C. · All rights reserved
          </p>
          <button
            onClick={() => setLang(lang === "EN" ? "FR" : "EN")}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg
              transition-colors"
            style={{
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Globe size={12} />
            {lang === "EN" ? "Français" : "English"}
          </button>
        </div>
      </div>

      {/* ── Right: Login form ────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #38bdf8, #6366f1)" }}
          >
            <Stethoscope size={18} className="text-white" />
          </div>
          <span
            className="font-display font-bold text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            M.E.D.I.C.
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Greeting */}
          <div className="mb-8">
            <h2
              className="font-display text-3xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {lang === "FR" ? "Bon retour" : "Welcome back"}
            </h2>
            <p
              className="mt-1.5 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {lang === "FR"
                ? "Connectez-vous à votre espace de travail médical"
                : "Sign in to your clinical workspace"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 p-3.5 rounded-xl text-sm flex items-center gap-2"
              style={{
                background: "rgba(248,113,113,0.1)",
                color: "#f87171",
                border: "1px solid rgba(248,113,113,0.25)",
              }}
            >
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                {lang === "FR" ? "Nom d'utilisateur" : "Username"}
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                className={inputCls}
                placeholder={lang === "FR" ? "votre.nom" : "your.username"}
                autoComplete="username"
                autoFocus
                required
                style={{
                  background: "var(--bg-card)",
                  border: "1.5px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#38bdf8")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  {lang === "FR" ? "Mot de passe" : "Password"}
                </label>
                <button
                  type="button"
                  className="text-xs transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  {lang === "FR" ? "Mot de passe oublié?" : "Forgot password?"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={inputCls}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{
                    background: "var(--bg-card)",
                    border: "1.5px solid var(--border)",
                    color: "var(--text-primary)",
                    paddingRight: 44,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#38bdf8")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-display font-semibold text-sm
                text-white transition-all disabled:opacity-60 mt-2"
              style={{
                background: loading
                  ? "var(--accent)"
                  : "linear-gradient(135deg, #0ea5e9, #6366f1)",
                boxShadow: loading ? "none" : "0 8px 24px rgba(14,165,233,0.3)",
                transform: loading ? "none" : undefined,
              }}
            >
              {loading
                ? lang === "FR"
                  ? "Connexion en cours…"
                  : "Signing in…"
                : lang === "FR"
                  ? "Se connecter"
                  : "Sign in"}
            </button>
          </form>

          {/* Register link */}
          <p
            className="text-center text-sm mt-6"
            style={{ color: "var(--text-secondary)" }}
          >
            {lang === "FR" ? "Nouveau sur M.E.D.I.C.?" : "New to M.E.D.I.C.?"}{" "}
            <Link
              to="/register"
              className="font-semibold transition-colors"
              style={{ color: "var(--accent)" }}
            >
              {lang === "FR" ? "Créer un compte" : "Create account"}
            </Link>
          </p>

          {/* Security note */}
          <div
            className="mt-6 flex items-center justify-center gap-1.5 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <Shield size={11} />
            {lang === "FR"
              ? "Sessions chiffrées · Conformité RGPD"
              : "Encrypted sessions · GDPR compliant"}
          </div>

          {/* Mobile language toggle */}
          <div className="lg:hidden flex justify-center mt-4">
            <button
              onClick={() => setLang(lang === "EN" ? "FR" : "EN")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                transition-colors"
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <Globe size={12} />
              {lang === "EN" ? "🇫🇷 Français" : "🇬🇧 English"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
