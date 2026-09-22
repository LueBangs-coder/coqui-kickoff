import { ALL_PHRASES, LESSONS, type Phrase } from '../data/curriculum';
import { getOpponent, TEAMS } from '../data/teams';

export type ReviewCard = {
  box: number;
  due: string;
  attempts: number;
  correct: number;
};

export type Progress = {
  version: 1;
  teamId: string;
  /** Optional in earlier version-one saves; loading always chooses a valid opponent. */
  opponentId?: string;
  completedLessons: number[];
  xp: number;
  practiceDates: string[];
  cards: Record<string, ReviewCard>;
  bestTouchdowns: number;
};

export const PROGRESS_STORAGE_KEY = 'coqui-kickoff-progress-v1';
const MAX_COUNT = 1_000_000;
const MAX_STORAGE_LENGTH = 250_000;
const INTERVALS = [0, 1, 3, 7] as const;
const PHRASE_IDS = new Set(ALL_PHRASES.map((phrase) => phrase.id));
const LESSON_IDS = new Set(LESSONS.map((lesson) => lesson.id));
const TEAM_IDS = new Set(TEAMS.map((team) => team.id));

export function defaultProgress(): Progress {
  return {
    version: 1,
    teamId: 'packers',
    opponentId: 'giants',
    completedLessons: [],
    xp: 0,
    practiceDates: [],
    cards: {},
    bestTouchdowns: 0,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown, maximum = MAX_COUNT): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= maximum;
}

/** Calendar dates are stored without a time zone, so travel does not rewrite history. */
function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

/** Today's date on this device; deliberately not UTC's date. */
export function localDate(date = new Date()): string {
  const safeDate = Number.isFinite(date.valueOf()) ? date : new Date();
  const year = safeDate.getFullYear().toString().padStart(4, '0');
  const month = (safeDate.getMonth() + 1).toString().padStart(2, '0');
  const day = safeDate.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function safeToday(today?: string): string {
  return isCalendarDate(today) ? today : localDate();
}

/** UTC is only used for calendar arithmetic, avoiding 23/25-hour daylight-saving days. */
function afterDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function browserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

/** Repair bad fields individually so one malformed card does not erase a valid week. */
export function loadProgress(storage?: Pick<Storage, 'getItem'>): Progress {
  const fallback = defaultProgress();
  try {
    const raw = (storage ?? browserStorage())?.getItem(PROGRESS_STORAGE_KEY);
    if (!raw || raw.length > MAX_STORAGE_LENGTH) return fallback;
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1) return fallback;

    const cards: Record<string, ReviewCard> = {};
    if (isRecord(value.cards)) {
      for (const [id, candidate] of Object.entries(value.cards)) {
        if (!PHRASE_IDS.has(id) || !isRecord(candidate)) continue;
        const { box, due, attempts, correct } = candidate;
        if (
          !isCount(box, 3) || !isCalendarDate(due) || !isCount(attempts) || attempts < 1 ||
          !isCount(correct, attempts) || correct < box
        ) continue;
        cards[id] = { box, due, attempts, correct };
      }
    }

    const teamId = typeof value.teamId === 'string' && TEAM_IDS.has(value.teamId)
      ? value.teamId : fallback.teamId;
    const playerTeam = TEAMS.find((team) => team.id === teamId) ?? TEAMS[0];
    const opponentId = getOpponent(playerTeam, typeof value.opponentId === 'string' ? value.opponentId : undefined).id;
    const completedLessons = Array.isArray(value.completedLessons)
      ? [...new Set(value.completedLessons.filter((id): id is number => typeof id === 'number' && LESSON_IDS.has(id)))].sort((a, b) => a - b)
      : [];
    const practiceDates = Array.isArray(value.practiceDates)
      ? [...new Set(value.practiceDates.filter(isCalendarDate))].sort()
      : [];
    return {
      version: 1,
      teamId,
      opponentId,
      completedLessons,
      xp: isCount(value.xp) ? value.xp : 0,
      practiceDates,
      cards,
      bestTouchdowns: isCount(value.bestTouchdowns) ? value.bestTouchdowns : 0,
    };
  } catch {
    return fallback;
  }
}

/** Storage may be unavailable or full; the UI can keep the current in-memory session. */
export function saveProgress(progress: Progress, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    const target = storage ?? browserStorage();
    if (!target) return false;
    target.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

function withPracticeDate(progress: Progress, today: string): string[] {
  return [...new Set([...progress.practiceDates, today])].sort();
}

/**
 * Correct retrieval after a review is due moves through 1, 3, then 7 days.
 * An early repeat earns practice XP but cannot skip spacing intervals.
 * A miss resets the card to today, so the lesson can retry it without penalty.
 */
export function recordAnswer(progress: Progress, phraseId: string, correct: boolean, today?: string): Progress {
  if (!PHRASE_IDS.has(phraseId)) return progress;
  const date = safeToday(today);
  const previous = progress.cards[phraseId];
  const earlyCorrect = correct && previous && previous.box > 0 && previous.due > date;
  const box = correct ? (earlyCorrect ? previous.box : Math.min((previous?.box ?? 0) + 1, 3)) : 0;
  const due = earlyCorrect ? previous.due : afterDays(date, INTERVALS[box]);
  const attempts = Math.min((previous?.attempts ?? 0) + 1, MAX_COUNT);
  const correctCount = Math.min((previous?.correct ?? 0) + (correct ? 1 : 0), attempts);
  return {
    ...progress,
    xp: Math.min(progress.xp + (correct ? 10 : 0), MAX_COUNT),
    practiceDates: withPracticeDate(progress, date),
    cards: { ...progress.cards, [phraseId]: { box, due, attempts, correct: correctCount } },
  };
}

/**
 * A completed lesson or due-review session earns 30 XP.
 * Football is freely available and has no progress prerequisite.
 * Lesson ID 0 denotes a review and is never added to completedLessons.
 * Replays are welcome. The session controller MUST call this once per session,
 * using a synchronous completion latch so double clicks cannot award twice.
 * This pure function cannot distinguish an intentional replay from a duplicate call.
 */
export function completeLesson(progress: Progress, lessonId: number, today?: string): Progress {
  if (lessonId !== 0 && !LESSON_IDS.has(lessonId)) return progress;
  const date = safeToday(today);
  return {
    ...progress,
    completedLessons: lessonId === 0 ? [...progress.completedLessons] : [...new Set([...progress.completedLessons, lessonId])].sort((a, b) => a - b),
    xp: Math.min(progress.xp + 30, MAX_COUNT),
    practiceDates: withPracticeDate(progress, date),
  };
}

/** Only studied cards are reviews; new phrases remain available in the lesson path. */
export function duePhrases(progress: Progress, today?: string): Phrase[] {
  const date = safeToday(today);
  return ALL_PHRASES.filter((phrase) => {
    const card = progress.cards[phrase.id];
    return card !== undefined && card.due <= date;
  }).sort((a, b) => progress.cards[a.id].due.localeCompare(progress.cards[b.id].due));
}
