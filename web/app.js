// Loads data/casinos.json and renders it. Uses textContent everywhere (no innerHTML)
// so scraped text can never inject markup.
// Two relative paths are tried: "data/casinos.json" (deployed site, where the
// workflow places data/ next to index.html) and "../data/casinos.json" (local
// dev, serving the repo root and opening /web/).
const DATA_PATHS = ["data/casinos.json", "../data/casinos.json"];

const statusEl = document.getElementById("status");
const wrapEl = document.getElementById("table-wrap");
const rowsEl = document.getElementById("rows");
const metaEl = document.getElementById("meta");

async function loadData() {
  let lastError = null;
  for (const path of DATA_PATHS) {
    try {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) { lastError = new Error(`${path} returned HTTP ${res.status}`); continue; }
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Could not load data");
}

function cell(value) {
  const td = document.createElement("td");
  if (typeof value === "string" && value.trim()) {
    td.textContent = value;
  } else {
    td.textContent = "Not stated";
    td.className = "missing";
  }
  return td;
}

function sourceCell(url) {
  const td = document.createElement("td");
  let ok = false;
  try { ok = ["http:", "https:"].includes(new URL(url).protocol); } catch (_) {}
  if (ok) {
    const a = document.createElement("a");
    a.href = url;
    a.textContent = "View source";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    td.appendChild(a);
  } else {
    td.textContent = "Not stated";
    td.className = "missing";
  }
  return td;
}

function render(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("The data file contains no casino records.");
  }
  for (const r of records) {
    const tr = document.createElement("tr");
    tr.append(cell(r.casino_name), cell(r.bonus_offer), cell(r.max_bonus),
              cell(r.wagering_requirement), sourceCell(r.source_url));
    rowsEl.appendChild(tr);
  }
  const times = records.map(r => r.scraped_at).filter(Boolean).sort();
  if (times.length) metaEl.textContent = `Data scraped at ${times[times.length - 1]}`;
  statusEl.hidden = true;
  wrapEl.hidden = false;
}

loadData()
  .then(render)
  .catch(err => {
    statusEl.textContent = `Could not load bonus data: ${err.message}`;
    statusEl.className = "error";
  });
