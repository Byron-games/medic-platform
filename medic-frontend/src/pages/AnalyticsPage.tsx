import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  MapPin,
  PlusCircle,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
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
import { api } from "../lib/api";

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
interface DashboardSummary {
  topDiseases: DiseaseCount[];
  casesByRegion: RegionCount[];
  activeAlerts: AlertSummary[];
  casesLast7Days: number;
  activeAlertCount: number;
}

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
const REGION_COLORS = [
  "#00D9FF",
  "#0EA5E9",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#F97316",
  "#14B8A6",
];
const ALERT_LEVEL_CONFIG: Record<string, { cls: string }> = {
  WARNING: { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  CRITICAL: { cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  EPIDEMIC: { cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

const emptyCase = () => ({
  region: "",
  facilityId: "",
  icd10Code: "",
  diseaseName: "",
  reportDate: new Date().toISOString().split("T")[0],
  caseCount: 1,
  severity: "",
});

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolving, setResolve] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmit] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyCase());
  const { canViewAnalytics, canReportCase, canResolveAlert, isAdmin } =
    useRole();

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: d } = await api.get<DashboardSummary>(
        "/analytics/dashboard",
      );
      setData(d);
    } catch {
      setError("Analytics service is not running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resolveAlert = async (id: number) => {
    setResolve(id);
    try {
      await api.patch(`/analytics/alerts/${id}/resolve`);
      fetchData();
    } finally {
      setResolve(null);
    }
  };

  const setF =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.region ||
      !form.icd10Code ||
      !form.diseaseName ||
      !form.facilityId
    ) {
      setFormError(
        "Region, Facility ID, ICD-10 code and disease name are required.",
      );
      return;
    }
    setSubmit(true);
    setFormError("");
    try {
      await api.post("/analytics/cases", {
        ...form,
        caseCount: Number(form.caseCount),
        severity: form.severity || null,
      });
      setForm(emptyCase());
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to report case.";
      setFormError(msg);
    } finally {
      setSubmit(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border border-[var(--border)]
    bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm
    focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
    focus:border-[var(--accent)] transition-colors`;

  if (!canViewAnalytics)
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
        <p className="text-sm">You do not have access to analytics.</p>
      </div>
    );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] gap-2">
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
          />
        </svg>
        Loading surveillance data…
      </div>
    );

  if (error)
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Disease Surveillance
        </h1>
        <div
          className="flex flex-col items-center justify-center py-16
        bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-xl
        text-[var(--text-secondary)]"
        >
          <AlertCircle size={28} className="mb-2 opacity-40" />
          <p className="text-sm font-medium">
            Analytics service is not running
          </p>
          <code
            className="mt-2 px-3 py-1.5 rounded bg-[var(--bg-primary)]
          text-[var(--accent)] text-xs font-mono"
          >
            powershell -File dev\Start-Service.ps1 analytics-service
          </code>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 text-sm rounded-lg bg-[var(--accent)]
            text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );

  if (!data) return null;

  const totalAll = data.topDiseases.reduce((s, x) => s + x.total, 0);
  const barData = data.topDiseases.map((d) => ({
    name:
      d.diseaseName.length > 22
        ? d.diseaseName.slice(0, 20) + "…"
        : d.diseaseName,
    cases: d.total,
    code: d.icd10Code,
  }));
  const pieData = data.casesByRegion.slice(0, 8).map((r, i) => ({
    name: r.region,
    value: r.total,
    fill: REGION_COLORS[i % REGION_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Disease Surveillance
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            Epidemiological dashboard · Last 30 days
            {canReportCase && (
              <span className="ml-2 text-xs text-[var(--accent)]">
                · You can report cases from external facilities
              </span>
            )}
          </p>
        </div>
        {canReportCase && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
              bg-[var(--accent)] hover:bg-[var(--accent-hover)]
              text-white text-sm font-medium transition-colors
              shadow-lg shadow-[var(--accent)]/20"
          >
            {showForm ? <X size={16} /> : <PlusCircle size={16} />}
            {showForm ? "Cancel" : "Report case"}
          </button>
        )}
      </div>

      {/* Report case form */}
      {showForm && canReportCase && (
        <div
          className="bg-[var(--bg-card)] border border-[var(--accent)]/30
          rounded-xl p-5"
        >
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
            Report Disease Case
            <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">
              — include cases from partner hospitals and external facilities
            </span>
          </h2>

          {formError && (
            <div
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20
              text-red-400 text-sm"
            >
              {formError}
            </div>
          )}

          <form
            onSubmit={handleReport}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Region <span className="text-red-400">*</span>
              </label>
              <select
                value={form.region}
                onChange={setF("region")}
                className={inputCls}
                required
              >
                <option value="">Select region</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Facility ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.facilityId}
                onChange={setF("facilityId")}
                className={inputCls}
                placeholder="e.g. FAC-001 or HGYDÉ"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Report date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.reportDate}
                onChange={setF("reportDate")}
                className={inputCls}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                ICD-10 Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.icd10Code}
                onChange={setF("icd10Code")}
                className={inputCls}
                placeholder="e.g. B54, A00, J22"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Disease name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.diseaseName}
                onChange={setF("diseaseName")}
                className={inputCls}
                placeholder="e.g. Malaria, unspecified"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Case count <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.caseCount}
                onChange={setF("caseCount")}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Severity
              </label>
              <select
                value={form.severity}
                onChange={setF("severity")}
                className={inputCls}
              >
                <option value="">Unknown</option>
                <option value="MILD">Mild</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)]
                  hover:bg-[var(--accent-hover)] text-white font-medium text-sm
                  transition-colors disabled:opacity-50"
              >
                {submitting ? "Reporting…" : "Submit case report"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Cases (7 days)",
            value: data.casesLast7Days.toLocaleString(),
            icon: Activity,
            color: "text-blue-400",
          },
          {
            label: "Active Alerts",
            value: data.activeAlertCount.toString(),
            icon: AlertTriangle,
            color:
              data.activeAlertCount > 0 ? "text-amber-400" : "text-green-400",
          },
          {
            label: "Regions Reporting",
            value: data.casesByRegion.length.toString(),
            icon: MapPin,
            color: "text-cyan-400",
          },
          {
            label: "Diseases Tracked",
            value: data.topDiseases.length.toString(),
            icon: TrendingUp,
            color: "text-green-400",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-xs text-[var(--text-secondary)] font-medium
                uppercase tracking-wide"
              >
                {label}
              </span>
              <Icon size={16} className={color} />
            </div>
            <div className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {data.activeAlerts.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-400" />
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
              Active Outbreak Alerts
            </h2>
          </div>
          <div className="space-y-3">
            {data.activeAlerts.map((alert) => {
              const cfg =
                ALERT_LEVEL_CONFIG[alert.alertLevel] ??
                ALERT_LEVEL_CONFIG.WARNING;
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-4 px-4 py-3
                    rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs
                      font-medium border ${cfg.cls}`}
                    >
                      {alert.alertLevel}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {alert.diseaseName}
                        <span className="ml-2 font-mono text-xs text-[var(--text-secondary)]">
                          {alert.icd10Code}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {alert.region} · {alert.caseCount} cases (threshold:{" "}
                        {alert.threshold}) ·{" "}
                        {new Date(alert.triggeredAt).toLocaleDateString(
                          "en-GB",
                        )}
                      </div>
                    </div>
                  </div>
                  {canResolveAlert && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      disabled={resolving === alert.id}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5
                        text-xs rounded-lg bg-green-500/10 text-green-400
                        border border-green-500/20 hover:bg-green-500/20
                        transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={12} />
                      Resolve
                    </button>
                  )}
                  {!canResolveAlert && canReportCase && (
                    <span className="shrink-0 text-xs text-[var(--text-secondary)]">
                      Contact admin to resolve
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
            Top Diseases (30 days)
          </h2>
          {barData.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-48
              text-[var(--text-secondary)]"
            >
              <p className="text-sm">No cases reported yet.</p>
              {canReportCase && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-2 text-sm text-[var(--accent)] hover:underline"
                >
                  Report the first case
                </button>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 11, fill: "var(--text-primary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                  }}
                  formatter={(value, _, props) => [
                    `${value} cases`,
                    props.payload.code,
                  ]}
                />
                <Bar
                  dataKey="cases"
                  fill="var(--accent)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
            Cases by Region (30 days)
          </h2>
          {pieData.length === 0 ? (
            <div
              className="flex items-center justify-center h-48
              text-[var(--text-secondary)] text-sm"
            >
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                  }}
                  formatter={(v) => [`${v} cases`]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => (
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "11px",
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

      {/* Disease table */}
      {data.topDiseases.length > 0 && (
        <div
          className="bg-[var(--bg-card)] border border-[var(--border)]
          rounded-xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Disease Summary (30 days)
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-primary)]">
                {["Disease", "ICD-10", "Cases", "Share"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold
                    text-[var(--text-secondary)] uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.topDiseases.map((d, i) => {
                const pct =
                  totalAll > 0 ? Math.round((d.total / totalAll) * 100) : 0;
                return (
                  <tr
                    key={i}
                    className="hover:bg-[var(--bg-primary)] transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                      {d.diseaseName}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-amber-400">
                      {d.icd10Code}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[var(--text-primary)]">
                      {d.total.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[var(--bg-primary)] rounded-full h-1.5">
                          <div
                            className="bg-[var(--accent)] h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
