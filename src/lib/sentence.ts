/* eslint-disable @typescript-eslint/no-explicit-any */
import db from "./db";
import { ObjectId } from "mongodb";
import { shuffle } from "./utils";

export async function getBlankedSentenceExercises(
  languageId: string,
  limit = 10
) {
  const pipeline = [
    { $match: { language_id: new ObjectId(languageId) } },
    { $sample: { size: limit } },
    {
      $project: {
        _id: 1,
        word_id: 1,
        sentence: 1,
      },
    },
  ];

  const result = (await db.$runCommandRaw({
    aggregate: "sentences",
    pipeline,
    cursor: {},
  })) as {
    cursor?: { firstBatch?: any[] };
  };

  const randomSentences = result.cursor?.firstBatch || [];

  const exercises = [];

  for (const s of randomSentences) {
    const sentenceId = s._id;
    const sentenceText = s.sentence;
    const correctWordId = s.word_id;

    const correctWordDoc = await db.words.findFirst({
      where: { id: correctWordId },
    });
    if (!correctWordDoc) {
      continue;
    }
    const correctWord = correctWordDoc.word;

    const blankedSentence = sentenceText.replace(
      new RegExp(correctWord, "gi"),
      "_____"
    );

    const pipelineWords = [
      {
        $match: {
          language_id: new ObjectId(languageId),
          word: { $ne: correctWord },
        },
      },
      { $sample: { size: 3 } },
      { $project: { word: 1 } },
    ];
    const randomWordsResult = (await db.$runCommandRaw({
      aggregate: "words",
      pipeline: pipelineWords,
      cursor: {},
    })) as {
      cursor?: { firstBatch?: any[] };
    };
    const randomWrongWords = randomWordsResult.cursor?.firstBatch || [];

    const options = [correctWord, ...randomWrongWords.map((w) => w.word)];

    const shuffledOptions = shuffle(options);

    exercises.push({
      sentenceId,
      originalSentence: sentenceText,
      blankedSentence,
      correctAnswer: correctWord,
      options: shuffledOptions,
    });
  }

  return exercises;
}

