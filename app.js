"use strict";

const PROJECT_NAME = "WorldTracker2026";
const STORAGE_KEY = "worldtracker2026-v1";
const LEGACY_STORAGE_KEYS = ["mundial-2026-caderneta-v1"];
const SELECTION_START = 1;
const STICKERS_PER_SELECTION = 19;
const SPECIAL_STICKERS = 68;
const QUALIFIED_SELECTIONS = [
  "Africa do Sul",
  "Alemanha",
  "Algeria",
  "Arabia Saudita",
  "Argentina",
  "Australia",
  "Austria",
  "Belgica",
  "Bosnia e Herzegovina",
  "Brasil",
  "Cabo Verde",
  "Canada",
  "Chequia",
  "Colombia",
  "Coreia do Sul",
  "Costa do Marfim",
  "Croacia",
  "Curacao",
  "Egito",
  "Equador",
  "Escocia",
  "Espanha",
  "Estados Unidos",
  "Franca",
  "Gana",
  "Haiti",
  "Inglaterra",
  "Irao",
  "Iraque",
  "Japao",
  "Jordania",
  "Marrocos",
  "Mexico",
  "Noruega",
  "Nova Zelandia",
  "Paises Baixos",
  "Panama",
  "Paraguai",
  "Portugal",
  "Qatar",
  "RD Congo",
  "Senegal",
  "Suecia",
  "Suica",
  "Tunisia",
  "Turquia",
  "Uruguai",
  "Uzbequistao",
];
const SECTION_ORDER = ["Abertura", "Estadios", "Historia", "Especiais"];
const TITLES = {
  albumView: "Caderneta",
  tradesView: "Trocas",
  dataView: "Dados",
};

