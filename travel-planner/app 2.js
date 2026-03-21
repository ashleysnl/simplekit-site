const STORAGE_KEY = "vacationTripTracker.v2";
const LEGACY_STORAGE_KEYS = ["floridaVacationTracker.v1"];
const BACKUP_VERSION = 1;
const BASE_CATEGORIES = ["Lodging", "Transportation", "Food", "Activities", "Park Passes", "Shopping", "Misc"];
const SUPPORT_BANNER_DISMISSED_KEY = "travelplanner_support_banner_dismissed";
const SUPPORT_BANNER_SHOWN_KEY = "travelplanner_support_banner_shown";
const FAMILY_ADULTS_KEY = "travelplanner_trip_adults";
const FAMILY_CHILDREN_KEY = "travelplanner_trip_children";
const FAMILY_SPLIT_TOGGLE_KEY = "travelplanner_family_split_toggle";
const ONBOARDING_DISMISSED_KEY = "travelplanner_onboarding_dismissed";
const ITIN_FORM_MODE_KEY = "travelplanner_itin_form_mode";
const COST_FORM_MODE_KEY = "travelplanner_cost_form_mode";
const BLANK_DEFAULT_MIGRATION_KEY = "travelplanner_blank_default_migration_v1";
const ACTIVE_MODE_KEY = "travelplanner_active_mode";
const memoryStorageFallback = new Map();

function storageGet(key) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? memoryStorageFallback.get(key) ?? null : value;
  } catch {
    return memoryStorageFallback.get(key) ?? null;
  }
}

