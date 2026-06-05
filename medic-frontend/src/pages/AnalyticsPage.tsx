import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Calendar,
  CheckCircle,
  MapPin,
  PlusCircle,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRole } from "../hooks/useRole";
import { useLang } from "../i18n/LanguageContext";
import { api } from "../lib/api";

// ── Types ──────────────────────────────────────────────────
interface DiseaseCount {
  diseaseName: string;
  icd10Code: string;
  total: number;
}
interface RegionCount {
  region: string;
  total: number;
}
interface AlertSummary {
  id: number;
  icd10Code: string;
  diseaseName: string;
  region: string;
  caseCount: number;
  threshold: number;
  alertLevel: string;
  active: boolean;
  triggeredAt: string;
}
interface Case {
  id: number;
  reportDate: string;
  region: string;
  facilityId: string;
  icd10Code: string;
  diseaseName: string;
  caseCount: number;
  severity: string | null;
}
interface DashboardSummary {
  topDiseases: DiseaseCount[];
  casesByRegion: RegionCount[];
  activeAlerts: AlertSummary[];
  casesLast7Days: number;
  activeAlertCount: number;
}

// ── Constants ──────────────────────────────────────────────
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
const PALETTE = [
  "#38bdf8",
  "#6366f1",
  "#34d399",
  "#f59e0b",
  "#f87171",
  "#a78bfa",
  "#4ade80",
  "#fb923c",
  "#60a5fa",
  "#c084fc",
];
const ALERT_CFG: Record<string, { cls: string; dot: string }> = {
  WARNING: {
    cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "#fbbf24",
  },
  CRITICAL: {
    cls: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "#f87171",
  },
  EPIDEMIC: {
    cls: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    dot: "#a78bfa",
  },
};
const SEVERITIES = ["MILD", "MODERATE", "SEVERE", "CRITICAL"];
const COMMON_ICD10 = [
  { code: "B54", name: "Malaria, unspecified" },
  { code: "A00", name: "Cholera" },
  { code: "J22", name: "Acute lower respiratory infection" },
  { code: "A09", name: "Diarrhoeal disease" },
  { code: "B05", name: "Measles" },
  { code: "A33", name: "Tetanus neonatorum" },
  { code: "A90", name: "Dengue fever" },
  { code: "K29", name: "Gastritis" },
  { code: "I10", name: "Essential hypertension" },
  { code: "E11", name: "Type 2 diabetes mellitus" },
];

// ── Custom tooltip ─────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {label && (
        <p
          className="font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? "var(--accent)" }}>
          {p.name}: <strong>{p.value.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Alert level badge ──────────────────────────────────────
function AlertBadge({ level }: { level: string }) {
  const cfg = ALERT_CFG[level] ?? ALERT_CFG.WARNING;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5
      rounded-full text-xs font-semibold border ${cfg.cls}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.dot }}
      />
      {level}
    </span>
  );
}

