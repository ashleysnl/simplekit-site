const TEMPLATE = {
  storageKey: "simplekit.rrspTfsaOptimizer.v1",
  appName: "RRSP vs TFSA Calculator Canada | SimpleKit",
  seoDescription:
    "Compare RRSP and TFSA outcomes in Canada, estimate your RRSP tax refund, and see how reinvesting the refund can change long-term retirement results.",
  siteUrl: "https://simplekit.app/rrsp-vs-tfsa-calculator/",
  socialImageUrl: "https://simplekit.app/og-image.png",
};

const FEDERAL_TAX_TABLE = [
  { upTo: 58523, rate: 0.14 },
  { upTo: 117045, rate: 0.205 },
  { upTo: 181440, rate: 0.26 },
  { upTo: 258482, rate: 0.29 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.33 },
];

const PROVINCIAL_TAX_TABLES = {
  AB: [
    { upTo: 60733, rate: 0.08 },
    { upTo: 151234, rate: 0.1 },
    { upTo: 181481, rate: 0.12 },
    { upTo: 241974, rate: 0.13 },
    { upTo: 362961, rate: 0.14 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.15 },
  ],
  BC: [
    { upTo: 49279, rate: 0.0506 },
    { upTo: 98560, rate: 0.077 },
    { upTo: 113158, rate: 0.105 },
    { upTo: 137407, rate: 0.1229 },
    { upTo: 186306, rate: 0.147 },
    { upTo: 259829, rate: 0.168 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.205 },
  ],
  MB: [
    { upTo: 47000, rate: 0.108 },
    { upTo: 100000, rate: 0.1275 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.174 },
  ],
  NB: [
    { upTo: 51306, rate: 0.094 },
    { upTo: 102614, rate: 0.14 },
    { upTo: 190060, rate: 0.16 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.195 },
  ],
  NL: [
    { upTo: 44192, rate: 0.087 },
    { upTo: 88382, rate: 0.145 },
    { upTo: 157792, rate: 0.158 },
    { upTo: 220910, rate: 0.178 },
    { upTo: 282214, rate: 0.198 },
    { upTo: 564429, rate: 0.208 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.213 },
  ],
  NS: [
    { upTo: 29590, rate: 0.0879 },
    { upTo: 59180, rate: 0.1495 },
    { upTo: 93000, rate: 0.1667 },
    { upTo: 150000, rate: 0.175 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.21 },
  ],
  NT: [
    { upTo: 51964, rate: 0.059 },
    { upTo: 103930, rate: 0.086 },
    { upTo: 168967, rate: 0.122 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.1405 },
  ],
  NU: [
    { upTo: 54707, rate: 0.04 },
    { upTo: 109413, rate: 0.07 },
    { upTo: 177881, rate: 0.09 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.115 },
  ],
  ON: [
    { upTo: 52886, rate: 0.0505 },
    { upTo: 105775, rate: 0.0915 },
    { upTo: 150000, rate: 0.1116 },
    { upTo: 220000, rate: 0.1216 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.1316 },
  ],
  PE: [
    { upTo: 32656, rate: 0.095 },
    { upTo: 64313, rate: 0.1347 },
    { upTo: 105000, rate: 0.166 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.18 },
  ],
  QC: [
    { upTo: 54345, rate: 0.14 },
    { upTo: 108680, rate: 0.19 },
    { upTo: 132245, rate: 0.24 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.2575 },
  ],
  SK: [
    { upTo: 53780, rate: 0.105 },
    { upTo: 153525, rate: 0.125 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.145 },
  ],
  YT: [
    { upTo: 58523, rate: 0.064 },
    { upTo: 117045, rate: 0.09 },
    { upTo: 181440, rate: 0.109 },
    { upTo: 500000, rate: 0.128 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.15 },
  ],
};

const DEFAULT_INPUTS = {
  income: 95000,
  province: "ON",
  currentAge: 35,
  retirementAge: 65,
  contribution: 10000,
  annualReturn: 5.5,
  retirementTaxRate: 25,
  currentRrspBalance: 25000,
  currentTfsaBalance: 18000,
  contributionFrequency: "annual",
  growthMode: "nominal",
  inflationRate: 2.2,
  useManualCurrentTaxRate: false,
  manualCurrentTaxRate: 35,
};

