import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getImageCardsByCategory, getImageCategories } from "@/lib/images";

const Images = dynamic(() => import("@/components/Images"), {
  loading: () => <p className="text-gray-400 animate-pulse">Bilder werden geladen…</p>,
});

export async function generateStaticParams() {
  const categories = await getImageCategories();
  return categories.map((category) => ({ category }));
}

// Statische Shell – wird zur Build-Zeit vorgerendert (PPR / Cache Components)
export default async function ImagesByCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  const pretty =
    category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ");

  return (
    <div className="p-4">
      {/* Statische Shell: sofort verfügbar */}
      <h1 className="text-3xl font-bold mb-6 text-white">{pretty}</h1>

      {/* Dynamischer Teil: streamt nach beim Request */}
      <Suspense
        fallback={
          <p className="text-gray-400 animate-pulse">Bilder werden geladen…</p>
        }
      >
        <ImageCards category={category} />
      </Suspense>
    </div>
  );
}

// Separate async-Komponente für DB-Daten
async function ImageCards({ category }: { category: string }) {
  const cards = await getImageCardsByCategory(category);

  if (!cards.length) {
    return (
      <p className="p-4 text-red-500">
        No image cards found for category: {category}.
      </p>
    );
  }

  return <Images cards={cards} />;
}