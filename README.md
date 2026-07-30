# Event Task Board

A mobile-first **PWA** for coordinating event tasks (weddings, parties, community events, etc.).

- **Google is the only sign-in method** for everyone (owner and contributors).
- Event owner creates the event and gets a **shareable link + short code**.
- Contributors open the link, sign in with Google, and can claim tasks.
- Tasks support title, instructions, **location**, **file attachments**, deadline, and capacity.

Built with **React + Vite + TypeScript + Tailwind + Firebase (Google Auth + Firestore + Storage)**.

## Features

- Google-only authentication (no anonymous, no passwords)
- Create event → shareable link (`/e/...`) + 6-character code
- Tasks: title, description, location/address, attachments, deadline, capacity
- Claim / unclaim / mark done / reopen
- Filters: All / Open / Claimed / Done / My tasks
- Owner can add & delete tasks
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
   (You can disable Anonymous if it was on before.)
3. Create a **Firestore** database.
4. Enable **Storage**.
5. Project settings → Your apps → Add web app → copy the config into `.env`:

```bash
cp .env.example .env
```

6. **Firestore rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.createdBy == request.auth.uid;

      match /tasks/{taskId} {
        allow read: if request.auth != null;
        allow create, update, delete: if request.auth != null;
      }
    }
  }
}
```

7. **Storage rules**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /events/{eventId}/tasks/{taskId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

8. Under Authentication → Settings → **Authorized domains**, add your domain (e.g. `localhost`, your Vercel/Firebase Hosting domain).

### 3. Run

```bash
npm run dev
```

### 4. Build & deploy

```bash
npm run build
```

Deploy `dist/` to Firebase Hosting, Vercel, or Netlify.

## How the share / join flow works

1. **Owner** signs in with Google → **Create new event**.
2. On the event board, use the **Share** button (or copy the URL / the short code).
3. Send the link to contributors (WhatsApp, SMS, email, etc.).
4. Contributor opens the link → if not signed in, they see “Sign in with Google to join”.
5. After Google sign-in they land on the board and can claim tasks.

Alternatively they can go to the home page and enter the short code under **Join with code**.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- React Router
- Firebase Auth (Google only) + Firestore + Storage
- vite-plugin-pwa
- lucide-react, clsx

---

Made for real-world events where assignment by the organizer is hard and volunteering works better.