const PRESET_INPUTS = {
  "higher-income": {
    income: 165000,
    province: "ON",
    currentAge: 42,
    retirementAge: 65,
    contribution: 18000,
    annualReturn: 5.5,
    retirementTaxRate: 24,
  },
  "lower-income": {
    income: 55000,
    province: "NS",
    currentAge: 32,
    retirementAge: 65,
    contribution: 6000,
    annualReturn: 5,
    retirementTaxRate: 24,
  },
  "closer-retirement": {
    income: 98000,
    province: "BC",
    currentAge: 54,
    retirementAge: 63,
    contribution: 12000,
    annualReturn: 4.5,
    retirementTaxRate: 22,
  },
  "early-career": {
    income: 72000,
    province: "AB",
    currentAge: 27,
    retirementAge: 65,
    contribution: 7500,
    annualReturn: 6,
    retirementTaxRate: 26,
  },
};

const el = {
  metaDescription: document.getElementById("metaDescription"),
  metaThemeColor: document.getElementById("metaThemeColor"),
  metaOgTitle: document.getElementById("metaOgTitle"),
  metaOgDescription: document.getElementById("metaOgDescription"),
  metaOgUrl: document.getElementById("metaOgUrl"),
  metaOgImage: document.getElementById("metaOgImage"),
  metaOgSiteName: document.getElementById("metaOgSiteName"),
  metaTwitterTitle: document.getElementById("metaTwitterTitle"),
  metaTwitterDescription: document.getElementById("metaTwitterDescription"),
  metaTwitterImage: document.getElementById("metaTwitterImage"),

  jumpToCalculatorBtn: document.getElementById("jumpToCalculatorBtn"),
  calculatorSection: document.getElementById("calculatorSection"),
  calculatorForm: document.getElementById("calculatorForm"),
  validationNote: document.getElementById("validationNote"),
  toggleDetailsBtn: document.getElementById("toggleDetailsBtn"),
  detailedResults: document.getElementById("detailedResults"),
  advancedToggleBtn: document.getElementById("advancedToggleBtn"),
  advancedPanel: document.getElementById("advancedPanel"),
  advancedToggleLabel: document.getElementById("advancedToggleLabel"),

  income: document.getElementById("income"),
  province: document.getElementById("province"),
  currentAge: document.getElementById("currentAge"),
  retirementAge: document.getElementById("retirementAge"),
  contributionInput: document.getElementById("contributionInput"),
  annualReturn: document.getElementById("annualReturn"),
  retirementTaxRate: document.getElementById("retirementTaxRate"),
  currentRrspBalance: document.getElementById("currentRrspBalance"),
  currentTfsaBalance: document.getElementById("currentTfsaBalance"),
  contributionFrequency: document.getElementById("contributionFrequency"),
  growthMode: document.getElementById("growthMode"),
  inflationRate: document.getElementById("inflationRate"),
  useManualCurrentTaxRate: document.getElementById("useManualCurrentTaxRate"),
  manualCurrentTaxRate: document.getElementById("manualCurrentTaxRate"),

  resetDefaultsBtn: document.getElementById("resetDefaultsBtn"),
  resetAdvancedBtn: document.getElementById("resetAdvancedBtn"),
  shareScenarioBtn: document.getElementById("shareScenarioBtn"),
  printSummaryBtn: document.getElementById("printSummaryBtn"),
  presetButtons: Array.from(document.querySelectorAll("[data-preset]")),

  winnerHeading: document.getElementById("resultsHeading"),
  winnerConfidence: document.getElementById("winnerConfidence"),
  winnerSummary: document.getElementById("winnerSummary"),
  winnerReasons: document.getElementById("winnerReasons"),
  winnerSensitivity: document.getElementById("winnerSensitivity"),
  refundInsight: document.getElementById("refundInsight"),
  winnerMiniGrid: document.getElementById("winnerMiniGrid"),
  metricGrid: document.getElementById("metricGrid"),
  detailWinnerValue: document.getElementById("detailWinnerValue"),
  detailWinnerMeta: document.getElementById("detailWinnerMeta"),
  detailRefundImpactValue: document.getElementById("detailRefundImpactValue"),
  detailRefundImpactMeta: document.getElementById("detailRefundImpactMeta"),
  equalCostNote: document.getElementById("equalCostNote"),
  comparisonBars: document.getElementById("comparisonBars"),
  assumptionList: document.getElementById("assumptionList"),
  balanceContext: document.getElementById("balanceContext"),
  appToast: document.getElementById("appToast"),
  incomeField: document.getElementById("incomeField"),
  contributionField: document.getElementById("contributionField"),
  retirementAgeField: document.getElementById("retirementAgeField"),
  incomeError: document.getElementById("incomeError"),
  contributionError: document.getElementById("contributionError"),
  retirementAgeError: document.getElementById("retirementAgeError"),
  scenarioPrimary: document.getElementById("scenarioPrimary"),
  scenarioSecondary: document.getElementById("scenarioSecondary"),
  primaryValue: document.getElementById("primaryValue"),
  primaryMeta: document.getElementById("primaryMeta"),
  secondaryValue: document.getElementById("secondaryValue"),
  secondaryMeta: document.getElementById("secondaryMeta"),
};

