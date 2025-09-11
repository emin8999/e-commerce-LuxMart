"use strict";

/**
 * Users Dashboard — JavaScript
 * Требования HTML-структуры: users.html (из предыдущего шага)
 * Зависимости: нет (чистый JS)
 *
 * Особенности:
 * - Читает API base/endpoints из data-атрибутов тулбара (fallback — константы)
 * - Авторизация: заголовок Authorization: Bearer <token из localStorage storeJwt>
 * - Поля фильтров/сортировки совпадают с users.html
 * - Включены: пагинация, выбор, экспорт CSV/XLSX, бан/анбан, назначение роли, массовая смена роли, тосты
 */

/* =========================
 * 0) Конфигурация API
 * ========================= */
const API_DEFAULT_BASE = "http://116.203.51.133/luxmart";

// Раздельные имена API (бэкенду удобно делать контроллеры по ним)
const API_NAMES = {
  GET_USERS_LIST: "/api/admin/users",
  GET_USER_ONE: "/api/admin/users/{id}",
  PUT_USER_ROLE: "/api/admin/users/{id}/role",
  POST_USERS_BULK_ROLE: "/api/admin/users/role/bulk",
  POST_USER_BAN: "/api/admin/users/{id}/ban",
  POST_USER_UNBAN: "/api/admin/users/{id}/unban",
  POST_USER_NOTE: "/api/admin/users/{id}/note",
  GET_EXPORT_CSV: "/api/admin/users/export/csv",
  GET_EXPORT_XLSX: "/api/admin/users/export/xlsx",
};

// Где хранится JWT
const TOKEN_KEY = "storeJwt";

/* =========================
 * 1) Утилиты
 * ========================= */
const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withAuth(init = {}) {
  return {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...authHeaders(),
      ...(init.headers || {}),
    },
    credentials: "omit",
  };
}

function qs(obj = {}) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
    else params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

function fmtMoneyUSD(n) {
  const x = Number(n ?? 0);
  return `$${x.toFixed(2)}`;
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

function toast(msg, type = "info") {
  const root = $$("#toaster");
  if (!root) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function show(el) {
  if (el) el.classList.add("show");
}
function hide(el) {
  if (el) el.classList.remove("show");
}

function roleClass(role) {
  const r = String(role || "").toUpperCase();
  if (r === "ADMIN") return "role-admin";
  if (r === "SELLER") return "role-seller";
  return "role-customer";
}

function statusBadgeClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "BANNED") return "banned";
  if (s === "PENDING") return "pending";
  return "active";
}

function normalizeAvatar(src) {
  if (!src) return "./assets/avatar-ph.png";
  const s = String(src).trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  return `${api.base}/${s.replace(/^\/+/, "")}`;
}

/* =========================
 * 2) Глобальное состояние
 * ========================= */
const api = {
  base: API_DEFAULT_BASE,
  endpoints: { ...API_NAMES },
};

const state = {
  page: 1,
  size: 20,
  total: 0,
  filters: {
    role: "",
    status: "ACTIVE",
    from: "",
    to: "",
    search: "",
    sort: "createdDesc",
  },
  rows: [],
  selection: new Set(),
  currentUser: null,
};

/* =========================
 * 3) Инициализация
 * ========================= */
document.addEventListener("DOMContentLoaded", () => {
  // прочитать api-конфиг из HTML data-атрибутов
  const tb = $$("#usersToolbar");
  if (tb) {
    api.base = tb.dataset.apiBase || API_DEFAULT_BASE;
    try {
      const eps = JSON.parse(tb.dataset.endpoints || "{}");
      api.endpoints = { ...API_NAMES, ...eps };
    } catch {
      // ignore
    }
  }

  bindToolbar();
  bindPaging();
  bindStickyActions();
  bindExportModal();
  bindRoleBulkModal();
  bindDrawer();

  // первая загрузка
  loadUsers().catch((e) => console.error(e));
});

/* =========================
 * 4) Сетевые вызовы
 * ========================= */
async function httpGet(url) {
  const res = await fetch(url, withAuth({ method: "GET" }));
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.blob();
}

