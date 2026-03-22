const STORAGE_KEY = "simplekit.netWorthCalculator.v1";

const ASSET_FIELDS = [
  { key: "cash", label: "Cash", color: "#0f6abf" },
  { key: "tfsa", label: "TFSA", color: "#0ea5a8" },
  { key: "rrsp", label: "RRSP", color: "#16a34a" },
  { key: "fhsa", label: "FHSA", color: "#f59e0b" },
  { key: "nonRegistered", label: "Non-registered", color: "#8b5cf6" },
  { key: "pension", label: "Pension", color: "#14b8a6" },
  { key: "homeValue", label: "Home", color: "#2563eb" },
  { key: "otherRealEstate", label: "Other real estate", color: "#0d9488" },
  { key: "vehicle", label: "Vehicle", color: "#fb7185" },
  { key: "business", label: "Business", color: "#7c3aed" },
  { key: "otherAssets", label: "Other assets", color: "#64748b" },
];

const LIABILITY_FIELDS = [
  { key: "mortgage", label: "Mortgage" },
  { key: "heloc", label: "HELOC" },
  { key: "carLoan", label: "Car loan" },
  { key: "studentLoan", label: "Student loan" },
  { key: "creditCard", label: "Credit card debt" },
  { key: "lineOfCredit", label: "Line of credit" },
  { key: "otherDebt", label: "Other debt" },
];

const PROJECTION_FIELDS = [
  { key: "annualContributions", label: "Annual contributions", type: "currency", defaultValue: 0 },
  { key: "growthRate", label: "Growth rate", type: "percent", defaultValue: 5 },
  { key: "projectionYears", label: "Projection years", type: "number", defaultValue: 10 },
  { key: "annualDebtPaydown", label: "Annual debt paydown", type: "currency", defaultValue: 0 },
];

const SAMPLE_DATA = {
  cash: 15000,
  tfsa: 55000,
  rrsp: 180000,
  fhsa: 12000,
  nonRegistered: 10000,
  pension: 150000,
  homeValue: 850000,
  otherRealEstate: 0,
  vehicle: 25000,
  business: 0,
  otherAssets: 5000,
  mortgage: 520000,
  heloc: 0,
  carLoan: 12000,
  studentLoan: 0,
  creditCard: 2500,
  lineOfCredit: 8000,
  otherDebt: 0,
  annualContributions: 18000,
  growthRate: 5,
  projectionYears: 10,
  annualDebtPaydown: 12000,
};

const DEFAULT_PROJECTION = {
  annualContributions: 0,
  growthRate: 5,
  projectionYears: 10,
  annualDebtPaydown: 0,
};

const el = {
  jumpToCalculatorBtn: document.getElementById("jumpToCalculatorBtn"),
  calculatorSection: document.getElementById("calculatorSection"),
  calculatorForm: document.getElementById("calculatorForm"),
  loadSampleBtn: document.getElementById("loadSampleBtn"),
  resetBtn: document.getElementById("resetBtn"),
  netWorthValue: document.getElementById("netWorthValue"),
  mobileNetWorthValue: document.getElementById("mobileNetWorthValue"),
  strengthBadge: document.getElementById("strengthBadge"),
  mobileStrengthBadge: document.getElementById("mobileStrengthBadge"),
  badgeExplanation: document.getElementById("badgeExplanation"),
  summaryGrid: document.getElementById("summaryGrid"),
  mobileSummaryGrid: document.getElementById("mobileSummaryGrid"),
  insightCopy: document.getElementById("insightCopy"),
  insightList: document.getElementById("insightList"),
  nextActionCopy: document.getElementById("nextActionCopy"),
  nextActionBridge: document.getElementById("nextActionBridge"),
  primaryNextAction: document.getElementById("primaryNextAction"),
  secondaryNextAction: document.getElementById("secondaryNextAction"),
  assetMixChart: document.getElementById("assetMixChart"),
  balanceChart: document.getElementById("balanceChart"),
  projectionChart: document.getElementById("projectionChart"),
  projectedNetWorthValue: document.getElementById("projectedNetWorthValue"),
  projectionYearsLabel: document.getElementById("projectionYearsLabel"),
  projectionCopy: document.getElementById("projectionCopy"),
  projectionAssumptionsList: document.getElementById("projectionAssumptionsList"),
  milestoneGrid: document.getElementById("milestoneGrid"),
  relatedToolLinks: Array.from(document.querySelectorAll(".related-tool-link")),
  resultLinkCtas: Array.from(document.querySelectorAll(".result-link-cta")),
  appToast: document.getElementById("appToast"),
};

