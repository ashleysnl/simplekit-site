(() => {
  const STEPS_PER_YEAR = 156;
  const CONTRIBUTION_INTERVALS = {
    monthly: 13,
    biweekly: 6,
    annually: STEPS_PER_YEAR,
  };
  const CONTRIBUTIONS_PER_YEAR = {
    monthly: 12,
    biweekly: 26,
    annually: 1,
  };
  const COMPOUNDING_PERIODS = {
    annually: 1,
    semiannually: 2,
    quarterly: 4,
    monthly: 12,
  };
  const DEFAULT_STATE = {
    startingAmount: 10000,
    recurringContribution: 500,
    contributionFrequency: "monthly",
    annualReturn: 6,
    years: 25,
    extraMonths: 0,
    compoundingFrequency: "monthly",
    inflationRate: 2,
    annualFee: 0.5,
    contributionIncrease: 0,
    startAge: 35,
    endAge: 60,
    overrideEndAge: false,
    showRealValues: false,
    includeFees: true,
    futureLumpSum: 0,
    futureLumpSumYear: 10,
  };
  const SAMPLE_STATE = {
    startingAmount: 35000,
    recurringContribution: 850,
    contributionFrequency: "biweekly",
    annualReturn: 6.8,
    years: 22,
    extraMonths: 6,
    compoundingFrequency: "monthly",
    inflationRate: 2.2,
    annualFee: 0.35,
    contributionIncrease: 2,
    startAge: 33,
    endAge: 55,
    overrideEndAge: false,
    showRealValues: false,
    includeFees: true,
    futureLumpSum: 15000,
    futureLumpSumYear: 8,
  };
  const selectors = {
    form: "#growthForm",
    headlineResult: "#headlineResult",
    resultCards: "#resultCards",
    insightSummary: "#insightSummary",
    interpretationCards: "#interpretationCards",
    nextStepCards: "#nextStepCards",
    resultsModeText: "#resultsModeText",
    assumptionsNote: "#assumptionsNote",
    screenReaderSummary: "#screenReaderSummary",
    growthLineChart: "#growthLineChart",
    growthChartTakeaway: "#growthChartTakeaway",
    breakdownChart: "#breakdownChart",
    breakdownChartTakeaway: "#breakdownChartTakeaway",
    projectionTableBody: "#projectionTableBody",
    downloadCsvBtn: "#downloadCsvBtn",
    sampleScenarioBtn: "#sampleScenarioBtn",
    resetBtn: "#resetBtn",
    ageModeHint: "#ageModeHint",
  };

  let state = { ...DEFAULT_STATE };
  let latestProjection = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function readNumber(form, name, fallback) {
    const raw = form.elements[name]?.value ?? "";
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  function readState() {
    const form = document.querySelector(selectors.form);
    if (!form) {
      return { ...DEFAULT_STATE };
    }

    const draft = {
      startingAmount: Math.max(0, readNumber(form, "startingAmount", DEFAULT_STATE.startingAmount)),
      recurringContribution: Math.max(0, readNumber(form, "recurringContribution", DEFAULT_STATE.recurringContribution)),
      contributionFrequency: form.elements.contributionFrequency.value || DEFAULT_STATE.contributionFrequency,
      annualReturn: readNumber(form, "annualReturn", DEFAULT_STATE.annualReturn),
      years: clamp(Math.round(readNumber(form, "years", DEFAULT_STATE.years)), 1, 80),
      extraMonths: clamp(Math.round(readNumber(form, "extraMonths", DEFAULT_STATE.extraMonths)), 0, 11),
      compoundingFrequency: form.elements.compoundingFrequency.value || DEFAULT_STATE.compoundingFrequency,
      inflationRate: Math.max(0, readNumber(form, "inflationRate", DEFAULT_STATE.inflationRate)),
      annualFee: Math.max(0, readNumber(form, "annualFee", DEFAULT_STATE.annualFee)),
      contributionIncrease: Math.max(0, readNumber(form, "contributionIncrease", DEFAULT_STATE.contributionIncrease)),
      startAge: clamp(Math.round(readNumber(form, "startAge", DEFAULT_STATE.startAge)), 0, 100),
      endAge: clamp(Math.round(readNumber(form, "endAge", DEFAULT_STATE.endAge)), 0, 120),
      overrideEndAge: form.elements.overrideEndAge.checked,
      showRealValues: form.elements.showRealValues.checked,
      includeFees: form.elements.includeFees.checked,
      futureLumpSum: Math.max(0, readNumber(form, "futureLumpSum", DEFAULT_STATE.futureLumpSum)),
      futureLumpSumYear: clamp(Math.round(readNumber(form, "futureLumpSumYear", DEFAULT_STATE.futureLumpSumYear)), 1, 80),
    };

    if (draft.overrideEndAge && draft.endAge > draft.startAge) {
      const totalMonths = Math.round((draft.endAge - draft.startAge) * 12);
      draft.years = Math.max(1, Math.floor(totalMonths / 12));
      draft.extraMonths = clamp(totalMonths % 12, 0, 11);
    } else {
      draft.endAge = draft.startAge + draft.years + (draft.extraMonths / 12);
    }

    return draft;
  }

  function setFormState(nextState) {
    state = { ...nextState };
    const form = document.querySelector(selectors.form);
    if (!form) {
      return;
    }

    Object.entries(state).forEach(([key, value]) => {
      const field = form.elements[key];
      if (!field) {
        return;
      }

      if (field.type === "checkbox") {
        field.checked = Boolean(value);
      } else {
        field.value = value;
      }
    });

    syncAgeFields();
  }

  function syncAgeFields() {
    const form = document.querySelector(selectors.form);
    const ageHint = document.querySelector(selectors.ageModeHint);
    if (!form) {
      return;
    }

    form.elements.endAge.readOnly = !state.overrideEndAge;
    if (!state.overrideEndAge) {
      form.elements.endAge.value = Number.isInteger(state.endAge)
        ? String(state.endAge)
        : state.endAge.toFixed(1);
    } else {
      form.elements.years.value = String(state.years);
      form.elements.extraMonths.value = String(state.extraMonths);
    }
    if (ageHint) {
      ageHint.textContent = state.overrideEndAge
        ? "End age now drives the timeline when it is higher than the start age."
        : "Auto-calculated from the investment period unless you turn on the override.";
    }
  }

  function toQueryString() {
    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      params.set(key, String(value));
    });
    return params.toString();
  }

  function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length === 0) {
      setFormState(DEFAULT_STATE);
      return;
    }

    setFormState({
      startingAmount: Number(params.get("startingAmount")) || DEFAULT_STATE.startingAmount,
      recurringContribution: Number(params.get("recurringContribution")) || DEFAULT_STATE.recurringContribution,
      contributionFrequency: params.get("contributionFrequency") || DEFAULT_STATE.contributionFrequency,
      annualReturn: Number(params.get("annualReturn")) || DEFAULT_STATE.annualReturn,
      years: Number(params.get("years")) || DEFAULT_STATE.years,
      extraMonths: Number(params.get("extraMonths")) || DEFAULT_STATE.extraMonths,
      compoundingFrequency: params.get("compoundingFrequency") || DEFAULT_STATE.compoundingFrequency,
      inflationRate: Number(params.get("inflationRate")) || DEFAULT_STATE.inflationRate,
      annualFee: Number(params.get("annualFee")) || DEFAULT_STATE.annualFee,
      contributionIncrease: Number(params.get("contributionIncrease")) || DEFAULT_STATE.contributionIncrease,
      startAge: Number(params.get("startAge")) || DEFAULT_STATE.startAge,
      endAge: Number(params.get("endAge")) || DEFAULT_STATE.endAge,
      overrideEndAge: params.get("overrideEndAge") === "true",
      showRealValues: params.get("showRealValues") === "true",
      includeFees: params.get("includeFees") !== "false",
      futureLumpSum: Number(params.get("futureLumpSum")) || DEFAULT_STATE.futureLumpSum,
      futureLumpSumYear: Number(params.get("futureLumpSumYear")) || DEFAULT_STATE.futureLumpSumYear,
    });
  }

  function syncUrl() {
    window.history.replaceState({}, "", `${window.location.pathname}?${toQueryString()}`);
  }

  function currencyFormatter() {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    });
  }

  function numberFormatter() {
    return new Intl.NumberFormat("en-CA", {
      maximumFractionDigits: 1,
    });
  }

  function percentFormatter() {
    return new Intl.NumberFormat("en-CA", {
      style: "percent",
      maximumFractionDigits: 2,
    });
  }

  function formatCurrency(value) {
    return currencyFormatter().format(value);
  }

  function formatPercent(value) {
    return percentFormatter().format(value);
  }

  function getTotalMonths(inputState) {
    return (inputState.years * 12) + inputState.extraMonths;
  }

  function simulateProjection(inputState, withFees = inputState.includeFees) {
    const totalMonths = getTotalMonths(inputState);
    const totalSteps = totalMonths * (STEPS_PER_YEAR / 12);
    const contributionInterval = CONTRIBUTION_INTERVALS[inputState.contributionFrequency];
    const contributionPeriodsPerYear = CONTRIBUTIONS_PER_YEAR[inputState.contributionFrequency];
    const compoundingPeriodsPerYear = COMPOUNDING_PERIODS[inputState.compoundingFrequency];
    const compoundingInterval = STEPS_PER_YEAR / compoundingPeriodsPerYear;
    const annualReturn = inputState.annualReturn / 100;
    const annualFee = withFees ? inputState.annualFee / 100 : 0;
    const inflationRate = inputState.inflationRate / 100;
    const contributionIncrease = inputState.contributionIncrease / 100;
    const growthPerCompound = Math.pow(1 + annualReturn, 1 / compoundingPeriodsPerYear) - 1;
    const feePerCompound = annualFee > 0
      ? 1 - Math.pow(1 - annualFee, 1 / compoundingPeriodsPerYear)
      : 0;

    let balance = inputState.startingAmount;
    let totalContributions = inputState.startingAmount;
    let totalFeesPaid = 0;
    const linePoints = [{
      step: 0,
      yearValue: 0,
      balance,
      contributions: totalContributions,
      growth: 0,
      fees: 0,
    }];
    const yearlyRows = [];
    let rowStartBalance = balance;
    let rowContributions = 0;
    let rowGrowth = 0;
    let rowFees = 0;
    let currentContribution = inputState.recurringContribution;

    for (let step = 1; step <= totalSteps; step += 1) {
      if ((step - 1) % STEPS_PER_YEAR === 0 && step !== 1) {
        currentContribution *= 1 + contributionIncrease;
      }

      if (step % compoundingInterval === 0) {
        const grossGrowth = balance * growthPerCompound;
        balance += grossGrowth;
        rowGrowth += grossGrowth;

        if (feePerCompound > 0) {
          const feeCharge = balance * feePerCompound;
          balance -= feeCharge;
          totalFeesPaid += feeCharge;
          rowFees += feeCharge;
        }
      }

      if (step % contributionInterval === 0) {
        balance += currentContribution;
        totalContributions += currentContribution;
        rowContributions += currentContribution;
      }

      if (
        inputState.futureLumpSum > 0 &&
        step === Math.min(totalSteps, inputState.futureLumpSumYear * STEPS_PER_YEAR)
      ) {
        balance += inputState.futureLumpSum;
        totalContributions += inputState.futureLumpSum;
        rowContributions += inputState.futureLumpSum;
      }

      const shouldCloseYear = step % STEPS_PER_YEAR === 0 || step === totalSteps;
      if (shouldCloseYear) {
        const elapsedYears = step / STEPS_PER_YEAR;
        const inflationFactor = Math.pow(1 + inflationRate, elapsedYears);
        const rowNumber = yearlyRows.length + 1;
        const rowAge = inputState.startAge + elapsedYears;

        yearlyRows.push({
          yearLabel: step === totalSteps && step % STEPS_PER_YEAR !== 0 ? `${rowNumber} (partial)` : String(rowNumber),
          age: Number.isFinite(rowAge) ? rowAge : null,
          startingBalance: rowStartBalance,
          contributions: rowContributions,
          growth: rowGrowth,
          fees: rowFees,
          endingBalance: balance,
          realEndingBalance: inflationFactor > 0 ? balance / inflationFactor : balance,
          elapsedYears,
        });

        linePoints.push({
          step,
          yearValue: elapsedYears,
          balance,
          contributions: totalContributions,
          growth: balance - totalContributions,
          fees: totalFeesPaid,
        });

        rowStartBalance = balance;
        rowContributions = 0;
        rowGrowth = 0;
        rowFees = 0;
      }
    }

    return {
      totalMonths,
      totalYears: totalMonths / 12,
      endingBalance: balance,
      totalContributions,
      totalGrowth: balance - totalContributions,
      totalFeesPaid,
      yearlyRows,
      linePoints,
      monthlyEquivalentContribution: (inputState.recurringContribution * contributionPeriodsPerYear) / 12,
      annualContributionEquivalent: inputState.recurringContribution * contributionPeriodsPerYear,
    };
  }

  function buildProjection(inputState) {
    const withFees = simulateProjection(inputState, inputState.includeFees);
    const withoutFees = simulateProjection(inputState, false);
    const inflationFactor = Math.pow(1 + (inputState.inflationRate / 100), withFees.totalYears);
    const finalRealBalance = inflationFactor > 0 ? withFees.endingBalance / inflationFactor : withFees.endingBalance;
    const feeDrag = inputState.includeFees ? Math.max(0, withoutFees.endingBalance - withFees.endingBalance) : 0;
    const netAnnualReturn = inputState.includeFees
      ? ((1 + (inputState.annualReturn / 100)) * (1 - (inputState.annualFee / 100))) - 1
      : inputState.annualReturn / 100;

    const mergedRows = withFees.yearlyRows.map((row, index) => ({
      ...row,
      feeDrag: inputState.includeFees
        ? Math.max(0, withoutFees.yearlyRows[index].endingBalance - row.endingBalance)
        : 0,
    }));

    return {
      ...withFees,
      finalRealBalance,
      feeDrag,
      netAnnualReturn,
      displayEndingValue: inputState.showRealValues ? finalRealBalance : withFees.endingBalance,
      displayGrowthValue: inputState.showRealValues
        ? finalRealBalance - withFees.totalContributions
        : withFees.totalGrowth,
      mergedRows,
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

  function renderCards(projection) {
    const headlineResult = document.querySelector(selectors.headlineResult);
    const resultCards = document.querySelector(selectors.resultCards);
    const insightSummary = document.querySelector(selectors.insightSummary);
    const interpretationCards = document.querySelector(selectors.interpretationCards);
    const nextStepCards = document.querySelector(selectors.nextStepCards);
    const resultsModeText = document.querySelector(selectors.resultsModeText);
    const assumptionsNote = document.querySelector(selectors.assumptionsNote);
    const screenReaderSummary = document.querySelector(selectors.screenReaderSummary);

    if (!headlineResult || !resultCards || !insightSummary || !interpretationCards || !nextStepCards) {
      return;
    }

    const displayMode = state.showRealValues ? "inflation-adjusted" : "nominal";
    resultsModeText.textContent = `Values shown in ${displayMode} dollars.`;

    const contributionShare = projection.endingBalance > 0
      ? projection.totalContributions / projection.endingBalance
      : 0;
    const growthShare = projection.endingBalance > 0
      ? projection.totalGrowth / projection.endingBalance
      : 0;
    const feeShare = projection.endingBalance > 0
      ? projection.feeDrag / projection.endingBalance
      : 0;

    headlineResult.innerHTML = `
      <span class="headline-label">Final portfolio value</span>
      <strong class="headline-value">${escapeHtml(formatCurrency(projection.displayEndingValue))}</strong>
      <p class="headline-meta">${escapeHtml(buildHeadlineMeta(projection, contributionShare, growthShare))}</p>
      <div class="headline-support" aria-label="Contribution and growth split">
        <div class="headline-support-item">
          <span class="mini-summary-label">Contribution total</span>
          <strong>${escapeHtml(formatCurrency(projection.totalContributions))}</strong>
        </div>
        <div class="headline-support-item">
          <span class="mini-summary-label">Compound growth</span>
          <strong>${escapeHtml(formatCurrency(projection.totalGrowth))}</strong>
        </div>
      </div>
    `;

    const cards = [
      {
        label: "Total contributions",
        value: formatCurrency(projection.totalContributions),
        copy: "Includes your starting amount, recurring contributions, and any future lump sum.",
      },
      {
        label: "Investment growth",
        value: formatCurrency(projection.totalGrowth),
        copy: "This is the projected compound growth left after contributions are separated out.",
      },
      {
        label: state.inflationRate > 0 ? "Inflation-adjusted value" : "Estimated impact of fees",
        value: state.inflationRate > 0 ? formatCurrency(projection.finalRealBalance) : (state.includeFees ? formatCurrency(projection.feeDrag) : "Fees excluded"),
        copy: state.inflationRate > 0
          ? "This adjusts the ending value for inflation so you can judge purchasing power more realistically."
          : (state.includeFees
            ? "Approximate ending-value gap versus a no-fee version of the same scenario."
            : "Turn fees on to estimate long-term fee drag."),
      },
    ];

    resultCards.innerHTML = cards.map((card) => `
      <article class="result-card">
        <span class="trust-label">${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <p>${escapeHtml(card.copy)}</p>
      </article>
    `).join("");

    assumptionsNote.textContent = `Results are estimates, not guarantees. This scenario assumes a ${state.annualReturn}% annual return, ${state.inflationRate}% inflation, ${state.includeFees ? `${state.annualFee}% annual fees` : "no annual fees"}, ${state.compoundingFrequency} compounding, and ${state.contributionFrequency} contributions.`;
    screenReaderSummary.textContent = `Starting with ${formatCurrency(state.startingAmount)} and adding ${formatCurrency(state.recurringContribution)} ${state.contributionFrequency}, this scenario ends at ${formatCurrency(projection.endingBalance)} before inflation adjustment. Total contributions are ${formatCurrency(projection.totalContributions)}, projected net growth is ${formatCurrency(projection.totalGrowth)}, and the inflation-adjusted ending value is ${formatCurrency(projection.finalRealBalance)}.`;

    const interpretation = [
      {
        title: "Planning sense check",
        copy: `${buildPlanningSenseCheck(projection, contributionShare, growthShare)} ${buildScenarioTests(projection)[0]?.copy || ""}`.trim(),
      },
    ];

    insightSummary.innerHTML = `
      <strong>${escapeHtml(buildMainTakeaway(projection, contributionShare, growthShare, feeShare))}</strong>
      <p>${escapeHtml(buildInsightSupport(projection))}</p>
    `;

    interpretationCards.innerHTML = interpretation.map((item) => `
      <article class="interpret-card">
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.copy)}</p>
      </article>
    `).join("");

    const nextSteps = buildNextSteps(projection);
    nextStepCards.innerHTML = nextSteps.map((item, index) => item.href ? `
      <a class="next-step-card ${index === 0 ? "next-step-card-primary" : "next-step-card-secondary"}" href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">
        <span class="mini-kicker">${escapeHtml(index === 0 ? `Recommended next · ${item.kicker}` : `Optional follow-up · ${item.kicker}`)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.copy)}</p>
      </a>
    ` : `
      <article class="next-step-card next-step-card-static ${index === 0 ? "next-step-card-primary" : "next-step-card-secondary"}">
        <span class="mini-kicker">${escapeHtml(index === 0 ? `Recommended next · ${item.kicker}` : `Optional follow-up · ${item.kicker}`)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.copy)}</p>
      </article>
    `).join("");
  }

  function buildNextSteps(projection) {
    if (state.includeFees && projection.feeDrag > projection.totalContributions * 0.08) {
      return [
        {
          kicker: "Fee drag",
          title: "Open the Investment Fee Calculator",
          copy: "This scenario shows meaningful long-term fee drag. Compare lower-fee options next to see how much more compound growth you may keep.",
          href: "https://simplekit.app/investment-fee-calculator/",
        },
        {
          kicker: "Tax efficiency",
          title: "Compare RRSP vs TFSA",
          copy: "If these contributions are going into registered accounts, compare where the next dollar may work harder after tax.",
          href: "https://simplekit.app/rrsp-vs-tfsa-calculator/",
        },
      ];
    }

    if (state.startAge >= 45 || projection.totalYears >= 20) {
      return [
        {
          kicker: "Retirement planning",
          title: "Open the Retirement Planner",
          copy: "Use these compound-growth assumptions inside a fuller retirement income and spending plan.",
          href: "https://simplekit.app/retirement-planner/",
        },
        {
          kicker: "Tax efficiency",
          title: "Compare RRSP vs TFSA",
          copy: "If this goal is retirement-focused, check where future contributions may be more efficient after tax.",
          href: "https://simplekit.app/rrsp-vs-tfsa-calculator/",
        },
      ];
    }

    return [
        {
          kicker: "Financial independence",
          title: "Try the FIRE Calculator",
          copy: "If your goal is optional early retirement or work flexibility, test how this compound-growth path affects your timeline.",
          href: "https://simplekit.app/fire-calculator/",
        },
        {
          kicker: "Balance sheet",
          title: "Net Worth Calculator",
          copy: "If you want a broader balance-sheet view, pair this investment projection with a full net worth snapshot.",
          href: "https://simplekit.app/net-worth-calculator/",
        },
      ];
  }

  function buildScenarioTests(projection) {
    const tests = [];

    if (state.annualReturn > 5) {
      tests.push({
        title: "Try a slightly lower return",
        copy: `If you reduce the return assumption from ${state.annualReturn}% to around ${Math.max(3, state.annualReturn - 1)}%, you will get a more conservative compound-growth range.`,
      });
    }

    if (state.inflationRate === 0) {
      tests.push({
        title: "Turn inflation on",
        copy: "If this money is for a long-term goal, adding inflation will show what the ending value may be worth in today’s dollars.",
      });
    } else {
      tests.push({
        title: "Compare nominal vs today’s dollars",
        copy: `You currently assume ${state.inflationRate}% inflation. Toggle today’s-dollar results on and off to see how much purchasing power changes the story.`,
      });
    }

    if (!state.includeFees || projection.feeDrag === 0) {
      tests.push({
        title: "Test a realistic fee",
        copy: "If this money will sit inside a fund or managed portfolio, turning fees on will usually make the estimate more realistic.",
      });
    } else {
      tests.push({
        title: "Compare with a lower fee",
        copy: `Fee drag is currently estimated at ${formatCurrency(projection.feeDrag)}. Testing a lower MER can show how much long-term value a cheaper product might preserve.`,
      });
    }

    if (state.contributionIncrease === 0) {
      tests.push({
        title: "Test contribution growth",
        copy: "If you expect raises over time, try a small annual contribution increase such as 1% to 3% and compare the outcome.",
      });
    }

    return tests.slice(0, 3);
  }

  function buildHeadlineMeta(projection, contributionShare, growthShare) {
    if (growthShare > contributionShare) {
      return `After ${numberFormatter().format(projection.totalYears)} years, this estimate is now being driven more by compounding than by new money going in.`;
    }

    return `After ${numberFormatter().format(projection.totalYears)} years, this estimate still depends more on steady contributions than on compound growth alone.`;
  }

  function buildMainTakeaway(projection, contributionShare, growthShare, feeShare) {
    if (state.includeFees && projection.feeDrag > 0 && feeShare > 0.08) {
      return `This is a healthy long-term compound-growth scenario, but fees are large enough to materially change the outcome over time.`;
    }

    if (growthShare > contributionShare) {
      return `This looks like a healthy compounding-led scenario where time in the market is now doing most of the heavy lifting.`;
    }

    return `This looks like a contribution-led scenario, which means steady saving matters more than perfect precision right now.`;
  }

  function buildPlanningSenseCheck(projection, contributionShare, growthShare) {
    if (state.includeFees && projection.feeDrag > 0 && projection.feeDrag > projection.totalContributions * 0.08) {
      return `This looks useful for long-term accumulation, but it is sensitive to fees. Lower-cost options could materially improve the compound-growth outcome.`;
    }

    if (growthShare > contributionShare) {
      return `This looks healthy for long-term accumulation. Time in the market is now doing more of the work than fresh contributions.`;
    }

    if (state.inflationRate > 0) {
      return `This still depends heavily on steady saving. The inflation-adjusted value is ${formatCurrency(projection.finalRealBalance)}, so contribution consistency and realistic assumptions matter most.`;
    }

    return `This still depends heavily on steady saving, so contribution consistency matters more than fine-tuning assumptions. Turn inflation on if this is for a long-term goal.`;
  }

  function buildInsightSupport(projection) {
    if (state.inflationRate > 0) {
      return `The nominal ending value is ${formatCurrency(projection.endingBalance)}, the spending-power view is ${formatCurrency(projection.finalRealBalance)}, and your current contribution pace works out to about ${formatCurrency(projection.monthlyEquivalentContribution)} per month equivalent.`;
    }

    return `This is a nominal-dollar estimate. Your current contribution pace works out to about ${formatCurrency(projection.monthlyEquivalentContribution)} per month equivalent, and turning inflation on is the next best realism test if this money is for a long-term goal.`;
  }

  function makeSvg(width, height, content) {
    return `
      <svg viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">
        ${content}
      </svg>
    `;
  }

  function renderLineChart(projection) {
    const chartRoot = document.querySelector(selectors.growthLineChart);
    const takeaway = document.querySelector(selectors.growthChartTakeaway);
    if (!chartRoot) {
      return;
    }

    const width = 760;
    const height = 360;
    const padding = { top: 20, right: 18, bottom: 38, left: 62 };
    const points = projection.linePoints;
    const maxX = Math.max(...points.map((point) => point.yearValue));
    const maxY = Math.max(...points.map((point) => point.balance), 1);
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const x = (value) => padding.left + ((value / maxX) * chartWidth);
    const y = (value) => padding.top + chartHeight - ((value / maxY) * chartHeight);

    const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.yearValue).toFixed(2)} ${y(point.balance).toFixed(2)}`).join(" ");
    const contributionPath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.yearValue).toFixed(2)} ${y(point.contributions).toFixed(2)}`).join(" ");

    const ticks = 4;
    const gridLines = Array.from({ length: ticks + 1 }, (_, index) => {
      const value = (maxY / ticks) * index;
      const yPos = y(value);
      return `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="rgba(23,49,76,0.1)" />
        <text x="${padding.left - 10}" y="${yPos + 4}" text-anchor="end" font-size="12" fill="#5f7086">${escapeHtml(formatCurrency(value))}</text>
      `;
    }).join("");

    const xTickCount = Math.min(6, Math.ceil(maxX)) + 1;
    const xTicks = Array.from({ length: xTickCount }, (_, index) => {
      const value = maxX === 0 ? 0 : (maxX / Math.max(xTickCount - 1, 1)) * index;
      const xPos = x(value);
      return `
        <line x1="${xPos}" y1="${height - padding.bottom}" x2="${xPos}" y2="${height - padding.bottom + 6}" stroke="rgba(23,49,76,0.25)" />
        <text x="${xPos}" y="${height - 12}" text-anchor="middle" font-size="12" fill="#5f7086">${escapeHtml(numberFormatter().format(value))}y</text>
      `;
    }).join("");

    chartRoot.innerHTML = `
      ${makeSvg(width, height, `
        <rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="#ffffff" />
        <defs>
          <linearGradient id="balanceFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(31,111,196,0.2)" />
            <stop offset="100%" stop-color="rgba(31,111,196,0.02)" />
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${path} L ${x(maxX)} ${height - padding.bottom} L ${x(0)} ${height - padding.bottom} Z" fill="url(#balanceFill)" />
        <path d="${contributionPath}" fill="none" stroke="#1ca39a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8 7" />
        <path d="${path}" fill="none" stroke="#1f6fc4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(23,49,76,0.35)" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="rgba(23,49,76,0.35)" />
        ${xTicks}
      `)}
      <div class="chart-legend" aria-hidden="true">
        <span class="legend-chip"><span class="legend-swatch" style="background:#1f6fc4;"></span>Portfolio value</span>
        <span class="legend-chip"><span class="legend-swatch" style="background:#1ca39a;"></span>Total contributions</span>
      </div>
    `;

    if (takeaway) {
      takeaway.textContent = projection.totalGrowth > projection.totalContributions
        ? "In this scenario, the widening gap later on shows compound growth taking over as the bigger driver of the final result."
        : "In this scenario, the portfolio line stays relatively close to contributions, which shows recurring deposits are still doing most of the work.";
    }
  }

  function renderBreakdownChart(projection) {
    const chartRoot = document.querySelector(selectors.breakdownChart);
    const takeaway = document.querySelector(selectors.breakdownChartTakeaway);
    if (!chartRoot) {
      return;
    }

    const width = 760;
    const height = 360;
    const padding = { top: 20, right: 18, bottom: 44, left: 62 };
    const rows = projection.mergedRows;
    const cumulativeRows = rows.map((row, index) => {
      const yearPoint = projection.linePoints[Math.min(index + 1, projection.linePoints.length - 1)];
      const cumulativeContributions = yearPoint?.contributions ?? row.contributions;
      const cumulativeGrowth = Math.max(0, row.endingBalance - cumulativeContributions);

      return {
        ...row,
        cumulativeContributions,
        cumulativeGrowth,
      };
    });

    const maxValue = Math.max(...cumulativeRows.map((row) => row.endingBalance + row.feeDrag), 1);
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / Math.max(cumulativeRows.length, 1);

    const y = (value) => padding.top + chartHeight - ((value / maxValue) * chartHeight);
    const ticks = 4;
    const gridLines = Array.from({ length: ticks + 1 }, (_, index) => {
      const value = (maxValue / ticks) * index;
      const yPos = y(value);
      return `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="rgba(23,49,76,0.1)" />
        <text x="${padding.left - 10}" y="${yPos + 4}" text-anchor="end" font-size="12" fill="#5f7086">${escapeHtml(formatCurrency(value))}</text>
      `;
    }).join("");

    const bars = cumulativeRows.map((row, index) => {
      const barX = padding.left + (index * barWidth) + (barWidth * 0.14);
      const innerWidth = Math.max(10, barWidth * 0.72);
      const contributionHeight = chartHeight - (y(row.cumulativeContributions) - padding.top);
      const growthHeight = chartHeight - (y(row.cumulativeGrowth) - padding.top);
      const feeHeight = chartHeight - (y(row.feeDrag) - padding.top);
      const contributionY = y(row.cumulativeContributions);
      const growthY = y(row.cumulativeContributions + row.cumulativeGrowth);
      const feeY = y(row.cumulativeContributions + row.cumulativeGrowth + row.feeDrag);
      const label = row.yearLabel.replace(" (partial)", "*");

      return `
        <rect x="${barX}" y="${contributionY}" width="${innerWidth}" height="${Math.max(0, contributionHeight)}" rx="6" fill="#1ca39a" />
        <rect x="${barX}" y="${growthY}" width="${innerWidth}" height="${Math.max(0, growthHeight)}" rx="6" fill="#1f6fc4" />
        ${state.includeFees ? `<rect x="${barX}" y="${feeY}" width="${innerWidth}" height="${Math.max(0, feeHeight)}" rx="6" fill="#dd6b5c" opacity="0.86" />` : ""}
        <text x="${barX + (innerWidth / 2)}" y="${height - 14}" text-anchor="middle" font-size="11" fill="#5f7086">${escapeHtml(label)}</text>
      `;
    }).join("");

    chartRoot.innerHTML = `
      ${makeSvg(width, height, `
        <rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="#ffffff" />
        ${gridLines}
        ${bars}
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(23,49,76,0.35)" />
      `)}
      <div class="chart-legend" aria-hidden="true">
        <span class="legend-chip"><span class="legend-swatch" style="background:#1ca39a;"></span>Contributions</span>
        <span class="legend-chip"><span class="legend-swatch" style="background:#1f6fc4;"></span>Growth</span>
        ${state.includeFees ? '<span class="legend-chip"><span class="legend-swatch" style="background:#dd6b5c;"></span>Fee drag</span>' : ""}
      </div>
    `;

    if (takeaway) {
      takeaway.textContent = state.includeFees && projection.feeDrag > 0
        ? "This view shows the same story year by year: contributions build the base, compound growth matters more later, and fees quietly trim part of the upside."
        : "This view shows the same story year by year: contributions build the base first, then compound growth starts to take a larger share of the result.";
    }
  }

  function renderTable(projection) {
    const tbody = document.querySelector(selectors.projectionTableBody);
    if (!tbody) {
      return;
    }

    tbody.innerHTML = projection.mergedRows.map((row) => `
      <tr>
        <td>${escapeHtml(row.yearLabel)}</td>
        <td>${row.age == null ? "—" : escapeHtml(numberFormatter().format(row.age))}</td>
        <td>${escapeHtml(formatCurrency(row.startingBalance))}</td>
        <td>${escapeHtml(formatCurrency(row.contributions))}</td>
        <td>${escapeHtml(formatCurrency(row.growth))}</td>
        <td>${escapeHtml(formatCurrency(row.fees))}</td>
        <td>${escapeHtml(formatCurrency(row.endingBalance))}</td>
        <td>${escapeHtml(formatCurrency(row.realEndingBalance))}</td>
      </tr>
    `).join("");
  }

  function downloadCsv() {
    if (!latestProjection) {
      return;
    }

    const header = [
      "Year",
      "Age",
      "Starting Balance",
      "Contributions",
      "Growth Earned",
      "Fees Deducted",
      "Ending Balance",
      "Inflation Adjusted Ending Balance",
    ];
    const rows = latestProjection.mergedRows.map((row) => [
      row.yearLabel,
      row.age == null ? "" : numberFormatter().format(row.age),
      row.startingBalance.toFixed(2),
      row.contributions.toFixed(2),
      row.growth.toFixed(2),
      row.fees.toFixed(2),
      row.endingBalance.toFixed(2),
      row.realEndingBalance.toFixed(2),
    ]);

    const csv = [header, ...rows]
      .map((columns) => columns.map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "simplekit-compound-interest-calculator.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function renderAll() {
    latestProjection = buildProjection(state);
    renderCards(latestProjection);
    renderLineChart(latestProjection);
    renderBreakdownChart(latestProjection);
    renderTable(latestProjection);
  }

  function handleInput() {
    state = readState();
    syncAgeFields();
    syncUrl();
    renderAll();
  }

  function bindEvents() {
    const form = document.querySelector(selectors.form);
    if (form) {
      form.addEventListener("input", handleInput);
      form.addEventListener("change", handleInput);
    }

    document.querySelector(selectors.downloadCsvBtn)?.addEventListener("click", downloadCsv);
    document.querySelector(selectors.sampleScenarioBtn)?.addEventListener("click", () => {
      setFormState(SAMPLE_STATE);
      state = readState();
      syncUrl();
      renderAll();
    });
    document.querySelector(selectors.resetBtn)?.addEventListener("click", () => {
      setFormState(DEFAULT_STATE);
      state = readState();
      syncUrl();
      renderAll();
    });
  }

  function initialize() {
    restoreFromUrl();
    state = readState();
    bindEvents();
    syncAgeFields();
    syncUrl();
    renderAll();
  }

  initialize();
})();
