# Clean Build (PNPM + TypeScript)

```bash
Remove-Item -Recurse -Force dist
Remove-Item -Force tsconfig.build.tsbuildinfo
Remove-Item -Recurse -Force node_modules
Remove-Item -Force pnpm-lock.yaml
pnpm install
pnpm build
```

## Purpose

- `dist` → Remove compiled files.
- `tsconfig.build.tsbuildinfo` → Clear TypeScript incremental cache.
- `node_modules` → Reinstall dependencies.
- `pnpm-lock.yaml` → Regenerate dependency lock file (use only if needed).
- `pnpm install` → Install packages.
- `pnpm build` → Rebuild the project.
- `pnpm start:dev` → Runpnpm start:dev the project.

$env:GOOGLE_APPLICATION_CREDENTIALS="D:\firebase-keys\jc-interiors-firebase-admin.json"
Test-Path $env:GOOGLE_APPLICATION_CREDENTIALS

cd "C:\Users\techp\Projects\Interiors\Backend\interiors-api-client"
pnpm start:dev
