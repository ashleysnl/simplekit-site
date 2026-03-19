(() => {
const STORAGE_KEY = "simplekit-rent-vs-buy-state";

const DEFAULT_STATE = {
  homePrice: 550000,
  downPayment: 110000,
  mortgageRate: 5.25,
  amortizationYears: 25,
  mortgageTermYears: 5,
  propertyTaxesAnnual: 4800,
  homeInsuranceAnnual: 1400,
  maintenanceMode: "annual",
  maintenanceAnnual: 5500,
  maintenanceRatePct: 1,
  condoFeesMonthly: 0,
  closingCosts: 11000,
  sellingCostsPct: 5,
  monthlyRent: 2400,
  rentIncreaseRate: 3,
  rentersInsuranceMonthly: 25,
  movingCosts: 1500,
  appreciationRate: 3,
  investmentReturnRate: 6,
  inflationRate: 2,
  comparisonYears: 10,
  investUpfrontCapital: true,
  investMonthlySavings: true,
};

const PRESETS = {
  balanced: { ...DEFAULT_STATE },
  highCost: {
    homePrice: 950000,
    downPayment: 190000,
    mortgageRate: 5.75,
    amortizationYears: 25,
    mortgageTermYears: 5,
    propertyTaxesAnnual: 7600,
    homeInsuranceAnnual: 1800,
    maintenanceMode: "percent",
    maintenanceAnnual: 0,
    maintenanceRatePct: 1.1,
    condoFeesMonthly: 420,
    closingCosts: 18000,
    sellingCostsPct: 5,
    monthlyRent: 3400,
    rentIncreaseRate: 4,
    rentersInsuranceMonthly: 35,
    movingCosts: 2000,
    appreciationRate: 3.5,
    investmentReturnRate: 6.5,
    inflationRate: 2.5,
    comparisonYears: 9,
    investUpfrontCapital: true,
    investMonthlySavings: true,
  },
  longTerm: {
    homePrice: 500000,
    downPayment: 125000,
    mortgageRate: 5,
    amortizationYears: 25,
    mortgageTermYears: 5,
    propertyTaxesAnnual: 4200,
    homeInsuranceAnnual: 1300,
    maintenanceMode: "percent",
    maintenanceAnnual: 0,
    maintenanceRatePct: 1,
    condoFeesMonthly: 0,
    closingCosts: 9500,
    sellingCostsPct: 5,
    monthlyRent: 2200,
    rentIncreaseRate: 2.5,
    rentersInsuranceMonthly: 25,
    movingCosts: 1200,
    appreciationRate: 3.5,
    investmentReturnRate: 6,
    inflationRate: 2,
    comparisonYears: 15,
    investUpfrontCapital: true,
    investMonthlySavings: true,
  },
};

const selectors = {
  form: "#calculatorForm",
  maintenanceMode: "#maintenanceMode",
  basicModeBtn: "#basicModeBtn",
  advancedModeBtn: "#advancedModeBtn",
  presetBtns: ".preset-btn[data-preset]",
  resetBtn: "#resetBtn",
  shareBtn: "#shareBtn",
  shareFeedback: "#shareFeedback",
  resultsStatus: "#resultsStatus",
  primaryCards: "#primaryCards",
  secondaryCards: "#secondaryCards",
  driverInsights: "#driverInsights",
  tableBody: "#tableBody",
  heroOutcome: "#heroOutcome",
  heroOutcomeCopy: "#heroOutcomeCopy",
  heroMonthly: "#heroMonthly",
  heroBreakEven: "#heroBreakEven",
  resultHeadline: "#resultHeadline",
  resultSubhead: "#resultSubhead",
  resultAction: "#resultAction",
  closeCallNote: "#closeCallNote",
  resultExplain: "#resultExplain",
  flipFactorNote: "#flipFactorNote",
  resultBreakEven: "#resultBreakEven",
  resultDifference: "#resultDifference",
  resultCostGap: "#resultCostGap",
  buySummary: "#buySummary",
  rentSummary: "#rentSummary",
  assumptionSummary: "#assumptionSummary",
  investingSummary: "#investingSummary",
  nextToolHeading: "#nextToolHeading",
  nextToolCopy: "#nextToolCopy",
  nextToolLink: "#nextToolLink",
  resultToolInlineLink: "#resultToolInlineLink",
  flipFactors: "#flipFactors",
  relatedGrid: "#relatedGrid",
  activeChart: "#activeChart",
  chartTitle: "#chartTitle",
  chartDescription: "#chartDescription",
  chartInsight: "#chartInsight",
  chartLegend: "#chartLegend",
  chartTabs: ".chart-tab",
  mobileCards: "[data-mobile-collapsible]",
};

const CHART_META = {
  netWorth: {
    title: "Net Worth Over Time",
    description: "Projected ending assets for each path based on your assumptions.",
    insight: "This chart shows which option may leave you with more net worth over the selected period.",
  },
  cost: {
    title: "Cumulative Cost Over Time",
    description: "Total housing cash outflows for renting and buying over time.",
    insight: "This chart helps explain whether one path is meaningfully more expensive to carry along the way.",
  },
  wealth: {
    title: "Home Equity vs Renter Investment",
    description: "The two main wealth-building balances compared directly.",
    insight: "This chart isolates the core tradeoff between home equity and invested savings.",
  },
};

const fieldNames = Object.keys(DEFAULT_STATE);
let state = { ...DEFAULT_STATE };
let uiState = {
  mode: "basic",
  activeChart: "netWorth",
};

function $(selector) {
  return document.querySelector(selector);
}

function getForm() {
  return $(selectors.form);
}

function formatCurrency(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(safeValue >= 10 ? 1 : 2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}%`;
}

function formatYears(value) {
  return `${value} year${value === 1 ? "" : "s"}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function parseNumber(rawValue, fallback) {
  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    return fallback;
  }
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNonNegative(value) {
  return value < 0 ? 0 : value;
}

function sanitizeState(input) {
  const warnings = [];

  const sanitized = {
    homePrice: clampNonNegative(parseNumber(input.homePrice, DEFAULT_STATE.homePrice)),
    downPayment: clampNonNegative(parseNumber(input.downPayment, DEFAULT_STATE.downPayment)),
    mortgageRate: clampNonNegative(parseNumber(input.mortgageRate, DEFAULT_STATE.mortgageRate)),
    amortizationYears: Math.max(1, Math.round(parseNumber(input.amortizationYears, DEFAULT_STATE.amortizationYears))),
    mortgageTermYears: Math.max(1, Math.round(parseNumber(input.mortgageTermYears, DEFAULT_STATE.mortgageTermYears))),
    propertyTaxesAnnual: clampNonNegative(parseNumber(input.propertyTaxesAnnual, DEFAULT_STATE.propertyTaxesAnnual)),
    homeInsuranceAnnual: clampNonNegative(parseNumber(input.homeInsuranceAnnual, DEFAULT_STATE.homeInsuranceAnnual)),
    maintenanceMode: input.maintenanceMode === "percent" ? "percent" : "annual",
    maintenanceAnnual: clampNonNegative(parseNumber(input.maintenanceAnnual, DEFAULT_STATE.maintenanceAnnual)),
    maintenanceRatePct: clampNonNegative(parseNumber(input.maintenanceRatePct, DEFAULT_STATE.maintenanceRatePct)),
    condoFeesMonthly: clampNonNegative(parseNumber(input.condoFeesMonthly, DEFAULT_STATE.condoFeesMonthly)),
    closingCosts: clampNonNegative(parseNumber(input.closingCosts, DEFAULT_STATE.closingCosts)),
    sellingCostsPct: clampNonNegative(parseNumber(input.sellingCostsPct, DEFAULT_STATE.sellingCostsPct)),
    monthlyRent: clampNonNegative(parseNumber(input.monthlyRent, DEFAULT_STATE.monthlyRent)),
    rentIncreaseRate: clampNonNegative(parseNumber(input.rentIncreaseRate, DEFAULT_STATE.rentIncreaseRate)),
    rentersInsuranceMonthly: clampNonNegative(parseNumber(input.rentersInsuranceMonthly, DEFAULT_STATE.rentersInsuranceMonthly)),
    movingCosts: clampNonNegative(parseNumber(input.movingCosts, DEFAULT_STATE.movingCosts)),
    appreciationRate: clampNonNegative(parseNumber(input.appreciationRate, DEFAULT_STATE.appreciationRate)),
    investmentReturnRate: clampNonNegative(parseNumber(input.investmentReturnRate, DEFAULT_STATE.investmentReturnRate)),
    inflationRate: clampNonNegative(parseNumber(input.inflationRate, DEFAULT_STATE.inflationRate)),
    comparisonYears: Math.min(40, Math.max(1, Math.round(parseNumber(input.comparisonYears, DEFAULT_STATE.comparisonYears)))),
    investUpfrontCapital: Boolean(input.investUpfrontCapital),
    investMonthlySavings: Boolean(input.investMonthlySavings),
  };

  if (sanitized.downPayment > sanitized.homePrice) {
    sanitized.downPayment = sanitized.homePrice;
    warnings.push("Down payment was capped at the home price so the mortgage does not become negative.");
  }

  if (sanitized.homePrice === 0) {
    warnings.push("Home price is set to $0, so the buy path behaves like a zero-cost property and may not be realistic.");
  }

  if (sanitized.monthlyRent === 0) {
    warnings.push("Monthly rent is set to $0, so the rent path represents free housing and will look unusually strong.");
  }

  if (sanitized.comparisonYears <= 3) {
    warnings.push("A short comparison period often favors renting because closing and selling costs are front-loaded.");
  }

  if (sanitized.appreciationRate >= 12) {
    warnings.push("Home appreciation is very high. Small changes to this assumption can heavily change the outcome.");
  }

  if (sanitized.rentIncreaseRate >= 10) {
    warnings.push("Rent growth is very high. This may push renting costs up much faster than typical inflation.");
  }

  if (sanitized.investmentReturnRate >= 12) {
    warnings.push("Investment return is aggressive. Consider testing a lower range as a sensitivity check.");
  }

  return { sanitized, warnings };
}

function setFormState(nextState) {
  state = { ...nextState };
  const form = getForm();
  if (!form) {
    return;
  }

  fieldNames.forEach((key) => {
    const field = form.elements.namedItem(key);
    if (!field) {
      return;
    }

    if (field.type === "checkbox") {
      field.checked = Boolean(state[key]);
    } else {
      field.value = state[key];
    }
  });

  updateMaintenanceVisibility();
}

function readFormState() {
  const form = getForm();
  if (!form) {
    return { ...DEFAULT_STATE };
  }

  return {
    homePrice: form.elements.homePrice.value,
    downPayment: form.elements.downPayment.value,
    mortgageRate: form.elements.mortgageRate.value,
    amortizationYears: form.elements.amortizationYears.value,
    mortgageTermYears: form.elements.mortgageTermYears.value,
    propertyTaxesAnnual: form.elements.propertyTaxesAnnual.value,
    homeInsuranceAnnual: form.elements.homeInsuranceAnnual.value,
    maintenanceMode: form.elements.maintenanceMode.value,
    maintenanceAnnual: form.elements.maintenanceAnnual.value,
    maintenanceRatePct: form.elements.maintenanceRatePct.value,
    condoFeesMonthly: form.elements.condoFeesMonthly.value,
    closingCosts: form.elements.closingCosts.value,
    sellingCostsPct: form.elements.sellingCostsPct.value,
    monthlyRent: form.elements.monthlyRent.value,
    rentIncreaseRate: form.elements.rentIncreaseRate.value,
    rentersInsuranceMonthly: form.elements.rentersInsuranceMonthly.value,
    movingCosts: form.elements.movingCosts.value,
    appreciationRate: form.elements.appreciationRate.value,
    investmentReturnRate: form.elements.investmentReturnRate.value,
    inflationRate: form.elements.inflationRate.value,
    comparisonYears: form.elements.comparisonYears.value,
    investUpfrontCapital: form.elements.investUpfrontCapital.checked,
    investMonthlySavings: form.elements.investMonthlySavings.checked,
  };
}

function saveToLocalStorage(nextState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (error) {
    // Ignore storage failures so the tool still works in restricted contexts.
  }
}

function restoreFromLocalStorage() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

function syncUrl(nextState) {
  const params = new URLSearchParams();
  fieldNames.forEach((key) => {
    const value = nextState[key];
    if (value !== DEFAULT_STATE[key]) {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, "", nextUrl);
}

function restoreFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if ([...params.keys()].length === 0) {
    return null;
  }

  const restored = { ...DEFAULT_STATE };
  fieldNames.forEach((key) => {
    if (!params.has(key)) {
      return;
    }

    const defaultValue = DEFAULT_STATE[key];
    if (typeof defaultValue === "boolean") {
      restored[key] = params.get(key) === "true";
    } else if (typeof defaultValue === "number") {
      restored[key] = parseNumber(params.get(key), defaultValue);
    } else {
      restored[key] = params.get(key) || defaultValue;
    }
  });
  return restored;
}

function computeMortgagePayment(principal, monthlyRate, totalMonths) {
  if (principal <= 0 || totalMonths <= 0) {
    return 0;
  }
  if (monthlyRate === 0) {
    return principal / totalMonths;
  }
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

function calculateScenario(input) {
  const { sanitized, warnings } = sanitizeState(input);
  const months = sanitized.comparisonYears * 12;
  const amortizationMonths = sanitized.amortizationYears * 12;
  const monthlyMortgageRate = sanitized.mortgageRate / 100 / 12;
  const appreciationMonthly = sanitized.appreciationRate / 100 / 12;
  const investmentMonthly = sanitized.investmentReturnRate / 100 / 12;
  const inflationAnnual = sanitized.inflationRate / 100;
  const rentGrowthAnnual = sanitized.rentIncreaseRate / 100;
  const mortgagePrincipal = Math.max(0, sanitized.homePrice - sanitized.downPayment);
  const mortgagePayment = computeMortgagePayment(mortgagePrincipal, monthlyMortgageRate, amortizationMonths);
  const initialBuyMonthlyCore =
    mortgagePayment +
    sanitized.propertyTaxesAnnual / 12 +
    sanitized.homeInsuranceAnnual / 12 +
    (sanitized.maintenanceMode === "percent"
      ? (sanitized.homePrice * sanitized.maintenanceRatePct / 100) / 12
      : sanitized.maintenanceAnnual / 12) +
    sanitized.condoFeesMonthly;
  const initialRentMonthlyCore = sanitized.monthlyRent + sanitized.rentersInsuranceMonthly;
  const upfrontBuyCost = sanitized.downPayment + sanitized.closingCosts;
  const upfrontRentCost = sanitized.movingCosts;
  const upfrontInvestment = sanitized.investUpfrontCapital ? Math.max(0, upfrontBuyCost - upfrontRentCost) : 0;

  let homeValue = sanitized.homePrice;
  let mortgageBalance = mortgagePrincipal;
  let currentRent = sanitized.monthlyRent;
  let currentPropertyTaxAnnual = sanitized.propertyTaxesAnnual;
  let currentHomeInsuranceAnnual = sanitized.homeInsuranceAnnual;
  let currentMaintenanceAnnual = sanitized.maintenanceAnnual;
  let currentCondoMonthly = sanitized.condoFeesMonthly;
  let currentRentersInsuranceMonthly = sanitized.rentersInsuranceMonthly;
  let investmentBalance = upfrontInvestment;
  let cumulativeBuyCost = upfrontBuyCost;
  let cumulativeRentCost = upfrontRentCost;
  let annualBuyCost = 0;
  let annualRentCost = 0;

  const records = [{
    year: 0,
    annualBuyCost: 0,
    annualRentCost: 0,
    cumulativeBuyCost,
    cumulativeRentCost,
    mortgageBalance,
    homeValue,
    homeEquity: homeValue - mortgageBalance - (homeValue * sanitized.sellingCostsPct / 100),
    renterInvestmentBalance: investmentBalance,
    netWorthDifference: homeValue - mortgageBalance - (homeValue * sanitized.sellingCostsPct / 100) - investmentBalance,
  }];

  for (let month = 1; month <= months; month += 1) {
    if (month > 1 && (month - 1) % 12 === 0) {
      currentRent *= 1 + rentGrowthAnnual;
      currentPropertyTaxAnnual *= 1 + inflationAnnual;
      currentHomeInsuranceAnnual *= 1 + inflationAnnual;
      currentMaintenanceAnnual *= 1 + inflationAnnual;
      currentCondoMonthly *= 1 + inflationAnnual;
      currentRentersInsuranceMonthly *= 1 + inflationAnnual;
    }

    const interestPayment = mortgageBalance > 0 ? mortgageBalance * monthlyMortgageRate : 0;
    const scheduledPrincipal = Math.max(0, mortgagePayment - interestPayment);
    const principalPayment = Math.min(scheduledPrincipal, mortgageBalance);
    mortgageBalance = Math.max(0, mortgageBalance - principalPayment);
    homeValue *= 1 + appreciationMonthly;

    const maintenanceMonthly = sanitized.maintenanceMode === "percent"
      ? (homeValue * sanitized.maintenanceRatePct / 100) / 12
      : currentMaintenanceAnnual / 12;
    const buyMonthlyCost =
      (mortgageBalance > 0 || mortgagePayment > 0 ? interestPayment + principalPayment : 0) +
      currentPropertyTaxAnnual / 12 +
      currentHomeInsuranceAnnual / 12 +
      maintenanceMonthly +
      currentCondoMonthly;
    const rentMonthlyCost = currentRent + currentRentersInsuranceMonthly;

    annualBuyCost += buyMonthlyCost;
    annualRentCost += rentMonthlyCost;
    cumulativeBuyCost += buyMonthlyCost;
    cumulativeRentCost += rentMonthlyCost;

    if (investmentBalance > 0) {
      investmentBalance *= 1 + investmentMonthly;
    }

    if (sanitized.investMonthlySavings && buyMonthlyCost > rentMonthlyCost) {
      investmentBalance += buyMonthlyCost - rentMonthlyCost;
    }

    if (month % 12 === 0) {
      const sellingCosts = homeValue * sanitized.sellingCostsPct / 100;
      const homeEquity = homeValue - mortgageBalance - sellingCosts;
      records.push({
        year: month / 12,
        annualBuyCost,
        annualRentCost,
        cumulativeBuyCost,
        cumulativeRentCost,
        mortgageBalance,
        homeValue,
        homeEquity,
        renterInvestmentBalance: investmentBalance,
        netWorthDifference: homeEquity - investmentBalance,
      });
      annualBuyCost = 0;
      annualRentCost = 0;
    }
  }

  const finalRecord = records[records.length - 1];
  const breakEvenRecord = records.find((record) => record.year > 0 && record.netWorthDifference >= 0);
  const buyCheaperAllYears = records.every((record) => record.year === 0 || record.annualBuyCost <= record.annualRentCost);
  const rentCheaperAllYears = records.every((record) => record.year === 0 || record.annualRentCost <= record.annualBuyCost);

  if (!breakEvenRecord) {
    warnings.push("Buying does not catch up to renting on projected net worth within the selected comparison period.");
  }
  if (rentCheaperAllYears) {
    warnings.push("Renting stays cheaper than buying on annual housing costs for the full selected period.");
  }
  if (buyCheaperAllYears) {
    warnings.push("Buying stays cheaper than renting on annual housing costs for the full selected period.");
  }

  return {
    inputs: sanitized,
    warnings,
    mortgagePrincipal,
    mortgagePayment,
    upfrontBuyCost,
    upfrontRentCost,
    upfrontInvestment,
    initialBuyMonthlyCore,
    initialRentMonthlyCore,
    finalRecord,
    breakEvenYear: breakEvenRecord ? breakEvenRecord.year : null,
    records,
  };
}

function buildInsightList(summary) {
  const insights = [];
  const difference = summary.finalRecord.netWorthDifference;
  const buyingLeads = difference >= 0;
  const monthlyGap = summary.initialBuyMonthlyCore - summary.initialRentMonthlyCore;
  const finalCostGap = summary.finalRecord.cumulativeBuyCost - summary.finalRecord.cumulativeRentCost;
  const rankedDrivers = [
    {
      key: "timeline",
      weight: summary.breakEvenYear ? Math.abs(summary.inputs.comparisonYears - summary.breakEvenYear) : summary.inputs.comparisonYears,
      title: "Time horizon",
      copy: summary.breakEvenYear
        ? `Your ${formatYears(summary.inputs.comparisonYears)} horizon matters because buying only catches up in year ${summary.breakEvenYear}.`
        : `Your ${formatYears(summary.inputs.comparisonYears)} horizon is the biggest driver because buying never catches up inside that window.`,
    },
    {
      key: "monthlyGap",
      weight: Math.abs(monthlyGap),
      title: "Monthly cost gap",
      copy: monthlyGap > 0
        ? `Buying starts ${formatCurrency(monthlyGap)} per month higher, which gives renting more room to build invested savings.`
        : monthlyGap < 0
          ? `Buying starts ${formatCurrency(Math.abs(monthlyGap))} per month cheaper, which helps ownership catch up faster.`
          : "The monthly cost gap is small, so longer-term assumptions matter more than month-one cash flow.",
    },
    {
      key: "growthGap",
      weight: Math.abs(summary.inputs.appreciationRate - summary.inputs.investmentReturnRate) * 1000,
      title: "Growth assumptions",
      copy: summary.inputs.appreciationRate > summary.inputs.investmentReturnRate
        ? `Home appreciation at ${formatPercent(summary.inputs.appreciationRate)} is doing more work than renter investment growth at ${formatPercent(summary.inputs.investmentReturnRate)}.`
        : `Investment growth at ${formatPercent(summary.inputs.investmentReturnRate)} is stronger than home appreciation at ${formatPercent(summary.inputs.appreciationRate)}.`,
    },
  ].sort((a, b) => b.weight - a.weight);

  insights.push({
    title: "What is driving the result?",
    copy: buyingLeads
      ? `Buying ends ahead because projected home equity reaches ${formatCurrency(summary.finalRecord.homeEquity)} by year ${summary.inputs.comparisonYears}.`
      : `Renting ends ahead because the renter investment balance reaches ${formatCurrency(summary.finalRecord.renterInvestmentBalance)} by year ${summary.inputs.comparisonYears}.`,
  });

  insights.push({
    title: `Biggest driver: ${rankedDrivers[0].title}`,
    copy: rankedDrivers[0].copy,
  });

  insights.push({
    title: `Second driver: ${rankedDrivers[1].title}`,
    copy: rankedDrivers[1].copy,
  }
  );

  insights.push({
    title: "Try a sensitivity check",
    copy: summary.inputs.appreciationRate > summary.inputs.investmentReturnRate
      ? `Try lowering home appreciation from ${formatPercent(summary.inputs.appreciationRate)} to ${formatPercent(Math.max(0, summary.inputs.appreciationRate - 1))}.`
      : `Try lowering investment return from ${formatPercent(summary.inputs.investmentReturnRate)} to ${formatPercent(Math.max(0, summary.inputs.investmentReturnRate - 1))}.`,
  });

  if (finalCostGap > 0) {
    insights.push({
      title: "Out-of-pocket cost",
      copy: `Buying costs ${formatCurrency(Math.abs(finalCostGap))} more out of pocket over the selected period, so the result depends on equity growth overcoming that extra cost.`,
    });
  } else {
    insights.push({
      title: "Out-of-pocket cost",
      copy: `Renting costs ${formatCurrency(Math.abs(finalCostGap))} more out of pocket over the selected period, which strengthens the case for buying if you stay long enough.`,
    });
  }

  return insights.slice(0, 4);
}

function buildFlipFactors(summary) {
  const factors = [];
  const buyLead = summary.finalRecord.netWorthDifference >= 0;
  const appreciationDown = Math.max(0, summary.inputs.appreciationRate - 1);
  const investDown = Math.max(0, summary.inputs.investmentReturnRate - 1);
  const monthlyGap = summary.initialBuyMonthlyCore - summary.initialRentMonthlyCore;

  factors.push({
    title: "Try changing your timeline",
    copy: summary.breakEvenYear
      ? `If you reduce your stay below ${summary.breakEvenYear} years, the answer may shift back toward ${buyLead ? "renting" : "renting staying ahead longer"}.`
      : `Lengthening the comparison period beyond ${summary.inputs.comparisonYears} years is one of the fastest ways to test whether buying can eventually catch up.`,
  });

  factors.push({
    title: "Try changing appreciation",
    copy: `Home appreciation is currently ${formatPercent(summary.inputs.appreciationRate)}. Test ${formatPercent(appreciationDown)} to see how sensitive the buy path is to weaker home growth.`,
  });

  factors.push({
    title: "Try changing investing returns",
    copy: `Investment return is currently ${formatPercent(summary.inputs.investmentReturnRate)}. Test ${formatPercent(investDown)} to see whether the renter path depends heavily on compounding.`,
  });

  factors.push({
    title: "Try changing monthly cost assumptions",
    copy: monthlyGap > 0
      ? `Buying starts ${formatCurrency(monthlyGap)} per month higher, so lowering owner costs or raising rent can change the answer faster than you might expect.`
      : monthlyGap < 0
        ? `Buying starts ${formatCurrency(Math.abs(monthlyGap))} per month cheaper, so higher owner costs or lower rent can narrow the gap quickly.`
        : "The starting monthly costs are similar, so long-term assumptions matter more than month-one cash flow.",
  });

  return factors.slice(0, 3);
}

function renderWarnings(summary) {
  const resultsStatus = $(selectors.resultsStatus);
  if (!resultsStatus) {
    return;
  }

  const assumptions = [
    `Mortgage payment uses a ${formatYears(summary.inputs.amortizationYears)} amortization.`,
    `Mortgage term is shown as ${formatYears(summary.inputs.mortgageTermYears)} for planning context.`,
    `Inflation grows taxes, insurance, fees, and flat maintenance by ${formatPercent(summary.inputs.inflationRate)} annually.`,
    summary.inputs.investMonthlySavings
      ? "Monthly renter savings are invested whenever renting costs less than buying."
      : "Monthly cost differences are not invested in the rent scenario.",
  ];

  const warningsMarkup = summary.warnings.length > 0
    ? `<ul class="status-list">${summary.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>`
    : "<p class=\"muted\">No major warnings. Your assumptions look internally consistent.</p>";

  resultsStatus.innerHTML = `
    <p class="muted">The model compares projected buying equity against renter investments over ${escapeHtml(formatYears(summary.inputs.comparisonYears))}.</p>
    ${warningsMarkup}
    <ul class="assumptions-list">${assumptions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  `;
}

function renderPrimaryResults(summary) {
  const primaryCards = $(selectors.primaryCards);
  const secondaryCards = $(selectors.secondaryCards);
  const driverInsights = $(selectors.driverInsights);
  const headline = $(selectors.resultHeadline);
  const subhead = $(selectors.resultSubhead);
  const resultAction = $(selectors.resultAction);
  const closeCallNote = $(selectors.closeCallNote);
  const resultExplain = $(selectors.resultExplain);
  const flipFactorNote = $(selectors.flipFactorNote);
  const resultBreakEven = $(selectors.resultBreakEven);
  const resultDifference = $(selectors.resultDifference);
  const resultCostGap = $(selectors.resultCostGap);
  const buySummary = $(selectors.buySummary);
  const rentSummary = $(selectors.rentSummary);
  const assumptionSummary = $(selectors.assumptionSummary);
  const investingSummary = $(selectors.investingSummary);
  const nextToolHeading = $(selectors.nextToolHeading);
  const nextToolCopy = $(selectors.nextToolCopy);
  const nextToolLink = $(selectors.nextToolLink);
  const resultToolInlineLink = $(selectors.resultToolInlineLink);
  const flipFactors = $(selectors.flipFactors);
  const relatedGrid = $(selectors.relatedGrid);
  const heroOutcome = $(selectors.heroOutcome);
  const heroOutcomeCopy = $(selectors.heroOutcomeCopy);
  const heroMonthly = $(selectors.heroMonthly);
  const heroBreakEven = $(selectors.heroBreakEven);

  const difference = summary.finalRecord.netWorthDifference;
  const absoluteDifference = Math.abs(difference);
  const buyingLeads = difference >= 0;
  const breakEvenText = summary.breakEvenYear ? `Year ${summary.breakEvenYear}` : "No break-even";
  const monthlyGap = summary.initialBuyMonthlyCore - summary.initialRentMonthlyCore;
  const totalCostGap = summary.finalRecord.cumulativeBuyCost - summary.finalRecord.cumulativeRentCost;
  const closeCall = absoluteDifference <= Math.max(15000, (summary.finalRecord.homeEquity + summary.finalRecord.renterInvestmentBalance) * 0.04);
  const resultsPanel = document.getElementById("results");
  const monthlyGapText = monthlyGap > 0
    ? `Renting starts ${formatCurrency(monthlyGap)} per month cheaper`
    : monthlyGap < 0
      ? `Buying starts ${formatCurrency(Math.abs(monthlyGap))} per month cheaper`
      : "Both paths start at about the same monthly cost";

  headline.textContent = buyingLeads
    ? `Buying may leave you ahead by ${formatCurrency(absoluteDifference)}`
    : `Renting may leave you ahead by ${formatCurrency(absoluteDifference)}`;
  subhead.textContent = buyingLeads
    ? `${summary.breakEvenYear ? `Buying becomes financially stronger in year ${summary.breakEvenYear}.` : "Buying leads over the selected period."} Appreciation plus mortgage paydown are doing more work than renting plus investing.`
    : `${summary.breakEvenYear ? `Buying only catches up in year ${summary.breakEvenYear}.` : `Buying does not catch up within ${summary.inputs.comparisonYears} years.`} The renter path benefits more from flexibility and invested savings.`;
  resultAction.textContent = buyingLeads
    ? `If you expect to stay at least ${summary.breakEvenYear || summary.inputs.comparisonYears} years, review affordability next so you know whether the buy path is comfortable month to month.`
    : `If you expect to move before ${summary.breakEvenYear || summary.inputs.comparisonYears} years, renting may remain the safer financial choice under these assumptions.`;
  closeCallNote.hidden = !closeCall;
  resultsPanel?.classList.toggle("is-close-call", closeCall);
  resultExplain.textContent = buyingLeads
    ? `Buying is stronger here because projected home equity of ${formatCurrency(summary.finalRecord.homeEquity)} ends above renter investments of ${formatCurrency(summary.finalRecord.renterInvestmentBalance)}.`
    : `Renting is stronger here because projected renter investments of ${formatCurrency(summary.finalRecord.renterInvestmentBalance)} end above home equity of ${formatCurrency(summary.finalRecord.homeEquity)}.`;
  if (summary.breakEvenYear && Math.abs(summary.inputs.comparisonYears - summary.breakEvenYear) <= 2) {
    flipFactorNote.textContent = "The most likely flip factor here is your time horizon, because your planned stay is close to the break-even point.";
  } else if (Math.abs(monthlyGap) >= 350) {
    flipFactorNote.textContent = "The most likely flip factor here is the monthly cost gap between renting and buying.";
  } else if (Math.abs(summary.inputs.appreciationRate - summary.inputs.investmentReturnRate) >= 1.5) {
    flipFactorNote.textContent = "The most likely flip factor here is the difference between home appreciation and investment return assumptions.";
  } else {
    flipFactorNote.textContent = "The most likely flip factor here is your time horizon.";
  }
  resultBreakEven.textContent = breakEvenText;
  resultDifference.textContent = formatCurrency(absoluteDifference);
  resultCostGap.textContent = `${totalCostGap >= 0 ? "Buy +" : "Rent +"}${formatCurrency(Math.abs(totalCostGap))}`;

  buySummary.textContent = `Buying starts around ${formatCurrency(summary.initialBuyMonthlyCore)} per month before appreciation and selling assumptions are factored in.`;
  rentSummary.textContent = `Renting starts around ${formatCurrency(summary.initialRentMonthlyCore)} per month including renter's insurance.`;
  assumptionSummary.textContent = `${formatYears(summary.inputs.comparisonYears)} is your comparison window, with home appreciation at ${formatPercent(summary.inputs.appreciationRate)} and investments at ${formatPercent(summary.inputs.investmentReturnRate)}.`;
  investingSummary.textContent = summary.inputs.investUpfrontCapital || summary.inputs.investMonthlySavings
    ? `The renter path is set to invest ${summary.inputs.investUpfrontCapital && summary.inputs.investMonthlySavings ? "upfront capital and monthly savings" : summary.inputs.investUpfrontCapital ? "upfront capital" : "monthly savings"} when available.`
    : "The renter path is not currently investing unused cash, so this comparison leans more heavily on housing costs and appreciation.";

  heroOutcome.textContent = buyingLeads
    ? `Buying leads by ${formatCurrency(absoluteDifference)}`
    : `Renting leads by ${formatCurrency(absoluteDifference)}`;
  heroOutcomeCopy.textContent = subhead.textContent;
  heroMonthly.textContent = `Rent ${formatCurrency(summary.initialRentMonthlyCore)} vs Buy ${formatCurrency(summary.initialBuyMonthlyCore)}`;
  heroBreakEven.textContent = summary.breakEvenYear ? `Year ${summary.breakEvenYear}` : "No break-even";

  if (buyingLeads && Math.abs(monthlyGap) > 250) {
    nextToolHeading.textContent = "Use the Budget Planner next";
    nextToolCopy.textContent = "Buying wins on paper, but a higher monthly cost can still strain cash flow. Check whether the payment fits comfortably in your budget.";
    nextToolLink.href = "https://simplekit.app/budget-planner/";
  } else if (buyingLeads) {
    nextToolHeading.textContent = "Use the Mortgage Calculator next";
    nextToolCopy.textContent = "The buy path is competitive. Refine your payment, amortization, and affordability assumptions before deciding.";
    nextToolLink.href = "https://simplekit.app/mortgage-calculator/";
  } else if (summary.inputs.investMonthlySavings || summary.inputs.investUpfrontCapital) {
    nextToolHeading.textContent = "Use the Compound Interest Calculator next";
    nextToolCopy.textContent = "Renting is ahead largely because invested savings matter. Pressure-test the return assumption with a dedicated compounding view.";
    nextToolLink.href = "https://simplekit.app/compound-interest-calculator/";
  } else {
    nextToolHeading.textContent = "Use the Net Worth Calculator next";
    nextToolCopy.textContent = "If the housing decision is close, zoom out and see how it fits inside your full financial picture.";
    nextToolLink.href = "https://simplekit.app/net-worth-calculator/";
  }

  if (resultToolInlineLink) {
    resultToolInlineLink.href = nextToolLink.href;
    resultToolInlineLink.textContent = nextToolHeading.textContent.replace(/^Use /, "").replace(/ next$/, "");
  }

  if (relatedGrid) {
    const cards = [...relatedGrid.querySelectorAll(".related-card")];
    const priority = nextToolLink.href.includes("/budget-planner/")
      ? ["budget", "mortgage", "net-worth", "compound", "paydown-invest", "retirement"]
      : nextToolLink.href.includes("/compound-interest-calculator/")
        ? ["compound", "net-worth", "budget", "mortgage", "paydown-invest", "retirement"]
        : nextToolLink.href.includes("/net-worth-calculator/")
          ? ["net-worth", "budget", "compound", "mortgage", "paydown-invest", "retirement"]
          : ["mortgage", "budget", "net-worth", "paydown-invest", "compound", "retirement"];
    cards
      .sort((a, b) => priority.indexOf(a.dataset.tool || "") - priority.indexOf(b.dataset.tool || ""))
      .forEach((card) => relatedGrid.appendChild(card));
  }

  const flipItems = buildFlipFactors(summary);
  flipFactors.innerHTML = flipItems.map((item) => `
    <article class="insight-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.copy)}</p>
    </article>
  `).join("");

  const primary = [
    {
      label: "Better financial outcome",
      value: buyingLeads ? "Buying" : "Renting",
      copy: buyingLeads
        ? "Projected ending net worth is higher in the buy path."
        : "Projected ending net worth is higher in the rent path.",
    },
    {
      label: "Net worth difference",
      value: formatCurrency(absoluteDifference),
      copy: buyingLeads ? "Buy equity minus renter investment." : "Renter investment minus buy equity.",
    },
    {
      label: "Break-even timing",
      value: summary.breakEvenYear ? `Year ${summary.breakEvenYear}` : "No break-even",
      copy: summary.breakEvenYear
        ? "Buying catches up on projected ending net worth in this year."
        : "Renting stays ahead over the selected period.",
    },
    {
      label: "Total cost gap",
      value: `${totalCostGap >= 0 ? "Buy +" : "Rent +"}${formatCurrency(Math.abs(totalCostGap))}`,
      copy: totalCostGap >= 0
        ? "Buying costs more out of pocket over the selected period."
        : "Renting costs more out of pocket over the selected period.",
    },
  ];

  const secondary = [
    {
      label: "Monthly cost: renting",
      value: formatCurrency(summary.initialRentMonthlyCore),
      copy: "Starting monthly rent plus renter's insurance.",
    },
    {
      label: "Monthly cost: buying",
      value: formatCurrency(summary.initialBuyMonthlyCore),
      copy: "Starting mortgage, taxes, insurance, maintenance, and fees.",
    },
    {
      label: "Final home equity",
      value: formatCurrency(summary.finalRecord.homeEquity),
      copy: "Projected home equity after estimated selling costs.",
    },
    {
      label: "Final renter investment",
      value: formatCurrency(summary.finalRecord.renterInvestmentBalance),
      copy: "Projected value of invested upfront capital and monthly savings.",
    },
    {
      label: "Total buy cost",
      value: formatCurrency(summary.finalRecord.cumulativeBuyCost),
      copy: "Total projected out-of-pocket housing cost for the buy path.",
    },
    {
      label: "Total rent cost",
      value: formatCurrency(summary.finalRecord.cumulativeRentCost),
      copy: "Total projected out-of-pocket housing cost for the rent path.",
    },
  ];

  primaryCards.innerHTML = primary.map((card) => `
    <article class="result-card result-card-primary">
      <span class="trust-label">${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <p>${escapeHtml(card.copy)}</p>
    </article>
  `).join("");

  secondaryCards.innerHTML = secondary.map((card) => `
    <article class="result-card">
      <span class="trust-label">${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <p>${escapeHtml(card.copy)}</p>
    </article>
  `).join("");

  const insights = buildInsightList(summary);
  driverInsights.innerHTML = insights.map((item) => `
    <article class="insight-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.copy)}</p>
    </article>
  `).join("");
}

function createLineChartMarkup(title, records, datasets, formatter, markerYear) {
  const chartHeight = 250;
  const chartWidth = 680;
  const inset = { top: 18, right: 20, bottom: 38, left: 64 };
  const points = records.length;
  const values = datasets.flatMap((dataset) => dataset.values);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  const toX = (index) => inset.left + ((chartWidth - inset.left - inset.right) * index) / Math.max(points - 1, 1);
  const toY = (value) => inset.top + ((maxValue - value) / range) * (chartHeight - inset.top - inset.bottom);
  const axisValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => maxValue - (range * ratio));

  const gridLines = axisValues.map((value) => `
    <g>
      <line x1="${inset.left}" y1="${toY(value)}" x2="${chartWidth - inset.right}" y2="${toY(value)}" class="chart-grid-line"></line>
      <text x="${inset.left - 12}" y="${toY(value) + 4}" class="chart-axis-label chart-axis-left">${escapeHtml(formatter(value))}</text>
    </g>
  `).join("");

  const lines = datasets.map((dataset) => {
    const pointsMarkup = dataset.values.map((value, index) => `${toX(index)},${toY(value)}`).join(" ");
    return `<polyline fill="none" stroke="${dataset.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${pointsMarkup}"></polyline>`;
  }).join("");

  const dots = datasets.map((dataset) => {
    const lastIndex = dataset.values.length - 1;
    return dataset.values.map((value, index) => `
      <circle cx="${toX(index)}" cy="${toY(value)}" r="${index === lastIndex ? 4 : 2.5}" fill="${dataset.color}">
        <title>${escapeHtml(dataset.label)}: ${escapeHtml(formatter(value))} in year ${records[index].year}</title>
      </circle>
    `).join("");
  }).join("");

  const xLabels = records.map((record, index) => `
    <text x="${toX(index)}" y="${chartHeight - 12}" class="chart-axis-label chart-axis-bottom">${record.year}</text>
  `).join("");

  let marker = "";
  if (markerYear) {
    const markerIndex = records.findIndex((record) => record.year === markerYear);
    if (markerIndex >= 0) {
      marker = `
        <line x1="${toX(markerIndex)}" y1="${inset.top}" x2="${toX(markerIndex)}" y2="${chartHeight - inset.bottom}" class="chart-break-even-line"></line>
      `;
    }
  }

  return `
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="${escapeHtml(title)}">
      ${gridLines}
      <line x1="${inset.left}" y1="${chartHeight - inset.bottom}" x2="${chartWidth - inset.right}" y2="${chartHeight - inset.bottom}" class="chart-axis"></line>
      <line x1="${inset.left}" y1="${inset.top}" x2="${inset.left}" y2="${chartHeight - inset.bottom}" class="chart-axis"></line>
      ${marker}
      ${lines}
      ${dots}
      ${xLabels}
    </svg>
  `;
}

function createLegendMarkup(datasets) {
  return datasets.map((dataset) => `
    <span class="chart-legend-item"><i style="background:${dataset.color}"></i>${escapeHtml(dataset.label)}</span>
  `).join("");
}

function renderActiveChart(summary) {
  const chartMeta = CHART_META[uiState.activeChart];
  const activeChart = $(selectors.activeChart);
  const chartTitle = $(selectors.chartTitle);
  const chartDescription = $(selectors.chartDescription);
  const chartInsight = $(selectors.chartInsight);
  const chartLegend = $(selectors.chartLegend);

  let datasets;
  if (uiState.activeChart === "cost") {
    datasets = [
      { label: "Buy cost", color: "#f08a38", values: summary.records.map((record) => record.cumulativeBuyCost) },
      { label: "Rent cost", color: "#5c6f88", values: summary.records.map((record) => record.cumulativeRentCost) },
    ];
  } else if (uiState.activeChart === "wealth") {
    datasets = [
      { label: "Home equity", color: "#0b345f", values: summary.records.map((record) => record.homeEquity) },
      { label: "Renter investment", color: "#13a39a", values: summary.records.map((record) => record.renterInvestmentBalance) },
    ];
  } else {
    datasets = [
      { label: "Buy net worth", color: "#0f6abf", values: summary.records.map((record) => record.homeEquity) },
      { label: "Rent net worth", color: "#13a39a", values: summary.records.map((record) => record.renterInvestmentBalance) },
    ];
  }

  chartTitle.textContent = chartMeta.title;
  chartDescription.textContent = chartMeta.description;
  chartLegend.innerHTML = createLegendMarkup(datasets);
  chartInsight.textContent = uiState.activeChart === "netWorth"
    ? summary.breakEvenYear
      ? `${chartMeta.insight} Buying catches up around year ${summary.breakEvenYear}, so the timeline is doing a lot of the work in this scenario.`
      : `${chartMeta.insight} Renting stays ahead over ${summary.inputs.comparisonYears} years, which means the renter investment path never gets overtaken in this window.`
    : uiState.activeChart === "cost"
      ? `${chartMeta.insight} ${summary.finalRecord.cumulativeBuyCost > summary.finalRecord.cumulativeRentCost ? "Buying asks for more cash along the way, so it needs equity growth to justify that extra cost." : "Renting asks for more cash along the way, which makes buying easier to justify if you stay long enough."}`
      : `${chartMeta.insight} ${summary.finalRecord.homeEquity > summary.finalRecord.renterInvestmentBalance ? "Home equity finishes higher, so appreciation and paydown are winning this comparison." : "Renter investments finish higher, so flexibility plus compounding is winning this comparison."}`;
  activeChart.innerHTML = createLineChartMarkup(chartMeta.title, summary.records, datasets, formatCurrency, uiState.activeChart === "netWorth" ? summary.breakEvenYear : null);
}

function renderTable(summary) {
  const body = $(selectors.tableBody);
  if (!body) {
    return;
  }

  body.innerHTML = summary.records
    .filter((record) => record.year > 0)
    .map((record) => `
      <tr>
        <th scope="row">${record.year}</th>
        <td>${formatCurrency(record.annualRentCost)}</td>
        <td>${formatCurrency(record.annualBuyCost)}</td>
        <td>${formatCurrency(record.mortgageBalance)}</td>
        <td>${formatCurrency(record.homeValue)}</td>
        <td>${formatCurrency(record.homeEquity)}</td>
        <td>${formatCurrency(record.renterInvestmentBalance)}</td>
        <td class="${record.netWorthDifference >= 0 ? "positive" : "negative"}">
          ${record.netWorthDifference >= 0 ? "Buy +" : "Rent +"}${formatCurrency(Math.abs(record.netWorthDifference))}
        </td>
      </tr>
    `).join("");
}

function setMode(mode) {
  uiState.mode = mode;
  document.querySelectorAll(".advanced-field").forEach((element) => {
    element.hidden = mode !== "advanced";
  });
  document.querySelectorAll(".advanced-group").forEach((element) => {
    element.hidden = mode !== "advanced";
  });
  $(selectors.basicModeBtn)?.classList.toggle("is-active", mode === "basic");
  $(selectors.advancedModeBtn)?.classList.toggle("is-active", mode === "advanced");
}

function updateMaintenanceVisibility() {
  const mode = getForm()?.elements.maintenanceMode.value || DEFAULT_STATE.maintenanceMode;
  document.querySelectorAll("[data-maintenance-field]").forEach((element) => {
    const inAdvancedGroup = element.closest(".advanced-group");
    const show = element.getAttribute("data-maintenance-field") === mode;
    element.hidden = uiState.mode !== "advanced" || !show || (inAdvancedGroup?.hidden ?? false);
  });
}

function initializeMobileCards() {
  document.querySelectorAll(selectors.mobileCards).forEach((card, index) => {
    const header = card.querySelector(".card-header");
    const contentNodes = [...card.children].filter((child) => !child.classList.contains("card-header"));
    if (!header || card.dataset.mobileReady === "true") {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-card-toggle";
    button.setAttribute("aria-expanded", index === 0 ? "true" : "false");
    button.innerHTML = `<span>${header.querySelector("h3")?.textContent || "Section"}</span><strong>${index === 0 ? "Hide" : "Show"}</strong>`;
    header.appendChild(button);

    const wrapper = document.createElement("div");
    wrapper.className = "mobile-card-content";
    if (index !== 0) {
      wrapper.hidden = true;
    }
    contentNodes.forEach((node) => wrapper.appendChild(node));
    card.appendChild(wrapper);

    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", expanded ? "false" : "true");
      button.querySelector("strong").textContent = expanded ? "Show" : "Hide";
      wrapper.hidden = expanded;
    });

    card.dataset.mobileReady = "true";
  });

  syncMobileCards();
}

function syncMobileCards() {
  const mobileLayout = window.matchMedia("(max-width: 719px)").matches;
  document.querySelectorAll(selectors.mobileCards).forEach((card) => {
    const button = card.querySelector(".mobile-card-toggle");
    const wrapper = card.querySelector(".mobile-card-content");
    if (!button || !wrapper) {
      return;
    }

    if (!mobileLayout) {
      wrapper.hidden = false;
      return;
    }

    const expanded = button.getAttribute("aria-expanded") === "true";
    wrapper.hidden = !expanded;
    const label = button.querySelector("strong");
    if (label) {
      label.textContent = expanded ? "Hide" : "Show";
    }
  });
}

async function copyShareLink() {
  const feedback = $(selectors.shareFeedback);
  const fallbackCopy = () => {
    const helper = document.createElement("textarea");
    helper.value = window.location.href;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    helper.style.pointerEvents = "none";
    document.body.appendChild(helper);
    helper.focus();
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    document.body.removeChild(helper);
    return copied;
  };

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(window.location.href);
    } else if (!fallbackCopy()) {
      throw new Error("Clipboard API unavailable");
    }
    if (feedback) {
      feedback.textContent = "Scenario link copied.";
    }
  } catch (error) {
    if (fallbackCopy()) {
      if (feedback) {
        feedback.textContent = "Scenario link copied.";
      }
      return;
    }
    if (feedback) {
      feedback.textContent = `Copy unavailable here. Share this URL manually: ${window.location.href}`;
    }
  }
}

function render() {
  const rawState = readFormState();
  const summary = calculateScenario(rawState);
  state = { ...summary.inputs };
  setFormState(state);
  saveToLocalStorage(state);
  syncUrl(state);
  renderWarnings(summary);
  renderPrimaryResults(summary);
  renderActiveChart(summary);
  renderTable(summary);
}

function bindEvents() {
  const form = getForm();
  if (form) {
    form.addEventListener("input", render);
    form.addEventListener("change", render);
  }

  $(selectors.maintenanceMode)?.addEventListener("change", updateMaintenanceVisibility);
  $(selectors.basicModeBtn)?.addEventListener("click", () => {
    setMode("basic");
    render();
  });
  $(selectors.advancedModeBtn)?.addEventListener("click", () => {
    setMode("advanced");
    render();
  });

  document.querySelectorAll(selectors.presetBtns).forEach((button) => {
    button.addEventListener("click", () => {
      const presetName = button.getAttribute("data-preset");
      if (presetName && PRESETS[presetName]) {
        setFormState(PRESETS[presetName]);
        render();
      }
    });
  });

  $(selectors.resetBtn)?.addEventListener("click", () => {
    setFormState(DEFAULT_STATE);
    setMode("basic");
    render();
  });

  $(selectors.shareBtn)?.addEventListener("click", copyShareLink);

  document.querySelectorAll(selectors.chartTabs).forEach((button) => {
    button.addEventListener("click", () => {
      uiState.activeChart = button.getAttribute("data-chart") || "netWorth";
      document.querySelectorAll(selectors.chartTabs).forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });
      render();
    });
  });

  window.addEventListener("resize", syncMobileCards);
}

function initialize() {
  const restored = restoreFromUrl() || restoreFromLocalStorage() || DEFAULT_STATE;
  setFormState(restored);
  initializeMobileCards();
  setMode("basic");
  bindEvents();
  render();
}

initialize();
})();
