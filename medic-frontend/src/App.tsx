import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import { useAuthStore } from "./store/authStore";

// ── Always loaded (critical for initial render) ──────────────
import AppLayout from "./components/AppLayout";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// ── Lazy‑loaded pages (code splitting) ───────────────────────
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PatientsPage = lazy(() => import("./pages/PatientsPage"));
const PatientDetailPage = lazy(() => import("./pages/PatientDetailPage"));
const RegisterPatientPage = lazy(() => import("./pages/RegisterPatientPage"));
const EditPatientPage = lazy(() => import("./pages/EditPatientPage"));
const RecordsPage = lazy(() => import("./pages/RecordsPage"));
const NewRecordPage = lazy(() => import("./pages/NewRecordPage"));
const AppointmentsPage = lazy(() => import("./pages/AppointmentsPage"));
const BookAppointmentPage = lazy(() => import("./pages/BookAppointmentPage"));
const TelemedicinePage = lazy(() => import("./pages/TelemedicinePage"));
const NewSessionPage = lazy(() => import("./pages/NewSessionPage"));
const SessionDetailPage = lazy(() => import("./pages/SessionDetailPage"));
const PharmacyPage = lazy(() => import("./pages/PharmacyPage"));
const IssuePrescriptionPage = lazy(
  () => import("./pages/IssuePrescriptionPage"),
);
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const RegistrarPage = lazy(() => import("./pages/RegistrarPage"));
const SystemPage = lazy(() => import("./pages/SystemPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

// ── Loading skeleton (appears while lazy chunk loads) ────────
function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div
        className="h-8 w-48 rounded-xl"
        style={{ background: "var(--bg-elevated)" }}
      />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl"
            style={{ background: "var(--bg-elevated)" }}
          />
        ))}
      </div>
      <div
        className="h-64 rounded-xl"
        style={{ background: "var(--bg-elevated)" }}
      />
    </div>
  );
}

export default function App() {
  const { user, avatarUrl, setAvatar } = useAuthStore();

  // Restore avatar from localStorage on app load (if not already in store)
  useEffect(() => {
    if (user?.username && !avatarUrl) {
      const stored = localStorage.getItem(`medic-avatar-${user.username}`);
      if (stored) setAvatar(stored);
    }
  }, [user?.username, avatarUrl, setAvatar]);

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div
              className="min-h-screen flex items-center justify-center"
              style={{ background: "var(--bg-primary)" }}
            >
              <PageSkeleton />
            </div>
          }
        >
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />

                <Route
                  path="/dashboard"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <DashboardPage />
                    </Suspense>
                  }
                />

                {/* Patients */}
                <Route
                  path="/patients"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <PatientsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/patients/new"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <RegisterPatientPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/patients/:mpiId"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <PatientDetailPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/patients/:mpiId/edit"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <EditPatientPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/patients/:mpiId/records"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <RecordsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/patients/:mpiId/records/new"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <NewRecordPage />
                    </Suspense>
                  }
                />

                {/* Appointments */}
                <Route
                  path="/appointments"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AppointmentsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/appointments/new"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <BookAppointmentPage />
                    </Suspense>
                  }
                />

                {/* Telemedicine */}
                <Route
                  path="/telemedicine"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <TelemedicinePage />
                    </Suspense>
                  }
                />
                <Route
                  path="/telemedicine/new"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <NewSessionPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/telemedicine/:id"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <SessionDetailPage />
                    </Suspense>
                  }
                />

                {/* Pharmacy */}
                <Route
                  path="/pharmacy"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <PharmacyPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/pharmacy/new"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <IssuePrescriptionPage />
                    </Suspense>
                  }
                />

                {/* Analytics */}
                <Route
                  path="/analytics"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <AnalyticsPage />
                    </Suspense>
                  }
                />

                {/* Registrar */}
                <Route
                  path="/registrar"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <RegistrarPage />
                    </Suspense>
                  }
                />

                {/* System Health */}
                <Route
                  path="/system"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <SystemPage />
                    </Suspense>
                  }
                />

                {/* User Profile */}
                <Route
                  path="/profile"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <ProfilePage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  );
}
