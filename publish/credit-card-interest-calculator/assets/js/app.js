(() => {
const DEFAULT_STATE = {
  currentBalance: "6500",
  annualInterestRate: "19.99",
  monthlyPayment: "200",
  extraMonthlyPayment: "50",
};

// Use window.SimpleKitToolLinks or window.getSimpleKitToolUrl() for any SimpleKit internal cross-links.
const SAMPLE_STATE = {
  currentBalance: "8200",
  annualInterestRate: "24.99",
  monthlyPayment: "220",
  extraMonthlyPayment: "80",
};

const selectors = {
  form: "#calculatorForm",
  resultsStatus: "#resultsStatus",
  resultCards: "#resultCards",
  comparisonPanel: "#comparisonPanel",
  spotlightPanel: "#spotlightPanel",
  guidancePanel: "#guidancePanel",
  targetPanel: "#targetPanel",
  fieldFeedback: "#fieldFeedback",
  shareBtn: "#shareBtn",
  shareFeedback: "#shareFeedback",
  heroSummaryValue: "#heroSummaryValue",
  heroSummaryText: "#heroSummaryText",
  heroInterestValue: "#heroInterestValue",
  heroPaceValue: "#heroPaceValue",
  loadSampleBtn: "#loadSampleBtn",
  resetBtn: "#resetBtn",
  relatedTools: "#relatedTools",
};

const MAX_MONTHS = 1200;

const RELATED_TOOLS = [
  {
    key: "debtPayoffCalculator",
    title: "Debt Payoff Calculator",
    description: "Compare or combine multiple balances when you want a broader debt repayment plan.",
  },
  {
    key: "budgetPlanner",
    title: "Budget Planner",
    description: "Find room in your monthly cash flow so extra payments feel more sustainable.",
  },
  {
    key: "netWorthCalculator",
    title: "Net Worth Calculator",
    description: "See how this balance fits into your bigger financial picture as you pay it down.",
  },
];

let state = { ...DEFAULT_STATE };

function getForm() {
  return document.querySelector(selectors.form);
}

function setFormState(nextState) {
  state = { ...nextState };
  const form = getForm();
  if (!form) {
    return;
  }

  Object.entries(state).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  });
}

function restoreFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if ([...params.keys()].length === 0) {
    setFormState(DEFAULT_STATE);
    return;
  }

  setFormState({
    currentBalance: params.get("currentBalance") || DEFAULT_STATE.currentBalance,
    annualInterestRate: params.get("annualInterestRate") || DEFAULT_STATE.annualInterestRate,
    monthlyPayment: params.get("monthlyPayment") || DEFAULT_STATE.monthlyPayment,
    extraMonthlyPayment: params.get("extraMonthlyPayment") || DEFAULT_STATE.extraMonthlyPayment,
  });
}

function readFormState() {
  const form = getForm();
  if (!form) {
    return { ...DEFAULT_STATE };
  }

  return {
    currentBalance: form.elements.currentBalance.value.trim(),
    annualInterestRate: form.elements.annualInterestRate.value.trim(),
    monthlyPayment: form.elements.monthlyPayment.value.trim(),
    extraMonthlyPayment: form.elements.extraMonthlyPayment.value.trim(),
  };
}

function parseAmount(value) {
  const normalized = String(value).replace(/[^\d.-]/g, "");
  if (!normalized) {
    return NaN;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyDetailed(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMonths(totalMonths) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months} month${months === 1 ? "" : "s"}`;
  }

  if (months === 0) {
    return `${years} year${years === 1 ? "" : "s"}`;
  }

  return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"}`;
}

function formatMonthYear(monthsFromNow) {
  const target = new Date();
  target.setMonth(target.getMonth() + monthsFromNow);
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    year: "numeric",
  }).format(target);
}

