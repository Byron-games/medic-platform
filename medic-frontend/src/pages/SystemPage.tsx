import { CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRole } from "../hooks/useRole";
import { api } from "../lib/api";

const SERVICES = [
  { name: "API Gateway", port: 8080, path: "/health/gateway" },
  { name: "Auth Service", port: 8087, path: "/health/auth" },
  { name: "Patient Identity", port: 8081, path: "/health/patient" },
  { name: "EMR Service", port: 8082, path: "/health/emr" },
  { name: "Appointments", port: 8083, path: "/health/appointment" },
  { name: "Telemedicine", port: 8084, path: "/health/telemedicine" },
  { name: "Pharmacy", port: 8085, path: "/health/pharmacy" },
  { name: "Analytics", port: 8086, path: "/health/analytics" },
  { name: "Notifications", port: 8088, path: "/health/notification" },
  { name: "USSD Service", port: 8089, path: "/health/ussd" },
];

type Status = "UP" | "DOWN" | "CHECKING";

export default function SystemPage() {
  const { canViewSystemHealth } = useRole();
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    Object.fromEntries(SERVICES.map((s) => [s.name, "CHECKING"])),
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  const checkAll = useCallback(async () => {
    setChecking(true);
    const results = await Promise.allSettled(
      SERVICES.map((s) =>
        api
          .get(s.path, { baseURL: "" })
          .then((r) => ({
            name: s.name,
            status: r.data?.status === "UP" ? "UP" : ("DOWN" as Status),
          }))
          .catch(() => ({ name: s.name, status: "DOWN" as Status })),
      ),
    );
    const next: Record<string, Status> = {};
    results.forEach((r) => {
      if (r.status === "fulfilled") next[r.value.name] = r.value.status;
    });
    setStatuses(next);
    setLastChecked(new Date());
    setChecking(false);
  }, []);

  useEffect(() => {
    checkAll();
  }, [checkAll]);

  if (!canViewSystemHealth)
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
        <p className="text-sm">Access denied.</p>
      </div>
    );

  const upCount = Object.values(statuses).filter((s) => s === "UP").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            System Health
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            {upCount}/{SERVICES.length} services online
            {lastChecked && (
              <span className="ml-2 opacity-60">
                · Last checked {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={checkAll}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
            border border-[var(--border)] text-sm text-[var(--text-secondary)]
            hover:text-[var(--text-primary)] hover:bg-[var(--border)]
            transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <div
        className="p-4 rounded-xl"
        style={{
          background:
            upCount === SERVICES.length
              ? "rgba(16,185,129,0.1)"
              : upCount >= 7
                ? "rgba(245,158,11,0.1)"
                : "rgba(239,68,68,0.1)",
          border: `1px solid ${
            upCount === SERVICES.length
              ? "rgba(16,185,129,0.3)"
              : upCount >= 7
                ? "rgba(245,158,11,0.3)"
                : "rgba(239,68,68,0.3)"
          }`,
        }}
      >
        <div
          className={`font-semibold text-sm ${
            upCount === SERVICES.length
              ? "text-green-400"
              : upCount >= 7
                ? "text-amber-400"
                : "text-red-400"
          }`}
        >
          {upCount === SERVICES.length
            ? "✓ All systems operational"
            : upCount >= 7
              ? `⚠ Partial outage — ${SERVICES.length - upCount} service(s) down`
              : `✗ Major outage — ${SERVICES.length - upCount} service(s) down`}
        </div>
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICES.map((svc) => {
          const status = statuses[svc.name] ?? "CHECKING";
          return (
            <div
              key={svc.name}
              className="flex items-center justify-between px-4 py-4
                rounded-xl border transition-colors"
              style={{
                background: "var(--bg-card)",
                border:
                  status === "UP"
                    ? "1px solid rgba(16,185,129,0.2)"
                    : status === "DOWN"
                      ? "1px solid rgba(239,68,68,0.2)"
                      : "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-3">
                {status === "UP" ? (
                  <CheckCircle size={18} className="text-green-400 shrink-0" />
                ) : status === "DOWN" ? (
                  <XCircle size={18} className="text-red-400 shrink-0" />
                ) : (
                  <Clock
                    size={18}
                    className="text-[var(--text-secondary)] shrink-0 animate-pulse"
                  />
                )}
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {svc.name}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] font-mono">
                    localhost:{svc.port}
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  status === "UP"
                    ? "bg-green-500/10 text-green-400"
                    : status === "DOWN"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-gray-500/10 text-gray-400"
                }`}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
