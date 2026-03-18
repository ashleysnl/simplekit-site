(() => {
const STORAGE_KEY = "simplekit-debt-payoff-state-v1";
const MAX_MONTHS = 1200;
const EPSILON = 0.005;

const DEFAULT_STATE = {
  debts: [
    { id: createId(), name: "Visa", balance: 6200, rate: 19.99, minimum: 185 },
    { id: createId(), name: "Student Loan", balance: 12800, rate: 5.9, minimum: 160 },
  ],
  extraPayment: 150,
  strategy: "snowball",
  startDate: getCurrentMonthValue(),
};

const SAMPLE_STATE = {
  debts: [
    { id: createId(), name: "Visa", balance: 5400, rate: 22.99, minimum: 165 },
    { id: createId(), name: "Line of Credit", balance: 8700, rate: 10.5, minimum: 120 },
    { id: createId(), name: "Car Loan", balance: 11200, rate: 6.1, minimum: 265 },
    { id: createId(), name: "Student Loan", balance: 14900, rate: 4.8, minimum: 145 },
  ],
  extraPayment: 250,
  strategy: "avalanche",
  startDate: getCurrentMonthValue(),
};

const selectors = {
  form: "#debtForm",
  debtRows: "#debtRows",
  addDebtBtn: "#addDebtBtn",
  loadSampleBtn: "#loadSampleBtn",
  resetBtn: "#resetBtn",
  calculateBtn: "#calculateBtn",
  shareBtn: "#shareBtn",
  csvBtn: "#csvBtn",
  shareFeedback: "#shareFeedback",
  resultsStatus: "#resultsStatus",
  resultCards: "#resultCards",
  comparisonCards: "#comparisonCards",
  comparisonInsight: "#comparisonInsight",
  payoffOrderList: "#payoffOrderList",
  scheduleTableBody: "#scheduleTableBody",
  headlineSummary: "#headlineSummary",
  heroMonthsValue: "#heroMonthsValue",
  heroMonthsLabel: "#heroMonthsLabel",
  heroSummaryGrid: "#heroSummaryGrid",
  chartCanvas: "#payoffChart",
  chartStrategyLabel: "#chartStrategyLabel",
  resultsIntro: "#resultsIntro",
  bottomLineCard: "#bottomLineCard",
};

let state = normalizeState(loadInitialState());
let latestComputation = null;
let resizeFrame = 0;
let activeDebtId = state.debts[0]?.id || null;

function createId() {
  return `debt-${Math.random().toString(36).slice(2, 10)}`;
}

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function loadInitialState() {
  const urlState = restoreStateFromUrl();
  if (urlState) {
    return urlState;
  }

  try {
    const savedState = window.localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    // Ignore storage failures and continue with defaults.
  }

  return DEFAULT_STATE;
}

function normalizeState(rawState) {
  const safeState = rawState || DEFAULT_STATE;
  const debts = Array.isArray(safeState.debts) ? safeState.debts : DEFAULT_STATE.debts;

  return {
    debts: debts.length > 0
      ? debts.map((debt, index) => normalizeDebt(debt, index))
      : DEFAULT_STATE.debts.map((debt, index) => normalizeDebt(debt, index)),
    extraPayment: normalizeStoredNumber(safeState.extraPayment, DEFAULT_STATE.extraPayment),
    strategy: safeState.strategy === "avalanche" ? "avalanche" : "snowball",
    startDate: isValidMonthString(safeState.startDate) ? safeState.startDate : DEFAULT_STATE.startDate,
  };
}

function normalizeDebt(debt, index) {
  const defaults = DEFAULT_STATE.debts[index] || DEFAULT_STATE.debts[0];
  return {
    id: debt?.id || createId(),
    name: typeof debt?.name === "string" ? debt.name : defaults.name,
    balance: normalizeStoredNumber(debt?.balance, defaults.balance),
    rate: normalizeStoredNumber(debt?.rate, defaults.rate),
    minimum: normalizeStoredNumber(debt?.minimum, defaults.minimum),
  };
}

function sanitizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStoredNumber(value, fallback = 0) {
  if (value === "" || value === null) {
    return "";
  }

  if (value === undefined) {
    return fallback;
  }

  return sanitizeNumber(value, fallback);
}

function isValidMonthString(value) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

function getForm() {
  return document.querySelector(selectors.form);
}

function renderDebtRows() {
  const debtRows = document.querySelector(selectors.debtRows);
  if (!debtRows) {
    return;
  }

  debtRows.innerHTML = state.debts.map((debt, index) => `
    <details class="debt-row" data-debt-id="${escapeHtml(debt.id)}" ${shouldOpenDebtEditor(debt, index) ? "open" : ""}>
      <summary class="debt-row-summary">
        <div class="debt-row-top">
          <div class="debt-row-title-wrap">
            <span class="debt-row-index" data-role="debt-heading">Debt ${index + 1} - ${escapeHtml(debt.name || "Unnamed")}</span>
          </div>
          <div class="debt-row-summary-actions">
            <button
              class="btn btn-icon"
              type="button"
              data-action="delete-debt"
              data-debt-id="${escapeHtml(debt.id)}"
              aria-label="Delete ${escapeHtml(debt.name || `debt ${index + 1}`)}"
            >
              Delete
            </button>
          </div>
        </div>
        <span class="debt-row-meta" data-role="debt-meta">${buildDebtMeta(debt)}</span>
      </summary>

      <div class="debt-row-body">
        <div class="debt-row-grid">
          <label class="form-field debt-name-field">
            <span>Debt Label</span>
            <input
              data-field="name"
              data-debt-id="${escapeHtml(debt.id)}"
              type="text"
              value="${escapeHtml(debt.name)}"
              placeholder="Visa, car loan, student loan"
            >
            <small>Name the debt so the payoff order is easier to read later.</small>
          </label>

          <label class="form-field">
            <span>Current Balance</span>
            <div class="input-prefix">
              <span>$</span>
              <input
                data-field="balance"
                data-debt-id="${escapeHtml(debt.id)}"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                value="${toInputValue(debt.balance)}"
              >
            </div>
          </label>

          <label class="form-field">
            <span>Interest Rate (APR)</span>
            <div class="input-suffix">
              <input
                data-field="rate"
                data-debt-id="${escapeHtml(debt.id)}"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                value="${toInputValue(debt.rate)}"
              >
              <span>%</span>
            </div>
            <small>Use the annual interest rate shown by the lender.</small>
          </label>

          <label class="form-field">
            <span>Minimum Payment</span>
            <div class="input-prefix">
              <span>$</span>
              <input
                data-field="minimum"
                data-debt-id="${escapeHtml(debt.id)}"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                value="${toInputValue(debt.minimum)}"
              >
            </div>
            <small>The required monthly minimum before any extra payment is added.</small>
          </label>
        </div>
      </div>
    </details>
  `).join("");
}

function shouldOpenDebtEditor(debt, index) {
  if (activeDebtId && debt.id === activeDebtId) {
    return true;
  }
  return (!activeDebtId && index === 0) || !debt.name || debt.balance === "" || debt.rate === "" || debt.minimum === "";
}

function buildDebtMeta(debt) {
  const balance = debt.balance === "" ? "$0" : formatCurrencyShort(Number(debt.balance) || 0);
  const rate = debt.rate === "" ? "0%" : `${trimNumber(Number(debt.rate) || 0)}% APR`;
  const minimum = debt.minimum === "" ? "$0" : formatCurrencyShort(Number(debt.minimum) || 0);
  return `
    <span class="debt-meta-pill">
      <strong>Balance</strong>
      <span>${escapeHtml(balance)}</span>
    </span>
    <span class="debt-meta-pill">
      <strong>APR</strong>
      <span>${escapeHtml(rate)}</span>
    </span>
    <span class="debt-meta-pill">
      <strong>Minimum</strong>
      <span>${escapeHtml(minimum)}</span>
    </span>
  `;
}

function toInputValue(value) {
  return Number.isFinite(Number(value)) ? String(value) : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function bindEvents() {
  const form = getForm();
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      updateStateFromDom();
      runCalculator({ announce: true });
    });

    form.addEventListener("input", (event) => {
      handleFormInput(event);
    });

    form.addEventListener("change", (event) => {
      handleFormInput(event);
    });

    form.addEventListener("click", (event) => {
      const summary = event.target.closest(".debt-row-summary");
      if (summary) {
        const details = summary.closest(".debt-row");
        if (details && !details.open) {
          activeDebtId = details.dataset.debtId || activeDebtId;
          collapseOtherDebtRows(activeDebtId);
        }
      }

      const button = event.target.closest("[data-action='delete-debt']");
      if (!button) {
        return;
      }

      event.preventDefault();

      const debtId = button.getAttribute("data-debt-id");
      if (!debtId) {
        return;
      }

      state.debts = state.debts.filter((debt) => debt.id !== debtId);
      if (state.debts.length === 0) {
        state.debts = [{ id: createId(), name: "", balance: 0, rate: 0, minimum: 0 }];
        activeDebtId = state.debts[0].id;
      } else if (activeDebtId === debtId) {
        activeDebtId = state.debts[0].id;
      }
      renderDebtRows();
      persistState();
      runCalculator();
    });
  }

  document.querySelector(selectors.addDebtBtn)?.addEventListener("click", () => {
    const newDebt = {
      id: createId(),
      name: `Debt ${state.debts.length + 1}`,
      balance: 0,
      rate: 0,
      minimum: 0,
    };
    state.debts.push(newDebt);
    activeDebtId = newDebt.id;
    renderDebtRows();
    persistState();
    runCalculator();
  });

  document.querySelector(selectors.loadSampleBtn)?.addEventListener("click", () => {
    state = normalizeState(SAMPLE_STATE);
    activeDebtId = state.debts[0]?.id || null;
    syncFormFromState();
    runCalculator({ announce: true, shareMessage: "Sample debt scenario loaded." });
  });

  document.querySelector(selectors.resetBtn)?.addEventListener("click", () => {
    state = normalizeState(DEFAULT_STATE);
    activeDebtId = state.debts[0]?.id || null;
    syncFormFromState();
    runCalculator({ announce: true, shareMessage: "Calculator reset to the default example debts." });
  });

  document.querySelector(selectors.shareBtn)?.addEventListener("click", copyShareLink);
  document.querySelector(selectors.csvBtn)?.addEventListener("click", downloadCsv);
  window.addEventListener("resize", scheduleChartResize);
}

