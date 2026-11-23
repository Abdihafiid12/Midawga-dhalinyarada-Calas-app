# Midawga Dhalinyarada Calas

Blood donor management application built with React, Vite, Tailwind CSS, Neon PostgreSQL, and Vercel Functions.

<p align="center">
  <img src="src/assets/mdc-logo.png" alt="Midawga Dhalinyarada Calas" width="220">
</p>

## Setup

1. Create a Neon PostgreSQL database.
2. Run `neon/schema.sql` in the Neon SQL Editor.
3. Copy `.env.example` to `.env.local`.
4. Set `DATABASE_URL` and a long random `JWT_SECRET`.
5. Run `npm install`.
6. Run `npm run dev` for the frontend. Full login/API testing requires `vercel login` and `npm run vercel:dev`.
7. Open `http://localhost:5173`.

Create or reset an administrator with:

```powershell
npm run create-admin -- Caqilalan@gmail.com YOUR_PASSWORD "Caqilalan"
```

## Usage

- Admin: view, add, edit, and delete donors, and manage users.
- Staff: view, add, and edit donors.
- New accounts are activated when an administrator creates them.

## Security

- Authentication uses signed HTTP-only cookies and bcrypt password hashes.
- The Neon database URL and JWT secret are server-only environment variables.
- Inputs are validated in the app and database.
- `.env.local` is excluded from GitHub by `.gitignore`.
