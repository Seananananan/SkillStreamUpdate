export function supabaseAuthMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: string }).message)
      : error instanceof Error
        ? error.message
        : "";
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: string }).code)
      : "";

  const text = `${code} ${message}`.toLowerCase();

  if (text.includes("invalid login") || text.includes("invalid_credentials")) {
    return "Invalid email or password.";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (text.includes("same_password") || text.includes("should be different")) {
    return "Choose a different password than your current one.";
  }
  if (text.includes("weak_password") || (text.includes("password") && text.includes("8"))) {
    return "Password must be at least 8 characters.";
  }
  if (
    text.includes("reauthentication") ||
    text.includes("reauth_nonce") ||
    text.includes("otp_expired") ||
    text.includes("flow_state_expired")
  ) {
    return "This reset link is invalid or has expired. Request a new one.";
  }
  if (text.includes("email not confirmed") || text.includes("email_not_confirmed")) {
    return "Open the confirmation email first, then sign in with the same password.";
  }
  if (text.includes("too many") || text.includes("rate")) {
    return "Too many attempts. Try again in a few minutes.";
  }
  if (message) return message;
  return "Sign-in is not available right now.";
}
