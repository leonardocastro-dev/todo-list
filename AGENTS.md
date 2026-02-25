# Repository Guidelines

## Project Structure & Module Organization
- `pages/`, `layouts/`, `components/`, `composables/`, and `stores/` contain the Nuxt 3 app (Vue 3 + Pinia).
- `server/api/` and `server/utils/` contain Nitro server endpoints and backend helpers.
- `assets/` and `public/` hold static assets and global styles (`assets/css/main.css`).
- `types/`, `constants/`, `utils/`, and `lib/` contain shared types and utility logic.
- `functions/` is a separate Firebase Cloud Functions TypeScript project.

## Build, Test, and Development Commands
- `pnpm dev`: start local Nuxt development server with HMR.
- `pnpm build`: build production bundle.
- `pnpm preview`: run the built app locally.
- `pnpm lint`: run ESLint across the app.
- `pnpm typecheck`: run Nuxt/TypeScript checks.
- `pnpm prettier` / `pnpm prettier:fix`: check or apply formatting.
- `pnpm deploy`: run formatting + lint + typecheck + production build.
- `cd functions && npm run build` / `npm run lint`: build/lint Cloud Functions.

## Coding Style & Naming Conventions
- Use 2-space indentation, LF line endings, UTF-8 (`.editorconfig`).
- Prettier rules: single quotes, no semicolons, no trailing commas (`.prettierrc.json`).
- Prefer TypeScript in app and server code.
- Vue SFC and component files use PascalCase (for example, `TaskItem.vue`).
- Composables use `useXxx.ts` naming; stores are grouped by domain (for example, `stores/tasks.ts`).
- Keep API route filenames aligned with endpoint paths (for example, `server/api/tasks/[taskId].patch.ts`).

## Testing Guidelines
- There is no dedicated automated test suite in the root app yet.
- Minimum validation before PR: `pnpm lint`, `pnpm typecheck`, and manual flow checks for impacted pages.
- For `functions/`, run `npm run lint` and `npm run build` before deployment.
- If adding tests, place them near related modules with clear names like `feature-name.spec.ts`.

## Commit & Pull Request Guidelines
- Follow concise, imperative commit subjects as seen in history (for example, `Fix add progress bar`).
- Keep commits focused on one change area; avoid mixing UI, API, and infra updates without reason.
- PRs should include: summary, affected routes/components, validation steps run, and screenshots for UI changes.
- Link related issues/tasks and mention env or Firebase rule/index changes explicitly.

## Security & Configuration Tips
- Never commit secrets; keep runtime config in `.env` and Firebase config files.
- Review `firestore.rules` and `firestore.indexes.json` whenever data access patterns change.
