import { cacheLife } from "next/cache";
import db from "./db";

export type FremdwoerterCard = {
  id: string;
  wort: string;
  bedeutung: string;
  /** All example sentences collected from both single- and multi-example variants */
  examples: string[];
  quelle?: string;
};

export async function getFremdwoerterCards(): Promise<FremdwoerterCard[]> {
  "use cache";
  cacheLife("minutes");

  const docs = await (db as any).fremdwoerter.findMany();

  return docs.map((d: any) => {
    const examples: string[] = [];

    if (d.beispiel) {
      examples.push(d.beispiel);
    } else {
      for (let i = 1; i <= 4; i++) {
        const val = d[`beispiel${i}`];
        if (!val) break;
        examples.push(val);
      }
    }

    return {
      id: String(d.id),
      wort: d.wort ?? "",
      bedeutung: d.bedeutung ?? "",
      examples,
      quelle: d.quelle ?? undefined,
    };
  });
}