import { useAuthStore } from "../store/authStore";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#f87171",
  DOCTOR: "#38bdf8",
  NURSE: "#34d399",
  MIDWIFE: "#a78bfa",
  LAB_TECHNICIAN: "#fbbf24",
  RADIOLOGIST: "#fb923c",
  PHARMACIST: "#4ade80",
  RECEPTIONIST: "#60a5fa",
  ANALYST: "#c084fc",
  FACILITY_ADMIN: "#f472b6",
  REGISTRAR: "#facc15",
  PENDING: "#94a3b8",
};

interface Props {
  size?: number;
  radius?: number;
  className?: string;
  onClick?: () => void;
}

export default function AvatarCircle({
  size = 32,
  radius = 10,
  className = "",
  onClick,
}: Props) {
  const { user, avatarUrl } = useAuthStore();

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const color = ROLE_COLORS[user?.role ?? ""] ?? "#38bdf8";

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-center font-display font-bold
        text-white overflow-hidden shrink-0 select-none
        ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: avatarUrl
          ? "transparent"
          : `linear-gradient(135deg, ${color}, #6366f1)`,
        fontSize: size * 0.33,
      }}
      title={user?.fullName}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user?.fullName ?? "Avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
