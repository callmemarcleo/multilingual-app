import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ImagesMenuContent from "@/components/ImagesMenuContent";

export default async function ImagesMenuPage() {
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
  }

  return <ImagesMenuContent />;
}
