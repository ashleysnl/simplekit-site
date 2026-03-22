const APP = {
  storageKey: "simplekit.fire-calculator.v1",
  maxProjectionYears: 60,
  supportUrl: "https://buymeacoffee.com/ashleysnl",
  relatedLinks: [
    { key: "tfsa-rrsp", href: "https://simplekit.app/rrsp-vs-tfsa-calculator/" },
    { key: "cpp", href: "https://simplekit.app/cpp-calculator/" },
    { key: "retirement", href: "https://simplekit.app/retirement-planner/" },
    { key: "net-worth", href: "https://simplekit.app/net-worth-calculator/" },
  ],
};

const DEFAULTS = {
  currentAge: 38,
  targetAge: 55,
  currentAssets: 220000,
  annualSpending: 70000,
  annualSavings: 30000,
  expectedReturn: 5,
  withdrawalRate: 4,
  passiveIncome: 0,
  inflationRate: 2,
  salaryIncome: 120000,
  contributionGrowth: 1,
  lumpSumAmount: 0,
  lumpSumYear: 5,
  returnMode: "nominal",
};

const SAMPLE = {
  currentAge: 36,
  targetAge: 52,
  currentAssets: 180000,
  annualSpending: 65000,
  annualSavings: 35000,
  expectedReturn: 5,
  withdrawalRate: 4,
  passiveIncome: 5000,
  inflationRate: 2,
  salaryIncome: 135000,
  contributionGrowth: 1.5,
  lumpSumAmount: 25000,
  lumpSumYear: 6,
  returnMode: "nominal",
};

const el = {
  root: document.documentElement,
  form: document.getElementById("fireForm"),
  snapshotGrid: document.getElementById("snapshotGrid"),
  resultsGrid: document.getElementById("resultsGrid"),
  milestoneGrid: document.getElementById("milestoneGrid"),
  scenarioCards: document.getElementById("scenarioCards"),
  insightGrid: document.getElementById("insightGrid"),
  projectionTableBody: document.getElementById("projectionTableBody"),
  growthChart: document.getElementById("growthChart"),
  comparisonChart: document.getElementById("comparisonChart"),
  scenarioChart: document.getElementById("scenarioChart"),
  progressBar: document.getElementById("progressBar"),
  progressPercent: document.getElementById("progressPercent"),
  progressNarrative: document.getElementById("progressNarrative"),
  resultSummaryLine: document.getElementById("resultSummaryLine"),
  supportedIncomeText: document.getElementById("supportedIncomeText"),
  edgeCaseMessage: document.getElementById("edgeCaseMessage"),
  stageBadge: document.getElementById("stageBadge"),
  savingsRateNote: document.getElementById("savingsRateNote"),
  advancedFields: document.getElementById("advancedFields"),
  advancedToggleBtn: document.getElementById("advancedToggleBtn"),
  advancedToggleLabel: document.getElementById("advancedToggleLabel"),
  loadSampleBtn: document.getElementById("loadSampleBtn"),
  loadSampleBtnHero: document.getElementById("loadSampleBtnHero"),
  resetBtn: document.getElementById("resetBtn"),
  saveAssumptionsBtn: document.getElementById("saveAssumptionsBtn"),
  globalSaveBtn: document.getElementById("globalSaveBtn"),
  globalSupportBtn: document.getElementById("globalSupportBtn"),
  resultsSupportLink: document.getElementById("resultsSupportLink"),
  supportBannerLink: document.getElementById("supportBannerLink"),
  footerSupportLink: document.getElementById("footerSupportLink"),
  aboutSupportLink: document.getElementById("aboutSupportLink"),
  aboutAppBtn: document.getElementById("aboutAppBtn"),
  footerAboutBtn: document.getElementById("footerAboutBtn"),
  aboutModal: document.getElementById("aboutModal"),
  aboutModalClose: document.getElementById("aboutModalClose"),
  appToast: document.getElementById("appToast"),
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
  currentAge: document.getElementById("currentAge"),
  targetAge: document.getElementById("targetAge"),
  currentAssets: document.getElementById("currentAssets"),
  annualSpending: document.getElementById("annualSpending"),
  annualSavings: document.getElementById("annualSavings"),
  expectedReturn: document.getElementById("expectedReturn"),
  withdrawalRate: document.getElementById("withdrawalRate"),
  passiveIncome: document.getElementById("passiveIncome"),
  inflationRate: document.getElementById("inflationRate"),
  salaryIncome: document.getElementById("salaryIncome"),
  contributionGrowth: document.getElementById("contributionGrowth"),
  lumpSumAmount: document.getElementById("lumpSumAmount"),
  lumpSumYear: document.getElementById("lumpSumYear"),
  returnModeNominal: document.getElementById("returnModeNominal"),
  returnModeReal: document.getElementById("returnModeReal"),
};

