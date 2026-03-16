import LanguagePageContent from "@/components/LanguagePageContent";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
  }

  const selectedLanguage = await params;

  return <LanguagePageContent language={selectedLanguage.language} />;
}