let state = loadState();
let ui = {
  detailsOpen: false,
  advancedOpen: false,
};
let toastTimer = null;

init();

function init() {
  syncHeadMeta();
  bindEvents();
  populateForm();
  syncManualTaxState();
  render(calculateModel(state));
}

function bindEvents() {
  el.calculatorForm?.addEventListener("submit", handleFormSubmit);
  el.jumpToCalculatorBtn?.addEventListener("click", () => {
    el.calculatorSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  el.resetDefaultsBtn?.addEventListener("click", handleResetDefaults);
  el.resetAdvancedBtn?.addEventListener("click", handleResetAdvanced);
  el.shareScenarioBtn?.addEventListener("click", handleShareScenario);
  el.printSummaryBtn?.addEventListener("click", () => window.print());
  el.toggleDetailsBtn?.addEventListener("click", toggleDetails);
  el.advancedToggleBtn?.addEventListener("click", toggleAdvanced);
  el.useManualCurrentTaxRate?.addEventListener("change", () => {
    syncManualTaxState();
  });

  el.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const preset = PRESET_INPUTS[button.dataset.preset || ""];
      if (!preset) return;
      state = normalizeInputs({ ...state, ...preset });
      persistState();
      populateForm();
      syncManualTaxState();
      render(calculateModel(state));
      toast("Preset loaded");
    });
  });
}

function handleFormSubmit(event) {
  event.preventDefault();
  syncStateFromForm();
  render(calculateModel(state));
  toast("Comparison updated");
}

function handleResetDefaults() {
  state = normalizeInputs(DEFAULT_INPUTS);
  persistState();
  populateForm();
  syncManualTaxState();
  ui.detailsOpen = false;
  syncDetailsState();
  render(calculateModel(state));
  toast("Defaults restored");
}

function handleResetAdvanced() {
  state = normalizeInputs({
    ...state,
    annualReturn: DEFAULT_INPUTS.annualReturn,
    retirementTaxRate: DEFAULT_INPUTS.retirementTaxRate,
    currentRrspBalance: DEFAULT_INPUTS.currentRrspBalance,
    currentTfsaBalance: DEFAULT_INPUTS.currentTfsaBalance,
    contributionFrequency: DEFAULT_INPUTS.contributionFrequency,
    growthMode: DEFAULT_INPUTS.growthMode,
    inflationRate: DEFAULT_INPUTS.inflationRate,
    useManualCurrentTaxRate: DEFAULT_INPUTS.useManualCurrentTaxRate,
    manualCurrentTaxRate: DEFAULT_INPUTS.manualCurrentTaxRate,
  });
  persistState();
  populateForm();
  syncManualTaxState();
  render(calculateModel(state));
  toast("Advanced assumptions reset");
}

async function handleShareScenario() {
  updateUrlFromState();
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast("Share link copied");
  } catch {
    toast("Share link ready in the address bar");
  }
}

function toggleDetails() {
  ui.detailsOpen = !ui.detailsOpen;
  syncDetailsState();
}

function toggleAdvanced() {
  ui.advancedOpen = !ui.advancedOpen;
  syncAdvancedState();
}

function syncDetailsState() {
  el.detailedResults.hidden = !ui.detailsOpen;
  el.toggleDetailsBtn.setAttribute("aria-expanded", String(ui.detailsOpen));
  if (ui.detailsOpen) {
    el.toggleDetailsBtn.textContent = "Hide detailed comparison";
  } else {
    el.toggleDetailsBtn.textContent = getWinnerCopy(calculateModel(state)).detailLabel;
  }
}

function syncAdvancedState() {
  el.advancedPanel.hidden = !ui.advancedOpen;
  el.advancedToggleBtn.setAttribute("aria-expanded", String(ui.advancedOpen));
  el.advancedToggleLabel.textContent = ui.advancedOpen ? "Hide" : "Optional";
}