const allFields = [...ASSET_FIELDS, ...LIABILITY_FIELDS, ...PROJECTION_FIELDS];
const inputs = Object.fromEntries(
  allFields.map((field) => [field.key, document.getElementById(field.key)]),
);

let ui = {
  toastTimer: null,
  redrawTimer: null,
  trackedCalculatorInteraction: false,
};

init();

function init() {
  bindEvents();
  hydrateInputs(loadStoredValues());
  renderAll();
}

function bindEvents() {
  el.jumpToCalculatorBtn?.addEventListener("click", () => {
    el.calculatorSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("jump_to_calculator");
  });

  el.calculatorForm?.addEventListener("submit", (event) => event.preventDefault());

  Object.entries(inputs).forEach(([key, input]) => {
    if (!input) return;
    input.addEventListener("focus", () => handleFocusInput(key));
    input.addEventListener("blur", () => handleBlurInput(key));
    input.addEventListener("input", () => handleInputChange(key));
  });

  el.loadSampleBtn?.addEventListener("click", () => {
    applyValues(SAMPLE_DATA);
    saveValues();
    renderAll();
    toast("Sample household loaded");
    trackEvent("load_sample_data");
  });

  el.resetBtn?.addEventListener("click", () => {
    resetValues();
    saveValues();
    renderAll();
    toast("Calculator reset");
    trackEvent("reset_calculator");
  });

  el.relatedToolLinks.forEach((link) => {
    link.addEventListener("click", () => {
      trackEvent("related_tool_click", {
        tool_name: link.dataset.toolName || "unknown",
      });
    });
  });

  el.resultLinkCtas.forEach((link) => {
    link.addEventListener("click", () => {
      trackEvent("results_next_step_click", {
        tool_name: link.dataset.toolName || "unknown",
      });
    });
  });
}

function loadStoredValues() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function hydrateInputs(saved) {
  const merged = { ...DEFAULT_PROJECTION, ...saved };
  Object.entries(inputs).forEach(([key, input]) => {
    if (!input) return;
    const field = fieldConfig(key);
    const numericValue = clampValue(key, parseInputValue(merged[key]));
    input.dataset.rawValue = Number.isFinite(numericValue) && numericValue !== 0 ? String(numericValue) : "";
    input.value = formatFieldValue(field, numericValue);
  });
}

function applyValues(values) {
  Object.entries(inputs).forEach(([key, input]) => {
    if (!input) return;
    const field = fieldConfig(key);
    const numericValue = clampValue(key, parseInputValue(values[key]));
    input.dataset.rawValue = Number.isFinite(numericValue) && numericValue !== 0 ? String(numericValue) : "";
    input.value = formatFieldValue(field, numericValue);
  });
}

function resetValues() {
  Object.entries(inputs).forEach(([key, input]) => {
    if (!input) return;
    const field = fieldConfig(key);
    const defaultValue = field.defaultValue ?? 0;
    input.dataset.rawValue = defaultValue ? String(defaultValue) : "";
    input.value = formatFieldValue(field, defaultValue);
  });
  localStorage.removeItem(STORAGE_KEY);
}

