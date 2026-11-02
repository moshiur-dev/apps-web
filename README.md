# Canopy Web

Frontend for **Canopy**, a forest-themed ClickUp-style project manager.
Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · dnd-kit.

The backend lives in its own repo (`apps-api`). This app needs it running to log in and
load data.

## Features
- Marketing landing page, login, register, invite-accept page (`/invite/<token>`)
- Dark forest theme by default, light mode toggle
- Sidebar: workspace switcher, Spaces → Folders → Lists, rename/delete menus
- **Board** (drag between statuses), **List** (grouped by status), **Calendar** (drag to reschedule)
- Task drawer: status, priority, assignee, dates, estimate, tags, subtasks, comments with `@Name`
- Inbox, My Tasks, Dashboard charts, Team Members (invite / change role / remove), Activity audit log
- Global search (`Ctrl K`) and filters (text/#tag, priority, assignee, hide completed)
- UI adapts to the user's role (Owner / Admin / Member / Guest). The API enforces the same rules.

## Setup

```bash
npm install
cp .env.example .env.local   # point it at your API
npm run dev                  # http://localhost:3000
```

### Environment variables (`.env.local`)

| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Base URL of the Canopy API, including `/api` |

The API must allow this site's URL in its `WEB_ORIGIN` setting (CORS).

## Scripts
- `npm run dev` starts the dev server
- `npm run build` creates a production build
- `npm run start` serves the production build
- `npm run lint` runs ESLint

## Customising
- Product name: `src/lib/brand.ts`
- Theme colours (dark & light): CSS variables at the top of `src/app/globals.css`

## Deploying to Vercel
Import the repo in Vercel, keep the default Next.js settings, and set
`NEXT_PUBLIC_API_URL` to your deployed API (e.g. `https://your-api.onrender.com/api`).
