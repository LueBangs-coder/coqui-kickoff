import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Goal,
  House,
  Info,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Flag } from "./components/Flag";
import Pronunciation from "./components/Pronunciation";
import LessonSession from "./components/LessonSession";
import Playbook from "./components/Playbook";
import InstallApp from "./components/InstallApp";
import { LESSONS, type Phrase } from "./data/curriculum";
import { TEAMS, getOpponent } from "./data/teams";
import {
  loadProgress,
  saveProgress,
  recordAnswer,
  completeLesson,
  duePhrases,
  type Progress,
} from "./lib/progress";
import { coquiAudio } from "./lib/audioEngine";
import {
  AUDIO_SETTINGS_EVENT,
  loadAudioSettings,
  saveAudioSettings,
  type AudioSettings,
} from "./lib/audioSettings";
const FootballGame = lazy(() => import("./components/FootballGame"));
class GameBoundary extends Component<
  { children: ReactNode; onClose: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <section className="finish-panel">
        <h1>The field needs a moment.</h1>
        <p>
          Your practice is safe. Please reload the app to try the game again.
        </p>
        <button className="button primary" onClick={this.props.onClose}>
          Back to game day
        </button>
      </section>
    ) : (
      this.props.children
    );
  }
}
type Page = "camp" | "playbook" | "gameday";
export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [page, setPage] = useState<Page>("camp");
  const [session, setSession] = useState<{
    id: number;
    review?: Phrase[];
  } | null>(null);
  const [game, setGame] = useState(false);
  const [saved, setSaved] = useState(true);
  const [about, setAbout] = useState(false);
  const [notice, setNotice] = useState("");
  const [gameLoading, setGameLoading] = useState(false);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(loadAudioSettings);
  const launching = useRef(false);
  const team = TEAMS.find((t) => t.id === progress.teamId) ?? TEAMS[0];
  const opponent = getOpponent(team, progress.opponentId);
  const nextLesson =
    LESSONS.find((l) => !progress.completedLessons.includes(l.id)) ??
    LESSONS[0];
  const due = duePhrases(progress);
  const completionLatch = useRef(false);
  useEffect(() => {
    setSaved(saveProgress(progress));
  }, [progress]);
  useEffect(() => {
    const onAudioSettings = (event: Event) =>
      setAudioSettings((event as CustomEvent<AudioSettings>).detail);
    window.addEventListener(AUDIO_SETTINGS_EVENT, onAudioSettings);
    return () => window.removeEventListener(AUDIO_SETTINGS_EVENT, onAudioSettings);
  }, []);
  function toggleAudio() {
    const next = saveAudioSettings({ ...audioSettings, muted: !audioSettings.muted });
    setAudioSettings(next);
    coquiAudio.applyMix();
  }
  function navigate(next: Page) {
    setPage(next);
    setSession(null);
    setGame(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function startLesson(id: number, review?: Phrase[]) {
    completionLatch.current = false;
    setSession({ id, review });
    setGame(false);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function finish() {
    if (completionLatch.current) return;
    completionLatch.current = true;
    setProgress((p) => completeLesson(p, session?.review ? 0 : session!.id));
  }
  async function startGame() {
    if (launching.current) return;
    launching.current = true;
    setGameLoading(true);
    setNotice("");
    try {
      await import("./components/FootballGame");
      setSession(null);
      setGame(true);
      setPage("gameday");
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      setNotice(
        "The game couldn’t download. Please check your connection and try again.",
      );
      navigate("gameday");
    } finally {
      launching.current = false;
      setGameLoading(false);
    }
  }
  function gameResult(result: { touchdowns: number; yards: number }) {
    setProgress((p) => ({
      ...p,
      bestTouchdowns: Math.max(p.bestTouchdowns, result.touchdowns),
    }));
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate("camp")}
            aria-label="Coquí Kickoff home"
          >
            <img src="/assets/coqui-coach.webp" alt="" />
            <span>COQUÍ KICKOFF</span>
          </button>
          <span className="brand-tag">
            LANGUAGE
            <br />
            CULTURE
            <br />
            BIGGER PLAYS
          </span>
          <nav aria-label="Main navigation">
            {(
              [
                { id: "camp", label: "Training camp", Icon: House },
                { id: "playbook", label: "Playbook", Icon: BookOpen },
                { id: "gameday", label: "Game day", Icon: Goal },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={page === id && !session ? "active" : ""}
                aria-current={page === id && !session ? "page" : undefined}
              >
                <Icon size={22} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <Flag />
          <button
            className="about-button sound-button"
            aria-label={audioSettings.muted ? "Turn music and game sounds on" : "Mute music and game sounds"}
            aria-pressed={audioSettings.muted}
            onClick={toggleAudio}
          >
            {audioSettings.muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
          </button>
          <button
            className="about-button"
            aria-label="About learning and privacy"
            onClick={() => setAbout(true)}
          >
            <Info size={21} />
          </button>
        </div>
      </header>
      {!saved && (
        <div className="storage-warning" role="alert">
          This browser couldn’t save progress. Keep this tab open, or enable
          site storage before you leave.
        </div>
      )}
      {session ? (
        <LessonSession
          key={`${session.id}-${session.review ? "review" : "lesson"}`}
          lesson={LESSONS.find((l) => l.id === session.id) ?? LESSONS[0]}
          reviewPhrases={session.review}
          onAnswer={(id, correct) =>
            setProgress((p) => recordAnswer(p, id, correct))
          }
          onComplete={finish}
          onExit={() => {
            setSession(null);
            navigate("camp");
          }}
          onGame={startGame}
        />
      ) : game ? (
        <main id="main" className="page-width game-page">
          <GameBoundary onClose={() => setGame(false)}>
            <Suspense
              fallback={<p className="loading">Warming up the field…</p>}
            >
              <FootballGame
                team={team}
                opponent={opponent}
                onClose={() => setGame(false)}
                onResult={gameResult}
              />
            </Suspense>
          </GameBoundary>
        </main>
      ) : page === "playbook" ? (
        <Playbook progress={progress} onPractice={(id) => startLesson(id)} />
      ) : page === "gameday" ? (
        <main id="main" className="page-width gameday">
          <div className="page-heading">
            <div>
              <h1>Your team. Your matchup.</h1>
              <p>
                Pick any ’97 team, including the Giants. Then choose your rival.
              </p>
            </div>
            <span className="free-play-badge">
              <Goal size={20} /> Play whenever you want
            </span>
          </div>
          <div className="gameday-layout">
            <section className="team-selection">
              <label className="label" htmlFor="team-select">
                YOUR 1997 TEAM
              </label>
              <div className="team-select-wrap">
                <select
                  id="team-select"
                  value={team.id}
                  onChange={(e) =>
                    setProgress((p) => ({
                      ...p,
                      teamId: e.target.value,
                      opponentId: undefined,
                    }))
                  }
                >
                  {TEAMS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.city} {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} />
              </div>
              <label className="label" htmlFor="opponent-select">
                YOUR OPPONENT
              </label>
              <div className="team-select-wrap">
                <select
                  id="opponent-select"
                  value={opponent.id}
                  onChange={(e) =>
                    setProgress((p) => ({ ...p, opponentId: e.target.value }))
                  }
                >
                  {TEAMS.filter((t) => t.id !== team.id).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.city} {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} />
              </div>
              <div className="matchup">
                <div
                  className="team-emblem"
                  style={{ background: team.primary, color: team.secondary }}
                >
                  {team.abbreviation}
                </div>
                <span>VS</span>
                <div
                  className="team-emblem"
                  style={{
                    background: opponent.primary,
                    color: opponent.secondary,
                  }}
                >
                  {opponent.abbreviation}
                </div>
              </div>
              <h2>
                {team.city} {team.name}
                <br />
                <span>
                  vs {opponent.city} {opponent.name}
                </span>
              </h2>
              <p>
                Three kickoff returns. Dodge the defenders, find the gap, and
                take it to the house.
              </p>
              {notice && (
                <p className="inline-notice" role="status">
                  {notice}
                </p>
              )}
              <button
                className="button primary"
                onClick={startGame}
                disabled={gameLoading}
              >
                {gameLoading ? "Opening the field…" : "Play ball"}{" "}
                <ArrowRight size={20} />
              </button>
              <p className="hint-text">
                Arrow keys / WASD + Space, or touch controls.
              </p>
              <div className="team-footnote">
                All 30 teams from the 1997 season. Washington is displayed as
                “Washington · 1997.”
              </div>
            </section>
            <div className="gameday-preview">
              <img
                src="/assets/football-preview.webp"
                alt="Original pixel-art football field with a New York Giants matchup"
              />
              <div>
                <span>1997 ENERGY. BORICUA ROOTS.</span>
                <strong>
                  A little practice.
                  <br />
                  Leave it on the field.
                </strong>
              </div>
            </div>
          </div>
          <div className="game-rules">
            <span>
              <House /> Always open. Unlimited games.
            </span>
            <span>
              <Goal /> Your team. Your choice of rival.
            </span>
            <span>
              <Trophy /> Best: {progress.bestTouchdowns} touchdowns
            </span>
          </div>
        </main>
      ) : (
        <main id="main" className="page-width camp">
          <section className="hero-heading">
            <div>
              <h1>A little Spanish. A lot of game.</h1>
              <p>Build your Spanish. Rep your roots. Take the field.</p>
            </div>
            <span className="hand-note" lang="es-PR">
              Aquí también
              <br />
              se juega.
            </span>
          </section>
          <section className="camp-grid">
            <div className="training-panel">
              <div className="training-copy">
                <span className="label">TRAINING CAMP</span>
                <h2>
                  {progress.completedLessons.length
                    ? "Keep the words.\nMove the chains."
                    : "Your first words.\nYour first drive."}
                </h2>
                <p>
                  {progress.completedLessons.length
                    ? `Next up: ${nextLesson.title}. A little practice goes a long way.`
                    : "Start with a hello. Finish in the end zone."}
                </p>
                <button
                  className="button primary"
                  onClick={() => startLesson(nextLesson.id)}
                >
                  {progress.completedLessons.length
                    ? "Continue your practice"
                    : "Start today’s practice"}{" "}
                  <ArrowRight size={22} />
                </button>
                <span className="training-meta">
                  Day {nextLesson.id} · 8–12 min · Beginner
                </span>
              </div>
              <img
                className="hero-coqui"
                src="/assets/coqui-coach.webp"
                alt="A Puerto Rican coquí wearing a football jersey and holding a football"
              />
              <span className="chalk-note" lang="es-PR">
                Pequeñas palabras.
                <br />
                Grandes victorias.
              </span>
            </div>
            <aside className="match-preview">
              <div className="match-heading">
                <span>NEXT MATCHUP</span>
                <span>
                  DIFFERENT LANGUAGE
                  <br />
                  SAME GAME
                </span>
              </div>
              <h2>
                {team.city} {team.name}
                <span>
                  vs {opponent.city} {opponent.name}
                </span>
              </h2>
              <button
                className="field-preview-button"
                onClick={() => navigate("gameday")}
                aria-label="Choose your team and view game day"
              >
                <img
                  src="/assets/football-preview.webp"
                  alt="A retro pixel-art American football field"
                />
              </button>
              <button
                className="button primary"
                onClick={startGame}
                disabled={gameLoading}
              >
                <Goal size={22} />
                {gameLoading
                  ? "Opening the field…"
                  : `Play ${opponent.name === "· 1997" ? opponent.city : `the ${opponent.name}`}`}
                <ArrowRight size={20} />
              </button>
            </aside>
          </section>
          <section
            className="week-route"
            aria-label="Your first week of Spanish"
          >
            {LESSONS.map((l) => (
              <button
                key={l.id}
                onClick={() => startLesson(l.id)}
                className={`${progress.completedLessons.includes(l.id) ? "completed" : ""} ${l.id === nextLesson.id ? "current" : ""}`}
                aria-label={`Day ${l.id}: ${l.title}${progress.completedLessons.includes(l.id) ? ", completed" : ""}`}
              >
                <span className="day-number">
                  {progress.completedLessons.includes(l.id) ? (
                    <Check size={18} />
                  ) : (
                    l.id
                  )}
                </span>
                <span>{l.title}</span>
              </button>
            ))}
          </section>
          <p className="curriculum-summary">
            {LESSONS.length} practices ·{" "}
            {LESSONS.reduce(
              (total, lesson) => total + lesson.phrases.length,
              0,
            )}{" "}
            useful phrases · Listen, speak, and recall in both directions.
          </p>
          <section className="daily-phrase">
            <div className="daily-phrase-copy">
              <span className="label">TODAY’S PHRASE</span>
              <h2 lang="es-PR">¡Hola! ¿Cómo estás?</h2>
              <p>Hi! How are you?</p>
            </div>
            <Pronunciation text="¡Hola! ¿Cómo estás?" compact />
            <div className="phrase-tip">
              <span className="tip-light">✦</span>
              <div>
                <span className="label">TIP</span>
                <p>Listen. Say it. Make it yours.</p>
              </div>
            </div>
          </section>
          {(progress.xp > 0 || due.length > 0) && (
            <section className="progress-strip">
              <span>
                <strong>{progress.completedLessons.length}/7</strong> practices
                completed
              </span>
              <span>
                <strong>{progress.xp}</strong> practice XP
              </span>
              <span>
                <strong>{progress.bestTouchdowns}</strong> best touchdowns
              </span>
              <button
                className="text-button"
                onClick={() =>
                  startLesson(
                    nextLesson.id,
                    due.length
                      ? due.slice(0, 6)
                      : LESSONS.filter((l) =>
                          progress.completedLessons.includes(l.id),
                        )
                          .flatMap((l) => l.phrases)
                          .slice(0, 6),
                  )
                }
                disabled={!due.length && !progress.completedLessons.length}
              >
                <RotateCcw size={17} />
                {due.length
                  ? `Review ${Math.min(due.length, 6)} due phrases`
                  : "Review your words"}
              </button>
            </section>
          )}
        </main>
      )}
      <InstallApp />
      <footer className="site-footer page-width">
        <span>
          <Flag /> PUERTO RICAN ROOTS. REAL-WORLD SPANISH.
        </span>
        <div />
        <button onClick={() => setAbout(true)}>Learning & privacy</button>
        <span className="save-status">
          {saved ? "Progress saved on this device" : "Progress not saved"}
        </span>
      </footer>
      {about && <About onClose={() => setAbout(false)} />}
    </>
  );
}
function About({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      className="about-dialog"
      ref={dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      aria-labelledby="about-title"
    >
      <button
        className="dialog-close"
        aria-label="Close learning and privacy"
        onClick={onClose}
      >
        <X />
      </button>
      <Flag />
      <h2 id="about-title">A little every day.</h2>
      <p>
        Coquí Kickoff is a seven-day starter camp for a teen learning Spanish.
        Try one practice a day, then revisit your due phrases. You can always
        practice at your own pace.
      </p>
      <p>
        Each practice teaches six useful words or phrases, then gives you six
        Spanish-to-English questions and six English-to-Spanish responses.
        That’s 42 phrases and 84 core answer prompts across the first week, plus
        listening, optional speaking practice, retries, and spaced review.
      </p>
      <h3>Built around remembering</h3>
      <p>
        Listen to a model, connect the phrase to meaning, recall it in both
        directions, and revisit it later. Missed answers return during practice.
        Review intervals grow from 1 to 3 to 7 days. These are practical
        starting intervals, not a guarantee of fluency.
      </p>
      <h3>Puerto Rican roots</h3>
      <p>
        You’ll meet words like <span lang="es-PR">china, guagua,</span> and{" "}
        <span lang="es-PR">habichuelas</span>. Puerto Rican Spanish varies by
        speaker. Every lesson includes bundled Puerto Rican Spanish audio using
        Microsoft’s Víctor voice. These are synthetic recordings, with normal
        and slower playback.
      </p>
      <h3>Your device, your progress</h3>
      <p>
        No account, ads, analytics, or chat. Progress is stored in this browser
        and won’t automatically follow you to another device. Optional
        recordings stay in memory and disappear when you leave the exercise. The
        app never uploads recordings. After the “Ready for offline practice”
        message appears, the lessons, pronunciation clips and football game work
        without a connection. The optional celebration video loads only when you
        play it.
      </p>
      <h3>Keep learning off the screen</h3>
      <p>
        Try a phrase with family. Ask how they would say it. Their voices and
        stories are part of the playbook, too.
      </p>
      <p className="about-sources">
        Learning approach:{" "}
        <a
          href="https://ies.ed.gov/ncee/wwc/PracticeGuide/1"
          target="_blank"
          rel="noreferrer"
        >
          IES learning guide
        </a>{" "}
        ·{" "}
        <a
          href="https://www.actfl.org/educator-resources/guiding-principles-for-language-learning/facilitate-target-language-use"
          target="_blank"
          rel="noreferrer"
        >
          ACTFL
        </a>{" "}
        ·{" "}
        <a
          href="https://www.asale.org/damer/china"
          target="_blank"
          rel="noreferrer"
        >
          ASALE vocabulary
        </a>
      </p>
      <p className="hint-text">
        Independent educational fan project. Not affiliated with the NFL, its
        teams, EA, or Madden. Original game art; no official team logos.
      </p>
      <p className="hint-text">Created by Luis Betancourt. <a href="https://github.com/LueBangs-coder/coqui-kickoff" target="_blank" rel="noreferrer">Public source on GitHub</a>.</p>
      <button className="button primary" onClick={onClose}>
        Back to camp <ArrowRight size={18} />
      </button>
    </dialog>
  );
}
