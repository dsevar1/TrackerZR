import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_EVENTS } from "../api";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  async function load() {
    setStatus("Loading...");
    try {
      const res = await fetch(API_EVENTS, { cache: "no-store" });
      const json = res.ok ? await res.json() : [];
      setEvents(Array.isArray(json) ? json : []);
      setStatus(`Loaded ${Array.isArray(json) ? json.length : 0} events`);
    } catch (e) {
      console.error(e);
      setStatus("Failed to load: " + e.message);
    }
  }

  const groupByDateAndID = (uuid, items) =>
    items.filter((i) => i.uuid === uuid);

  const grouped = useMemo(() => {
    const toYMDLocal = (ts) => new Date(ts).toLocaleDateString("en-CA");
    return events.reduce((acc, e) => {
      const key = toYMDLocal(e.timestamp);
      (acc[key] ||= []).push(e);
      return acc;
    }, {});
  }, [events]);

  useEffect(() => {
    load();
  }, []);

  return (
    <div
      style={{
        margin: 24,
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <h1 style={{ margin: "0 0 16px" }}>Tracker Events (JSON)</h1>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <button onClick={load}>Refresh</button>
        <p
          style={{
            margin: 0,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 12,
          }}
        >
          {status}
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p>No events yet.</p>
      ) : (
        Object.entries(grouped).map(([date, items]) => {
          const uniqueUuids = [...new Set(items.map((e) => e.uuid))];
          return (
            <div
              key={date}
              style={{
                marginBottom: 16,
                border: "1px solid #eee",
                padding: 12,
              }}
            >
              <strong>{date}</strong>{" "}
              <span style={{ opacity: 0.7 }}>({items.length} events)</span>
              <ul style={{ marginTop: 8 }}>
                {uniqueUuids.map((uuid) => (
                  <li key={uuid} style={{ marginBottom: 4 }}>
                    {uuid}
                    <button
                      onClick={() =>
                        navigate(`/details/${uuid}/${date}`, {
                          state: { preloaded: groupByDateAndID(uuid, items) }, // <-- pass the array
                        })
                      }
                      style={{ marginLeft: "16px" }}
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}
