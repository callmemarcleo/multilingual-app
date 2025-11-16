import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserProfile } from "@/lib/user";
import { redirect } from "next/navigation";
import ImagesMenuContent from "@/components/ImagesMenuContent";

export default async function ImagesMenuPage() {
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
  }

  const user = await getUserProfile(session.user?.id || "");
  if (!user) return notFound();

  return <ImagesMenuContent />;
}
