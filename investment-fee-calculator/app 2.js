const STORAGE_KEY = "simplekit.investmentFeeCalculator.v1";
const SUPPORT_URL = "https://buymeacoffee.com/ashleysnl";
const DEFAULT_INPUTS = {
  initialInvestment: 25000,
  monthlyContribution: 500,
  years: 30,
  annualReturn: 6.5,
  feeA: 0.25,
  feeB: 2.0,
  contributionGrowth: 0,
  inflationRate: 2,
  taxDrag: 0,
  accountType: "TFSA",
  futureLumpSum: 0,
  futureLumpSumYear: 10,
  compoundingFrequency: "monthly",
  valueMode: "nominal",
};

const SAMPLE_INPUTS = {
  initialInvestment: 40000,
  monthlyContribution: 750,
  years: 25,
  annualReturn: 6.0,
  feeA: 0.2,
  feeB: 1.85,
  contributionGrowth: 2,
  inflationRate: 2,
  taxDrag: 0,
  accountType: "RRSP",
  futureLumpSum: 10000,
  futureLumpSumYear: 12,
  compoundingFrequency: "monthly",
  valueMode: "nominal",
};

const SCENARIO_PRESETS = [
  {
    id: "preset_025_200",
    title: "0.25% vs 2.00%",
    note: "A common ETF-style vs mutual-fund-style comparison.",
    mutate(base) {
      return { ...base, feeA: 0.25, feeB: 2.0 };
    },
    actionLabel: "Apply fees",
  },
  {
    id: "preset_050_150",
    title: "0.50% vs 1.50%",
    note: "Useful for comparing low-cost managed portfolios.",
    mutate(base) {
      return { ...base, feeA: 0.5, feeB: 1.5 };
    },
    actionLabel: "Apply fees",
  },
  {
    id: "preset_100_250",
    title: "1.00% vs 2.50%",
    note: "Shows how a wider fee gap can compound over long periods.",
    mutate(base) {
      return { ...base, feeA: 1.0, feeB: 2.5 };
    },
    actionLabel: "Apply fees",
  },
  {
    id: "boost_monthly",
    title: "Add $100 per month",
    note: "See how savings rate can matter alongside fees.",
    mutate(base) {
      return { ...base, monthlyContribution: base.monthlyContribution + 100 };
    },
    actionLabel: "Apply scenario",
  },
  {
    id: "extend_timeline",
    title: "Extend timeline by 10 years",
    note: "Longer horizons make fee drag easier to spot.",
    mutate(base) {
      return { ...base, years: base.years + 10 };
    },
    actionLabel: "Apply scenario",
  },
  {
    id: "cut_fee_gap",
    title: "Reduce Portfolio B fee by 1%",
    note: "A quick way to estimate the value of a lower-fee option.",
    mutate(base) {
      return { ...base, feeB: Math.max(base.feeA, base.feeB - 1) };
    },
    actionLabel: "Apply scenario",
  },
  {
    id: "real_view",
    title: "Show inflation-adjusted values",
    note: "Switch from nominal dollars to a more conservative real-dollar view.",
    mutate(base) {
      return { ...base, valueMode: "real" };
    },
    actionLabel: "Use real dollars",
  },
  {
    id: "custom",
    title: "Current custom comparison",
    note: "This card reflects the exact inputs you currently have on screen.",
    mutate(base) {
      return { ...base };
    },
    actionLabel: "Already applied",
    disabled: true,
  },
];

const ACCOUNT_NOTES = {
  TFSA: "TFSA growth can be tax-sheltered, but product fees still reduce what stays invested.",
  RRSP: "RRSPs may defer tax, but higher MERs can still reduce long-term wealth inside the account.",
  Taxable: "Taxable accounts may face both investment fees and extra tax drag, so net return can fall faster.",
  General: "General account view keeps the comparison simple while still showing how fees change what you keep.",
};

const FREQUENCY_MAP = {
  monthly: 12,
  quarterly: 4,
  annually: 1,
  daily: 365,
};

