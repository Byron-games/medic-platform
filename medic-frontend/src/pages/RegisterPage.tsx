import { Building2, ChevronDown, Clock, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

interface Facility {
  facilityId: string;
  name: string;
  region: string;
  city: string;
  facilityType: string;
  phone: string;
}

const ROLES = [
  { value: "DOCTOR", label: "Doctor (Médecin)" },
  { value: "NURSE", label: "Nurse — General (Infirmier/ière)" },
  { value: "MIDWIFE", label: "Midwife (Sage-femme)" },
  {
    value: "LAB_TECHNICIAN",
    label: "Laboratory Technician (Technicien de laboratoire)",
  },
  { value: "RADIOLOGIST", label: "Radiologist (Radiologue)" },
  { value: "PHARMACIST", label: "Pharmacist (Pharmacien/ienne)" },
  { value: "RECEPTIONIST", label: "Receptionist / Clerk (Réceptionniste)" },
  { value: "ANALYST", label: "Health Data Analyst (Analyste en santé)" },
  { value: "FACILITY_ADMIN", label: "Facility Administrator (Administrateur)" },
  {
    value: "REGISTRAR",
    label: "Staff Registrar (Responsable des inscriptions)",
  },
];

const REGIONS = [
  "Adamaoua",
  "Centre",
  "Est",
  "Extrême-Nord",
  "Littoral",
  "Nord",
  "Nord-Ouest",
  "Ouest",
  "Sud",
  "Sud-Ouest",
];

export default function RegisterPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingInfo, setPendingInfo] = useState({
    facilityName: "",
    staffId: "",
  });

  // Facilities
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitySearch, setFacSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [facilityOpen, setFacOpen] = useState(false);
  const [selectedFac, setSelectedFac] = useState<Facility | null>(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "DOCTOR",
  });

  // Public endpoint – no JWT token required
  useEffect(() => {
    fetch("/api/v1/auth/facilities")
      .then((r) => r.json())
      .then((data) => setFacilities(Array.isArray(data) ? data : []))
      .catch(() => setFacilities([]));
  }, []);

  const filteredFacilities = facilities.filter(
    (f) =>
      (!regionFilter || f.region === regionFilter) &&
      (!facilitySearch ||
        f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.city.toLowerCase().includes(facilitySearch.toLowerCase())),
  );

  const setF =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm transition-all
    bg-white/5 dark:bg-white/5 border-white/10
    text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]
    focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40
    focus:border-[var(--accent)]/60`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFac) {
      setError(
        lang === "FR"
          ? "Veuillez sélectionner un établissement."
          : "Please select a facility.",
      );
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(
        lang === "FR"
          ? "Les mots de passe ne correspondent pas."
          : "Passwords do not match.",
      );
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
        facilityId: selectedFac.facilityId,
        facilityName: selectedFac.name,
      });
      if (
        data.user?.role === "PENDING" ||
        data.user?.accountStatus === "PENDING"
      ) {
        setPendingInfo({
          facilityName: selectedFac.name,
          staffId: data.user?.staffId ?? "",
        });
        setPending(true);
      } else {
        login(data.user, data.accessToken);
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (lang === "FR" ? "Inscription échouée." : "Registration failed.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (pending)
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="w-full max-w-md text-center space-y-6">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl
          bg-amber-500/20 border border-amber-500/30 mx-auto"
          >
            <Clock size={32} className="text-amber-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {lang === "FR" ? "Inscription soumise" : "Registration submitted"}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed">
              {lang === "FR"
                ? `Votre compte est en attente d'approbation par le Responsable des inscriptions à ${pendingInfo.facilityName}. Vous recevrez une notification une fois approuvé.`
                : `Your account is pending approval by the Registrar at ${pendingInfo.facilityName}. You will be notified once approved and can access the full platform.`}
            </p>
          </div>
          {pendingInfo.staffId && (
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                {lang === "FR"
                  ? "Votre identifiant de personnel"
                  : "Your staff ID"}
              </p>
              <p className="font-mono text-lg font-bold text-[var(--accent)]">
                {pendingInfo.staffId}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {lang === "FR"
                  ? "Notez cet identifiant — il sera nécessaire pour vous identifier."
                  : "Keep this ID — it will be needed to identify your account."}
              </p>
            </div>
          )}
          <Link
            to="/login"
            className="inline-block text-sm text-[var(--accent)] hover:underline"
          >
            {lang === "FR" ? "Retour à la connexion" : "Back to login"}
          </Link>
        </div>
      </div>
    );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 30px rgba(0,217,255,0.25)",
            }}
          >
            <span className="font-display font-black text-white text-xl">
              M
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            {lang === "FR" ? "Rejoindre M.E.D.I.C." : "Join M.E.D.I.C."}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {lang === "FR"
              ? "Plateforme d'interopérabilité des soins de santé"
              : "Healthcare Interoperability Platform"}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 lg:p-8 space-y-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
          }}
        >
          {error && (
            <div
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/20
              text-red-400 text-sm"
            >
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Facility picker */}
            <div>
              <label
                className="block text-xs font-semibold text-[var(--text-secondary)]
                uppercase tracking-wide mb-2"
              >
                {lang === "FR"
                  ? "Établissement de santé"
                  : "Healthcare Facility"}{" "}
                <span className="text-red-400">*</span>
              </label>

              {selectedFac ? (
                <div
                  className="flex items-start justify-between p-3 rounded-xl
                  bg-[var(--accent)]/10 border border-[var(--accent)]/30"
                >
                  <div className="flex items-start gap-2">
                    <Building2
                      size={16}
                      className="text-[var(--accent)] mt-0.5 shrink-0"
                    />
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {selectedFac.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {selectedFac.city}, {selectedFac.region} ·{" "}
                        <span className="font-mono text-[var(--accent)]">
                          {selectedFac.facilityId}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFac(null);
                      setFacOpen(true);
                    }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]
                      transition-colors shrink-0"
                  >
                    {lang === "FR" ? "Changer" : "Change"}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFacOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3
                      rounded-xl border border-[var(--border)] bg-white/5
                      text-sm transition-colors hover:border-[var(--accent)]/50"
                  >
                    <span className="text-[var(--text-secondary)]">
                      {lang === "FR"
                        ? "Choisissez votre établissement…"
                        : "Select your facility…"}
                    </span>
                    <ChevronDown
                      size={16}
                      className="text-[var(--text-secondary)]"
                    />
                  </button>

                  {facilityOpen && (
                    <div
                      className="absolute top-full left-0 right-0 mt-2 rounded-xl
                      shadow-2xl z-50 overflow-hidden"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        maxHeight: "300px",
                      }}
                    >
                      <div className="p-2 border-b border-[var(--border)] space-y-2">
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2
                            text-[var(--text-secondary)]"
                          />
                          <input
                            autoFocus
                            type="text"
                            value={facilitySearch}
                            onChange={(e) => setFacSearch(e.target.value)}
                            placeholder={
                              lang === "FR"
                                ? "Rechercher…"
                                : "Search hospitals…"
                            }
                            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm
                              bg-[var(--bg-primary)] border border-[var(--border)]
                              text-[var(--text-primary)] focus:outline-none
                              focus:border-[var(--accent)]/50
                              placeholder:text-[var(--text-secondary)]"
                          />
                        </div>
                        <select
                          value={regionFilter}
                          onChange={(e) => setRegionFilter(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm
                            bg-[var(--bg-primary)] border border-[var(--border)]
                            text-[var(--text-primary)] focus:outline-none"
                        >
                          <option value="">
                            {lang === "FR"
                              ? "Toutes les régions"
                              : "All regions"}
                          </option>
                          {REGIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div
                        className="overflow-y-auto"
                        style={{ maxHeight: "200px" }}
                      >
                        {filteredFacilities.length === 0 ? (
                          <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
                            {lang === "FR"
                              ? "Aucun résultat"
                              : "No facilities found"}
                          </div>
                        ) : (
                          filteredFacilities.map((fac) => (
                            <button
                              key={fac.facilityId}
                              type="button"
                              onClick={() => {
                                setSelectedFac(fac);
                                setFacOpen(false);
                                setFacSearch("");
                              }}
                              className="w-full flex items-start gap-3 px-4 py-3 text-left
                              hover:bg-[var(--bg-primary)] transition-colors"
                            >
                              <Building2
                                size={15}
                                className="text-[var(--text-secondary)] mt-0.5 shrink-0"
                              />
                              <div>
                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                  {fac.name}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                                  {fac.city}, {fac.region} ·{" "}
                                  <span className="font-mono">
                                    {fac.facilityId}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Role */}
            <div>
              <label
                className="block text-xs font-semibold text-[var(--text-secondary)]
                uppercase tracking-wide mb-2"
              >
                {lang === "FR" ? "Rôle" : "Role"}{" "}
                <span className="text-red-400">*</span>
              </label>
              <select
                value={form.role}
                onChange={setF("role")}
                className={inputCls}
                required
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Personal info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  className="block text-xs font-semibold text-[var(--text-secondary)]
                  uppercase tracking-wide mb-2"
                >
                  {t("auth.fullName")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={setF("fullName")}
                  className={inputCls}
                  placeholder={
                    lang === "FR" ? "Dr. Jean Mbarga" : "Dr. John Smith"
                  }
                  required
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold text-[var(--text-secondary)]
                  uppercase tracking-wide mb-2"
                >
                  {t("auth.username")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={setF("username")}
                  className={inputCls}
                  placeholder="jmbarga"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold text-[var(--text-secondary)]
                  uppercase tracking-wide mb-2"
                >
                  {t("auth.email")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={setF("email")}
                  className={inputCls}
                  placeholder="j.mbarga@hospital.cm"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold text-[var(--text-secondary)]
                  uppercase tracking-wide mb-2"
                >
                  {t("auth.password")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={setF("password")}
                  className={inputCls}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold text-[var(--text-secondary)]
                  uppercase tracking-wide mb-2"
                >
                  {lang === "FR"
                    ? "Confirmer le mot de passe"
                    : "Confirm password"}{" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={setF("confirmPassword")}
                  className={inputCls}
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>

            {/* Info box */}
            <div
              className="p-3 rounded-xl text-xs text-[var(--text-secondary)]"
              style={{
                background: "rgba(0,217,255,0.05)",
                border: "1px solid rgba(0,217,255,0.1)",
              }}
            >
              {lang === "FR"
                ? "📋 Après inscription, votre compte sera en attente de validation par le Responsable des inscriptions de votre établissement. Un identifiant de personnel vous sera attribué automatiquement."
                : "📋 After registering, your account will be pending approval by your facility's Registrar. A staff ID will be automatically assigned to your account."}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white
                transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, var(--accent), #6366f1)",
                boxShadow: loading ? "none" : "0 8px 24px rgba(0,217,255,0.2)",
              }}
            >
              {loading
                ? lang === "FR"
                  ? "Inscription en cours…"
                  : "Creating account…"
                : lang === "FR"
                  ? "S'inscrire"
                  : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            {lang === "FR" ? "Déjà inscrit ?" : "Already have an account?"}{" "}
            <Link
              to="/login"
              className="text-[var(--accent)] font-medium hover:underline"
            >
              {lang === "FR" ? "Se connecter" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
