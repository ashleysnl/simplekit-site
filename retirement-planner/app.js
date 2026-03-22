import {
  APP,
  PROVINCES,
  RISK_RETURNS,
  RRIF_MIN_WITHDRAWAL,
} from "./src/model/constants.js";
import {
  estimateOasClawback,
  estimateTotalTax,
} from "./src/model/calculations.js";
import { buildPlanModel } from "./src/model/projection.js";
import { computeCoverageScore } from "./src/model/score.js";
import { buildTimingPreview } from "./src/model/timingSim.js";
import { buildMeltdownComparison } from "./src/model/meltdown.js";
import { buildChangeSummary } from "./src/model/diff.js";
import { buildRiskDiagnostics } from "./src/model/risks.js";
import { buildYearBreakdown } from "./src/model/yearBreakdown.js";
import { buildRetirementPhases } from "./src/model/phases.js";
import { findPeakTaxYear } from "./src/model/peakTax.js";
import { saveScenarioSnapshot, removeScenarioSnapshot, renameScenarioSnapshot } from "./src/model/scenarioStore.js";
import { loadPlanFromStorage, savePlanToStorage } from "./src/model/planStore.js";
import {
  createLocalId,
  createDefaultLearningProgress as createDefaultLearningProgressSchema,
  createDefaultPlan as createDefaultPlanSchema,
  createBlankPlan as createBlankPlanSchema,
  createDemoPlan as createDemoPlanSchema,
  normalizePlan as normalizePlanSchema,
  ensureValidState as ensureValidStateSchema,
} from "./src/model/planSchema.js";
import {
  SUPPORT_URL,
  TOOLTIPS,
  OFFICIAL_REFERENCES,
  PLAN_SUMMARY_ROWS,
  LEARN_PROGRESS_ITEMS,
} from "./src/content/constants.js";
import { createUiFieldHelpers } from "./src/ui/fields.js";
import { drawPortfolioChart, drawIncomeCoverageChart } from "./src/ui/charts.js";
import { renderTooltipPopover, clearTooltipLayer, renderGlossaryHtml } from "./src/ui/tooltips.js";
import { drawLearnLineChart as drawLearnLineChartUi, drawLearnMultiLineChart as drawLearnMultiLineChartUi } from "./src/ui/learnCharts.js";
import { bindTooltipTriggers, renderCoverageHover, renderBalanceHover } from "./src/ui/interactions.js";
import { exportPlanJson, importPlanFromFileInput, promptImportPlan } from "./src/ui/actions/planActions.js";
import { navFromHash as navFromHashUi, syncNavHash as syncNavHashUi, normalizeNavTarget as normalizeNavTargetUi } from "./src/ui/navigation.js";
import { renderResultsStrip } from "./src/ui/resultsStrip.js";
import {
  ensureSupportMomentState,
  maybeTriggerSupportMoment,
  markSupportMomentShown,
  dismissSupportMoment,
  buildSupportMomentCard,
  isSupportDismissed,
} from "./src/ui/supportMoments.js";
import {
  buildSharePayload,
  buildShareUrl,
  buildShareSummary,
  parseSharedScenarioFromUrl,
  applySharedScenarioToPlan,
  buildScenarioPayloadFromSnapshot,
  buildScenarioShareUrl,
} from "./src/ui/share.js";
import { renderMethodologyHtml } from "./src/content/methodology.js";
import { renderRetirementGapHeadline } from "./src/ui/retirementGapHeadline.js";
import { renderCoverageScore } from "./src/ui/coverageScore.js";
import { renderCppOasTimingSimulator } from "./src/ui/cppOasTimingSimulator.js";
import { renderRrspMeltdownSimulator } from "./src/ui/rrspMeltdownSimulator.js";
import { renderRetirementInsight } from "./src/ui/retirementInsight.js";
import { renderGrossNetCallout } from "./src/ui/taxWedgeEnhancements.js";
import { renderWhatChangedPanel } from "./src/ui/whatChangedPanel.js";
import { renderScenarioCompareModal } from "./src/ui/scenarioCompare.js";
import { buildSummaryHtml, openPrintWindow } from "./src/ui/printSummary.js";
import { renderKeyRisks } from "./src/ui/keyRisks.js";
import { renderPeakTaxYear } from "./src/ui/peakTaxYear.js";
import { buildTimelineEvents, renderTimeline } from "./src/ui/timeline.js";
import { parsePresetFromUrl, buildPresetBannerHtml, applyPresetToPlan, clearPresetQuery } from "./src/ui/presets.js";
import { renderIncomeMap, drawIncomeMapCanvas, bindIncomeMapHover, pickIncomeMapAge } from "./src/ui/incomeMap.js";
import { renderStrategySuggestions } from "./src/ui/strategySuggestions.js";
import { renderClientSummaryMode } from "./src/ui/clientSummaryMode.js";
import { buildClientSummaryData } from "./src/model/clientSummary.js";
import { buildClientSummaryHtml, openClientSummaryPrintWindow } from "./src/ui/clientSummaryPrint.js";
import {
  learnCallouts as buildLearnCallouts,
  calculatePhaseWeightedSpending as calculatePhaseWeightedSpendingUi,
} from "./src/ui/learnUtils.js";
import { buildWizardStepHtml } from "./src/ui/views/wizardView.js";
import { buildLearnHtml } from "./src/ui/views/learnView.js";
import { buildPlanInputsHtml } from "./src/ui/views/planInputsView.js";
import { renderDashboardView } from "./src/ui/views/dashboardView.js";
import { renderAdvancedView, renderStressView } from "./src/ui/views/advancedView.js";
import { updateLearnOutputsView } from "./src/ui/views/learnOutputsView.js";
import { getPlanEditorConfigView } from "./src/ui/views/planEditorView.js";
import {
  getOasRiskLevel as getOasRiskLevelHelper,
  amountForDisplay as amountForDisplayHelper,
  findRowByAge as findRowByAgeHelper,
  findFirstRetirementRow as findFirstRetirementRowHelper,
  getBalanceLegendItems,
  getCoverageLegendItems,
  buildNextActions as buildNextActionsHelper,
} from "./src/ui/dashboardHelpers.js";
import {
  toPct,
  normalizePct,
  formatPct,
  formatCurrency,
  formatCompactCurrency,
  formatSignedCurrency,
  formatNumber,
  capitalize,
  clamp,
  escapeHtml,
} from "./src/ui/formatters.js";

globalThis.__RETIREMENT_APP_SCRIPT_EXECUTED = true;
globalThis.__RETIREMENT_APP_STAGE = "script-start";