const el = {
  form: document.getElementById("calculatorForm"),
  advancedSettings: document.getElementById("advancedSettings"),
  loadSampleBtn: document.getElementById("loadSampleBtn"),
  loadSampleBtnHero: document.getElementById("loadSampleBtnHero"),
  resetBtn: document.getElementById("resetBtn"),
  summaryGrid: document.getElementById("summaryGrid"),
  takeawayHeadline: document.getElementById("takeawayHeadline"),
  takeawayBody: document.getElementById("takeawayBody"),
  interpretationNote: document.getElementById("interpretationNote"),
  comparisonGrid: document.getElementById("comparisonGrid"),
  growthChart: document.getElementById("growthChart"),
  endingBarChart: document.getElementById("endingBarChart"),
  gapChart: document.getElementById("gapChart"),
  milestoneBarChart: document.getElementById("milestoneBarChart"),
  milestonesGrid: document.getElementById("milestonesGrid"),
  scenarioGrid: document.getElementById("scenarioGrid"),
  heroSupportLink: document.getElementById("heroSupportLink"),
  footerSupportLink: document.getElementById("footerSupportLink"),
  globalSupportBtn: document.getElementById("globalSupportBtn"),
  supportCta: document.getElementById("supportCta"),
  appToast: document.getElementById("appToast"),
};

const inputRefs = Object.fromEntries(
  Object.keys(DEFAULT_INPUTS).map((key) => [key, document.querySelector(`[data-field="${key}"]`)]),
);

let state = loadInputs();
let toastTimer = null;
let currentResults = null;

init();

function init() {
  populateForm(state);
  bindEvents();
  syncSupportLinks();
  render();
}

function bindEvents() {
  Object.entries(inputRefs).forEach(([key, node]) => {
    if (!node) return;
    node.addEventListener("input", () => handleFieldChange(key, node.value));
    node.addEventListener("change", () => handleFieldChange(key, node.value));
    node.addEventListener("blur", () => {
      node.value = String(state[key]);
    });
  });

  el.loadSampleBtn?.addEventListener("click", () => {
    state = { ...SAMPLE_INPUTS };
    populateForm(state);
    persistInputs();
    render();
    toast("Sample data loaded");
    track("load_sample_data");
  });

  el.loadSampleBtnHero?.addEventListener("click", () => {
    state = { ...SAMPLE_INPUTS };
    populateForm(state);
    persistInputs();
    render();
    toast("Sample data loaded");
    track("load_sample_data", { placement: "hero" });
  });

  el.resetBtn?.addEventListener("click", () => {
    state = { ...DEFAULT_INPUTS };
    populateForm(state);
    persistInputs();
    render();
    toast("Defaults restored");
    track("reset_calculator");
  });

  el.advancedSettings?.addEventListener("toggle", () => {
    if (el.advancedSettings.open) track("open_advanced_settings");
  });

  document.addEventListener("click", (event) => {
    const scenarioBtn = event.target.closest("[data-apply-scenario]");
    if (scenarioBtn) {
      applyScenario(String(scenarioBtn.getAttribute("data-apply-scenario") || ""));
      return;
    }

    const trackedLink = event.target.closest("[data-track-link]");
    if (trackedLink) {
      track("related_tool_click", { tool: trackedLink.getAttribute("data-track-link") || "unknown" });
      return;
    }

    if (event.target.closest("#supportCta")) track("support_cta_click", { placement: "section" });
    if (event.target.closest("#heroSupportLink")) track("support_cta_click", { placement: "hero" });
    if (event.target.closest("#footerSupportLink")) track("support_cta_click", { placement: "footer" });
    if (event.target.closest("#globalSupportBtn")) track("support_cta_click", { placement: "floating" });
  });
}

