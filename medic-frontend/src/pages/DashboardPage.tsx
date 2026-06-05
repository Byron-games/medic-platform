import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  Clock,
  FileText,
  Pill,
  UserCheck,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarCircle from "../components/AvatarCircle";
import { useRole } from "../hooks/useRole";
import { useLang } from "../i18n/LanguageContext";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

interface DashboardStats {
  casesLast7Days?: number;
  activeAlertCount?: number;
  topDiseases?: { diseaseName: string; icd10Code: string; total: number }[];
}

interface RecentActivity {
  id: string;
  type: "appointment" | "record" | "prescription" | "alert";
  label: string;
  time: string;
  status?: string;
  color: string;
}

const ROLE_META: Record<
  string,
  { label: string; color: string; gradient: string }
> = {
  ADMIN: {
    label: "System Administrator",
    color: "#f87171",
    gradient: "from-red-500 to-orange-500",
  },
  DOCTOR: {
    label: "Doctor",
    color: "#38bdf8",
    gradient: "from-sky-500 to-blue-500",
  },
  NURSE: {
    label: "Nurse",
    color: "#34d399",
    gradient: "from-emerald-500 to-teal-500",
  },
  MIDWIFE: {
    label: "Midwife",
    color: "#a78bfa",
    gradient: "from-violet-500 to-purple-500",
  },
  LAB_TECHNICIAN: {
    label: "Lab Technician",
    color: "#fbbf24",
    gradient: "from-amber-500 to-yellow-500",
  },
  RADIOLOGIST: {
    label: "Radiologist",
    color: "#fb923c",
    gradient: "from-orange-500 to-amber-500",
  },
  PHARMACIST: {
    label: "Pharmacist",
    color: "#4ade80",
    gradient: "from-green-500 to-emerald-500",
  },
  RECEPTIONIST: {
    label: "Receptionist",
    color: "#60a5fa",
    gradient: "from-blue-400 to-sky-500",
  },
  ANALYST: {
    label: "Health Analyst",
    color: "#c084fc",
    gradient: "from-purple-500 to-pink-500",
  },
  FACILITY_ADMIN: {
    label: "Facility Admin",
    color: "#f472b6",
    gradient: "from-pink-500 to-rose-500",
  },
  REGISTRAR: {
    label: "Registrar",
    color: "#facc15",
    gradient: "from-yellow-400 to-amber-500",
  },
  PENDING: {
    label: "Pending Approval",
    color: "#94a3b8",
    gradient: "from-slate-400 to-slate-500",
  },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { lang } = useLang();
  const fr = lang === "FR";
  const {
    role,
    canRegisterPatient,
    canBookAppointment,
    canStartSession,
    canPrescribe,
    canDispense,
    canReportCase,
    canApproveUsers,
    canViewRecords,
    isAdmin,
    isPending,
  } = useRole();

  const [stats, setStats] = useState<DashboardStats>({});
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const meta = ROLE_META[role ?? ""] ?? ROLE_META.PENDING;

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get("/analytics/dashboard"),
        canApproveUsers
          ? api.get("/auth/users/pending")
          : Promise.resolve(null),
      ]);
      if (results[0].status === "fulfilled") {
        const d = results[0].value.data;
        setStats({
          casesLast7Days: d.casesLast7Days,
          activeAlertCount: d.activeAlertCount,
          topDiseases: d.topDiseases,
        });
      }
      if (results[1].status === "fulfilled" && results[1].value) {
        setPending(
          Array.isArray(results[1].value.data)
            ? results[1].value.data.length
            : 0,
        );
      }
      setLoading(false);
    };
    load();
  }, [canApproveUsers]);

  const hour = now.getHours();
  const greeting =
    hour < 12
      ? fr
        ? "Bonjour"
        : "Good morning"
      : hour < 17
        ? fr
          ? "Bon après-midi"
          : "Good afternoon"
        : fr
          ? "Bonsoir"
          : "Good evening";

  // Role-specific tip
  const TIPS: Partial<Record<string, string>> = {
    DOCTOR: fr
      ? "Prescrivez directement depuis la fiche patient. Les interactions médicamenteuses sont vérifiées automatiquement."
      : "Prescribe directly from the patient record. Drug interactions are checked automatically.",
    NURSE: fr
      ? "Enregistrez les constantes vitales et signes d'alerte depuis le dossier patient. Les signes de danger sont signalés automatiquement."
      : "Record vitals and danger signs from the patient record. Critical values alert the responsible doctor automatically.",
    MIDWIFE: fr
      ? "Gérez les consultations prénatales et les dossiers d'accouchement depuis la section Patients."
      : "Manage antenatal consultations and delivery records from the Patients section.",
    PHARMACIST: fr
      ? "Scannez ou saisissez le code Rx pour traiter une ordonnance rapidement. Vérifiez le stock régulièrement."
      : "Scan or type the Rx code to process a prescription quickly. Check stock levels regularly.",
    RECEPTIONIST: fr
      ? "Recherchez toujours un patient existant par ID national ou téléphone avant d'en créer un nouveau."
      : "Always search for an existing patient by National ID or phone before creating a new record.",
    ANALYST: fr
      ? "Vous voyez les données agrégées. Déclarez les cas des hôpitaux partenaires via l'onglet Déclarer."
      : "You see aggregated data only. Report cases from partner hospitals via the Report Case tab in Analytics.",
    LAB_TECHNICIAN: fr
      ? "Saisissez les résultats directement dans le dossier patient. Les valeurs critiques déclenchent une alerte au médecin."
      : "Enter results directly in the patient record. Critical values auto-alert the responsible doctor.",
    REGISTRAR: fr
      ? "Vérifiez les accréditations de chaque nouveau membre du personnel avant approbation."
      : "Verify staff credentials before approving. New registrations appear in the bell notification.",
    PENDING: fr
      ? "Votre compte est en attente de validation. Le Responsable des inscriptions de votre établissement doit l'approuver."
      : "Your account is pending approval by the Registrar at your facility.",
  };
  const tip = TIPS[role ?? ""];

  // Quick actions
  interface QA {
    label: string;
    desc: string;
    icon: React.FC<{ size: number; style?: React.CSSProperties }>;
    path: string;
    color: string;
    bg: string;
    border: string;
  }
  const actions: QA[] = [];

  if (canRegisterPatient)
    actions.push({
      label: fr ? "Enregistrer patient" : "Register patient",
      desc: fr ? "Nouveau dossier MPI" : "New MPI record",
      icon: Users,
      path: "/patients/new",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.08)",
      border: "rgba(96,165,250,0.2)",
    });
  if (canBookAppointment)
    actions.push({
      label: fr ? "Rendez-vous" : "Book appointment",
      desc: fr ? "Planifier une consultation" : "Schedule a consultation",
      icon: Calendar,
      path: "/appointments/new",
      color: "#34d399",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.2)",
    });
  if (canStartSession)
    actions.push({
      label: fr ? "Téléconsultation" : "Video consult",
      desc: fr ? "Démarrer une session" : "Start a Jitsi session",
      icon: Video,
      path: "/telemedicine/new",
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.08)",
      border: "rgba(167,139,250,0.2)",
    });
  if (canPrescribe)
    actions.push({
      label: fr ? "Ordonnance" : "Issue prescription",
      desc: fr ? "Prescrire des médicaments" : "Write a prescription",
      icon: Pill,
      path: "/pharmacy/new",
      color: "#4ade80",
      bg: "rgba(74,222,128,0.08)",
      border: "rgba(74,222,128,0.2)",
    });
  if (canDispense && !canPrescribe)
    actions.push({
      label: fr ? "Dispenser" : "Dispense Rx",
      desc: fr ? "Traiter une ordonnance" : "Process a prescription",
      icon: Pill,
      path: "/pharmacy",
      color: "#4ade80",
      bg: "rgba(74,222,128,0.08)",
      border: "rgba(74,222,128,0.2)",
    });
  if (canViewRecords && !canRegisterPatient)
    actions.push({
      label: fr ? "Dossiers médicaux" : "Medical records",
      desc: fr ? "Consulter les dossiers" : "View patient records",
      icon: FileText,
      path: "/patients",
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.2)",
    });
  if (canReportCase)
    actions.push({
      label: fr ? "Déclarer un cas" : "Report disease case",
      desc: fr ? "Données épidémiologiques" : "Epidemiological data",
      icon: BarChart3,
      path: "/analytics",
      color: "#f472b6",
      bg: "rgba(244,114,182,0.08)",
      border: "rgba(244,114,182,0.2)",
    });
  if (canApproveUsers)
    actions.push({
      label: fr ? `Inscriptions (${pending})` : `Registrations (${pending})`,
      desc: fr ? "Approuver le nouveau personnel" : "Approve new staff",
      icon: UserCheck,
      path: "/registrar",
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.2)",
    });

  if (isPending)
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-16">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: "rgba(251,191,36,0.15)",
            border: "2px solid rgba(251,191,36,0.3)",
          }}
        >
          <Clock size={36} style={{ color: "var(--warning)" }} />
        </div>
        <div>
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {fr ? "Compte en attente" : "Account pending approval"}
          </h1>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {fr
              ? `Le Responsable des inscriptions à ${user?.facilityName ?? "votre établissement"} doit approuver votre compte avant que vous puissiez accéder à la plateforme complète.`
              : `The Registrar at ${user?.facilityName ?? "your facility"} needs to approve your account before you can access the full platform.`}
          </p>
        </div>
        {user?.staffId && (
          <div
            className="p-4 rounded-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              {fr ? "Votre identifiant" : "Your staff ID"}
            </p>
            <p
              className="font-mono text-xl font-bold"
              style={{ color: "var(--accent)" }}
            >
              {user.staffId}
            </p>
          </div>
        )}
      </div>
    );

  return (
    <div className="space-y-5">
      {/* ── Hero card ─────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 lg:p-6"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5"
          style={{
            background: `radial-gradient(circle, ${meta.color}, transparent)`,
            transform: "translate(30%, -30%)",
          }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <AvatarCircle
              size={52}
              radius={14}
              onClick={() => navigate("/profile")}
            />
            <div>
              <div
                className="text-xs font-medium mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {now.toLocaleDateString(fr ? "fr-FR" : "en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                ·{" "}
                {now.toLocaleTimeString(fr ? "fr-FR" : "en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <h1
                className="font-display text-xl lg:text-2xl font-bold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {greeting}, {user?.fullName?.split(" ")[0]} 👋
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
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
                    className="text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--accent-dim)",
                      color: "var(--accent)",
                      border: "1px solid rgba(56,189,248,0.2)",
                    }}
                  >
                    {user.staffId}
                  </span>
                )}
                {user?.facilityName && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    · {user.facilityName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: mini stats */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {stats.casesLast7Days != null && (
              <div
                className="text-center px-4 py-2 rounded-xl"
                style={{
                  background: "rgba(56,189,248,0.08)",
                  border: "1px solid rgba(56,189,248,0.15)",
                }}
              >
                <div
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: "var(--accent)" }}
                >
                  {stats.casesLast7Days}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {fr ? "cas 7j" : "7d cases"}
                </div>
              </div>
            )}
            {(stats.activeAlertCount ?? 0) > 0 && (
              <div
                className="text-center px-4 py-2 rounded-xl"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                <div
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: "#f87171" }}
                >
                  {stats.activeAlertCount}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {fr ? "alertes" : "alerts"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role tip */}
        {tip && (
          <div
            className="mt-4 flex items-start gap-2.5 p-3 rounded-xl text-sm"
            style={{
              background: "rgba(56,189,248,0.05)",
              border: "1px solid rgba(56,189,248,0.1)",
            }}
          >
            <span className="text-base shrink-0">💡</span>
            <span style={{ color: "var(--text-secondary)" }}>{tip}</span>
          </div>
        )}
      </div>

      {/* ── Outbreak alert banner ─────────────────────── */}
      {(stats.activeAlertCount ?? 0) > 0 && (
        <button
          onClick={() => navigate("/analytics")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-left
            transition-all hover:scale-[1.005]"
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
          }}
        >
          <div className="relative w-9 h-9 shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(248,113,113,0.2)" }}
            >
              <AlertTriangle size={18} style={{ color: "#f87171" }} />
            </div>
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500
              animate-pulse"
            />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: "#f87171" }}>
              {stats.activeAlertCount}{" "}
              {fr
                ? "alerte(s) d'épidémie active(s)"
                : "active outbreak alert(s)"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {fr
                ? "Voir le tableau de surveillance →"
                : "View surveillance dashboard →"}
            </p>
          </div>
          <ArrowRight size={16} style={{ color: "#f87171" }} />
        </button>
      )}

      {/* ── Quick actions ─────────────────────────────── */}
      {actions.length > 0 && (
        <div>
          <h2
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            {fr ? "Actions rapides" : "Quick actions"}
          </h2>
          <div
            className={`grid gap-3 ${
              actions.length === 1
                ? "grid-cols-1 max-w-sm"
                : actions.length === 2
                  ? "grid-cols-2"
                  : actions.length <= 4
                    ? "grid-cols-2 lg:grid-cols-2"
                    : "grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {actions.map((a) => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="group flex items-center gap-3.5 p-4 rounded-2xl text-left
                  transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${a.border}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: a.bg, border: `1px solid ${a.border}` }}
                >
                  <a.icon size={18} style={{ color: a.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold text-sm leading-none"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {a.label}
                  </div>
                  <div
                    className="text-xs mt-0.5 truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {a.desc}
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="shrink-0 transition-transform
                  group-hover:translate-x-1"
                  style={{ color: a.color, opacity: 0.6 }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Top diseases (analytics preview) ─────────── */}
      {(stats.topDiseases?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {fr
                ? "Surveillance — 30 derniers jours"
                : "Surveillance — last 30 days"}
            </h2>
            <button
              onClick={() => navigate("/analytics")}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "var(--accent)" }}
            >
              {fr ? "Tout voir" : "View all"}
              <ArrowRight size={11} />
            </button>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            {stats.topDiseases!.slice(0, 5).map((d, i) => {
              const max = stats.topDiseases![0].total;
              const pct = max > 0 ? (d.total / max) * 100 : 0;
              const colors = [
                "#38bdf8",
                "#6366f1",
                "#34d399",
                "#f59e0b",
                "#f87171",
              ];
              return (
                <div
                  key={d.icd10Code}
                  className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span
                    className="font-mono text-xs font-semibold w-10 text-right shrink-0"
                    style={{ color: colors[i] }}
                  >
                    {d.icd10Code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {d.diseaseName}
                      </span>
                      <span
                        className="text-sm font-bold ml-2 shrink-0"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {d.total.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full"
                      style={{ background: "var(--bg-elevated)" }}
                    >
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: colors[i] }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pending registrations (for registrar/admin) */}
      {canApproveUsers && pending > 0 && (
        <button
          onClick={() => navigate("/registrar")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-left
            transition-all hover:scale-[1.005]"
          style={{
            background: "rgba(251,191,36,0.06)",
            border: "1px solid rgba(251,191,36,0.2)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(251,191,36,0.15)" }}
          >
            <Bell size={16} style={{ color: "#fbbf24" }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: "#fbbf24" }}>
              {pending}{" "}
              {fr ? "inscription(s) en attente" : "pending registration(s)"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {fr
                ? "Personnel en attente de votre approbation"
                : "Staff awaiting your approval"}
            </p>
          </div>
          <ArrowRight size={16} style={{ color: "#fbbf24" }} />
        </button>
      )}
    </div>
  );
}
