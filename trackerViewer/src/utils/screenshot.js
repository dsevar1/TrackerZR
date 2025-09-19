import { SCREENSHOT_URL, TIME_SLOP_MS } from "../api";

let screenshotCache = null; 

export function tsToString(ts) {
  if (!ts || ts === 0) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export async function getScreenshotsList() {
  if (Array.isArray(screenshotCache)) return screenshotCache;
  const res = await fetch(SCREENSHOT_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Could not load ${SCREENSHOT_URL} (HTTP ${res.status})`);
  }
  const json = await res.json();
  screenshotCache = Array.isArray(json) ? json : [];
  return screenshotCache;
}

export function findInlineBase64(row) {
  const val =
    row?.screenshot ||
    row?.h64 ||
    row?.base64 ||
    row?.b64 ||
    row?.image?.h64 ||
    row?.image?.base64;

  if (!val) return null;

  if (typeof val === "string" && val.startsWith("data:image/")) {
    return { b64: val, isDataUrl: true, mime: null };
  }

  return {
    b64: val,
    isDataUrl: false,
    mime: row.mime || row.contentType || "image/jpeg",
  };
}

export function bestScreenshotForRow(row, screenshots) {
  if (!row) return null;
  const ts = Number(row.timestamp) || 0;
  const sid = row.sessionId || row.uuid || "";

  let best = null,
    bestDelta = Infinity;
  for (const s of screenshots) {
    if (sid && s.sessionId && s.sessionId !== sid) continue;
    const d = Math.abs((Number(s.timestamp) || 0) - ts);
    if (d < bestDelta) {
      best = s;
      bestDelta = d;
    }
  }
  if (best && bestDelta <= TIME_SLOP_MS) return best;

  if (!sid && ts) {
    best = null;
    bestDelta = Infinity;
    for (const s of screenshots) {
      const d = Math.abs((Number(s.timestamp) || 0) - ts);
      if (d < bestDelta) {
        best = s;
        bestDelta = d;
      }
    }
    if (best && bestDelta <= TIME_SLOP_MS) return best;
  }
  return null;
}

export function openBase64InNewTab({ b64, mime, isDataUrl = false }) {
  try {
    if (
      isDataUrl ||
      (typeof b64 === "string" && b64.startsWith("data:image/"))
    ) {
      const [header, data] = b64.split(",");
      const mt =
        (header.match(/data:(.*?);base64/) || [])[1] || mime || "image/jpeg";
      const bin = atob(data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: mt }));
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      return;
    }
    const clean = b64.replace(/\s/g, "");
    const byteChars = atob(clean);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++)
      bytes[i] = byteChars.charCodeAt(i);
    const url = URL.createObjectURL(
      new Blob([bytes], { type: mime || "image/jpeg" })
    );
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (err) {
    alert("Could not open screenshot: " + (err?.message || err));
    console.error(err);
  }
}

export async function resolveAndOpenScreenshot(row, setBtnLabel, setDisabled) {
  const inline = findInlineBase64(row);
  if (inline) return openBase64InNewTab(inline);

  try {
    setDisabled?.(true);
    setBtnLabel?.("Opening...");
    const list = await getScreenshotsList();
    if (!list || list.length === 0) {
      alert("No screenshots found at " + SCREENSHOT_URL);
      return;
    }
    const match = bestScreenshotForRow(row, list);
    if (!match || !match.screenshot) {
      alert("No matching screenshot entry found for this event.");
      return;
    }
    openBase64InNewTab({ b64: match.screenshot, isDataUrl: true });
  } catch (e) {
    alert(e.message);
    console.error(e);
  } finally {
    setDisabled?.(false);
    setBtnLabel?.("Open");
  }
}
