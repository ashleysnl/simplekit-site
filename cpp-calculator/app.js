const TEMPLATE = {
  storageKey: "simplekit.cppTimingCalculator.v1",
  appName: "CPP Timing Calculator Canada: Compare CPP at 60, 65, and 70",
  seoDescription:
    "Compare taking CPP at 60, 65, or 70, estimate break-even age, and understand how delaying CPP may affect lifetime retirement income.",
  siteUrl: "https://simplekit.app/cpp-calculator/",
  socialImageUrl: "https://simplekit.app/og-image.png",
  supportUrl: "https://buymeacoffee.com/ashleysnl",
  retirementPlannerUrl: "https://simplekit.app/retirement-planner/",
  chartColors: {
    60: "#ff8c42",
    65: "#0f6abf",
    70: "#0ea5a8",
  },
};

const CPP_RULES = {
  referenceAge: 65,
  ages: [60, 65, 70],
  earlyReductionPerMonth: 0.006,
  delayedIncreasePerMonth: 0.007,
  maxProjectionAge: 105,
};

const DEFAULT_INPUTS = {
  monthlyAt65: 900,
  lifeExpectancy: 90,
  annualReturn: 4,
  inflationRate: 2,
  comparisonAgeOne: 75,
  comparisonAgeTwo: 85,
};

const EXAMPLE_INPUTS = {
  monthlyAt65: 1200,
  lifeExpectancy: 90,
  annualReturn: 3,
  inflationRate: 2,
  comparisonAgeOne: 78,
  comparisonAgeTwo: 88,
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
  calculatorForm: document.getElementById("calculatorForm"),

  monthlyAt65: document.getElementById("monthlyAt65"),
  lifeExpectancy: document.getElementById("lifeExpectancy"),
  annualReturn: document.getElementById("annualReturn"),
  inflationRate: document.getElementById("inflationRate"),
  comparisonAgeOne: document.getElementById("comparisonAgeOne"),
  comparisonAgeTwo: document.getElementById("comparisonAgeTwo"),
  tryExampleBtn: document.getElementById("tryExampleBtn"),
  resetDefaultsBtn: document.getElementById("resetDefaultsBtn"),
  validationNote: document.getElementById("validationNote"),

  fastAnswerTitle: document.getElementById("fastAnswerTitle"),
  fastAnswerBody: document.getElementById("fastAnswerBody"),
  fastAnswerWhy: document.getElementById("fastAnswerWhy"),
  fastAnswerCaution: document.getElementById("fastAnswerCaution"),
  decisionSummaryGrid: document.getElementById("decisionSummaryGrid"),
  primaryBreakEvenValue: document.getElementById("primaryBreakEvenValue"),
  primaryBreakEvenCopy: document.getElementById("primaryBreakEvenCopy"),
  supportMicrocopy: document.getElementById("supportMicrocopy"),
  comparisonGrid: document.getElementById("comparisonGrid"),
  chartHelper: document.getElementById("chartHelper"),
  chartLegend: document.getElementById("chartLegend"),
  chartContainer: document.getElementById("chartContainer"),
  chartCaption: document.getElementById("chartCaption"),
  insightGrid: document.getElementById("insightGrid"),
  breakEvenGrid: document.getElementById("breakEvenGrid"),
  appToast: document.getElementById("appToast"),

  plannerResultsLink: document.getElementById("plannerResultsLink"),
  footerPlannerLink: document.getElementById("footerPlannerLink"),
  supportMicroLink: document.getElementById("supportMicroLink"),
  supportLink: document.getElementById("supportLink"),
  footerSupportLink: document.getElementById("footerSupportLink"),
};

let state = loadInputs();
let toastTimer = null;

init();

function init() {
  syncHeadMeta();
  syncStaticLinks();
  populateForm();
  renderValidationNote();
  bindEvents();
  render();
}

function bindEvents() {
  el.calculatorForm?.addEventListener("submit", handleCompareSubmit);

  [el.monthlyAt65, el.lifeExpectancy, el.annualReturn, el.inflationRate, el.comparisonAgeOne, el.comparisonAgeTwo]
    .forEach((input) => {
      input?.addEventListener("input", handleLiveInput);
      input?.addEventListener("change", handleLiveInput);
    });

  el.tryExampleBtn?.addEventListener("click", () => {
    state = normalizeInputs(EXAMPLE_INPUTS);
    persistInputs();
    populateForm();
    render();
    scrollToSection("resultsPanel");
    toast("Example scenario loaded");
  });

  el.resetDefaultsBtn?.addEventListener("click", () => {
    state = normalizeInputs(DEFAULT_INPUTS);
    persistInputs();
    populateForm();
    render();
    toast("Defaults restored");
  });

  el.jumpToCalculatorBtn?.addEventListener("click", () => scrollToSection("calculatorPanel"));
}