function handleFieldChange(key, rawValue) {
  state[key] = normalizeField(key, rawValue);
  if (key === "years") {
    state.futureLumpSumYear = clamp(state.futureLumpSumYear, 1, state.years);
    if (inputRefs.futureLumpSumYear) inputRefs.futureLumpSumYear.value = String(state.futureLumpSumYear);
  }
  if (key === "futureLumpSumYear" && inputRefs.futureLumpSumYear) {
    inputRefs.futureLumpSumYear.value = String(state.futureLumpSumYear);
  }
  persistInputs();
  render();
  track("calculator_interaction", { field: key });
}

function normalizeField(key, rawValue) {
  if (key === "accountType" || key === "compoundingFrequency" || key === "valueMode") {
    return String(rawValue || DEFAULT_INPUTS[key]);
  }

  const fallback = DEFAULT_INPUTS[key];
  const value = Number.parseFloat(String(rawValue || "").replace(/,/g, ""));
  if (!Number.isFinite(value)) return fallback;

  if (key === "years") return clamp(Math.round(value), 1, 80);
  if (key === "futureLumpSumYear") return clamp(Math.round(value), 1, state.years || DEFAULT_INPUTS.years);
  if (key === "annualReturn") return clamp(value, -20, 20);
  if (key === "feeA" || key === "feeB" || key === "taxDrag") return clamp(value, 0, 10);
  if (key === "contributionGrowth" || key === "inflationRate") return clamp(value, 0, 10);
  if (key === "initialInvestment" || key === "monthlyContribution" || key === "futureLumpSum") {
    return clamp(value, 0, 100000000);
  }

  return value;
}

function populateForm(values) {
  Object.entries(inputRefs).forEach(([key, node]) => {
    if (!node) return;
    if (node.tagName === "SELECT") {
      node.value = String(values[key]);
      return;
    }
    node.value = String(values[key]);
  });
}

function render() {
  currentResults = calculateComparison(state);
  renderSummary(currentResults);
  renderComparison(currentResults);
  renderCharts(currentResults);
  renderMilestones(currentResults);
  renderScenarios(currentResults);
}

function calculateComparison(inputs) {
  const settings = normalizeInputs(inputs);
  const portfolioA = projectPortfolio(settings, settings.feeA);
  const portfolioB = projectPortfolio(settings, settings.feeB);
  const grossPortfolio = projectPortfolio(settings, 0);
  const displayKey = settings.valueMode === "real" ? "realValue" : "value";
  const endingA = portfolioA.final[displayKey];
  const endingB = portfolioB.final[displayKey];
  const diff = endingA - endingB;
  const diffPct = endingB > 0 ? (diff / endingB) * 100 : 0;
  const contributionsDisplay = portfolioA.final.totalContributions;
  const contributionBaseKey = settings.valueMode === "real"
    ? "totalContributionsAdjusted"
    : "totalContributions";
  const growthA = endingA - portfolioA.final[contributionBaseKey];
  const growthB = endingB - portfolioB.final[contributionBaseKey];
  const feeDragVsGrossA = grossPortfolio.final[displayKey] - endingA;
  const feeDragVsGrossB = grossPortfolio.final[displayKey] - endingB;
  const milestones = buildMilestones(settings, portfolioA, portfolioB, displayKey);
  const feeOrdering = describeFeeOrdering(settings.feeA, settings.feeB);

  return {
    settings,
    displayKey,
    endingA,
    endingB,
    diff,
    diffPct,
    contributionsDisplay,
    growthA,
    growthB,
    feeDragVsGrossA,
    feeDragVsGrossB,
    portfolioA,
    portfolioB,
    grossPortfolio,
    milestones,
    feeOrdering,
  };
}

