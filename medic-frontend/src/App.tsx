import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth          from './components/RequireAuth'
import AppLayout            from './components/AppLayout'
import LoginPage            from './pages/LoginPage'
import RegisterPage         from './pages/RegisterPage'
import DashboardPage        from './pages/DashboardPage'
import PatientsPage         from './pages/PatientsPage'
import PatientDetailPage    from './pages/PatientDetailPage'
import RegisterPatientPage  from './pages/RegisterPatientPage'
import RecordsPage          from './pages/RecordsPage'
import NewRecordPage        from './pages/NewRecordPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/"                              element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"                     element={<DashboardPage />} />
            <Route path="/patients"                      element={<PatientsPage />} />
            <Route path="/patients/new"                  element={<RegisterPatientPage />} />
            <Route path="/patients/:mpiId"               element={<PatientDetailPage />} />
            <Route path="/patients/:mpiId/records"       element={<RecordsPage />} />
            <Route path="/patients/:mpiId/records/new"   element={<NewRecordPage />} />
            {/* Week 5+: /appointments, /telemedicine, /pharmacy, /analytics */}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