const el = {
  heroHeader: document.getElementById("heroHeader"),
  landingPanel: document.getElementById("landingPanel"),
  appPanel: document.getElementById("appPanel"),
  startSimpleBtn: document.getElementById("startSimpleBtn"),
  landingDemoBtn: document.getElementById("landingDemoBtn"),
  landingImportBtn: document.getElementById("landingImportBtn"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  exportJsonBtnSecondary: document.getElementById("exportJsonBtnSecondary"),
  exportJsonBtnToolsTop: document.getElementById("exportJsonBtnToolsTop"),
  importJsonBtn: document.getElementById("importJsonBtn"),
  importJsonBtnSecondary: document.getElementById("importJsonBtnSecondary"),
  importJsonBtnToolsTop: document.getElementById("importJsonBtnToolsTop"),
  loadDemoBtn: document.getElementById("loadDemoBtn"),
  loadDemoBtnHome: document.getElementById("loadDemoBtnHome"),
  resetBtnHome: document.getElementById("resetBtnHome"),
  loadDemoBtnSecondary: document.getElementById("loadDemoBtnSecondary"),
  resetBtn: document.getElementById("resetBtn"),
  resetBtnSecondary: document.getElementById("resetBtnSecondary"),
  resetBtnToolsTop: document.getElementById("resetBtnToolsTop"),
  openGlossaryBtn: document.getElementById("openGlossaryBtn"),
  openGlossaryBtnToolsTop: document.getElementById("openGlossaryBtnToolsTop"),
  importJsonFile: document.getElementById("importJsonFile"),
  importJsonBtnHome: document.getElementById("importJsonBtnHome"),

  tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
  experienceModeButtons: Array.from(document.querySelectorAll("[data-action='set-experience-mode']")),
  navPanels: Array.from(document.querySelectorAll(".nav-panel")),

  canIRetireModule: document.getElementById("canIRetireModule"),
  readinessSummaryModule: document.getElementById("readinessSummaryModule"),
  planHealthHeroModule: document.getElementById("planHealthHeroModule"),
  advisorSectionModule: document.getElementById("advisorSectionModule"),
  keyInsightsModule: document.getElementById("keyInsightsModule"),
  incomeStoryModule: document.getElementById("incomeStoryModule"),
  planQualityModule: document.getElementById("planQualityModule"),
  quickControlsModule: document.getElementById("quickControlsModule"),
  projectionInterpretationModule: document.getElementById("projectionInterpretationModule"),
  incomeStackModule: document.getElementById("incomeStackModule"),
  plannerComparisonModule: document.getElementById("plannerComparisonModule"),
  dashboardActionHub: document.getElementById("dashboardActionHub"),
  scenarioToolbar: document.getElementById("scenarioToolbar"),
  kpiGrid: document.getElementById("kpiGrid"),
  kpiContext: document.getElementById("kpiContext"),
  resultsNarrativeModule: document.getElementById("resultsNarrativeModule"),
  retirementGapHeadline: document.getElementById("retirementGapHeadline"),
  retirementInsight: document.getElementById("retirementInsight"),
  incomeMapModule: document.getElementById("incomeMapModule"),
  whatChangedPanel: document.getElementById("whatChangedPanel"),
  presetBanner: document.getElementById("presetBanner"),
  resultsStrip: document.getElementById("resultsStrip"),
  taxWedgeMini: document.getElementById("taxWedgeMini"),
  coverageMixModule: document.getElementById("coverageMixModule"),
  coverageScoreModule: document.getElementById("coverageScoreModule"),
  timelineModule: document.getElementById("timelineModule"),
  keyRisksModule: document.getElementById("keyRisksModule"),
  strategySuggestionsModule: document.getElementById("strategySuggestionsModule"),
  peakTaxYearModule: document.getElementById("peakTaxYearModule"),
  timingSimulator: document.getElementById("timingSimulator"),
  meltdownSimulator: document.getElementById("meltdownSimulator"),
  commonMistakesModule: document.getElementById("commonMistakesModule"),
  methodologySummaryModule: document.getElementById("methodologySummaryModule"),
  sharedScenarioBanner: document.getElementById("sharedScenarioBanner"),
  supportMomentMount: document.getElementById("supportMomentMount"),
  clientSummaryModeMount: document.getElementById("clientSummaryModeMount"),
  plannerDashboardContent: document.getElementById("plannerDashboardContent"),
  clientSummaryToggleBtn: document.getElementById("clientSummaryToggleBtn"),
  exitClientSummaryBtn: document.getElementById("exitClientSummaryBtn"),
  mainChart: document.getElementById("mainChart"),
  balanceHover: document.getElementById("balanceHover"),
  chartLegend: document.getElementById("chartLegend"),
  dashboardStressToggle: document.getElementById("dashboardStressToggle"),
  dollarModeToggle: document.getElementById("dollarModeToggle"),
  yearScrubber: document.getElementById("yearScrubber"),
  yearScrubberValue: document.getElementById("yearScrubberValue"),
  coverageChart: document.getElementById("coverageChart"),
  coverageLegend: document.getElementById("coverageLegend"),
  coverageHover: document.getElementById("coverageHover"),
  incomeMapHover: null,
  coverageTableToggle: document.getElementById("coverageTableToggle"),
  coverageTableWrap: document.getElementById("coverageTableWrap"),
  coverageTable: document.getElementById("coverageTable"),
  walkthroughStrip: document.getElementById("walkthroughStrip"),
  walkthroughHeading: document.getElementById("walkthroughHeading"),
  yearCards: document.getElementById("yearCards"),
  dashboardReferences: document.getElementById("dashboardReferences"),
  planInputsPanel: document.getElementById("planInputsPanel"),
  learnPanel: document.getElementById("learnPanel"),
  nextActions: document.getElementById("nextActions"),
  basicsSummary: document.getElementById("basicsSummary"),
  dashboardStatus: document.getElementById("dashboardStatus"),
  resultLiveSummary: document.getElementById("resultLiveSummary"),
  retirementScoreCard: document.getElementById("retirementScoreCard"),
  copyShareLinkBtn: document.getElementById("copyShareLinkBtn"),
  copyMinimalLinkBtn: document.getElementById("copyMinimalLinkBtn"),
  copySummaryBtn: document.getElementById("copySummaryBtn"),
  copyScenarioShareBtn: document.getElementById("copyScenarioShareBtn"),
  copyScenarioSummaryBtn: document.getElementById("copyScenarioSummaryBtn"),
  compareScenariosBtn: document.getElementById("compareScenariosBtn"),
  downloadSummaryBtn: document.getElementById("downloadSummaryBtn"),
  downloadClientSummaryBtn: document.getElementById("downloadClientSummaryBtn"),

  wizardProgressBar: document.getElementById("wizardProgressBar"),
  wizardStepLabel: document.getElementById("wizardStepLabel"),
  wizardBody: document.getElementById("wizardBody"),
  wizardBackBtn: document.getElementById("wizardBackBtn"),
  wizardNextBtn: document.getElementById("wizardNextBtn"),

  advancedAccordion: document.getElementById("advancedAccordion"),
  scenarioCompareToggle: document.getElementById("scenarioCompareToggle"),
  scenarioSummary: document.getElementById("scenarioSummary"),
  stressTable: document.getElementById("stressTable"),
  openGlossaryBtnTools: document.getElementById("openGlossaryBtnTools"),
  resetCacheBtnTools: document.getElementById("resetCacheBtnTools"),
  methodologyPanel: document.getElementById("methodologyPanel"),

  notesInput: document.getElementById("notesInput"),
  tooltipLayer: document.getElementById("tooltipLayer"),

  glossaryModal: document.getElementById("glossaryModal"),
  openGlossary: document.getElementById("openGlossaryBtn"),
  closeGlossaryBtn: document.getElementById("closeGlossaryBtn"),
  glossaryContent: document.getElementById("glossaryContent"),
  planEditorModal: document.getElementById("planEditorModal"),
  planEditorTitle: document.getElementById("planEditorTitle"),
  planEditorContent: document.getElementById("planEditorContent"),
  closePlanEditorBtn: document.getElementById("closePlanEditorBtn"),
  scenarioCompareModal: document.getElementById("scenarioCompareModal"),
  scenarioCompareContent: document.getElementById("scenarioCompareContent"),
  closeScenarioCompareBtn: document.getElementById("closeScenarioCompareBtn"),
  printSummaryModal: document.getElementById("printSummaryModal"),
  printSummaryContent: document.getElementById("printSummaryContent"),
  closePrintSummaryBtn: document.getElementById("closePrintSummaryBtn"),
  printSummaryBtn: document.getElementById("printSummaryBtn"),
  copySummaryTextBtn: document.getElementById("copySummaryTextBtn"),

  appToast: document.getElementById("appToast"),
  supportButton: document.getElementById("supportButton"),
  bottomTabs: document.getElementById("bottomTabs"),
};
globalThis.__RETIREMENT_APP_STAGE = "elements-bound";

const schemaDeps = {
  app: APP,
  provinces: PROVINCES,
  riskReturns: RISK_RETURNS,
  learnProgressItems: LEARN_PROGRESS_ITEMS,
};
globalThis.__RETIREMENT_APP_STAGE = "schema-ready";

let state = loadPlan();
globalThis.__RETIREMENT_APP_STAGE = "state-loaded";
let sharedScenarioPayload = null;
let presetPayload = null;
const sessionSupportShown = (() => {
  try {
    return sessionStorage.getItem("supportMomentShown") === "1";
  } catch {
    return false;
  }
})();
let ui = {
  activeNav: state.uiState.activeNav || "results",
  tooltipKey: "",
  toastTimer: null,
  lastModel: null,
  selectedAge: state.uiState.timelineSelectedAge ?? null,
  showStressBand: true,
  showTodaysDollars: false,
  showGrossWithdrawals: Boolean(state.uiState.showGrossWithdrawals ?? true),
  showCoverageTable: false,
  advancedOpen: {
    basics: false,
    assumptions: false,
    income: false,
    accounts: false,
    rrif: false,
    capitalInjects: false,
    withdrawal: false,
    tax: false,
    references: false,
    modules: false,
  },
  planCardOpen: {
    basics: true,
    lifestyle: true,
    income: false,
    assumptions: false,
  },
  learnChartHover: {
    inflation: null,
    indexed: null,
    phases: null,
  },
  planEditorKey: "",
  isMobileLayout: false,
  eventsBound: false,
  activeSupportMoment: "",
  undoPlanSnapshot: null,
  pendingStrategyPreview: null,
  pendingStrategyKey: "",
  supportShownThisSession: sessionSupportShown,
  incomeMapHitZones: [],
  pendingPlanStartScroll: false,
  pendingLearnStartScroll: false,
};
globalThis.__RETIREMENT_APP_STAGE = "ui-created";

const WIZARD_STEP_COUNT = 5;
const LIFESTYLE_PRESETS = {
  basic: 0.55,
  comfortable: 0.7,
  higher: 0.85,
};

const { tooltipButton, numberField, learnNumberField, selectField } = createUiFieldHelpers({
  tooltips: TOOLTIPS,
  escapeHtml,
  formatNumber,
});
globalThis.__RETIREMENT_APP_STAGE = "helpers-ready";

init();

function init() {
  globalThis.__RETIREMENT_APP_STAGE = "init-enter";
  try {
    sharedScenarioPayload = parseSharedScenarioFromUrl(window.location);
    if (sharedScenarioPayload) state.uiState.lastSharedScenarioBannerDismissed = false;
    presetPayload = parsePresetFromUrl(window.location);
    state.uiState.lastChangeSummary = null;
    const hashNav = navFromHashUi(location.hash, normalizeNavTargetUi);
    if (hashNav) {
      ui.activeNav = hashNav;
      state.uiState.firstRun = false;
      state.uiState.activeNav = hashNav;
    }
    if (el.supportButton) el.supportButton.href = SUPPORT_URL;
    bindEvents();
    updateResponsiveLayout();
    renderAll();
    registerServiceWorker();
    globalThis.__RETIREMENT_APP_READY = true;
    globalThis.__RETIREMENT_APP_STAGE = "init-complete";
  } catch (error) {
    globalThis.__RETIREMENT_APP_STAGE = "init-recovering";
    console.error("App init failed. Attempting safe recovery.", error);
    try {
      state = createDefaultPlanLocal();
      ui.activeNav = "plan";
      if (el.supportButton) el.supportButton.href = SUPPORT_URL;
      bindEvents();
      updateResponsiveLayout();
      renderAll();
      registerServiceWorker();
      globalThis.__RETIREMENT_APP_READY = true;
      globalThis.__RETIREMENT_APP_STAGE = "init-recovered";
      toast("Recovered from startup issue by loading a clean local plan.");
    } catch (recoveryError) {
      globalThis.__RETIREMENT_APP_STAGE = "init-failed";
      console.error("App recovery failed.", recoveryError);
      globalThis.__RETIREMENT_APP_INIT_ERROR = String(recoveryError?.message || recoveryError || "Unknown initialization error");
      throw recoveryError;
    }
  }
}

function bindEvents() {
  if (ui.eventsBound) return;
  ui.eventsBound = true;

  el.startSimpleBtn?.addEventListener("click", () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    state.uiState.firstRun = false;
    state.uiState.hasStarted = true;
    state.uiState.activeNav = "plan";
    state.uiState.wizardStep = 1;
    state.uiState.experienceMode = "beginner";
    state.uiState.showAdvancedControls = false;
    ui.activeNav = "plan";
    ui.pendingPlanStartScroll = true;
    savePlan();
    renderAll();
    queueGuidedSetupScroll();
  });

  el.landingDemoBtn?.addEventListener("click", () => {
    state = createDemoPlanLocal();
    ui.activeNav = "results";
    savePlan();
    renderAll();
    toast("Demo plan loaded.");
  });

  el.loadDemoBtn?.addEventListener("click", () => {
    state = createDemoPlanLocal();
    ui.activeNav = "results";
    savePlan();
    renderAll();
    toast("Demo plan loaded.");
  });
  el.loadDemoBtnHome?.addEventListener("click", () => {
    state = createDemoPlanLocal();
    ui.activeNav = "results";
    savePlan();
    renderAll();
    toast("Demo plan loaded.");
  });
  el.resetBtnHome?.addEventListener("click", resetPlanToBlank);

  el.exportJsonBtn?.addEventListener("click", exportJson);
  el.exportJsonBtnSecondary?.addEventListener("click", exportJson);
  el.exportJsonBtnToolsTop?.addEventListener("click", exportJson);
  el.importJsonBtn?.addEventListener("click", openImportPicker);
  el.importJsonBtnSecondary?.addEventListener("click", openImportPicker);
  el.importJsonBtnToolsTop?.addEventListener("click", openImportPicker);
  el.importJsonBtnHome?.addEventListener("click", openImportPicker);
  el.landingImportBtn?.addEventListener("click", openImportPicker);
  el.importJsonFile?.addEventListener("change", importJsonFromFile);
  el.loadDemoBtnSecondary?.addEventListener("click", () => {
    state = createDemoPlanLocal();
    ui.activeNav = "results";
    savePlan();
    renderAll();
    toast("Demo plan loaded.");
  });
  el.resetBtnSecondary?.addEventListener("click", resetPlanToBlank);
  el.resetBtnToolsTop?.addEventListener("click", resetPlanToBlank);

  el.resetBtn?.addEventListener("click", resetPlanToBlank);

  el.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.navTarget || "results";
      setActiveNav(target);
    });
  });

  el.wizardBackBtn?.addEventListener("click", () => {
    state.uiState.wizardStep = Math.max(1, state.uiState.wizardStep - 1);
    savePlan();
    renderAll();
  });

  el.wizardNextBtn?.addEventListener("click", () => {
    if (state.uiState.wizardStep >= WIZARD_STEP_COUNT) {
      state.uiState.wizardStep = WIZARD_STEP_COUNT;
      state.uiState.unlocked.advanced = true;
      state.uiState.justCompletedWizard = true;
      state.uiState.activeNav = "results";
      ui.activeNav = "results";
      savePlan();
      renderAll();
      toast("Your first retirement result is ready.");
      return;
    }

    state.uiState.wizardStep = Math.min(WIZARD_STEP_COUNT, state.uiState.wizardStep + 1);
    if (state.uiState.wizardStep >= WIZARD_STEP_COUNT) state.uiState.unlocked.advanced = true;
    savePlan();
    renderAll();
  });

  el.notesInput?.addEventListener("input", () => {
    state.notes = el.notesInput.value;
    savePlan();
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === "dashboardStressToggle" && target instanceof HTMLInputElement) {
      ui.showStressBand = !!target.checked;
      renderDashboard();
      return;
    }
    if (target.id === "dollarModeToggle" && target instanceof HTMLInputElement) {
      ui.showTodaysDollars = !!target.checked;
      renderDashboard();
      return;
    }
    if (target.id === "coverageTableToggle" && target instanceof HTMLInputElement) {
      ui.showCoverageTable = !!target.checked;
      renderDashboard();
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === "yearScrubber" && target instanceof HTMLInputElement) {
      ui.selectedAge = Number(target.value);
      state.uiState.timelineSelectedAge = ui.selectedAge;
      if (el.yearScrubberValue) el.yearScrubberValue.textContent = `Age ${ui.selectedAge}`;
      renderDashboard();
    }
  });

  el.coverageChart?.addEventListener("mousemove", handleCoverageChartPointer);
  el.coverageChart?.addEventListener("mouseleave", () => {
    if (el.coverageHover) el.coverageHover.hidden = true;
  });
  el.mainChart?.addEventListener("mousemove", handleBalanceChartPointer);
  el.mainChart?.addEventListener("mouseleave", () => {
    if (el.balanceHover) el.balanceHover.hidden = true;
  });
  document.addEventListener("mousemove", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id !== "incomeMapCanvas") return;
    const hover = document.getElementById("incomeMapHover");
    bindIncomeMapHover(event, {
      hitZones: ui.incomeMapHitZones,
      hoverEl: hover,
      chartEl: target,
      formatCurrency,
      formatPct,
      showGross: Boolean(state.uiState.showGrossWithdrawals ?? true),
    });
  });
  document.addEventListener("mouseleave", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id !== "incomeMapCanvas") return;
    const hover = document.getElementById("incomeMapHover");
    if (hover) hover.hidden = true;
  }, true);
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLCanvasElement)) return;
    if (target.id !== "incomeMapCanvas") return;
    const age = pickIncomeMapAge(event, ui.incomeMapHitZones);
    if (!Number.isFinite(age)) return;
    ui.selectedAge = age;
    state.uiState.timelineSelectedAge = age;
    if (el.yearScrubber) el.yearScrubber.value = String(age);
    if (el.yearScrubberValue) el.yearScrubberValue.textContent = `Age ${age}`;
    renderDashboard();
  });

  el.scenarioCompareToggle?.addEventListener("change", () => {
    state.uiState.showScenarioCompare = !!el.scenarioCompareToggle.checked;
    savePlan();
    renderStress();
  });

  document.addEventListener("input", handleBoundInput);
  document.addEventListener("change", handleBoundInput);
  document.addEventListener("input", handleLearnBoundInput);
  document.addEventListener("change", handleLearnBoundInput);
  document.addEventListener("input", handleDashboardInput);
  document.addEventListener("change", handleDashboardInput);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("toggle", handleDetailsToggle, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeTooltip();
  });
  window.addEventListener("resize", updateResponsiveLayout);
  window.addEventListener("orientationchange", updateResponsiveLayout);

  el.openGlossary?.addEventListener("click", openGlossary);
  el.openGlossaryBtnTools?.addEventListener("click", openGlossary);
  el.openGlossaryBtnToolsTop?.addEventListener("click", openGlossary);
  el.closeGlossaryBtn?.addEventListener("click", () => el.glossaryModal?.close());
  el.glossaryModal?.addEventListener("click", (event) => {
    if (event.target === el.glossaryModal) el.glossaryModal.close();
  });
  el.copyShareLinkBtn?.addEventListener("click", () => copyShare(false));
  el.copyMinimalLinkBtn?.addEventListener("click", () => copyShare(true));
  el.copySummaryBtn?.addEventListener("click", copySummary);
  el.copyScenarioShareBtn?.addEventListener("click", copyScenarioShare);
  el.copyScenarioSummaryBtn?.addEventListener("click", copyScenarioSummary);
  el.compareScenariosBtn?.addEventListener("click", openScenarioCompare);
  el.downloadSummaryBtn?.addEventListener("click", openPrintSummary);
  el.downloadClientSummaryBtn?.addEventListener("click", printClientSummaryNow);
  el.resetCacheBtnTools?.addEventListener("click", resetCachedAppData);
  el.closePlanEditorBtn?.addEventListener("click", closePlanEditor);
  el.closeScenarioCompareBtn?.addEventListener("click", () => el.scenarioCompareModal?.close());
  el.scenarioCompareModal?.addEventListener("click", (event) => {
    if (event.target === el.scenarioCompareModal) el.scenarioCompareModal.close();
  });
  el.closePrintSummaryBtn?.addEventListener("click", () => el.printSummaryModal?.close());
  el.printSummaryModal?.addEventListener("click", (event) => {
    if (event.target === el.printSummaryModal) el.printSummaryModal.close();
  });
  el.printSummaryBtn?.addEventListener("click", printSummaryNow);
  el.copySummaryTextBtn?.addEventListener("click", copySummary);
  el.clientSummaryToggleBtn?.addEventListener("click", () => setClientSummaryMode(true));
  el.exitClientSummaryBtn?.addEventListener("click", () => setClientSummaryMode(false));
  el.planEditorModal?.addEventListener("click", (event) => {
    if (event.target === el.planEditorModal) closePlanEditor();
  });
}