function normalizeInputs(values) {
  return {
    initialInvestment: clamp(Number(values.initialInvestment) || 0, 0, 100000000),
    monthlyContribution: clamp(Number(values.monthlyContribution) || 0, 0, 100000000),
    years: clamp(Math.round(Number(values.years) || DEFAULT_INPUTS.years), 1, 80),
    annualReturn: clamp(Number(values.annualReturn) || 0, -20, 20),
    feeA: clamp(Number(values.feeA) || 0, 0, 10),
    feeB: clamp(Number(values.feeB) || 0, 0, 10),
    contributionGrowth: clamp(Number(values.contributionGrowth) || 0, 0, 10),
    inflationRate: clamp(Number(values.inflationRate) || 0, 0, 10),
    taxDrag: clamp(Number(values.taxDrag) || 0, 0, 10),
    accountType: ACCOUNT_NOTES[String(values.accountType)] ? String(values.accountType) : DEFAULT_INPUTS.accountType,
    futureLumpSum: clamp(Number(values.futureLumpSum) || 0, 0, 100000000),
    futureLumpSumYear: clamp(Math.round(Number(values.futureLumpSumYear) || 1), 1, clamp(Math.round(Number(values.years) || DEFAULT_INPUTS.years), 1, 80)),
    compoundingFrequency: FREQUENCY_MAP[String(values.compoundingFrequency)]
      ? String(values.compoundingFrequency)
      : DEFAULT_INPUTS.compoundingFrequency,
    valueMode: String(values.valueMode) === "real" ? "real" : "nominal",
  };
}

function projectPortfolio(settings, annualFeePct) {
  const months = settings.years * 12;
  const lumpMonth = Math.min(months, settings.futureLumpSumYear * 12);
  const inflationAnnual = settings.inflationRate / 100;
  const inflationMonthly = Math.pow(1 + inflationAnnual, 1 / 12) - 1;
  const grossEffectiveAnnual = nominalAnnualToEffective(settings.annualReturn / 100, settings.compoundingFrequency);
  const netAnnualRate = Math.max(grossEffectiveAnnual - annualFeePct / 100 - settings.taxDrag / 100, -0.999);
  const monthlyRate = Math.pow(1 + netAnnualRate, 1 / 12) - 1;

  let balance = settings.initialInvestment;
  let totalContributions = settings.initialInvestment;
  let nominalContributionForMonth = settings.monthlyContribution;
  const yearly = [{ year: 0, value: balance, realValue: balance, gap: 0 }];

  for (let month = 1; month <= months; month += 1) {
    if (month > 1 && (month - 1) % 12 === 0) {
      nominalContributionForMonth *= 1 + settings.contributionGrowth / 100;
    }

    balance += nominalContributionForMonth;
    totalContributions += nominalContributionForMonth;

    if (settings.futureLumpSum > 0 && month === lumpMonth) {
      balance += settings.futureLumpSum;
      totalContributions += settings.futureLumpSum;
    }

    balance *= 1 + monthlyRate;

    if (month % 12 === 0 || month === months) {
      const yearsElapsed = month / 12;
      const inflationFactor = Math.pow(1 + inflationAnnual, yearsElapsed);
      yearly.push({
        year: yearsElapsed,
        value: balance,
        realValue: inflationFactor ? balance / inflationFactor : balance,
        totalContributions,
        totalContributionsAdjusted: inflationFactor ? totalContributions / inflationFactor : totalContributions,
      });
    }
  }

  const finalYears = months / 12;
  const finalInflationFactor = Math.pow(1 + inflationMonthly, months);
  return {
    annualFeePct,
    netAnnualRate,
    yearly,
    final: {
      value: balance,
      realValue: finalInflationFactor ? balance / finalInflationFactor : balance,
      totalContributions,
      totalContributionsAdjusted: finalInflationFactor ? totalContributions / finalInflationFactor : totalContributions,
      years: finalYears,
    },
  };
}

function buildMilestones(settings, portfolioA, portfolioB, displayKey) {
  const requested = new Set([10, 20, 30, settings.years]);
  return [...requested]
    .filter((year) => year > 0 && year <= settings.years)
    .sort((a, b) => a - b)
    .map((year) => {
      const a = findYear(portfolioA.yearly, year);
      const b = findYear(portfolioB.yearly, year);
      return {
        year,
        valueA: a?.[displayKey] || 0,
        valueB: b?.[displayKey] || 0,
        diff: (a?.[displayKey] || 0) - (b?.[displayKey] || 0),
      };
    });
}

