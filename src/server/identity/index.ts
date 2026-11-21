// The identity and access module: sign-up and sign-in by email code, and
// sessions. Its use cases join `as(actor)` through `identityUseCases`.

import type { UseCaseContext } from "../use-cases";
import { getAccount, signOut } from "./account";
import {
  requestEmailCode,
  verifyEmailCode,
  type RequestEmailCodeInput,
  type VerifyEmailCodeInput,
} from "./email-code";

export type { Account } from "./account";
export type {
  RequestEmailCodeResult,
  VerifyEmailCodeResult,
} from "./email-code";
export { resolveActor } from "./session";
export { requestMeta } from "./request";

export const identityUseCases = (ctx: UseCaseContext) => ({
  requestEmailCode: (input: RequestEmailCodeInput) =>
    requestEmailCode(ctx, input),
  verifyEmailCode: (input: VerifyEmailCodeInput) => verifyEmailCode(ctx, input),
  getAccount: () => getAccount(ctx),
  signOut: () => signOut(ctx),
});
