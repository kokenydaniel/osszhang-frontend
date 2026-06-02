# PenzPilot frontend — agent guide

**Start here:** `src/config/config.ts`

## Folder map

| Path | Role |
|------|------|
| `lib/api-client/` | **Only** HTTP: clients, response, type-guards |
| `calculations/` | Pure domain math per module |
| `settings/` | `resolve*Settings()` from household + `config.moduleDefaults` |
| `config/` | Static: branding, help, subscription rules, billing plans, onboarding |
| `utils/` | Pure: dates, formatters, loadable status, roles, unwrap |
| `helpers/` | Loaders, access gates, dashboard glue, AI, session reset |
| `stores/` | Zustand cache + `fetch` — state/actions only |
| `components/{domain}/` | Feature UI |
| `components/design/`, `ui/`, `layout/` | Shared UI + shell |
| `hooks/` | Page composition when needed |

## Layout rules

- `lib/` = **api-client only** (no other top-level files under `lib/`)
- Static product data → `config/`
- Pure format/math → `utils/` or `calculations/`
- UI side-effects / loaders → `helpers/`

## Stores

- `useEffect(() => store.fetch(...))` on pages
- Readiness: `helpers/store-ready.ts`
- No helper exports inside store files

## Rules

- New static data → `config/`
- Never add top-level files under `lib/` except `api-client/`
- Forms: react-hook-form; no `*UiContext`
- Kebab-case files; tuple API `[status, body]`; no `any`

## Workflow

1. Thin route → feature page
2. Tuple API via `*Client` in `lib/api-client/`
3. Match existing patterns in the target module folder
