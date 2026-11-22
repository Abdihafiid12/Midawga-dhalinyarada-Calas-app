# Midawga Dhalinyarada Calas

Blood donor management application built with React, Vite, Tailwind CSS, and Supabase.

<p align="center">
  <img src="src/assets/mdc-logo.png" alt="Midawga Dhalinyarada Calas" width="220">
</p>

## Setup

1. Create a Supabase project at https://supabase.com.
2. Open the SQL Editor, paste, and run `supabase/schema.sql`.
3. Go to Authentication -> Providers -> Email and disable **Confirm email** so that admin-created accounts can sign in immediately.
4. Create `.env` and add the Supabase Project URL and publishable key from Project Settings -> API. Never use the `service_role` key.
5. Run `npm install`.
6. Run `npm run dev`.
7. Open `http://localhost:5173`.

## Usage

- Admin: view, add, edit, and delete donors, and manage users.
- Staff: view, add, and edit donors.
- New accounts remain inactive until an admin activates them.

## Security

- Row Level Security (RLS) is enabled for the `donors` and `profiles` tables.
- The anonymous role has no access to application data.
- Inputs are validated in the app and database.
- `.env` is excluded from GitHub by `.gitignore`.
