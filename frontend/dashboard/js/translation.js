// translations.js
// Профессиональный фронтовый модуль для Translation Dashboard.
// Работает с HTML-структурой из translation.html и стилями translations.css.
// Все API-вызовы используют базу и роуты из data-* атрибутов #tl-toolbar.
// Требуется JWT в localStorage под ключом, указанным в data-auth-storage-key.

// =============================
// 0) Утилиты и базовая конфигурация
// =============================
(function () {
  "use strict";

  // DOM shortcuts
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Узел с конфигурацией
  const toolbar = $("#tl-toolbar");
  if (!toolbar) {
    console.error("[translations] Toolbar #tl-toolbar not found");
    return;
  }

  // База и хранилище токена
  const API_BASE = toolbar.dataset.apiBase || "";
  const TOKEN_STORAGE_KEY = toolbar.dataset.authStorageKey || "storeJwt";

  // Эндпойнты из HTML (data-endpoints)
  let parsedEndpoints = {};
  try {
    parsedEndpoints = JSON.parse(toolbar.dataset.endpoints || "{}");
  } catch {
    parsedEndpoints = {};
  }

  // Чёткие имена API (все разные, чтобы не путаться на бэке)
  const ENDPOINT_LIST_LOCALES = parsedEndpoints.locales || "/api/i18n/locales";
  const ENDPOINT_LIST_NAMESPACES =
    parsedEndpoints.namespaces || "/api/i18n/namespaces";
  const ENDPOINT_FETCH_KEYS = parsedEndpoints.search || "/api/i18n/keys";
  const ENDPOINT_UPDATE_TRANSLATION =
    parsedEndpoints.updateText || "/api/i18n/keys/{id}/translation";
  const ENDPOINT_CREATE_KEY = parsedEndpoints.createKey || "/api/i18n/keys";
  const ENDPOINT_SYNC_KEYS = parsedEndpoints.syncKeys || "/api/i18n/keys/sync";
  const ENDPOINT_HISTORY =
    parsedEndpoints.history || "/api/i18n/keys/{id}/history";
  const ENDPOINT_MARK_REVIEW =
    parsedEndpoints.review || "/api/i18n/keys/{id}/review";
  const ENDPOINT_REVERT =
    parsedEndpoints.revert || "/api/i18n/keys/{id}/revert";
  const ENDPOINT_EXPORT = parsedEndpoints.export || "/api/i18n/export";
  const ENDPOINT_IMPORT = parsedEndpoints.import || "/api/i18n/import";
  const ENDPOINT_PUBLISH = parsedEndpoints.publish || "/api/i18n/publish";
  const ENDPOINT_BUNDLE = parsedEndpoints.bundle || "/api/i18n/bundle";

  // Опциональные (расширенные) эндпойнты — можно реализовать на бэке
  const ENDPOINT_PROVIDER_GET = "/api/i18n/mt/provider"; // GET
  const ENDPOINT_PROVIDER_SAVE = "/api/i18n/mt/provider"; // PUT/POST
  const ENDPOINT_MT_TRANSLATE_MISSING = "/api/i18n/mt/translate"; // POST {baseLocale, targetLocale, namespace, ids?}
  const ENDPOINT_GLOSSARY_LIST = "/api/i18n/glossary"; // GET
  const ENDPOINT_GLOSSARY_ADD = "/api/i18n/glossary"; // POST
  const ENDPOINT_GLOSSARY_DELETE = "/api/i18n/glossary/{id}"; // DELETE
  const ENDPOINT_QA_VALIDATE = "/api/i18n/validate"; // POST [{key, baseText, text, placeholders, locale}]

  // Фиксированный набор локалей (как ты просил) на случай, если GET /locales пустой или недоступен
  const FIXED_LOCALES = [
    { code: "en", name: "English (en)" },
    { code: "ru", name: "Русский (ru)" },
    { code: "az", name: "Azərbaycanca (az)" },
    { code: "de", name: "Deutsch (de)" },
    { code: "es", name: "Español (es)" },
  ];

  // Авторизация
  const authHeaders = () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Унифицированные fetch-хелперы
  const http = {
    async get(url, params) {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      const res = await fetch(API_BASE + url + q, {
        headers: { Accept: "application/json", ...authHeaders() },
      });
      return handleResponse(res);
    },
    async postJson(url, body) {
      const res = await fetch(API_BASE + url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(body || {}),
      });
      return handleResponse(res);
    },
    async putJson(url, body) {
      const res = await fetch(API_BASE + url, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(body || {}),
      });
      return handleResponse(res);
    },
    async postForm(url, formData) {
      const res = await fetch(API_BASE + url, {
        method: "POST",
        headers: { ...authHeaders() }, // Важно: не задавать Content-Type вручную
        body: formData,
      });
      return handleResponse(res);
    },
    async delete(url) {
      const res = await fetch(API_BASE + url, {
        method: "DELETE",
        headers: { Accept: "application/json", ...authHeaders() },
      });
      return handleResponse(res);
    },
  };

  async function handleResponse(res) {
    if (!res.ok) {
      let msg = res.statusText;
      try {
        msg = await res.text();
      } catch {}
      throw new Error(`HTTP ${res.status} — ${msg}`);
    }
    const ctype = res.headers.get("content-type") || "";
    if (ctype.includes("application/json")) return res.json();
    return res.text(); // экспорт может быть text/csv
  }

  // Тостер уведомлений
  const toaster = $("#toaster");
  function toast(message, type = "info", timeout = 3000) {
    if (!toaster) return alert(message);
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    toaster.appendChild(node);
    setTimeout(() => node.remove(), timeout);
  }

  // =============================
  // 1) Состояние приложения
  // =============================
  const state = {
    baseLocale: "en",
    targetLocale: "az",
    namespace: "",
    status: "",
    search: "",
    page: 1,
    size: 50,
    total: 0,
    rows: [], // [{id, namespace, key, description, placeholders, tags, baseText, text, status, updatedAt, updatedBy}]
    edited: new Map(), // id -> editedText
    suggestion: new Map(), // id -> mt suggestion
    provider: { name: "none", formality: "", exclusions: "" },
    locales: [], // [{code, name}]
    namespaces: [], // [string]
    stats: { missing: 0, draft: 0, translated: 0, reviewed: 0 },
  };

  // =============================
  // 2) Инициализация UI
  // =============================
  const ui = {
    baseLocaleSel: $("#baseLocaleSel"),
    targetLocaleSel: $("#localeSel"),
    nsSel: $("#nsSel"),
    statusSel: $("#statusSel"),
    searchInput: $("#searchInput"),
    applyBtn: $("#applyFilters"),

    headBaseLocale: $("#headBaseLocale"),
    headLocale: $("#headLocale"),

    // Таблица
    rowsWrap: $("#rows"),
    tableWrap: $("#tl-tableWrap"),
    emptyState: $("#emptyState"),
    prevPage: $("#prevPage"),
    nextPage: $("#nextPage"),
    pageInfo: $("#pageInfo"),

    // Статистика и прогресс
    stMissing: $("#stMissing"),
    stDraft: $("#stDraft"),
    stTranslated: $("#stTranslated"),
    stReviewed: $("#stReviewed"),
    progressPct: $("#progressPct"),
    progressFill: $("#progressFill"),

    // Sticky actions
    sticky: $("#stickyActions"),
    unsavedBadge: $("#unsavedBadge"),
    translateMissing: $("#translateMissing"),
    bulkReview: $("#bulkReview"),
    saveAll: $("#saveAll"),
    discardEdits: $("#discardEdits"),

    // Модалки
    dlgAddKey: $("#dlgAddKey"),
    addKeyBtn: $("#addKeyBtn"),
    addKeyForm: $("#addKeyForm"),
    closeAddKeyBtns: $$(".closeAddKey"),

    dlgProvider: $("#dlgProvider"),
    mtToggle: $("#mtToggle"),
    mtProviderChip: $("#mtProvider"),
    mtProviderInline: $("#mtProviderInline"),
    mtSettingsBtn: $("#mtSettingsBtn"),
    providerForm: $("#providerForm"),

    dlgImport: $("#dlgImport"),
    importBtn: $("#importBtn"),
    impSubmit: $("#impSubmit"),
    closeImportBtns: $$(".closeImport"),
    impLocale: $("#impLocale"),
    impMode: $("#impMode"),
    impFile: $("#impFile"),

    dlgExport: $("#dlgExport"),
    exportBtn: $("#exportBtn"),
    expSubmit: $("#expSubmit"),
    closeExportBtns: $$(".closeExport"),
    expLocales: $("#expLocales"),
    expFormat: $("#expFormat"),
    expStyle: $("#expStyle"),
    expNamespaces: $("#expNamespaces"),

    dlgPublish: $("#dlgPublish"),
    publishBtn: $("#publishBtn"),
    pubSubmit: $("#pubSubmit"),
    closePublishBtns: $$(".closePublish"),

    // Drawer History
    drawer: $("#drawer"),
    drawerBody: $("#drawerBody"),
    closeDrawerBtn: $(".closeDrawer"),

    // Context/QA/Glossary
    ctxNotes: $("#ctxNotes"),
    qaList: $("#qaList"),
    openGlossary: $("#openGlossary"),
    dlgGlossary: $("#dlgGlossary"),
    closeGlossaryBtns: $$(".closeGlossary"),
    glTerm: $("#glTerm"),
    glTrans: $("#glTrans"),
    glNotes: $("#glNotes"),
    glAdd: $("#glAdd"),
    glossaryList: $("#glossaryList"),

    // Доп. кнопки
    shortcutsBtn: $("#shortcutsBtn"),
    pageTranslate: $("#pageTranslate"),
    pageSave: $("#pageSave"),
  };

  // Мелкие помощники по UI
  function showModal(modal, show = true) {
    if (!modal) return;
    modal.classList.toggle("show", show);
    modal.setAttribute("aria-hidden", show ? "false" : "true");
  }
  function showDrawer(drawer, show = true) {
    if (!drawer) return;
    drawer.classList.toggle("show", show);
    drawer.setAttribute("aria-hidden", show ? "false" : "true");
  }

  // =============================
  // 3) Загрузка справочников
  // =============================
  async function loadLocales() {
    try {
      const list = await http.get(ENDPOINT_LIST_LOCALES);
      state.locales =
        Array.isArray(list) && list.length
          ? list.map((code) => {
              const fixed = FIXED_LOCALES.find((x) => x.code === code);
              return fixed || { code, name: code };
            })
          : FIXED_LOCALES.slice();
    } catch {
      // Фолбэк — фиксированный набор
      state.locales = FIXED_LOCALES.slice();
    }
    // Рендер селектов локалей
    renderLocaleSelect(ui.baseLocaleSel, state.locales, state.baseLocale);
    renderLocaleSelect(ui.targetLocaleSel, state.locales, state.targetLocale);
    ui.headBaseLocale.textContent = state.baseLocale;
    ui.headLocale.textContent = state.targetLocale;
  }

  function renderLocaleSelect(selectEl, locales, selected) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    locales.forEach(({ code, name }) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = name || code;
      if (code === selected) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  async function loadNamespaces() {
    try {
      const list = await http.get(ENDPOINT_LIST_NAMESPACES);
      state.namespaces = Array.isArray(list) ? list : [];
    } catch {
      state.namespaces = [];
    }
    // Рендер неймспейсов
    ui.nsSel.innerHTML = `<option value="">All</option>`;
    state.namespaces.forEach((ns) => {
      const opt = document.createElement("option");
      opt.value = ns;
      opt.textContent = ns;
      ui.nsSel.appendChild(opt);
    });
  }

  // =============================
  // 4) Поиск/пагинация/загрузка ключей
  // =============================
  async function fetchKeys() {
    const params = {
      locale: state.targetLocale,
      namespace: state.namespace || "",
      status: state.status || "",
      search: state.search || "",
      page: String(state.page),
      size: String(state.size),
      baseLocale: state.baseLocale,
    };
    const data = await http.get(ENDPOINT_FETCH_KEYS, params);
    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];
    state.rows = items;
    state.total = Number(data.total || items.length || 0);

    computeStats();
    renderStats();
    renderRows();
    renderPager();
  }

  function computeStats() {
    const s = { missing: 0, draft: 0, translated: 0, reviewed: 0 };
    state.rows.forEach((r) => {
      if (r.status === "missing") s.missing++;
      else if (r.status === "draft") s.draft++;
      else if (r.status === "translated") s.translated++;
      else if (r.status === "reviewed") s.reviewed++;
    });
    state.stats = s;
  }

  function renderStats() {
    ui.stMissing.textContent = String(state.stats.missing);
    ui.stDraft.textContent = String(state.stats.draft);
    ui.stTranslated.textContent = String(state.stats.translated);
    ui.stReviewed.textContent = String(state.stats.reviewed);
    const done = state.stats.reviewed + state.stats.translated;
    const total =
      state.stats.missing +
      state.stats.draft +
      state.stats.translated +
      state.stats.reviewed;
    const pct = total ? Math.round((done / total) * 100) : 0;
    ui.progressPct.textContent = `${pct}%`;
    ui.progressFill.style.width = `${pct}%`;
  }

  function renderPager() {
    const totalPages = Math.max(1, Math.ceil(state.total / state.size));
    ui.pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
    ui.prevPage.disabled = state.page <= 1;
    ui.nextPage.disabled = state.page >= totalPages;
  }

  // =============================
  // 5) Рендер строк и редактирование
  // =============================
  function renderRows() {
    ui.rowsWrap.innerHTML = "";
    ui.emptyState.hidden = !!state.rows.length;

    state.rows.forEach((row) => {
      const el = document.createElement("div");
      el.className = "row";
      el.dataset.id = String(row.id);

      // Key + tags
      const colKey = document.createElement("div");
      colKey.className = "td col-key";
      colKey.innerHTML = `
        <div class="mono">${escapeHtml(
          (row.namespace ? row.namespace + "." : "") + row.key
        )}</div>
        <div class="tags">${(row.tags || [])
          .map((t) => `<span>${escapeHtml(String(t))}</span>`)
          .join("")}</div>
      `;

      // Description
      const colDesc = document.createElement("div");
      colDesc.className = "td col-desc";
      colDesc.textContent = row.description || "";

      // Base
      const colBase = document.createElement("div");
      colBase.className = "td col-base";
      const ph = (row.placeholders || []).join(", ");
      colBase.innerHTML = `
        <div class="base-text">${escapeHtml(row.baseText || "")}</div>
        ${
          ph
            ? `<div class="placeholders">Placeholders: ${escapeHtml(ph)}</div>`
            : ""
        }
      `;

      // Current (editable)
      const colLoc = document.createElement("div");
      colLoc.className = "td col-locale";
      const currentText = state.edited.has(row.id)
        ? state.edited.get(row.id)
        : row.text || "";
      const textarea = document.createElement("textarea");
      textarea.className = "edit";
      textarea.rows = 2;
      textarea.placeholder = "Type translation…";
      textarea.value = currentText;
      textarea.addEventListener("input", () => {
        const val = textarea.value;
        if (val === (row.text || "")) state.edited.delete(row.id);
        else state.edited.set(row.id, val);
        reflectUnsaved();
      });

      const suggestion = state.suggestion.get(row.id);
      const suggestDiv = document.createElement("div");
      suggestDiv.className = "mt-suggestion";
      suggestDiv.innerHTML = suggestion
        ? `<span class="chip chip-suggest">Suggestion</span> <span class="muted">${escapeHtml(
            suggestion
          )}</span>`
        : ``;

      const rowActions = document.createElement("div");
      rowActions.className = "row-actions";
      const btnSave = document.createElement("button");
      btnSave.className = "btn xs saveBtn";
      btnSave.textContent = "Save";
      btnSave.addEventListener("click", () => saveOne(row.id));

      const btnReview = document.createElement("button");
      btnReview.className = "btn xs ghost reviewBtn";
      btnReview.textContent = "Mark reviewed";
      btnReview.addEventListener("click", () => markReviewed(row.id));

      const btnHist = document.createElement("button");
      btnHist.className = "btn xs ghost historyBtn";
      btnHist.textContent = "History";
      btnHist.addEventListener("click", () => openHistory(row.id));

      rowActions.appendChild(btnSave);
      rowActions.appendChild(btnReview);
      rowActions.appendChild(btnHist);

      colLoc.appendChild(textarea);
      colLoc.appendChild(suggestDiv);
      colLoc.appendChild(rowActions);

      // Status
      const colStatus = document.createElement("div");
      colStatus.className = "td col-status";
      const badge = document.createElement("span");
      badge.className = `badge ${row.status || "missing"}`;
      badge.textContent = row.status || "missing";
      colStatus.appendChild(badge);

      // Meta
      const colMeta = document.createElement("div");
      colMeta.className = "td col-meta";
      colMeta.innerHTML = `
        <div class="muted">${escapeHtml(formatDate(row.updatedAt))}</div>
        <div class="muted">${escapeHtml(row.updatedBy || "")}</div>
      `;

      el.appendChild(colKey);
      el.appendChild(colDesc);
      el.appendChild(colBase);
      el.appendChild(colLoc);
      el.appendChild(colStatus);
      el.appendChild(colMeta);

      ui.rowsWrap.appendChild(el);
    });

    reflectUnsaved();
  }

  function reflectUnsaved() {
    const hasEdits = state.edited.size > 0;
    ui.sticky.setAttribute("aria-hidden", hasEdits ? "false" : "true");
    ui.unsavedBadge.hidden = !hasEdits;
  }

  // =============================
  // 6) Операции: save/review/history/mt
  // =============================
  async function saveOne(id) {
    const row = state.rows.find((r) => String(r.id) === String(id));
    if (!row) return;
    const text = state.edited.has(id) ? state.edited.get(id) : row.text || "";

    // Валидация плейсхолдеров (жёсткая рекомендация)
    if (!validatePlaceholders(row.placeholders || [], text)) {
      toast("Placeholders mismatch. Please keep all placeholders.", "warn");
      return;
    }

    const url = ENDPOINT_UPDATE_TRANSLATION.replace(
      "{id}",
      encodeURIComponent(id)
    );
    await http.putJson(url, {
      locale: state.targetLocale,
      text,
      status: "translated",
    });

    // Обновляем локально
    row.text = text;
    row.status = "translated";
    row.updatedAt = new Date().toISOString();
    row.updatedBy = "you";
    state.edited.delete(id);
    toast("Saved");
    renderRows();
    computeStats();
    renderStats();
  }

  async function saveAllEdited() {
    const ids = Array.from(state.edited.keys());
    if (!ids.length) return toast("Nothing to save");
    for (const id of ids) {
      await saveOne(id);
    }
  }

  async function markReviewed(id) {
    const url = ENDPOINT_MARK_REVIEW.replace("{id}", encodeURIComponent(id));
    await http.postJson(url, { locale: state.targetLocale });

    const row = state.rows.find((r) => String(r.id) === String(id));
    if (row) {
      row.status = "reviewed";
      row.updatedAt = new Date().toISOString();
      row.updatedBy = "you";
    }
    toast("Marked as reviewed");
    renderRows();
    computeStats();
    renderStats();
  }

  async function openHistory(id) {
    showDrawer(ui.drawer, true);
    ui.drawerBody.innerHTML = "Loading…";
    try {
      const url = ENDPOINT_HISTORY.replace("{id}", encodeURIComponent(id));
      const list = await http.get(url);
      ui.drawerBody.innerHTML = "";
      (Array.isArray(list) ? list : []).forEach((h) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
          <div><strong>${escapeHtml(h.status || "")}</strong> — ${escapeHtml(
          h.locale || state.targetLocale
        )}</div>
          <div class="muted">${escapeHtml(
            formatDate(h.updatedAt)
          )} • ${escapeHtml(h.updatedBy || "")}</div>
          <pre style="white-space:pre-wrap">${escapeHtml(h.text || "")}</pre>
          <hr/>
        `;
        ui.drawerBody.appendChild(item);
      });
    } catch (e) {
      ui.drawerBody.textContent = String(e.message || e);
    }
  }

  async function translateMissingCurrentPage() {
    // Собираем ID строк со статусом missing/draft
    const ids = state.rows
      .filter((r) => r.status === "missing" || r.status === "draft")
      .map((r) => r.id);

    if (!ids.length) {
      toast("No missing items on this page");
      return;
    }

    try {
      // Бэкенд делает реальный MT и возвращает словарь {id: suggestion}
      const payload = {
        baseLocale: state.baseLocale,
        targetLocale: state.targetLocale,
        namespace: state.namespace || "",
        ids,
      };
      const result = await http.postJson(
        ENDPOINT_MT_TRANSLATE_MISSING,
        payload
      );
      // Ожидание формата: { suggestions: { "123":"...", "124":"..." } }
      const map = (result && result.suggestions) || {};
      for (const id of ids) {
        if (map[id]) state.suggestion.set(id, String(map[id]));
      }
      toast("Suggestions loaded");
      renderRows();
    } catch (e) {
      toast("MT failed: " + e.message, "warn");
    }
  }

  // =============================
  // 7) Импорт / Экспорт / Публикация
  // =============================
  async function doImport() {
    const file = ui.impFile?.files?.[0];
    if (!file) return toast("Select file to import", "warn");
    const fd = new FormData();
    fd.append("file", file);
    if (ui.impLocale?.value) fd.append("locale", ui.impLocale.value);
    if (ui.impMode?.value) fd.append("mode", ui.impMode.value);
    await http.postForm(ENDPOINT_IMPORT, fd);
    toast("Import done");
    showModal(ui.dlgImport, false);
    await fetchKeys();
  }

  async function doExport() {
    // Собираем выбранные локали (чекбоксы)
    const chosen = $$("#expLocales input[type=checkbox]:checked").map(
      (x) => x.value
    );
    const params = {
      locales: chosen.join(","),
      format: ui.expFormat?.value || "json",
      style: ui.expStyle?.value || "nested",
      namespaces: ui.expNamespaces?.value || "",
      baseLocale: state.baseLocale,
    };
    const content = await http.get(ENDPOINT_EXPORT, params);
    // content может быть JSON/CSV — откроем в новом окне
    const blob = new Blob(
      [
        typeof content === "string"
          ? content
          : JSON.stringify(content, null, 2),
      ],
      {
        type: ui.expFormat?.value === "csv" ? "text/csv" : "application/json",
      }
    );
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    toast("Export ready");
    showModal(ui.dlgExport, false);
  }

  async function doPublish() {
    const res = await http.postJson(ENDPOINT_PUBLISH, {});
    toast("Published " + (res?.version || ""));
    showModal(ui.dlgPublish, false);
  }

  // =============================
  // 8) Провайдер авто-перевода и глоссарий
  // =============================
  async function loadProvider() {
    try {
      const p = await http.get(ENDPOINT_PROVIDER_GET);
      state.provider = {
        name: p?.name || "none",
        formality: p?.formality || "",
        exclusions: p?.exclusions || "",
      };
    } catch {
      // ignore
    }
    paintProviderChips();
  }

  function paintProviderChips() {
    const label = (state.provider.name || "none").toUpperCase();
    if (ui.mtProviderChip) ui.mtProviderChip.textContent = `Provider: ${label}`;
    if (ui.mtProviderInline) ui.mtProviderInline.textContent = label;
  }

  async function saveProvider(formDataObj) {
    await http.putJson(ENDPOINT_PROVIDER_SAVE, formDataObj);
    state.provider = formDataObj;
    paintProviderChips();
    toast("Provider settings saved");
    showModal(ui.dlgProvider, false);
  }

  async function loadGlossary() {
    try {
      const list = await http.get(ENDPOINT_GLOSSARY_LIST);
      renderGlossaryList(Array.isArray(list) ? list : []);
    } catch {
      renderGlossaryList([]);
    }
  }

  function renderGlossaryList(list) {
    ui.glossaryList.innerHTML = "";
    list.forEach((t) => {
      const row = document.createElement("div");
      row.className = "glossary-row";
      row.innerHTML = `
        <div><strong>${escapeHtml(t.term || "")}</strong> → ${escapeHtml(
        t.translation || ""
      )}</div>
        <div class="muted">${escapeHtml(t.notes || "")}</div>
        <div><button class="btn xs ghost" data-id="${
          t.id
        }">Delete</button></div>
      `;
      row.querySelector("button").addEventListener("click", async () => {
        const url = ENDPOINT_GLOSSARY_DELETE.replace(
          "{id}",
          encodeURIComponent(t.id)
        );
        await http.delete(url);
        toast("Term deleted");
        await loadGlossary();
      });
      ui.glossaryList.appendChild(row);
    });
  }

  async function addGlossaryTerm() {
    const term = ui.glTerm.value.trim();
    const translation = ui.glTrans.value.trim();
    const notes = ui.glNotes.value.trim();
    if (!term || !translation) {
      toast("Fill term and translation", "warn");
      return;
    }
    await http.postJson(ENDPOINT_GLOSSARY_ADD, { term, translation, notes });
    ui.glTerm.value = "";
    ui.glTrans.value = "";
    ui.glNotes.value = "";
    toast("Term added");
    await loadGlossary();
  }

  // =============================
  // 9) QA checks (валидация)
  // =============================
  function validatePlaceholders(placeholders, text) {
    // Все плейсхолдеры должны присутствовать в тексте
    const set = new Set((placeholders || []).map(String));
    let ok = true;
    set.forEach((ph) => {
      if (!text.includes(ph)) ok = false;
    });
    return ok;
  }

  async function runQaChecks() {
    // Пример: отправляем на бэкенд пачку текущих строк для проверки
    try {
      const payload = state.rows.map((r) => ({
        key: (r.namespace ? r.namespace + "." : "") + r.key,
        baseText: r.baseText,
        text: state.edited.has(r.id) ? state.edited.get(r.id) : r.text || "",
        placeholders: r.placeholders || [],
        locale: state.targetLocale,
      }));
      const res = await http.postJson(ENDPOINT_QA_VALIDATE, payload);
      renderQa(res);
    } catch {
      renderQa([]);
    }
  }

  function renderQa(issues) {
    ui.qaList.innerHTML = "";
    (Array.isArray(issues) ? issues : []).forEach((item) => {
      const li = document.createElement("li");
      li.className = item.severity || "ok"; // ok|warn|err
      li.textContent = `${item.rule || "Check"}: ${item.message || ""}`;
      ui.qaList.appendChild(li);
    });
  }

  // =============================
  // 10) Слушатели и события
  // =============================
  function wireEvents() {
    // Фильтры
    ui.baseLocaleSel.addEventListener("change", async () => {
      state.baseLocale = ui.baseLocaleSel.value;
      ui.headBaseLocale.textContent = state.baseLocale;
      await fetchKeys();
    });
    ui.targetLocaleSel.addEventListener("change", async () => {
      state.targetLocale = ui.targetLocaleSel.value;
      ui.headLocale.textContent = state.targetLocale;
      await fetchKeys();
    });
    ui.nsSel.addEventListener("change", async () => {
      state.namespace = ui.nsSel.value;
      state.page = 1;
      await fetchKeys();
    });
    ui.statusSel.addEventListener("change", async () => {
      state.status = ui.statusSel.value;
      state.page = 1;
      await fetchKeys();
    });
    ui.applyBtn.addEventListener("click", async () => {
      state.search = ui.searchInput.value.trim();
      state.page = 1;
      await fetchKeys();
    });

    // Пагинация
    ui.prevPage.addEventListener("click", async () => {
      if (state.page > 1) {
        state.page--;
        await fetchKeys();
      }
    });
    ui.nextPage.addEventListener("click", async () => {
      const totalPages = Math.max(1, Math.ceil(state.total / state.size));
      if (state.page < totalPages) {
        state.page++;
        await fetchKeys();
      }
    });

    // Сохранения/массовые
    ui.saveAll.addEventListener("click", saveAllEdited);
    ui.pageSave.addEventListener("click", saveAllEdited);
    ui.discardEdits.addEventListener("click", () => {
      state.edited.clear();
      renderRows();
      toast("Local edits discarded");
    });
    ui.bulkReview.addEventListener("click", async () => {
      const ids = state.rows.map((r) => r.id);
      for (const id of ids) {
        try {
          await markReviewed(id);
        } catch {}
      }
      toast("Page marked as reviewed");
    });

    // Авто-перевод
    ui.translateMissing.addEventListener("click", translateMissingCurrentPage);
    ui.pageTranslate.addEventListener("click", translateMissingCurrentPage);
    ui.mtSettingsBtn.addEventListener("click", () =>
      showModal(ui.dlgProvider, true)
    );
    ui.providerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formObj = {
        name: $("#mtProviderSel").value,
        formality: $("#mtFormality").value,
        exclusions: $("#mtExclusions").value.trim(),
      };
      await saveProvider(formObj);
    });

    // История
    ui.closeDrawerBtn?.addEventListener("click", () =>
      showDrawer(ui.drawer, false)
    );

    // Add Key
    ui.addKeyBtn.addEventListener("click", () => showModal(ui.dlgAddKey, true));
    ui.closeAddKeyBtns.forEach((b) =>
      b.addEventListener("click", () => showModal(ui.dlgAddKey, false))
    );
    ui.addKeyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = {
        namespace: $("#akNamespace").value.trim(),
        key: $("#akKey").value.trim(),
        description: $("#akDescription").value.trim(),
        placeholders: ($("#akPlaceholders").value || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        tags: ($("#akTags").value || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (!body.namespace || !body.key) {
        toast("Fill namespace/key", "warn");
        return;
      }
      await http.postJson(ENDPOINT_CREATE_KEY, body);
      toast("Key created");
      showModal(ui.dlgAddKey, false);
      await fetchKeys();
    });

    // Import
    ui.importBtn.addEventListener("click", () => showModal(ui.dlgImport, true));
    ui.closeImportBtns.forEach((b) =>
      b.addEventListener("click", () => showModal(ui.dlgImport, false))
    );
    ui.impSubmit.addEventListener("click", async () => {
      try {
        await doImport();
      } catch (e) {
        toast(String(e.message || e), "warn");
      }
    });

    // Export
    ui.exportBtn.addEventListener("click", () => showModal(ui.dlgExport, true));
    ui.closeExportBtns.forEach((b) =>
      b.addEventListener("click", () => showModal(ui.dlgExport, false))
    );
    ui.expSubmit.addEventListener("click", async () => {
      try {
        await doExport();
      } catch (e) {
        toast(String(e.message || e), "warn");
      }
    });

    // Publish
    ui.publishBtn.addEventListener("click", () =>
      showModal(ui.dlgPublish, true)
    );
    ui.closePublishBtns.forEach((b) =>
      b.addEventListener("click", () => showModal(ui.dlgPublish, false))
    );
    ui.pubSubmit.addEventListener("click", async () => {
      try {
        await doPublish();
      } catch (e) {
        toast(String(e.message || e), "warn");
      }
    });

    // Glossary
    ui.openGlossary.addEventListener("click", async () => {
      await loadGlossary();
      showModal(ui.dlgGlossary, true);
    });
    ui.closeGlossaryBtns.forEach((b) =>
      b.addEventListener("click", () => showModal(ui.dlgGlossary, false))
    );
    ui.glAdd.addEventListener("click", addGlossaryTerm);

    // Shortcuts (пока просто тост)
    ui.shortcutsBtn?.addEventListener("click", () => {
      toast(
        "Shortcuts: Ctrl+S to Save, Ctrl+F to search (browser), ↑/↓ to navigate."
      );
    });
  }

  // =============================
  // 11) Вспомогательные утилиты
  // =============================
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function formatDate(s) {
    if (!s) return "";
    try {
      const d = new Date(s);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${y}-${m}-${da} ${hh}:${mm}`;
    } catch {
      return String(s);
    }
  }

  // =============================
  // 12) Boot
  // =============================
  async function boot() {
    try {
      await loadLocales();
      await loadNamespaces();
      await loadProvider();
      await fetchKeys();
      wireEvents();
      // Отложенно запустим QA (если нужно) — можно повесить на кнопку, тут просто пример
      // await runQaChecks();
    } catch (e) {
      toast("Init failed: " + (e.message || e), "warn", 5000);
      console.error(e);
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
