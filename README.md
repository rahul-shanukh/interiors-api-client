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
