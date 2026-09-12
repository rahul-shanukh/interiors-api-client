export const CACHE_KEYS = {
  // Rate limiting
  RATE_LIMIT_IP: "ratelimit:quote:ip",
  RATE_LIMIT_EMAIL: "ratelimit:quote:identity",
  RATE_LIMIT_PHONE: "ratelimit:quote:phone",
  RATE_LIMIT_GLOBAL: "ratelimit:quote:global",

  // Duplicate detection
  QUOTE_SUBMISSION_LOCK: "quote_submission_lock",

  // Other features
  CUSTOMER_CACHE: "customer",
  PRICING_CACHE: "pricing",
};
