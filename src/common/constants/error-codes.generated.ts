// 🛑 AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Update files in the /errors folder and run the generator script to change this file.

export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'AUTH_001', // Invalid email or password.
  TOKEN_EXPIRED: 'AUTH_002', // Authentication token has expired.
} as const;

export const CommonErrorCode = {
  UNKNOWN_ERROR: 'COMMON_001', // An unexpected error occurred.
  VALIDATION_ERROR: 'COMMON_002', // Input validation failed.
  RATE_LIMIT_EXCEEDED: 'COMMON_003', // Rate limit exceeded. Please try again later.
  UPLOAD_RATE_LIMIT_EXCEEDED: 'COMMON_004', // Upload rate limit exceeded. Please try again later.
  LOGIN_RATE_LIMIT_EXCEEDED: 'COMMON_005', // Login rate limit exceeded. Please try again later.
} as const;

export const MediaErrorCode = {
  INVALID_FILE_TYPE: 'MEDIA_001', // File type not allowed
  INVALID_FILE_NAME: 'MEDIA_002', // Filename contains invalid characters
  PRESIGNED_URL_FAILED: 'MEDIA_003', // Failed to generate upload URL
  STORAGE_UNAVAILABLE: 'MEDIA_004', // Storage service is currently unavailable
  STORAGE_PROVIDER_NOT_SUPPORTED: 'MEDIA_005', // Storage provider not supported
  ASSET_NOT_FOUND: 'MEDIA_005', // Media asset not found
  ASSET_ALREADY_CONFIRMED: 'MEDIA_006', // Media asset already confirmed
} as const;

export const NotificationErrorCode = {
  INVALID_CONTEXT: 'NOTIFICATION_001', // Notification context is invalid or incomplete.
  TEMPLATE_NOT_FOUND: 'NOTIFICATION_002', // Template file could not be found.
  TEMPLATE_COMPILE_FAILED: 'NOTIFICATION_003', // Failed to compile notification template.
  PROVIDER_UNAVAILABLE: 'NOTIFICATION_004', // Notification provider is offline.
  PROVIDER_NOT_FOUND: 'NOTIFICATION_005', // No provider routing found for this notification type.
  DELIVERY_FAILED: 'NOTIFICATION_006', // Provider failed to deliver the notification.
  RATE_LIMITED: 'NOTIFICATION_007', // Recipient has exceeded the notification rate limit.
  DUPLICATE_DETECTED: 'NOTIFICATION_008', // Duplicate notification detected within the time window.
} as const;

export const UserErrorCode = {
  NOT_FOUND: 'USER_001', // User does not exist in the system.
  INACTIVE: 'USER_002', // This user account is deactivated.
  ACCOUNT_ALREADY_EXISTS: 'USER_003', // An account with this username already exists.
} as const;