function renderSummary(results) {
  const lead = buildLead(results);
  const body = [
    `Portfolio A uses a ${formatPercent(results.settings.feeA)} fee and Portfolio B uses ${formatPercent(results.settings.feeB)}.`,
    ACCOUNT_NOTES[results.settings.accountType],
    results.displayKey === "real"
      ? "You are viewing inflation-adjusted dollars."
      : "You are viewing nominal dollars.",
  ].join(" ");
  const gapLabel = results.settings.feeA === results.settings.feeB
    ? "Ending-wealth gap from these fee inputs"
    : `Estimated gap caused by ${results.feeOrdering.higherLabel}`;

  el.takeawayHeadline.textContent = lead;
  el.takeawayBody.textContent = body;
  el.interpretationNote.textContent = `Fees do not guarantee performance, but they affect how much of the return you keep. ${ACCOUNT_NOTES[results.settings.accountType]}`;

  const cards = [
    {
      label: "Portfolio A ending value",
      value: formatCurrency(results.endingA),
      sub: `${results.feeOrdering.aLabel} at ${formatPercent(results.settings.feeA)}`,
    },
    {
      label: "Portfolio B ending value",
      value: formatCurrency(results.endingB),
      sub: `${results.feeOrdering.bLabel} at ${formatPercent(results.settings.feeB)}`,
    },
    {
      label: "Difference in ending wealth",
      value: formatCurrency(results.diff),
      sub: `${formatSignedPercent(results.diffPct)} relative gap`,
    },
    {
      label: "Total contributions",
      value: formatCurrency(results.contributionsDisplay),
      sub: "Initial, monthly, and future lump sum contributions",
    },
    {
      label: "Growth retained by Portfolio A",
      value: formatCurrency(results.growthA),
      sub: "Ending value minus contributions",
    },
    {
      label: "Growth retained by Portfolio B",
      value: formatCurrency(results.growthB),
      sub: "Ending value minus contributions",
    },
    {
      label: "Fee drag vs no-fee case for A",
      value: formatCurrency(results.feeDragVsGrossA),
      sub: "Simplified comparison against the same gross-return path",
    },
    {
      label: gapLabel,
      value: formatCurrency(Math.abs(results.diff)),
      sub: "Shown as the ending-wealth gap, not a simple fee sum",
    },
  ];

  el.summaryGrid.innerHTML = cards.map(metricCardHtml).join("");
}