function handleCompareSubmit(event) {
  event.preventDefault();
  syncStateFromForm();
  renderValidationNote();
  render();
  scrollToSection("resultsPanel");
  toast("Results updated");
}

function handleLiveInput() {
  syncStateFromForm();
  renderValidationNote();
  render();
}

function syncStateFromForm() {
  state = normalizeInputs({
    monthlyAt65: el.monthlyAt65.value,
    lifeExpectancy: el.lifeExpectancy.value,
    annualReturn: el.annualReturn.value,
    inflationRate: el.inflationRate.value,
    comparisonAgeOne: el.comparisonAgeOne.value,
    comparisonAgeTwo: el.comparisonAgeTwo.value,
  });
  persistInputs();
}

function loadInputs() {
  try {
    const raw = localStorage.getItem(TEMPLATE.storageKey);
    if (!raw) return normalizeInputs(DEFAULT_INPUTS);
    return normalizeInputs(JSON.parse(raw));
  } catch {
    return normalizeInputs(DEFAULT_INPUTS);
  }
}

function persistInputs() {
  localStorage.setItem(TEMPLATE.storageKey, JSON.stringify(state));
}

function normalizeInputs(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    monthlyAt65: clamp(toNumber(source.monthlyAt65, DEFAULT_INPUTS.monthlyAt65), 0, 5000),
    lifeExpectancy: clamp(toNumber(source.lifeExpectancy, DEFAULT_INPUTS.lifeExpectancy), 60, 105),
    annualReturn: clamp(toNumber(source.annualReturn, DEFAULT_INPUTS.annualReturn), 0, 12),
    inflationRate: clamp(toNumber(source.inflationRate, DEFAULT_INPUTS.inflationRate), 0, 8),
    comparisonAgeOne: clamp(toNumber(source.comparisonAgeOne, DEFAULT_INPUTS.comparisonAgeOne), 60, 105),
    comparisonAgeTwo: clamp(toNumber(source.comparisonAgeTwo, DEFAULT_INPUTS.comparisonAgeTwo), 60, 105),
  };
}

function populateForm() {
  el.monthlyAt65.value = String(state.monthlyAt65);
  el.lifeExpectancy.value = String(state.lifeExpectancy);
  el.annualReturn.value = String(state.annualReturn);
  el.inflationRate.value = String(state.inflationRate);
  el.comparisonAgeOne.value = String(state.comparisonAgeOne);
  el.comparisonAgeTwo.value = String(state.comparisonAgeTwo);
}

function render() {
  const model = calculateModel(state);
  renderFastAnswer(model);
  renderDecisionSummary(model);
  renderComparisonCards(model);
  renderChart(model);
  renderInsights(model);
  renderBreakEvenCards(model);
}

function calculateModel(inputs) {
  const comparisonAges = Array.from(
    new Set(
      [inputs.comparisonAgeOne, inputs.comparisonAgeTwo, inputs.lifeExpectancy]
        .map((age) => clamp(Math.round(age), 60, 105))
        .sort((a, b) => a - b),
    ),
  );
  const monthlyDiscountRate = Math.pow(1 + inputs.annualReturn / 100, 1 / 12) - 1;

  const scenarios = CPP_RULES.ages.map((age) => {
    const monthlyPayment = getAdjustedMonthly(inputs.monthlyAt65, age);
    const annualPayment = monthlyPayment * 12;
    const timeline = buildTimeline({
      claimAge: age,
      monthlyPayment,
      planningAge: inputs.lifeExpectancy,
      comparisonAges,
      monthlyDiscountRate,
    });

    return {
      age,
      label: getScenarioLabel(age),
      monthlyPayment,
      annualPayment,
      byAge: timeline.byAge,
      lifetimeTotal: timeline.totalNominal,
      discountedTotal: timeline.totalDiscounted,
      timeline: timeline.points,
      interpretation: getScenarioInterpretation(age),
    };
  });

  const winner = [...scenarios].sort((a, b) => b.lifetimeTotal - a.lifetimeTotal)[0];
  const highestMonthly = [...scenarios].sort((a, b) => b.monthlyPayment - a.monthlyPayment)[0];
  const earliestIncome = [...scenarios].sort((a, b) => a.age - b.age)[0];
  const breakEvenPairs = [
    buildBreakEven(scenarios, 60, 65, inputs.lifeExpectancy),
    buildBreakEven(scenarios, 65, 70, inputs.lifeExpectancy),
    buildBreakEven(scenarios, 60, 70, inputs.lifeExpectancy),
  ];
  const primaryBreakEven = choosePrimaryBreakEven(winner.age, breakEvenPairs);

  return {
    inputs,
    comparisonAges,
    scenarios,
    winner,
    highestMonthly,
    earliestIncome,
    breakEvenPairs,
    primaryBreakEven,
  };
}

