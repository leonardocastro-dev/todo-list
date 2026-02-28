# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (v10.8.1+).

```bash
pnpm dev              # Start dev server (Nuxt, port 3000)
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm lint             # ESLint
pnpm prettier         # Check formatting
pnpm prettier:fix     # Fix formatting
pnpm typecheck        # TypeScript type checking
pnpm deploy           # Full CI pipeline: prettier + lint + typecheck + build
```

Firebase Functions (from `functions/` directory):

```bash
npm run build         # Compile TypeScript
npm run serve         # Build + start Firebase emulators
npm run deploy        # Deploy functions to Firebase
```

There are no tests configured in this project.

## Code Style

- **Prettier:** single quotes, no semicolons, no trailing commas
- **ESLint:** `@typescript-eslint/no-explicit-any` is off; `vue/html-self-closing` is off
- Prettier rules are enforced via ESLint (`prettier/prettier: 'error'`)

## Architecture

Full-stack **Nuxt 3** workspace-based task management app with **Firebase** backend.

### Stack

- **Frontend:** Vue 3 + Nuxt 3, Pinia stores, TailwindCSS 4, Shadcn-vue (Reka UI)
- **Backend:** Nuxt server routes (`server/api/`), Firebase Admin SDK
- **Database:** Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **Email:** Vue Email templates + Resend
- **Validation:** Vee-Validate + Zod

### Data Model Hierarchy

```
workspaces/{id}
  ├── members/{userId}          # permissions, role
  ├── projects/{id}             # title, emoji, assigneeIds[]
  │     └── members/{userId}    # project-level assignments
  ├── tasks/{id}                # status, priority, dueDate, projectId, assigneeIds[], assignments{}

users/{uid}                     # public profile (username, avatar)
users_private/{uid}             # private data (email)
invites/{id}                    # workspace invitations
```

### Routing

File-based routing via Nuxt. Workspace routes (`/:workspace/**`) have SSR disabled in `nuxt.config.ts`. Landing page and auth pages are SSR-enabled.

Key dynamic routes: `pages/[workspace]/` for workspace context, `pages/[workspace]/projects/[id].vue` for project detail, `pages/invite/[token].vue` for invite acceptance.

### State Management (Pinia)

Three stores in `stores/`:

- **workspaces.ts** — workspace CRUD, current workspace tracking
- **projects.ts** — project CRUD with member assignment, permission-based access
- **tasks.ts** (largest, ~950 lines) — multi-project task caching keyed by `projectId`, scope-aware filtering (`all` vs `assigneds`), optimistic updates with rollback, advanced filters (status, priority, due date, search)

### Permission System

Hierarchical: Owner > Admin > granular permissions (`manage-projects`, `create-tasks`, `edit-tasks`, etc.). Defined in `constants/permissions.ts`, enforced server-side in `server/utils/permissions.ts`. Project assignments can override workspace-level permissions. Special case: task assignees can toggle task status without edit permission.

### Dual Mode (Guest / Authenticated)

All stores support guest mode using `localStorage` when no user is logged in. Authenticated mode uses Firebase. The pattern throughout stores is:

```typescript
if (userId) {
  /* Firebase operations */
} else {
  /* localStorage operations */
}
```

### Server API Pattern

All mutations go through `server/api/` routes which validate permissions via `server/utils/permissions.ts` before writing to Firestore. Client reads can go directly to Firestore (secured by `firestore.rules`).

### Composables

- `useAuth.ts` — singleton auth state, profile management, registration with rollback
- `useWorkspace.ts` — workspace context for layout
- `useMembers.ts` — member management
- `useProjectPermissions.ts` — project-level permission resolution
- `useTaskStatusSync.ts` — debounced task status syncing

### UI Components

Shadcn-vue components live in `components/ui/` (configured in `components.json`, New York style, slate base color). Feature components are organized by domain: `components/tasks/`, `components/projects/`, `components/members/`, `components/workspaces/`, `components/settings/`.

### Environment Variables

Firebase config uses `NUXT_FIREBASE_*` prefix for public runtime config. Server-side: `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `NUXT_RESEND_API_KEY`. See `nuxt.config.ts` `runtimeConfig` for the full list.