function renderComparison(results) {
  const cards = [
    {
      title: `Portfolio A — ${results.feeOrdering.aTitle}`,
      className: "is-a",
      fee: results.settings.feeA,
      ending: results.endingA,
      contributions: results.contributionsDisplay,
      growth: results.growthA,
      drag: results.feeDragVsGrossA,
      note: results.feeOrdering.feesEqual
        ? "These portfolios use the same fee input, so any difference shown comes from other assumptions."
        : results.settings.feeA <= results.settings.feeB
          ? "A lower-fee option does not guarantee better performance, but it keeps more of the gross return if all else is equal."
          : "This portfolio currently has the higher fee input, so it may keep less of the gross return if all else is equal.",
    },
    {
      title: `Portfolio B — ${results.feeOrdering.bTitle}`,
      className: "is-b",
      fee: results.settings.feeB,
      ending: results.endingB,
      contributions: results.contributionsDisplay,
      growth: results.growthB,
      drag: results.feeDragVsGrossB,
      note: results.feeOrdering.feesEqual
        ? "These portfolios use the same fee input, so any difference shown comes from other assumptions."
        : results.settings.feeB >= results.settings.feeA
          ? "Higher ongoing fees can create a larger gap as the timeline and balance grow."
          : "This portfolio currently has the lower fee input, which can help it keep more of the gross return if all else is equal.",
    },
  ];

  el.comparisonGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="subsection comparison-card ${escapeHtml(card.className)}">
          <div>
            <span class="mini-label">${escapeHtml(card.title)}</span>
            <h3>${formatPercent(card.fee)} fee</h3>
          </div>
          <div class="comparison-stat-grid">
            ${comparisonStatHtml("Ending portfolio value", formatCurrency(card.ending))}
            ${comparisonStatHtml("Total contributions", formatCurrency(card.contributions))}
            ${comparisonStatHtml("Estimated growth after fees", formatCurrency(card.growth))}
            ${comparisonStatHtml("Fee drag vs no-fee case", formatCurrency(card.drag))}
          </div>
          <p class="comparison-footnote">${escapeHtml(card.note)}</p>
        </article>
      `,
    )
    .join("");
}

function renderCharts(results) {
  const pointsA = results.portfolioA.yearly.map((entry) => ({ x: entry.year, y: entry[results.displayKey] }));
  const pointsB = results.portfolioB.yearly.map((entry) => ({ x: entry.year, y: entry[results.displayKey] }));
  const gapPoints = results.portfolioA.yearly.map((entry, index) => ({
    x: entry.year,
    y: entry[results.displayKey] - (results.portfolioB.yearly[index]?.[results.displayKey] || 0),
  }));
  el.growthChart.innerHTML = renderLineChartSvg({
    datasets: [
      { label: "Portfolio A", color: "#0f6abf", points: pointsA },
      { label: "Portfolio B", color: "#ff8c42", points: pointsB },
    ],
    valueFormatter: formatCurrencyShort,
  });

  const maxEnding = Math.max(results.endingA, results.endingB, 1);
  el.endingBarChart.innerHTML = `
    ${barRowHtml("Portfolio A", results.endingA, maxEnding, "a")}
    ${barRowHtml("Portfolio B", results.endingB, maxEnding, "b")}
  `;

  el.gapChart.innerHTML = renderLineChartSvg({
    datasets: [
      { label: "Ending wealth gap", color: "#0ea5a8", points: gapPoints },
    ],
    valueFormatter: formatCurrencyShort,
    allowNegative: true,
  });

  const maxGap = Math.max(...results.milestones.map((entry) => Math.abs(entry.diff)), 1);
  el.milestoneBarChart.innerHTML = results.milestones
    .map(
      (entry) => `
        <div class="milestone-bar-row">
          <span class="mini-label">Year ${entry.year}</span>
          <div class="milestone-bar-track">
            <div class="milestone-bar-fill" style="width:${toPercentWidth(Math.abs(entry.diff), maxGap)}%"></div>
          </div>
          <strong class="big-number">${formatCurrency(entry.diff)} ${entry.diff >= 0 ? "A lead" : "B lead"}</strong>
        </div>
      `,
    )
    .join("");
}

function renderMilestones(results) {
  el.milestonesGrid.innerHTML = results.milestones
    .map(
      (milestone) => `
        <article class="milestone-card">
          <h3>Year ${milestone.year}</h3>
          <span class="mini-label">Portfolio A</span>
          <strong class="big-number">${formatCurrency(milestone.valueA)}</strong>
          <span class="mini-label">Portfolio B</span>
          <strong class="big-number">${formatCurrency(milestone.valueB)}</strong>
          <p class="milestone-difference">Difference: ${formatCurrency(milestone.diff)}</p>
        </article>
      `,
    )
    .join("");
}

function renderScenarios(results) {
  el.scenarioGrid.innerHTML = SCENARIO_PRESETS.map((scenario) => {
    const nextInputs = scenario.mutate(results.settings);
    const comparison = calculateComparison(nextInputs);
    const deltaFromCurrent = comparison.diff - results.diff;
    const buttonDisabled = scenario.disabled ? "disabled" : "";
    return `
      <article class="subsection scenario-card">
        <div>
          <span class="mini-label">${escapeHtml(scenario.title)}</span>
          <h3>${escapeHtml(buildScenarioHeadline(comparison))}</h3>
          <p>${escapeHtml(scenario.note)}</p>
        </div>
        <div class="scenario-stat-grid">
          ${comparisonStatHtml("Portfolio A ending value", formatCurrency(comparison.endingA))}
          ${comparisonStatHtml("Portfolio B ending value", formatCurrency(comparison.endingB))}
          ${comparisonStatHtml("Difference vs current setup", formatCurrency(deltaFromCurrent))}
          ${comparisonStatHtml("View mode", comparison.settings.valueMode === "real" ? "Inflation-adjusted" : "Nominal")}
        </div>
        <button class="btn ${scenario.disabled ? "reset-light" : "btn-primary"}" type="button" data-apply-scenario="${escapeHtml(scenario.id)}" ${buttonDisabled}>
          ${escapeHtml(scenario.actionLabel)}
        </button>
      </article>
    `;
  }).join("");
}

function applyScenario(id) {
  const scenario = SCENARIO_PRESETS.find((entry) => entry.id === id);
  if (!scenario || scenario.disabled) return;
  state = normalizeInputs(scenario.mutate(state));
  populateForm(state);
  persistInputs();
  render();
  toast(`${scenario.title} applied`);
  track("apply_scenario", { scenario: id });
}

function renderLineChartSvg({ datasets, valueFormatter, allowNegative = false }) {
  const width = 640;
  const height = 280;
  const padding = { top: 18, right: 22, bottom: 32, left: 18 };
  const xMax = Math.max(...datasets.flatMap((set) => set.points.map((point) => point.x)), 1);
  const rawValues = datasets.flatMap((set) => set.points.map((point) => point.y));
  const yMin = allowNegative ? Math.min(...rawValues, 0) : 0;
  const yMax = Math.max(...rawValues, 1);
  const yRange = Math.max(yMax - yMin, 1);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const gridLines = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    const y = padding.top + innerHeight - innerHeight * ratio;
    const label = valueFormatter(yMin + yRange * ratio);
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e8edf5" stroke-width="1" />
      <text x="${width - padding.right}" y="${y - 6}" text-anchor="end" fill="#6b7280" font-size="11">${escapeHtml(label)}</text>
    `;
  }).join("");

  const paths = datasets.map((set) => {
    const path = set.points.map((point, index) => {
      const x = padding.left + (point.x / xMax) * innerWidth;
      const y = padding.top + innerHeight - ((point.y - yMin) / yRange) * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");
    const last = set.points[set.points.length - 1];
    const lx = padding.left + (last.x / xMax) * innerWidth;
    const ly = padding.top + innerHeight - ((last.y - yMin) / yRange) * innerHeight;
    return `
      <path d="${path}" fill="none" stroke="${set.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
      <circle cx="${lx}" cy="${ly}" r="4" fill="${set.color}"></circle>
      <text x="${Math.min(lx + 8, width - 78)}" y="${Math.max(ly - 8, 16)}" fill="${set.color}" font-size="12" font-weight="700">${escapeHtml(set.label)}</text>
    `;
  }).join("");

  const zeroLineY = padding.top + innerHeight - ((0 - yMin) / yRange) * innerHeight;
  const zeroLine = allowNegative && yMin < 0 && yMax > 0
    ? `<line x1="${padding.left}" y1="${zeroLineY}" x2="${width - padding.right}" y2="${zeroLineY}" stroke="#cfd9e8" stroke-width="1.5" stroke-dasharray="4 4" />`
    : "";

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true">
      ${gridLines}
      ${zeroLine}
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#cfd9e8" stroke-width="1.5" />
      <text x="${padding.left}" y="${height - 8}" fill="#6b7280" font-size="11">Start</text>
      <text x="${width - padding.right}" y="${height - 8}" text-anchor="end" fill="#6b7280" font-size="11">Year ${xMax}</text>
      ${paths}
    </svg>
  `;
}

function metricCardHtml(card) {
  return `
    <article class="metric-card">
      <span class="label">${escapeHtml(card.label)}</span>
      <span class="value">${escapeHtml(card.value)}</span>
      <span class="sub">${escapeHtml(card.sub)}</span>
    </article>
  `;
}

function comparisonStatHtml(label, value) {
  return `
    <div class="comparison-stat">
      <span class="mini-label">${escapeHtml(label)}</span>
      <strong class="big-number">${escapeHtml(value)}</strong>
    </div>
  `;
}

function barRowHtml(label, value, max, className) {
  return `
    <div class="bar-row">
      <div class="bar-row-head">
        <span>${escapeHtml(label)}</span>
        <strong>${formatCurrency(value)}</strong>
      </div>
      <div class="bar-track">
        <div class="bar-fill ${escapeHtml(className)}" style="width:${toPercentWidth(value, max)}%"></div>
      </div>
    </div>
  `;
}

function syncSupportLinks() {
  [el.heroSupportLink, el.footerSupportLink, el.globalSupportBtn, el.supportCta]
    .filter(Boolean)
    .forEach((link) => {
      link.href = SUPPORT_URL;
    });
}

function buildLead(results) {
  if (Math.abs(results.diff) < 1) {
    return "These fee assumptions finish nearly the same.";
  }

  if (results.diff > 0) {
    return `Portfolio A ends ahead by an estimated ${formatCurrency(results.diff)}.`;
  }

  return `Portfolio B ends ahead by an estimated ${formatCurrency(Math.abs(results.diff))}.`;
}

function buildScenarioHeadline(results) {
  if (Math.abs(results.diff) < 1) {
    return "The two portfolios finish nearly the same.";
  }

  if (results.diff > 0) {
    return `${formatCurrency(results.diff)} gap in favour of Portfolio A`;
  }

  return `${formatCurrency(Math.abs(results.diff))} gap in favour of Portfolio B`;
}

function persistInputs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast("Local save unavailable in this browser");
  }
}

function describeFeeOrdering(feeA, feeB) {
  if (feeA === feeB) {
    return {
      feesEqual: true,
      aTitle: "Same Fee",
      bTitle: "Same Fee",
      aLabel: "Same-fee option",
      bLabel: "Same-fee option",
      higherLabel: "these fee inputs",
    };
  }

  if (feeA < feeB) {
    return {
      feesEqual: false,
      aTitle: "Lower Fee",
      bTitle: "Higher Fee",
      aLabel: "Lower-fee option",
      bLabel: "Higher-fee option",
      higherLabel: "the higher-fee option",
    };
  }

  return {
    feesEqual: false,
    aTitle: "Higher Fee",
    bTitle: "Lower Fee",
    aLabel: "Higher-fee option",
    bLabel: "Lower-fee option",
    higherLabel: "the higher-fee option",
  };
}

function loadInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_INPUTS };
    return normalizeInputs({ ...DEFAULT_INPUTS, ...JSON.parse(raw) });
  } catch {
    return { ...DEFAULT_INPUTS };
  }
}

function track(eventName, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
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

function nominalAnnualToEffective(rate, frequencyKey) {
  const periods = FREQUENCY_MAP[frequencyKey] || 12;
  if (periods === 1) return rate;
  if (rate <= -1) return -0.999;
  return Math.pow(1 + rate / periods, periods) - 1;
}

function findYear(rows, year) {
  return rows.find((entry) => Math.round(entry.year) === year) || rows[rows.length - 1];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toPercentWidth(value, max) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return clamp((value / max) * 100, 0, 100);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCurrencyShort(value) {
  const abs = Math.abs(value || 0);
  if (abs >= 1000000) return `${formatSignedNumber(value / 1000000)}M`;
  if (abs >= 1000) return `${formatSignedNumber(value / 1000)}k`;
  return formatCurrency(value);
}

function formatSignedNumber(value) {
  return `${value < 0 ? "-" : ""}${Math.abs(value).toFixed(1)}`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatSignedPercent(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${Number(value || 0).toFixed(1)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