async function httpPost(url, bodyObj) {
  const init =
    bodyObj instanceof FormData
      ? { method: "POST", body: bodyObj, headers: { ...authHeaders() } }
      : { method: "POST", body: JSON.stringify(bodyObj || {}) };
  const res = await fetch(url, withAuth(init));
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.headers.get("content-type")?.includes("json")
    ? res.json()
    : res.text();
}

async function httpPut(url, bodyObj) {
  const res = await fetch(
    url,
    withAuth({ method: "PUT", body: JSON.stringify(bodyObj || {}) })
  );
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.headers.get("content-type")?.includes("json")
    ? res.json()
    : res.text();
}

/* =========================
 * 5) Загрузка и отрисовка
 * ========================= */
async function loadUsers() {
  const rowsRoot = $$("#usersRows");
  const empty = $$("#emptyState");
  const checkAll = $$("#checkAll");
  rowsRoot.innerHTML = `<div class="muted" style="padding:.6rem 0">Loading…</div>`;

  // сформировать query по фильтрам + пагинации
  const q = qs({
    role: state.filters.role,
    status: state.filters.status,
    from: state.filters.from,
    to: state.filters.to,
    search: state.filters.search,
    sort: state.filters.sort,
    page: state.page,
    size: state.size,
  });

  try {
    const url = api.base + api.endpoints.GET_USERS_LIST + q;
    const data = await httpGet(url);

    // ожидаемый ответ:
    // { total, items: [{id, name, email, phone, avatarUrl, country, city, createdAt, ordersCount, spendUSD, status, role}] }
    const items = Array.isArray(data?.items) ? data.items : [];
    state.total = Number(data?.total || items.length || 0);
    state.rows = items;

    renderStatsFromList(items, state.total);
    renderRows(items);

    // чекбоксы сбросить
    state.selection.clear();
    updateSelectionUI();

    empty.hidden = items.length > 0;
    checkAll.checked = false;

    renderPager();
  } catch (e) {
    rowsRoot.innerHTML = "";
    $$("#emptyState").hidden = false;
    toast(`Load error: ${e.message}`, "err");
  }
}

function renderStatsFromList(items, total) {
  // простые заглушки по статусам; бэкенд может вернуть свой stats-эндпойнт
  const active = items.filter(
    (x) => String(x.status).toUpperCase() === "ACTIVE"
  ).length;
  const banned = items.filter(
    (x) => String(x.status).toUpperCase() === "BANNED"
  ).length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const newThisMonth = items.filter(
    (x) => new Date(x.createdAt).getTime() >= monthStart
  ).length;
  const retention = Math.max(
    20,
    Math.min(96, Math.round((active / Math.max(1, total)) * 100))
  );

  $$("#stTotal").textContent = String(total);
  $$("#stActive").textContent = String(active);
  $$("#stBanned").textContent = String(banned);
  $$("#stNew").textContent = String(newThisMonth);
  $$("#retentionPct").textContent = `${retention}%`;
  $$("#retentionFill").style.width = `${retention}%`;
}

function renderRows(items) {
  const root = $$("#usersRows");
  root.innerHTML = "";
  items.forEach((u) => {
    const row = document.createElement("div");
    row.className = "row";
    row.dataset.id = String(u.id);

    row.innerHTML = `
      <div class="td col-check"><input type="checkbox" class="rowCheck" aria-label="Select user"></div>
      <div class="td col-id mono">${u.id}</div>
      <div class="td col-user">
        <div class="user-cell">
          <img class="user-avatar" src="${normalizeAvatar(
            u.avatarUrl
          )}" alt="avatar">
          <div>
            <div class="user-name">${u.name || "—"}</div>
            <div class="user-meta">${
              [u.country, u.city].filter(Boolean).join(", ") || "—"
            }</div>
          </div>
        </div>
      </div>
      <div class="td col-email">${u.email || "—"}</div>
      <div class="td col-phone">${u.phone || "—"}</div>
      <div class="td col-reg muted">${fmtDateTime(u.createdAt)}</div>
      <div class="td col-orders mono">${u.ordersCount ?? 0}</div>
      <div class="td col-spend mono">${fmtMoneyUSD(u.spendUSD ?? 0)}</div>
      <div class="td col-status"><span class="badge ${statusBadgeClass(
        u.status
      )}">${String(u.status || "").toLowerCase() || "active"}</span></div>
      <div class="td col-role">
        <span class="role-chip ${roleClass(
          u.role
        )}" title="Change role in drawer">${String(
      u.role || "CUSTOMER"
    ).toUpperCase()}</span>
      </div>
      <div class="td col-actions">
        <div class="action-group">
          <button class="btn xs ghost openDrawer">Details</button>
          <button class="btn xs ghost editRole">Change role</button>
          ${
            String(u.status).toUpperCase() === "BANNED"
              ? `<button class="btn xs ghost unbanUser">Unban</button>`
              : `<button class="btn xs ghost banUser">Ban</button>`
          }
        </div>
      </div>
    `;

    // события
    row.querySelector(".rowCheck")?.addEventListener("change", (e) => {
      if (e.target.checked) state.selection.add(u.id);
      else state.selection.delete(u.id);
      updateSelectionUI();
    });
    row
      .querySelector(".openDrawer")
      ?.addEventListener("click", () => openUserDrawer(u.id));
    row
      .querySelector(".editRole")
      ?.addEventListener("click", () => openUserDrawer(u.id, true));
    row
      .querySelector(".banUser")
      ?.addEventListener("click", () => banUser(u.id));
    row
      .querySelector(".unbanUser")
      ?.addEventListener("click", () => unbanUser(u.id));

    root.appendChild(row);
  });
}

