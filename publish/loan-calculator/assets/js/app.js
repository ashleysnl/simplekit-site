(() => {
const SCHEMA_VERSION = 1;
const STORAGE_KEY = "simplekit-loan-calculator-state-v1";
const MAX_TERM_MONTHS = 600;
const MAX_SCHEDULE_ROWS = 12000;
const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const FREQUENCY_CONFIG = {
  monthly: { label: "Monthly", paymentsPerYear: 12, approxDays: 30.436875 },
  "semi-monthly": { label: "Semi-monthly", paymentsPerYear: 24, approxDays: 15.2184375 },
  "bi-weekly": { label: "Bi-weekly", paymentsPerYear: 26, approxDays: 14 },
  weekly: { label: "Weekly", paymentsPerYear: 52, approxDays: 7 },
};

const COMPOUNDING_CONFIG = {
  monthly: { label: "Monthly", periodsPerYear: 12 },
  "semi-annual": { label: "Semi-annual", periodsPerYear: 2 },
  annual: { label: "Annual", periodsPerYear: 1 },
  simple: { label: "Simple equivalent", periodsPerYear: null },
};

const DEFAULT_TAB = "loan";

const elements = {};

let state = createDefaultState();
let derived = {};
let resizeTimer = null;

function createId(prefix = "id") {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function createScenario(overrides = {}) {
  return {
    id: createId("scenario"),
    name: "Family Car Loan",
    loanAmount: 25000,
    annualRate: 6.49,
    termYears: 5,
    termMonths: 0,
    paymentFrequency: "monthly",
    compounding: "monthly",
    startDate: getTodayIso(),
    fees: 0,
    notes: "",
    recurringExtraPayment: {
      enabled: true,
      amount: 100,
      frequency: "monthly",
    },
    comparisonIncludeExtras: true,
    lumpSums: [
      {
        id: createId("lump"),
        date: shiftIsoDate(getTodayIso(), 365),
        amount: 1000,
        note: "Annual bonus",
      },
    ],
    ...overrides,
  };
}

function createDefaultState() {
  const primaryScenario = createScenario();
  primaryScenario.name = "Family Car Loan";

  const secondScenario = createScenario({
    name: "Dealer Promo Loan",
    loanAmount: 25000,
    annualRate: 4.99,
    termYears: 6,
    recurringExtraPayment: {
      enabled: false,
      amount: 0,
      frequency: "monthly",
    },
    lumpSums: [],
    comparisonIncludeExtras: false,
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      currency: "CAD",
    },
    selectedScenarioId: primaryScenario.id,
    comparisonIds: [primaryScenario.id, secondScenario.id],
    activeTab: DEFAULT_TAB,
    compactMode: false,
    showFullSchedule: false,
    scenarios: [primaryScenario, secondScenario],
  };
}

function cacheDom() {
  const ids = [
    "scenarioList", "storageStatus", "summaryCards", "scheduleStats", "scheduleTableBody",
    "comparisonCards", "comparisonMatrix", "comparisonTableBody", "comparisonTableHeaderRow", "comparisonSelector",
    "comparisonSummary", "compareStatusBar", "summaryNarrative", "chartInsight", "schedulePreviewNote",
    "scheduleToggleBtn", "reportGeneratedAt", "reportTakeaway", "reportSnapshot", "reportSummaryCards", "reportAssumptions",
    "reportExtraSummary", "reportComparisonSummary", "reportNotes", "heroScenarioName",
    "heroScenarioSnapshot", "validationSummary", "balanceChart", "breakdownChart",
    "newScenarioBtn", "duplicateScenarioBtn", "deleteScenarioBtn", "exportBtn", "printBtn", "compactModeBtn",
    "resetAllBtn", "importFile", "currencySelect", "loanForm", "guidedSetupStatus", "guidedSetupHint", "guidedNextBtn", "scenarioName", "loanAmount",
    "annualRate", "termYears", "termMonths", "paymentFrequency", "compounding", "startDate",
    "fees", "notes", "recurringEnabled", "recurringAmount", "recurringFrequency",
    "comparisonIncludeExtras", "lumpDate", "lumpAmount", "lumpNote", "addLumpSumBtn",
    "lumpSumList",
  ];

  ids.forEach((id) => {
    elements[id] = document.getElementById(id);
  });

  elements.tabButtons = Array.from(document.querySelectorAll(".tab-button"));
  elements.tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
  elements.guidedStepButtons = Array.from(document.querySelectorAll("[data-guide-tab]"));
  elements.printTriggers = Array.from(document.querySelectorAll("[data-print-trigger='true']"));
}

function bindEvents() {
  elements.loanForm?.addEventListener("input", handleFormInput);
  elements.loanForm?.addEventListener("change", handleFormInput);
  elements.loanForm?.addEventListener("click", handleLoanFormClick);
  elements.newScenarioBtn?.addEventListener("click", handleNewScenario);
  elements.duplicateScenarioBtn?.addEventListener("click", handleDuplicateScenario);
  elements.deleteScenarioBtn?.addEventListener("click", handleDeleteScenario);
  elements.exportBtn?.addEventListener("click", handleExport);
  elements.importFile?.addEventListener("change", handleImport);
  elements.printBtn?.addEventListener("click", () => window.print());
  elements.scheduleToggleBtn?.addEventListener("click", handleScheduleToggle);
  elements.compactModeBtn?.addEventListener("click", handleCompactModeToggle);
  elements.resetAllBtn?.addEventListener("click", handleResetAll);
  elements.addLumpSumBtn?.addEventListener("click", handleAddLumpSum);
  elements.scenarioList?.addEventListener("click", handleScenarioListClick);
  elements.scenarioList?.addEventListener("change", handleScenarioListChange);
  elements.lumpSumList?.addEventListener("click", handleLumpListClick);
  elements.compareStatusBar?.addEventListener("click", handleCompareStatusClick);
  elements.comparisonSelector?.addEventListener("change", handleComparisonSelectorChange);
  elements.printTriggers.forEach((button) => button.addEventListener("click", () => window.print()));
  elements.tabButtons.forEach((button) => button.addEventListener("click", () => setActiveTab(button.dataset.tab)));
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => renderCharts(), 120);
  });
}

function handleFormInput(event) {
  const scenario = getSelectedScenario();
  if (!scenario) {
    return;
  }

  const { id, value, checked } = event.target;
  const scenarioUpdates = {};

  switch (id) {
    case "currencySelect":
      state.settings.currency = value;
      break;
    case "scenarioName":
      scenarioUpdates.name = value;
      break;
    case "loanAmount":
      scenarioUpdates.loanAmount = sanitizeNumberInput(value);
      break;
    case "annualRate":
      scenarioUpdates.annualRate = sanitizeNumberInput(value);
      break;
    case "termYears":
      scenarioUpdates.termYears = sanitizeIntegerInput(value);
      break;
    case "termMonths":
      scenarioUpdates.termMonths = sanitizeIntegerInput(value);
      break;
    case "paymentFrequency":
      scenarioUpdates.paymentFrequency = value;
      break;
    case "compounding":
      scenarioUpdates.compounding = value;
      break;
    case "startDate":
      scenarioUpdates.startDate = value;
      break;
    case "fees":
      scenarioUpdates.fees = sanitizeNumberInput(value);
      break;
    case "notes":
      scenarioUpdates.notes = value;
      break;
    case "recurringEnabled":
      scenarioUpdates.recurringExtraPayment = {
        ...scenario.recurringExtraPayment,
        enabled: checked,
      };
      break;
    case "recurringAmount":
      scenarioUpdates.recurringExtraPayment = {
        ...scenario.recurringExtraPayment,
        amount: sanitizeNumberInput(value),
      };
      break;
    case "recurringFrequency":
      scenarioUpdates.recurringExtraPayment = {
        ...scenario.recurringExtraPayment,
        frequency: value,
      };
      break;
    case "comparisonIncludeExtras":
      scenarioUpdates.comparisonIncludeExtras = checked;
      break;
    default:
      return;
  }

  updateScenario(scenario.id, scenarioUpdates);
  refresh({ syncForm: false });
}

function handleLoanFormClick(event) {
  const guideTab = event.target.dataset.guideTab;
  const nextTab = event.target.dataset.guideNext;
  if (guideTab) {
    setActiveTab(guideTab);
    return;
  }
  if (nextTab) {
    setActiveTab(nextTab);
  }
}

