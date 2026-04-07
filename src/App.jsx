import React, { useEffect, useMemo, useState, useRef } from "react";

/* ─── persistence key ─────────────────────────────────────── */
const STORAGE_KEY = "interactive-wall-calendar-v3";

/* ─── Indian public holidays ──────────────────────────────── */
const HOLIDAYS = {
  "2025-01-26": "Republic Day",
  "2025-03-14": "Holi",
  "2025-04-14": "Dr. Ambedkar Jayanti",
  "2025-04-18": "Good Friday",
  "2025-05-12": "Buddha Purnima",
  "2025-08-15": "Independence Day",
  "2025-08-16": "Janmashtami",
  "2025-10-02": "Gandhi Jayanti",
  "2025-10-20": "Diwali",
  "2025-11-05": "Guru Nanak Jayanti",
  "2025-12-25": "Christmas",
  "2026-01-26": "Republic Day",
  "2026-02-26": "Holi",
  "2026-04-03": "Good Friday",
  "2026-04-14": "Dr. Ambedkar Jayanti",
  "2026-05-31": "Buddha Purnima",
  "2026-08-15": "Independence Day",
  "2026-09-02": "Janmashtami",
  "2026-10-02": "Gandhi Jayanti",
  "2026-11-10": "Diwali",
  "2026-11-24": "Guru Nanak Jayanti",
  "2026-12-25": "Christmas",
};

/* ─── helpers ─────────────────────────────────────────────── */
const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const normalizeDate = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const compareDates = (a, b) => normalizeDate(a) - normalizeDate(b);

const formatMonthYear = (date) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
const formatShortDate = (date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
const formatNiceDateTime = (iso) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso)
  );

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const mondayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - mondayIndex);
  const grid = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    grid.push({ date, inMonth: date.getMonth() === month });
  }
  return grid;
}

/* Per-month gradient themes */
const MONTH_THEMES = [
  { from: "#0f2044", to: "#1a3a6e", emoji: "❄️" },
  { from: "#1b1040", to: "#2d1e6e", emoji: "💜" },
  { from: "#0a2e1e", to: "#165c38", emoji: "🌿" },
  { from: "#2e0d2e", to: "#6b2060", emoji: "🌸" },
  { from: "#0f2e10", to: "#257a28", emoji: "🌻" },
  { from: "#0b2540", to: "#0e5c8a", emoji: "🌊" },
  { from: "#3a1400", to: "#a84800", emoji: "☀️" },
  { from: "#1a2e10", to: "#3c7020", emoji: "🍃" },
  { from: "#2c1200", to: "#7a3510", emoji: "🍂" },
  { from: "#1a0a00", to: "#6b3010", emoji: "🎃" },
  { from: "#0d1230", to: "#243060", emoji: "🍁" },
  { from: "#06111e", to: "#0e3356", emoji: "🎄" },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      viewMonth: p.viewMonth ? new Date(p.viewMonth) : new Date(),
      rangeStart: p.rangeStart ? new Date(p.rangeStart) : null,
      rangeEnd: p.rangeEnd ? new Date(p.rangeEnd) : null,
      notes: Array.isArray(p.notes) ? p.notes : [],
      theme: p.theme || "light",
    };
  } catch { return null; }
}