function renderPager() {
  const pages = Math.max(1, Math.ceil(state.total / state.size));
  $$("#pageInfo").textContent = `Page ${state.page} of ${pages}`;
}

/* =========================
 * 6) Привязки UI
 * ========================= */
function bindToolbar() {
  // фильтры
  $$("#roleSel")?.addEventListener(
    "change",
    (e) => (state.filters.role = e.target.value)
  );
  $$("#statusSel")?.addEventListener(
    "change",
    (e) => (state.filters.status = e.target.value)
  );
  $$("#regFrom")?.addEventListener(
    "change",
    (e) => (state.filters.from = e.target.value)
  );
  $$("#regTo")?.addEventListener(
    "change",
    (e) => (state.filters.to = e.target.value)
  );
  $$("#searchUsers")?.addEventListener(
    "input",
    (e) => (state.filters.search = e.target.value.trim())
  );
  $$("#sortSel")?.addEventListener(
    "change",
    (e) => (state.filters.sort = e.target.value)
  );

  $$("#applyFilters")?.addEventListener("click", () => {
    state.page = 1;
    loadUsers();
  });

  // экспорт (кнопки тулбара)
  $$("#exportCsvBtn")?.addEventListener("click", () => openExportModal("csv"));
  $$("#exportXlsBtn")?.addEventListener("click", () => openExportModal("xlsx"));

  // bulk role (кнопка тулбара)
  $$("#openBulkRoleBtn")?.addEventListener("click", () => openRoleBulkModal());
}

function bindPaging() {
  $$("#prevPage")?.addEventListener("click", () => {
    if (state.page > 1) {
      state.page--;
      loadUsers();
    }
  });
  $$("#nextPage")?.addEventListener("click", () => {
    const pages = Math.max(1, Math.ceil(state.total / state.size));
    if (state.page < pages) {
      state.page++;
      loadUsers();
    }
  });

  // экспорт текущей страницы
  $$("#pageExportCsv")?.addEventListener("click", () =>
    exportUsers("csv", "page")
  );
  $$("#pageExportXls")?.addEventListener("click", () =>
    exportUsers("xlsx", "page")
  );

  // чек все
  $$("#checkAll")?.addEventListener("change", (e) => {
    const checks = $$$(".rowCheck");
    state.selection.clear();
    checks.forEach((c) => {
      c.checked = e.target.checked;
      const id = Number(c.closest(".row")?.dataset.id);
      if (e.target.checked && id) state.selection.add(id);
    });
    updateSelectionUI();
  });
}

function bindStickyActions() {
  $$("#bulkBan")?.addEventListener("click", () => bulkBan());
  $$("#bulkUnban")?.addEventListener("click", () => bulkUnban());
  $$("#bulkRoleChange")?.addEventListener("click", () => openRoleBulkModal());
  $$("#bulkExport")?.addEventListener("click", () =>
    exportUsers(undefined, "selected")
  );
  $$("#clearSelection")?.addEventListener("click", () => {
    state.selection.clear();
    $$$(".rowCheck").forEach((c) => (c.checked = false));
    $$("#checkAll").checked = false;
    updateSelectionUI();
  });
}

