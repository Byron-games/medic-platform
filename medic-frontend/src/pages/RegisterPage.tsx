import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Info,
  Lock,
  Mail,
  Search,
  Stethoscope,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  {
    value: "DOCTOR",
    label: "Doctor / Médecin",
    icon: "🩺",
    desc: "Full clinical access — prescribe, EMR, telemedicine",
    descFR: "Accès clinique complet — prescriptions, DME, télémédecine",
  },
  {
    value: "NURSE",
    label: "Nurse / Infirmier(ière)",
    icon: "💉",
    desc: "Vitals, care records, appointments — no prescribing",
    descFR: "Constantes, soins, rendez-vous — sans prescription",
  },
  {
    value: "MIDWIFE",
    label: "Midwife / Sage-femme",
    icon: "👶",
    desc: "Maternity records, ANC, delivery, postnatal care",
    descFR: "Maternité, CPN, accouchement, soins postnataux",
  },
  {
    value: "LAB_TECHNICIAN",
    label: "Lab Technician / Technicien de labo",
    icon: "🔬",
    desc: "Enter lab results and track specimens",
    descFR: "Saisir les résultats de laboratoire et suivre les échantillons",
  },
  {
    value: "RADIOLOGIST",
    label: "Radiologist / Radiologue",
    icon: "🩻",
    desc: "Imaging results and radiology reports",
    descFR: "Résultats d'imagerie et rapports radiologiques",
  },
  {
    value: "PHARMACIST",
    label: "Pharmacist / Pharmacien(ne)",
    icon: "💊",
    desc: "Dispense prescriptions and manage drug inventory",
    descFR: "Délivrer les ordonnances et gérer le stock de médicaments",
  },
  {
    value: "RECEPTIONIST",
    label: "Receptionist / Réceptionniste",
    icon: "📋",
    desc: "Register patients, book appointments, manage queue",
    descFR: "Enregistrer les patients, gérer les rendez-vous et la file",
  },
  {
    value: "ANALYST",
    label: "Health Analyst / Analyste en santé",
    icon: "📊",
    desc: "Disease surveillance and national health analytics",
    descFR: "Surveillance des maladies et analyses sanitaires nationales",
  },
  {
    value: "FACILITY_ADMIN",
    label: "Facility Administrator / Administrateur",
    icon: "🏥",
    desc: "Manage facility settings and operational data",
    descFR: "Gérer les paramètres et données opérationnels de l'établissement",
  },
  {
    value: "REGISTRAR",
    label: "Staff Registrar / Responsable des inscriptions",
    icon: "✅",
    desc: "Approve new staff registrations at your facility",
    descFR: "Approuver les nouvelles inscriptions du personnel",
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

const STEPS = ["facility", "role", "account", "confirm"] as const;
type Step = (typeof STEPS)[number];

export default function RegisterPage() {
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const searchRef = useRef<HTMLInputElement>(null);
  const fr = lang === "FR";

  const [step, setStep] = useState<Step>("facility");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingInfo, setPendingInfo] = useState({ name: "", staffId: "" });

  // Facilities
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitySearch, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [selectedFac, setSelectedFac] = useState<Facility | null>(null);

  // Form
  const [selectedRole, setRole] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  useEffect(() => {
    api
      .get<Facility[]>("/auth/facilities")
      .then((r) => setFacilities(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (dropOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [dropOpen]);

  const filtered = facilities.filter(
    (f) =>
      (!regionFilter || f.region === regionFilter) &&
      (!facilitySearch ||
        f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.city.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.facilityId.toLowerCase().includes(facilitySearch.toLowerCase())),
  );

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputCls = (extra = "") =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
     bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]
     placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]
     focus:ring-2 focus:ring-[var(--accent-dim)] ${extra}`;

  // Step validation
  const canAdvance = () => {
    if (step === "facility") return selectedFac !== null;
    if (step === "role") return selectedRole !== "";
    if (step === "account") {
      return (
        form.fullName.length >= 2 &&
        form.username.length >= 3 &&
        form.email.includes("@") &&
        form.password.length >= 8 &&
        form.password === form.confirmPassword
      );
    }
    return true;
  };

  const advance = () => {
    setError("");
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", {
        username: form.username.toLowerCase(),
        email: form.email.toLowerCase(),
        password: form.password,
        fullName: form.fullName,
        role: selectedRole,
        facilityId: selectedFac!.facilityId,
        facilityName: selectedFac!.name,
      });
      if (
        data.user?.accountStatus === "PENDING" ||
        data.user?.role === "PENDING"
      ) {
        setPendingInfo({
          name: selectedFac!.name,
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
          ?.message ?? (fr ? "Inscription échouée." : "Registration failed.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Pending screen ────────────────────────────────────

  if (pending)
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="w-full max-w-md text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(251,191,36,0.15)",
                border: "2px solid rgba(251,191,36,0.3)",
              }}
            >
              <Clock size={36} style={{ color: "var(--warning)" }} />
            </div>
            <span className="absolute -top-1 -right-1 text-2xl">⏳</span>
          </div>

          <div>
            <h1
              className="font-display text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {fr ? "Inscription soumise !" : "Registration submitted!"}
            </h1>
            <p
              className="text-sm mt-3 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {fr
                ? `Votre compte est en attente d'approbation par le Responsable des inscriptions à `
                : `Your account is awaiting approval by the Registrar at `}
              <strong style={{ color: "var(--text-primary)" }}>
                {pendingInfo.name}
              </strong>
              {fr
                ? `. Vous recevrez un SMS une fois approuvé.`
                : `. You will receive an SMS once approved.`}
            </p>
          </div>

          {pendingInfo.staffId && (
            <div
              className="p-4 rounded-2xl space-y-1"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {fr ? "Votre identifiant de personnel" : "Your staff ID"}
              </p>
              <p
                className="font-mono text-2xl font-bold tracking-wider"
                style={{ color: "var(--accent)" }}
              >
                {pendingInfo.staffId}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {fr
                  ? "Notez cet identifiant — il sera demandé à l'hôpital."
                  : "Save this ID — it will be asked at the hospital."}
              </p>
            </div>
          )}

          <div
            className="space-y-2 text-sm text-left p-4 rounded-xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {fr ? "Prochaines étapes:" : "What happens next:"}
            </p>
            {[
              fr
                ? "Le Responsable vérifie vos informations"
                : "The Registrar verifies your information",
              fr
                ? "Vous recevez une notification d'approbation"
                : "You receive an approval notification",
              fr
                ? "Vous pouvez vous connecter avec accès complet"
                : "You can log in with full access",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs
                font-bold text-white mt-0.5 shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {i + 1}
                </div>
                <span style={{ color: "var(--text-secondary)" }}>{s}</span>
              </div>
            ))}
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            <ArrowLeft size={14} />
            {fr ? "Retour à la connexion" : "Back to sign in"}
          </Link>
        </div>
      </div>
    );

  // ── Step progress bar ─────────────────────────────────

  const stepIdx = STEPS.indexOf(step);
  const stepLabels = fr
    ? ["Établissement", "Rôle", "Compte", "Confirmation"]
    : ["Facility", "Role", "Account", "Review"];

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* ── Left panel ───────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 w-96 shrink-0"
        style={{
          background: "linear-gradient(160deg, #0c1a3a 0%, #060d1c 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #38bdf8, #6366f1)" }}
          >
            <Stethoscope size={20} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-lg leading-none">
              M.E.D.I.C.
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Healthcare Platform
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-display font-bold text-white text-2xl leading-tight">
            {fr
              ? "Rejoignez le réseau de santé national"
              : "Join the national health network"}
          </h2>
          <div className="space-y-4">
            {[
              {
                icon: "🏥",
                en: "15 hospitals connected across all regions",
                fr: "15 hôpitaux connectés dans toutes les régions",
              },
              {
                icon: "🔒",
                en: "Your data is encrypted and sovereign",
                fr: "Vos données sont chiffrées et souveraines",
              },
              {
                icon: "📱",
                en: "Works on any device — even basic phones",
                fr: "Fonctionne sur tout appareil — même les basiques",
              },
              {
                icon: "🌍",
                en: "Bilingual EN/FR — designed for Cameroon",
                fr: "Bilingue EN/FR — conçu pour le Cameroun",
              },
            ].map((item) => (
              <div key={item.en} className="flex items-start gap-3">
                <span className="text-xl shrink-0">{item.icon}</span>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {lang === "FR" ? item.fr : item.en}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            © 2026 M.E.D.I.C.
          </p>
          <button
            onClick={() => setLang(lang === "EN" ? "FR" : "EN")}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
            style={{
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Globe size={11} />
            {lang === "EN" ? "Français" : "English"}
          </button>
        </div>
      </div>

      {/* ── Right: Form area ──────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft size={15} />
            {fr ? "Connexion" : "Sign in"}
          </Link>

          {/* Step progress */}
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background:
                        i < stepIdx
                          ? "var(--success)"
                          : i === stepIdx
                            ? "var(--accent)"
                            : "var(--bg-elevated)",
                      color: i <= stepIdx ? "white" : "var(--text-muted)",
                    }}
                  >
                    {i < stepIdx ? <Check size={12} /> : i + 1}
                  </div>
                  <span
                    className="text-xs font-medium hidden md:block"
                    style={{
                      color:
                        i === stepIdx
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                    }}
                  >
                    {stepLabels[i]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="w-8 h-px"
                    style={{
                      background:
                        i < stepIdx ? "var(--success)" : "var(--border)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setLang(lang === "EN" ? "FR" : "EN")}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <Globe size={11} />
            {lang === "EN" ? "🇫🇷 FR" : "🇬🇧 EN"}
          </button>
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-6">
          <div className="w-full max-w-xl space-y-6">
            {/* Error */}
            {error && (
              <div
                className="p-3.5 rounded-xl text-sm flex items-center gap-2"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  color: "var(--danger)",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                ⚠ {error}
              </div>
            )}

            {/* ── STEP 1: Facility ──────────────────────── */}
            {step === "facility" && (
              <div className="space-y-5">
                <div>
                  <h1
                    className="font-display text-2xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {fr
                      ? "Choisissez votre établissement"
                      : "Choose your facility"}
                  </h1>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {fr
                      ? "Sélectionnez l'hôpital ou clinique où vous travaillez"
                      : "Select the hospital or clinic where you work"}
                  </p>
                </div>

                {/* Region filter */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setRegionFilter("")}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                    style={{
                      background: !regionFilter
                        ? "var(--accent)"
                        : "var(--bg-card)",
                      color: !regionFilter ? "white" : "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {fr ? "Toutes" : "All"}
                  </button>
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() =>
                        setRegionFilter(regionFilter === r ? "" : r)
                      }
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                      style={{
                        background:
                          regionFilter === r
                            ? "var(--accent)"
                            : "var(--bg-card)",
                        color:
                          regionFilter === r
                            ? "white"
                            : "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    value={facilitySearch}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={
                      fr
                        ? "Rechercher hôpital, ville..."
                        : "Search hospital, city..."
                    }
                    className={inputCls("pl-10")}
                  />
                </div>

                {/* Facility list */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filtered.length === 0 ? (
                    <div
                      className="text-center py-8 text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {fr
                        ? "Aucun établissement trouvé"
                        : "No facilities found"}
                    </div>
                  ) : (
                    filtered.map((fac) => (
                      <button
                        key={fac.facilityId}
                        onClick={() => setSelectedFac(fac)}
                        className="w-full flex items-start gap-3 p-4 rounded-xl text-left
                        transition-all"
                        style={{
                          background:
                            selectedFac?.facilityId === fac.facilityId
                              ? "var(--accent-dim)"
                              : "var(--bg-card)",
                          border:
                            selectedFac?.facilityId === fac.facilityId
                              ? "2px solid var(--accent)"
                              : "1px solid var(--border)",
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background:
                              selectedFac?.facilityId === fac.facilityId
                                ? "var(--accent)"
                                : "var(--bg-elevated)",
                          }}
                        >
                          <Building2
                            size={16}
                            style={{
                              color:
                                selectedFac?.facilityId === fac.facilityId
                                  ? "white"
                                  : "var(--text-muted)",
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-semibold text-sm truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {fac.name}
                          </div>
                          <div
                            className="text-xs mt-0.5 flex items-center gap-2"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <span>
                              {fac.city}, {fac.region}
                            </span>
                            <span
                              className="font-mono"
                              style={{ color: "var(--accent)" }}
                            >
                              {fac.facilityId}
                            </span>
                          </div>
                          {fac.phone && (
                            <div
                              className="text-xs mt-0.5"
                              style={{ color: "var(--text-muted)" }}
                            >
                              📞 {fac.phone}
                            </div>
                          )}
                        </div>
                        {selectedFac?.facilityId === fac.facilityId && (
                          <Check
                            size={16}
                            style={{ color: "var(--accent)" }}
                            className="shrink-0 mt-1"
                          />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: Role ──────────────────────────── */}
            {step === "role" && (
              <div className="space-y-5">
                <div>
                  <h1
                    className="font-display text-2xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {fr ? "Quel est votre rôle?" : "What is your role?"}
                  </h1>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {fr
                      ? "Choisissez le rôle qui correspond le mieux à votre fonction"
                      : "Choose the role that best matches your position at the facility"}
                  </p>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setRole(role.value)}
                      className="w-full flex items-start gap-3 p-4 rounded-xl text-left
                        transition-all"
                      style={{
                        background:
                          selectedRole === role.value
                            ? "var(--accent-dim)"
                            : "var(--bg-card)",
                        border:
                          selectedRole === role.value
                            ? "2px solid var(--accent)"
                            : "1px solid var(--border)",
                      }}
                    >
                      <span className="text-2xl shrink-0 mt-0.5">
                        {role.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-semibold text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {role.label}
                        </div>
                        <div
                          className="text-xs mt-0.5 leading-relaxed"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {fr ? role.descFR : role.desc}
                        </div>
                      </div>
                      {selectedRole === role.value && (
                        <Check
                          size={16}
                          style={{ color: "var(--accent)" }}
                          className="shrink-0 mt-1"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 3: Account ───────────────────────── */}
            {step === "account" && (
              <div className="space-y-5">
                <div>
                  <h1
                    className="font-display text-2xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {fr ? "Créez votre compte" : "Create your account"}
                  </h1>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {fr
                      ? "Ces informations seront vérifiées par le Responsable"
                      : "These details will be verified by the Registrar"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        {fr ? "Nom complet *" : "Full name *"}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={setF("fullName")}
                      className={inputCls()}
                      required
                      placeholder={fr ? "Dr. Jean Mbarga" : "Dr. John Smith"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {fr ? "Nom d'utilisateur *" : "Username *"}
                      </label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={setF("username")}
                        className={inputCls()}
                        required
                        minLength={3}
                        placeholder="jmbarga"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span className="flex items-center gap-1">
                          <Mail size={11} /> Email *
                        </span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={setF("email")}
                        className={inputCls()}
                        required
                        placeholder="j.mbarga@hopital.cm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span className="flex items-center gap-1">
                          <Lock size={11} />
                          {fr ? "Mot de passe *" : "Password *"}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPw ? "text" : "password"}
                          value={form.password}
                          onChange={setF("password")}
                          className={inputCls("pr-10")}
                          required
                          minLength={8}
                          placeholder="Min. 8 chars"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {fr ? "Confirmer *" : "Confirm *"}
                      </label>
                      <div className="relative">
                        <input
                          type={showCPw ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={setF("confirmPassword")}
                          className={inputCls(
                            `pr-10 ${
                              form.confirmPassword &&
                              form.password !== form.confirmPassword
                                ? "border-red-400 ring-1 ring-red-400/20"
                                : ""
                            }`,
                          )}
                          required
                          placeholder="Repeat"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {showCPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {form.confirmPassword &&
                        form.password !== form.confirmPassword && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--danger)" }}
                          >
                            {fr
                              ? "Les mots de passe ne correspondent pas"
                              : "Passwords do not match"}
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Password strength */}
                  {form.password && (
                    <div className="space-y-1">
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--border)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (form.password.length / 12) * 100)}%`,
                            background:
                              form.password.length >= 12
                                ? "var(--success)"
                                : form.password.length >= 8
                                  ? "var(--warning)"
                                  : "var(--danger)",
                          }}
                        />
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {form.password.length >= 12
                          ? fr
                            ? "🟢 Fort"
                            : "🟢 Strong"
                          : form.password.length >= 8
                            ? fr
                              ? "🟡 Moyen"
                              : "🟡 Medium"
                            : fr
                              ? "🔴 Faible"
                              : "🔴 Weak"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 4: Confirm ───────────────────────── */}
            {step === "confirm" && selectedFac && (
              <div className="space-y-5">
                <div>
                  <h1
                    className="font-display text-2xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {fr
                      ? "Vérifiez vos informations"
                      : "Review your information"}
                  </h1>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {fr
                      ? "Confirmez avant de soumettre votre inscription"
                      : "Confirm before submitting your registration"}
                  </p>
                </div>

                {/* Summary card */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <div
                    className="px-4 py-3"
                    style={{
                      background: "var(--bg-elevated)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {fr ? "Récapitulatif" : "Summary"}
                    </p>
                  </div>
                  <div
                    className="divide-y"
                    style={{ background: "var(--bg-card)" }}
                  >
                    {[
                      {
                        label: fr ? "Établissement" : "Facility",
                        value: selectedFac.name,
                      },
                      {
                        label: fr ? "Région" : "Region",
                        value: `${selectedFac.city}, ${selectedFac.region}`,
                      },
                      {
                        label: fr ? "ID Établissement" : "Facility ID",
                        value: selectedFac.facilityId,
                        mono: true,
                      },
                      {
                        label: fr ? "Rôle demandé" : "Requested role",
                        value:
                          ROLES.find((r) => r.value === selectedRole)?.label ??
                          selectedRole,
                      },
                      {
                        label: fr ? "Nom complet" : "Full name",
                        value: form.fullName,
                      },
                      {
                        label: fr ? "Nom d'utilisateur" : "Username",
                        value: form.username,
                        mono: true,
                      },
                      { label: "Email", value: form.email },
                    ].map(({ label, value, mono }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {label}
                        </span>
                        <span
                          className={`text-sm font-medium ${mono ? "font-mono" : ""}`}
                          style={{ color: "var(--text-primary)" }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info note */}
                <div
                  className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
                  style={{
                    background: "rgba(56,189,248,0.06)",
                    border: "1px solid rgba(56,189,248,0.15)",
                  }}
                >
                  <Info
                    size={15}
                    style={{
                      color: "var(--accent)",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  />
                  <p style={{ color: "var(--text-secondary)" }}>
                    {fr
                      ? "Après inscription, votre compte sera en attente. Un identifiant de personnel vous sera attribué automatiquement."
                      : "After registration, your account will be pending. A staff ID will be automatically assigned to your account."}
                  </p>
                </div>
              </div>
            )}

            {/* ── Navigation buttons ───────────────────── */}
            <div className="flex items-center gap-3">
              {stepIdx > 0 && (
                <button
                  onClick={back}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                    font-medium transition-all"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <ArrowLeft size={15} />
                  {fr ? "Retour" : "Back"}
                </button>
              )}

              {step !== "confirm" ? (
                <button
                  onClick={advance}
                  disabled={!canAdvance()}
                  className="flex-1 flex items-center justify-center gap-2
                    py-2.5 rounded-xl text-sm font-semibold text-white transition-all
                    disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: canAdvance()
                      ? "linear-gradient(135deg, var(--accent), #6366f1)"
                      : "var(--bg-elevated)",
                    boxShadow: canAdvance()
                      ? "0 4px 14px rgba(56,189,248,0.25)"
                      : "none",
                    color: canAdvance() ? "white" : "var(--text-muted)",
                  }}
                >
                  {fr ? "Continuer" : "Continue"}
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2
                    py-2.5 rounded-xl text-sm font-semibold text-white transition-all
                    disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent), #6366f1)",
                    boxShadow: "0 4px 14px rgba(56,189,248,0.25)",
                  }}
                >
                  {loading
                    ? fr
                      ? "Inscription..."
                      : "Registering..."
                    : fr
                      ? "S'inscrire"
                      : "Create account"}
                </button>
              )}
            </div>

            <p
              className="text-center text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {fr ? "Déjà inscrit? " : "Already have an account? "}
              <Link
                to="/login"
                className="font-semibold"
                style={{ color: "var(--accent)" }}
              >
                {fr ? "Se connecter" : "Sign in"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