function loadState() {
  try {
    const fromUrl = loadStateFromUrl();
    if (fromUrl) return normalizeInputs(fromUrl);
    const raw = localStorage.getItem(TEMPLATE.storageKey);
    if (!raw) return normalizeInputs(DEFAULT_INPUTS);
    return normalizeInputs(JSON.parse(raw));
  } catch {
    return normalizeInputs(DEFAULT_INPUTS);
  }
}

function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.toString()) return null;
  return {
    income: params.get("income"),
    province: params.get("province"),
    currentAge: params.get("age"),
    retirementAge: params.get("retire"),
    contribution: params.get("contribution"),
    annualReturn: params.get("return"),
    retirementTaxRate: params.get("retTax"),
    currentRrspBalance: params.get("rrsp"),
    currentTfsaBalance: params.get("tfsa"),
    contributionFrequency: params.get("frequency"),
    growthMode: params.get("mode"),
    inflationRate: params.get("inflation"),
    useManualCurrentTaxRate: params.get("manual") === "1",
    manualCurrentTaxRate: params.get("currentTax"),
  };
}

function persistState() {
  localStorage.setItem(TEMPLATE.storageKey, JSON.stringify(state));
  updateUrlFromState();
}

function updateUrlFromState() {
  const params = new URLSearchParams();
  params.set("income", String(Math.round(state.income)));
  params.set("province", state.province);
  params.set("age", String(Math.round(state.currentAge)));
  params.set("retire", String(Math.round(state.retirementAge)));
  params.set("contribution", String(Math.round(state.contribution)));
  params.set("return", String(state.annualReturn));
  params.set("retTax", String(state.retirementTaxRate));
  params.set("rrsp", String(Math.round(state.currentRrspBalance)));
  params.set("tfsa", String(Math.round(state.currentTfsaBalance)));
  params.set("frequency", state.contributionFrequency);
  params.set("mode", state.growthMode);
  params.set("inflation", String(state.inflationRate));
  if (state.useManualCurrentTaxRate) {
    params.set("manual", "1");
    params.set("currentTax", String(state.manualCurrentTaxRate));
  }
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

function normalizeInputs(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    income: clamp(toNumber(source.income, DEFAULT_INPUTS.income), 0, 1000000),
    province: safeProvince(source.province),
    currentAge: clamp(toNumber(source.currentAge, DEFAULT_INPUTS.currentAge), 18, 80),
    retirementAge: clamp(toNumber(source.retirementAge, DEFAULT_INPUTS.retirementAge), 40, 85),
    contribution: clamp(toNumber(source.contribution, DEFAULT_INPUTS.contribution), 0, 500000),
    annualReturn: clamp(toNumber(source.annualReturn, DEFAULT_INPUTS.annualReturn), 0, 15),
    retirementTaxRate: clamp(toNumber(source.retirementTaxRate, DEFAULT_INPUTS.retirementTaxRate), 0, 55),
    currentRrspBalance: clamp(toNumber(source.currentRrspBalance, DEFAULT_INPUTS.currentRrspBalance), 0, 5000000),
    currentTfsaBalance: clamp(toNumber(source.currentTfsaBalance, DEFAULT_INPUTS.currentTfsaBalance), 0, 5000000),
    contributionFrequency: source.contributionFrequency === "one-time" ? "one-time" : "annual",
    growthMode: source.growthMode === "real" ? "real" : "nominal",
    inflationRate: clamp(toNumber(source.inflationRate, DEFAULT_INPUTS.inflationRate), 0, 8),
    useManualCurrentTaxRate: Boolean(source.useManualCurrentTaxRate),
    manualCurrentTaxRate: clamp(toNumber(source.manualCurrentTaxRate, DEFAULT_INPUTS.manualCurrentTaxRate), 0, 55),
  };
}

function populateForm() {
  el.income.value = String(state.income);
  el.province.value = state.province;
  el.currentAge.value = String(state.currentAge);
  el.retirementAge.value = String(state.retirementAge);
  el.contributionInput.value = String(state.contribution);
  el.annualReturn.value = String(state.annualReturn);
  el.retirementTaxRate.value = String(state.retirementTaxRate);
  el.currentRrspBalance.value = String(state.currentRrspBalance);
  el.currentTfsaBalance.value = String(state.currentTfsaBalance);
  el.contributionFrequency.value = state.contributionFrequency;
  el.growthMode.value = state.growthMode;
  el.inflationRate.value = String(state.inflationRate);
  el.useManualCurrentTaxRate.checked = state.useManualCurrentTaxRate;
  el.manualCurrentTaxRate.value = String(state.manualCurrentTaxRate);
}