function updateResponsiveLayout() {
  const mobile = typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 1100px)").matches
    : window.innerWidth <= 1100;
  ui.isMobileLayout = mobile;
  document.body.classList.toggle("mobile-layout", mobile);
}

function applyLifestylePreset(preset) {
  const nextPreset = Object.prototype.hasOwnProperty.call(LIFESTYLE_PRESETS, preset) ? preset : "comfortable";
  if (!state.uiState.guided) state.uiState.guided = {};
  state.uiState.guided.lifestylePreset = nextPreset;
  state.uiState.guided.retirementIncomePercent = LIFESTYLE_PRESETS[nextPreset];
  if (state.uiState.guided.retirementIncomeMode !== "dollar") {
    syncDesiredSpendingFromGuided();
  }
}

function syncDesiredSpendingFromGuided() {
  const percent = clamp(normalizePct(state.uiState.guided?.retirementIncomePercent ?? 0.7), 0.3, 1.2);
  state.uiState.guided.retirementIncomePercent = percent;
  state.profile.desiredSpending = Math.max(12000, Math.round(Number(state.profile.annualIncome || 0) * percent / 500) * 500);
}

function syncAnnualContributionFromPercent(percentInput) {
  const income = Math.max(0, Number(state.profile.annualIncome || 0));
  const rawPercent = normalizePct(percentInput);
  state.savings.annualContribution = Math.max(0, Math.round((income * rawPercent) / 500) * 500);
}

function syncAccountsFromGuidedSplit() {
  const total = Math.max(0, Number(state.savings.currentTotal || 0));
  const rrspShare = clamp(normalizePct(state.uiState.guided?.rrspShare ?? 0.6), 0, 1);
  const rrsp = Math.round(total * rrspShare);
  const tfsa = Math.round(total - rrsp);
  state.uiState.guided.rrspShare = rrspShare;
  state.accounts.rrsp = rrsp;
  state.accounts.tfsa = tfsa;
  state.accounts.nonRegistered = 0;
  state.accounts.cash = 0;
}

function applyGuidedDefaults() {
  if (state.uiState.guided?.useCanadianDefaults) {
    state.assumptions.inflation = 0.02;
    state.assumptions.riskProfile = "balanced";
    state.assumptions.returns.balanced = 0.05;
    state.strategy.estimateTaxes = true;
    state.strategy.oasClawbackModeling = true;
    state.income.cpp.amountAt65 = Math.max(12000, Number(state.income.cpp.amountAt65 || 0));
    state.income.oas.amountAt65 = Math.max(9000, Number(state.income.oas.amountAt65 || 0));
  }
}

function applyGuidedEstimateRetirementAge() {
  if (!state.uiState.guided?.estimateRetirementAge) return;
  const currentAge = ageNow();
  const estimatedAge = currentAge < 35 ? 67 : currentAge < 50 ? 65 : 63;
  state.profile.retirementAge = clamp(estimatedAge, 50, 75);
}

function finalizeGuidedPlan() {
  if (!state.uiState.guided) return;
  applyGuidedEstimateRetirementAge();
  if (state.uiState.guided.retirementIncomeMode !== "dollar") syncDesiredSpendingFromGuided();
  if (state.uiState.experienceMode !== "advanced") {
    syncAccountsFromGuidedSplit();
    applyGuidedDefaults();
  }
}

