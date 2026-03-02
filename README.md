# ObrixLabs Internal Management System

A full-stack internal team management platform built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, **ShadCN UI**, and **Supabase**.

## Features

- 🔐 **Authentication** — Email/password via Supabase Auth with role-based access
- 📋 **Task Management** — Create, assign, track, and manage tasks with full status workflow
- 📤 **Submissions** — Employees submit work with file uploads; admins approve/reject with feedback
- 💬 **Real-time Messaging** — 1-to-1 chat with file attachments using Supabase Realtime
- 👥 **Employee Management** — Create, view, and manage team members
- 📊 **Analytics Dashboard** — Performance charts, completion rates, employee rankings
- 📜 **Activity Logs** — Full audit trail of all system actions
- 🎨 **Premium Dark UI** — Glassmorphism, gradients, animations, fully responsive

## User Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full control – create admins/employees, view all data, delete users, view all logs |
| **Admin** | Create employees, assign/manage tasks, approve/reject submissions, message employees |
| **Employee** | View assigned tasks, submit work, message admin, view own history |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, ShadCN UI |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Charts | Recharts |
| Deployment | Vercel |

---

## Getting Started

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API
3. Note your **Service Role Key** from Settings → API (keep this secret!)

### 2. Run Database Migrations

1. Open the **SQL Editor** in your Supabase dashboard
2. Run the schema migration: copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the RLS policies: copy and paste the contents of `supabase/rls_policies.sql`

### 3. Create Storage Buckets

In the Supabase dashboard → Storage:
1. Create a bucket named `submissions` (private)
2. Create a bucket named `messages` (private)

### 4. Set Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Create Your First Super Admin

In the Supabase dashboard → Authentication → Users:
1. Click "Add User" → create a user with email/password
2. In SQL Editor, run:
```sql
UPDATE public.users SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

Now log in with that email — you'll have full Super Admin access.

---

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # All authenticated pages
│   │   ├── dashboard/        # Main dashboard with analytics
│   │   ├── tasks/            # Task list, create, detail
│   │   ├── employees/        # Employee list, create, detail
│   │   ├── messages/         # Real-time messaging
│   │   ├── activity-logs/    # Audit log viewer
│   │   └── settings/         # Profile & password settings
│   ├── api/users/create/     # Server-side user creation API
│   └── login/                # Authentication page
├── components/
│   ├── ui/                   # ShadCN UI components
│   ├── layout/               # Sidebar & Navbar
│   ├── dashboard/            # Stats cards & charts
│   ├── tasks/                # Task components
│   ├── submissions/          # Submission form & review
│   └── shared/               # Confirm modal, file upload, spinner
├── services/                 # Supabase data layer
├── hooks/                    # Custom React hooks
├── contexts/                 # Auth context provider
├── types/                    # TypeScript types
└── middleware.ts             # Route protection
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | User profiles with roles (super_admin, admin, employee) |
| `tasks` | Task assignments with status workflow & priority |
| `submissions` | Work submissions with file uploads |
| `messages` | 1-to-1 messaging with read/unread tracking |
| `activity_logs` | Full audit trail with JSON metadata |

All tables have Row Level Security (RLS) enabled with role-based access policies.