function getPaceStatus(months) {
  if (months <= 24) {
    return { label: "Aggressive", tone: "positive", detail: "You are paying this down quickly based on the current monthly amount." };
  }

  if (months <= 60) {
    return { label: "Moderate", tone: "caution", detail: "Your plan is workable, but interest still adds a noticeable cost over time." };
  }

  return { label: "Slow", tone: "danger", detail: "This pace leaves the balance around for a long time and increases the total interest cost." };
}

function calculatePayoff({ currentBalance, annualInterestRate, monthlyPayment, extraMonthlyPayment }) {
  const balance = parseAmount(currentBalance);
  const apr = parseAmount(annualInterestRate);
  const payment = parseAmount(monthlyPayment);
  const extra = parseAmount(extraMonthlyPayment || "0");
  const errors = [];

  if (!Number.isFinite(balance) || balance <= 0) {
    errors.push("Enter a current balance greater than 0.");
  }

  if (!Number.isFinite(apr) || apr < 0) {
    errors.push("Enter an APR that is 0% or higher.");
  }

  if (!Number.isFinite(payment) || payment <= 0) {
    errors.push("Enter a monthly payment greater than 0.");
  }

  if (!Number.isFinite(extra) || extra < 0) {
    errors.push("Enter an extra monthly payment that is 0 or higher.");
  }

  if (errors.length > 0) {
    return { errors, errorFields: getErrorFields(balance, apr, payment, extra) };
  }

  const totalPayment = payment + extra;
  const monthlyRate = apr / 100 / 12;

  if (monthlyRate > 0) {
    const firstMonthInterest = balance * monthlyRate;
    if (totalPayment <= firstMonthInterest) {
      return {
        errors: [
          `Your total monthly payment of ${formatCurrencyDetailed(totalPayment)} does not cover the first month's estimated interest of ${formatCurrencyDetailed(firstMonthInterest)}.`,
        ],
        errorFields: ["monthlyPayment", "extraMonthlyPayment"],
      };
    }
  }

  return buildScenario(balance, monthlyRate, payment, extra);
}

function getErrorFields(balance, apr, payment, extra) {
  const fields = [];
  if (!Number.isFinite(balance) || balance <= 0) {
    fields.push("currentBalance");
  }
  if (!Number.isFinite(apr) || apr < 0) {
    fields.push("annualInterestRate");
  }
  if (!Number.isFinite(payment) || payment <= 0) {
    fields.push("monthlyPayment");
  }
  if (!Number.isFinite(extra) || extra < 0) {
    fields.push("extraMonthlyPayment");
  }
  return fields;
}

function buildScenario(balance, monthlyRate, payment, extra) {
  const baseScenario = amortize(balance, monthlyRate, payment);
  const totalScenario = amortize(balance, monthlyRate, payment + extra);
  const pace = getPaceStatus(totalScenario.months);
  const totalPayment = payment + extra;
  const firstMonthInterest = balance * monthlyRate;
  const principalFirstMonth = Math.max(0, totalPayment - firstMonthInterest);

  return {
    inputs: {
      balance,
      monthlyRate,
      payment,
      extra,
      totalPayment,
      firstMonthInterest,
      principalFirstMonth,
    },
    baseScenario,
    totalScenario,
    pace,
  };
}

function amortize(startBalance, monthlyRate, paymentAmount) {
  let balance = startBalance;
  let totalInterest = 0;
  let totalPaid = 0;
  let months = 0;
  let totalPrincipal = 0;
  const samples = [{ month: 0, interestPaid: 0, principalPaid: 0 }];

  while (balance > 0.005 && months < MAX_MONTHS) {
    const interest = monthlyRate === 0 ? 0 : balance * monthlyRate;
    const nextBalance = balance + interest;
    const payment = Math.min(paymentAmount, nextBalance);

    if (payment <= interest && nextBalance > 0.005) {
      return {
        months: MAX_MONTHS,
        totalInterest,
        totalPaid,
        didPayOff: false,
      };
    }

    totalInterest += interest;
    totalPaid += payment;
    totalPrincipal += payment - interest;
    balance = Math.max(0, nextBalance - payment);
    months += 1;

    if (months <= 12 || months % 3 === 0 || balance <= 0.005) {
      samples.push({
        month: months,
        interestPaid: totalInterest,
        principalPaid: totalPrincipal,
      });
    }
  }

  return {
    months,
    totalInterest,
    totalPaid,
    didPayOff: months < MAX_MONTHS,
    samples,
  };
}

