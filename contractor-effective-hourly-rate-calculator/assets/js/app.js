(() => {
  const DEFAULT_STATE = {
    hourlyRate: 100,
    hoursPerWeek: 40,
    weeksPerYear: 52,
    vacationIsPaid: false,
    unpaidVacationWeeks: 2,
    benefitsAreEmployerPaid: false,
    annualBenefitsCost: 5000,
    workDaysPerWeek: 5,
    hoursPerDay: 8,
    paidHolidayDays: 0,
    unpaidSickDays: 0,
    annualBonus: 0,
    annualContractCosts: 0,
    compareEnabled: false,
    compareHourlyRate: 108,
    compareUnpaidVacationWeeks: 0,
    compareAnnualBenefitsCost: 0,
  };

  const SAMPLE_STATE = { ...DEFAULT_STATE };

  const RELATED_TOOLS = [
    {
      key: "budgetPlanner",
      name: "Budget Planner",
      description: "Turn expected contractor income into a practical monthly spending plan.",
    },
    {
      key: "canadianTakeHomePayCalculator",
      name: "Canadian Take Home Pay Calculator",
      description: "Estimate how salary or contract income may translate into after-tax pay.",
    },
    {
      key: "savingsGoalCalculator",
      name: "Savings Goal Calculator",
      description: "See how a stronger contract could change your timeline for a savings target.",
    },
    {
      key: "loanCalculator",
      name: "Loan Calculator",
      description: "Check how different income scenarios affect borrowing and repayment planning.",
    },
  ];

  const selectors = {
    form: "#rateForm",
    validationMessage: "#validationMessage",
    shareBtn: "#shareBtn",
    shareFeedback: "#shareFeedback",
    relatedTools: "#relatedTools",
    loadPresetBtn: "#loadPresetBtn",
    resetBtn: "#resetBtn",
    compareFields: "#compareFields",
    unpaidVacationField: "#unpaidVacationField",
    benefitsCostField: "#benefitsCostField",
    heroAdvertisedRate: "#heroAdvertisedRate",
    heroEffectiveRate: "#heroEffectiveRate",
    heroAnnualIncome: "#heroAnnualIncome",
    heroExplanation: "#heroExplanation",
    summaryAdvertisedRate: "#summaryAdvertisedRate",
    summaryEffectiveRate: "#summaryEffectiveRate",
    summaryAnnualEarnings: "#summaryAnnualEarnings",
    summaryPlainEnglish: "#summaryPlainEnglish",
    methodCopy: "#methodCopy",
    formulaCopy: "#formulaCopy",
    effectiveRateHeadline: "#effectiveRateHeadline",
    rateGapHeadline: "#rateGapHeadline",
    annualEarningsHeadline: "#annualEarningsHeadline",
    resultsExplanation: "#resultsExplanation",
    supportCards: "#supportCards",
    comparisonCards: "#comparisonCards",
    compareResults: "#compareResults",
    mobileAdvertisedRate: "#mobileAdvertisedRate",
    mobileEffectiveRate: "#mobileEffectiveRate",
    mobileAnnualEarnings: "#mobileAnnualEarnings",
  };

  let state = { ...DEFAULT_STATE };

  function getForm() {
    return document.querySelector(selectors.form);
  }

  function parseNumber(value, fallback) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clampNumber(value, fallback, min, max) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(Math.max(value, min), max);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatCurrency(value, digits = 0) {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(value);
  }

  function formatNumber(value, digits = 0) {
    return new Intl.NumberFormat("en-CA", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(value);
  }

  function formatRate(value) {
    return `${formatCurrency(value, 2)}/hr`;
  }

  function setValue(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function setFormState(nextState) {
    state = { ...nextState };
    const form = getForm();
    if (!form) {
      return;
    }

    Object.entries({
      hourlyRate: state.hourlyRate,
      hoursPerWeek: state.hoursPerWeek,
      weeksPerYear: state.weeksPerYear,
      vacationIsPaid: state.vacationIsPaid,
      unpaidVacationWeeks: state.unpaidVacationWeeks,
      benefitsAreEmployerPaid: state.benefitsAreEmployerPaid,
      annualBenefitsCost: state.annualBenefitsCost,
      workDaysPerWeek: state.workDaysPerWeek,
      hoursPerDay: state.hoursPerDay,
      paidHolidayDays: state.paidHolidayDays,
      unpaidSickDays: state.unpaidSickDays,
      annualBonus: state.annualBonus,
      annualContractCosts: state.annualContractCosts,
      compareEnabled: state.compareEnabled,
      compareHourlyRate: state.compareHourlyRate,
      compareUnpaidVacationWeeks: state.compareUnpaidVacationWeeks,
      compareAnnualBenefitsCost: state.compareAnnualBenefitsCost,
    }).forEach(([key, value]) => {
      if (!form.elements[key]) {
        return;
      }

      if (form.elements[key].type === "checkbox") {
        form.elements[key].checked = Boolean(value);
      } else {
        form.elements[key].value = value;
      }
    });

    updateConditionalFields();
    updateChoiceStates();
    updateChipStates();
  }

  function readFormState() {
    const form = getForm();
    if (!form) {
      return { ...DEFAULT_STATE };
    }

    return {
      hourlyRate: clampNumber(parseNumber(form.elements.hourlyRate.value, DEFAULT_STATE.hourlyRate), DEFAULT_STATE.hourlyRate, 0, 100000),
      hoursPerWeek: clampNumber(parseNumber(form.elements.hoursPerWeek.value, DEFAULT_STATE.hoursPerWeek), DEFAULT_STATE.hoursPerWeek, 1, 168),
      weeksPerYear: clampNumber(parseNumber(form.elements.weeksPerYear.value, DEFAULT_STATE.weeksPerYear), DEFAULT_STATE.weeksPerYear, 1, 52),
      vacationIsPaid: Boolean(form.elements.vacationIsPaid.checked),
      unpaidVacationWeeks: clampNumber(parseNumber(form.elements.unpaidVacationWeeks.value, DEFAULT_STATE.unpaidVacationWeeks), DEFAULT_STATE.unpaidVacationWeeks, 0, 52),
      benefitsAreEmployerPaid: Boolean(form.elements.benefitsAreEmployerPaid.checked),
      annualBenefitsCost: clampNumber(parseNumber(form.elements.annualBenefitsCost.value, DEFAULT_STATE.annualBenefitsCost), DEFAULT_STATE.annualBenefitsCost, 0, 1000000),
      workDaysPerWeek: clampNumber(parseNumber(form.elements.workDaysPerWeek.value, DEFAULT_STATE.workDaysPerWeek), DEFAULT_STATE.workDaysPerWeek, 1, 7),
      hoursPerDay: clampNumber(parseNumber(form.elements.hoursPerDay.value, DEFAULT_STATE.hoursPerDay), DEFAULT_STATE.hoursPerDay, 1, 24),
      paidHolidayDays: clampNumber(parseNumber(form.elements.paidHolidayDays.value, DEFAULT_STATE.paidHolidayDays), DEFAULT_STATE.paidHolidayDays, 0, 30),
      unpaidSickDays: clampNumber(parseNumber(form.elements.unpaidSickDays.value, DEFAULT_STATE.unpaidSickDays), DEFAULT_STATE.unpaidSickDays, 0, 60),
      annualBonus: clampNumber(parseNumber(form.elements.annualBonus.value, DEFAULT_STATE.annualBonus), DEFAULT_STATE.annualBonus, 0, 1000000),
      annualContractCosts: clampNumber(parseNumber(form.elements.annualContractCosts.value, DEFAULT_STATE.annualContractCosts), DEFAULT_STATE.annualContractCosts, 0, 1000000),
      compareEnabled: Boolean(form.elements.compareEnabled.checked),
      compareHourlyRate: clampNumber(parseNumber(form.elements.compareHourlyRate.value, DEFAULT_STATE.compareHourlyRate), DEFAULT_STATE.compareHourlyRate, 0, 100000),
      compareUnpaidVacationWeeks: clampNumber(parseNumber(form.elements.compareUnpaidVacationWeeks.value, DEFAULT_STATE.compareUnpaidVacationWeeks), DEFAULT_STATE.compareUnpaidVacationWeeks, 0, 52),
      compareAnnualBenefitsCost: clampNumber(parseNumber(form.elements.compareAnnualBenefitsCost.value, DEFAULT_STATE.compareAnnualBenefitsCost), DEFAULT_STATE.compareAnnualBenefitsCost, 0, 1000000),
    };
  }

  function calculateResults(currentState) {
    const comparableHours = currentState.hoursPerWeek * currentState.weeksPerYear;
    const grossBilledIncome = currentState.hourlyRate * comparableHours;
    const unpaidVacationWeeks = currentState.vacationIsPaid
      ? 0
      : Math.min(currentState.unpaidVacationWeeks, currentState.weeksPerYear);
    const paidWeeks = Math.max(currentState.weeksPerYear - unpaidVacationWeeks, 0);
    const earningsAfterVacation = currentState.hourlyRate * currentState.hoursPerWeek * paidWeeks;
    const vacationCost = grossBilledIncome - earningsAfterVacation;
    const benefitsCost = currentState.benefitsAreEmployerPaid ? 0 : currentState.annualBenefitsCost;
    const dailyHours = Math.max(currentState.hoursPerDay, currentState.hoursPerWeek / Math.max(currentState.workDaysPerWeek, 1));
    const sickTimeCost = currentState.hourlyRate * dailyHours * currentState.unpaidSickDays;
    const contractorCosts = currentState.annualContractCosts;
    const bonus = currentState.annualBonus;
    const adjustedAnnualEarnings = earningsAfterVacation - benefitsCost - sickTimeCost - contractorCosts + bonus;
    const effectiveHourlyRate = comparableHours > 0 ? adjustedAnnualEarnings / comparableHours : 0;
    const rateGap = currentState.hourlyRate - effectiveHourlyRate;
    const totalReductions = vacationCost + benefitsCost + sickTimeCost + contractorCosts;
    const netImpact = totalReductions - bonus;
    const reductionPercent = grossBilledIncome > 0 ? (netImpact / grossBilledIncome) * 100 : 0;

    return {
      comparableHours,
      grossBilledIncome,
      unpaidVacationWeeks,
      paidWeeks,
      earningsAfterVacation,
      vacationCost,
      benefitsCost,
      sickTimeCost,
      contractorCosts,
      bonus,
      adjustedAnnualEarnings,
      effectiveHourlyRate,
      rateGap,
      totalReductions,
      netImpact,
      reductionPercent,
      dailyHours,
    };
  }

  function calculateComparison(currentState) {
    if (!currentState.compareEnabled) {
      return null;
    }

    return calculateResults({
      ...currentState,
      hourlyRate: currentState.compareHourlyRate,
      vacationIsPaid: currentState.compareUnpaidVacationWeeks <= 0,
      unpaidVacationWeeks: currentState.compareUnpaidVacationWeeks,
      benefitsAreEmployerPaid: currentState.compareAnnualBenefitsCost <= 0,
      annualBenefitsCost: currentState.compareAnnualBenefitsCost,
      annualBonus: currentState.annualBonus,
      annualContractCosts: currentState.annualContractCosts,
    });
  }

  function updateConditionalFields() {
    const form = getForm();
    const unpaidVacationField = document.querySelector(selectors.unpaidVacationField);
    const benefitsCostField = document.querySelector(selectors.benefitsCostField);
    const compareFields = document.querySelector(selectors.compareFields);
    if (!form || !unpaidVacationField || !benefitsCostField || !compareFields) {
      return;
    }

    form.elements.unpaidVacationWeeks.disabled = form.elements.vacationIsPaid.checked;
    unpaidVacationField.hidden = form.elements.vacationIsPaid.checked;

    form.elements.annualBenefitsCost.disabled = form.elements.benefitsAreEmployerPaid.checked;
    benefitsCostField.hidden = form.elements.benefitsAreEmployerPaid.checked;

    compareFields.hidden = !form.elements.compareEnabled.checked;
  }

  function updateChoiceStates() {
    const form = getForm();
    if (!form) {
      return;
    }

    document.querySelectorAll("[data-toggle-target]").forEach((button) => {
      const target = button.dataset.toggleTarget;
      const expected = button.dataset.toggleValue === "true";
      const input = form.elements[target];
      button.classList.toggle("is-active", Boolean(input?.checked) === expected);
    });
  }

  function updateChipStates() {
    document.querySelectorAll("[data-set-hours]").forEach((button) => {
      button.classList.toggle("is-active", Number.parseFloat(button.dataset.setHours) === state.hoursPerWeek);
    });

    document.querySelectorAll("[data-set-weeks]").forEach((button) => {
      button.classList.toggle("is-active", Number.parseFloat(button.dataset.setWeeks) === state.weeksPerYear);
    });
  }

  function renderValidation(results) {
    const banner = document.querySelector(selectors.validationMessage);
    if (!banner) {
      return;
    }

    const messages = [];
    if (state.hoursPerWeek > 80) {
      messages.push("Hours per week are unusually high. Double-check that this reflects billable contract time.");
    }
    if (!state.vacationIsPaid && state.unpaidVacationWeeks >= state.weeksPerYear) {
      messages.push("Unpaid vacation weeks match or exceed the full year, so paid weeks drop to zero.");
    }
    if (results.adjustedAnnualEarnings < 0) {
      messages.push("Your advanced deductions are higher than your annual earnings. Review the assumptions in advanced options.");
    }

    if (messages.length === 0) {
      banner.hidden = true;
      banner.innerHTML = "";
      return;
    }

    banner.hidden = false;
    banner.innerHTML = `
      <strong>Check these assumptions</strong>
      <ul>
        ${messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}
      </ul>
    `;
  }

  function buildPlainEnglish(results, currentState) {
    const parts = [];

    if (results.unpaidVacationWeeks > 0) {
      parts.push(`${formatNumber(results.unpaidVacationWeeks, 1)} unpaid week${results.unpaidVacationWeeks === 1 ? "" : "s"}`);
    } else {
      parts.push("paid vacation");
    }

    if (results.benefitsCost > 0) {
      parts.push(`${formatCurrency(results.benefitsCost)} of self-paid benefits`);
    } else {
      parts.push("benefits included");
    }

    if (results.sickTimeCost > 0) {
      parts.push(`${formatCurrency(results.sickTimeCost)} of unpaid sick time`);
    }

    if (results.contractorCosts > 0) {
      parts.push(`${formatCurrency(results.contractorCosts)} of contractor costs`);
    }

    if (results.bonus > 0) {
      parts.push(`${formatCurrency(results.bonus)} of bonus or stipend`);
    }

    return `Because ${parts.join(", ")}, a ${formatCurrency(currentState.hourlyRate, 0)}/hour contract works more like ${formatRate(results.effectiveHourlyRate)} across a full contract year.`;
  }

  function renderHero(results) {
    setValue(selectors.heroAdvertisedRate, formatRate(state.hourlyRate));
    setValue(selectors.heroEffectiveRate, formatRate(results.effectiveHourlyRate));
    setValue(selectors.heroAnnualIncome, formatCurrency(results.adjustedAnnualEarnings));
    setValue(selectors.heroExplanation, buildPlainEnglish(results, state));
  }

  function renderSummary(results) {
    const plainEnglish = buildPlainEnglish(results, state);

    setValue(selectors.summaryAdvertisedRate, formatRate(state.hourlyRate));
    setValue(selectors.summaryEffectiveRate, formatRate(results.effectiveHourlyRate));
    setValue(selectors.summaryAnnualEarnings, formatCurrency(results.adjustedAnnualEarnings));
    setValue(selectors.summaryPlainEnglish, plainEnglish);
    setValue(selectors.methodCopy, `Effective hourly rate = ${formatCurrency(results.adjustedAnnualEarnings)} divided by ${formatNumber(results.comparableHours)} full-year contract hours.`);
    setValue(selectors.formulaCopy, `Adjusted annual earnings = ${formatCurrency(results.grossBilledIncome)} gross billed income - ${formatCurrency(results.vacationCost)} unpaid vacation impact - ${formatCurrency(results.benefitsCost)} benefits - ${formatCurrency(results.sickTimeCost)} unpaid sick time - ${formatCurrency(results.contractorCosts)} contractor costs + ${formatCurrency(results.bonus)} bonus.`);
    setValue(selectors.mobileAdvertisedRate, formatRate(state.hourlyRate));
    setValue(selectors.mobileEffectiveRate, formatRate(results.effectiveHourlyRate));
    setValue(selectors.mobileAnnualEarnings, formatCurrency(results.adjustedAnnualEarnings));
  }

  function renderResults(results) {
    const rateGapLabel = results.rateGap >= 0
      ? `That is ${formatCurrency(results.rateGap, 2)}/hr lower than the advertised contract rate.`
      : `That is ${formatCurrency(Math.abs(results.rateGap), 2)}/hr higher than the advertised contract rate.`;

    setValue(selectors.effectiveRateHeadline, `Your effective hourly rate is ${formatRate(results.effectiveHourlyRate)}`);
    setValue(selectors.rateGapHeadline, rateGapLabel);
    setValue(selectors.annualEarningsHeadline, `Estimated effective annual earnings: ${formatCurrency(results.adjustedAnnualEarnings)}`);
    setValue(selectors.resultsExplanation, buildPlainEnglish(results, state));

    const supportCards = document.querySelector(selectors.supportCards);
    if (supportCards) {
      const cards = [
        {
          label: "Advertised hourly rate",
          value: formatRate(state.hourlyRate),
          copy: "The headline contract number before any adjustments.",
        },
        {
          label: "Effective hourly rate",
          value: formatRate(results.effectiveHourlyRate),
          copy: "The calmer comparison number after your assumptions are applied.",
        },
        {
          label: "Gross annual billed income",
          value: formatCurrency(results.grossBilledIncome),
          copy: "The full-year total before unpaid time and costs are considered.",
        },
        {
          label: "Vacation cost impact",
          value: formatCurrency(results.vacationCost),
          copy: results.vacationCost > 0 ? "What unpaid vacation removes from annual earnings." : "No reduction because vacation is treated as paid.",
        },
        {
          label: "Benefits cost impact",
          value: formatCurrency(results.benefitsCost),
          copy: results.benefitsCost > 0 ? "What self-funded benefits reduce from compensation." : "No reduction because benefits are included.",
        },
      ];

      supportCards.innerHTML = cards.map((card) => `
        <article class="result-card">
          <span class="trust-label">${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
          <p>${escapeHtml(card.copy)}</p>
        </article>
      `).join("");
    }

    const comparisonCards = document.querySelector(selectors.comparisonCards);
    if (comparisonCards) {
      const cards = [
        {
          label: "What changed",
          value: results.netImpact >= 0
            ? `${formatCurrency(results.netImpact)} lower for the year`
            : `${formatCurrency(Math.abs(results.netImpact))} higher for the year`,
          copy: `This is the combined impact of vacation, benefits, unpaid sick time, contractor costs, and any bonus.`,
        },
        {
          label: "Paid weeks",
          value: `${formatNumber(results.paidWeeks, 1)} weeks`,
          copy: `You are being paid for ${formatNumber(results.paidWeeks, 1)} of ${formatNumber(state.weeksPerYear, 0)} weeks under the current vacation assumption.`,
        },
        {
          label: "Comparable hours",
          value: `${formatNumber(results.comparableHours)} hours`,
          copy: `This keeps the result on a full-year baseline so offers are easier to compare.`,
        },
        {
          label: "Advanced assumptions",
          value: results.sickTimeCost > 0 || results.contractorCosts > 0 || results.bonus > 0
            ? "Advanced inputs are active"
            : "Main inputs only",
          copy: `Paid holidays tracked: ${formatNumber(state.paidHolidayDays, 0)} day${state.paidHolidayDays === 1 ? "" : "s"}. Taxes remain excluded.`,
        },
      ];

      comparisonCards.innerHTML = cards.map((card) => `
        <article class="comparison-card">
          <span class="trust-label">${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
          <p>${escapeHtml(card.copy)}</p>
        </article>
      `).join("");
    }
  }

  function renderComparison(compareResults) {
    const container = document.querySelector(selectors.compareResults);
    if (!container) {
      return;
    }

    if (!compareResults) {
      container.hidden = true;
      container.innerHTML = "";
      return;
    }

    container.hidden = false;

    const winner = compareResults.effectiveHourlyRate > calculateResults(state).effectiveHourlyRate
      ? "The second offer comes out ahead on effective hourly rate."
      : "Your main offer still comes out ahead on effective hourly rate.";

    container.innerHTML = `
      <p class="section-kicker">Offer comparison</p>
      <h3>Second offer snapshot</h3>
      <p>${escapeHtml(winner)}</p>
      <div class="compare-results-grid">
        <article class="result-card">
          <span class="trust-label">Second offer rate</span>
          <strong>${escapeHtml(formatRate(state.compareHourlyRate))}</strong>
          <p>${escapeHtml(`Compared using the same ${formatNumber(compareResults.comparableHours)} yearly hours baseline.`)}</p>
        </article>
        <article class="result-card">
          <span class="trust-label">Second offer effective rate</span>
          <strong>${escapeHtml(formatRate(compareResults.effectiveHourlyRate))}</strong>
          <p>${escapeHtml(`Adjusted annual earnings: ${formatCurrency(compareResults.adjustedAnnualEarnings)}.`)}</p>
        </article>
        <article class="result-card">
          <span class="trust-label">Second offer annual gap</span>
          <strong>${escapeHtml(formatCurrency(compareResults.netImpact))}</strong>
          <p>${escapeHtml(`Vacation impact: ${formatCurrency(compareResults.vacationCost)}. Benefits impact: ${formatCurrency(compareResults.benefitsCost)}.`)}</p>
        </article>
      </div>
    `;
  }

  function renderRelatedTools() {
    const container = document.querySelector(selectors.relatedTools);
    if (!container) {
      return;
    }

    container.innerHTML = RELATED_TOOLS.map((tool) => {
      const url = window.getSimpleKitToolUrl ? window.getSimpleKitToolUrl(tool.key) : "https://simplekit.app/tools/";
      return `
        <a class="related-card" href="${escapeHtml(url)}">
          <span class="trust-label">Related tool</span>
          <strong>${escapeHtml(tool.name)}</strong>
          <p>${escapeHtml(tool.description)}</p>
        </a>
      `;
    }).join("");
  }

  function syncUrl() {
    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      params.set(key, String(value));
    });
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }

  function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length === 0) {
      setFormState(DEFAULT_STATE);
      return;
    }

    setFormState({
      hourlyRate: clampNumber(parseNumber(params.get("hourlyRate"), DEFAULT_STATE.hourlyRate), DEFAULT_STATE.hourlyRate, 0, 100000),
      hoursPerWeek: clampNumber(parseNumber(params.get("hoursPerWeek"), DEFAULT_STATE.hoursPerWeek), DEFAULT_STATE.hoursPerWeek, 1, 168),
      weeksPerYear: clampNumber(parseNumber(params.get("weeksPerYear"), DEFAULT_STATE.weeksPerYear), DEFAULT_STATE.weeksPerYear, 1, 52),
      vacationIsPaid: params.get("vacationIsPaid") === "true",
      unpaidVacationWeeks: clampNumber(parseNumber(params.get("unpaidVacationWeeks"), DEFAULT_STATE.unpaidVacationWeeks), DEFAULT_STATE.unpaidVacationWeeks, 0, 52),
      benefitsAreEmployerPaid: params.get("benefitsAreEmployerPaid") === "true",
      annualBenefitsCost: clampNumber(parseNumber(params.get("annualBenefitsCost"), DEFAULT_STATE.annualBenefitsCost), DEFAULT_STATE.annualBenefitsCost, 0, 1000000),
      workDaysPerWeek: clampNumber(parseNumber(params.get("workDaysPerWeek"), DEFAULT_STATE.workDaysPerWeek), DEFAULT_STATE.workDaysPerWeek, 1, 7),
      hoursPerDay: clampNumber(parseNumber(params.get("hoursPerDay"), DEFAULT_STATE.hoursPerDay), DEFAULT_STATE.hoursPerDay, 1, 24),
      paidHolidayDays: clampNumber(parseNumber(params.get("paidHolidayDays"), DEFAULT_STATE.paidHolidayDays), DEFAULT_STATE.paidHolidayDays, 0, 30),
      unpaidSickDays: clampNumber(parseNumber(params.get("unpaidSickDays"), DEFAULT_STATE.unpaidSickDays), DEFAULT_STATE.unpaidSickDays, 0, 60),
      annualBonus: clampNumber(parseNumber(params.get("annualBonus"), DEFAULT_STATE.annualBonus), DEFAULT_STATE.annualBonus, 0, 1000000),
      annualContractCosts: clampNumber(parseNumber(params.get("annualContractCosts"), DEFAULT_STATE.annualContractCosts), DEFAULT_STATE.annualContractCosts, 0, 1000000),
      compareEnabled: params.get("compareEnabled") === "true",
      compareHourlyRate: clampNumber(parseNumber(params.get("compareHourlyRate"), DEFAULT_STATE.compareHourlyRate), DEFAULT_STATE.compareHourlyRate, 0, 100000),
      compareUnpaidVacationWeeks: clampNumber(parseNumber(params.get("compareUnpaidVacationWeeks"), DEFAULT_STATE.compareUnpaidVacationWeeks), DEFAULT_STATE.compareUnpaidVacationWeeks, 0, 52),
      compareAnnualBenefitsCost: clampNumber(parseNumber(params.get("compareAnnualBenefitsCost"), DEFAULT_STATE.compareAnnualBenefitsCost), DEFAULT_STATE.compareAnnualBenefitsCost, 0, 1000000),
    });
  }

  async function copyShareLink() {
    const feedback = document.querySelector(selectors.shareFeedback);
    const shareUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);
      if (feedback) {
        feedback.textContent = "Share link copied.";
      }
    } catch (error) {
      if (feedback) {
        feedback.textContent = `Copy failed. Use this link manually: ${shareUrl}`;
      }
    }
  }

  function render() {
    updateConditionalFields();
    updateChoiceStates();
    updateChipStates();

    const results = calculateResults(state);
    const compareResults = calculateComparison(state);

    renderValidation(results);
    renderHero(results);
    renderSummary(results);
    renderResults(results);
    renderComparison(compareResults);
    syncUrl();
  }

  function scrollToTarget(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const mobileOffset = window.innerWidth <= 720 ? 14 : 18;
    const targetTop = Math.max(absoluteTop - mobileOffset, 0);

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  }

  function handleInput() {
    state = readFormState();
    render();
  }

  function bindChoiceButtons() {
    const form = getForm();
    if (!form) {
      return;
    }

    document.querySelectorAll("[data-toggle-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.toggleTarget;
        const nextValue = button.dataset.toggleValue === "true";
        form.elements[target].checked = nextValue;
        handleInput();
      });
    });
  }

  function bindPresetButtons() {
    const form = getForm();
    if (!form) {
      return;
    }

    document.querySelectorAll("[data-set-hours]").forEach((button) => {
      button.addEventListener("click", () => {
        form.elements.hoursPerWeek.value = button.dataset.setHours;
        handleInput();
      });
    });

    document.querySelectorAll("[data-set-weeks]").forEach((button) => {
      button.addEventListener("click", () => {
        form.elements.weeksPerYear.value = button.dataset.setWeeks;
        handleInput();
      });
    });
  }

  function bindEvents() {
    const form = getForm();
    if (form) {
      form.addEventListener("input", handleInput);
      form.addEventListener("change", handleInput);
    }

    bindChoiceButtons();
    bindPresetButtons();

    document.querySelectorAll("[data-scroll-target]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetSelector = link.dataset.scrollTarget;
        if (!targetSelector) {
          return;
        }

        event.preventDefault();
        window.history.replaceState({}, "", `${window.location.pathname}${targetSelector}`);
        scrollToTarget(targetSelector);
      });
    });

    document.querySelector(selectors.loadPresetBtn)?.addEventListener("click", () => {
      setFormState({ ...SAMPLE_STATE });
      state = { ...SAMPLE_STATE };
      render();
      scrollToTarget("#resultsSection");
    });

    document.querySelector(selectors.resetBtn)?.addEventListener("click", () => {
      setFormState({ ...DEFAULT_STATE });
      state = { ...DEFAULT_STATE };
      render();
    });

    document.querySelector(selectors.shareBtn)?.addEventListener("click", copyShareLink);
  }

  function initialize() {
    restoreFromUrl();
    state = readFormState();
    renderRelatedTools();
    bindEvents();
    render();
  }

  initialize();
})();
