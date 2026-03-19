(() => {
const SCHEMA_VERSION = 1;
const STORAGE_KEY = "simplekit.savings-goal-calculator.v1";
const MAX_SIMULATION_PERIODS = 2400;
const MAX_BINARY_SEARCH = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const AVERAGE_DAYS_PER_YEAR = 365.2425;

const CATEGORY_OPTIONS = [
  { value: "emergency_fund", label: "Emergency fund" },
  { value: "vacation", label: "Vacation" },
  { value: "down_payment", label: "Down payment" },
  { value: "car", label: "Car" },
  { value: "wedding", label: "Wedding" },
  { value: "renovation", label: "Renovation" },
  { value: "education", label: "Education" },
  { value: "custom", label: "Custom" },
];

const CONTRIBUTION_FREQUENCIES = [
  { value: "weekly", label: "Weekly", periodsPerYear: 52 },
  { value: "biweekly", label: "Bi-weekly", periodsPerYear: 26 },
  { value: "semi_monthly", label: "Semi-monthly", periodsPerYear: 24 },
  { value: "monthly", label: "Monthly", periodsPerYear: 12 },
  { value: "annual", label: "Annual", periodsPerYear: 1 },
];

const COMPOUNDING_FREQUENCIES = [
  { value: "monthly", label: "Monthly", periodsPerYear: 12 },
  { value: "quarterly", label: "Quarterly", periodsPerYear: 4 },
  { value: "semi_annual", label: "Semi-annual", periodsPerYear: 2 },
  { value: "annual", label: "Annual", periodsPerYear: 1 },
];

const MODE_COPY = {
  timeToGoal: {
    button: "When will I reach my goal?",
    summary: "Estimate when you could reach your goal using the savings plan you have in mind.",
  },
  requiredContribution: {
    button: "What do I need to save?",
    summary: "Solve for the savings amount needed to reach your goal by the target date you choose.",
  },
};

const SAMPLE_SCENARIO = {
  name: "House Down Payment",
  goalCategory: "down_payment",
  goalAmount: 80000,
  currentSavings: 15000,
  contributionAmount: 1200,
  contributionFrequency: "monthly",
  annualInterestRate: 3.5,
  compounding: "monthly",
  startDate: getTodayString(),
  targetDate: addMonthsClamped(parseDate(getTodayString()), 51).toISOString().slice(0, 10),
  inflationRate: 2.0,
  notes: "Trying to reach the down payment goal within about four years.",
};

const selectors = {
  form: "#scenarioForm",
  modeButtons: ".mode-pill",
  scenarioList: "#scenarioList",
  summaryCardsPrimary: "#summaryCardsPrimary",
  summaryCardsSecondary: "#summaryCardsSecondary",
  insightsList: "#insightsList",
  validationSummary: "#validationSummary",
  storageStatus: "#storageStatus",
  resultsSummaryText: "#resultsSummaryText",
  projectionTableBody: "#projectionTableBody",
  projectionViewSelect: "#projectionViewSelect",
  milestoneChips: "#milestoneChips",
  comparisonTableBody: "#comparisonTableBody",
  comparisonHighlights: "#comparisonHighlights",
  growthChart: "#growthChart",
  mixChart: "#mixChart",
  comparisonChart: "#comparisonChart",
  reportScenarioSummary: "#reportScenarioSummary",
  reportAssumptions: "#reportAssumptions",
  reportMilestones: "#reportMilestones",
  reportComparison: "#reportComparison",
  reportGeneratedAt: "#reportGeneratedAt",
  reportNotes: "#reportNotes",
  reportExecutiveSummary: "#reportExecutiveSummary",
  modeHelperTitle: "#modeHelperTitle",
  modeHelperSummary: "#modeHelperSummary",
  modeHelperText: "#modeHelperText",
  modeRecommendedTag: "#modeRecommendedTag",
  scenarioSummaryMeta: "#scenarioSummaryMeta",
  scenarioManagerPanel: "#scenarioManagerPanel",
  comparisonSortSelect: "#comparisonSortSelect",
  comparisonSelectionMeta: "#comparisonSelectionMeta",
};

let appState = createDefaultState();
let derivedCache = new Map();

function createDefaultScenario(overrides = {}) {
  const today = getTodayString();
  return {
    id: createId(),
    name: "Starter Goal",
    goalCategory: "emergency_fund",
    goalAmount: 10000,
    currentSavings: 1000,
    contributionAmount: 300,
    contributionFrequency: "monthly",
    annualInterestRate: 3,
    compounding: "monthly",
    startDate: today,
    targetDate: addMonthsClamped(parseDate(today), 24).toISOString().slice(0, 10),
    inflationRate: 2,
    notes: "",
    ...overrides,
  };
}

function createDefaultState() {
  const scenario = createDefaultScenario();
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      currency: "CAD",
    },
    mode: "timeToGoal",
    selectedScenarioId: scenario.id,
    compareScenarioIds: [scenario.id],
    scenarios: [scenario],
  };
}

function getSelectedScenario() {
  return appState.scenarios.find((scenario) => scenario.id === appState.selectedScenarioId) || appState.scenarios[0];
}