let state = loadState();
let ui = {
  dirty: false,
  advancedOpen: false,
  toastTimer: null,
};

init();

function init() {
  syncSupportLinks();
  bindEvents();
  populateForm(state.inputs);
  syncMeta();
  render();
}

function bindEvents() {
  el.form?.addEventListener("input", handleFormInput);
  el.form?.addEventListener("change", handleFormInput);
  el.loadSampleBtn?.addEventListener("click", () => loadPreset(SAMPLE, "sample"));
  el.loadSampleBtnHero?.addEventListener("click", () => loadPreset(SAMPLE, "sample"));
  el.resetBtn?.addEventListener("click", handleReset);
  el.saveAssumptionsBtn?.addEventListener("click", handleSave);
  el.globalSaveBtn?.addEventListener("click", handleSave);
  el.advancedToggleBtn?.addEventListener("click", toggleAdvanced);
  el.aboutAppBtn?.addEventListener("click", openAboutModal);
  el.footerAboutBtn?.addEventListener("click", openAboutModal);
  el.aboutModalClose?.addEventListener("click", closeAboutModal);
  el.aboutModal?.addEventListener("click", (event) => {
    if (event.target === el.aboutModal) closeAboutModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAboutModal();
  });
  document.querySelectorAll("[data-track-link]").forEach((link) => {
    link.addEventListener("click", () => {
      track("related_tool_click", { tool: link.getAttribute("data-track-link") || "unknown" });
    });
  });
  [el.globalSupportBtn, el.resultsSupportLink, el.footerSupportLink, el.supportBannerLink, el.aboutSupportLink]
    .filter(Boolean)
    .forEach((link) => {
      link.addEventListener("click", () => track("support_click", { location: link.id }));
    });
}

function loadState() {
  const fallback = { inputs: { ...DEFAULTS } };
  try {
    const raw = localStorage.getItem(APP.storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      inputs: normalizeInputs(parsed.inputs || parsed),
    };
  } catch {
    return fallback;
  }
}

function normalizeInputs(input) {
  const next = { ...DEFAULTS };
  const source = input && typeof input === "object" ? input : {};
  Object.keys(next).forEach((key) => {
    if (key === "returnMode") {
      next.returnMode = source.returnMode === "real" ? "real" : "nominal";
      return;
    }
    next[key] = sanitizeNumber(source[key], DEFAULTS[key]);
  });
  next.targetAge = Math.max(next.currentAge, next.targetAge);
  next.withdrawalRate = clamp(next.withdrawalRate, 0.1, 12);
  return next;
}

function populateForm(inputs) {
  const values = normalizeInputs(inputs);
  el.currentAge.value = String(values.currentAge);
  el.targetAge.value = String(values.targetAge);
  el.currentAssets.value = String(values.currentAssets);
  el.annualSpending.value = String(values.annualSpending);
  el.annualSavings.value = String(values.annualSavings);
  el.expectedReturn.value = String(values.expectedReturn);
  el.withdrawalRate.value = String(values.withdrawalRate);
  el.passiveIncome.value = String(values.passiveIncome);
  el.inflationRate.value = String(values.inflationRate);
  el.salaryIncome.value = String(values.salaryIncome);
  el.contributionGrowth.value = String(values.contributionGrowth);
  el.lumpSumAmount.value = String(values.lumpSumAmount);
  el.lumpSumYear.value = String(values.lumpSumYear);
  el.returnModeNominal.checked = values.returnMode !== "real";
  el.returnModeReal.checked = values.returnMode === "real";
}

function readInputs() {
  return normalizeInputs({
    currentAge: el.currentAge.value,
    targetAge: el.targetAge.value,
    currentAssets: el.currentAssets.value,
    annualSpending: el.annualSpending.value,
    annualSavings: el.annualSavings.value,
    expectedReturn: el.expectedReturn.value,
    withdrawalRate: el.withdrawalRate.value,
    passiveIncome: el.passiveIncome.value,
    inflationRate: el.inflationRate.value,
    salaryIncome: el.salaryIncome.value,
    contributionGrowth: el.contributionGrowth.value,
    lumpSumAmount: el.lumpSumAmount.value,
    lumpSumYear: el.lumpSumYear.value,
    returnMode: el.returnModeReal.checked ? "real" : "nominal",
  });
}

function handleFormInput(event) {
  state.inputs = readInputs();
  if (event.target?.id === "advancedToggleBtn") return;
  markDirty(true);
  render();
  track("calculator_interaction", { field: event.target?.id || "unknown" });
}