function handleFormInput(event) {
  if (!event.target) {
    return;
  }
  updateStateFromDom();
  syncDebtSummaryContent();
  persistState();
  runCalculator();
}

function syncFormFromState() {
  renderDebtRows();
  const form = getForm();
  if (!form) {
    return;
  }

  form.elements.extraPayment.value = toInputValue(state.extraPayment);
  form.elements.strategy.value = state.strategy;
  form.elements.startDate.value = state.startDate;
  syncDebtSummaryContent();
  persistState();
}

function syncDebtSummaryContent() {
  state.debts.forEach((debt, index) => {
    const row = document.querySelector(`.debt-row[data-debt-id="${CSS.escape(debt.id)}"]`);
    if (!row) {
      return;
    }

    const heading = row.querySelector('[data-role="debt-heading"]');
    const meta = row.querySelector('[data-role="debt-meta"]');

    if (heading) {
      heading.textContent = `Debt ${index + 1} - ${debt.name || "Unnamed"}`;
    }

    if (meta) {
      meta.innerHTML = buildDebtMeta(debt);
    }
  });
}

function collapseOtherDebtRows(openDebtId) {
  document.querySelectorAll(".debt-row").forEach((details) => {
    if (details.dataset.debtId !== openDebtId) {
      details.open = false;
    }
  });
}

