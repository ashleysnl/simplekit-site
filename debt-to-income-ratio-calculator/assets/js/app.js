(() => {
const STORAGE_KEY = "simplekit-dti-comparison-scenario";

const DEFAULT_STATE = {
  grossMonthlyIncome: 6000,
  dtiMode: "current-plus-proposed",
  scenarioName: "Base scenario",
  provinceOrRegion: "canada-general",
  includeCurrentHousing: true,
  currentHousingPayment: 0,
  includeProposedHousing: true,
  proposedHousingPayment: 2200,
  propertyTaxesMonthly: 0,
  heatingMonthly: 0,
  condoFeesMonthly: 0,
  carLoansMonthly: 0,
  studentLoansMonthly: 0,
  creditCardMinimumsMonthly: 0,
  personalLoansMonthly: 0,
  linesOfCreditMonthly: 0,
  childSupportAlimonyMonthly: 0,
  otherMonthlyDebt: 0,
  useFrontEndRatio: true,
  useBackEndRatio: true,
};

const SAMPLE_STATE = {
  grossMonthlyIncome: 7800,
  dtiMode: "current-plus-proposed",
  scenarioName: "Move-up home test",
  provinceOrRegion: "ontario",
  includeCurrentHousing: true,
  currentHousingPayment: 1750,
  includeProposedHousing: true,
  proposedHousingPayment: 2650,
  propertyTaxesMonthly: 340,
  heatingMonthly: 95,
  condoFeesMonthly: 0,
  carLoansMonthly: 410,
  studentLoansMonthly: 225,
  creditCardMinimumsMonthly: 120,
  personalLoansMonthly: 0,
  linesOfCreditMonthly: 75,
  childSupportAlimonyMonthly: 0,
  otherMonthlyDebt: 60,
  useFrontEndRatio: true,
  useBackEndRatio: true,
};

const SELECTORS = {
  form: "#dtiForm",
  simpleModeBtn: "#simpleModeBtn",
  advancedModeBtn: "#advancedModeBtn",
  previousStepBtn: "#previousStepBtn",
  nextStepBtn: "#nextStepBtn",
  stepCounter: "#stepCounter",
  progressFill: "#progressFill",
  loadSampleBtn: "#loadSampleBtn",
  resetBtn: "#resetBtn",
  saveScenarioBtn: "#saveScenarioBtn",
  clearScenarioBtn: "#clearScenarioBtn",
  shareBtn: "#shareBtn",
  shareFeedback: "#shareFeedback",
  modeSummary: "#modeSummary",
  countedSummary: "#countedSummary",
  resultsStatus: "#resultsStatus",
  primaryAnswer: "#primaryAnswer",
  resultCards: "#resultCards",
  comparisonCards: "#comparisonCards",
  dtiDriverText: "#dtiDriverText",
  nextStepsText: "#nextStepsText",
  resultHeadlineCopy: "#resultHeadlineCopy",
  heroRatioPreview: "#heroRatioPreview",
  heroStatusPreview: "#heroStatusPreview",
  relatedToolsGrid: "#relatedToolsGrid",
};

const TOTAL_STEPS = 5;

const FIELD_CONFIG = {
  grossMonthlyIncome: { type: "number" },
  dtiMode: { type: "string" },
  scenarioName: { type: "string" },
  provinceOrRegion: { type: "string" },
  includeCurrentHousing: { type: "boolean" },
  currentHousingPayment: { type: "number" },
  includeProposedHousing: { type: "boolean" },
  proposedHousingPayment: { type: "number" },
  propertyTaxesMonthly: { type: "number" },
  heatingMonthly: { type: "number" },
  condoFeesMonthly: { type: "number" },
  carLoansMonthly: { type: "number" },
  studentLoansMonthly: { type: "number" },
  creditCardMinimumsMonthly: { type: "number" },
  personalLoansMonthly: { type: "number" },
  linesOfCreditMonthly: { type: "number" },
  childSupportAlimonyMonthly: { type: "number" },
  otherMonthlyDebt: { type: "number" },
  useFrontEndRatio: { type: "boolean" },
  useBackEndRatio: { type: "boolean" },
};

const RELATED_TOOLS = [
  {
    title: "House Affordability Calculator",
    description: "Estimate how much home price fits your income, debts, and target payment range.",
    href: "https://simplekit.app/tools/",
    ctaLabel: "Browse housing tools",
  },
  {
    title: "Mortgage Calculator",
    description: "Break down mortgage payments, amortization, and cost scenarios before you buy.",
    href: getToolUrl("mortgageCalculator", "https://simplekit.app/tools/"),
    ctaLabel: "Open tool",
  },
  {
    title: "Canadian Take-Home Pay Calculator",
    description: "Translate gross income into a more realistic monthly take-home planning number.",
    href: "https://simplekit.app/tools/",
    ctaLabel: "Browse income tools",
  },
  {
    title: "Budget Planner",
    description: "See how housing and debt payments fit alongside the rest of your monthly spending.",
    href: getToolUrl("budgetPlanner", "https://simplekit.app/tools/"),
    ctaLabel: "Open tool",
  },
  {
    title: "Debt Payoff Calculator",
    description: "Test whether paying down a loan or credit card improves your DTI fast enough.",
    href: getToolUrl("debtPayoffCalculator", "https://simplekit.app/tools/"),
    ctaLabel: "Open tool",
  },
  {
    title: "Rent vs Buy Calculator",
    description: "Compare housing choices once you know how much payment pressure you can handle.",
    href: getToolUrl("rentVsBuyCalculator", "https://simplekit.app/tools/"),
    ctaLabel: "Open tool",
  },
  {
    title: "Net Worth Calculator",
    description: "Pair your debt view with a broader snapshot of assets, liabilities, and progress.",
    href: getToolUrl("netWorthCalculator", "https://simplekit.app/tools/"),
    ctaLabel: "Open tool",
  },
];

let state = { ...DEFAULT_STATE };
let comparisonScenario = loadComparisonScenario();
let displayMode = "simple";
let currentStep = 1;
const ADVANCED_ONLY_FIELDS = [
  "provinceOrRegion",
  "scenarioName",
  "propertyTaxesMonthly",
  "heatingMonthly",
  "condoFeesMonthly",
  "linesOfCreditMonthly",
  "childSupportAlimonyMonthly",
  "otherMonthlyDebt",
];

function getToolUrl(toolKey, fallback) {
  if (typeof window.getSimpleKitToolUrl === "function") {
    const href = window.getSimpleKitToolUrl(toolKey);
    if (href && href !== "https://simplekit.app/tools/") {
      return href;
    }
  }

  return fallback;
}

function getForm() {
  return document.querySelector(SELECTORS.form);
}

function readNumber(field) {
  const raw = field?.value?.trim() ?? "";
  if (raw === "") {
    return 0;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function setFormState(nextState) {
  state = { ...DEFAULT_STATE, ...nextState };
  const form = getForm();
  if (!form) {
    return;
  }

  Object.entries(FIELD_CONFIG).forEach(([key, config]) => {
    const field = form.elements.namedItem(key);
    if (!field) {
      return;
    }

    if (config.type === "boolean") {
      field.checked = Boolean(state[key]);
    } else {
      field.value = state[key];
    }
  });
}

function readFormState() {
  const form = getForm();
  if (!form) {
    return { ...DEFAULT_STATE };
  }

  const nextState = {
    grossMonthlyIncome: readNumber(form.elements.grossMonthlyIncome),
    dtiMode: form.elements.dtiMode.value || DEFAULT_STATE.dtiMode,
    scenarioName: (form.elements.scenarioName.value || "").trim() || DEFAULT_STATE.scenarioName,
    provinceOrRegion: form.elements.provinceOrRegion.value || DEFAULT_STATE.provinceOrRegion,
    includeCurrentHousing: form.elements.includeCurrentHousing.checked,
    currentHousingPayment: readNumber(form.elements.currentHousingPayment),
    includeProposedHousing: form.elements.includeProposedHousing.checked,
    proposedHousingPayment: readNumber(form.elements.proposedHousingPayment),
    propertyTaxesMonthly: readNumber(form.elements.propertyTaxesMonthly),
    heatingMonthly: readNumber(form.elements.heatingMonthly),
    condoFeesMonthly: readNumber(form.elements.condoFeesMonthly),
    carLoansMonthly: readNumber(form.elements.carLoansMonthly),
    studentLoansMonthly: readNumber(form.elements.studentLoansMonthly),
    creditCardMinimumsMonthly: readNumber(form.elements.creditCardMinimumsMonthly),
    personalLoansMonthly: readNumber(form.elements.personalLoansMonthly),
    linesOfCreditMonthly: readNumber(form.elements.linesOfCreditMonthly),
    childSupportAlimonyMonthly: readNumber(form.elements.childSupportAlimonyMonthly),
    otherMonthlyDebt: readNumber(form.elements.otherMonthlyDebt),
    useFrontEndRatio: form.elements.useFrontEndRatio.checked,
    useBackEndRatio: true,
  };

  return applyDisplayModeToState(nextState);
}

function sanitizeState(nextState) {
  const sanitized = {};

  Object.entries(FIELD_CONFIG).forEach(([key, config]) => {
    const value = nextState[key];

    if (config.type === "number") {
      sanitized[key] = Number.isFinite(Number(value)) ? Number(value) : 0;
    } else if (config.type === "boolean") {
      sanitized[key] = key === "useBackEndRatio"
        ? true
        : value === true || value === "true" || value === "1";
    } else {
      sanitized[key] = typeof value === "string" && value !== "" ? value : DEFAULT_STATE[key];
    }
  });

  return { ...DEFAULT_STATE, ...sanitized };
}

function applyDisplayModeToState(nextState) {
  if (displayMode === "advanced") {
    return nextState;
  }

  const adjusted = { ...nextState };
  ADVANCED_ONLY_FIELDS.forEach((key) => {
    adjusted[key] = DEFAULT_STATE[key];
  });
  return adjusted;
}

function restoreFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (![...params.keys()].length) {
    setFormState(DEFAULT_STATE);
    return;
  }

  const restored = {};
  Object.keys(FIELD_CONFIG).forEach((key) => {
    if (params.has(key)) {
      restored[key] = params.get(key);
    }
  });

  if (params.has("view")) {
    displayMode = params.get("view") === "advanced" ? "advanced" : "simple";
  }

  if (params.has("step")) {
    const requestedStep = Number(params.get("step"));
    if (Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= TOTAL_STEPS) {
      currentStep = requestedStep;
    }
  }

  setFormState(sanitizeState(restored));
}

function syncUrl() {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    params.set(key, String(value));
  });
  params.set("view", displayMode);
  params.set("step", String(currentStep));
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

function updateStepUi() {
  document.querySelectorAll(".guided-step").forEach((step) => {
    step.classList.toggle("is-active", Number(step.dataset.step) === currentStep);
  });

  document.querySelectorAll(".progress-step").forEach((button, index) => {
    const stepNumber = index + 1;
    button.classList.toggle("is-active", stepNumber === currentStep);
    button.classList.toggle("is-complete", stepNumber < currentStep);
  });

  const progressFill = document.querySelector(SELECTORS.progressFill);
  if (progressFill) {
    progressFill.style.width = `${(currentStep / TOTAL_STEPS) * 100}%`;
  }

  const stepCounter = document.querySelector(SELECTORS.stepCounter);
  if (stepCounter) {
    stepCounter.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
  }

  const previousBtn = document.querySelector(SELECTORS.previousStepBtn);
  const nextBtn = document.querySelector(SELECTORS.nextStepBtn);
  if (previousBtn) {
    previousBtn.disabled = currentStep === 1;
  }
  if (nextBtn) {
    nextBtn.textContent = currentStep === TOTAL_STEPS ? "See my summary" : "Continue";
  }
}

function goToStep(step) {
  currentStep = Math.max(1, Math.min(TOTAL_STEPS, step));
  updateStepUi();
  syncUrl();
}

function validateCurrentStep() {
  if (currentStep === 1 && state.grossMonthlyIncome <= 0) {
    getForm()?.elements.grossMonthlyIncome?.focus();
    return false;
  }

  return true;
}

function currency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function percentPoints(value) {
  const signed = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  return `${signed} pts`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function bandForRatio(ratio) {
  if (ratio < 0.36) {
    return {
      tone: "lower",
      label: "Lower / stronger range",
      summary: "A lower planning range that usually leaves more room in the monthly budget.",
      next: "If you are home shopping, move next into affordability or mortgage payment scenarios to test how much housing cost still feels comfortable.",
    };
  }

  if (ratio <= 0.43) {
    return {
      tone: "moderate",
      label: "Moderate / workable range",
      summary: "A workable range for many households, but one where a larger housing payment can tighten flexibility quickly.",
      next: "Try reducing a proposed housing payment or one debt payment to see how much breathing room you can get back before committing.",
    };
  }

  return {
    tone: "stretched",
    label: "Stretched / higher-risk range",
    summary: "A higher-pressure range that can leave less room for savings, price changes, or unexpected costs.",
    next: "Consider lowering the proposed housing payment, paying down monthly debt obligations, or testing whether more income would move the ratio into a calmer range.",
  };
}

function provinceLabel(value) {
  const field = getForm()?.elements.provinceOrRegion;
  if (!field) {
    return "your region";
  }

  const option = [...field.options].find((item) => item.value === value);
  return option?.textContent || "your region";
}

function computeResults(inputState) {
  const errors = [];
  const numericKeys = Object.keys(FIELD_CONFIG).filter((key) => FIELD_CONFIG[key].type === "number");
  numericKeys.forEach((key) => {
    if (inputState[key] < 0) {
      errors.push("Enter zero or a positive amount for all monthly income and debt fields.");
    }
  });

  if (inputState.grossMonthlyIncome <= 0) {
    errors.push("Gross monthly income must be greater than zero to calculate DTI.");
  }

  const nonHousingDebt =
    inputState.carLoansMonthly +
    inputState.studentLoansMonthly +
    inputState.creditCardMinimumsMonthly +
    inputState.personalLoansMonthly +
    inputState.linesOfCreditMonthly +
    inputState.childSupportAlimonyMonthly +
    inputState.otherMonthlyDebt;

  const proposedHousingExtras =
    inputState.propertyTaxesMonthly +
    inputState.heatingMonthly +
    inputState.condoFeesMonthly;

  const proposedHousingCost = inputState.proposedHousingPayment + proposedHousingExtras;

  const includeCurrent = inputState.includeCurrentHousing && inputState.dtiMode !== "proposed-only";
  const includeProposed = inputState.includeProposedHousing && inputState.dtiMode !== "current-only";

  const currentHousingUsed = includeCurrent ? inputState.currentHousingPayment : 0;
  const proposedHousingUsed = includeProposed ? proposedHousingCost : 0;

  let housingCostUsed = 0;
  let primaryScenarioLabel = "Debt-only snapshot";
  let housingContextCopy = "No housing payment is being counted in the primary result right now.";

  if (inputState.dtiMode === "current-only" && currentHousingUsed > 0) {
    housingCostUsed = currentHousingUsed;
    primaryScenarioLabel = "Current housing snapshot";
    housingContextCopy = "The primary result uses your current housing payment plus your recurring debts.";
  } else if (inputState.dtiMode === "proposed-only" && proposedHousingUsed > 0) {
    housingCostUsed = proposedHousingUsed;
    primaryScenarioLabel = "Proposed housing plan";
    housingContextCopy = "The primary result uses your proposed housing payment plus your recurring debts.";
  } else if (proposedHousingUsed > 0) {
    housingCostUsed = proposedHousingUsed;
    primaryScenarioLabel = "Proposed housing plan";
    housingContextCopy = currentHousingUsed > 0
      ? "The featured answer uses the proposed housing payment in place of your current housing so the ratio does not double-count both."
      : "The primary result uses your proposed housing payment plus your recurring debts.";
  } else if (currentHousingUsed > 0) {
    housingCostUsed = currentHousingUsed;
    primaryScenarioLabel = "Current housing snapshot";
    housingContextCopy = "The primary result uses your current housing payment plus your recurring debts.";
  }

  const totalDebtUsed = nonHousingDebt + housingCostUsed;

  const canShowFrontEnd = inputState.useFrontEndRatio && includeProposed && proposedHousingCost > 0 && inputState.grossMonthlyIncome > 0;
  const backEndRatio = inputState.grossMonthlyIncome > 0 ? totalDebtUsed / inputState.grossMonthlyIncome : null;
  const frontEndRatio = canShowFrontEnd ? proposedHousingCost / inputState.grossMonthlyIncome : null;
  const band = backEndRatio === null ? null : bandForRatio(backEndRatio);
  const currentScenarioRatio = inputState.grossMonthlyIncome > 0 && currentHousingUsed > 0
    ? (nonHousingDebt + currentHousingUsed) / inputState.grossMonthlyIncome
    : null;
  const proposedScenarioRatio = inputState.grossMonthlyIncome > 0 && proposedHousingUsed > 0
    ? (nonHousingDebt + proposedHousingUsed) / inputState.grossMonthlyIncome
    : null;

  const primaryThreshold = 0.36;
  const targetMonthlyCapacity = inputState.grossMonthlyIncome > 0 ? inputState.grossMonthlyIncome * primaryThreshold : 0;
  const roomBeforeTargetBand = Math.max(0, targetMonthlyCapacity - totalDebtUsed);
  const incomeNeededForTarget = totalDebtUsed > 0 ? totalDebtUsed / primaryThreshold : 0;
  const debtReductionNeededForTarget = Math.max(0, totalDebtUsed - targetMonthlyCapacity);

  const debtDrivers = [
    { label: includeProposed ? "Proposed housing cost" : "Current housing cost", value: includeProposed ? proposedHousingUsed : currentHousingUsed },
    { label: "Car loans", value: inputState.carLoansMonthly },
    { label: "Student loans", value: inputState.studentLoansMonthly },
    { label: "Credit card minimums", value: inputState.creditCardMinimumsMonthly },
    { label: "Personal loans", value: inputState.personalLoansMonthly + inputState.linesOfCreditMonthly + inputState.otherMonthlyDebt },
  ]
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);

  const driverText = debtDrivers.length
    ? debtDrivers.map((item) => `${item.label} (${currency(item.value)})`).join(", ")
    : "No debt drivers are being counted yet beyond the fields currently left at zero.";

  return {
    errors,
    includeCurrent,
    includeProposed,
    canShowFrontEnd,
    nonHousingDebt,
    proposedHousingCost,
    housingCostUsed,
    totalDebtUsed,
    totalMonthlyIncomeUsed: inputState.grossMonthlyIncome,
    backEndRatio,
    frontEndRatio,
    currentScenarioRatio,
    proposedScenarioRatio,
    band,
    roomBeforeTargetBand,
    incomeNeededForTarget,
    debtReductionNeededForTarget,
    driverText,
    provinceLabel: provinceLabel(inputState.provinceOrRegion),
    primaryScenarioLabel,
    housingContextCopy,
  };
}

function renderStatus(results) {
  const status = document.querySelector(SELECTORS.resultsStatus);
  if (!status) {
    return;
  }

  if (results.errors.length) {
    status.className = "results-status is-warning";
    status.innerHTML = `
      <strong>We need one fix before calculating</strong>
      <p class="muted">${escapeHtml(results.errors[0])}</p>
    `;
    return;
  }

  status.className = `results-status is-${results.band.tone}`;
  status.innerHTML = `
    <strong>${escapeHtml(results.band.label)}</strong>
    <p class="muted">${escapeHtml(results.band.summary)}</p>
    <p class="status-note">General planning guidance only. Different lenders may use different rules.</p>
  `;
}

function resultCard(label, value, copy, tone = "") {
  return `
    <article class="result-card ${tone ? `result-card-${tone}` : ""}">
      <span class="trust-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(copy)}</p>
    </article>
  `;
}

function renderResults(results) {
  renderStatus(results);

  const countedSummary = document.querySelector(SELECTORS.countedSummary);
  const primaryAnswer = document.querySelector(SELECTORS.primaryAnswer);
  const cardsRoot = document.querySelector(SELECTORS.resultCards);
  const driverText = document.querySelector(SELECTORS.dtiDriverText);
  const nextStepsText = document.querySelector(SELECTORS.nextStepsText);
  const heroRatioPreview = document.querySelector(SELECTORS.heroRatioPreview);
  const heroStatusPreview = document.querySelector(SELECTORS.heroStatusPreview);
  const headlineCopy = document.querySelector(SELECTORS.resultHeadlineCopy);

  if (!countedSummary || !primaryAnswer || !cardsRoot || !driverText || !nextStepsText || !heroRatioPreview || !heroStatusPreview || !headlineCopy) {
    return;
  }

  if (results.errors.length) {
    countedSummary.innerHTML = `
      <strong>We will build your estimate from here</strong>
      <p class="muted">Start with income, then add only the payments you actually want included in the monthly picture.</p>
    `;
    primaryAnswer.innerHTML = `
      <div class="primary-answer-top">
        <div>
          <span class="mini-kicker">Your answer will appear here</span>
          <strong class="primary-answer-value">--</strong>
        </div>
        <div class="primary-answer-meta">
          <span class="primary-pill">Waiting for valid income</span>
        </div>
      </div>
      <p>Once your income is in place, we will turn the rest of your answers into a simple DTI summary.</p>
    `;
    cardsRoot.innerHTML = resultCard(
      "Waiting for a valid result",
      "Enter your income",
      "Once gross monthly income is above zero, the calculator will estimate your DTI instantly."
    );
    driverText.textContent = "Enter a valid income amount and any debt payments you want counted in the ratio.";
    nextStepsText.textContent = "Start with your monthly income, then keep moving through the steps. You only need to fill the pieces that apply to you.";
    heroRatioPreview.textContent = "--";
    heroStatusPreview.textContent = "Enter your income to calculate a planning estimate.";
    headlineCopy.textContent = "Back-end DTI is the primary answer because it shows how much of your monthly income is already committed.";
    return;
  }

  countedSummary.innerHTML = `
    <strong>${escapeHtml(results.primaryScenarioLabel)}</strong>
    <p class="muted">${escapeHtml(results.housingContextCopy)}</p>
  `;

  primaryAnswer.innerHTML = `
    <div class="primary-answer-top">
      <div>
        <span class="mini-kicker">Your main planning answer</span>
        <strong class="primary-answer-value">${escapeHtml(percent(results.backEndRatio))}</strong>
      </div>
      <div class="primary-answer-meta">
        <span class="primary-pill">${escapeHtml(results.band.label)}</span>
        <span class="primary-pill">${escapeHtml(results.primaryScenarioLabel)}</span>
      </div>
    </div>
    <p>${escapeHtml(results.band.summary)}</p>
    <p>${escapeHtml(results.housingContextCopy)}</p>
  `;

  const cards = [];

  if (state.useBackEndRatio) {
    cards.push(
      resultCard(
        "Back-end DTI",
        percent(results.backEndRatio),
      `The share of income already spoken for in the ${results.primaryScenarioLabel.toLowerCase()}.`,
        results.band.tone
      )
    );
  }

  if (results.canShowFrontEnd) {
    cards.push(
      resultCard(
        "Front-end DTI",
        percent(results.frontEndRatio),
        "The housing-only version of the ratio."
      )
    );
  }

  cards.push(
    resultCard(
      "Monthly debt used",
      currency(results.totalDebtUsed),
      "The monthly total behind the main answer."
    ),
    resultCard(
      "Housing in the result",
      currency(results.housingCostUsed),
      results.includeProposed
        ? "Includes the proposed payment and any extras you added."
        : "Uses the current housing amount you included."
    ),
    resultCard(
      "Room before 36%",
      currency(results.roomBeforeTargetBand),
      "Rough monthly room left before a lower planning threshold."
    ),
    resultCard(
      "Income needed for 36%",
      currency(results.incomeNeededForTarget),
      "A rough monthly income target for a lower range."
    )
  );

  cardsRoot.innerHTML = cards.join("");
  driverText.textContent = results.driverText;
  nextStepsText.textContent = results.band.next;
  heroRatioPreview.textContent = percent(results.backEndRatio);
  heroStatusPreview.textContent = results.band.summary;
  headlineCopy.textContent = `For ${results.provinceLabel}, this is a planning estimate built to be easy to read. Back-end DTI stays first because it reflects the full monthly payment load competing for income.`;
}

function renderComparison(results) {
  const comparisonRoot = document.querySelector(SELECTORS.comparisonCards);
  if (!comparisonRoot) {
    return;
  }

  if (results.errors.length) {
    comparisonRoot.innerHTML = `
      <article class="comparison-card">
        <span class="trust-label">Comparison comes next</span>
        <strong>Add your income first</strong>
        <p>Once the main result is ready, we can show how another setup changes it.</p>
      </article>
    `;
    return;
  }

  if (!comparisonScenario && results.currentScenarioRatio !== null && results.proposedScenarioRatio !== null) {
    const change = (results.proposedScenarioRatio - results.currentScenarioRatio) * 100;
    comparisonRoot.innerHTML = `
      <article class="comparison-card">
        <span class="trust-label">Where you are now</span>
        <strong>${escapeHtml(percent(results.currentScenarioRatio))}</strong>
        <p>Current housing plus the other debts you entered.</p>
      </article>
      <article class="comparison-card">
        <span class="trust-label">The payment you want to test</span>
        <strong>${escapeHtml(percent(results.proposedScenarioRatio))}</strong>
        <p>Your proposed payment with the same other debts.</p>
      </article>
      <article class="comparison-card ${change > 0 ? "comparison-card-up" : "comparison-card-down"}">
        <span class="trust-label">What changes</span>
        <strong>${escapeHtml(percentPoints(change))}</strong>
        <p>${change > 0
          ? "The proposed payment pushes your DTI higher than your current setup."
          : change < 0
            ? "The proposed payment lowers your DTI compared with your current setup."
            : "Both setups land in the same place for back-end DTI."}</p>
      </article>
    `;
    return;
  }

  if (!comparisonScenario) {
    comparisonRoot.innerHTML = `
      <article class="comparison-card">
        <span class="trust-label">Want to compare another version?</span>
        <strong>Save this setup first</strong>
        <p>After saving, change a number and we will show how much the answer moves.</p>
      </article>
    `;
    return;
  }

  const savedResults = computeResults(comparisonScenario);
  if (savedResults.errors.length) {
    comparisonRoot.innerHTML = `
      <article class="comparison-card">
        <span class="trust-label">Saved version needs a refresh</span>
        <strong>Clear it and save again</strong>
        <p>The saved setup is missing something we need for a clean side-by-side comparison.</p>
      </article>
    `;
    return;
  }

  const change = (results.backEndRatio - savedResults.backEndRatio) * 100;
  comparisonRoot.innerHTML = `
      <article class="comparison-card">
        <span class="trust-label">Saved version</span>
        <strong>${escapeHtml(comparisonScenario.scenarioName || "Saved version")}</strong>
      <p>Main answer: ${escapeHtml(percent(savedResults.backEndRatio))}</p>
    </article>
    <article class="comparison-card">
      <span class="trust-label">What you are looking at now</span>
      <strong>${escapeHtml(state.scenarioName || "Current version")}</strong>
      <p>Main answer: ${escapeHtml(percent(results.backEndRatio))}</p>
    </article>
    <article class="comparison-card ${change > 0 ? "comparison-card-up" : "comparison-card-down"}">
      <span class="trust-label">How far it moved</span>
      <strong>${escapeHtml(percentPoints(change))}</strong>
      <p>${change > 0
        ? "This version raises your DTI and adds more payment pressure than the saved one."
        : change < 0
          ? "This version lowers your DTI and gives you more breathing room than the saved one."
          : "These two versions land in the same place for back-end DTI."}</p>
    </article>
  `;
}

function renderRelatedTools() {
  const root = document.querySelector(SELECTORS.relatedToolsGrid);
  if (!root) {
    return;
  }

  root.innerHTML = RELATED_TOOLS.map((tool) => `
    <article class="related-card">
      <h3>${escapeHtml(tool.title)}</h3>
      <p>${escapeHtml(tool.description)}</p>
      <a class="text-link" href="${escapeHtml(tool.href)}">${escapeHtml(tool.ctaLabel || "Open tool")}</a>
    </article>
  `).join("");
}

function setDisplayMode(mode) {
  displayMode = mode === "advanced" ? "advanced" : "simple";
  document.querySelectorAll("[data-advanced='true']").forEach((element) => {
    element.hidden = displayMode !== "advanced";
  });
  document.querySelectorAll("[data-simple-only='true']").forEach((element) => {
    element.hidden = displayMode === "advanced";
  });

  const simpleBtn = document.querySelector(SELECTORS.simpleModeBtn);
  const advancedBtn = document.querySelector(SELECTORS.advancedModeBtn);
  const modeSummary = document.querySelector(SELECTORS.modeSummary);

  if (simpleBtn && advancedBtn) {
    const simpleActive = displayMode === "simple";
    simpleBtn.classList.toggle("is-active", simpleActive);
    advancedBtn.classList.toggle("is-active", !simpleActive);
    simpleBtn.setAttribute("aria-pressed", String(simpleActive));
    advancedBtn.setAttribute("aria-pressed", String(!simpleActive));
  }

  if (modeSummary) {
    modeSummary.innerHTML = displayMode === "advanced"
      ? "<strong>Advanced detail is on.</strong> You can now enter province, housing extras, extra debt categories, and a saved scenario name."
      : "<strong>Simple path is on.</strong> You are seeing the core planning fields only. Hidden advanced fields are not counted until you switch advanced detail back on.";
  }
}

function syncModeToScenario() {
  const form = getForm();
  if (!form) {
    return;
  }

  const mode = form.elements.dtiMode.value;

  if (mode === "current-only") {
    form.elements.includeCurrentHousing.checked = true;
    form.elements.includeProposedHousing.checked = false;
  } else if (mode === "proposed-only") {
    form.elements.includeCurrentHousing.checked = false;
    form.elements.includeProposedHousing.checked = true;
  }
}

function saveScenario() {
  const results = computeResults(state);
  const feedback = document.querySelector(SELECTORS.shareFeedback);

  if (results.errors.length) {
    if (feedback) {
      feedback.textContent = "Add a valid income before saving this version.";
    }
    return;
  }

  comparisonScenario = { ...state };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonScenario));
  renderComparison(results);
  if (feedback) {
    feedback.textContent = `Saved "${comparisonScenario.scenarioName}" so you can compare it with your next version.`;
  }
}

