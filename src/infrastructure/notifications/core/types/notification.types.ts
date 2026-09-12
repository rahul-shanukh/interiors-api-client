export type NotificationType = 'email' | 'sms' | 'push';

export type NotificationPriority = 'low' | 'medium' | 'high';

export type NotificationStatus =
  | 'pending'
  | 'delivered'
  | 'failed'
  | 'processing'
  | 'scheduled'
  | 'bounced';

export type NotificationCategory =
  | 'transactional'
  | 'promotional'
  | 'reminder'
  | 'alert'
  | 'auth'
  | 'quotes'
  | 'operational'
  | 'marketing';

export type EmailProvider = 'sendgrid' | 'ses' | 'gmail' | 'resend';

export type SmsProvider = 'twilio' | 'nexmo' | 'plivo';

export type PushProvider = 'firebase' | 'onesignal' | 'expo' | 'fcm';

export type NotificationProvider = EmailProvider | SmsProvider | PushProvider;