function updateStateFromDom() {
  const form = getForm();
  if (!form) {
    return;
  }

  const nextDebts = state.debts.map((debt) => {
    const id = debt.id;
    const name = form.querySelector(`[data-field="name"][data-debt-id="${CSS.escape(id)}"]`)?.value ?? debt.name;
    const balance = form.querySelector(`[data-field="balance"][data-debt-id="${CSS.escape(id)}"]`)?.value ?? debt.balance;
    const rate = form.querySelector(`[data-field="rate"][data-debt-id="${CSS.escape(id)}"]`)?.value ?? debt.rate;
    const minimum = form.querySelector(`[data-field="minimum"][data-debt-id="${CSS.escape(id)}"]`)?.value ?? debt.minimum;

    return {
      id,
      name: String(name).trim(),
      balance: parseMaybeNumber(balance),
      rate: parseMaybeNumber(rate),
      minimum: parseMaybeNumber(minimum),
    };
  });

  state = {
    debts: nextDebts,
    extraPayment: parseMaybeNumber(form.elements.extraPayment.value),
    strategy: form.elements.strategy.value === "avalanche" ? "avalanche" : "snowball",
    startDate: isValidMonthString(form.elements.startDate.value) ? form.elements.startDate.value : getCurrentMonthValue(),
  };
}

function parseMaybeNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

function persistState() {
  const stateToStore = {
    ...state,
    debts: state.debts.map((debt) => ({
      ...debt,
      name: debt.name || "",
    })),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
  } catch (error) {
    // Ignore storage failures in private browsing or restricted environments.
  }

  syncUrlState(stateToStore);
}

function syncUrlState(nextState) {
  try {
    const encoded = encodeState(nextState);
    const url = new URL(window.location.href);
    url.searchParams.set("plan", encoded);
    window.history.replaceState({}, "", url.toString());
  } catch (error) {
    // Ignore history encoding issues.
  }
}

function restoreStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("plan");
  if (!encoded) {
    return null;
  }

  try {
    return JSON.parse(decodeState(encoded));
  } catch (error) {
    return null;
  }
}

function encodeState(value) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeState(value) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function runCalculator(options = {}) {
  const validation = validateState(state);
  latestComputation = validation.valid ? computeStrategies(state) : null;
  renderValidation(validation);
  renderDashboard(validation, latestComputation, options);
  renderInputValidity(validation);
}

