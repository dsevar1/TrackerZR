import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useCallback } from "react";
import { API_EVENTS, fetchScreenshots } from "../api";

export default function Details() {
  const { date, uuid } = useParams();
  const { state } = useLocation();
  const preloaded = state?.preloaded;
  const navigate = useNavigate();

  const [rows, setRows] = useState(Array.isArray(preloaded) ? preloaded : null);
  const [status, setStatus] = useState(rows ? "Buttons pressed:" : "Loading…");
  const [screenshots, setScreenshots] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await fetchScreenshots();
      setScreenshots(data);
    })();
  }, []);

  useEffect(() => {
    if (rows) return;
    (async () => {
      try {
        setStatus("Loading…");
        const res = await fetch(API_EVENTS, { cache: "no-store" });
        const all = res.ok ? await res.json() : [];
        const sameDay = (ts) =>
          new Date(ts).toLocaleDateString("en-CA") === date;
        const filtered = all.filter(
          (e) => e.uuid === uuid && sameDay(e.timestamp)
        );
        setRows(filtered);
        setStatus(`Buttons pressed: ${filtered.length}`);
      } catch (e) {
        setStatus("Failed to load: " + e.message);
        console.error(e);
      }
    })();
  }, [date, uuid, rows]);

  const { filteredRows, screenshotRows } = useMemo(() => {
    if (!Array.isArray(rows)) return { filteredRows: [], screenshotRows: [] };

    const screenshotEvents = rows.filter((e) =>
      (e.action ?? "").toLowerCase().includes("screenshot")
    );

    const normalEvents = rows
      .filter((e) => !(e.action ?? "").toLowerCase().includes("screenshot"))
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

    return { filteredRows: normalEvents, screenshotRows: screenshotEvents };
  }, [rows]);

  const { matchedScreens, unmatchedEvents, orphanShots } = useMemo(() => {
    if (!Array.isArray(screenshotRows) || !Array.isArray(screenshots)) {
      return { matchedScreens: [], unmatchedEvents: [], orphanShots: [] };
    }

    const keyFor = (sid, ts) => `${sid}|${Number(ts)}`;

    const shotByKey = new Map();
    for (const s of screenshots) {
      const sid = s.sessionId || s.uuid || "";
      if (!sid || s.timestamp == null) continue;
      shotByKey.set(keyFor(sid, s.timestamp), s);
    }

    const matched = [];
    const unmatched = [];

    for (const ev of screenshotRows) {
      const sid = ev.uuid || ev.sessionId || "";
      if (!sid || ev.timestamp == null) {
        unmatched.push(ev);
        continue;
      }
      const shot = shotByKey.get(keyFor(sid, ev.timestamp));
      if (shot) {
        matched.push({ event: ev, shot });
      } else {
        unmatched.push(ev);
      }
    }

    const sameDay = (t) => new Date(t).toLocaleDateString("en-CA") === date;
    const forSessionAndDay = screenshots.filter(
      (s) => (s.sessionId || s.uuid) === uuid && sameDay(s.timestamp)
    );
    const matchedShotRefs = new Set(matched.map((m) => m.shot));
    const orphans = forSessionAndDay.filter((s) => !matchedShotRefs.has(s));

    return {
      matchedScreens: matched,
      unmatchedEvents: unmatched,
      orphanShots: orphans,
    };
  }, [screenshotRows, screenshots, date, uuid]);

  const slides = useMemo(() => {
    if (!Array.isArray(matchedScreens)) return [];

    const toSrc = (s) => {
      const raw = s?.screenshot || s?.base64 || s?.h64 || "";
      return typeof raw === "string" && raw.startsWith("data:image/")
        ? raw
        : raw
        ? `data:image/png;base64,${raw}`
        : "";
    };

    const uniq = new Map();
    for (const m of matchedScreens) {
      const ts = Number(m.shot?.timestamp ?? m.event?.timestamp);
      if (!uniq.has(ts)) {
        uniq.set(ts, {
          timestamp: ts,
          src: toSrc(m.shot),
          label:
            new Date(ts).toLocaleString() +
            (m.event?.action ? ` — ${m.event.action}` : ""),
        });
      }
    }
    return [...uniq.values()].sort((a, b) => a.timestamp - b.timestamp);
  }, [matchedScreens]);

  const buttonCounts = useMemo(() => {
    const map = new Map();
    for (const e of filteredRows) {
      const name = (e.action ?? e.name ?? "(no action)").trim();
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
  }, [filteredRows]);

  const [showAllButtons, setShowAllButtons] = useState(false);
  const [idx, setIdx] = useState(0);

  const clamp = useCallback(
    (i) => Math.max(0, Math.min(i, Math.max(0, slides.length - 1))),
    [slides.length]
  );
  const goPrev = () => setIdx((i) => clamp(i - 1));
  const goNext = () => setIdx((i) => clamp(i + 1));

  return (
    <div style={{ display: "flex" }}>
      <div style={{ margin: 24 }}>
        <p style={{ marginTop: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </p>
        <h1>Details</h1>
        <p>
          <b>Date:</b> {date}
        </p>
        <p>
          <b>UUID:</b> {uuid}
        </p>
        <p style={{ opacity: 0.7 }}>{status}</p>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 8,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Grouped buttons</h3>

          {buttonCounts.length === 0 ? (
            <p>No button events.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #ddd",
                      padding: "6px 4px",
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                      padding: "6px 4px",
                    }}
                  >
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {buttonCounts.slice(0, 10).map(({ name, count }) => (
                  <tr key={name}>
                    <td
                      style={{
                        padding: "6px 4px",
                        borderBottom: "1px solid #f3f3f3",
                        maxWidth: 420,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={name}
                    >
                      {name}
                    </td>
                    <td
                      style={{
                        padding: "6px 4px",
                        borderBottom: "1px solid #f3f3f3",
                        textAlign: "right",
                      }}
                    >
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setShowAllButtons((s) => !s)}
            style={{
              padding: "6px 12px",
              marginLeft: 65,
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {showAllButtons ? "Hide individual buttons" : "View individual buttons"}
          </button>

          {showAllButtons &&
            (filteredRows.length === 0 ? (
              <p style={{ marginTop: 8 }}>No rows.</p>
            ) : (
              <ul style={{ marginTop: 8 }}>
                {filteredRows.map((e, i) => (
                  <li key={e.id || e._id || e.timestamp || i}>
                    {new Date(e.timestamp).toLocaleString()} —{" "}
                    {e.action ?? e.name ?? "(no action)"}
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </div>

      <div style={{ margin: 24, padding: 12, marginLeft: 20 }}>
        <h2>Screenshots</h2>
        <div
          style={{
            margin: 24,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
            maxWidth: 720,
          }}
        >
          {slides.length === 0 ? (
            <p>No screenshots found.</p>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 14, opacity: 0.8 }}>
                  {slides[idx].label}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {idx + 1} / {slides.length}
                </div>
              </div>

              <div style={{ width: "70%", textAlign: "center" }}>
                <img
                  src={slides[idx].src}
                  alt={`screenshot ${idx + 1}`}
                  style={{
                    maxWidth: "70%",
                    height: "auto",
                    maxHeight: "1200px",
                    borderRadius: 6,
                    border: "1px solid #eee",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <button onClick={goPrev} disabled={idx === 0}>
                  Prev
                </button>

                <input
                  type="range"
                  min={0}
                  max={Math.max(0, slides.length - 1)}
                  step={1}
                  value={idx}
                  onChange={(e) => setIdx(Number(e.target.value))}
                  style={{ flex: 1 }}
                />

                <button onClick={goNext} disabled={idx === slides.length - 1}>
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
