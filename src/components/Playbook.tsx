import { useState } from "react";
import { ArrowRight, Search, Volume2 } from "lucide-react";
import { LESSONS } from "../data/curriculum";
import Pronunciation from "./Pronunciation";
import type { Progress } from "../lib/progress";
export default function Playbook({
  progress,
  onPractice,
}: {
  progress: Progress;
  onPractice: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [day, setDay] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const normalized = search.toLocaleLowerCase("es");
  const shown = LESSONS.filter((l) => !day || l.id === day)
    .map((l) => ({
      ...l,
      phrases: l.phrases.filter((p) =>
        `${p.spanish} ${p.english} ${p.note ?? ""}`
          .toLocaleLowerCase("es")
          .includes(normalized),
      ),
    }))
    .filter((l) => l.phrases.length);
  return (
    <main id="main" className="page-width playbook">
      <div className="page-heading">
        <div>
          <h1>Your Spanish playbook.</h1>
          <p>
            Every phrase, one tap away. Listen. Repeat. Take it into real life.
          </p>
        </div>
        <span className="count-label">42 phrases · 7 practices</span>
      </div>
      <div className="playbook-filters">
        <label className="search-field">
          <Search size={20} />
          <input
            aria-label="Search phrases"
            placeholder="Find a word in Spanish or English…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter by practice"
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
        >
          <option value={0}>All practices</option>
          {LESSONS.map((l) => (
            <option key={l.id} value={l.id}>
              Day {l.id} · {l.title}
            </option>
          ))}
        </select>
      </div>
      <aside className="vowel-note">
        <strong>Five vowels. A strong start.</strong>
        <span lang="es">a · e · i · o · u</span>
        <p>
          Keep vowel sounds short and clear. The h is silent. Listen first; the
          written syllable guide highlights stress.
        </p>
        <Pronunciation text="a, e, i, o, u" compact />
      </aside>
      {shown.length === 0 && (
        <p className="empty-state">
          No match yet. Try a shorter word, or clear the search.
        </p>
      )}
      {shown.map((l) => (
        <section className="playbook-section" key={l.id}>
          <div className="section-title">
            <h2>
              <span>{String(l.id).padStart(2, "0")}</span> {l.title}
            </h2>
            <button className="text-button" onClick={() => onPractice(l.id)}>
              Practice <ArrowRight size={17} />
            </button>
          </div>
          {l.phrases.map((p) => (
            <article className="phrase-row" key={p.id}>
              <button
                className="phrase-expand"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                aria-expanded={expanded === p.id}
              >
                <span>
                  <strong lang="es-PR">{p.spanish}</strong>
                  <span>{p.english}</span>
                </span>
                <span className="phrase-tag">
                  {progress.cards[p.id]?.correct ? "Practiced" : "New"}{" "}
                  <Volume2 size={18} />
                </span>
              </button>
              {expanded === p.id && (
                <div className="phrase-details">
                  <p className="syllables" lang="es">
                    {p.pronunciation}
                  </p>
                  {p.note && <p>{p.note}</p>}
                  <Pronunciation text={p.spanish} />
                </div>
              )}
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