function storageSet(key, value) {
  const next = String(value);
  memoryStorageFallback.set(key, next);
  try {
    localStorage.setItem(key, next);
  } catch {
    // Ignore storage write failures (e.g., private mode); app remains usable in-memory.
  }
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function cloneDeep(value) {
  if (globalThis.structuredClone) return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

const demoData = {
  settings: {
    tripName: "Sample Family Theme Park Trip (Demo)",
    travelers: 4,
    startDate: "2026-04-27",
    endDate: "2026-05-07",
    totalBudgetCad: 11000,
    displayCurrency: "USD",
    usdToCadRate: 1.36,
    eurToCadRate: 1.47,
  },
  activities: [
    {
      id: makeId(),
      date: "2026-04-27",
      time: "07:30",
      title: "Flight to Orlando",
      location: "YYZ Airport",
      category: "Transportation",
      currency: "CAD",
      plannedUsd: 964.24,
      paidUsd: 964.24,
      status: "Paid",
      notes: "Family seats booked together",
    },
    {
      id: makeId(),
      date: "2026-04-27",
      time: "16:00",
      title: "Hotel Check-In",
      location: "Resort Hotel",
      category: "Lodging",
      currency: "USD",
      plannedUsd: 1180,
      paidUsd: 400,
      status: "Booked",
      notes: "Request adjoining rooms if available",
    },
    {
      id: makeId(),
      date: "2026-04-28",
      time: "09:00",
      title: "Epic Universe",
      location: "Orlando",
      category: "Park Passes",
      currency: "USD",
      plannedUsd: 520,
      paidUsd: 520,
      status: "Paid",
    },
    {
      id: makeId(),
      date: "2026-04-29",
      time: "18:30",
      title: "Dinner Reservation",
      location: "Disney Springs",
      category: "Food",
      currency: "USD",
      plannedUsd: 180,
      paidUsd: 0,
      status: "Planned",
    },
    {
      id: makeId(),
      date: "2026-05-01",
      time: "08:45",
      title: "Magic Kingdom",
      location: "Walt Disney World",
      category: "Park Passes",
      currency: "USD",
      plannedUsd: 620,
      paidUsd: 0,
      status: "Booked",
    },
    {
      id: makeId(),
      date: "2026-05-02",
      time: "10:30",
      title: "Pool + Rest Day",
      location: "Resort",
      category: "Activities",
      currency: "CAD",
      plannedUsd: 0,
      paidUsd: 0,
      status: "Planned",
      notes: "No major spending planned",
    },
    {
      id: makeId(),
      date: "2026-05-03",
      time: "09:15",
      title: "Kennedy Space Center",
      location: "Cape Canaveral",
      category: "Activities",
      currency: "USD",
      plannedUsd: 260,
      paidUsd: 0,
      status: "Booked",
    },
    {
      id: makeId(),
      date: "2026-05-04",
      time: "10:00",
      title: "LEGOLAND Day Trip",
      location: "Winter Haven",
      category: "Activities",
      currency: "USD",
      plannedUsd: 310,
      paidUsd: 0,
      status: "Planned",
    },
    {
      id: makeId(),
      date: "2026-05-06",
      time: "14:00",
      title: "Souvenir Shopping",
      location: "Outlet Mall",
      category: "Shopping",
      currency: "USD",
      plannedUsd: 220,
      paidUsd: 0,
      status: "Planned",
    },
    {
      id: makeId(),
      date: "2026-05-07",
      time: "13:15",
      title: "Return Flight Home",
      location: "Airport",
      category: "Transportation",
      currency: "CAD",
      plannedUsd: 882.40,
      paidUsd: 882.40,
      status: "Paid",
    },
  ],
  costItems: [
    {
      id: makeId(),
      title: "Travel Insurance (Family)",
      category: "Misc",
      currency: "CAD",
      plannedUsd: 210,
      paidUsd: 210,
      includeInItinerary: false,
      notes: "Policy numbers stored in email",
    },
    {
      id: makeId(),
      title: "Airport Parking",
      category: "Transportation",
      currency: "CAD",
      plannedUsd: 95,
      paidUsd: 95,
      includeInItinerary: true,
      itineraryDate: "2026-04-27",
      itineraryTime: "05:30",
      itineraryLocation: "Home Airport",
      itineraryStatus: "Paid",
    },
    {
      id: makeId(),
      title: "Hertz Car Rental",
      category: "Transportation",
      currency: "USD",
      plannedUsd: 420,
      paidUsd: 120,
      includeInItinerary: true,
      itineraryDate: "2026-04-27",
      itineraryTime: "11:00",
      itineraryLocation: "Orlando Airport",
      itineraryStatus: "Booked",
    },
    {
      id: makeId(),
      title: "4-Day Park Tickets",
      category: "Park Passes",
      currency: "USD",
      plannedUsd: 1680,
      paidUsd: 1680,
      includeInItinerary: false,
      notes: "Includes one park hopper day",
    },
    {
      id: makeId(),
      title: "Grocery Run",
      category: "Food",
      currency: "USD",
      plannedUsd: 180,
      paidUsd: 0,
      includeInItinerary: true,
      itineraryDate: "2026-04-27",
      itineraryTime: "18:30",
      itineraryLocation: "Nearby supermarket",
      itineraryStatus: "Planned",
    },
    {
      id: makeId(),
      title: "PhotoPass / Memory Package",
      category: "Activities",
      currency: "USD",
      plannedUsd: 220,
      paidUsd: 0,
      includeInItinerary: false,
    },
    {
      id: makeId(),
      title: "Souvenir Budget Envelope",
      category: "Shopping",
      currency: "CAD",
      plannedUsd: 300,
      paidUsd: 0,
      includeInItinerary: false,
    },
    {
      id: makeId(),
      title: "Resort Parking + Fees",
      category: "Lodging",
      currency: "USD",
      plannedUsd: 95,
      paidUsd: 0,
      includeInItinerary: false,
    },
  ],
};

let state = loadState();
let familyPrefs = loadFamilyPrefs();
const uiState = {
  dashboardSelectedDate: null,
  dashboardDayModalOpen: false,
  importReminderOpen: false,
  aboutModalOpen: false,
  supportBannerQueued: false,
  supportBannerVisible: false,
  toastTimer: null,
  onboardingVisible: false,
  setupWizardVisible: false,
  setupWizardMinimized: false,
  setupWizardStep: 1,
  planningUnlocked: false,
  appMenuOpen: false,
  appReady: false,
  dashboardQuickEdit: null,
  dashboardQuickPlacement: null,
  itineraryFormPlacement: null,
  costFormPlacement: null,
  itineraryEditId: null,
  costItemEditId: null,
};
let bodyScrollLockY = 0;

function isLegacySeededDemoState(candidate) {
  const source = candidate || state;
  if (!source?.settings) return false;
  if (String(source.settings.tripName || "") !== String(demoData.settings.tripName || "")) return false;
  if ((source.settings.startDate || "") !== (demoData.settings.startDate || "")) return false;
  if ((source.settings.endDate || "") !== (demoData.settings.endDate || "")) return false;
  if (Math.round(Number(source.settings.totalBudgetCad) || 0) !== Math.round(Number(demoData.settings.totalBudgetCad) || 0)) return false;

  const sourceActivities = Array.isArray(source.activities) ? source.activities : [];
  const sourceCosts = Array.isArray(source.costItems) ? source.costItems : [];
  if (sourceActivities.length !== demoData.activities.length) return false;
  if (sourceCosts.length !== demoData.costItems.length) return false;

  const activitySignature = (item) => [item.date || "", item.time || "", item.title || "", item.location || "", item.category || ""].join("|");
  const costSignature = (item) =>
    [item.title || "", item.category || "", item.itineraryDate || "", item.itineraryTime || "", item.includeInItinerary ? "1" : "0"].join("|");

  return (
    sourceActivities.every((item, idx) => activitySignature(item) === activitySignature(demoData.activities[idx])) &&
    sourceCosts.every((item, idx) => costSignature(item) === costSignature(demoData.costItems[idx]))
  );
}

function migrateLegacySeededDemoToBlank() {
  try {
    if (storageGet(BLANK_DEFAULT_MIGRATION_KEY) === "1") return;
    if (!isLegacySeededDemoState(state)) {
      storageSet(BLANK_DEFAULT_MIGRATION_KEY, "1");
      return;
    }

    state = buildEmptyState();
    saveState(false);
    storageSet(BLANK_DEFAULT_MIGRATION_KEY, "1");
  } catch {
    // Ignore migration failures and continue with current state.
  }
}

const el = {
  settingsForm: document.getElementById("settingsForm"),
  activityForm: document.getElementById("activityForm"),
  activityFormTitle: document.getElementById("activityFormTitle"),
  activityFormCancelEdit: document.getElementById("activityFormCancelEdit"),
  activityFormSubmit: document.getElementById("activityFormSubmit"),
  costItemForm: document.getElementById("costItemForm"),
  costItemFormTitle: document.getElementById("costItemFormTitle"),
  costItemFormCancelEdit: document.getElementById("costItemFormCancelEdit"),
  costItemFormSubmit: document.getElementById("costItemFormSubmit"),
  printReportBtn: document.getElementById("menuPrintBtn"),
  resetDemoBtn: document.getElementById("menuResetBtn"),
  aboutAppBtn: document.getElementById("menuAboutBtn"),
  footerAboutBtn: document.getElementById("footerAboutBtn"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  importJsonBtn: document.getElementById("importJsonBtn"),
  importJsonFile: document.getElementById("importJsonFile"),
  globalSaveBtn: document.getElementById("globalSaveBtn"),
  menuSaveTripBtn: document.getElementById("menuSaveTripBtn"),
  startPlanningBtn: document.getElementById("startPlanningBtn"),
  heroLoadDemoBtn: document.getElementById("heroLoadDemoBtn"),
  openTripBtn: document.getElementById("menuOpenTripBtn"),
  appMenu: document.getElementById("appMenu"),
  appMenuBtn: document.getElementById("appMenuBtn"),
  appMenuCloseBtn: document.getElementById("appMenuCloseBtn"),
  footerMenuBtn: document.getElementById("footerMenuBtn"),
  importReminderModal: document.getElementById("importReminderModal"),
  importReminderImportBtn: document.getElementById("importReminderImportBtn"),
  importReminderDismissBtn: document.getElementById("importReminderDismissBtn"),
  importReminderLastUsed: document.getElementById("importReminderLastUsed"),
  aboutModal: document.getElementById("aboutModal"),
  aboutModalClose: document.getElementById("aboutModalClose"),
  supportBanner: document.getElementById("supportBanner"),
  supportBannerDismissBtn: document.getElementById("supportBannerDismissBtn"),
  supportBannerCoffeeLink: document.getElementById("supportBannerCoffeeLink"),
  tabButtons: Array.from(document.querySelectorAll(".tab-btn[data-mode-target]")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
  tripSnapshotSection: document.querySelector(".trip-snapshot"),
  metricGrid: document.getElementById("metricGrid"),
  onboardingPanel: document.getElementById("onboardingPanel"),
  loadSampleTripBtn: document.getElementById("loadSampleTripBtn"),
  startEmptyTripBtn: document.getElementById("startEmptyTripBtn"),
  onboardingImportBackupBtn: document.getElementById("onboardingImportBackupBtn"),
  dismissOnboardingBtn: document.getElementById("dismissOnboardingBtn"),
  familyAdults: document.getElementById("familyAdults"),
  familyChildren: document.getElementById("familyChildren"),
  familySplitToggle: document.getElementById("familySplitToggle"),
  familyBudgetSummary: document.getElementById("familyBudgetSummary"),
  categoryBreakdown: document.getElementById("categoryBreakdown"),
  dashboardItinerary: document.getElementById("dashboardItinerary"),
  dashboardDayDetail: document.getElementById("dashboardDayDetail"),
  dashboardDayDetailClose: document.getElementById("dashboardDayDetailClose"),
  dashboardDayDetailTitle: document.getElementById("dashboardDayDetailTitle"),
  dashboardDayDetailMeta: document.getElementById("dashboardDayDetailMeta"),
  dashboardDayDetailList: document.getElementById("dashboardDayDetailList"),
  dashboardDayDetailComposer: document.getElementById("dashboardDayDetailComposer"),
  dashboardQuickActivityForm: document.getElementById("dashboardQuickActivityForm"),
  dashboardQuickFormTitle: document.getElementById("dashboardQuickFormTitle"),
  dashboardQuickFormCancelEdit: document.getElementById("dashboardQuickFormCancelEdit"),
  dashboardQuickFormSubmit: document.getElementById("dashboardQuickFormSubmit"),
  heroTripTitle: document.getElementById("heroTripTitle"),
  dashboardTripTitle: document.getElementById("dashboardTripTitle"),
  dashboardTripMeta: document.getElementById("dashboardTripMeta"),
  dashboardCategoryBreakdownTitle: document.getElementById("dashboardCategoryBreakdownTitle"),
  tripSnapshotGrid: document.getElementById("tripSnapshotGrid"),
  setupWizardCard: document.getElementById("setupWizardCard"),
  dashboardTimelineRange: document.getElementById("dashboardTimelineRange"),
  appToast: document.getElementById("appToast"),
  itineraryComposer: document.getElementById("itineraryComposer"),
  planChecklist: document.getElementById("planChecklist"),
  itineraryList: document.getElementById("itineraryList"),
  costsComposer: document.getElementById("costsComposer"),
  costsList: document.getElementById("costsList"),
  activitiesTableBody: document.querySelector("#activitiesTable tbody"),
  costItemsTableBody: document.querySelector("#costItemsTable tbody"),
  plannedBudgetPct: document.getElementById("plannedBudgetPct"),
  paidBudgetPct: document.getElementById("paidBudgetPct"),
  budgetHealthState: document.getElementById("budgetHealthState"),
  plannedBudgetBar: document.getElementById("plannedBudgetBar"),
  paidBudgetBar: document.getElementById("paidBudgetBar"),
  budgetProgressCard: document.querySelector(".dashboard-budget-panel .progress-card"),
  reportTripName: document.getElementById("reportTripName"),
  reportTripMeta: document.getElementById("reportTripMeta"),
  reportRate: document.getElementById("reportRate"),
  reportGenerated: document.getElementById("reportGenerated"),
  reportMetrics: document.getElementById("reportMetrics"),
  reportCharts: document.getElementById("reportCharts"),
  reportItinerarySummary: document.getElementById("reportItinerarySummary"),
  reportBreakdown: document.getElementById("reportBreakdown"),
  reportFamilySummary: document.getElementById("reportFamilySummary"),
  reportTimeline: document.getElementById("reportTimeline"),
  backupLastUsed: document.getElementById("backupLastUsed"),
  backupDirtyStatus: document.getElementById("backupDirtyStatus"),
  settingsAdults: document.getElementById("settingsAdults"),
  settingsChildren: document.getElementById("settingsChildren"),
  totalBudgetLabelText: document.getElementById("totalBudgetLabelText"),
  settings: {
    tripName: document.getElementById("tripName"),
    travelers: document.getElementById("travelers"),
    startDate: document.getElementById("startDate"),
    endDate: document.getElementById("endDate"),
    totalBudgetCad: document.getElementById("totalBudgetCad"),
    displayCurrency: document.getElementById("displayCurrency"),
    usdToCadRate: document.getElementById("usdToCadRate"),
    eurToCadRate: document.getElementById("eurToCadRate"),
  },
  activityInputs: {
    mode: document.getElementById("activityFormMode"),
    editId: document.getElementById("activityEditId"),
    date: document.getElementById("activityDate"),
    time: document.getElementById("activityTime"),
    title: document.getElementById("activityTitle"),
    location: document.getElementById("activityLocation"),
    notes: document.getElementById("activityNotes"),
    category: document.getElementById("activityCategory"),
    currency: document.getElementById("activityCurrency"),
    plannedUsd: document.getElementById("activityPlannedUsd"),
    paidUsd: document.getElementById("activityPaidUsd"),
    status: document.getElementById("activityStatus"),
  },
  activityFormModeButtons: {
    basic: document.getElementById("activityFormBasicBtn"),
    advanced: document.getElementById("activityFormAdvancedBtn"),
  },
  costItemInputs: {
    mode: document.getElementById("costItemFormMode"),
    editId: document.getElementById("costItemEditId"),
    title: document.getElementById("costItemTitle"),
    category: document.getElementById("costItemCategory"),
    currency: document.getElementById("costItemCurrency"),
    plannedUsd: document.getElementById("costItemPlannedUsd"),
    paidUsd: document.getElementById("costItemPaidUsd"),
    includeInItinerary: document.getElementById("costItemIncludeInItinerary"),
    itineraryDate: document.getElementById("costItemItineraryDate"),
    itineraryTime: document.getElementById("costItemItineraryTime"),
    itineraryLocation: document.getElementById("costItemItineraryLocation"),
    notes: document.getElementById("costItemNotes"),
    itineraryStatus: document.getElementById("costItemItineraryStatus"),
  },
  costItemFormModeButtons: {
    basic: document.getElementById("costItemFormBasicBtn"),
    advanced: document.getElementById("costItemFormAdvancedBtn"),
  },
  dashboardQuickActivityInputs: {
    date: document.getElementById("dashboardQuickActivityDate"),
    mode: document.getElementById("dashboardQuickMode"),
    editSource: document.getElementById("dashboardQuickEditSource"),
    editId: document.getElementById("dashboardQuickEditId"),
    time: document.getElementById("dashboardQuickActivityTime"),
    title: document.getElementById("dashboardQuickActivityTitle"),
    location: document.getElementById("dashboardQuickActivityLocation"),
    notes: document.getElementById("dashboardQuickActivityNotes"),
    category: document.getElementById("dashboardQuickActivityCategory"),
    currency: document.getElementById("dashboardQuickActivityCurrency"),
    plannedUsd: document.getElementById("dashboardQuickActivityPlannedUsd"),
    paidUsd: document.getElementById("dashboardQuickActivityPaidUsd"),
    status: document.getElementById("dashboardQuickActivityStatus"),
  },
};

function loadState() {
  const raw =
    storageGet(STORAGE_KEY) ||
    LEGACY_STORAGE_KEYS.map((key) => storageGet(key)).find(Boolean);
  if (!raw) return buildEmptyState();
  try {
    return normalizeImportedState(JSON.parse(raw));
  } catch {
    return buildEmptyState();
  }
}

function loadFamilyPrefs() {
  const adults = Math.max(0, Number(storageGet(FAMILY_ADULTS_KEY)) || 2);
  const children = Math.max(0, Number(storageGet(FAMILY_CHILDREN_KEY)) || 0);
  const splitByRole = storageGet(FAMILY_SPLIT_TOGGLE_KEY) === "1";
  return { adults, children, splitByRole };
}

function saveFamilyPrefs() {
  storageSet(FAMILY_ADULTS_KEY, String(Math.max(0, Number(familyPrefs.adults) || 0)));
  storageSet(FAMILY_CHILDREN_KEY, String(Math.max(0, Number(familyPrefs.children) || 0)));
  storageSet(FAMILY_SPLIT_TOGGLE_KEY, familyPrefs.splitByRole ? "1" : "0");
}

function isOnboardingDismissed() {
  return storageGet(ONBOARDING_DISMISSED_KEY) === "1";
}

function dismissOnboarding() {
  storageSet(ONBOARDING_DISMISSED_KEY, "1");
  uiState.onboardingVisible = false;
  render();
}

function syncOnboardingPanelVisibility() {
  if (!el.onboardingPanel) return;
  el.onboardingPanel.hidden = !uiState.onboardingVisible;
}

function setupWizardStepComplete(step, summary = calculateSummary()) {
  const s = state.settings || {};
  const travelers = Math.max(0, Number(familyPrefs.adults) || 0) + Math.max(0, Number(familyPrefs.children) || 0);
  if (step === 1) return Boolean((s.tripName || "").trim() && s.startDate && s.endDate);
  if (step === 2) return (Number(s.totalBudgetCad) || 0) > 0 && travelers > 0 && Boolean(displayCurrencyCode());
  if (step === 3) return (state.activities || []).length > 0;
  if (step === 4) return (state.costItems || []).length > 0;
  if (step === 5) return uiState.setupWizardMinimized;
  return false;
}

function getSetupWizardStepStatuses(summary = calculateSummary()) {
  return [1, 2, 3, 4, 5].map((step) => ({
    step,
    complete: setupWizardStepComplete(step, summary),
  }));
}

function openSetupWizard({ step = 1, scroll = true } = {}) {
  uiState.planningUnlocked = true;
  uiState.setupWizardVisible = true;
  uiState.setupWizardMinimized = false;
  uiState.setupWizardStep = Math.min(5, Math.max(1, Number(step) || 1));
  switchTab("plan");
  render();
  if (scroll && el.setupWizardCard) {
    requestAnimationFrame(() => el.setupWizardCard.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
}

function minimizeSetupWizard() {
  uiState.setupWizardVisible = true;
  uiState.setupWizardMinimized = true;
  uiState.setupWizardStep = 5;
}

function closeSetupWizard() {
  uiState.setupWizardVisible = false;
  uiState.setupWizardMinimized = false;
}

function isPlanningLocked() {
  return !uiState.planningUnlocked && !uiState.setupWizardVisible && !hasMeaningfulTripData();
}

function syncPlanningLockUi() {
  const body = document.body;
  if (!body) return;
  body.classList.toggle("planning-locked", isPlanningLocked());
  body.classList.toggle("setup-focus", uiState.setupWizardVisible && !uiState.setupWizardMinimized);
}

function enforcePlanningGatePanels() {
  if (!isPlanningLocked()) return;
  const planPanels = new Set(["itinerary", "settings"]);
  el.tabPanels.forEach((panel) => {
    if (planPanels.has(panel.dataset.tabPanel)) {
      panel.hidden = true;
      panel.classList.remove("active");
    }
  });
}

function saveSetupWizardBasicsStep() {
  const tripNameInput = document.getElementById("setupTripName");
  const startDateInput = document.getElementById("setupStartDate");
  const endDateInput = document.getElementById("setupEndDate");
  if (!tripNameInput || !startDateInput || !endDateInput) return false;
  const tripName = tripNameInput.value.trim();
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  if (!tripName || !startDate || !endDate) {
    showToast("Add trip name and dates to continue.");
    return false;
  }
  if (endDate < startDate) {
    showToast("End date must be after the start date.");
    return false;
  }
  state.settings.tripName = tripName;
  state.settings.startDate = startDate;
  state.settings.endDate = endDate;
  saveState();
  return true;
}

function saveSetupWizardBudgetStep() {
  const budgetInput = document.getElementById("setupBudget");
  const currencyInput = document.getElementById("setupDisplayCurrency");
  const adultsInput = document.getElementById("setupAdults");
  const childrenInput = document.getElementById("setupChildren");
  if (!budgetInput || !currencyInput || !adultsInput || !childrenInput) return false;

  const displayCurrency = normalizeDisplayCurrency(currencyInput.value);
  const budgetDisplay = Math.max(0, Number(budgetInput.value) || 0);
  const adults = Math.max(0, Number(adultsInput.value) || 0);
  const children = Math.max(0, Number(childrenInput.value) || 0);
  const travelers = adults + children;
  if (travelers <= 0) {
    showToast("Add at least 1 traveler to continue.");
    return false;
  }
  if (budgetDisplay <= 0) {
    showToast("Add your budget to continue.");
    return false;
  }

  state.settings.displayCurrency = displayCurrency;
  state.settings.totalBudgetCad = displayToCad(budgetDisplay, displayCurrency);
  state.settings.travelers = travelers;
  familyPrefs.adults = adults;
  familyPrefs.children = children;
  saveFamilyPrefs();
  saveState();
  return true;
}

function setupWizardReviewRows(summary) {
  const leftCad = (Number(state.settings.totalBudgetCad) || 0) - (Number(summary.plannedCad) || 0);
  return [
    ["Budget", moneyDisplayRoundedFromCad(state.settings.totalBudgetCad || 0)],
    ["Forecast", moneyDisplayRoundedFromCad(summary.plannedCad || 0)],
    ["Paid", moneyDisplayRoundedFromCad(summary.paidCad || 0)],
    ["Remaining", moneyDisplayRoundedFromCad(leftCad)],
    ["Status", leftCad >= 0 ? "On budget" : "Over budget"],
  ];
}

function renderSetupWizard(summary) {
  if (!el.setupWizardCard) return;
  const visible = uiState.setupWizardVisible;
  el.setupWizardCard.hidden = !visible;
  if (!visible) return;

  const steps = getSetupWizardStepStatuses(summary);
  const currentStep = Math.min(5, Math.max(1, Number(uiState.setupWizardStep) || 1));
  const progressPct = Math.round(((currentStep - 1) / 4) * 100);

  if (uiState.setupWizardMinimized) {
    el.setupWizardCard.classList.add("is-minimized");
    el.setupWizardCard.innerHTML = `
      <div class="setup-wizard-minibar">
        <div>
          <p class="setup-wizard-kicker">Setup Complete</p>
          <strong>Trip setup is ready.</strong>
          <p class="muted small-copy">You can reopen the steps any time to adjust the basics.</p>
        </div>
        <div class="setup-wizard-mini-actions">
          <button type="button" class="btn btn-secondary control-btn" data-action="wizardReopen">Reopen setup</button>
          <button type="button" class="icon-btn" data-action="wizardClose" aria-label="Close setup summary">Dismiss</button>
        </div>
      </div>
    `;
    return;
  }

  el.setupWizardCard.classList.remove("is-minimized");

  const travelers = Math.max(0, Number(familyPrefs.adults) || 0) + Math.max(0, Number(familyPrefs.children) || 0);
  const stepTitles = [
    "Trip Basics",
    "Budget + Travelers",
    "Build Itinerary",
    "Add Other Costs",
    "Review vs Budget",
  ];

  let bodyHtml = "";
  let canContinue = true;
  let nextLabel = currentStep === 5 ? "Finish Setup" : "Continue";
  let nextAction = currentStep === 5 ? "wizardFinish" : "wizardNext";
  let secondaryHtml = currentStep > 1 ? `<button type="button" class="btn btn-secondary control-btn" data-action="wizardBack">Back</button>` : "";

  if (currentStep === 1) {
    canContinue = Boolean((state.settings.tripName || "").trim() && state.settings.startDate && state.settings.endDate);
    bodyHtml = `
      <div class="setup-wizard-fields">
        <label class="form-span-full">
          Trip name
          <input id="setupTripName" type="text" value="${escapeHtml(state.settings.tripName || "")}" placeholder="Summer Vacation" />
        </label>
        <label>
          Start date
          <input id="setupStartDate" type="date" value="${escapeHtml(state.settings.startDate || "")}" />
        </label>
        <label>
          End date
          <input id="setupEndDate" type="date" value="${escapeHtml(state.settings.endDate || "")}" />
        </label>
      </div>
    `;
  } else if (currentStep === 2) {
    canContinue = (Number(state.settings.totalBudgetCad) || 0) > 0 && travelers > 0;
    bodyHtml = `
      <div class="setup-wizard-fields">
        <label>
          Budget
          <input id="setupBudget" type="number" min="0" step="0.01" value="${cadToDisplay(state.settings.totalBudgetCad || 0).toFixed(2)}" />
        </label>
        <label>
          Planning currency
          <select id="setupDisplayCurrency">
            <option value="USD" ${displayCurrencyCode() === "USD" ? "selected" : ""}>USD</option>
            <option value="CAD" ${displayCurrencyCode() === "CAD" ? "selected" : ""}>CAD</option>
            <option value="EUR" ${displayCurrencyCode() === "EUR" ? "selected" : ""}>EUR</option>
          </select>
        </label>
        <label>
          Adults
          <input id="setupAdults" type="number" min="0" step="1" value="${Math.max(0, Number(familyPrefs.adults) || 0)}" />
        </label>
        <label>
          Kids
          <input id="setupChildren" type="number" min="0" step="1" value="${Math.max(0, Number(familyPrefs.children) || 0)}" />
        </label>
      </div>
    `;
  } else if (currentStep === 3) {
    canContinue = (state.activities || []).length > 0;
    nextLabel = canContinue ? "Continue" : "Skip for now";
    const wizardItinFormOpen = uiState.itineraryFormPlacement?.type === "wizard-new";
    bodyHtml = `
      <div class="setup-wizard-step-note">
        <p><strong>${(state.activities || []).length}</strong> itinerary item${(state.activities || []).length === 1 ? "" : "s"} added.</p>
        <p class="muted">Start by adding flights, hotel, and one activity. You can add more later.</p>
      </div>
      <div class="setup-wizard-inline-actions">
        <button type="button" class="btn btn-primary" data-action="wizardOpenItinerary">${wizardItinFormOpen ? "Hide itinerary form" : "Add itinerary item"}</button>
        <button type="button" class="btn btn-secondary control-btn" data-action="wizardJumpTab" data-tab="itinerary">Open full Itinerary tab</button>
      </div>
      <div class="setup-wizard-form-slot" data-inline-slot="wizard-itinerary-new"></div>
    `;
  } else if (currentStep === 4) {
    canContinue = (state.costItems || []).length > 0;
    nextLabel = canContinue ? "Continue" : "Skip for now";
    const wizardCostFormOpen = uiState.costFormPlacement?.type === "wizard-new";
    bodyHtml = `
      <div class="setup-wizard-step-note">
        <p><strong>${(state.costItems || []).length}</strong> other cost item${(state.costItems || []).length === 1 ? "" : "s"} added.</p>
        <p class="muted">Add insurance, parking, supplies, or any costs that are not activities.</p>
      </div>
      <div class="setup-wizard-inline-actions">
        <button type="button" class="btn btn-primary" data-action="wizardOpenCosts">${wizardCostFormOpen ? "Hide cost form" : "Add other cost"}</button>
        <button type="button" class="btn btn-secondary control-btn" data-action="wizardJumpTab" data-tab="costs">Open full Costs tab</button>
      </div>
      <div class="setup-wizard-form-slot" data-inline-slot="wizard-cost-new"></div>
    `;
  } else {
    const rows = setupWizardReviewRows(summary)
      .map(
        ([label, value]) => `
          <div class="setup-wizard-review-row">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `
      )
      .join("");
    bodyHtml = `
      <div class="setup-wizard-step-note">
        <p class="muted">Quick review before you start working in the planner tabs.</p>
      </div>
      <div class="setup-wizard-review">${rows}</div>
      <div class="setup-wizard-inline-actions">
        <button type="button" class="btn btn-secondary control-btn" data-action="wizardJumpTab" data-tab="dashboard">Open Dashboard</button>
        <button type="button" class="btn btn-secondary control-btn" data-action="wizardJumpTab" data-tab="report">Open Report</button>
      </div>
    `;
  }

  el.setupWizardCard.innerHTML = `
    <div class="setup-wizard-shell" role="region" aria-labelledby="setupWizardTitle">
      <div class="setup-wizard-head">
        <div>
          <p class="setup-wizard-kicker">Guided Setup</p>
          <h3 id="setupWizardTitle">Start Planning in 5 steps</h3>
          <p class="muted">Add the basics now. You can refine everything later.</p>
        </div>
        <button type="button" class="icon-btn" data-action="wizardMinimize" aria-label="Minimize setup card">Minimize</button>
      </div>
      <div class="setup-wizard-progress" aria-label="Setup progress">
        <div class="setup-wizard-progress-bar" aria-hidden="true">
          <span style="width:${progressPct}%"></span>
        </div>
        <div class="setup-wizard-steps">
          ${steps
            .map(
              ({ step, complete }) => `
                <button type="button" class="setup-step-chip ${step === currentStep ? "is-active" : ""} ${complete ? "is-complete" : ""}" data-action="wizardGoStep" data-step="${step}" aria-label="Step ${step}: ${stepTitles[step - 1]}">
                  <span class="dot">${complete ? "✓" : step}</span>
                  <span class="label">${stepTitles[step - 1]}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
      <div class="setup-wizard-body">
        <div class="setup-wizard-step-title">
          <span>Step ${currentStep} of 5</span>
          <strong>${stepTitles[currentStep - 1]}</strong>
        </div>
        ${bodyHtml}
      </div>
      <div class="setup-wizard-footer">
        <div class="setup-wizard-footer-left">
          ${secondaryHtml}
        </div>
        <div class="setup-wizard-footer-right">
          <button type="button" class="btn btn-secondary control-btn" data-action="wizardClose">Close</button>
          <button type="button" class="btn btn-primary" data-action="${nextAction}">${nextLabel}</button>
        </div>
      </div>
    </div>
  `;
}

function handleSetupWizardClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (!action) return;

  if (action === "wizardClose") {
    closeSetupWizard();
    render();
    return;
  }
  if (action === "wizardMinimize") {
    minimizeSetupWizard();
    render();
    return;
  }
  if (action === "wizardReopen") {
    uiState.setupWizardVisible = true;
    uiState.setupWizardMinimized = false;
    render();
    return;
  }
  if (action === "wizardBack") {
    uiState.setupWizardStep = Math.max(1, uiState.setupWizardStep - 1);
    render();
    return;
  }
  if (action === "wizardGoStep") {
    uiState.setupWizardStep = Math.min(5, Math.max(1, Number(button.dataset.step) || 1));
    render();
    return;
  }
  if (action === "wizardJumpTab") {
    switchTab(button.dataset.tab || "dashboard");
    render();
    return;
  }
  if (action === "wizardOpenItinerary") {
    let shouldFocus = false;
    if (uiState.itineraryFormPlacement?.type === "wizard-new") {
      hideItineraryInlineForm();
    } else {
      showItineraryNewItemFormInWizard();
      shouldFocus = true;
      if (uiState.costFormPlacement?.type === "wizard-new") {
        hideCostInlineForm();
        resetCostItemForm();
      }
    }
    render();
    if (shouldFocus) requestAnimationFrame(() => el.activityInputs.title?.focus());
    return;
  }
  if (action === "wizardOpenCosts") {
    let shouldFocus = false;
    if (uiState.costFormPlacement?.type === "wizard-new") {
      hideCostInlineForm();
    } else {
      showCostNewItemFormInWizard();
      shouldFocus = true;
      if (uiState.itineraryFormPlacement?.type === "wizard-new") {
        hideItineraryInlineForm();
        resetActivityForm();
      }
    }
    render();
    if (shouldFocus) requestAnimationFrame(() => el.costItemInputs.title?.focus());
    return;
  }
  if (action === "wizardNext") {
    if (uiState.setupWizardStep === 1 && !saveSetupWizardBasicsStep()) return;
    if (uiState.setupWizardStep === 2 && !saveSetupWizardBudgetStep()) return;
    uiState.setupWizardStep = Math.min(5, uiState.setupWizardStep + 1);
    render();
    return;
  }
  if (action === "wizardFinish") {
    minimizeSetupWizard();
    switchTab("plan");
    render();
  }
}

function buildEmptyState() {
  let existingCustomCategories = [];
  let adultsSeed = 2;
  let childrenSeed = 0;
  try {
    existingCustomCategories = Array.isArray(state?.settings?.customCategories) ? state.settings.customCategories : [];
  } catch {
    existingCustomCategories = [];
  }
  try {
    adultsSeed = Math.max(0, Number(familyPrefs?.adults) || Number(storageGet(FAMILY_ADULTS_KEY)) || 2);
    childrenSeed = Math.max(0, Number(familyPrefs?.children) || Number(storageGet(FAMILY_CHILDREN_KEY)) || 0);
  } catch {
    adultsSeed = 2;
    childrenSeed = 0;
  }
  return normalizeImportedState({
    settings: {
      tripName: "",
      travelers: Math.max(1, adultsSeed + childrenSeed || 2),
      startDate: "",
      endDate: "",
      totalBudgetCad: 0,
      displayCurrency: "USD",
      usdToCadRate: 1.36,
      eurToCadRate: 1.47,
      customCategories: existingCustomCategories,
    },
    activities: [],
    costItems: [],
    meta: {},
  });
}

migrateLegacySeededDemoToBlank();

function saveState(markDirty = true) {
  if (markDirty) {
    state.meta = state.meta || {};
    state.meta.backup = state.meta.backup || {};
    state.meta.backup.lastDataChangeAt = new Date().toISOString();
  }
  storageSet(STORAGE_KEY, JSON.stringify(state));
  if (markDirty) {
    maybeQueueSupportBannerAfterMeaningfulAction();
  }
}

function normalizeImportedState(candidate) {
  if (!candidate || !candidate.settings || !Array.isArray(candidate.activities)) {
    throw new Error("Invalid backup format");
  }

  const normalized = cloneDeep(candidate);
  normalized.settings = normalized.settings || {};
  normalized.meta = normalized.meta || {};
  normalized.meta.backup = normalized.meta.backup || {};
  normalized.activities = Array.isArray(normalized.activities) ? normalized.activities : [];
  normalized.costItems = Array.isArray(normalized.costItems) ? normalized.costItems : [];

  if (normalized.settings.totalBudgetCad == null) {
    const rate = Number(normalized.settings.usdToCadRate) || 0;
    normalized.settings.totalBudgetCad = (Number(normalized.settings.totalBudgetUsd) || 0) * rate;
  }

  normalized.settings.tripName = String(normalized.settings.tripName || "");
  normalized.settings.travelers = Math.max(1, Number(normalized.settings.travelers) || 1);
  normalized.settings.startDate = normalized.settings.startDate || "";
  normalized.settings.endDate = normalized.settings.endDate || "";
  normalized.settings.totalBudgetCad = Math.max(0, Number(normalized.settings.totalBudgetCad) || 0);
  normalized.settings.displayCurrency = normalizeDisplayCurrency(normalized.settings.displayCurrency || "USD");
  normalized.settings.usdToCadRate = Math.max(0, Number(normalized.settings.usdToCadRate) || 1.36);
  normalized.settings.eurToCadRate = Math.max(0, Number(normalized.settings.eurToCadRate) || 1.47);
  normalized.settings.customCategories = Array.isArray(normalized.settings.customCategories)
    ? [...new Set(normalized.settings.customCategories.map((c) => String(c || "").trim()).filter(Boolean))]
    : [];

  normalized.activities = normalized.activities.map((item) => ({
    id: item.id || makeId(),
    date: item.date || "",
    time: item.time || "",
    title: String(item.title || ""),
    location: String(item.location || ""),
    notes: String(item.notes || ""),
    category: normalizeCategory(item.category),
    currency: normalizeCurrency(item.currency),
    plannedUsd: Math.max(0, Number(item.plannedUsd) || 0),
    paidUsd: Math.max(0, Number(item.paidUsd) || 0),
    status: normalizeStatus(item.status),
  }));

  normalized.costItems = normalized.costItems.map((item) => ({
    id: item.id || makeId(),
    title: String(item.title || "Untitled Cost"),
    notes: String(item.notes || ""),
    category: normalizeCategory(item.category),
    currency: normalizeCurrency(item.currency),
    plannedUsd: Math.max(0, Number(item.plannedUsd) || 0),
    paidUsd: Math.max(0, Number(item.paidUsd) || 0),
    includeInItinerary: Boolean(item.includeInItinerary),
    itineraryDate: item.itineraryDate || "",
    itineraryTime: item.itineraryTime || "",
    itineraryLocation: String(item.itineraryLocation || ""),
    itineraryStatus: normalizeStatus(item.itineraryStatus || "Planned"),
  }));

  const discoveredCategories = [
    ...normalized.activities.map((a) => a.category),
    ...normalized.costItems.map((c) => c.category),
  ]
    .map(normalizeCategory)
    .filter((c) => c && !BASE_CATEGORIES.includes(c));
  normalized.settings.customCategories = [
    ...new Set([...(normalized.settings.customCategories || []), ...discoveredCategories]),
  ];
  normalized.meta.backup.lastImportAt = normalized.meta.backup.lastImportAt || "";
  normalized.meta.backup.lastImportFileName = normalized.meta.backup.lastImportFileName || "";
  normalized.meta.backup.lastExportAt = normalized.meta.backup.lastExportAt || "";
  normalized.meta.backup.lastExportFileName = normalized.meta.backup.lastExportFileName || "";
  normalized.meta.backup.lastSavedSnapshotAt = normalized.meta.backup.lastSavedSnapshotAt || "";
  normalized.meta.backup.lastDataChangeAt = normalized.meta.backup.lastDataChangeAt || "";

  return normalized;
}

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function moneyRounded(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));
}

function normalizeDisplayCurrency(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (raw === "CAD" || raw === "CDN") return "CAD";
  if (raw === "EUR") return "EUR";
  return "USD";
}

function displayCurrencyCode() {
  return normalizeDisplayCurrency(state.settings?.displayCurrency || "USD");
}

function displayCurrencyLabel() {
  return displayCurrencyCode();
}

function cadToDisplay(amountCad) {
  const amount = Number(amountCad) || 0;
  const code = displayCurrencyCode();
  if (code === "CAD") return amount;
  if (code === "USD") {
    const rate = Number(state.settings?.usdToCadRate) || 1.36;
    return rate > 0 ? amount / rate : 0;
  }
  if (code === "EUR") {
    const rate = Number(state.settings?.eurToCadRate) || 1.47;
    return rate > 0 ? amount / rate : 0;
  }
  return amount;
}

function displayToCad(amountDisplay, currencyCode = displayCurrencyCode()) {
  const amount = Number(amountDisplay) || 0;
  const code = normalizeDisplayCurrency(currencyCode);
  if (code === "CAD") return amount;
  if (code === "USD") return amount * (Number(state.settings?.usdToCadRate) || 1.36);
  if (code === "EUR") return amount * (Number(state.settings?.eurToCadRate) || 1.47);
  return amount;
}

function moneyDisplayFromCad(amountCad) {
  return money(cadToDisplay(amountCad), displayCurrencyCode());
}

function moneyDisplayRoundedFromCad(amountCad) {
  return moneyRounded(cadToDisplay(amountCad), displayCurrencyCode());
}

function numberDisplayRoundedFromCad(amountCad) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(cadToDisplay(amountCad) || 0));
}

function compactDisplayFromCad(amountCad) {
  const displayValue = cadToDisplay(amountCad);
  const v = Math.abs(displayValue);
  const sign = displayValue < 0 ? "-" : "";
  const code = displayCurrencyCode();
  if (v >= 1000) {
    const short = v >= 10000 ? (v / 1000).toFixed(0) : (v / 1000).toFixed(1);
    const symbol =
      new Intl.NumberFormat("en-US", { style: "currency", currency: code })
        .formatToParts(1)
        .find((part) => part.type === "currency")?.value || "";
    return `${sign}${symbol}${short}k`;
  }
  return money(displayValue, code);
}

function compactCad(value) {
  const v = Math.abs(Number(value) || 0);
  const sign = Number(value) < 0 ? "-" : "";
  if (v >= 1000) {
    const short = v >= 10000 ? (v / 1000).toFixed(0) : (v / 1000).toFixed(1);
    return `${sign}$${short}k`;
  }
  return `${sign}${money(v, "CAD").replace("CA", "")}`;
}

function loadStoredFormMode(key) {
  const saved = String(storageGet(key) || "").toLowerCase();
  return saved === "advanced" ? "advanced" : "basic";
}

function showToast(message) {
  if (!el.appToast) return;
  el.appToast.textContent = String(message || "");
  el.appToast.hidden = false;
  el.appToast.classList.add("visible");
  if (uiState.toastTimer) {
    clearTimeout(uiState.toastTimer);
  }
  uiState.toastTimer = setTimeout(() => {
    el.appToast.classList.remove("visible");
    el.appToast.hidden = true;
    uiState.toastTimer = null;
  }, 2200);
}

function setSegmentedButtonsState(buttons, mode) {
  if (!buttons) return;
  Object.entries(buttons).forEach(([key, button]) => {
    if (!button) return;
    const active = key === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function applyFormMode(formEl, mode, buttons) {
  if (!formEl) return;
  const normalized = mode === "advanced" ? "advanced" : "basic";
  formEl.dataset.uiMode = normalized;
  formEl.querySelectorAll(".form-advanced-field").forEach((field) => {
    field.hidden = normalized !== "advanced";
  });
  setSegmentedButtonsState(buttons, normalized);
}

function getItineraryFormUiMode() {
  return loadStoredFormMode(ITIN_FORM_MODE_KEY);
}

function getCostFormUiMode() {
  return loadStoredFormMode(COST_FORM_MODE_KEY);
}

function setItineraryFormUiMode(mode) {
  const normalized = mode === "advanced" ? "advanced" : "basic";
  storageSet(ITIN_FORM_MODE_KEY, normalized);
  applyFormMode(el.activityForm, normalized, el.activityFormModeButtons);
}

function setCostFormUiMode(mode) {
  const normalized = mode === "advanced" ? "advanced" : "basic";
  storageSet(COST_FORM_MODE_KEY, normalized);
  applyFormMode(el.costItemForm, normalized, el.costItemFormModeButtons);
}

function syncFormModes() {
  setItineraryFormUiMode(getItineraryFormUiMode());
  setCostFormUiMode(getCostFormUiMode());
}

function backupMeta() {
  state.meta = state.meta || {};
  state.meta.backup = state.meta.backup || {};
  return state.meta.backup;
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function hasChangesSinceLastBackupSave() {
  const meta = backupMeta();
  if (!meta.lastDataChangeAt) return false;
  if (!meta.lastSavedSnapshotAt) return true;
  const changedAt = new Date(meta.lastDataChangeAt).getTime();
  const savedAt = new Date(meta.lastSavedSnapshotAt).getTime();
  if (Number.isNaN(changedAt)) return false;
  if (Number.isNaN(savedAt)) return true;
  return changedAt > savedAt;
}

function renderBackupUi() {
  const meta = backupMeta();
  const importText = meta.lastImportAt
    ? `Last imported: ${meta.lastImportFileName || "backup"} on ${formatDateTime(meta.lastImportAt)}.`
    : "No backup imported yet on this device.";
  const exportText = meta.lastExportAt
    ? `Last exported: ${meta.lastExportFileName || "backup"} on ${formatDateTime(meta.lastExportAt)}.`
    : "No backup exported yet from this device.";
  const dirty = hasChangesSinceLastBackupSave();

  if (el.backupLastUsed) {
    el.backupLastUsed.textContent = `${importText} ${exportText}`;
  }
  if (el.backupDirtyStatus) {
    el.backupDirtyStatus.textContent = dirty
      ? "Changes detected since your last import/export backup. Tap Save to export a fresh JSON backup."
      : "Backup reminder: import the latest file before editing on a different device.";
    el.backupDirtyStatus.classList.toggle("backup-dirty-note", dirty);
  }
  if (el.importReminderLastUsed) {
    el.importReminderLastUsed.textContent = meta.lastImportAt
      ? `Last imported on this device: ${meta.lastImportFileName || "backup"} (${formatDateTime(meta.lastImportAt)}).`
      : "No previous import recorded on this device yet.";
  }
  if (el.globalSaveBtn) {
    el.globalSaveBtn.classList.toggle("dirty", dirty);
    el.globalSaveBtn.textContent = dirty ? "Save*" : "Save";
    const title = dirty ? "Export JSON Backup (changes since last backup)" : "Export JSON Backup";
    el.globalSaveBtn.title = title;
    el.globalSaveBtn.setAttribute("aria-label", title);
  }
}

function isSupportBannerDismissed() {
  try {
    return storageGet(SUPPORT_BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function hasSupportBannerShown() {
  try {
    return storageGet(SUPPORT_BANNER_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSupportBannerShown() {
  try {
    storageSet(SUPPORT_BANNER_SHOWN_KEY, "1");
  } catch {
    // Ignore storage errors; banner will simply be less persistent.
  }
}

function markSupportBannerDismissed() {
  try {
    storageSet(SUPPORT_BANNER_DISMISSED_KEY, "1");
  } catch {
    // Ignore storage errors; banner will simply be less persistent.
  }
}

function maybeQueueSupportBannerAfterMeaningfulAction(trigger = "save") {
  if (!uiState.appReady) return;
  if (isSupportBannerDismissed() || hasSupportBannerShown()) return;
  const activityCount = (state.activities || []).length;
  const costCount = (state.costItems || []).length;
  const paidCount = [...(state.activities || []), ...(state.costItems || [])].filter((item) => (Number(item.paidUsd) || 0) > 0).length;
  const reachedValueMoment =
    trigger === "export" || trigger === "print" || activityCount >= 5 || costCount >= 5 || paidCount >= 3;
  if (!reachedValueMoment) return;
  uiState.supportBannerQueued = true;
  renderSupportUi();
}

function renderSupportUi() {
  if (!el.supportBanner) return;
  const blockedByModal = uiState.importReminderOpen || uiState.dashboardDayModalOpen || uiState.aboutModalOpen;
  const shouldShow =
    uiState.appReady &&
    uiState.supportBannerQueued &&
    !blockedByModal &&
    !isSupportBannerDismissed() &&
    !hasSupportBannerShown();

  el.supportBanner.hidden = !shouldShow;
  uiState.supportBannerVisible = shouldShow;

  if (shouldShow) {
    markSupportBannerShown();
    uiState.supportBannerQueued = false;
  }
}

function dismissSupportBanner({ permanent = true } = {}) {
  if (permanent) {
    markSupportBannerDismissed();
  }
  uiState.supportBannerQueued = false;
  uiState.supportBannerVisible = false;
  if (el.supportBanner) el.supportBanner.hidden = true;
}

function getActiveModalElement() {
  if (uiState.appMenuOpen && el.appMenu && !el.appMenu.hidden) return el.appMenu;
  if (uiState.importReminderOpen && el.importReminderModal && !el.importReminderModal.hidden) return el.importReminderModal;
  if (uiState.aboutModalOpen && el.aboutModal && !el.aboutModal.hidden) return el.aboutModal;
  if (uiState.dashboardDayModalOpen && el.dashboardDayDetail && !el.dashboardDayDetail.hidden) return el.dashboardDayDetail;
  return null;
}

function focusModalPrimaryAction(modalEl) {
  if (!modalEl) return;
  const target = modalEl.querySelector(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (target instanceof HTMLElement) {
    target.focus({ preventScroll: true });
  }
}

function trapFocusInModal(event) {
  if (event.key !== "Tab") return false;
  const modalEl = getActiveModalElement();
  if (!modalEl) return false;
  const focusables = Array.from(
    modalEl.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((node) => node instanceof HTMLElement && !node.hidden && node.offsetParent !== null);
  if (!focusables.length) return false;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!(document.activeElement instanceof HTMLElement) || !modalEl.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return true;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

function syncAboutModal() {
  if (!el.aboutModal) return;
  el.aboutModal.hidden = !uiState.aboutModalOpen;
  syncBodyScrollLock();
}

function openAboutModal() {
  uiState.aboutModalOpen = true;
  syncAboutModal();
  renderSupportUi();
  requestAnimationFrame(() => focusModalPrimaryAction(el.aboutModal));
}

function closeAboutModal() {
  uiState.aboutModalOpen = false;
  syncAboutModal();
  renderSupportUi();
}

function handleFamilyPrefsChange() {
  familyPrefs.adults = Math.max(0, Number(el.familyAdults?.value) || 0);
  familyPrefs.children = Math.max(0, Number(el.familyChildren?.value) || 0);
  familyPrefs.splitByRole = Boolean(el.familySplitToggle?.checked);
  saveFamilyPrefs();
  state.settings.travelers = Math.max(1, familyPrefs.adults + familyPrefs.children || state.settings.travelers || 1);
  saveState();
  render();
}

function handleSettingsFamilyPrefsChange() {
  familyPrefs.adults = Math.max(0, Number(el.settingsAdults?.value) || 0);
  familyPrefs.children = Math.max(0, Number(el.settingsChildren?.value) || 0);
  saveFamilyPrefs();
  state.settings.travelers = Math.max(1, familyPrefs.adults + familyPrefs.children || state.settings.travelers || 1);
  saveState();
  render();
}

function syncFamilyPrefsFromTravelerCount(travelerCount) {
  const total = Math.max(1, Number(travelerCount) || 1);
  const currentAdults = Math.max(0, Number(familyPrefs.adults) || 0);
  const currentChildren = Math.max(0, Number(familyPrefs.children) || 0);

  if (currentAdults + currentChildren === total) return;

  // Preserve the current child count when possible, and adjust adults to match the new total.
  if (currentChildren > total) {
    familyPrefs.children = total;
    familyPrefs.adults = 0;
  } else {
    familyPrefs.children = currentChildren;
    familyPrefs.adults = total - currentChildren;
  }

  saveFamilyPrefs();
}

function startPlanningFromHero() {
  openSetupWizard({ step: 1, scroll: true });
}

function loadSampleTripFromOnboarding() {
  loadSampleTrip({ dismissOnboarding: true, targetTab: "dashboard", confirmReplace: true });
}

function startEmptyTripFromOnboarding() {
  state = buildEmptyState();
  storageSet(ONBOARDING_DISMISSED_KEY, "1");
  uiState.onboardingVisible = false;
  saveState();
  openSetupWizard({ step: 1, scroll: true });
}

function handleAboutModalClick(event) {
  if (event.target === el.aboutModal || event.target.dataset.modalClose === "about") {
    closeAboutModal();
    return;
  }
  if (event.target.closest("#aboutModalClose")) {
    closeAboutModal();
  }
}

function amountToCad(amount, currency = "USD") {
  const value = Number(amount) || 0;
  if (normalizeCurrency(currency) === "CAD") return value;
  const rate = Number(state.settings.usdToCadRate) || 0;
  return value * rate;
}

function toCad(usd) {
  return amountToCad(usd, "USD");
}

function clampPct(value) {
  return Math.max(0, Math.min(100, value));
}

function normalizeStatus(status) {
  return (
    {
      planned: "Planned",
      booked: "Booked",
      paid: "Paid",
      completed: "Completed",
    }[String(status || "").trim().toLowerCase()] || "Planned"
  );
}

function normalizeCurrency(currency) {
  return String(currency || "").trim().toUpperCase() === "CAD" ? "CAD" : "USD";
}

function normalizeCategory(category) {
  const raw = String(category || "").trim();
  if (!raw) return "Misc";
  const mapped =
    {
      transportation: "Transportation",
      lodging: "Lodging",
      food: "Food",
      activities: "Activities",
      "park passes": "Park Passes",
      "park pass": "Park Passes",
      shopping: "Shopping",
      misc: "Misc",
    }[raw.toLowerCase()];
  return mapped || raw;
}

function formatEnteredMoney(amount, currency) {
  return money(amount, normalizeCurrency(currency));
}

function getAllCategories() {
  const custom = Array.isArray(state.settings?.customCategories) ? state.settings.customCategories : [];
  return [...new Set([...BASE_CATEGORIES, ...custom.map(normalizeCategory)])];
}

function getCategorySelects() {
  return [el.activityInputs.category, el.costItemInputs.category, el.dashboardQuickActivityInputs.category].filter(Boolean);
}

function refreshCategorySelectOptions() {
  const categories = getAllCategories();
  getCategorySelects().forEach((select) => {
    const current = select.value;
    const options = [...categories];
    if (current && current !== "__add__" && !options.includes(current)) options.push(current);
    options.push("__add__");
    select.innerHTML = options
      .map((value) =>
        value === "__add__"
          ? `<option value="__add__">Add Category...</option>`
          : `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
      )
      .join("");
    if (current && options.includes(current)) select.value = current;
    if (!select.value || select.value === "__add__") select.value = select.dataset.lastValue || categories[0] || "Misc";
  });
}

function addCustomCategory(categoryName) {
  const normalized = normalizeCategory(categoryName);
  if (!normalized || BASE_CATEGORIES.includes(normalized)) return normalized;
  state.settings.customCategories ??= [];
  if (!state.settings.customCategories.includes(normalized)) {
    state.settings.customCategories.push(normalized);
  }
  return normalized;
}

function handleCategorySelectChange(event) {
  const select = event.target;
  if (!(select instanceof HTMLSelectElement)) return;
  if (select.value !== "__add__") {
    select.dataset.lastValue = select.value;
    return;
  }
  const newCategory = prompt("Add a new category:", "");
  if (newCategory === null) {
    refreshCategorySelectOptions();
    select.value = select.dataset.lastValue || "Misc";
    return;
  }
  const added = addCustomCategory(newCategory);
  saveState();
  refreshCategorySelectOptions();
  select.value = added || select.dataset.lastValue || "Misc";
  select.dataset.lastValue = select.value;
}

function dateLabel(dateStr, timeStr) {
  if (!dateStr) return "";
  const dt = new Date(`${dateStr}T${timeStr || "00:00"}`);
  if (Number.isNaN(dt.getTime())) return `${dateStr} ${timeStr || ""}`.trim();
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(dt);
}

function shortDate(dateStr) {
  if (!dateStr) return "TBD";
  const dt = new Date(`${dateStr}T00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

function buildActivityFromInputs(inputs) {
  return {
    id: makeId(),
    date: inputs.date.value,
    time: inputs.time.value,
    title: inputs.title.value.trim(),
    location: inputs.location.value.trim(),
    notes: (inputs.notes?.value || "").trim(),
    category: inputs.category.value,
    currency: normalizeCurrency(inputs.currency.value),
    plannedUsd: Number(inputs.plannedUsd.value) || 0,
    paidUsd: Number(inputs.paidUsd.value) || 0,
    status: inputs.status.value,
  };
}

function resetDashboardQuickForm({ preserveDate = true } = {}) {
  const inputs = el.dashboardQuickActivityInputs;
  const selectedDate = preserveDate ? uiState.dashboardSelectedDate || "" : "";
  el.dashboardQuickActivityForm.reset();
  inputs.date.value = selectedDate;
  inputs.mode.value = "add";
  inputs.editSource.value = "";
  inputs.editId.value = "";
  inputs.category.value = "Activities";
  inputs.currency.value = "USD";
  inputs.paidUsd.value = "0";
  inputs.status.value = "Planned";
  uiState.dashboardQuickEdit = null;
  el.dashboardQuickFormTitle.textContent = "Add Itinerary Item";
  el.dashboardQuickFormSubmit.textContent = "Add to Itinerary";
  el.dashboardQuickFormCancelEdit.hidden = true;
}

function resetActivityForm() {
  const inputs = el.activityInputs;
  el.activityForm.reset();
  el.activityForm.hidden = true;
  inputs.mode.value = "add";
  inputs.editId.value = "";
  inputs.status.value = "Planned";
  inputs.category.value = "Lodging";
  inputs.currency.value = "USD";
  inputs.paidUsd.value = "0";
  uiState.itineraryEditId = null;
  el.activityFormTitle.textContent = "Add Itinerary Item";
  el.activityFormSubmit.textContent = "Add Activity";
  el.activityFormCancelEdit.textContent = "Cancel";
  el.activityFormCancelEdit.hidden = true;
}

function setActivityFormEditMode(item, { placementType = "edit" } = {}) {
  const inputs = el.activityInputs;
  uiState.itineraryEditId = item.id;
  uiState.itineraryFormPlacement = { type: placementType, id: item.id };
  inputs.mode.value = "edit";
  inputs.editId.value = item.id;
  inputs.date.value = item.date || "";
  inputs.time.value = item.time || "";
  inputs.title.value = item.title || "";
  inputs.location.value = item.location || "";
  inputs.notes.value = item.notes || "";
  inputs.category.value = item.category || "Activities";
  inputs.currency.value = normalizeCurrency(item.currency || "USD");
  inputs.plannedUsd.value = String(Number(item.plannedUsd) || 0);
  inputs.paidUsd.value = String(Number(item.paidUsd) || 0);
  inputs.status.value = item.status || "Planned";
  el.activityFormTitle.textContent = "Edit Itinerary Item";
  el.activityFormSubmit.textContent = "Save Changes";
  el.activityFormCancelEdit.textContent = "Cancel Edit";
  el.activityFormCancelEdit.hidden = false;
}

function showItineraryNewItemForm() {
  uiState.itineraryFormPlacement = { type: "new" };
  resetActivityForm();
  uiState.itineraryFormPlacement = { type: "new" };
  el.activityFormCancelEdit.textContent = "Cancel";
  el.activityFormCancelEdit.hidden = false;
}

function showItineraryNewItemFormForDate(date) {
  uiState.itineraryFormPlacement = { type: "new-day", date: date || "" };
  resetActivityForm();
  uiState.itineraryFormPlacement = { type: "new-day", date: date || "" };
  if (el.activityInputs?.date && date) {
    el.activityInputs.date.value = date;
  }
  el.activityFormCancelEdit.textContent = "Cancel";
  el.activityFormCancelEdit.hidden = false;
}

function showItineraryNewItemFormInWizard() {
  uiState.itineraryFormPlacement = { type: "wizard-new" };
  resetActivityForm();
  uiState.itineraryFormPlacement = { type: "wizard-new" };
  el.activityFormCancelEdit.textContent = "Cancel";
  el.activityFormCancelEdit.hidden = false;
}

function hideItineraryInlineForm() {
  uiState.itineraryFormPlacement = null;
  uiState.itineraryEditId = null;
  if (el.activityForm) el.activityForm.hidden = true;
}

function mountItineraryFormInline() {
  const form = el.activityForm;
  const list = el.itineraryList;
  const composer = el.itineraryComposer;
  if (!form || !list || !composer) return;
  const placement = uiState.itineraryFormPlacement;
  if (!placement) {
    form.hidden = true;
    return;
  }

  let slot = null;
  if (placement.type === "new") {
    slot = composer.querySelector('[data-inline-slot="new"]');
  } else if (placement.type === "wizard-new") {
    slot = el.setupWizardCard?.querySelector('[data-inline-slot="wizard-itinerary-new"]') || null;
  } else if (placement.type === "new-day" && placement.date) {
    slot = list.querySelector(`[data-inline-slot="day-new"][data-date="${placement.date}"]`);
  } else if (placement.type === "edit-cost-hub" && placement.id) {
    slot = el.costsList?.querySelector(`[data-inline-slot="cost-hub-activity-edit"][data-item-id="${placement.id}"]`) || null;
  } else if (placement.type === "edit" && placement.id) {
    slot = list.querySelector(`[data-inline-slot="edit"][data-item-id="${placement.id}"]`);
  }
  if (!slot) {
    form.hidden = true;
    return;
  }
  slot.appendChild(form);
  form.hidden = false;
}

function getItineraryPlannerDays(summary) {
  const byDate = new Map();
  (summary.activities || []).forEach((item) => {
    if (!item.date) return;
    if (!byDate.has(item.date)) byDate.set(item.date, []);
    byDate.get(item.date).push(item);
  });

  const sortByTimeThenTitle = (a, b) => `${a.time || ""} ${a.title || ""}`.localeCompare(`${b.time || ""} ${b.title || ""}`);
  byDate.forEach((items) => items.sort(sortByTimeThenTitle));

  const tripStart = parseDateOnly(state.settings.startDate);
  const tripEnd = parseDateOnly(state.settings.endDate);
  const hasTripRange = Boolean(tripStart && tripEnd && tripEnd >= tripStart);
  const dayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
  const fullFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });

  const days = [];
  if (hasTripRange) {
    for (let d = new Date(tripStart); d <= tripEnd; d = addDays(d, 1)) {
      const key = formatDateInput(d);
      days.push({
        key,
        shortLabel: dayFmt.format(d),
        fullLabel: fullFmt.format(d),
        items: byDate.get(key) || [],
      });
    }
  } else {
    Array.from(byDate.keys())
      .sort()
      .forEach((key) => {
        const d = parseDateOnly(key);
        days.push({
          key,
          shortLabel: d ? dayFmt.format(d) : key,
          fullLabel: d ? fullFmt.format(d) : key,
          items: byDate.get(key) || [],
        });
      });
  }

  const unscheduled = (summary.activities || [])
    .filter((item) => !item.date)
    .sort(sortByTimeThenTitle);

  return { days, unscheduled, hasTripRange };
}

function renderItineraryList(summary) {
  if (!el.itineraryComposer || !el.itineraryList) return;

  el.itineraryComposer.innerHTML = `
    <div class="day-detail-new itinerary-new">
      <div class="day-detail-new-head">
        <strong>New Itinerary Item</strong>
        <button type="button" class="icon-btn" data-action="showItineraryNewItem">Add New Item</button>
      </div>
      <div class="day-detail-inline-slot" data-inline-slot="new"></div>
    </div>
  `;

  const planner = getItineraryPlannerDays(summary);
  const hasPlannerContent = planner.days.length || planner.unscheduled.length;

  const renderPlannerItem = (item) => {
    const isEditing = uiState.itineraryFormPlacement?.type === "edit" && uiState.itineraryEditId === item.id;
    return `
      <div class="itinerary-row">
        <details class="itinerary-plan-item"${isEditing ? " open" : ""}>
          <summary class="itinerary-plan-summary">
            <span class="itinerary-plan-time">${escapeHtml(item.time || "--:--")}</span>
            <span class="itinerary-plan-title">${escapeHtml(item.title)}</span>
            <span class="itinerary-plan-status status-pill status-${item.status}">${item.status}</span>
          </summary>
          <div class="itinerary-plan-body">
            <div class="itinerary-plan-meta muted">
              <span>${escapeHtml(item.location || "Location TBD")}</span>
              <span>${escapeHtml(item.category)}</span>
              <span>${normalizeCurrency(item.currency)}</span>
            </div>
            ${item.notes ? `<p class="itinerary-plan-notes muted">${escapeHtml(item.notes)}</p>` : ""}
            <div class="itinerary-plan-costs">
              <span><strong>Forecast:</strong> ${formatEnteredMoney(item.plannedUsd, item.currency)}</span>
              <span class="muted">(${money(amountToCad(item.plannedUsd, item.currency), "CAD")})</span>
              <span><strong>Paid:</strong> ${formatEnteredMoney(item.paidUsd, item.currency)}</span>
              <span class="muted">(${money(amountToCad(item.paidUsd, item.currency), "CAD")})</span>
            </div>
            <div class="itinerary-card-actions itinerary-plan-actions">
              <button class="icon-btn" data-action="itineraryEditInline" data-id="${item.id}">Edit</button>
              <button class="icon-btn" data-action="markPaid" data-id="${item.id}">Mark Paid</button>
              <button class="icon-btn danger" data-action="delete" data-id="${item.id}">Delete</button>
            </div>
          </div>
        </details>
        <div class="day-detail-inline-slot" data-inline-slot="edit" data-item-id="${item.id}"></div>
      </div>
    `;
  };

  const dayBlocks = planner.days
    .map(
      (day) => `
        <section class="itinerary-day-block">
          <div class="itinerary-day-head">
            <div>
              <h4>${escapeHtml(day.shortLabel)}</h4>
              <p class="muted small-copy">${escapeHtml(day.fullLabel)}</p>
            </div>
            <div class="itinerary-day-head-actions">
              <span class="itinerary-day-count">${day.items.length} item${day.items.length === 1 ? "" : "s"}</span>
              <button type="button" class="icon-btn itinerary-day-add-btn" data-action="showItineraryNewItemForDay" data-date="${day.key}" aria-label="Add itinerary item for ${escapeHtml(day.fullLabel)}" title="Add item for this day">+</button>
            </div>
          </div>
          <div class="itinerary-day-body">
            ${
              day.items.length
                ? day.items.map(renderPlannerItem).join("")
                : `<div class="itinerary-day-empty muted">No activities planned yet.</div>`
            }
            <div class="day-detail-inline-slot" data-inline-slot="day-new" data-date="${day.key}"></div>
          </div>
        </section>
      `
    )
    .join("");

  const unscheduledBlock = planner.unscheduled.length
    ? `
      <section class="itinerary-day-block itinerary-day-block-unscheduled">
        <div class="itinerary-day-head">
          <div>
            <h4>Unscheduled</h4>
            <p class="muted small-copy">Items without a date</p>
          </div>
          <span class="itinerary-day-count">${planner.unscheduled.length} item${planner.unscheduled.length === 1 ? "" : "s"}</span>
        </div>
        <div class="itinerary-day-body">
          ${planner.unscheduled.map(renderPlannerItem).join("")}
        </div>
      </section>
    `
    : "";

  el.itineraryList.innerHTML = hasPlannerContent
    ? `
      ${
        planner.hasTripRange
          ? ""
          : `<p class="muted small-copy itinerary-planner-note">Set trip start and end dates in Settings to view every day of your trip.</p>`
      }
      ${dayBlocks}
      ${unscheduledBlock}
    `
    : renderActionEmptyState({
        title: "No itinerary items yet",
        body: "Add your first activity to start planning your trip timeline.",
        actionPrefix: "itineraryEmpty",
      });

  if (
    (uiState.itineraryFormPlacement?.type === "edit" || uiState.itineraryFormPlacement?.type === "edit-cost-hub") &&
    uiState.itineraryEditId
  ) {
    const active = summary.activities.find((item) => item.id === uiState.itineraryEditId);
    if (active) {
      setActivityFormEditMode(active, { placementType: uiState.itineraryFormPlacement.type });
    } else {
      resetActivityForm();
      uiState.itineraryFormPlacement = null;
    }
  } else if (uiState.itineraryFormPlacement?.type === "new") {
    resetActivityForm();
    uiState.itineraryFormPlacement = { type: "new" };
    el.activityFormCancelEdit.textContent = "Cancel";
    el.activityFormCancelEdit.hidden = false;
  } else if (uiState.itineraryFormPlacement?.type === "wizard-new") {
    resetActivityForm();
    uiState.itineraryFormPlacement = { type: "wizard-new" };
    el.activityFormCancelEdit.textContent = "Cancel";
    el.activityFormCancelEdit.hidden = false;
  } else if (uiState.itineraryFormPlacement?.type === "new-day") {
    const targetDate = uiState.itineraryFormPlacement.date || "";
    resetActivityForm();
    uiState.itineraryFormPlacement = { type: "new-day", date: targetDate };
    if (el.activityInputs?.date && targetDate) {
      el.activityInputs.date.value = targetDate;
    }
    el.activityFormCancelEdit.textContent = "Cancel";
    el.activityFormCancelEdit.hidden = false;
  } else {
    hideItineraryInlineForm();
  }

  mountItineraryFormInline();
}

function resetCostItemForm() {
  const inputs = el.costItemInputs;
  el.costItemForm.reset();
  el.costItemForm.hidden = true;
  inputs.mode.value = "add";
  inputs.editId.value = "";
  inputs.category.value = "Transportation";
  inputs.currency.value = "USD";
  inputs.paidUsd.value = "0";
  inputs.itineraryStatus.value = "Planned";
  uiState.costItemEditId = null;
  uiState.costFormPlacement = null;
  el.costItemFormTitle.textContent = "Add Cost Item";
  el.costItemFormSubmit.textContent = "Add Cost Item";
  el.costItemFormCancelEdit.textContent = "Cancel";
  el.costItemFormCancelEdit.hidden = true;
}

function setCostItemFormEditMode(item) {
  const inputs = el.costItemInputs;
  uiState.costItemEditId = item.id;
  uiState.costFormPlacement = { type: "edit", id: item.id };
  inputs.mode.value = "edit";
  inputs.editId.value = item.id;
  inputs.title.value = item.title || "";
  inputs.category.value = item.category || "Misc";
  inputs.notes.value = item.notes || "";
  inputs.currency.value = normalizeCurrency(item.currency || "USD");
  inputs.plannedUsd.value = String(Number(item.plannedUsd) || 0);
  inputs.paidUsd.value = String(Number(item.paidUsd) || 0);
  inputs.includeInItinerary.checked = Boolean(item.includeInItinerary);
  inputs.itineraryDate.value = item.itineraryDate || "";
  inputs.itineraryTime.value = item.itineraryTime || "";
  inputs.itineraryLocation.value = item.itineraryLocation || "";
  inputs.itineraryStatus.value = item.itineraryStatus || "Planned";
  el.costItemFormTitle.textContent = "Edit Cost Item";
  el.costItemFormSubmit.textContent = "Save Changes";
  el.costItemFormCancelEdit.textContent = "Cancel Edit";
  el.costItemFormCancelEdit.hidden = false;
}

function showCostNewItemForm() {
  uiState.costFormPlacement = { type: "new" };
  resetCostItemForm();
  uiState.costFormPlacement = { type: "new" };
  el.costItemFormCancelEdit.textContent = "Cancel";
  el.costItemFormCancelEdit.hidden = false;
}

function showCostNewItemFormInWizard() {
  uiState.costFormPlacement = { type: "wizard-new" };
  resetCostItemForm();
  uiState.costFormPlacement = { type: "wizard-new" };
  el.costItemFormCancelEdit.textContent = "Cancel";
  el.costItemFormCancelEdit.hidden = false;
}

function hideCostInlineForm() {
  uiState.costFormPlacement = null;
  uiState.costItemEditId = null;
  if (el.costItemForm) el.costItemForm.hidden = true;
}

function mountCostFormInline() {
  const form = el.costItemForm;
  const list = el.costsList;
  const composer = el.costsComposer;
  if (!form || !list || !composer) return;
  const placement = uiState.costFormPlacement;
  if (!placement) {
    form.hidden = true;
    return;
  }
  let slot = null;
  if (placement.type === "new") {
    slot = composer.querySelector('[data-inline-slot="new"]');
  } else if (placement.type === "wizard-new") {
    slot = el.setupWizardCard?.querySelector('[data-inline-slot="wizard-cost-new"]') || null;
  } else if (placement.type === "edit" && placement.id) {
    slot = list.querySelector(`[data-inline-slot="edit"][data-item-id="${placement.id}"]`);
  }
  if (!slot) {
    form.hidden = true;
    return;
  }
  slot.appendChild(form);
  form.hidden = false;
}

function getCostHubGroups(summary) {
  const itineraryEntries = [];
  const generalEntries = [];

  (summary.activities || []).forEach((item) => {
    itineraryEntries.push({
      kind: "activity",
      id: item.id,
      title: item.title,
      category: item.category,
      currency: normalizeCurrency(item.currency),
      plannedUsd: Number(item.plannedUsd) || 0,
      paidUsd: Number(item.paidUsd) || 0,
      status: item.status || "Planned",
      date: item.date || "",
      time: item.time || "",
      location: item.location || "",
      notes: item.notes || "",
      sourceLabel: "Itinerary activity",
    });
  });

  (summary.costItems || []).forEach((item) => {
    const base = {
      kind: "costItem",
      id: item.id,
      title: item.title,
      category: item.category,
      currency: normalizeCurrency(item.currency),
      plannedUsd: Number(item.plannedUsd) || 0,
      paidUsd: Number(item.paidUsd) || 0,
      status: item.includeInItinerary ? item.itineraryStatus || "Planned" : "Cost",
      date: item.includeInItinerary ? item.itineraryDate || "" : "",
      time: item.includeInItinerary ? item.itineraryTime || "" : "",
      location: item.includeInItinerary ? item.itineraryLocation || "" : "",
      notes: item.notes || "",
      sourceLabel: item.includeInItinerary ? "Itinerary-linked cost" : "General cost",
      includeInItinerary: Boolean(item.includeInItinerary),
    };
    if (item.includeInItinerary) {
      itineraryEntries.push(base);
    } else {
      generalEntries.push(base);
    }
  });

  const sortBySchedule = (a, b) => {
    const aKey = `${a.date || "9999-12-31"}T${a.time || "23:59"} ${a.title || ""}`;
    const bKey = `${b.date || "9999-12-31"}T${b.time || "23:59"} ${b.title || ""}`;
    return aKey.localeCompare(bKey);
  };
  itineraryEntries.sort(sortBySchedule);
  generalEntries.sort((a, b) => `${a.category || ""} ${a.title || ""}`.localeCompare(`${b.category || ""} ${b.title || ""}`));

  return { itineraryEntries, generalEntries };
}

function renderCostsList(summary) {
  if (!el.costsComposer || !el.costsList) return;
  el.costsComposer.innerHTML = `
    <div class="day-detail-new itinerary-new">
      <div class="day-detail-new-head">
        <strong>New Cost Item</strong>
        <button type="button" class="icon-btn" data-action="showCostNewItem">Add New Cost</button>
      </div>
      <div class="day-detail-inline-slot" data-inline-slot="new"></div>
    </div>
  `;

  const groups = getCostHubGroups(summary);
  const totalItems = groups.itineraryEntries.length + groups.generalEntries.length;
  const outstandingCad = Math.max(0, summary.plannedCad - summary.paidCad);

  const renderCostHubEntry = (entry) => {
    const isCostItem = entry.kind === "costItem";
    const isEditing = isCostItem && uiState.costFormPlacement?.type === "edit" && uiState.costItemEditId === entry.id;
    const scheduleMeta = entry.date
      ? `${shortDate(entry.date)}${entry.time ? ` • ${entry.time}` : ""}${entry.location ? ` • ${entry.location}` : ""}`
      : entry.location || "No date/time assigned";
    return `
      <div class="cost-hub-row">
        <details class="cost-hub-item"${isEditing ? " open" : ""}>
          <summary class="cost-hub-summary">
            <span class="cost-hub-title-wrap">
              <span class="cost-hub-title">${escapeHtml(entry.title)}</span>
              <span class="cost-hub-sub muted">${escapeHtml(entry.sourceLabel)} • ${escapeHtml(entry.category || "Misc")}</span>
            </span>
            <span class="cost-hub-amounts">
              <span class="cost-hub-forecast">${moneyDisplayFromCad(amountToCad(entry.plannedUsd, entry.currency))}</span>
              <span class="cost-hub-paid muted">${moneyDisplayFromCad(amountToCad(entry.paidUsd, entry.currency))} paid</span>
            </span>
          </summary>
          <div class="cost-hub-body">
            <div class="cost-hub-meta muted">
              <span>${escapeHtml(scheduleMeta)}</span>
              <span>${normalizeCurrency(entry.currency)}</span>
              <span>${escapeHtml(entry.status || "Planned")}</span>
            </div>
            ${entry.notes ? `<p class="cost-hub-notes muted">${escapeHtml(entry.notes)}</p>` : ""}
            <div class="cost-hub-detail-grid">
              <div><strong>Forecast</strong><span>${formatEnteredMoney(entry.plannedUsd, entry.currency)}</span></div>
              <div><strong>Paid</strong><span>${formatEnteredMoney(entry.paidUsd, entry.currency)}</span></div>
              <div><strong>Forecast (CAD)</strong><span>${money(amountToCad(entry.plannedUsd, entry.currency), "CAD")}</span></div>
              <div><strong>Paid (CAD)</strong><span>${money(amountToCad(entry.paidUsd, entry.currency), "CAD")}</span></div>
            </div>
            <div class="itinerary-card-actions cost-hub-actions">
              ${
                isCostItem
                  ? `
                    <button class="icon-btn" data-action="costEditInline" data-id="${entry.id}">Edit</button>
                    <button class="icon-btn" data-action="markCostItemPaid" data-id="${entry.id}">Mark Paid</button>
                    <button class="icon-btn danger" data-action="deleteCostItem" data-id="${entry.id}">Delete</button>
                  `
                  : `
                    <button class="icon-btn" data-action="costHubEditActivity" data-id="${entry.id}">Edit</button>
                    <button class="icon-btn" data-action="markPaid" data-id="${entry.id}">Mark Paid</button>
                    <button class="icon-btn danger" data-action="delete" data-id="${entry.id}">Delete</button>
                  `
              }
            </div>
          </div>
        </details>
        ${
          isCostItem
            ? `<div class="day-detail-inline-slot" data-inline-slot="edit" data-item-id="${entry.id}"></div>`
            : `<div class="day-detail-inline-slot" data-inline-slot="cost-hub-activity-edit" data-item-id="${entry.id}"></div>`
        }
      </div>
    `;
  };

  const renderGroupSection = ({ title, subtitle, entries, emptyText }) => `
    <section class="cost-hub-group">
      <div class="cost-hub-group-head">
        <div>
          <h4>${escapeHtml(title)}</h4>
          <p class="muted small-copy">${escapeHtml(subtitle)}</p>
        </div>
        <span class="cost-hub-count">${entries.length} item${entries.length === 1 ? "" : "s"}</span>
      </div>
      <div class="cost-hub-group-body">
        ${entries.length ? entries.map(renderCostHubEntry).join("") : `<div class="itinerary-day-empty muted">${escapeHtml(emptyText)}</div>`}
      </div>
    </section>
  `;

  el.costsList.innerHTML = totalItems
    ? `
      <section class="cost-hub-summary-card">
        <div class="cost-hub-summary-grid">
          <div class="cost-hub-stat"><span class="label">Forecast</span><strong>${moneyDisplayRoundedFromCad(summary.plannedCad)}</strong></div>
          <div class="cost-hub-stat"><span class="label">Paid</span><strong>${moneyDisplayRoundedFromCad(summary.paidCad)}</strong></div>
          <div class="cost-hub-stat"><span class="label">Left to pay</span><strong>${moneyDisplayRoundedFromCad(outstandingCad)}</strong></div>
          <div class="cost-hub-stat"><span class="label">Tracked items</span><strong>${totalItems}</strong></div>
        </div>
      </section>
      ${renderGroupSection({
        title: "Itenary and Activity Costs",
        subtitle: "Scheduled activities and itinerary-linked costs",
        entries: groups.itineraryEntries,
        emptyText: "No itinerary-linked costs yet.",
      })}
      ${renderGroupSection({
        title: "General Costs",
        subtitle: "Shared trip costs not attached to a day",
        entries: groups.generalEntries,
        emptyText: "No general costs yet. Add one to track shared expenses.",
      })}
    `
    : renderActionEmptyState({
        title: "No cost items yet",
        body: "Add your first cost to start tracking forecast and paid totals.",
        actionPrefix: "budgetEmpty",
      });

  if (uiState.costFormPlacement?.type === "edit" && uiState.costItemEditId) {
    const active = summary.costItems.find((item) => item.id === uiState.costItemEditId);
    if (active) {
      setCostItemFormEditMode(active);
    } else {
      resetCostItemForm();
      uiState.costFormPlacement = null;
    }
  } else if (uiState.costFormPlacement?.type === "new") {
    resetCostItemForm();
    uiState.costFormPlacement = { type: "new" };
    el.costItemFormCancelEdit.textContent = "Cancel";
    el.costItemFormCancelEdit.hidden = false;
  } else if (uiState.costFormPlacement?.type === "wizard-new") {
    resetCostItemForm();
    uiState.costFormPlacement = { type: "wizard-new" };
    el.costItemFormCancelEdit.textContent = "Cancel";
    el.costItemFormCancelEdit.hidden = false;
  } else {
    hideCostInlineForm();
  }

  mountCostFormInline();
  if (uiState.itineraryFormPlacement?.type === "edit-cost-hub") {
    mountItineraryFormInline();
  }
}

function setDashboardQuickFormEditMode(entry) {
  const inputs = el.dashboardQuickActivityInputs;
  uiState.dashboardQuickEdit = { source: entry.source, id: entry.id };
  uiState.dashboardQuickPlacement = { type: "edit", source: entry.source, id: entry.id };
  inputs.mode.value = "edit";
  inputs.editSource.value = entry.source;
  inputs.editId.value = entry.id;
  inputs.date.value = uiState.dashboardSelectedDate || entry.date || "";
  inputs.time.value = entry.time || "";
  inputs.title.value = entry.title || "";
  inputs.location.value = entry.location || "";
  inputs.notes.value = entry.notes || "";
  inputs.category.value = entry.category || "Activities";
  inputs.currency.value = normalizeCurrency(entry.currency || "USD");
  inputs.plannedUsd.value = String(Number(entry.plannedUsd) || 0);
  inputs.paidUsd.value = String(Number(entry.paidUsd) || 0);
  inputs.status.value = entry.status || "Planned";
  el.dashboardQuickFormTitle.textContent = `Edit ${entry.source === "costItem" ? "Cost Item" : "Itinerary Item"}`;
  el.dashboardQuickFormSubmit.textContent = "Save Changes";
  el.dashboardQuickFormCancelEdit.hidden = false;
}

function showDashboardQuickNewItemForm() {
  uiState.dashboardQuickPlacement = { type: "new" };
  resetDashboardQuickForm({ preserveDate: true });
  uiState.dashboardQuickPlacement = { type: "new" };
}

function hideDashboardQuickInlineForm() {
  uiState.dashboardQuickPlacement = null;
  uiState.dashboardQuickEdit = null;
  el.dashboardQuickActivityForm.hidden = true;
}

function mountDashboardQuickFormInline() {
  const form = el.dashboardQuickActivityForm;
  const composer = el.dashboardDayDetailComposer;
  const list = el.dashboardDayDetailList;
  if (!form || !composer || !list) return;

  const placement = uiState.dashboardQuickPlacement;
  if (!uiState.dashboardDayModalOpen || !uiState.dashboardSelectedDate || !placement) {
    form.hidden = true;
    return;
  }

  let slot = null;
  if (placement.type === "new") {
    slot = composer.querySelector('[data-inline-slot="new"]');
  } else if (placement.type === "edit" && placement.source && placement.id) {
    slot = list.querySelector(
      `[data-inline-slot="edit"][data-source="${placement.source}"][data-item-id="${placement.id}"]`
    );
  }

  if (!slot) {
    form.hidden = true;
    return;
  }

  slot.appendChild(form);
  form.hidden = false;
  form.classList.remove("disabled");
}

function daysBetweenInclusive(start, end) {
  if (!start || !end) return null;
  const s = new Date(`${start}T00:00`);
  const e = new Date(`${end}T00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  const diff = Math.round((e - s) / 86400000) + 1;
  return diff > 0 ? diff : null;
}

function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getDashboardTimelineRange(summary) {
  const tripStart = parseDateOnly(state.settings.startDate);
  const tripEnd = parseDateOnly(state.settings.endDate);

  if (tripStart && tripEnd && tripEnd >= tripStart) {
    const cappedEnd = addDays(tripStart, 13);
    return {
      start: tripStart,
      end: tripEnd < cappedEnd ? tripEnd : cappedEnd,
      constrainedToTrip: true,
      wasCapped: tripEnd > cappedEnd,
    };
  }

  const datedEntries = summary.itineraryEntries
    .map((e) => parseDateOnly(e.date))
    .filter(Boolean)
    .sort((a, b) => a - b);
  if (!datedEntries.length) return null;

  const start = datedEntries[0];
  const capEnd = addDays(start, 13);
  const actualEnd = datedEntries[datedEntries.length - 1];
  return {
    start,
    end: actualEnd < capEnd ? actualEnd : capEnd,
    constrainedToTrip: false,
    wasCapped: actualEnd > capEnd,
  };
}

function renderCompactDashboardTimeline(summary) {
  const range = getDashboardTimelineRange(summary);
  if (!range) {
    el.dashboardTimelineRange.textContent = "Set trip dates and add itinerary items to see the timeline.";
    el.dashboardItinerary.innerHTML = `<p class="muted">No itinerary items yet.</p>`;
    uiState.dashboardSelectedDate = null;
    uiState.dashboardDayModalOpen = false;
    renderDashboardDayDetail(summary);
    return;
  }

  const days = [];
  for (let d = new Date(range.start); d <= range.end; d = addDays(d, 1)) {
    days.push(new Date(d));
  }
  const dayKeys = new Set(days.map((d) => formatDateInput(d)));
  const byDay = new Map(days.map((d) => [formatDateInput(d), []]));

  const unscheduled = [];
  let outOfRangeCount = 0;
  summary.itineraryEntries.forEach((item) => {
    if (!item.date) {
      unscheduled.push(item);
      return;
    }
    if (dayKeys.has(item.date)) {
      byDay.get(item.date).push(item);
    } else {
      outOfRangeCount += 1;
    }
  });

  byDay.forEach((items) => {
    items.sort((a, b) => `${a.time || ""}${a.title}`.localeCompare(`${b.time || ""}${b.title}`));
  });

  const dayShortFmt = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const monthDayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const dateLabelFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  el.dashboardTimelineRange.textContent = `${dateLabelFmt.format(range.start)} - ${dateLabelFmt.format(range.end)}${
    range.wasCapped ? " (first 14 days shown)" : ""
  }${outOfRangeCount ? ` • ${outOfRangeCount} item${outOfRangeCount === 1 ? "" : "s"} outside range` : ""}`;

  if (uiState.dashboardSelectedDate && !dayKeys.has(uiState.dashboardSelectedDate)) {
    uiState.dashboardSelectedDate = null;
    uiState.dashboardDayModalOpen = false;
  }

  let inRangeCount = 0;
  const dayColumns = days
    .map((date) => {
      const key = formatDateInput(date);
      const items = byDay.get(key) || [];
      inRangeCount += items.length;
      const markers = items
        .slice(0, 2)
        .map((item) => {
          const tooltip = [
            item.title,
            item.time ? `Time: ${item.time}` : "Time: Unscheduled",
            `Category: ${item.category}`,
            `Status: ${item.status}`,
            `Forecast: ${formatEnteredMoney(item.plannedUsd, item.currency)} (${money(amountToCad(item.plannedUsd, item.currency), "CAD")})`,
            `Paid: ${formatEnteredMoney(item.paidUsd, item.currency)} (${money(amountToCad(item.paidUsd, item.currency), "CAD")})`,
            item.location ? `Location: ${item.location}` : "",
            item.notes ? `Notes: ${item.notes}` : "",
            item.source === "costItem" ? "Cost Item" : "Activity",
          ]
            .filter(Boolean)
            .join(" • ");
          const shortTitle = escapeHtml(item.title.length > 22 ? `${item.title.slice(0, 22)}...` : item.title);
          return `
            <button type="button" class="timeline-pill ${item.source}" data-tooltip="${escapeHtml(tooltip)}" aria-label="${escapeHtml(item.title)}">
              <span class="timeline-pill-text">${shortTitle}</span>
            </button>
          `;
        })
        .join("");

      const overflow = items.length > 2 ? `<div class="timeline-overflow">+${items.length - 2} more</div>` : "";
      const selectedClass = uiState.dashboardSelectedDate === key ? " selected" : "";
      return `
        <div class="timeline-day${selectedClass}" data-date="${key}" role="button" tabindex="0" aria-pressed="${uiState.dashboardSelectedDate === key}">
          <div class="timeline-day-head">
            <strong>${dayShortFmt.format(date)} • ${monthDayFmt.format(date)}</strong>
          </div>
          <div class="timeline-marker-row">${markers || '<span class="timeline-empty">-</span>'}${overflow}</div>
        </div>
      `;
    })
    .join("");

  const unscheduledHtml = unscheduled.length
    ? `<div class="timeline-unscheduled muted">Unscheduled: ${unscheduled.length} item${unscheduled.length === 1 ? "" : "s"}</div>`
    : "";

  if (!inRangeCount && (outOfRangeCount || unscheduled.length)) {
    uiState.dashboardSelectedDate = null;
    uiState.dashboardDayModalOpen = false;
    el.dashboardItinerary.innerHTML = `
      <div class="timeline-empty-state">
        <p class="muted">No itinerary items fall within the selected trip dates.</p>
        <p class="muted small-copy">Update trip start/end dates in Settings, or edit itinerary item dates.</p>
      </div>
      ${unscheduledHtml}
    `;
    renderDashboardDayDetail(summary);
    return;
  }

  el.dashboardItinerary.innerHTML = `
    <div class="timeline-strip">${dayColumns}</div>
    ${unscheduledHtml}
  `;
  renderDashboardDayDetail(summary);
}

function renderDashboardDayDetail(summary) {
  const selectedDate = uiState.dashboardSelectedDate;
  const inputs = el.dashboardQuickActivityInputs;
  if (!selectedDate || !uiState.dashboardDayModalOpen) {
    el.dashboardDayDetail.hidden = true;
    el.dashboardDayDetailTitle.textContent = "Select a Day";
    el.dashboardDayDetailMeta.textContent = "Click a day in the timeline to view items and add a new itinerary item.";
    el.dashboardDayDetailList.innerHTML = "";
    el.dashboardDayDetailComposer.innerHTML = "";
    el.dashboardQuickActivityForm.classList.add("disabled");
    resetDashboardQuickForm({ preserveDate: false });
    hideDashboardQuickInlineForm();
    return;
  }
  el.dashboardDayDetail.hidden = false;

  const items = summary.itineraryEntries
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => `${a.time || ""}${a.title}`.localeCompare(`${b.time || ""}${b.title}`));

  el.dashboardDayDetailTitle.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${selectedDate}T00:00`));
  el.dashboardDayDetailMeta.textContent = `${items.length} item${items.length === 1 ? "" : "s"} scheduled`;
  el.dashboardDayDetailList.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <div class="day-detail-row">
              <div class="day-detail-item">
                <div class="day-detail-main">
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${item.time || "--:--"} • ${escapeHtml(item.category)} • ${escapeHtml(item.status)}${item.source === "costItem" ? " • Cost Item" : ""}</span>
                  <span class="muted">${escapeHtml(item.location || "Location TBD")}</span>
                  ${item.notes ? `<span class="muted">${escapeHtml(item.notes)}</span>` : ""}
                </div>
                <div class="day-detail-cost">
                  <strong>${money(amountToCad(item.plannedUsd, item.currency), "CAD")}</strong>
                  <span class="muted">${money(amountToCad(item.paidUsd, item.currency), "CAD")} paid</span>
                  <button type="button" class="icon-btn" data-action="editDashboardItem" data-source="${item.source}" data-id="${item.id}">Edit</button>
                </div>
              </div>
              <div class="day-detail-inline-slot" data-inline-slot="edit" data-source="${item.source}" data-item-id="${item.id}"></div>
            </div>
          `
        )
        .join("")
    : `<p class="muted">No items for this day yet. Add one below.</p>`;

  el.dashboardDayDetailComposer.innerHTML = `
    <div class="day-detail-new">
      <div class="day-detail-new-head">
        <strong>New Item</strong>
        <button type="button" class="icon-btn" data-action="showDashboardNewItem">Add New Item</button>
      </div>
      <div class="day-detail-inline-slot" data-inline-slot="new"></div>
    </div>
  `;

  if (uiState.dashboardQuickPlacement?.type === "edit" && uiState.dashboardQuickEdit) {
    const active = items.find((item) => item.id === uiState.dashboardQuickEdit.id && item.source === uiState.dashboardQuickEdit.source);
    if (active) {
      setDashboardQuickFormEditMode(active);
    } else {
      resetDashboardQuickForm({ preserveDate: true });
      uiState.dashboardQuickPlacement = null;
    }
  } else if (uiState.dashboardQuickPlacement?.type === "new") {
    resetDashboardQuickForm({ preserveDate: true });
    uiState.dashboardQuickPlacement = { type: "new" };
  } else {
    hideDashboardQuickInlineForm();
  }

  mountDashboardQuickFormInline();
}

function getSortedActivities() {
  return [...state.activities].sort((a, b) => {
    const aKey = `${a.date || ""}T${a.time || ""}`;
    const bKey = `${b.date || ""}T${b.time || ""}`;
    return aKey.localeCompare(bKey);
  });
}

function getItineraryEntries(activities, costItems) {
  const activityEntries = activities.map((item) => ({
    source: "activity",
    id: item.id,
    date: item.date || "",
    time: item.time || "",
    title: item.title,
    location: item.location || "",
    notes: item.notes || "",
    category: item.category,
    currency: normalizeCurrency(item.currency),
    status: item.status,
    plannedUsd: Number(item.plannedUsd) || 0,
    paidUsd: Number(item.paidUsd) || 0,
  }));

  const costEntries = costItems
    .filter((item) => item.includeInItinerary)
    .map((item) => ({
      source: "costItem",
      id: item.id,
      date: item.itineraryDate || "",
      time: item.itineraryTime || "",
      title: item.title,
      location: item.itineraryLocation || "",
      notes: item.notes || "",
      category: item.category,
      currency: normalizeCurrency(item.currency),
      status: item.itineraryStatus || "Planned",
      plannedUsd: Number(item.plannedUsd) || 0,
      paidUsd: Number(item.paidUsd) || 0,
    }));

  return [...activityEntries, ...costEntries].sort((a, b) => {
    const aKey = `${a.date || "9999-12-31"}T${a.time || "23:59"}`;
    const bKey = `${b.date || "9999-12-31"}T${b.time || "23:59"}`;
    return aKey.localeCompare(bKey);
  });
}

function calculateSummary() {
  const activities = getSortedActivities();
  const costItems = Array.isArray(state.costItems) ? state.costItems : [];
  const itineraryEntries = getItineraryEntries(activities, costItems);
  const allCosts = [
    ...activities.map((item) => ({ ...item, source: "activity" })),
    ...costItems.map((item) => ({ ...item, source: "costItem" })),
  ];

  const totals = allCosts.reduce(
    (acc, item) => {
      const planned = Number(item.plannedUsd) || 0;
      const paid = Number(item.paidUsd) || 0;
      const plannedCadValue = amountToCad(planned, item.currency);
      const paidCadValue = amountToCad(paid, item.currency);
      acc.plannedCadTotal += plannedCadValue;
      acc.paidCadTotal += paidCadValue;
      acc.byCategory[item.category] ??= { plannedCad: 0, paidCad: 0, count: 0 };
      acc.byCategory[item.category].plannedCad += plannedCadValue;
      acc.byCategory[item.category].paidCad += paidCadValue;
      acc.byCategory[item.category].count += 1;
      return acc;
    },
    { plannedCadTotal: 0, paidCadTotal: 0, byCategory: {} }
  );

  const budgetCad = Number(state.settings.totalBudgetCad) || 0;
  const plannedCad = totals.plannedCadTotal;
  const paidCad = totals.paidCadTotal;
  const outstandingCad = plannedCad - paidCad;
  const remainingCad = budgetCad - plannedCad;
  const adults = Math.max(0, Number(familyPrefs.adults) || 0);
  const children = Math.max(0, Number(familyPrefs.children) || 0);
  const totalTravelers = adults + children;
  const safeDiv = (value, divisor) => (divisor > 0 ? value / divisor : 0);
  const familySummary = {
    adults,
    children,
    totalTravelers,
    plannedCad,
    paidCad,
    perPersonPlannedCad: safeDiv(plannedCad, totalTravelers),
    perPersonPaidCad: safeDiv(paidCad, totalTravelers),
    perAdultPlannedCad: safeDiv(plannedCad, adults),
    perAdultPaidCad: safeDiv(paidCad, adults),
    perChildPlannedCad: safeDiv(plannedCad, children),
    perChildPaidCad: safeDiv(paidCad, children),
    showSplitByRole: Boolean(familyPrefs.splitByRole),
  };

  return {
    activities,
    costItems,
    itineraryEntries,
    allCosts,
    ...totals,
    budgetCad,
    plannedCad,
    paidCad,
    outstandingCad,
    remainingCad,
    familySummary,
    tripDays: daysBetweenInclusive(state.settings.startDate, state.settings.endDate),
  };
}

function syncSettingsInputs() {
  Object.entries(el.settings).forEach(([key, input]) => {
    if (document.activeElement === input) return;
    if (key === "totalBudgetCad") return;
    input.value = state.settings[key] ?? "";
  });
  if (el.settings.totalBudgetCad && document.activeElement !== el.settings.totalBudgetCad) {
    const displayBudget = cadToDisplay(state.settings.totalBudgetCad || 0);
    el.settings.totalBudgetCad.value = Number.isFinite(displayBudget) ? String(Number(displayBudget.toFixed(2))) : "0";
  }
  if (el.totalBudgetLabelText) {
    el.totalBudgetLabelText.textContent = "Total Budget";
  }
  if (el.settingsAdults && document.activeElement !== el.settingsAdults) {
    el.settingsAdults.value = String(Math.max(0, Number(familyPrefs.adults) || 0));
  }
  if (el.settingsChildren && document.activeElement !== el.settingsChildren) {
    el.settingsChildren.value = String(Math.max(0, Number(familyPrefs.children) || 0));
  }
}

function renderTripSnapshot(summary) {
  if (!el.tripSnapshotGrid) return;
  const currencyLabel = displayCurrencyLabel();
  const hasAnyCosts = Number(summary.plannedCad) > 0 || Number(summary.paidCad) > 0;
  const hasDates = Boolean(summary.tripDays);
  const hasActivities = (summary.activities || []).length > 0;
  const travelerCount = Number(summary.familySummary?.totalTravelers) || 0;
  const hasCostPerPerson = hasAnyCosts && travelerCount > 0;

  const snapshotItems = [
    {
      label: "Total Planned",
      currency: currencyLabel,
      value: hasAnyCosts ? numberDisplayRoundedFromCad(summary.plannedCad) : "—",
      sub: hasAnyCosts ? "Forecast total (all items)" : "Add costs to calculate",
    },
    {
      label: "Total Paid",
      currency: currencyLabel,
      value: hasAnyCosts ? numberDisplayRoundedFromCad(summary.paidCad) : "—",
      sub: hasAnyCosts ? "Paid total (all items)" : "Add costs to calculate",
    },
    {
      label: "Per Person Estimate",
      currency: currencyLabel,
      value: hasCostPerPerson ? numberDisplayRoundedFromCad(summary.familySummary.perPersonPlannedCad) : "—",
      sub: travelerCount <= 0 ? "Set travelers" : hasAnyCosts ? "Uses adults + kids" : "Add costs to calculate",
    },
    {
      label: "Trip Days",
      value: hasDates ? `${summary.tripDays} day${summary.tripDays === 1 ? "" : "s"}` : "—",
      sub: hasDates ? "Includes start + end" : "Set dates",
      title: "Trip length includes both the start and end dates.",
    },
    {
      label: "Activities",
      value: String((summary.activities || []).length || 0),
      sub: hasActivities ? "Itinerary items" : "Add your first activity",
    },
  ];

  el.tripSnapshotGrid.innerHTML = snapshotItems
    .map(
      (item) => `
        <article class="trip-snapshot-item"${item.title ? ` title="${escapeHtml(item.title)}"` : ""}>
          <p class="label">${item.label}${item.currency ? ` <span class="currency-note">${item.currency}</span>` : ""}</p>
          <p class="value">${item.value}</p>
          <p class="sub">${item.sub}</p>
        </article>
      `
    )
    .join("");
}

function renderPlanChecklist(summary) {
  if (!el.planChecklist) return;
  const checks = [
    { label: "Set dates", done: Boolean(state.settings.startDate && state.settings.endDate) },
    { label: "Add budget", done: (Number(state.settings.totalBudgetCad) || 0) > 0 },
    { label: "Add 1 activity", done: (summary.activities || []).length > 0 },
    { label: "Add 1 cost", done: (summary.costItems || []).length > 0 },
  ];
  const allDone = checks.every((c) => c.done);
  if (allDone) {
    el.planChecklist.innerHTML = "";
    el.planChecklist.hidden = true;
    return;
  }
  el.planChecklist.hidden = false;
  el.planChecklist.innerHTML = `
    <div class="plan-checklist-card">
      <div class="plan-checklist-head">
        <strong>Quick setup checklist</strong>
        <span>${checks.filter((c) => c.done).length}/${checks.length}</span>
      </div>
      <div class="plan-checklist-items">
        ${checks
          .map(
            (check) => `
              <div class="plan-checklist-item ${check.done ? "is-done" : ""}">
                <span class="dot">${check.done ? "✓" : "•"}</span>
                <span>${check.label}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function hasMeaningfulTripData() {
  const s = state.settings || {};
  return Boolean(
    (s.tripName || "").trim() ||
      s.startDate ||
      s.endDate ||
      (Number(s.totalBudgetCad) || 0) > 0 ||
      (state.activities || []).length ||
      (state.costItems || []).length
  );
}

function isCurrentTripDemoLike() {
  return (
    state?.settings?.tripName === demoData.settings.tripName &&
    (state.activities || []).length === demoData.activities.length &&
    (state.costItems || []).length === demoData.costItems.length
  );
}

function confirmExampleReplaceIfNeeded() {
  if (!hasMeaningfulTripData()) return true;
  if (isCurrentTripDemoLike()) return true;
  return window.confirm("Loading the example will replace your current trip data. Continue?");
}

function loadSampleTrip({ dismissOnboarding = false, targetTab = "dashboard", confirmReplace = true } = {}) {
  if (confirmReplace && !confirmExampleReplaceIfNeeded()) return false;
  state = normalizeImportedState(demoData);
  uiState.planningUnlocked = true;
  familyPrefs = { adults: 2, children: 2, splitByRole: true };
  saveFamilyPrefs();
  if (dismissOnboarding) {
    storageSet(ONBOARDING_DISMISSED_KEY, "1");
    uiState.onboardingVisible = false;
  }
  saveState();
  switchTab(targetTab);
  render();
  return true;
}

function startFirstActivityFromEmptyState() {
  switchTab("itinerary");
  showItineraryNewItemForm();
  render();
  requestAnimationFrame(() => el.activityInputs.title?.focus());
}

function renderActionEmptyState({ title, body, actionPrefix = "emptyState" }) {
  return `
    <div class="action-empty-state" role="status">
      <strong>${escapeHtml(title)}</strong>
      <p class="muted">${escapeHtml(body)}</p>
      <p class="muted small-copy">Start small — add flights, hotel, and one activity.</p>
      <div class="action-empty-buttons">
        <button type="button" class="btn btn-primary" data-action="${actionPrefix}AddFirstActivity">Add your first activity</button>
        <button type="button" class="btn btn-secondary control-btn" data-action="${actionPrefix}LoadExample">Load example trip</button>
      </div>
    </div>
  `;
}

function handleEmptyStateAction(action) {
  if (action.endsWith("AddFirstActivity")) {
    startFirstActivityFromEmptyState();
    return true;
  }
  if (action.endsWith("LoadExample")) {
    loadSampleTrip({ dismissOnboarding: true, targetTab: "dashboard", confirmReplace: true });
    return true;
  }
  return false;
}

function renderFamilyBudgetSummary(summary) {
  if (el.familyAdults) el.familyAdults.value = String(Math.max(0, Number(familyPrefs.adults) || 0));
  if (el.familyChildren) el.familyChildren.value = String(Math.max(0, Number(familyPrefs.children) || 0));
  if (el.familySplitToggle) el.familySplitToggle.checked = Boolean(familyPrefs.splitByRole);
  if (!el.familyBudgetSummary) return;

  const f = summary.familySummary;
  const familyOutstandingCad = Math.max(0, f.plannedCad - f.paidCad);
  const stats = [
    ["Per traveler (forecast)", f.totalTravelers ? money(f.perPersonPlannedCad, "CAD") : "—"],
    ["Per traveler (left to pay)", f.totalTravelers ? money(familyOutstandingCad / f.totalTravelers, "CAD") : "—"],
  ];

  if (f.showSplitByRole) {
    stats.push(["Per adult (forecast)", f.adults ? money(f.perAdultPlannedCad, "CAD") : "—"]);
    stats.push(["Per adult (left to pay)", f.adults ? money(Math.max(0, f.perAdultPlannedCad - f.perAdultPaidCad), "CAD") : "—"]);
    stats.push(["Per child (forecast)", f.children ? money(f.perChildPlannedCad, "CAD") : "—"]);
    stats.push(["Per child (left to pay)", f.children ? money(Math.max(0, f.perChildPlannedCad - f.perChildPaidCad), "CAD") : "—"]);
  }

  const totalsLine = `
    <div class="family-budget-totals">
      <span><strong>Travelers:</strong> ${f.totalTravelers} (${f.adults} adult${f.adults === 1 ? "" : "s"}, ${f.children} child${f.children === 1 ? "" : "ren"})</span>
      <span><strong>Paid so far:</strong> ${money(f.paidCad, "CAD")} of forecast ${money(f.plannedCad, "CAD")}</span>
      <span><strong>Left to pay:</strong> ${money(familyOutstandingCad, "CAD")}</span>
    </div>
  `;

  const cards = stats
    .map(
      ([label, value]) => `
        <div class="family-stat">
          <div class="label">${label}</div>
          <div class="value">${value}</div>
        </div>
      `
    )
    .join("");

  el.familyBudgetSummary.innerHTML = `${totalsLine}<div class="family-budget-cards">${cards}</div>`;
}

function renderOnboardingPanel() {
  uiState.onboardingVisible = !isOnboardingDismissed();
  syncOnboardingPanelVisibility();
}

function renderDashboard(summary) {
  const s = state.settings;
  const days = summary.tripDays ? `${summary.tripDays} day${summary.tripDays === 1 ? "" : "s"}` : "Dates TBD";
  const travelerCount = summary.familySummary.totalTravelers || s.travelers || 1;
  el.heroTripTitle.textContent = "Plan your family vacation without spreadsheets.";
  el.dashboardTripTitle.textContent = s.tripName || "Trip";
  el.dashboardTripMeta.textContent = `${shortDate(s.startDate)} to ${shortDate(s.endDate)} • ${travelerCount} traveler(s) • ${days}`;
  if (el.dashboardCategoryBreakdownTitle) {
    el.dashboardCategoryBreakdownTitle.textContent = `Category Breakdown (Forecast • ${displayCurrencyLabel()})`;
  }
  renderOnboardingPanel();

  if (el.metricGrid) {
    el.metricGrid.innerHTML = "";
    el.metricGrid.hidden = true;
  }

  const categories = Object.entries(summary.byCategory)
    .sort((a, b) => b[1].plannedCad - a[1].plannedCad);

  const denom = summary.plannedCad || 1;
  el.categoryBreakdown.innerHTML = categories.length
    ? (() => {
        const palette = ["#0f6abf", "#0ea5a8", "#ff8c42", "#22c55e", "#ef4444", "#8b5cf6", "#64748b"];
        let angleCursor = 0;
        const segments = categories.map(([name, data], index) => {
          const share = denom > 0 ? (data.plannedCad / denom) * 100 : 0;
          const start = angleCursor;
          angleCursor += share;
          return {
            name,
            data,
            share,
            color: palette[index % palette.length],
            start,
            end: angleCursor,
          };
        });

        const donutRadius = 48;
        const donutStroke = 24;
        const donutSize = 120;
        const circumference = 2 * Math.PI * donutRadius;
        const svgSegments = segments
          .map((seg) => {
            const fraction = Math.max(0, seg.share) / 100;
            if (fraction <= 0) return "";
            const dash = Math.max(0, fraction * circumference);
            const offset = -(Math.max(0, seg.start) / 100) * circumference;
            return `<circle cx="${donutSize / 2}" cy="${donutSize / 2}" r="${donutRadius}" fill="none" stroke="${seg.color}" stroke-width="${donutStroke}" stroke-linecap="butt" stroke-dasharray="${dash} ${Math.max(0, circumference - dash)}" stroke-dashoffset="${offset}"></circle>`;
          })
          .join("");

        const legend = segments
          .map(
            (seg) => `
              <div class="donut-legend-row">
                <span class="swatch" style="background:${seg.color}"></span>
                <span class="legend-name">${escapeHtml(seg.name)}</span>
                <span class="legend-value">${moneyDisplayFromCad(seg.data.plannedCad)}</span>
                <span class="legend-pct">${seg.share.toFixed(0)}%</span>
              </div>
            `
          )
          .join("");

        return `
          <div class="donut-breakdown">
            <div class="donut-wrap">
              <div class="donut-chart" aria-label="Forecast category breakdown donut chart">
                <svg class="donut-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
                  <circle cx="60" cy="60" r="${donutRadius}" fill="none" stroke="#edf2fb" stroke-width="${donutStroke}"></circle>
                  ${svgSegments}
                </svg>
                <div class="donut-hole">
                  <span class="donut-label">Forecast</span>
                  <strong>${compactDisplayFromCad(summary.plannedCad)}</strong>
                  <small class="donut-note">${displayCurrencyLabel()}</small>
                </div>
              </div>
            </div>
            <div class="donut-legend">${legend}</div>
          </div>
        `;
      })()
    : renderActionEmptyState({
        title: "No budget breakdown yet",
        body: "Add activities or cost items to see your category breakdown.",
        actionPrefix: "budgetEmpty",
      });

  const plannedPct = summary.budgetCad > 0 ? (summary.plannedCad / summary.budgetCad) * 100 : 0;
  const paidPct = summary.budgetCad > 0 ? (summary.paidCad / summary.budgetCad) * 100 : 0;
  const hasBudgetInsights = summary.plannedCad > 0 || summary.paidCad > 0;
  if (el.budgetProgressCard) {
    el.budgetProgressCard.dataset.empty = hasBudgetInsights ? "0" : "1";
  }
  if (!hasBudgetInsights) {
    el.plannedBudgetPct.textContent = "—";
    el.paidBudgetPct.textContent = "—";
    el.plannedBudgetBar.style.width = "0%";
    el.paidBudgetBar.style.width = "0%";
    if (el.budgetHealthState) {
      el.budgetHealthState.className = "budget-health-state is-empty";
      el.budgetHealthState.textContent = "Add your first cost to see budget insights.";
    }
  } else {
    const forecastRatio = clampPct(plannedPct);
    const healthTone = forecastRatio > 100 ? "is-over" : forecastRatio >= 85 ? "is-close" : "is-good";
    const healthLabel =
      forecastRatio > 100 ? "You're over budget" : forecastRatio >= 85 ? "You're close to your limit" : "You're within budget";
    el.plannedBudgetPct.textContent = `${plannedPct.toFixed(1)}%`;
    el.paidBudgetPct.textContent = `${paidPct.toFixed(1)}%`;
    el.plannedBudgetBar.style.width = `${forecastRatio}%`;
    el.paidBudgetBar.style.width = `${clampPct(paidPct)}%`;
    if (el.budgetHealthState) {
      el.budgetHealthState.className = `budget-health-state ${healthTone}`;
      el.budgetHealthState.textContent = `${healthLabel} (${plannedPct.toFixed(1)}% forecast)`;
    }
  }

  renderCompactDashboardTimeline(summary);
}

function renderActivitiesTable(summary) {
  el.activitiesTableBody.innerHTML = summary.activities.length
    ? summary.activities
        .map(
          (item) => `
            <tr>
              <td>${shortDate(item.date)}</td>
              <td>${item.time || "-"}</td>
              <td>${escapeHtml(item.title)}</td>
              <td>${escapeHtml(item.location || "-")}</td>
              <td>${escapeHtml(item.category)}</td>
              <td>${normalizeCurrency(item.currency)}</td>
              <td>${formatEnteredMoney(item.plannedUsd, item.currency)}<br><span class="muted">${money(amountToCad(item.plannedUsd, item.currency), "CAD")}</span></td>
              <td>${formatEnteredMoney(item.paidUsd, item.currency)}<br><span class="muted">${money(amountToCad(item.paidUsd, item.currency), "CAD")}</span></td>
              <td><span class="status-pill status-${item.status}">${item.status}</span></td>
              <td class="no-print">
                <div class="row-actions">
                  <button class="icon-btn" data-action="edit" data-id="${item.id}">Edit</button>
                  <button class="icon-btn" data-action="markPaid" data-id="${item.id}">Mark Paid</button>
                  <button class="icon-btn danger" data-action="delete" data-id="${item.id}">Delete</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="10" class="muted">No activities yet. Add one above to start your timeline.</td></tr>`;
}

function renderCostItemsTable(summary) {
  el.costItemsTableBody.innerHTML = summary.costItems.length
    ? summary.costItems
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.title)}</td>
              <td>${escapeHtml(item.category)}</td>
              <td>${normalizeCurrency(item.currency)}</td>
              <td>${formatEnteredMoney(item.plannedUsd, item.currency)}<br><span class="muted">${money(amountToCad(item.plannedUsd, item.currency), "CAD")}</span></td>
              <td>${formatEnteredMoney(item.paidUsd, item.currency)}<br><span class="muted">${money(amountToCad(item.paidUsd, item.currency), "CAD")}</span></td>
              <td>${item.includeInItinerary ? "Yes" : "No"}${item.includeInItinerary && item.itineraryDate ? `<br><span class="muted">${shortDate(item.itineraryDate)}</span>` : ""}</td>
              <td class="no-print">
                <div class="row-actions">
                  <button class="icon-btn" data-action="editCostItem" data-id="${item.id}">Edit</button>
                  <button class="icon-btn" data-action="markCostItemPaid" data-id="${item.id}">Mark Paid</button>
                  <button class="icon-btn danger" data-action="deleteCostItem" data-id="${item.id}">Delete</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="7" class="muted">No additional cost items yet. Add one above to include it in the dashboard.</td></tr>`;
}

function renderReport(summary) {
  const s = state.settings;
  const travelerCount = summary.familySummary.totalTravelers || s.travelers || 1;
  el.reportTripName.textContent = s.tripName || "Vacation";
  const days = summary.tripDays ? `${summary.tripDays} day${summary.tripDays === 1 ? "" : "s"}` : "Dates TBD";
  el.reportTripMeta.textContent = `${shortDate(s.startDate)} to ${shortDate(s.endDate)} • ${travelerCount} traveler(s) • ${days}`;
  el.reportRate.textContent = `Display: ${displayCurrencyLabel()} • 1 USD = ${(Number(s.usdToCadRate) || 0).toFixed(4)} CAD • 1 EUR = ${(Number(s.eurToCadRate) || 0).toFixed(4)} CAD`;
  el.reportGenerated.textContent = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const travelerCountForCost = Number(summary.familySummary?.totalTravelers) || 0;
  const reportMetrics = [
    [`Budget (${displayCurrencyLabel()})`, moneyDisplayFromCad(summary.budgetCad)],
    [`Total Planned (${displayCurrencyLabel()})`, moneyDisplayFromCad(summary.plannedCad)],
    [`Total Paid (${displayCurrencyLabel()})`, moneyDisplayFromCad(summary.paidCad)],
    [`Per Person Estimate (${displayCurrencyLabel()})`, travelerCountForCost ? moneyDisplayFromCad(summary.familySummary.perPersonPlannedCad) : "—"],
    ["Trip Days", summary.tripDays ? `${summary.tripDays}` : "—"],
    ["Activities", String((summary.activities || []).length || 0)],
  ];

  el.reportMetrics.innerHTML = reportMetrics
    .map(
      ([label, value]) => `
        <div class="report-metric">
          <div class="label">${label}</div>
          <div class="value">${value}</div>
        </div>
      `
    )
    .join("");

  const breakdownRows = Object.entries(summary.byCategory).sort((a, b) => b[1].plannedCad - a[1].plannedCad);
  if (el.reportCharts) {
    if (!breakdownRows.length) {
      el.reportCharts.innerHTML = `<p class="muted">No cost data yet.</p>`;
    } else {
      const palette = ["#0f6abf", "#1d8fe1", "#3b82f6", "#60a5fa", "#7aa2f7", "#9bb5d6", "#c7d7ee"];
      const totalPlanned = summary.plannedCad || 1;
      const segments = breakdownRows.map(([name, data], index) => ({
        name,
        data,
        color: palette[index % palette.length],
        share: totalPlanned > 0 ? (data.plannedCad / totalPlanned) * 100 : 0,
      }));

      let startPct = 0;
      const donutRadius = 46;
      const donutStroke = 20;
      const circumference = 2 * Math.PI * donutRadius;
      const svgSegments = segments
        .map((seg) => {
          const fraction = Math.max(0, seg.share) / 100;
          const dash = fraction * circumference;
          const offset = -(startPct / 100) * circumference;
          startPct += seg.share;
          return `<circle cx="60" cy="60" r="${donutRadius}" fill="none" stroke="${seg.color}" stroke-width="${donutStroke}" stroke-dasharray="${dash} ${Math.max(0, circumference - dash)}" stroke-dashoffset="${offset}"></circle>`;
        })
        .join("");

      const barRows = segments
        .map(
          (seg) => `
            <div class="report-chart-bar-row">
              <div class="report-chart-bar-label"><span class="swatch" style="background:${seg.color}"></span>${escapeHtml(seg.name)}</div>
              <div class="report-chart-bar-track"><div class="report-chart-bar-fill" style="width:${Math.max(0, Math.min(100, seg.share)).toFixed(1)}%; background:${seg.color};"></div></div>
              <div class="report-chart-bar-value">${moneyDisplayFromCad(seg.data.plannedCad)}</div>
            </div>
          `
        )
        .join("");

      const legendRows = segments
        .map(
          (seg) => `
            <div class="report-donut-legend-row">
              <span class="swatch" style="background:${seg.color}"></span>
              <span>${escapeHtml(seg.name)}</span>
              <span>${seg.share.toFixed(0)}%</span>
            </div>
          `
        )
        .join("");

      el.reportCharts.innerHTML = `
        <div class="report-charts-grid">
          <div class="report-chart-card">
            <h5>Forecast by Category (Bar)</h5>
            <div class="report-chart-bars">${barRows}</div>
          </div>
          <div class="report-chart-card">
            <h5>Forecast by Category (Donut)</h5>
            <div class="report-donut-wrap">
              <div class="report-donut-chart">
                <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
                  <circle cx="60" cy="60" r="${donutRadius}" fill="none" stroke="#edf2fb" stroke-width="${donutStroke}"></circle>
                  ${svgSegments}
                </svg>
                <div class="report-donut-center">
                  <span>Forecast</span>
                  <strong>${compactDisplayFromCad(summary.plannedCad)}</strong>
                  <small>${displayCurrencyLabel()}</small>
                </div>
              </div>
              <div class="report-donut-legend">${legendRows}</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  if (el.reportItinerarySummary) {
    const planner = getItineraryPlannerDays(summary);
    const summaryDays = planner.days.length ? planner.days : [];
    const unscheduled = planner.unscheduled || [];
    el.reportItinerarySummary.innerHTML = summaryDays.length || unscheduled.length
      ? `
        <div class="report-itinerary-calendar">
          ${summaryDays
            .map(
              (day) => `
                <div class="report-calendar-day">
                  <div class="report-calendar-day-head">
                    <strong>${escapeHtml(day.shortLabel)}</strong>
                    <span>${day.items.length}</span>
                  </div>
                  <div class="report-calendar-day-body ${day.items.length ? "has-items" : "is-empty"}">
                    ${
                      day.items.length
                        ? day.items
                            .map(
                              (item) => `
                                <div class="report-calendar-item">
                                  <span class="report-calendar-pill">
                                    <span class="title">${escapeHtml(item.title)}</span>
                                  </span>
                                </div>
                              `
                            )
                            .join("")
                        : `<div class="muted">No items</div>`
                    }
                  </div>
                </div>
              `
            )
            .join("")}
          ${
            unscheduled.length
              ? `
                <div class="report-calendar-day report-calendar-day-unscheduled">
                  <div class="report-calendar-day-head">
                    <strong>Unscheduled</strong>
                    <span>${unscheduled.length}</span>
                  </div>
                  <div class="report-calendar-day-body has-items">
                    ${unscheduled
                      .map(
                        (item) => `
                          <div class="report-calendar-item">
                            <span class="report-calendar-pill">
                              <span class="title">${escapeHtml(item.title)}</span>
                            </span>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }
        </div>
      `
      : `<p class="muted">No itinerary items yet.</p>`;
  }

  if (el.reportFamilySummary) {
    const f = summary.familySummary;
    const familyRows = [
      ["Adults", String(f.adults)],
      ["Children", String(f.children)],
      ["Total travelers", String(f.totalTravelers)],
      ["Total forecasted cost", moneyDisplayFromCad(f.plannedCad)],
      ["Total paid cost", moneyDisplayFromCad(f.paidCad)],
      ["Forecast per person", f.totalTravelers ? moneyDisplayFromCad(f.perPersonPlannedCad) : "—"],
      ["Paid per person", f.totalTravelers ? moneyDisplayFromCad(f.perPersonPaidCad) : "—"],
    ];
    if (f.showSplitByRole) {
      familyRows.push(["Forecast per adult", f.adults ? moneyDisplayFromCad(f.perAdultPlannedCad) : "—"]);
      familyRows.push(["Paid per adult", f.adults ? moneyDisplayFromCad(f.perAdultPaidCad) : "—"]);
      familyRows.push(["Forecast per child", f.children ? moneyDisplayFromCad(f.perChildPlannedCad) : "—"]);
      familyRows.push(["Paid per child", f.children ? moneyDisplayFromCad(f.perChildPaidCad) : "—"]);
    }
    el.reportFamilySummary.innerHTML = `
      <div class="report-table">
        <div class="report-table-row header two-col">
          <div>Metric</div>
          <div>Value</div>
        </div>
        ${familyRows
          .map(
            ([label, value]) => `
              <div class="report-table-row two-col">
                <div>${label}</div>
                <div>${value}</div>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  el.reportBreakdown.innerHTML = `
    <div class="report-table">
      <div class="report-table-row header">
        <div>Category</div>
        <div>Forecast (${displayCurrencyLabel()})</div>
        <div>Paid (${displayCurrencyLabel()})</div>
        <div>Paid %</div>
      </div>
      ${
        breakdownRows.length
          ? breakdownRows
              .map(([category, data]) => {
                const pct = data.plannedCad > 0 ? (data.paidCad / data.plannedCad) * 100 : 0;
                return `
                  <div class="report-table-row">
                    <div>${escapeHtml(category)}</div>
                    <div>${moneyDisplayFromCad(data.plannedCad)}</div>
                    <div>${moneyDisplayFromCad(data.paidCad)}</div>
                    <div>${pct.toFixed(0)}%</div>
                  </div>
                `;
              })
              .join("")
          : `<div class="report-table-row"><div>No categories yet</div><div>-</div><div>-</div><div>-</div></div>`
      }
    </div>
  `;

  if (!summary.itineraryEntries.length) {
    el.reportTimeline.innerHTML = `<p class="muted">No itinerary items yet.</p>`;
  } else {
    const grouped = [];
    for (const item of summary.itineraryEntries) {
      const key = item.date || "__unscheduled__";
      let group = grouped.find((g) => g.key === key);
      if (!group) {
        group = {
          key,
          label: item.date ? dateLabel(item.date) : "Unscheduled",
          items: [],
        };
        grouped.push(group);
      }
      group.items.push(item);
    }

    el.reportTimeline.innerHTML = grouped
      .map(
        (group) => `
          <section class="timeline-day-group">
            <div class="timeline-day-head">
              <strong>${escapeHtml(group.label)}</strong>
              <span>${group.items.length} item${group.items.length === 1 ? "" : "s"}</span>
            </div>
            <div class="timeline-day-items">
              ${group.items
                .map(
                  (item) => `
                    <div class="timeline-item">
                      <div class="timeline-date">${escapeHtml(item.time || "--:--")}</div>
                      <div class="timeline-main">
                        <h5>${escapeHtml(item.title)}</h5>
                        <p>${escapeHtml(item.location || "Location TBD")} • ${escapeHtml(item.category)} • ${escapeHtml(item.status)}${item.source === "costItem" ? " • Cost Item" : ""}</p>
                        ${item.notes ? `<p class="muted">${escapeHtml(item.notes)}</p>` : ""}
                      </div>
                      <div class="timeline-cost">
                        <strong>Forecast ${formatEnteredMoney(item.plannedUsd, item.currency)}</strong>
                        <span>Paid ${formatEnteredMoney(item.paidUsd, item.currency)}</span>
                        <span class="muted">${money(amountToCad(item.plannedUsd, item.currency), "CAD")} planned</span>
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>
          </section>
        `
      )
      .join("");
  }
}

function render() {
  refreshCategorySelectOptions();
  syncSettingsInputs();
  syncFormModes();
  const summary = calculateSummary();
  renderTripSnapshot(summary);
  renderPlanChecklist(summary);
  renderSetupWizard(summary);
  renderDashboard(summary);
  renderItineraryList(summary);
  renderCostsList(summary);
  renderActivitiesTable(summary);
  renderCostItemsTable(summary);
  renderReport(summary);
  syncPlanningLockUi();
  enforcePlanningGatePanels();
  renderBackupUi();
  syncImportReminderModal();
  syncAboutModal();
  syncBodyScrollLock();
  renderSupportUi();
}

function updateSettingsFromInputs() {
  const budgetFieldCurrency = displayCurrencyCode();
  const nextDisplayCurrency = normalizeDisplayCurrency(el.settings.displayCurrency?.value || budgetFieldCurrency);
  state.settings.tripName = el.settings.tripName.value;
  state.settings.travelers = Number(el.settings.travelers.value) || 1;
  state.settings.startDate = el.settings.startDate.value;
  state.settings.endDate = el.settings.endDate.value;
  state.settings.usdToCadRate = Number(el.settings.usdToCadRate.value) || 0;
  state.settings.eurToCadRate = Number(el.settings.eurToCadRate?.value) || 0;
  state.settings.totalBudgetCad = Math.max(0, displayToCad(el.settings.totalBudgetCad.value, budgetFieldCurrency));
  state.settings.displayCurrency = nextDisplayCurrency;
  syncFamilyPrefsFromTravelerCount(state.settings.travelers);
  saveState();
  render();
}

function addActivity(event) {
  event.preventDefault();
  const inputs = el.activityInputs;
  const mode = inputs.mode.value;
  const draft = buildActivityFromInputs(inputs);
  if (!draft.title || !draft.date || !draft.time) return;

  if (mode === "edit") {
    const item = state.activities.find((a) => a.id === inputs.editId.value);
    if (!item) return;
    item.date = draft.date;
    item.time = draft.time;
    item.title = draft.title;
    item.location = draft.location;
    item.notes = draft.notes;
    item.category = draft.category;
    item.currency = draft.currency;
    item.plannedUsd = draft.plannedUsd;
    item.paidUsd = draft.paidUsd;
    item.status = draft.status;
  } else {
    state.activities.push(draft);
  }
  saveState();
  uiState.itineraryFormPlacement = null;
  resetActivityForm();
  render();
}

function addDashboardQuickActivity(event) {
  event.preventDefault();
  const inputs = el.dashboardQuickActivityInputs;
  const mode = inputs.mode.value;
  const targetDate = inputs.date.value;

  if (mode === "edit") {
    const source = inputs.editSource.value;
    const id = inputs.editId.value;
    if (!source || !id) return;

    if (source === "activity") {
      const item = state.activities.find((a) => a.id === id);
      if (!item) return;
      item.date = inputs.date.value;
      item.time = inputs.time.value;
      item.title = inputs.title.value.trim() || item.title;
      item.location = inputs.location.value.trim();
      item.notes = (inputs.notes?.value || "").trim();
      item.category = inputs.category.value;
      item.currency = normalizeCurrency(inputs.currency.value);
      item.plannedUsd = Math.max(0, Number(inputs.plannedUsd.value) || 0);
      item.paidUsd = Math.max(0, Number(inputs.paidUsd.value) || 0);
      item.status = inputs.status.value;
    } else if (source === "costItem") {
      const item = (state.costItems || []).find((c) => c.id === id);
      if (!item) return;
      item.title = inputs.title.value.trim() || item.title;
      item.category = inputs.category.value;
      item.currency = normalizeCurrency(inputs.currency.value);
      item.plannedUsd = Math.max(0, Number(inputs.plannedUsd.value) || 0);
      item.paidUsd = Math.max(0, Number(inputs.paidUsd.value) || 0);
      item.includeInItinerary = true;
      item.itineraryDate = inputs.date.value;
      item.itineraryTime = inputs.time.value;
      item.itineraryLocation = inputs.location.value.trim();
      item.notes = (inputs.notes?.value || "").trim();
      item.itineraryStatus = inputs.status.value;
    } else {
      return;
    }
    if (targetDate) {
      uiState.dashboardSelectedDate = targetDate;
    }
  } else {
    const item = buildActivityFromInputs(inputs);
    if (!item.title || !item.date || !item.time) return;
    state.activities.push(item);
    if (item.date) {
      uiState.dashboardSelectedDate = item.date;
    }
  }

  saveState();
  uiState.dashboardQuickPlacement = null;
  resetDashboardQuickForm({ preserveDate: true });
  uiState.dashboardDayModalOpen = true;
  render();
}

function addCostItem(event) {
  event.preventDefault();
  const inputs = el.costItemInputs;
  const mode = inputs.mode.value;
  const draft = {
    id: makeId(),
    title: inputs.title.value.trim(),
    notes: (inputs.notes?.value || "").trim(),
    category: inputs.category.value,
    currency: normalizeCurrency(inputs.currency.value),
    plannedUsd: Number(inputs.plannedUsd.value) || 0,
    paidUsd: Number(inputs.paidUsd.value) || 0,
    includeInItinerary: inputs.includeInItinerary.checked,
    itineraryDate: inputs.itineraryDate.value,
    itineraryTime: inputs.itineraryTime.value,
    itineraryLocation: inputs.itineraryLocation.value.trim(),
    itineraryStatus: inputs.itineraryStatus.value,
  };

  if (!draft.title) return;
  state.costItems ??= [];
  if (mode === "edit") {
    const item = state.costItems.find((c) => c.id === inputs.editId.value);
    if (!item) return;
    Object.assign(item, { ...draft, id: item.id });
  } else {
    state.costItems.push(draft);
  }
  saveState();
  uiState.costFormPlacement = null;
  resetCostItemForm();
  render();
}

function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  const item = state.activities.find((a) => a.id === id);
  if (!item) return;

  if (action === "markPaid") {
    item.paidUsd = Number(item.plannedUsd) || 0;
    item.status = "Paid";
  }

  if (action === "edit") {
    setActivityFormEditMode(item);
    el.activityForm.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (action === "delete") {
    state.activities = state.activities.filter((a) => a.id !== id);
    if (uiState.itineraryEditId === id) resetActivityForm();
  }

  saveState();
  render();
}

function handleItineraryListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;

  if (handleEmptyStateAction(action)) return;

  if (action === "showItineraryNewItem") {
    showItineraryNewItemForm();
    render();
    requestAnimationFrame(() => el.activityInputs.title?.focus());
    return;
  }

  if (action === "showItineraryNewItemForDay") {
    showItineraryNewItemFormForDate(button.dataset.date || "");
    render();
    requestAnimationFrame(() => el.activityInputs.title?.focus());
    return;
  }

  if (action === "itineraryEditInline") {
    const item = state.activities.find((a) => a.id === id);
    if (!item) return;
    setActivityFormEditMode(item);
    render();
    requestAnimationFrame(() => el.activityInputs.title?.focus());
    return;
  }

  // Reuse existing row actions (markPaid/delete) by delegating.
  if (action === "markPaid" || action === "delete") {
    handleTableClick(event);
  }
}

function handleCostItemsTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  const item = (state.costItems || []).find((c) => c.id === id);
  if (!item) return;

  if (action === "markCostItemPaid") {
    item.paidUsd = Number(item.plannedUsd) || 0;
  }

  if (action === "editCostItem") {
    setCostItemFormEditMode(item);
    el.costItemForm.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (action === "deleteCostItem") {
    state.costItems = (state.costItems || []).filter((c) => c.id !== id);
    if (uiState.costItemEditId === id) resetCostItemForm();
  }

  saveState();
  render();
}

function handleCostsListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;

  if (handleEmptyStateAction(action)) return;

  if (action === "showCostNewItem") {
    showCostNewItemForm();
    render();
    requestAnimationFrame(() => el.costItemInputs.title?.focus());
    return;
  }

  if (action === "costEditInline") {
    const item = (state.costItems || []).find((c) => c.id === id);
    if (!item) return;
    setCostItemFormEditMode(item);
    render();
    requestAnimationFrame(() => el.costItemInputs.title?.focus());
    return;
  }

  if (action === "costHubEditActivity") {
    const item = state.activities.find((a) => a.id === id);
    if (!item) return;
    setActivityFormEditMode(item, { placementType: "edit-cost-hub" });
    render();
    requestAnimationFrame(() => el.activityInputs.title?.focus());
    return;
  }

  if (action === "markCostItemPaid" || action === "deleteCostItem") {
    handleCostItemsTableClick(event);
    return;
  }

  if (action === "markPaid" || action === "delete") {
    handleTableClick(event);
  }
}

function handleCategoryBreakdownClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  handleEmptyStateAction(button.dataset.action || "");
}

function resetDemoData() {
  closeAppMenu();
  const shouldReset = window.confirm("Reset will erase current trip data on this device. Continue?");
  if (!shouldReset) return;
  state = buildEmptyState();
  familyPrefs = { adults: 2, children: 0, splitByRole: false };
  saveFamilyPrefs();
  uiState.itineraryFormPlacement = null;
  uiState.costFormPlacement = null;
  uiState.itineraryEditId = null;
  uiState.costItemEditId = null;
  uiState.dashboardDayModalOpen = false;
  uiState.importReminderOpen = false;
  uiState.planningUnlocked = false;
  uiState.setupWizardVisible = false;
  uiState.setupWizardMinimized = false;
  uiState.setupWizardStep = 1;
  saveState();
  switchTab("plan");
  render();
  showToast("Trip reset.");
}

function dismissOnboardingPanelOnly() {
  dismissOnboarding();
}

function exportJsonBackup() {
  const { nowIso, blob, fileName } = buildBackupExportArtifacts();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  recordBackupExport(fileName, nowIso);
}

function buildBackupExportArtifacts() {
  const nowIso = new Date().toISOString();
  const payload = {
    backupVersion: BACKUP_VERSION,
    exportedAt: nowIso,
    app: "Vacation Trip Tracker",
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const tripNameSlug = (state.settings.tripName || "vacation-trip")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `${tripNameSlug || "vacation-trip"}-backup-${dateStamp}.json`;
  return { nowIso, blob, fileName };
}

function recordBackupExport(fileName, nowIso = new Date().toISOString()) {
  const meta = backupMeta();
  meta.lastExportAt = nowIso;
  meta.lastExportFileName = fileName;
  meta.lastSavedSnapshotAt = nowIso;
  meta.lastDataChangeAt = nowIso;
  saveState(false);
  renderBackupUi();
  maybeQueueSupportBannerAfterMeaningfulAction("export");
}

async function handleGlobalSaveClick() {
  const { nowIso, blob, fileName } = buildBackupExportArtifacts();

  try {
    const shareSupported = typeof navigator !== "undefined" && typeof navigator.share === "function";
    const FileCtor = globalThis.File;
    if (shareSupported && FileCtor) {
      const file = new FileCtor([blob], fileName, { type: "application/json" });
      const shareData = {
        title: "Trip Tracker Backup",
        text: "Trip tracker JSON backup",
        files: [file],
      };
      const canShareFiles =
        typeof navigator.canShare === "function" ? navigator.canShare({ files: [file] }) : true;
      if (canShareFiles) {
        await navigator.share(shareData);
        recordBackupExport(fileName, nowIso);
        return;
      }
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.warn("Share export failed, falling back to download export.", error);
  }

  exportJsonBackup();
}

function confirmBackupImportReplaceIfNeeded() {
  if (!hasMeaningfulTripData() || isCurrentTripDemoLike()) return true;
  return window.confirm("Importing a backup will replace current trip data. Continue?");
}

function openImportPicker({ confirmReplace = false } = {}) {
  if (confirmReplace && !confirmBackupImportReplaceIfNeeded()) return;
  el.importJsonFile.value = "";
  el.importJsonFile.click();
}

function resolveMode(tabOrMode) {
  const raw = String(tabOrMode || "").toLowerCase();
  if (raw === "plan" || raw === "budget" || raw === "summary") return raw;
  if (raw === "itinerary" || raw === "settings") return "plan";
  if (raw === "costs" || raw === "dashboard") return "budget";
  if (raw === "report") return "summary";
  return "plan";
}

function getModePanels(mode) {
  return (
    {
      plan: ["itinerary", "settings"],
      budget: ["costs", "dashboard"],
      summary: ["report"],
    }[mode] || ["itinerary", "settings"]
  );
}

function switchTab(tabName) {
  const requestedMode = resolveMode(tabName);
  if (requestedMode === "plan" && isPlanningLocked()) {
    openSetupWizard({ step: 1, scroll: true });
    return;
  }
  const mode = requestedMode;
  if (mode !== "plan") {
    hideItineraryInlineForm();
    resetActivityForm();
  }
  if (mode !== "budget") {
    hideCostInlineForm();
    resetCostItemForm();
  }
  const visiblePanels = new Set(getModePanels(mode));

  storageSet(ACTIVE_MODE_KEY, mode);
  el.tabButtons.forEach((button) => {
    const isActive = button.dataset.modeTarget === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
  el.tabPanels.forEach((panel) => {
    const isActive = visiblePanels.has(panel.dataset.tabPanel);
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
  if (el.tripSnapshotSection) {
    el.tripSnapshotSection.hidden = mode !== "summary";
  }
}

function handleDashboardTimelineClick(event) {
  const day = event.target.closest(".timeline-day[data-date]");
  if (!day) return;
  const date = day.dataset.date;
  const sameDay = uiState.dashboardSelectedDate === date;
  uiState.dashboardSelectedDate = sameDay ? null : date;
  uiState.dashboardDayModalOpen = !sameDay;
  render();
}

function handleDashboardTimelineKeydown(event) {
  if (!(event.key === "Enter" || event.key === " ")) return;
  const day = event.target.closest(".timeline-day[data-date]");
  if (!day) return;
  event.preventDefault();
  const sameDay = uiState.dashboardSelectedDate === day.dataset.date;
  uiState.dashboardSelectedDate = sameDay ? null : day.dataset.date;
  uiState.dashboardDayModalOpen = !sameDay;
  render();
}

function closeDashboardDayModal() {
  uiState.dashboardDayModalOpen = false;
  render();
}

function syncImportReminderModal() {
  if (!el.importReminderModal) return;
  el.importReminderModal.hidden = !uiState.importReminderOpen;
  syncBodyScrollLock();
}

function openImportReminder() {
  uiState.importReminderOpen = true;
  syncImportReminderModal();
  renderSupportUi();
  requestAnimationFrame(() => focusModalPrimaryAction(el.importReminderModal));
}

function closeImportReminder() {
  uiState.importReminderOpen = false;
  syncImportReminderModal();
  renderSupportUi();
}

function syncAppMenu() {
  if (!el.appMenu) return;
  el.appMenu.hidden = !uiState.appMenuOpen;
  if (el.appMenuBtn) {
    el.appMenuBtn.setAttribute("aria-expanded", uiState.appMenuOpen ? "true" : "false");
  }
  syncBodyScrollLock();
}

function openAppMenu() {
  uiState.appMenuOpen = true;
  syncAppMenu();
  requestAnimationFrame(() => focusModalPrimaryAction(el.appMenu));
}

function closeAppMenu() {
  uiState.appMenuOpen = false;
  syncAppMenu();
}

function handleAppMenuClick(event) {
  if (event.target === el.appMenu || event.target.dataset.menuClose === "1") {
    closeAppMenu();
  }
}

function syncBodyScrollLock() {
  const hasOpenModal = Boolean(
    uiState.dashboardDayModalOpen || uiState.importReminderOpen || uiState.aboutModalOpen || uiState.appMenuOpen
  );
  const body = document.body;
  if (!body) return;

  if (hasOpenModal) {
    if (!body.classList.contains("modal-open")) {
      bodyScrollLockY = window.scrollY || window.pageYOffset || 0;
      body.style.top = `-${bodyScrollLockY}px`;
      body.classList.add("modal-open");
    }
    return;
  }

  if (body.classList.contains("modal-open")) {
    body.classList.remove("modal-open");
    const y = Number.parseInt((body.style.top || "0").replace("px", ""), 10);
    body.style.top = "";
    window.scrollTo(0, Number.isFinite(y) ? Math.abs(y) : bodyScrollLockY);
  }
}

function showImportReminderOnLoad() {
  // Initial welcome popup disabled. Trip opens directly to the app.
}

function enforceBlankLaunchState() {
  state = buildEmptyState();
  uiState.planningUnlocked = false;
  uiState.setupWizardVisible = false;
  uiState.setupWizardMinimized = false;
  uiState.setupWizardStep = 1;
}

function handleImportReminderModalClick(event) {
  if (event.target === el.importReminderModal || event.target.dataset.modalClose === "import-reminder") {
    closeImportReminder();
  }
}

function handleDashboardDayModalClick(event) {
  if (event.target === el.dashboardDayDetail || event.target.dataset.modalClose === "day-detail") {
    closeDashboardDayModal();
    return;
  }
  if (event.target.closest("#dashboardDayDetailClose")) {
    closeDashboardDayModal();
    return;
  }

  const editBtn = event.target.closest("button[data-action='editDashboardItem']");
  const addBtn = event.target.closest("button[data-action='showDashboardNewItem']");
  if (addBtn) {
    showDashboardQuickNewItemForm();
    uiState.dashboardDayModalOpen = true;
    render();
    const target = el.dashboardQuickActivityInputs.title;
    if (target) {
      requestAnimationFrame(() => target.focus());
    }
    return;
  }
  if (editBtn) {
    const { source, id } = editBtn.dataset;
    if (source === "activity") {
      const item = state.activities.find((a) => a.id === id);
      if (!item) return;
      setDashboardQuickFormEditMode({ ...item, source: "activity" });
    } else if (source === "costItem") {
      const item = (state.costItems || []).find((c) => c.id === id);
      if (!item) return;
      setDashboardQuickFormEditMode({
        ...item,
        source: "costItem",
        date: item.itineraryDate,
        time: item.itineraryTime,
        location: item.itineraryLocation,
        status: item.itineraryStatus,
      });
    } else {
      return;
    }
    uiState.dashboardDayModalOpen = true;
    render();
    const target = el.dashboardQuickActivityInputs.title;
    if (target) {
      requestAnimationFrame(() => target.focus());
    }
  }
}

function handleGlobalKeydown(event) {
  if (trapFocusInModal(event)) return;
  if (event.key !== "Escape") return;
  if (uiState.appMenuOpen) {
    closeAppMenu();
    return;
  }
  if (uiState.importReminderOpen) {
    closeImportReminder();
    return;
  }
  if (uiState.aboutModalOpen) {
    closeAboutModal();
    return;
  }
  if (uiState.dashboardDayModalOpen) {
    closeDashboardDayModal();
  }
}

function cancelDashboardQuickEdit() {
  resetDashboardQuickForm({ preserveDate: true });
  hideDashboardQuickInlineForm();
  render();
}

function cancelActivityEdit() {
  resetActivityForm();
  hideItineraryInlineForm();
  render();
}

function cancelCostItemEdit() {
  resetCostItemForm();
  hideCostInlineForm();
  render();
}

async function importJsonBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incoming = parsed?.data ? parsed.data : parsed;
    if (!confirmBackupImportReplaceIfNeeded()) {
      event.target.value = "";
      return;
    }
    state = normalizeImportedState(incoming);
    uiState.planningUnlocked = true;
    const nowIso = new Date().toISOString();
    const meta = backupMeta();
    meta.lastImportAt = nowIso;
    meta.lastImportFileName = file.name || "";
    meta.lastSavedSnapshotAt = nowIso;
    meta.lastDataChangeAt = nowIso;
    saveState(false);
    closeImportReminder();
    render();
    showToast("Backup imported.");
  } catch (error) {
    console.error(error);
    alert("Could not import that JSON backup. Please choose a valid tracker backup file.");
  } finally {
    if (event?.target) event.target.value = "";
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Object.values(el.settings).forEach((input) => {
  input.addEventListener("input", updateSettingsFromInputs);
  input.addEventListener("change", updateSettingsFromInputs);
});

[el.familyAdults, el.familyChildren].forEach((input) => {
  input?.addEventListener("input", handleFamilyPrefsChange);
  input?.addEventListener("change", handleFamilyPrefsChange);
});
el.familySplitToggle?.addEventListener("change", handleFamilyPrefsChange);
[el.settingsAdults, el.settingsChildren].forEach((input) => {
  input?.addEventListener("input", handleSettingsFamilyPrefsChange);
  input?.addEventListener("change", handleSettingsFamilyPrefsChange);
});

getCategorySelects().forEach((select) => {
  select.dataset.lastValue = select.value;
  select.addEventListener("change", handleCategorySelectChange);
});

el.activityForm.addEventListener("submit", addActivity);
el.activityFormCancelEdit.addEventListener("click", cancelActivityEdit);
el.costItemForm.addEventListener("submit", addCostItem);
el.costItemFormCancelEdit.addEventListener("click", cancelCostItemEdit);
el.activitiesTableBody.addEventListener("click", handleTableClick);
el.itineraryList?.addEventListener("click", handleItineraryListClick);
el.itineraryComposer?.addEventListener("click", handleItineraryListClick);
el.costItemsTableBody.addEventListener("click", handleCostItemsTableClick);
el.costsList?.addEventListener("click", handleCostsListClick);
el.costsComposer?.addEventListener("click", handleCostsListClick);
el.categoryBreakdown?.addEventListener("click", handleCategoryBreakdownClick);
el.dashboardItinerary.addEventListener("click", handleDashboardTimelineClick);
el.dashboardItinerary.addEventListener("keydown", handleDashboardTimelineKeydown);
el.dashboardDayDetail.addEventListener("click", handleDashboardDayModalClick);
el.printReportBtn?.addEventListener("click", () => {
  closeAppMenu();
  switchTab("summary");
  window.print();
  maybeQueueSupportBannerAfterMeaningfulAction("export");
});
el.resetDemoBtn?.addEventListener("click", resetDemoData);
el.startPlanningBtn?.addEventListener("click", startPlanningFromHero);
el.heroLoadDemoBtn?.addEventListener("click", () =>
  loadSampleTrip({ dismissOnboarding: true, targetTab: "dashboard", confirmReplace: true })
);
el.openTripBtn?.addEventListener("click", () => {
  closeAppMenu();
  openImportPicker({ confirmReplace: true });
});
el.loadSampleTripBtn?.addEventListener("click", loadSampleTripFromOnboarding);
el.startEmptyTripBtn?.addEventListener("click", startEmptyTripFromOnboarding);
el.onboardingImportBackupBtn?.addEventListener("click", () => openImportPicker({ confirmReplace: false }));
el.dismissOnboardingBtn?.addEventListener("click", dismissOnboardingPanelOnly);
el.setupWizardCard?.addEventListener("click", handleSetupWizardClick);
el.aboutAppBtn?.addEventListener("click", () => {
  closeAppMenu();
  openAboutModal();
});
el.footerAboutBtn?.addEventListener("click", openAboutModal);
el.exportJsonBtn.addEventListener("click", exportJsonBackup);
el.importJsonBtn.addEventListener("click", () => openImportPicker({ confirmReplace: false }));
el.importJsonFile.addEventListener("change", importJsonBackup);
el.globalSaveBtn?.addEventListener("click", handleGlobalSaveClick);
el.menuSaveTripBtn?.addEventListener("click", () => {
  closeAppMenu();
  handleGlobalSaveClick();
});
el.appMenuBtn?.addEventListener("click", () => {
  if (uiState.appMenuOpen) closeAppMenu();
  else openAppMenu();
});
el.footerMenuBtn?.addEventListener("click", openAppMenu);
el.appMenuCloseBtn?.addEventListener("click", closeAppMenu);
el.appMenu?.addEventListener("click", handleAppMenuClick);
el.importReminderModal?.addEventListener("click", handleImportReminderModalClick);
el.importReminderImportBtn?.addEventListener("click", () => {
  closeImportReminder();
  openImportPicker({ confirmReplace: false });
});
el.importReminderDismissBtn?.addEventListener("click", () => {
  closeImportReminder();
  startPlanningFromHero();
});
el.aboutModal?.addEventListener("click", handleAboutModalClick);
el.aboutModalClose?.addEventListener("click", closeAboutModal);
el.supportBannerDismissBtn?.addEventListener("click", () => dismissSupportBanner({ permanent: true }));
el.supportBannerCoffeeLink?.addEventListener("click", () => dismissSupportBanner({ permanent: true }));
el.dashboardQuickActivityForm.addEventListener("submit", addDashboardQuickActivity);
el.dashboardQuickFormCancelEdit.addEventListener("click", cancelDashboardQuickEdit);
document.addEventListener("keydown", handleGlobalKeydown);
el.activityFormModeButtons.basic?.addEventListener("click", () => setItineraryFormUiMode("basic"));
el.activityFormModeButtons.advanced?.addEventListener("click", () => setItineraryFormUiMode("advanced"));
el.costItemFormModeButtons.basic?.addEventListener("click", () => setCostFormUiMode("basic"));
el.costItemFormModeButtons.advanced?.addEventListener("click", () => setCostFormUiMode("advanced"));
el.tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.modeTarget === "plan" && isPlanningLocked()) {
      openSetupWizard({ step: 1, scroll: true });
      return;
    }
    switchTab(button.dataset.modeTarget);
  });
});

uiState.appReady = true;
enforceBlankLaunchState();
render();
switchTab(isPlanningLocked() ? "summary" : storageGet(ACTIVE_MODE_KEY) || "plan");
