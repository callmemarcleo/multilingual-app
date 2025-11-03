// src/app/(main)/images/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getImageCards } from "@/lib/images";
import Images from "@/components/Images";

export const dynamic = "force-dynamic";

export default async function ImagesPage() {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const cards = await getImageCards();

  if (!cards.length) {
    return <p className="p-4 text-red-500">No images found.</p>;
  }

  return <Images cards={cards} />;
}
