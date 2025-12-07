export const BRAND = {
  productName: "AgroTrust AZ",
  tagline: "B2B Quality Certification & Export Marketplace"
} as const;

export const DEFAULTS = {
  currency: "USD",
  weightUnit: "kg",
  country: "Azerbaijan",
  enableMocksFallback: true
} as const;

export const EXPORT_TARGET_MARKETS = [
  "UAE",
  "Russia",
  "EU"
] as const;

export const CERTIFICATION_CLAIMS = [
  "GlobalG.A.P",
  "Organic",
  "HACCP-aligned processes",
  "Pesticide Residue Report",
  "Traceability Batch Records"
] as const;

export const UI = {
  pagination: {
    defaultPageSize: 10,
    pageSizes: [10, 20, 50] as const
  },
  dateFormat: "YYYY-MM-DD"
} as const;