function clearScenario() {
  comparisonScenario = null;
  localStorage.removeItem(STORAGE_KEY);
  renderComparison(computeResults(state));
  const feedback = document.querySelector(SELECTORS.shareFeedback);
  if (feedback) {
    feedback.textContent = "Saved version cleared.";
  }
}

function loadComparisonScenario() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return sanitizeState(JSON.parse(raw));
  } catch (error) {
    return null;
  }
}

async function copyShareLink() {
  const feedback = document.querySelector(SELECTORS.shareFeedback);
  try {
    await navigator.clipboard.writeText(window.location.href);
    if (feedback) {
      feedback.textContent = "Share link copied.";
    }
  } catch (error) {
    if (feedback) {
      feedback.textContent = `Copy failed. Use this link manually: ${window.location.href}`;
    }
  }
}

function handleInput() {
  syncModeToScenario();
  state = readFormState();
  const results = computeResults(state);
  renderResults(results);
  renderComparison(results);
  syncUrl();
}

function bindEvents() {
  const form = getForm();
  if (form) {
    form.addEventListener("input", handleInput);
    form.addEventListener("change", handleInput);
  }

  document.querySelector(SELECTORS.simpleModeBtn)?.addEventListener("click", () => {
    setDisplayMode("simple");
    handleInput();
  });

  document.querySelector(SELECTORS.advancedModeBtn)?.addEventListener("click", () => {
    setDisplayMode("advanced");
    handleInput();
  });

  document.querySelector(SELECTORS.previousStepBtn)?.addEventListener("click", () => {
    goToStep(currentStep - 1);
  });

  document.querySelector(SELECTORS.nextStepBtn)?.addEventListener("click", () => {
    state = readFormState();
    if (!validateCurrentStep()) {
      handleInput();
      return;
    }
    goToStep(currentStep + 1);
  });

  document.querySelectorAll(".progress-step").forEach((button) => {
    button.addEventListener("click", () => {
      const requestedStep = Number(button.dataset.stepTarget);
      state = readFormState();
      if (requestedStep > currentStep && !validateCurrentStep()) {
        handleInput();
        return;
      }
      goToStep(requestedStep);
    });
  });

  document.querySelector(SELECTORS.loadSampleBtn)?.addEventListener("click", () => {
    setFormState(SAMPLE_STATE);
    goToStep(1);
    handleInput();
  });

  document.querySelector(SELECTORS.resetBtn)?.addEventListener("click", () => {
    setFormState(DEFAULT_STATE);
    goToStep(1);
    handleInput();
  });

  document.querySelector(SELECTORS.saveScenarioBtn)?.addEventListener("click", saveScenario);
  document.querySelector(SELECTORS.clearScenarioBtn)?.addEventListener("click", clearScenario);
  document.querySelector(SELECTORS.shareBtn)?.addEventListener("click", copyShareLink);
}

function initialize() {
  restoreFromUrl();
  setDisplayMode(displayMode);
  syncModeToScenario();
  state = readFormState();
  bindEvents();
  updateStepUi();
  renderRelatedTools();
  handleInput();
}

initialize();
})();