function syncStateFromForm() {
  state = normalizeInputs({
    income: el.income.value,
    province: el.province.value,
    currentAge: el.currentAge.value,
    retirementAge: el.retirementAge.value,
    contribution: el.contributionInput.value,
    annualReturn: el.annualReturn.value,
    retirementTaxRate: el.retirementTaxRate.value,
    currentRrspBalance: el.currentRrspBalance.value,
    currentTfsaBalance: el.currentTfsaBalance.value,
    contributionFrequency: el.contributionFrequency.value,
    growthMode: el.growthMode.value,
    inflationRate: el.inflationRate.value,
    useManualCurrentTaxRate: el.useManualCurrentTaxRate.checked,
    manualCurrentTaxRate: el.manualCurrentTaxRate.value,
  });
  persistState();
}

function syncManualTaxState() {
  const disabled = !el.useManualCurrentTaxRate.checked;
  el.manualCurrentTaxRate.disabled = disabled;
  el.manualCurrentTaxRate.setAttribute("aria-disabled", String(disabled));
}

function calculateModel(inputs) {
  const yearsToRetirement = Math.max(0, Math.round(inputs.retirementAge - inputs.currentAge));
  const effectiveGrowthRate = inputs.growthMode === "real"
    ? ((1 + inputs.annualReturn / 100) / (1 + inputs.inflationRate / 100)) - 1
    : inputs.annualReturn / 100;
  const currentMarginalRate = inputs.useManualCurrentTaxRate
    ? inputs.manualCurrentTaxRate / 100
    : estimateMarginalTaxRate(inputs.income, inputs.province);
  const retirementTaxRate = inputs.retirementTaxRate / 100;

  const newRrspBeforeTax = futureValueContribution(inputs.contribution, effectiveGrowthRate, yearsToRetirement, inputs.contributionFrequency);
  const newRrspAfterTax = newRrspBeforeTax * (1 - retirementTaxRate);
  const refundNow = inputs.contribution * currentMarginalRate;
  const refundFutureValue = futureValueContribution(refundNow, effectiveGrowthRate, yearsToRetirement, inputs.contributionFrequency);
  const tfsaFutureValue = futureValueContribution(inputs.contribution, effectiveGrowthRate, yearsToRetirement, inputs.contributionFrequency);
  const tfsaSameNetCostFuture = futureValueContribution(inputs.contribution * (1 - currentMarginalRate), effectiveGrowthRate, yearsToRetirement, inputs.contributionFrequency);

  const existingRrspAfterTax = growPrincipal(inputs.currentRrspBalance, effectiveGrowthRate, yearsToRetirement) * (1 - retirementTaxRate);
  const existingTfsaFuture = growPrincipal(inputs.currentTfsaBalance, effectiveGrowthRate, yearsToRetirement);

  const rrspSpentDecisionValue = newRrspAfterTax;
  const rrspReinvestedDecisionValue = newRrspAfterTax + refundFutureValue;
  const tfsaDecisionValue = tfsaFutureValue;

  const scenarios = [
    { key: "tfsa", label: "TFSA", value: tfsaDecisionValue },
    { key: "rrspSpent", label: "RRSP if refund is spent", value: rrspSpentDecisionValue },
    { key: "rrspReinvested", label: "RRSP if refund is reinvested", value: rrspReinvestedDecisionValue },
  ].sort((a, b) => b.value - a.value);

  return {
    inputs,
    yearsToRetirement,
    effectiveGrowthRate,
    currentMarginalRate,
    retirementTaxRate,
    refundNow,
    refundFutureValue,
    newRrspBeforeTax,
    newRrspAfterTax,
    tfsaFutureValue,
    tfsaSameNetCostFuture,
    existingRrspAfterTax,
    existingTfsaFuture,
    rrspSpentDecisionValue,
    rrspReinvestedDecisionValue,
    tfsaDecisionValue,
    topScenario: scenarios[0],
    secondScenario: scenarios[1],
    gap: Math.max(0, scenarios[0].value - scenarios[1].value),
    closeness: scenarios[0].value ? (scenarios[0].value - scenarios[1].value) / scenarios[0].value : 0,
  };
}

function render(model) {
  syncAdvancedState();
  syncDetailsState();
  renderValidation(model);
  renderWinner(model);
  renderScenarioCards(model);
  renderDetailSummary(model);
  renderMetrics(model);
  renderBars(model);
  renderAssumptions(model);
}