function getScenarioById(id) {
  return appState.scenarios.find((scenario) => scenario.id === id);
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `scenario-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function getTodayString() {
  return formatDateInput(new Date());
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLong(value) {
  const date = typeof value === "string" ? parseDate(value) : value;
  if (!date) {
    return "Not set";
  }
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonthsClamped(date, months) {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function addYearsClamped(date, years) {
  const next = new Date(date);
  const month = next.getMonth();
  next.setFullYear(next.getFullYear() + years);
  if (next.getMonth() !== month) {
    next.setDate(0);
  }
  return next;
}

function diffDays(startDate, endDate) {
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS));
}

function yearsBetween(startDate, endDate) {
  return diffDays(startDate, endDate) / AVERAGE_DAYS_PER_YEAR;
}

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function clampNumber(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function parseNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function currencyFormatter() {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: appState.settings.currency || "CAD",
    maximumFractionDigits: 0,
  });
}

function currencyPreciseFormatter() {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: appState.settings.currency || "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function compactCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: appState.settings.currency || "CAD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function percentFormatter(value, digits = 1) {
  return `${Number(value).toFixed(digits)}%`;
}

function humanizeDuration(totalDays) {
  if (totalDays <= 0) {
    return "Already reached";
  }
  const months = Math.round(totalDays / 30.4375);
  if (months < 1) {
    return `${totalDays} days`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts = [];
  if (years > 0) {
    parts.push(`${years} year${years === 1 ? "" : "s"}`);
  }
  if (remainingMonths > 0) {
    parts.push(`${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`);
  }
  return parts.join(" ") || "Less than 1 month";
}

function getFrequencyMeta(collection, value) {
  return collection.find((item) => item.value === value) || collection[0];
}

function getEffectiveAnnualRate(annualInterestRate, compoundingValue) {
  const nominalRate = clampNumber(parseNumber(annualInterestRate) / 100, 0, 1);
  const compoundingPeriods = getFrequencyMeta(COMPOUNDING_FREQUENCIES, compoundingValue).periodsPerYear;
  if (nominalRate === 0) {
    return 0;
  }
  return (1 + nominalRate / compoundingPeriods) ** compoundingPeriods - 1;
}

function getDailyRate(annualInterestRate, compoundingValue) {
  const effectiveAnnualRate = getEffectiveAnnualRate(annualInterestRate, compoundingValue);
  if (effectiveAnnualRate <= 0) {
    return 0;
  }
  return (1 + effectiveAnnualRate) ** (1 / AVERAGE_DAYS_PER_YEAR) - 1;
}

function getMonthlyEquivalent(amount, contributionFrequency) {
  const periodsPerYear = getFrequencyMeta(CONTRIBUTION_FREQUENCIES, contributionFrequency).periodsPerYear;
  return (parseNumber(amount) * periodsPerYear) / 12;
}

function getNextSemiMonthlyDate(previousDate) {
  const date = new Date(previousDate);
  const day = date.getDate();
  if (day < 15) {
    date.setDate(15);
  } else {
    date.setMonth(date.getMonth() + 1, 1);
  }
  if (date.getTime() <= previousDate.getTime()) {
    if (date.getDate() === 1) {
      date.setDate(15);
    } else {
      date.setMonth(date.getMonth() + 1, 1);
    }
  }
  return date;
}

function getNextContributionDate(previousDate, contributionFrequency) {
  switch (contributionFrequency) {
    case "weekly":
      return addDays(previousDate, 7);
    case "biweekly":
      return addDays(previousDate, 14);
    case "semi_monthly":
      return getNextSemiMonthlyDate(previousDate);
    case "annual":
      return addYearsClamped(previousDate, 1);
    case "monthly":
    default:
      return addMonthsClamped(previousDate, 1);
  }
}

function buildProjection(scenario, options = {}) {
  const contributionOverride = options.contributionAmount;
  const stopAtGoal = Boolean(options.stopAtGoal);
  const targetDate = options.targetDate ? parseDate(options.targetDate) : null;
  const goalAmount = parseNumber(scenario.goalAmount);
  const contributionAmount = roundCurrency(
    contributionOverride != null ? contributionOverride : parseNumber(scenario.contributionAmount)
  );
  const startDate = parseDate(scenario.startDate);
  const dailyRate = getDailyRate(scenario.annualInterestRate, scenario.compounding);
  const rows = [];
  let balance = parseNumber(scenario.currentSavings);
  let previousDate = startDate;
  let nextContributionDate = null;
  let totalInterest = 0;
  let totalContributions = 0;
  let reachedGoalRow = null;
  let periods = 0;

  if (!startDate) {
    return {
      rows,
      balance,
      totalInterest,
      totalContributions,
      reachedGoalRow,
      endDate: null,
      periods,
    };
  }

  nextContributionDate = getNextContributionDate(startDate, scenario.contributionFrequency);

  if (goalAmount > 0 && balance >= goalAmount && stopAtGoal) {
    return {
      rows,
      balance,
      totalInterest,
      totalContributions,
      reachedGoalRow: {
        period: 0,
        date: startDate,
        startingBalance: balance,
        contribution: 0,
        interest: 0,
        endingBalance: balance,
        goalProgress: 100,
      },
      endDate: startDate,
      periods: 0,
    };
  }

  while (periods < MAX_SIMULATION_PERIODS) {
    if (targetDate && nextContributionDate.getTime() > targetDate.getTime()) {
      break;
    }

    const days = diffDays(previousDate, nextContributionDate);
    const startingBalance = balance;
    const interest = dailyRate > 0 ? balance * ((1 + dailyRate) ** days - 1) : 0;
    balance += interest;
    balance += contributionAmount;
    totalInterest += interest;
    totalContributions += contributionAmount;
    periods += 1;

    const row = {
      period: periods,
      date: nextContributionDate,
      startingBalance: roundCurrency(startingBalance),
      contribution: contributionAmount,
      interest: roundCurrency(interest),
      endingBalance: roundCurrency(balance),
      goalProgress: goalAmount > 0 ? clampNumber((balance / goalAmount) * 100, 0, 999) : 0,
    };
    rows.push(row);

    if (goalAmount > 0 && balance >= goalAmount && !reachedGoalRow) {
      reachedGoalRow = row;
      if (stopAtGoal) {
        previousDate = nextContributionDate;
        break;
      }
    }

    previousDate = nextContributionDate;
    nextContributionDate = getNextContributionDate(nextContributionDate, scenario.contributionFrequency);
  }

  let finalDate = rows.length > 0 ? rows[rows.length - 1].date : startDate;
  if (targetDate && finalDate.getTime() < targetDate.getTime()) {
    const days = diffDays(finalDate, targetDate);
    const interest = dailyRate > 0 ? balance * ((1 + dailyRate) ** days - 1) : 0;
    balance += interest;
    totalInterest += interest;
    finalDate = targetDate;
  }

  return {
    rows,
    balance: roundCurrency(balance),
    totalInterest: roundCurrency(totalInterest),
    totalContributions: roundCurrency(totalContributions),
    reachedGoalRow,
    endDate: finalDate,
    periods,
  };
}

function countContributionPeriods(startDateValue, targetDateValue, contributionFrequency) {
  const startDate = parseDate(startDateValue);
  const targetDate = parseDate(targetDateValue);
  if (!startDate || !targetDate || targetDate.getTime() <= startDate.getTime()) {
    return 0;
  }
  let count = 0;
  let cursor = getNextContributionDate(startDate, contributionFrequency);
  while (count < MAX_SIMULATION_PERIODS && cursor.getTime() <= targetDate.getTime()) {
    count += 1;
    cursor = getNextContributionDate(cursor, contributionFrequency);
  }
  return count;
}

function solveRequiredContribution(scenario) {
  const targetDate = parseDate(scenario.targetDate);
  const startDate = parseDate(scenario.startDate);
  if (!targetDate || !startDate || targetDate.getTime() <= startDate.getTime()) {
    return { contributionAmount: null, reason: "Target date must be after the start date." };
  }

  const contributionPeriods = countContributionPeriods(
    scenario.startDate,
    scenario.targetDate,
    scenario.contributionFrequency
  );
  if (contributionPeriods === 0) {
    return { contributionAmount: null, reason: "There are no contribution periods before the target date." };
  }

  const goalAmount = parseNumber(scenario.goalAmount);
  const baseProjection = buildProjection(scenario, {
    contributionAmount: 0,
    targetDate: scenario.targetDate,
    stopAtGoal: false,
  });
  if (baseProjection.balance >= goalAmount) {
    return { contributionAmount: 0, reason: null };
  }

  let low = 0;
  let high = Math.max(goalAmount - parseNumber(scenario.currentSavings), 1);
  let highProjection = buildProjection(scenario, {
    contributionAmount: high,
    targetDate: scenario.targetDate,
    stopAtGoal: false,
  });

  while (highProjection.balance < goalAmount && high < 1e8) {
    high *= 2;
    highProjection = buildProjection(scenario, {
      contributionAmount: high,
      targetDate: scenario.targetDate,
      stopAtGoal: false,
    });
  }

  if (highProjection.balance < goalAmount) {
    return { contributionAmount: null, reason: "This target is too aggressive to solve within safe calculator limits." };
  }

  for (let iteration = 0; iteration < MAX_BINARY_SEARCH; iteration += 1) {
    const midpoint = (low + high) / 2;
    const projection = buildProjection(scenario, {
      contributionAmount: midpoint,
      targetDate: scenario.targetDate,
      stopAtGoal: false,
    });

    if (projection.balance >= goalAmount) {
      high = midpoint;
    } else {
      low = midpoint;
    }
  }

  return { contributionAmount: roundCurrency(Math.ceil(high * 100) / 100), reason: null };
}

function getRealismLabel(monthlyRequired, scenario, periodsLeft) {
  const gap = Math.max(parseNumber(scenario.goalAmount) - parseNumber(scenario.currentSavings), 0);
  const monthsLeft = Math.max(yearsBetween(parseDate(scenario.startDate), parseDate(scenario.targetDate)) * 12, 1);
  const baseline = gap / monthsLeft;

  if (periodsLeft <= 2 || monthlyRequired > baseline * 1.75) {
    return "Aggressive";
  }
  if (monthlyRequired > baseline * 1.25) {
    return "Stretch";
  }
  return "Steady";
}

function validateScenario(scenario, mode) {
  const errors = [];

  if (!scenario.name.trim()) {
    errors.push("Add a scenario name so the report and comparison table stay easy to read.");
  }
  if (parseNumber(scenario.goalAmount) <= 0) {
    errors.push("Goal amount must be greater than zero.");
  }
  if (parseNumber(scenario.currentSavings) < 0) {
    errors.push("Current savings cannot be negative.");
  }
  if (parseNumber(scenario.contributionAmount) < 0) {
    errors.push("Contribution amount cannot be negative.");
  }
  if (parseNumber(scenario.annualInterestRate) < 0 || parseNumber(scenario.annualInterestRate) > 100) {
    errors.push("Annual interest rate must be between 0% and 100%.");
  }
  if (parseNumber(scenario.inflationRate) < 0 || parseNumber(scenario.inflationRate) > 100) {
    errors.push("Inflation assumption must be between 0% and 100%.");
  }

  const startDate = parseDate(scenario.startDate);
  if (!startDate) {
    errors.push("Choose a valid start date.");
  }

  if (mode === "requiredContribution") {
    const targetDate = parseDate(scenario.targetDate);
    if (!targetDate) {
      errors.push("Choose a valid target date for required contribution mode.");
    } else if (startDate && targetDate.getTime() <= startDate.getTime()) {
      errors.push("Target date must be later than the start date.");
    }
  }

  if (mode === "timeToGoal" && parseNumber(scenario.contributionAmount) === 0 && parseNumber(scenario.annualInterestRate) === 0 &&
    parseNumber(scenario.currentSavings) < parseNumber(scenario.goalAmount)) {
    errors.push("With zero contributions and zero interest, this goal will never be reached.");
  }

  return errors;
}

function calculateScenarioOutcome(scenario, mode) {
  const cacheKey = JSON.stringify({ scenario, mode });
  if (derivedCache.has(cacheKey)) {
    return derivedCache.get(cacheKey);
  }

  const errors = validateScenario(scenario, mode);
  if (errors.length > 0) {
    const result = { mode, errors, scenario };
    derivedCache.set(cacheKey, result);
    return result;
  }

  const startDate = parseDate(scenario.startDate);
  const goalAmount = parseNumber(scenario.goalAmount);
  const currentSavings = parseNumber(scenario.currentSavings);
  let requiredContribution = null;
  let realismLabel = null;
  let projection;
  let finalBalanceAtTarget = null;
  let targetShortfall = null;

  if (mode === "requiredContribution") {
    const solved = solveRequiredContribution(scenario);
    if (solved.reason) {
      const result = { mode, errors: [solved.reason], scenario };
      derivedCache.set(cacheKey, result);
      return result;
    }
    requiredContribution = solved.contributionAmount;
    projection = buildProjection(scenario, {
      contributionAmount: requiredContribution,
      targetDate: scenario.targetDate,
      stopAtGoal: false,
    });
    finalBalanceAtTarget = projection.balance;
    targetShortfall = roundCurrency(Math.max(goalAmount - finalBalanceAtTarget, 0));
    realismLabel = getRealismLabel(
      getMonthlyEquivalent(requiredContribution, scenario.contributionFrequency),
      scenario,
      projection.periods
    );
  } else {
    projection = buildProjection(scenario, {
      contributionAmount: scenario.contributionAmount,
      stopAtGoal: true,
    });
    if (!projection.reachedGoalRow) {
      const result = {
        mode,
        scenario,
        errors: ["This goal was not reached within the current calculator horizon. Try a higher contribution, a higher return, or a smaller goal."],
      };
      derivedCache.set(cacheKey, result);
      return result;
    }

    if (scenario.targetDate) {
      const targetProjection = buildProjection(scenario, {
        contributionAmount: scenario.contributionAmount,
        targetDate: scenario.targetDate,
        stopAtGoal: false,
      });
      finalBalanceAtTarget = targetProjection.balance;
      targetShortfall = roundCurrency(Math.max(goalAmount - finalBalanceAtTarget, 0));
    }
  }

  const achievedDate = mode === "requiredContribution"
    ? parseDate(scenario.targetDate)
    : projection.reachedGoalRow?.date || projection.endDate;
  const totalDays = achievedDate ? diffDays(startDate, achievedDate) : 0;
  const inflationAdjustedGoal = roundCurrency(
    goalAmount * ((1 + parseNumber(scenario.inflationRate) / 100) ** yearsBetween(startDate, achievedDate || startDate))
  );
  const finalBalance = mode === "requiredContribution" ? finalBalanceAtTarget : projection.balance;
  const totalInterest = projection.totalInterest;
  const totalContributions = projection.totalContributions;
  const contributionAmount = mode === "requiredContribution" ? requiredContribution : parseNumber(scenario.contributionAmount);
  const progressNow = goalAmount > 0 ? clampNumber((currentSavings / goalAmount) * 100, 0, 100) : 0;
  const interestShare = finalBalance > 0 ? clampNumber((totalInterest / finalBalance) * 100, 0, 100) : 0;
  const extraPerPeriod = roundCurrency((100 * 12) / getFrequencyMeta(CONTRIBUTION_FREQUENCIES, scenario.contributionFrequency).periodsPerYear);
  let whatIfMonthsSaved = null;

  if (mode === "timeToGoal" && contributionAmount >= 0) {
    const boosted = buildProjection(scenario, {
      contributionAmount: contributionAmount + extraPerPeriod,
      stopAtGoal: true,
    });
    if (boosted.reachedGoalRow) {
      const deltaDays = Math.max(0, totalDays - diffDays(startDate, boosted.reachedGoalRow.date));
      whatIfMonthsSaved = Math.round(deltaDays / 30.4375);
    }
  }

  const result = {
    mode,
    errors: [],
    scenario,
    contributionAmount,
    goalAmount,
    currentSavings,
    requiredContribution,
    realismLabel,
    totalDays,
    timelineLabel: humanizeDuration(totalDays),
    goalDate: achievedDate ? formatDateLong(achievedDate) : "Not reached",
    goalDateRaw: achievedDate,
    totalContributions,
    totalInterest,
    finalBalance,
    finalBalanceAtTarget,
    targetShortfall,
    progressNow,
    interestShare,
    projectionRows: projection.rows,
    contributionFrequencyLabel: getFrequencyMeta(CONTRIBUTION_FREQUENCIES, scenario.contributionFrequency).label,
    compoundingLabel: getFrequencyMeta(COMPOUNDING_FREQUENCIES, scenario.compounding).label,
    inflationAdjustedGoal,
    monthlyEquivalentContribution: getMonthlyEquivalent(contributionAmount, scenario.contributionFrequency),
    whatIfMonthsSaved,
    onTrackText: mode === "timeToGoal"
      ? `On track to reach the goal around ${formatDateLong(achievedDate)}.`
      : `Reaching the goal by ${formatDateLong(achievedDate)} requires about ${currencyPreciseFormatter().format(contributionAmount)} per ${getFrequencyMeta(CONTRIBUTION_FREQUENCIES, scenario.contributionFrequency).label.toLowerCase().replace("-", " ")} period.`,
  };

  derivedCache.set(cacheKey, result);
  return result;
}

function serializeState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: { ...appState.settings },
    mode: appState.mode,
    selectedScenarioId: appState.selectedScenarioId,
    compareScenarioIds: [...appState.compareScenarioIds],
    scenarios: appState.scenarios.map((scenario) => ({ ...scenario })),
  };
}

function normalizeScenario(rawScenario) {
  const normalized = createDefaultScenario({
    id: rawScenario.id || createId(),
    name: String(rawScenario.name || "Untitled scenario").slice(0, 80),
    goalCategory: rawScenario.goalCategory || "custom",
    goalAmount: roundCurrency(parseNumber(rawScenario.goalAmount)),
    currentSavings: roundCurrency(parseNumber(rawScenario.currentSavings)),
    contributionAmount: roundCurrency(parseNumber(rawScenario.contributionAmount)),
    contributionFrequency: rawScenario.contributionFrequency || "monthly",
    annualInterestRate: parseNumber(rawScenario.annualInterestRate),
    compounding: rawScenario.compounding || "monthly",
    startDate: rawScenario.startDate || getTodayString(),
    targetDate: rawScenario.targetDate || "",
    inflationRate: parseNumber(rawScenario.inflationRate),
    notes: String(rawScenario.notes || ""),
  });

  return normalized;
}

function normalizeImportedState(rawState) {
  if (!rawState || typeof rawState !== "object") {
    throw new Error("The imported file does not contain a valid savings plan.");
  }

  if (!Array.isArray(rawState.scenarios) || rawState.scenarios.length === 0) {
    throw new Error("The imported file does not include any scenarios.");
  }

  const scenarios = rawState.scenarios.map(normalizeScenario);
  const selectedScenarioId = scenarios.some((scenario) => scenario.id === rawState.selectedScenarioId)
    ? rawState.selectedScenarioId
    : scenarios[0].id;
  const compareScenarioIds = Array.isArray(rawState.compareScenarioIds)
    ? rawState.compareScenarioIds.filter((id) => scenarios.some((scenario) => scenario.id === id))
    : [selectedScenarioId];

  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      currency: rawState.settings?.currency || "CAD",
    },
    mode: rawState.mode === "requiredContribution" ? "requiredContribution" : "timeToGoal",
    selectedScenarioId,
    compareScenarioIds: compareScenarioIds.length > 0 ? compareScenarioIds : [selectedScenarioId],
    scenarios,
  };
}

function saveToLocalStorage(message = "Changes saved in this browser.") {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
    setStorageStatus(message);
  } catch (error) {
    setStorageStatus("Local save failed. Your browser may be blocking storage.");
  }
}

function restoreFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }
    appState = normalizeImportedState(JSON.parse(raw));
    return true;
  } catch (error) {
    return false;
  }
}

function setStorageStatus(message) {
  const element = document.querySelector(selectors.storageStatus);
  if (element) {
    element.textContent = message;
  }
}

function friendlyFrequencyLabel(value) {
  return getFrequencyMeta(CONTRIBUTION_FREQUENCIES, value).label.toLowerCase().replace("-", " ");
}

function populateSelect(selectId, options) {
  const select = document.querySelector(selectId);
  if (!select) {
    return;
  }
  select.innerHTML = options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("");
}

function syncForm() {
  const scenario = getSelectedScenario();
  if (!scenario) {
    return;
  }
  const form = document.querySelector(selectors.form);
  if (!form) {
    return;
  }

  Object.entries(scenario).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value ?? "";
    }
  });

  const contributionInput = form.elements.namedItem("contributionAmount");
  const targetDateField = document.querySelector("[data-target-date-field]");
  const contributionField = document.querySelector("[data-contribution-field]");
  const contributionLabel = document.querySelector("#contributionFieldLabel");
  const contributionHelp = document.querySelector("#contributionFieldHelp");
  const calculatedBadge = document.querySelector("#calculatedBadge");
  const formModeHint = document.querySelector("#formModeHint");
  const targetDateHelp = document.querySelector("#targetDateHelp");
  if (appState.mode === "requiredContribution") {
    contributionInput.setAttribute("readonly", "readonly");
    contributionInput.setAttribute("aria-readonly", "true");
    contributionField?.classList.add("field-readonly");
    targetDateField?.classList.remove("field-hidden");
    if (contributionLabel) {
      contributionLabel.textContent = "Required contribution";
    }
    if (contributionHelp) {
      contributionHelp.textContent = `This is calculated for you based on the selected ${friendlyFrequencyLabel(scenario.contributionFrequency)} schedule.`;
    }
    if (calculatedBadge) {
      calculatedBadge.hidden = false;
    }
    if (formModeHint) {
      formModeHint.textContent = "Set your deadline first. The calculator will solve for the contribution needed to get there on time.";
    }
    if (targetDateHelp) {
      targetDateHelp.textContent = "Required in this mode because the deadline drives the calculation.";
    }
  } else {
    contributionInput.removeAttribute("readonly");
    contributionInput.removeAttribute("aria-readonly");
    contributionField?.classList.remove("field-readonly");
    targetDateField?.classList.remove("field-hidden");
    if (contributionLabel) {
      contributionLabel.textContent = "Contribution amount";
    }
    if (contributionHelp) {
      contributionHelp.textContent = "How much you expect to add each contribution period.";
    }
    if (calculatedBadge) {
      calculatedBadge.hidden = true;
    }
    if (formModeHint) {
      formModeHint.textContent = "Enter the amount you can save each period. The calculator will estimate how long the goal could take.";
    }
    if (targetDateHelp) {
      targetDateHelp.textContent = "Optional in this mode. Add one if you want to check whether you are on pace for a deadline.";
    }
  }
}

function readFormIntoScenario() {
  const scenario = getSelectedScenario();
  const form = document.querySelector(selectors.form);
  if (!scenario || !form) {
    return;
  }

  const nextScenario = {
    ...scenario,
    name: form.elements.name.value.trim(),
    goalCategory: form.elements.goalCategory.value,
    goalAmount: roundCurrency(parseNumber(form.elements.goalAmount.value)),
    currentSavings: roundCurrency(parseNumber(form.elements.currentSavings.value)),
    contributionAmount: appState.mode === "requiredContribution"
      ? scenario.contributionAmount
      : roundCurrency(parseNumber(form.elements.contributionAmount.value)),
    contributionFrequency: form.elements.contributionFrequency.value,
    annualInterestRate: parseNumber(form.elements.annualInterestRate.value),
    compounding: form.elements.compounding.value,
    startDate: form.elements.startDate.value,
    targetDate: form.elements.targetDate.value,
    inflationRate: parseNumber(form.elements.inflationRate.value),
    notes: form.elements.notes.value.trim(),
  };

  appState.scenarios = appState.scenarios.map((item) => item.id === scenario.id ? nextScenario : item);
  derivedCache.clear();
}

function renderModeButtons() {
  document.querySelectorAll(selectors.modeButtons).forEach((button) => {
    const isActive = button.dataset.mode === appState.mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderScenarioList() {
  const container = document.querySelector(selectors.scenarioList);
  if (!container) {
    return;
  }

  container.innerHTML = appState.scenarios.map((scenario) => {
    const isSelected = scenario.id === appState.selectedScenarioId;
    const isCompared = appState.compareScenarioIds.includes(scenario.id);
    const outcome = calculateScenarioOutcome(scenario, appState.mode);
    const subtitle = outcome.errors?.length
      ? outcome.errors[0]
      : appState.mode === "requiredContribution"
        ? `${currencyPreciseFormatter().format(outcome.contributionAmount)} ${getFrequencyMeta(CONTRIBUTION_FREQUENCIES, scenario.contributionFrequency).label.toLowerCase()}`
        : `${outcome.timelineLabel} to goal`;

    return `
      <article class="scenario-item ${isSelected ? "is-selected" : ""}">
        <button class="scenario-select" type="button" data-select-scenario="${escapeHtml(scenario.id)}" aria-pressed="${isSelected}">
          <strong>${escapeHtml(scenario.name)}</strong>
          <span>${escapeHtml(CATEGORY_OPTIONS.find((item) => item.value === scenario.goalCategory)?.label || "Custom")}</span>
          <small>${escapeHtml(subtitle)}</small>
        </button>
        <label class="compare-toggle">
          <input type="checkbox" data-compare-scenario="${escapeHtml(scenario.id)}" ${isCompared ? "checked" : ""}>
          <span>Compare</span>
        </label>
      </article>
    `;
  }).join("");
}

function renderValidation(errors) {
  const box = document.querySelector(selectors.validationSummary);
  if (!box) {
    return;
  }
  if (!errors || errors.length === 0) {
    box.innerHTML = `
      <strong>Inputs look good.</strong>
      <p class="muted">This plan assumes end-of-period contributions and converts your interest rate into a daily planning rate so dates, contribution schedules, and growth stay consistent.</p>
    `;
    box.classList.remove("has-error");
    return;
  }

  box.innerHTML = `
    <strong>Check a few details</strong>
    <ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>
  `;
  box.classList.add("has-error");
}

function renderSummary(outcome) {
  const primaryCards = document.querySelector(selectors.summaryCardsPrimary);
  const secondaryCards = document.querySelector(selectors.summaryCardsSecondary);
  const insightsList = document.querySelector(selectors.insightsList);
  const summaryText = document.querySelector(selectors.resultsSummaryText);

  if (!primaryCards || !secondaryCards || !insightsList || !summaryText) {
    return;
  }

  if (outcome.errors.length > 0) {
    summaryText.textContent = outcome.errors[0];
    primaryCards.innerHTML = `
      <article class="summary-card">
        <span class="trust-label">Needs attention</span>
        <strong>Update the scenario inputs</strong>
        <p>${escapeHtml(outcome.errors[0])}</p>
      </article>
    `;
    secondaryCards.innerHTML = "";
    insightsList.innerHTML = "";
    return;
  }

  summaryText.textContent = outcome.onTrackText;
  const keyContributionLabel = outcome.mode === "requiredContribution" ? "Required contribution" : "Contribution amount";
  const progressAtTarget = outcome.finalBalanceAtTarget != null && outcome.goalAmount > 0
    ? clampNumber((outcome.finalBalanceAtTarget / outcome.goalAmount) * 100, 0, 999)
    : clampNumber((outcome.finalBalance / outcome.goalAmount) * 100, 0, 999);

  const primary = [
    ["Goal date", outcome.goalDate, outcome.mode === "requiredContribution" ? "The deadline this plan is built around." : `About ${outcome.timelineLabel} from the selected start date.`],
    [keyContributionLabel, currencyPreciseFormatter().format(outcome.contributionAmount), `${currencyFormatter().format(outcome.monthlyEquivalentContribution)} monthly equivalent.`],
    ["Goal progress", percentFormatter(progressAtTarget), outcome.mode === "requiredContribution" && outcome.realismLabel ? `${outcome.realismLabel} pace based on the target date.` : `${percentFormatter(outcome.progressNow)} already saved today.`],
    ["Final projected balance", currencyFormatter().format(outcome.finalBalance), outcome.finalBalanceAtTarget != null ? `Balance by target date: ${currencyFormatter().format(outcome.finalBalanceAtTarget)}.` : "Projected balance when the goal is reached."],
  ];
  const secondary = [
    ["Goal amount", currencyFormatter().format(outcome.goalAmount), "Your savings target."],
    ["Current savings", currencyFormatter().format(outcome.currentSavings), "Starting balance at the selected start date."],
    ["Total contributions", currencyFormatter().format(outcome.totalContributions), `${outcome.mode === "requiredContribution" ? "Needed by the target date." : "Added before the goal is reached."}`],
    ["Total interest earned", currencyFormatter().format(outcome.totalInterest), `${percentFormatter(outcome.interestShare)} of the ending balance comes from growth.`],
    ["Inflation-adjusted goal", currencyFormatter().format(outcome.inflationAdjustedGoal), "Helps show how inflation can change the real target over time."],
  ];

  primaryCards.innerHTML = primary.map(([label, value, copy]) => `
    <article class="summary-card">
      <span class="trust-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(copy)}</p>
    </article>
  `).join("");
  secondaryCards.innerHTML = secondary.map(([label, value, copy]) => `
    <article class="summary-card summary-card-secondary">
      <span class="trust-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(copy)}</p>
    </article>
  `).join("");

  const insights = [
    outcome.mode === "timeToGoal" && outcome.whatIfMonthsSaved != null
      ? `If you increase savings by ${currencyFormatter().format(100)} per month, this goal could arrive about ${outcome.whatIfMonthsSaved} month${outcome.whatIfMonthsSaved === 1 ? "" : "s"} sooner.`
      : `This mode solves for the minimum ${friendlyFrequencyLabel(outcome.scenario.contributionFrequency)} contribution that still reaches the target on time.`,
    outcome.targetShortfall != null && outcome.targetShortfall > 0
      ? `At the current settings, you would still be short by about ${currencyFormatter().format(outcome.targetShortfall)} by the target date.`
      : `Under the current assumptions, this plan is on pace to cover the goal.`,
    outcome.interestShare > 0
      ? `Interest contributes about ${percentFormatter(outcome.interestShare)} of the ending balance, while contributions do most of the work.`
      : "Almost all of the ending balance comes from direct contributions because the rate or timeline is modest.",
  ];

  insightsList.innerHTML = insights.map((item) => `<article class="insight-card">${escapeHtml(item)}</article>`).join("");
}

function sampleRows(rows, totalSamples = 16) {
  if (rows.length <= totalSamples) {
    return rows;
  }
  const sampled = [];
  for (let index = 0; index < totalSamples; index += 1) {
    const rowIndex = Math.round((index / (totalSamples - 1)) * (rows.length - 1));
    sampled.push(rows[rowIndex]);
  }
  return sampled;
}

function buildAreaPath(points, baselineY) {
  if (points.length === 0) {
    return "";
  }
  const start = points[0];
  const end = points[points.length - 1];
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  return `M ${start.x} ${baselineY} L ${line} L ${end.x} ${baselineY} Z`;
}

function renderLineChart(containerSelector, rows, goalAmount) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return;
  }
  if (!rows || rows.length === 0) {
    container.innerHTML = `<p class="chart-empty">Complete the inputs to generate a projection chart.</p>`;
    return;
  }

  const points = sampleRows(rows, 14);
  const width = 760;
  const height = 340;
  const margin = { top: 42, right: 28, bottom: 54, left: 70 };
  const maxValue = Math.max(goalAmount, ...points.map((row) => row.endingBalance), 1);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((step) => roundCurrency(maxValue * step));
  const pointObjects = points.map((row, index) => {
    const x = margin.left + (index / Math.max(points.length - 1, 1)) * chartWidth;
    const y = margin.top + chartHeight - (row.endingBalance / maxValue) * chartHeight;
    return { x, y, row };
  });
  const linePoints = pointObjects.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = buildAreaPath(pointObjects, margin.top + chartHeight);
  const goalY = margin.top + chartHeight - (goalAmount / maxValue) * chartHeight;

  container.innerHTML = `
    <div class="chart-frame chart-frame-line">
      <div class="chart-stat-grid">
        <div class="chart-stat-chip">
          <span class="chart-eyebrow">Projected ending balance</span>
          <strong>${escapeHtml(currencyFormatter().format(points[points.length - 1].endingBalance))}</strong>
        </div>
        <div class="chart-stat-chip">
          <span class="chart-eyebrow">Goal target</span>
          <strong>${escapeHtml(currencyFormatter().format(goalAmount))}</strong>
        </div>
      </div>
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" aria-hidden="true">
      <defs>
        <linearGradient id="growthAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0f6abf" stop-opacity="0.26"></stop>
          <stop offset="100%" stop-color="#0f6abf" stop-opacity="0.02"></stop>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="#f8fbff"></rect>
      ${yTicks.map((tickValue) => {
        const y = margin.top + chartHeight - (tickValue / maxValue) * chartHeight;
        return `
          <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#d8e3ef" stroke-width="1"></line>
          <text x="${margin.left - 12}" y="${y + 4}" fill="#5e7087" font-size="12" text-anchor="end">${escapeHtml(compactCurrency(tickValue))}</text>
        `;
      }).join("")}
      <line x1="${margin.left}" y1="${goalY}" x2="${width - margin.right}" y2="${goalY}" stroke="#e1933a" stroke-width="2" stroke-dasharray="8 8"></line>
      <path d="${areaPath}" fill="url(#growthAreaFill)"></path>
      <polyline points="${linePoints}" fill="none" stroke="#0f6abf" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
      ${pointObjects.map((point) => {
        return `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="#13a39a" stroke="#ffffff" stroke-width="2"></circle>`;
      }).join("")}
      <text x="${margin.left}" y="${margin.top - 14}" fill="#29435c" font-size="13" font-weight="700">Savings balance</text>
      <text x="${width - margin.right}" y="${goalY - 8}" fill="#9a5b17" font-size="12" text-anchor="end">Goal line</text>
      <text x="${margin.left}" y="${height - 16}" fill="#5e7087" font-size="12">${escapeHtml(formatDateLong(points[0].date))}</text>
      <text x="${width - margin.right}" y="${height - 16}" fill="#5e7087" font-size="12" text-anchor="end">${escapeHtml(formatDateLong(points[points.length - 1].date))}</text>
      </svg>
      <div class="chart-legend">
        <span><i class="legend-swatch legend-balance"></i>Balance growth</span>
        <span><i class="legend-swatch legend-goal"></i>Goal threshold</span>
      </div>
    </div>
  `;
}

function renderMixChart(containerSelector, totalContributions, totalInterest) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return;
  }
  const total = Math.max(totalContributions + totalInterest, 1);
  const contributionWidth = (totalContributions / total) * 100;
  const interestWidth = (totalInterest / total) * 100;

  container.innerHTML = `
    <div class="chart-frame chart-frame-mix">
      <div class="chart-stat-grid">
        <div class="chart-stat-chip">
          <span class="chart-eyebrow">Ending balance</span>
          <strong>${escapeHtml(currencyFormatter().format(totalContributions + totalInterest))}</strong>
        </div>
        <div class="chart-stat-chip">
          <span class="chart-eyebrow">Interest share</span>
          <strong>${escapeHtml(percentFormatter(interestWidth, 0))}</strong>
        </div>
      </div>
      <div class="mix-bar" aria-hidden="true">
        <div class="mix-bar-segment mix-bar-contribution" style="width:${contributionWidth}%"></div>
        <div class="mix-bar-segment mix-bar-interest" style="width:${interestWidth}%"></div>
      </div>
      <div class="mix-breakdown">
        <div class="mix-breakdown-item">
          <div class="mix-breakdown-label">
            <i class="legend-swatch legend-balance"></i>
            <span>Direct contributions</span>
          </div>
          <strong>${escapeHtml(currencyFormatter().format(totalContributions))}</strong>
          <small>${escapeHtml(percentFormatter(contributionWidth, 0))} of the final balance</small>
        </div>
        <div class="mix-breakdown-item">
          <div class="mix-breakdown-label">
            <i class="legend-swatch legend-interest"></i>
            <span>Interest earned</span>
          </div>
          <strong>${escapeHtml(currencyFormatter().format(totalInterest))}</strong>
          <small>${escapeHtml(percentFormatter(interestWidth, 0))} of the final balance</small>
        </div>
      </div>
    </div>
  `;
}

function renderComparisonChart(outcomes) {
  const container = document.querySelector(selectors.comparisonChart);
  const sortValue = document.querySelector(selectors.comparisonSortSelect)?.value || "speed";
  if (!container) {
    return;
  }
  if (outcomes.length === 0) {
    container.innerHTML = `<p class="chart-empty">Select at least one scenario to compare.</p>`;
    return;
  }

  if (outcomes.length === 1) {
    const outcome = outcomes[0];
    container.innerHTML = `
      <div class="comparison-summary-card">
        <div class="comparison-summary-head">
          <div>
            <span class="chart-eyebrow">Current plan</span>
            <h3>${escapeHtml(outcome.scenario.name)}</h3>
            <p>${escapeHtml(outcome.mode === "requiredContribution" ? "You are reviewing one target-date plan." : "You are reviewing one timeline-based plan.")}</p>
          </div>
          <div class="comparison-prompt">
            <strong>Add another scenario to compare tradeoffs.</strong>
            <span>Try a higher contribution, different deadline, or different goal amount.</span>
          </div>
        </div>
        <div class="comparison-stat-grid">
          <article class="comparison-stat">
            <span>Time to goal</span>
            <strong>${escapeHtml(outcome.timelineLabel)}</strong>
          </article>
          <article class="comparison-stat">
            <span>Goal date</span>
            <strong>${escapeHtml(outcome.goalDate)}</strong>
          </article>
          <article class="comparison-stat">
            <span>${escapeHtml(outcome.mode === "requiredContribution" ? "Required contribution" : "Contribution amount")}</span>
            <strong>${escapeHtml(currencyPreciseFormatter().format(outcome.contributionAmount))}</strong>
          </article>
          <article class="comparison-stat">
            <span>Final balance</span>
            <strong>${escapeHtml(currencyFormatter().format(outcome.finalBalance))}</strong>
          </article>
        </div>
      </div>
    `;
    return;
  }

  const sortedOutcomes = [...outcomes].sort((left, right) => {
    if (sortValue === "contribution") {
      return left.monthlyEquivalentContribution - right.monthlyEquivalentContribution;
    }
    if (sortValue === "balance") {
      return right.finalBalance - left.finalBalance;
    }
    return left.totalDays - right.totalDays;
  });

  container.innerHTML = `
    <div class="comparison-visual-list">
      ${sortedOutcomes.map((item, index) => {
        const fastestDays = Math.min(...sortedOutcomes.map((entry) => entry.totalDays || 0));
        const timeRatio = fastestDays > 0 ? fastestDays / Math.max(item.totalDays, fastestDays) : 1;
        const speedPercent = Math.max(24, Math.round(timeRatio * 100));
        const lensLabel = sortValue === "contribution"
          ? "Contribution level"
          : sortValue === "balance"
            ? "Final balance"
            : "Speed to goal";
        const fillWidth = sortValue === "contribution"
          ? Math.max(24, Math.round((Math.min(...sortedOutcomes.map((entry) => entry.monthlyEquivalentContribution)) / Math.max(item.monthlyEquivalentContribution, 1)) * 100))
          : sortValue === "balance"
            ? Math.max(24, Math.round((item.finalBalance / Math.max(...sortedOutcomes.map((entry) => entry.finalBalance || 1))) * 100))
            : speedPercent;
        return `
          <article class="comparison-visual-row">
            <div class="comparison-visual-copy">
              <strong>${escapeHtml(item.scenario.name)}</strong>
              <span>${escapeHtml(item.timelineLabel)} to goal</span>
            </div>
            <div class="comparison-visual-metric">
              <span class="comparison-visual-label">${escapeHtml(lensLabel)}</span>
              <div class="comparison-visual-track" aria-hidden="true">
                <div class="comparison-visual-fill" style="width:${fillWidth}%"></div>
              </div>
            </div>
            <div class="comparison-visual-meta">
              <strong>${escapeHtml(currencyPreciseFormatter().format(item.contributionAmount))}</strong>
              <span>${escapeHtml(currencyFormatter().format(item.finalBalance))} final balance</span>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderProjectionTable(rows, goalAmount) {
  const tbody = document.querySelector(selectors.projectionTableBody);
  const view = document.querySelector(selectors.projectionViewSelect)?.value || "milestones";
  if (!tbody) {
    return;
  }
  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">Projection rows will appear here once the scenario is valid.</td></tr>`;
    return;
  }
  const displayedRows = view === "full" ? rows : rows.filter((row, index) => index === 0 || (index + 1) % Math.max(Math.ceil(rows.length / 6), 1) === 0 || index === rows.length - 1);
  tbody.innerHTML = displayedRows.map((row) => `
    <tr>
      <td>${row.period}</td>
      <td>${escapeHtml(formatDateLong(row.date))}</td>
      <td>${escapeHtml(currencyPreciseFormatter().format(row.startingBalance))}</td>
      <td>${escapeHtml(currencyPreciseFormatter().format(row.contribution))}</td>
      <td>${escapeHtml(currencyPreciseFormatter().format(row.interest))}</td>
      <td>${escapeHtml(currencyPreciseFormatter().format(row.endingBalance))}</td>
      <td>${escapeHtml(percentFormatter(clampNumber((row.endingBalance / Math.max(goalAmount, 1)) * 100, 0, 999)))}</td>
    </tr>
  `).join("");
}

function renderMilestones(outcome) {
  const container = document.querySelector(selectors.milestoneChips);
  if (!container) {
    return;
  }
  if (outcome.errors.length > 0 || !outcome.projectionRows?.length) {
    container.innerHTML = "";
    return;
  }
  const rows = outcome.projectionRows;
  const milestones = [25, 50, 75, 100].map((threshold) => {
    const match = rows.find((row) => row.goalProgress >= threshold);
    return match ? { threshold, row: match } : null;
  }).filter(Boolean);

  container.innerHTML = milestones.map((item) => `
    <article class="milestone-chip">
      <span>${item.threshold}% reached</span>
      <strong>${escapeHtml(formatDateLong(item.row.date))}</strong>
      <small>${escapeHtml(currencyFormatter().format(item.row.endingBalance))}</small>
    </article>
  `).join("");
}

function renderComparison(outcomes) {
  const tableBody = document.querySelector(selectors.comparisonTableBody);
  const highlights = document.querySelector(selectors.comparisonHighlights);
  const selectionMeta = document.querySelector(selectors.comparisonSelectionMeta);
  if (!tableBody || !highlights) {
    return;
  }
  if (selectionMeta) {
    selectionMeta.textContent = `${outcomes.length} scenario${outcomes.length === 1 ? "" : "s"} selected for comparison.`;
  }

  if (outcomes.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8">Select one or more scenarios in the manager to compare them here.</td></tr>`;
    highlights.innerHTML = `<p class="muted">Comparison highlights will appear once you select scenarios.</p>`;
    renderComparisonChart([]);
    return;
  }

  tableBody.innerHTML = outcomes.map((outcome) => `
    <tr>
      <td>${escapeHtml(outcome.scenario?.name || "Scenario")}</td>
      <td>${escapeHtml(MODE_COPY[outcome.mode].button)}</td>
      <td>${escapeHtml(outcome.timelineLabel || "Needs valid inputs")}</td>
      <td>${escapeHtml(outcome.goalDate || "Not available")}</td>
      <td>${escapeHtml(outcome.contributionAmount != null ? currencyPreciseFormatter().format(outcome.contributionAmount) : "Not available")}</td>
      <td>${escapeHtml(outcome.totalContributions != null ? currencyFormatter().format(outcome.totalContributions) : "Not available")}</td>
      <td>${escapeHtml(outcome.totalInterest != null ? currencyFormatter().format(outcome.totalInterest) : "Not available")}</td>
      <td>${escapeHtml(outcome.finalBalance != null ? currencyFormatter().format(outcome.finalBalance) : "Not available")}</td>
    </tr>
  `).join("");

  const validOutcomes = outcomes.filter((outcome) => !outcome.errors.length);
  if (validOutcomes.length > 0) {
    const fastest = [...validOutcomes].sort((left, right) => left.totalDays - right.totalDays)[0];
    const lowestContribution = [...validOutcomes].sort((left, right) => left.monthlyEquivalentContribution - right.monthlyEquivalentContribution)[0];
    const highestInterest = [...validOutcomes].sort((left, right) => right.totalInterest - left.totalInterest)[0];
    const bestOverall = [...validOutcomes].sort((left, right) => {
      const leftScore = left.totalDays * 0.55 + left.monthlyEquivalentContribution * 0.45;
      const rightScore = right.totalDays * 0.55 + right.monthlyEquivalentContribution * 0.45;
      return leftScore - rightScore;
    })[0];
    highlights.innerHTML = `
      <article class="highlight-chip highlight-chip-accent"><strong>Best overall:</strong> ${escapeHtml(bestOverall.scenario.name)} <span>Best balance of pace and affordability for most users.</span></article>
      <article class="highlight-chip"><strong>Fastest to goal:</strong> ${escapeHtml(fastest.scenario.name)} <span>Best if speed matters most.</span></article>
      <article class="highlight-chip"><strong>Lowest monthly commitment:</strong> ${escapeHtml(lowestContribution.scenario.name)} <span>Best if flexibility matters most.</span></article>
      <article class="highlight-chip"><strong>Most interest earned:</strong> ${escapeHtml(highestInterest.scenario.name)} <span>Best if you want growth to do more of the work.</span></article>
    `;
  } else {
    highlights.innerHTML = `<p class="muted">The selected scenarios still need valid inputs before the comparison can be scored.</p>`;
  }

  renderComparisonChart(validOutcomes);
}

function renderReport(activeOutcome, comparedOutcomes) {
  const summary = document.querySelector(selectors.reportScenarioSummary);
  const assumptions = document.querySelector(selectors.reportAssumptions);
  const milestones = document.querySelector(selectors.reportMilestones);
  const comparison = document.querySelector(selectors.reportComparison);
  const generatedAt = document.querySelector(selectors.reportGeneratedAt);
  const notes = document.querySelector(selectors.reportNotes);
  const executive = document.querySelector(selectors.reportExecutiveSummary);
  if (!summary || !assumptions || !milestones || !comparison || !generatedAt || !notes || !executive) {
    return;
  }

  generatedAt.textContent = `Generated ${formatDateLong(new Date())}`;

  if (activeOutcome.errors.length > 0) {
    summary.innerHTML = `<p>Please correct the active scenario before printing the report.</p>`;
    assumptions.innerHTML = "";
    milestones.innerHTML = "";
    comparison.innerHTML = "";
    notes.textContent = "No notes added for this scenario.";
    executive.textContent = "This report summarizes your current savings plan.";
    return;
  }

  executive.textContent = activeOutcome.mode === "requiredContribution"
    ? `To reach your goal by ${activeOutcome.goalDate}, this plan requires about ${currencyPreciseFormatter().format(activeOutcome.contributionAmount)} per ${friendlyFrequencyLabel(activeOutcome.scenario.contributionFrequency)} contribution period.`
    : `At your current savings pace, this plan is projected to reach the goal around ${activeOutcome.goalDate}.`;

  summary.innerHTML = [
    ["Scenario", activeOutcome.scenario.name],
    ["Goal amount", currencyFormatter().format(activeOutcome.goalAmount)],
    ["Goal date", activeOutcome.goalDate],
    ["Contribution", currencyPreciseFormatter().format(activeOutcome.contributionAmount)],
  ].map(([label, value]) => `
    <article class="report-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join("");

  assumptions.innerHTML = `
    <ul class="report-list">
      <li>Mode: ${escapeHtml(MODE_COPY[activeOutcome.mode].button)}</li>
      <li>Start date: ${escapeHtml(formatDateLong(activeOutcome.scenario.startDate))}</li>
      <li>Contribution frequency: ${escapeHtml(activeOutcome.contributionFrequencyLabel)}</li>
      <li>Interest rate: ${escapeHtml(percentFormatter(parseNumber(activeOutcome.scenario.annualInterestRate), 2))}</li>
      <li>Compounding: ${escapeHtml(activeOutcome.compoundingLabel)}</li>
      <li>Inflation assumption: ${escapeHtml(percentFormatter(parseNumber(activeOutcome.scenario.inflationRate), 2))}</li>
    </ul>
  `;

  milestones.innerHTML = `
    <ul class="report-list">
      <li>Current progress: ${escapeHtml(percentFormatter(activeOutcome.progressNow))}</li>
      <li>Total contributions: ${escapeHtml(currencyFormatter().format(activeOutcome.totalContributions))}</li>
      <li>Total interest earned: ${escapeHtml(currencyFormatter().format(activeOutcome.totalInterest))}</li>
      <li>Final projected balance: ${escapeHtml(currencyFormatter().format(activeOutcome.finalBalance))}</li>
    </ul>
  `;

  comparison.innerHTML = comparedOutcomes.length > 1
    ? `
      <ul class="report-list">
        ${comparedOutcomes.map((outcome) => `
          <li>${escapeHtml(outcome.scenario.name)}: ${escapeHtml(outcome.timelineLabel)}, ${escapeHtml(currencyFormatter().format(outcome.finalBalance))} final balance, ${escapeHtml(currencyPreciseFormatter().format(outcome.contributionAmount))} per ${escapeHtml(friendlyFrequencyLabel(outcome.scenario.contributionFrequency))}</li>
        `).join("")}
      </ul>
    `
    : `<p>No extra comparison scenarios selected for this report.</p>`;

  notes.textContent = activeOutcome.scenario.notes || "No notes added for this scenario.";
}

function renderModeContext() {
  const title = document.querySelector(selectors.modeHelperTitle);
  const summary = document.querySelector(selectors.modeHelperSummary);
  const text = document.querySelector(selectors.modeHelperText);
  const recommended = document.querySelector(selectors.modeRecommendedTag);
  if (!title || !summary || !text || !recommended) {
    return;
  }
  title.textContent = MODE_COPY[appState.mode].button;
  summary.textContent = MODE_COPY[appState.mode].summary;
  recommended.hidden = appState.mode !== "timeToGoal";
  text.textContent = appState.mode === "timeToGoal"
    ? "Choose this if you already know how much you can save and want to estimate when you could reach your goal."
    : "Choose this if the deadline matters more and you want the calculator to solve for the savings amount needed.";
}

function renderScenarioPanelMeta() {
  const meta = document.querySelector(selectors.scenarioSummaryMeta);
  const panel = document.querySelector(selectors.scenarioManagerPanel);
  if (!meta || !panel) {
    return;
  }
  meta.textContent = appState.scenarios.length > 1
    ? `${appState.scenarios.length} scenarios saved. Open this to compare, back up, or load plans.`
    : "You can ignore this until you want to compare or save scenarios.";
  panel.open = appState.scenarios.length > 1;
}

function openReportAndPrint() {
  const reportPanel = document.querySelector("#reportSection");
  if (reportPanel instanceof HTMLDetailsElement) {
    reportPanel.open = true;
  }
  window.print();
}

function renderAll() {
  syncForm();
  renderModeButtons();
  renderScenarioList();
  renderModeContext();
  renderScenarioPanelMeta();

  const activeScenario = getSelectedScenario();
  const activeOutcome = calculateScenarioOutcome(activeScenario, appState.mode);
  const contributionField = document.querySelector("#contributionAmount");
  if (appState.mode === "requiredContribution" && contributionField && !activeOutcome.errors.length) {
    contributionField.value = activeOutcome.contributionAmount.toFixed(2);
  }
  const comparedOutcomes = appState.compareScenarioIds
    .map((id) => getScenarioById(id))
    .filter(Boolean)
    .map((scenario) => calculateScenarioOutcome(scenario, appState.mode));

  renderValidation(activeOutcome.errors);
  renderSummary(activeOutcome);
  renderLineChart(selectors.growthChart, activeOutcome.projectionRows, activeOutcome.goalAmount || 1);
  renderMixChart(selectors.mixChart, activeOutcome.totalContributions || 0, activeOutcome.totalInterest || 0);
  renderMilestones(activeOutcome);
  renderProjectionTable(activeOutcome.projectionRows, activeOutcome.goalAmount || 1);
  renderComparison(comparedOutcomes);
  renderReport(activeOutcome, comparedOutcomes);
}

function updateStateAndRender(message) {
  saveToLocalStorage(message);
  renderAll();
}

function addScenario(overrides = {}, message = "Scenario created and saved in this browser.") {
  const scenario = createDefaultScenario(overrides);
  appState.scenarios = [...appState.scenarios, scenario];
  appState.selectedScenarioId = scenario.id;
  if (!appState.compareScenarioIds.includes(scenario.id)) {
    appState.compareScenarioIds = [...appState.compareScenarioIds, scenario.id];
  }
  derivedCache.clear();
  updateStateAndRender(message);
}

function duplicateSelectedScenario() {
  const scenario = getSelectedScenario();
  if (!scenario) {
    return;
  }
  addScenario({
    ...scenario,
    id: createId(),
    name: `${scenario.name} Copy`,
  }, "Scenario duplicated and saved in this browser.");
}

function deleteSelectedScenario() {
  if (appState.scenarios.length === 1) {
    setStorageStatus("Keep at least one scenario in the calculator.");
    return;
  }
  const scenario = getSelectedScenario();
  if (!scenario || !window.confirm(`Delete "${scenario.name}"?`)) {
    return;
  }
  appState.scenarios = appState.scenarios.filter((item) => item.id !== scenario.id);
  appState.selectedScenarioId = appState.scenarios[0].id;
  appState.compareScenarioIds = appState.compareScenarioIds.filter((id) => id !== scenario.id);
  if (appState.compareScenarioIds.length === 0) {
    appState.compareScenarioIds = [appState.selectedScenarioId];
  }
  derivedCache.clear();
  updateStateAndRender("Scenario deleted and local save updated.");
}

function resetAllScenarios() {
  if (!window.confirm("Reset all scenarios, local saves, and current comparison settings?")) {
    return;
  }
  appState = createDefaultState();
  derivedCache.clear();
  saveToLocalStorage("All scenarios reset to fresh defaults.");
  renderAll();
}

function exportJson() {
  const payload = serializeState();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `simplekit-savings-goals-${getTodayString()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setStorageStatus("Backup downloaded successfully.");
}

async function importJson(file) {
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    appState = normalizeImportedState(parsed);
    derivedCache.clear();
    updateStateAndRender("Saved plan imported and stored locally.");
  } catch (error) {
    setStorageStatus("That backup could not be loaded. Please choose a valid SimpleKit savings plan file.");
  }
}

function handleFormInput() {
  readFormIntoScenario();
  if (appState.mode === "requiredContribution") {
    const activeScenario = getSelectedScenario();
    const outcome = calculateScenarioOutcome(activeScenario, appState.mode);
    const contributionField = document.querySelector("#contributionAmount");
    if (contributionField && !outcome.errors.length) {
      contributionField.value = outcome.contributionAmount.toFixed(2);
    }
  }
  updateStateAndRender("Changes saved in this browser.");
}

function bindEvents() {
  document.querySelector(selectors.form)?.addEventListener("input", handleFormInput);
  document.querySelector(selectors.form)?.addEventListener("change", handleFormInput);

  document.querySelectorAll(selectors.modeButtons).forEach((button) => {
    button.addEventListener("click", () => {
      appState.mode = button.dataset.mode;
      derivedCache.clear();
      renderAll();
      saveToLocalStorage(`Mode updated to ${MODE_COPY[appState.mode].button}.`);
    });
  });

  document.querySelector("#addScenarioBtn")?.addEventListener("click", () => addScenario({}, "New scenario added and saved in this browser."));
  document.querySelector("#duplicateScenarioBtn")?.addEventListener("click", duplicateSelectedScenario);
  document.querySelector("#deleteScenarioBtn")?.addEventListener("click", deleteSelectedScenario);
  document.querySelector("#resetAllBtn")?.addEventListener("click", resetAllScenarios);
  document.querySelector("#exportJsonBtn")?.addEventListener("click", exportJson);
  document.querySelector("#importJsonInput")?.addEventListener("change", (event) => importJson(event.target.files?.[0]));
  document.querySelector("#sampleScenarioBtn")?.addEventListener("click", () => {
    const scenario = getSelectedScenario();
    appState.scenarios = appState.scenarios.map((item) => item.id === scenario.id ? { ...scenario, ...SAMPLE_SCENARIO } : item);
    derivedCache.clear();
    updateStateAndRender("Sample scenario loaded and saved in this browser.");
  });

  document.querySelector("#printReportBtn")?.addEventListener("click", openReportAndPrint);
  document.querySelector("#heroPrintBtn")?.addEventListener("click", openReportAndPrint);
  document.querySelector(selectors.projectionViewSelect)?.addEventListener("change", renderAll);
  document.querySelector(selectors.comparisonSortSelect)?.addEventListener("change", renderAll);

  document.querySelector(selectors.scenarioList)?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-scenario]");
    if (!button) {
      return;
    }
    appState.selectedScenarioId = button.dataset.selectScenario;
    derivedCache.clear();
    renderAll();
    saveToLocalStorage("Selected scenario updated.");
  });

  document.querySelector(selectors.scenarioList)?.addEventListener("change", (event) => {
    const input = event.target.closest("[data-compare-scenario]");
    if (!input) {
      return;
    }
    if (input.checked) {
      appState.compareScenarioIds = [...new Set([...appState.compareScenarioIds, input.dataset.compareScenario])];
    } else {
      appState.compareScenarioIds = appState.compareScenarioIds.filter((id) => id !== input.dataset.compareScenario);
      if (appState.compareScenarioIds.length === 0) {
        appState.compareScenarioIds = [appState.selectedScenarioId];
      }
    }
    renderAll();
    saveToLocalStorage("Comparison selection updated.");
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function initialize() {
  populateSelect("#goalCategory", CATEGORY_OPTIONS);
  populateSelect("#contributionFrequency", CONTRIBUTION_FREQUENCIES);
  populateSelect("#compounding", COMPOUNDING_FREQUENCIES);

  if (!restoreFromLocalStorage()) {
    appState = createDefaultState();
    saveToLocalStorage("Auto-save is ready in this browser.");
  }

  bindEvents();
  renderAll();
  setStorageStatus("Auto-save is active in this browser.");
}

initialize();
})();
