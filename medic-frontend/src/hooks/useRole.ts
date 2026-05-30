import { useAuthStore } from "../store/authStore";

export type UserRole =
  | "ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "MIDWIFE"
  | "LAB_TECHNICIAN"
  | "RADIOLOGIST"
  | "PHARMACIST"
  | "RECEPTIONIST"
  | "ANALYST"
  | "FACILITY_ADMIN"
  | "REGISTRAR"
  | "PENDING";

export function useRole() {
  const rawRole = useAuthStore((s) => s.user?.role);
  // Normalise — strip ROLE_ prefix if present, uppercase
  const role = rawRole
    ? (rawRole
        .toString()
        .replace(/^ROLE_/i, "")
        .toUpperCase() as UserRole)
    : undefined;

  const is = (...roles: UserRole[]) => role != null && roles.includes(role);

  return {
    role,
    isAdmin: is("ADMIN"),
    isDoctor: is("DOCTOR"),
    isNurse: is("NURSE"),
    isMidwife: is("MIDWIFE"),
    isLabTech: is("LAB_TECHNICIAN"),
    isRadiologist: is("RADIOLOGIST"),
    isPharmacist: is("PHARMACIST"),
    isReceptionist: is("RECEPTIONIST"),
    isAnalyst: is("ANALYST"),
    isFacilityAdmin: is("FACILITY_ADMIN"),
    isRegistrar: is("REGISTRAR"),
    isPending: is("PENDING"),

    canViewPatients: is(
      "ADMIN",
      "DOCTOR",
      "NURSE",
      "MIDWIFE",
      "LAB_TECHNICIAN",
      "RADIOLOGIST",
      "PHARMACIST",
      "RECEPTIONIST",
      "FACILITY_ADMIN",
      "REGISTRAR",
    ),

    canRegisterPatient: is(
      "ADMIN",
      "DOCTOR",
      "NURSE",
      "MIDWIFE",
      "RECEPTIONIST",
      "FACILITY_ADMIN",
    ),

    canEditPatient: is("ADMIN", "DOCTOR", "NURSE", "MIDWIFE"),

    canViewRecords: is(
      "ADMIN",
      "DOCTOR",
      "NURSE",
      "MIDWIFE",
      "LAB_TECHNICIAN",
      "RADIOLOGIST",
    ),

    canCreateSoapRecord: is("ADMIN", "DOCTOR", "MIDWIFE"),

    canCreateLabRecord: is("ADMIN", "DOCTOR", "LAB_TECHNICIAN", "RADIOLOGIST"),

    canEditRecord: is("ADMIN", "DOCTOR"),

    canViewAppointments: is(
      "ADMIN",
      "DOCTOR",
      "NURSE",
      "MIDWIFE",
      "RECEPTIONIST",
      "FACILITY_ADMIN",
      "REGISTRAR",
    ),

    canBookAppointment: is(
      "ADMIN",
      "DOCTOR",
      "NURSE",
      "MIDWIFE",
      "RECEPTIONIST",
    ),

    canManageAppointmentStatus: is("ADMIN", "DOCTOR", "NURSE", "MIDWIFE"),

    canViewTelemedicine: is("ADMIN", "DOCTOR", "NURSE", "MIDWIFE"),

    canStartSession: is("ADMIN", "DOCTOR"),

    canViewPrescriptions: is(
      "ADMIN",
      "DOCTOR",
      "NURSE",
      "MIDWIFE",
      "PHARMACIST",
    ),

    canPrescribe: is("ADMIN", "DOCTOR", "MIDWIFE"),

    canDispense: is("ADMIN", "PHARMACIST"),

    // ALL roles except PENDING can view analytics
    canViewAnalytics: role != null && !is("PENDING"),

    canReportCase: is("ADMIN", "ANALYST"),

    canResolveAlert: is("ADMIN"),

    canApproveUsers: is("ADMIN", "REGISTRAR"),

    canManageUsers: is("ADMIN", "FACILITY_ADMIN"),

    canViewSystemHealth: is("ADMIN", "FACILITY_ADMIN"),
  };
}