const els = {
  collectorSelect: document.querySelector("#collectorSelect"),
  deleteCollectorButton: document.querySelector("#deleteCollectorButton"),
  collectorForm: document.querySelector("#collectorForm"),
  collectorName: document.querySelector("#collectorName"),
  tabButtons: document.querySelectorAll(".tab-button"),
  viewTitle: document.querySelector("#viewTitle"),
  activeCollectorEyebrow: document.querySelector("#activeCollectorEyebrow"),
  miniStats: document.querySelector("#miniStats"),
  metrics: document.querySelector("#metrics"),
  packetForm: document.querySelector("#packetForm"),
  packetInput: document.querySelector("#packetInput"),
  removeCodesButton: document.querySelector("#removeCodesButton"),
  searchInput: document.querySelector("#searchInput"),
  sectionFilter: document.querySelector("#sectionFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  selectionSummary: document.querySelector("#selectionSummary"),
  stickersBody: document.querySelector("#stickersBody"),
  emptyState: document.querySelector("#emptyState"),
  copyMissingButton: document.querySelector("#copyMissingButton"),
  copyDuplicatesButton: document.querySelector("#copyDuplicatesButton"),
  tradePeerSelect: document.querySelector("#tradePeerSelect"),
  copyTradeButton: document.querySelector("#copyTradeButton"),
  giveTitle: document.querySelector("#giveTitle"),
  requestTitle: document.querySelector("#requestTitle"),
  giveList: document.querySelector("#giveList"),
  requestList: document.querySelector("#requestList"),
  stickerForm: document.querySelector("#stickerForm"),
  stickerCode: document.querySelector("#stickerCode"),
  stickerSection: document.querySelector("#stickerSection"),
  stickerName: document.querySelector("#stickerName"),
  generateForm: document.querySelector("#generateForm"),
  totalStickers: document.querySelector("#totalStickers"),
  checklistInput: document.querySelector("#checklistInput"),
  exportDataButton: document.querySelector("#exportDataButton"),
  exportBackupButton: document.querySelector("#exportBackupButton"),
  importDataInput: document.querySelector("#importDataInput"),
  backupInput: document.querySelector("#backupInput"),
  resetButton: document.querySelector("#resetButton"),
  toast: document.querySelector("#toast"),
};

let state;
state = loadState();
let activeView = "albumView";
let toastTimer = 0;

function createDefaultState() {
  return {
    version: 1,
    album: {
      title: PROJECT_NAME,
      stickers: createDefaultStickers(),
      updatedAt: new Date().toISOString(),
    },
    collectors: [
      {
        id: "me",
        name: "Eu",
        inventory: {},
      },
    ],
    activeCollectorId: "me",
  };
}

function createDefaultStickers() {
  const selections = QUALIFIED_SELECTIONS.flatMap((selection, selectionIndex) => {
    return Array.from({ length: STICKERS_PER_SELECTION }, (_, stickerIndex) => {
      const codeNumber = SELECTION_START + (selectionIndex * STICKERS_PER_SELECTION) + stickerIndex;
      return {
        code: String(codeNumber).padStart(3, "0"),
        section: selection,
        name: selectionStickerName(selection, stickerIndex),
      };
    });
  });
  const specials = createSpecialStickers(selections.length + 1);

  return [...selections, ...specials];
}

function selectionStickerName(selection, index) {
  if (index === 0) return `Emblema - ${selection}`;
  if (index === 1) return `Foto da equipa - ${selection}`;
  return `${selection} Jogador ${String(index - 1).padStart(2, "0")}`;
}

function createSpecialStickers(startCode) {
  const specialGroups = [
    ["Abertura", ["Logotipo oficial", "Trofeu", "Mascote", "Bola oficial"]],
    ["Estadios", Array.from({ length: 16 }, (_, index) => `Estadio ${index + 1}`)],
    ["Historia", Array.from({ length: 36 }, (_, index) => `Momento historico ${String(index + 1).padStart(2, "0")}`)],
    ["Especiais", Array.from({ length: 12 }, (_, index) => `Especial ${String(index + 1).padStart(2, "0")}`)],
  ];

  let codeNumber = startCode;
  const stickers = [];
  specialGroups.forEach(([section, names]) => {
    names.forEach((name) => {
      stickers.push({
        code: String(codeNumber).padStart(3, "0"),
        section,
        name,
      });
      codeNumber += 1;
    });
  });

  if (stickers.length !== SPECIAL_STICKERS) {
    throw new Error("A caderneta base deve ter 68 cromos especiais.");
  }
  return stickers;
}

function loadState() {
  const fallback = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      || LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const normalized = normalizeState(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return fallback;
  }
}

function normalizeState(input) {
  const fallback = createDefaultState();
  const collectors = Array.isArray(input.collectors) && input.collectors.length
    ? input.collectors.map((collector, index) => ({
        id: String(collector.id || createId()),
        name: String(collector.name || `Colecionador ${index + 1}`),
        inventory: collector.inventory && typeof collector.inventory === "object" ? collector.inventory : {},
      }))
    : fallback.collectors;

  const stickers = Array.isArray(input.album?.stickers) && input.album.stickers.length
    ? dedupeStickers(input.album.stickers)
    : fallback.album.stickers;

  const activeCollectorId = collectors.some((collector) => collector.id === input.activeCollectorId)
    ? input.activeCollectorId
    : collectors[0].id;

  return {
    version: 1,
    album: {
      title: normalizeAlbumTitle(input.album?.title),
      stickers: upgradeLegacyDefaultStickers(stickers),
      updatedAt: input.album?.updatedAt || new Date().toISOString(),
    },
    collectors,
    activeCollectorId,
  };
}

function normalizeAlbumTitle(title) {
  const current = String(title || "").trim();
  return !current || current === "Mundial 2026" ? PROJECT_NAME : current;
}

function upgradeLegacyDefaultStickers(stickers) {
  const selectionStickers = stickers.filter((sticker) => sticker.section === "Selecoes");
  const isLegacyDefault = selectionStickers.length === 480
    && selectionStickers.every((sticker) => sticker.name === `Selecoes ${sticker.code}`);
  const oldWorldTrackerDefault = stickers.length === 640
    && QUALIFIED_SELECTIONS.every((selection) => {
      const sectionStickers = stickers.filter((sticker) => sticker.section === selection);
      return sectionStickers.length === 10
        && sectionStickers.every((sticker, index) => sticker.name === `${selection} ${String(index + 1).padStart(2, "0")}`);
    });
  return isLegacyDefault || oldWorldTrackerDefault ? createDefaultStickers() : stickers;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function activeCollector() {
  return state.collectors.find((collector) => collector.id === state.activeCollectorId) || state.collectors[0];
}

function numericWidth() {
  const stickers = state?.album?.stickers || [];
  return Math.max(
    3,
    ...stickers
      .map((sticker) => sticker.code)
      .filter((code) => /^\d+$/.test(code))
      .map((code) => code.length)
  );
}

function normalizeCode(value) {
  const code = String(value || "").trim().toUpperCase();
  if (!code) return "";
  return /^\d+$/.test(code) ? code.padStart(numericWidth(), "0") : code.replace(/\s+/g, "");
}

function stickerByCode(code) {
  const normalized = normalizeCode(code);
  return state.album.stickers.find((sticker) => sticker.code === normalized);
}

function quantityFor(collector, code) {
  return Number(collector.inventory[code] || 0);
}

function statusFor(quantity) {
  if (quantity > 1) return "duplicate";
  if (quantity === 1) return "owned";
  return "missing";
}

function statusLabel(status) {
  return {
    duplicate: "Repetido",
    owned: "Tenho",
    missing: "Falta",
  }[status];
}

function computeStats(collector = activeCollector()) {
  const total = state.album.stickers.length;
  const collected = state.album.stickers.filter((sticker) => quantityFor(collector, sticker.code) > 0).length;
  const duplicates = state.album.stickers.filter((sticker) => quantityFor(collector, sticker.code) > 1).length;
  const duplicateUnits = state.album.stickers.reduce((sum, sticker) => {
    return sum + Math.max(0, quantityFor(collector, sticker.code) - 1);
  }, 0);
  const missing = Math.max(0, total - collected);
  const progress = total ? Math.round((collected / total) * 100) : 0;
  return { total, collected, missing, duplicates, duplicateUnits, progress };
}

function statsForSection(section, collector = activeCollector()) {
  const stickers = state.album.stickers.filter((sticker) => sticker.section === section);
  const total = stickers.length;
  const collected = stickers.filter((sticker) => quantityFor(collector, sticker.code) > 0).length;
  const missing = Math.max(0, total - collected);
  const duplicates = stickers.reduce((sum, sticker) => sum + Math.max(0, quantityFor(collector, sticker.code) - 1), 0);
  const progress = total ? Math.round((collected / total) * 100) : 0;
  return { total, collected, missing, duplicates, progress };
}

function parseCodeList(value) {
  const tokens = String(value || "")
    .split(/[,\n;\t ]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const codes = [];
  tokens.forEach((token) => {
    const rangeMatch = token.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      const step = start <= end ? 1 : -1;
      for (let current = start; current !== end + step; current += step) {
        codes.push(normalizeCode(String(current)));
      }
      return;
    }
    codes.push(normalizeCode(token));
  });

  return codes.filter(Boolean);
}

function adjustCodes(codes, delta) {
  const collector = activeCollector();
  const knownCodes = new Set(state.album.stickers.map((sticker) => sticker.code));
  let changed = 0;
  let unknown = 0;

  codes.forEach((rawCode) => {
    const code = normalizeCode(rawCode);
    if (!knownCodes.has(code)) {
      unknown += 1;
      return;
    }

    const next = Math.max(0, quantityFor(collector, code) + delta);
    if (next === 0) {
      delete collector.inventory[code];
    } else {
      collector.inventory[code] = next;
    }
    changed += 1;
  });

  saveState();
  renderAll();
  return { changed, unknown };
}

function filteredStickers() {
  const collector = activeCollector();
  const query = els.searchInput.value.trim().toLowerCase();
  const section = els.sectionFilter.value;
  const status = els.statusFilter.value;
  const sort = els.sortSelect.value;

  const list = state.album.stickers.filter((sticker) => {
    const quantity = quantityFor(collector, sticker.code);
    const currentStatus = statusFor(quantity);
    const matchesQuery = !query
      || sticker.code.toLowerCase().includes(query)
      || sticker.name.toLowerCase().includes(query)
      || sticker.section.toLowerCase().includes(query);
    const matchesSection = section === "all" || sticker.section === section;
    const matchesStatus = status === "all" || currentStatus === status;
    return matchesQuery && matchesSection && matchesStatus;
  });

  return list.sort((a, b) => {
    if (sort === "section") return compareSections(a.section, b.section) || compareCodes(a.code, b.code);
    if (sort === "name") return a.name.localeCompare(b.name, "pt-PT");
    if (sort === "quantity") return quantityFor(collector, b.code) - quantityFor(collector, a.code) || compareCodes(a.code, b.code);
    return compareCodes(a.code, b.code);
  });
}

function compareSections(a, b) {
  return sectionRank(a) - sectionRank(b) || a.localeCompare(b, "pt-PT", { numeric: true });
}

function sectionRank(section) {
  const selectionIndex = QUALIFIED_SELECTIONS.indexOf(section);
  if (selectionIndex >= 0) return selectionIndex;
  const fixedIndex = SECTION_ORDER.indexOf(section);
  if (fixedIndex >= 0) return QUALIFIED_SELECTIONS.length + fixedIndex;
  return 900;
}

function compareCodes(a, b) {
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) return Number(a) - Number(b);
  return a.localeCompare(b, "pt-PT", { numeric: true });
}

function renderAll() {
  renderCollectors();
  renderMetrics();
  renderFilters();
  renderSelectionSummary();
  renderTable();
  renderTrades();
  els.activeCollectorEyebrow.textContent = `Perfil ativo: ${activeCollector().name}`;
}

function renderCollectors() {
  els.collectorSelect.innerHTML = state.collectors
    .map((collector) => `<option value="${escapeAttr(collector.id)}">${escapeHtml(collector.name)}</option>`)
    .join("");
  els.collectorSelect.value = state.activeCollectorId;
  els.deleteCollectorButton.disabled = state.collectors.length <= 1;

  els.tradePeerSelect.innerHTML = state.collectors
    .filter((collector) => collector.id !== state.activeCollectorId)
    .map((collector) => `<option value="${escapeAttr(collector.id)}">${escapeHtml(collector.name)}</option>`)
    .join("");
}

function renderMetrics() {
  const stats = computeStats();
  const metricItems = [
    ["Completos", `${stats.progress}%`, "metric-progress"],
    ["Tenho", `${stats.collected}/${stats.total}`, "metric-owned"],
    ["Faltam", String(stats.missing), "metric-missing"],
    ["Repetidos", String(stats.duplicateUnits), "metric-duplicates"],
  ];
  els.metrics.innerHTML = metricItems
    .map(([label, value, className]) => `<article class="metric-card ${className}"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");

  els.miniStats.innerHTML = `
    <div class="mini-stat"><span>Progresso</span><strong>${stats.progress}%</strong></div>
    <div class="mini-stat"><span>Faltam</span><strong>${stats.missing}</strong></div>
    <div class="mini-stat"><span>Repetidos</span><strong>${stats.duplicateUnits}</strong></div>
  `;
}

function renderFilters() {
  const previous = els.sectionFilter.value || "all";
  const sections = [...new Set(state.album.stickers.map((sticker) => sticker.section))].sort(compareSections);
  els.sectionFilter.innerHTML = `<option value="all">Todas</option>${sections
    .map((section) => `<option value="${escapeAttr(section)}">${escapeHtml(section)}</option>`)
    .join("")}`;
  els.sectionFilter.value = sections.includes(previous) ? previous : "all";
}

function renderAlbumList() {
  renderSelectionSummary();
  renderTable();
}

function renderSelectionSummary() {
  const selections = QUALIFIED_SELECTIONS.filter((selection) => {
    return state.album.stickers.some((sticker) => sticker.section === selection);
  });

  if (!selections.length) {
    els.selectionSummary.hidden = true;
    els.selectionSummary.innerHTML = "";
    return;
  }

  const collector = activeCollector();
  const activeSection = els.sectionFilter.value || "all";
  els.selectionSummary.hidden = false;
  els.selectionSummary.innerHTML = [
    `<button class="selection-chip ${activeSection === "all" ? "active" : ""}" type="button" data-section="all">
      <span>Todas</span>
      <strong>${computeStats(collector).progress}%</strong>
    </button>`,
    ...selections.map((selection) => {
      const stats = statsForSection(selection, collector);
      return `<button class="selection-chip ${activeSection === selection ? "active" : ""}" type="button" data-section="${escapeAttr(selection)}" title="${escapeAttr(selection)}">
        <span>${escapeHtml(selection)}</span>
        <strong>${stats.collected}/${stats.total}</strong>
      </button>`;
    }),
  ].join("");
}

function renderTable() {
  const collector = activeCollector();
  const rows = filteredStickers();
  els.emptyState.hidden = rows.length > 0;
  const groupRows = ["section", "code"].includes(els.sortSelect.value);
  const html = [];
  let previousSection = "";

  rows.forEach((sticker) => {
    if (groupRows && sticker.section !== previousSection) {
      const stats = statsForSection(sticker.section, collector);
      html.push(`
        <tr class="section-row">
          <th scope="rowgroup" colspan="5">
            <span>${escapeHtml(sticker.section)}</span>
            <small>${stats.collected}/${stats.total}</small>
          </th>
        </tr>
      `);
      previousSection = sticker.section;
    }

    const quantity = quantityFor(collector, sticker.code);
    const status = statusFor(quantity);
    html.push(`
      <tr>
        <td>
          <div class="sticker-main">
            <strong>${escapeHtml(sticker.code)}</strong>
            <span>${escapeHtml(sticker.name)}</span>
          </div>
        </td>
        <td>${escapeHtml(sticker.section)}</td>
        <td><span class="status-pill status-${status}">${statusLabel(status)}</span></td>
        <td>${quantity}</td>
        <td>
          <div class="row-actions">
            <button class="icon-button secondary" type="button" data-action="decrease" data-code="${escapeAttr(sticker.code)}" title="Remover um" aria-label="Remover um ${escapeAttr(sticker.code)}">-</button>
            <button class="icon-button" type="button" data-action="increase" data-code="${escapeAttr(sticker.code)}" title="Adicionar um" aria-label="Adicionar um ${escapeAttr(sticker.code)}">+</button>
          </div>
        </td>
      </tr>
    `);
  });

  els.stickersBody.innerHTML = html.join("");
}

function renderTrades() {
  const active = activeCollector();
  const peerId = els.tradePeerSelect.value || state.collectors.find((collector) => collector.id !== active.id)?.id;
  const peer = state.collectors.find((collector) => collector.id === peerId);

  if (!peer) {
    els.tradePeerSelect.innerHTML = `<option value="">Sem outro perfil</option>`;
    els.giveTitle.textContent = "Repetidos que faltam ao outro";
    els.requestTitle.textContent = "Repetidos que te faltam";
    els.giveList.innerHTML = `<p class="empty-state">Adiciona outro colecionador.</p>`;
    els.requestList.innerHTML = `<p class="empty-state">Adiciona outro colecionador.</p>`;
    els.copyTradeButton.disabled = true;
    return;
  }

  els.tradePeerSelect.value = peer.id;
  els.copyTradeButton.disabled = false;
  els.giveTitle.textContent = `Repetidos de ${active.name} para ${peer.name}`;
  els.requestTitle.textContent = `Repetidos de ${peer.name} para ${active.name}`;

  const give = tradeCandidates(active, peer);
  const request = tradeCandidates(peer, active);
  els.giveList.innerHTML = renderStickerChips(give, "Nada para dar.");
  els.requestList.innerHTML = renderStickerChips(request, "Nada para pedir.");
}

function tradeCandidates(owner, receiver) {
  return state.album.stickers.filter((sticker) => {
    return quantityFor(owner, sticker.code) > 1 && quantityFor(receiver, sticker.code) === 0;
  });
}

function renderStickerChips(stickers, emptyText) {
  if (!stickers.length) return `<p class="empty-state">${emptyText}</p>`;
  return stickers
    .map((sticker) => `
      <div class="sticker-chip">
        <strong>${escapeHtml(sticker.code)}</strong>
        <span>${escapeHtml(sticker.name)}</span>
      </div>
    `)
    .join("");
}

function listByStatus(status) {
  const collector = activeCollector();
  return state.album.stickers.filter((sticker) => statusFor(quantityFor(collector, sticker.code)) === status);
}

function stickerLine(sticker) {
  return `${sticker.code} - ${sticker.name} (${sticker.section})`;
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast(successMessage);
  }
}

function exportState() {
  const fileName = `worldtracker2026-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Backup exportado.");
}

async function importStateFromFile(file) {
  if (!file) return;
  try {
    const next = normalizeState(JSON.parse(await file.text()));
    state = next;
    saveState();
    renderAll();
    showToast("Dados importados.");
  } catch {
    showToast("Nao consegui importar esse ficheiro.");
  }
}

async function importChecklist(file) {
  if (!file) return;
  try {
    const rows = parseDelimited(await file.text());
    const stickers = rowsToStickers(rows);
    if (!stickers.length) {
      showToast("CSV sem cromos validos.");
      return;
    }

    if (!window.confirm(`Substituir a checklist atual por ${stickers.length} cromos?`)) return;
    state.album.stickers = stickers;
    state.album.updatedAt = new Date().toISOString();
    pruneInventories();
    saveState();
    renderAll();
    showToast("Checklist importada.");
  } catch {
    showToast("Nao consegui ler esse CSV.");
  } finally {
    els.checklistInput.value = "";
  }
}

function parseDelimited(text) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const delimiter = [",", ";", "\t"].sort((a, b) => countChar(firstLine, b) - countChar(firstLine, a))[0];
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function countChar(value, char) {
  return [...value].filter((current) => current === char).length;
}

function rowsToStickers(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const hasHeader = header.some((cell) => ["code", "codigo", "numero", "number"].includes(cell));
  const indexes = hasHeader
    ? {
        code: findHeaderIndex(header, ["code", "codigo", "numero", "number", "id"]),
        section: findHeaderIndex(header, ["section", "secao", "seccao", "selecao", "selection", "equipa", "team", "grupo", "area"]),
        name: findHeaderIndex(header, ["name", "nome", "player", "jogador", "descricao"]),
      }
    : { code: 0, section: 1, name: 2 };

  const body = hasHeader ? rows.slice(1) : rows;
  return dedupeStickers(body.map((row) => ({
    code: normalizeCode(row[indexes.code]),
    section: row[indexes.section] || "Caderneta",
    name: row[indexes.name] || `Cromo ${normalizeCode(row[indexes.code])}`,
  })));
}

function findHeaderIndex(header, names) {
  const index = header.findIndex((cell) => names.includes(cell));
  return index >= 0 ? index : 0;
}

function dedupeStickers(stickers) {
  const byCode = new Map();
  stickers.forEach((sticker) => {
    const code = normalizeCode(sticker.code);
    if (!code) return;
    byCode.set(code, {
      code,
      section: String(sticker.section || "Caderneta").trim() || "Caderneta",
      name: String(sticker.name || `Cromo ${code}`).trim() || `Cromo ${code}`,
    });
  });

  return [...byCode.values()].sort((a, b) => compareCodes(a.code, b.code));
}

function pruneInventories() {
  const knownCodes = new Set(state.album.stickers.map((sticker) => sticker.code));
  state.collectors.forEach((collector) => {
    Object.keys(collector.inventory).forEach((code) => {
      if (!knownCodes.has(code)) delete collector.inventory[code];
    });
  });
}

function generateNumericAlbum(total) {
  const width = Math.max(3, String(total).length);
  const stickers = [];
  for (let index = 1; index <= total; index += 1) {
    const code = String(index).padStart(width, "0");
    stickers.push({ code, section: "Caderneta", name: `Cromo ${code}` });
  }
  return stickers;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function bindEvents() {
  els.collectorSelect.addEventListener("change", () => {
    state.activeCollectorId = els.collectorSelect.value;
    saveState();
    renderAll();
  });

  els.collectorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = els.collectorName.value.trim();
    if (!name) return;
    const collector = { id: createId(), name, inventory: {} };
    state.collectors.push(collector);
    state.activeCollectorId = collector.id;
    els.collectorName.value = "";
    saveState();
    renderAll();
    showToast("Colecionador adicionado.");
  });

  els.deleteCollectorButton.addEventListener("click", () => {
    if (state.collectors.length <= 1) return;
    const collector = activeCollector();
    if (!window.confirm(`Remover ${collector.name}?`)) return;
    state.collectors = state.collectors.filter((item) => item.id !== collector.id);
    state.activeCollectorId = state.collectors[0].id;
    saveState();
    renderAll();
    showToast("Colecionador removido.");
  });

  els.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeView = button.dataset.view;
      document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === activeView));
      els.tabButtons.forEach((tab) => tab.classList.toggle("active", tab === button));
      els.viewTitle.textContent = TITLES[activeView];
      renderTrades();
    });
  });

  els.packetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const codes = parseCodeList(els.packetInput.value);
    const result = adjustCodes(codes, 1);
    els.packetInput.value = "";
    showToast(`${result.changed} adicionados. ${result.unknown ? `${result.unknown} ignorados.` : ""}`.trim());
  });

  els.removeCodesButton.addEventListener("click", () => {
    const codes = parseCodeList(els.packetInput.value);
    const result = adjustCodes(codes, -1);
    els.packetInput.value = "";
    showToast(`${result.changed} removidos. ${result.unknown ? `${result.unknown} ignorados.` : ""}`.trim());
  });

  [els.searchInput, els.sectionFilter, els.statusFilter, els.sortSelect].forEach((control) => {
    control.addEventListener("input", renderAlbumList);
    control.addEventListener("change", renderAlbumList);
  });

  els.selectionSummary.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-section]");
    if (!button) return;
    els.sectionFilter.value = button.dataset.section;
    renderAlbumList();
  });

  els.stickersBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const delta = button.dataset.action === "increase" ? 1 : -1;
    adjustCodes([button.dataset.code], delta);
  });

  els.copyMissingButton.addEventListener("click", () => {
    const lines = listByStatus("missing").map(stickerLine);
    copyText(lines.join("\n") || "Sem faltas.", "Faltas copiadas.");
  });

  els.copyDuplicatesButton.addEventListener("click", () => {
    const lines = listByStatus("duplicate").map(stickerLine);
    copyText(lines.join("\n") || "Sem repetidos.", "Repetidos copiados.");
  });

  els.tradePeerSelect.addEventListener("change", renderTrades);

  els.copyTradeButton.addEventListener("click", () => {
    const active = activeCollector();
    const peer = state.collectors.find((collector) => collector.id === els.tradePeerSelect.value);
    if (!peer) return;
    const give = tradeCandidates(active, peer).map(stickerLine);
    const request = tradeCandidates(peer, active).map(stickerLine);
    const text = [
      `Troca ${active.name} <> ${peer.name}`,
      "",
      `${active.name} da:`,
      give.join("\n") || "Nada",
      "",
      `${active.name} pede:`,
      request.join("\n") || "Nada",
    ].join("\n");
    copyText(text, "Proposta copiada.");
  });

  els.stickerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const sticker = {
      code: normalizeCode(els.stickerCode.value),
      section: els.stickerSection.value.trim(),
      name: els.stickerName.value.trim(),
    };
    if (!sticker.code || !sticker.section || !sticker.name) return;
    state.album.stickers = dedupeStickers([...state.album.stickers, sticker]);
    state.album.updatedAt = new Date().toISOString();
    saveState();
    renderAll();
    els.stickerForm.reset();
    showToast("Cromo guardado.");
  });

  els.generateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const total = Number(els.totalStickers.value);
    if (!Number.isFinite(total) || total < 1) return;
    if (!window.confirm(`Gerar uma caderneta com ${total} cromos?`)) return;
    state.album.stickers = generateNumericAlbum(total);
    state.album.updatedAt = new Date().toISOString();
    pruneInventories();
    saveState();
    renderAll();
    showToast("Caderneta gerada.");
  });

  els.checklistInput.addEventListener("change", (event) => {
    importChecklist(event.target.files[0]);
  });

  els.exportDataButton.addEventListener("click", exportState);
  els.exportBackupButton.addEventListener("click", exportState);
  els.importDataInput.addEventListener("change", (event) => importStateFromFile(event.target.files[0]));
  els.backupInput.addEventListener("change", (event) => importStateFromFile(event.target.files[0]));

  els.resetButton.addEventListener("click", () => {
    if (!window.confirm("Repor os dados de exemplo?")) return;
    state = createDefaultState();
    saveState();
    renderAll();
    showToast("Exemplo reposto.");
  });
}

bindEvents();
renderAll();
