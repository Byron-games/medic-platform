export type Lang = "EN" | "FR";

export const translations = {
  EN: {
    nav: {
      dashboard: "Dashboard",
      patients: "Patients",
      appointments: "Appointments",
      telemedicine: "Telemedicine",
      pharmacy: "Pharmacy",
      analytics: "Analytics",
      registrar: "Registrations",
      system: "System",
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      loading: "Loading…",
      search: "Search",
      back: "Back",
    },
    auth: {
      login: "Sign in",
      register: "Create account",
      username: "Username",
      password: "Password",
      fullName: "Full name",
      email: "Email",
      role: "Role",
      facility: "Facility",
      selectFacility: "Select your facility",
      pending: "Registration submitted — awaiting approval",
      pendingDesc:
        "Your account is pending approval by the Registrar at your facility.",
    },
    patients: {
      register: "Register patient",
      firstName: "First name",
      lastName: "Last name",
      dob: "Date of birth",
      gender: "Gender",
      phone: "Phone number",
      region: "Region",
    },
  },
  FR: {
    nav: {
      dashboard: "Tableau de bord",
      patients: "Patients",
      appointments: "Rendez-vous",
      telemedicine: "Télémédecine",
      pharmacy: "Pharmacie",
      analytics: "Surveillance",
      registrar: "Inscriptions",
      system: "Système",
    },
    common: {
      save: "Enregistrer",
      cancel: "Annuler",
      loading: "Chargement…",
      search: "Rechercher",
      back: "Retour",
    },
    auth: {
      login: "Se connecter",
      register: "Créer un compte",
      username: "Nom d'utilisateur",
      password: "Mot de passe",
      fullName: "Nom complet",
      email: "Email",
      role: "Rôle",
      facility: "Établissement",
      selectFacility: "Choisissez votre établissement",
      pending: "Inscription soumise — en attente d'approbation",
      pendingDesc:
        "Votre compte est en attente d'approbation par le Responsable de votre établissement.",
    },
    patients: {
      register: "Enregistrer un patient",
      firstName: "Prénom",
      lastName: "Nom de famille",
      dob: "Date de naissance",
      gender: "Genre",
      phone: "Numéro de téléphone",
      region: "Région",
    },
  },
} as const;

export type TranslationKey = typeof translations.EN;
