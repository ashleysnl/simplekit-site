const TEMPLATE = {
  canonicalUrl: "https://simplekit.app/mortgage-paydown-vs-invest-calculator/",
  socialImageUrl: "https://simplekit.app/mortgage-paydown-vs-invest-calculator/icons/icon.svg",
  supportUrl: "https://buymeacoffee.com/ashleysnl",
  storageKey: "simplekit.mortgage-vs-invest.v1",
  seoDescription:
    "Compare paying down your mortgage faster versus investing in Canada. Model TFSA, RRSP, taxable investing, and mortgage-interest tradeoffs in one planner.",
};

const ROUTES = {
  relatedTools: {
    tfsaRrsp: "https://simplekit.app/rrsp-vs-tfsa-calculator/",
    fire: "https://simplekit.app/fire-calculator/",
    netWorth: "https://simplekit.app/net-worth-calculator/",
    retirement: "https://simplekit.app/retirement-planner/",
    cpp: "https://simplekit.app/cpp-calculator/",
  },
};

const DEFAULTS = {
  mortgageBalance: 425000,
  mortgageRate: 4.75,
  amortizationYears: 22,
  monthlyPayment: 2700,
  extraMonthly: 500,
  homeValue: 640000,
  investmentReturn: 5.5,
  accountType: "tfsa",
  taxDrag: 0,
  mer: 0.25,
  timeHorizonYears: 10,
  inflation: 2,
  homeGrowth: 2,
  lumpSum: 0,
  contributionTiming: "end",
  compoundMode: "monthly",
};

const SAMPLE_DATA = {
  mortgageBalance: 510000,
  mortgageRate: 4.89,
  amortizationYears: 25,
  monthlyPayment: 2925,
  extraMonthly: 750,
  homeValue: 735000,
  investmentReturn: 6,
  accountType: "tfsa",
  taxDrag: 0,
  mer: 0.2,
  timeHorizonYears: 15,
  inflation: 2,
  homeGrowth: 2,
  lumpSum: 10000,
  contributionTiming: "end",
  compoundMode: "monthly",
};

const RELATED_TOOLS = [
  {
    name: "TFSA / RRSP Calculator",
    href: ROUTES.relatedTools.tfsaRrsp,
    description: "See where extra investing dollars may be most tax-efficient.",
  },
  {
    name: "FIRE Calculator",
    href: ROUTES.relatedTools.fire,
    description: "Test how mortgage decisions influence your path to financial independence.",
  },
  {
    name: "Net Worth Calculator",
    href: ROUTES.relatedTools.netWorth,
    description: "Place this mortgage choice in the context of your full balance sheet.",
  },
  {
    name: "Retirement Planner",
    href: ROUTES.relatedTools.retirement,
    description: "Model how debt payoff and investing affect long-term retirement readiness.",
  },
  {
    name: "CPP Calculator",
    href: ROUTES.relatedTools.cpp,
    description: "Round out your Canadian retirement plan with estimated CPP income.",
  },
];

const el = {
  form: document.getElementById("calculatorForm"),
  snapshotGrid: document.getElementById("snapshotGrid"),
  metricGrid: document.getElementById("metricGrid"),
  comparisonGrid: document.getElementById("comparisonGrid"),
  interpretationNote: document.getElementById("interpretationNote"),
  winnerCallout: document.getElementById("winnerCallout"),
  warningBox: document.getElementById("warningBox"),
  confidenceBadge: document.getElementById("confidenceBadge"),
  scenarioCards: document.getElementById("scenarioCards"),
  breakEvenCards: document.getElementById("breakEvenCards"),
  breakEvenSummary: document.getElementById("breakEvenSummary"),
  horizonTable: document.getElementById("horizonTable"),
  relatedToolsGrid: document.getElementById("relatedToolsGrid"),
  advancedSettings: document.getElementById("advancedSettings"),
  sampleDataBtn: document.getElementById("sampleDataBtn"),
  resetInputsBtn: document.getElementById("resetInputsBtn"),
  netWorthChart: document.getElementById("netWorthChart"),
  mortgageChart: document.getElementById("mortgageChart"),
  investmentChart: document.getElementById("investmentChart"),
  outcomeChart: document.getElementById("outcomeChart"),
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
};

const fields = [
  "mortgageBalance",
  "mortgageRate",
  "amortizationYears",
  "monthlyPayment",
  "extraMonthly",
  "homeValue",
  "investmentReturn",
  "accountType",
  "taxDrag",
  "mer",
  "timeHorizonYears",
  "inflation",
  "homeGrowth",
  "lumpSum",
  "contributionTiming",
  "compoundMode",
];

