/* eslint-disable @typescript-eslint/no-explicit-any */
import db from "./db";
import { shuffle } from "./utils";
export async function getRandomExercises(
  languageId: string,
  exerciseType: string,
  limit = 10
) {
  let allMatches: any[];

  if (exerciseType === "fillintheblank") {
    allMatches = await db.fillintheblank.findMany({
      where: { language_id: languageId },
    });
  } else if (exerciseType === "idioms") {
    allMatches = await db.idioms.findMany({
      where: { language_id: languageId },
    });
  } else {
    throw new Error(`Unsupported exerciseType: ${exerciseType}`);
  }

  const shuffled = shuffle(allMatches);
  return shuffled.slice(0, limit);
}
