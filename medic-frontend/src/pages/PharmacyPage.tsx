import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pill,
  Search,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

interface Prescription {
  id: number;
  rxCode: string;
  patientMpiId: string;
  clinicianName: string;
  facilityId: string;
  status: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    quantity?: string;
  }>;
  hasInteractions: boolean;
  notes: string | null;
  issuedAt: string;
  expiresAt: string | null;
  dispensedAt: string | null;
  expired: boolean;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; cls: string; icon: React.FC<{ size: number }> }
> = {
  ISSUED: {
    label: "Awaiting dispensing",
    cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  PARTIALLY_DISPENSED: {
    label: "Partial",
    cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  DISPENSED: {
    label: "Dispensed",
    cls: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: CheckCircle,
  },
  EXPIRED: {
    label: "Expired",
    cls: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: XCircle,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ISSUED;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
      text-xs font-medium border ${cfg.cls}`}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

export default function PharmacyPage() {
  const [prescriptions, setRx] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rxSearch, setRxSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [dispensing, setDispensing] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchRx = useCallback(async (pg: number) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<SpringPage<Prescription>>(
        `/pharmacy/prescriptions?page=${pg}&size=15`,
      );
      setRx(data.content);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalElements);
    } catch {
      setError(
        "Could not load prescriptions. Is the Pharmacy Service running?",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRx(page);
  }, [page, fetchRx]);

  const lookupByCode = async () => {
    if (!rxSearch.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<Prescription>(
        `/pharmacy/prescriptions/rx/${rxSearch.trim().toUpperCase()}`,
      );
      setRx([data]);
      setTotalPages(1);
      setTotalCount(1);
    } catch {
      setError(`No prescription found for code "${rxSearch}".`);
      setRx([]);
    } finally {
      setLoading(false);
    }
  };

  const dispenseRx = async (rx: Prescription) => {
    const medName = rx.medications[0]?.name ?? "medication";
    const confirmed = window.confirm(
      `Dispense prescription ${rx.rxCode}?\nMedications: ${rx.medications.map((m) => m.name).join(", ")}`,
    );
    if (!confirmed) return;

    setDispensing(rx.id);
    try {
      await api.post(`/pharmacy/prescriptions/${rx.id}/dispense`, {
        medicationName: medName,
      });
      fetchRx(page);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Dispensing failed";
      setError(msg);
    } finally {
      setDispensing(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Pharmacy
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            {totalCount.toLocaleString()} prescriptions
          </p>
        </div>
        <button
          onClick={() => navigate("/pharmacy/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
            bg-[var(--accent)] hover:bg-[var(--accent-hover)]
            text-white text-sm font-medium transition-colors
            shadow-lg shadow-[var(--accent)]/20"
        >
          <Pill size={16} />
          Issue prescription
        </button>
      </div>

      {/* Rx code lookup */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2
            text-[var(--text-secondary)] pointer-events-none"
          />
          <input
            type="text"
            value={rxSearch}
            onChange={(e) => setRxSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookupByCode()}
            placeholder="Scan or type Rx code (e.g. RX-20260521-ABCDE)…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--border)]
              bg-[var(--bg-card)] text-[var(--text-primary)] text-sm font-mono
              focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
              focus:border-[var(--accent)] transition-colors
              placeholder:text-[var(--text-secondary)] placeholder:font-sans"
          />
        </div>
        <button
          onClick={lookupByCode}
          className="px-4 py-2.5 rounded-lg border border-[var(--border)]
            text-[var(--text-secondary)] hover:bg-[var(--border)]
            text-sm transition-colors"
        >
          Look up
        </button>
        {rxSearch && (
          <button
            onClick={() => {
              setRxSearch("");
              fetchRx(0);
            }}
            className="px-4 py-2.5 rounded-lg text-[var(--text-secondary)]
              hover:text-red-400 text-sm transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-2 p-4 rounded-xl
          bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {loading ? (
          <div
            className="flex items-center justify-center py-16
            text-[var(--text-secondary)] gap-2"
          >
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            Loading prescriptions…
          </div>
        ) : prescriptions.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16
            text-[var(--text-secondary)]"
          >
            <Pill size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No prescriptions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 table-scroll">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-primary)]">
                  {[
                    "Rx Code",
                    "Patient",
                    "Clinician",
                    "Medications",
                    "Issued",
                    "Expires",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold
                      text-[var(--text-secondary)] uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {prescriptions.map((rx) => {
                  const isLoading = dispensing === rx.id;
                  const canDispense =
                    rx.status === "ISSUED" ||
                    rx.status === "PARTIALLY_DISPENSED";
                  const isExpired = rx.expired;

                  return (
                    <tr
                      key={rx.id}
                      className="hover:bg-[var(--bg-primary)] transition-colors"
                    >
                      {/* Rx Code */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-[var(--accent)] font-semibold">
                          {rx.rxCode}
                        </div>
                        {rx.hasInteractions && (
                          <div
                            className="flex items-center gap-1 mt-1
                            text-amber-400 text-xs"
                          >
                            <AlertTriangle size={10} />
                            Interactions
                          </div>
                        )}
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            navigate(`/patients/${rx.patientMpiId}`)
                          }
                          className="font-mono text-xs text-[var(--accent)] hover:underline"
                        >
                          {rx.patientMpiId}
                        </button>
                      </td>

                      {/* Clinician */}
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs whitespace-nowrap">
                        {rx.clinicianName}
                      </td>

                      {/* Medications */}
                      <td className="px-4 py-3 max-w-[200px]">
                        {rx.medications.slice(0, 2).map((m, i) => (
                          <div
                            key={i}
                            className="text-xs text-[var(--text-primary)]"
                          >
                            <span className="font-medium">{m.name}</span>
                            <span className="text-[var(--text-secondary)] ml-1">
                              {m.dosage}
                            </span>
                          </div>
                        ))}
                        {rx.medications.length > 2 && (
                          <div className="text-xs text-[var(--text-secondary)]">
                            +{rx.medications.length - 2} more
                          </div>
                        )}
                      </td>

                      {/* Issued */}
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs whitespace-nowrap">
                        {new Date(rx.issuedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>

                      {/* Expires */}
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {rx.expiresAt ? (
                          <span
                            className={
                              isExpired
                                ? "text-red-400"
                                : "text-[var(--text-secondary)]"
                            }
                          >
                            {new Date(rx.expiresAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )}
                            {isExpired && " (expired)"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={rx.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canDispense && !isExpired && (
                            <button
                              onClick={() => dispenseRx(rx)}
                              disabled={isLoading}
                              className="px-2 py-1 text-xs rounded bg-green-500/10
                                text-green-400 border border-green-500/20
                                hover:bg-green-500/20 transition-colors
                                disabled:opacity-50 whitespace-nowrap"
                            >
                              {isLoading ? "…" : "Dispense"}
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/pharmacy/${rx.id}`)}
                            className="px-2 py-1 text-xs rounded border border-[var(--border)]
                              text-[var(--text-secondary)] hover:bg-[var(--border)]
                              transition-colors"
                          >
                            View
                          </button>
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

      {/* Pagination */}
      {totalPages > 1 && !rxSearch && (
        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