function handleSave() {
  state.inputs = readInputs();
  localStorage.setItem(APP.storageKey, JSON.stringify({ inputs: state.inputs }));
  markDirty(false);
  toast("Assumptions saved locally");
  track("calculator_save", { mode: "manual" });
}

function handleReset() {
  state.inputs = { ...DEFAULTS };
  populateForm(state.inputs);
  markDirty(true);
  render();
  toast("Calculator reset");
  track("calculator_reset", { source: "button" });
}

function loadPreset(preset, source) {
  state.inputs = normalizeInputs(preset);
  populateForm(state.inputs);
  markDirty(true);
  render();
  toast("Sample profile loaded");
  track("sample_data_load", { source });
}

function toggleAdvanced() {
  ui.advancedOpen = !ui.advancedOpen;
  if (el.advancedFields) el.advancedFields.hidden = !ui.advancedOpen;
  el.advancedToggleBtn?.setAttribute("aria-expanded", String(ui.advancedOpen));
  if (el.advancedToggleLabel) el.advancedToggleLabel.textContent = ui.advancedOpen ? "Hide" : "Show";
  track("advanced_settings_toggle", { state: ui.advancedOpen ? "open" : "closed" });
}

function render() {
  const inputs = normalizeInputs(state.inputs);
  const plan = calculatePlan(inputs);
  renderSnapshot(plan, inputs);
  renderResults(plan);
  renderMilestones(plan);
  renderProjectionTable(plan);
  renderCharts(plan);
  renderScenarios(inputs);
  renderInsights(plan, inputs);
  syncSavingsRate(inputs);
  syncMeta();
}

function calculatePlan(inputs) {
  const withdrawalRateDecimal = Math.max(inputs.withdrawalRate, 0.1) / 100;
  const annualNeed = Math.max(inputs.annualSpending - inputs.passiveIncome, 0);
  const fireTarget = annualNeed === 0 ? 0 : annualNeed / withdrawalRateDecimal;
  const effectiveReturn = getEffectiveReturn(inputs.expectedReturn / 100, inputs.inflationRate / 100, inputs.returnMode);
  const contributionGrowth = inputs.contributionGrowth / 100;
  const yearsToTargetAge = Math.max(0, Math.round(inputs.targetAge - inputs.currentAge));
  const maxYears = getProjectionYearsLimit(yearsToTargetAge);
  const records = [];
  let currentPortfolio = Math.max(0, inputs.currentAssets);
  let yearsToFI = fireTarget === 0 || currentPortfolio >= fireTarget ? 0 : null;
  let fireYearRecord = yearsToFI === 0 ? makeRecord({
    yearOffset: 0,
    age: inputs.currentAge,
    startPortfolio: currentPortfolio,
    contribution: 0,
    growth: 0,
    lumpSum: 0,
    endPortfolio: currentPortfolio,
    fireTarget,
  }) : null;
  records.push(fireYearRecord || makeRecord({
    yearOffset: 0,
    age: inputs.currentAge,
    startPortfolio: currentPortfolio,
    contribution: 0,
    growth: 0,
    lumpSum: 0,
    endPortfolio: currentPortfolio,
    fireTarget,
  }));

  for (let year = 1; year <= maxYears; year += 1) {
    const startPortfolio = currentPortfolio;
    const contribution = Math.max(0, inputs.annualSavings * Math.pow(1 + contributionGrowth, year - 1));
    const lumpSum = year === Math.round(inputs.lumpSumYear) ? Math.max(0, inputs.lumpSumAmount) : 0;
    const growth = Math.max(-startPortfolio, startPortfolio * effectiveReturn);
    const endPortfolio = Math.max(0, startPortfolio + growth + contribution + lumpSum);
    currentPortfolio = endPortfolio;

    const record = makeRecord({
      yearOffset: year,
      age: inputs.currentAge + year,
      startPortfolio,
      contribution,
      growth,
      lumpSum,
      endPortfolio,
      fireTarget,
    });

    records.push(record);

    if (fireTarget > 0 && yearsToFI === null && endPortfolio >= fireTarget) {
      yearsToFI = year;
      fireYearRecord = record;
    }
  }

  if (fireTarget === 0 || (records[0] && records[0].endPortfolio >= fireTarget)) {
    fireYearRecord = records[0];
  }

  const targetAgeRecord = records[Math.min(yearsToTargetAge, records.length - 1)];
  const progress = fireTarget === 0 ? 1 : clamp(inputs.currentAssets / fireTarget, 0, 9.99);
  const remaining = Math.max(0, fireTarget - inputs.currentAssets);
  const estimatedFireAge = yearsToFI === null ? null : inputs.currentAge + yearsToFI;
  const supportedIncome = fireTarget === 0 ? inputs.annualSpending : fireTarget * withdrawalRateDecimal;
  const stage = stageMeta(progress, fireTarget === 0);
  const scenarioInputs = buildScenarioInputs(inputs);
  const scenarioResults = scenarioInputs.map((scenario) => ({
    ...scenario,
    plan: calculateScenarioPlan(scenario.inputs),
  }));

  return {
    inputs,
    annualNeed,
    fireTarget,
    progress,
    remaining,
    yearsToFI,
    estimatedFireAge,
    supportedIncome,
    effectiveReturn,
    yearsToTargetAge,
    targetAgeRecord,
    records,
    fireYearRecord,
    stage,
    scenarioResults,
  };
}

