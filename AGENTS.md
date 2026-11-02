# AGENTS.md

This file defines project instructions for the NestJS backend in this directory.

## Project context

- App type: NestJS + TypeScript API
- Persistence: MongoDB with Mongoose
- Package manager: pnpm; follow the existing lockfile
- API prefix: `/api/v1`

## Working rules

- Follow the existing module boundaries and keep feature-specific code inside `src/modules/<feature>`.
- Keep controllers focused on HTTP concerns, services on application logic, and repositories on persistence.
- Reuse existing DTO, domain, mapper, and exception patterns before introducing new abstractions.
- Validate request data with the project’s `class-validator` conventions.
- Use explicit TypeScript types; avoid `any` unless there is no reasonable alternative.
- Follow SOLID Principles
- Keep NestJS providers, injection tokens, imports, and exports consistent. When injecting a provider from another module, ensure that module exports the exact token and the consuming module imports it.
- Never trust client-supplied identity or verification claims. Verify Firebase ID tokens with Firebase Admin and derive the user ID and verified contact details from verified Firebase data.
- Read secrets and environment-specific settings from configuration; never commit credentials or log tokens, passwords, or other secrets.
- Surface failures with the project’s standard NestJS exceptions and logging; do not silently swallow errors.

## Validation

Before finalizing a change, run the smallest relevant check:

- `pnpm build`
- `pnpm test -- --runInBand`
- `pnpm lint`
- `pnpm test:e2e -- --runInBand`

Use the existing package scripts and avoid installing dependencies unless a manifest changes or a required tool is missing.

## When editing files

- Read the target file and nearby module code before changing it.
- Update related imports, module providers/controllers, and exports when adding or moving code.
- Keep changes scoped to the requested feature and preserve existing API behavior unless the change explicitly requires otherwise.
- Update directly related documentation when behavior or setup changes.

## Default response style

- Be concise and practical.
- Briefly summarize changes and validation results.