// ── Empty chart placeholder ────────────────────────────────
function EmptyChart({
  message,
  onReport,
}: {
  message: string;
  onReport?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full py-8"
      style={{ color: "var(--text-muted)" }}
    >
      <BarChart2 size={28} className="mb-2 opacity-40" />
      <p className="text-sm">{message}</p>
      {onReport && (
        <button
          onClick={onReport}
          className="mt-2 text-xs font-medium"
          style={{ color: "var(--accent)" }}
        >
          + Report first case
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function AnalyticsPage() {
  const { lang } = useLang();
  const fr = lang === "FR";
  const { canViewAnalytics, canReportCase, canResolveAlert, isAdmin } =
    useRole();

  // Data state
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLast] = useState<Date | null>(null);

  // UI state
  const [tab, setTab] = useState<
    "overview" | "trends" | "alerts" | "cases" | "report"
  >("overview");
  const [resolving, setResolve] = useState<number | null>(null);
  const [submitting, setSubmit] = useState(false);
  const [formError, setFErr] = useState("");

  // Filters
  const [dateFrom, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [caseSearch, setCSearch] = useState("");
  const [regionFlt, setRFlt] = useState("");

  // Report form
  const emptyForm = () => ({
    region: "",
    facilityId: "",
    icd10Code: "",
    diseaseName: "",
    reportDate: new Date().toISOString().split("T")[0],
    caseCount: 1,
    severity: "",
  });
  const [form, setForm] = useState(emptyForm());
  const [icdSearch, setIcdSearch] = useState("");

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none
    transition-all bg-[var(--bg-primary)] border-[var(--border)]
    text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
    focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-dim)]`;

  // ── Fetch ────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sumRes, casesRes] = await Promise.allSettled([
        api.get<DashboardSummary>("/analytics/dashboard"),
        api.get<Case[]>(`/analytics/cases?from=${dateFrom}&to=${dateTo}`),
      ]);
      if (sumRes.status === "fulfilled") setSummary(sumRes.value.data);
      if (casesRes.status === "fulfilled") setCases(casesRes.value.data);
      setLast(new Date());
    } catch {
      setError(
        fr
          ? "Service analytics non disponible."
          : "Analytics service unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Report form submit ───────────────────────────────────

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.region ||
      !form.icd10Code ||
      !form.diseaseName ||
      !form.facilityId
    ) {
      setFErr(
        fr
          ? "Tous les champs obligatoires doivent être remplis."
          : "All required fields must be filled.",
      );
      return;
    }
    setSubmit(true);
    setFErr("");
    try {
      await api.post("/analytics/cases", {
        ...form,
        caseCount: Number(form.caseCount),
        severity: form.severity || null,
      });
      setForm(emptyForm());
      setIcdSearch("");
      setTab("overview");
      fetchAll();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to report case.";
      setFErr(msg);
    } finally {
      setSubmit(false);
    }
  };

  const resolveAlert = async (id: number) => {
    setResolve(id);
    try {
      await api.patch(`/analytics/alerts/${id}/resolve`);
      fetchAll();
    } finally {
      setResolve(null);
    }
  };

  // ── Derived data ─────────────────────────────────────────

  const filteredCases = cases.filter(
    (c) =>
      (!regionFlt || c.region === regionFlt) &&
      (!caseSearch ||
        c.diseaseName.toLowerCase().includes(caseSearch.toLowerCase()) ||
        c.icd10Code.toLowerCase().includes(caseSearch.toLowerCase())),
  );

  // Build trend data: group cases by date
  const trendData = (() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => {
      const d = c.reportDate.substring(0, 10);
      map[d] = (map[d] ?? 0) + c.caseCount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date: date.substring(5), total }));
  })();

  // Region breakdown for cases
  const regionBreakdown = (() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => {
      map[c.region] = (map[c.region] ?? 0) + c.caseCount;
    });
    return Object.entries(map)
      .map(([region, total]) => ({ region, total }))
      .sort((a, b) => b.total - a.total);
  })();

  // Disease breakdown
  const diseaseBreakdown = (() => {
    const map: Record<string, { name: string; total: number }> = {};
    cases.forEach((c) => {
      if (!map[c.icd10Code])
        map[c.icd10Code] = { name: c.diseaseName, total: 0 };
      map[c.icd10Code].total += c.caseCount;
    });
    return Object.entries(map)
      .map(([code, { name, total }]) => ({ code, name, total }))
      .sort((a, b) => b.total - a.total);
  })();

  const totalCases = cases.reduce((s, c) => s + c.caseCount, 0);

  // ── Access guard ─────────────────────────────────────────

  if (!canViewAnalytics)
    return (
      <div
        className="flex items-center justify-center h-64"
        style={{ color: "var(--text-muted)" }}
      >
        <p className="text-sm">{fr ? "Accès refusé." : "Access denied."}</p>
      </div>
    );

  // ── Error state ───────────────────────────────────────────

  if (error && !loading)
    return (
      <div className="space-y-4">
        <h1
          className="font-display text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {fr ? "Surveillance des maladies" : "Disease Surveillance"}
        </h1>
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{
            background: "var(--bg-card)",
            border: "1px dashed var(--border)",
          }}
        >
          <AlertCircle
            size={32}
            className="mb-3 opacity-40"
            style={{ color: "var(--text-muted)" }}
          />
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {fr
              ? "Service analytics non disponible"
              : "Analytics service not running"}
          </p>
          <code
            className="mt-2 px-3 py-1.5 rounded-lg text-xs font-mono"
            style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
          >
            Start-Service.ps1 analytics-service
          </code>
          <button
            onClick={fetchAll}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            <RefreshCw size={14} /> {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      </div>
    );

  // ── Tabs config ───────────────────────────────────────────

  const TABS = [
    {
      id: "overview" as const,
      label: fr ? "Vue d'ensemble" : "Overview",
      icon: Activity,
    },
    {
      id: "trends" as const,
      label: fr ? "Tendances" : "Trends",
      icon: TrendingUp,
    },
    {
      id: "alerts" as const,
      label: fr ? "Alertes" : "Alerts",
      icon: AlertTriangle,
      badge: summary?.activeAlertCount ?? 0,
    },
    {
      id: "cases" as const,
      label: fr ? "Cas rapportés" : "Reported Cases",
      icon: BarChart2,
    },
    ...(canReportCase
      ? [
          {
            id: "report" as const,
            label: fr ? "Déclarer" : "Report Case",
            icon: PlusCircle,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="font-display text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {fr ? "Surveillance Épidémiologique" : "Disease Surveillance"}
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {fr
              ? "Tableau de bord de santé publique national"
              : "National public health dashboard"}
            {lastRefresh && (
              <span className="ml-2 opacity-60">
                · {fr ? "Mis à jour" : "Updated"}{" "}
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range */}
          <div
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <Calendar size={12} style={{ color: "var(--text-muted)" }} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-transparent outline-none text-xs"
              style={{ color: "var(--text-primary)" }}
            />
            <span style={{ color: "var(--text-muted)" }}>→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setTo(e.target.value)}
              className="bg-transparent outline-none text-xs"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="p-2 rounded-xl transition-all"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: fr ? "Cas (période)" : "Cases (period)",
            value: totalCases.toLocaleString(),
            sub: `${cases.length} ${fr ? "rapports" : "reports"}`,
            icon: Activity,
            color: "#38bdf8",
            bg: "rgba(56,189,248,0.08)",
          },
          {
            label: fr ? "Alertes actives" : "Active alerts",
            value: (summary?.activeAlertCount ?? 0).toString(),
            sub:
              (summary?.activeAlertCount ?? 0) > 0
                ? fr
                  ? "⚠ Intervention requise"
                  : "⚠ Action required"
                : fr
                  ? "✓ Tout est normal"
                  : "✓ All clear",
            icon: AlertTriangle,
            color: (summary?.activeAlertCount ?? 0) > 0 ? "#f87171" : "#34d399",
            bg:
              (summary?.activeAlertCount ?? 0) > 0
                ? "rgba(248,113,113,0.08)"
                : "rgba(52,211,153,0.08)",
          },
          {
            label: fr ? "Régions touchées" : "Regions affected",
            value: regionBreakdown.length.toString(),
            sub: `${REGIONS.length} ${fr ? "régions totales" : "total regions"}`,
            icon: MapPin,
            color: "#a78bfa",
            bg: "rgba(167,139,250,0.08)",
          },
          {
            label: fr ? "Maladies distinctes" : "Distinct diseases",
            value: diseaseBreakdown.length.toString(),
            sub: fr ? "dans la période" : "in selected period",
            icon: TrendingUp,
            color: "#34d399",
            bg: "rgba(52,211,153,0.08)",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: bg, border: `1px solid ${color}22` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </span>
              <Icon size={16} style={{ color }} />
            </div>
            <div
              className="font-display font-bold text-2xl"
              style={{ color: "var(--text-primary)" }}
            >
              {loading ? "…" : value}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {loading ? "" : sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
              font-medium whitespace-nowrap transition-all relative"
            style={{
              background: tab === id ? "var(--accent)" : "transparent",
              color: tab === id ? "white" : "var(--text-secondary)",
            }}
          >
            <Icon size={14} />
            {label}
            {badge && badge > 0 && (
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center
                text-white font-bold"
                style={{ fontSize: 9, background: "var(--danger)" }}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ──────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Active outbreak alerts */}
          {(summary?.activeAlerts?.length ?? 0) > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: "1px solid rgba(248,113,113,0.25)",
              }}
            >
              <div
                className="flex items-center gap-2 px-5 py-3"
                style={{
                  borderBottom: "1px solid rgba(248,113,113,0.15)",
                  background: "rgba(248,113,113,0.05)",
                }}
              >
                <AlertTriangle size={16} style={{ color: "#f87171" }} />
                <h2
                  className="font-display font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {fr ? "Alertes d'épidémie actives" : "Active Outbreak Alerts"}
                </h2>
              </div>
              <div
                className="divide-y"
                style={{ borderColor: "var(--border)" }}
              >
                {summary!.activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertBadge level={alert.alertLevel} />
                      <div className="min-w-0">
                        <div
                          className="font-semibold text-sm truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {alert.diseaseName}
                          <span
                            className="ml-2 font-mono text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {alert.icd10Code}
                          </span>
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <MapPin size={10} className="inline mr-1" />
                          {alert.region} · {alert.caseCount}{" "}
                          {fr ? "cas" : "cases"} (seuil: {alert.threshold}) ·{" "}
                          {new Date(alert.triggeredAt).toLocaleDateString(
                            fr ? "fr-FR" : "en-GB",
                          )}
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        disabled={resolving === alert.id}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs
                          rounded-lg transition-all font-medium"
                        style={{
                          background: "rgba(52,211,153,0.1)",
                          color: "#34d399",
                          border: "1px solid rgba(52,211,153,0.2)",
                        }}
                      >
                        <CheckCircle size={12} />
                        {resolving === alert.id
                          ? "…"
                          : fr
                            ? "Résoudre"
                            : "Resolve"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top diseases */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <h2
                className="font-display font-semibold text-sm mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                {fr
                  ? "Maladies principales (période)"
                  : "Top diseases (period)"}
              </h2>
              {diseaseBreakdown.length === 0 ? (
                <EmptyChart
                  message={fr ? "Aucun cas rapporté" : "No cases reported"}
                  onReport={canReportCase ? () => setTab("report") : undefined}
                />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={diseaseBreakdown.slice(0, 8).map((d) => ({
                      name:
                        d.name.length > 22 ? d.name.slice(0, 20) + "…" : d.name,
                      cases: d.total,
                      code: d.code,
                    }))}
                    layout="vertical"
                    margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 10, fill: "var(--text-primary)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="cases"
                      fill="var(--accent)"
                      radius={[0, 5, 5, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Cases by region — pie */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <h2
                className="font-display font-semibold text-sm mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                {fr ? "Répartition par région" : "Cases by region"}
              </h2>
              {regionBreakdown.length === 0 ? (
                <EmptyChart message={fr ? "Aucune donnée" : "No data"} />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={regionBreakdown.map((r, i) => ({
                        ...r,
                        fill: PALETTE[i % PALETTE.length],
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="total"
                    >
                      {regionBreakdown.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <ChartTooltip
                            active
                            payload={[
                              {
                                name: payload[0].name as string,
                                value: payload[0].value as number,
                                color: payload[0].payload.fill,
                              },
                            ]}
                          />
                        ) : null
                      }
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {v}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Summary table */}
          {diseaseBreakdown.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h2
                  className="font-display font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {fr ? "Résumé par maladie" : "Disease summary"}
                </h2>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {totalCases.toLocaleString()}{" "}
                  {fr ? "cas totaux" : "total cases"}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {[
                        fr ? "Maladie" : "Disease",
                        "ICD-10",
                        fr ? "Cas" : "Cases",
                        fr ? "Part (%)" : "Share (%)",
                        fr ? "Tendance" : "Trend",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2.5 text-xs font-semibold
                          uppercase tracking-wide"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {diseaseBreakdown.map((d, i) => {
                      const pct =
                        totalCases > 0
                          ? ((d.total / totalCases) * 100).toFixed(1)
                          : "0";
                      const prev =
                        i > 0 ? diseaseBreakdown[i - 1].total : d.total;
                      const trend = d.total >= prev;
                      return (
                        <tr
                          key={d.code}
                          className="border-t"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <td
                            className="px-4 py-2.5 font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {d.name}
                          </td>
                          <td
                            className="px-4 py-2.5 font-mono text-xs"
                            style={{ color: "var(--warning)" }}
                          >
                            {d.code}
                          </td>
                          <td
                            className="px-4 py-2.5 font-bold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {d.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex-1 h-1.5 rounded-full"
                                style={{ background: "var(--bg-elevated)" }}
                              >
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    background: PALETTE[i % PALETTE.length],
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs w-8 text-right"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            {trend ? (
                              <TrendingUp
                                size={14}
                                style={{ color: "#f87171" }}
                              />
                            ) : (
                              <TrendingDown
                                size={14}
                                style={{ color: "#34d399" }}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Trends ────────────────────────────────── */}
      {tab === "trends" && (
        <div className="space-y-5">
          {/* Daily case trend */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="font-display font-semibold text-sm mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              {fr ? "Évolution quotidienne des cas" : "Daily case trend"}
            </h2>
            {trendData.length < 2 ? (
              <EmptyChart
                message={
                  fr
                    ? "Données insuffisantes pour afficher les tendances"
                    : "Insufficient data to show trends"
                }
                onReport={canReportCase ? () => setTab("report") : undefined}
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={trendData}
                  margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--accent)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--accent)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name={fr ? "Cas" : "Cases"}
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#areaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Region comparison bar */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="font-display font-semibold text-sm mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              {fr ? "Comparaison par région" : "Regional comparison"}
            </h2>
            {regionBreakdown.length === 0 ? (
              <EmptyChart message={fr ? "Aucune donnée" : "No data"} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={regionBreakdown.map((r, i) => ({
                    ...r,
                    fill: PALETTE[i % PALETTE.length],
                  }))}
                  margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="region"
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="total"
                    name={fr ? "Cas" : "Cases"}
                    radius={[5, 5, 0, 0]}
                    maxBarSize={36}
                  >
                    {regionBreakdown.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Alerts ────────────────────────────────── */}
      {tab === "alerts" && (
        <div className="space-y-3">
          {(summary?.activeAlerts?.length ?? 0) === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <CheckCircle
                size={32}
                className="mb-2"
                style={{ color: "var(--success)" }}
              />
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {fr ? "Aucune alerte active" : "No active alerts"}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {fr
                  ? "Le système surveille en temps réel."
                  : "The system is monitoring in real time."}
              </p>
            </div>
          ) : (
            summary!.activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl p-5"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${ALERT_CFG[alert.alertLevel]?.dot ?? "#fbbf24"}33`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertBadge level={alert.alertLevel} />
                      <span
                        className="font-mono text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {alert.icd10Code}
                      </span>
                    </div>
                    <h3
                      className="font-display font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {alert.diseaseName}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {fr ? "Région" : "Region"}
                        </p>
                        <p
                          className="font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {alert.region}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {fr ? "Cas / Seuil" : "Cases / Threshold"}
                        </p>
                        <p className="font-bold" style={{ color: "#f87171" }}>
                          {alert.caseCount} / {alert.threshold}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {fr ? "Déclenchée" : "Triggered"}
                        </p>
                        <p
                          className="font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {new Date(alert.triggeredAt).toLocaleDateString(
                            fr ? "fr-FR" : "en-GB",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      disabled={resolving === alert.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                      font-medium transition-all shrink-0"
                      style={{
                        background: "rgba(52,211,153,0.1)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.2)",
                      }}
                    >
                      <CheckCircle size={14} />
                      {resolving === alert.id
                        ? "…"
                        : fr
                          ? "Marquer résolu"
                          : "Mark resolved"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: Cases ─────────────────────────────────── */}
      {tab === "cases" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                value={caseSearch}
                onChange={(e) => setCSearch(e.target.value)}
                placeholder={
                  fr
                    ? "Rechercher maladie ou code..."
                    : "Search disease or code..."
                }
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <select
              value={regionFlt}
              onChange={(e) => setRFlt(e.target.value)}
              className="px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">
                {fr ? "Toutes les régions" : "All regions"}
              </option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filteredCases.length} {fr ? "cas affichés" : "cases shown"}
          </div>

          {filteredCases.length === 0 ? (
            <EmptyChart
              message={
                fr ? "Aucun cas dans cette période" : "No cases in this period"
              }
              onReport={canReportCase ? () => setTab("report") : undefined}
            />
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr style={{ background: "var(--bg-elevated)" }}>
                      {[
                        fr ? "Date" : "Date",
                        fr ? "Région" : "Region",
                        fr ? "Établissement" : "Facility",
                        "ICD-10",
                        fr ? "Maladie" : "Disease",
                        fr ? "Cas" : "Cases",
                        fr ? "Gravité" : "Severity",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2.5 text-xs font-semibold
                            uppercase tracking-wide whitespace-nowrap"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((c, i) => (
                      <tr
                        key={c.id}
                        className="border-t transition-colors"
                        style={{ borderColor: "var(--border)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--bg-elevated)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td
                          className="px-4 py-2.5 font-mono text-xs whitespace-nowrap"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {new Date(c.reportDate).toLocaleDateString(
                            fr ? "fr-FR" : "en-GB",
                          )}
                        </td>
                        <td
                          className="px-4 py-2.5 whitespace-nowrap"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {c.region}
                        </td>
                        <td
                          className="px-4 py-2.5 font-mono text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {c.facilityId}
                        </td>
                        <td
                          className="px-4 py-2.5 font-mono text-xs font-semibold"
                          style={{ color: "var(--warning)" }}
                        >
                          {c.icd10Code}
                        </td>
                        <td
                          className="px-4 py-2.5 font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {c.diseaseName}
                        </td>
                        <td
                          className="px-4 py-2.5 font-bold"
                          style={{
                            color:
                              c.caseCount >= 5
                                ? "#f87171"
                                : "var(--text-primary)",
                          }}
                        >
                          {c.caseCount}
                        </td>
                        <td className="px-4 py-2.5">
                          {c.severity ? (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background:
                                  c.severity === "CRITICAL" ||
                                  c.severity === "SEVERE"
                                    ? "rgba(248,113,113,0.1)"
                                    : "rgba(251,191,36,0.1)",
                                color:
                                  c.severity === "CRITICAL" ||
                                  c.severity === "SEVERE"
                                    ? "#f87171"
                                    : "#fbbf24",
                                border: `1px solid ${
                                  c.severity === "CRITICAL" ||
                                  c.severity === "SEVERE"
                                    ? "rgba(248,113,113,0.2)"
                                    : "rgba(251,191,36,0.2)"
                                }`,
                              }}
                            >
                              {c.severity}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Report ────────────────────────────────── */}
      {tab === "report" && canReportCase && (
        <div className="max-w-2xl space-y-5">
          <div>
            <h2
              className="font-display font-bold text-lg"
              style={{ color: "var(--text-primary)" }}
            >
              {fr ? "Déclarer un cas de maladie" : "Report a disease case"}
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {fr
                ? "Incluez les cas des hôpitaux partenaires et établissements non connectés."
                : "Include cases from partner hospitals and non-connected facilities."}
            </p>
          </div>

          {formError && (
            <div
              className="p-3.5 rounded-xl text-sm"
              style={{
                background: "rgba(248,113,113,0.08)",
                color: "var(--danger)",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              {formError}
            </div>
          )}

          <form
            onSubmit={handleReport}
            className="rounded-2xl p-5 space-y-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Location */}
            <div>
              <h3
                className="text-xs font-bold uppercase tracking-wide mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {fr ? "Localisation" : "Location"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {fr ? "Région *" : "Region *"}
                  </label>
                  <select
                    value={form.region}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, region: e.target.value }))
                    }
                    className={inputCls}
                    required
                  >
                    <option value="">
                      {fr ? "Sélectionner..." : "Select..."}
                    </option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {fr ? "ID Établissement *" : "Facility ID *"}
                  </label>
                  <input
                    type="text"
                    value={form.facilityId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, facilityId: e.target.value }))
                    }
                    className={inputCls}
                    placeholder="CMR-YDE-001 ou code local"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Disease */}
            <div
              style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}
            >
              <h3
                className="text-xs font-bold uppercase tracking-wide mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {fr ? "Maladie" : "Disease"}
              </h3>

              {/* Quick ICD-10 picker */}
              <div className="mb-3">
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {fr
                    ? "Sélection rapide (maladies communes)"
                    : "Quick select (common diseases)"}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ICD10.map((d) => (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          icd10Code: d.code,
                          diseaseName: d.name,
                        }))
                      }
                      className="text-xs px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background:
                          form.icd10Code === d.code
                            ? "var(--accent)"
                            : "var(--bg-elevated)",
                        color:
                          form.icd10Code === d.code
                            ? "white"
                            : "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {d.code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {fr ? "Code ICD-10 *" : "ICD-10 Code *"}
                  </label>
                  <input
                    type="text"
                    value={form.icd10Code}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        icd10Code: e.target.value.toUpperCase(),
                        diseaseName:
                          COMMON_ICD10.find(
                            (d) => d.code === e.target.value.toUpperCase(),
                          )?.name ?? f.diseaseName,
                      }))
                    }
                    className={inputCls}
                    placeholder="B54"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {fr ? "Nom de la maladie *" : "Disease name *"}
                  </label>
                  <input
                    type="text"
                    value={form.diseaseName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, diseaseName: e.target.value }))
                    }
                    className={inputCls}
                    placeholder={
                      fr ? "Paludisme non précisé" : "Malaria, unspecified"
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Case details */}
            <div
              style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}
            >
              <h3
                className="text-xs font-bold uppercase tracking-wide mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {fr ? "Détails du cas" : "Case details"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {fr ? "Nombre de cas *" : "Case count *"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.caseCount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        caseCount: parseInt(e.target.value) || 1,
                      }))
                    }
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {fr ? "Date du rapport *" : "Report date *"}
                  </label>
                  <input
                    type="date"
                    value={form.reportDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reportDate: e.target.value }))
                    }
                    max={new Date().toISOString().split("T")[0]}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {fr ? "Gravité" : "Severity"}
                  </label>
                  <select
                    value={form.severity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, severity: e.target.value }))
                    }
                    className={inputCls}
                  >
                    <option value="">
                      {fr ? "Non précisée" : "Not specified"}
                    </option>
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Outbreak warning preview */}
            {form.icd10Code && form.caseCount >= 3 && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
                style={{
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.2)",
                }}
              >
                <AlertTriangle
                  size={15}
                  style={{
                    color: "var(--warning)",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                />
                <p style={{ color: "var(--text-secondary)" }}>
                  {fr
                    ? `${form.caseCount} cas déclarés. Le système vérifiera automatiquement si le seuil d'alerte est atteint pour ${form.icd10Code} dans ${form.region || "cette région"}.`
                    : `${form.caseCount} cases reported. The system will automatically check if the outbreak threshold is reached for ${form.icd10Code} in ${form.region || "this region"}.`}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, var(--accent), #6366f1)",
                  boxShadow: "0 4px 14px rgba(56,189,248,0.25)",
                }}
              >
                {submitting
                  ? fr
                    ? "Envoi..."
                    : "Submitting..."
                  : fr
                    ? "Soumettre le rapport"
                    : "Submit case report"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm());
                  setFErr("");
                }}
                className="px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                {fr ? "Effacer" : "Clear"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