let state = loadState();
let chartFrame = null;

init();

function init() {
  syncMeta();
  renderRelatedTools();
  applyInputs(state);
  bindEvents();
  render();
}

function bindEvents() {
  el.form?.addEventListener("input", handleFormChange);
  el.form?.addEventListener("change", handleFormChange);
  el.sampleDataBtn?.addEventListener("click", () => {
    state = { ...SAMPLE_DATA };
    applyInputs(state);
    saveState();
    render();
    trackEvent("load_sample_data", { source: "calculator" });
  });
  el.resetInputsBtn?.addEventListener("click", () => {
    state = { ...DEFAULTS };
    applyInputs(state);
    saveState();
    render();
    trackEvent("reset_calculator", { source: "calculator" });
  });
  el.advancedSettings?.addEventListener("toggle", () => {
    trackEvent("toggle_advanced_settings", { open: el.advancedSettings.open ? "true" : "false" });
  });
  window.addEventListener("resize", scheduleCharts);
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEMPLATE.storageKey) || "null");
    return normalizeState(saved || DEFAULTS);
  } catch {
    return { ...DEFAULTS };
  }
}

function saveState() {
  localStorage.setItem(TEMPLATE.storageKey, JSON.stringify(state));
}

function normalizeState(input) {
  const next = { ...DEFAULTS };
  for (const field of fields) {
    if (field === "accountType" || field === "contributionTiming" || field === "compoundMode") {
      next[field] = String(input[field] || next[field]);
      continue;
    }
    next[field] = toNumber(input[field], next[field]);
  }
  return next;
}

function applyInputs(values) {
  for (const field of fields) {
    const node = document.getElementById(field);
    if (!node) continue;
    node.value = values[field];
  }
}

function handleFormChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.id) return;
  const id = target.id;
  if (!fields.includes(id)) return;

  if (id === "accountType" || id === "contributionTiming" || id === "compoundMode") {
    state[id] = String(target.value || DEFAULTS[id]);
  } else {
    state[id] = toNumber(target.value, DEFAULTS[id]);
  }

  saveState();
  render();
  if (id !== "timeHorizonYears") {
    trackEvent("calculator_interaction", { field: id });
  }
}

function render() {
  const inputs = normalizeState(state);
  const results = calculateScenario(inputs);
  renderSnapshot(results, inputs);
  renderSummary(results, inputs);
  renderComparison(results);
  renderSensitivity(inputs, results);
  scheduleCharts(results, inputs);
}