function updateSelectionUI() {
  const n = state.selection.size;
  const sticky = $$("#stickyActions");
  const badge = $$("#selectionBadge");
  if (n > 0) {
    sticky.setAttribute("aria-hidden", "false");
    badge.hidden = false;
    badge.textContent = `${n} selected`;
  } else {
    sticky.setAttribute("aria-hidden", "true");
    badge.hidden = true;
  }
}

/* =========================
 * 7) Drawer пользователя
 * ========================= */
function bindDrawer() {
  $$$(".closeUserDrawer").forEach((b) =>
    b.addEventListener("click", closeUserDrawer)
  );
  $$("#roleForm")?.addEventListener("submit", onSaveUserRole);
  $$("#closeRole")?.addEventListener("click", closeUserDrawer);
}

async function openUserDrawer(id, focusRole = false) {
  try {
    const url =
      api.base +
      api.endpoints.GET_USER_ONE.replace("{id}", encodeURIComponent(id));
    const u = await httpGet(url);
    // ожидается: {id,name,email,phone,avatarUrl,country,city,createdAt,ordersCount,spendUSD,status,role,addresses:[...]}
    state.currentUser = u;

    $$("#udAvatar").src = normalizeAvatar(u.avatarUrl);
    $$("#udName").textContent = u.name || "—";
    $$("#udEmail").textContent = u.email || "—";
    $$("#udPhone").textContent = u.phone || "—";
    $$("#udReg").textContent = fmtDateTime(u.createdAt);
    $$("#udOrders").textContent = String(u.ordersCount ?? 0);
    $$("#udSpend").textContent = fmtMoneyUSD(u.spendUSD ?? 0);

    // роль и заметка
    $$("#udRole").value = String(u.role || "CUSTOMER").toUpperCase();
    $$("#udNote").value = "";

    // адреса
    const addrRoot = $$("#udAddresses");
    addrRoot.innerHTML = "";
    if (Array.isArray(u.addresses) && u.addresses.length) {
      u.addresses.forEach((a) => {
        const div = document.createElement("div");
        div.textContent = [
          a.country,
          a.city,
          a.addressLine1,
          a.addressLine2,
          a.postalCode,
        ]
          .filter(Boolean)
          .join(", ");
        addrRoot.appendChild(div);
      });
    } else {
      addrRoot.textContent = "—";
    }

    show($$("#userDrawer"));
    if (focusRole) $$("#udRole")?.focus();
  } catch (e) {
    toast(`Load user error: ${e.message}`, "err");
  }
}

function closeUserDrawer() {
  state.currentUser = null;
  hide($$("#userDrawer"));
}

async function onSaveUserRole(e) {
  e.preventDefault();
  if (!state.currentUser?.id) return;
  const id = state.currentUser.id;
  const role = $$("#udRole").value;
  const note = $$("#udNote").value.trim();

  try {
    const url =
      api.base +
      api.endpoints.PUT_USER_ROLE.replace("{id}", encodeURIComponent(id));
    await httpPut(url, { role, note });
    toast("Role updated");
    closeUserDrawer();
    loadUsers();
  } catch (e) {
    toast(`Role update error: ${e.message}`, "err");
  }
}

/* =========================
 * 8) Бан/Анбан
 * ========================= */
async function banUser(id) {
  if (!confirm("Ban this user?")) return;
  try {
    const url =
      api.base +
      api.endpoints.POST_USER_BAN.replace("{id}", encodeURIComponent(id));
    await httpPost(url, {}); // body опционален
    toast("User banned");
    loadUsers();
  } catch (e) {
    toast(`Ban error: ${e.message}`, "err");
  }
}

async function unbanUser(id) {
  if (!confirm("Unban this user?")) return;
  try {
    const url =
      api.base +
      api.endpoints.POST_USER_UNBAN.replace("{id}", encodeURIComponent(id));
    await httpPost(url, {});
    toast("User unbanned");
    loadUsers();
  } catch (e) {
    toast(`Unban error: ${e.message}`, "err");
  }
}