function renderValidation(model) {
  clearFieldErrors();

  if (model.inputs.retirementAge <= model.inputs.currentAge) {
    el.validationNote.textContent = "Retirement age should be later than current age.";
    setFieldError(el.retirementAgeField, el.retirementAgeError, "Choose a retirement age after your current age.");
    return;
  }
  if (!model.inputs.contribution) {
    el.validationNote.textContent = "Add a contribution amount to compare RRSP and TFSA.";
    setFieldError(el.contributionField, el.contributionError, "Enter the contribution you want to compare.");
    return;
  }
  if (!model.inputs.income) {
    el.validationNote.textContent = "Add your annual income so the RRSP tax estimate is meaningful.";
    setFieldError(el.incomeField, el.incomeError, "Enter annual employment income.");
    return;
  }
  if (model.inputs.useManualCurrentTaxRate) {
    el.validationNote.textContent = "Using your manual current marginal tax rate.";
    return;
  }
  el.validationNote.textContent = `Estimated current marginal tax rate: ${formatPercent(model.currentMarginalRate)} based on ${provinceName(model.inputs.province)} and employment income.`;
}

function renderWinner(model) {
  const copy = getWinnerCopy(model);
  el.winnerHeading.textContent = copy.title;
  el.winnerConfidence.textContent = copy.confidence;
  el.winnerConfidence.dataset.confidence = copy.confidenceTone;
  el.winnerSummary.textContent = copy.body;
  el.winnerReasons.innerHTML = copy.reasons.map((reason) => `<p class="reason-line">${escapeHtml(reason)}</p>`).join("");
  el.winnerSensitivity.textContent = copy.sensitivity;
  el.refundInsight.textContent = copy.refundInsight;
  el.toggleDetailsBtn.textContent = copy.detailLabel;
  el.winnerMiniGrid.innerHTML = `
    <article class="mini-card">
      <span>Estimated RRSP refund</span>
      <strong>${escapeHtml(formatCurrency(model.refundNow))}</strong>
    </article>
    <article class="mini-card">
      <span>Years until retirement</span>
      <strong>${escapeHtml(String(model.yearsToRetirement))}</strong>
    </article>
  `;
}

function getWinnerCopy(model) {
  const currentRate = formatPercent(model.currentMarginalRate);
  const retirementRate = formatPercent(model.retirementTaxRate);
  const reinvestedWins = model.rrspReinvestedDecisionValue > model.tfsaDecisionValue;
  const spentWins = model.rrspSpentDecisionValue > model.tfsaDecisionValue;

  if (model.closeness < 0.03) {
    return {
      title: "Best fit right now: Too close to call",
      body: "This is a close comparison. Flexibility, future tax rates, and refund behaviour may matter more than the headline projection.",
      reasons: [
        `Your current tax rate estimate is ${currentRate}, versus ${retirementRate} in retirement.`,
        "When that gap is small, a TFSA often stays competitive and refund behaviour becomes important.",
      ],
      sensitivity: "If your future tax rate shifts even modestly, the winner can change.",
      refundInsight: "Important: RRSP usually only pulls clearly ahead when the refund is also invested.",
      detailLabel: "See why this is close",
      confidence: "Very close",
      confidenceTone: "close",
    };
  }

  if (reinvestedWins) {
    return {
      title: spentWins ? "Best fit right now: RRSP" : "Best fit right now: RRSP, if you reinvest the refund",
      body: spentWins
        ? "Your current tax rate appears meaningfully higher than your retirement tax rate, so the RRSP deduction helps more."
        : "The RRSP tax break matters here, but most of the advantage comes from putting the refund back to work.",
      reasons: [
        `Current tax estimate: ${currentRate}. Retirement tax assumption: ${retirementRate}.`,
        `Reinvesting the refund adds about ${formatCurrency(model.refundFutureValue)} to the retirement result in this scenario.`,
      ],
      sensitivity: "If your retirement tax rate ends up closer to today's rate, the RRSP edge shrinks.",
      refundInsight: spentWins
        ? "Important: the RRSP lead is stronger when the refund is reinvested instead of spent."
        : "Important: in this scenario, spending the refund weakens the RRSP enough that the answer can flip.",
      detailLabel: spentWins ? "See detailed comparison" : "See refund impact",
      confidence: spentWins ? "Clear winner" : "Leaning RRSP",
      confidenceTone: spentWins ? "clear" : "leaning",
    };
  }

  return {
    title: "Best fit right now: TFSA",
    body: "Under these assumptions, the TFSA keeps more of the benefit because the RRSP deduction is not large enough to outweigh future tax on withdrawals.",
    reasons: [
      `Current tax estimate: ${currentRate}. Retirement tax assumption: ${retirementRate}.`,
      `The TFSA reaches ${formatCurrency(model.tfsaDecisionValue)} here, versus ${formatCurrency(model.rrspReinvestedDecisionValue)} for RRSP with refund reinvested.`,
    ],
    sensitivity: "A higher current tax rate or lower retirement tax rate would make the RRSP more competitive.",
    refundInsight: "Important: RRSP can become more attractive later if your current tax rate rises or you consistently reinvest the refund.",
    detailLabel: "See detailed comparison",
    confidence: "Leaning TFSA",
    confidenceTone: "leaning",
  };
}

