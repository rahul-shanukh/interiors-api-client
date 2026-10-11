# Quotes Module

## Overview

The quotes module handles quote creation, pricing rules, persistence, and notification flow.

## Idempotent quote requests

`POST /quotes/request` requires a UUID v4 `Idempotency-Key`. The key is scoped
to the normalized caller email and operation name (`quote.create`), so a key
cannot expose another caller's response or collide with a different operation.
Reusing a key with changed request data returns HTTP 409. The quote, completed
response, and notification outbox job are committed in the same MongoDB
transaction. Email dispatch is retried from the outbox with exponential backoff.

Idempotency records are protected for 24 hours; MongoDB's TTL index removes
expired records asynchronously, so retries beyond that window may create a new
quote. Configure `IDEMPOTENCY_SECRET` (or `CUSTOMER_KEY_SECRET`) consistently
across all API instances so caller scoping remains stable.

## Main Areas

- `application/` — quote workflow and service logic
- `controllers/` — REST endpoints for quotes
- `domain/` — pricing strategies and business rules
- `infrastructure/` — persistence and notification integrations

## Local Development

Run the backend locally:

```powershell
pnpm start:dev
```
## For Extra Port runnings

taskkill /f /im node.exe

## Testing Quote Notifications with Ngrok

Quote notifications are typically sent to a callback or webhook during development. Since your local API is not publicly reachable, Ngrok exposes it over HTTPS so the external service can call it.

### Steps

1. Start the backend:

```powershell
pnpm start:dev
```

2. Start Ngrok for the app port:

```powershell
ngrok http 3000
```

3. Use the generated HTTPS URL as the notification target.

4. Trigger a quote action and verify the request reaches your local app.

### Notes

- If the notification uses a secret or signature, use the same value in your local config.
- If the external service allows only specific hosts, add the Ngrok domain there.
