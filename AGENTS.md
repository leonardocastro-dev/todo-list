# Repository Guidelines

## Project Structure & Module Organization
- Nuxt 3 app code is at the repository root: `pages/`, `components/`, `layouts/`, `composables/`, `stores/`, `server/api/`, and `server/utils/`.
- UI primitives live in `components/ui/`; feature components are grouped by domain (for example `components/tasks/`, `components/projects/`, `components/members/`).
- Firebase client setup is in `plugins/firebase.ts`; shared types are in `types/`; cross-cutting utilities are in `utils/` and `constants/`.
- Cloud Functions are isolated in `functions/src/` and compile to `functions/lib/`.
- Use `assets/` for processed styles/images and `public/` for static files served directly.

## Build, Test, and Development Commands
- `pnpm dev`: run the Nuxt development server.
- `pnpm build`: create a production build.
- `pnpm preview`: serve the production build locally.
- `pnpm typecheck`: run Nuxt/TypeScript checks.
- `pnpm prettier` and `pnpm prettier:fix`: check or apply formatting.
- `cd functions && npm run lint`: lint Firebase Functions code.
- `cd functions && npm run build`: compile Functions TypeScript.
- `cd functions && npm run serve`: build and run Firebase emulators for functions.

## Coding Style & Naming Conventions
- Follow `.editorconfig`: 2-space indentation, LF line endings, UTF-8, and final newline.
- Prettier rules (`.prettierrc.json`): single quotes, no semicolons, no trailing commas.
- Prefer TypeScript across app/server code and keep exported interfaces explicit.
- Use PascalCase for Vue SFCs (example: `TaskItem.vue`), `useX.ts` for composables, and descriptive noun-based store names (example: `stores/tasks.ts`).
- Keep Nuxt API route file naming consistent with HTTP method suffixes, such as `server/api/tasks/[taskId].patch.ts`.

## Testing Guidelines
- There is no root `test` script or enforced coverage threshold yet.
- Minimum pre-PR checks: `pnpm typecheck && pnpm prettier && (cd functions && npm run lint && npm run build)`.
- Manually validate key flows after changes: authentication, workspace/project/task CRUD, member assignment, and invite acceptance.

## Commit & Pull Request Guidelines
- Recent commits are short and imperative (many `Fix ...` messages). Keep that imperative style, but prefer scoped clarity, for example: `fix(tasks): guard empty assignees`.
- Keep commits focused; avoid bundling unrelated UI, API, and Firebase rule/function changes.
- PRs should include: summary of intent, affected paths, manual verification steps, linked issue (if available), and screenshots/GIFs for UI changes.
- Explicitly call out changes to Firebase-impacting files (`firestore.rules`, `firestore.indexes.json`, `functions/src/*`).