function getAdjustedMonthly(baseMonthlyAt65, claimAge) {
  const monthsFrom65 = Math.round((claimAge - CPP_RULES.referenceAge) * 12);
  if (monthsFrom65 < 0) return baseMonthlyAt65 * (1 + monthsFrom65 * CPP_RULES.earlyReductionPerMonth);
  if (monthsFrom65 > 0) return baseMonthlyAt65 * (1 + monthsFrom65 * CPP_RULES.delayedIncreasePerMonth);
  return baseMonthlyAt65;
}

function buildTimeline({ claimAge, monthlyPayment, planningAge, comparisonAges, monthlyDiscountRate }) {
  const startAge = 60;
  const maxMonth = Math.max(0, Math.round((planningAge - startAge) * 12));
  const byAge = {};
  const points = [];
  let totalNominal = 0;
  let totalDiscounted = 0;

  for (let month = 0; month <= maxMonth; month += 1) {
    const age = startAge + month / 12;
    if (age >= claimAge) {
      totalNominal += monthlyPayment;
      totalDiscounted += monthlyPayment / Math.pow(1 + monthlyDiscountRate, month);
    }

    if (month % 12 === 0) {
      points.push({
        age: roundTo(age, 1),
        total: totalNominal,
      });
    }
  }

  comparisonAges.forEach((checkpoint) => {
    const eligibleMonths = Math.max(0, Math.round((checkpoint - claimAge) * 12));
    byAge[checkpoint] = monthlyPayment * eligibleMonths;
  });

  return { byAge, points, totalNominal, totalDiscounted };
}

function buildBreakEven(scenarios, earlyAge, laterAge, planningAge) {
  const earlyScenario = scenarios.find((scenario) => scenario.age === earlyAge);
  const laterScenario = scenarios.find((scenario) => scenario.age === laterAge);
  const maxMonth = (CPP_RULES.maxProjectionAge - 60) * 12;
  let earlyTotal = 0;
  let laterTotal = 0;
  let breakEvenAge = null;

  for (let month = 0; month <= maxMonth; month += 1) {
    const age = 60 + month / 12;
    if (age >= earlyAge) earlyTotal += earlyScenario.monthlyPayment;
    if (age >= laterAge) laterTotal += laterScenario.monthlyPayment;
    // Break-even only matters once the later-start scenario is actually in pay.
    if (age >= laterAge && laterTotal >= earlyTotal) {
      breakEvenAge = age;
      break;
    }
  }

  return {
    earlyAge,
    laterAge,
    breakEvenAge,
    withinPlanningAge: breakEvenAge !== null && breakEvenAge <= planningAge,
  };
}

function choosePrimaryBreakEven(winnerAge, breakEvenPairs) {
  if (winnerAge === 70) return breakEvenPairs.find((pair) => pair.earlyAge === 65 && pair.laterAge === 70) || breakEvenPairs[1];
  return breakEvenPairs.find((pair) => pair.earlyAge === 60 && pair.laterAge === 65) || breakEvenPairs[0];
}

