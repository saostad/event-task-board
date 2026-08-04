# Taskly

A mobile-first **PWA** for coordinating event tasks (weddings, parties, community events, etc.).

- **Google is the only sign-in method** for everyone (owner and contributors).
- Event owner creates the event and gets a **shareable invite link**.
- Contributors open the link, sign in with Google, and can claim tasks.
- Tasks support title, instructions, **location**, **phone**, **file attachments**, **voice notes**, deadline, and capacity.

Built with **React + Vite + TypeScript + Tailwind + Firebase (Google Auth + Firestore + Storage)**.

## Features

- Google-only authentication
- Create event → shareable invite link (`/e/...`)
- Tasks: title, description, location, phone, attachments, voice notes, deadline, capacity
- Claim / unclaim / mark done / reopen
- Filters: All / Open / Claimed / Done / My tasks
- Contributors management (remove / unblock)
- In-app toasts when new tasks are added
- Installable PWA
- Real-time updates via Firestore

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/saostad/event-task-board.git
cd event-task-board
npm install
```

### 2. Firebase setup

1. Create (or open) a project in [Firebase Console](https://console.firebase.google.com/).
2. **Authentication** → Sign-in method → enable **Google**.
3. Create a **Firestore** database.
4. Enable **Storage**.
5. Project settings → Your apps → Add web app → copy the config into `.env`:

```bash
cp .env.example .env
```

6. Under Authentication → Settings → **Authorized domains**, add your domain.

### 3. Run

```bash
npm run dev
```

### 4. Build & deploy

```bash
npm run build
```

Deploy `dist/` to Firebase Hosting.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- React Router
- Firebase Auth (Google only) + Firestore + Storage + Cloud Messaging
- vite-plugin-pwa
- lucide-react, clsx

---

Made for real-world events where volunteering works better than assigning everything yourself.