function calculateScenario(inputs) {
  const horizonMonths = clamp(Math.round(inputs.timeHorizonYears * 12), 1, 600);
  const maxMonths = clamp(Math.max(horizonMonths, Math.round(inputs.amortizationYears * 12)), 1, 600);
  const strategyA = simulateStrategy({
    principal: inputs.mortgageBalance,
    annualMortgageRate: inputs.mortgageRate,
    annualInvestmentReturn: inputs.investmentReturn,
    annualFee: inputs.mer,
    annualTaxDrag: effectiveTaxDrag(inputs.accountType, inputs.taxDrag),
    monthlyPayment: inputs.monthlyPayment,
    extraMonthly: inputs.extraMonthly,
    months: maxMonths,
    mortgageLumpSum: inputs.lumpSum,
    investmentLumpSum: 0,
    investWhileMortgageActive: 0,
    investAfterPayoff: inputs.monthlyPayment + inputs.extraMonthly,
    contributionTiming: inputs.contributionTiming,
    compoundMode: inputs.compoundMode,
  });
  const strategyB = simulateStrategy({
    principal: inputs.mortgageBalance,
    annualMortgageRate: inputs.mortgageRate,
    annualInvestmentReturn: inputs.investmentReturn,
    annualFee: inputs.mer,
    annualTaxDrag: effectiveTaxDrag(inputs.accountType, inputs.taxDrag),
    monthlyPayment: inputs.monthlyPayment,
    extraMonthly: 0,
    months: maxMonths,
    mortgageLumpSum: 0,
    investmentLumpSum: inputs.lumpSum,
    investWhileMortgageActive: inputs.extraMonthly,
    investAfterPayoff: inputs.monthlyPayment + inputs.extraMonthly,
    contributionTiming: inputs.contributionTiming,
    compoundMode: inputs.compoundMode,
  });

  const homeSeries = buildHomeSeries(inputs.homeValue, inputs.homeGrowth, maxMonths, inputs.compoundMode);
  const inflationSeries = buildInflationSeries(inputs.inflation, maxMonths, inputs.compoundMode);

  const series = [];
  for (let month = 0; month <= horizonMonths; month += 1) {
    const homeValue = homeSeries[month];
    const inflationFactor = inflationSeries[month];
    const mortgageBalanceA = strategyA.balanceSeries[Math.min(month, strategyA.balanceSeries.length - 1)];
    const mortgageBalanceB = strategyB.balanceSeries[Math.min(month, strategyB.balanceSeries.length - 1)];
    const investValueA = strategyA.investmentSeries[Math.min(month, strategyA.investmentSeries.length - 1)];
    const investValueB = strategyB.investmentSeries[Math.min(month, strategyB.investmentSeries.length - 1)];
    const netWorthA = homeValue - mortgageBalanceA + investValueA;
    const netWorthB = homeValue - mortgageBalanceB + investValueB;
    series.push({
      month,
      year: month / 12,
      homeValue,
      mortgageBalanceA,
      mortgageBalanceB,
      investValueA,
      investValueB,
      netWorthA,
      netWorthB,
      realNetWorthA: netWorthA / inflationFactor,
      realNetWorthB: netWorthB / inflationFactor,
      inflationFactor,
    });
  }

  const horizonPoint = series[series.length - 1];
  const netWorthDifference = horizonPoint.netWorthB - horizonPoint.netWorthA;
  const realNetWorthDifference = horizonPoint.realNetWorthB - horizonPoint.realNetWorthA;
  const interestSaved = strategyB.interestAt(horizonMonths) - strategyA.interestAt(horizonMonths);
  const payoffA = strategyA.payoffMonth;
  const payoffB = strategyB.payoffMonth;
  const breakEven = estimateBreakEven(inputs, horizonPoint.netWorthA);
  const warnings = [];

  if (inputs.monthlyPayment <= inputs.mortgageBalance * (inputs.mortgageRate / 100 / 12)) {
    warnings.push("The current monthly payment is close to or below monthly interest. The mortgage may not amortize as entered.");
  }
  if (inputs.extraMonthly === 0 && inputs.lumpSum === 0) {
    warnings.push("No extra cash flow is being redirected yet, so the two strategies will stay close until other assumptions change.");
  }
  if (inputs.investmentReturn <= inputs.mortgageRate) {
    warnings.push("Your expected investment return is at or below the mortgage rate, which often favours prepayment after fees and taxes.");
  }

  return {
    inputs,
    series,
    horizonMonths,
    strategyA,
    strategyB,
    horizonPoint,
    netWorthDifference,
    realNetWorthDifference,
    interestSaved,
    payoffA,
    payoffB,
    breakEven,
    warnings,
  };
}

function simulateStrategy({
  principal,
  annualMortgageRate,
  annualInvestmentReturn,
  annualFee,
  annualTaxDrag,
  monthlyPayment,
  extraMonthly,
  months,
  mortgageLumpSum,
  investmentLumpSum,
  investWhileMortgageActive,
  investAfterPayoff,
  contributionTiming,
  compoundMode,
}) {
  let balance = Math.max(0, principal - Math.max(0, mortgageLumpSum));
  let investmentBalance = Math.max(0, investmentLumpSum);
  let totalInterest = 0;
  let payoffMonth = balance <= 0 ? 0 : null;
  const balanceSeries = [balance];
  const interestSeries = [0];
  const investmentSeries = [investmentBalance];
  const monthlyMortgageRate = monthlyRateFromAnnual(annualMortgageRate, "annual");
  const monthlyInvestmentRate = monthlyRateFromAnnual(
    annualInvestmentReturn - annualFee - annualTaxDrag,
    compoundMode,
  );

  for (let month = 1; month <= months; month += 1) {
    const mortgageWasActive = balance > 0;
    const monthlyContribution = mortgageWasActive ? investWhileMortgageActive : investAfterPayoff;

    if (contributionTiming === "start") {
      investmentBalance += Math.max(0, monthlyContribution);
    }

    if (balance <= 0) {
      balanceSeries.push(0);
      interestSeries.push(totalInterest);
      investmentBalance *= 1 + monthlyInvestmentRate;
      if (contributionTiming !== "start") {
        investmentBalance += Math.max(0, monthlyContribution);
      }
      investmentSeries.push(Math.max(0, investmentBalance));
      if (payoffMonth === null) payoffMonth = month - 1;
      continue;
    }

    const interest = balance * monthlyMortgageRate;
    const payment = Math.max(0, monthlyPayment + extraMonthly);
    let principalPaid = payment - interest;
    if (principalPaid < 0) principalPaid = 0;
    if (principalPaid > balance) principalPaid = balance;
    balance = Math.max(0, balance - principalPaid);
    totalInterest += Math.max(0, interest);
    investmentBalance *= 1 + monthlyInvestmentRate;
    if (contributionTiming !== "start") {
      investmentBalance += Math.max(0, monthlyContribution);
    }
    investmentBalance = Math.max(0, investmentBalance);

    if (balance <= 0 && payoffMonth === null) payoffMonth = month;

    balanceSeries.push(balance);
    interestSeries.push(totalInterest);
    investmentSeries.push(investmentBalance);
  }

  return {
    balanceSeries,
    interestSeries,
    investmentSeries,
    payoffMonth,
    totalInterest,
    interestAt(month) {
      return interestSeries[Math.min(month, interestSeries.length - 1)];
    },
  };
}

