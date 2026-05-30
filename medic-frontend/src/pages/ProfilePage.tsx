import {
  BadgeCheck,
  Building2,
  Camera,
  Lock,
  Mail,
  Phone,
  Save,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AvatarCircle from "../components/AvatarCircle";
import { useRole } from "../hooks/useRole";
import { useLang } from "../i18n/LanguageContext";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const ROLE_META: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrator", color: "#f87171" },
  DOCTOR: { label: "Doctor", color: "#38bdf8" },
  NURSE: { label: "Nurse", color: "#34d399" },
  MIDWIFE: { label: "Midwife", color: "#a78bfa" },
  LAB_TECHNICIAN: { label: "Lab Technician", color: "#fbbf24" },
  RADIOLOGIST: { label: "Radiologist", color: "#fb923c" },
  PHARMACIST: { label: "Pharmacist", color: "#4ade80" },
  RECEPTIONIST: { label: "Receptionist", color: "#60a5fa" },
  ANALYST: { label: "Health Analyst", color: "#c084fc" },
  FACILITY_ADMIN: { label: "Facility Admin", color: "#f472b6" },
  REGISTRAR: { label: "Registrar", color: "#facc15" },
  PENDING: { label: "Pending Approval", color: "#94a3b8" },
};

export default function ProfilePage() {
  const { user, setUser, avatarUrl, setAvatar } = useAuthStore();
  const { role } = useRole();
  const { lang } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = ROLE_META[role ?? ""] ?? ROLE_META.PENDING;

  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");

  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phoneNumber: user?.phoneNumber ?? "",
  });

  const [pw, setPw] = useState({
    current: "",
    newPw: "",
    confirm: "",
  });

  // Load avatar from localStorage on mount (since it's excluded from persist)
  useEffect(() => {
    if (!avatarUrl && user?.username) {
      const stored = localStorage.getItem(`medic-avatar-${user.username}`);
      if (stored) setAvatar(stored);
    }
  }, [user?.username, avatarUrl, setAvatar]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError(
        lang === "FR"
          ? "Image trop grande (max 2MB)"
          : "Image too large (max 2MB)",
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setAvatar(b64);
      localStorage.setItem(`medic-avatar-${user?.username}`, b64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.patch("/auth/profile", form);
      if (setUser) setUser({ ...user!, ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (lang === "FR" ? "Échec de la mise à jour" : "Update failed");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPw !== pw.confirm) {
      setPwError(
        lang === "FR"
          ? "Les mots de passe ne correspondent pas"
          : "Passwords do not match",
      );
      return;
    }
    if (pw.newPw.length < 8) {
      setPwError(
        lang === "FR" ? "Minimum 8 caractères" : "Minimum 8 characters",
      );
      return;
    }
    setPwSaving(true);
    setPwError("");
    setPwSaved(false);
    try {
      await api.patch("/auth/profile/password", {
        currentPassword: pw.current,
        newPassword: pw.newPw,
      });
      setPw({ current: "", newPw: "", confirm: "" });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (lang === "FR"
          ? "Mot de passe incorrect"
          : "Incorrect current password");
      setPwError(msg);
    } finally {
      setPwSaving(false);
    }
  };

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none`;
  const sectionCard = `rounded-2xl p-5 lg:p-6 space-y-4`;

  return (
    <div className="max-w-3xl space-y-5">
      <h1
        className="font-display text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {lang === "FR" ? "Mon profil" : "My profile"}
      </h1>

      {/* Avatar + identity */}
      <div
        className={sectionCard}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar with camera button */}
          <div className="relative group">
            <AvatarCircle size={96} radius="rounded-2xl" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl
                flex items-center justify-center text-white shadow-lg
                transition-transform hover:scale-110"
              style={{ background: "var(--accent)" }}
              title={lang === "FR" ? "Changer la photo" : "Change photo"}
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Identity info */}
          <div className="flex-1 min-w-0">
            <h2
              className="font-display text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.fullName}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="text-sm font-medium px-2.5 py-0.5 rounded-full"
                style={{
                  background: `${meta.color}18`,
                  color: meta.color,
                  border: `1px solid ${meta.color}30`,
                }}
              >
                {meta.label}
              </span>
              {user?.staffId && (
                <span
                  className="flex items-center gap-1 text-xs font-mono px-2 py-0.5
                  rounded-full"
                  style={{
                    background: "var(--accent-dim)",
                    color: "var(--accent)",
                    border: "1px solid rgba(56,189,248,0.2)",
                  }}
                >
                  <BadgeCheck size={11} />
                  {user.staffId}
                </span>
              )}
            </div>
            {user?.facilityName && (
              <div
                className="flex items-center gap-1.5 mt-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <Building2 size={13} />
                {user.facilityName}
                {user.facilityId && (
                  <span
                    className="font-mono text-xs ml-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ({user.facilityId})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upload note */}
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {lang === "FR"
            ? "JPG ou PNG · Max 2MB · Stocké localement (synchronisation cloud à venir)"
            : "JPG or PNG · Max 2MB · Stored locally (cloud sync coming soon)"}
        </p>
      </div>

      {/* Edit profile form */}
      <div
        className={sectionCard}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <User size={16} style={{ color: "var(--accent)" }} />
          <h2
            className="font-display font-semibold text-base"
            style={{ color: "var(--text-primary)" }}
          >
            {lang === "FR"
              ? "Informations personnelles"
              : "Personal information"}
          </h2>
        </div>

        {error && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{
              background: "rgba(248,113,113,0.1)",
              color: "#f87171",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            {error}
          </div>
        )}
        {saved && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{
              background: "rgba(52,211,153,0.1)",
              color: "#34d399",
              border: "1px solid rgba(52,211,153,0.2)",
            }}
          >
            ✓ {lang === "FR" ? "Profil mis à jour" : "Profile updated"}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                {lang === "FR" ? "Nom complet" : "Full name"}
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                className={inputCls}
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <span className="flex items-center gap-1">
                  <Mail size={11} /> Email
                </span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className={inputCls}
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <span className="flex items-center gap-1">
                  <Phone size={11} />
                  {lang === "FR" ? "Téléphone" : "Phone"}
                </span>
              </label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                }
                className={inputCls}
                placeholder="+237 6XX XXX XXX"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Read-only fields */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Username
              </label>
              <input
                type="text"
                value={user?.username ?? ""}
                disabled
                className={inputCls}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  cursor: "not-allowed",
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Staff ID
              </label>
              <input
                type="text"
                value={user?.staffId ?? ""}
                disabled
                className={`${inputCls} font-mono`}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  cursor: "not-allowed",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
              text-sm font-semibold text-white transition-all
              disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, var(--accent), #6366f1)",
              boxShadow: "0 4px 14px rgba(56,189,248,0.25)",
            }}
          >
            <Save size={15} />
            {saving
              ? lang === "FR"
                ? "Enregistrement…"
                : "Saving…"
              : lang === "FR"
                ? "Enregistrer"
                : "Save changes"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div
        className={sectionCard}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Lock size={16} style={{ color: "var(--accent)" }} />
          <h2
            className="font-display font-semibold text-base"
            style={{ color: "var(--text-primary)" }}
          >
            {lang === "FR" ? "Changer le mot de passe" : "Change password"}
          </h2>
        </div>

        {pwError && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{
              background: "rgba(248,113,113,0.1)",
              color: "#f87171",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            {pwError}
          </div>
        )}
        {pwSaved && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{
              background: "rgba(52,211,153,0.1)",
              color: "#34d399",
              border: "1px solid rgba(52,211,153,0.2)",
            }}
          >
            ✓ {lang === "FR" ? "Mot de passe mis à jour" : "Password updated"}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {["current", "newPw", "confirm"].map((field) => {
            const labels: Record<string, string> = {
              current:
                lang === "FR" ? "Mot de passe actuel" : "Current password",
              newPw: lang === "FR" ? "Nouveau mot de passe" : "New password",
              confirm: lang === "FR" ? "Confirmer" : "Confirm new password",
            };
            return (
              <div key={field}>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {labels[field]}
                </label>
                <input
                  type="password"
                  value={pw[field as keyof typeof pw]}
                  onChange={(e) =>
                    setPw((p) => ({ ...p, [field]: e.target.value }))
                  }
                  className={inputCls}
                  placeholder="••••••••"
                  minLength={field !== "current" ? 8 : undefined}
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            );
          })}
          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
              text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <Lock size={15} />
            {pwSaving
              ? lang === "FR"
                ? "Mise à jour…"
                : "Updating…"
              : lang === "FR"
                ? "Mettre à jour"
                : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
