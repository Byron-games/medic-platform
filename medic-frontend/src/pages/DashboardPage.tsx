import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  FileText,
  Pill,
  TrendingUp,
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

interface Stats {
  casesLast7Days?: number;
  activeAlertCount?: number;
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.FC<{ size: number; className?: string }>;
  color: string;
  bg: string;
  onClick?: () => void;
}

interface QuickAction {
  label: string;
  desc: string;
  icon: React.FC<{ size: number; className?: string }>;
  path: string;
  color: string;
  bg: string;
  border: string;
}

export default function DashboardPage() {
  const { user, avatarUrl, setAvatar } = useAuthStore();
  const navigate = useNavigate();
  const { lang } = useLang();
  const [stats, setStats] = useState<Stats>({});
  const {
    role,
    isAdmin,
    isDoctor,
    isNurse,
    isMidwife,
    isPharmacist,
    isReceptionist,
    isAnalyst,
    isFacilityAdmin,
    isRegistrar,
    isLabTech,
    isRadiologist,
    canRegisterPatient,
    canBookAppointment,
    canStartSession,
    canPrescribe,
    canDispense,
    canReportCase,
    canApproveUsers,
  } = useRole();

  // Load avatar from localStorage (if not already in store)
  useEffect(() => {
    if (!avatarUrl && user?.username) {
      const stored = localStorage.getItem(`medic-avatar-${user.username}`);
      if (stored) setAvatar(stored);
    }
  }, [user?.username, avatarUrl, setAvatar]);

  useEffect(() => {
    api
      .get("/analytics/dashboard")
      .then((r) =>
        setStats({
          casesLast7Days: r.data.casesLast7Days,
          activeAlertCount: r.data.activeAlertCount,
        }),
      )
      .catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? lang === "FR"
        ? "Bonjour"
        : "Good morning"
      : hour < 17
        ? lang === "FR"
          ? "Bon après-midi"
          : "Good afternoon"
        : lang === "FR"
          ? "Bonsoir"
          : "Good evening";

  // Role-specific quick stats
  const quickStats: QuickStat[] = [];

  if (isAdmin || isFacilityAdmin || isRegistrar) {
    quickStats.push({
      label: lang === "FR" ? "En attente" : "Pending approvals",
      value: "—",
      icon: UserCheck,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.08)",
      onClick: () => navigate("/registrar"),
    });
  }
  if (stats.activeAlertCount != null && (isAdmin || isAnalyst)) {
    quickStats.push({
      label: lang === "FR" ? "Alertes actives" : "Active alerts",
      value: stats.activeAlertCount,
      icon: AlertTriangle,
      color: stats.activeAlertCount > 0 ? "#f87171" : "#34d399",
      bg:
        stats.activeAlertCount > 0
          ? "rgba(248,113,113,0.08)"
          : "rgba(52,211,153,0.08)",
      onClick: () => navigate("/analytics"),
    });
  }
  if (stats.casesLast7Days != null) {
    quickStats.push({
      label: lang === "FR" ? "Cas (7 jours)" : "Cases (7 days)",
      value: stats.casesLast7Days,
      icon: TrendingUp,
      color: "#38bdf8",
      bg: "rgba(56,189,248,0.08)",
      onClick: () => navigate("/analytics"),
    });
  }
  quickStats.push({
    label: lang === "FR" ? "Votre rôle" : "Your role",
    value: role ?? "—",
    icon: Activity,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
  });

  // Role-specific quick actions
  const actions: QuickAction[] = [];

  if (canRegisterPatient)
    actions.push({
      label: lang === "FR" ? "Enregistrer patient" : "Register patient",
      desc: lang === "FR" ? "Nouveau dossier patient" : "New patient record",
      icon: Users,
      path: "/patients/new",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.08)",
      border: "rgba(96,165,250,0.2)",
    });

  if (canBookAppointment)
    actions.push({
      label: lang === "FR" ? "Rendez-vous" : "Book appointment",
      desc:
        lang === "FR"
          ? "Planifier une consultation"
          : "Schedule a consultation",
      icon: Calendar,
      path: "/appointments/new",
      color: "#34d399",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.2)",
    });

  if (canStartSession)
    actions.push({
      label: lang === "FR" ? "Téléconsultation" : "Video consultation",
      desc:
        lang === "FR" ? "Démarrer une session Jitsi" : "Start a Jitsi session",
      icon: Video,
      path: "/telemedicine/new",
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.08)",
      border: "rgba(167,139,250,0.2)",
    });

  if (canPrescribe)
    actions.push({
      label: lang === "FR" ? "Ordonnance" : "Issue prescription",
      desc:
        lang === "FR"
          ? "Prescrire des médicaments"
          : "Write a new prescription",
      icon: Pill,
      path: "/pharmacy/new",
      color: "#4ade80",
      bg: "rgba(74,222,128,0.08)",
      border: "rgba(74,222,128,0.2)",
    });

  if (canDispense && !canPrescribe)
    actions.push({
      label: lang === "FR" ? "Dispenser" : "Dispense medication",
      desc: lang === "FR" ? "Traiter les ordonnances" : "Process prescriptions",
      icon: Pill,
      path: "/pharmacy",
      color: "#4ade80",
      bg: "rgba(74,222,128,0.08)",
      border: "rgba(74,222,128,0.2)",
    });

  if (canReportCase)
    actions.push({
      label: lang === "FR" ? "Déclarer un cas" : "Report disease case",
      desc:
        lang === "FR"
          ? "Saisir des données épidémio."
          : "Input epidemiological data",
      icon: BarChart3,
      path: "/analytics",
      color: "#f472b6",
      bg: "rgba(244,114,182,0.08)",
      border: "rgba(244,114,182,0.2)",
    });

  if (canApproveUsers)
    actions.push({
      label: lang === "FR" ? "Approbations" : "Review registrations",
      desc:
        lang === "FR"
          ? "Gérer les inscriptions en attente"
          : "Approve or reject new staff",
      icon: UserCheck,
      path: "/registrar",
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.2)",
    });

  if (isLabTech || isRadiologist)
    actions.push({
      label: lang === "FR" ? "Résultats labo" : "Lab results",
      desc:
        lang === "FR"
          ? "Saisir les résultats d'analyses"
          : "Enter test results",
      icon: FileText,
      path: "/patients",
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.2)",
    });

  const roleTips: Partial<Record<string, string>> = {
    DOCTOR:
      lang === "FR"
        ? "Vous pouvez prescrire des médicaments et démarrer des téléconsultations depuis la fiche patient."
        : "You can prescribe medications and start video consultations directly from a patient's record.",
    NURSE:
      lang === "FR"
        ? "Enregistrez les constantes vitales et les soins administrés depuis le dossier patient."
        : "Record vitals and administered treatments from the patient record. Flag danger signs immediately.",
    MIDWIFE:
      lang === "FR"
        ? "Gérez les consultations prénatales et les dossiers d'accouchement."
        : "Manage antenatal care records and delivery outcomes from the patient record.",
    PHARMACIST:
      lang === "FR"
        ? "Vérifiez les ordonnances actives et marquez les médicaments comme dispensés."
        : "Check active prescriptions and mark medications as dispensed. Update stock levels regularly.",
    RECEPTIONIST:
      lang === "FR"
        ? "Recherchez d'abord un patient existant par ID national ou téléphone avant d'en créer un nouveau."
        : "Always search for existing patients by National ID or phone before creating a new record to avoid duplicates.",
    ANALYST:
      lang === "FR"
        ? "Vous avez accès aux données agrégées. Les données individuelles des patients ne sont pas visibles."
        : "You have access to aggregated surveillance data. Individual patient PII is not visible to your role.",
    LAB_TECHNICIAN:
      lang === "FR"
        ? "Saisissez les résultats directement dans le dossier patient. Les valeurs critiques déclenchent une alerte."
        : "Enter results directly in the patient record. Critical values will auto-alert the responsible doctor.",
    REGISTRAR:
      lang === "FR"
        ? "Vérifiez l'identité de chaque nouveau membre du personnel avant approbation."
        : "Verify staff credentials before approving. Check the notification bell for pending registrations.",
    PENDING:
      lang === "FR"
        ? "Votre compte est en cours de validation par le Responsable de votre établissement."
        : "Your account is pending approval by your facility's Registrar. You'll be notified when approved.",
  };
  const tip = roleTips[role ?? ""];

  return (
    <div className="space-y-5">
      {/* Hero greeting with avatar */}
      <div
        className="rounded-2xl p-5 lg:p-6 flex items-start justify-between gap-4"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div>
          <div
            className="text-sm font-medium mb-1"
            style={{ color: "var(--text-muted)" }}
          >
            {new Date().toLocaleDateString(lang === "FR" ? "fr-FR" : "en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {greeting}, {user?.fullName?.split(" ")[0] ?? "there"} 👋
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-sm px-2.5 py-0.5 rounded-full font-medium"
              style={{
                background: `rgba(${role === "ADMIN" ? "248,113,113" : "56,189,248"},0.12)`,
                color: role === "ADMIN" ? "#f87171" : "var(--accent)",
                border: `1px solid ${role === "ADMIN" ? "rgba(248,113,113,0.2)" : "rgba(56,189,248,0.2)"}`,
              }}
            >
              {user?.staffId ?? role}
            </span>
            {user?.facilityName && (
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                · {user.facilityName}
              </span>
            )}
          </div>
        </div>
        {/* Avatar circle */}
        <AvatarCircle
          size={56}
          radius="rounded-2xl"
          onClick={() => navigate("/profile")}
        />
      </div>

      {/* Role tip */}
      {tip && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(56,189,248,0.06)",
            border: "1px solid rgba(56,189,248,0.15)",
          }}
        >
          <span className="text-base shrink-0">💡</span>
          <span style={{ color: "var(--text-secondary)" }}>{tip}</span>
        </div>
      )}

      {/* Quick stats */}
      {quickStats.length > 0 && (
        <div
          className={`grid gap-4 ${quickStats.length === 1 ? "grid-cols-1 max-w-xs" : quickStats.length === 2 ? "grid-cols-2" : quickStats.length === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`}
        >
          {quickStats.map((s) => (
            <button
              key={s.label}
              onClick={s.onClick}
              disabled={!s.onClick}
              className="text-left p-4 rounded-xl transition-all"
              style={{
                background: s.bg,
                border: `1px solid ${s.color}22`,
                cursor: s.onClick ? "pointer" : "default",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.label}
                </span>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div
                className="font-display font-bold text-2xl"
                style={{ color: "var(--text-primary)" }}
              >
                {s.value}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick actions */}
      {actions.length > 0 && (
        <div>
          <h2
            className="font-display font-semibold text-sm mb-3 uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            {lang === "FR" ? "Actions rapides" : "Quick actions"}
          </h2>
          <div
            className={`grid gap-3 ${actions.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : actions.length <= 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
          >
            {actions.map((a) => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="group flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${a.border}`,
                  boxShadow: "var(--shadow-sm)",
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
                    className="font-semibold text-sm"
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
                  size={15}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-150"
                  style={{ color: a.color }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pending state */}
      {role === "PENDING" && (
        <div
          className="text-center py-12 rounded-2xl"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-4xl mb-4">⏳</div>
          <h2
            className="font-display text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {lang === "FR"
              ? "Compte en cours de validation"
              : "Account pending approval"}
          </h2>
          <p
            className="text-sm max-w-sm mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            {lang === "FR"
              ? `Le Responsable des inscriptions de ${user?.facilityName ?? "votre établissement"} doit approuver votre compte. Vous recevrez un accès complet une fois validé.`
              : `The Registrar at ${user?.facilityName ?? "your facility"} needs to approve your account. You'll receive full access once verified.`}
          </p>
          {user?.staffId && (
            <div
              className="mt-4 inline-block px-4 py-2 rounded-xl text-sm font-mono"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
              }}
            >
              {lang === "FR" ? "ID: " : "Staff ID: "}
              {user.staffId}
            </div>
          )}
        </div>
      )}

      {/* Outbreak alerts strip */}
      {(stats.activeAlertCount ?? 0) > 0 && (
        <button
          onClick={() => navigate("/analytics")}
          className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.005]"
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
          }}
        >
          <AlertTriangle
            size={18}
            style={{ color: "#f87171" }}
            className="shrink-0"
          />
          <div className="flex-1">
            <span
              className="font-semibold text-sm"
              style={{ color: "#f87171" }}
            >
              {stats.activeAlertCount} active outbreak alert
              {stats.activeAlertCount !== 1 ? "s" : ""}
            </span>
            <span
              className="text-sm ml-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {lang === "FR"
                ? "— Voir le tableau de surveillance"
                : "— View surveillance dashboard"}
            </span>
          </div>
          <ArrowRight size={15} style={{ color: "#f87171" }} />
        </button>
      )}
    </div>
  );
}
