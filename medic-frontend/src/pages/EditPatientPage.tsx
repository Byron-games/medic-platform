import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

const GENDERS = ["MALE", "FEMALE", "OTHER", "UNKNOWN"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const CAMEROON_REGIONS = [
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

export default function EditPatientPage() {
  const { mpiId } = useParams<{ mpiId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    nationalId: "",
    bloodType: "",
    phoneNumber: "",
    email: "",
    address: "",
    region: "",
    country: "",
    primaryFacilityId: "",
  });

  useEffect(() => {
    if (!mpiId) return;
    api
      .get(`/patients/${mpiId}`)
      .then(({ data }) => {
        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          dateOfBirth: data.dateOfBirth ?? "",
          gender: data.gender ?? "",
          nationalId: data.nationalId ?? "",
          bloodType: data.bloodType ?? "",
          phoneNumber: data.phoneNumber ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          region: data.region ?? "",
          country: data.country ?? "",
          primaryFacilityId: data.primaryFacilityId ?? "",
        });
      })
      .catch(() => setError("Patient not found."))
      .finally(() => setLoading(false));
  }, [mpiId]);

  const setF =
    (k: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Send only non-empty fields (PATCH semantics)
      const patch = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ""),
      );
      await api.patch(`/patients/${mpiId}`, patch);
      navigate(`/patients/${mpiId}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update patient.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full px-3 py-2.5 rounded-lg border border-[var(--border)]
    bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm
    focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
    focus:border-[var(--accent)] transition-colors
    placeholder:text-[var(--text-secondary)]`;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
        Loading…
      </div>
    );

  return (
    <div className="max-w-2xl space-y-5">
      <button
        onClick={() => navigate(`/patients/${mpiId}`)}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Back to patient
      </button>

      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Edit Patient
        </h1>
        <p className="font-mono text-xs text-[var(--accent)] mt-1">{mpiId}</p>
      </div>

      {error && (
        <div
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20
          text-red-400 text-sm"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 space-y-5"
      >
        {/* Personal */}
        <div>
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
            Personal information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                First name
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={setF("firstName")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Last name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={setF("lastName")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Date of birth
              </label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={setF("dateOfBirth")}
                className={inputCls}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={setF("gender")}
                className={inputCls}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                National ID
              </label>
              <input
                type="text"
                value={form.nationalId}
                onChange={setF("nationalId")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Blood type
              </label>
              <select
                value={form.bloodType}
                onChange={setF("bloodType")}
                className={inputCls}
              >
                <option value="">Unknown</option>
                {BLOOD_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
            Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={setF("phoneNumber")}
                className={inputCls}
                placeholder="+237 6XX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={setF("email")}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Address
              </label>
              <textarea
                value={form.address}
                onChange={setF("address")}
                className={`${inputCls} resize-none`}
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Region
              </label>
              <select
                value={form.region}
                onChange={setF("region")}
                className={inputCls}
              >
                <option value="">Select region</option>
                {CAMEROON_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={form.country}
                onChange={setF("country")}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[var(--accent)]
              hover:bg-[var(--accent-hover)] text-white font-medium text-sm
              transition-colors disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/patients/${mpiId}`)}
            className="px-4 py-2.5 rounded-lg border border-[var(--border)]
              text-[var(--text-secondary)] hover:bg-[var(--border)] text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