function makeRecord({ yearOffset, age, startPortfolio, contribution, growth, lumpSum, endPortfolio, fireTarget }) {
  return {
    yearOffset,
    age,
    startPortfolio,
    contribution: contribution + lumpSum,
    growth,
    endPortfolio,
    progress: fireTarget === 0 ? 1 : clamp(endPortfolio / fireTarget, 0, 9.99),
  };
}

function calculateScenarioPlan(inputs) {
  const plan = calculateLitePlan(inputs);
  return {
    yearsToFI: plan.yearsToFI,
    fireAge: plan.fireAge,
    targetAgePortfolio: plan.targetAgePortfolio,
  };
}

function calculateLitePlan(inputs) {
  const normalized = normalizeInputs(inputs);
  const withdrawalRateDecimal = Math.max(normalized.withdrawalRate, 0.1) / 100;
  const annualNeed = Math.max(normalized.annualSpending - normalized.passiveIncome, 0);
  const fireTarget = annualNeed === 0 ? 0 : annualNeed / withdrawalRateDecimal;
  const effectiveReturn = getEffectiveReturn(
    normalized.expectedReturn / 100,
    normalized.inflationRate / 100,
    normalized.returnMode,
  );
  const contributionGrowth = normalized.contributionGrowth / 100;
  const yearsToTargetAge = Math.max(0, Math.round(normalized.targetAge - normalized.currentAge));
  const maxYears = getProjectionYearsLimit(yearsToTargetAge);
  let portfolio = Math.max(0, normalized.currentAssets);
  let yearsToFI = fireTarget === 0 || portfolio >= fireTarget ? 0 : null;
  let targetAgePortfolio = portfolio;

  for (let year = 1; year <= maxYears; year += 1) {
    const contribution = Math.max(0, normalized.annualSavings * Math.pow(1 + contributionGrowth, year - 1));
    const lumpSum = year === Math.round(normalized.lumpSumYear) ? Math.max(0, normalized.lumpSumAmount) : 0;
    const growth = Math.max(-portfolio, portfolio * effectiveReturn);
    portfolio = Math.max(0, portfolio + growth + contribution + lumpSum);

    if (year === yearsToTargetAge) targetAgePortfolio = portfolio;
    if (yearsToFI === null && fireTarget > 0 && portfolio >= fireTarget) yearsToFI = year;
  }

  if (yearsToTargetAge === 0) targetAgePortfolio = normalized.currentAssets;

  return {
    yearsToFI,
    fireAge: yearsToFI === null ? null : normalized.currentAge + yearsToFI,
    targetAgePortfolio,
  };
}

function buildScenarioInputs(inputs) {
  return [
    { name: "Current plan", tone: "neutral", inputs: { ...inputs } },
    {
      name: "Save $5k more",
      tone: "info",
      inputs: { ...inputs, annualSavings: inputs.annualSavings + 5000 },
    },
    {
      name: "Spend $5k less",
      tone: "success",
      inputs: { ...inputs, annualSpending: Math.max(0, inputs.annualSpending - 5000) },
    },
    {
      name: "Lower return",
      tone: "warning",
      inputs: { ...inputs, expectedReturn: Math.max(-5, inputs.expectedReturn - 1) },
    },
    {
      name: "Higher return",
      tone: "success",
      inputs: { ...inputs, expectedReturn: inputs.expectedReturn + 1 },
    },
  ];
}

function renderSnapshot(plan, inputs) {
  const snapshotItems = [
    {
      label: "FIRE number",
      value: plan.fireTarget === 0 ? "Already covered" : formatCurrency(plan.fireTarget),
      sub: plan.fireTarget === 0 ? "Passive income meets spending" : `${formatPercent(inputs.withdrawalRate)} withdrawal rate`,
    },
    {
      label: "Progress",
      value: formatPercent(plan.progress * 100),
      sub: `${formatCurrency(inputs.currentAssets)} invested today`,
    },
    {
      label: "Years to FI",
      value: plan.yearsToFI === null ? "Not reached" : `${plan.yearsToFI} years`,
      sub: plan.yearsToFI === null ? "Current assumptions do not hit FI in model range" : `Estimated FI age ${plan.estimatedFireAge}`,
    },
    {
      label: "Savings rate",
      value: inputs.salaryIncome > 0 ? formatPercent((inputs.annualSavings / inputs.salaryIncome) * 100) : "Add salary",
      sub: inputs.salaryIncome > 0 ? `Based on ${formatCurrency(inputs.salaryIncome)} income` : "Optional advanced input",
    },
  ];

  el.snapshotGrid.innerHTML = snapshotItems
    .map(
      (item) => `
        <article class="trip-snapshot-item">
          <span class="label">${escapeHtml(item.label)}</span>
          <span class="value">${escapeHtml(item.value)}</span>
          <span class="sub">${escapeHtml(item.sub)}</span>
        </article>
      `,
    )
    .join("");
}

