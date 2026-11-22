# Blood Donor Management System (BDMS)
React + Vite + Tailwind + Supabase (Postgres, Auth, RLS).

## Setup
1. Create a project at https://supabase.com.
2. SQL Editor -> paste and run `supabase/schema.sql`.
3. Authentication -> Providers -> Email: turn OFF "Confirm email" (so admin-created accounts can log in immediately).
4. `cp .env.example .env` and fill in the Project URL + anon key (Project Settings -> API). Never use the service_role key.
5. `npm install` then `npm run dev` (http://localhost:5173).
6. Open the app and create the first account (Authentication -> Users -> Add user in the Supabase dashboard). The FIRST user becomes the active Admin automatically.
7. As Admin, use the Users page to create staff/admin accounts.

## Security model
- RLS on `donors` and `profiles`; anon role has no access.
- Any other sign-up is created INACTIVE and sees nothing until an Admin activates it.
- Staff: view/add/edit donors. Admin: also delete donors + manage users.
- Inputs validated in the UI and by DB CHECK constraints.
"# Midawga-dhalinyarada-Calas-app" 
"# Midawga-dhalinyarada-Calas-app" 
