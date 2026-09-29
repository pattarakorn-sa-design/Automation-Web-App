"use client";

import { useActionState, useState, type FormEvent } from "react";
import { z } from "zod";
import LoginCard from "@/components/LoginCard";
import SubmitButton from "@/components/SubmitButton";
import TextField from "@/components/TextField";
import { signIn, type SignInState } from "./actions";
import { signInSchema } from "./schema";

const initialState: SignInState = {};

export default function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialState);
  const [clientErrors, setClientErrors] = useState<SignInState["fieldErrors"]>();

  // Check on the client first for instant feedback; the Server Action checks
  // again with the same schema.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: data.get("email"),
      password: data.get("password"),
    });
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setClientErrors(undefined);
  }

  const fieldErrors = clientErrors ?? state.fieldErrors;

  return (
    <LoginCard
      description="Sign in with the account your admin created for you."
      // Hide the old form-level error while field errors from the client
      // check are shown, so a stale "wrong password" does not sit next to them.
      error={clientErrors ? undefined : state.formError}
    >
      <form
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          error={fieldErrors?.email?.[0]}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={fieldErrors?.password?.[0]}
        />
        <SubmitButton pendingLabel="Signing in...">Sign in</SubmitButton>
      </form>
    </LoginCard>
  );
}
