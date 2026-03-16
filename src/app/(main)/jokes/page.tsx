import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import JokesContent from "@/components/JokesContent";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
  }

  return <JokesContent />;
}