function buildHomeSeries(homeValue, annualGrowth, months, compoundMode) {
  const monthly = monthlyRateFromAnnual(annualGrowth, compoundMode);
  const series = [Math.max(0, homeValue)];
  let value = Math.max(0, homeValue);
  for (let month = 1; month <= months; month += 1) {
    value *= 1 + monthly;
    series.push(value);
  }
  return series;
}

function buildInflationSeries(inflation, months, compoundMode) {
  const monthly = monthlyRateFromAnnual(inflation, compoundMode);
  const series = [1];
  let value = 1;
  for (let month = 1; month <= months; month += 1) {
    value *= 1 + monthly;
    series.push(value);
  }
  return series;
}

function effectiveTaxDrag(accountType, taxDrag) {
  if (accountType === "tfsa") return taxDrag;
  if (accountType === "rrsp") return Math.max(0, taxDrag * 0.6);
  if (accountType === "taxable") return Math.max(taxDrag, 0.75);
  return taxDrag;
}

function estimateBreakEven(inputs, targetNetWorthA) {
  const low = -5;
  const high = 15;
  const lowResult = netWorthForReturn(inputs, low);
  const highResult = netWorthForReturn(inputs, high);

  if (Math.abs(lowResult - targetNetWorthA) < 25) return low;
  if (Math.abs(highResult - targetNetWorthA) < 25) return high;
  if ((lowResult - targetNetWorthA) * (highResult - targetNetWorthA) > 0) {
    return lowResult > targetNetWorthA ? { direction: "below", rate: low } : { direction: "above", rate: high };
  }

  let min = low;
  let max = high;
  let minValue = lowResult;
  for (let i = 0; i < 32; i += 1) {
    const mid = (min + max) / 2;
    const value = netWorthForReturn(inputs, mid);
    if ((value - targetNetWorthA) * (minValue - targetNetWorthA) > 0) {
      min = mid;
      minValue = value;
    } else {
      max = mid;
    }
  }

  return (min + max) / 2;
}

function netWorthForReturn(inputs, annualReturn) {
  const clone = { ...inputs, investmentReturn: annualReturn };
  const months = clamp(Math.round(inputs.timeHorizonYears * 12), 1, 600);
  const investStrategy = simulateStrategy({
    principal: clone.mortgageBalance,
    annualMortgageRate: clone.mortgageRate,
    annualInvestmentReturn: annualReturn,
    annualFee: clone.mer,
    annualTaxDrag: effectiveTaxDrag(clone.accountType, clone.taxDrag),
    monthlyPayment: clone.monthlyPayment,
    extraMonthly: 0,
    months,
    mortgageLumpSum: 0,
    investmentLumpSum: clone.lumpSum,
    investWhileMortgageActive: clone.extraMonthly,
    investAfterPayoff: clone.monthlyPayment + clone.extraMonthly,
    contributionTiming: clone.contributionTiming,
    compoundMode: clone.compoundMode,
  });
  const homeValue = buildHomeSeries(clone.homeValue, clone.homeGrowth, months, clone.compoundMode)[months];
  return homeValue - investStrategy.balanceSeries[months] + investStrategy.investmentSeries[months];
}

