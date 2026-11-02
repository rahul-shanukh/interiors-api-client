In production, it depends on where you host NestJS.

If you deploy NestJS to Google Cloud Run, the usual approach is:

1. Give the Cloud Run service a service account.
2. Grant that account the Firebase permissions your backend needs.
3. Keep your existing applicationDefault() code. Cloud Run provides the credentials to the running server automatically, so you do not upload a private-key JSON or set GOOGLE_APPLICATION_CREDENTIALS.
