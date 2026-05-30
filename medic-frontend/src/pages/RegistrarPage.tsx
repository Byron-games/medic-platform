import { CheckCircle, Clock, User, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRole } from "../hooks/useRole";
import { api } from "../lib/api";

interface PendingUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  staffId: string;
  requestedRole: string;
  facilityId: string;
  facilityName: string;
}

export default function RegistrarPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const { canApproveUsers } = useRole();

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PendingUser[]>("/auth/users/pending");
      setUsers(data);
    } catch {
      setError("Could not load pending registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approve = async (id: number) => {
    setActionId(id);
    try {
      await api.patch(`/auth/users/${id}/approve`);
      fetchPending();
    } catch {
      setError("Failed to approve user.");
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id: number) => {
    const reason = window.prompt("Reason for rejection (optional):");
    if (reason === null) return;
    setActionId(id);
    try {
      await api.patch(`/auth/users/${id}/reject`, reason || "");
      fetchPending();
    } catch {
      setError("Failed to reject user.");
    } finally {
      setActionId(null);
    }
  };

  if (!canApproveUsers)
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
        <p className="text-sm">Access denied.</p>
      </div>
    );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Pending Registrations
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-0.5">
          Review and approve new staff registrations for your facility
        </p>
      </div>

      {error && (
        <div
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20
          text-red-400 text-sm"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="flex items-center justify-center py-16
          text-[var(--text-secondary)] gap-2"
        >
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
          Loading…
        </div>
      ) : users.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16
          bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-xl
          text-[var(--text-secondary)]"
        >
          <CheckCircle size={32} className="mb-2 opacity-30" />
          <p className="text-sm">No pending registrations.</p>
          <p className="text-xs mt-1 opacity-60">
            New staff registrations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-[var(--bg-card)] border border-[var(--border)]
                rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center
                  justify-center text-amber-400 shrink-0"
                >
                  <User size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--text-primary)] text-sm">
                      {u.fullName}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5
                      rounded-full text-xs bg-amber-500/10 text-amber-400
                      border border-amber-500/20"
                    >
                      <Clock size={10} /> PENDING
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5 space-y-0.5">
                    <div>
                      @{u.username} · {u.email}
                    </div>
                    <div>
                      Staff ID:{" "}
                      <span className="font-mono text-[var(--accent)]">
                        {u.staffId}
                      </span>
                    </div>
                    <div>
                      Requested role:{" "}
                      <span className="font-medium text-[var(--text-primary)]">
                        {u.requestedRole ?? "Not specified"}
                      </span>
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      Facility: {u.facilityName} ({u.facilityId})
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => approve(u.id)}
                  disabled={actionId === u.id}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg
                    bg-green-500/10 text-green-400 border border-green-500/20
                    hover:bg-green-500/20 transition-colors disabled:opacity-50 font-medium"
                >
                  <CheckCircle size={13} />
                  Approve
                </button>
                <button
                  onClick={() => reject(u.id)}
                  disabled={actionId === u.id}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg
                    bg-red-500/10 text-red-400 border border-red-500/20
                    hover:bg-red-500/20 transition-colors disabled:opacity-50 font-medium"
                >
                  <XCircle size={13} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