function renderSnapshot(results, inputs) {
  const winner = results.netWorthDifference >= 0 ? "Investing" : "Mortgage prepayment";
  const snapshotItems = [
    {
      label: "Current tilt",
      value: winner,
      sub: `${formatCurrency(Math.abs(results.netWorthDifference))} nominal, ${formatCurrency(Math.abs(results.realNetWorthDifference))} in today's dollars`,
    },
    {
      label: "Mortgage rate",
      value: formatPercent(inputs.mortgageRate),
      sub: "Guaranteed savings benchmark",
    },
    {
      label: "Expected net return",
      value: formatPercent(inputs.investmentReturn - inputs.mer - effectiveTaxDrag(inputs.accountType, inputs.taxDrag)),
      sub: `${accountTypeLabel(inputs.accountType)} assumption`,
    },
    {
      label: "Extra cash flow",
      value: formatCurrency(inputs.extraMonthly),
      sub: inputs.lumpSum ? `${formatCurrency(inputs.lumpSum)} lump sum included` : "Monthly comparison amount",
    },
  ];

  el.snapshotGrid.innerHTML = snapshotItems.map(renderMetricCard).join("");
}

function renderSummary(results, inputs) {
  const investAhead = results.netWorthDifference >= 0;
  const winnerLabel = investAhead ? "Investing comes out ahead" : "Paying down the mortgage comes out ahead";
  const payoffA = payoffText(results.payoffA);
  const payoffB = payoffText(results.payoffB);
  const paydownTimeSaved = payoffTimeSaved(results.payoffA, results.payoffB);
  const note = buildInterpretation(results, inputs, investAhead);
  const warningHtml = results.warnings.map((item) => `<p>${escapeHtml(item)}</p>`).join("");

  el.confidenceBadge.textContent = investAhead ? "Expected growth wins" : "Guaranteed savings wins";
  el.winnerCallout.className = `winner-callout ${Math.abs(results.netWorthDifference) < 10000 ? "caution" : "positive"}`;
  el.winnerCallout.innerHTML = `
    <strong>${escapeHtml(winnerLabel)} by an estimated ${escapeHtml(formatCurrency(Math.abs(results.netWorthDifference)))}.</strong>
    <p>At the ${escapeHtml(String(inputs.timeHorizonYears))}-year horizon, strategy A reaches ${escapeHtml(formatCurrency(results.horizonPoint.netWorthA))} and strategy B reaches ${escapeHtml(formatCurrency(results.horizonPoint.netWorthB))}. In today's dollars, the gap is ${escapeHtml(formatCurrency(Math.abs(results.realNetWorthDifference)))}.</p>
  `;

  const metrics = [
    {
      label: "Net worth difference",
      value: formatCurrency(Math.abs(results.netWorthDifference)),
      sub: investAhead ? "Invest strategy ahead" : "Mortgage strategy ahead",
    },
    {
      label: "Mortgage payoff",
      value: payoffA,
      sub: `Prepay strategy vs ${payoffB} when investing`,
    },
    {
      label: "Interest paid",
      value: formatCurrency(results.strategyA.interestAt(results.horizonMonths)),
      sub: `${formatCurrency(results.interestSaved)} less with prepayments`,
    },
    {
      label: "Investment value",
      value: formatCurrency(results.horizonPoint.investValueB),
      sub: "Projected under invest strategy",
    },
    {
      label: "Home equity",
      value: formatCurrency(results.horizonPoint.homeValue - results.horizonPoint.mortgageBalanceA),
      sub: "At horizon under mortgage strategy",
    },
    {
      label: "Real net worth difference",
      value: formatCurrency(Math.abs(results.realNetWorthDifference)),
      sub: "Inflation-adjusted to today's dollars",
    },
    {
      label: "Break-even return",
      value: breakEvenLabel(results.breakEven),
      sub: "Estimated annual return needed",
    },
  ];

  el.metricGrid.innerHTML = metrics.map(renderMetricCard).join("");
  el.interpretationNote.textContent = `${note} ${paydownTimeSaved ? `Prepaying shortens payoff by ${paydownTimeSaved}.` : ""}`;
  el.warningBox.hidden = !results.warnings.length;
  el.warningBox.innerHTML = warningHtml;
}

