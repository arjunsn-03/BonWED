# 💍 Wedding Planner App

A private, family-only web app to plan and track every aspect of a wedding (Engagement + Marriage). Built with Next.js, Firebase, and Tailwind CSS. Installable as a PWA.

## Setup

### 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Enable **Blaze (pay-as-you-go)** plan (required for Phone Auth + Storage)
3. Enable **Authentication → Phone** sign-in
4. Create a **Firestore** database (start in production mode)
5. Enable **Storage**
6. Register a **Web app** and copy the config

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
# Fill in your Firebase project values in .env.local
```

### 3. Add yourself to the Allowlist

In Firebase Console → Firestore, manually create a document:

- **Collection**: `allowlist`
- **Document ID**: your phone number with country code, e.g. `+919876543210`
- **Fields**: `name` (string), `phone` (string), `addedAt` (number timestamp), `addedBy` (string)

### 4. Deploy Firestore Rules & Indexes

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

## Deploy to Vercel

1. Push to GitHub
2. Connect to Vercel (free Hobby plan)
3. Add environment variables in Vercel project settings (same as `.env.local`)
4. Set up custom domain in Vercel → point DNS CNAME to `cname.vercel-dns.com`

## Architecture

```
src/
├── app/                     # Next.js App Router
│   ├── login/               # Phone OTP login page
│   └── app/                 # Protected app shell (auth guard)
│       ├── page.tsx          # Dashboard
│       ├── engagement/       # Engagement sub-pages
│       │   ├── venue/
│       │   ├── schedule/
│       │   ├── tasks/
│       │   ├── clothing/
│       │   ├── makeup/
│       │   ├── invitations/
│       │   ├── invitees/
│       │   ├── accommodation/
│       │   ├── budget/
│       │   └── vendors/
│       ├── marriage/         # Same structure as engagement
│       ├── gallery/
│       └── settings/
├── components/              # Reusable UI components
├── context/                 # React contexts (Auth, Settings)
├── hooks/                   # Firebase realtime hooks
└── lib/                     # Firebase init, types, storage helpers
```

## PWA Icons

Add two icon files to `public/icons/`:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

Use any design tool to create them, or use an online favicon generator.

## Development Notes

- Use Firebase Console → Authentication → Phone → **Test phone numbers** during development to avoid real SMS sends
- Image uploads are compressed to max 1600px / 1MB before upload
- All data syncs in real-time via Firestore `onSnapshot` listeners
- Firestore security rules enforce allowlist at the database level
