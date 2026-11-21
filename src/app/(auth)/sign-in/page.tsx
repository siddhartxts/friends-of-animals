import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ROUTES } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

import { AuthPage } from "../_components/auth-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signIn.meta");
  return pageMetadata({
    title: t("title"),
    description: t("description"),
    path: ROUTES.signIn.path,
  });
}

export default function Page() {
  return <AuthPage intent="sign-in" />;
}