function renderResults(plan) {
  const resultCards = [
    {
      label: "Estimated FIRE number",
      value: plan.fireTarget === 0 ? "Covered already" : formatCurrency(plan.fireTarget),
      sub: `${formatCurrency(plan.annualNeed)} annual need after passive income`,
    },
    {
      label: "Remaining to FI",
      value: plan.fireTarget === 0 ? "$0" : formatCurrency(plan.remaining),
      sub: "Gap between current assets and target",
    },
    {
      label: "Estimated years to FIRE",
      value: plan.yearsToFI === null ? "Not within model" : String(plan.yearsToFI),
      sub: plan.yearsToFI === null ? "Try raising savings or lowering spending" : `Crosses target around age ${plan.estimatedFireAge}`,
    },
    {
      label: "Portfolio at target age",
      value: formatCurrency(plan.targetAgeRecord.endPortfolio),
      sub: `${formatPercent(plan.targetAgeRecord.progress * 100)} of FIRE target by age ${plan.targetAgeRecord.age}`,
    },
    {
      label: "Estimated FI age",
      value: plan.estimatedFireAge === null ? "Unclear" : String(plan.estimatedFireAge),
      sub: plan.estimatedFireAge === null ? "Model limit reached before FI" : "Projected age when target is reached",
    },
    {
      label: "Return assumption used",
      value: formatPercent(plan.effectiveReturn * 100),
      sub: plan.inputs.returnMode === "real" ? "Real return assumption" : "Inflation-adjusted from nominal return",
    },
  ];

  el.resultsGrid.innerHTML = resultCards
    .map(
      (card) => `
        <article class="metric-card">
          <span class="label">${escapeHtml(card.label)}</span>
          <span class="value">${escapeHtml(card.value)}</span>
          <span class="sub">${escapeHtml(card.sub)}</span>
        </article>
      `,
    )
    .join("");

  const progressPercent = Math.round(clamp(plan.progress, 0, 1) * 100);
  el.progressBar.style.width = `${progressPercent}%`;
  el.progressPercent.textContent = `${progressPercent}%`;
  el.progressNarrative.textContent = progressNarrative(plan);
  el.resultSummaryLine.textContent = resultSummary(plan);
  el.supportedIncomeText.textContent = `${formatCurrency(plan.supportedIncome)} / year`;
  el.edgeCaseMessage.textContent = edgeCaseMessage(plan);
  el.stageBadge.textContent = plan.stage.label;
  el.stageBadge.dataset.status = plan.stage.status;
}

function renderMilestones(plan) {
  const milestones = [5, 10, plan.yearsToTargetAge].filter((value, index, array) => value >= 0 && array.indexOf(value) === index);
  el.milestoneGrid.innerHTML = milestones
    .map((yearOffset) => {
      const record = plan.records[Math.min(yearOffset, plan.records.length - 1)];
      const label = yearOffset === plan.yearsToTargetAge ? `At age ${plan.inputs.targetAge}` : `${yearOffset}-year milestone`;
      return `
        <article class="metric-card">
          <span class="label">${escapeHtml(label)}</span>
          <span class="value">${escapeHtml(formatCurrency(record.endPortfolio))}</span>
          <span class="sub">${escapeHtml(formatPercent(record.progress * 100))} of FIRE target${record.age ? ` • age ${record.age}` : ""}</span>
        </article>
      `;
    })
    .join("");
}