function renderFastAnswer(model) {
  const winner = model.winner;
  const primaryBreakEven = model.primaryBreakEven;

  el.fastAnswerTitle.textContent =
    winner.age === 70
      ? "Waiting until 70 may maximize lifetime CPP in this scenario."
      : winner.age === 60
        ? "Starting CPP at 60 may make more sense in this scenario."
        : "Starting CPP at 65 may be the standard-fit option in this scenario.";

  el.fastAnswerBody.textContent =
    winner.age === 70
      ? "Waiting until 70 may maximize lifetime CPP in this scenario."
      : winner.age === 60
        ? "Starting CPP at 60 may make more sense if getting income sooner matters most."
        : "Starting CPP at 65 can be a practical middle-ground in this scenario.";

  el.fastAnswerWhy.textContent =
    winner.age === 70
      ? `The higher monthly CPP may pay off if you expect a longer retirement, with the strongest total by age ${model.inputs.lifeExpectancy}.`
      : winner.age === 60
        ? `It gives you income sooner, and in this scenario CPP at 60 still stays ahead by age ${model.inputs.lifeExpectancy}.`
        : `It splits the difference between earlier access and a higher later benefit.`;

  el.fastAnswerCaution.textContent = "Planning estimate only. Confirm your exact CPP amount with Service Canada.";
  el.supportMicrocopy.textContent = "I build free Canadian planning tools like this. Support helps keep them free and improving.";

  el.primaryBreakEvenValue.textContent = formatBreakEvenShort(primaryBreakEven);
  el.primaryBreakEvenCopy.textContent =
    primaryBreakEven.breakEvenAge === null
      ? `The later start does not catch up by age ${CPP_RULES.maxProjectionAge} in this model.`
      : `${primaryBreakEven.laterAge} catches up to ${primaryBreakEven.earlyAge} around ${formatBreakEvenShort(primaryBreakEven)}.`;
}

function renderDecisionSummary(model) {
  if (!el.decisionSummaryGrid) return;
  const rows = [
    { label: "Highest monthly income", value: `CPP at ${model.highestMonthly.age}` },
    { label: "Income soonest", value: `CPP at ${model.earliestIncome.age}` },
    { label: "Standard baseline", value: "CPP at 65" },
    { label: "Break-even in this scenario", value: formatBreakEvenShort(model.primaryBreakEven) },
  ];

  el.decisionSummaryGrid.innerHTML = rows
    .map(
      (row) => `
        <article class="summary-card">
          <span>${escapeHtml(row.label)}</span>
          <strong>${escapeHtml(row.value)}</strong>
        </article>
      `,
    )
    .join("");
}

function renderComparisonCards(model) {
  el.comparisonGrid.innerHTML = model.scenarios
    .map((scenario) => {
      const isRecommended = scenario.age === model.winner.age;
      return `
        <article class="result-card${isRecommended ? " is-recommended" : ""}">
          <div class="result-card-header">
            <div>
              <h4>CPP at ${escapeHtml(String(scenario.age))}</h4>
              <div class="scenario-label">${escapeHtml(scenario.label)}</div>
            </div>
            <div class="card-badges">
              ${isRecommended ? '<span class="pill pill-recommended">Recommended</span>' : ""}
              <span class="pill">Age ${escapeHtml(String(scenario.age))}</span>
            </div>
          </div>
          <p class="scenario-monthly">${escapeHtml(formatCurrency(scenario.monthlyPayment))} <span>/ month</span></p>
          <div class="metric-stack">
            <div class="metric-stack-row">
              <span>Monthly CPP</span>
              <span>${escapeHtml(formatCurrency(scenario.monthlyPayment))}</span>
            </div>
            <div class="metric-stack-row">
              <span>Total by age ${escapeHtml(String(model.inputs.lifeExpectancy))}</span>
              <span>${escapeHtml(formatCurrency(scenario.lifetimeTotal))}</span>
            </div>
          </div>
          <p class="scenario-take">${escapeHtml(scenario.interpretation)}</p>
          <p class="scenario-fit muted small-copy">${escapeHtml(getScenarioBestFit(ageToBestFitKey(scenario.age)))}</p>
        </article>
      `;
    })
    .join("");
}