function renderComparison(results) {
  const mortgageEquity = results.horizonPoint.homeValue - results.horizonPoint.mortgageBalanceA;
  const investEquity = results.horizonPoint.homeValue - results.horizonPoint.mortgageBalanceB;

  el.comparisonGrid.innerHTML = `
    <article class="subsection strategy-card" data-tone="mortgage">
      <header>
        <div>
          <h3>Strategy A - Pay down mortgage</h3>
          <p class="muted small-copy">Extra monthly cash and any lump sum go directly to the mortgage.</p>
        </div>
        <span class="offline-badge">Guaranteed savings</span>
      </header>
      <div class="kpi-list">
        ${renderKpiRow("Paid off sooner by", payoffTimeSaved(results.payoffA, results.payoffB) || "No change")}
        ${renderKpiRow("Total interest saved", formatCurrency(results.interestSaved))}
        ${renderKpiRow("Mortgage balance at horizon", formatCurrency(results.horizonPoint.mortgageBalanceA))}
        ${renderKpiRow("Home equity at horizon", formatCurrency(mortgageEquity))}
        ${renderKpiRow("Post-payoff investment value", formatCurrency(results.horizonPoint.investValueA))}
        ${renderKpiRow("Estimated net worth", formatCurrency(results.horizonPoint.netWorthA))}
      </div>
    </article>
    <article class="subsection strategy-card" data-tone="invest">
      <header>
        <div>
          <h3>Strategy B - Invest instead</h3>
          <p class="muted small-copy">Mortgage stays on the regular schedule while extra cash is invested.</p>
        </div>
        <span class="offline-badge">Market-dependent</span>
      </header>
      <div class="kpi-list">
        ${renderKpiRow("Projected investment value", formatCurrency(results.horizonPoint.investValueB))}
        ${renderKpiRow("Mortgage balance at horizon", formatCurrency(results.horizonPoint.mortgageBalanceB))}
        ${renderKpiRow("Total mortgage interest", formatCurrency(results.strategyB.interestAt(results.horizonMonths)))}
        ${renderKpiRow("Home equity at horizon", formatCurrency(investEquity))}
        ${renderKpiRow("Mortgage payoff timing", payoffText(results.payoffB))}
        ${renderKpiRow("Estimated net worth", formatCurrency(results.horizonPoint.netWorthB))}
      </div>
    </article>
  `;
}

