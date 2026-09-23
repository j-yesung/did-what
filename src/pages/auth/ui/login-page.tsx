import { AuthForm } from "./auth-form";

type LoginPageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnTo } = await searchParams;
  return <AuthForm mode="login" returnTo={returnTo} />;
}