function renderChart(model) {
  el.chartHelper.textContent = "An earlier start leads at first, but a later start may catch up over time. Watch for the break-even marker.";
  el.chartLegend.innerHTML = model.scenarios
    .map(
      (scenario) => `
        <span class="legend-item">
          <span class="legend-swatch" style="background:${escapeHtml(TEMPLATE.chartColors[scenario.age])}"></span>
          CPP at ${escapeHtml(String(scenario.age))}
        </span>
      `,
    )
    .join("");

  const chartWidth = 860;
  const chartHeight = 390;
  const padding = { top: 20, right: 20, bottom: 40, left: 64 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const minAge = 60;
  const maxAge = model.inputs.lifeExpectancy;
  const maxValue = Math.max(...model.scenarios.flatMap((scenario) => scenario.timeline.map((point) => point.total)), 1);
  const yTicks = 4;
  const xYears = Array.from({ length: maxAge - minAge + 1 }, (_, index) => minAge + index)
    .filter((age) => age === minAge || age === maxAge || age % 5 === 0);

  const lines = model.scenarios
    .map((scenario) => {
      const path = scenario.timeline
        .map((point, index) => {
          const x = padding.left + ((point.age - minAge) / (maxAge - minAge || 1)) * plotWidth;
          const y = padding.top + plotHeight - (point.total / maxValue) * plotHeight;
          return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ");
      return `<path class="chart-line" d="${path}" stroke="${escapeHtml(TEMPLATE.chartColors[scenario.age])}"></path>`;
    })
    .join("");

  const yGrid = Array.from({ length: yTicks + 1 }, (_, index) => {
    const ratio = index / yTicks;
    const value = maxValue * (1 - ratio);
    const y = padding.top + plotHeight * ratio;
    return `
      <line class="chart-gridline" x1="${padding.left}" y1="${y.toFixed(2)}" x2="${chartWidth - padding.right}" y2="${y.toFixed(2)}"></line>
      <text class="chart-label" x="${padding.left - 10}" y="${(y + 4).toFixed(2)}" text-anchor="end">${escapeHtml(formatCurrencyCompact(value))}</text>
    `;
  }).join("");

  const xLabels = xYears
    .map((age) => {
      const x = padding.left + ((age - minAge) / (maxAge - minAge || 1)) * plotWidth;
      return `<text class="chart-label" x="${x.toFixed(2)}" y="${chartHeight - 12}" text-anchor="middle">${escapeHtml(String(age))}</text>`;
    })
    .join("");

  let breakEvenAnnotation = "";
  if (model.primaryBreakEven.breakEvenAge !== null && model.primaryBreakEven.breakEvenAge <= maxAge) {
    const x = padding.left + ((model.primaryBreakEven.breakEvenAge - minAge) / (maxAge - minAge || 1)) * plotWidth;
    breakEvenAnnotation = `
      <line class="chart-break-line" x1="${x.toFixed(2)}" y1="${padding.top}" x2="${x.toFixed(2)}" y2="${chartHeight - padding.bottom}"></line>
      <text class="chart-break-label" x="${Math.min(chartWidth - 90, x + 8).toFixed(2)}" y="${padding.top + 18}" text-anchor="start">Break-even ${escapeHtml(formatBreakEvenShort(model.primaryBreakEven))}</text>
    `;
  }

  el.chartContainer.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${chartWidth} ${chartHeight}" aria-hidden="true">
      <rect x="${padding.left}" y="${padding.top}" width="${plotWidth}" height="${plotHeight}" fill="#fbfdff" stroke="#e6edf7" rx="14"></rect>
      ${yGrid}
      ${breakEvenAnnotation}
      ${lines}
      ${xLabels}
      <text class="chart-label" x="${chartWidth / 2}" y="${chartHeight - 4}" text-anchor="middle">Age</text>
      <text class="chart-label" transform="translate(18 ${chartHeight / 2}) rotate(-90)" text-anchor="middle">Cumulative CPP</text>
    </svg>
  `;

  el.chartCaption.textContent = `Chart runs from age 60 to age ${model.inputs.lifeExpectancy}. It shows estimated cumulative CPP only.`;
}

function renderInsights(model) {
  const insights = [
    {
      title: "When taking CPP at 60 may make sense",
      body: "Starting at 60 can make sense if cash flow matters now, or if you want income sooner even though the monthly amount stays lower for life.",
    },
    {
      title: "When taking CPP at 65 may make sense",
      body: "Age 65 is the standard baseline and often the easiest middle-ground option when you do not want to start too early or wait until 70.",
    },
    {
      title: "When delaying to 70 may make sense",
      body: "Delaying to 70 can make sense if you expect a longer retirement and want the highest guaranteed monthly CPP later in life.",
    },
    {
      title: "Why break-even age is useful",
      body: `${formatBreakEvenSentence(model.primaryBreakEven)} It is helpful, but it is still only one part of the decision.`,
    },
  ];

  el.insightGrid.innerHTML = insights
    .map(
      (insight) => `
        <article class="insight-card">
          <h4>${escapeHtml(insight.title)}</h4>
          <p class="muted">${escapeHtml(insight.body)}</p>
        </article>
      `,
    )
    .join("");
}

function renderBreakEvenCards(model) {
  el.breakEvenGrid.innerHTML = model.breakEvenPairs
    .map((pair) => {
      const headline =
        pair.breakEvenAge === null
          ? `CPP at ${pair.laterAge} does not catch CPP at ${pair.earlyAge} by age ${CPP_RULES.maxProjectionAge}.`
          : `${pair.laterAge} catches up to ${pair.earlyAge} around age ${roundTo(pair.breakEvenAge, 1)}.`;
      const body =
        pair.breakEvenAge === null
          ? "In this model, the earlier start stays ahead through the projection horizon."
          : pair.withinPlanningAge
            ? `That catch-up point is within your planning age of ${model.inputs.lifeExpectancy}.`
            : `That catch-up point is beyond your planning age of ${model.inputs.lifeExpectancy}.`;

      return `
        <article class="break-even-card">
          <h4>${escapeHtml(`${pair.earlyAge} vs ${pair.laterAge}`)}</h4>
          <p class="muted">${escapeHtml(headline)}</p>
          <p class="muted small-copy">${escapeHtml(body)}</p>
        </article>
      `;
    })
    .join("");
}

function getScenarioLabel(age) {
  if (age === 60) return "Income sooner";
  if (age === 70) return "Highest later income";
  return "Standard baseline";
}

function getScenarioInterpretation(age) {
  if (age === 60) return "Income sooner, lower for life.";
  if (age === 65) return "Standard baseline option.";
  return "Higher later income.";
}

function ageToBestFitKey(age) {
  if (age === 60) return "60";
  if (age === 65) return "65";
  return "70";
}

function getScenarioBestFit(ageKey) {
  if (ageKey === "60") return "Best fit: People who want income sooner or need cash flow now.";
  if (ageKey === "65") return "Best fit: People who want the standard comparison point.";
  return "Best fit: People with other income sources while they wait.";
}

function renderValidationNote() {
  if (!el.validationNote) return;
  if (state.monthlyAt65 <= 0) {
    el.validationNote.textContent = "Add your estimated age-65 CPP amount to see a realistic comparison.";
    return;
  }
  if (state.lifeExpectancy < 65) {
    el.validationNote.textContent = "A planning age below 65 is allowed, but most people compare a longer retirement horizon.";
    return;
  }
  el.validationNote.textContent = "Example values are already loaded, so you can adjust from there rather than start from blank.";
}

function syncHeadMeta() {
  document.title = TEMPLATE.appName;
  if (el.metaDescription) el.metaDescription.setAttribute("content", TEMPLATE.seoDescription);
  if (el.metaThemeColor) el.metaThemeColor.setAttribute("content", "#0f6abf");
  if (el.metaOgTitle) el.metaOgTitle.setAttribute("content", TEMPLATE.appName);
  if (el.metaOgDescription) el.metaOgDescription.setAttribute("content", TEMPLATE.seoDescription);
  if (el.metaOgUrl) el.metaOgUrl.setAttribute("content", TEMPLATE.siteUrl);
  if (el.metaOgImage) el.metaOgImage.setAttribute("content", TEMPLATE.socialImageUrl);
  if (el.metaOgSiteName) el.metaOgSiteName.setAttribute("content", TEMPLATE.appName);
  if (el.metaTwitterTitle) el.metaTwitterTitle.setAttribute("content", TEMPLATE.appName);
  if (el.metaTwitterDescription) el.metaTwitterDescription.setAttribute("content", TEMPLATE.seoDescription);
  if (el.metaTwitterImage) el.metaTwitterImage.setAttribute("content", TEMPLATE.socialImageUrl);
}

function syncStaticLinks() {
  [el.plannerResultsLink, el.footerPlannerLink].forEach((link) => {
    if (link) link.href = TEMPLATE.retirementPlannerUrl;
  });
  [el.supportMicroLink, el.supportLink, el.footerSupportLink].forEach((link) => {
    if (link) link.href = TEMPLATE.supportUrl;
  });
}

function scrollToSection(targetId) {
  const section = document.getElementById(targetId);
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCurrencyCompact(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatBreakEvenShort(pair) {
  return pair.breakEvenAge === null ? "Not reached" : `Age ${roundTo(pair.breakEvenAge, 1)}`;
}

function formatBreakEvenSentence(pair) {
  if (pair.breakEvenAge === null) {
    return `CPP at ${pair.laterAge} does not catch CPP at ${pair.earlyAge} within the model horizon.`;
  }
  return `CPP at ${pair.laterAge} overtakes CPP at ${pair.earlyAge} around age ${roundTo(pair.breakEvenAge, 1)}.`;
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