function renderProjectionTable(plan) {
  el.projectionTableBody.innerHTML = plan.records
    .map(
      (record) => `
        <tr>
          <td>${record.yearOffset}</td>
          <td>${record.age}</td>
          <td>${formatCurrency(record.startPortfolio)}</td>
          <td>${formatCurrency(record.contribution)}</td>
          <td>${formatCurrency(record.growth)}</td>
          <td>${formatCurrency(record.endPortfolio)}</td>
          <td>${formatPercent(record.progress * 100)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderCharts(plan) {
  renderGrowthChart(plan);
  renderComparisonChart(plan);
}

function renderGrowthChart(plan) {
  if (!plan.records.length) {
    el.growthChart.innerHTML = `<p class="chart-empty">Add inputs to see your projection.</p>`;
    return;
  }

  const width = 760;
  const height = 300;
  const padding = { top: 24, right: 24, bottom: 34, left: 66 };
  const maxY = Math.max(plan.fireTarget, ...plan.records.map((record) => record.endPortfolio), 1);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xScale = (index) => padding.left + (plotWidth * index) / Math.max(plan.records.length - 1, 1);
  const yScale = (value) => padding.top + plotHeight - (plotHeight * value) / maxY;
  const line = plan.records.map((record, index) => `${xScale(index)},${yScale(record.endPortfolio)}`).join(" ");
  const targetY = yScale(plan.fireTarget);
  const gridValues = [0, maxY / 2, maxY];
  const yearLabels = [0, Math.round(plan.records.length / 2), plan.records.length - 1];

  el.growthChart.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" aria-hidden="true">
      ${gridValues
        .map(
          (value) => `
            <line class="chart-grid-line" x1="${padding.left}" y1="${yScale(value)}" x2="${width - padding.right}" y2="${yScale(value)}"></line>
            <text class="chart-label" x="0" y="${yScale(value) + 4}">${escapeHtml(shortCurrency(value))}</text>
          `,
        )
        .join("")}
      <line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"></line>
      <line class="chart-axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"></line>
      <polyline class="chart-line" points="${line}"></polyline>
      <line class="chart-line-target" x1="${padding.left}" y1="${targetY}" x2="${width - padding.right}" y2="${targetY}"></line>
      ${yearLabels
        .map((index) => {
          const safeIndex = Math.max(0, Math.min(index, plan.records.length - 1));
          const record = plan.records[safeIndex];
          return `<text class="chart-label" x="${xScale(safeIndex)}" y="${height - 10}" text-anchor="middle">Age ${record.age}</text>`;
        })
        .join("")}
      <text class="chart-legend" x="${width - padding.right}" y="${targetY - 8}" text-anchor="end">FIRE target</text>
    </svg>
  `;
}

function renderComparisonChart(plan) {
  const assetPercent = plan.fireTarget === 0 ? 100 : clamp((plan.inputs.currentAssets / plan.fireTarget) * 100, 0, 100);
  const remainingPercent = plan.fireTarget === 0 ? 0 : Math.max(0, 100 - assetPercent);
  el.comparisonChart.innerHTML = `
    <div class="comparison-stack">
      <div class="comparison-bar">
        <div class="progress-row">
          <span>Current invested assets</span>
          <span>${formatCurrency(plan.inputs.currentAssets)}</span>
        </div>
        <div class="comparison-track">
          <div class="comparison-fill assets" style="width: ${assetPercent}%"></div>
        </div>
      </div>
      <div class="comparison-bar">
        <div class="progress-row">
          <span>Remaining gap</span>
          <span>${plan.fireTarget === 0 ? "$0" : formatCurrency(plan.remaining)}</span>
        </div>
        <div class="comparison-track">
          <div class="comparison-fill target" style="width: ${remainingPercent}%"></div>
        </div>
      </div>
      <p class="muted small-copy">Financial independence means your portfolio can support your spending. Spending changes the target just as much as investing changes the portfolio.</p>
    </div>
  `;
}

function renderScenarios(inputs) {
  const scenarios = buildScenarioInputs(inputs).map((scenario) => ({
    ...scenario,
    plan: calculateScenarioPlan(scenario.inputs),
  }));

  el.scenarioCards.innerHTML = scenarios
    .map((scenario) => {
      const yearsText = scenario.plan.yearsToFI === null ? "Not reached in model" : `${scenario.plan.yearsToFI} years`;
      const fireAgeText = scenario.plan.fireAge === null ? "Not reached" : `Age ${scenario.plan.fireAge}`;
      return `
        <article class="scenario-card">
          <span class="status-pill" data-status="${escapeHtml(scenario.tone)}">${escapeHtml(scenario.name)}</span>
          <span class="scenario-kpi">${escapeHtml(yearsText)}</span>
          <span class="muted small-copy">${escapeHtml(fireAgeText)}</span>
          <span class="muted small-copy">Portfolio at target age: ${escapeHtml(formatCurrency(scenario.plan.targetAgePortfolio))}</span>
        </article>
      `;
    })
    .join("");

  renderScenarioChart(scenarios, getProjectionYearsLimit(Math.max(...scenarios.map((scenario) => Math.max(0, Math.round(scenario.inputs.targetAge - scenario.inputs.currentAge))))));
}

function renderScenarioChart(scenarios, horizonYears) {
  const width = 760;
  const rowHeight = 48;
  const height = 44 + rowHeight * scenarios.length;
  const padding = { top: 18, right: 24, bottom: 12, left: 170 };
  const maxYears = Math.max(
    ...scenarios.map((scenario) => (scenario.plan.yearsToFI === null ? horizonYears : scenario.plan.yearsToFI)),
    1,
  );
  const usableWidth = width - padding.left - padding.right;

  el.scenarioChart.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" aria-hidden="true">
      ${scenarios
        .map((scenario, index) => {
          const years = scenario.plan.yearsToFI === null ? horizonYears : scenario.plan.yearsToFI;
          const y = padding.top + index * rowHeight;
          const barWidth = (usableWidth * years) / maxYears;
          const color =
            scenario.tone === "success"
              ? "#16a34a"
              : scenario.tone === "warning"
                ? "#ff8c42"
                : scenario.tone === "info"
                  ? "#0f6abf"
                  : "#94a3b8";
          return `
            <text class="bar-label" x="0" y="${y + 20}">${escapeHtml(scenario.name)}</text>
            <rect x="${padding.left}" y="${y}" width="${usableWidth}" height="18" rx="9" fill="#eef2f7"></rect>
            <rect x="${padding.left}" y="${y}" width="${barWidth}" height="18" rx="9" fill="${color}"></rect>
            <text class="bar-label" x="${padding.left + Math.min(barWidth + 8, usableWidth - 20)}" y="${y + 14}">
              ${escapeHtml(scenario.plan.yearsToFI === null ? "Model max" : `${scenario.plan.yearsToFI}y`)}
            </text>
          `;
        })
        .join("")}
    </svg>
  `;
}

function renderInsights(plan, inputs) {
  const cards = [
    {
      title: "Spending often moves the target fastest",
      body: `Your current FI target is ${formatCurrency(plan.fireTarget)}. Because the target is built from annual spending, every long-term dollar you can sustainably cut reduces the number you need to fund.`,
    },
    {
      title: "Savings rate matters more than income alone",
      body: inputs.salaryIncome > 0
        ? `With ${formatCurrency(inputs.salaryIncome)} of income and ${formatCurrency(inputs.annualSavings)} of yearly savings, your savings rate is ${formatPercent((inputs.annualSavings / inputs.salaryIncome) * 100)}. Higher savings rates usually improve both contributions and future spending flexibility.`
        : "Add salary in advanced settings if you want to see your savings rate. It is often more useful than income alone when comparing plans.",
    },
    {
      title: "Returns are useful, but uncertain",
      body: `This plan uses an estimated ${formatPercent(plan.effectiveReturn * 100)} ${inputs.returnMode === "real" ? "real" : "inflation-adjusted"} return. Real-life returns vary, so scenario testing matters more than trusting one exact output.`,
    },
    {
      title: "Early contributions keep compounding",
      body: `At age ${inputs.targetAge}, this plan projects about ${formatCurrency(plan.targetAgeRecord.endPortfolio)}. Consistent contributions in your early and middle years do a lot of the heavy lifting.`,
    },
    {
      title: "Inflation and taxes still matter",
      body: "This estimate simplifies taxes and uses a broad inflation assumption. Registered account withdrawals, capital gains, and benefit timing can materially change your usable retirement income.",
    },
    {
      title: "FIRE does not have to mean never working again",
      body: "Many people use financial independence to buy flexibility, part-time work, lower stress, or career freedom. Hitting FI can expand choices, not just trigger a hard stop on work.",
    },
  ];

  el.insightGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="subsection">
          <h3>${escapeHtml(card.title)}</h3>
          <p class="muted">${escapeHtml(card.body)}</p>
        </article>
      `,
    )
    .join("");
}

