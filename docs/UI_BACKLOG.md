# Skillstream Academy UI Backlog

Updated: August 27, 2026

## Design system

The palette is functional: every hue has exactly one job, so colour carries
meaning rather than decoration.

| Role | Token | Value | Used for |
| --- | --- | --- | --- |
| Brand | `--brand` | `#0F766E` | Links, primary buttons, current step, active nav |
| Complete | `--success` | `#15803D` | Published courses, finished steps, certification |
| Unfinished | `--warn` | `#B45309` | Drafts and "not ready to publish" warnings |
| Failed | `--danger` | `#B91C1C` | Errors only |
| Text | `--ink` / `--muted` | `#0F172A` / `#475569` | Primary and secondary text |
| Structure | `--canvas` / `--surface` / `--line` | `#F8FAFC` / `#FFFFFF` / `#E2E8F0` | Page, cards, hairline borders |

Teal is the base because the product is a learning platform whose payoff is a
credential: green reads as "achieved" and stays reserved for that, so the
interactive colour has to sit next to it without competing. Slate neutrals keep
the reading surface quiet. All text pairs clear 4.5:1 on both `--canvas` and
`--surface`.

## Completed in the minimal redesign

- Replaced the amber "Ink & Paper" palette with the functional teal/slate system above.
- Dropped the serif display face; one sans family now carries the whole hierarchy.
- Added shared `.btn`, `.card`, `.field`, and `.label` primitives so controls stop drifting.
- Converted the dark sidebar to a light one and merged the breadcrumb strip into a single page header with an actions slot.
- Reduced the journey stepper to one progress row and removed it from the four pages that only repeated it.
- Replaced the decorative "connected systems" panel with a plain list that labels each handoff as planned.
- Replaced the course detail pipeline graphic with real counts of modules and lessons.
- Removed the drag handle in the module editor, which implied reordering that does not exist.
- Removed the fake dashboard and certificate mockups from the landing page.
- Warned before publishing a course that has no lessons.
- Kept visible focus states, the skip link, 44px control heights, and reduced-motion support.

### Behaviour changes worth knowing

- "Publish immediately" was removed from course creation; publishing now happens
  from the course page, where the empty-content warning can be shown.
- The landing navigation no longer has a mobile menu; the section links are
  hidden below `md` and the page is short enough to scroll.
- The public footer (landing, sign-in, and verify) reads “Skillstream Academy ·
  Enroll, learn, and verify a certificate,” with a link to `/verify` and © 2026.
  It does not say “academic project” or “no real student data,” because the site
  is deployed. It sits at the bottom of the page.

## P0 — Required for a usable capstone demo

### Complete student enrollment

- Replace the disabled enrollment control with a working enrollment flow.
- Capture enrollment confirmation and create the linked LMS account.
- Show success, provisioning-in-progress, and provisioning-failed states.
- Enrollment becomes active only after LMS access is provisioned; the player stays blocked until then.
- Acceptance: a student can enroll and see the course become active without editing seed data.

### Build the student course player

- Add module navigation, lesson content, completion controls, and course progress.
- Persist `lesson_progress` for each enrollment.
- Acceptance: completing the final lesson changes the enrollment to completed.

### Implement certificate issuance and verification

- Generate a certificate record when course completion occurs.
- Add student certificate history and a public reference-number verification page.
- Instructor revoke is live: confirm, keep the reference, public verify shows revoked. Cannot undo in the product UI. Enrollment stays completed. The PDF download shows the same status.
- Acceptance: a completed enrollment produces a certificate that can be verified without signing in. Revoking it does not delete the public record.

### Record live integration events

- `enrollment.confirmed` is written when LMS access is provisioned. `enrollment.completed` is written when a certificate is issued. Duplicate succeeded events are not stored. Retry with backoff stays Planned.
- Acceptance: those two handoffs leave a succeeded (or failed) event on the enrollment.

### Replace demo authentication

- Passwords are bcrypt hashes. Demo sign-in still uses the published passwords; the file stores only the hash.
- Sessions are signed, expire after 7 days, and logout sets `revokedAt` so that cookie cannot be reused.
- Password recovery stays Planned.
- Acceptance for the cookie: role access cannot be changed by editing it. A hosted database is still a separate task.

### Replace the JSON file store

- Introduce a relational database matching the approved ERD.
- Add migrations and seed data.
- Acceptance: concurrent requests cannot overwrite course, module, or lesson changes.

## P1 — Required for the complete instructor workflow

### Finish course authoring

- Edit, delete, and up/down reorder for course details, modules, and lessons are live, with confirm-before delete and Saved / Deleted / Order saved notices. Course delete is blocked when enrollments exist.
- Lesson type, reading/video URL, duration, and quiz prompt/choices are live. A quiz stores the correct choice. A wrong answer does not complete the lesson. A right answer records 100. Assignments still record 100 on submit.
- Completeness checklist is live on the course page. Submit stays disabled until required items pass (title, ≥1 module, every module has a lesson, every lesson has a title and type-appropriate content). Duration is optional. The API rejects an incomplete submit and rejects an instructor publish. A published course that later fails the checklist stays listed with a warning until the instructor returns it to draft or archives it.
- Archive is live: confirm, leave the catalog, keep enrollments/progress/certificates. Restore returns the course to draft. Delete stays blocked when enrollments exist.

### Add admin course review

- Instructors submit a ready draft. An admin approves it, which publishes the course, or sends it back with feedback. Instructors cannot publish directly.
- Archive and reassign stay Planned.
- Review state (`none`, `submitted`, `returned`) is separate from draft, published, and archived.

### Build roster and progress monitoring

- List enrolled students by course.
- Last activity, completion date, needs-attention (no lesson started, idle 7 days, or LMS provision failed), and student detail with lesson status are live.

### Lesson chatbot

The course assistant is live. It answers a student’s question from that course’s lessons only: reading text, and a quiz’s prompt and choices. A video is a link, so it has no transcript. GPT-6 Luna writes the reply. If the lessons do not contain the answer, the reply says so and stops. The question is not sent to the instructor. If the API key is missing or the call fails, the question stays saved and the reply stays empty.

### Add complete interaction feedback

- Confirm-before dialogs now cover sign in, enroll, complete lesson, create course, add module/lesson, publish, unpublish, archive, restore, verify, revoke certificate, and log out.
- Inline or redirect success notices now cover those same mutations.
- Add skeletons for route-level loading.
- Add retry actions for network and server failures.

## P2 — Professional product hardening

### Responsive and accessibility QA

- Test at 375, 768, 1024, and 1440 pixel widths.
- Verify keyboard-only navigation and screen-reader names.
- Run contrast and zoom checks at 200%.
- Add automated accessibility checks to CI.

### Catalog discovery

- Title search is live on the student catalog (`?q=`). Topic filters, sort, pagination, outcomes, and instructor profile are Out of V1.

### Notifications

- Add in-app notifications for enrollment, LMS access, and certificates.
- Add read/unread state and notification preferences.

### Admin operations

- Build system-health views for failed integration events.
- Add retry and reconciliation controls.
- Add user management, audit log browsing, and basic reporting.

### Production design-system work

- Extract empty-state and data-list components (button, field, card, and page header are done).
- Add Storybook or an equivalent component reference.
- Document responsive, content, and accessibility rules.

## Deferred beyond V1

- Dark mode.
- Multi-tenancy and institution branding.
- Co-teaching.
- Native mobile application.
- Advanced analytics and personalized learning recommendations.
- Catalog topic filters, sort, pagination, outcomes, and instructor profile.
