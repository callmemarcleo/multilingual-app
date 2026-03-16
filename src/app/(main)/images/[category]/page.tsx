import { getImageCardsByCategory } from "@/lib/images";
import Images from "@/components/Images";

export const revalidate = 86400;

// Bekannte Kategorien zur Build-Zeit vorab generieren
export async function generateStaticParams() {
  return [
    { category: "office_supplies" },
    { category: "animals" },
    { category: "food" },
    { category: "sports" },
    { category: "clothing" },
  ];
}

export default async function ImagesByCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  const cards = await getImageCardsByCategory(category);

  if (!cards.length) {
    return (
      <p className="p-4 text-red-500">
        No image cards found for category: {category}.
      </p>
    );
  }

  const pretty =
    category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ");

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">{pretty}</h1>
      <Images cards={cards} />
    </div>
  );
}