function saveValues() {
  const payload = getCurrentValues();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function handleFocusInput(key) {
  const input = inputs[key];
  if (!input) return;
  input.value = input.dataset.rawValue || "";
}

function handleBlurInput(key) {
  const input = inputs[key];
  if (!input) return;
  const field = fieldConfig(key);
  const numericValue = clampValue(key, parseInputValue(input.value));
  input.dataset.rawValue = numericValue ? String(numericValue) : "";
  input.value = formatFieldValue(field, numericValue);
}

function handleInputChange(key) {
  const input = inputs[key];
  if (!input) return;
  const numericValue = clampValue(key, parseInputValue(input.value));
  input.dataset.rawValue = numericValue ? String(numericValue) : "";
  saveValues();
  renderAll();

  if (!ui.trackedCalculatorInteraction) {
    ui.trackedCalculatorInteraction = true;
    trackEvent("calculator_interaction", { field_name: key });
  }
}

function getCurrentValues() {
  return Object.fromEntries(
    Object.entries(inputs).map(([key, input]) => {
      const numericValue = clampValue(key, parseInputValue(input?.dataset.rawValue || input?.value));
      return [key, numericValue];
    }),
  );
}

function renderAll() {
  const values = getCurrentValues();
  const summary = calculateSummary(values);
  renderSummary(summary);
  scheduleCharts(summary);
}

function calculateSummary(values) {
  const assetBreakdown = ASSET_FIELDS.map((field) => ({
    ...field,
    value: clampValue(field.key, values[field.key]),
  }));
  const liabilityBreakdown = LIABILITY_FIELDS.map((field) => ({
    ...field,
    value: clampValue(field.key, values[field.key]),
  }));

  const totalAssets = sumValues(assetBreakdown);
  const totalLiabilities = sumValues(liabilityBreakdown);
  const netWorth = totalAssets - totalLiabilities;
  const investableAssets = sumKeys(values, ["cash", "tfsa", "rrsp", "fhsa", "nonRegistered"]);
  const realEstateEquity = sumKeys(values, ["homeValue", "otherRealEstate"]) - sumKeys(values, ["mortgage", "heloc"]);
  const debtToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : null;
  const strength = getStrengthSummary(netWorth, debtToAssetRatio, totalAssets, totalLiabilities);
  const projection = buildProjection(values, totalAssets, totalLiabilities);

  return {
    values,
    assetBreakdown,
    liabilityBreakdown,
    totalAssets,
    totalLiabilities,
    netWorth,
    investableAssets,
    realEstateEquity,
    debtToAssetRatio,
    strength,
    projection,
  };
}

function renderSummary(summary) {
  el.netWorthValue.textContent = formatCurrency(summary.netWorth);
  if (el.mobileNetWorthValue) el.mobileNetWorthValue.textContent = formatCurrency(summary.netWorth);
  el.strengthBadge.textContent = summary.strength.label;
  el.strengthBadge.dataset.tone = summary.strength.tone;
  if (el.mobileStrengthBadge) {
    el.mobileStrengthBadge.textContent = summary.strength.label;
    el.mobileStrengthBadge.dataset.tone = summary.strength.tone;
  }
  el.badgeExplanation.textContent = summary.strength.description;
  el.summaryGrid.innerHTML = buildSummaryCards(summary);
  if (el.mobileSummaryGrid) el.mobileSummaryGrid.innerHTML = buildMobileSummaryCards(summary);
  el.insightCopy.textContent = buildInsightCopy(summary);
  el.insightList.innerHTML = buildInsightList(summary)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  renderNextActions(summary);
  el.projectedNetWorthValue.textContent = formatCurrency(summary.projection.lastPoint.netWorth);
  el.projectionYearsLabel.textContent = String(summary.projection.years);
  el.projectionCopy.textContent = buildProjectionCopy(summary);
  if (el.projectionAssumptionsList) {
    const assumptions = buildProjectionAssumptions(summary);
    el.projectionAssumptionsList.innerHTML = assumptions
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    el.projectionAssumptionsList.hidden = assumptions.length === 0;
  }
  const milestones = buildMilestones(summary.projection);
  el.milestoneGrid.innerHTML = milestones
    .map(
      (item) => `
        <article class="milestone-card">
          <span class="milestone-label">${escapeHtml(item.label)}</span>
          <strong class="milestone-value">${escapeHtml(formatCurrency(item.value))}</strong>
        </article>
      `,
    )
    .join("");
  el.milestoneGrid.hidden = milestones.length === 0;
}

function buildSummaryCards(summary) {
  const debtRatioText = summary.debtToAssetRatio === null ? "No assets entered yet" : formatPercent(summary.debtToAssetRatio);
  const cards = [
    {
      label: "Total assets",
      value: formatCurrency(summary.totalAssets),
      sub: "Everything you included on the asset side.",
    },
    {
      label: "Total liabilities",
      value: formatCurrency(summary.totalLiabilities),
      sub: "All debts and balances entered above.",
    },
    {
      label: "Debt-to-asset ratio",
      value: debtRatioText,
      sub: summary.debtToAssetRatio === null ? "Enter assets to calculate the ratio." : "Lower ratios generally mean less leverage.",
    },
    {
      label: "Investable assets",
      value: formatCurrency(summary.investableAssets),
      sub: "Cash, TFSA, RRSP, FHSA, and non-registered accounts.",
    },
    {
      label: "Real estate equity",
      value: formatCurrency(summary.realEstateEquity),
      sub: "Properties minus mortgage and HELOC balances.",
    },
    {
      label: "Projection end point",
      value: formatCurrency(summary.projection.lastPoint.netWorth),
      sub: `Estimated after ${summary.projection.years} year${summary.projection.years === 1 ? "" : "s"}.`,
    },
  ];

  return cards
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
}

function buildMobileSummaryCards(summary) {
  const items = [
    { label: "Assets", value: formatCurrency(summary.totalAssets) },
    { label: "Debts", value: formatCurrency(summary.totalLiabilities) },
    {
      label: "Investable",
      value: formatCurrency(summary.investableAssets),
    },
  ];

  return items
    .map(
      (item) => `
        <article class="mobile-summary-item">
          <span class="label">${escapeHtml(item.label)}</span>
          <span class="value">${escapeHtml(item.value)}</span>
        </article>
      `,
    )
    .join("");
}

function buildInsightCopy(summary) {
  if (summary.netWorth <= 0) {
    return "Right now, liabilities are meeting or exceeding assets. That is still useful information because it shows where the biggest improvements can come from first.";
  }
  if (summary.realEstateEquity > summary.investableAssets) {
    return "A large share of your net worth is tied to real estate. That can be a strength, but it also means liquid investments may deserve attention.";
  }
  if (summary.investableAssets >= summary.totalLiabilities) {
    return "Your investable assets already cover your current debts. That gives you flexibility and a stronger base for long-term retirement planning.";
  }
  return "You have a positive net worth and a base to build from. The next gains usually come from keeping debt in check while growing investable assets consistently.";
}

function buildInsightList(summary) {
  const items = [];

  if (summary.totalLiabilities > 0) {
    items.push(`Every additional dollar of debt paydown improves net worth directly.`);
  }
  if (summary.investableAssets < summary.totalAssets * 0.35) {
    items.push(`A larger share of wealth is outside investable accounts, so TFSA and RRSP contributions may improve flexibility.`);
  }
  if (summary.realEstateEquity < 0) {
    items.push(`Your real estate debt currently exceeds the property values entered, so double-check those estimates.`);
  } else if (summary.realEstateEquity > 0) {
    items.push(`Home and property equity are contributing ${formatCurrency(summary.realEstateEquity)} to net worth.`);
  }
  if (summary.projection.lastPoint.netWorth > summary.netWorth) {
    items.push(`Under your current assumptions, net worth rises to ${formatCurrency(summary.projection.lastPoint.netWorth)} over ${summary.projection.years} years.`);
  }
  if (!items.length) {
    items.push("Add a few values or load the sample household to see tailored insights.");
  }

  return items.slice(0, 4);
}

function buildProjectionCopy(summary) {
  return `This estimate grows investable assets at ${formatPercent(summary.projection.growthRate / 100)}, adds ${formatCurrency(summary.projection.annualContributions)} per year to those investable assets, and reduces debts by ${formatCurrency(summary.projection.annualDebtPaydown)} annually.`;
}

function buildProjectionAssumptions(summary) {
  return [
    `Homes, other real estate, pensions, business value, and other assets are held flat unless you update the starting values yourself.`,
    `Vehicle value is reduced by 10% per year to reflect depreciation.`,
    `Only investable assets compound at the selected growth rate.`,
  ];
}

function scheduleCharts(summary) {
  clearTimeout(ui.redrawTimer);
  ui.redrawTimer = setTimeout(() => {
    renderAssetMix(summary);
    renderBalanceChart(summary);
    renderProjectionChart(summary.projection.points);
  }, 80);
}

function renderAssetMix(summary) {
  const entries = summary.assetBreakdown
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  if (!entries.length) {
    el.assetMixChart.innerHTML = emptyState("Add asset values to see how your net worth is distributed.");
    return;
  }

  const total = summary.totalAssets || 1;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const circles = entries
    .map((entry) => {
      const slice = (entry.value / total) * circumference;
      const circle = `
        <circle
          cx="60"
          cy="60"
          r="${radius}"
          fill="none"
          stroke="${entry.color}"
          stroke-width="16"
          stroke-linecap="butt"
          stroke-dasharray="${slice} ${circumference - slice}"
          stroke-dashoffset="${-offset}"
        ></circle>
      `;
      offset += slice;
      return circle;
    })
    .join("");

  const legend = entries
    .map((entry) => {
      const share = total ? entry.value / total : 0;
      return `
        <div class="legend-row">
          <span class="legend-swatch" style="background:${entry.color}"></span>
          <span class="legend-label">${escapeHtml(entry.label)}</span>
          <span class="legend-value">${escapeHtml(formatPercent(share))}</span>
        </div>
      `;
    })
    .join("");

  el.assetMixChart.innerHTML = `
    <div class="donut-layout">
      <div class="donut-figure">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <g transform="rotate(-90 60 60)">
            <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#edf2f7" stroke-width="16"></circle>
            ${circles}
          </g>
        </svg>
        <div class="donut-center">
          <span class="small-copy muted">Assets</span>
          <strong>${escapeHtml(formatCurrency(summary.totalAssets))}</strong>
        </div>
      </div>
      <div class="legend-list">${legend}</div>
    </div>
  `;
}

function renderBalanceChart(summary) {
  const maxValue = Math.max(summary.totalAssets, summary.totalLiabilities, 1);
  const rows = [
    {
      label: "Assets",
      value: summary.totalAssets,
      className: "assets",
    },
    {
      label: "Liabilities",
      value: summary.totalLiabilities,
      className: "liabilities",
    },
  ];

  el.balanceChart.innerHTML = rows
    .map((row) => {
      const width = Math.max(6, Math.round((row.value / maxValue) * 100));
      return `
        <div class="bar-row">
          <div class="legend-row">
            <span class="bar-label">${escapeHtml(row.label)}</span>
            <span></span>
            <span class="bar-value">${escapeHtml(formatCurrency(row.value))}</span>
          </div>
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill ${row.className}" style="width:${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderProjectionChart(points) {
  if (!points.length) {
    el.projectionChart.innerHTML = emptyState("Add values above to generate a projection.");
    return;
  }

  const width = 640;
  const height = 280;
  const padding = { top: 24, right: 18, bottom: 28, left: 18 };
  const values = points.map((point) => point.netWorth);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const range = maxValue - minValue || 1;
  const finalYear = points[points.length - 1].year;

  const polyline = points
    .map((point, index) => {
      const x = padding.left + (index / Math.max(points.length - 1, 1)) * (width - padding.left - padding.right);
      const y = padding.top + ((maxValue - point.netWorth) / range) * (height - padding.top - padding.bottom);
      return `${x},${y}`;
    })
    .join(" ");

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((step) => {
      const y = padding.top + step * (height - padding.top - padding.bottom);
      return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e8edf5" stroke-width="1"></line>`;
    })
    .join("");

  const tickYears = [...new Set([0, Math.round(finalYear / 2), finalYear].filter((year) => year >= 0 && year <= finalYear))];
  const xTickLabels = tickYears
    .map((year) => {
      const x = padding.left + (year / Math.max(finalYear, 1)) * (width - padding.left - padding.right);
      const label = year === 0 ? "Today" : `Y${year}`;
      return `<text x="${x}" y="${height - 8}" text-anchor="middle" fill="#6b7280" font-size="11">${label}</text>`;
    })
    .join("");

  let zeroLine = "";
  if (minValue < 0 && maxValue > 0) {
    const zeroY = padding.top + ((maxValue - 0) / range) * (height - padding.top - padding.bottom);
    zeroLine = `<line x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}" stroke="#94a3b8" stroke-dasharray="4 4" stroke-width="1.5"></line>`;
  }

  const yLabels = [maxValue, minValue]
    .map((value, index) => {
      const y = index === 0 ? padding.top + 4 : height - padding.bottom;
      return `<text x="${padding.left}" y="${y}" fill="#6b7280" font-size="11">${escapeHtml(formatCurrency(value))}</text>`;
    })
    .join("");
  el.projectionChart.innerHTML = `
    <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Projected net worth line chart">
      ${gridLines}
      ${zeroLine}
      ${yLabels}
      ${xTickLabels}
      <polyline
        fill="none"
        stroke="#0f6abf"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
        points="${polyline}"
      ></polyline>
      ${points
        .map((point, index) => {
          const x = padding.left + (index / Math.max(points.length - 1, 1)) * (width - padding.left - padding.right);
          const y = padding.top + ((maxValue - point.netWorth) / range) * (height - padding.top - padding.bottom);
          return `
            <circle cx="${x}" cy="${y}" r="4" fill="#0ea5a8">
              <title>Year ${point.year}: ${escapeHtml(formatCurrency(point.netWorth))}</title>
            </circle>
          `;
        })
        .join("")}
    </svg>
    <div class="chart-axis-note">
      <span>Y-axis: net worth</span>
      <span>${minValue < 0 && maxValue > 0 ? "Dashed line marks zero net worth." : "X-axis: years from today"}</span>
    </div>
    <div class="line-chart-labels">
      <span>Start: ${escapeHtml(formatCurrency(points[0].netWorth))}</span>
      <span>End: ${escapeHtml(formatCurrency(points[points.length - 1].netWorth))}</span>
    </div>
  `;
}

function buildProjection(values, totalAssets, totalLiabilities) {
  const annualContributions = clampValue("annualContributions", values.annualContributions);
  const growthRate = clampValue("growthRate", values.growthRate);
  const years = Math.min(40, Math.max(1, Math.round(clampValue("projectionYears", values.projectionYears || DEFAULT_PROJECTION.projectionYears))));
  const annualDebtPaydown = clampValue("annualDebtPaydown", values.annualDebtPaydown);
  const growthFactor = growthRate / 100;

  let investableAssets = sumKeys(values, ["cash", "tfsa", "rrsp", "fhsa", "nonRegistered"]);
  let fixedAssets = sumKeys(values, ["pension", "homeValue", "otherRealEstate", "business", "otherAssets"]);
  let vehicleValue = clampValue("vehicle", values.vehicle);
  let liabilities = totalLiabilities;
  const initialAssets = investableAssets + fixedAssets + vehicleValue;
  const points = [{
    year: 0,
    assets: initialAssets,
    liabilities,
    netWorth: initialAssets - liabilities,
    investableAssets,
    fixedAssets,
    vehicleValue,
  }];

  for (let year = 1; year <= years; year += 1) {
    investableAssets = investableAssets * (1 + growthFactor) + annualContributions;
    vehicleValue = vehicleValue * 0.9;
    liabilities = Math.max(0, liabilities - annualDebtPaydown);
    const assets = investableAssets + fixedAssets + vehicleValue;
    points.push({
      year,
      assets,
      liabilities,
      netWorth: assets - liabilities,
      investableAssets,
      fixedAssets,
      vehicleValue,
    });
  }

  return {
    annualContributions,
    growthRate,
    years,
    annualDebtPaydown,
    points,
    lastPoint: points[points.length - 1],
  };
}

function renderNextActions(summary) {
  const nextStep = getNextAction(summary);
  if (el.nextActionCopy) el.nextActionCopy.textContent = nextStep.copy;
  if (el.nextActionBridge) {
    el.nextActionBridge.textContent = nextStep.bridge || "";
    el.nextActionBridge.hidden = !nextStep.bridge;
  }
  if (el.primaryNextAction) {
    el.primaryNextAction.href = nextStep.primary.href;
    el.primaryNextAction.textContent = nextStep.primary.label;
    el.primaryNextAction.dataset.toolName = nextStep.primary.toolName;
  }
  if (el.secondaryNextAction) {
    el.secondaryNextAction.href = nextStep.secondary.href;
    el.secondaryNextAction.textContent = nextStep.secondary.label;
    el.secondaryNextAction.dataset.toolName = nextStep.secondary.toolName;
  }
}

function getNextAction(summary) {
  if (summary.totalLiabilities > summary.investableAssets) {
    return {
      copy: "Your debts are still larger than your investable assets, so a fuller retirement cash-flow plan can help show what to prioritize next.",
      bridge: "If reducing debt is the priority, use the planner to see how faster paydown changes your long-term flexibility.",
      primary: {
        href: "https://simplekit.app/retirement-planner/",
        label: "Open the Retirement Planner",
        toolName: "retirement-planner",
      },
      secondary: {
        href: "https://simplekit.app/cpp-calculator/",
        label: "Review CPP timing",
        toolName: "cpp",
      },
    };
  }

  if (summary.investableAssets >= Math.max(summary.realEstateEquity, 0)) {
    return {
      copy: "A larger share of your net worth is already in investable assets, so the next useful question is where new savings should go.",
      bridge: "If new contributions are your main lever now, compare TFSA and RRSP choices before your next deposit.",
      primary: {
        href: "https://simplekit.app/rrsp-vs-tfsa-calculator/",
        label: "Compare TFSA vs RRSP",
        toolName: "tfsa-rrsp",
      },
      secondary: {
        href: "https://simplekit.app/retirement-planner/",
        label: "Open the Retirement Planner",
        toolName: "retirement-planner",
      },
    };
  }

  return {
    copy: "Your balance sheet is a good start. The next step is linking it to retirement income, spending, and timing decisions.",
    bridge: "If real estate is doing most of the work, the retirement planner helps you test liquidity and future income alongside that equity.",
    primary: {
      href: "https://simplekit.app/retirement-planner/",
      label: "Open the Retirement Planner",
      toolName: "retirement-planner",
    },
    secondary: {
      href: "https://simplekit.app/rrsp-vs-tfsa-calculator/",
      label: "Compare TFSA vs RRSP",
      toolName: "tfsa-rrsp",
    },
  };
}

function buildMilestones(projection) {
  const desired = [5, 10, projection.years];
  const uniqueYears = [...new Set(desired.filter((year) => year <= projection.years))];
  return uniqueYears.map((year) => {
    const point = projection.points.find((entry) => entry.year === year) || projection.lastPoint;
    return {
      label: year === projection.years ? `In ${year} years` : `Year ${year}`,
      value: point.netWorth,
    };
  });
}

function getStrengthSummary(netWorth, debtToAssetRatio, totalAssets, totalLiabilities) {
  if (totalAssets <= 0 && totalLiabilities <= 0) {
    return {
      label: "Building",
      tone: "building",
      description: "Add a few values to create your first balance sheet snapshot.",
    };
  }
  if (netWorth <= 0 || debtToAssetRatio === null || debtToAssetRatio > 0.8) {
    return {
      label: "Building",
      tone: "building",
      description: "Assets are still catching up to liabilities, or debt is doing most of the heavy lifting.",
    };
  }
  if (debtToAssetRatio > 0.5) {
    return {
      label: "Stable",
      tone: "stable",
      description: "Assets are ahead of liabilities, but leverage is still a meaningful part of the picture.",
    };
  }
  if (debtToAssetRatio > 0.25) {
    return {
      label: "Strong",
      tone: "strong",
      description: "Net worth is positive and debt is a more moderate share of total assets.",
    };
  }
  return {
    label: "Very Strong",
    tone: "very-strong",
    description: "Assets are well ahead of liabilities, creating a more flexible balance sheet.",
  };
}

function sumValues(entries) {
  return entries.reduce((total, entry) => total + entry.value, 0);
}

function sumKeys(values, keys) {
  return keys.reduce((total, key) => total + clampValue(key, values[key]), 0);
}

function fieldConfig(key) {
  return allFields.find((field) => field.key === key) || { key, type: "currency" };
}

function clampValue(key, value) {
  const numeric = Number.isFinite(value) ? value : 0;
  if (key === "projectionYears") return Math.max(0, Math.min(40, Math.round(numeric)));
  if (key === "growthRate") return Math.max(0, Math.min(20, numeric));
  return Math.max(0, numeric);
}

function parseInputValue(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatFieldValue(field, value) {
  const numeric = Number.isFinite(value) ? value : 0;
  if (!numeric) return "";
  if (field.type === "percent" || field.key === "growthRate") return trimTrailingZeros(numeric);
  if (field.type === "number" || field.key === "projectionYears") return String(Math.round(numeric));
  return formatNumber(numeric);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-CA", {
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatPercent(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function trimTrailingZeros(value) {
  return String(Number.parseFloat(Number(value).toFixed(2)));
}

function emptyState(copy) {
  return `<div class="empty-state"><p>${escapeHtml(copy)}</p></div>`;
}

function toast(message) {
  if (!el.appToast) return;
  el.appToast.hidden = false;
  el.appToast.textContent = message;
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    el.appToast.hidden = true;
  }, 2200);
}

function trackEvent(name, params = {}) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
