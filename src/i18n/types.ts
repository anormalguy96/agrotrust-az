// src/i18n/types.ts
export type Language = "en" | "az";

export type Messages = {
  language: {
    code: Language;
    labelShort: string;
    labelLong: string;
  };

  nav: {
    home: string;
    howItWorks: string;
    standards: string;
    forFarmers: string;
    forBuyers: string;
    contact: string;
    signIn: string;
    signUp: string;
    dashboard?: string;
    settings?: string;
    signOut?: string;
  };

  common: {
    loading: string;
    save: string;
    saving: string;
    cancel: string;
    back: string;
    edit: string;
    update: string;
    delete: string;
    confirm: string;
    close: string;
    yes: string;
    no: string;
    optional: string;
    required: string;
    search: string;
    reset: string;
  };

  auth: {
    signIn: {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      role: string;
      submit: string;
      busy: string;
      noAccount: string;
      errorGeneric: string;
    };
    signUp: {
      title: string;
      subtitle: string;
      role: string;
      name: string;
      organisation: string;
      email: string;
      phone: string;
      password: string;
      submit: string;
      busy: string;
      haveAccount: string;
      passwordMin: string;
      profileHint: string;
      errorGeneric: string;
    };
    verifyEmail: {
      title: string;
      subtitle: string;
      codeLabel: string;
      codePlaceholder: string;
      submit: string;
      verifying: string;
      verified: string;
      backToSignIn: string;
      noCodeHint: string;
      errorGeneric: string;
    };
  };

  dashboard: {
    overview: { title: string; kicker: string };
    lots: { title: string; kicker: string };
    rfqs: { title: string; kicker: string };
    contracts: { title: string; kicker: string };
    settings: { title: string; kicker: string };
  };

  settings: {
    account: {
      title: string;
      subtitle: string;
      name: string;
      email: string;
      role: string;
    };
    profile: {
      title: string;
      subtitle: string;
      fullName: string;
      companyName: string;
      country: string;
      city: string;
      phone: string;
      phonePrefix: string;
      phoneNumber: string;
      saveProfile: string;
      saved: string;
    };
    ui: {
      title: string;
      subtitle: string;
      denseTables: string;
      showDemoHints: string;
      savePrefs: string;
      resetPrefs: string;
      savedPrefs: string;
      resetDone: string;
    };
  };

  footer: {
    tagline: string;
    howItWorks: string;
    standards: string;
    contact: string;
    copyright: string;
  };

  errors: {
    notFoundTitle: string;
    notFoundSubtitle: string;
    forbiddenTitle: string;
    forbiddenSubtitle: string;
  };
};