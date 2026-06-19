// src/infrastructure/notifications/core/constants/notification.constants.ts

// Injection tokens
export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';
export const NOTIFICATION_PROVIDER = 'NOTIFICATION_PROVIDER';
export const NOTIFICATION_TRACKER = 'NOTIFICATION_TRACKER';
export const NOTIFICATION_QUEUE = 'NOTIFICATION_QUEUE';

// Queue names
export const NOTIFICATION_QUEUE_NAME = 'notifications';
export const NOTIFICATION_MARKETING_QUEUE = 'notifications-marketing';

// Rate limits — notification specific
export const MAX_EMAILS_PER_USER_PER_HOUR = 10;
export const MAX_SMS_PER_USER_PER_DAY = 5;
export const MAX_LOCKOUT_EMAILS_PER_USER_PER_HOUR = 1;
export const MAX_MARKETING_EMAILS_PER_USER_PER_DAY = 3;

// Retry config
export const MAX_NOTIFICATION_RETRIES = 3;
export const NOTIFICATION_RETRY_DELAY_MS = 5000;

// Template paths
export const TEMPLATE_BASE_LAYOUT = 'layouts/base';
export const TEMPLATE_ACCOUNT_LOCKOUT = 'auth/account-lockout';
export const TEMPLATE_OTP = 'auth/otp';
export const TEMPLATE_UPLOAD_CONFIRMED = 'uploads/upload-confirmed';
export const TEMPLATE_QUOTE_RECEIVED = 'quotes/quote-received';
export const TEMPLATE_LEAD_FOLLOWUP = 'marketing/follow-up';
export const TEMPLATE_RE_ENGAGEMENT = 'marketing/re-engagement';
export const TEMPLATE_PROMOTION = 'marketing/promotion';
export const TEMPLATE_SYSTEM_ERROR = 'operational/system-error';
export const TEMPLATE_STORAGE_WARNING = 'operational/storage-warning';

// Priority weights
export const PRIORITY_WEIGHTS = {
  high: 1,
  normal: 5,
  low: 10,
} as const;