function handleDocumentClick(event) {
  const rawTarget = event.target;
  const target = rawTarget instanceof Element ? rawTarget : rawTarget?.parentElement;
  if (!(target instanceof Element)) return;

  const navTargetBtn = target.closest("[data-nav-target]");
  if (navTargetBtn && !(navTargetBtn instanceof HTMLButtonElement && navTargetBtn.classList.contains("tab-btn"))) {
    const navTarget = navTargetBtn.getAttribute("data-nav-target");
    if (navTarget) {
      if (navTarget === "plan") ui.pendingPlanStartScroll = true;
      setActiveNav(navTarget);
      if (navTarget === "plan") queueGuidedSetupScroll();
      return;
    }
  }

  const tooltipBtn = target.closest("[data-tooltip-key]");
  if (tooltipBtn) {
    event.preventDefault();
    const key = tooltipBtn.getAttribute("data-tooltip-key") || "";
    if (!key) return;
    if (ui.tooltipKey === key) {
      closeTooltip();
      return;
    }
    openTooltip(key, tooltipBtn);
    return;
  }

  const actionBtn = target.closest("[data-action]");
  if (actionBtn) {
    const action = actionBtn.getAttribute("data-action");
    if (action === "open-methodology") {
      setActiveNav("tools");
      closeTooltip();
      return;
    }
    if (action === "focus-results-section") {
      const targetId = actionBtn.getAttribute("data-value") || "";
      ui.activeNav = "results";
      state.uiState.activeNav = "results";
      renderAll();
      if (targetId) {
        requestAnimationFrame(() => {
          const detailsTarget = document.getElementById(targetId);
          if (detailsTarget instanceof HTMLDetailsElement) {
            const peerDetails = Array.from(document.querySelectorAll(".dashboard-detail-accordion"));
            peerDetails.forEach((item) => {
              if (item instanceof HTMLDetailsElement) item.open = item.id === targetId;
            });
          }
          document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return;
    }
    if (action === "apply-timing-preview") {
      const beforePlan = clonePlan(state);
      const beforeModel = buildPlanModel(beforePlan);
      const sim = state.uiState.timingSim;
      state.income.cpp.startAge = Number(sim.cppStartAge);
      state.income.oas.startAge = Number(sim.oasStartAge);
      const afterModel = buildPlanModel(state);
      state.uiState.lastChangeSummary = buildChangeSummary(beforeModel, afterModel, state);
      ui.undoPlanSnapshot = beforePlan;
      savePlan();
      renderAll();
      toast("Timing preview applied. See What changed?");
      return;
    }
    if (action === "reset-timing-preview") {
      state.uiState.timingSim.cppStartAge = state.income.cpp.startAge;
      state.uiState.timingSim.oasStartAge = state.income.oas.startAge;
      state.uiState.timingSim.linkTiming = false;
      savePlan();
      renderAll();
      toast("Timing preview reset.");
      return;
    }
    if (action === "open-learn") {
      ui.pendingLearnStartScroll = true;
      setActiveNav("learn");
      return;
    }
    if (action === "see-how-it-works") {
      setActiveNav("plan");
      requestAnimationFrame(() => {
        document.querySelector(".guided-stepper-shell")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    if (action === "set-lifestyle-preset") {
      applyLifestylePreset(actionBtn.getAttribute("data-value") || "comfortable");
      savePlan();
      renderAll();
      return;
    }
    if (action === "set-retirement-income-mode") {
      if (!state.uiState.guided) state.uiState.guided = {};
      state.uiState.guided.retirementIncomeMode = actionBtn.getAttribute("data-value") === "dollar" ? "dollar" : "percent";
      if (state.uiState.guided.retirementIncomeMode !== "dollar") syncDesiredSpendingFromGuided();
      savePlan();
      renderAll();
      return;
    }
    if (action === "set-contribution-mode") {
      if (!state.uiState.guided) state.uiState.guided = {};
      state.uiState.guided.savingsContributionMode = actionBtn.getAttribute("data-value") === "percent" ? "percent" : "annual";
      savePlan();
      renderAll();
      return;
    }
    if (action === "tools-save-plan") {
      exportJson();
      return;
    }
    if (action === "tools-load-plan") {
      openImportPicker();
      return;
    }
    if (action === "tools-reset-plan") {
      resetPlanToBlank();
      return;
    }
    if (action === "tools-open-glossary") {
      openGlossary();
      return;
    }
    if (action === "set-experience-mode") {
      const value = actionBtn.getAttribute("data-value") === "advanced" ? "advanced" : "beginner";
      state.uiState.experienceMode = value;
      if (value === "advanced") {
        state.uiState.unlocked.advanced = true;
      }
      savePlan();
      renderAll();
      toast(value === "advanced" ? "Advanced Mode enabled." : "Beginner Mode enabled.");
      return;
    }
    if (action === "set-dashboard-scenario") {
      const value = actionBtn.getAttribute("data-value") || "base";
      if (value === "custom") {
        setActiveNav("scenarios");
        return;
      }
      state.uiState.dashboardScenario = ["base", "inflation", "returns", "longevity"].includes(value) ? value : "base";
      savePlan();
      ui.activeNav = "results";
      state.uiState.activeNav = "results";
      renderAll();
      toast(state.uiState.dashboardScenario === "base" ? "Base case shown." : "Scenario view updated.");
      return;
    }
    if (action === "edit-plan-row") {
      const key = actionBtn.getAttribute("data-value") || "";
      if (!key) return;
      openPlanEditor(key);
      return;
    }
    if (action === "toggle-learn-progress") {
      const key = actionBtn.getAttribute("data-value") || "";
      if (!key) return;
      const current = Boolean(state.uiState.learningProgress?.[key]);
      if (!state.uiState.learningProgress) state.uiState.learningProgress = createDefaultLearningProgressLocal();
      state.uiState.learningProgress[key] = !current;
      savePlan();
      renderLearn();
      return;
    }
    if (action === "launch-planner") {
      setActiveNav("plan");
      return;
    }
    if (action === "copy-share-link") {
      copyShare(false);
      return;
    }
    if (action === "copy-minimal-link") {
      copyShare(true);
      return;
    }
    if (action === "copy-plan-summary") {
      copySummary();
      return;
    }
    if (action === "copy-scenario-share") {
      copyScenarioShare();
      return;
    }
    if (action === "copy-scenario-summary") {
      copyScenarioSummary();
      return;
    }
    if (action === "download-summary") {
      openPrintSummary();
      return;
    }
    if (action === "open-advanced") {
      state.uiState.unlocked.advanced = true;
      state.uiState.experienceMode = "advanced";
      state.uiState.showAdvancedControls = true;
      setActiveNav("tools");
      savePlan();
      return;
    }
    if (action === "open-stress") {
      setActiveNav("scenarios");
      return;
    }
    if (action === "open-spouse") {
      state.profile.hasSpouse = true;
      state.uiState.unlocked.spouse = true;
      state.uiState.unlocked.advanced = true;
      setActiveNav("tools");
      savePlan();
      renderAll();
      return;
    }
    if (action === "risk") {
      const value = actionBtn.getAttribute("data-value") || "balanced";
      state.assumptions.riskProfile = value;
      savePlan();
      renderAll();
      return;
    }
    if (action === "strategy") {
      const beforePlan = clonePlan(state);
      const beforeModel = buildPlanModel(beforePlan);
      const value = actionBtn.getAttribute("data-value") || "tax-smart";
      state.strategy.withdrawal = value;
      const afterModel = buildPlanModel(state);
      state.uiState.lastChangeSummary = buildChangeSummary(beforeModel, afterModel, state);
      ui.undoPlanSnapshot = beforePlan;
      savePlan();
      renderAll();
      toast("Strategy updated. See What changed?");
      return;
    }
    if (action === "preview-strategy") {
      const key = actionBtn.getAttribute("data-value") || "";
      if (!key) return;
      const previewPlan = buildStrategyPreviewPlan(state, key);
      const summary = buildChangeSummary(ui.lastModel, buildPlanModel(previewPlan), previewPlan);
      ui.pendingStrategyPreview = previewPlan;
      ui.pendingStrategyKey = key;
      state.uiState.selectedScenarioLabel = `Preview: ${key}`;
      state.uiState.lastChangeSummary = summary;
      ui.activeNav = "results";
      state.uiState.activeNav = "results";
      renderAll();
      scrollDashboardToTop();
      toast("Strategy preview ready.");
      return;
    }
    if (action === "apply-strategy-preview") {
      if (!ui.pendingStrategyPreview) return;
      const beforePlan = clonePlan(state);
      state = clonePlan(ui.pendingStrategyPreview);
      state.uiState.selectedScenarioLabel = `Applied: ${ui.pendingStrategyKey}`;
      ui.pendingStrategyPreview = null;
      ui.pendingStrategyKey = "";
      ui.undoPlanSnapshot = beforePlan;
      savePlan();
      renderAll();
      scrollDashboardToTop();
      toast("Strategy preview applied.");
      return;
    }
    if (action === "undo-strategy-preview") {
      ui.pendingStrategyPreview = null;
      ui.pendingStrategyKey = "";
      state.uiState.lastChangeSummary = null;
      savePlan();
      renderDashboard();
      scrollDashboardToTop();
      toast("Strategy preview cleared.");
      return;
    }
    if (action === "add-capital-inject") {
      state.savings.capitalInjects.push(createCapitalInjectItem());
      savePlan();
      renderAll();
      return;
    }
    if (action === "remove-capital-inject") {
      const id = actionBtn.getAttribute("data-value") || "";
      state.savings.capitalInjects = state.savings.capitalInjects.filter((item) => item.id !== id);
      savePlan();
      renderAll();
      return;
    }
    if (action === "tooltip-example") {
      const key = actionBtn.getAttribute("data-value") || "";
      const body = actionBtn.closest(".tooltip-popover")?.querySelector(".tooltip-example");
      const tip = TOOLTIPS[key];
      if (tip && body) body.textContent = tip.example || "No example available.";
      return;
    }
    if (action === "dismiss-support-moment") {
      dismissSupportMoment(state.uiState);
      ui.activeSupportMoment = "";
      savePlan();
      renderDashboardSupportMoment();
      return;
    }
    if (action === "support-opt-out") {
      state.uiState.supportOptOut = true;
      ui.activeSupportMoment = "";
      savePlan();
      renderDashboardSupportMoment();
      toast("Thanks for supporting.");
      return;
    }
    if (action === "dismiss-last-change") {
      state.uiState.lastChangeSummary = null;
      savePlan();
      renderDashboard();
      return;
    }
    if (action === "undo-last-change") {
      if (!ui.undoPlanSnapshot) {
        toast("Nothing to undo.");
        return;
      }
      state = clonePlan(ui.undoPlanSnapshot);
      ui.undoPlanSnapshot = null;
      state.uiState.lastChangeSummary = null;
      savePlan();
      renderAll();
      toast("Last change undone.");
      return;
    }
    if (action === "save-current-scenario") {
      const scenario = saveScenarioSnapshot(state, ui.lastModel, `Scenario ${((state.uiState.scenarios || []).length || 0) + 1}`);
      savePlan();
      openScenarioCompare();
      toast(`Saved ${scenario.name}.`);
      return;
    }
    if (action === "open-scenario-compare") {
      openScenarioCompare();
      return;
    }
    if (action === "delete-scenario") {
      const id = actionBtn.getAttribute("data-value") || "";
      if (!id) return;
      removeScenarioSnapshot(state, id);
      savePlan();
      openScenarioCompare();
      return;
    }
    if (action === "rename-scenario") {
      const id = actionBtn.getAttribute("data-value") || "";
      if (!id) return;
      const next = prompt("Rename scenario");
      if (!next) return;
      renameScenarioSnapshot(state, id, next);
      savePlan();
      openScenarioCompare();
      return;
    }
    if (action === "preview-scenario") {
      const id = actionBtn.getAttribute("data-value") || "";
      if (!id) return;
      const scenario = (state.uiState.scenarios || []).find((s) => s.id === id);
      if (!scenario) return;
      const payload = buildScenarioPayloadFromSnapshot(scenario);
      sharedScenarioPayload = payload;
      state.uiState.lastSharedScenarioBannerDismissed = false;
      state.uiState.selectedScenarioLabel = scenario.name || "";
      savePlan();
      renderDashboardSharedScenarioBanner();
      toast("Scenario loaded in preview banner.");
      return;
    }
    if (action === "share-scenario") {
      const id = actionBtn.getAttribute("data-value") || "";
      if (!id) return;
      copyScenarioShare(id);
      return;
    }
    if (action === "apply-shared-scenario") {
      if (!sharedScenarioPayload) return;
      state = applySharedScenarioToPlan(state, sharedScenarioPayload);
      state.uiState.firstRun = false;
      state.uiState.hasStarted = true;
      state.uiState.lastSharedScenarioBannerDismissed = true;
      sharedScenarioPayload = null;
      clearSharedScenarioQuery();
      ensureValidStateLocal();
      savePlan();
      renderAll();
      toast("Shared scenario applied to your local plan.");
      return;
    }
    if (action === "preview-shared-scenario") {
      if (!sharedScenarioPayload || !ui.lastModel) return;
      const previewPlan = applySharedScenarioToPlan(state, sharedScenarioPayload);
      state.uiState.lastChangeSummary = buildChangeSummary(ui.lastModel, buildPlanModel(previewPlan), previewPlan);
      renderWhatChangedModule();
      toast("Shared scenario preview generated.");
      return;
    }
    if (action === "apply-preset") {
      if (!presetPayload) return;
      if (!state.uiState.firstRun) {
        const ok = confirm("Apply preset to your current plan? This will update assumptions but you can Undo via your saved copy/export.");
        if (!ok) return;
      }
      state = applyPresetToPlan(state, presetPayload, createDemoPlanLocal);
      ensureValidStateLocal();
      presetPayload = null;
      clearPresetQuery();
      savePlan();
      renderAll();
      toast("Preset applied to your local plan.");
      return;
    }
    if (action === "dismiss-preset") {
      presetPayload = null;
      clearPresetQuery();
      renderDashboardPresetBanner();
      return;
    }
    if (action === "focus-strategies") {
      document.getElementById("strategySuggestions")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "dismiss-shared-scenario") {
      state.uiState.lastSharedScenarioBannerDismissed = true;
      sharedScenarioPayload = null;
      clearSharedScenarioQuery();
      savePlan();
      renderDashboardSharedScenarioBanner();
      return;
    }
    if (action === "enable-clawback") {
      state.strategy.oasClawbackModeling = true;
      savePlan();
      renderAll();
      toast("OAS clawback modeling enabled.");
      return;
    }
    if (action === "enable-rrif") {
      state.strategy.applyRrifMinimums = true;
      savePlan();
      renderAll();
      toast("RRIF minimum rules enabled.");
      return;
    }
    if (action === "focus-timing-sim" || action === "focus-meltdown-sim") {
      setActiveNav("results");
      const targetId = action === "focus-timing-sim" ? "timingSimulator" : "meltdownSimulator";
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    if (action === "set-selected-age") {
      const nextAge = Number(actionBtn.getAttribute("data-value"));
      if (!Number.isFinite(nextAge)) return;
      ui.selectedAge = nextAge;
      state.uiState.timelineSelectedAge = nextAge;
      if (el.yearScrubber) el.yearScrubber.value = String(nextAge);
      if (el.yearScrubberValue) el.yearScrubberValue.textContent = `Age ${nextAge}`;
      const rs = document.getElementById("resultsAgePicker");
      if (rs) rs.value = String(nextAge);
      const gp = document.getElementById("gapAgePicker");
      if (gp) gp.value = String(nextAge);
      savePlan();
      renderDashboard();
      return;
    }
    if (action === "open-client-summary") {
      setClientSummaryMode(true);
      return;
    }
    if (action === "exit-client-summary") {
      setClientSummaryMode(false);
      return;
    }
    if (action === "print-client-summary") {
      printClientSummaryNow();
      return;
    }
    if (action === "learn-send-spending") {
      state.profile.desiredSpending = Math.max(12000, Number(state.uiState.learn.inflation.spendingToday || state.profile.desiredSpending));
      state.assumptions.inflation = clamp(normalizePct(state.uiState.learn.inflation.rate), 0.005, 0.08);
      savePlan();
      renderAll();
      toast("Spending and inflation sent to planner.");
      return;
    }
    if (action === "learn-send-tax-rate") {
      state.uiState.learn.taxGrossUp.rate = clamp(normalizePct(state.uiState.learn.taxGrossUp.rate), 0, 0.5);
      savePlan();
      toast("Tax gross-up assumption saved in Learn.");
      return;
    }
    if (action === "learn-send-phases") {
      const weighted = calculatePhaseWeightedSpendingUi(state.uiState.learn.phases);
      state.profile.desiredSpending = Math.max(12000, weighted);
      savePlan();
      renderAll();
      toast("Phase-adjusted spending estimate sent to planner.");
      return;
    }
  }

  if (!target.closest(".tooltip-popover")) closeTooltip();
}

function handleBoundInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.matches("[data-bind]")) return;

  const path = target.getAttribute("data-bind");
  if (!path) return;
  const trackChange = event.type === "change" && isMaterialChangePath(path);
  const beforePlan = trackChange ? clonePlan(state) : null;
  const beforeModel = trackChange ? buildPlanModel(beforePlan) : null;

  captureAdvancedAccordionState();
  capturePlannerCardState();

  let value;
  if (target instanceof HTMLInputElement && target.type === "checkbox") {
    value = target.checked;
  } else {
    value = target.value;
  }

  const type = target.getAttribute("data-type") || "string";
  if (type === "number") {
    const parsed = Number(value);
    value = Number.isFinite(parsed) ? parsed : 0;
  }
  if (target.getAttribute("data-percent-input") === "1" && typeof value === "number") {
    value /= 100;
  }
  const displayAs = target.getAttribute("data-display-as") || "";
  if (displayAs === "age" && typeof value === "number") {
    value = APP.currentYear - value;
  }
  if (displayAs === "income-percent" && typeof value === "number") {
    syncAnnualContributionFromPercent(value);
    value = state.savings.annualContribution;
  }

  setByPath(state, path, value);

  if (path === "income.pension.enabled" && !value) state.income.pension.amount = 0;
  if (path === "profile.retirementAge") {
    state.income.pension.startAge = Math.max(state.income.pension.startAge, 40);
  }
  if (path === "profile.annualIncome" && state.uiState.guided?.retirementIncomeMode !== "dollar") {
    syncDesiredSpendingFromGuided();
  }
  if (path === "uiState.guided.retirementIncomePercent" && state.uiState.guided?.retirementIncomeMode !== "dollar") {
    syncDesiredSpendingFromGuided();
  }
  if ((path === "uiState.guided.rrspShare" || path === "savings.currentTotal") && state.uiState.experienceMode !== "advanced") {
    syncAccountsFromGuidedSplit();
  }
  if (path === "uiState.guided.useCanadianDefaults" && value && state.uiState.experienceMode !== "advanced") {
    applyGuidedDefaults();
  }
  if (path === "uiState.guided.estimateRetirementAge") {
    applyGuidedEstimateRetirementAge();
  }
  if (path === "uiState.showGrossWithdrawals") {
    ui.showGrossWithdrawals = Boolean(value);
  }
  if (path === "uiState.timingSim.linkTiming" && value) {
    const cppAge = Number(state.uiState.timingSim.cppStartAge);
    state.uiState.timingSim.oasStartAge = Math.min(70, Math.max(65, 65 + (cppAge - 60)));
  }
  if (path === "uiState.timingSim.cppStartAge" && state.uiState.timingSim.linkTiming) {
    const cppAge = Number(state.uiState.timingSim.cppStartAge);
    state.uiState.timingSim.oasStartAge = Math.min(70, Math.max(65, 65 + (cppAge - 60)));
  }

  // Avoid re-rendering while the user is actively editing.
  // Full recalculation runs on committed change events.
  if (event.type === "input" && !(target instanceof HTMLInputElement && target.type === "checkbox")) {
    if (target.getAttribute("data-live-input") === "1") {
      if (path === "uiState.advancedSearch") applyAdvancedSearchFilter();
      if (path.startsWith("uiState.incomeMap.")) {
        renderDashboard();
      }
    }
    savePlan();
    return;
  }

  renderAll();
  if (trackChange && beforeModel) {
    const summary = buildChangeSummary(beforeModel, ui.lastModel, state);
    if (summary) {
      ui.undoPlanSnapshot = beforePlan;
      state.uiState.lastChangeSummary = summary;
      toast("Plan updated. See What changed?");
    }
  }
  savePlan();
}

function handleLearnBoundInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.matches("[data-learn-bind]")) return;

  const path = target.getAttribute("data-learn-bind");
  if (!path) return;

  let value;
  if (target instanceof HTMLInputElement && target.type === "checkbox") value = target.checked;
  else value = target.value;

  const type = target.getAttribute("data-type") || "string";
  if (type === "number") {
    const parsed = Number(value);
    value = Number.isFinite(parsed) ? parsed : 0;
  }
  if (target.getAttribute("data-percent-input") === "1" && typeof value === "number") {
    value /= 100;
  }

  setByPath(state, path, value);
  ensureValidStateLocal();
  savePlan();
  updateLearnOutputs();
}

function handleDashboardInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.id !== "resultsAgePicker" && target.id !== "gapAgePicker") return;
  const nextAge = Number(target.value);
  if (!Number.isFinite(nextAge)) return;
  ui.selectedAge = nextAge;
  state.uiState.timelineSelectedAge = nextAge;
  if (el.yearScrubber) el.yearScrubber.value = String(nextAge);
  if (el.yearScrubberValue) el.yearScrubberValue.textContent = `Age ${nextAge}`;
  const rs = document.getElementById("resultsAgePicker");
  if (rs) rs.value = String(nextAge);
  const gp = document.getElementById("gapAgePicker");
  if (gp) gp.value = String(nextAge);
  renderDashboard();
}

function renderAll() {
  ensureValidStateLocal();
  finalizeGuidedPlan();
  ensureValidStateLocal();
  ui.showGrossWithdrawals = Boolean(state.uiState.showGrossWithdrawals ?? true);
  ui.activeNav = normalizeNavTargetUi(ui.activeNav || state.uiState.activeNav || "results");
  state.uiState.activeNav = ui.activeNav;
  ui.lastModel = buildPlanModel(state);
  document.body.classList.remove("mobile-plan-focus");
  if (el.heroHeader) el.heroHeader.hidden = false;

  const showLanding = state.uiState.firstRun;
  if (el.landingPanel) el.landingPanel.hidden = !showLanding;
  if (el.appPanel) el.appPanel.hidden = showLanding;
  if (el.bottomTabs) el.bottomTabs.hidden = showLanding;

  syncExperienceModeUi();
  renderNav();
  renderDashboard();
  renderLearn();
  renderWizard();
  renderPlanInputs();
  renderAdvanced();
  renderStress();
  renderMethodology();
  renderNotes();
  bindInlineTooltipTriggers(document.body);
  if (ui.pendingPlanStartScroll && ui.activeNav === "plan") {
    ui.pendingPlanStartScroll = false;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.scrollTo(0, 0);
    queueGuidedSetupScroll();
  }
  if (ui.pendingLearnStartScroll && ui.activeNav === "learn") {
    ui.pendingLearnStartScroll = false;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.scrollTo(0, 0);
    queueLearnPanelScroll();
  }
}

function syncExperienceModeUi() {
  const mode = state.uiState.experienceMode === "advanced" ? "advanced" : "beginner";
  document.body.classList.toggle("advanced-experience", mode === "advanced");
  document.body.classList.toggle("beginner-experience", mode !== "advanced");
  el.experienceModeButtons.forEach((btn) => {
    const active = (btn.getAttribute("data-value") || "beginner") === mode;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderNav() {
  const nav = ui.activeNav;
  el.tabButtons.forEach((btn) => {
    const isActive = (btn.dataset.navTarget || "") === nav;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-current", isActive ? "page" : "false");
  });
  el.navPanels.forEach((panel) => {
    const isActive = panel.dataset.navPanel === nav;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}

function setActiveNav(next) {
  ui.activeNav = normalizeNavTargetUi(next);
  state.uiState.firstRun = false;
  state.uiState.activeNav = ui.activeNav;
  state.uiState.hasStarted = true;
  syncNavHashUi(ui.activeNav, normalizeNavTargetUi);
  savePlan();
  renderAll();
}

function scrollDashboardToTop() {
  const panel = document.querySelector('[data-nav-panel="results"]');
  if (panel instanceof HTMLElement) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function scrollPlanToGuidedSetup() {
  const guidedSetup = document.getElementById("guidedSetupSection") || document.querySelector(".guided-stepper-shell");
  if (guidedSetup instanceof HTMLElement) {
    guidedSetup.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      guidedSetup.focus({ preventScroll: true });
    } catch {}
    return;
  }
  const planPanel = document.querySelector('[data-nav-panel="plan"]');
  if (planPanel instanceof HTMLElement) {
    planPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function queueGuidedSetupScroll() {
  const runScroll = () => {
    scrollPlanToGuidedSetup();
    setTimeout(scrollPlanToGuidedSetup, 140);
    setTimeout(scrollPlanToGuidedSetup, 320);
    setTimeout(scrollPlanToGuidedSetup, 640);
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(runScroll);
    requestAnimationFrame(() => {
      setTimeout(runScroll, 60);
    });
    return;
  }
  runScroll();
}

function scrollLearnPanelToTop() {
  const learnPanel = document.querySelector('[data-nav-panel="learn"]');
  const learnHeading = document.getElementById("learnHeading");
  const target = learnPanel instanceof HTMLElement ? learnPanel : learnHeading instanceof HTMLElement ? learnHeading : document.getElementById("learnPanel");
  if (!(target instanceof HTMLElement)) return;
  const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - 12);
  window.scrollTo({ top, behavior: "smooth" });
  try {
    target.focus({ preventScroll: true });
  } catch {}
}

function queueLearnPanelScroll() {
  const runScroll = () => {
    scrollLearnPanelToTop();
    setTimeout(scrollLearnPanelToTop, 140);
    setTimeout(scrollLearnPanelToTop, 320);
    setTimeout(scrollLearnPanelToTop, 640);
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(runScroll);
    requestAnimationFrame(() => {
      setTimeout(runScroll, 60);
    });
    return;
  }
  runScroll();
}

function getDashboardScenario() {
  return state.uiState.dashboardScenario || "base";
}

function buildDashboardScenarioPlan() {
  const scenario = getDashboardScenario();
  if (scenario === "base" || scenario === "custom") return state;
  const preview = clonePlan(state);
  if (scenario === "inflation") {
    preview.assumptions.inflation = Math.min(0.06, Number(preview.assumptions.inflation || 0.02) + 0.015);
  } else if (scenario === "returns") {
    preview.assumptions.returns.conservative = Math.max(0.01, Number(preview.assumptions.returns.conservative || 0) - 0.015);
    preview.assumptions.returns.balanced = Math.max(0.015, Number(preview.assumptions.returns.balanced || 0) - 0.015);
    preview.assumptions.returns.aggressive = Math.max(0.02, Number(preview.assumptions.returns.aggressive || 0) - 0.015);
  } else if (scenario === "longevity") {
    preview.profile.lifeExpectancy = Math.min(105, Number(preview.profile.lifeExpectancy || 90) + 5);
  }
  return preview;
}

function getActiveDashboardPlan() {
  const scenario = getDashboardScenario();
  if (scenario === "base" || scenario === "custom") return state;
  return buildDashboardScenarioPlan();
}

function getActiveDashboardModel() {
  const scenario = getDashboardScenario();
  if (!ui.lastModel || scenario === "base" || scenario === "custom") return ui.lastModel;
  return buildPlanModel(buildDashboardScenarioPlan());
}

function renderDashboard() {
  syncClientSummaryModeUi();
  const dashboardModel = getActiveDashboardModel();
  renderDashboardView({
    state,
    ui,
    el,
    app: APP,
    supportUrl: SUPPORT_URL,
    provinces: PROVINCES,
    officialReferences: OFFICIAL_REFERENCES,
    formatCurrency,
    formatPct,
    escapeHtml,
    clamp,
    tooltipButton,
    bindInlineTooltipTriggers,
    drawMainChart,
    drawCoverageChart,
    getBalanceLegendItems,
    getCoverageLegendItems,
    findRowByAge: findRowByAgeLocal,
    findFirstRetirementRow: findFirstRetirementRowLocal,
    amountForDisplay: amountForDisplayLocal,
    getOasRiskLevel: getOasRiskLevelLocal,
    buildNextActions: buildNextActionsLocal,
    dashboardModel,
  });
  renderDashboardResultsStrip();
  renderRetirementGapModule();
  renderRetirementInsightModule();
  renderDashboardSupportMoment();
  renderIncomeMapModule();
  renderTaxWedgeMiniModule();
  renderWhatChangedModule();
  renderCoverageScoreModule();
  renderPeakTaxYearModule();
  renderTimelineModule();
  renderKeyRisksModule();
  renderStrategySuggestionsModule();
  renderTimingSimulatorModule();
  renderMeltdownSimulatorModule();
  renderDashboardPresetBanner();
  renderDashboardSharedScenarioBanner();
  renderClientSummaryModeModule();
  syncDashboardLiveSummary();
}

function syncDashboardLiveSummary() {
  if (!el.resultLiveSummary) return;
  const status = (el.dashboardStatus?.textContent || "").trim();
  const verdict = (document.querySelector("#canIRetireModule h3")?.textContent || "").trim();
  const summary = [status, verdict].filter(Boolean).join(". ");
  if (!summary || el.resultLiveSummary.textContent === summary) return;
  el.resultLiveSummary.textContent = summary;
}

function syncClientSummaryModeUi() {
  const enabled = Boolean(state.uiState.clientSummary?.enabled);
  if (el.clientSummaryToggleBtn) el.clientSummaryToggleBtn.hidden = enabled;
  if (el.exitClientSummaryBtn) el.exitClientSummaryBtn.hidden = !enabled;
  if (el.clientSummaryModeMount) el.clientSummaryModeMount.hidden = !enabled;
  if (el.plannerDashboardContent) el.plannerDashboardContent.hidden = enabled;
}

function setClientSummaryMode(enabled) {
  if (!state.uiState.clientSummary || typeof state.uiState.clientSummary !== "object") {
    state.uiState.clientSummary = { enabled: false, preparedFor: "", scenarioLabel: "", preparedBy: "", summaryDate: "" };
  }
  state.uiState.clientSummary.enabled = Boolean(enabled);
  savePlan();
  renderDashboard();
}

function dashboardRetirementRows() {
  const dashboardModel = getActiveDashboardModel();
  return (dashboardModel?.base?.rows || []).filter((row) => row.age >= state.profile.retirementAge);
}

function selectedDashboardAgeBounds() {
  const rows = dashboardRetirementRows();
  if (!rows.length) return { minAge: state.profile.retirementAge, maxAge: state.profile.lifeExpectancy };
  return { minAge: rows[0].age, maxAge: rows[rows.length - 1].age };
}

function getDashboardSelectedRow() {
  const rows = dashboardRetirementRows().length ? dashboardRetirementRows() : (ui.lastModel?.base?.rows || []);
  return findRowByAgeLocal(rows, ui.selectedAge || state.profile.retirementAge)
    || findRowByAgeLocal(rows, state.profile.retirementAge)
    || rows[0]
    || null;
}

function renderDashboardResultsStrip() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.resultsStrip || !dashboardModel) return;
  const rows = dashboardRetirementRows();
  if (!rows.length) {
    el.resultsStrip.innerHTML = "";
    return;
  }
  const minAge = rows[0].age;
  const maxAge = rows[rows.length - 1].age;
  const selected = clamp(ui.selectedAge ?? minAge, minAge, maxAge);
  ui.selectedAge = selected;
  state.uiState.timelineSelectedAge = selected;
  const row = findRowByAgeLocal(rows, selected) || rows[0];
  renderResultsStrip({
    mountEl: el.resultsStrip,
    plan: state,
    row,
    selectedAge: selected,
    minAge,
    maxAge,
    tooltipButton,
    formatCurrency,
    formatPct,
    clamp,
  });
  bindInlineTooltipTriggers(el.resultsStrip);
}

function renderRetirementGapModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.retirementGapHeadline || !dashboardModel) return;
  const rows = dashboardRetirementRows();
  if (!rows.length) {
    el.retirementGapHeadline.innerHTML = "";
    return;
  }
  const { minAge, maxAge } = selectedDashboardAgeBounds();
  const selected = clamp(ui.selectedAge ?? minAge, minAge, maxAge);
  const row = findRowByAgeLocal(rows, selected) || rows[0];
  renderRetirementGapHeadline({
    mountEl: el.retirementGapHeadline,
    plan: state,
    row,
    model: dashboardModel,
    selectedAge: selected,
    minAge,
    maxAge,
    tooltipButton,
    formatCurrency,
    formatPct,
  });
  bindInlineTooltipTriggers(el.retirementGapHeadline);
}

function renderRetirementInsightModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.retirementInsight || !dashboardModel) return;
  const row = getDashboardSelectedRow();
  if (!row) {
    el.retirementInsight.innerHTML = "";
    return;
  }
  renderRetirementInsight({
    mountEl: el.retirementInsight,
    plan: state,
    row,
    model: dashboardModel,
    age: row.age,
    tooltipButton,
    formatCurrency,
    formatPct,
  });
  bindInlineTooltipTriggers(el.retirementInsight);
}

function renderTaxWedgeMiniModule() {
  if (!el.taxWedgeMini) return;
  const row = getDashboardSelectedRow();
  if (!row) {
    el.taxWedgeMini.innerHTML = "";
    return;
  }
  renderGrossNetCallout({
    mountEl: el.taxWedgeMini,
    row,
    formatCurrency,
    formatPct,
    emphasizeTaxes: Boolean(state.uiState.emphasizeTaxes ?? true),
  });
  bindInlineTooltipTriggers(el.taxWedgeMini);
}

function renderIncomeMapModule() {
  if (!el.incomeMapModule || !getActiveDashboardModel()) return;
  renderIncomeMapAtMount(el.incomeMapModule);
}

function renderIncomeMapAtMount(mountEl) {
  const dashboardModel = getActiveDashboardModel();
  if (!mountEl || !dashboardModel) return;
  const breakdown = buildYearBreakdown(state, dashboardModel);
  const phases = buildRetirementPhases(state, breakdown);
  const rendered = renderIncomeMap({
    mountEl,
    plan: state,
    rows: breakdown,
    phases,
    selectedAge: ui.selectedAge || state.profile.retirementAge,
    formatCurrency,
    formatPct,
    state,
  });
  if (!rendered) return;
  const canvas = mountEl.querySelector("#incomeMapCanvas");
  const draw = drawIncomeMapCanvas({
    canvas,
    visibleRows: rendered.visibleRows,
    selectedAge: ui.selectedAge || state.profile.retirementAge,
    showGross: rendered.showGross,
    showMarkers: rendered.showMarkers,
    markers: rendered.markers,
    phases: rendered.visiblePhases,
    formatCurrency,
  });
  ui.incomeMapHitZones = draw?.hitZones || [];
  bindInlineTooltipTriggers(mountEl);
}

function renderWhatChangedModule() {
  renderWhatChangedPanel({
    mountEl: el.whatChangedPanel,
    summary: state.uiState.lastChangeSummary || null,
  });
}

function renderCoverageScoreModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.coverageScoreModule || !dashboardModel) return;
  if (state.uiState.experienceMode !== "advanced") {
    el.coverageScoreModule.innerHTML = "";
    return;
  }
  const score = computeCoverageScore(state, dashboardModel);
  renderCoverageScore({
    mountEl: el.coverageScoreModule,
    score,
    tooltipButton,
    formatPct,
  });
  bindInlineTooltipTriggers(el.coverageScoreModule);
}

function renderPeakTaxYearModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.peakTaxYearModule || !dashboardModel) return;
  const peak = findPeakTaxYear(state, dashboardModel);
  renderPeakTaxYear({
    mountEl: el.peakTaxYearModule,
    peak,
    formatCurrency,
  });
}

function renderStrategySuggestionsModule() {
  if (!el.strategySuggestionsModule) return;
  if (state.uiState.clientSummary?.enabled) {
    el.strategySuggestionsModule.innerHTML = "";
    return;
  }
  renderStrategySuggestions({
    mountEl: el.strategySuggestionsModule,
    pendingKey: ui.pendingStrategyKey,
  });
}

function renderTimelineModule() {
  if (!el.timelineModule) return;
  const events = buildTimelineEvents(state);
  renderTimeline({
    mountEl: el.timelineModule,
    events,
    selectedAge: ui.selectedAge || state.profile.retirementAge,
  });
}

function renderKeyRisksModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.keyRisksModule || !dashboardModel) return;
  const selected = getDashboardSelectedRow();
  const risks = buildRiskDiagnostics(state, dashboardModel, selected?.age || state.profile.retirementAge);
  renderKeyRisks({
    mountEl: el.keyRisksModule,
    risks,
    tooltipButton,
  });
  bindInlineTooltipTriggers(el.keyRisksModule);
}