function renderSensitivity(inputs, results) {
  const scenarioRates = [3, 5, 7];
  el.scenarioCards.innerHTML = scenarioRates
    .map((rate) => {
      const value = netWorthForReturn(inputs, rate);
      const diff = value - results.horizonPoint.netWorthA;
      return `
        <article class="mini-card">
          <span class="label">${rate}% return</span>
          <span class="value">${formatCurrency(Math.abs(diff))}</span>
          <span class="sub">${diff >= 0 ? "Investing ahead" : "Mortgage ahead"} at ${inputs.timeHorizonYears} years</span>
        </article>
      `;
    })
    .join("");

  const breakEvenCards = [
    {
      label: "Break-even return",
      value: breakEvenLabel(results.breakEven),
      sub: "Approximate annual return",
    },
    {
      label: "Mortgage prepay edge",
      value: formatCurrency(results.interestSaved),
      sub: "Interest avoided over the selected horizon",
    },
    {
      label: "Real-dollar gap",
      value: formatCurrency(Math.abs(results.realNetWorthDifference)),
      sub: `Using ${formatPercent(inputs.inflation)} inflation`,
    },
  ];
  el.breakEvenCards.innerHTML = breakEvenCards.map(renderMetricCard).join("");

  el.breakEvenSummary.textContent = typeof results.breakEven === "number"
    ? `Investing would need to earn roughly ${formatPercent(results.breakEven)} annually to match the mortgage-prepayment strategy by year ${inputs.timeHorizonYears}.`
    : results.breakEven.direction === "above"
      ? `Even a ${formatPercent(results.breakEven.rate)} return is still below the mortgage-prepayment result in this scenario.`
      : `The invest strategy is already ahead even if annual returns fall below ${formatPercent(results.breakEven.rate)}.`;

  const horizonOptions = [5, 10, 15, 20].filter((value, index, array) => array.indexOf(value) === index);
  el.horizonTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Horizon</th>
          <th>Mortgage strategy</th>
          <th>Invest strategy</th>
          <th>Difference</th>
        </tr>
      </thead>
      <tbody>
        ${horizonOptions
          .map((years) => {
            const scenario = calculateScenario({ ...inputs, timeHorizonYears: years });
            const diff = scenario.netWorthDifference;
            return `
              <tr>
                <td>${years} years</td>
                <td>${formatCurrency(scenario.horizonPoint.netWorthA)}</td>
                <td>${formatCurrency(scenario.horizonPoint.netWorthB)}</td>
                <td>${diff >= 0 ? "Invest +" : "Mortgage +"}${formatCurrency(Math.abs(diff))}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function scheduleCharts(results = null, inputs = null) {
  if (chartFrame) cancelAnimationFrame(chartFrame);
  chartFrame = requestAnimationFrame(() => {
    const nextInputs = inputs || normalizeState(state);
    const nextResults = results || calculateScenario(nextInputs);
    renderCharts(nextResults);
  });
}

function renderCharts(results) {
  renderLineChart(el.netWorthChart, {
    title: "Net worth",
    series: [
      { label: "Pay down mortgage", color: "#0f6abf", values: results.series.map((point) => point.netWorthA) },
      { label: "Invest instead", color: "#0ea5a8", values: results.series.map((point) => point.netWorthB) },
    ],
    labels: results.series.map((point) => point.year),
    currency: true,
  });

  renderLineChart(el.mortgageChart, {
    title: "Mortgage balance",
    series: [
      { label: "Pay down mortgage", color: "#0f6abf", values: results.series.map((point) => point.mortgageBalanceA) },
      { label: "Invest instead", color: "#ff8c42", values: results.series.map((point) => point.mortgageBalanceB) },
    ],
    labels: results.series.map((point) => point.year),
    currency: true,
  });

  renderLineChart(el.investmentChart, {
    title: "Investment growth",
    series: [
      { label: "Pay down mortgage", color: "#0f6abf", values: results.series.map((point) => point.investValueA) },
      { label: "Invest instead", color: "#16a34a", values: results.series.map((point) => point.investValueB) },
    ],
    labels: results.series.map((point) => point.year),
    currency: true,
  });

  renderBarChart(el.outcomeChart, {
    items: [
      { label: "Interest avoided", color: "#0f6abf", value: results.interestSaved },
      { label: "Strategy A assets", color: "#0ea5a8", value: results.horizonPoint.investValueA },
      { label: "Strategy B assets", color: "#16a34a", value: results.horizonPoint.investValueB },
      { label: "Mortgage gap", color: "#ff8c42", value: results.horizonPoint.mortgageBalanceB - results.horizonPoint.mortgageBalanceA },
    ],
  });
}

function renderLineChart(container, config) {
  if (!container) return;
  const width = 640;
  const height = 240;
  const padding = { top: 16, right: 16, bottom: 30, left: 52 };
  const allValues = config.series.flatMap((item) => item.values);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = max - min || 1;
  const step = Math.max(1, Math.floor(config.labels.length / 4));
  const gridLines = 4;

  const polylines = config.series
    .map((item) => {
      const points = item.values
        .map((value, index) => {
          const x = padding.left + (index / Math.max(1, item.values.length - 1)) * (width - padding.left - padding.right);
          const y = padding.top + ((max - value) / span) * (height - padding.top - padding.bottom);
          return `${x},${y}`;
        })
        .join(" ");
      return `<polyline fill="none" stroke="${item.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${points}"></polyline>`;
    })
    .join("");

  const yLabels = Array.from({ length: gridLines + 1 }, (_, index) => {
    const ratio = index / gridLines;
    const value = max - span * ratio;
    const y = padding.top + ratio * (height - padding.top - padding.bottom);
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e8edf5" stroke-width="1"></line>
      <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${escapeHtml(shortAxis(value, config.currency))}</text>
    `;
  }).join("");

  const xLabels = config.labels
    .map((value, index) => {
      if (index % step !== 0 && index !== config.labels.length - 1) return "";
      const x = padding.left + (index / Math.max(1, config.labels.length - 1)) * (width - padding.left - padding.right);
      return `<text x="${x}" y="${height - 8}" text-anchor="middle" font-size="11" fill="#6b7280">${escapeHtml(String(Math.round(value)))}y</text>`;
    })
    .join("");

  container.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(config.title)} chart">
      ${yLabels}
      ${polylines}
      ${xLabels}
    </svg>
    <div class="chart-legend">
      ${config.series
        .map(
          (item) => `
            <span class="legend-item">
              <span class="legend-swatch" style="background:${item.color}"></span>
              ${escapeHtml(item.label)}
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderBarChart(container, config) {
  if (!container) return;
  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const max = Math.max(...config.items.map((item) => item.value), 1);
  const innerWidth = width - padding.left - padding.right;
  const itemCount = Math.max(1, config.items.length);
  const gap = Math.max(14, Math.round(innerWidth * 0.04));
  const barWidth = Math.max(48, Math.floor((innerWidth - gap * (itemCount - 1)) / itemCount));
  const totalBarsWidth = barWidth * itemCount + gap * (itemCount - 1);
  const startX = padding.left + Math.max(0, (innerWidth - totalBarsWidth) / 2);

  const bars = config.items
    .map((item, index) => {
      const x = startX + index * (barWidth + gap);
      const barHeight = (item.value / max) * (height - padding.top - padding.bottom);
      const y = height - padding.bottom - barHeight;
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="12" fill="${item.color}"></rect>
        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="11" fill="#324255">${escapeHtml(shortAxis(item.value, true))}</text>
        <text x="${x + barWidth / 2}" y="${height - 14}" text-anchor="middle" font-size="11" fill="#6b7280">${escapeHtml(item.label)}</text>
      `;
    })
    .join("");

  container.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Outcome comparison chart">${bars}</svg>`;
}

