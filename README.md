# Skillstream Academy — Frontend Web App

Next.js app for a single academy: enroll, learn, and certify. Students and instructors sign in from `/login`. Admins sign in at `/admin/login`.

## Getting started

```bash
cd frontend/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env` from `.env.example`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the SkillStream Academy Supabase project. Add `OPENAI_API_KEY` for the lesson assistant and PDF course draft. Restart the dev server after changing it.

In the Supabase dashboard, keep **Confirm email** on and configure custom SMTP under Authentication. Under Authentication → URL Configuration, set the local Site URL to `http://localhost:3000` and add `http://localhost:3000/**` to Redirect URLs so confirmation can return through `/auth/callback` and password reset through `/auth/recover`. Use the deployed app URL instead in production.

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@skillstream.academy | password123 |
| Instructor | instructor@skillstream.academy | password123 |
| Admin | admin@skillstream.academy | password123 |

Auth is Supabase email/password. Sessions are the Supabase SSR cookie. Logout signs that session out. Forgot password emails a reset link; open that link in the same browser that requested it.

## Routes

| Path | Role | Purpose |
|------|------|---------|
| `/login` | Public | Student or instructor sign-in and account creation |
| `/admin/login` | Public | Admin sign-in |
| `/student/courses` | Student | Published course catalog |
| `/student/learning` | Student | Enrolled courses and the lesson player |
| `/student/certificates` | Student | Issued certificates and PDF download |
| `/instructor/courses` | Instructor | Drafts, submitted courses, and published courses |
| `/instructor/courses/new` | Instructor | Create a draft |
| `/instructor/courses/from-pdf` | Instructor | Draft a course from a PDF |
| `/instructor/courses/[id]/modules` | Instructor | Module and lesson editor |
| `/admin/courses` | Admin | Review queue: publish or send back |
| `/verify` | Public | Look up a certificate reference |

## Data

Courses, enrollments, progress, certificates, and academy profiles live in the hosted Supabase project. Auth users are in Supabase Auth; `public.users` holds name and role and references `auth.users`.

## Design

Teal on slate. Brand `#0F766E`, ink `#0F172A`, canvas `#F8FAFC`. Green is reserved for completed work.
