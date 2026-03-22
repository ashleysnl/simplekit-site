(() => {
  const STORAGE_KEY = "simplekit-budget-planner-v1";
  const CURRENCY = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
  const PERCENT = new Intl.NumberFormat("en-CA", {
    style: "percent",
    maximumFractionDigits: 1,
  });

  const ESSENTIAL_CATEGORIES = new Set([
    "housing",
    "utilities",
    "groceries",
    "transportation",
    "insurance",
    "debt payments",
    "childcare / family",
    "health / medical",
  ]);

  const DEFAULT_STATE = {
    income: [
      createRow("income-primary", "Primary Income"),
      createRow("income-secondary", "Secondary Income"),
      createRow("income-other", "Other Income"),
    ],
    fixedExpenses: [
      createRow("housing", "Housing"),
      createRow("utilities", "Utilities"),
      createRow("insurance", "Insurance"),
      createRow("debt-payments", "Debt Payments"),
      createRow("childcare-family", "Childcare / Family"),
      createRow("health-medical", "Health / Medical"),
    ],
    variableExpenses: [
      createRow("groceries", "Groceries"),
      createRow("transportation", "Transportation"),
      createRow("entertainment", "Entertainment"),
      createRow("dining-out", "Dining Out"),
      createRow("shopping", "Shopping"),
      createRow("travel", "Travel"),
      createRow("subscriptions", "Subscriptions"),
      createRow("miscellaneous", "Miscellaneous"),
    ],
    goals: {
      monthlySavingsGoal: "",
      monthlyInvestingGoal: "",
      monthlyDebtGoal: "",
    },
  };

  const SAMPLE_STATE = {
    income: [
      createRow("income-primary", "Primary Income", 5400),
      createRow("income-secondary", "Secondary Income", 700),
      createRow("income-other", "Other Income", 150),
    ],
    fixedExpenses: [
      createRow("housing", "Housing", 1850),
      createRow("utilities", "Utilities", 240),
      createRow("insurance", "Insurance", 180),
      createRow("debt-payments", "Debt Payments", 320),
      createRow("childcare-family", "Childcare / Family", 0),
      createRow("health-medical", "Health / Medical", 90),
    ],
    variableExpenses: [
      createRow("groceries", "Groceries", 650),
      createRow("transportation", "Transportation", 280),
      createRow("entertainment", "Entertainment", 160),
      createRow("dining-out", "Dining Out", 140),
      createRow("shopping", "Shopping", 120),
      createRow("travel", "Travel", 80),
      createRow("subscriptions", "Subscriptions", 54),
      createRow("miscellaneous", "Miscellaneous", 95),
    ],
    goals: {
      monthlySavingsGoal: "600",
      monthlyInvestingGoal: "350",
      monthlyDebtGoal: "150",
    },
  };

  const selectors = {
    form: "#budgetForm",
    incomeRows: "#incomeRows",
    fixedExpenseRows: "#fixedExpenseRows",
    variableExpenseRows: "#variableExpenseRows",
    primarySummaryCards: "#primarySummaryCards",
    secondarySummaryCards: "#secondarySummaryCards",
    primaryResultHeadline: "#primaryResultHeadline",
    nextStepMessage: "#nextStepMessage",
    nextToolLinks: "#nextToolLinks",
    emptyStateGuide: "#emptyStateGuide",
    budgetHealthBanner: "#budgetHealthBanner",
    resultsStatus: "#resultsStatus",
    categoryChart: "#categoryChart",
    categoryChartExplainer: "#categoryChartExplainer",
    categoryChartAction: "#categoryChartAction",
    totalsChart: "#totalsChart",
    totalsChartExplainer: "#totalsChartExplainer",
    totalsChartAction: "#totalsChartAction",
    spendingMix: "#spendingMix",
    mixChartExplainer: "#mixChartExplainer",
    mixChartAction: "#mixChartAction",
    insightsList: "#insightsList",
    budgetTableBody: "#budgetTableBody",
    budgetTableCards: "#budgetTableCards",
    shareFeedback: "#shareFeedback",
    loadSampleBtn: "#loadSampleBtn",
    resetBtn: "#resetBtn",
    addIncomeRowBtn: "#addIncomeRowBtn",
    addFixedExpenseBtn: "#addFixedExpenseBtn",
    addVariableExpenseBtn: "#addVariableExpenseBtn",
    simpleModeBtn: "#simpleModeBtn",
    detailedModeBtn: "#detailedModeBtn",
    shareBtn: "#shareBtn",
    printBtn: "#printBtn",
    exportCsvBtn: "#exportCsvBtn",
    saveJsonBtn: "#saveJsonBtn",
    loadJsonBtn: "#loadJsonBtn",
    loadJsonInput: "#loadJsonInput",
    heroSurplus: "#heroSurplus",
    heroIncome: "#heroIncome",
    heroExpenses: "#heroExpenses",
    heroSavingsRate: "#heroSavingsRate",
    heroLargest: "#heroLargest",
    heroSummary: "#heroSummary",
    mobileIncome: "#mobileIncome",
    mobileExpenses: "#mobileExpenses",
    mobileSurplus: "#mobileSurplus",
    relatedToolsIntro: "#relatedToolsIntro",
  };

  let state = loadState();
  let plannerMode = "simple";
  const STARTER_PACKS = {
    essentials: [
      ["fixedExpenses", "Housing"],
      ["fixedExpenses", "Utilities"],
      ["variableExpenses", "Groceries"],
      ["variableExpenses", "Transportation"],
      ["fixedExpenses", "Debt Payments"],
    ],
    home: [
      ["fixedExpenses", "Phone"],
      ["fixedExpenses", "Internet"],
      ["fixedExpenses", "Home Maintenance"],
      ["variableExpenses", "Home Supplies"],
    ],
    family: [
      ["fixedExpenses", "Childcare / Family"],
      ["fixedExpenses", "School"],
      ["variableExpenses", "Child Activities"],
      ["variableExpenses", "Gifts"],
    ],
    single: [
      ["income", "Primary Income"],
      ["fixedExpenses", "Housing"],
      ["variableExpenses", "Groceries"],
      ["variableExpenses", "Transportation"],
      ["variableExpenses", "Dining Out"],
    ],
    renting: [
      ["fixedExpenses", "Housing"],
      ["fixedExpenses", "Utilities"],
      ["fixedExpenses", "Internet"],
      ["variableExpenses", "Home Supplies"],
      ["variableExpenses", "Groceries"],
    ],
    shared: [
      ["income", "Primary Income"],
      ["fixedExpenses", "Housing"],
      ["fixedExpenses", "Utilities"],
      ["variableExpenses", "Groceries"],
      ["variableExpenses", "Dining Out"],
    ],
    owner: [
      ["fixedExpenses", "Housing"],
      ["fixedExpenses", "Utilities"],
      ["fixedExpenses", "Home Maintenance"],
      ["fixedExpenses", "Insurance"],
      ["variableExpenses", "Home Supplies"],
    ],
    carfree: [
      ["income", "Primary Income"],
      ["fixedExpenses", "Housing"],
      ["variableExpenses", "Groceries"],
      ["variableExpenses", "Transportation"],
      ["variableExpenses", "Subscriptions"],
    ],
    transport: [
      ["fixedExpenses", "Car Payment"],
      ["variableExpenses", "Gas"],
      ["variableExpenses", "Parking"],
      ["variableExpenses", "Transportation"],
    ],
  };

  function createRow(id, label, amount = "") {
    return { id, label, amount: amount === "" ? "" : String(amount) };
  }

  function cloneState(source) {
    return {
      income: source.income.map((row) => ({ ...row })),
      fixedExpenses: source.fixedExpenses.map((row) => ({ ...row })),
      variableExpenses: source.variableExpenses.map((row) => ({ ...row })),
      goals: { ...source.goals },
    };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return cloneState(DEFAULT_STATE);
      }

      const parsed = JSON.parse(raw);
      return sanitizeState(parsed);
    } catch (error) {
      return cloneState(DEFAULT_STATE);
    }
  }

  function sanitizeState(value) {
    const safeRows = (rows, fallback) => {
      if (!Array.isArray(rows) || rows.length === 0) {
        return fallback.map((row) => ({ ...row }));
      }

      return rows.map((row, index) => ({
        id: typeof row?.id === "string" && row.id ? row.id : `${fallback[0].id}-${index}`,
        label: typeof row?.label === "string" && row.label.trim() ? row.label.trim().slice(0, 40) : fallback[index]?.label || "Category",
        amount: sanitizeAmountInput(row?.amount),
      }));
    };

    return {
      income: safeRows(value?.income, DEFAULT_STATE.income),
      fixedExpenses: safeRows(value?.fixedExpenses, DEFAULT_STATE.fixedExpenses),
      variableExpenses: safeRows(value?.variableExpenses, DEFAULT_STATE.variableExpenses),
      goals: {
        monthlySavingsGoal: sanitizeAmountInput(value?.goals?.monthlySavingsGoal),
        monthlyInvestingGoal: sanitizeAmountInput(value?.goals?.monthlyInvestingGoal),
        monthlyDebtGoal: sanitizeAmountInput(value?.goals?.monthlyDebtGoal),
      },
    };
  }

  function sanitizeAmountInput(value) {
    if (value === "" || value == null) {
      return "";
    }

    const number = Number.parseFloat(String(value).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(number) || number < 0) {
      return "";
    }

    return String(number);
  }

  function amountToNumber(value) {
    const number = Number.parseFloat(String(value));
    if (!Number.isFinite(number) || number < 0) {
      return 0;
    }
    return number;
  }

  function formatCurrency(value) {
    return CURRENCY.format(Number.isFinite(value) ? value : 0);
  }

  function formatPercent(value) {
    if (!Number.isFinite(value) || value <= 0) {
      return "0%";
    }
    return PERCENT.format(value);
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getElement(selector) {
    return document.querySelector(selector);
  }

  function renderRows(groupName, selector) {
    const root = getElement(selector);
    if (!root) {
      return;
    }

    const visibleCount = plannerMode === "simple" ? simpleModeVisibleCount(groupName) : Number.POSITIVE_INFINITY;
    root.innerHTML = state[groupName].map((row, index) => `
      <div class="budget-row ${index >= visibleCount ? "budget-row-advanced" : ""}" data-group="${escapeHtml(groupName)}" data-index="${index}">
        <label class="form-field row-label">
          <span>${escapeHtml(getRowLabel(groupName, row.label))}</span>
          <input
            class="row-name"
            type="text"
            maxlength="40"
            value="${escapeHtml(row.label)}"
            placeholder="${escapeHtml(rowPlaceholder(groupName, row.label))}"
            aria-label="${escapeHtml(getRowLabel(groupName, row.label))} name"
          >
        </label>
        <label class="form-field row-amount-field">
          <span>Monthly amount</span>
          <div class="currency-input">
            <span aria-hidden="true">$</span>
            <input
              class="row-amount"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              value="${escapeHtml(row.amount)}"
              placeholder="${escapeHtml(amountPlaceholder(groupName, row.label))}"
              aria-label="${escapeHtml(row.label)} monthly amount"
            >
          </div>
        </label>
        <button class="btn btn-tertiary row-remove-btn" type="button" aria-label="Remove ${escapeHtml(row.label)}">Remove</button>
      </div>
    `).join("");
  }

  function simpleModeVisibleCount(groupName) {
    if (groupName === "income") {
      return 2;
    }
    if (groupName === "fixedExpenses") {
      return 4;
    }
    return 4;
  }

  function getRowLabel(groupName, label) {
    if (groupName === "income") {
      return "Income source";
    }
    return "Expense category";
  }

  function rowPlaceholder(groupName, label) {
    if (groupName === "income") {
      return label || "After-tax pay";
    }
    if (groupName === "fixedExpenses") {
      return label || "Rent or insurance";
    }
    return label || "Groceries or dining out";
  }

  function amountPlaceholder(groupName, label) {
    if (groupName === "income" && label.toLowerCase().includes("primary")) {
      return "After-tax monthly pay";
    }
    return "0";
  }

  function renderGoalInputs() {
    const form = getElement(selectors.form);
    if (!form) {
      return;
    }

    form.elements.monthlySavingsGoal.value = state.goals.monthlySavingsGoal;
    form.elements.monthlyInvestingGoal.value = state.goals.monthlyInvestingGoal;
    form.elements.monthlyDebtGoal.value = state.goals.monthlyDebtGoal;
  }

  function collectMetrics() {
    const incomeRows = state.income.map(normalizeRow).filter((row) => row.amount > 0 || row.label);
    const expenseRows = [
      ...state.fixedExpenses.map((row) => normalizeRow(row, "Essential")),
      ...state.variableExpenses.map((row) => normalizeRow(row, categoryType(row.label))),
    ].filter((row) => row.amount > 0 || row.label);

    const totalIncome = sumRows(incomeRows);
    const totalExpenses = sumRows(expenseRows);
    const surplus = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? surplus / totalIncome : 0;
    const essentialSpending = expenseRows
      .filter((row) => row.type === "Essential")
      .reduce((sum, row) => sum + row.amount, 0);
    const discretionarySpending = expenseRows
      .filter((row) => row.type === "Discretionary")
      .reduce((sum, row) => sum + row.amount, 0);
    const largestExpense = [...expenseRows]
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount)[0] || null;
    const goals = {
      savings: amountToNumber(state.goals.monthlySavingsGoal),
      investing: amountToNumber(state.goals.monthlyInvestingGoal),
      debt: amountToNumber(state.goals.monthlyDebtGoal),
    };
    const totalPlannedGoals = goals.savings + goals.investing + goals.debt;
    const roomAfterGoals = surplus - totalPlannedGoals;
    const allocatedToSavings = Math.max(0, Math.min(surplus, goals.savings));
    const savingsGoalGap = Math.max(0, goals.savings - Math.max(0, surplus));
    const spendPercent = totalIncome > 0 ? totalExpenses / totalIncome : 0;

    return {
      incomeRows,
      expenseRows,
      totalIncome,
      totalExpenses,
      surplus,
      savingsRate,
      essentialSpending,
      discretionarySpending,
      largestExpense,
      goals,
      totalPlannedGoals,
      roomAfterGoals,
      allocatedToSavings,
      savingsGoalGap,
      spendPercent,
    };
  }

  function normalizeRow(row, typeOverride) {
    const label = row.label.trim() || "Unnamed category";
    return {
      id: row.id,
      label,
      amount: amountToNumber(row.amount),
      type: typeOverride || categoryType(label),
    };
  }

  function categoryType(label) {
    return ESSENTIAL_CATEGORIES.has(label.trim().toLowerCase()) ? "Essential" : "Discretionary";
  }

  function sumRows(rows) {
    return rows.reduce((sum, row) => sum + row.amount, 0);
  }

  function renderResults() {
    const metrics = collectMetrics();

    renderStatus(metrics);
    renderPrimaryResultHeadline(metrics);
    renderSummaryCards(metrics);
    renderCharts(metrics);
    renderInsights(metrics);
    renderTable(metrics);
    renderHero(metrics);
    renderMobileSummary(metrics);
    renderRelatedTools(metrics);
    renderNextToolLinks(metrics);
    renderEmptyStateGuide(metrics);
    renderBudgetHealthBanner(metrics);
  }

  function renderStatus(metrics) {
    const root = getElement(selectors.resultsStatus);
    if (!root) {
      return;
    }

    const isBlank = metrics.totalIncome === 0 && metrics.totalExpenses === 0;
    let tone = "warn";
    let title = "Start with your monthly income";
    let copy = "Add income and a few key expenses to get a clearer view of your budget.";
    const checklist = [];

    if (isBlank) {
      checklist.push("Blank fields count as zero, so you can build the plan gradually.");
      checklist.push("Use the sample budget if you want a quick preview of the summaries and charts.");
    } else if (metrics.totalIncome === 0 && metrics.totalExpenses > 0) {
      tone = "bad";
      title = "Expenses are entered without income";
      copy = "Add monthly income to see whether the current plan is workable and what your real deficit looks like.";
      checklist.push("Savings rate stays at 0% when income is zero to avoid misleading results.");
      checklist.push("This is a useful setup if you want to list expenses first and fill in income afterward.");
    } else if (metrics.surplus < 0) {
      tone = "bad";
      title = "Your current plan is running a monthly deficit";
      copy = `You are spending ${formatCurrency(Math.abs(metrics.surplus))} more than you bring in each month based on the values entered.`;
      checklist.push("Review your largest categories first, especially variable spending and any subscriptions.");
      checklist.push("If this is temporary, consider lowering goals until the monthly plan stabilizes.");
    } else if (metrics.surplus === 0) {
      tone = "warn";
      title = "Your budget is balanced but has no leftover room";
      copy = "You are covering expenses, but there is not yet extra room for savings, investing, or faster debt payoff.";
      checklist.push("Even a small reduction in flexible spending can create useful breathing room.");
    } else {
      tone = "good";
      title = "Your budget currently has monthly breathing room";
      copy = `You have ${formatCurrency(metrics.surplus)} left after expenses, which can support savings, investing, or extra debt payments.`;
      if (metrics.totalPlannedGoals > 0) {
        checklist.push(`Goals currently allocate ${formatCurrency(metrics.totalPlannedGoals)} per month.`);
      }
      checklist.push(`Current savings rate: ${formatPercent(metrics.savingsRate)}.`);
    }

    root.innerHTML = `
      <div class="status-headline">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(copy)}</p>
        </div>
        <span class="status-pill ${tone}">${escapeHtml(statusLabel(tone))}</span>
      </div>
      <ul class="status-list">
        ${checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    `;
  }

  function statusLabel(tone) {
    if (tone === "good") {
      return "On track";
    }
    if (tone === "bad") {
      return "Needs attention";
    }
    return "In progress";
  }

  function renderSummaryCards(metrics) {
    const primaryRoot = getElement(selectors.primarySummaryCards);
    const secondaryRoot = getElement(selectors.secondarySummaryCards);
    if (!primaryRoot || !secondaryRoot) {
      return;
    }

    const primaryCards = [
      {
        label: "Monthly Surplus / Deficit",
        value: formatCurrency(metrics.surplus),
        tone: metrics.surplus > 0 ? "good" : metrics.surplus < 0 ? "bad" : "warn",
        copy: metrics.surplus >= 0 ? "Income remaining after expenses." : "Shortfall that needs to be covered.",
      },
      {
        label: "Total Monthly Income",
        value: formatCurrency(metrics.totalIncome),
        tone: "",
        copy: "Combined across all monthly income sources.",
      },
      {
        label: "Total Monthly Expenses",
        value: formatCurrency(metrics.totalExpenses),
        tone: "",
        copy: "Fixed and variable expense categories combined.",
      },
      {
        label: "Savings Rate",
        value: formatPercent(metrics.savingsRate),
        tone: metrics.totalIncome === 0 ? "warn" : metrics.savingsRate > 0 ? "good" : metrics.savingsRate < 0 ? "bad" : "warn",
        copy: "Calculated as surplus divided by total income.",
      },
    ];

    const secondaryCards = [
      {
        label: "Essential Spending",
        value: formatCurrency(metrics.essentialSpending),
        tone: "",
        copy: "Housing, utilities, groceries, insurance, debt, childcare, health, and other core needs.",
      },
      {
        label: "Discretionary Spending",
        value: formatCurrency(metrics.discretionarySpending),
        tone: "",
        copy: "Flexible categories such as entertainment, shopping, dining out, travel, and subscriptions.",
      },
      {
        label: "Largest Spending Category",
        value: metrics.largestExpense ? metrics.largestExpense.label : "No expenses yet",
        tone: "",
        copy: metrics.largestExpense ? `${formatCurrency(metrics.largestExpense.amount)} per month.` : "Add expenses to see the biggest category.",
      },
      {
        label: "Room After Goals",
        value: formatCurrency(metrics.roomAfterGoals),
        tone: metrics.roomAfterGoals > 0 ? "good" : metrics.roomAfterGoals < 0 ? "bad" : "warn",
        copy: "Monthly surplus minus savings, investing, and extra debt goals.",
      },
    ];

    primaryRoot.innerHTML = primaryCards.map((card) => `
      <article class="result-card ${card.label === "Monthly Surplus / Deficit" ? "result-card-primary" : ""}">
        <span class="trust-label">${escapeHtml(card.label)}</span>
        <strong class="metric ${card.tone}">${escapeHtml(card.value)}</strong>
        <p>${escapeHtml(card.copy)}</p>
      </article>
    `).join("");

    secondaryRoot.innerHTML = secondaryCards.map((card) => `
      <article class="result-card">
        <span class="trust-label">${escapeHtml(card.label)}</span>
        <strong class="metric ${card.tone}">${escapeHtml(card.value)}</strong>
        <p>${escapeHtml(card.copy)}</p>
      </article>
    `).join("");

    renderNextStepMessage(metrics);
  }

  function renderPrimaryResultHeadline(metrics) {
    const root = getElement(selectors.primaryResultHeadline);
    if (!root) {
      return;
    }

    if (metrics.totalIncome === 0 && metrics.totalExpenses === 0) {
      root.hidden = true;
      root.innerHTML = "";
      return;
    }

    let tone = "warn";
    let label = "Monthly result";
    let value = formatCurrency(metrics.surplus);
    let copy = "Add more categories to refine the picture.";

    if (metrics.surplus > 0) {
      tone = "good";
      label = "Monthly surplus";
      copy = "This is the room your current budget may have for savings, investing, or faster debt payoff.";
    } else if (metrics.surplus < 0) {
      tone = "bad";
      label = "Monthly deficit";
      copy = "This is the gap your current plan needs to close to become sustainable.";
    } else {
      tone = "warn";
      label = "Monthly break-even";
      copy = "A small improvement could turn this budget into one that creates real monthly room.";
    }

    root.hidden = false;
    root.dataset.tone = tone;
    root.innerHTML = `
      <span class="trust-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(copy)}</p>
    `;
  }

  function renderNextStepMessage(metrics) {
    const root = getElement(selectors.nextStepMessage);
    if (!root) {
      return;
    }

    let title = "A first draft budget is enough";
    let copy = "Start with the biggest categories first, then refine the details once the overall picture feels right.";

    if (metrics.totalIncome === 0 && metrics.totalExpenses === 0) {
      title = "Start with income, housing, and groceries";
      copy = "You do not need every category on the first pass. A simple draft is enough to unlock the main results.";
    } else if (metrics.surplus > 0 && metrics.roomAfterGoals > 0) {
      title = `You still have ${formatCurrency(metrics.roomAfterGoals)} to direct with intention`;
      copy = "Consider splitting that leftover room between emergency savings, investing, or faster debt payoff.";
    } else if (metrics.surplus > 0 && state.fixedExpenses.some((row) => row.label.toLowerCase().includes("debt") && amountToNumber(row.amount) > 0)) {
      title = `You may have room to speed up debt payoff`;
      copy = `With ${formatCurrency(metrics.surplus)} left after expenses, even a modest extra payment could improve payoff momentum.`;
    } else if (metrics.surplus > 0) {
      title = `Your budget currently leaves ${formatCurrency(metrics.surplus)} after expenses`;
      copy = "That is a healthy place to review savings goals, retirement contributions, or extra debt payments.";
    } else if (metrics.surplus < 0) {
      title = `Focus first on the largest flexible categories`;
      copy = "Dining out, shopping, subscriptions, travel, and other discretionary categories are often the fastest places to create breathing room.";
    } else if (metrics.surplus === 0) {
      title = "Even a small adjustment could create room";
      copy = "A small reduction in flexible spending or a modest income increase can turn a break-even budget into a savings-ready one.";
    }

    root.innerHTML = `
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(copy)}</p>
    `;
  }

  function renderNextToolLinks(metrics) {
    const root = getElement(selectors.nextToolLinks);
    if (!root) {
      return;
    }

    const suggestions = [];
    const hasDebt = state.fixedExpenses.some((row) => row.label.toLowerCase().includes("debt") && amountToNumber(row.amount) > 0);
    const largestIsHousing = metrics.largestExpense?.label.toLowerCase().includes("housing");

    if (hasDebt && metrics.surplus >= 0) {
      suggestions.push({
        href: "https://simplekit.app/mortgage-paydown-vs-invest-calculator/",
        label: "Compare mortgage payoff vs investing",
      });
    }
    if (metrics.surplus > 0) {
      suggestions.push({
        href: "https://simplekit.app/compound-interest-calculator/",
        label: "Project your savings growth",
      });
      suggestions.push({
        href: "https://simplekit.app/retirement-planner/",
        label: "Turn surplus into retirement planning",
      });
    }
    if (largestIsHousing) {
      suggestions.push({
        href: "https://simplekit.app/mortgage-calculator/",
        label: "Test a housing payment scenario",
      });
    }
    suggestions.push({
      href: "https://simplekit.app/net-worth-calculator/",
      label: "See how budgeting changes your net worth",
    });

    const seen = new Set();
    const unique = suggestions.filter((item) => {
      if (seen.has(item.href)) {
        return false;
      }
      seen.add(item.href);
      return true;
    }).slice(0, 3);

    if (unique.length === 0) {
      root.innerHTML = "";
      return;
    }

    root.innerHTML = unique.map((item) => `
      <a class="next-tool-link" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>
    `).join("");
  }

  function renderEmptyStateGuide(metrics) {
    const root = getElement(selectors.emptyStateGuide);
    if (!root) {
      return;
    }

    if (metrics.totalIncome === 0 && metrics.totalExpenses === 0) {
      root.innerHTML = `
        <strong>Start with three numbers</strong>
        <p>Add monthly income, housing, and groceries first. That is enough to create a useful first version of your budget.</p>
        <div class="empty-state-actions">
          <button class="chip-btn chip-btn-strong" type="button" data-load-pack="essentials">Use core essentials</button>
          <button class="chip-btn" type="button" data-load-sample="true">Load sample budget</button>
        </div>
      `;
      root.hidden = false;
      return;
    }

    root.hidden = true;
    root.innerHTML = "";
  }

  function renderBudgetHealthBanner(metrics) {
    const root = getElement(selectors.budgetHealthBanner);
    if (!root) {
      return;
    }

    if (metrics.totalIncome === 0 && metrics.totalExpenses === 0) {
      root.hidden = true;
      root.innerHTML = "";
      return;
    }

    let tone = "warn";
    let title = "Your budget health is still taking shape";
    let copy = "Keep adding the biggest categories first so the planner can show a more realistic monthly picture.";

    if (metrics.surplus > 0) {
      tone = "good";
      title = "Your current budget is creating monthly room";
      copy = `You have ${formatCurrency(metrics.surplus)} left after expenses based on the values entered.`;
    } else if (metrics.surplus < 0) {
      tone = "bad";
      title = "Your current budget is running a monthly shortfall";
      copy = `Expenses are ahead of income by ${formatCurrency(Math.abs(metrics.surplus))}, so your biggest flexible categories are the first place to review.`;
    } else {
      tone = "warn";
      title = "Your budget is currently breaking even";
      copy = "A small improvement in spending or income could create real room for savings and other goals.";
    }

    root.hidden = false;
    root.dataset.tone = tone;
    root.innerHTML = `
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(copy)}</p>
    `;
  }

  function renderCharts(metrics) {
    renderCategoryChart(metrics);
    renderTotalsChart(metrics);
    renderSpendingMix(metrics);
    renderChartExplainers(metrics);
  }

  function renderCategoryChart(metrics) {
    const root = getElement(selectors.categoryChart);
    if (!root) {
      return;
    }

    const rows = metrics.expenseRows
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    if (rows.length === 0) {
      root.innerHTML = `<div class="empty-state">Add at least one expense category to see the breakdown chart.</div>`;
      return;
    }

    const maxAmount = rows[0].amount || 1;
    root.innerHTML = rows.map((row, index) => {
      const width = Math.max(6, (row.amount / maxAmount) * 100);
      const hue = index % 2 === 0 ? "var(--budget-brand)" : "var(--budget-brand-2)";
      return `
        <div class="chart-row">
          <div class="chart-row-header">
            <strong>${escapeHtml(row.label)}</strong>
            <span>${escapeHtml(formatCurrency(row.amount))}</span>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width:${width}%; background:${hue};"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderTotalsChart(metrics) {
    const root = getElement(selectors.totalsChart);
    if (!root) {
      return;
    }

    const maxValue = Math.max(metrics.totalIncome, metrics.totalExpenses, Math.abs(metrics.surplus), 1);
    const rows = [
      { label: "Income", value: metrics.totalIncome, color: "var(--budget-brand-2)" },
      { label: "Expenses", value: metrics.totalExpenses, color: "var(--budget-brand)" },
      { label: metrics.surplus >= 0 ? "Surplus" : "Deficit", value: Math.abs(metrics.surplus), color: metrics.surplus >= 0 ? "var(--budget-good)" : "var(--budget-bad)" },
    ];

    root.innerHTML = rows.map((row) => `
      <div class="totals-chart-row">
        <div class="chart-row-header">
          <strong>${escapeHtml(row.label)}</strong>
          <span>${escapeHtml(formatCurrency(row.value))}</span>
        </div>
        <div class="totals-bar-track">
          <div class="totals-bar-fill" style="width:${Math.max(0, (row.value / maxValue) * 100)}%; background:${row.color};"></div>
        </div>
      </div>
    `).join("");
  }

  function renderSpendingMix(metrics) {
    const root = getElement(selectors.spendingMix);
    if (!root) {
      return;
    }

    const totalExpenses = metrics.totalExpenses;
    if (totalExpenses === 0) {
      root.innerHTML = `<div class="empty-state">Once you add expenses, this section will compare essential and discretionary spending.</div>`;
      return;
    }

    const essentialWidth = (metrics.essentialSpending / totalExpenses) * 100;
    const discretionaryWidth = (metrics.discretionarySpending / totalExpenses) * 100;

    root.innerHTML = `
      <div>
        <div class="chart-row-header">
          <strong>Spending mix</strong>
          <span>${escapeHtml(formatCurrency(totalExpenses))} total expenses</span>
        </div>
        <div class="mix-track" aria-hidden="true">
          <div class="mix-fill" style="width:${essentialWidth}%; background:var(--budget-brand);"></div>
        </div>
        <div class="mix-track" aria-hidden="true" style="margin-top:8px;">
          <div class="mix-fill" style="width:${discretionaryWidth}%; background:var(--budget-brand-2);"></div>
        </div>
      </div>
      <div class="mix-segments">
        <div class="mix-stat">
          <span class="trust-label">Essential</span>
          <strong>${escapeHtml(formatCurrency(metrics.essentialSpending))}</strong>
          <p>${escapeHtml(formatPercent(metrics.essentialSpending / totalExpenses))} of total expenses.</p>
        </div>
        <div class="mix-stat">
          <span class="trust-label">Discretionary</span>
          <strong>${escapeHtml(formatCurrency(metrics.discretionarySpending))}</strong>
          <p>${escapeHtml(formatPercent(metrics.discretionarySpending / totalExpenses))} of total expenses.</p>
        </div>
      </div>
    `;
  }

  function renderInsights(metrics) {
    const root = getElement(selectors.insightsList);
    if (!root) {
      return;
    }

    const insights = buildInsights(metrics);
    root.innerHTML = insights.map((insight) => `
      <article class="insight-card">
        <span class="trust-label">${escapeHtml(insight.label)}</span>
        <strong>${escapeHtml(insight.title)}</strong>
        <p>${escapeHtml(insight.copy)}</p>
      </article>
    `).join("");
  }

  function renderChartExplainers(metrics) {
    const categoryExplainer = getElement(selectors.categoryChartExplainer);
    const categoryAction = getElement(selectors.categoryChartAction);
    const totalsExplainer = getElement(selectors.totalsChartExplainer);
    const totalsAction = getElement(selectors.totalsChartAction);
    const mixExplainer = getElement(selectors.mixChartExplainer);
    const mixAction = getElement(selectors.mixChartAction);

    if (categoryExplainer) {
      categoryExplainer.textContent = metrics.largestExpense
        ? `${metrics.largestExpense.label} is currently the biggest category in your monthly budget.`
        : "This helps you see which categories take the biggest share of your monthly budget.";
    }
    if (categoryAction) {
      categoryAction.textContent = metrics.largestExpense
        ? `Start your review with ${metrics.largestExpense.label} first if you need to create room quickly.`
        : "";
    }

    if (totalsExplainer) {
      totalsExplainer.textContent = metrics.surplus >= 0
        ? "Your monthly surplus shows how much room you may have for savings, investing, or extra debt payments."
        : "Your monthly deficit shows how much needs to be cut, covered, or offset before the plan is sustainable.";
    }
    if (totalsAction) {
      totalsAction.textContent = metrics.surplus > 0
        ? "If this surplus feels sustainable, it can become your monthly savings or investing engine."
        : metrics.surplus < 0
          ? "If this plan is running short, review flexible spending before changing your long-term goals."
          : "A small change in spending or income could turn this break-even plan into a savings-ready budget.";
    }

    if (mixExplainer) {
      mixExplainer.textContent = metrics.totalExpenses > 0 && metrics.discretionarySpending >= metrics.essentialSpending
        ? "A meaningful share of your spending is flexible, which may make it easier to adjust the budget if needed."
        : "If most spending is essential, small changes may need to come from several categories rather than one large cut.";
    }
    if (mixAction) {
      mixAction.textContent = metrics.totalExpenses > 0 && metrics.discretionarySpending >= metrics.essentialSpending
        ? "Look at your top discretionary categories first if you want the fastest budget changes."
        : "When essentials dominate, focus on gradual improvements and goal pacing rather than one large cut.";
    }
  }

  function buildInsights(metrics) {
    const insights = [];

    if (metrics.totalIncome === 0 && metrics.totalExpenses === 0) {
      return [
        {
          label: "Getting started",
          title: "Start with the categories you already know",
          copy: "You do not need a perfect first draft. Add income, housing, groceries, and a few common expenses, then refine the budget from there.",
        },
      ];
    }

    if (metrics.totalIncome > 0) {
      insights.push({
        label: "Cash flow",
        title: `You are currently spending ${formatPercent(metrics.spendPercent)} of your income each month`,
        copy: "That ratio can help you judge whether your current plan feels sustainable or too tight.",
      });
      insights.push({
        label: "Savings rate",
        title: `You are currently saving ${formatPercent(Math.max(metrics.savingsRate, 0))} of your income each month`,
        copy: metrics.savingsRate > 0
          ? "That is the share of income left over after monthly expenses in this budget."
          : "There is not yet positive room left over after monthly expenses in this budget.",
      });
    }

    if (metrics.largestExpense) {
      insights.push({
        label: "Largest category",
        title: `${metrics.largestExpense.label} is your largest spending category`,
        copy: `${formatCurrency(metrics.largestExpense.amount)} goes there each month based on the values entered.`,
      });
    }

    if (metrics.surplus > 0) {
      insights.push({
        label: "Positive room",
        title: `You have ${formatCurrency(metrics.surplus)} left after expenses each month`,
        copy: "You could split that room between emergency savings, investing, extra debt payments, and a small cash buffer.",
      });
    } else if (metrics.surplus < 0) {
      insights.push({
        label: "Shortfall",
        title: `Your current plan is short by ${formatCurrency(Math.abs(metrics.surplus))} each month`,
        copy: "Start by reviewing the two largest discretionary categories, then compare them with any optional goals you entered.",
      });
    }

    if (metrics.goals.savings > 0) {
      insights.push({
        label: "Savings goal",
        title: metrics.savingsGoalGap > 0 ? "Your savings goal is not fully covered yet" : "Your current surplus can support your savings goal",
        copy: metrics.savingsGoalGap > 0
          ? `You would need ${formatCurrency(metrics.savingsGoalGap)} more each month to fully cover the savings goal entered.`
          : `Your entered surplus is enough to cover the ${formatCurrency(metrics.goals.savings)} monthly savings goal.`,
      });
    }

    if (metrics.roomAfterGoals > 0) {
      insights.push({
        label: "Available room",
        title: `${formatCurrency(metrics.roomAfterGoals)} remains after your current goals`,
        copy: "That extra room could stay as cash buffer or be redirected to other priorities inside the SimpleKit ecosystem.",
      });
    } else if (metrics.totalPlannedGoals > 0 && metrics.roomAfterGoals < 0) {
      insights.push({
        label: "Goal pressure",
        title: "Your current goals are larger than your monthly surplus",
        copy: "That does not mean the goals are wrong. It may simply mean they need to be phased in over time or adjusted for this season.",
      });
    }

    if (metrics.totalExpenses > 0) {
      insights.push({
        label: "Flexibility",
        title: metrics.discretionarySpending >= metrics.essentialSpending
          ? "A meaningful share of your budget is flexible"
          : "Most of your budget is tied to essentials",
        copy: metrics.discretionarySpending >= metrics.essentialSpending
          ? "That usually means you may have more room to adjust spending if you need to free up cash flow."
          : "That usually means changes may be harder to make quickly, so small goal adjustments may matter more.",
      });
    }

    return insights.slice(0, 5);
  }

  function renderTable(metrics) {
    const root = getElement(selectors.budgetTableBody);
    if (!root) {
      return;
    }

    const rows = metrics.expenseRows
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    if (rows.length === 0) {
      root.innerHTML = `
        <tr>
          <td colspan="5" class="table-muted">Add expense categories to generate the detailed table.</td>
        </tr>
      `;
      const cardRoot = getElement(selectors.budgetTableCards);
      if (cardRoot) {
        cardRoot.innerHTML = "";
      }
      return;
    }

    root.innerHTML = rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.label)}</td>
        <td>${escapeHtml(row.type)}</td>
        <td>${escapeHtml(formatCurrency(row.amount))}</td>
        <td>${escapeHtml(formatPercent(metrics.totalIncome > 0 ? row.amount / metrics.totalIncome : 0))}</td>
        <td>${escapeHtml(formatPercent(metrics.totalExpenses > 0 ? row.amount / metrics.totalExpenses : 0))}</td>
      </tr>
    `).join("");

    const cardRoot = getElement(selectors.budgetTableCards);
    if (cardRoot) {
      cardRoot.innerHTML = rows.map((row) => `
        <article class="table-card">
          <strong>${escapeHtml(row.label)}</strong>
          <p>${escapeHtml(row.type)} • ${escapeHtml(formatCurrency(row.amount))}</p>
          <p>${escapeHtml(formatPercent(metrics.totalIncome > 0 ? row.amount / metrics.totalIncome : 0))} of income • ${escapeHtml(formatPercent(metrics.totalExpenses > 0 ? row.amount / metrics.totalExpenses : 0))} of expenses</p>
        </article>
      `).join("");
    }
  }

  function renderHero(metrics) {
    getElement(selectors.heroSurplus).textContent = formatCurrency(metrics.surplus);
    getElement(selectors.heroIncome).textContent = formatCurrency(metrics.totalIncome);
    getElement(selectors.heroExpenses).textContent = formatCurrency(metrics.totalExpenses);
    getElement(selectors.heroSavingsRate).textContent = formatPercent(metrics.savingsRate);
    getElement(selectors.heroLargest).textContent = metrics.largestExpense ? metrics.largestExpense.label : "No data yet";
    getElement(selectors.heroSummary).textContent = buildHeroSummary(metrics);
  }

  function renderMobileSummary(metrics) {
    getElement(selectors.mobileIncome).textContent = formatCurrency(metrics.totalIncome);
    getElement(selectors.mobileExpenses).textContent = formatCurrency(metrics.totalExpenses);
    getElement(selectors.mobileSurplus).textContent = formatCurrency(metrics.surplus);
  }

  function buildHeroSummary(metrics) {
    if (metrics.totalIncome === 0 && metrics.totalExpenses === 0) {
      return "Add your monthly income and expenses to see your surplus, savings rate, and biggest spending categories.";
    }
    if (metrics.surplus < 0) {
      return `Your current plan is short by ${formatCurrency(Math.abs(metrics.surplus))} per month, so it may help to review the biggest flexible categories first.`;
    }
    if (metrics.surplus === 0) {
      return "Your budget currently breaks even, which means even a small adjustment could create room for savings or extra debt payments.";
    }
    return `You currently have ${formatCurrency(metrics.surplus)} left after expenses each month, with ${formatPercent(metrics.savingsRate)} of income available as surplus.`;
  }

  function bindEvents() {
    const form = getElement(selectors.form);
    if (!form) {
      return;
    }

    form.addEventListener("input", handleFormInput);
    form.addEventListener("click", handleRowActions);

    getElement(selectors.addIncomeRowBtn)?.addEventListener("click", () => addRow("income", "Income source"));
    getElement(selectors.addFixedExpenseBtn)?.addEventListener("click", () => addRow("fixedExpenses", "Custom fixed expense"));
    getElement(selectors.addVariableExpenseBtn)?.addEventListener("click", () => addRow("variableExpenses", "Custom variable expense"));
    getElement(selectors.simpleModeBtn)?.addEventListener("click", () => setPlannerMode("simple"));
    getElement(selectors.detailedModeBtn)?.addEventListener("click", () => setPlannerMode("detailed"));
    getElement(selectors.loadSampleBtn)?.addEventListener("click", () => {
      state = cloneState(SAMPLE_STATE);
      refresh();
    });
    getElement(selectors.resetBtn)?.addEventListener("click", () => {
      state = cloneState(DEFAULT_STATE);
      refresh();
    });
    getElement(selectors.shareBtn)?.addEventListener("click", copyShareLink);
    getElement(selectors.printBtn)?.addEventListener("click", () => window.print());
    getElement(selectors.exportCsvBtn)?.addEventListener("click", exportCsv);
    getElement(selectors.saveJsonBtn)?.addEventListener("click", saveJson);
    getElement(selectors.loadJsonBtn)?.addEventListener("click", () => {
      getElement(selectors.loadJsonInput)?.click();
    });
    getElement(selectors.loadJsonInput)?.addEventListener("change", loadJson);
  }

  function handleFormInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (target.closest(".budget-row")) {
      const rowElement = target.closest(".budget-row");
      const group = rowElement?.dataset.group;
      const index = Number(rowElement?.dataset.index);
      if (!group || !Number.isInteger(index) || !state[group]?.[index]) {
        return;
      }

      if (target.classList.contains("row-name")) {
        state[group][index].label = target.value.slice(0, 40);
      }

      if (target.classList.contains("row-amount")) {
        state[group][index].amount = sanitizeAmountInput(target.value);
      }
    } else if (target.name in state.goals) {
      state.goals[target.name] = sanitizeAmountInput(target.value);
    }

    saveState();
    renderResults();
  }

  function handleRowActions(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.classList.contains("inline-link-btn")) {
      const pack = target.dataset.loadPack;
      if (pack) {
        loadStarterPack(pack);
      }
      return;
    }

    if (target.classList.contains("chip-btn")) {
      if (target.dataset.loadSample === "true") {
        state = cloneState(SAMPLE_STATE);
        refresh();
        return;
      }
      const pack = target.dataset.loadPack;
      if (pack) {
        loadStarterPack(pack);
        return;
      }
      const group = target.dataset.addGroup;
      const label = target.dataset.addLabel;
      if (group && label) {
        addSuggestedCategory(group, label);
      }
      return;
    }

    if (!target.classList.contains("row-remove-btn")) {
      return;
    }

    const rowElement = target.closest(".budget-row");
    const group = rowElement?.dataset.group;
    const index = Number(rowElement?.dataset.index);
    if (!group || !Number.isInteger(index) || !state[group]?.[index]) {
      return;
    }

    state[group].splice(index, 1);
    if (state[group].length === 0) {
      const fallbackLabel = group === "income" ? "Income source" : group === "fixedExpenses" ? "Fixed expense" : "Variable expense";
      state[group].push(createRow(`${group}-${Date.now()}`, fallbackLabel));
    }
    refresh();
  }

  function addRow(group, label) {
    state[group].push(createRow(`${group}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, label));
    setPlannerMode("detailed");
    refresh();
  }

  function addSuggestedCategory(group, label) {
    const alreadyExists = state[group].some((row) => row.label.trim().toLowerCase() === label.trim().toLowerCase());
    if (!alreadyExists) {
      addRow(group, label);
      return;
    }

    setPlannerMode("detailed");
  }

  function loadStarterPack(packName) {
    const pack = STARTER_PACKS[packName];
    if (!pack) {
      return;
    }

    let addedAny = false;
    pack.forEach(([group, label]) => {
      const exists = state[group].some((row) => row.label.trim().toLowerCase() === label.trim().toLowerCase());
      if (!exists) {
        state[group].push(createRow(`${group}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, label));
        addedAny = true;
      }
    });

    if (addedAny) {
      setPlannerMode("detailed");
      refresh();
    }
  }

  function setPlannerMode(mode) {
    plannerMode = mode;
    document.body.dataset.plannerMode = mode;
    const simpleBtn = getElement(selectors.simpleModeBtn);
    const detailedBtn = getElement(selectors.detailedModeBtn);
    if (simpleBtn && detailedBtn) {
      simpleBtn.setAttribute("aria-pressed", String(mode === "simple"));
      detailedBtn.setAttribute("aria-pressed", String(mode === "detailed"));
      simpleBtn.classList.toggle("btn-primary", mode === "simple");
      simpleBtn.classList.toggle("btn-secondary-panel", mode !== "simple");
      detailedBtn.classList.toggle("btn-primary", mode === "detailed");
      detailedBtn.classList.toggle("btn-secondary-panel", mode !== "detailed");
    }
  }

  function copyShareLink() {
    const feedback = getElement(selectors.shareFeedback);
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        if (feedback) {
          feedback.textContent = "Page link copied.";
        }
      })
      .catch(() => {
        if (feedback) {
          feedback.textContent = `Copy failed. Use this page URL manually: ${window.location.href}`;
        }
      });
  }

  function saveJson() {
    const payload = {
      version: 1,
      tool: "simplekit-budget-planner",
      savedAt: new Date().toISOString(),
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "budget-planner.json";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    const feedback = getElement(selectors.shareFeedback);
    if (feedback) {
      feedback.textContent = "Budget saved.";
    }
  }

  async function loadJson(event) {
    const input = event.target;
    const feedback = getElement(selectors.shareFeedback);
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const nextState = parsed?.state ?? parsed;
      state = sanitizeState(nextState);
      refresh();
      if (feedback) {
        feedback.textContent = `Opened budget from ${file.name}.`;
      }
    } catch (error) {
      if (feedback) {
        feedback.textContent = "That file could not be opened. Please choose a valid saved budget file.";
      }
    } finally {
      input.value = "";
    }
  }

  function exportCsv() {
    const metrics = collectMetrics();
    const rows = metrics.expenseRows
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    if (rows.length === 0) {
      const feedback = getElement(selectors.shareFeedback);
      if (feedback) {
        feedback.textContent = "Add expense categories before exporting CSV.";
      }
      return;
    }

    const lines = [
      ["Category", "Type", "Monthly amount", "% of income", "% of expenses"].join(","),
      ...rows.map((row) => [
        csvCell(row.label),
        csvCell(row.type),
        row.amount.toFixed(2),
        (metrics.totalIncome > 0 ? (row.amount / metrics.totalIncome) * 100 : 0).toFixed(2),
        (metrics.totalExpenses > 0 ? (row.amount / metrics.totalExpenses) * 100 : 0).toFixed(2),
      ].join(",")),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "budget-planner.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    const feedback = getElement(selectors.shareFeedback);
    if (feedback) {
      feedback.textContent = "CSV export started.";
    }
  }

  function renderRelatedTools(metrics) {
    const cards = [...document.querySelectorAll(".related-card")];
    const intro = getElement(selectors.relatedToolsIntro);
    if (cards.length === 0) {
      return;
    }

    cards.forEach((card) => {
      card.classList.remove("related-card-highlight");
    });

    const hrefMatches = (fragment) => cards.find((card) => card.getAttribute("href")?.includes(fragment));
    const highlights = [];
    const orderedCards = [];
    const debtCard = hrefMatches("/mortgage-paydown-vs-invest-calculator/");
    const compoundCard = hrefMatches("/compound-interest-calculator/");
    const netWorthCard = hrefMatches("/net-worth-calculator/");
    const fireCard = hrefMatches("/fire-calculator/");
    const retirementCard = hrefMatches("/retirement-planner/");
    const mortgageCard = hrefMatches("/mortgage-calculator/");

    if (metrics.goals.debt > 0 || state.fixedExpenses.some((row) => row.label.toLowerCase().includes("debt") && amountToNumber(row.amount) > 0)) {
      highlights.push(debtCard);
      orderedCards.push(debtCard);
    }
    if (metrics.surplus > 0) {
      highlights.push(compoundCard);
      highlights.push(retirementCard);
      highlights.push(fireCard);
      orderedCards.push(compoundCard, retirementCard, fireCard);
    }
    if (metrics.largestExpense?.label.toLowerCase().includes("housing")) {
      highlights.push(mortgageCard);
      orderedCards.push(mortgageCard);
    }
    highlights.push(netWorthCard);
    orderedCards.push(netWorthCard, debtCard, compoundCard, fireCard, retirementCard, mortgageCard);

    highlights.filter(Boolean).slice(0, 3).forEach((card) => {
      card.classList.add("related-card-highlight");
    });

    const parent = cards[0]?.parentElement;
    if (parent) {
      const seen = new Set();
      orderedCards.filter(Boolean).forEach((card) => {
        const key = card.getAttribute("href");
        if (key && !seen.has(key)) {
          seen.add(key);
          parent.appendChild(card);
        }
      });
    }

    if (intro) {
      if (metrics.surplus > 0) {
        intro.textContent = "You have room to plan your next move. Use these SimpleKit tools to turn your surplus into savings, investing, debt payoff, or long-term planning.";
      } else if (state.fixedExpenses.some((row) => row.label.toLowerCase().includes("debt") && amountToNumber(row.amount) > 0)) {
        intro.textContent = "Debt may be one of your highest-impact next moves. These tools can help you compare payoff, growth, and longer-term planning options.";
      } else {
        intro.textContent = "Use your budget results in these next-step calculators across the SimpleKit financial ecosystem.";
      }
    }
  }

  function csvCell(value) {
    return `"${String(value).replaceAll("\"", "\"\"")}"`;
  }

  function refresh() {
    renderRows("income", selectors.incomeRows);
    renderRows("fixedExpenses", selectors.fixedExpenseRows);
    renderRows("variableExpenses", selectors.variableExpenseRows);
    renderGoalInputs();
    saveState();
    renderResults();
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
    bindEvents();
    setPlannerMode("simple");
    refresh();
  }

  initialize();
})();