function renderTimingSimulatorModule() {
  if (!el.timingSimulator || !ui.lastModel) return;
  if (state.uiState.clientSummary?.enabled || state.uiState.experienceMode !== "advanced") {
    el.timingSimulator.innerHTML = "";
    return;
  }
  const sim = state.uiState.timingSim;
  const preview = buildTimingPreview({
    plan: state,
    sim,
    buildModel: buildPlanModel,
  });
  renderCppOasTimingSimulator({
    mountEl: el.timingSimulator,
    sim,
    preview,
    tooltipButton,
    numberField,
    formatCurrency,
    formatPct,
  });
  bindInlineTooltipTriggers(el.timingSimulator);
}

function renderMeltdownSimulatorModule() {
  if (!el.meltdownSimulator || !ui.lastModel) return;
  if (state.uiState.clientSummary?.enabled || state.uiState.experienceMode !== "advanced") {
    el.meltdownSimulator.innerHTML = "";
    return;
  }
  const comparison = buildMeltdownComparison(ui.lastModel, state);
  renderRrspMeltdownSimulator({
    mountEl: el.meltdownSimulator,
    plan: state,
    comparison,
    numberField,
    tooltipButton,
    formatCurrency,
    formatPct,
  });
  bindInlineTooltipTriggers(el.meltdownSimulator);
}

function renderDashboardSharedScenarioBanner() {
  if (!el.sharedScenarioBanner) return;
  const show = Boolean(sharedScenarioPayload) && !state.uiState.lastSharedScenarioBannerDismissed;
  el.sharedScenarioBanner.hidden = !show;
  if (!show) {
    el.sharedScenarioBanner.innerHTML = "";
    return;
  }
  el.sharedScenarioBanner.innerHTML = `
    <div class="banner-row">
      <div>
        <strong>Shared scenario loaded</strong>
        <p class="small-copy muted">Preview loaded from link. Apply only if you want to replace current assumptions.</p>
      </div>
      <div class="landing-actions">
        <button class="btn btn-secondary" type="button" data-action="preview-shared-scenario">Preview</button>
        <button class="btn btn-primary" type="button" data-action="apply-shared-scenario">Apply to my plan</button>
        <button class="btn btn-secondary" type="button" data-action="dismiss-shared-scenario">Dismiss</button>
      </div>
    </div>
  `;
}

function renderDashboardPresetBanner() {
  if (!el.presetBanner) return;
  const show = Boolean(presetPayload);
  el.presetBanner.hidden = !show;
  el.presetBanner.innerHTML = show ? buildPresetBannerHtml(presetPayload) : "";
}

function renderDashboardSupportMoment() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.supportMomentMount || !dashboardModel) return;
  if (state.uiState.clientSummary?.enabled) {
    el.supportMomentMount.innerHTML = "";
    return;
  }
  ensureSupportMomentState(state.uiState);
  const row = getDashboardSelectedRow();
  let trigger = "";
  if (state.uiState.justCompletedWizard) {
    trigger = maybeTriggerSupportMoment({ state, model: dashboardModel, row, trigger: "wizardComplete", sessionShown: ui.supportShownThisSession });
    state.uiState.justCompletedWizard = false;
  }
  if (!trigger) trigger = maybeTriggerSupportMoment({ state, model: dashboardModel, row, trigger: "firstGrossUp", sessionShown: ui.supportShownThisSession });
  if (!trigger) trigger = maybeTriggerSupportMoment({ state, model: dashboardModel, row, trigger: "firstClawback", sessionShown: ui.supportShownThisSession });
  if (trigger) {
    ui.activeSupportMoment = trigger;
    ui.supportShownThisSession = true;
    try { sessionStorage.setItem("supportMomentShown", "1"); } catch {}
    markSupportMomentShown(state.uiState, trigger);
    savePlan();
  }
  if (!ui.activeSupportMoment || isSupportDismissed(state.uiState)) {
    el.supportMomentMount.innerHTML = "";
    return;
  }
  el.supportMomentMount.innerHTML = buildSupportMomentCard(ui.activeSupportMoment);
}

function triggerSupportMoment(trigger) {
  if (!ui.lastModel) return;
  const row = getDashboardSelectedRow();
  const hit = maybeTriggerSupportMoment({
    state,
    model: ui.lastModel,
    row,
    trigger,
    sessionShown: ui.supportShownThisSession,
  });
  if (!hit) return;
  ui.activeSupportMoment = hit;
  ui.supportShownThisSession = true;
  try { sessionStorage.setItem("supportMomentShown", "1"); } catch {}
  markSupportMomentShown(state.uiState, hit);
  savePlan();
  renderDashboardSupportMoment();
}

function renderClientSummaryModeModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.clientSummaryModeMount || !dashboardModel) return;
  const enabled = Boolean(state.uiState.clientSummary?.enabled);
  const rows = buildYearBreakdown(state, dashboardModel);
  const phases = buildRetirementPhases(state, rows);
  const selected = getDashboardSelectedRow();
  const risks = buildRiskDiagnostics(state, dashboardModel, selected?.age || state.profile.retirementAge);
  const summary = buildClientSummaryData({
    plan: state,
    model: dashboardModel,
    selectedAge: selected?.age || state.profile.retirementAge,
    rows,
    phases,
    risks,
  });
  renderClientSummaryMode({
    mountEl: el.clientSummaryModeMount,
    enabled,
    summary,
    risks,
    selectedAge: selected?.age || state.profile.retirementAge,
    formatCurrency,
    formatPct,
    tooltipButton,
    pendingStrategyKey: ui.pendingStrategyKey,
    changeSummary: state.uiState.lastChangeSummary || null,
    prefs: state.uiState.clientSummary || {},
  });
  if (enabled) {
    renderClientSummaryProjectionChart();
    const mapMount = document.getElementById("clientSummaryIncomeMapMount");
    if (mapMount) renderIncomeMapAtMount(mapMount);
  }
  bindInlineTooltipTriggers(el.clientSummaryModeMount);
}

function renderClientSummaryProjectionChart() {
  const dashboardModel = getActiveDashboardModel();
  if (!dashboardModel) return;
  const canvas = document.getElementById("clientSummaryProjectionChart");
  const legendEl = document.getElementById("clientSummaryProjectionLegend");
  if (!canvas) return;
  const rows = dashboardModel.base.rows.slice();
  const best = dashboardModel.best.rows.slice();
  const worst = dashboardModel.worst.rows.slice();
  drawPortfolioChart({
    canvas,
    rows,
    bestRows: best,
    worstRows: worst,
    showStressBand: ui.showStressBand,
    formatCurrency,
    formatCompactCurrency,
  });
  if (legendEl) {
    const items = getBalanceLegendItems(ui.showStressBand);
    legendEl.innerHTML = items.map((item) => `
      <span class="legend-item"><span class="legend-chip" style="background:${item[1]};"></span>${item[0]}</span>
    `).join("");
  }
}

function getOasRiskLevelLocal(amount) {
  return getOasRiskLevelHelper(amount);
}

function bindInlineTooltipTriggers(container) {
  bindTooltipTriggers(container, {
    ui,
    openTooltip,
    closeTooltip,
  });
}

function handleCoverageChartPointer(event) {
  renderCoverageHover(event, {
    model: ui.lastModel,
    state,
    chartEl: el.coverageChart,
    hoverEl: el.coverageHover,
    amountForDisplay: amountForDisplayLocal,
    formatCurrency,
    clamp,
  });
}

function drawCoverageChart(model, selectedAge) {
  const dashboardPlan = getActiveDashboardPlan();
  const rows = model.base.rows.filter((row) => row.age >= state.profile.retirementAge);
  drawIncomeCoverageChart({
    canvas: el.coverageChart,
    rows,
    selectedAge,
    showTodaysDollars: ui.showTodaysDollars,
    showGrossWithdrawals: ui.showGrossWithdrawals,
    emphasizeTaxes: Boolean(state.uiState.emphasizeTaxes ?? true),
    currentYear: APP.currentYear,
    inflationRate: dashboardPlan.assumptions.inflation,
    formatCurrency,
    formatCompactCurrency,
  });
}

function amountForDisplayLocal(row, amount) {
  const dashboardPlan = getActiveDashboardPlan();
  return amountForDisplayHelper(row, amount, {
    showTodaysDollars: ui.showTodaysDollars,
    currentYear: APP.currentYear,
    inflationRate: dashboardPlan.assumptions.inflation,
  });
}

