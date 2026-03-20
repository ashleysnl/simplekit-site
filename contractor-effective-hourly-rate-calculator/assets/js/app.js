(() => {
  const TOTAL_STEPS = 4;

  const DEFAULT_STATE = {
    hourlyRate: 100,
    hoursPerWeek: 40,
    weeksPerYear: 52,
    vacationIsPaid: false,
    unpaidVacationWeeks: 2,
    benefitsAreEmployerPaid: false,
    annualBenefitsCost: 5000,
    currentStep: 0,
    resultsRevealed: false,
  };

  const SAMPLE_STATE = { ...DEFAULT_STATE };

  const RELATED_TOOLS = [
    {
      key: "budgetPlanner",
      name: "Budget Planner",
      description: "Turn your expected contractor income into a practical monthly spending plan.",
    },
    {
      key: "netWorthCalculator",
      name: "Net Worth Calculator",
      description: "Track how contract income decisions affect your broader financial position.",
    },
    {
      key: "compoundInterestCalculator",
      name: "Compound Interest Calculator",
      description: "Estimate how extra income from a stronger offer could grow if you invest the difference over time.",
    },
    {
      key: "mortgageCalculator",
      name: "Mortgage Calculator",
      description: "Check how your adjusted income fits into borrowing and payment planning.",
    },
  ];

  const selectors = {
    form: "#rateForm",
    stepProgressFill: "#stepProgressFill",
    progressLabel: "#progressLabel",
    wizardTrack: "#wizardTrack",
    questionSteps: ".wizard-slide",
    validationMessage: "#validationMessage",
    resultsPanel: "#resultsPanel",
    breakdownPanel: "#breakdownPanel",
    resultsStatus: "#resultsStatus",
    featuredResults: "#featuredResults",
    resultCards: "#resultCards",
    comparisonSummary: "#comparisonSummary",
    relatedTools: "#relatedTools",
    shareBtn: "#shareBtn",
    shareFeedback: "#shareFeedback",
    heroPreviewRate: "#heroPreviewRate",
    heroPreviewText: "#heroPreviewText",
    heroPreviewAnnual: "#heroPreviewAnnual",
    heroPreviewReduction: "#heroPreviewReduction",
    vacationHelp: "#vacationHelp",
    benefitsHelp: "#benefitsHelp",
    loadSampleBtn: "#loadSampleBtn",
    resetBtn: "#resetBtn",
    showResultsBtn: "#showResultsBtn",
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

  function setFormState(nextState) {
    state = { ...nextState };
    const form = getForm();
    if (!form) {
      return;
    }

    form.elements.hourlyRate.value = state.hourlyRate;
    form.elements.hoursPerWeek.value = state.hoursPerWeek;
    form.elements.weeksPerYear.value = state.weeksPerYear;
    form.elements.vacationIsPaid.checked = state.vacationIsPaid;
    form.elements.unpaidVacationWeeks.value = state.unpaidVacationWeeks;
    form.elements.benefitsAreEmployerPaid.checked = state.benefitsAreEmployerPaid;
    form.elements.annualBenefitsCost.value = state.annualBenefitsCost;
    updateConditionalFields();
    renderStepper();
  }

  function readFormState() {
    const form = getForm();
    if (!form) {
      return { ...DEFAULT_STATE };
    }

    return {
      ...state,
      hourlyRate: clampNumber(parseNumber(form.elements.hourlyRate.value, DEFAULT_STATE.hourlyRate), DEFAULT_STATE.hourlyRate, 0, 100000),
      hoursPerWeek: clampNumber(parseNumber(form.elements.hoursPerWeek.value, DEFAULT_STATE.hoursPerWeek), DEFAULT_STATE.hoursPerWeek, 1, 168),
      weeksPerYear: clampNumber(parseNumber(form.elements.weeksPerYear.value, DEFAULT_STATE.weeksPerYear), DEFAULT_STATE.weeksPerYear, 1, 52),
      vacationIsPaid: Boolean(form.elements.vacationIsPaid.checked),
      unpaidVacationWeeks: clampNumber(parseNumber(form.elements.unpaidVacationWeeks.value, DEFAULT_STATE.unpaidVacationWeeks), DEFAULT_STATE.unpaidVacationWeeks, 0, 52),
      benefitsAreEmployerPaid: Boolean(form.elements.benefitsAreEmployerPaid.checked),
      annualBenefitsCost: clampNumber(parseNumber(form.elements.annualBenefitsCost.value, DEFAULT_STATE.annualBenefitsCost), DEFAULT_STATE.annualBenefitsCost, 0, 1000000),
    };
  }

  function calculateResults(currentState) {
    const fullYearStandardHours = currentState.hoursPerWeek * currentState.weeksPerYear;
    const nominalAnnualIncome = currentState.hourlyRate * fullYearStandardHours;
    const unpaidVacationWeeks = currentState.vacationIsPaid ? 0 : Math.min(currentState.unpaidVacationWeeks, currentState.weeksPerYear);
    const paidWeeks = Math.max(currentState.weeksPerYear - unpaidVacationWeeks, 0);
    const adjustedAnnualIncomeAfterUnpaidVacation = currentState.hourlyRate * currentState.hoursPerWeek * paidWeeks;
    const vacationCostAnnual = nominalAnnualIncome - adjustedAnnualIncomeAfterUnpaidVacation;
    const benefitsCostAnnual = currentState.benefitsAreEmployerPaid ? 0 : currentState.annualBenefitsCost;
    const adjustedAnnualIncomeAfterBenefits = adjustedAnnualIncomeAfterUnpaidVacation - benefitsCostAnnual;
    const effectiveHourlyRate = fullYearStandardHours > 0 ? adjustedAnnualIncomeAfterBenefits / fullYearStandardHours : 0;
    const totalCompensationReduction = vacationCostAnnual + benefitsCostAnnual;
    const rateDrop = currentState.hourlyRate - effectiveHourlyRate;
    const reductionPercent = nominalAnnualIncome > 0 ? (totalCompensationReduction / nominalAnnualIncome) * 100 : 0;
    const paidHours = currentState.hoursPerWeek * paidWeeks;
    const targetHourlyRate = fullYearStandardHours > 0 && paidHours > 0
      ? ((currentState.hourlyRate * fullYearStandardHours) + benefitsCostAnnual) / paidHours
      : currentState.hourlyRate;

    return {
      fullYearStandardHours,
      nominalAnnualIncome,
      unpaidVacationWeeks,
      paidWeeks,
      adjustedAnnualIncomeAfterUnpaidVacation,
      benefitsCostAnnual,
      adjustedAnnualIncomeAfterBenefits,
      effectiveHourlyRate,
      vacationCostAnnual,
      totalCompensationReduction,
      rateDrop,
      reductionPercent,
      targetHourlyRate,
    };
  }

  function updateConditionalFields() {
    const form = getForm();
    if (!form) {
      return;
    }

    const vacationDisabled = form.elements.vacationIsPaid.checked;
    const benefitsDisabled = form.elements.benefitsAreEmployerPaid.checked;

    form.elements.unpaidVacationWeeks.disabled = vacationDisabled;
    form.elements.annualBenefitsCost.disabled = benefitsDisabled;
    form.elements.unpaidVacationWeeks.max = String(state.weeksPerYear);

    document.querySelector(selectors.vacationHelp).textContent = vacationDisabled
      ? "Because vacation is marked as paid, unpaid vacation weeks are excluded from the math."
      : "Only used when vacation is unpaid. Example: 2 means two unpaid weeks out of the year.";

    document.querySelector(selectors.benefitsHelp).textContent = benefitsDisabled
      ? "Because benefits are included, no annual benefits cost is deducted."
      : "Estimate what you expect to spend on health, dental, insurance, or similar benefits each year.";
  }

  function renderStepper() {
    const progressFill = document.querySelector(selectors.stepProgressFill);
    const label = document.querySelector(selectors.progressLabel);
    const steps = document.querySelectorAll(selectors.questionSteps);
    const track = document.querySelector(selectors.wizardTrack);
    if (!progressFill || !label) {
      return;
    }

    label.textContent = state.currentStep === 0 ? "Ready to begin" : `Step ${state.currentStep} of ${TOTAL_STEPS}`;
    progressFill.style.width = `${(state.currentStep / TOTAL_STEPS) * 100}%`;

    steps.forEach((stepElement) => {
      const step = Number.parseInt(stepElement.dataset.step, 10);
      stepElement.setAttribute("aria-hidden", String(step !== state.currentStep));
    });

    if (track) {
      track.style.transform = `translateX(-${state.currentStep * 100}%)`;
    }
  }

  function renderValidation(results) {
    const banner = document.querySelector(selectors.validationMessage);
    if (!banner) {
      return;
    }

    const messages = [];
    if (state.currentStep >= 2 && state.hoursPerWeek > 80) {
      messages.push("Hours per week are unusually high. Double-check that this reflects paid contract hours, not just availability.");
    }

    if (!state.vacationIsPaid && state.unpaidVacationWeeks >= state.weeksPerYear) {
      messages.push("Unpaid vacation weeks match or exceed the full year, so paid weeks drop to zero.");
    }

    if (results.adjustedAnnualIncomeAfterBenefits < 0) {
      messages.push("Your estimated benefits cost is higher than your income after unpaid vacation, which produces a negative adjusted annual income.");
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

  function renderAssumptions(results) {
    return results;
  }

  function renderStatus(results) {
    const resultsStatus = document.querySelector(selectors.resultsStatus);
    if (!resultsStatus) {
      return;
    }

    resultsStatus.innerHTML = `
      <strong>${escapeHtml(formatCurrency(results.effectiveHourlyRate, 2))} effective hourly rate</strong>
      <p class="muted">This compares your final adjusted compensation against ${escapeHtml(formatNumber(results.fullYearStandardHours))} standard working hours for the year.</p>
    `;
  }

  function renderResultCards(results) {
    const featuredResults = document.querySelector(selectors.featuredResults);
    const resultCards = document.querySelector(selectors.resultCards);
    if (!featuredResults || !resultCards) {
      return;
    }

    const featuredCards = [
      {
        label: "Adjusted annual income",
        value: formatCurrency(results.adjustedAnnualIncomeAfterBenefits),
        copy: "This is the more realistic yearly compensation after unpaid vacation and benefits costs are factored in.",
        primary: true,
      },
      {
        label: "Effective hourly rate",
        value: formatCurrency(results.effectiveHourlyRate, 2),
        copy: "This spreads your final adjusted compensation across the full standard working year for a fairer comparison.",
        primary: true,
      },
      {
        label: "Total annual reduction",
        value: formatCurrency(results.totalCompensationReduction),
        copy: "This is how much value the contract loses once unpaid vacation and self-paid benefits are included.",
        primary: false,
      },
    ];

    const detailCards = [
      {
        label: "Nominal annual income",
        value: formatCurrency(results.nominalAnnualIncome),
        copy: "The headline annual total from the posted rate before any reductions.",
      },
      {
        label: "Adjusted after unpaid vacation",
        value: formatCurrency(results.adjustedAnnualIncomeAfterUnpaidVacation),
        copy: "This shows the annual pay after unpaid weeks reduce the number of paid weeks.",
      },
      {
        label: "Annual cost of unpaid vacation",
        value: formatCurrency(results.vacationCostAnnual),
        copy: "The difference between a fully paid year and your actual paid weeks.",
      },
      {
        label: "Annual cost of self-paid benefits",
        value: formatCurrency(results.benefitsCostAnnual),
        copy: "What you still need to fund yourself for coverage and benefits.",
      },
      {
        label: "Target hourly rate to offset reductions",
        value: formatCurrency(results.targetHourlyRate, 2),
        copy: "A practical negotiation number if you want the contract to preserve the same full-year value.",
      },
      {
        label: "Paid weeks",
        value: formatNumber(results.paidWeeks, 1),
        copy: "The number of weeks in the year that remain paid under your assumptions.",
      },
      {
        label: "Full-year standard hours",
        value: formatNumber(results.fullYearStandardHours),
        copy: "The baseline hours used to convert the contract into an effective hourly rate.",
      },
    ];

    featuredResults.innerHTML = featuredCards.map((card) => `
      <article class="result-card${card.primary ? " result-card-primary" : ""}">
        <span class="trust-label">${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <p>${escapeHtml(card.copy)}</p>
      </article>
    `).join("");

    resultCards.innerHTML = detailCards.map((card) => `
      <article class="result-card">
        <span class="trust-label">${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <p>${escapeHtml(card.copy)}</p>
      </article>
    `).join("");
  }

  function renderComparison(results) {
    const comparisonSummary = document.querySelector(selectors.comparisonSummary);
    if (!comparisonSummary) {
      return;
    }

    const vacationSentence = results.vacationCostAnnual > 0
      ? `Unpaid vacation lowers annual compensation by ${formatCurrency(results.vacationCostAnnual)}.`
      : "Paid vacation keeps the full year of compensation intact.";
    const benefitsSentence = results.benefitsCostAnnual > 0
      ? `Self-paid benefits reduce compensation by another ${formatCurrency(results.benefitsCostAnnual)}.`
      : "Because benefits are included, no direct benefits deduction is applied.";
    const makeWholeRate = results.targetHourlyRate > state.hourlyRate
      ? `To preserve the same real full-year value, you would need about ${formatCurrency(results.targetHourlyRate, 2)} per hour.`
      : "Your current assumptions already preserve the full posted value without any extra markup.";

    comparisonSummary.innerHTML = `
      <article class="comparison-card">
        <span class="trust-label">Rate gap</span>
        <strong>${escapeHtml(formatCurrency(results.rateDrop, 2))} below the posted rate</strong>
        <p>Your posted rate is ${escapeHtml(formatCurrency(state.hourlyRate, 2))}, but your effective rate is ${escapeHtml(formatCurrency(results.effectiveHourlyRate, 2))} after real-world adjustments.</p>
      </article>
      <article class="comparison-card">
        <span class="trust-label">Vacation effect</span>
        <strong>${escapeHtml(vacationSentence)}</strong>
        <p>${escapeHtml(`${formatNumber(results.paidWeeks, 1)} paid weeks remain in the year under these assumptions.`)}</p>
      </article>
      <article class="comparison-card">
        <span class="trust-label">Benefits effect</span>
        <strong>${escapeHtml(benefitsSentence)}</strong>
        <p>${escapeHtml(`Total reduction equals ${formatCurrency(results.totalCompensationReduction)} or ${formatNumber(results.reductionPercent, 1)}% of nominal annual income.`)}</p>
      </article>
      <article class="comparison-card comparison-card-emphasis">
        <span class="trust-label">Negotiation cue</span>
        <strong>${escapeHtml(makeWholeRate)}</strong>
        <p>${escapeHtml(`That is ${formatCurrency(results.targetHourlyRate - state.hourlyRate, 2)} above the current posted rate under your current assumptions.`)}</p>
      </article>
    `;
  }

  function renderHero(results) {
    if (!state.resultsRevealed) {
      document.querySelector(selectors.heroPreviewRate).textContent = "$93.75/hr";
      document.querySelector(selectors.heroPreviewAnnual).textContent = "$208,000";
      document.querySelector(selectors.heroPreviewReduction).textContent = "$13,000";
      document.querySelector(selectors.heroPreviewText).textContent = "Example result for a $100/hr contract with 2 unpaid weeks and $5,000 in self-paid benefits.";
      return;
    }

    document.querySelector(selectors.heroPreviewRate).textContent = formatCurrency(results.effectiveHourlyRate, 2);
    document.querySelector(selectors.heroPreviewAnnual).textContent = formatCurrency(results.nominalAnnualIncome);
    document.querySelector(selectors.heroPreviewReduction).textContent = formatCurrency(results.totalCompensationReduction);

    const vacationText = results.unpaidVacationWeeks > 0
      ? `${formatNumber(results.unpaidVacationWeeks, 1)} unpaid week${results.unpaidVacationWeeks === 1 ? "" : "s"}`
      : "paid vacation";
    const benefitsText = results.benefitsCostAnnual > 0
      ? `${formatCurrency(results.benefitsCostAnnual)} in self-paid benefits`
      : "benefits included";

    document.querySelector(selectors.heroPreviewText).textContent = `Your result: ${formatCurrency(state.hourlyRate, 0)}/hr at ${formatNumber(state.hoursPerWeek, 1)} hours per week with ${vacationText} and ${benefitsText}.`;
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

  function renderResultsVisibility() {
    const resultsPanel = document.querySelector(selectors.resultsPanel);
    const breakdownPanel = document.querySelector(selectors.breakdownPanel);
    if (!resultsPanel || !breakdownPanel) {
      return;
    }

    resultsPanel.hidden = !state.resultsRevealed;
    breakdownPanel.hidden = !state.resultsRevealed;
  }

  function syncUrl() {
    const params = new URLSearchParams();
    params.set("hourlyRate", String(state.hourlyRate));
    params.set("hoursPerWeek", String(state.hoursPerWeek));
    params.set("weeksPerYear", String(state.weeksPerYear));
    params.set("vacationIsPaid", String(state.vacationIsPaid));
    params.set("unpaidVacationWeeks", String(state.unpaidVacationWeeks));
    params.set("benefitsAreEmployerPaid", String(state.benefitsAreEmployerPaid));
    params.set("annualBenefitsCost", String(state.annualBenefitsCost));
    params.set("step", String(state.currentStep));
    params.set("results", String(state.resultsRevealed));
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
      currentStep: clampNumber(parseNumber(params.get("step"), DEFAULT_STATE.currentStep), DEFAULT_STATE.currentStep, 0, TOTAL_STEPS),
      resultsRevealed: params.get("results") === "true",
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

  function validateStep(step) {
    const messages = [];
    if (step === 1 && state.hourlyRate <= 0) {
      messages.push("Enter an hourly rate greater than zero.");
    }
    if (step === 2) {
      if (state.hoursPerWeek <= 0) {
        messages.push("Enter weekly hours greater than zero.");
      }
      if (state.weeksPerYear <= 0) {
        messages.push("Enter weeks per year greater than zero.");
      }
    }
    if (step === 3 && !state.vacationIsPaid && state.unpaidVacationWeeks < 0) {
      messages.push("Unpaid vacation weeks cannot be negative.");
    }
    if (step === 4 && !state.benefitsAreEmployerPaid && state.annualBenefitsCost < 0) {
      messages.push("Annual benefits cost cannot be negative.");
    }
    return messages;
  }

  function showStepError(messages) {
    const banner = document.querySelector(selectors.validationMessage);
    if (!banner || messages.length === 0) {
      return;
    }
    banner.hidden = false;
    banner.innerHTML = `
      <strong>Please update this step</strong>
      <ul>
        ${messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}
      </ul>
    `;
  }

  function goToStep(step) {
    state.currentStep = clampNumber(step, 0, 0, TOTAL_STEPS);
    state.resultsRevealed = false;
    render();
  }

  function revealResults() {
    state.resultsRevealed = true;
    render();
    document.querySelector(selectors.resultsPanel)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function render() {
    updateConditionalFields();
    const results = calculateResults(state);
    renderStepper();
    renderValidation(results);
    renderAssumptions(results);
    renderResultsVisibility();
    renderHero(results);

    if (state.resultsRevealed) {
      renderStatus(results);
      renderResultCards(results);
      renderComparison(results);
    }

    syncUrl();
  }

  function handleInput() {
    state = readFormState();
    render();
  }

  function bindStepActions() {
    document.querySelectorAll("[data-step-next]").forEach((button) => {
      button.addEventListener("click", () => {
        state = readFormState();
        const step = Number.parseInt(button.dataset.stepNext, 10);
        const errors = step > 0 ? validateStep(step) : [];
        if (errors.length > 0) {
          showStepError(errors);
          return;
        }
        state.currentStep = Math.min(step + 1, TOTAL_STEPS);
        state.resultsRevealed = false;
        render();
      });
    });

    document.querySelectorAll("[data-step-back]").forEach((button) => {
      button.addEventListener("click", () => {
        state = readFormState();
        const step = Number.parseInt(button.dataset.stepBack, 10);
        state.currentStep = Math.max(step - 1, 0);
        state.resultsRevealed = false;
        render();
      });
    });

    document.querySelector(selectors.showResultsBtn)?.addEventListener("click", () => {
      state = readFormState();
      const errors = validateStep(4);
      if (errors.length > 0) {
        showStepError(errors);
        return;
      }
      revealResults();
    });
  }

  function bindEvents() {
    const form = getForm();
    if (form) {
      form.addEventListener("input", handleInput);
      form.addEventListener("change", handleInput);
    }

    bindStepActions();

    document.querySelector(selectors.loadSampleBtn)?.addEventListener("click", () => {
      setFormState({ ...SAMPLE_STATE, currentStep: 0, resultsRevealed: false });
      state = { ...SAMPLE_STATE, currentStep: 0, resultsRevealed: false };
      render();
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
