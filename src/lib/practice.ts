import type { Phrase } from "../data/curriculum";
export type Question = {
  phrase: Phrase;
  direction: "toEnglish" | "toSpanish";
  key: string;
};
export function normalizeAnswer(input: string) {
  return input
    .toLocaleLowerCase("es")
    .normalize("NFC")
    .replace(
      /[áéíóúü]/g,
      (c) => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" })[c]!,
    )
    .replace(/[¿?¡!.,…;:]/g, "")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function isAnswerCorrect(answer: string, phrase: Phrase) {
  return [phrase.spanish, ...(phrase.acceptableAnswers ?? [])].some(
    (value) => normalizeAnswer(value) === normalizeAnswer(answer),
  );
}
export function makeQuestions(phrases: Phrase[]): Question[] {
  return [
    ...phrases.map((phrase) => ({
      phrase,
      direction: "toEnglish" as const,
      key: phrase.id + "-en",
    })),
    ...phrases.map((phrase) => ({
      phrase,
      direction: "toSpanish" as const,
      key: phrase.id + "-es",
    })),
  ];
}
export function answerOptions(question: Question, phrases: Phrase[]): string[] {
  const correct = question.phrase.english;
  const others = [
    ...new Set(
      phrases.filter((p) => p.id !== question.phrase.id).map((p) => p.english),
    ),
  ]
    .filter((v) => v !== correct)
    .slice(0, 3);
  const answers = [...others, correct];
  const offset =
    question.phrase.id.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) %
    answers.length;
  return [...answers.slice(offset), ...answers.slice(0, offset)];
}
