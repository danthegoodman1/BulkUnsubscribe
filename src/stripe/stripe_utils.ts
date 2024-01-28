import stripe from "stripe"

export function isStripeConnectSetup(account: stripe.Account) {
  return (
    !!account.external_accounts &&
    account.external_accounts.data.length > 0 &&
    account.payouts_enabled &&
    account.capabilities?.transfers === "active"
  )
}

export const stripeCountries = {
  AU: "Australia",
  AT: "Austria",
  BE: "Belgium",
  BR: "Brazil",
  BG: "Bulgaria",
  CA: "Canada",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  DE: "Germany",
  GI: "Gibraltar",
  GR: "Greece",
  HK: "Hong Kong",
  HU: "Hungary",
  IN: "India",
  IE: "Ireland",
  IT: "Italy",
  JP: "Japan",
  LV: "Latvia",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  MY: "Malaysia",
  MT: "Malta",
  MX: "Mexico",
  NL: "Netherlands",
  NZ: "New Zealand",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  SG: "Singapore",
  SK: "Slovakia",
  SI: "Slovenia",
  ES: "Spain",
  SE: "Sweden",
  CH: "Switzerland",
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "United States",
}

export type StripeCountryCode = keyof typeof stripeCountries
