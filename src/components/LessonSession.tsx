import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  Trophy,
  Volume2,
} from "lucide-react";
import { type Lesson, type Phrase, ALL_PHRASES } from "../data/curriculum";
import Pronunciation from "./Pronunciation";
import {
  answerOptions,
  isAnswerCorrect,
  makeQuestions,
  type Question,
} from "../lib/practice";
import { coquiAudio } from "../lib/audioEngine";

type Props = {
  lesson: Lesson;
  reviewPhrases?: Phrase[];
  onAnswer: (id: string, correct: boolean) => void;
  onComplete: () => void;
  onExit: () => void;
  onGame: () => void;
};
export default function LessonSession({
  lesson,
  reviewPhrases,
  onAnswer,
  onComplete,
  onExit,
  onGame,
}: Props) {
  const phrases = reviewPhrases ?? lesson.phrases;
  const [phase, setPhase] = useState<"learn" | "practice" | "complete">(
    reviewPhrases ? "practice" : "learn",
  );
  const [learnIndex, setLearnIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(() =>
    makeQuestions(phrases),
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    hint: boolean;
  } | null>(null);
  const [listening, setListening] = useState(false);
  const [showText, setShowText] = useState(false);
  const completed = useRef(false);
  const answered = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedbackPanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [phase, learnIndex, questionIndex]);
  useEffect(() => {
    if (feedback) feedbackPanel.current?.focus();
  }, [feedback]);
  const question = questions[questionIndex];
  const phrase = phase === "learn" ? phrases[learnIndex] : question?.phrase;
  const baseTotal = phrases.length * 2;
  const correctCount =
    questions.slice(0, questionIndex).length - (questions.length - baseTotal);
  function submit(value: string, hint = false) {
    if (answered.current || feedback || !question) return;
    answered.current = true;
    const correct =
      !hint &&
      (question.direction === "toEnglish"
        ? value === question.phrase.english
        : isAnswerCorrect(value, question.phrase));
    setFeedback({ correct, hint });
    onAnswer(question.phrase.id, correct);
    if (correct) coquiAudio.correct();
    if (!correct) setQuestions((prev) => [...prev, question]);
  }
  function nextQuestion() {
    answered.current = false;
    setFeedback(null);
    setAnswer("");
    setShowText(false);
    if (questionIndex + 1 >= questions.length) {
      if (!completed.current) {
        completed.current = true;
        onComplete();
      }
      setPhase("complete");
    } else setQuestionIndex((i) => i + 1);
  }
  return (
    <main id="main" className="session page-width">
      <div className="session-top">
        <button className="text-button" onClick={onExit}>
          <ArrowLeft size={18} /> Training camp
        </button>
        <span>
          {reviewPhrases
            ? "Spaced review"
            : `Day ${lesson.id} · ${lesson.title}`}
        </span>
        <span className="session-no-timer">Your pace. No timer.</span>
      </div>
      {phase === "complete" ? (
        <section className="finish-panel">
          <Trophy size={44} />
          <h1 tabIndex={-1} ref={heading}>
            Practice in. Game on.
          </h1>
          <p>
            You worked through {phrases.length} phrases in both directions.
            That’s how a little Spanish becomes your Spanish.
          </p>
          <div className="earned">
            <CheckCircle2 /> Practice saved <span>+30 bonus XP</span>
          </div>
          <details className="celebration">
            <summary>Celebrate with Coquí</summary>
            <video
              controls
              playsInline
              preload="none"
              poster="/assets/coqui-coach.webp"
              aria-label="Coquí celebrates a completed Spanish practice"
            >
              <source src="/assets/coqui-celebration.mp4" type="video/mp4" />
              Your browser cannot play this video. ¡Buen trabajo!
            </video>
          </details>
          <button className="button primary" onClick={onGame}>
            Play football <ArrowRight size={20} />
          </button>
          <button className="text-button" onClick={onExit}>
            Back to training camp
          </button>
        </section>
      ) : (
        <>
          <div
            className="lesson-progress"
            role="progressbar"
            aria-label="Practice progress"
            aria-valuemin={0}
            aria-valuemax={phase === "learn" ? phrases.length : baseTotal}
            aria-valuenow={
              phase === "learn" ? learnIndex : Math.max(0, correctCount)
            }
          >
            <span
              style={{
                width: `${phase === "learn" ? (learnIndex / phrases.length) * 100 : (Math.max(0, correctCount) / baseTotal) * 100}%`,
              }}
            />
          </div>
          <div className="session-heading">
            <div>
              <span className="label">
                {phase === "learn"
                  ? `MEET YOUR WORDS · ${learnIndex + 1} OF ${phrases.length}`
                  : `PUT IT INTO PLAY · ${Math.min(questionIndex + 1, baseTotal)} OF ${baseTotal}${questionIndex >= baseTotal ? " · RETRY" : ""}`}
              </span>
              <h1 ref={heading} tabIndex={-1}>
                {phase === "learn"
                  ? lesson.goal
                  : question.direction === "toEnglish"
                    ? listening
                      ? "Listen. What does it mean?"
                      : "What does it mean?"
                    : "How do you say it in Spanish?"}
              </h1>
            </div>
            <img
              className="coach-small"
              src="/assets/coqui-coach.webp"
              alt="Coquí football coach"
            />
          </div>
          {phase === "learn" ? (
            <section className="lesson-card" key={phrase.id}>
              <p className="scene-context">{phrase.context}</p>
              <h2 className="phrase-large" lang="es-PR">
                {phrase.spanish}
              </h2>
              <p className="translation">{phrase.english}</p>
              <p className="syllables" lang="es">
                {phrase.pronunciation}
              </p>
              <span className="hint-text">
                Syllable guide · CAPITALS show stress. Listen for the sounds.
              </span>
              <Pronunciation text={phrase.spanish} />
              {phrase.note && (
                <aside className="culture-note">
                  <span>From the playbook</span>
                  <p>{phrase.note}</p>
                </aside>
              )}
              <div className="card-actions">
                <button
                  className="text-button"
                  disabled={learnIndex === 0}
                  onClick={() => setLearnIndex((i) => i - 1)}
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  className="button primary"
                  onClick={() =>
                    learnIndex + 1 < phrases.length
                      ? setLearnIndex((i) => i + 1)
                      : setPhase("practice")
                  }
                >
                  {learnIndex + 1 < phrases.length
                    ? "Got it. Next phrase"
                    : "Let’s practice"}{" "}
                  <ArrowRight size={20} />
                </button>
              </div>
            </section>
          ) : (
            <section
              className="lesson-card quiz-card"
              key={`${questionIndex}-${question.key}`}
            >
              <div className="quiz-direction">
                <span className="label">
                  {question.direction === "toEnglish"
                    ? "SPANISH → ENGLISH"
                    : "ENGLISH → SPANISH"}
                </span>
                {question.direction === "toEnglish" && (
                  <label className="listen-toggle">
                    <input
                      type="checkbox"
                      checked={listening}
                      onChange={(e) => {
                        setListening(e.target.checked);
                        setShowText(false);
                      }}
                    />{" "}
                    Listening challenge
                  </label>
                )}
              </div>
              {question.direction === "toEnglish" ? (
                <>
                  {(!listening || showText || feedback) && (
                    <h2 className="quiz-prompt" lang="es-PR">
                      {phrase.spanish}
                    </h2>
                  )}
                  {listening && !showText && !feedback && (
                    <div className="listen-prompt">
                      <Volume2 size={38} />
                      <p>Play the Spanish, then choose its meaning.</p>
                      <button
                        className="text-button"
                        onClick={() => setShowText(true)}
                      >
                        Show the written phrase
                      </button>
                    </div>
                  )}
                  <Pronunciation text={phrase.spanish} compact />
                  <div className="answer-options">
                    {answerOptions(question, [...phrases, ...ALL_PHRASES]).map(
                      (choice, i) => (
                        <button
                          key={choice}
                          className={`answer-option ${feedback && choice === phrase.english ? "correct" : ""} ${feedback && choice === answer && !feedback.correct ? "incorrect" : ""}`}
                          disabled={!!feedback}
                          onClick={() => {
                            setAnswer(choice);
                            submit(choice);
                          }}
                        >
                          <span>{String.fromCharCode(65 + i)}</span>
                          {choice}
                          {feedback && choice === phrase.english && (
                            <Check size={18} />
                          )}
                        </button>
                      ),
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="quiz-prompt">{phrase.english}</h2>
                  <p className="hint-text">
                    Try from memory. Punctuation and accent marks won’t cost you
                    the point.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submit(answer);
                    }}
                  >
                    <label className="sr-only" htmlFor="spanish-answer">
                      Your Spanish answer
                    </label>
                    <input
                      className="spanish-input"
                      id="spanish-answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Escribe en español…"
                      autoComplete="off"
                      autoCapitalize="sentences"
                      spellCheck={false}
                      disabled={!!feedback}
                    />
                    <div
                      className="accent-keys"
                      aria-label="Spanish characters"
                    >
                      {"áéíóúñ¿¡".split("").map((c) => (
                        <button
                          type="button"
                          key={c}
                          disabled={!!feedback}
                          onClick={() => setAnswer((a) => a + c)}
                          aria-label={`Insert ${c}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    {!feedback && (
                      <div className="card-actions">
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => submit("", true)}
                        >
                          I need a hint
                        </button>
                        <button
                          className="button primary"
                          disabled={!answer.trim()}
                          type="submit"
                        >
                          Check answer <Check size={18} />
                        </button>
                      </div>
                    )}
                  </form>
                </>
              )}
              {feedback && (
                <div
                  className={`answer-feedback ${feedback.correct ? "is-correct" : "is-retry"}`}
                  ref={feedbackPanel}
                  tabIndex={-1}
                  role="status"
                >
                  <div>
                    {feedback.correct ? <CheckCircle2 /> : <RotateCcw />}
                    <div>
                      <strong>
                        {feedback.correct
                          ? "¡Chévere! You’ve got it."
                          : "Let’s bring this one back."}
                      </strong>
                      <p>
                        <span lang="es-PR">{phrase.spanish}</span> —{" "}
                        {phrase.english}
                      </p>
                      {!feedback.correct && (
                        <small>
                          Read it, say it aloud, then try again later in this
                          practice.
                        </small>
                      )}
                      {feedback.correct &&
                        question.direction === "toSpanish" && (
                          <small>Model spelling: {phrase.spanish}</small>
                        )}
                    </div>
                  </div>
                  <Pronunciation text={phrase.spanish} compact />
                  <button className="button primary" onClick={nextQuestion}>
                    {questionIndex + 1 >= questions.length
                      ? "Finish practice"
                      : "Next play"}{" "}
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </section>
          )}
          <p className="session-tip">
            A missed word is practice, too. Correct it and keep moving.
          </p>
        </>
      )}
    </main>
  );
}