/* =========================
 * 9) Массовые операции: роль, бан/анбан
 * ========================= */
function bindRoleBulkModal() {
  $$$(".closeRoleBulk").forEach((b) =>
    b.addEventListener("click", closeRoleBulkModal)
  );
  $$("#bulkRoleSubmit")?.addEventListener("click", applyRoleBulk);
}
function openRoleBulkModal() {
  if (!state.selection.size) return toast("No users selected", "warn");
  show($$("#dlgRoleBulk"));
}
function closeRoleBulkModal() {
  hide($$("#dlgRoleBulk"));
}

async function applyRoleBulk() {
  if (!state.selection.size) return toast("No users selected", "warn");
  const role = $$("#bulkRoleSel").value;
  const note = $$("#bulkRoleNote").value.trim();
  const ids = Array.from(state.selection.values());

  try {
    const url = api.base + api.endpoints.POST_USERS_BULK_ROLE;
    await httpPost(url, { role, note, ids });
    toast("Roles updated");
    closeRoleBulkModal();
    state.selection.clear();
    loadUsers();
  } catch (e) {
    toast(`Bulk role error: ${e.message}`, "err");
  }
}

async function bulkBan() {
  if (!state.selection.size) return toast("No users selected", "warn");
  if (!confirm("Ban selected users?")) return;
  // Бэкенд может сделать POST /api/admin/users/{id}/ban в цикле,
  // либо предоставить bulk-эндпойнт. Здесь — по одному.
  for (const id of Array.from(state.selection.values())) {
    try {
      const url =
        api.base +
        api.endpoints.POST_USER_BAN.replace("{id}", encodeURIComponent(id));
      await httpPost(url, {});
    } catch (e) {
      toast(`Ban ${id} failed: ${e.message}`, "err");
    }
  }
  toast("Ban completed");
  state.selection.clear();
  loadUsers();
}

async function bulkUnban() {
  if (!state.selection.size) return toast("No users selected", "warn");
  if (!confirm("Unban selected users?")) return;
  for (const id of Array.from(state.selection.values())) {
    try {
      const url =
        api.base +
        api.endpoints.POST_USER_UNBAN.replace("{id}", encodeURIComponent(id));
      await httpPost(url, {});
    } catch (e) {
      toast(`Unban ${id} failed: ${e.message}`, "err");
    }
  }
  toast("Unban completed");
  state.selection.clear();
  loadUsers();
}

/* =========================
 * 10) Экспорт CSV/XLSX
 * ========================= */
function bindExportModal() {
  $$$(".closeExport").forEach((b) =>
    b.addEventListener("click", closeExportModal)
  );
  $$("#expSubmit")?.addEventListener("click", onExportSubmit);
}

function openExportModal(defaultFormat) {
  if (defaultFormat) $$("#expFormat").value = defaultFormat;
  show($$("#dlgExport"));
}
function closeExportModal() {
  hide($$("#dlgExport"));
}

async function onExportSubmit() {
  const fmt = $$("#expFormat").value; // csv|xlsx
  const scope = $$("#expScope").value; // all|page|selected
  await exportUsers(fmt, scope);
  closeExportModal();
}

async function exportUsers(format = "csv", scope = "all") {
  const ep =
    format === "xlsx"
      ? api.endpoints.GET_EXPORT_XLSX
      : api.endpoints.GET_EXPORT_CSV;

  // Бэкенд: поддержите параметры фильтров и scope/ids
  const common = {
    role: state.filters.role,
    status: state.filters.status,
    from: state.filters.from,
    to: state.filters.to,
    search: state.filters.search,
    sort: state.filters.sort,
  };

  let queryObj = { ...common, scope };

  if (scope === "page") {
    queryObj.page = state.page;
    queryObj.size = state.size;
  }
  if (scope === "selected") {
    if (!state.selection.size) return toast("No users selected", "warn");
    queryObj.ids = Array.from(state.selection.values());
  }

  const url = api.base + ep + qs(queryObj);

  try {
    const blob = await httpGet(url); // бэкенд должен вернуть CSV/XLSX контент-тип
    downloadBlob(blob, `users_export_${scope}.${format}`);
    toast(`Exported (${format.toUpperCase()})`);
  } catch (e) {
    toast(`Export error: ${e.message}`, "err");
  }
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}
