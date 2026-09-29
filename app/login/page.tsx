import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/features/auth/LoginForm";
import { getCurrentUser } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return <LoginForm />;
}