function handleNewScenario() {
  const baseScenario = getSelectedScenario();
  const newScenario = createScenario(baseScenario ? cloneScenario(baseScenario) : {});
  newScenario.id = createId("scenario");
  newScenario.name = createScenarioName("New Loan Scenario");
  newScenario.lumpSums = (baseScenario?.lumpSums || []).map((lump) => ({ ...lump, id: createId("lump") }));
  state.scenarios.push(newScenario);
  state.selectedScenarioId = newScenario.id;
  if (!state.comparisonIds.includes(newScenario.id)) {
    state.comparisonIds = [...state.comparisonIds, newScenario.id].slice(-3);
  }
  refresh();
}

function handleDuplicateScenario() {
  const scenario = getSelectedScenario();
  if (!scenario) {
    return;
  }
  const copy = cloneScenario(scenario);
  copy.id = createId("scenario");
  copy.name = createScenarioName(`${scenario.name} Copy`);
  copy.lumpSums = scenario.lumpSums.map((lump) => ({ ...lump, id: createId("lump") }));
  state.scenarios.push(copy);
  state.selectedScenarioId = copy.id;
  if (!state.comparisonIds.includes(copy.id)) {
    state.comparisonIds.push(copy.id);
  }
  refresh();
}

function handleDeleteScenario() {
  if (state.scenarios.length === 1) {
    updateStorageStatus("At least one scenario must remain.", true);
    return;
  }

  const scenario = getSelectedScenario();
  if (!scenario) {
    return;
  }

  if (!window.confirm(`Delete "${scenario.name}"? This removes the scenario from the calculator.`)) {
    return;
  }

  state.scenarios = state.scenarios.filter((item) => item.id !== scenario.id);
  state.comparisonIds = state.comparisonIds.filter((id) => id !== scenario.id);
  state.selectedScenarioId = state.scenarios[0]?.id || "";
  refresh();
}

function handleScenarioListClick(event) {
  const action = event.target.dataset.action;
  const scenarioId = event.target.dataset.scenarioId;
  if (!action || !scenarioId) {
    return;
  }

  if (action === "select") {
    state.selectedScenarioId = scenarioId;
    refresh();
  }
}

function handleScenarioListChange(event) {
  const scenarioId = event.target.dataset.scenarioId;
  if (!scenarioId) {
    return;
  }

  if (event.target.matches("[data-role='compare-toggle']")) {
    const nextIds = new Set(state.comparisonIds);
    if (event.target.checked) {
      nextIds.add(scenarioId);
    } else {
      nextIds.delete(scenarioId);
    }
    state.comparisonIds = Array.from(nextIds);
    const comparisonMessage = state.comparisonIds.length >= 2
      ? `Comparing ${state.comparisonIds.length} scenarios now.`
      : "Select at least two scenarios to compare them side by side.";
    if (state.comparisonIds.length >= 2) {
      state.activeTab = "comparison";
    }
    refresh();
    updateStorageStatus(comparisonMessage);
  }
}

function handleComparisonSelectorChange(event) {
  const scenarioId = event.target.value;
  if (!scenarioId) {
    return;
  }

  const nextIds = new Set(state.comparisonIds);
  if (event.target.checked) {
    nextIds.add(scenarioId);
  } else {
    nextIds.delete(scenarioId);
  }
  state.comparisonIds = Array.from(nextIds);
  const comparisonMessage = state.comparisonIds.length >= 2
    ? `Comparing ${state.comparisonIds.length} scenarios now.`
    : "Select at least two scenarios to compare them side by side.";
  if (state.comparisonIds.length >= 2) {
    state.activeTab = "comparison";
  }
  refresh();
  updateStorageStatus(comparisonMessage);
}

function handleAddLumpSum() {
  const scenario = getSelectedScenario();
  if (!scenario) {
    return;
  }

  const date = elements.lumpDate?.value;
  const amount = sanitizeNumberInput(elements.lumpAmount?.value || 0);
  const note = (elements.lumpNote?.value || "").trim();

  if (!isValidIsoDate(date) || amount <= 0) {
    updateStorageStatus("Add a valid lump sum date and a positive amount.", true);
    return;
  }

  scenario.lumpSums.push({
    id: createId("lump"),
    date,
    amount,
    note,
  });

  scenario.lumpSums.sort((left, right) => left.date.localeCompare(right.date));

  if (elements.lumpDate) {
    elements.lumpDate.value = "";
  }
  if (elements.lumpAmount) {
    elements.lumpAmount.value = "";
  }
  if (elements.lumpNote) {
    elements.lumpNote.value = "";
  }

  refresh();
}

function handleLumpListClick(event) {
  const action = event.target.dataset.action;
  const lumpId = event.target.dataset.lumpId;
  const scenario = getSelectedScenario();
  if (!action || !lumpId || !scenario) {
    return;
  }

  if (action === "delete-lump") {
    scenario.lumpSums = scenario.lumpSums.filter((lump) => lump.id !== lumpId);
    refresh();
    return;
  }

  if (action === "edit-lump") {
    const lump = scenario.lumpSums.find((item) => item.id === lumpId);
    if (!lump) {
      return;
    }

    const nextDate = window.prompt("Update the lump sum date (YYYY-MM-DD):", lump.date) || lump.date;
    const nextAmountInput = window.prompt("Update the lump sum amount:", String(lump.amount));
    const nextAmount = sanitizeNumberInput(nextAmountInput);
    const nextNote = window.prompt("Update the note (optional):", lump.note || "") ?? lump.note;

    if (!isValidIsoDate(nextDate) || nextAmount <= 0) {
      updateStorageStatus("The lump sum was not updated because the date or amount was invalid.", true);
      return;
    }

    lump.date = nextDate;
    lump.amount = nextAmount;
    lump.note = nextNote.trim();
    scenario.lumpSums.sort((left, right) => left.date.localeCompare(right.date));
    refresh();
  }
}

