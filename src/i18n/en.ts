import type { Messages } from "./types";

export const en = {
  language: {
    code: "en",
    labelShort: "EN",
    labelLong: "English",
  },

  nav: {
    home: "Home",
    howItWorks: "How it works",
    standards: "Standards",
    forFarmers: "For farmers",
    forBuyers: "For buyers",
    contact: "Contact",
    signIn: "Sign in",
    signUp: "Create account",
    dashboard: "Dashboard",
    settings: "Settings",
    signOut: "Sign out",
  },

  common: {
    loading: "Loading…",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    back: "Back",
    edit: "Edit",
    update: "Update",
    delete: "Delete",
    confirm: "Confirm",
    close: "Close",
    yes: "Yes",
    no: "No",
    optional: "Optional",
    required: "Required",
    search: "Search",
    reset: "Reset",
  },

  auth: {
    signIn: {
      title: "Sign in",
      subtitle: "Access your account.",
      email: "Email",
      password: "Password",
      role: "Role",
      submit: "Sign in",
      busy: "Signing in…",
      noAccount: "Don’t have an account?",
      errorGeneric: "Sign-in failed. Please try again.",
    },

    signUp: {
      title: "Create your account",
      subtitle: "Sign-up uses Supabase authentication. Email confirmation may be required.",
      role: "Role",
      name: "Full name",
      organisation: "Organisation (optional)",
      email: "Email",
      phone: "Phone (optional)",
      password: "Password",
      submit: "Create account",
      busy: "Creating account…",
      haveAccount: "I already have an account",
      passwordMin: "Password must meet the minimum length requirement.",
      profileHint: "Set your country/city/phone precisely in Settings after sign-up.",
      errorGeneric: "Sign-up failed. Please try again.",
    },

    verifyEmail: {
      title: "Email verification",
      subtitle: "Enter the one-time code sent to your email.",
      codeLabel: "Verification code",
      codePlaceholder: "Enter the 6-digit code",
      submit: "Verify email",
      verifying: "Verifying…",
      verified: "Verified. Redirecting to the dashboard…",
      backToSignIn: "Back to sign in",
      noCodeHint: "Didn’t receive a code? Check spam.",
      errorGeneric: "Verification failed. Please try again.",
    },
  },

  dashboard: {
    overview: { kicker: "Overview", title: "Overview" },
    lots: { kicker: "Traceability", title: "Lots" },
    rfqs: { kicker: "Market", title: "RFQs" },
    contracts: { kicker: "Trust Payments", title: "Contracts & Escrow" },
    settings: { kicker: "Profile", title: "Settings" },
  },

  settings: {
    account: {
      title: "Account",
      subtitle: "View your account details.",
      name: "Name",
      email: "Email",
      role: "Role",
    },

    profile: {
      title: "Profile",
      subtitle: "Update your personal and organisation details.",
      fullName: "Full name",
      companyName: "Company / Cooperative name",
      country: "Country",
      city: "City",
      phone: "Phone",
      phonePrefix: "Prefix",
      phoneNumber: "Number",
      saveProfile: "Save profile",
      saved: "Profile saved.",
    },

    ui: {
      title: "Interface",
      subtitle: "UI preferences for this browser.",
      denseTables: "Dense tables",
      showDemoHints: "Show demo hints",
      savePrefs: "Save preferences",
      resetPrefs: "Reset preferences",
      savedPrefs: "Preferences saved in this browser.",
      resetDone: "Preferences reset.",
    },
  },

  footer: {
    tagline: "Traceability • Quality • Export trust",
    howItWorks: "How it works",
    standards: "Standards",
    contact: "Contact",
    copyright: "MVP built for the hackathon.",
  },

  errors: {
    notFoundTitle: "Page not found",
    notFoundSubtitle: "This link doesn’t exist or may have been removed.",
    forbiddenTitle: "Access forbidden",
    forbiddenSubtitle: "You don’t have permission to view this page.",
  },
} satisfies Messages;