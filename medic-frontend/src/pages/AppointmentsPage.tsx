import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  PlusCircle,
  Video,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

// ── Types ────────────────────────────────────────────────────
interface Appointment {
  id: number;
  patientMpiId: string;
  clinicianId: number;
  clinicianName: string;
  facilityId: string;
  facilityName: string;
  appointmentType: string;
  status: string;
  scheduledAt: string;
  endTime: string;
  durationMinutes: number;
  reason: string;
  notes: string | null;
  cancellationReason: string | null;
  rescheduledToId: number | null;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

// ── Helpers ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; cls: string; icon: React.FC<{ size: number }> }
> = {
  SCHEDULED: {
    label: "Scheduled",
    cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed",
    cls: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: "In Progress",
    cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    cls: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "No Show",
    cls: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    icon: AlertCircle,
  },
  RESCHEDULED: {
    label: "Rescheduled",
    cls: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: Clock,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SCHEDULED;
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

function TypeIcon({ type }: { type: string }) {
  if (type === "TELEMEDICINE")
    return <Video size={14} className="text-purple-400" />;
  return <Calendar size={14} className="text-[var(--text-secondary)]" />;
}

function formatDT(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    year: d.getFullYear(),
  };
}

// ── Main page ────────────────────────────────────────────────
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setAction] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchAppointments = useCallback(async (pg: number) => {
    setLoading(true);
    setError("");
    try {
      const from = new Date().toISOString().slice(0, 19);
      const to = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 19);
      // Use facility schedule — gets all appointments at your facility
      const facilityId = useAuthStore.getState().user?.facilityId ?? "FAC-001";
      const { data } = await api.get(
        `/appointments/facility/${facilityId}/schedule?from=${from}&to=${to}`,
      );
      // The schedule endpoint returns a List, not a Page — adapt
      const list = Array.isArray(data) ? data : [];
      setAppointments(list.slice(pg * 20, pg * 20 + 20));
      setTotalPages(Math.ceil(list.length / 20));
      setTotalCount(list.length);
    } catch {
      setError(
        "Could not load appointments. Is the Appointment Service running?",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments(page);
  }, [page, fetchAppointments]);

  const transition = async (id: number, action: string) => {
    setAction(id);
    try {
      await api.patch(`/appointments/${id}/${action}`);
      fetchAppointments(page);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Action failed";
      setError(msg);
    } finally {
      setAction(null);
    }
  };

  const cancelAppt = async (id: number) => {
    const reason = window.prompt("Cancellation reason (optional):");
    if (reason === null) return; // user pressed Cancel in dialog
    setAction(id);
    try {
      await api.patch(`/appointments/${id}/cancel`, { reason: reason || null });
      fetchAppointments(page);
    } catch {
      setError("Failed to cancel appointment");
    } finally {
      setAction(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Appointments
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            {totalCount.toLocaleString()} total appointments
          </p>
        </div>
        <button
          onClick={() => navigate("/appointments/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
            bg-[var(--accent)] hover:bg-[var(--accent-hover)]
            text-white text-sm font-medium transition-colors
            shadow-lg shadow-[var(--accent)]/20"
        >
          <PlusCircle size={16} />
          Book appointment
        </button>
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
          <div className="flex items-center justify-center py-16 text-[var(--text-secondary)] gap-2">
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
            Loading appointments…
          </div>
        ) : appointments.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16
            text-[var(--text-secondary)]"
          >
            <Calendar size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No appointments found.</p>
            <button
              onClick={() => navigate("/appointments/new")}
              className="mt-3 text-sm text-[var(--accent)] hover:underline"
            >
              Book the first appointment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-primary)]">
                  {[
                    "Date & Time",
                    "Patient",
                    "Clinician",
                    "Type",
                    "Duration",
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
                {appointments.map((a) => {
                  const { date, time } = formatDT(a.scheduledAt);
                  const isLoading = actionLoading === a.id;
                  const isUpcoming =
                    a.status === "SCHEDULED" || a.status === "CONFIRMED";
                  const isInProgress = a.status === "IN_PROGRESS";

                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-[var(--bg-primary)] transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-[var(--text-primary)]">
                          {date}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] font-mono">
                          {time}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            navigate(`/patients/${a.patientMpiId}`)
                          }
                          className="font-mono text-xs text-[var(--accent)] hover:underline"
                        >
                          {a.patientMpiId}
                        </button>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-[160px] truncate">
                          {a.reason}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                        {a.clinicianName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <TypeIcon type={a.appointmentType} />
                          <span className="text-xs text-[var(--text-secondary)]">
                            {a.appointmentType.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                        {a.durationMinutes} min
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isUpcoming && (
                            <>
                              {a.status === "SCHEDULED" && (
                                <button
                                  onClick={() => transition(a.id, "confirm")}
                                  disabled={isLoading}
                                  className="px-2 py-1 text-xs rounded bg-cyan-500/10
                                    text-cyan-400 hover:bg-cyan-500/20 transition-colors
                                    disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                              )}
                              <button
                                onClick={() => transition(a.id, "start")}
                                disabled={isLoading}
                                className="px-2 py-1 text-xs rounded bg-amber-500/10
                                  text-amber-400 hover:bg-amber-500/20 transition-colors
                                  disabled:opacity-50"
                              >
                                Start
                              </button>
                              <button
                                onClick={() => cancelAppt(a.id)}
                                disabled={isLoading}
                                className="px-2 py-1 text-xs rounded bg-red-500/10
                                  text-red-400 hover:bg-red-500/20 transition-colors
                                  disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {isInProgress && (
                            <>
                              <button
                                onClick={() => transition(a.id, "complete")}
                                disabled={isLoading}
                                className="px-2 py-1 text-xs rounded bg-green-500/10
                                  text-green-400 hover:bg-green-500/20 transition-colors
                                  disabled:opacity-50"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => transition(a.id, "no-show")}
                                disabled={isLoading}
                                className="px-2 py-1 text-xs rounded bg-orange-500/10
                                  text-orange-400 hover:bg-orange-500/20 transition-colors
                                  disabled:opacity-50"
                              >
                                No-show
                              </button>
                            </>
                          )}
                          {isLoading && (
                            <svg
                              className="animate-spin h-4 w-4 text-[var(--accent)]"
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
                          )}
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
      {totalPages > 1 && (
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