function renderScenarioCards(model) {
  el.primaryValue.textContent = formatCurrency(model.topScenario.value);
  el.primaryMeta.textContent = scenarioMeta(model.topScenario.key, model);
  el.secondaryValue.textContent = formatCurrency(model.secondScenario.value);
  el.secondaryMeta.textContent = `${scenarioMeta(model.secondScenario.key, model)} • ${formatCurrency(model.gap)} behind`;
}

function renderDetailSummary(model) {
  el.detailWinnerValue.textContent = formatCurrency(model.topScenario.value);
  el.detailWinnerMeta.textContent = model.topScenario.label;
  el.detailRefundImpactValue.textContent = formatCurrency(model.refundFutureValue);
  el.detailRefundImpactMeta.textContent = "Extra retirement value if the RRSP refund is reinvested";
  el.equalCostNote.textContent = `If you compare equal out-of-pocket cost, the TFSA equivalent contribution would be about ${formatCurrency(
    model.inputs.contribution * (1 - model.currentMarginalRate),
  )} instead of ${formatCurrency(model.inputs.contribution)}.`;
}

function scenarioMeta(key, model) {
  if (key === "tfsa") {
    return `TFSA option • ${formatCurrency(model.tfsaSameNetCostFuture)} on equal-cost basis`;
  }
  if (key === "rrspSpent") {
    return `RRSP with refund spent • ${formatCurrency(model.newRrspBeforeTax)} before retirement tax`;
  }
  return `RRSP with refund reinvested • ${formatCurrency(model.refundFutureValue)} from refund reinvestment`;
}

function renderMetrics(model) {
  const cards = [
    {
      label: "Contribution tested",
      value: formatCurrency(model.inputs.contribution),
      sub: model.inputs.contributionFrequency === "annual" ? "Annual recurring contribution" : "One-time contribution",
    },
    {
      label: "Projected RRSP before tax",
      value: formatCurrency(model.newRrspBeforeTax),
      sub: "Value of the new RRSP contribution before retirement tax",
    },
    {
      label: "Same-net-cost TFSA amount",
      value: formatCurrency(model.inputs.contribution * (1 - model.currentMarginalRate)),
      sub: "Useful if you want to compare equal out-of-pocket cost",
    },
    {
      label: "Current tax estimate",
      value: formatPercent(model.currentMarginalRate),
      sub: model.inputs.useManualCurrentTaxRate ? "Manual override" : "Province + income estimate",
    },
  ];

  el.metricGrid.innerHTML = cards.map((card) => `
    <article class="metric-card">
      <span class="label">${escapeHtml(card.label)}</span>
      <span class="value">${escapeHtml(card.value)}</span>
      <span class="sub">${escapeHtml(card.sub)}</span>
    </article>
  `).join("");
}

function renderBars(model) {
  const bars = [
    { label: "TFSA", value: model.tfsaDecisionValue, tone: "tfsa" },
    { label: "RRSP if refund is spent", value: model.rrspSpentDecisionValue, tone: "spent" },
    { label: "RRSP if refund is reinvested", value: model.rrspReinvestedDecisionValue, tone: "reinvested" },
  ];
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  el.comparisonBars.innerHTML = bars.map((bar) => `
    <div class="bar-row">
      <div class="bar-copy">
        <span>${escapeHtml(bar.label)}</span>
        <strong>${escapeHtml(formatCurrency(bar.value))}</strong>
      </div>
      <div class="bar-track">
        <span class="bar-fill ${escapeHtml(bar.tone)}" style="width:${((bar.value / max) * 100).toFixed(1)}%"></span>
      </div>
    </div>
  `).join("");
}

function clearFieldErrors() {
  [
    [el.incomeField, el.incomeError],
    [el.contributionField, el.contributionError],
    [el.retirementAgeField, el.retirementAgeError],
  ].forEach(([field, error]) => {
    field?.classList.remove("has-error");
    if (error) error.textContent = "";
  });
}

