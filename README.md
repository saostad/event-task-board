# Event Task Board

A mobile-first **PWA** for coordinating event tasks (weddings, parties, community events, etc.).

- Create an event and add tasks with title, instructions, **location address**, **file attachments**, deadline, and how many people are needed.
- Share a link or short code.
- People join and **volunteer / claim** tasks themselves.
- Everyone sees in real time what is still open, who is responsible, and what is done.

Built with **React + Vite + TypeScript + Tailwind + Firebase (Auth + Firestore + Storage)**.

## Features

- Create event → get shareable link + 6-character code
- Tasks: title, description/instructions, **location/address**, **attachments** (images, PDFs, docs), deadline, capacity
- Claim / unclaim / mark done / reopen
- Filters: All / Open / Claimed / Done / My tasks
- Owner can add & delete tasks
- Anonymous Firebase Auth + display name
- Installable PWA (Add to Home Screen)
- Real-time updates via Firestore
- Files stored in Firebase Storage

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/saostad/event-task-board.git
cd event-task-board
npm install
```

### 2. Firebase setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project (or use existing).
2. Enable **Authentication** → Sign-in method → **Anonymous**.
3. Create a **Firestore** database.
4. Enable **Storage** (start in production mode or test mode).
5. Go to Project settings → Your apps → Add web app → copy the config.
6. Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

7. **Firestore Security Rules** — paste these in the Rules tab:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.createdBy == request.auth.uid;

      match /tasks/{taskId} {
        allow read: if true;
        allow create, update, delete: if request.auth != null;
      }
    }
  }
}
```

8. **Storage Security Rules** — paste these in Storage → Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /events/{eventId}/tasks/{taskId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024; // 10MB max
    }
  }
}
```

### 3. Run

```bash
npm run dev
```

Open the URL shown (usually http://localhost:5173).

### 4. Build for production / PWA

```bash
npm run build
npm run preview
```

You can deploy the `dist/` folder to **Firebase Hosting**, Vercel, Netlify, etc.

## How to use

1. Open the app → **Create new event** → enter a name (e.g. “Sara & Ali Wedding”).
2. You become the owner. Tap **+** to add tasks.
3. For each task you can set:
   - Title & instructions
   - **Location / address** (tappable link to Google Maps)
   - **Attachments** (photos, PDFs, documents — max 5 files, 10MB each)
   - Deadline and how many people are needed
4. Share the page link or the short code with family/friends.
5. They open the link, enter their name once, then claim tasks.
6. Everyone sees live updates of what is taken and what is still open.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- React Router
- Firebase Auth (Anonymous) + Firestore + Storage
- vite-plugin-pwa (manifest + service worker)
- lucide-react, clsx

## Project structure

```
src/
  components/     # TaskCard, AddTaskForm, NamePrompt, EventBoard
  hooks/          # useAuth, useEvent
  lib/            # firebase.ts, utils.ts
  pages/          # Home
  types/
  App.tsx
  main.tsx
  index.css
```

## Next ideas (easy to add)

- Categories / tags for tasks
- Comments on tasks
- Email or push reminders for deadlines
- Export CSV of responsibilities
- Better owner transfer / multi-admin
- Persian (Farsi) UI

---

Made for real-world events where assignment by the organizer is hard and volunteering works better.
