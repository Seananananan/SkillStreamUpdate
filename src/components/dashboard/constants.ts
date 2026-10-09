export const studentJourneySteps = [
  {
    id: "enroll",
    title: "Enroll",
    description: "Pick a published course.",
  },
  {
    id: "learn",
    title: "Learn",
    description: "Work through lessons at your pace.",
  },
  {
    id: "certify",
    title: "Get certified",
    description: "Completion issues your certificate.",
  },
] as const;

export const instructorJourneySteps = [
  {
    id: "create",
    title: "Create",
    description: "Author modules and lessons.",
  },
  {
    id: "publish",
    title: "Publish",
    description: "Submit it for an admin to publish.",
  },
  {
    id: "support",
    title: "Support",
    description: "Track progress on each course.",
  },
] as const;

/*
  Enrollment and certification run in this prototype. The lesson chatbot answers from that course’s lesson text.
*/
export const integrations = [
  {
    id: "registration-lms",
    label: "Enrollment → LMS access",
    detail: "Confirming enrollment sets up LMS access and writes enrollment.confirmed. The course becomes active only after access is provisioned.",
    status: "Live",
  },
  {
    id: "lms-cert",
    label: "Completion → Certificate",
    detail: "Finishing every lesson issues a verifiable credential and writes enrollment.completed.",
    status: "Live",
  },
  {
    id: "portal-ai",
    label: "Lesson chatbot",
    detail: "Answers a lesson question from that course’s lesson text. If the lessons do not contain the answer, it says so and stops.",
    status: "Live",
  },
] as const;

export type JourneyStepId = (typeof studentJourneySteps)[number]["id"];
