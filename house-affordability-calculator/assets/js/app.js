(() => {
  const DEFAULT_STATE = {
    calculatorMode: "simple",
    annualIncome: 120000,
    monthlyDebtPayments: 850,
    downPayment: 60000,
    mortgageRate: 5.25,
    amortizationYears: 25,
    propertyTaxesAnnual: 4200,
    homeInsuranceAnnual: 1400,
    condoFeesMonthly: 0,
    utilitiesMonthly: 350,
    maintenanceReserveMonthly: 250,
  };

  const SAMPLE_STATE = {
    calculatorMode: "advanced",
    annualIncome: 155000,
    monthlyDebtPayments: 650,
    downPayment: 90000,
    mortgageRate: 4.89,
    amortizationYears: 25,
    propertyTaxesAnnual: 4800,
    homeInsuranceAnnual: 1600,
    condoFeesMonthly: 0,
    utilitiesMonthly: 325,
    maintenanceReserveMonthly: 300,
  };

  const selectors = {
    form: "#affordabilityForm",
    resultCards: "#resultCards",
    resultsLead: "#resultsLead",
    resultsRange: "#resultsRange",
    resultsFootnote: "#resultsFootnote",
    resultsNextStepText: "#resultsNextStepText",
    resultsNextStep: "#resultsNextStep",
    resultsStatus: "#resultsStatus",
    paymentBreakdown: "#paymentBreakdown",
    decisionGuide: "#decisionGuide",
    shareBtn: "#shareBtn",
    shareFeedback: "#shareFeedback",
    loadSampleBtn: "#loadSampleBtn",
    resetBtn: "#resetBtn",
    simpleModeNote: "#simpleModeNote",
    stepNav: "#stepNav",
    step2NextBtn: "#step2NextBtn",
    resultsSection: "#resultsSection",
    heroHomePrice: "#heroHomePrice",
    heroEstimateKicker: "#heroEstimateKicker",
    heroMonthlyPayment: "#heroMonthlyPayment",
    heroAffordabilityStatus: "#heroAffordabilityStatus",
    heroScenarioText: "#heroScenarioText",
  };

  const currencyFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });

  const percentFormatter = new Intl.NumberFormat("en-CA", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const LIVE_TOOL_LINKS = new Map([
    ["retirement planner", "https://simplekit.app/retirement-planner/"],
    ["fire calculator", "https://simplekit.app/fire-calculator/"],
    ["cpp calculator", "https://simplekit.app/cpp-calculator/"],
    ["rrsp / tfsa calculator", "https://simplekit.app/rrsp-vs-tfsa-calculator/"],
    ["compound interest calculator", "https://simplekit.app/compound-interest-calculator/"],
    ["net worth calculator", "https://simplekit.app/net-worth-calculator/"],
    ["budget planner", "https://simplekit.app/budget-planner/"],
    ["debt payoff calculator", "https://simplekit.app/debt-payoff-calculator/"],
    ["rent vs buy calculator", "https://simplekit.app/rent-vs-buy-calculator/"],
    ["mortgage paydown vs invest", "https://simplekit.app/mortgage-paydown-vs-invest-calculator/"],
    ["mortgage calculator", "https://simplekit.app/mortgage-calculator/"],
    ["investment fee calculator", "https://simplekit.app/investment-fee-calculator/"],
    ["travel planner", "https://simplekit.app/travel-planner/"],
  ]);

  const STALE_TOOL_LINK_PATTERNS = [
    ["retirement", "https://simplekit.app/retirement-planner/"],
    ["fire", "https://simplekit.app/fire-calculator/"],
    ["cpp", "https://simplekit.app/cpp-calculator/"],
    ["rrsp", "https://simplekit.app/rrsp-vs-tfsa-calculator/"],
    ["tfsa", "https://simplekit.app/rrsp-vs-tfsa-calculator/"],
    ["investment", "https://simplekit.app/compound-interest-calculator/"],
    ["compound", "https://simplekit.app/compound-interest-calculator/"],
    ["networth", "https://simplekit.app/net-worth-calculator/"],
    ["net-worth", "https://simplekit.app/net-worth-calculator/"],
    ["budget", "https://simplekit.app/budget-planner/"],
    ["monthlybudget", "https://simplekit.app/budget-planner/"],
    ["debt", "https://simplekit.app/debt-payoff-calculator/"],
    ["rentvsbuy", "https://simplekit.app/rent-vs-buy-calculator/"],
    ["rent-vs-buy", "https://simplekit.app/rent-vs-buy-calculator/"],
    ["mortgagecalculator", "https://simplekit.app/mortgage-calculator/"],
    ["mortgage-calculator", "https://simplekit.app/mortgage-calculator/"],
    ["mortgage.simplekit.app", "https://simplekit.app/mortgage-paydown-vs-invest-calculator/"],
    ["paydown", "https://simplekit.app/mortgage-paydown-vs-invest-calculator/"],
    ["fees", "https://simplekit.app/investment-fee-calculator/"],
    ["travel", "https://simplekit.app/travel-planner/"],
  ];

  let state = { ...DEFAULT_STATE };
  let activeStepId = "step1";

  function getForm() {
    return document.querySelector(selectors.form);
  }

  function clampNumber(value) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  }

  function setFormState(nextState) {
    state = { ...nextState };
    const form = getForm();
    if (!form) {
      return;
    }

    Object.entries(state).forEach(([key, value]) => {
      if (key === "calculatorMode") {
        return;
      }
      const field = form.elements.namedItem(key);
      if (field) {
        field.value = String(value);
      }
    });

    const modeField = form.elements.namedItem("calculatorMode");
    if (modeField && typeof modeField.length === "number") {
      Array.from(modeField).forEach((option) => {
        option.checked = option.value === state.calculatorMode;
      });
    }
  }

  function readFormState() {
    const form = getForm();
    if (!form) {
      return { ...DEFAULT_STATE };
    }

    return {
      calculatorMode: form.elements.calculatorMode.value || DEFAULT_STATE.calculatorMode,
      annualIncome: clampNumber(form.elements.annualIncome.value || DEFAULT_STATE.annualIncome),
      monthlyDebtPayments: clampNumber(form.elements.monthlyDebtPayments.value || DEFAULT_STATE.monthlyDebtPayments),
      downPayment: clampNumber(form.elements.downPayment.value || DEFAULT_STATE.downPayment),
      mortgageRate: clampNumber(form.elements.mortgageRate.value || DEFAULT_STATE.mortgageRate),
      amortizationYears: Math.max(1, Math.round(clampNumber(form.elements.amortizationYears.value || DEFAULT_STATE.amortizationYears))),
      propertyTaxesAnnual: clampNumber(form.elements.propertyTaxesAnnual.value || DEFAULT_STATE.propertyTaxesAnnual),
      homeInsuranceAnnual: clampNumber(form.elements.homeInsuranceAnnual.value || DEFAULT_STATE.homeInsuranceAnnual),
      condoFeesMonthly: clampNumber(form.elements.condoFeesMonthly.value || DEFAULT_STATE.condoFeesMonthly),
      utilitiesMonthly: clampNumber(form.elements.utilitiesMonthly.value || DEFAULT_STATE.utilitiesMonthly),
      maintenanceReserveMonthly: clampNumber(form.elements.maintenanceReserveMonthly.value || DEFAULT_STATE.maintenanceReserveMonthly),
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatCurrency(value) {
    return currencyFormatter.format(Math.max(0, value));
  }

  function formatPercent(value) {
    return percentFormatter.format(Math.max(0, value));
  }

  function calculateLoanAmount(payment, annualRate, years) {
    if (payment <= 0 || years <= 0) {
      return 0;
    }

    const months = years * 12;
    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
      return payment * months;
    }

    const discountFactor = 1 - Math.pow(1 + monthlyRate, -months);
    return payment * (discountFactor / monthlyRate);
  }

  function calculateAffordability(currentState) {
    const grossMonthlyIncome = currentState.annualIncome / 12;
    const monthlyTaxes = currentState.propertyTaxesAnnual / 12;
    const monthlyInsurance = currentState.homeInsuranceAnnual / 12;
    const useAdvancedCosts = currentState.calculatorMode === "advanced";
    const taxesUsed = useAdvancedCosts ? monthlyTaxes : 0;
    const insuranceUsed = useAdvancedCosts ? monthlyInsurance : 0;
    const condoUsed = useAdvancedCosts ? currentState.condoFeesMonthly : 0;
    const utilitiesUsed = useAdvancedCosts ? currentState.utilitiesMonthly : 0;
    const maintenanceUsed = useAdvancedCosts ? currentState.maintenanceReserveMonthly : 0;
    const lenderHousingCosts = taxesUsed + insuranceUsed + condoUsed + utilitiesUsed;
    const practicalHousingCosts = lenderHousingCosts + maintenanceUsed;
    const planningHousingBudget = grossMonthlyIncome * 0.30;
    const frontEndBudget = grossMonthlyIncome * 0.32;
    const backEndBudget = (grossMonthlyIncome * 0.4) - currentState.monthlyDebtPayments;
    const insuredStretchBudget = Math.min(grossMonthlyIncome * 0.39, (grossMonthlyIncome * 0.44) - currentState.monthlyDebtPayments);
    const maximumHousingBudget = Math.max(0, Math.min(planningHousingBudget, frontEndBudget, backEndBudget));
    const maxPrincipalInterest = Math.max(0, maximumHousingBudget - practicalHousingCosts);
    const affordableLoanAmount = calculateLoanAmount(
      maxPrincipalInterest,
      currentState.mortgageRate,
      currentState.amortizationYears
    );
    const affordableHomePrice = affordableLoanAmount + currentState.downPayment;
    const estimatedMonthlyPayment = maxPrincipalInterest + practicalHousingCosts;
    const lenderStylePayment = maxPrincipalInterest + lenderHousingCosts;
    const housingRatio = grossMonthlyIncome > 0 ? lenderStylePayment / grossMonthlyIncome : 0;
    const practicalHousingRatio = grossMonthlyIncome > 0 ? estimatedMonthlyPayment / grossMonthlyIncome : 0;
    const totalDebtRatio = grossMonthlyIncome > 0
      ? (lenderStylePayment + currentState.monthlyDebtPayments) / grossMonthlyIncome
      : 0;
    const debtOnlyRatio = grossMonthlyIncome > 0 ? currentState.monthlyDebtPayments / grossMonthlyIncome : 0;
    const fixedCostRatio = grossMonthlyIncome > 0 ? practicalHousingCosts / grossMonthlyIncome : 0;

    let affordabilityStatus = "Comfortable";
    let statusTone = "comfortable";

    if (maximumHousingBudget <= 0 || maxPrincipalInterest <= 0 || practicalHousingRatio > 0.32 || totalDebtRatio > 0.44 || debtOnlyRatio > 0.15) {
      affordabilityStatus = "Stretched";
      statusTone = "stretched";
    } else if (debtOnlyRatio <= 0.08 && fixedCostRatio <= 0.10 && practicalHousingRatio <= 0.30 && totalDebtRatio <= 0.36) {
      affordabilityStatus = "Conservative";
      statusTone = "conservative";
    }

    const bufferMonthly = Math.max(0, planningHousingBudget - estimatedMonthlyPayment);
    const constraint = backEndBudget < planningHousingBudget ? "existing debt payments" : "housing-cost guideline";
    const stretchAvailable = Math.max(0, insuredStretchBudget);
    const stretchPrincipalInterest = Math.max(0, stretchAvailable - lenderHousingCosts);
    const stretchLoanAmount = calculateLoanAmount(
      stretchPrincipalInterest,
      currentState.mortgageRate,
      currentState.amortizationYears
    );
    const stretchHomePrice = stretchLoanAmount + currentState.downPayment;

    return {
      useAdvancedCosts,
      grossMonthlyIncome,
      monthlyTaxes,
      monthlyInsurance,
      taxesUsed,
      insuranceUsed,
      condoUsed,
      utilitiesUsed,
      maintenanceUsed,
      lenderHousingCosts,
      practicalHousingCosts,
      planningHousingBudget,
      frontEndBudget,
      backEndBudget,
      insuredStretchBudget,
      maximumHousingBudget,
      maxPrincipalInterest,
      affordableLoanAmount,
      affordableHomePrice,
      stretchHomePrice,
      estimatedMonthlyPayment,
      lenderStylePayment,
      mortgagePaymentOnly: maxPrincipalInterest,
      housingRatio,
      practicalHousingRatio,
      totalDebtRatio,
      debtOnlyRatio,
      fixedCostRatio,
      bufferMonthly,
      affordabilityStatus,
      statusTone,
      constraint,
    };
  }

  function renderStatus(results) {
    const statusNode = document.querySelector(selectors.resultsStatus);
    if (!statusNode) {
      return;
    }

    const statusCopy = {
      Conservative: "This scenario leaves more room in the budget. It may be easier to absorb repairs, utility swings, or future rate changes.",
      Comfortable: "This estimate fits within common affordability guidelines, but you should still compare it with your own spending patterns and savings goals.",
      Stretched: "This scenario is tighter. Debt payments or fixed ownership costs are taking up a larger share of income, so extra caution is warranted.",
    };

    statusNode.className = `results-status tone-${results.statusTone}`;
    statusNode.innerHTML = `
      <span class="status-pill">${escapeHtml(results.affordabilityStatus)}</span>
      <strong>${escapeHtml(results.affordabilityStatus)} affordability outlook</strong>
      <p>${escapeHtml(statusCopy[results.affordabilityStatus])}</p>
      <p class="muted small-copy">Most binding limit: ${escapeHtml(results.constraint)}. Industry norms usually use gross income, not after-tax income.</p>
    `;
  }

  function renderResultCards(results) {
    const resultCards = document.querySelector(selectors.resultCards);
    if (!resultCards) {
      return;
    }

    const cards = [
      {
        label: results.useAdvancedCosts ? "Estimated affordable home price" : "Quick maximum home price",
        value: formatCurrency(results.affordableHomePrice),
        tone: results.useAdvancedCosts ? "final" : "quick",
        badge: results.useAdvancedCosts ? "" : "First pass",
        copy: results.useAdvancedCosts
          ? `Includes a down payment of ${formatCurrency(state.downPayment)} and ongoing ownership costs.`
          : `Includes a down payment of ${formatCurrency(state.downPayment)} but does not yet include taxes, insurance, utilities, or upkeep.`,
      },
      {
        label: "Principal and interest budget",
        value: formatCurrency(results.mortgagePaymentOnly),
        tone: "neutral",
        copy: "This is the monthly mortgage payment capacity before adding the ownership costs included in your current mode.",
      },
      {
        label: results.useAdvancedCosts ? "Estimated monthly ownership cost" : "Estimated monthly payment",
        value: formatCurrency(results.estimatedMonthlyPayment),
        tone: "neutral",
        copy: results.useAdvancedCosts
          ? "Mortgage principal and interest plus taxes, insurance, condo fees, utilities, and maintenance reserve."
          : "This quick version is mostly mortgage-focused. Advanced mode adds the ownership costs many buyers forget.",
      },
      {
        label: "Affordability status",
        value: results.affordabilityStatus,
        tone: "status",
        copy: results.affordabilityStatus === "Conservative"
          ? "This looks comfortably inside common affordability norms."
          : results.affordabilityStatus === "Comfortable"
            ? "This looks workable on paper, but it still deserves a real-life budget check."
            : "This looks tight and may be harder to carry comfortably month to month.",
      },
    ];

    resultCards.innerHTML = cards.map((card) => `
      <article class="result-card tone-${escapeHtml(card.tone)}">
        <span class="trust-label">${escapeHtml(card.label)}</span>
        ${card.badge ? `<span class="result-badge">${escapeHtml(card.badge)}</span>` : ""}
        <strong>${escapeHtml(card.value)}</strong>
        <p>${escapeHtml(card.copy)}</p>
      </article>
    `).join("");

    const resultsRange = document.querySelector(selectors.resultsRange);
    if (resultsRange) {
      resultsRange.innerHTML = `
        <article class="range-card">
          <span class="trust-label">Planning target</span>
          <strong>${escapeHtml(formatCurrency(results.affordableHomePrice))}</strong>
          <p>${escapeHtml(results.useAdvancedCosts ? "A more realistic ownership-based estimate." : "A fast first-pass number before fuller ownership costs.")}</p>
        </article>
        <article class="range-card">
          <span class="trust-label">Upper screening limit</span>
          <strong>${escapeHtml(formatCurrency(results.stretchHomePrice))}</strong>
          <p>What looser lender-style screening caps might allow, even if it feels tighter in real life.</p>
        </article>
      `;
    }

    const resultsLead = document.querySelector(selectors.resultsLead);
    if (resultsLead) {
      resultsLead.textContent = results.useAdvancedCosts
        ? "Planning estimate, not lender approval: this version includes the ownership costs that usually make the budget feel more real."
        : "Planning estimate, not lender approval: this quick version is useful for orientation, but most buyers should pressure-test it in Realistic estimate mode.";
    }

    const footnote = document.querySelector(selectors.resultsFootnote);
    if (footnote) {
      footnote.textContent = results.useAdvancedCosts
        ? "Lender approval can still be higher than a comfortable real-life budget."
        : "This quick estimate is intentionally optimistic. Add taxes, insurance, utilities, and upkeep before treating it as a realistic budget.";
    }

    const nextStep = document.querySelector(selectors.resultsNextStep);
    const nextStepText = document.querySelector(selectors.resultsNextStepText);
    if (nextStepText) {
      nextStepText.textContent = results.useAdvancedCosts
        ? "Next best step: compare this with the common rules of thumb below, then test a few tighter scenarios."
        : "Next best step: switch to Advanced mode before treating this as a realistic home budget.";
    }
    if (nextStep) {
      nextStep.innerHTML = results.useAdvancedCosts
        ? `<button class="btn btn-secondary-panel" type="button" data-jump-target="normsHeading">Compare with industry norms</button>`
        : `<button class="btn btn-secondary-panel" type="button" data-switch-advanced>Switch to Advanced mode for a more realistic estimate</button>`;
    }
  }

  function renderBreakdown(results) {
    const breakdown = document.querySelector(selectors.paymentBreakdown);
    if (!breakdown) {
      return;
    }

    const items = [
      ["Gross monthly income", formatCurrency(results.grossMonthlyIncome)],
      ["Planning housing budget at 30%", formatCurrency(results.planningHousingBudget)],
      ["Upper common housing cap at 32%", formatCurrency(results.frontEndBudget)],
      ["Housing budget after debt payments", formatCurrency(Math.max(0, results.backEndBudget))],
      ["Estimated mortgage payment only", formatCurrency(results.mortgagePaymentOnly)],
      ["Monthly property taxes used", formatCurrency(results.taxesUsed)],
      ["Monthly home insurance used", formatCurrency(results.insuranceUsed)],
      ["Monthly condo fees used", formatCurrency(results.condoUsed)],
      ["Monthly utilities and heating used", formatCurrency(results.utilitiesUsed)],
      ["Monthly maintenance reserve used", formatCurrency(results.maintenanceUsed)],
      ["Estimated budget cushion below 30% target", formatCurrency(results.bufferMonthly)],
    ];

    breakdown.innerHTML = items.map(([term, description]) => `
      <div class="breakdown-row">
        <dt>${escapeHtml(term)}</dt>
        <dd>${escapeHtml(description)}</dd>
      </div>
    `).join("");
  }

  function renderHero(results) {
    const heroHomePrice = document.querySelector(selectors.heroHomePrice);
    const heroEstimateKicker = document.querySelector(selectors.heroEstimateKicker);
    const heroMonthlyPayment = document.querySelector(selectors.heroMonthlyPayment);
    const heroAffordabilityStatus = document.querySelector(selectors.heroAffordabilityStatus);
    const heroScenarioText = document.querySelector(selectors.heroScenarioText);

    if (heroHomePrice) {
      heroHomePrice.textContent = formatCurrency(results.affordableHomePrice);
    }

    if (heroEstimateKicker) {
      heroEstimateKicker.textContent = results.useAdvancedCosts ? "Planning target" : "Quick estimate";
    }

    if (heroMonthlyPayment) {
      heroMonthlyPayment.textContent = formatCurrency(results.mortgagePaymentOnly);
    }

    if (heroAffordabilityStatus) {
      heroAffordabilityStatus.textContent = results.affordabilityStatus;
    }

    if (heroScenarioText) {
      heroScenarioText.textContent = results.useAdvancedCosts
        ? `Planning target including ownership costs, driven mainly by ${results.constraint}.`
        : `Quick planning estimate focused on mortgage affordability, driven mainly by ${results.constraint}.`;
    }
  }

  function renderDecisionGuide(results) {
    const node = document.querySelector(selectors.decisionGuide);
    if (!node) {
      return;
    }

    const practicalVsFannie = results.practicalHousingRatio <= 0.30
      ? "Inside the 25% to 30% planning range described by Fannie Mae."
      : "Above Fannie Mae's 25% to 30% planning range, so this may feel tighter month to month.";
    const lenderVsCmhc = results.housingRatio <= 0.32 && results.totalDebtRatio <= 0.40
      ? "Within CMHC's general 32% housing and 40% total debt guideline."
      : "Outside CMHC's general 32% and 40% guideline, so the scenario may be harder to carry comfortably.";
    const stretchVsInsured = results.housingRatio <= 0.39 && results.totalDebtRatio <= 0.44
      ? "Still within the higher-end 39% and 44% insured-mortgage screening caps noted by CMHC."
      : "Even the higher-end 39% and 44% insured-mortgage screening caps are exceeded here.";
    const takeHomeNote = results.practicalHousingRatio > 0.30
      ? "If you budget from take-home pay, this is a good place to pause and check what is left after taxes, savings, childcare, transportation, and irregular bills."
      : "Even though industry norms use gross income, this result should still be checked against your actual take-home budget before treating it as comfortable.";

    node.innerHTML = `
      <article class="guide-card">
        <strong>Main takeaway</strong>
        <p>${results.useAdvancedCosts ? `A more realistic planning price is about ${formatCurrency(results.affordableHomePrice)} with a total monthly ownership cost near ${formatCurrency(results.estimatedMonthlyPayment)}.` : `A quick first-pass price is about ${formatCurrency(results.affordableHomePrice)}, but the more realistic ownership version will be lower once taxes, insurance, utilities, and upkeep are added.`}</p>
      </article>
      <article class="guide-card">
        <strong>Where your scenario lands</strong>
        <p>${escapeHtml(practicalVsFannie)} ${escapeHtml(lenderVsCmhc)} ${escapeHtml(stretchVsInsured)}</p>
      </article>
      <article class="guide-card">
        <strong>Decision reminder</strong>
        <p>${escapeHtml(takeHomeNote)} A lender may qualify you for more than feels safe once utilities, repairs, furnishing, and moving costs show up in real life.</p>
      </article>
      <article class="guide-card">
        <strong>Try this next</strong>
        <p>${results.useAdvancedCosts ? `If this still feels tight, try lowering the rate, increasing the down payment, or using a smaller tax and upkeep assumption to see what moves the result most.` : `Switch to Advanced mode next if you want to pressure-test this quick estimate against taxes, insurance, utilities, and maintenance.`}</p>
      </article>
      <article class="guide-card">
        <strong>Upper screening price</strong>
        <p>An upper guideline price near ${escapeHtml(formatCurrency(results.stretchHomePrice))} may be possible under looser screening caps, but this calculator highlights the lower planning price because it is more practical for most households.</p>
      </article>
    `;
  }

  function renderAll() {
    const results = calculateAffordability(state);
    renderModeState();
    renderStatus(results);
    renderResultCards(results);
    renderBreakdown(results);
    renderHero(results);
    renderDecisionGuide(results);
  }

  function renderModeState() {
    const root = document.documentElement;
    const note = document.querySelector(selectors.simpleModeNote);
    const stepNav = document.querySelector(selectors.stepNav);
    const step2NextBtn = document.querySelector(selectors.step2NextBtn);
    if (root) {
      root.setAttribute("data-calculator-mode", state.calculatorMode);
    }
    if (note) {
      note.hidden = state.calculatorMode !== "simple";
    }
    if (step2NextBtn) {
      step2NextBtn.textContent = state.calculatorMode === "advanced" ? "Next: Home costs" : "See results";
      step2NextBtn.dataset.stepNext = state.calculatorMode === "advanced" ? "step3" : "results";
    }
    if (stepNav) {
      const steps = state.calculatorMode === "advanced"
        ? [
            { target: "step1", label: "1. Income" },
            { target: "step2", label: "2. Mortgage" },
            { target: "step3", label: "3. Home costs" },
          ]
        : [
            { target: "step1", label: "1. Income" },
            { target: "step2", label: "2. Final answer" },
          ];
      stepNav.innerHTML = steps.map((step) => `
        <button class="step-chip${activeStepId === step.target ? " is-active" : ""}" type="button" data-step-target="${step.target}">
          ${step.label}
        </button>
      `).join("");
      stepNav.querySelectorAll("[data-step-target]").forEach((button) => {
        button.addEventListener("click", () => {
          setActiveStep(button.dataset.stepTarget);
        });
      });
    }
    if (state.calculatorMode === "simple" && activeStepId === "step3") {
      activeStepId = "step2";
      setActiveStep("step2", { scroll: false });
    }
  }

  function setActiveStep(stepId, options = {}) {
    const { scroll = true } = options;
    if (stepId === "results") {
      if (scroll) {
        document.querySelector(selectors.resultsSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    if (state.calculatorMode === "simple" && stepId === "step3") {
      if (scroll) {
        document.querySelector(selectors.resultsSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    activeStepId = stepId;
    document.querySelectorAll(".input-step").forEach((section) => {
      section.classList.toggle("is-active", section.id === stepId);
    });
    document.querySelectorAll(".step-chip").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.stepTarget === stepId);
    });
    if (scroll) {
      document.getElementById(stepId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function toggleHelp(button) {
    const targetId = button.dataset.helpTarget;
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) {
      return;
    }
    document.querySelectorAll("[data-help-target]").forEach((otherButton) => {
      if (otherButton !== button) {
        const otherTargetId = otherButton.dataset.helpTarget;
        const otherTarget = otherTargetId ? document.getElementById(otherTargetId) : null;
        otherButton.setAttribute("aria-expanded", "false");
        if (otherTarget) {
          otherTarget.hidden = true;
        }
      }
    });
    const nextExpanded = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(nextExpanded));
    target.hidden = !nextExpanded;
  }

  function closeAllHelp() {
    document.querySelectorAll("[data-help-target]").forEach((button) => {
      const targetId = button.dataset.helpTarget;
      const target = targetId ? document.getElementById(targetId) : null;
      button.setAttribute("aria-expanded", "false");
      if (target) {
        target.hidden = true;
      }
    });
  }

  function normalizeFooterLinks(root = document) {
    const footerRoot = root.querySelector("[data-simplekit-footer]");
    if (!footerRoot) {
      return;
    }

    footerRoot.querySelectorAll("a").forEach((link) => {
      const label = link.textContent.trim().toLowerCase();
      const href = (link.getAttribute("href") || "").toLowerCase();
      const auditedUrl = LIVE_TOOL_LINKS.get(label);
      if (auditedUrl) {
        link.href = auditedUrl;
        return;
      }

      const matchedPattern = STALE_TOOL_LINK_PATTERNS.find(([pattern]) => {
        return label.includes(pattern) || href.includes(pattern);
      });

      if (matchedPattern) {
        link.href = matchedPattern[1];
      }
    });
  }

  function syncUrl() {
    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (key === "calculatorMode") {
        params.set(key, value);
        return;
      }
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
      calculatorMode: params.get("calculatorMode") || DEFAULT_STATE.calculatorMode,
      annualIncome: clampNumber(params.get("annualIncome") || DEFAULT_STATE.annualIncome),
      monthlyDebtPayments: clampNumber(params.get("monthlyDebtPayments") || DEFAULT_STATE.monthlyDebtPayments),
      downPayment: clampNumber(params.get("downPayment") || DEFAULT_STATE.downPayment),
      mortgageRate: clampNumber(params.get("mortgageRate") || DEFAULT_STATE.mortgageRate),
      amortizationYears: Math.max(1, Math.round(clampNumber(params.get("amortizationYears") || DEFAULT_STATE.amortizationYears))),
      propertyTaxesAnnual: clampNumber(params.get("propertyTaxesAnnual") || DEFAULT_STATE.propertyTaxesAnnual),
      homeInsuranceAnnual: clampNumber(params.get("homeInsuranceAnnual") || DEFAULT_STATE.homeInsuranceAnnual),
      condoFeesMonthly: clampNumber(params.get("condoFeesMonthly") || DEFAULT_STATE.condoFeesMonthly),
      utilitiesMonthly: clampNumber(params.get("utilitiesMonthly") || DEFAULT_STATE.utilitiesMonthly),
      maintenanceReserveMonthly: clampNumber(params.get("maintenanceReserveMonthly") || DEFAULT_STATE.maintenanceReserveMonthly),
    });
  }

  async function copyShareLink() {
    const feedback = document.querySelector(selectors.shareFeedback);
    const shareUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);
      if (feedback) {
        feedback.textContent = "Scenario link copied.";
      }
    } catch (error) {
      if (feedback) {
        feedback.textContent = `Copy failed. Use this link manually: ${shareUrl}`;
      }
    }
  }

  function handleInput() {
    state = readFormState();
    renderAll();
    syncUrl();
  }

  function bindEvents() {
    const form = getForm();
    if (form) {
      form.addEventListener("input", handleInput);
      form.addEventListener("change", handleInput);
    }

    document.querySelectorAll("[data-step-next]").forEach((button) => {
      button.addEventListener("click", () => {
        setActiveStep(button.dataset.stepNext);
      });
    });

    document.querySelectorAll("[data-step-prev]").forEach((button) => {
      button.addEventListener("click", () => {
        setActiveStep(button.dataset.stepPrev);
      });
    });

    document.querySelector(selectors.loadSampleBtn)?.addEventListener("click", () => {
      setFormState(SAMPLE_STATE);
      state = readFormState();
      setActiveStep("step1");
      renderAll();
      syncUrl();
    });

    document.querySelector(selectors.resetBtn)?.addEventListener("click", () => {
      setFormState(DEFAULT_STATE);
      state = readFormState();
      setActiveStep("step1");
      renderAll();
      syncUrl();
    });

    document.querySelector(selectors.shareBtn)?.addEventListener("click", copyShareLink);

    document.querySelectorAll("[data-help-target]").forEach((button) => {
      button.addEventListener("click", () => {
        toggleHelp(button);
      });
    });

    document.querySelectorAll("[data-show-results]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelector(selectors.resultsSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.addEventListener("click", (event) => {
      const advancedToggle = event.target.closest("[data-switch-advanced]");
      if (advancedToggle) {
        const form = getForm();
        if (form?.elements.calculatorMode) {
          form.elements.calculatorMode.value = "advanced";
          const advancedRadio = document.getElementById("modeAdvanced");
          if (advancedRadio) {
            advancedRadio.checked = true;
          }
          handleInput();
          setActiveStep("step3");
        }
      }

      const jumpButton = event.target.closest("[data-jump-target]");
      if (jumpButton) {
        const target = document.getElementById(jumpButton.dataset.jumpTarget);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (!event.target.closest("[data-help-target]") && !event.target.closest(".help-text")) {
        closeAllHelp();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAllHelp();
      }
    });
  }

  function initialize() {
    restoreFromUrl();
    state = readFormState();
    bindEvents();
    setActiveStep(activeStepId, { scroll: false });
    renderAll();
    syncUrl();
    normalizeFooterLinks();

    const observer = new MutationObserver(() => {
      normalizeFooterLinks();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  initialize();
})();