function renderRelatedTools() {
  el.relatedToolsGrid.innerHTML = RELATED_TOOLS.map((tool) => `
    <a class="related-card" href="${tool.href}" data-related-tool="${escapeHtml(tool.name)}">
      <h3>${escapeHtml(tool.name)}</h3>
      <p>${escapeHtml(tool.description)}</p>
    </a>
  `).join("");

  el.relatedToolsGrid.querySelectorAll("[data-related-tool]").forEach((node) => {
    node.addEventListener("click", () => {
      trackEvent("related_tool_click", { tool: node.getAttribute("data-related-tool") || "unknown" });
    });
  });
}

function syncMeta() {
  document.title = "Mortgage Paydown vs Invest Calculator Canada | SimpleKit";
  el.metaDescription?.setAttribute("content", TEMPLATE.seoDescription);
  el.metaThemeColor?.setAttribute("content", "#0f6abf");
  el.metaOgTitle?.setAttribute("content", "SimpleKit Mortgage vs Invest Calculator");
  el.metaOgDescription?.setAttribute("content", "Compare paying down your mortgage faster versus investing the difference with a client-side Canadian planning tool.");
  el.metaOgUrl?.setAttribute("content", TEMPLATE.canonicalUrl);
  el.metaOgImage?.setAttribute("content", TEMPLATE.socialImageUrl);
  el.metaOgSiteName?.setAttribute("content", "SimpleKit Mortgage vs Invest Calculator");
  el.metaTwitterTitle?.setAttribute("content", "SimpleKit Mortgage vs Invest Calculator");
  el.metaTwitterDescription?.setAttribute("content", "See how mortgage prepayments and investing the difference may affect your net worth over time.");
  el.metaTwitterImage?.setAttribute("content", TEMPLATE.socialImageUrl);
}


function buildInterpretation(results, inputs, investAhead) {
  if (Math.abs(results.netWorthDifference) < 10000) {
    return "The projected outcome is fairly close, so certainty, liquidity, and comfort may matter more than the headline difference.";
  }
  if (investAhead) {
    return `Investing is ahead in this model because the expected net return of ${formatPercent(inputs.investmentReturn - inputs.mer - effectiveTaxDrag(inputs.accountType, inputs.taxDrag))} outpaces the mortgage cost over a ${inputs.timeHorizonYears}-year horizon.`;
  }
  return `Mortgage prepayment is ahead here because the guaranteed savings from a ${formatPercent(inputs.mortgageRate)} mortgage rate outweigh the projected net investing edge after fees and tax drag.`;
}

function monthlyRateFromAnnual(annualPercent, compoundMode) {
  const annualRate = Math.max(-0.99, annualPercent / 100);
  if (compoundMode === "annual") return annualRate / 12;
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

function renderMetricCard(item) {
  return `
    <article class="metric-card">
      <span class="label">${escapeHtml(item.label)}</span>
      <span class="value">${escapeHtml(item.value)}</span>
      <span class="sub">${escapeHtml(item.sub)}</span>
    </article>
  `;
}

function renderKpiRow(label, value) {
  return `<div class="kpi-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function breakEvenLabel(value) {
  if (typeof value === "number") return formatPercent(value);
  return `${value.direction} ${formatPercent(value.rate)}`;
}

function payoffText(month) {
  if (month === null) return "Not within schedule";
  return formatDurationMonths(month);
}

function payoffTimeSaved(payoffA, payoffB) {
  if (payoffA === null || payoffB === null || payoffA >= payoffB) return "";
  return formatDurationMonths(payoffB - payoffA);
}

function accountTypeLabel(value) {
  if (value === "rrsp") return "RRSP";
  if (value === "taxable") return "Taxable";
  if (value === "general") return "General";
  return "TFSA";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value) {
  return `${Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, "") : "0"}%`;
}

function formatDurationMonths(months) {
  const safeMonths = Math.max(0, Math.round(months));
  const years = Math.floor(safeMonths / 12);
  const remainder = safeMonths % 12;
  if (!years) return `${remainder} month${remainder === 1 ? "" : "s"}`;
  if (!remainder) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years}y ${remainder}m`;
}

function shortAxis(value, currency) {
  if (!currency) return Math.round(value).toString();
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${Math.round(value)}`;
}

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function trackEvent(name, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
