import { describe, expect, it, vi, afterEach } from 'vitest';
import { ALL_PHRASES, LESSONS } from '../data/curriculum';
import {
  completeLesson, defaultProgress, duePhrases, loadProgress,
  localDate, PROGRESS_STORAGE_KEY, recordAnswer, saveProgress,
} from './progress';

afterEach(() => vi.useRealTimers());

describe('the seven-day curriculum', () => {
  it('has 42 unique, complete phrases in seven six-phrase lessons', () => {
    expect(LESSONS).toHaveLength(7);
    expect(ALL_PHRASES).toHaveLength(42);
    expect(new Set(ALL_PHRASES.map((phrase) => phrase.id)).size).toBe(42);
    expect(LESSONS.every((lesson) => lesson.phrases.length === 6)).toBe(true);
    for (const phrase of ALL_PHRASES) {
      expect(phrase.spanish.trim()).not.toBe('');
      expect(phrase.english.trim()).not.toBe('');
      expect(phrase.pronunciation.trim()).not.toBe('');
      expect(phrase.context.trim()).not.toBe('');
    }
  });
});

describe('progress persistence', () => {
  it('starts safely with fresh independent state', () => {
    const first = defaultProgress();
    first.completedLessons.push(1);
    expect(defaultProgress()).toMatchObject({ xp: 0, completedLessons: [], cards: {}, teamId: 'packers' });
  });

  it('round trips real progress using only the app storage key', () => {
    let raw: string | null = null;
    const storage = {
      getItem: vi.fn(() => raw),
      setItem: vi.fn((_key: string, value: string) => { raw = value; }),
    };
    const state = completeLesson(recordAnswer(defaultProgress(), 'hola', true, '2026-09-21'), 1, '2026-09-21');
    expect(saveProgress(state, storage)).toBe(true);
    expect(loadProgress(storage)).toEqual(state);
    expect(storage.setItem).toHaveBeenCalledWith(PROGRESS_STORAGE_KEY, expect.any(String));
    expect(storage.getItem).toHaveBeenCalledWith(PROGRESS_STORAGE_KEY);
  });

  it.each([
    ['missing', null], ['empty', ''], ['malformed JSON', '{broken'], ['null', 'null'],
    ['array', '[]'], ['number', '42'], ['future version', '{"version":2}'],
    ['oversized', 'x'.repeat(250_001)],
  ])('handles corrupt or unsupported persisted data: %s', (_label, raw) => {
    expect(loadProgress({ getItem: () => raw })).toEqual(defaultProgress());
  });

  it('repairs corrupt fields and rejects every malformed nested card', () => {
    const raw = JSON.stringify({
      version: 1, teamId: 'fake-team', xp: '100', bestTouchdowns: 1.5,
      completedLessons: [7, 1, 1, 8, null, '2', 2.5],
      practiceDates: ['2026-09-21', '2026-02-30', null, '09/21/2026', '2026-09-21'],
      cards: {
        hola: { box: 1, due: '2026-09-22', attempts: 2, correct: 1 },
        'me-llamo': { box: 4, due: '2026-09-22', attempts: 4, correct: 4 },
        gracias: { box: 1, due: '2026-02-30', attempts: 1, correct: 1 },
        'estoy-bien': { box: 1, due: '2026-09-22', attempts: 1, correct: 2 },
        'mas-despacio': { box: 1, due: '2026-09-22', attempts: -1, correct: 0 },
        'como-estas': { box: 1, due: '2026-09-22', attempts: 1.1, correct: 1 },
        jugamos: { box: 1, due: '2026-09-22', attempts: 1, correct: '1' },
        'estoy-listo': { box: 2, due: '2026-09-22', attempts: 1, correct: 1 },
        'tu-turno': null,
        unknown: { box: 1, due: '2026-09-22', attempts: 1, correct: 1 },
      },
    });
    const result = loadProgress({ getItem: () => raw });
    expect(result).toMatchObject({ teamId: 'packers', xp: 0, bestTouchdowns: 0, completedLessons: [1, 7], practiceDates: ['2026-09-21'] });
    expect(result.cards).toEqual({ hola: { box: 1, due: '2026-09-22', attempts: 2, correct: 1 } });
  });

  it('rejects prototype keys, unsafe counts, and invalid object/array shapes', () => {
    const raw = '{"version":1,"teamId":"../giants","xp":null,"cards":{"__proto__":{"box":1,"due":"2026-09-22","attempts":1,"correct":1}},"completedLessons":{},"practiceDates":{},"bestTouchdowns":-1}';
    expect(loadProgress({ getItem: () => raw })).toEqual(defaultProgress());
    expect(loadProgress({ getItem: () => JSON.stringify({ version: 1, cards: [] }) }).cards).toEqual({});
  });

  it('handles blocked or full browser storage without throwing', () => {
    expect(loadProgress({ getItem: () => { throw new Error('SecurityError'); } })).toEqual(defaultProgress());
    expect(saveProgress(defaultProgress(), { setItem: () => { throw new Error('QuotaExceededError'); } })).toBe(false);
  });

  it('accepts actual 1997 selectable team IDs and rejects unknown teams', () => {
    expect(loadProgress({ getItem: () => JSON.stringify({ version: 1, teamId: '49ers' }) }).teamId).toBe('49ers');
    expect(loadProgress({ getItem: () => JSON.stringify({ version: 1, teamId: 'fake-team' }) }).teamId).toBe('packers');
  });

  it('loads legacy saves without an opponent using the player team default', () => {
    const packers = loadProgress({ getItem: () => JSON.stringify({ version: 1, teamId: 'packers', xp: 90 }) });
    const giants = loadProgress({ getItem: () => JSON.stringify({ version: 1, teamId: 'giants', xp: 90 }) });
    expect(packers).toMatchObject({ teamId: 'packers', opponentId: 'giants', xp: 90 });
    expect(giants).toMatchObject({ teamId: 'giants', opponentId: 'cowboys', xp: 90 });
  });

  it('round trips a Giants player and selected opponent with learning progress intact', () => {
    const learned = completeLesson(recordAnswer(defaultProgress(), 'hola', true, '2026-09-21'), 1, '2026-09-21');
    const selected = { ...learned, teamId: 'giants', opponentId: 'eagles', bestTouchdowns: 3 };
    let raw: string | null = null;
    expect(saveProgress(selected, { setItem: (_key, value) => { raw = value; } })).toBe(true);
    expect(loadProgress({ getItem: () => raw })).toEqual(selected);
  });

  it.each(['giants', 'unknown-team', '', null, 42, { id: 'eagles' }])('repairs an invalid or self opponent without dropping learning stats: %j', (opponentId) => {
    const learned = completeLesson(recordAnswer(defaultProgress(), 'hola', true, '2026-09-21'), 1, '2026-09-21');
    const loaded = loadProgress({ getItem: () => JSON.stringify({ ...learned, teamId: 'giants', opponentId }) });
    expect(loaded).toEqual({ ...learned, teamId: 'giants', opponentId: 'cowboys' });
  });

  it('preserves a valid different opponent for any player team', () => {
    const learned = recordAnswer(defaultProgress(), 'hola', true, '2026-09-21');
    const loaded = loadProgress({ getItem: () => JSON.stringify({ ...learned, teamId: 'eagles', opponentId: 'cowboys' }) });
    expect(loaded).toEqual({ ...learned, teamId: 'eagles', opponentId: 'cowboys' });
  });

  it('uses the Giants default when another player team has selected itself', () => {
    const learned = recordAnswer(defaultProgress(), 'hola', true, '2026-09-21');
    const loaded = loadProgress({ getItem: () => JSON.stringify({ ...learned, teamId: 'eagles', opponentId: 'eagles' }) });
    expect(loaded).toEqual({ ...learned, teamId: 'eagles', opponentId: 'giants' });
  });
});

