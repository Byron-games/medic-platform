import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  ChevronRight,
  Globe,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pill,
  Stethoscope,
  Sun,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useRole } from "../hooks/useRole";
import { useLang } from "../i18n/LanguageContext";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import ErrorBoundary from "./ErrorBoundary";

// ──────────────────────────────────────────────────────────
// Local AvatarCircle component – uses store avatarUrl + initials
// ──────────────────────────────────────────────────────────
const AvatarCircle = ({
  size = 32,
  radius = "rounded-xl",
  className = "",
  onClick,
}: {
  size?: number;
  radius?: string;
  className?: string;
  onClick?: () => void;
}) => {
  const { user, avatarUrl } = useAuthStore();
  const meta = ROLE_META[user?.role ?? ""] ?? ROLE_META.PENDING;

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-center overflow-hidden shrink-0 ${radius} ${className}`}
      style={{
        width: size,
        height: size,
        background: avatarUrl
          ? "transparent"
          : `linear-gradient(135deg, ${meta.color}, #6366f1)`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-bold text-white text-xs">{initials}</span>
      )}
    </div>
  );
};

// Role metadata (same as before)
const ROLE_META: Record<string, { label: string; color: string; bg: string }> =
  {
    ADMIN: {
      label: "Administrator",
      color: "#f87171",
      bg: "rgba(248,113,113,0.12)",
    },
    DOCTOR: { label: "Doctor", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
    NURSE: { label: "Nurse", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
    MIDWIFE: {
      label: "Midwife",
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.12)",
    },
    LAB_TECHNICIAN: {
      label: "Lab Technician",
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.12)",
    },
    RADIOLOGIST: {
      label: "Radiologist",
      color: "#fb923c",
      bg: "rgba(251,146,60,0.12)",
    },
    PHARMACIST: {
      label: "Pharmacist",
      color: "#4ade80",
      bg: "rgba(74,222,128,0.12)",
    },
    RECEPTIONIST: {
      label: "Receptionist",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.12)",
    },
    ANALYST: {
      label: "Health Analyst",
      color: "#c084fc",
      bg: "rgba(192,132,252,0.12)",
    },
    FACILITY_ADMIN: {
      label: "Facility Admin",
      color: "#f472b6",
      bg: "rgba(244,114,182,0.12)",
    },
    REGISTRAR: {
      label: "Registrar",
      color: "#facc15",
      bg: "rgba(250,204,21,0.12)",
    },
    PENDING: {
      label: "Pending Approval",
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.12)",
    },
  };

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobile] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingCount, setPending] = useState(0);
  const { user, logout, avatarUrl, setAvatar } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useLang();
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const {
    canViewPatients,
    canViewAppointments,
    canViewTelemedicine,
    canViewPrescriptions,
    canViewAnalytics,
    canApproveUsers,
    canViewSystemHealth,
    role,
  } = useRole();

  const NAV = [
    {
      to: "/dashboard",
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: "/patients",
      label: t("nav.patients"),
      icon: Users,
      show: canViewPatients,
    },
    {
      to: "/appointments",
      label: t("nav.appointments"),
      icon: Calendar,
      show: canViewAppointments,
    },
    {
      to: "/telemedicine",
      label: t("nav.telemedicine"),
      icon: Video,
      show: canViewTelemedicine,
    },
    {
      to: "/pharmacy",
      label: t("nav.pharmacy"),
      icon: Pill,
      show: canViewPrescriptions,
    },
    {
      to: "/analytics",
      label: t("nav.analytics"),
      icon: BarChart3,
      show: canViewAnalytics,
    },
    {
      to: "/registrar",
      label: t("nav.registrar"),
      icon: UserCheck,
      show: canApproveUsers,
    },
    {
      to: "/system",
      label: t("nav.system"),
      icon: Activity,
      show: canViewSystemHealth,
    },
  ].filter((i) => i.show);

  // Section grouping
  const NAV_SECTIONS = [
    {
      label: lang === "FR" ? "PRINCIPAL" : "MAIN",
      items: NAV.filter((n) =>
        ["/dashboard", "/patients", "/appointments"].includes(n.to),
      ),
    },
    {
      label: lang === "FR" ? "CLINIQUE" : "CLINICAL",
      items: NAV.filter((n) => ["/telemedicine", "/pharmacy"].includes(n.to)),
    },
    {
      label: lang === "FR" ? "DONNÉES" : "REPORTS",
      items: NAV.filter((n) => ["/analytics"].includes(n.to)),
    },
    {
      label: lang === "FR" ? "GESTION" : "ADMIN",
      items: NAV.filter((n) => ["/registrar", "/system"].includes(n.to)),
    },
  ].filter((s) => s.items.length > 0);

  const meta = ROLE_META[role ?? ""] ?? ROLE_META.PENDING;
  const currentPage = NAV.find((n) => location.pathname.startsWith(n.to));

  // Load avatar from localStorage
  useEffect(() => {
    if (!avatarUrl && user?.username) {
      const stored = localStorage.getItem(`medic-avatar-${user.username}`);
      if (stored) setAvatar(stored);
    }
  }, [user?.username, avatarUrl, setAvatar]);

  // Fetch pending approvals count
  useEffect(() => {
    if (!canApproveUsers) return;
    api
      .get("/auth/users/pending")
      .then((r) => setPending(Array.isArray(r.data) ? r.data.length : 0))
      .catch(() => {});
  }, [canApproveUsers, location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node))
        setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Shared sidebar content
  const SidebarContent = () => (
    <>
      {/* Logo + collapse toggle */}
      <div
        className="flex items-center gap-3 px-3 py-4 shrink-0"
        style={{
          borderBottom: "1px solid var(--sidebar-border)",
          minHeight: 60,
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--accent), #6366f1)",
            boxShadow: "0 0 16px rgba(56,189,248,0.3)",
            minWidth: 36,
          }}
        >
          <Stethoscope size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text flex-1 min-w-0">
            <div className="font-display font-bold text-white text-sm leading-none truncate">
              M.E.D.I.C.
            </div>
            <div
              className="text-xs mt-0.5 truncate"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Healthcare Hub
            </div>
          </div>
        )}
        <button
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem("sidebar-collapsed", String(next));
          }}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg transition-colors shrink-0 ml-auto"
          style={{ color: "rgba(255,255,255,0.3)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} />
          ) : (
            <PanelLeftClose size={15} />
          )}
        </button>
        <button
          onClick={() => setMobile(false)}
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg transition-colors shrink-0 ml-auto"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          <X size={15} />
        </button>
      </div>

      {/* User chip (only visible when expanded) */}
      {!collapsed && (
        <div
          className="mx-3 mt-3 mb-2 p-3 rounded-xl shrink-0"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <AvatarCircle
              size={32}
              radius="rounded-lg"
              onClick={() => navigate("/profile")}
            />
            <div className="sidebar-user-info min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate leading-none mb-0.5">
                {user?.fullName ?? "User"}
              </div>
              <div
                className="text-xs font-medium truncate"
                style={{ color: meta.color }}
              >
                {meta.label}
              </div>
            </div>
          </div>
          {user?.facilityName && (
            <div
              className="mt-1.5 text-xs truncate"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {user.facilityName}
            </div>
          )}
        </div>
      )}

      {/* Navigation with sections */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            {!collapsed && (
              <div
                className="px-3 mb-1 text-xs font-bold tracking-widest"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobile(false)}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl transition-all duration-150 ${
                      collapsed ? "justify-center py-3 px-0" : "px-3 py-2.5"
                    }`
                  }
                  style={({ isActive }) => ({
                    background: isActive
                      ? "var(--sidebar-active)"
                      : "transparent",
                    color: isActive ? "white" : "var(--sidebar-text)",
                    border: isActive
                      ? "1px solid rgba(56,189,248,0.2)"
                      : "1px solid transparent",
                    boxShadow: isActive
                      ? "0 0 12px rgba(56,189,248,0.15)"
                      : "none",
                  })}
                >
                  <Icon size={17} className="shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium flex-1 truncate">
                      {label}
                    </span>
                  )}
                  {/* Registrar badge (expanded) */}
                  {!collapsed && to === "/registrar" && pendingCount > 0 && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                      style={{ fontSize: 9, background: "var(--danger)" }}
                    >
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                  {/* Registrar badge (collapsed) */}
                  {collapsed && to === "/registrar" && pendingCount > 0 && (
                    <span
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ background: "var(--danger)" }}
                    />
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom logout */}
      <div
        className="px-2 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          title={
            collapsed ? (lang === "FR" ? "Déconnexion" : "Sign out") : undefined
          }
          className={`w-full flex items-center gap-3 rounded-xl py-2.5 transition-all text-sm ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
          }
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && (
            <span className="sidebar-label">
              {lang === "FR" ? "Déconnexion" : "Sign out"}
            </span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex"
        style={{
          width: collapsed ? 64 : 240,
          minWidth: collapsed ? 64 : 240,
          maxWidth: collapsed ? 64 : 240,
          flexShrink: 0,
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          transition:
            "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s, max-width 0.25s",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 10,
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar (off‑canvas) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          mobileOpen ? "visible" : "invisible"
        }`}
      >
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobile(false)}
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-64 flex flex-col transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            background: "var(--sidebar-bg)",
            borderRight: "1px solid var(--sidebar-border)",
          }}
        >
          <SidebarContent />
        </aside>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="shrink-0 flex items-center justify-between px-4 lg:px-5 h-14"
          style={{
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu button (styled) */}
            <button
              onClick={() => setMobile(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1px solid rgba(56,189,248,0.25)",
              }}
            >
              <PanelLeftOpen size={16} />
              <span className="text-xs font-semibold">Menu</span>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                M.E.D.I.C.
              </span>
              {currentPage && (
                <>
                  <ChevronRight
                    size={12}
                    style={{ color: "var(--text-muted)" }}
                  />
                  <span
                    className="font-display font-semibold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {currentPage.label}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Language dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <Globe size={14} /> {lang === "FR" ? "🇫🇷" : "🇬🇧"} {lang}
              </button>
              {langOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-36 rounded-xl overflow-hidden z-50"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  {(["EN", "FR"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setLang(l);
                        setLangOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left"
                      style={{
                        color:
                          lang === l
                            ? "var(--accent)"
                            : "var(--text-secondary)",
                        background:
                          lang === l ? "var(--accent-dim)" : "transparent",
                        fontWeight: lang === l ? 600 : 400,
                      }}
                    >
                      {l === "EN" ? "🇬🇧 English" : "🇫🇷 Français"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <Bell size={16} />
                {pendingCount > 0 && (
                  <span
                    className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      fontSize: 9,
                      background: "var(--danger)",
                      boxShadow: "0 0 0 2px var(--bg-card)",
                    }}
                  >
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {lang === "FR" ? "Notifications" : "Notifications"}
                    </h3>
                  </div>
                  {pendingCount > 0 ? (
                    <button
                      onClick={() => {
                        navigate("/registrar");
                        setNotifOpen(false);
                      }}
                      className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--bg-elevated)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: "rgba(251,191,36,0.15)",
                          border: "1px solid rgba(251,191,36,0.2)",
                        }}
                      >
                        <UserCheck
                          size={15}
                          style={{ color: "var(--warning)" }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {pendingCount} pending registration
                          {pendingCount !== 1 ? "s" : ""}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {lang === "FR"
                            ? "Des utilisateurs attendent votre approbation"
                            : "Staff members awaiting approval at your facility"}
                        </p>
                        <p
                          className="text-xs mt-1 font-medium"
                          style={{ color: "var(--accent)" }}
                        >
                          {lang === "FR"
                            ? "Voir les demandes →"
                            : "Review now →"}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <div className="text-2xl mb-2">✓</div>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {lang === "FR"
                          ? "Aucune notification"
                          : "All caught up"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Topbar avatar (styled) */}
            <AvatarCircle
              size={34}
              radius="rounded-xl"
              className="ring-2 ring-[var(--accent)]/20 hover:ring-[var(--accent)]/50 transition-all cursor-pointer"
              onClick={() => navigate("/profile")}
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            <ErrorBoundary section="Page">
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