function findRowByAgeLocal(rows, age) {
  return findRowByAgeHelper(rows, age);
}

function findFirstRetirementRowLocal(rows, retirementAge) {
  return findFirstRetirementRowHelper(rows, retirementAge);
}

function renderPlanInputs() {
  if (!el.planInputsPanel) return;
  el.planInputsPanel.innerHTML = buildPlanInputsHtml({
    state,
    ui,
    provinces: PROVINCES,
    selectField,
    numberField,
    riskButton,
    tooltipButton,
    toPct,
  });
}

function openPlanEditor(key) {
  ui.planEditorKey = key;
  if (!el.planEditorModal || !el.planEditorContent || !el.planEditorTitle) return;
  const config = getPlanEditorConfig(key);
  if (!config) return;
  el.planEditorTitle.textContent = config.title;
  el.planEditorContent.innerHTML = config.body;
  bindInlineTooltipTriggers(el.planEditorContent);
  el.planEditorModal.showModal();
}

function closePlanEditor() {
  ui.planEditorKey = "";
  el.planEditorModal?.close();
}

function getPlanEditorConfig(key) {
  return getPlanEditorConfigView(key, {
    state,
    provinces: PROVINCES,
    numberField,
    selectField,
    tooltipButton,
    riskButton,
    toPct,
  });
}

function renderLearn() {
  if (!el.learnPanel) return;
  const learn = state.uiState.learn;
  if (!learn) return;
  const progress = state.uiState.learningProgress || createDefaultLearningProgressLocal();
  const completed = LEARN_PROGRESS_ITEMS.filter((item) => progress[item.key]).length;
  el.learnPanel.innerHTML = buildLearnHtml({
    learn,
    progress,
    completed,
    learnProgressItems: LEARN_PROGRESS_ITEMS,
    learnNumberField,
    buildLearnCallouts,
    tooltipButton,
    toPct,
    formatNumber,
    formatCurrency,
    supportUrl: SUPPORT_URL,
    escapeHtml,
  });

  updateLearnOutputs();
}

function updateLearnOutputs() {
  updateLearnOutputsView({
    state,
    el,
    rrifMinWithdrawal: RRIF_MIN_WITHDRAWAL,
    estimateTotalTax,
    calculatePhaseWeightedSpending: calculatePhaseWeightedSpendingUi,
    drawLearnLineChart: drawLearnLineChartUi,
    drawLearnMultiLineChart: drawLearnMultiLineChartUi,
    formatCurrency,
    formatCompactCurrency,
    formatPct,
    formatNumber,
    formatSignedCurrency,
    toPct,
    clamp,
    tooltipButton,
    bindInlineTooltipTriggers,
  });
}


function renderWizard() {
  const step = clamp(state.uiState.wizardStep || 1, 1, WIZARD_STEP_COUNT);
  state.uiState.wizardStep = step;
  const progress = (step / WIZARD_STEP_COUNT) * 100;
  el.wizardProgressBar.style.width = `${progress}%`;
  el.wizardStepLabel.textContent = `Step ${step} of ${WIZARD_STEP_COUNT}`;
  el.wizardBackBtn.disabled = step === 1;
  el.wizardNextBtn.textContent = step === WIZARD_STEP_COUNT ? "See my result" : "Next";

  el.wizardBody.innerHTML = buildWizardStepHtml(step, {
    state,
    model: ui.lastModel,
    app: APP,
    provinces: PROVINCES,
    ageNow,
    numberField,
    selectField,
    riskButton,
    tooltipButton,
    toPct,
    formatCurrency,
    formatPct,
    findFirstRetirementRow: findFirstRetirementRowLocal,
    escapeHtml,
  });
}

function renderAdvanced() {
  renderAdvancedView({
    state,
    ui,
    el,
    app: APP,
    provinces: PROVINCES,
    rrifMinWithdrawal: RRIF_MIN_WITHDRAWAL,
    officialReferences: OFFICIAL_REFERENCES,
    formatCurrency,
    formatPct,
    escapeHtml,
    numberField,
    selectField,
    tooltipButton,
    strategyButton,
    accordionSection,
    renderCapitalInjectRows,
    toPct,
    applyAdvancedSearchFilter,
  });
}

function renderStress() {
  renderStressView({
    ui,
    el,
    formatCurrency,
    formatPct,
    formatSignedCurrency,
    tooltipButton,
    bindInlineTooltipTriggers,
  });
}

function renderMethodology() {
  if (!el.methodologyPanel) return;
  el.methodologyPanel.innerHTML = renderMethodologyHtml(escapeHtml);
}

function renderNotes() {
  el.notesInput.value = state.notes || "";
}

function buildNextActionsLocal(model) {
  return buildNextActionsHelper(model, state.uiState.unlocked.advanced);
}

function drawMainChart(rows, bestRows, worstRows) {
  drawPortfolioChart({
    canvas: el.mainChart,
    rows,
    bestRows,
    worstRows,
    showStressBand: ui.showStressBand,
    formatCurrency,
    formatCompactCurrency,
  });
}

function handleBalanceChartPointer(event) {
  renderBalanceHover(event, {
    model: ui.lastModel,
    chartEl: el.mainChart,
    hoverEl: el.balanceHover,
    formatCurrency,
    clamp,
  });
}

function openTooltip(key, anchor) {
  const ok = renderTooltipPopover({
    key,
    anchor,
    tooltipMap: TOOLTIPS,
    layerEl: el.tooltipLayer,
    escapeHtml,
  });
  ui.tooltipKey = ok ? key : "";
}

function closeTooltip() {
  ui.tooltipKey = "";
  clearTooltipLayer(el.tooltipLayer);
}

function openGlossary() {
  el.glossaryContent.innerHTML = renderGlossaryHtml(TOOLTIPS, escapeHtml);

  el.glossaryModal?.showModal();
}

function exportJson() {
  exportPlanJson(state, (msg) => {
    toast(msg);
    setTimeout(() => {
      toast("Saved your plan. If this saved you time, you can support the project.");
    }, 900);
  });
}

function openImportPicker() {
  promptImportPlan({
    normalizePlan: normalizePlanLocal,
    onPlanLoaded: (normalized) => {
      state = normalized;
      state.uiState.firstRun = false;
      state.uiState.hasStarted = true;
      state.uiState.activeNav = "results";
      state.uiState.dashboardScenario = "base";
      state.uiState.lastChangeSummary = null;
      ui.activeNav = "results";
      savePlan();
      renderAll();
      const message = `Imported plan: retire at ${state.profile.retirementAge}, savings ${formatCurrency(state.savings.currentTotal)}.`;
      toast(message);
      if (ui.isMobileLayout) {
        alert(message);
      }
    },
    onImportError: (message) => {
      if (ui.isMobileLayout) {
        alert(`Import error:\n${message}`);
      }
    },
    toast,
  });
}

async function importJsonFromFile() {
  await importPlanFromFileInput({
    fileInput: el.importJsonFile,
    normalizePlan: normalizePlanLocal,
    onPlanLoaded: (normalized) => {
      state = normalized;
      state.uiState.firstRun = false;
      state.uiState.hasStarted = true;
      state.uiState.activeNav = "results";
      state.uiState.dashboardScenario = "base";
      state.uiState.lastChangeSummary = null;
      ui.activeNav = "results";
      savePlan();
      renderAll();
      const message = `Imported plan: retire at ${state.profile.retirementAge}, savings ${formatCurrency(state.savings.currentTotal)}.`;
      toast(message);
      if (ui.isMobileLayout) {
        alert(message);
      }
    },
    onImportError: (message) => {
      if (ui.isMobileLayout) {
        alert(`Import error:\n${message}`);
      }
    },
    toast,
  });
}

function loadPlan() {
  try {
    return loadPlanFromStorage(APP.storageKey, normalizePlanLocal, createDefaultPlanLocal);
  } catch {
    return createDefaultPlanLocal();
  }
}

function savePlan() {
  try {
    const saved = savePlanToStorage(APP.storageKey, state);
    if (!saved) {
      toast("Could not persist this plan on this device.");
    }
  } catch {
    toast("Could not save to local storage.");
  }
}

function resetPlanToBlank() {
  const ok = confirm("Reset your local plan to a blank baseline?");
  if (!ok) return;
  state = createBlankPlanLocal();
  ui.activeNav = "plan";
  savePlan();
  renderAll();
  toast("Plan reset to a blank baseline.");
}

function shareBaseUrl() {
  const origin = window.location.origin && window.location.origin !== "null"
    ? window.location.origin
    : "https://simplekit.app/retirement-planner/";
  return `${origin}${window.location.pathname || "/"}`;
}

async function copyShare(minimal = false) {
  const url = buildShareUrl(shareBaseUrl(), state, minimal);
  const copied = await writeClipboardText(url);
  if (copied) {
    toast(minimal ? "Minimal share link copied." : "Share link copied.");
  } else {
    toast(url);
  }
}

async function copySummary() {
  const row = getDashboardSelectedRow();
  const dashboardModel = getActiveDashboardModel();
  const link = buildShareUrl(shareBaseUrl(), state, false);
  const summary = buildShareSummary({
    state,
    row,
    formatCurrency,
    formatPct,
    link,
    depletionAge: dashboardModel?.kpis?.depletionAge || null,
  });
  const copied = await writeClipboardText(summary);
  if (copied) {
    toast("Summary copied.");
  } else {
    toast("Could not copy summary.");
  }
}

function getScenarioSnapshotById(id) {
  const list = Array.isArray(state.uiState.scenarios) ? state.uiState.scenarios : [];
  return list.find((s) => s.id === id) || null;
}

async function copyScenarioShare(id = "") {
  const scenario = id ? getScenarioSnapshotById(id) : null;
  const payload = scenario ? buildScenarioPayloadFromSnapshot(scenario) : buildSharePayload(state, false);
  if (scenario) payload.sn = scenario.name || "Scenario";
  const url = buildScenarioShareUrl(shareBaseUrl(), payload);
  const copied = await writeClipboardText(url);
  if (copied) toast("Scenario share link copied.");
  else toast(url);
}

async function copyScenarioSummary() {
  const row = getDashboardSelectedRow();
  const dashboardModel = getActiveDashboardModel();
  const link = buildShareUrl(shareBaseUrl(), state, false);
  const summary = buildShareSummary({
    state,
    row,
    formatCurrency,
    formatPct,
    link,
    depletionAge: dashboardModel?.kpis?.depletionAge || null,
  });
  const copied = await writeClipboardText(summary);
  if (copied) toast("Scenario summary copied.");
  else toast("Could not copy scenario summary.");
}

async function writeClipboardText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // continue to fallback
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = String(text || "");
    ta.setAttribute("readonly", "readonly");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return !!ok;
  } catch {
    return false;
  }
}

async function resetCachedAppData() {
  const ok = confirm("Clear cached app files and reload? This is a DEV recovery action.");
  if (!ok) return;
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    toast("Cached app reset. Reloading...");
    setTimeout(() => location.reload(), 350);
  } catch {
    toast("Could not reset cached app.");
  }
}

function openScenarioCompare() {
  if (!el.scenarioCompareModal || !el.scenarioCompareContent || !ui.lastModel) return;
  const row65 = findRowByAgeLocal(ui.lastModel.base.rows, 65) || ui.lastModel.base.rows[0];
  const baseMetrics = {
    coveragePct: row65.spending > 0 ? row65.guaranteedNet / row65.spending : 1,
    netGap65: row65.netGap || 0,
    gross65: row65.withdrawal || 0,
    taxWedge65: (row65.taxOnWithdrawal || 0) + (row65.oasClawback || 0),
    clawback65: row65.oasClawback || 0,
    depletionAge: ui.lastModel.kpis.depletionAge || null,
  };
  const strategyMetrics = (ui.lastModel.strategyComparisons || []).map((s) => {
    const snap = s.snapshotsByAge?.[65] || s.snapshotsByAge?.[state.profile.retirementAge] || null;
    const snapAge = Number(snap?.age || state.profile.retirementAge || 65);
    const yearOffset = Math.max(0, snapAge - (APP.currentYear - Number(state.profile.birthYear || APP.currentYear)));
    const guaranteedGross = Number(snap?.guaranteedGross || 0);
    const guaranteedTax = state.strategy.estimateTaxes === false
      ? 0
      : estimateTotalTax(state, guaranteedGross, yearOffset);
    const guaranteedClawback = state.strategy.estimateTaxes === false || !state.strategy.oasClawbackModeling
      ? 0
      : estimateOasClawback(state, guaranteedGross, guaranteedGross > 0 ? guaranteedGross : 0, yearOffset);
    const guaranteedNet = Math.max(0, guaranteedGross - guaranteedTax - guaranteedClawback);
    const netGap = Math.max(0, (snap?.spend || 0) - guaranteedNet);
    return {
      label: s.label,
      metrics: {
        coveragePct: snap?.spend > 0 ? (guaranteedNet / snap.spend) : 1,
        netGap65: netGap,
        gross65: snap?.accountWithdrawals?.total || 0,
        taxWedge65: (snap?.tax || 0) + (snap?.clawback || 0),
        clawback65: snap?.clawback || 0,
        depletionAge: s.depletionAge || null,
      },
    };
  });

  renderScenarioCompareModal({
    mountEl: el.scenarioCompareContent,
    baseMetrics,
    strategyMetrics,
    savedScenarios: state.uiState.scenarios || [],
    formatCurrency,
    formatPct,
  });
  el.scenarioCompareModal.showModal();
}

