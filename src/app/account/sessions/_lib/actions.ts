"use server";

import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";
import { as, currentActor } from "@/server/app";

/** Signs out of this browser's session, then goes to sign in. */
export async function signOutAction(): Promise<void> {
  const actor = await currentActor();
  if (actor.kind === "user") await as(actor).signOut();
  redirect(ROUTES.signIn.path);
}