function validateState(currentState) {
  const errors = [];
  const warnings = [];
  const debtFieldErrors = {};

  if (!Array.isArray(currentState.debts) || currentState.debts.length === 0) {
    errors.push("Add at least one debt to build a payoff plan.");
  }

  const parsedDebts = currentState.debts.map((debt, index) => {
    const name = typeof debt.name === "string" ? debt.name.trim() : "";
    const balance = Number(debt.balance);
    const rate = Number(debt.rate);
    const minimum = Number(debt.minimum);
    const label = name || `Debt ${index + 1}`;

    debtFieldErrors[debt.id] = {};

    if (!name) {
      debtFieldErrors[debt.id].name = true;
      errors.push(`${label}: add a debt name so the payoff plan is easier to read.`);
    }

    if (!Number.isFinite(balance) || balance < 0) {
      debtFieldErrors[debt.id].balance = true;
      errors.push(`${label}: enter a balance of $0 or more.`);
    }

    if (!Number.isFinite(rate) || rate < 0) {
      debtFieldErrors[debt.id].rate = true;
      errors.push(`${label}: enter an interest rate of 0% or more.`);
    }

    if (!Number.isFinite(minimum) || minimum < 0) {
      debtFieldErrors[debt.id].minimum = true;
      errors.push(`${label}: enter a minimum monthly payment of $0 or more.`);
    }

    if (Number.isFinite(balance) && balance > 0 && Number.isFinite(minimum) && minimum <= 0) {
      debtFieldErrors[debt.id].minimum = true;
      errors.push(`${label}: a positive balance needs a minimum payment greater than $0.`);
    }

    if (Number.isFinite(balance) && Number.isFinite(minimum) && minimum > balance * 4 && balance > 0) {
      warnings.push(`${label}: the minimum payment is much larger than the remaining balance, so payoff may happen very quickly.`);
    }

    if (Number.isFinite(balance) && Number.isFinite(rate) && Number.isFinite(minimum) && balance > 0) {
      const monthlyInterest = balance * (rate / 100 / 12);
      if (minimum <= monthlyInterest + EPSILON) {
        warnings.push(`${label}: the minimum payment may be too low to keep interest from overtaking the balance before this debt becomes your target.`);
      }
    }

    return {
      id: debt.id,
      name: label,
      balance: Number.isFinite(balance) ? balance : 0,
      rate: Number.isFinite(rate) ? rate : 0,
      minimum: Number.isFinite(minimum) ? minimum : 0,
    };
  });

  const extraPayment = Number(currentState.extraPayment);
  if (!Number.isFinite(extraPayment) || extraPayment < 0) {
    errors.push("Extra monthly payment must be $0 or more.");
  }

  const positiveDebts = parsedDebts.filter((debt) => debt.balance > EPSILON);
  if (errors.length === 0 && positiveDebts.length === 0) {
    warnings.push("All entered debts are already at $0, so there is nothing left to pay off.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    debtFieldErrors,
    parsedDebts,
  };
}

function computeStrategies(currentState) {
  const debts = currentState.debts.map((debt, index) => ({
    id: debt.id,
    name: typeof debt.name === "string" && debt.name.trim() ? debt.name.trim() : `Debt ${index + 1}`,
    balance: Number(debt.balance) || 0,
    rate: Number(debt.rate) || 0,
    minimum: Number(debt.minimum) || 0,
  }));

  const startDate = parseMonthString(currentState.startDate);
  const snowball = simulatePayoff(debts, "snowball", Number(currentState.extraPayment) || 0, startDate);
  const avalanche = simulatePayoff(debts, "avalanche", Number(currentState.extraPayment) || 0, startDate);

  return {
    selectedStrategy: currentState.strategy === "avalanche" ? "avalanche" : "snowball",
    snowball,
    avalanche,
  };
}

function simulatePayoff(inputDebts, strategy, extraPayment, startDate) {
  const debts = inputDebts
    .filter((debt) => debt.balance > EPSILON || debt.minimum > EPSILON)
    .map((debt, index) => ({
      ...debt,
      sortIndex: index,
      startingBalance: debt.balance,
      balance: debt.balance,
      paidOffMonth: null,
      paidOffDateLabel: null,
      totalInterest: 0,
      totalPaid: 0,
    }));

  const startingTotalBalance = sum(debts.map((debt) => debt.balance));
  const baselineMonthlyBudget = sum(debts.filter((debt) => debt.balance > EPSILON).map((debt) => debt.minimum)) + extraPayment;
  const schedule = [];
  const totalsTimeline = [{ month: 0, dateLabel: formatMonth(startDate), remainingDebt: roundMoney(startingTotalBalance) }];
  const warnings = [];

  if (debts.length === 0 || startingTotalBalance <= EPSILON) {
    return {
      strategy,
      completed: true,
      months: 0,
      payoffDateLabel: formatMonth(startDate),
      totalInterest: 0,
      totalPaid: 0,
      startingTotalBalance: 0,
      schedule,
      totalsTimeline,
      debts: [],
      payoffOrder: [],
      warnings,
      budget: extraPayment,
    };
  }

  if (baselineMonthlyBudget <= EPSILON) {
    warnings.push("Minimum payments plus extra payment add up to $0, so the debts cannot be repaid under the current assumptions.");
  }

  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  let completed = false;

  while (month < MAX_MONTHS) {
    const activeDebts = debts.filter((debt) => debt.balance > EPSILON);
    if (activeDebts.length === 0) {
      completed = true;
      break;
    }

    month += 1;
    let monthInterest = 0;
    let budgetRemaining = baselineMonthlyBudget;
    const priority = rankDebts(activeDebts, strategy);

    activeDebts.forEach((debt) => {
      const interest = debt.balance * (debt.rate / 100 / 12);
      debt.balance += interest;
      debt.totalInterest += interest;
      monthInterest += interest;
    });

    activeDebts.forEach((debt) => {
      const minimumPayment = Math.min(debt.minimum, debt.balance, budgetRemaining);
      if (minimumPayment > 0) {
        debt.balance -= minimumPayment;
        debt.totalPaid += minimumPayment;
        budgetRemaining -= minimumPayment;
        totalPaid += minimumPayment;
      }
    });

    const targetDebt = priority.find((debt) => debt.balance > EPSILON);
    if (budgetRemaining > EPSILON) {
      priority.forEach((debt) => {
        if (budgetRemaining <= EPSILON || debt.balance <= EPSILON) {
          return;
        }

        const extraApplied = Math.min(debt.balance, budgetRemaining);
        debt.balance -= extraApplied;
        debt.totalPaid += extraApplied;
        budgetRemaining -= extraApplied;
        totalPaid += extraApplied;
      });
    }

    const remainingDebt = sum(debts.map((debt) => Math.max(0, debt.balance)));
    totalInterest += monthInterest;
    const currentDate = addMonths(startDate, month - 1);
    const dateLabel = formatMonth(currentDate);

    debts.forEach((debt) => {
      if (debt.balance <= EPSILON && debt.paidOffMonth === null && debt.startingBalance > EPSILON) {
        debt.balance = 0;
        debt.paidOffMonth = month;
        debt.paidOffDateLabel = dateLabel;
      }
    });

    schedule.push({
      month,
      dateLabel,
      targetDebtName: targetDebt?.name || "No target debt",
      payment: roundMoney(baselineMonthlyBudget - budgetRemaining),
      interest: roundMoney(monthInterest),
      remainingDebt: roundMoney(remainingDebt),
    });

    totalsTimeline.push({
      month,
      dateLabel,
      remainingDebt: roundMoney(remainingDebt),
    });

    if (remainingDebt <= EPSILON) {
      completed = true;
      break;
    }

    if (month === MAX_MONTHS) {
      warnings.push("This scenario did not fully pay off within the simulation limit. Raising minimum or extra payments may be necessary.");
    }
  }

  const payoffOrder = debts
    .filter((debt) => debt.startingBalance > EPSILON)
    .sort((left, right) => {
      if ((left.paidOffMonth ?? Number.POSITIVE_INFINITY) !== (right.paidOffMonth ?? Number.POSITIVE_INFINITY)) {
        return (left.paidOffMonth ?? Number.POSITIVE_INFINITY) - (right.paidOffMonth ?? Number.POSITIVE_INFINITY);
      }
      return left.sortIndex - right.sortIndex;
    })
    .map((debt, index) => ({
      rank: index + 1,
      name: debt.name,
      paidOffMonth: debt.paidOffMonth,
      paidOffDateLabel: debt.paidOffDateLabel,
      totalInterest: roundMoney(debt.totalInterest),
      totalPaid: roundMoney(debt.totalPaid),
      startingBalance: roundMoney(debt.startingBalance),
    }));

  return {
    strategy,
    completed,
    months: completed ? month : null,
    payoffDateLabel: completed && month > 0 ? formatMonth(addMonths(startDate, month - 1)) : "Not reached",
    totalInterest: roundMoney(totalInterest),
    totalPaid: roundMoney(totalPaid),
    startingTotalBalance: roundMoney(startingTotalBalance),
    schedule,
    totalsTimeline,
    debts: debts.map((debt) => ({
      name: debt.name,
      startingBalance: roundMoney(debt.startingBalance),
      totalInterest: roundMoney(debt.totalInterest),
      totalPaid: roundMoney(debt.totalPaid),
      paidOffMonth: debt.paidOffMonth,
      paidOffDateLabel: debt.paidOffDateLabel,
    })),
    payoffOrder,
    warnings,
    budget: roundMoney(baselineMonthlyBudget),
  };
}

function rankDebts(activeDebts, strategy) {
  const debts = [...activeDebts];
  debts.sort((left, right) => {
    if (strategy === "avalanche") {
      if (right.rate !== left.rate) {
        return right.rate - left.rate;
      }
      if (left.balance !== right.balance) {
        return left.balance - right.balance;
      }
      return left.sortIndex - right.sortIndex;
    }

    if (left.balance !== right.balance) {
      return left.balance - right.balance;
    }
    if (right.rate !== left.rate) {
      return right.rate - left.rate;
    }
    return left.sortIndex - right.sortIndex;
  });
  return debts;
}

function renderValidation(validation) {
  const status = document.querySelector(selectors.resultsStatus);
  if (!status) {
    return;
  }

  const messageBlocks = [];
  if (validation.errors.length > 0) {
    messageBlocks.push(`
      <div class="status-block status-error">
        <strong>Fix these inputs first</strong>
        <ul>${validation.errors.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>
      </div>
    `);
  }

  if (validation.warnings.length > 0) {
    messageBlocks.push(`
      <div class="status-block status-warning">
        <strong>Helpful notes</strong>
        <ul>${validation.warnings.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>
      </div>
    `);
  }

  if (messageBlocks.length === 0) {
    messageBlocks.push(`
      <div class="status-block status-ok">
        <strong>Inputs look good</strong>
        <p>You can review the payoff estimate below or keep refining the details.</p>
      </div>
    `);
  }

  status.innerHTML = messageBlocks.join("");
}

function renderInputValidity(validation) {
  state.debts.forEach((debt) => {
    const fieldErrors = validation.debtFieldErrors[debt.id] || {};
    ["name", "balance", "rate", "minimum"].forEach((fieldName) => {
      const field = document.querySelector(`[data-field="${fieldName}"][data-debt-id="${CSS.escape(debt.id)}"]`);
      if (!field) {
        return;
      }
      if (fieldErrors[fieldName]) {
        field.setAttribute("aria-invalid", "true");
      } else {
        field.removeAttribute("aria-invalid");
      }
    });
  });

  const form = getForm();
  if (!form) {
    return;
  }

  const extraPaymentInput = form.elements.extraPayment;
  if (validation.errors.some((message) => message.includes("Extra monthly payment"))) {
    extraPaymentInput.setAttribute("aria-invalid", "true");
  } else {
    extraPaymentInput.removeAttribute("aria-invalid");
  }
}

function renderDashboard(validation, computation, options = {}) {
  const selectedStrategy = computation?.selectedStrategy || state.strategy;
  const selectedResult = computation ? computation[selectedStrategy] : null;
  const comparisonResult = computation ? computation[selectedStrategy === "snowball" ? "avalanche" : "snowball"] : null;

  renderHeadlineSummary(validation, selectedResult, comparisonResult);
  renderHeroSummary(selectedResult, comparisonResult);
  renderBottomLine(validation, selectedResult, comparisonResult);
  renderResultCards(validation, selectedResult, comparisonResult);
  renderComparison(computation);
  renderPayoffOrder(selectedResult);
  renderSchedule(selectedResult);
  renderChart(selectedResult);
  renderResultsIntro(selectedResult, comparisonResult);

  if (options.shareMessage) {
    const feedback = document.querySelector(selectors.shareFeedback);
    if (feedback) {
      feedback.textContent = options.shareMessage;
    }
  }
}

function renderHeadlineSummary(validation, selectedResult, comparisonResult) {
  const shell = document.querySelector(selectors.headlineSummary);
  if (!shell) {
    return;
  }

  if (!validation.valid || !selectedResult) {
    shell.innerHTML = `
      <div class="headline-grid">
        <article class="headline-card">
          <span class="trust-label">Next step</span>
          <strong>Enter valid debts to see your payoff timeline</strong>
          <p>Your top-line payoff estimate will appear here once the calculator has enough valid information.</p>
        </article>
      </div>
    `;
    return;
  }

  const savings = comparisonResult ? comparisonResult.totalInterest - selectedResult.totalInterest : 0;
  const timingDifference = comparisonResult && selectedResult.months !== null && comparisonResult.months !== null
    ? comparisonResult.months - selectedResult.months
    : 0;

  shell.innerHTML = `
    <div class="headline-grid">
      <article class="headline-card">
        <span class="trust-label">Highlighted plan</span>
        <strong>${escapeHtml(toTitleCase(selectedResult.strategy))}</strong>
        <p>${escapeHtml(strategyTagline(selectedResult.strategy))}</p>
      </article>
      <article class="headline-card">
        <span class="trust-label">Time to debt-free</span>
        <strong>${selectedResult.months === null ? "Not reached" : escapeHtml(formatMonths(selectedResult.months))}</strong>
        <p>${selectedResult.months === null ? "This plan did not fully pay off inside the simulation limit." : `Projected payoff date: ${escapeHtml(selectedResult.payoffDateLabel)}.`}</p>
      </article>
      <article class="headline-card">
        <span class="trust-label">Key takeaway</span>
        <strong>${comparisonResult ? escapeHtml(primaryInsightLabel(selectedResult, comparisonResult)) : escapeHtml(formatCurrency(selectedResult.totalInterest))}</strong>
        <p>${comparisonResult ? escapeHtml(describeDifference(savings, timingDifference, selectedResult.strategy)) : "Comparison will appear here once both strategies are available."}</p>
      </article>
    </div>
  `;
}

function renderHeroSummary(selectedResult, comparisonResult) {
  const heroValue = document.querySelector(selectors.heroMonthsValue);
  const heroLabel = document.querySelector(selectors.heroMonthsLabel);
  const heroGrid = document.querySelector(selectors.heroSummaryGrid);

  if (!heroValue || !heroLabel || !heroGrid) {
    return;
  }

  if (!selectedResult) {
    heroValue.textContent = "--";
    heroLabel.textContent = "Build your plan to see your estimated time to debt-free.";
    heroGrid.innerHTML = `
      <div>
        <span class="mini-summary-label">Compare</span>
        <strong>Snowball and avalanche side by side</strong>
      </div>
      <div>
        <span class="mini-summary-label">See</span>
        <strong>Payoff date, total interest, and debt order</strong>
      </div>
    `;
    return;
  }

  heroValue.textContent = selectedResult.months === null ? "Not reached" : formatMonthsShort(selectedResult.months);
  heroLabel.textContent = `${toTitleCase(selectedResult.strategy)} plan with ${formatCurrency(selectedResult.budget)} per month.`;
  heroGrid.innerHTML = `
    <div>
      <span class="mini-summary-label">Interest</span>
      <strong>${escapeHtml(formatCurrency(selectedResult.totalInterest))}</strong>
    </div>
    <div>
      <span class="mini-summary-label">Difference</span>
      <strong>${comparisonResult ? escapeHtml(comparisonDeltaText(selectedResult, comparisonResult)) : "No comparison yet"}</strong>
    </div>
  `;
}

function renderResultCards(validation, selectedResult, comparisonResult) {
  const resultCards = document.querySelector(selectors.resultCards);
  if (!resultCards) {
    return;
  }

  if (!validation.valid || !selectedResult) {
    resultCards.innerHTML = "";
    return;
  }

  const monthsDifference = comparisonResult && selectedResult.months !== null && comparisonResult.months !== null
    ? comparisonResult.months - selectedResult.months
    : null;
  const interestDifference = comparisonResult ? comparisonResult.totalInterest - selectedResult.totalInterest : null;

  const cards = [
    {
      label: "TIME TO DEBT-FREE",
      value: selectedResult.months === null ? "Not reached" : formatMonths(selectedResult.months),
      copy: selectedResult.months === null ? "This plan did not fully pay off within the simulation limit." : `Projected payoff date: ${selectedResult.payoffDateLabel}.`,
    },
    {
      label: "TOTAL INTEREST PAID",
      value: formatCurrency(selectedResult.totalInterest),
      copy: `Across all debts under the ${toTitleCase(selectedResult.strategy)} method.`,
    },
    {
      label: "STARTING DEBT",
      value: formatCurrency(selectedResult.startingTotalBalance),
      copy: `Current balances entered before future interest is added.`,
    },
    {
      label: "BETTER FIT",
      value: interestDifference === null ? "No comparison" : primaryInsightLabel(selectedResult, comparisonResult),
      copy: interestDifference === null || monthsDifference === null
        ? "Both strategies need valid inputs."
        : explainStrategyTradeoff(selectedResult, comparisonResult),
    },
  ];

  resultCards.innerHTML = cards.map((card) => `
    <article class="result-card ${card.label === "TIME TO DEBT-FREE" ? "result-card-primary" : ""}">
      <span class="trust-label">${card.label}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <p>${escapeHtml(card.copy)}</p>
    </article>
  `).join("");
}

function renderBottomLine(validation, selectedResult, comparisonResult) {
  const bottomLineCard = document.querySelector(selectors.bottomLineCard);
  if (!bottomLineCard) {
    return;
  }

  if (!validation.valid || !selectedResult) {
    bottomLineCard.innerHTML = `
      <span class="trust-label">Bottom line</span>
      <strong>Enter valid debts to get a payoff answer.</strong>
      <p>Your top takeaway will appear here as soon as the calculator has enough information.</p>
    `;
    return;
  }

  bottomLineCard.innerHTML = `
    <div class="bottom-line-tags">
      <span class="bottom-line-tag">${escapeHtml(toTitleCase(selectedResult.strategy))}</span>
      <span class="bottom-line-tag">${escapeHtml(bottomLineTagline(selectedResult, comparisonResult))}</span>
    </div>
    <span class="trust-label">Bottom line</span>
    <strong>${escapeHtml(primaryBottomLine(selectedResult, comparisonResult))}</strong>
    <p>${escapeHtml(secondaryBottomLine(selectedResult, comparisonResult))}</p>
  `;
}

function renderComparison(computation) {
  const comparisonCards = document.querySelector(selectors.comparisonCards);
  const comparisonInsight = document.querySelector(selectors.comparisonInsight);
  if (!comparisonCards || !comparisonInsight) {
    return;
  }

  if (!computation) {
    comparisonCards.innerHTML = "";
    comparisonInsight.innerHTML = "";
    return;
  }

  const strategies = [computation.snowball, computation.avalanche].sort((left, right) => {
    if (left.strategy === computation.selectedStrategy) {
      return -1;
    }
    if (right.strategy === computation.selectedStrategy) {
      return 1;
    }
    return 0;
  });
  comparisonCards.innerHTML = strategies.map((result) => `
    <article class="comparison-card ${result.strategy === computation.selectedStrategy ? "comparison-card-selected" : ""}">
      <div class="comparison-head">
        <strong>${escapeHtml(toTitleCase(result.strategy))}</strong>
        <span>${result.strategy === computation.selectedStrategy ? "Selected" : "Alternative"}</span>
      </div>
      <dl class="comparison-stats">
        <div>
          <dt>Debt-free</dt>
          <dd>${result.months === null ? "Not reached" : escapeHtml(formatMonths(result.months))}</dd>
        </div>
        <div>
          <dt>Payoff date</dt>
          <dd>${escapeHtml(result.payoffDateLabel)}</dd>
        </div>
        <div>
          <dt>Total interest</dt>
          <dd>${escapeHtml(formatCurrency(result.totalInterest))}</dd>
        </div>
        <div>
          <dt>Total paid</dt>
          <dd>${escapeHtml(formatCurrency(result.totalPaid))}</dd>
        </div>
      </dl>
    </article>
  `).join("");

  const savings = computation.snowball.totalInterest - computation.avalanche.totalInterest;
  const months = safeMonthDifference(computation.snowball.months, computation.avalanche.months);

  comparisonInsight.innerHTML = `
    <strong>Recommended insight</strong>
    <p>${escapeHtml(buildInsightText(savings, months))}</p>
  `;
}

function renderPayoffOrder(selectedResult) {
  const container = document.querySelector(selectors.payoffOrderList);
  if (!container) {
    return;
  }

  if (!selectedResult || selectedResult.payoffOrder.length === 0) {
    container.innerHTML = `<p class="muted">Enter valid debts to see the projected payoff order.</p>`;
    return;
  }

  container.innerHTML = selectedResult.payoffOrder.map((item) => `
    <article class="payoff-item">
      <span class="payoff-rank">${item.rank}</span>
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <p>
          ${item.paidOffMonth === null
            ? "Not fully paid inside the simulation limit."
            : `Paid off in ${formatMonths(item.paidOffMonth)} (${item.paidOffDateLabel}).`
          }
        </p>
      </div>
      <div class="payoff-meta">
        <span>Started at ${escapeHtml(formatCurrency(item.startingBalance))}</span>
        <span>Interest paid ${escapeHtml(formatCurrency(item.totalInterest))}</span>
      </div>
    </article>
  `).join("");
}

function renderSchedule(selectedResult) {
  const tbody = document.querySelector(selectors.scheduleTableBody);
  if (!tbody) {
    return;
  }

  if (!selectedResult || selectedResult.schedule.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Enter valid debts to generate a monthly payoff schedule.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = selectedResult.schedule.map((row) => `
    <tr>
      <td>${row.month}</td>
      <td>${escapeHtml(row.dateLabel)}</td>
      <td>${escapeHtml(row.targetDebtName)}</td>
      <td>${escapeHtml(formatCurrency(row.payment))}</td>
      <td>${escapeHtml(formatCurrency(row.interest))}</td>
      <td>${escapeHtml(formatCurrency(row.remainingDebt))}</td>
    </tr>
  `).join("");
}

function renderResultsIntro(selectedResult, comparisonResult) {
  const intro = document.querySelector(selectors.resultsIntro);
  if (!intro) {
    return;
  }

  if (!selectedResult || !comparisonResult) {
    intro.textContent = "Review these cards first, then open the comparison if you want to see both strategies side by side.";
    return;
  }

  intro.textContent = `${toTitleCase(selectedResult.strategy)} is highlighted first. ${explainStrategyTradeoff(selectedResult, comparisonResult)}`;
}

function renderChart(selectedResult) {
  const chartLabel = document.querySelector(selectors.chartStrategyLabel);
  if (chartLabel) {
    chartLabel.textContent = selectedResult
      ? `${toTitleCase(selectedResult.strategy)} timeline`
      : "Selected strategy timeline";
  }

  drawTimelineChart(selectedResult?.totalsTimeline || []);
}

function drawTimelineChart(points) {
  const canvas = document.querySelector(selectors.chartCanvas);
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width || canvas.width));
  const height = Math.max(260, Math.floor(rect.height || canvas.height));
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const padding = { top: 20, right: 18, bottom: 40, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  context.strokeStyle = "rgba(24, 38, 58, 0.12)";
  context.lineWidth = 1;

  for (let index = 0; index < 5; index += 1) {
    const y = padding.top + (chartHeight / 4) * index;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
  }

  context.fillStyle = "#5e7087";
  context.font = '12px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  if (!points || points.length < 2) {
    context.fillText("Add valid debts to see the payoff timeline.", padding.left, padding.top + 18);
    return;
  }

  const maxBalance = Math.max(...points.map((point) => point.remainingDebt), 0);
  const yMax = maxBalance > 0 ? maxBalance : 1;

  for (let index = 0; index < 5; index += 1) {
    const value = yMax - (yMax / 4) * index;
    const y = padding.top + (chartHeight / 4) * index;
    context.fillText(formatAxisCurrency(value), 8, y + 4);
  }

  const lastPoint = points[points.length - 1];
  context.fillText("Start", padding.left, height - 12);
  context.fillText(lastPoint.dateLabel, Math.max(padding.left, width - padding.right - 90), height - 12);

  context.strokeStyle = "#0f6abf";
  context.lineWidth = 3;
  context.beginPath();

  points.forEach((point, index) => {
    const x = padding.left + (index / (points.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (point.remainingDebt / yMax) * chartHeight;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  context.stroke();

  context.fillStyle = "rgba(19, 163, 154, 0.12)";
  context.beginPath();
  points.forEach((point, index) => {
    const x = padding.left + (index / (points.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (point.remainingDebt / yMax) * chartHeight;
    if (index === 0) {
      context.moveTo(x, padding.top + chartHeight);
      context.lineTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  context.closePath();
  context.fill();

  const finalX = padding.left + chartWidth;
  const finalY = padding.top + chartHeight - (lastPoint.remainingDebt / yMax) * chartHeight;
  context.fillStyle = "#0b345f";
  context.beginPath();
  context.arc(finalX, finalY, 4, 0, Math.PI * 2);
  context.fill();
}

function scheduleChartResize() {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => {
    renderChart(latestComputation ? latestComputation[latestComputation.selectedStrategy] : null);
  });
}

async function copyShareLink() {
  updateStateFromDom();
  persistState();
  const feedback = document.querySelector(selectors.shareFeedback);
  const shareUrl = window.location.href;

  try {
    await navigator.clipboard.writeText(shareUrl);
    if (feedback) {
      feedback.textContent = "Share link copied. Anyone with the link will see this debt scenario preloaded.";
    }
  } catch (error) {
    if (feedback) {
      feedback.textContent = `Copy failed. You can still share this link manually: ${shareUrl}`;
    }
  }
}

function downloadCsv() {
  if (!latestComputation) {
    const feedback = document.querySelector(selectors.shareFeedback);
    if (feedback) {
      feedback.textContent = "Enter valid debts before downloading a payoff schedule.";
    }
    return;
  }

  const selectedResult = latestComputation[latestComputation.selectedStrategy];
  const rows = [
    ["Strategy", toTitleCase(selectedResult.strategy)],
    ["Time to debt-free", selectedResult.months === null ? "Not reached" : formatMonths(selectedResult.months)],
    ["Payoff date", selectedResult.payoffDateLabel],
    ["Total interest", selectedResult.totalInterest],
    ["Total paid", selectedResult.totalPaid],
    [],
    ["Month", "Date", "Target Debt", "Payment", "Interest", "Remaining Debt"],
    ...selectedResult.schedule.map((row) => [
      row.month,
      row.dateLabel,
      row.targetDebtName,
      row.payment,
      row.interest,
      row.remainingDebt,
    ]),
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `simplekit-debt-payoff-${selectedResult.strategy}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  const feedback = document.querySelector(selectors.shareFeedback);
  if (feedback) {
    feedback.textContent = "CSV download started.";
  }
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll("\"", "\"\"")}"`;
}

function parseMonthString(value) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function addMonths(date, monthOffset) {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("en-CA", { month: "short", year: "numeric" }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyShort(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAxisCurrency(value) {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`;
  }
  return `$${Math.round(value)}`;
}

function formatMonths(months) {
  if (months === 0) {
    return "0 months";
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) {
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  if (remainingMonths === 0) {
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  return `${years} year${years === 1 ? "" : "s"}, ${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`;
}

function formatMonthsShort(months) {
  if (months < 12) {
    return `${months} mo`;
  }
  const years = (months / 12);
  return `${years.toFixed(years >= 10 ? 0 : 1)} yr`;
}

function strategyTagline(strategy) {
  return strategy === "avalanche"
    ? "Lowest interest cost first by targeting the highest-rate debt."
    : "Fastest emotional wins first by clearing smaller balances sooner.";
}

function trimNumber(value) {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function toTitleCase(value) {
  return String(value).replace(/\b\w/g, (character) => character.toUpperCase());
}

function describeDifference(interestDifference, monthsDifference, selectedStrategy) {
  const strategyName = toTitleCase(selectedStrategy);
  const fasterText = monthsDifference === 0
    ? `${strategyName} takes the same amount of time.`
    : monthsDifference > 0
      ? `${strategyName} is faster by ${formatMonths(Math.abs(monthsDifference))}.`
      : `${strategyName} is slower by ${formatMonths(Math.abs(monthsDifference))}.`;

  if (interestDifference > 0) {
    return `${strategyName} saves ${formatCurrency(Math.abs(interestDifference))} in interest. ${fasterText}`;
  }
  if (interestDifference < 0) {
    return `${strategyName} costs ${formatCurrency(Math.abs(interestDifference))} more in interest. ${fasterText}`;
  }
  return `${strategyName} pays the same interest. ${fasterText}`;
}

function comparisonDeltaText(selectedResult, comparisonResult) {
  const interestDifference = comparisonResult.totalInterest - selectedResult.totalInterest;
  if (interestDifference > 0) {
    return `Saves ${formatCurrency(interestDifference)} vs ${toTitleCase(comparisonResult.strategy)}`;
  }
  if (interestDifference < 0) {
    return `Costs ${formatCurrency(Math.abs(interestDifference))} more interest`;
  }
  return "Same interest cost";
}

function primaryInsightLabel(selectedResult, comparisonResult) {
  if (!comparisonResult) {
    return "No comparison";
  }

  const interestDifference = comparisonResult.totalInterest - selectedResult.totalInterest;
  if (interestDifference > 0) {
    return `${toTitleCase(selectedResult.strategy)} saves more interest`;
  }
  if (interestDifference < 0) {
    return `${toTitleCase(comparisonResult.strategy)} saves more interest`;
  }
  return "Both cost the same";
}

function primaryBottomLine(selectedResult, comparisonResult) {
  if (!comparisonResult) {
    return `${toTitleCase(selectedResult.strategy)} is your highlighted payoff plan.`;
  }

  const interestDifference = comparisonResult.totalInterest - selectedResult.totalInterest;
  if (interestDifference > 0) {
    return `${toTitleCase(selectedResult.strategy)} saves more interest in this scenario.`;
  }
  if (interestDifference < 0) {
    return `${toTitleCase(comparisonResult.strategy)} saves more interest in this scenario.`;
  }
  return "Both strategies are effectively tied in this scenario.";
}

function secondaryBottomLine(selectedResult, comparisonResult) {
  if (!comparisonResult) {
    return `Projected debt-free date: ${selectedResult.payoffDateLabel}.`;
  }

  const interestDifference = comparisonResult.totalInterest - selectedResult.totalInterest;
  const monthDifference = safeMonthDifference(comparisonResult.months, selectedResult.months);

  if (interestDifference > 0) {
    return `${toTitleCase(selectedResult.strategy)} saves about ${formatCurrency(Math.abs(interestDifference))}${monthDifference !== 0 ? ` and changes payoff time by ${formatMonths(Math.abs(monthDifference))}` : ""}. If the difference feels small, choose the one you can stick with.`;
  }
  if (interestDifference < 0) {
    return `${toTitleCase(comparisonResult.strategy)} saves about ${formatCurrency(Math.abs(interestDifference))}${monthDifference !== 0 ? ` and changes payoff time by ${formatMonths(Math.abs(monthDifference))}` : ""}. If the difference feels small, choose the one you can stick with.`;
  }
  return monthDifference === 0
    ? "They also finish at the same time, so your best choice may come down to motivation."
    : `The payoff timing differs by about ${formatMonths(Math.abs(monthDifference))}.`;
}

function bottomLineTagline(selectedResult, comparisonResult) {
  if (!comparisonResult) {
    return "Payoff summary";
  }

  const interestDifference = comparisonResult.totalInterest - selectedResult.totalInterest;
  if (interestDifference > 0) {
    return "Lower interest";
  }
  if (interestDifference < 0) {
    return "Earlier wins may matter";
  }
  return "Similar outcome";
}

function explainStrategyTradeoff(selectedResult, comparisonResult) {
  const selected = toTitleCase(selectedResult.strategy);
  const alternative = toTitleCase(comparisonResult.strategy);
  const interestDifference = comparisonResult.totalInterest - selectedResult.totalInterest;

  if (interestDifference > 0) {
    return `${selected} lowers interest more, while ${alternative} may still feel better if faster early wins matter most to you.`;
  }
  if (interestDifference < 0) {
    return `${alternative} lowers interest more, while ${selected} may still feel better if early wins help you stay consistent.`;
  }
  return `Both strategies cost the same in this scenario, so your best choice may come down to motivation and preference.`;
}

function buildInsightText(savings, months) {
  const savingsText = savings > 0
    ? `Avalanche saves about ${formatCurrency(savings)} in interest.`
    : savings < 0
      ? `Snowball saves about ${formatCurrency(Math.abs(savings))} in interest.`
      : "Both strategies produce the same total interest in this scenario.";

  const timingText = months === 0
    ? "They also finish at the same time."
    : months > 0
      ? `Snowball takes about ${formatMonths(months)} longer than avalanche.`
      : `Snowball finishes about ${formatMonths(Math.abs(months))} sooner than avalanche.`;

  return `${savingsText} Snowball may feel easier to stick with because it creates earlier wins. ${timingText}`;
}

function safeMonthDifference(left, right) {
  if (left === null || right === null) {
    return 0;
  }
  return left - right;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function initialize() {
  syncFormFromState();
  bindEvents();
  runCalculator();
}

initialize();
})();
