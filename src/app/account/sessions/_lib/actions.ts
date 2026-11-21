"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";
import { as, currentActor } from "@/server/app";

/** Signs one session out; this browser's own sends it to sign in. */
export async function signOutSessionAction(formData: FormData): Promise<void> {
  const actor = await currentActor();
  if (actor.kind !== "user") redirect(ROUTES.signIn.path);
  const sessionId = formData.get("sessionId");
  const result = await as(actor).signOutSession({
    sessionId: typeof sessionId === "string" ? sessionId : "",
  });
  if (result.ok && result.signedOutHere) redirect(ROUTES.signIn.path);
  // Show the list without the session (or unchanged, if it was gone).
  refresh();
}

/** Signs every session out, this one too, then goes to sign in. */
export async function signOutEverywhereAction(): Promise<void> {
  const actor = await currentActor();
  if (actor.kind === "user") await as(actor).signOutEverywhere();
  redirect(ROUTES.signIn.path);
}
