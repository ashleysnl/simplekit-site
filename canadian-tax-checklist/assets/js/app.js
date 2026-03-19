(() => {
  const APP_NAME = "Canadian Family Tax Custom Checklist";
  const APP_VERSION = 1;
  const STORAGE_KEY = "simplekit.taxChecklist.planner.v1";
  const STORAGE_BACKUP_KEY = "simplekit.taxChecklist.planner.backup.v1";
  const MAX_ITEM_DEPTH = 2;

  const RELATED_TOOLS = [
    {
      key: "budgetPlanner",
      title: "Monthly Budget Planner",
      description: "Turn tax-season lessons into a cleaner monthly household plan."
    },
    {
      key: "rrsptfsaCalculator",
      title: "RRSP and TFSA Calculator",
      description: "Compare contribution priorities after you have your tax paperwork organized."
    },
    {
      key: "netWorthCalculator",
      title: "Net Worth Calculator",
      description: "Use your tax documents and account statements to update your household snapshot."
    }
  ];

  const selectors = {
    statusRegion: "#statusRegion",
    summaryCategories: "#summaryCategories",
    summaryTasks: "#summaryTasks",
    summaryCompleted: "#summaryCompleted",
    summaryProgress: "#summaryProgress",
    summaryProgressCopy: "#summaryProgressCopy",
    saveStateLabel: "#saveStateLabel",
    saveStateSummaryLabel: "#saveStateSummaryLabel",
    lastSavedLabel: "#lastSavedLabel",
    activeTaxYearLabel: "#activeTaxYearLabel",
    activeTaxYearSummaryLabel: "#activeTaxYearSummaryLabel",
    activeFamilyLabel: "#activeFamilyLabel",
    visibleListLabel: "#visibleListLabel",
    visibleListSummaryLabel: "#visibleListSummaryLabel",
    familyNameInput: "#familyNameInput",
    taxYearLabelInput: "#taxYearLabelInput",
    plannerNotesInput: "#plannerNotesInput",
    searchInput: "#searchInput",
    filterSelect: "#filterSelect",
    resultsMetaCopy: "#resultsMetaCopy",
    checklistContainer: "#checklistContainer",
    importFileInput: "#importFileInput",
    relatedTools: "#relatedTools",
    confirmOverlay: "#confirmOverlay",
    confirmDialog: "#confirmDialog",
    confirmTitle: "#confirmTitle",
    confirmMessage: "#confirmMessage",
    confirmAcceptBtn: "#confirmAcceptBtn",
    confirmCancelBtn: "#confirmCancelBtn",
    confirmCloseBtn: "#confirmCloseBtn"
  };

  const uiState = {
    search: "",
    filter: "all",
    flash: null,
    storageIssue: null,
    hasSuccessfulSave: false
  };

  let planner = null;
  let saveTimeout = null;
  let pendingModalAction = null;
  let lastFocusedElement = null;
  let pendingImportPlanner = null;
  const expandedItems = new Set();
  const expandedCategoryEditors = new Set();
  const expandedCategoryMenus = new Set();

  function createId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  function createItem(title, options = {}) {
    return {
      id: options.id || createId("item"),
      title,
      checked: Boolean(options.checked),
      notes: options.notes || "",
      contactName: options.contactName || "",
      contactEmail: options.contactEmail || "",
      contactPhone: options.contactPhone || "",
      tags: Array.isArray(options.tags) ? options.tags : [],
      children: Array.isArray(options.children) ? options.children : []
    };
  }

  function createCategory(title, description, items = [], options = {}) {
    return {
      id: options.id || createId("cat"),
      title,
      description,
      collapsed: Boolean(options.collapsed),
      items
    };
  }

  function getDefaultCategories() {
    return [
      createCategory("Income slip sources", "Store the places you return to each year for T-slips and contribution receipts.", [
        createItem("My employer payroll portal", { tags: ["income", "t4"], children: [createItem("Download T4", { tags: ["income"] })] }),
        createItem("Spouse employer payroll portal", { tags: ["income", "t4"] }),
        createItem("Bank tax documents page", { tags: ["t5", "banking"] }),
        createItem("Brokerage tax documents page", { tags: ["investment", "t3", "t5008"] }),
        createItem("RRSP / FHSA contribution receipts", { tags: ["rrsp", "fhsa"] })
      ], { collapsed: true }),
      createCategory("Medical and dental providers", "Keep the providers you contact or download from every year.", [
        createItem("Pharmacy", { tags: ["medical"] }),
        createItem("Dentist", { tags: ["medical", "dental"] }),
        createItem("Optometrist", { tags: ["medical", "vision"] }),
        createItem("Physiotherapy", { tags: ["medical"] }),
        createItem("Other recurring medical provider", { tags: ["medical"] })
      ], { collapsed: true }),
      createCategory("Child care and school receipts", "Track day care, school, camp, and activity sources that issue receipts.", [
        createItem("Day care", { tags: ["child-care"] }),
        createItem("After school care", { tags: ["child-care"] }),
        createItem("Summer camp", { tags: ["child-care", "camp"] }),
        createItem("School receipts folder", { tags: ["school"] }),
        createItem("Kids activity provider", { tags: ["kids"] })
      ], { collapsed: true }),
      createCategory("Donations and community giving", "Keep your regular donation sources together.", [
        createItem("Primary charity", { tags: ["donations"] }),
        createItem("School fundraising", { tags: ["donations", "school"] }),
        createItem("Religious or community giving", { tags: ["donations"] })
      ], { collapsed: true }),
      createCategory("Housing and household records", "Store the yearly sources for housing-related records.", [
        createItem("Rent receipts", { tags: ["housing"] }),
        createItem("Property tax account", { tags: ["housing"] }),
        createItem("Home office records", { tags: ["housing", "work"] }),
        createItem("Moving expense folder", { tags: ["housing", "moving"] })
      ], { collapsed: true }),
      createCategory("Banking, investing, and contribution records", "Track the accounts that publish tax slips or contribution summaries.", [
        createItem("Primary chequing bank", { tags: ["banking"] }),
        createItem("Investment brokerage", { tags: ["investment"] }),
        createItem("RRSP provider", { tags: ["rrsp"] }),
        createItem("FHSA provider", { tags: ["fhsa"] }),
        createItem("TFSA notes to review", { tags: ["tfsa"] })
      ], { collapsed: true }),
      createCategory("Work, side income, and business records", "Track recurring work-related receipts and income sources.", [
        createItem("T2200 / work expense contact", { tags: ["employment"] }),
        createItem("Union or professional dues", { tags: ["employment"] }),
        createItem("Side income records folder", { tags: ["side-income"] }),
        createItem("Self-employment bookkeeping folder", { tags: ["self-employment"] })
      ], { collapsed: true }),
      createCategory("Tax filing admin", "Save the key places and yearly wrap-up steps for filing.", [
        createItem("CRA My Account", { tags: ["cra"] }),
        createItem("Last year return PDF", { tags: ["filing", "archive"] }),
        createItem("Notice of Assessment folder", { tags: ["filing"] }),
        createItem("Accountant handoff package", { tags: ["filing"] }),
        createItem("Final return archive", { tags: ["filing", "archive"] })
      ], { collapsed: true }),
      createCategory("Annual household review", "Hide the things that rarely change but still deserve a yearly quick check.", [
        createItem("Household review", {
          tags: ["admin", "family"],
          children: [
            createItem("Marital status still correct", { tags: ["family"] }),
            createItem("Address still correct", { tags: ["family"] }),
            createItem("Dependants list reviewed", { tags: ["family"] }),
            createItem("Direct deposit / CRA profile still correct", { tags: ["cra"] })
          ]
        })
      ], { collapsed: true }),
      createCategory("Custom", "Use this for any family-specific receipt source or recurring reminder.", [
        createItem("Add your own custom tax reminders here", {
          notes: "Use this for any custom receipt source, portal, provider, or yearly reminder you want to load again next season.",
          tags: ["custom"]
        })
      ], { collapsed: true })
    ];
  }

  function createDefaultPlanner() {
    return {
      meta: {
        app: APP_NAME,
        version: APP_VERSION,
        savedAt: new Date().toISOString()
      },
      settings: {
        familyName: "",
        taxYearLabel: "2025 Tax Season",
        notes: ""
      },
      categories: getDefaultCategories()
    };
  }

  function createBlankPlanner() {
    return {
      meta: {
        app: APP_NAME,
        version: APP_VERSION,
        savedAt: new Date().toISOString()
      },
      settings: {
        familyName: "",
        taxYearLabel: "2025 Tax Season",
        notes: ""
      },
      categories: [
        createCategory("Custom", "Start from scratch with your own family tax checklist.", [
          createItem("First custom task", {
            notes: "Rename or remove this item and begin building your own planner.",
            tags: ["custom"]
          })
        ])
      ]
    };
  }

  function deepClone(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  }

  function asText(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
  }

  function asBoolean(value) {
    return Boolean(value);
  }

  function normalizeTags(tags) {
    if (!Array.isArray(tags)) {
      return [];
    }

    return tags
      .map((tag) => asText(tag).trim())
      .filter(Boolean);
  }

  function normalizeItem(item, depth = 0) {
    if (!item || typeof item !== "object") {
      throw new Error("Each checklist item must be an object.");
    }

    const childrenInput = Array.isArray(item.children) ? item.children : [];
    const limitedChildren = depth >= MAX_ITEM_DEPTH ? [] : childrenInput;

    return {
      id: asText(item.id).trim() || createId("item"),
      title: asText(item.title, "Untitled item").trim() || "Untitled item",
      checked: asBoolean(item.checked),
      notes: asText(item.notes).trim(),
      contactName: asText(item.contactName).trim(),
      contactEmail: asText(item.contactEmail).trim(),
      contactPhone: asText(item.contactPhone).trim(),
      tags: normalizeTags(item.tags),
      children: limitedChildren.map((child) => normalizeItem(child, depth + 1))
    };
  }

  function normalizeCategory(category) {
    if (!category || typeof category !== "object") {
      throw new Error("Each category must be an object.");
    }

    if (!Array.isArray(category.items)) {
      throw new Error(`Category "${asText(category.title, "Untitled category")}" is missing its items array.`);
    }

    return {
      id: asText(category.id).trim() || createId("cat"),
      title: asText(category.title, "Untitled category").trim() || "Untitled category",
      description: asText(category.description).trim(),
      collapsed: asBoolean(category.collapsed),
      items: category.items.map((item) => normalizeItem(item))
    };
  }

  function normalizePlanner(raw) {
    if (!raw || typeof raw !== "object") {
      throw new Error("The saved checklist file must contain an object.");
    }

    if (raw.meta?.app && raw.meta.app !== APP_NAME) {
      throw new Error("This checklist file belongs to a different app and cannot be loaded here.");
    }

    if (raw.meta?.version != null && Number(raw.meta.version) !== APP_VERSION) {
      throw new Error(`This checklist file uses schema version ${raw.meta.version}. This tool only supports version ${APP_VERSION}.`);
    }

    if (!Array.isArray(raw.categories)) {
      throw new Error("The saved checklist file must include a categories array.");
    }

    return {
      meta: {
        app: APP_NAME,
        version: APP_VERSION,
        savedAt: new Date().toISOString()
      },
      settings: {
        familyName: asText(raw.settings?.familyName).trim(),
        taxYearLabel: asText(raw.settings?.taxYearLabel, "2025 Tax Season").trim() || "2025 Tax Season",
        notes: asText(raw.settings?.notes).trim()
      },
      categories: raw.categories.map((category) => normalizeCategory(category))
    };
  }

  function serializePlannerForStorage() {
    const copy = deepClone(planner);
    copy.meta.savedAt = new Date().toISOString();
    return JSON.stringify(copy);
  }

  function setFlash(type, title, message) {
    uiState.flash = { type, title, message };
    renderStatus();
  }

  function clearFlash() {
    uiState.flash = null;
    renderStatus();
  }

  function loadInitialPlanner() {
    const fallback = createDefaultPlanner();

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        uiState.hasSuccessfulSave = false;
        return fallback;
      }

      uiState.hasSuccessfulSave = true;
      return normalizePlanner(JSON.parse(saved));
    } catch (error) {
      uiState.storageIssue = {
        title: "Saved planner could not be restored",
        message: "The planner saved in this browser looks corrupted or incomplete. You can reset local storage and continue with a fresh default checklist."
      };
      uiState.hasSuccessfulSave = false;

      try {
        const broken = window.localStorage.getItem(STORAGE_KEY);
        if (broken) {
          window.localStorage.setItem(STORAGE_BACKUP_KEY, broken);
        }
      } catch (backupError) {
        // Ignore storage backup issues and fall back safely.
      }

      return fallback;
    }
  }

  function savePlanner() {
    window.clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(() => {
      try {
        planner.meta.savedAt = new Date().toISOString();
        window.localStorage.setItem(STORAGE_KEY, serializePlannerForStorage());
        uiState.hasSuccessfulSave = true;
        renderPlannerStateStrip();
      } catch (error) {
        uiState.hasSuccessfulSave = false;
        setFlash("error", "Could not save to this browser", "Changes are still on the page, but local browser storage is unavailable right now. Save a checklist backup if you do not want to lose this version.");
      }
    }, 120);
  }

  function getCategoryIndexById(categoryId) {
    return planner.categories.findIndex((category) => category.id === categoryId);
  }

  function walkItems(items, visitor, parent = null, depth = 0) {
    items.forEach((item, index) => {
      visitor(item, index, items, parent, depth);
      if (item.children.length > 0) {
        walkItems(item.children, visitor, item, depth + 1);
      }
    });
  }

  function findItemContext(itemId) {
    for (const category of planner.categories) {
      const stack = [{ items: category.items, parent: null, depth: 0 }];

      while (stack.length > 0) {
        const current = stack.pop();
        for (let index = 0; index < current.items.length; index += 1) {
          const item = current.items[index];
          if (item.id === itemId) {
            return {
              item,
              index,
              siblings: current.items,
              parent: current.parent,
              category,
              depth: current.depth
            };
          }

          if (item.children.length > 0) {
            stack.push({ items: item.children, parent: item, depth: current.depth + 1 });
          }
        }
      }
    }

    return null;
  }

  function countItems(items) {
    return items.reduce((total, item) => total + 1 + countItems(item.children), 0);
  }

  function countCompletedItems(items) {
    return items.reduce(
      (total, item) => total + (item.checked ? 1 : 0) + countCompletedItems(item.children),
      0
    );
  }

  function getPlannerStats() {
    const categoriesCount = planner.categories.length;
    const taskCount = planner.categories.reduce((total, category) => total + countItems(category.items), 0);
    const completedCount = planner.categories.reduce((total, category) => total + countCompletedItems(category.items), 0);
    const progress = taskCount === 0 ? 0 : Math.round((completedCount / taskCount) * 100);

    return {
      categoriesCount,
      taskCount,
      completedCount,
      progress
    };
  }

  function getCategoryStats(category) {
    const taskCount = countItems(category.items);
    const completedCount = countCompletedItems(category.items);
    const progress = taskCount === 0 ? 0 : Math.round((completedCount / taskCount) * 100);

    return {
      taskCount,
      completedCount,
      progress
    };
  }

  function formatSavedAt(value) {
    if (!value) {
      return "Waiting for your first change.";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "Saved in this browser.";
    }

    return `Last saved ${parsed.toLocaleString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    })}.`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#96;");
  }

  function getSearchableText(item) {
    return [
      item.title,
      item.notes,
      item.contactName,
      item.contactEmail,
      item.contactPhone,
      item.tags.join(" ")
    ]
      .join(" ")
      .toLowerCase();
  }

  function matchesFilter(item) {
    if (uiState.filter === "completed") {
      return item.checked;
    }

    if (uiState.filter === "incomplete") {
      return !item.checked;
    }

    return true;
  }

  function filterItemTree(item) {
    const term = uiState.search.trim().toLowerCase();
    const childMatches = item.children
      .map((child) => filterItemTree(child))
      .filter(Boolean);

    const selfMatchesSearch = !term || getSearchableText(item).includes(term);
    const selfMatchesFilter = matchesFilter(item);

    if ((selfMatchesSearch && selfMatchesFilter) || childMatches.length > 0) {
      return {
        ...item,
        children: childMatches
      };
    }

    return null;
  }

  function getVisibleCategories() {
    return planner.categories
      .map((category) => {
        const filteredItems = category.items
          .map((item) => filterItemTree(item))
          .filter(Boolean);

        const term = uiState.search.trim().toLowerCase();
        const categoryMatches = !term
          || category.title.toLowerCase().includes(term)
          || category.description.toLowerCase().includes(term);

        if (categoryMatches && uiState.filter === "all" && filteredItems.length === 0 && category.items.length === 0) {
          return {
            ...category,
            items: []
          };
        }

        if (filteredItems.length > 0 || (categoryMatches && uiState.filter === "all")) {
          return {
            ...category,
            items: filteredItems
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  function renderStatus() {
    const statusRegion = document.querySelector(selectors.statusRegion);
    if (!statusRegion) {
      return;
    }

    const cards = [];

    if (uiState.storageIssue) {
      cards.push(`
        <div class="status-card status-card-warning">
          <div>
            <strong>${escapeHtml(uiState.storageIssue.title)}</strong>
            <p>${escapeHtml(uiState.storageIssue.message)}</p>
          </div>
          <button class="btn btn-secondary-panel" type="button" data-action="reset-storage">Reset saved browser data</button>
        </div>
      `);
    }

    if (uiState.flash) {
      cards.push(`
        <div class="status-card status-card-${escapeAttribute(uiState.flash.type)}">
          <div>
            <strong>${escapeHtml(uiState.flash.title)}</strong>
            <p>${escapeHtml(uiState.flash.message)}</p>
          </div>
          <button class="btn btn-secondary-panel" type="button" data-action="dismiss-status">Dismiss</button>
        </div>
      `);
    }

    statusRegion.innerHTML = cards.join("");
  }

  function renderSummary() {
    const stats = getPlannerStats();
    document.querySelector(selectors.summaryCategories).textContent = String(stats.categoriesCount);
    document.querySelector(selectors.summaryTasks).textContent = String(stats.taskCount);
    document.querySelector(selectors.summaryCompleted).textContent = String(stats.completedCount);
    document.querySelector(selectors.summaryProgress).textContent = `${Math.max(stats.taskCount - stats.completedCount, 0)}`;

    const progressCopy = stats.taskCount === 0
      ? "Add a group or load a saved checklist to get started."
      : `${Math.max(stats.taskCount - stats.completedCount, 0)} sources or follow-ups still open.`;

    document.querySelector(selectors.summaryProgressCopy).textContent = progressCopy;
  }

  function renderPlannerStateStrip() {
    const saveLabel = uiState.hasSuccessfulSave
      ? "Auto-saved in this browser"
      : "Saving locally in this browser";
    const taxYearLabel = planner.settings.taxYearLabel || "No tax year label";
    document.querySelector(selectors.saveStateLabel).textContent = saveLabel;
    document.querySelector(selectors.saveStateSummaryLabel).textContent = saveLabel;
    document.querySelector(selectors.lastSavedLabel).textContent = formatSavedAt(planner.meta.savedAt);
    document.querySelector(selectors.activeTaxYearLabel).textContent = taxYearLabel;
    document.querySelector(selectors.activeTaxYearSummaryLabel).textContent = taxYearLabel;
    document.querySelector(selectors.activeFamilyLabel).textContent = planner.settings.familyName || "No household label added yet.";

    const filterLabel = uiState.filter === "all"
      ? "Showing all items"
      : uiState.filter === "completed"
        ? "Showing completed items"
        : "Showing incomplete items";
    const searchSuffix = uiState.search.trim() ? ` matching "${uiState.search.trim()}"` : "";
    const visibleLabel = `${filterLabel}${searchSuffix}`;
    document.querySelector(selectors.visibleListLabel).textContent = visibleLabel;
    document.querySelector(selectors.visibleListSummaryLabel).textContent = visibleLabel;
  }

  function renderSettings() {
    document.querySelector(selectors.familyNameInput).value = planner.settings.familyName;
    document.querySelector(selectors.taxYearLabelInput).value = planner.settings.taxYearLabel;
    document.querySelector(selectors.plannerNotesInput).value = planner.settings.notes;
  }

  function renderRelatedTools() {
    const root = document.querySelector(selectors.relatedTools);
    if (!root) {
      return;
    }

    root.innerHTML = RELATED_TOOLS.map((tool) => `
      <article>
        <span class="trust-label">SimpleKit tool</span>
        <strong>${escapeHtml(tool.title)}</strong>
        <p>${escapeHtml(tool.description)}</p>
        <a class="btn btn-secondary-panel" href="${escapeAttribute(window.getSimpleKitToolUrl(tool.key))}">Open tool</a>
      </article>
    `).join("");
  }

  function renderEmptyChecklistState() {
    return `
      <div class="empty-state">
        <strong>No checklist items match this view yet.</strong>
        <p>Try changing the search or filter, add a receipt-source group, or restore the default family checklist.</p>
        <div class="hero-actions">
          <button class="btn btn-secondary-panel" type="button" data-action="clear-search">Clear search</button>
          <button class="btn btn-primary" type="button" data-action="add-category">Add group</button>
        </div>
      </div>
    `;
  }

  function renderItem(item, depth = 0) {
    const hasExtraDetails = Boolean(
      item.notes
      || item.contactName
      || item.contactEmail
      || item.contactPhone
      || item.tags.length > 0
    );
    const isExpanded = expandedItems.has(item.id);
    const detailBits = [
      hasExtraDetails ? "saved details" : "",
      item.children.length > 0 ? `${item.children.length} sub-item${item.children.length === 1 ? "" : "s"}` : ""
    ].filter(Boolean);

    const tagsValue = item.tags.join(", ");
    const childMarkup = item.children.length > 0
      ? `<div class="item-children">${item.children.map((child) => renderItem(child, depth + 1)).join("")}</div>`
      : "";

    return `
      <article class="item-card" data-depth="${depth}">
        <div class="item-row">
          <div class="item-primary">
            <input
              class="item-checkbox"
              type="checkbox"
              ${item.checked ? "checked" : ""}
              aria-label="Mark ${escapeAttribute(item.title)} complete"
              data-action="toggle-item"
              data-item-id="${escapeAttribute(item.id)}"
            >
            <span class="item-title-text">${escapeHtml(item.title)}</span>
            <span class="pill">${item.checked ? "Completed" : "Open"}</span>
            ${detailBits.map((bit) => `<span class="pill pill-muted">${escapeHtml(bit)}</span>`).join("")}
          </div>
          <div class="item-actions no-print">
            <button
              class="btn btn-secondary-panel item-detail-toggle"
              type="button"
              aria-expanded="${isExpanded ? "true" : "false"}"
              data-action="toggle-item-details"
              data-item-id="${escapeAttribute(item.id)}"
            >${isExpanded ? "Hide" : "More"}</button>
          </div>
        </div>
        <div class="item-details-grid" ${isExpanded ? "" : "hidden"}>
          <label class="form-field full-width">
            <span>Receipt source or reminder</span>
            <input
              id="title-${escapeAttribute(item.id)}"
              class="item-title-input"
              type="text"
              value="${escapeAttribute(item.title)}"
              placeholder="Checklist item"
              data-action="edit-item-title"
              data-item-id="${escapeAttribute(item.id)}"
            >
          </label>
          <label class="form-field full-width">
            <span>Notes</span>
            <textarea
              class="notes-input"
              rows="3"
              placeholder="Add receipt details, follow-ups, or reminders."
              data-action="edit-item-field"
              data-item-id="${escapeAttribute(item.id)}"
              data-field="notes"
            >${escapeHtml(item.notes)}</textarea>
          </label>
          <label class="form-field">
            <span>Contact name</span>
            <input
              type="text"
              value="${escapeAttribute(item.contactName)}"
              placeholder="Provider, employer, school, or accountant"
              data-action="edit-item-field"
              data-item-id="${escapeAttribute(item.id)}"
              data-field="contactName"
            >
          </label>
          <label class="form-field">
            <span>Contact email</span>
            <input
              type="email"
              value="${escapeAttribute(item.contactEmail)}"
              placeholder="name@example.ca"
              data-action="edit-item-field"
              data-item-id="${escapeAttribute(item.id)}"
              data-field="contactEmail"
            >
          </label>
          <label class="form-field">
            <span>Contact phone</span>
            <input
              type="tel"
              value="${escapeAttribute(item.contactPhone)}"
              placeholder="709-555-0123"
              data-action="edit-item-field"
              data-item-id="${escapeAttribute(item.id)}"
              data-field="contactPhone"
            >
          </label>
          <label class="form-field">
            <span>Tags</span>
            <input
              class="tag-input"
              type="text"
              value="${escapeAttribute(tagsValue)}"
              placeholder="medical, receipts, follow-up"
              data-action="edit-item-tags"
              data-item-id="${escapeAttribute(item.id)}"
            >
          </label>
          <div class="item-detail-actions full-width no-print">
            ${depth < MAX_ITEM_DEPTH ? `<button class="btn btn-secondary-panel" type="button" data-action="add-child-item" data-item-id="${escapeAttribute(item.id)}">Add sub-item</button>` : ""}
            <button class="btn btn-secondary-panel" type="button" data-action="duplicate-item" data-item-id="${escapeAttribute(item.id)}">Duplicate</button>
            <button class="btn btn-secondary-panel" type="button" data-action="delete-item" data-item-id="${escapeAttribute(item.id)}">Delete</button>
          </div>
        </div>
        ${childMarkup}
      </article>
    `;
  }

  function renderCategory(category) {
    const actualIndex = getCategoryIndexById(category.id);
    const actualCategory = planner.categories[actualIndex] || category;
    const stats = getCategoryStats(actualCategory);
    const isEditorOpen = expandedCategoryEditors.has(category.id);
    const isMenuOpen = expandedCategoryMenus.has(category.id);
    const bodyMarkup = category.items.length > 0
      ? category.items.map((item) => renderItem(item)).join("")
      : `
        <div class="empty-state">
          <strong>This category is empty.</strong>
          <p>Add tasks, receipts, or follow-up items for this part of your family tax prep.</p>
        </div>
      `;

    return `
      <section class="category-card" aria-labelledby="category-${escapeAttribute(category.id)}">
        <div class="category-head">
          <div class="category-main">
            <h3 id="category-${escapeAttribute(category.id)}" class="category-title-text">${escapeHtml(category.title)}${category.title === "Annual household review" ? ' <span class="category-badge">Occasional review</span>' : ""}</h3>
            <p class="category-description-text">${escapeHtml(category.description)}</p>
          </div>
          <div class="category-progress" aria-label="${escapeAttribute(category.title)} progress">
            <div class="progress-meta">
              <span>${stats.completedCount} of ${stats.taskCount} complete</span>
              <span>${stats.progress}%</span>
            </div>
            <div class="progress-bar" aria-hidden="true">
              <div class="progress-value" style="width:${stats.progress}%"></div>
            </div>
          </div>
          <div class="category-actions no-print">
            <button class="btn btn-secondary-panel" type="button" data-action="toggle-category" data-category-id="${escapeAttribute(category.id)}">${category.collapsed ? "Open" : "Close"}</button>
            <button class="btn btn-secondary-panel" type="button" data-action="add-item" data-category-id="${escapeAttribute(category.id)}">Add</button>
            <button class="btn btn-secondary-panel" type="button" data-action="toggle-category-menu" data-category-id="${escapeAttribute(category.id)}">${isMenuOpen ? "Hide" : "More"}</button>
          </div>
        </div>
        <div class="category-body" ${category.collapsed ? "hidden" : ""}>
          <div class="item-details-grid category-manage-grid" ${isMenuOpen ? "" : "hidden"}>
            <button class="btn btn-secondary-panel" type="button" data-action="toggle-category-editor" data-category-id="${escapeAttribute(category.id)}">${isEditorOpen ? "Hide edit" : "Edit"}</button>
            <button class="btn btn-secondary-panel" type="button" data-action="move-category-up" data-category-id="${escapeAttribute(category.id)}" ${actualIndex === 0 ? "disabled" : ""}>Move up</button>
            <button class="btn btn-secondary-panel" type="button" data-action="move-category-down" data-category-id="${escapeAttribute(category.id)}" ${actualIndex === planner.categories.length - 1 ? "disabled" : ""}>Move down</button>
            <button class="btn btn-secondary-panel" type="button" data-action="delete-category" data-category-id="${escapeAttribute(category.id)}">Delete</button>
          </div>
          <div class="item-details-grid category-edit-grid" ${isEditorOpen ? "" : "hidden"}>
            <label class="form-field full-width">
              <span>Category title</span>
              <input
                class="title-input"
                type="text"
                value="${escapeAttribute(category.title)}"
                data-action="edit-category-title"
                data-category-id="${escapeAttribute(category.id)}"
              >
            </label>
            <label class="form-field full-width">
              <span>Description</span>
              <textarea
                class="category-description"
                rows="3"
                placeholder="Describe what belongs in this category."
                data-action="edit-category-description"
                data-category-id="${escapeAttribute(category.id)}"
              >${escapeHtml(category.description)}</textarea>
            </label>
          </div>
          <div class="items-list">${bodyMarkup}</div>
        </div>
      </section>
    `;
  }

  function renderChecklist() {
    const container = document.querySelector(selectors.checklistContainer);
    const resultsMetaCopy = document.querySelector(selectors.resultsMetaCopy);
    if (!container || !resultsMetaCopy) {
      return;
    }

    const visibleCategories = getVisibleCategories();
    const stats = getPlannerStats();
    const activeFilterLabel = uiState.filter === "all" ? "all items" : uiState.filter;
    const searchLabel = uiState.search.trim() ? ` matching "${uiState.search.trim()}"` : "";

    resultsMetaCopy.textContent = `${stats.categoriesCount} groups, ${stats.taskCount} saved sources and steps, showing ${activeFilterLabel}${searchLabel}. Save a backup when your setup changes. Progress totals reflect the full planner.`;

    if (visibleCategories.length === 0) {
      container.innerHTML = renderEmptyChecklistState();
      return;
    }

    container.innerHTML = visibleCategories.map((category) => renderCategory(category)).join("");
  }

  function renderAll() {
    renderStatus();
    renderSummary();
    renderPlannerStateStrip();
    renderSettings();
    renderChecklist();
    renderRelatedTools();
  }

  function updatePlanner(mutator, flash) {
    mutator();
    savePlanner();
    if (flash) {
      setFlash(flash.type, flash.title, flash.message);
    } else {
      renderStatus();
    }
    renderAll();
  }

  function addCategory() {
    const category = createCategory("New receipt source group", "Use this for a set of places you return to each tax season.", [
      createItem("New receipt source", {
        notes: "Add the provider, portal, folder, or yearly reminder you want to remember next season.",
        tags: ["custom"]
      })
    ]);

    updatePlanner(() => {
      planner.categories.push(category);
    }, {
      type: "success",
      title: "Category added",
      message: "A new category was added to your planner and saved in this browser."
    });
  }

  function addItemToCategory(categoryId) {
    const category = planner.categories.find((entry) => entry.id === categoryId);
    if (!category) {
      return;
    }

    updatePlanner(() => {
      category.items.push(createItem("New receipt source", {
        notes: "Add the place, provider, or folder you come back to each year.",
        tags: ["custom"]
      }));
      category.collapsed = false;
    });
  }

  function addChildItem(itemId) {
    const context = findItemContext(itemId);
    if (!context || context.depth >= MAX_ITEM_DEPTH) {
      return;
    }

    updatePlanner(() => {
      context.item.children.push(createItem("New sub-item", {
        notes: "Use sub-items for follow-ups, requests, or small prep steps.",
        tags: ["follow-up"]
      }));
      context.category.collapsed = false;
    });
  }

  function duplicateItem(itemId) {
    const context = findItemContext(itemId);
    if (!context) {
      return;
    }

    updatePlanner(() => {
      const copy = deepClone(context.item);

      const refreshIds = (item) => {
        item.id = createId("item");
        item.children.forEach(refreshIds);
      };

      refreshIds(copy);
      copy.title = `${copy.title} copy`;
      context.siblings.splice(context.index + 1, 0, copy);
    }, {
      type: "success",
      title: "Item duplicated",
      message: "The checklist item and any nested sub-items were copied."
    });
  }

  function clearAllCheckmarks() {
    openConfirm({
      title: "Clear all checkmarks?",
      message: "Are you sure you want to clear all checkmarks? Your custom checklist structure and notes will be kept.",
      confirmLabel: "Clear checkmarks",
      confirmClass: "btn-danger",
      onConfirm: () => {
        updatePlanner(() => {
          walkItemsAcrossPlanner((item) => {
            item.checked = false;
          });
        }, {
          type: "success",
          title: "Checkmarks cleared",
          message: "All task completion states were reset, and your custom structure was preserved."
        });
      }
    });
  }

  function startBlankPlanner() {
    openConfirm({
      title: "Start new blank planner?",
      message: "Are you sure you want to start a new blank planner? This will replace your current checklist in the browser unless you save it first.",
      confirmLabel: "Start blank planner",
      confirmClass: "btn-danger",
      onConfirm: () => {
        planner = createBlankPlanner();
        savePlanner();
        setFlash("success", "Blank planner created", "A fresh blank planner replaced the current one in this browser.");
        renderAll();
      }
    });
  }

  function restoreDefaultPlanner() {
    openConfirm({
      title: "Restore default family checklist?",
      message: "Are you sure you want to restore the default family checklist? This will replace your current planner in the browser.",
      confirmLabel: "Restore defaults",
      confirmClass: "btn-danger",
      onConfirm: () => {
        planner = createDefaultPlanner();
        savePlanner();
        setFlash("success", "Default checklist restored", "The original family tax checklist template is active again.");
        renderAll();
      }
    });
  }

  function importPlannerFromPending() {
    if (!pendingImportPlanner) {
      return;
    }

    planner = pendingImportPlanner;
    pendingImportPlanner = null;
    savePlanner();
    setFlash("success", "Checklist loaded", "Your saved checklist file replaced the current in-browser planner.");
    renderAll();
  }

  function walkItemsAcrossPlanner(visitor) {
    planner.categories.forEach((category) => {
      walkItems(category.items, visitor);
    });
  }

  function exportPlanner() {
    try {
      const payload = deepClone(planner);
      payload.meta.app = APP_NAME;
      payload.meta.version = APP_VERSION;
      payload.meta.savedAt = new Date().toISOString();

      const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeLabel = (planner.settings.taxYearLabel || "tax-season")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      anchor.href = url;
      anchor.download = `canadian-family-tax-checklist-${safeLabel || "planner"}.json`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      setFlash("success", "Checklist saved", "Your current planner was downloaded as a .json checklist file you can keep for next year.");
    } catch (error) {
      setFlash("error", "Save failed", "The planner could not be saved as a checklist file right now. Try again, or copy your notes before leaving the page.");
    }
  }

  async function handleImportFile(file) {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      pendingImportPlanner = normalizePlanner(parsed);

      openConfirm({
        title: "Load saved checklist?",
        message: "Loading this file will replace the current planner in the browser. Save your current checklist first if you want a backup.",
        confirmLabel: "Load checklist",
        confirmClass: "btn-danger",
        onConfirm: importPlannerFromPending
      });
    } catch (error) {
      pendingImportPlanner = null;
      setFlash("error", "Load could not be completed", error instanceof Error ? error.message : "The selected file is not a valid saved checklist file.");
    }
  }

  function resetSavedBrowserData() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      uiState.storageIssue = null;
      uiState.hasSuccessfulSave = false;
      planner = createDefaultPlanner();
      savePlanner();
      setFlash("success", "Browser data reset", "The corrupted saved planner was cleared and the default checklist has been restored.");
      renderAll();
    } catch (error) {
      setFlash("error", "Storage reset failed", "The saved browser data could not be cleared automatically. You may need to clear site storage manually in your browser.");
    }
  }

  function moveCategory(categoryId, direction) {
    const index = getCategoryIndexById(categoryId);
    if (index < 0) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= planner.categories.length) {
      return;
    }

    updatePlanner(() => {
      const [category] = planner.categories.splice(index, 1);
      planner.categories.splice(targetIndex, 0, category);
    });
  }

  function deleteCategory(categoryId) {
    const category = planner.categories.find((entry) => entry.id === categoryId);
    if (!category) {
      return;
    }

    openConfirm({
      title: "Delete category?",
      message: `Are you sure you want to delete "${category.title}" and all of its checklist items?`,
      confirmLabel: "Delete category",
      confirmClass: "btn-danger",
      onConfirm: () => {
        updatePlanner(() => {
          planner.categories = planner.categories.filter((entry) => entry.id !== categoryId);
        }, {
          type: "success",
          title: "Category deleted",
          message: "The category was removed from your planner."
        });
      }
    });
  }

  function deleteItem(itemId) {
    const context = findItemContext(itemId);
    if (!context) {
      return;
    }

    openConfirm({
      title: context.depth > 0 ? "Delete sub-item?" : "Delete item?",
      message: `Are you sure you want to delete "${context.item.title}"${context.depth > 0 ? " and any nested follow-up items" : ""}?`,
      confirmLabel: context.depth > 0 ? "Delete sub-item" : "Delete item",
      confirmClass: "btn-danger",
      onConfirm: () => {
        updatePlanner(() => {
          context.siblings.splice(context.index, 1);
        }, {
          type: "success",
          title: context.depth > 0 ? "Sub-item deleted" : "Item deleted",
          message: "The selected checklist entry was removed."
        });
      }
    });
  }

  function openConfirm(options) {
    const overlay = document.querySelector(selectors.confirmOverlay);
    const dialog = document.querySelector(selectors.confirmDialog);
    const pageShell = document.querySelector(".page-shell");
    const title = document.querySelector(selectors.confirmTitle);
    const message = document.querySelector(selectors.confirmMessage);
    const acceptButton = document.querySelector(selectors.confirmAcceptBtn);

    pendingModalAction = options.onConfirm;
    lastFocusedElement = document.activeElement;

    title.textContent = options.title;
    message.textContent = options.message;
    acceptButton.textContent = options.confirmLabel || "Confirm";
    acceptButton.className = `btn ${options.confirmClass || "btn-primary"}`;
    overlay.hidden = false;
    pageShell?.setAttribute("aria-hidden", "true");
    dialog.focus();
    document.body.style.overflow = "hidden";
  }

  function closeConfirm() {
    const overlay = document.querySelector(selectors.confirmOverlay);
    const pageShell = document.querySelector(".page-shell");
    overlay.hidden = true;
    pendingModalAction = null;
    pageShell?.removeAttribute("aria-hidden");
    document.body.style.overflow = "";
    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  }

  function closeResetMenus() {
    document.querySelectorAll(".reset-menu[open]").forEach((menu) => {
      menu.open = false;
    });
  }

  function handleModalAccept() {
    const action = pendingModalAction;
    closeConfirm();
    if (typeof action === "function") {
      action();
    }
  }

  function trapModalFocus(event) {
    const overlay = document.querySelector(selectors.confirmOverlay);
    if (overlay.hidden || event.key !== "Tab") {
      return;
    }

    const dialog = document.querySelector(selectors.confirmDialog);
    const focusable = [...dialog.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setAllCategoriesCollapsed(collapsed) {
    updatePlanner(() => {
      planner.categories.forEach((category) => {
        category.collapsed = collapsed;
      });
    });
  }

  function parseTags(value) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function handleInput(event) {
    if (event.target.matches(selectors.searchInput)) {
      uiState.search = event.target.value;
      renderPlannerStateStrip();
      renderChecklist();
      return;
    }

    if (event.target.matches(selectors.familyNameInput)) {
      planner.settings.familyName = event.target.value;
      savePlanner();
      renderPlannerStateStrip();
      return;
    }

    if (event.target.matches(selectors.taxYearLabelInput)) {
      planner.settings.taxYearLabel = event.target.value;
      savePlanner();
      renderPlannerStateStrip();
      return;
    }

    if (event.target.matches(selectors.plannerNotesInput)) {
      planner.settings.notes = event.target.value;
      savePlanner();
      return;
    }

    const action = event.target.dataset.action;

    if (action === "edit-category-title") {
      const category = planner.categories.find((entry) => entry.id === event.target.dataset.categoryId);
      if (!category) {
        return;
      }
      category.title = event.target.value || "Untitled category";
      savePlanner();
      return;
    }

    if (action === "edit-category-description") {
      const category = planner.categories.find((entry) => entry.id === event.target.dataset.categoryId);
      if (!category) {
        return;
      }
      category.description = event.target.value;
      savePlanner();
      return;
    }

    if (action === "edit-item-title") {
      const context = findItemContext(event.target.dataset.itemId);
      if (!context) {
        return;
      }
      context.item.title = event.target.value || "Untitled item";
      savePlanner();
      return;
    }

    if (action === "edit-item-field") {
      const context = findItemContext(event.target.dataset.itemId);
      const field = event.target.dataset.field;
      if (!context || !field) {
        return;
      }
      context.item[field] = event.target.value;
      savePlanner();
      return;
    }

    if (action === "edit-item-tags") {
      const context = findItemContext(event.target.dataset.itemId);
      if (!context) {
        return;
      }
      context.item.tags = parseTags(event.target.value);
      savePlanner();
    }
  }

  function handleChange(event) {
    const action = event.target.dataset.action;

    if (event.target.matches(selectors.familyNameInput)) {
      updatePlanner(() => {
        planner.settings.familyName = event.target.value;
      });
      return;
    }

    if (event.target.matches(selectors.taxYearLabelInput)) {
      updatePlanner(() => {
        planner.settings.taxYearLabel = event.target.value;
      });
      return;
    }

    if (event.target.matches(selectors.plannerNotesInput)) {
      updatePlanner(() => {
        planner.settings.notes = event.target.value;
      });
      return;
    }

    if (event.target.matches(selectors.filterSelect)) {
      uiState.filter = event.target.value;
      renderPlannerStateStrip();
      renderChecklist();
      return;
    }

    if (action === "edit-category-title") {
      const category = planner.categories.find((entry) => entry.id === event.target.dataset.categoryId);
      if (!category) {
        return;
      }
      updatePlanner(() => {
        category.title = event.target.value || "Untitled category";
      });
      return;
    }

    if (action === "edit-category-description") {
      const category = planner.categories.find((entry) => entry.id === event.target.dataset.categoryId);
      if (!category) {
        return;
      }
      updatePlanner(() => {
        category.description = event.target.value;
      });
      return;
    }

    if (action === "edit-item-title") {
      const context = findItemContext(event.target.dataset.itemId);
      if (!context) {
        return;
      }
      updatePlanner(() => {
        context.item.title = event.target.value || "Untitled item";
      });
      return;
    }

    if (action === "edit-item-field") {
      const context = findItemContext(event.target.dataset.itemId);
      const field = event.target.dataset.field;
      if (!context || !field) {
        return;
      }
      updatePlanner(() => {
        context.item[field] = event.target.value;
      });
      return;
    }

    if (action === "edit-item-tags") {
      const context = findItemContext(event.target.dataset.itemId);
      if (!context) {
        return;
      }
      updatePlanner(() => {
        context.item.tags = parseTags(event.target.value);
      });
      return;
    }

    if (action === "toggle-item") {
      const context = findItemContext(event.target.dataset.itemId);
      if (!context) {
        return;
      }

      updatePlanner(() => {
        context.item.checked = event.target.checked;
      });
    }
  }

  function handleClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const { action } = button.dataset;

    if (action === "dismiss-status") {
      clearFlash();
      return;
    }

    if (action === "reset-storage") {
      resetSavedBrowserData();
      return;
    }

    if (action === "export-json") {
      exportPlanner();
      return;
    }

    if (action === "import-json") {
      document.querySelector(selectors.importFileInput).click();
      return;
    }

    if (action === "add-category") {
      addCategory();
      return;
    }

    if (action === "expand-all") {
      setAllCategoriesCollapsed(false);
      return;
    }

    if (action === "collapse-all") {
      setAllCategoriesCollapsed(true);
      return;
    }

    if (action === "clear-checkmarks") {
      closeResetMenus();
      clearAllCheckmarks();
      return;
    }

    if (action === "start-blank") {
      closeResetMenus();
      startBlankPlanner();
      return;
    }

    if (action === "restore-defaults") {
      closeResetMenus();
      restoreDefaultPlanner();
      return;
    }

    if (action === "print-planner") {
      window.print();
      return;
    }

    if (action === "clear-search") {
      uiState.search = "";
      uiState.filter = "all";
      document.querySelector(selectors.searchInput).value = "";
      document.querySelector(selectors.filterSelect).value = "all";
      renderPlannerStateStrip();
      renderChecklist();
      return;
    }

    if (action === "toggle-item-details") {
      const itemId = button.dataset.itemId;
      if (!itemId) {
        return;
      }

      if (expandedItems.has(itemId)) {
        expandedItems.delete(itemId);
      } else {
        expandedItems.add(itemId);
      }

      renderChecklist();
      return;
    }

    if (action === "toggle-category-editor") {
      const categoryId = button.dataset.categoryId;
      if (!categoryId) {
        return;
      }

      if (expandedCategoryEditors.has(categoryId)) {
        expandedCategoryEditors.delete(categoryId);
      } else {
        expandedCategoryEditors.add(categoryId);
      }

      renderChecklist();
      return;
    }

    if (action === "toggle-category-menu") {
      const categoryId = button.dataset.categoryId;
      if (!categoryId) {
        return;
      }

      if (expandedCategoryMenus.has(categoryId)) {
        expandedCategoryMenus.delete(categoryId);
      } else {
        expandedCategoryMenus.add(categoryId);
      }

      renderChecklist();
      return;
    }

    if (action === "toggle-category") {
      const category = planner.categories.find((entry) => entry.id === button.dataset.categoryId);
      if (!category) {
        return;
      }
      updatePlanner(() => {
        category.collapsed = !category.collapsed;
      });
      return;
    }

    if (action === "move-category-up") {
      moveCategory(button.dataset.categoryId, "up");
      return;
    }

    if (action === "move-category-down") {
      moveCategory(button.dataset.categoryId, "down");
      return;
    }

    if (action === "delete-category") {
      deleteCategory(button.dataset.categoryId);
      return;
    }

    if (action === "add-item") {
      addItemToCategory(button.dataset.categoryId);
      return;
    }

    if (action === "add-child-item") {
      addChildItem(button.dataset.itemId);
      return;
    }

    if (action === "duplicate-item") {
      duplicateItem(button.dataset.itemId);
      return;
    }

    if (action === "delete-item") {
      deleteItem(button.dataset.itemId);
    }
  }

  function bindEvents() {
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("click", handleClick);

    document.querySelector(selectors.importFileInput).addEventListener("change", (event) => {
      const [file] = event.target.files || [];
      handleImportFile(file);
      event.target.value = "";
    });

    document.querySelector(selectors.confirmCancelBtn).addEventListener("click", closeConfirm);
    document.querySelector(selectors.confirmCloseBtn).addEventListener("click", closeConfirm);
    document.querySelector(selectors.confirmAcceptBtn).addEventListener("click", handleModalAccept);
    document.querySelector(selectors.confirmOverlay).addEventListener("click", (event) => {
      if (event.target.matches(selectors.confirmOverlay)) {
        closeConfirm();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !document.querySelector(selectors.confirmOverlay).hidden) {
        closeConfirm();
      }

      trapModalFocus(event);
    });
  }

  function initialize() {
    planner = loadInitialPlanner();
    bindEvents();
    renderAll();
  }

  initialize();
})();