function setFieldError(field, errorEl, message) {
  field?.classList.add("has-error");
  if (errorEl) errorEl.textContent = message;
}

function renderAssumptions(model) {
  const assumptions = [
    `${model.inputs.contributionFrequency === "annual" ? "Annual recurring" : "One-time"} contribution of ${formatCurrency(model.inputs.contribution)}.`,
    `${model.inputs.growthMode === "real" ? "Inflation-adjusted" : "Nominal"} growth rate of ${formatPercent(model.effectiveGrowthRate)} over ${model.yearsToRetirement} years.`,
    `RRSP refund estimate uses a current marginal tax rate of ${formatPercent(model.currentMarginalRate)}.`,
    `RRSP withdrawals are taxed at an assumed retirement rate of ${formatPercent(model.retirementTaxRate)}.`,
    "Tax estimates are simplified and do not include every credit, surtax, clawback, or contribution-room rule.",
    "Educational estimate only. Investment returns are not guaranteed.",
  ];

  el.assumptionList.innerHTML = assumptions.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  if (model.inputs.currentRrspBalance || model.inputs.currentTfsaBalance) {
    el.balanceContext.textContent = `For context, existing balances were projected separately: ${formatCurrency(model.existingRrspAfterTax)} from today's RRSP balance after retirement tax, and ${formatCurrency(model.existingTfsaFuture)} from today's TFSA balance.`;
  } else {
    el.balanceContext.textContent = "No current balances were entered. The detailed comparison focuses on the new contribution decision only.";
  }
}

function syncHeadMeta() {
  document.title = TEMPLATE.appName;
  el.metaDescription?.setAttribute("content", TEMPLATE.seoDescription);
  el.metaThemeColor?.setAttribute("content", "#0f6abf");
  el.metaOgTitle?.setAttribute("content", TEMPLATE.appName);
  el.metaOgDescription?.setAttribute("content", TEMPLATE.seoDescription);
  el.metaOgUrl?.setAttribute("content", TEMPLATE.siteUrl);
  el.metaOgImage?.setAttribute("content", TEMPLATE.socialImageUrl);
  el.metaOgSiteName?.setAttribute("content", "SimpleKit RRSP vs TFSA Calculator");
  el.metaTwitterTitle?.setAttribute("content", TEMPLATE.appName);
  el.metaTwitterDescription?.setAttribute("content", TEMPLATE.seoDescription);
  el.metaTwitterImage?.setAttribute("content", TEMPLATE.socialImageUrl);
}

function estimateMarginalTaxRate(income, provinceCode) {
  return lookupRate(FEDERAL_TAX_TABLE, income) + lookupRate(PROVINCIAL_TAX_TABLES[provinceCode] || PROVINCIAL_TAX_TABLES.ON, income);
}

function lookupRate(table, income) {
  const taxableIncome = Math.max(0, income);
  for (const band of table) {
    if (taxableIncome <= band.upTo) return band.rate;
  }
  return table[table.length - 1]?.rate || 0;
}

function futureValueContribution(amount, rate, years, frequency) {
  if (years <= 0) return amount;
  if (frequency === "one-time") return growPrincipal(amount, rate, years);
  if (Math.abs(rate) < 0.000001) return amount * years;
  return amount * ((Math.pow(1 + rate, years) - 1) / rate);
}

function growPrincipal(principal, rate, years) {
  if (years <= 0) return principal;
  return principal * Math.pow(1 + rate, years);
}

function provinceName(code) {
  return ({
    AB: "Alberta",
    BC: "British Columbia",
    MB: "Manitoba",
    NB: "New Brunswick",
    NL: "Newfoundland and Labrador",
    NS: "Nova Scotia",
    NT: "Northwest Territories",
    NU: "Nunavut",
    ON: "Ontario",
    PE: "Prince Edward Island",
    QC: "Quebec",
    SK: "Saskatchewan",
    YT: "Yukon",
  })[code] || "Ontario";
}

function safeProvince(value) {
  return Object.prototype.hasOwnProperty.call(PROVINCIAL_TAX_TABLES, value) ? value : DEFAULT_INPUTS.province;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value) {
  return `${(Number.isFinite(value) ? value * 100 : 0).toFixed(1)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toast(message) {
  if (!el.appToast) return;
  if (toastTimer) clearTimeout(toastTimer);
  el.appToast.textContent = message;
  el.appToast.hidden = false;
  toastTimer = window.setTimeout(() => {
    el.appToast.hidden = true;
    toastTimer = null;
  }, 1800);
}