describe('retrieval and calendar-day reviews', () => {
  it('schedules successful spaced reviews for 1, 3, then 7 days', () => {
    const initial = defaultProgress();
    const day1 = recordAnswer(initial, 'hola', true, '2026-09-21');
    const day2 = recordAnswer(day1, 'hola', true, '2026-09-22');
    const day5 = recordAnswer(day2, 'hola', true, '2026-09-25');
    expect(day1.cards.hola).toEqual({ box: 1, due: '2026-09-22', attempts: 1, correct: 1 });
    expect(day2.cards.hola).toEqual({ box: 2, due: '2026-09-25', attempts: 2, correct: 2 });
    expect(day5.cards.hola).toEqual({ box: 3, due: '2026-10-02', attempts: 3, correct: 3 });
    expect(recordAnswer(day5, 'hola', true, '2026-10-02').cards.hola.due).toBe('2026-10-09');
    expect(initial).toEqual(defaultProgress());
    expect(day5.xp).toBe(30);
  });

  it('does not skip spaced intervals for immediate or early repeats', () => {
    const first = recordAnswer(defaultProgress(), 'hola', true, '2026-09-21');
    const immediate = recordAnswer(first, 'hola', true, '2026-09-21');
    expect(immediate.cards.hola).toEqual({ box: 1, due: '2026-09-22', attempts: 2, correct: 2 });
    expect(immediate.practiceDates).toEqual(['2026-09-21']);
    expect(immediate.xp).toBe(20);
  });

  it('resets a missed word to today and schedules its corrected retry tomorrow', () => {
    const first = recordAnswer(defaultProgress(), 'hola', true, '2026-09-21');
    const missed = recordAnswer(first, 'hola', false, '2026-09-22');
    expect(missed.cards.hola).toEqual({ box: 0, due: '2026-09-22', attempts: 2, correct: 1 });
    expect(missed.xp).toBe(10);
    expect(duePhrases(missed, '2026-09-22').map((phrase) => phrase.id)).toEqual(['hola']);
    const retried = recordAnswer(missed, 'hola', true, '2026-09-22');
    expect(retried.cards.hola).toEqual({ box: 1, due: '2026-09-23', attempts: 3, correct: 2 });
  });

  it('keeps overdue reviews available after missed days and excludes new words', () => {
    let state = recordAnswer(defaultProgress(), 'gracias', true, '2026-09-20');
    state = recordAnswer(state, 'hola', true, '2026-09-21');
    expect(duePhrases(state, '2026-09-21').map((phrase) => phrase.id)).toEqual(['gracias']);
    expect(duePhrases(state, '2026-10-01').map((phrase) => phrase.id)).toEqual(['gracias', 'hola']);
    expect(duePhrases(defaultProgress(), '2026-09-21')).toEqual([]);
  });

  it.each([
    ['2026-12-31', '2027-01-01'],
    ['2028-02-28', '2028-02-29'],
    ['2026-03-08', '2026-03-09'],
    ['2026-11-01', '2026-11-02'],
  ])('uses calendar days across month, leap, and daylight-saving boundaries: %s', (today, tomorrow) => {
    expect(recordAnswer(defaultProgress(), 'hola', true, today).cards.hola.due).toBe(tomorrow);
  });

  it('uses the local calendar date at the edges of the day', () => {
    expect(localDate(new Date(2026, 8, 21, 0, 1))).toBe('2026-09-21');
    expect(localDate(new Date(2026, 8, 21, 23, 59))).toBe('2026-09-21');
  });

  it('falls back to today for invalid supplied dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 21, 12));
    expect(recordAnswer(defaultProgress(), 'hola', true, '2026-02-30').cards.hola.due).toBe('2026-09-22');
    expect(localDate(new Date('invalid'))).toBe('2026-09-21');
  });

  it('ignores unknown phrase IDs without awarding practice XP', () => {
    const state = defaultProgress();
    expect(recordAnswer(state, '__proto__', true, '2026-09-21')).toBe(state);
  });
});