function estimatePaymentForMonths(balance, monthlyRate, targetMonths) {
  if (monthlyRate === 0) {
    return balance / targetMonths;
  }

  let low = 0;
  let high = balance * (1 + monthlyRate) + 1;

  while (!amortize(balance, monthlyRate, high).didPayOff || amortize(balance, monthlyRate, high).months > targetMonths) {
    high *= 1.5;
    if (high > balance * 5) {
      break;
    }
  }

  for (let index = 0; index < 30; index += 1) {
    const mid = (low + high) / 2;
    const scenario = amortize(balance, monthlyRate, mid);
    if (scenario.didPayOff && scenario.months <= targetMonths) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.ceil(high * 100) / 100;
}

function renderStatus(result) {
  const el = document.querySelector(selectors.resultsStatus);
  if (!el) {
    return;
  }

  if (result.errors?.length) {
    el.dataset.tone = "danger";
    el.innerHTML = `
      <strong>We need one quick fix</strong>
      <p class="muted">${escapeHtml(result.errors[0])}</p>
    `;
    return;
  }

  const payoffMonths = result.totalScenario.months;
  const totalPayment = result.inputs.payment + result.inputs.extra;
  const tone = payoffMonths > 120 ? "danger" : result.pace.tone;
  const extraLine = payoffMonths > 120
    ? "At this pace, the balance could take more than 10 years to clear. Testing a higher payment is strongly worth it."
    : result.pace.detail;
  el.dataset.tone = tone;
  el.innerHTML = `
    <strong>${escapeHtml(result.pace.label)} payoff pace</strong>
    <p class="muted">At ${escapeHtml(formatCurrencyDetailed(totalPayment))} per month, your estimated payoff time is ${escapeHtml(formatMonths(payoffMonths))}. ${escapeHtml(extraLine)}</p>
  `;
}

function renderFieldFeedback(result) {
  const feedback = document.querySelector(selectors.fieldFeedback);
  const form = getForm();

  if (!feedback || !form) {
    return;
  }

  ["currentBalance", "annualInterestRate", "monthlyPayment", "extraMonthlyPayment"].forEach((name) => {
    const field = form.elements.namedItem(name);
    field?.removeAttribute("aria-invalid");
    field?.closest(".form-field")?.classList.remove("has-error");
  });

  if (result.errors?.length) {
    result.errorFields?.forEach((name) => {
      const field = form.elements.namedItem(name);
      field?.setAttribute("aria-invalid", "true");
      field?.closest(".form-field")?.classList.add("has-error");
    });
    feedback.innerHTML = `<p>${escapeHtml(result.errors[0])}</p>`;
    return;
  }

  feedback.innerHTML = `
    <p>Your total payment is ${escapeHtml(formatCurrencyDetailed(result.inputs.totalPayment))} per month, including ${escapeHtml(formatCurrencyDetailed(result.inputs.extra))} in extra payment.</p>
  `;
}

function renderResultCards(result) {
  const container = document.querySelector(selectors.resultCards);
  if (!container) {
    return;
  }

  if (result.errors?.length) {
    container.innerHTML = "";
    syncHeroFallback();
    return;
  }

  const paymentEffect = result.inputs.extra > 0
    ? `Adding ${formatCurrencyDetailed(result.inputs.extra)} per month saves about ${formatMonths(Math.max(0, result.baseScenario.months - result.totalScenario.months))} and ${formatCurrency(result.baseScenario.totalInterest - result.totalScenario.totalInterest)} in interest.`
    : "Add an extra monthly payment to see how much time and interest you could save.";

  const cards = [
    {
      label: "Payoff time",
      value: formatMonths(result.totalScenario.months),
      copy: "Estimated time until the balance reaches zero at your full monthly payment.",
    },
    {
      label: "Total interest paid",
      value: formatCurrency(result.totalScenario.totalInterest),
      copy: "The estimated interest cost over the full payoff period.",
    },
    {
      label: "Total amount paid",
      value: formatCurrency(result.totalScenario.totalPaid),
      copy: "Your estimated balance plus interest over time.",
    },
    {
      label: "Monthly payment effect",
      value: result.inputs.extra > 0 ? "Extra payment added" : "Base payment only",
      copy: paymentEffect,
    },
    {
      label: "Payoff status",
      value: result.pace.label,
      copy: result.pace.detail,
    },
    {
      label: "Monthly interest now",
      value: formatCurrency(result.inputs.balance * result.inputs.monthlyRate),
      copy: "A rough first-month estimate of the interest charge at this balance and APR.",
    },
  ];

  container.innerHTML = cards.map((card) => `
    <article class="result-card">
      <span class="trust-label">${escapeHtml(card.label)}</span>
      <strong class="result-value">${escapeHtml(card.value)}</strong>
      <p>${escapeHtml(card.copy)}</p>
    </article>
  `).join("");
}

function renderSpotlight(result) {
  const container = document.querySelector(selectors.spotlightPanel);
  if (!container) {
    return;
  }

  if (result.errors?.length) {
    container.innerHTML = "";
    return;
  }

  const interestShare = result.totalScenario.totalPaid > 0
    ? Math.round((result.totalScenario.totalInterest / result.totalScenario.totalPaid) * 100)
    : 0;
  const firstPaymentShare = result.inputs.totalPayment > 0
    ? Math.min(100, Math.round((result.inputs.firstMonthInterest / result.inputs.totalPayment) * 100))
    : 0;
  const principalShare = Math.max(0, 100 - firstPaymentShare);
  const chartSvg = buildAreaChartSvg(result.totalScenario, result.inputs.balance);

  container.innerHTML = `
    <article class="spotlight-card spotlight-primary">
      <span class="trust-label">Estimated debt-free date</span>
      <strong>${escapeHtml(formatMonthYear(result.totalScenario.months))}</strong>
      <p>${escapeHtml(formatMonths(result.totalScenario.months))} at ${escapeHtml(formatCurrencyDetailed(result.inputs.totalPayment))} per month.</p>
      <div class="spotlight-metrics">
        <div>
          <span class="trust-label">Interest share</span>
          <strong>${escapeHtml(`${interestShare}%`)}</strong>
        </div>
        <div>
          <span class="trust-label">First month to balance</span>
          <strong>${escapeHtml(formatCurrency(result.inputs.principalFirstMonth))}</strong>
        </div>
      </div>
    </article>
    <article class="spotlight-card spotlight-chart-card">
      <div class="spotlight-chart-head">
        <div>
          <span class="trust-label">Principal vs. interest over time</span>
          <strong>${escapeHtml(formatCurrency(result.totalScenario.totalPaid))} total paid</strong>
        </div>
        <p>Blue shows cumulative principal paid. Orange shows cumulative interest paid.</p>
      </div>
      <div class="chart-wrap" aria-hidden="true">${chartSvg}</div>
      <div class="payment-bar" aria-hidden="true">
        <span class="payment-bar-interest" style="width: ${escapeHtml(firstPaymentShare)}%"></span>
        <span class="payment-bar-principal" style="width: ${escapeHtml(principalShare)}%"></span>
      </div>
      <p class="payment-bar-label">Interest ${escapeHtml(`${firstPaymentShare}%`)} and principal ${escapeHtml(`${principalShare}%`)} of your first payment.</p>
    </article>
  `;
}

function buildAreaChartSvg(scenario, startingBalance) {
  const samples = scenario.samples;
  const width = 540;
  const height = 220;
  const padding = { top: 12, right: 12, bottom: 28, left: 12 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxMonth = Math.max(1, scenario.months);
  const maxTotal = Math.max(1, scenario.totalPaid, startingBalance);

  const principalPoints = samples.map((sample) => {
    const x = padding.left + (sample.month / maxMonth) * innerWidth;
    const y = padding.top + innerHeight - (sample.principalPaid / maxTotal) * innerHeight;
    return { x, y };
  });

  const stackedPoints = samples.map((sample) => {
    const x = padding.left + (sample.month / maxMonth) * innerWidth;
    const total = sample.principalPaid + sample.interestPaid;
    const y = padding.top + innerHeight - (total / maxTotal) * innerHeight;
    return { x, y };
  });

  const principalArea = buildAreaPath(principalPoints, height - padding.bottom);
  const totalArea = buildAreaPath(stackedPoints, height - padding.bottom);

  return `
    <svg class="spotlight-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Area chart showing cumulative principal and interest paid over time">
      <defs>
        <linearGradient id="principalFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="rgba(15,106,191,0.32)"></stop>
          <stop offset="100%" stop-color="rgba(15,106,191,0.08)"></stop>
        </linearGradient>
        <linearGradient id="interestFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="rgba(240,138,56,0.28)"></stop>
          <stop offset="100%" stop-color="rgba(240,138,56,0.08)"></stop>
        </linearGradient>
      </defs>
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" class="chart-axis"></line>
      <path d="${totalArea}" fill="url(#interestFill)"></path>
      <path d="${principalArea}" fill="url(#principalFill)"></path>
      <path d="${buildLinePath(stackedPoints)}" class="chart-line chart-line-interest"></path>
      <path d="${buildLinePath(principalPoints)}" class="chart-line chart-line-principal"></path>
      <text x="${padding.left}" y="${height - 8}" class="chart-label">Start</text>
      <text x="${width - padding.right}" y="${height - 8}" text-anchor="end" class="chart-label">${escapeHtml(formatMonths(scenario.months))}</text>
    </svg>
  `;
}

function buildAreaPath(points, baseline) {
  if (points.length === 0) {
    return "";
  }
  const first = points[0];
  const last = points[points.length - 1];
  const topPath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  return `${topPath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

function buildLinePath(points) {
  if (points.length === 0) {
    return "";
  }
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function renderComparison(result) {
  const container = document.querySelector(selectors.comparisonPanel);
  if (!container) {
    return;
  }

  if (result.errors?.length) {
    container.innerHTML = "";
    return;
  }

  const timeSavedMonths = Math.max(0, result.baseScenario.months - result.totalScenario.months);
  const interestSaved = Math.max(0, result.baseScenario.totalInterest - result.totalScenario.totalInterest);
  const pillClass = getPillClass(result.pace.tone);

  container.innerHTML = `
    <article class="comparison-card">
      <span class="trust-label">Base payment</span>
      <strong class="comparison-value">${escapeHtml(formatMonths(result.baseScenario.months))}</strong>
      <p>Estimated payoff time at ${escapeHtml(formatCurrencyDetailed(result.inputs.payment))} per month.</p>
    </article>
    <article class="comparison-card">
      <span class="trust-label">With extra payment</span>
      <strong class="comparison-value">${escapeHtml(formatMonths(result.totalScenario.months))}</strong>
      <p>Estimated payoff time at ${escapeHtml(formatCurrencyDetailed(result.inputs.payment + result.inputs.extra))} per month.</p>
    </article>
    <article class="comparison-card">
      <span class="trust-label">What changes</span>
      <span class="status-pill ${pillClass}">${escapeHtml(result.pace.label)}</span>
      <strong class="comparison-value">${escapeHtml(timeSavedMonths > 0 ? `${formatMonths(timeSavedMonths)} faster` : "No extra savings yet")}</strong>
      <p>${escapeHtml(timeSavedMonths > 0 ? `You could save about ${formatCurrency(interestSaved)} in interest with the extra monthly payment.` : "Add an extra amount to compare how much sooner you could be debt-free.")}</p>
    </article>
  `;
}

function renderGuidance(result) {
  const container = document.querySelector(selectors.guidancePanel);
  if (!container) {
    return;
  }

  if (result.errors?.length) {
    container.innerHTML = "";
    return;
  }

  const timeSavedMonths = Math.max(0, result.baseScenario.months - result.totalScenario.months);
  const interestSaved = Math.max(0, result.baseScenario.totalInterest - result.totalScenario.totalInterest);
  const suggestions = [
    {
      title: "Keep the extra payment",
      value: result.inputs.extra > 0 ? `${formatMonths(timeSavedMonths)} faster` : "Add one small extra amount",
      copy: result.inputs.extra > 0
        ? `Compared with your base payment, the extra amount could save about ${formatCurrency(interestSaved)} in interest.`
        : "Even a small recurring extra payment can cut both payoff time and interest cost.",
    },
    {
      title: "Watch the interest drag",
      value: `${formatCurrency(result.inputs.firstMonthInterest)} this month`,
      copy: "If this number feels too high, raising your payment usually helps more than waiting for the balance to shrink on its own.",
    },
    {
      title: "Simple planning takeaway",
      value: result.pace.label === "Slow" ? "This pace likely needs help" : "This plan is moving",
      copy: result.pace.label === "Slow"
        ? "Consider testing a higher monthly payment or pairing this estimate with the Budget Planner to create room."
        : "You already have forward momentum. Small extra payments can still reduce the total cost noticeably.",
    },
  ];
  const scenarioSteps = [25, 50, 100];
  const scenarioCards = scenarioSteps.map((step) => {
    const payment = result.inputs.totalPayment + step;
    const scenario = amortize(result.inputs.balance, result.inputs.monthlyRate, payment);
    return {
      title: `Try +${formatCurrencyDetailed(step)}`,
      value: formatMonths(scenario.months),
      copy: `At ${formatCurrencyDetailed(payment)} per month, you could save about ${formatMonths(Math.max(0, result.totalScenario.months - scenario.months))} and ${formatCurrency(Math.max(0, result.totalScenario.totalInterest - scenario.totalInterest))} in interest.`,
      compact: true,
    };
  });
  const cards = [...suggestions, ...scenarioCards];

  container.innerHTML = cards.map((item) => `
    <article class="comparison-card guidance-card${item.compact ? " guidance-card-compact" : ""}">
      <span class="trust-label">${escapeHtml(item.title)}</span>
      <strong class="comparison-value">${escapeHtml(item.value)}</strong>
      <p>${escapeHtml(item.copy)}</p>
    </article>
  `).join("");
}

function renderTargets(result) {
  const container = document.querySelector(selectors.targetPanel);
  if (!container) {
    return;
  }

  if (result.errors?.length) {
    container.innerHTML = "";
    return;
  }

  const targets = [12, 24, 36].map((months) => {
    const neededPayment = estimatePaymentForMonths(result.inputs.balance, result.inputs.monthlyRate, months);
    const gap = Math.max(0, neededPayment - result.inputs.totalPayment);
    return {
      months,
      neededPayment,
      gap,
    };
  });

  container.innerHTML = targets.map((target) => `
    <article class="comparison-card target-card target-utility-card">
      <span class="trust-label">${escapeHtml(formatMonths(target.months))}</span>
      <strong class="comparison-value">${escapeHtml(formatCurrencyDetailed(target.neededPayment))}/mo</strong>
      <p>${escapeHtml(target.gap > 0 ? `${formatCurrencyDetailed(target.gap)} more than now.` : "Already on pace.")}</p>
    </article>
  `).join("");
}

function getPillClass(tone) {
  if (tone === "positive") {
    return "is-positive";
  }
  if (tone === "caution") {
    return "is-caution";
  }
  return "is-danger";
}

function syncHero(result) {
  const summaryValue = document.querySelector(selectors.heroSummaryValue);
  const summaryText = document.querySelector(selectors.heroSummaryText);
  const interestValue = document.querySelector(selectors.heroInterestValue);
  const paceValue = document.querySelector(selectors.heroPaceValue);

  if (!summaryValue || !summaryText || !interestValue || !paceValue) {
    return;
  }

  if (result.errors?.length) {
    syncHeroFallback();
    return;
  }

  summaryValue.textContent = formatMonths(result.totalScenario.months);
  summaryText.textContent = `Estimated payoff timeline at ${formatCurrencyDetailed(result.inputs.payment + result.inputs.extra)} per month.`;
  interestValue.textContent = formatCurrency(result.totalScenario.totalInterest);
  paceValue.textContent = result.pace.label;
}

function syncHeroFallback() {
  document.querySelector(selectors.heroSummaryValue)?.replaceChildren(document.createTextNode("Enter your details"));
  document.querySelector(selectors.heroSummaryText)?.replaceChildren(document.createTextNode("Add a valid balance, APR, and monthly payment to estimate payoff."));
  document.querySelector(selectors.heroInterestValue)?.replaceChildren(document.createTextNode("Estimate"));
  document.querySelector(selectors.heroPaceValue)?.replaceChildren(document.createTextNode("Planning"));
}

function syncUrl() {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    params.set(key, value);
  });
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

async function copyShareLink() {
  const feedback = document.querySelector(selectors.shareFeedback);
  const shareUrl = window.location.href;

  try {
    await navigator.clipboard.writeText(shareUrl);
    if (feedback) {
      feedback.textContent = "Share link copied. It includes your current balance and payment details.";
    }
  } catch (error) {
    if (feedback) {
      feedback.textContent = `Copy failed. Use this link manually: ${shareUrl}`;
    }
  }
}

function renderRelatedTools() {
  const container = document.querySelector(selectors.relatedTools);
  if (!container) {
    return;
  }

  container.innerHTML = RELATED_TOOLS.map((tool) => `
    <article class="related-tool-card">
      <span class="trust-label">SimpleKit tool</span>
      <strong>${escapeHtml(tool.title)}</strong>
      <p>${escapeHtml(tool.description)}</p>
      <a class="btn btn-secondary-panel" href="${escapeHtml(window.getSimpleKitToolUrl(tool.key))}">Open tool</a>
    </article>
  `).join("");
}

function render() {
  const result = calculatePayoff(state);
  renderFieldFeedback(result);
  renderStatus(result);
  renderSpotlight(result);
  renderResultCards(result);
  renderComparison(result);
  renderGuidance(result);
  renderTargets(result);
  syncHero(result);
}

function handleInput() {
  state = readFormState();
  render();
  syncUrl();
}

function bindEvents() {
  const form = getForm();
  if (form) {
    form.addEventListener("input", handleInput);
    form.addEventListener("change", handleInput);
  }

  document.querySelectorAll("[data-extra-payment]").forEach((button) => {
    button.addEventListener("click", () => {
      const extraField = getForm()?.elements.namedItem("extraMonthlyPayment");
      if (!extraField) {
        return;
      }
      extraField.value = button.getAttribute("data-extra-payment") || "0";
      handleInput();
    });
  });

  document.querySelector(selectors.loadSampleBtn)?.addEventListener("click", () => {
    setFormState(SAMPLE_STATE);
    handleInput();
  });

  document.querySelector(selectors.resetBtn)?.addEventListener("click", () => {
    setFormState(DEFAULT_STATE);
    handleInput();
  });

  document.querySelector(selectors.shareBtn)?.addEventListener("click", copyShareLink);
}

function initialize() {
  restoreFromUrl();
  state = readFormState();
  bindEvents();
  renderRelatedTools();
  render();
  syncUrl();
}

initialize();
})();