function handleExport() {
  const payload = exportState();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = URL.createObjectURL(blob);
  link.download = `simplekit-loan-scenarios-${today}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  updateStorageStatus("Saved a scenarios file. You can reopen it later from any device using this calculator.");
}

async function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    if (state.scenarios.length > 0 && !window.confirm("Open this saved scenarios file and replace the current scenarios?")) {
      event.target.value = "";
      return;
    }
    const text = await file.text();
    const parsed = JSON.parse(text);
    const normalized = normalizeImportedState(parsed);
    state = normalized;
    refresh();
    updateStorageStatus(`Opened ${state.scenarios.length} saved scenario${state.scenarios.length === 1 ? "" : "s"} from file.`);
  } catch (error) {
    updateStorageStatus(error instanceof Error ? error.message : "We couldn't open that scenarios file.", true);
  } finally {
    event.target.value = "";
  }
}

function handleResetAll() {
  if (!window.confirm("Reset all scenarios, local auto-save data, and current settings?")) {
    return;
  }
  state = createDefaultState();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Ignore localStorage cleanup issues and continue with fresh in-memory state.
  }
  refresh();
  updateStorageStatus("All scenarios were reset. The default examples are ready to use again.");
}

function handleScheduleToggle() {
  state.showFullSchedule = !state.showFullSchedule;
  renderSchedule();
}

function handleCompactModeToggle() {
  state.compactMode = !state.compactMode;
  applyCompactMode();
  populateForm();
  updateStorageStatus(state.compactMode ? "Compact mode is on for faster scanning." : "Compact mode is off. Full spacing restored.");
}

function handleCompareStatusClick(event) {
  const action = event.target.dataset.action;
  const tab = event.target.dataset.tab;
  const scenarioId = event.target.dataset.scenarioId;
  if (!action) {
    return;
  }

  if (action === "switch-tab" && tab) {
    setActiveTab(tab);
    updateStorageStatus("Comparison setup is open below.");
    return;
  }

  if (!scenarioId) {
    return;
  }

  if (action === "focus-scenario") {
    state.selectedScenarioId = scenarioId;
    refresh();
    return;
  }

  if (action === "remove-compare") {
    state.comparisonIds = state.comparisonIds.filter((id) => id !== scenarioId);
    refresh();
    updateStorageStatus("Removed that scenario from the comparison set.");
  }
}

function setActiveTab(tabName) {
  state.activeTab = tabName;
  elements.tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  elements.tabPanels.forEach((panel) => {
    const isActive = panel.id === `tab-${tabName}`;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });
  renderGuidedSetup();
}

function renderGuidedSetup() {
  const activeTab = state.activeTab || DEFAULT_TAB;
  const phase = activeTab === "loan"
    ? "loan"
    : activeTab === "extra"
      ? "extra"
      : "comparison";

  elements.guidedStepButtons?.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.guideTab === phase);
  });

  if (!elements.guidedSetupStatus || !elements.guidedSetupHint || !elements.guidedNextBtn) {
    return;
  }

  if (phase === "loan") {
    elements.guidedSetupStatus.textContent = "Step 1 of 3: enter the core loan details to create your first useful payment estimate.";
    elements.guidedSetupHint.textContent = "Keep this simple first. Most users can leave advanced assumptions closed.";
    elements.guidedNextBtn.textContent = "Continue to optional extras";
    elements.guidedNextBtn.dataset.guideNext = "extra";
    return;
  }

  if (phase === "extra") {
    elements.guidedSetupStatus.textContent = "Step 2 of 3: add prepayments only if you want to test faster payoff strategies.";
    elements.guidedSetupHint.textContent = "You can skip this if you only want the base loan payment and amortization.";
    elements.guidedNextBtn.textContent = "Continue to review and compare";
    elements.guidedNextBtn.dataset.guideNext = "comparison";
    return;
  }

  elements.guidedSetupStatus.textContent = "Step 3 of 3: review the results, compare scenarios, then open the schedule or report if you need more detail.";
  elements.guidedSetupHint.textContent = "Use “Open all calculator sections” only when you want the full advanced workspace.";
  elements.guidedNextBtn.textContent = "Open report setup";
  elements.guidedNextBtn.dataset.guideNext = "report";
}

function sanitizeNumberInput(value) {
  const number = Number.parseFloat(String(value));
  return Number.isFinite(number) ? number : 0;
}

function sanitizeIntegerInput(value) {
  const number = Number.parseInt(String(value), 10);
  return Number.isFinite(number) ? number : 0;
}

function cloneScenario(scenario) {
  return JSON.parse(JSON.stringify(scenario));
}

function createScenarioName(baseName) {
  const existing = new Set(state.scenarios.map((scenario) => scenario.name));
  if (!existing.has(baseName)) {
    return baseName;
  }
  let index = 2;
  while (existing.has(`${baseName} ${index}`)) {
    index += 1;
  }
  return `${baseName} ${index}`;
}

function updateScenario(scenarioId, updates) {
  state.scenarios = state.scenarios.map((scenario) => {
    if (scenario.id !== scenarioId) {
      return scenario;
    }
    return {
      ...scenario,
      ...updates,
      recurringExtraPayment: updates.recurringExtraPayment || scenario.recurringExtraPayment,
    };
  });
}

function getSelectedScenario() {
  return state.scenarios.find((scenario) => scenario.id === state.selectedScenarioId) || state.scenarios[0] || null;
}

function refresh(options = {}) {
  const { syncForm = true } = options;
  state = sanitizeState(state);
  persistState();
  derived = buildDerivedState();
  applyCompactMode();
  if (syncForm) {
    populateForm();
  }
  setActiveTab(state.activeTab || DEFAULT_TAB);
  renderScenarioList();
  renderValidationSummary();
  renderCompareStatus();
  renderSummary();
  renderSchedule();
  renderComparison();
  renderLumpSums();
  renderReport();
  renderHero();
  renderCharts();
}

function sanitizeState(inputState) {
  const nextState = {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      currency: ["CAD", "USD", "EUR", "GBP"].includes(inputState.settings?.currency) ? inputState.settings.currency : "CAD",
    },
    selectedScenarioId: inputState.selectedScenarioId,
    comparisonIds: Array.isArray(inputState.comparisonIds) ? inputState.comparisonIds.filter(Boolean) : [],
    activeTab: typeof inputState.activeTab === "string" ? inputState.activeTab : DEFAULT_TAB,
    compactMode: Boolean(inputState.compactMode),
    showFullSchedule: Boolean(inputState.showFullSchedule),
    scenarios: Array.isArray(inputState.scenarios) ? inputState.scenarios.map(normalizeScenario) : [createScenario()],
  };

  if (!nextState.scenarios.some((scenario) => scenario.id === nextState.selectedScenarioId)) {
    nextState.selectedScenarioId = nextState.scenarios[0].id;
  }

  nextState.comparisonIds = nextState.comparisonIds.filter((id) => nextState.scenarios.some((scenario) => scenario.id === id));
  if (nextState.comparisonIds.length === 0) {
    nextState.comparisonIds = nextState.scenarios.slice(0, 2).map((scenario) => scenario.id);
  }

  if (!["loan", "extra", "comparison", "schedule", "report", "learn"].includes(nextState.activeTab)) {
    nextState.activeTab = DEFAULT_TAB;
  }

  return nextState;
}

function normalizeScenario(input = {}) {
  const fallback = createScenario();
  return {
    id: typeof input.id === "string" && input.id ? input.id : createId("scenario"),
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : fallback.name,
    loanAmount: sanitizeNumberInput(input.loanAmount),
    annualRate: sanitizeNumberInput(input.annualRate),
    termYears: Math.max(0, sanitizeIntegerInput(input.termYears)),
    termMonths: Math.max(0, sanitizeIntegerInput(input.termMonths)),
    paymentFrequency: FREQUENCY_CONFIG[input.paymentFrequency] ? input.paymentFrequency : fallback.paymentFrequency,
    compounding: COMPOUNDING_CONFIG[input.compounding] ? input.compounding : fallback.compounding,
    startDate: isValidIsoDate(input.startDate) ? input.startDate : fallback.startDate,
    fees: Math.max(0, sanitizeNumberInput(input.fees)),
    notes: typeof input.notes === "string" ? input.notes : "",
    recurringExtraPayment: {
      enabled: Boolean(input.recurringExtraPayment?.enabled),
      amount: Math.max(0, sanitizeNumberInput(input.recurringExtraPayment?.amount)),
      frequency: FREQUENCY_CONFIG[input.recurringExtraPayment?.frequency] ? input.recurringExtraPayment.frequency : fallback.recurringExtraPayment.frequency,
    },
    comparisonIncludeExtras: input.comparisonIncludeExtras !== false,
    lumpSums: Array.isArray(input.lumpSums)
      ? input.lumpSums
          .map((lump) => ({
            id: typeof lump.id === "string" && lump.id ? lump.id : createId("lump"),
            date: isValidIsoDate(lump.date) ? lump.date : "",
            amount: Math.max(0, sanitizeNumberInput(lump.amount)),
            note: typeof lump.note === "string" ? lump.note : "",
          }))
          .filter((lump) => lump.date && lump.amount > 0)
          .sort((left, right) => left.date.localeCompare(right.date))
      : [],
  };
}

function buildDerivedState() {
  const scenarioResults = new Map();
  state.scenarios.forEach((scenario) => {
    const validation = validateScenario(scenario);
    if (validation.length > 0) {
      scenarioResults.set(scenario.id, { validation });
      return;
    }

    const base = calculateScenario(scenario, false);
    const withExtras = calculateScenario(scenario, true);
    const comparison = calculateScenario(scenario, scenario.comparisonIncludeExtras);
    scenarioResults.set(scenario.id, {
      validation,
      base,
      withExtras,
      comparison,
      savings: {
        interestSaved: roundCurrency(base.totalInterest - withExtras.totalInterest),
        totalPaidSaved: roundCurrency(base.totalPaid - withExtras.totalPaid),
        paymentsSaved: base.numberOfPayments - withExtras.numberOfPayments,
        timeSavedDays: diffDays(base.payoffDate, withExtras.payoffDate),
      },
    });
  });

  return { scenarioResults };
}

function validateScenario(scenario) {
  const issues = [];
  const termMonths = scenario.termYears * 12 + scenario.termMonths;

  if (!scenario.name.trim()) {
    issues.push({ field: "scenarioName", message: "Give the scenario a name so it is easier to compare later." });
  }
  if (scenario.loanAmount <= 0) {
    issues.push({ field: "loanAmount", message: "Loan amount must be greater than zero." });
  }
  if (scenario.annualRate < 0 || scenario.annualRate > 100) {
    issues.push({ field: "annualRate", message: "Annual interest rate must be between 0% and 100%." });
  }
  if (termMonths <= 0) {
    issues.push({ field: "termYears", message: "Choose a loan term longer than zero months." });
  }
  if (termMonths > MAX_TERM_MONTHS) {
    issues.push({ field: "termYears", message: "Loan term is too long for this calculator. Keep it within 50 years." });
  }
  if (scenario.termMonths < 0 || scenario.termMonths > 11) {
    issues.push({ field: "termMonths", message: "Additional term months must be between 0 and 11." });
  }
  if (!isValidIsoDate(scenario.startDate)) {
    issues.push({ field: "startDate", message: "Enter a valid start date." });
  }
  if (scenario.fees < 0) {
    issues.push({ field: "fees", message: "Fees cannot be negative." });
  }
  if (scenario.recurringExtraPayment.amount < 0) {
    issues.push({ field: "recurringAmount", message: "Recurring extra payment cannot be negative." });
  }
  if (scenario.recurringExtraPayment.enabled && scenario.recurringExtraPayment.amount <= 0) {
    issues.push({ field: "recurringAmount", message: "Turn off recurring extras or enter an amount greater than zero." });
  }

  scenario.lumpSums.forEach((lump) => {
    if (!isValidIsoDate(lump.date) || lump.amount <= 0) {
      issues.push({ field: "lumpAmount", message: "Every lump sum needs a valid date and an amount above zero." });
    }
  });

  return issues;
}

function calculateScenario(scenario, includeExtras) {
  const frequency = FREQUENCY_CONFIG[scenario.paymentFrequency];
  const totalTermMonths = scenario.termYears * 12 + scenario.termMonths;
  const numberOfPayments = Math.max(1, Math.round((totalTermMonths / 12) * frequency.paymentsPerYear));
  const periodicRate = calculatePeriodicRate(scenario.annualRate, scenario.compounding, frequency.paymentsPerYear);
  const regularPayment = calculateRegularPayment(scenario.loanAmount, periodicRate, numberOfPayments);
  const schedule = [];
  const startDate = parseIsoDate(scenario.startDate);
  const lumpSums = [...scenario.lumpSums].sort((left, right) => left.date.localeCompare(right.date));
  let lumpIndex = 0;
  let paymentDate = advanceDate(startDate, scenario.paymentFrequency, 1);
  let nextRecurringDate = includeExtras && scenario.recurringExtraPayment.enabled
    ? advanceDate(startDate, scenario.recurringExtraPayment.frequency, 1)
    : null;
  let balance = roundCurrency(scenario.loanAmount);
  let totalInterest = 0;
  let totalScheduledPaid = 0;
  let totalExtraPaid = 0;
  let totalPrincipalPaid = 0;
  let paymentCount = 0;

  while (balance > 0.000001 && paymentCount < MAX_SCHEDULE_ROWS) {
    paymentCount += 1;

    const interest = roundCurrency(balance * periodicRate);
    const scheduledPayment = roundCurrency(Math.min(regularPayment, balance + interest));
    let extraPayment = 0;

    if (includeExtras) {
      // Extra-payment events are accumulated up to the scheduled payment date so
      // recurring extras and dated lump sums still work when frequencies differ.
      if (scenario.recurringExtraPayment.enabled && scenario.recurringExtraPayment.amount > 0 && nextRecurringDate) {
        while (nextRecurringDate.getTime() <= paymentDate.getTime()) {
          extraPayment += scenario.recurringExtraPayment.amount;
          nextRecurringDate = advanceDate(nextRecurringDate, scenario.recurringExtraPayment.frequency, 1);
        }
      }

      while (lumpIndex < lumpSums.length) {
        const lumpDate = parseIsoDate(lumpSums[lumpIndex].date);
        if (lumpDate.getTime() > paymentDate.getTime()) {
          break;
        }
        extraPayment += lumpSums[lumpIndex].amount;
        lumpIndex += 1;
      }
    }

    extraPayment = roundCurrency(Math.min(extraPayment, Math.max(0, balance + interest - scheduledPayment)));
    const principal = roundCurrency(scheduledPayment + extraPayment - interest);
    balance = roundCurrency(Math.max(0, balance - principal));
    totalInterest = roundCurrency(totalInterest + interest);
    totalScheduledPaid = roundCurrency(totalScheduledPaid + scheduledPayment);
    totalExtraPaid = roundCurrency(totalExtraPaid + extraPayment);
    totalPrincipalPaid = roundCurrency(totalPrincipalPaid + principal);

    schedule.push({
      paymentNumber: paymentCount,
      date: toIsoDate(paymentDate),
      scheduledPayment,
      extraPayment,
      principal,
      interest,
      balance,
      cumulativeInterest: totalInterest,
      cumulativePrincipal: totalPrincipalPaid,
    });

    paymentDate = advanceDate(paymentDate, scenario.paymentFrequency, 1);
  }

  const payoffDate = schedule[schedule.length - 1]?.date || scenario.startDate;
  const totalPaid = roundCurrency(totalScheduledPaid + totalExtraPaid + scenario.fees);
  const averageInterestShare = totalScheduledPaid + totalExtraPaid > 0
    ? totalInterest / (totalScheduledPaid + totalExtraPaid)
    : 0;

  return {
    regularPayment: roundCurrency(regularPayment),
    numberOfPayments: paymentCount,
    totalInterest,
    totalPaid,
    totalScheduledPaid,
    totalExtraPaid,
    totalPrincipalPaid,
    payoffDate,
    schedule,
    periodicRate,
    approximateYears: paymentCount / frequency.paymentsPerYear,
    averageInterestShare,
  };
}

function calculatePeriodicRate(annualRatePercent, compoundingKey, paymentsPerYear) {
  const annualRate = annualRatePercent / 100;
  if (annualRate === 0) {
    return 0;
  }
  if (compoundingKey === "simple") {
    return annualRate / paymentsPerYear;
  }
  // Convert nominal annual input into an effective annual rate first, then
  // into a payment-period rate for a consistent amortization formula.
  const compoundingPeriods = COMPOUNDING_CONFIG[compoundingKey].periodsPerYear;
  const effectiveAnnualRate = Math.pow(1 + annualRate / compoundingPeriods, compoundingPeriods) - 1;
  return Math.pow(1 + effectiveAnnualRate, 1 / paymentsPerYear) - 1;
}

function calculateRegularPayment(principal, periodicRate, numberOfPayments) {
  if (principal <= 0 || numberOfPayments <= 0) {
    return 0;
  }
  if (periodicRate === 0) {
    return roundCurrency(principal / numberOfPayments);
  }
  const numerator = principal * periodicRate;
  const denominator = 1 - Math.pow(1 + periodicRate, -numberOfPayments);
  return roundCurrency(numerator / denominator);
}

function renderScenarioList() {
  const formatter = createCurrencyFormatter();
  elements.scenarioList.innerHTML = state.scenarios.map((scenario) => {
    const result = derived.scenarioResults.get(scenario.id);
    const hasIssues = result?.validation?.length > 0;
    const comparison = result?.comparison;
    const badges = [
      scenario.id === state.selectedScenarioId ? '<span class="status-chip is-active">Editing now</span>' : "",
      state.comparisonIds.includes(scenario.id) ? '<span class="status-chip is-compare">In comparison</span>' : "",
      hasIssues ? '<span class="status-chip is-warning">Needs attention</span>' : "",
    ].filter(Boolean).join("");
    return `
      <article class="scenario-card ${scenario.id === state.selectedScenarioId ? "is-active" : ""}">
        <div class="scenario-card-header">
          <div>
            <div class="scenario-badge-row">${badges}</div>
            <div class="chip">${escapeHtml(FREQUENCY_CONFIG[scenario.paymentFrequency].label)}</div>
            <h4>${escapeHtml(scenario.name)}</h4>
          </div>
          <button class="btn btn-tertiary" type="button" data-action="select" data-scenario-id="${scenario.id}">
            ${scenario.id === state.selectedScenarioId ? "Editing" : "Open"}
          </button>
        </div>
        <p class="scenario-meta">
          ${formatter.format(scenario.loanAmount)} · ${scenario.annualRate.toFixed(2)}% · ${formatTerm(scenario.termYears, scenario.termMonths)}
        </p>
        <p class="scenario-snapshot">
          ${hasIssues
            ? "Complete the required fields to see results."
            : `${formatter.format(comparison.regularPayment)} per ${FREQUENCY_CONFIG[scenario.paymentFrequency].label.toLowerCase().replace("-", " ")} payment`}
        </p>
        <div class="scenario-card-footer">
          <label class="compare-toggle">
            <input type="checkbox" data-role="compare-toggle" data-scenario-id="${scenario.id}" ${state.comparisonIds.includes(scenario.id) ? "checked" : ""}>
            Compare
          </label>
          <span class="chip">${hasIssues ? "Needs input" : `Payoff ${formatDate(comparison.payoffDate)}`}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderValidationSummary() {
  const selectedScenario = getSelectedScenario();
  const result = selectedScenario ? derived.scenarioResults.get(selectedScenario.id) : null;
  const issues = result?.validation || [];
  const invalidFields = new Set(issues.map((issue) => issue.field));

  [
    "scenarioName", "loanAmount", "annualRate", "termYears", "termMonths", "startDate",
    "fees", "recurringAmount", "lumpAmount",
  ].forEach((fieldId) => {
    const field = elements[fieldId];
    if (field) {
      field.setAttribute("aria-invalid", String(invalidFields.has(fieldId)));
    }
  });

  if (issues.length === 0) {
    elements.validationSummary.classList.remove("is-error");
    elements.validationSummary.innerHTML = `
      <strong>Ready to compare</strong>
      <p class="muted">Your scenario is valid. Results below update live, and everything is auto-saved on this browser.</p>
    `;
    return;
  }

  elements.validationSummary.classList.add("is-error");
  elements.validationSummary.innerHTML = `
    <strong>Check a few details</strong>
    <p class="muted">${issues[0].message}</p>
  `;
}

function renderSummary() {
  const scenario = getSelectedScenario();
  const result = scenario ? derived.scenarioResults.get(scenario.id) : null;
  const formatter = createCurrencyFormatter();

  if (!scenario || !result || result.validation.length > 0) {
    elements.summaryNarrative.innerHTML = "";
    elements.summaryCards.innerHTML = `<article class="result-card"><strong>Enter valid loan details to see payment and amortization results.</strong></article>`;
    return;
  }

  const { withExtras, savings } = result;
  elements.summaryNarrative.innerHTML = `
    <div class="comparison-summary-card">
      <strong>${escapeHtml(scenario.name)}</strong> is currently estimated at
      <strong>${escapeHtml(formatter.format(withExtras.regularPayment))}</strong> per
      ${escapeHtml(FREQUENCY_CONFIG[scenario.paymentFrequency].label.toLowerCase())} payment, with payoff on
      <strong>${escapeHtml(formatDate(withExtras.payoffDate))}</strong>.
    </div>
  `;
  const cards = [
    {
      label: "Regular payment",
      value: formatter.format(withExtras.regularPayment),
      copy: `${FREQUENCY_CONFIG[scenario.paymentFrequency].label} payment amount.`,
    },
    {
      label: "Total interest",
      value: formatter.format(withExtras.totalInterest),
      copy: "Interest paid over the full payoff timeline.",
    },
    {
      label: "Total paid",
      value: formatter.format(withExtras.totalPaid),
      copy: "Scheduled payments, extra payments, and upfront fees.",
    },
    {
      label: "Payoff date",
      value: formatDate(withExtras.payoffDate),
      copy: `${withExtras.numberOfPayments} payments in total.`,
    },
    {
      label: "Interest saved",
      value: formatter.format(Math.max(0, savings.interestSaved)),
      copy: "Compared with the same loan and no extra payments.",
    },
    {
      label: "Time saved",
      value: formatDurationFromDays(Math.max(0, savings.timeSavedDays)),
      copy: "Estimated payoff acceleration from prepayments.",
    },
  ];

  elements.summaryCards.innerHTML = cards.map((card) => `
    <article class="result-card">
      <span class="trust-label">${escapeHtml(card.label)}</span>
      <strong class="metric-value">${escapeHtml(card.value)}</strong>
      <p class="metric-subcopy">${escapeHtml(card.copy)}</p>
    </article>
  `).join("");
}

function renderSchedule() {
  const scenario = getSelectedScenario();
  const result = scenario ? derived.scenarioResults.get(scenario.id) : null;
  const formatter = createCurrencyFormatter();

  if (!scenario || !result || result.validation.length > 0) {
    elements.scheduleStats.innerHTML = "";
    elements.schedulePreviewNote.textContent = "";
    elements.scheduleToggleBtn.hidden = true;
    elements.scheduleTableBody.innerHTML = `<tr><td colspan="7">Complete the selected scenario to generate the amortization table.</td></tr>`;
    return;
  }

  const { withExtras } = result;
  const visibleRows = state.showFullSchedule ? withExtras.schedule : withExtras.schedule.slice(0, 24);
  const stats = [
    { label: "Payments", value: String(withExtras.numberOfPayments) },
    { label: "Total extra paid", value: formatter.format(withExtras.totalExtraPaid) },
    { label: "Principal repaid", value: formatter.format(withExtras.totalPrincipalPaid) },
    { label: "Payoff horizon", value: `${withExtras.approximateYears.toFixed(1)} years` },
  ];

  elements.scheduleStats.innerHTML = stats.map((item) => `
    <div class="mini-stat">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join("");

  elements.schedulePreviewNote.textContent = state.showFullSchedule
    ? `Showing the full ${withExtras.schedule.length}-row schedule.`
    : `Showing the first ${visibleRows.length} payments for a quick scan. Open the full schedule when you need every line.`;
  elements.scheduleToggleBtn.hidden = withExtras.schedule.length <= 24;
  elements.scheduleToggleBtn.textContent = state.showFullSchedule ? "Show preview only" : "Show full schedule";

  elements.scheduleTableBody.innerHTML = visibleRows.map((row) => `
    <tr>
      <td>${row.paymentNumber}</td>
      <td>${formatDate(row.date)}</td>
      <td>${formatter.format(row.scheduledPayment)}</td>
      <td>${formatter.format(row.extraPayment)}</td>
      <td>${formatter.format(row.principal)}</td>
      <td>${formatter.format(row.interest)}</td>
      <td>${formatter.format(row.balance)}</td>
    </tr>
  `).join("");
}

function renderComparison() {
  const formatter = createCurrencyFormatter();
  const selectedComparisons = state.scenarios
    .filter((scenario) => state.comparisonIds.includes(scenario.id))
    .map((scenario) => ({
      scenario,
      result: derived.scenarioResults.get(scenario.id),
    }))
    .filter((entry) => entry.result && entry.result.validation.length === 0);

  elements.comparisonSelector.innerHTML = state.scenarios.map((scenario) => `
    <article class="comparison-option">
      <label>
        <input type="checkbox" value="${scenario.id}" ${state.comparisonIds.includes(scenario.id) ? "checked" : ""}>
        ${escapeHtml(scenario.name)}
      </label>
      <p class="comparison-note">${escapeHtml(formatTerm(scenario.termYears, scenario.termMonths))} · ${escapeHtml(FREQUENCY_CONFIG[scenario.paymentFrequency].label)}</p>
    </article>
  `).join("");

  if (selectedComparisons.length < 2) {
    const message = "Select at least two valid scenarios to compare them side by side.";
    elements.comparisonSummary.innerHTML = `<div class="comparison-summary-card">${message}</div>`;
    elements.comparisonCards.innerHTML = "";
    elements.comparisonMatrix.innerHTML = "";
    elements.comparisonTableHeaderRow.innerHTML = `<th scope="col">Selected scenarios</th>`;
    elements.comparisonTableBody.innerHTML = `<tr><td colspan="2">${message}</td></tr>`;
    return;
  }

  const metrics = [
    { key: "regularPayment", label: "Regular payment", lowerIsBetter: true, format: (value) => formatter.format(value) },
    { key: "totalInterest", label: "Total interest", lowerIsBetter: true, format: (value) => formatter.format(value) },
    { key: "totalPaid", label: "Total paid", lowerIsBetter: true, format: (value) => formatter.format(value) },
    { key: "payoffDate", label: "Payoff date", lowerIsBetter: true, format: (value) => formatDate(value), sortValue: (value) => Date.parse(value) },
    { key: "timeSaved", label: "Time saved from prepayments", lowerIsBetter: false, format: (value) => formatDurationFromDays(value) },
    { key: "interestSaved", label: "Interest saved from prepayments", lowerIsBetter: false, format: (value) => formatter.format(value) },
  ];

  const bestValues = {};
  metrics.forEach((metric) => {
    const values = selectedComparisons.map(({ result }) => {
      if (metric.key === "timeSaved") {
        return result.savings.timeSavedDays;
      }
      if (metric.key === "interestSaved") {
        return result.savings.interestSaved;
      }
      return metric.key === "payoffDate"
        ? metric.sortValue(result.comparison.payoffDate)
        : result.comparison[metric.key];
    });
    bestValues[metric.key] = metric.lowerIsBetter ? Math.min(...values) : Math.max(...values);
  });

  const bestPayment = bestValues.regularPayment;
  const modeSummary = selectedComparisons.map(({ scenario }) => `${scenario.name}: ${scenario.comparisonIncludeExtras ? "extras included" : "base loan only"}`).join(" · ");
  elements.comparisonSummary.innerHTML = `
    <div class="comparison-summary-card">
      <strong>Key takeaway:</strong> ${escapeHtml(selectedComparisons[0].scenario.name)} through ${escapeHtml(selectedComparisons[selectedComparisons.length - 1].scenario.name)} are ready to compare.
      The lowest regular payment in the current set is ${formatter.format(bestPayment)}.
      <br>
      <span class="comparison-note">${escapeHtml(modeSummary)}</span>
    </div>
  `;

  elements.comparisonCards.innerHTML = selectedComparisons.map(({ scenario, result }) => {
    const isBest = result.comparison.regularPayment === bestValues.regularPayment;
    return `
      <article class="comparison-card ${isBest ? "is-best" : ""}">
        <span class="trust-label">Scenario</span>
        <strong>${escapeHtml(scenario.name)}</strong>
        <p>${formatter.format(result.comparison.regularPayment)} regular payment</p>
        <p>${formatter.format(result.comparison.totalInterest)} interest</p>
        <span class="comparison-chip">${scenario.comparisonIncludeExtras ? "Extras included in comparison" : "Base loan only"}</span>
      </article>
    `;
  }).join("");

  elements.comparisonMatrix.innerHTML = metrics.map((metric) => `
    <article class="comparison-metric-card">
      <div class="comparison-metric-head">
        <div>
          <span class="trust-label">Metric</span>
          <strong>${escapeHtml(metric.label)}</strong>
        </div>
        <span class="comparison-metric-rule">${escapeHtml(metric.lowerIsBetter ? "Lower is better" : "Higher is better")}</span>
      </div>
      <div class="comparison-metric-values">
        ${selectedComparisons.map(({ scenario, result }) => {
          let rawValue;
          if (metric.key === "timeSaved") {
            rawValue = result.savings.timeSavedDays;
          } else if (metric.key === "interestSaved") {
            rawValue = result.savings.interestSaved;
          } else if (metric.key === "payoffDate") {
            rawValue = metric.sortValue(result.comparison.payoffDate);
          } else {
            rawValue = result.comparison[metric.key];
          }
          const formatted = metric.key === "timeSaved"
            ? metric.format(Math.max(0, rawValue))
            : metric.key === "interestSaved"
              ? metric.format(Math.max(0, rawValue))
              : metric.key === "payoffDate"
                ? metric.format(result.comparison.payoffDate)
                : metric.format(rawValue);
          const isBest = rawValue === bestValues[metric.key];
          return `
            <div class="comparison-metric-value ${isBest ? "is-best" : ""}">
              <span class="comparison-metric-scenario">${escapeHtml(scenario.name)}</span>
              <strong>${escapeHtml(formatted)}</strong>
              <span class="comparison-metric-mode">${escapeHtml(scenario.comparisonIncludeExtras ? "Extras included" : "Base loan only")}</span>
            </div>
          `;
        }).join("")}
      </div>
    </article>
  `).join("");

  elements.comparisonTableHeaderRow.innerHTML = `
    <th scope="col">Selected scenarios</th>
    ${selectedComparisons.map(({ scenario }) => `
      <th scope="col">
        ${escapeHtml(scenario.name)}
        <span class="status-chip ${scenario.comparisonIncludeExtras ? "is-compare" : "is-warning"}">
          ${escapeHtml(scenario.comparisonIncludeExtras ? "Extras included" : "Base loan only")}
        </span>
      </th>
    `).join("")}
  `;
  elements.comparisonTableBody.innerHTML = metrics.map((metric) => `
    <tr>
      <th scope="row">${escapeHtml(metric.label)}</th>
      ${selectedComparisons.map(({ result }) => {
        let rawValue;
        if (metric.key === "timeSaved") {
          rawValue = result.savings.timeSavedDays;
        } else if (metric.key === "interestSaved") {
          rawValue = result.savings.interestSaved;
        } else if (metric.key === "payoffDate") {
          rawValue = metric.sortValue(result.comparison.payoffDate);
        } else {
          rawValue = result.comparison[metric.key];
        }
        const formatted = metric.key === "timeSaved"
          ? metric.format(Math.max(0, rawValue))
          : metric.key === "interestSaved"
            ? metric.format(Math.max(0, rawValue))
            : metric.key === "payoffDate"
              ? metric.format(result.comparison.payoffDate)
              : metric.format(rawValue);
        const isBest = rawValue === bestValues[metric.key];
        return `<td class="${isBest ? "is-best" : ""}">${escapeHtml(formatted)}</td>`;
      }).join("")}
    </tr>
  `).join("");
}

function renderCompareStatus() {
  const formatter = createCurrencyFormatter();
  const validComparisonEntries = state.scenarios
    .filter((scenario) => state.comparisonIds.includes(scenario.id))
    .map((scenario) => ({ scenario, result: derived.scenarioResults.get(scenario.id) }))
    .filter((entry) => entry.result && entry.result.validation.length === 0);

  if (validComparisonEntries.length < 2) {
    elements.compareStatusBar.innerHTML = `
      <div class="compare-status-overview">
        <span class="compare-status-kicker">Single-scenario mode</span>
        <strong>Build your current loan first, then add one more scenario to start a side-by-side comparison.</strong>
        <p>Select at least two scenarios to compare payment size, total interest, payoff timing, and the impact of extra payments.</p>
        <div class="compare-status-actions">
          <button class="btn btn-tertiary" type="button" data-action="switch-tab" data-tab="comparison">Open comparison setup</button>
        </div>
      </div>
    `;
    return;
  }

  const lowestPayment = [...validComparisonEntries].sort((left, right) => left.result.comparison.regularPayment - right.result.comparison.regularPayment)[0];
  const earliestPayoff = [...validComparisonEntries].sort((left, right) => left.result.comparison.payoffDate.localeCompare(right.result.comparison.payoffDate))[0];

  elements.compareStatusBar.innerHTML = `
    <section class="compare-status-overview">
      <span class="compare-status-kicker">Comparing ${validComparisonEntries.length} scenarios</span>
      <strong>Keep one working comparison set in view while you edit assumptions and review tradeoffs.</strong>
      <div class="compare-status-summary">
        <span class="compare-summary-chip">Lowest payment: ${escapeHtml(lowestPayment.scenario.name)}</span>
        <span class="compare-summary-chip">Fastest payoff: ${escapeHtml(earliestPayoff.scenario.name)}</span>
      </div>
      <p>Use this strip to see what is included, jump to a scenario, or remove it from the current side-by-side set.</p>
      <div class="compare-status-actions">
        <button class="btn btn-tertiary" type="button" data-action="switch-tab" data-tab="comparison">Edit comparison set</button>
      </div>
    </section>
    <section class="compare-status-selections">
      <p class="small-copy">Selected scenarios</p>
      <div class="compare-selection-list">
        ${validComparisonEntries.map(({ scenario, result }) => `
          <article class="compare-selection-item">
            <div class="compare-selection-main">
              <div class="compare-selection-title">
                <strong>${escapeHtml(scenario.name)}</strong>
                <span class="compare-mode-chip">${escapeHtml(scenario.comparisonIncludeExtras ? "Extras included" : "Base loan only")}</span>
              </div>
              <p class="compare-selection-meta">${escapeHtml(formatter.format(result.comparison.regularPayment))} payment · payoff ${escapeHtml(formatDate(result.comparison.payoffDate))} · ${escapeHtml(formatter.format(result.comparison.totalInterest))} interest</p>
            </div>
            <div class="compare-selection-actions">
              <button class="btn btn-tertiary" type="button" data-action="focus-scenario" data-scenario-id="${scenario.id}">Open</button>
              <button class="btn btn-tertiary" type="button" data-action="remove-compare" data-scenario-id="${scenario.id}">Remove</button>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderLumpSums() {
  const scenario = getSelectedScenario();
  const formatter = createCurrencyFormatter();

  if (!scenario || scenario.lumpSums.length === 0) {
    elements.lumpSumList.innerHTML = `<div class="lump-sum-item"><strong>No lump sums yet.</strong><p>Add one-time principal payments to test faster payoff strategies.</p></div>`;
    return;
  }

  elements.lumpSumList.innerHTML = scenario.lumpSums.map((lump) => `
    <article class="lump-sum-item">
      <div class="lump-row-head">
        <div>
          <strong>${formatter.format(lump.amount)}</strong>
          <p>${formatDate(lump.date)}${lump.note ? ` · ${escapeHtml(lump.note)}` : ""}</p>
        </div>
        <div class="toolbar-actions">
          <button class="btn btn-tertiary" type="button" data-action="edit-lump" data-lump-id="${lump.id}">Edit</button>
          <button class="btn btn-tertiary" type="button" data-action="delete-lump" data-lump-id="${lump.id}">Remove</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderReport() {
  const scenario = getSelectedScenario();
  const result = scenario ? derived.scenarioResults.get(scenario.id) : null;
  const formatter = createCurrencyFormatter();
  const generatedAt = new Date();

  elements.reportGeneratedAt.textContent = `Generated ${DATE_FORMATTER.format(generatedAt)} · Currency ${state.settings.currency} · Browser print and PDF-ready summary`;

  if (!scenario || !result || result.validation.length > 0) {
    elements.reportTakeaway.textContent = "Finish the selected scenario to generate a clean shareable planning summary with assumptions, payment results, and comparison context.";
    elements.reportSnapshot.innerHTML = "";
    elements.reportSummaryCards.innerHTML = `<article class="result-card"><strong>Finish the selected scenario to populate the printable report.</strong></article>`;
    elements.reportAssumptions.innerHTML = "";
    elements.reportExtraSummary.innerHTML = "";
    elements.reportComparisonSummary.innerHTML = "<p>Add valid scenario details to generate the report summary.</p>";
    elements.reportNotes.textContent = "";
    return;
  }

  const { withExtras, base, savings } = result;
  elements.reportTakeaway.textContent = `${scenario.name} is currently estimated at ${formatter.format(withExtras.regularPayment)} per ${FREQUENCY_CONFIG[scenario.paymentFrequency].label.toLowerCase()} payment, with payoff on ${formatDate(withExtras.payoffDate)} and total interest of ${formatter.format(withExtras.totalInterest)}.`;
  elements.reportSnapshot.innerHTML = [
    ["Scenario", scenario.name],
    ["Estimated payment", formatter.format(withExtras.regularPayment)],
    ["Payoff target", formatDate(withExtras.payoffDate)],
  ].map(([label, value]) => `
    <div class="mini-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");

  const reportCards = [
    { label: "Payment", value: formatter.format(withExtras.regularPayment), copy: FREQUENCY_CONFIG[scenario.paymentFrequency].label },
    { label: "Interest", value: formatter.format(withExtras.totalInterest), copy: "Total interest paid" },
    { label: "Total paid", value: formatter.format(withExtras.totalPaid), copy: "Including fees" },
    { label: "Payoff date", value: formatDate(withExtras.payoffDate), copy: `${withExtras.numberOfPayments} payments` },
    { label: "Interest saved", value: formatter.format(Math.max(0, savings.interestSaved)), copy: "From extra payments" },
    { label: "Time saved", value: formatDurationFromDays(Math.max(0, savings.timeSavedDays)), copy: "Compared with no extras" },
  ];

  elements.reportSummaryCards.innerHTML = reportCards.map((card) => `
    <article class="result-card">
      <span class="trust-label">${escapeHtml(card.label)}</span>
      <strong class="metric-value">${escapeHtml(card.value)}</strong>
      <p class="metric-subcopy">${escapeHtml(card.copy)}</p>
    </article>
  `).join("");

  elements.reportAssumptions.innerHTML = renderDefinitions([
    ["Scenario", scenario.name],
    ["Loan amount", formatter.format(scenario.loanAmount)],
    ["Rate", `${scenario.annualRate.toFixed(2)}% ${COMPOUNDING_CONFIG[scenario.compounding].label.toLowerCase()} compounding`],
    ["Term", formatTerm(scenario.termYears, scenario.termMonths)],
    ["Payment frequency", FREQUENCY_CONFIG[scenario.paymentFrequency].label],
    ["Start date", formatDate(scenario.startDate)],
    ["Fees", formatter.format(scenario.fees)],
    ["Base loan payment", formatter.format(base.regularPayment)],
  ]);

  elements.reportExtraSummary.innerHTML = renderDefinitions([
    ["Recurring extras", scenario.recurringExtraPayment.enabled ? `${formatter.format(scenario.recurringExtraPayment.amount)} ${FREQUENCY_CONFIG[scenario.recurringExtraPayment.frequency].label.toLowerCase()}` : "Off"],
    ["Lump sums", `${scenario.lumpSums.length} planned payment${scenario.lumpSums.length === 1 ? "" : "s"}`],
    ["Total extra paid", formatter.format(withExtras.totalExtraPaid)],
    ["Interest saved", formatter.format(Math.max(0, savings.interestSaved))],
    ["Time saved", formatDurationFromDays(Math.max(0, savings.timeSavedDays))],
    ["Comparison mode", scenario.comparisonIncludeExtras ? "Extras included" : "Base loan only"],
  ]);

  const comparisonEntries = state.scenarios
    .filter((entry) => state.comparisonIds.includes(entry.id))
    .map((entry) => ({ scenario: entry, result: derived.scenarioResults.get(entry.id) }))
    .filter((entry) => entry.result && entry.result.validation.length === 0);

  if (comparisonEntries.length >= 2) {
    const sortedByInterest = [...comparisonEntries].sort((left, right) => left.result.comparison.totalInterest - right.result.comparison.totalInterest);
    const winner = sortedByInterest[0];
    elements.reportComparisonSummary.innerHTML = `
      <p>
        ${escapeHtml(winner.scenario.name)} currently has the lowest total interest at
        ${escapeHtml(formatter.format(winner.result.comparison.totalInterest))}.
        ${escapeHtml(scenario.name)} reaches payoff on ${escapeHtml(formatDate(withExtras.payoffDate))}.
      </p>
    `;
  } else {
    elements.reportComparisonSummary.innerHTML = "<p>Select at least two scenarios in the comparison view to include a side-by-side comparison note in the report.</p>";
  }

  elements.reportNotes.textContent = scenario.notes.trim() || "No scenario notes were added.";
}

function renderHero() {
  const scenario = getSelectedScenario();
  const result = scenario ? derived.scenarioResults.get(scenario.id) : null;
  const formatter = createCurrencyFormatter();
  if (!scenario || !result || result.validation.length > 0) {
    elements.heroScenarioName.textContent = "Loan scenario in progress";
    elements.heroScenarioSnapshot.textContent = "Finish the core loan inputs to see the payment snapshot here.";
    return;
  }

  elements.heroScenarioName.textContent = scenario.name;
  elements.heroScenarioSnapshot.textContent = `${formatter.format(result.withExtras.regularPayment)} payment · payoff ${formatDate(result.withExtras.payoffDate)} · ${formatter.format(Math.max(0, result.savings.interestSaved))} interest saved with extras`;
}

function renderCharts() {
  const scenario = getSelectedScenario();
  const result = scenario ? derived.scenarioResults.get(scenario.id) : null;
  if (!scenario || !result || result.validation.length > 0) {
    elements.chartInsight.innerHTML = "";
    clearCanvas(elements.balanceChart);
    clearCanvas(elements.breakdownChart);
    return;
  }

  elements.chartInsight.innerHTML = `
    <div class="comparison-summary-card">
      The first chart shows how quickly your balance reaches zero. The second shows how much of your total cost becomes principal versus interest over time.
    </div>
  `;
  drawBalanceChart(elements.balanceChart, result.base.schedule, result.withExtras.schedule);
  drawBreakdownChart(elements.breakdownChart, result.withExtras.schedule);
}

function drawBalanceChart(canvas, baseSchedule, extraSchedule) {
  if (!canvas) {
    return;
  }

  const width = canvas.clientWidth || 640;
  const height = 280;
  resizeCanvas(canvas, width, height);
  const context = canvas.getContext("2d");
  const padding = { top: 18, right: 18, bottom: 32, left: 52 };
  const drawableWidth = width - padding.left - padding.right;
  const drawableHeight = height - padding.top - padding.bottom;
  const formatter = createCurrencyFormatter();

  context.clearRect(0, 0, width, height);
  drawChartFrame(context, width, height, padding);

  const combined = [...baseSchedule, ...extraSchedule];
  const maxBalance = Math.max(...combined.map((row) => row.balance + row.principal), 1);
  const longestLength = Math.max(baseSchedule.length, extraSchedule.length, 1);

  const xForIndex = (index, total) => padding.left + (drawableWidth * index) / Math.max(total - 1, 1);
  const yForBalance = (value) => padding.top + drawableHeight - (drawableHeight * value) / maxBalance;

  drawSeries(context, baseSchedule, longestLength, xForIndex, yForBalance, "#0f6abf");
  drawSeries(context, extraSchedule, longestLength, xForIndex, yForBalance, "#159b94");

  drawAxisLabels(context, {
    padding,
    width,
    height,
    yLabels: [maxBalance, maxBalance / 2, 0].map((value) => formatter.format(roundCurrency(value))),
    xLabels: ["Start", "Mid", "End"],
  });
}

function drawBreakdownChart(canvas, schedule) {
  if (!canvas) {
    return;
  }

  const width = canvas.clientWidth || 640;
  const height = 280;
  resizeCanvas(canvas, width, height);
  const context = canvas.getContext("2d");
  const padding = { top: 18, right: 18, bottom: 32, left: 52 };
  const drawableWidth = width - padding.left - padding.right;
  const drawableHeight = height - padding.top - padding.bottom;
  const maxPaid = Math.max(...schedule.map((row) => row.cumulativePrincipal + row.cumulativeInterest), 1);
  const total = Math.max(schedule.length - 1, 1);

  context.clearRect(0, 0, width, height);
  drawChartFrame(context, width, height, padding);

  const xForIndex = (index) => padding.left + (drawableWidth * index) / total;
  const yForValue = (value) => padding.top + drawableHeight - (drawableHeight * value) / maxPaid;

  drawSeries(context, schedule.map((row) => ({ balance: row.cumulativePrincipal })), schedule.length, (index) => xForIndex(index), yForValue, "#159b94");
  drawSeries(context, schedule.map((row) => ({ balance: row.cumulativeInterest })), schedule.length, (index) => xForIndex(index), yForValue, "#ef8e3b");

  drawAxisLabels(context, {
    padding,
    width,
    height,
    yLabels: [maxPaid, maxPaid / 2, 0].map((value) => createCurrencyFormatter().format(roundCurrency(value))),
    xLabels: ["Start", "Mid", "End"],
  });
}

function drawChartFrame(context, width, height, padding) {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(23, 38, 59, 0.18)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, height - padding.bottom);
  context.lineTo(width - padding.right, height - padding.bottom);
  context.stroke();
}

function drawSeries(context, data, totalLength, xForIndex, yForValue, color) {
  if (!data.length) {
    return;
  }
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.beginPath();
  data.forEach((row, index) => {
    const x = xForIndex(index, totalLength);
    const y = yForValue(row.balance);
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();
}

function drawAxisLabels(context, options) {
  const { padding, width, height, yLabels, xLabels } = options;
  context.fillStyle = "#5d7087";
  context.font = "10px sans-serif";
  yLabels.forEach((label, index) => {
    const y = padding.top + ((height - padding.top - padding.bottom) * index) / Math.max(yLabels.length - 1, 1);
    context.fillText(label, 8, y + 4);
  });
  xLabels.forEach((label, index) => {
    const x = padding.left + ((width - padding.left - padding.right) * index) / Math.max(xLabels.length - 1, 1);
    context.fillText(label, x - 10, height - 10);
  });
}

function resizeCanvas(canvas, cssWidth, cssHeight) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(cssWidth * ratio);
  canvas.height = Math.floor(cssHeight * ratio);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function clearCanvas(canvas) {
  if (!canvas) {
    return;
  }
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function populateForm() {
  const scenario = getSelectedScenario();
  if (!scenario) {
    return;
  }

  if (elements.compactModeBtn) {
    elements.compactModeBtn.setAttribute("aria-pressed", String(state.compactMode));
    elements.compactModeBtn.textContent = state.compactMode ? "Expanded mode" : "Compact mode";
  }
  elements.currencySelect.value = state.settings.currency;
  elements.scenarioName.value = scenario.name;
  elements.loanAmount.value = formatInputNumber(scenario.loanAmount);
  elements.annualRate.value = formatInputNumber(scenario.annualRate);
  elements.termYears.value = String(scenario.termYears);
  elements.termMonths.value = String(scenario.termMonths);
  elements.paymentFrequency.value = scenario.paymentFrequency;
  elements.compounding.value = scenario.compounding;
  elements.startDate.value = scenario.startDate;
  elements.fees.value = formatInputNumber(scenario.fees);
  elements.notes.value = scenario.notes;
  elements.recurringEnabled.checked = scenario.recurringExtraPayment.enabled;
  elements.recurringAmount.value = formatInputNumber(scenario.recurringExtraPayment.amount);
  elements.recurringFrequency.value = scenario.recurringExtraPayment.frequency;
  elements.comparisonIncludeExtras.checked = scenario.comparisonIncludeExtras;
}

function formatInputNumber(value) {
  return value === 0 ? "0" : String(value);
}

function persistState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(exportState()));
    updateStorageStatus(`Auto-saved on this browser only at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Save a scenarios file if you want a backup you can reopen elsewhere.`);
  } catch (error) {
    updateStorageStatus("Browser auto-save is unavailable in this session.", true);
  }
}

function restoreState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return;
    }
    state = normalizeImportedState(JSON.parse(saved));
  } catch (error) {
    state = createDefaultState();
  }
}

function exportState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: { ...state.settings },
    selectedScenarioId: state.selectedScenarioId,
    comparisonIds: [...state.comparisonIds],
    activeTab: state.activeTab,
    compactMode: state.compactMode,
    showFullSchedule: state.showFullSchedule,
    scenarios: state.scenarios.map((scenario) => cloneScenario(scenario)),
  };
}

function normalizeImportedState(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("We couldn't read that file as a SimpleKit saved scenarios file.");
  }

  const schemaVersion = Number.parseInt(String(payload.schemaVersion ?? 1), 10);
  if (!Number.isFinite(schemaVersion) || schemaVersion < 1 || schemaVersion > SCHEMA_VERSION) {
    throw new Error("This saved scenarios file uses an unsupported version.");
  }

  const normalized = sanitizeState({
    schemaVersion,
    settings: payload.settings || {},
    selectedScenarioId: payload.selectedScenarioId,
    comparisonIds: payload.comparisonIds,
    activeTab: payload.activeTab,
    showFullSchedule: payload.showFullSchedule,
    scenarios: payload.scenarios,
  });

  if (!Array.isArray(payload.scenarios) || normalized.scenarios.length === 0) {
    throw new Error("This file did not include any loan scenarios to open.");
  }

  return normalized;
}

function updateStorageStatus(message, isError = false) {
  if (!elements.storageStatus) {
    return;
  }
  elements.storageStatus.textContent = message;
  elements.storageStatus.style.color = isError ? "#b54434" : "";
}

function applyCompactMode() {
  document.querySelector(".loan-shell")?.classList.toggle("is-compact", state.compactMode);
}

function renderDefinitions(entries) {
  return entries.map(([label, value]) => `
    <dl class="definition-row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </dl>
  `).join("");
}

function createCurrencyFormatter() {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: state.settings.currency,
    maximumFractionDigits: 2,
  });
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isValidIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseIsoDate(value).getTime());
}

function parseIsoDate(value) {
  return new Date(`${value}T12:00:00`);
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftIsoDate(isoDate, offsetDays) {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + offsetDays);
  return toIsoDate(date);
}

function advanceDate(date, frequencyKey, count) {
  const next = new Date(date.getTime());
  if (frequencyKey === "monthly") {
    const dayOfMonth = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + count);
    const lastDayOfTargetMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(dayOfMonth, lastDayOfTargetMonth));
    return next;
  }
  const approxDays = FREQUENCY_CONFIG[frequencyKey].approxDays * count;
  next.setDate(next.getDate() + Math.round(approxDays));
  return next;
}

function diffDays(laterIsoDate, earlierIsoDate) {
  const later = parseIsoDate(laterIsoDate);
  const earlier = parseIsoDate(earlierIsoDate);
  return Math.max(0, Math.round((later - earlier) / 86400000));
}

function formatDate(value) {
  return DATE_FORMATTER.format(parseIsoDate(value));
}

function formatTerm(years, months) {
  const yearCopy = years === 1 ? "1 year" : `${years} years`;
  if (!months) {
    return yearCopy;
  }
  return `${yearCopy}, ${months} month${months === 1 ? "" : "s"}`;
}

function formatDurationFromDays(days) {
  if (days <= 0) {
    return "No time saved";
  }
  const months = Math.round(days / 30.4375);
  if (months < 1) {
    return `${days} days`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years > 0 && remainingMonths > 0) {
    return `${years}y ${remainingMonths}m`;
  }
  if (years > 0) {
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  return `${months} month${months === 1 ? "" : "s"}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function initialize() {
  cacheDom();
  restoreState();
  bindEvents();
  refresh();
}

initialize();
})();