function syncSavingsRate(inputs) {
  if (inputs.salaryIncome > 0) {
    el.savingsRateNote.textContent = `Savings rate: ${formatPercent((inputs.annualSavings / inputs.salaryIncome) * 100)} based on ${formatCurrency(inputs.salaryIncome)} income.`;
    return;
  }
  el.savingsRateNote.textContent = "Savings rate will appear here when salary is entered.";
}

function syncSupportLinks() {
  [el.globalSupportBtn, el.resultsSupportLink, el.footerSupportLink, el.supportBannerLink, el.aboutSupportLink]
    .filter(Boolean)
    .forEach((link) => {
      link.href = APP.supportUrl;
    });
}

function syncMeta() {
  const title = "FIRE Calculator Canada | SimpleKit";
  const description =
    "Estimate your path to financial independence in Canada with a free FIRE calculator for Canadian planners. Test savings, spending, withdrawal rate, and timeline assumptions in your browser.";
  const hasHttpOrigin = /^https?:/i.test(window.location.protocol);
  const pageUrl = hasHttpOrigin ? window.location.href : "https://simplekit.app/fire-calculator/";
  const socialImage = hasHttpOrigin ? new URL("icons/icon.svg", window.location.href).href : "https://simplekit.app/social-preview.png";
  document.title = title;
  el.metaDescription?.setAttribute("content", description);
  el.metaThemeColor?.setAttribute("content", "#0f6abf");
  el.metaOgTitle?.setAttribute("content", title);
  el.metaOgDescription?.setAttribute("content", description);
  el.metaOgUrl?.setAttribute("content", pageUrl);
  el.metaOgImage?.setAttribute("content", socialImage);
  el.metaOgSiteName?.setAttribute("content", title);
  el.metaTwitterTitle?.setAttribute("content", title);
  el.metaTwitterDescription?.setAttribute("content", description);
  el.metaTwitterImage?.setAttribute("content", socialImage);
}