describe('lesson practice XP and independent football progress', () => {
  it('awards XP per completed session while keeping lesson completion unique', () => {
    const initial = defaultProgress();
    const firstSession = completeLesson(initial, 1, '2026-09-21');
    const deliberateReplay = completeLesson(firstSession, 1, '2026-09-22');
    expect(firstSession).toMatchObject({ xp: 30, completedLessons: [1] });
    expect(deliberateReplay).toMatchObject({ xp: 60, completedLessons: [1], practiceDates: ['2026-09-21', '2026-09-22'] });
    expect(initial).toEqual(defaultProgress());
    // UI must latch finish once per session; the domain cannot infer a session ID.
  });

  it('does not reward an unknown lesson', () => {
    const state = defaultProgress();
    expect(completeLesson(state, 8, '2026-09-21')).toBe(state);
    expect(completeLesson(state, Number.NaN, '2026-09-21')).toBe(state);
  });

  it('awards a completed review session without inventing a lesson completion', () => {
    const reviewed = completeLesson(defaultProgress(), 0, '2026-09-21');
    expect(reviewed).toMatchObject({ xp: 30, completedLessons: [], practiceDates: ['2026-09-21'] });
  });

  it('preserves a football score with no completed lessons or practice XP', () => {
    const played = { ...defaultProgress(), bestTouchdowns: 2 };
    const loaded = loadProgress({ getItem: () => JSON.stringify(played) });
    expect(loaded).toEqual(played);
    expect(loaded.completedLessons).toEqual([]);
    expect(loaded.xp).toBe(0);
    expect(loaded).not.toHaveProperty('tickets');
  });

  it('loads earlier version-one saves while discarding obsolete ticket fields', () => {
    const progress = completeLesson(recordAnswer(defaultProgress(), 'hola', true, '2026-09-21'), 1, '2026-09-21');
    const loaded = loadProgress({ getItem: () => JSON.stringify({ ...progress, tickets: 8 }) });
    expect(loaded).toEqual(progress);
    expect(loaded).not.toHaveProperty('tickets');
    const setItem = vi.fn();
    expect(saveProgress(loaded, { setItem })).toBe(true);
    expect(JSON.parse(setItem.mock.calls[0][1])).not.toHaveProperty('tickets');
  });
});
