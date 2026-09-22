import { describe, it, expect } from "vitest";
import {
  normalizeAnswer,
  isAnswerCorrect,
  makeQuestions,
  answerOptions,
} from "./practice";
import { ALL_PHRASES } from "../data/curriculum";
describe("language practice", () => {
  it("accepts punctuation, case and omitted acute accents while preserving ñ", () => {
    expect(normalizeAnswer("  ¡MÁS despacio, por favor! ")).toBe(
      "mas despacio por favor",
    );
    expect(normalizeAnswer("año")).not.toBe(normalizeAnswer("ano"));
  });
  it("requires the target phrase, not a substring", () => {
    const p = { ...ALL_PHRASES[0], spanish: "Estoy bien, gracias." };
    expect(isAnswerCorrect("estoy bien gracias", p)).toBe(true);
    expect(isAnswerCorrect("bien", p)).toBe(false);
  });
  it("practices each phrase in both directions and choices are unique", () => {
    const phrases = ALL_PHRASES.slice(0, 6);
    const q = makeQuestions(phrases);
    expect(q).toHaveLength(12);
    expect(new Set(q.map((q) => q.key)).size).toBe(12);
    for (const question of q) {
      const options = answerOptions(question, phrases);
      expect(options).toContain(question.phrase.english);
      expect(new Set(options).size).toBe(options.length);
    }
  });
});
