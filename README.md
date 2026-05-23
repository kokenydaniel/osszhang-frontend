# Összhang Frontend

Web app for **Összhang** — a family money app.  
You can track income, bills, debts, savings, meters, and small business orders in one place.

This repo is the **frontend**. The API lives in the [backend repo](https://github.com/kokenydaniel/osszhang-backend).

---

## Live demo

| | Link |
|---|---|
| **App** | [osszhang-frontend.vercel.app](https://osszhang-frontend.vercel.app) |
| **API** | [osszhang-backend.fly.dev/api](https://osszhang-backend.fly.dev/api) |

### Try the demo

Use these test accounts (same password for both):

| Username | Password | Role |
|----------|----------|------|
| `demo` | `demo1234` | Admin — full access |
| `viki` | `demo1234` | Member — partner in utility split |

The demo household is called **Összhang Demo**.

---

## Users and households

- **Register** — creates a new household and the first admin user.
- **Login** — username and password only.
- **New members** — the admin adds them in **Settings → Household**. The admin sets username, temporary password, role, and module access.
- There is **no invite code** and no self-join link for members.

---

## What you can do

- **Dashboard** — quick view of your money
- **Budget** — income and expenses by month
- **Utilities** — shared bills (electricity, gas, water, internet)
- **Debts** — loans and repayments
- **Savings** — savings goals and ledger
- **Meters** — meter readings (kWh, m³, etc.)
- **Business** — small shop orders
- **Settings** — household name, members, modules, profile

The UI is in **Hungarian**. This README is in English.

---

## Tech stack

| Tool | Version |
|------|---------|
| [Next.js](https://nextjs.org) | 16 |
| [React](https://react.dev) | 19 |
| [TypeScript](https://www.typescriptlang.org) | 5 |
| [Tailwind CSS](https://tailwindcss.com) | 4 |
| [Zustand](https://zustand.docs.pmnd.rs) | state |
| [dayjs](https://day.js.org) | dates |
| [Recharts](https://recharts.org) | charts |

Auth uses a **Bearer token** in the browser. The app talks to the Laravel API over REST.

---

## Requirements

- **Node.js** 20 or newer
- **npm** (comes with Node)
- Backend on your computer **or** the live Fly API

---

## Run on your computer

### 1. Install packages

```bash
npm install
```

### 2. Set the API URL (optional)

For local development, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

If you skip this file, dev mode uses `http://localhost:8000/api`.

In **production** (Vercel), the app uses `https://osszhang-backend.fly.dev/api` when `NEXT_PUBLIC_API_URL` is not set.

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The backend must run on port **8000**, or set `NEXT_PUBLIC_API_URL` to the live API.

---

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |

---

## Project folders

```
src/
├── app/              # Pages (Next.js App Router)
│   ├── (auth)/       # Login, register
│   └── (dashboard)/  # Main app pages
├── components/       # UI and layout
├── lib/              # API client, dates, helpers
└── stores/           # Zustand state (auth, budget, etc.)
```

Main files:

- `src/lib/api-client/` — HTTP client and API modules
- `src/stores/useAuthStore.ts` — login, session, household
- `src/components/auth/AuthProvider.tsx` — loads session on start

---

## Deploy on Vercel

1. Import this repo on [Vercel](https://vercel.com).
2. Set an environment variable if you use your own API:

   ```env
   NEXT_PUBLIC_API_URL=https://your-api.example.com/api
   ```

3. Deploy. Vercel runs `npm run build` automatically.

If you use the default Fly backend, you can leave `NEXT_PUBLIC_API_URL` empty in production.

---

## How login works

1. User enters username and password on `/login`.
2. App sends `POST /api/login` to the backend.
3. Backend returns a token and user data.
4. Token is saved in `localStorage`.
5. User goes to the dashboard.

Protected pages check the session. If there is no user, the app sends you to `/login`.

---

## Related repo

- **Backend (Laravel API):** [github.com/kokenydaniel/osszhang-backend](https://github.com/kokenydaniel/osszhang-backend)

---

## License

Private project. All rights reserved.