function stageMeta(progress, alreadyCovered) {
  if (alreadyCovered || progress >= 1) return { label: "Financially independent", status: "success" };
  if (progress >= 0.8) return { label: "Near FI", status: "success" };
  if (progress >= 0.5) return { label: "On track", status: "info" };
  if (progress >= 0.25) return { label: "Building momentum", status: "warning" };
  return { label: "Early stage", status: "neutral" };
}

function progressNarrative(plan) {
  if (plan.fireTarget === 0) {
    return "Your passive income already covers the spending entered here, so the required FIRE target is greatly reduced.";
  }
  if (plan.yearsToFI === 0) {
    return "You are already at or above your FIRE target under these assumptions.";
  }
  return `You are ${formatPercent(plan.progress * 100)} of the way to FI, with about ${formatCurrency(plan.remaining)} left to fund.`;
}

function resultSummary(plan) {
  if (plan.yearsToFI === null) {
    return "Current assumptions do not reach FI within the modeled range, but small changes in spending or saving can still move the timeline meaningfully.";
  }
  if (plan.yearsToFI === 0) {
    return "You appear financially independent already under this simplified estimate.";
  }
  return `Estimated FI in ${plan.yearsToFI} years, around age ${plan.estimatedFireAge}.`;
}

function edgeCaseMessage(plan) {
  if (plan.fireTarget === 0) {
    return "Because passive income matches or exceeds spending, the required self-funded portfolio is minimal in this estimate.";
  }
  if (plan.inputs.annualSavings <= 0 && plan.yearsToFI === null) {
    return "With zero annual contributions, this plan does not reach FI in the modeled range. Add savings or revise spending assumptions to test other paths.";
  }
  if (plan.inputs.withdrawalRate <= 0) {
    return "Withdrawal rate must stay above zero for a stable FIRE estimate.";
  }
  if (plan.effectiveReturn <= 0 && plan.yearsToFI === null) {
    return "Low or negative real returns make FI harder to reach. Test spending and savings changes to see what improves resilience.";
  }
  return "Use this as a planning tool, not personalized financial advice. Taxes, sequence risk, and account mix are not fully modeled.";
}

function getEffectiveReturn(expectedReturn, inflationRate, returnMode) {
  if (returnMode === "real") return expectedReturn;
  return (1 + expectedReturn) / (1 + inflationRate) - 1;
}

function getProjectionYearsLimit(yearsToTargetAge) {
  return Math.max(APP.maxProjectionYears, yearsToTargetAge + 5);
}

function markDirty(flag) {
  ui.dirty = Boolean(flag);
  el.globalSaveBtn?.classList.toggle("dirty", ui.dirty);
  if (el.globalSaveBtn) el.globalSaveBtn.textContent = ui.dirty ? "Save *" : "Save";
  if (el.saveAssumptionsBtn) el.saveAssumptionsBtn.textContent = ui.dirty ? "Save assumptions *" : "Save assumptions";
}

function openAboutModal() {
  if (!el.aboutModal) return;
  el.aboutModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeAboutModal() {
  if (!el.aboutModal) return;
  el.aboutModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function toast(message) {
  if (!el.appToast) return;
  if (ui.toastTimer) clearTimeout(ui.toastTimer);
  el.appToast.textContent = message;
  el.appToast.hidden = false;
  ui.toastTimer = window.setTimeout(() => {
    el.appToast.hidden = true;
    ui.toastTimer = null;
  }, 1800);
}

function track(name, params = {}) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

function sanitizeNumber(value, fallback) {
  const number = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function shortCurrency(value) {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${Math.round(value / 100000) / 10}M`;
  if (abs >= 1000) return `${Math.round(value / 100) / 10}k`;
  return `${Math.round(value)}`;
}

function formatPercent(value) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(value >= 10 || value <= -10 ? 0 : 1)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