function openPrintSummary() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.printSummaryModal || !el.printSummaryContent || !dashboardModel) return;
  const rowRet = findRowByAgeLocal(dashboardModel.base.rows, state.profile.retirementAge) || dashboardModel.base.rows[0];
  const row65 = findRowByAgeLocal(dashboardModel.base.rows, 65) || rowRet;
  const row71 = findRowByAgeLocal(dashboardModel.base.rows, 71) || rowRet;
  const chartImages = capturePlannerCharts();
  const html = buildSummaryHtml({
    state,
    rowRet,
    row65,
    row71,
    model: dashboardModel,
    formatCurrency,
    formatPct,
    methodologyUrl: `${shareBaseUrl()}#methodology`,
    toolUrl: shareBaseUrl(),
    supportUrl: SUPPORT_URL,
    chartImages,
    projectionLegend: getBalanceLegendItems(ui.showStressBand),
    coverageLegend: getCoverageLegendItems(),
  });
  el.printSummaryContent.innerHTML = html;
  el.printSummaryModal.showModal();
  triggerSupportMoment("reportGenerated");
}

function printSummaryNow() {
  const dashboardModel = getActiveDashboardModel();
  if (!dashboardModel) return;
  const rowRet = findRowByAgeLocal(dashboardModel.base.rows, state.profile.retirementAge) || dashboardModel.base.rows[0];
  const row65 = findRowByAgeLocal(dashboardModel.base.rows, 65) || rowRet;
  const row71 = findRowByAgeLocal(dashboardModel.base.rows, 71) || rowRet;
  const chartImages = capturePlannerCharts();
  const html = buildSummaryHtml({
    state,
    rowRet,
    row65,
    row71,
    model: dashboardModel,
    formatCurrency,
    formatPct,
    methodologyUrl: `${shareBaseUrl()}#methodology`,
    toolUrl: shareBaseUrl(),
    supportUrl: SUPPORT_URL,
    chartImages,
    projectionLegend: getBalanceLegendItems(ui.showStressBand),
    coverageLegend: getCoverageLegendItems(),
  });
  const ok = openPrintWindow(html);
  if (!ok) toast("Could not open print window.");
  if (ok) triggerSupportMoment("reportGenerated");
}

function printClientSummaryNow() {
  const dashboardModel = getActiveDashboardModel();
  if (!dashboardModel) return;
  const rows = buildYearBreakdown(state, dashboardModel);
  const phases = buildRetirementPhases(state, rows);
  const selected = getDashboardSelectedRow();
  const risks = buildRiskDiagnostics(state, dashboardModel, selected?.age || state.profile.retirementAge);
  const summary = buildClientSummaryData({
    plan: state,
    model: dashboardModel,
    selectedAge: selected?.age || state.profile.retirementAge,
    rows,
    phases,
    risks,
  });
  if (!summary) return;
  const chartImages = captureClientSummaryCharts();
  const html = buildClientSummaryHtml({
    state,
    summary,
    risks,
    strategySuggestions: [
      { title: "Delay CPP to 70", desc: "May increase guaranteed income later and reduce later withdrawal pressure." },
      { title: "Try earlier RRSP withdrawals", desc: "Can smooth taxable income and reduce later RRIF/clawback pressure." },
      { title: "Reduce retirement spending", desc: "Sensitivity test to improve coverage ratio and longevity buffer." },
      { title: "Retire later", desc: "Adds savings years and shortens drawdown years." },
    ],
    formatCurrency,
    formatPct,
    methodologyUrl: `${shareBaseUrl()}#methodology`,
    toolUrl: shareBaseUrl(),
    supportUrl: SUPPORT_URL,
    chartImages,
  });
  const ok = openClientSummaryPrintWindow(html);
  if (!ok) {
    toast("Could not open client summary print window.");
    return;
  }
  triggerSupportMoment("reportGenerated");
}

function captureClientSummaryCharts() {
  const toDataUrl = (canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) return "";
    try {
      return canvas.toDataURL("image/png");
    } catch {
      return "";
    }
  };
  const projectionCanvas = document.getElementById("clientSummaryProjectionChart");
  const incomeMapCanvas = el.clientSummaryModeMount?.querySelector("#incomeMapCanvas")
    || document.querySelector("#clientSummaryIncomeMapMount #incomeMapCanvas");
  return {
    projection: toDataUrl(projectionCanvas),
    incomeMap: toDataUrl(incomeMapCanvas),
  };
}

function capturePlannerCharts() {
  const toDataUrl = (canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) return "";
    try {
      return canvas.toDataURL("image/png");
    } catch {
      return "";
    }
  };
  return {
    projection: toDataUrl(el.mainChart),
    coverage: toDataUrl(el.coverageChart),
  };
}

function clearSharedScenarioQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete("share");
  url.searchParams.delete("shareMin");
  if (url.hash.startsWith("#share=") || url.hash.startsWith("#shareMin=")) {
    url.hash = "";
  }
  window.history.replaceState({}, "", url.toString());
}

function isMaterialChangePath(path) {
  return (
    path.startsWith("strategy.") ||
    path.startsWith("income.cpp.") ||
    path.startsWith("income.oas.") ||
    path.startsWith("income.pension.") ||
    path.startsWith("profile.annualIncome") ||
    path.startsWith("profile.retirementAge") ||
    path.startsWith("profile.desiredSpending") ||
    path.startsWith("assumptions.")
  );
}

function clonePlan(input) {
  if (typeof structuredClone === "function") return structuredClone(input);
  return JSON.parse(JSON.stringify(input));
}

function buildStrategyPreviewPlan(currentPlan, key) {
  const next = clonePlan(currentPlan);
  if (key === "delay-cpp") {
    next.income.cpp.startAge = 70;
    if (next.profile.hasSpouse && next.income.spouse?.enabled) next.income.spouse.cppStartAge = 70;
  }
  if (key === "meltdown") {
    next.strategy.meltdownEnabled = true;
    next.strategy.meltdownAmount = Math.max(10000, Number(next.strategy.meltdownAmount || 0));
    next.strategy.meltdownStartAge = Math.min(next.profile.retirementAge, 63);
    next.strategy.meltdownEndAge = Math.max(next.strategy.meltdownStartAge + 1, 70);
  }
  if (key === "spend-down-10") {
    next.profile.desiredSpending = Math.max(12000, Number(next.profile.desiredSpending || 0) * 0.9);
  }
  if (key === "retire-later-2") {
    next.profile.retirementAge = Math.min(75, Number(next.profile.retirementAge || 65) + 2);
  }
  if (key === "save-more-5000") {
    next.savings.annualContribution = Math.max(0, Number(next.savings.annualContribution || 0) + 5000);
  }
  return next;
}

function normalizePlanLocal(input) {
  return normalizePlanSchema(input, schemaDeps);
}

function ensureValidStateLocal() {
  ensureValidStateSchema(state, schemaDeps);
}

function createDefaultPlanLocal() {
  return createDefaultPlanSchema(schemaDeps);
}

function createBlankPlanLocal() {
  return createBlankPlanSchema(schemaDeps);
}

function createDefaultLearningProgressLocal() {
  return createDefaultLearningProgressSchema(LEARN_PROGRESS_ITEMS);
}

function createDemoPlanLocal() {
  return createDemoPlanSchema(schemaDeps);
}

function createCapitalInjectItem() {
  return {
    id: createLocalId(),
    enabled: true,
    label: "Lump sum",
    amount: 50000,
    age: Math.max(state.profile.retirementAge, ageNow()),
  };
}

function renderCapitalInjectRows() {
  const items = Array.isArray(state.savings.capitalInjects) ? state.savings.capitalInjects : [];
  if (!items.length) return "<p class='muted form-span-full'>No lump-sum events added yet.</p>";

  return items.map((item, index) => `
    <div class="subsection form-span-full">
      <div class="wizard-grid compact-mobile-two">
        <label class="form-span-full inline-check">
          <input type="checkbox" data-bind="savings.capitalInjects.${index}.enabled" ${item.enabled ? "checked" : ""} />
          Include this event
        </label>
        <label>
          <span class="label-row">Event label</span>
          <input type="text" data-bind="savings.capitalInjects.${index}.label" value="${escapeHtml(item.label || "Lump sum")}" aria-label="Lump sum label" />
        </label>
        ${numberField("Amount", `savings.capitalInjects.${index}.amount`, Number(item.amount || 0), { min: 0, max: 5000000, step: 1000 }, "capitalInjectAmount", false, false, true)}
        ${numberField("Age received", `savings.capitalInjects.${index}.age`, Number(item.age || state.profile.retirementAge), { min: 45, max: 105, step: 1 }, "capitalInjectAge", false, false, true)}
      </div>
      <div class="landing-actions">
        <button type="button" class="btn btn-secondary" data-action="remove-capital-inject" data-value="${escapeHtml(item.id)}">Remove event</button>
      </div>
    </div>
  `).join("");
}

function riskButton(key) {
  const active = state.assumptions.riskProfile === key;
  return `<button type="button" class="pill-radio ${active ? "active" : ""}" data-action="risk" data-value="${key}" aria-pressed="${active}">${capitalize(key)}</button>`;
}

function strategyButton(key, label) {
  const active = state.strategy.withdrawal === key;
  return `<button type="button" class="pill-radio ${active ? "active" : ""}" data-action="strategy" data-value="${key}" aria-pressed="${active}">${label}</button>`;
}

function accordionSection(id, title, affects, content) {
  const open = !!ui.advancedOpen[id];
  return `
    <details class="accordion" data-accordion-id="${escapeHtml(id)}" ${open ? "open" : ""}>
      <summary>${escapeHtml(title)}</summary>
      <div class="accordion-content">
        <p class="what-affects"><strong>What this affects:</strong> ${escapeHtml(affects)}</p>
        ${content}
      </div>
    </details>
  `;
}

function captureAdvancedAccordionState() {
  const sections = Array.from(document.querySelectorAll("#advancedAccordion details[data-accordion-id]"));
  if (!sections.length) return;
  sections.forEach((details) => {
    const id = details.getAttribute("data-accordion-id");
    if (!id) return;
    ui.advancedOpen[id] = details.open;
  });
}

function capturePlannerCardState() {
  const sections = Array.from(document.querySelectorAll("#planInputsPanel details[data-planner-card-id]"));
  if (!sections.length) return;
  sections.forEach((details) => {
    const id = details.getAttribute("data-planner-card-id");
    if (!id) return;
    ui.planCardOpen[id] = details.open;
  });
}

function handleDetailsToggle(event) {
  const target = event.target;
  if (!(target instanceof HTMLDetailsElement)) return;
  if (target.matches(".dashboard-detail-accordion") && target.open) {
    const group = Array.from(document.querySelectorAll(".dashboard-detail-accordion"));
    group.forEach((item) => {
      if (item instanceof HTMLDetailsElement && item !== target) item.open = false;
    });
  }
  if (target.matches("#advancedAccordion details[data-accordion-id]")) {
    const id = target.getAttribute("data-accordion-id");
    if (!id) return;
    ui.advancedOpen[id] = target.open;
    return;
  }
  if (!target.matches("#planInputsPanel details[data-planner-card-id]")) return;
  const id = target.getAttribute("data-planner-card-id");
  if (!id) return;
  ui.planCardOpen[id] = target.open;
}

function applyAdvancedSearchFilter() {
  const query = String(state.uiState.advancedSearch || "").trim().toLowerCase();
  const sections = Array.from(document.querySelectorAll("#advancedAccordion details[data-accordion-id]"));
  if (!sections.length) return;
  sections.forEach((details) => {
    const text = details.textContent?.toLowerCase() || "";
    details.hidden = query ? !text.includes(query) : false;
  });
}

function ageNow() {
  return APP.currentYear - state.profile.birthYear;
}

function setByPath(obj, path, value) {
  const keys = path.split(".");
  let ref = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!ref[key] || typeof ref[key] !== "object") ref[key] = {};
    ref = ref[key];
  }

  const finalKey = keys[keys.length - 1];

  ref[finalKey] = value;
}

function toast(message) {
  el.appToast.textContent = message;
  el.appToast.classList.add("visible");
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    el.appToast.classList.remove("visible");
  }, 2200);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {
    // ignore registration errors in local file mode
  });
}
