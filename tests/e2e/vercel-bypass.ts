// Protection Bypass for Automation: how the journeys get past Vercel
// Authentication on a preview.
// https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation

/** File where global setup saves the bypass cookie. Not under test-results/
 * or playwright-report/, which CI uploads. */
export const BYPASS_STATE_PATH = "playwright/.auth/vercel-bypass.json";

/** This project's deployment hosts on Vercel: friends-of-animals-<hash>-bitacu1
 * and friends-of-animals-git-<branch>-bitacu1. */
const PROJECT_HOST = /^friends-of-animals-[a-z0-9-]+-bitacu1\.vercel\.app$/;

type EnvLike = Record<string, string | undefined>;

/**
 * The bypass secret to send to `baseURL`, or undefined when there is none
 * or `baseURL` is not one of this project's Vercel deployments. The secret
 * opens every protected deployment of the project, so a run pointed at the
 * wrong URL by mistake, at localhost or staging, never sends it.
 */
export function bypassSecretFor(
  baseURL: string,
  env: EnvLike = process.env
): string | undefined {
  const secret = env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) return undefined;
  const { protocol, hostname } = new URL(baseURL);
  return protocol === "https:" && PROJECT_HOST.test(hostname)
    ? secret
    : undefined;
}