export default function App() {
  const today = useMemo(() => new Date(), []);
  const initial = useMemo(() => loadState(), []);

  const [viewDate, setViewDate] = useState(initial?.viewMonth ?? new Date());
  const [rangeStart, setRangeStart] = useState(initial?.rangeStart ?? null);
  const [rangeEnd, setRangeEnd] = useState(initial?.rangeEnd ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? []);
  const [noteText, setNoteText] = useState("");
  const [theme, setTheme] = useState(initial?.theme ?? "light");
  const [isFlipping, setIsFlipping] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);

  /* persist */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      viewMonth: viewDate.toISOString(),
      rangeStart: rangeStart?.toISOString() ?? null,
      rangeEnd: rangeEnd?.toISOString() ?? null,
      notes,
      theme,
    }));
  }, [viewDate, rangeStart, rangeEnd, notes, theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const monthGrid = buildMonthGrid(viewDate);
  const monthLabel = formatMonthYear(viewDate);
  const monthTheme = MONTH_THEMES[viewDate.getMonth()];

  const hasSelection = Boolean(rangeStart);
  const hasRange = Boolean(rangeStart && rangeEnd);
  const selectionLabel = hasRange
    ? `${formatShortDate(rangeStart)} — ${formatShortDate(rangeEnd)}`
    : rangeStart ? formatShortDate(rangeStart) : "Select a date range";
  const selectionKey = hasRange
    ? `${dateKey(rangeStart)}_${dateKey(rangeEnd)}`
    : rangeStart ? dateKey(rangeStart) : null;
  const activeNotes = selectionKey ? notes.filter((n) => n.key === selectionKey) : [];
  const displayedNotes = showAllNotes ? notes : activeNotes;

  function navigate(dir) {
    if (isFlipping) return;
    setIsFlipping(dir);
    setTimeout(() => {
      setViewDate((d) =>
        dir === "prev"
          ? new Date(d.getFullYear(), d.getMonth() - 1, 1)
          : new Date(d.getFullYear(), d.getMonth() + 1, 1)
      );
      setIsFlipping(false);
    }, 340);
  }

  function handleDayClick(clickedDate) {
    const clicked = normalizeDate(clickedDate);
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(clicked);
      setRangeEnd(null);
      return;
    }
    if (compareDates(clicked, rangeStart) < 0) {
      setRangeEnd(rangeStart);
      setRangeStart(clicked);
      return;
    }
    setRangeEnd(clicked);
  }

  function handleSaveNote() {
    const text = noteText.trim();
    if (!text || !rangeStart) return;
    const isRange = Boolean(rangeEnd);
    const key = isRange
      ? `${dateKey(rangeStart)}_${dateKey(rangeEnd)}`
      : dateKey(rangeStart);
    const label = isRange
      ? `${formatShortDate(rangeStart)} — ${formatShortDate(rangeEnd)}`
      : formatShortDate(rangeStart);
    const newNote = {
      id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      key, label, text, createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev.filter((n) => n.key !== key)]);
    setNoteText("");
  }

  function handleDeleteNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function resetSelection() {
    setRangeStart(null);
    setRangeEnd(null);
    setNoteText("");
  }

  const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(viewDate);

  return (
    <div className="page-shell">
      <button
        className="theme-toggle"
        onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        aria-label="Toggle theme"
        title={theme === "light" ? "Switch to dark" : "Switch to light"}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      <main className="calendar-app">
        {/* ── Hero ── */}
        <section
          className="hero-card"
          style={{ "--hero-from": monthTheme.from, "--hero-to": monthTheme.to }}
        >
          <div className="binding" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, i) => <span key={i} />)}
          </div>

          <div className="hero-image">
            <svg className="hero-scene" viewBox="0 0 1200 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--hero-from)" />
                  <stop offset="100%" stopColor="var(--hero-to)" />
                </linearGradient>
                <radialGradient id="sunGlow" cx="75%" cy="28%" r="20%">
                  <stop offset="0%" stopColor="rgba(255,210,60,0.5)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
              </defs>
              <rect width="1200" height="380" fill="url(#skyGrad)" />
              <ellipse cx="900" cy="106" rx="80" ry="80" fill="url(#sunGlow)" />
              <circle cx="900" cy="106" r="44" fill="rgba(255,225,90,0.9)" />
              {[[60,30],[170,18],[310,52],[470,22],[620,44],[760,15],[980,30],[1080,50],[1140,20],[240,65],[540,38]].map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r="1.8" fill="rgba(255,255,255,0.65)" />
              ))}
              <polygon points="0,290 160,110 320,270 500,80 680,250 860,65 1040,230 1200,140 1200,380 0,380" fill="rgba(0,0,0,0.38)" />
              <polygon points="0,340 100,210 260,300 420,175 580,295 740,140 900,275 1060,185 1200,250 1200,380 0,380" fill="rgba(0,0,0,0.52)" />
              <polygon points="500,80 472,132 528,132" fill="rgba(255,255,255,0.82)" />
              <polygon points="860,65 834,114 886,114" fill="rgba(255,255,255,0.78)" />
              <rect y="355" width="1200" height="25" fill="rgba(0,0,0,0.6)" />
              {/* Climber */}
              <g transform="translate(858,188)" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="0" cy="-20" r="5.5" fill="rgba(255,255,255,0.9)" stroke="none" />
                <line x1="0" y1="-14" x2="0" y2="5" />
                <line x1="0" y1="-6" x2="-9" y2="3" />
                <line x1="0" y1="-6" x2="11" y2="-16" />
                <line x1="0" y1="5" x2="-5" y2="19" />
                <line x1="0" y1="5" x2="7" y2="19" />
              </g>
            </svg>

            <div className="hero-overlay">
              <div className="hero-badge">
                <span>{monthTheme.emoji}</span> Wall Calendar
              </div>
              <div className="hero-month-label">
                <span className="hero-year">{viewDate.getFullYear()}</span>
                <span className="hero-month-name">{monthName}</span>
              </div>
              <p>Select dates · attach notes · plan your month</p>
            </div>
          </div>

          <div className="hero-strip">
            <div className="strip-cell">
              <span className="muted-label">Current month</span>
              <strong>{monthLabel}</strong>
            </div>
            <div className="strip-cell">
              <span className="muted-label">Selection</span>
              <strong>{selectionLabel}</strong>
            </div>
            <div className="strip-cell">
              <span className="muted-label">Total notes</span>
              <strong>{notes.length} saved</strong>
            </div>
          </div>
        </section>

        {/* ── Workspace ── */}
        <section className="workspace">
          <div className={`calendar-panel${isFlipping ? ` flip-${isFlipping}` : ""}`}>
            <div className="panel-header">
              <button type="button" className="nav-btn" onClick={() => navigate("prev")} aria-label="Previous month">‹</button>
              <div className="panel-title">
                <h2>{monthLabel}</h2>
                <p>Click to start range · click again to end</p>
              </div>
              <button type="button" className="nav-btn" onClick={() => navigate("next")} aria-label="Next month">›</button>
            </div>

            <div className="weekday-row" aria-hidden="true">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="date-grid" role="grid" aria-label={monthLabel}>
              {monthGrid.map(({ date, inMonth }) => {
                const curr = normalizeDate(date);
                const ct = curr.getTime();
                const st = rangeStart ? normalizeDate(rangeStart).getTime() : null;
                const et = rangeEnd ? normalizeDate(rangeEnd).getTime() : null;
                const isToday = isSameDay(curr, today);
                const isStart = rangeStart ? isSameDay(curr, rangeStart) : false;
                const isEnd = rangeEnd ? isSameDay(curr, rangeEnd) : false;
                const inRange = st !== null && (et !== null
                  ? ct >= Math.min(st,et) && ct <= Math.max(st,et)
                  : isStart);
                const dk = dateKey(date);
                const holiday = HOLIDAYS[dk];
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const cls = [
                  "day-cell",
                  inMonth ? "current-month" : "outside-month",
                  inRange ? "in-range" : "",
                  isStart ? "range-start" : "",
                  isEnd ? "range-end" : "",
                  isToday ? "today" : "",
                  isWeekend && inMonth ? "weekend" : "",
                  holiday ? "has-holiday" : "",
                ].filter(Boolean).join(" ");

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={cls}
                    onClick={() => handleDayClick(date)}
                    aria-pressed={inRange}
                    aria-label={`${date.toDateString()}${isToday ? ", today" : ""}${holiday ? `, ${holiday}` : ""}`}
                    title={holiday}
                  >
                    <span className="day-number">{date.getDate()}</span>
                    {holiday && <span className="holiday-dot" aria-hidden="true" />}
                    {isToday && <span className="today-pill" aria-hidden="true">Today</span>}
                  </button>
                );
              })}
            </div>

            <div className="calendar-footer">
              <span className="legend-item"><span className="legend-dot l-holiday" />Holiday</span>
              <span className="legend-item"><span className="legend-dot l-today" />Today</span>
              <span className="legend-item"><span className="legend-dot l-range" />Selected</span>
              <span className="legend-item"><span className="legend-dot l-weekend" />Weekend</span>
            </div>
          </div>

          {/* Notes panel */}
          <aside className="notes-panel">
            <div className="panel-card">
              <h3>📝 Add Note</h3>
              <p className="subtle">Attach a memo to the selected date or range.</p>

              <div className="selection-summary">
                <span className="muted-label">Active selection</span>
                <strong>{hasSelection ? selectionLabel : "No date selected"}</strong>
              </div>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Trip to Goa, college event, interview prep…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveNote();
                }}
              />
              <span className="hint">Ctrl+Enter to save</span>

              <button type="button" className="primary-btn" onClick={handleSaveNote} disabled={!noteText.trim() || !rangeStart}>
                Save Note
              </button>
              <button type="button" className="ghost-btn" onClick={resetSelection}>
                Reset Selection
              </button>
            </div>

            <div className="panel-card">
              <div className="notes-head">
                <h3>{showAllNotes ? "All Notes" : "For Selection"}</h3>
                <button className="toggle-notes-btn" onClick={() => setShowAllNotes((v) => !v)}>
                  {showAllNotes ? "← Selection" : `All (${notes.length})`}
                </button>
              </div>

              {displayedNotes.length === 0 ? (
                <div className="empty-state">
                  {showAllNotes ? "No notes saved yet." : "Pick dates above and write your first note."}
                </div>
              ) : (
                <div className="notes-list">
                  {displayedNotes.map((note) => (
                    <article className="note-item" key={note.id}>
                      <div className="note-top">
                        <span className="note-label">{note.label}</span>
                        <button type="button" className="icon-btn" onClick={() => handleDeleteNote(note.id)} aria-label="Delete note">✕</button>
                      </div>
                      <p>{note.text}</p>
                      <time className="note-time">{formatNiceDateTime(note.createdAt)}</time>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
