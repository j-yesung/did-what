import { AuthPage } from "@/features/auth";

export function LoginPage() {
  return <AuthPage mode="login" />;
}

export function SignupPage() {
  return <AuthPage mode="signup" />;
}
