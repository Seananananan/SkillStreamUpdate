# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a faculty member or similar evaluator judging the capstone. They must walk enroll → learn → certify on a demo account and see that those steps actually run, without features that look finished but are not.

Also real: students (browse, enroll, complete lessons, download a certificate) and instructors (author modules and lessons, submit a draft, view roster and progress). An admin reviews a submitted course and publishes it or sends it back. The admin home still labels user management, system health, and reporting as planned.

## Product Purpose

Skillstream Academy is a single-academy learning platform whose job is to connect enrollment, course access, completion, and a publicly verifiable credential so nobody has to chase those handoffs by hand.

Success for the primary user: they can sign in as student, instructor, or admin, walk enroll → learn → certify, download the certificate PDF, and verify the reference without an account. A hosted database, notifications, and the rest of the admin console stay labeled planned.

## Positioning

Two claims a generic LMS install would not automatically make true:

1. Confirming enrollment provisions course access; finishing every lesson issues the credential — those handoffs are the product, not add-ons.
2. The credential is checkable by anyone with a server-generated reference number; verification does not require an account.

## Operating Context

Evaluators use seeded demo accounts (student, instructor, admin) on a local Next.js app. Auth and data live in the hosted Supabase project. Courses are free; confirming enrollment sets up course access.

V1 scope from the approved ERD: one academy, one instructor per course. The human journey is enroll → learn → get certified. Supporting integrations in the model: registration ↔ LMS, LMS ↔ certificates, and a lesson chatbot. The chatbot answers a student’s question about a lesson using only that course’s lesson text. If the lessons do not contain the answer, it says so and stops. It does not send the question to the instructor.

## Capabilities and Constraints

Working in this prototype: Supabase email/password sign-in with role stored in `app_metadata` and `public.users`, email password recovery, instructor course authoring and submit-for-review, admin approve-or-return, student catalog and enrollment, LMS account provisioned on enroll, lesson player with progress, quiz answers checked against the marked choice, enrollment completed when all lessons are done, certificate issued on completion with a downloadable PDF, public `/verify` by reference, a lesson chatbot, and a draft course created from a PDF.

Not implemented and must not be presented as live: admin user management, system health, reassign, reporting, notifications, integration-event retries, and audit logs. A student question is answered by GPT-6 Luna from that course’s lesson text. If the lessons do not contain the answer, the reply says so and stops. If the key is missing or the call fails, the question stays saved and the reply stays empty. An assignment still records a score of 100 on submit.

Open tension: the judged path must not fake completion. A wrong quiz answer stays incomplete. Record planned work as planned. Do not invent an assistant answer.

Terminology: enrollment, LMS access/provisioning, lesson progress, certificate reference, public verification, lesson chatbot.

## Brand Commitments

Name: Skillstream Academy. Voice: plain, academic, specific about what works vs what is planned. No invented schools, testimonials, or press.

Public footer, on the landing page, sign-in, and verify: “Skillstream Academy · Enroll, learn, and verify a certificate,” a link to `/verify`, and © 2026. It does not say “academic project” or “no real student data,” because the site is deployed.

Visual identity is the LMS category standard, executed at the craft level of Canvas, Moodle, and Coursera: teal on slate, type-first marketing, Sign in as the primary action. No metaphor worlds.

## Evidence on Hand

Demo logins and seed course content in the Supabase project. Public verification of issued references at `/verify`, with a PDF download of the same record. No customer quotes or case studies. Future work must not fabricate them.

## Product Principles

1. The enroll → learn → certify path the evaluator walks must be real.
2. Planned V1 stays in the story, labeled planned — never dressed as live.
3. A certificate is a public reference, not a login-walled badge.
4. Students and instructors are both in the product; the first-run is for the person judging that both sides exist.
5. Do not invent proof or AI answers to look more complete.
