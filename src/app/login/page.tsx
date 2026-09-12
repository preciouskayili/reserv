import { LoginPage } from "@/components/login-page";

export const metadata = {
  title: "Sign in — Reserv",
  description: "Sign in with a one-time passcode delivered via Resend.",
};

export default function LoginRoute() {
  return <LoginPage />;
}
