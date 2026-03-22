(() => {
  const DEFAULT_STATE = {
    monthlyExpenses: "",
    targetPreset: "6",
    customTargetMonths: 6,
    currentSavings: "",
    monthlyContribution: "",
    annualRate: "",
    contributionFrequency: "monthly",
    lumpSum: "",
    incomeStability: "somewhat-stable",
    dependents: "none",
  };

  const EXAMPLE_STATE = {
    monthlyExpenses: 4200,
    targetPreset: "6",
    customTargetMonths: 6,
    currentSavings: 8500,
    monthlyContribution: 500,
    annualRate: 2,
    contributionFrequency: "biweekly",
    lumpSum: 1500,
    incomeStability: "variable",
    dependents: "one-plus",
  };

  const selectors = {
    form: "#calculatorForm",
    resultCards: "#resultCards",
    summaryHeadline: "#summaryHeadline",
    summaryText: "#summaryText",
    nextStepText: "#nextStepText",
    progressLabel: "#progressLabel",
    progressText: "#progressText",
    progressFill: "#progressFill",
    progressBar: "#progressBar",
    guidanceText: "#guidanceText",
    targetMonthsSummary: "#targetMonthsSummary",
    heroPreviewTitle: "#heroPreviewTitle",
    heroPreviewText: "#heroPreviewText",
    shareBtn: "#shareBtn",
    shareFeedback: "#shareFeedback",
    resetBtn: "#resetBtn",
    exampleBtn: "#exampleBtn",
    contributionLabel: "#contributionLabel",
    relatedIntro: "#relatedIntro",
    customTargetBadge: "#customTargetBadge",
    relatedGrid: ".related-grid",
    summaryCard: "#summaryCard",
    guidancePanel: "#guidancePanel",
    footerMount: "[data-simplekit-footer]",
  };

  let state = { ...DEFAULT_STATE };

  function getForm() {
    return document.querySelector(selectors.form);
  }

  function parseNumber(value, minimum = 0) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return Math.max(minimum, parsed);
  }

  function numberOrZero(value) {
    return value === null ? 0 : value;
  }

  function getTargetMonths(nextState) {
    const customMonths = parseNumber(nextState.customTargetMonths, 1) ?? 6;
    const preset = nextState.targetPreset;

    if (!["3", "6", "9", "12"].includes(String(preset))) {
      return customMonths;
    }

    if (Math.abs(customMonths - Number(preset)) > 0.001) {
      return customMonths;
    }

    return Number(preset);
  }

  function setFieldValue(field, value) {
    if (!field) {
      return;
    }

    field.value = value === "" ? "" : String(value);
  }

  function setFormState(nextState) {
    state = { ...nextState };
    const form = getForm();
    if (!form) {
      return;
    }

    setFieldValue(form.elements.monthlyExpenses, state.monthlyExpenses);
    setFieldValue(form.elements.currentSavings, state.currentSavings);
    setFieldValue(form.elements.monthlyContribution, state.monthlyContribution);
    setFieldValue(form.elements.annualRate, state.annualRate);
    form.elements.contributionFrequency.value = state.contributionFrequency;
    setFieldValue(form.elements.lumpSum, state.lumpSum);
    setFieldValue(form.elements.customTargetMonths, state.customTargetMonths);
    form.elements.incomeStability.value = state.incomeStability;
    form.elements.dependents.value = state.dependents;

    const presetField = form.querySelector(`input[name="targetPreset"][value="${state.targetPreset}"]`);
    if (presetField) {
      presetField.checked = true;
    }
  }

  function syncCustomMonthsWithPreset(presetValue) {
    const form = getForm();
    if (!form || !["3", "6", "9", "12"].includes(String(presetValue))) {
      return;
    }

    form.elements.customTargetMonths.value = presetValue;
  }

  function readFormState() {
    const form = getForm();
    if (!form) {
      return { ...DEFAULT_STATE };
    }

    const customTargetMonthsValue = form.elements.customTargetMonths.value.trim();
    const customTargetMonths = parseNumber(customTargetMonthsValue, 1) ?? 6;
    const checkedPreset = form.querySelector('input[name="targetPreset"]:checked');
    let targetPreset = checkedPreset ? checkedPreset.value : DEFAULT_STATE.targetPreset;

    if (Math.abs(customTargetMonths - Number(targetPreset)) > 0.001) {
      targetPreset = "custom";
    }

    return {
      monthlyExpenses: form.elements.monthlyExpenses.value.trim(),
      targetPreset,
      customTargetMonths,
      currentSavings: form.elements.currentSavings.value.trim(),
      monthlyContribution: form.elements.monthlyContribution.value.trim(),
      annualRate: form.elements.annualRate.value.trim(),
      contributionFrequency: form.elements.contributionFrequency.value || DEFAULT_STATE.contributionFrequency,
      lumpSum: form.elements.lumpSum.value.trim(),
      incomeStability: form.elements.incomeStability.value || DEFAULT_STATE.incomeStability,
      dependents: form.elements.dependents.value || DEFAULT_STATE.dependents,
    };
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
  }

  function formatPercent(value) {
    return new Intl.NumberFormat("en-CA", {
      style: "percent",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatMonths(value) {
    if (!Number.isFinite(value)) {
      return "No timeline yet";
    }
    if (value <= 0.5) {
      return "Less than 1 month";
    }
    return `${Math.ceil(value)} months`;
  }

  function formatTargetDate(months) {
    if (!Number.isFinite(months)) {
      return "No target date yet";
    }

    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + Math.ceil(months * 30.4375));
    return future.toLocaleDateString("en-CA", {
      month: "long",
      year: "numeric",
    });
  }

  function calculatePlan(nextState) {
    const monthlyExpenses = parseNumber(nextState.monthlyExpenses);
    const currentSavings = numberOrZero(parseNumber(nextState.currentSavings));
    const contributionInput = numberOrZero(parseNumber(nextState.monthlyContribution));
    const annualRatePercent = numberOrZero(parseNumber(nextState.annualRate));
    const lumpSum = numberOrZero(parseNumber(nextState.lumpSum));
    const targetMonths = getTargetMonths(nextState);
    const hasEssentials = monthlyExpenses !== null;
    const targetFund = hasEssentials ? monthlyExpenses * targetMonths : 0;
    const countedSavings = currentSavings + lumpSum;
    const remainingGap = Math.max(targetFund - countedSavings, 0);
    const percentComplete = targetFund > 0 ? Math.min(countedSavings / targetFund, 1.999) : countedSavings > 0 ? 1 : 0;
    const annualRate = annualRatePercent / 100;
    const frequency = nextState.contributionFrequency;
    const periodsPerYear = frequency === "biweekly" ? 26 : 12;
    const periodContribution = contributionInput;
    const periodRate = annualRate > 0 ? Math.pow(1 + annualRate, 1 / periodsPerYear) - 1 : 0;
    const maxPeriods = periodsPerYear * 100;

    let balance = countedSavings;
    let periods = 0;

    if (targetFund > 0 && balance < targetFund) {
      while (periods < maxPeriods && balance < targetFund) {
        balance = balance * (1 + periodRate) + periodContribution;
        periods += 1;
      }
    }

    const monthsToTarget = !hasEssentials
      ? Number.POSITIVE_INFINITY
      : targetFund <= 0
        ? 0
        : countedSavings >= targetFund
          ? 0
          : balance >= targetFund
            ? periods * (12 / periodsPerYear)
            : Number.POSITIVE_INFINITY;

    return {
      hasEssentials,
      monthlyExpenses,
      targetMonths,
      targetFund,
      currentSavings,
      lumpSum,
      countedSavings,
      remainingGap,
      percentComplete,
      annualRate,
      annualRatePercent,
      frequency,
      periodContribution,
      monthsToTarget,
      targetDate: formatTargetDate(monthsToTarget),
      monthlyContributionEquivalent: frequency === "biweekly"
        ? periodContribution * (26 / 12)
        : periodContribution,
    };
  }

  function buildSummary(result) {
    if (!result.hasEssentials) {
      return {
        headline: "Enter your monthly essentials to create a target.",
        text: "Once you add essentials, the calculator will estimate your target fund, gap, and timeline.",
        nextStep: "Start with housing, groceries, utilities, insurance, and transport.",
      };
    }

    if (result.targetFund <= 0) {
      return {
        headline: "Your target is currently $0.",
        text: "A $0 essentials number produces a $0 emergency fund target.",
        nextStep: "Use a realistic monthly essentials figure to get a useful plan.",
      };
    }

    if (result.remainingGap <= 0) {
      return {
        headline: "You’re already at or above your target.",
        text: `Your current plan covers a ${result.targetMonths}-month emergency fund.`,
        nextStep: "You can keep this buffer, raise the target, or move extra savings to another goal.",
      };
    }

    if (!Number.isFinite(result.monthsToTarget)) {
      return {
        headline: `You’ve funded ${formatPercent(Math.min(result.percentComplete, 1))} of your target.`,
        text: `You still need ${formatCurrency(result.remainingGap)}, but there is no projected finish date yet.`,
        nextStep: "Add or increase a recurring contribution to turn this into a timeline.",
      };
    }

    return {
      headline: `You’ve funded ${formatPercent(Math.min(result.percentComplete, 1))} of your target.`,
      text: `At your current pace, you could reach your goal in about ${formatMonths(result.monthsToTarget).toLowerCase()}.`,
      nextStep: `That would put your target date around ${result.targetDate}.`,
    };
  }

  function buildGuidance(result, nextState) {
    const notes = [];

    if (!result.hasEssentials) {
      return "Use monthly essentials rather than total spending if you want a more realistic emergency fund target.";
    }

    if (nextState.incomeStability === "variable") {
      notes.push("Variable income often leads people to choose a larger cash buffer.");
    } else if (nextState.incomeStability === "very-stable") {
      notes.push("Very stable income can make a smaller starting target feel more workable.");
    } else {
      notes.push("A middle-ground target often works well when income is fairly steady but not guaranteed.");
    }

    if (nextState.dependents === "one-plus") {
      notes.push("Dependents can raise the cost of a disruption, so some households prefer more months of protection.");
    }

    if (result.annualRate > 0) {
      notes.push(`Interest is included using a modest ${result.annualRatePercent}% annual savings estimate.`);
    } else {
      notes.push("Interest is set to 0%, so progress comes only from your contributions.");
    }

    return notes.join(" ");
  }

  function buildNextToolCopy(result) {
    if (!result.hasEssentials || result.monthlyContributionEquivalent <= 0) {
      return "Need room to start saving? The Budget Planner can help you find it.";
    }

    if (result.remainingGap <= 0) {
      return "Emergency savings are in place. Net Worth or Retirement planning may be a useful next step.";
    }

    if (result.monthsToTarget > 24 || !Number.isFinite(result.monthsToTarget)) {
      return "If this timeline feels too long, the Budget Planner or Debt Payoff Calculator may help you free up more monthly cash flow.";
    }

    return "Once this cushion is in place, explore debt payoff, investing, or retirement planning as your next step.";
  }

  function buildRelatedToolOrder(result) {
    if (!result.hasEssentials || result.monthlyContributionEquivalent <= 0) {
      return ["budget-planner", "debt-payoff-calculator", "net-worth-calculator", "compound-interest-calculator", "retirement-planner"];
    }

    if (result.remainingGap <= 0) {
      return ["net-worth-calculator", "retirement-planner", "compound-interest-calculator", "budget-planner", "debt-payoff-calculator"];
    }

    if (result.monthsToTarget > 24 || !Number.isFinite(result.monthsToTarget)) {
      return ["budget-planner", "debt-payoff-calculator", "net-worth-calculator", "compound-interest-calculator", "retirement-planner"];
    }

    return ["debt-payoff-calculator", "compound-interest-calculator", "net-worth-calculator", "budget-planner", "retirement-planner"];
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function buildFooterLinksList(links) {
    const list = document.createElement("div");
    list.className = "footer-tools-links";

    links.forEach(({ href, label }) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      list.appendChild(link);
    });

    return list;
  }

  function findFooterSection(footerRoot, title) {
    const normalizedTitle = normalizeText(title);
    const headings = footerRoot.querySelectorAll("h1, h2, h3, h4, h5, h6, p, strong, span");

    for (const heading of headings) {
      if (normalizeText(heading.textContent) !== normalizedTitle) {
        continue;
      }

      let candidate = heading.parentElement;
      while (candidate && candidate !== footerRoot) {
        const siblingHeadings = candidate.querySelectorAll("h1, h2, h3, h4, h5, h6, p, strong, span");
        const matches = Array.from(siblingHeadings).filter((node) => normalizeText(node.textContent) === normalizedTitle);

        if (matches.length === 1) {
          return { section: candidate, heading };
        }

        candidate = candidate.parentElement;
      }
    }

    return null;
  }

  function ensureCoreFooterLinks() {
    const footerMount = document.querySelector(selectors.footerMount);
    if (!footerMount) {
      return;
    }

    footerMount.querySelectorAll(".footer-tools-links").forEach((node) => node.remove());

    const footerRoot = footerMount.querySelector("footer, .site-footer, [class*='footer']");
    if (!footerRoot) {
      return;
    }

    const toolsLinks = [
      { href: "https://simplekit.app/tools/", label: "All Tools" },
      { href: "https://simplekit.app/retirement-planner/", label: "Retirement Planner" },
      { href: "https://simplekit.app/fire-calculator/", label: "FIRE Calculator" },
      { href: "https://simplekit.app/cpp-calculator/", label: "CPP Calculator" },
      { href: "https://simplekit.app/rrsp-vs-tfsa-calculator/", label: "RRSP / TFSA Calculator" },
      { href: "https://simplekit.app/budget-planner/", label: "Budget Planner" },
      { href: "https://simplekit.app/debt-payoff-calculator/", label: "Debt Payoff Calculator" },
      { href: "https://simplekit.app/net-worth-calculator/", label: "Net Worth Calculator" },
      { href: "https://simplekit.app/compound-interest-calculator/", label: "Compound Interest Calculator" },
      { href: "https://simplekit.app/rent-vs-buy-calculator/", label: "Rent vs Buy Calculator" },
      { href: "https://simplekit.app/mortgage-paydown-vs-invest-calculator/", label: "Mortgage Paydown vs Invest" },
      { href: "https://simplekit.app/mortgage-calculator/", label: "Mortgage Calculator" },
      { href: "https://simplekit.app/investment-fee-calculator/", label: "Investment Fee Calculator" },
      { href: "https://simplekit.app/travel-planner/", label: "Travel Planner" },
    ];

    const toolsSectionMatch = findFooterSection(footerRoot, "Tools");
    if (!toolsSectionMatch) {
      return;
    }

    const { section, heading } = toolsSectionMatch;
    const existingLinks = section.querySelectorAll("a");
    if (existingLinks.length > 0) {
      existingLinks.forEach((link) => link.remove());
    }

    heading.insertAdjacentElement("afterend", buildFooterLinksList(toolsLinks));
  }

  function updateContributionLabel(frequency) {
    const label = document.querySelector(selectors.contributionLabel);
    if (!label) {
      return;
    }

    label.textContent = frequency === "biweekly"
      ? "Bi-weekly contribution"
      : "Monthly contribution";
  }

  function syncPreview(result) {
    const title = document.querySelector(selectors.heroPreviewTitle);
    const text = document.querySelector(selectors.heroPreviewText);

    if (!title || !text) {
      return;
    }

    if (!result.hasEssentials) {
      title.textContent = "3 to 6 months";
      text.textContent = "Many people begin with a cash buffer equal to a few months of essential expenses, then adjust for income stability and household needs.";
      return;
    }

    title.textContent = `${result.targetMonths} months`;
    text.textContent = `${formatCurrency(result.targetFund)} based on ${formatCurrency(result.monthlyExpenses)} of essential monthly expenses.`;
  }

  function buildCards(result) {
    const cards = [
      {
        label: "Your target fund",
        value: result.hasEssentials ? formatCurrency(result.targetFund) : "Add essentials",
        copy: result.hasEssentials ? `${result.targetMonths} months of essential expenses.` : "This starts with your monthly essentials.",
      },
      {
        label: "Saved so far",
        value: formatCurrency(result.countedSavings),
        copy: result.lumpSum > 0 ? `Includes a ${formatCurrency(result.lumpSum)} lump-sum boost.` : "Cash currently counted toward your target.",
      },
      {
        label: "Still needed",
        value: result.hasEssentials ? formatCurrency(result.remainingGap) : "Not calculated",
        copy: result.remainingGap > 0 ? "Amount left to fully fund this target." : "You are already at or above your current target.",
      },
      {
        label: "Time to target",
        value: result.hasEssentials ? formatMonths(result.monthsToTarget) : "Add essentials",
        copy: Number.isFinite(result.monthsToTarget) ? `Estimated target date: ${result.targetDate}. Planning estimate only.` : "Add or increase contributions to create a timeline.",
      },
    ];

    if (result.annualRate > 0) {
      cards.push({
        label: "Interest assumption",
        value: `${result.annualRatePercent}%`,
        copy: "Included as a modest savings estimate, not a guaranteed return.",
      });
    }

    return cards;
  }

  function renderResults() {
    const resultCards = document.querySelector(selectors.resultCards);
    const summaryHeadline = document.querySelector(selectors.summaryHeadline);
    const summaryText = document.querySelector(selectors.summaryText);
    const nextStepText = document.querySelector(selectors.nextStepText);
    const progressLabel = document.querySelector(selectors.progressLabel);
    const progressText = document.querySelector(selectors.progressText);
    const progressFill = document.querySelector(selectors.progressFill);
    const progressBar = document.querySelector(selectors.progressBar);
    const guidanceText = document.querySelector(selectors.guidanceText);
    const targetMonthsSummary = document.querySelector(selectors.targetMonthsSummary);
    const relatedIntro = document.querySelector(selectors.relatedIntro);
    const customTargetBadge = document.querySelector(selectors.customTargetBadge);
    const relatedGrid = document.querySelector(selectors.relatedGrid);
    const summaryCard = document.querySelector(selectors.summaryCard);
    const guidancePanel = document.querySelector(selectors.guidancePanel);

    if (!resultCards || !summaryHeadline || !summaryText || !nextStepText || !progressLabel || !progressText || !progressFill || !progressBar || !guidanceText || !targetMonthsSummary || !relatedIntro || !relatedGrid || !summaryCard || !guidancePanel) {
      return;
    }

    const result = calculatePlan(state);
    const summary = buildSummary(result);
    const cards = buildCards(result);
    const progressValue = Math.round(Math.min(result.percentComplete, 1) * 100);
    const monthsLabel = Number.isInteger(result.targetMonths) ? String(result.targetMonths) : result.targetMonths.toFixed(1);

    summaryHeadline.textContent = summary.headline;
    summaryText.textContent = summary.text;
    nextStepText.textContent = summary.nextStep;
    summaryCard.classList.toggle("is-funded", result.hasEssentials && result.remainingGap <= 0);

    targetMonthsSummary.textContent = result.hasEssentials
      ? `Current target: ${monthsLabel} months, or ${formatCurrency(result.targetFund)} based on ${formatCurrency(result.monthlyExpenses)} per month.`
      : "Default target: 6 months. Add your monthly essentials to calculate the dollar amount.";

    if (customTargetBadge) {
      customTargetBadge.hidden = state.targetPreset !== "custom";
    }

    resultCards.innerHTML = cards.map((card) => `
      <article class="result-card">
        <span class="trust-label">${escapeHtml(card.label)}</span>
        <strong class="result-value">${escapeHtml(card.value)}</strong>
        <p>${escapeHtml(card.copy)}</p>
      </article>
    `).join("");

    progressLabel.textContent = `${formatPercent(Math.min(result.percentComplete, 1))} funded`;
    progressText.textContent = result.lumpSum > 0
      ? `Includes your ${formatCurrency(result.lumpSum)} lump sum.`
      : "Current savings counted toward this target.";
    progressFill.style.width = `${progressValue}%`;
    progressBar.setAttribute("aria-valuenow", String(progressValue));
    progressBar.setAttribute("aria-valuetext", `${progressValue}% of target funded`);
    guidanceText.textContent = buildGuidance(result, state);
    relatedIntro.textContent = buildNextToolCopy(result);
    guidancePanel.open = result.hasEssentials && (
      state.targetPreset === "custom"
      || state.incomeStability === "variable"
      || state.dependents === "one-plus"
      || result.annualRate > 0
      || (!Number.isFinite(result.monthsToTarget) && result.remainingGap > 0)
    );

    const preferredOrder = buildRelatedToolOrder(result);
    const cardsByHost = Array.from(relatedGrid.querySelectorAll(".related-card")).reduce((map, card) => {
      map.set(new URL(card.href).host, card);
      return map;
    }, new Map());
    preferredOrder.forEach((host) => {
      const card = cardsByHost.get(host);
      if (card) {
        relatedGrid.appendChild(card);
      }
    });

    syncPreview(result);
  }

  function syncUrl() {
    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (value !== "") {
        params.set(key, value);
      }
    });

    const query = params.toString();
    window.history.replaceState({}, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
  }

  function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (![...params.keys()].length) {
      setFormState(DEFAULT_STATE);
      return;
    }

    setFormState({
      monthlyExpenses: params.get("monthlyExpenses") || "",
      targetPreset: params.get("targetPreset") || DEFAULT_STATE.targetPreset,
      customTargetMonths: parseNumber(params.get("customTargetMonths"), 1) ?? DEFAULT_STATE.customTargetMonths,
      currentSavings: params.get("currentSavings") || "",
      monthlyContribution: params.get("monthlyContribution") || "",
      annualRate: params.get("annualRate") || "",
      contributionFrequency: params.get("contributionFrequency") || DEFAULT_STATE.contributionFrequency,
      lumpSum: params.get("lumpSum") || "",
      incomeStability: params.get("incomeStability") || DEFAULT_STATE.incomeStability,
      dependents: params.get("dependents") || DEFAULT_STATE.dependents,
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

  async function copyShareLink() {
    const feedback = document.querySelector(selectors.shareFeedback);
    const shareUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);
      if (feedback) {
        feedback.textContent = "Calculator link copied.";
      }
    } catch (error) {
      if (feedback) {
        feedback.textContent = `Copy failed. Use this link manually: ${shareUrl}`;
      }
    }
  }

  function handleInput() {
    state = readFormState();
    updateContributionLabel(state.contributionFrequency);
    renderResults();
    syncUrl();
  }

  function bindEvents() {
    const form = getForm();
    if (form) {
      form.querySelectorAll('input[name="targetPreset"]').forEach((field) => {
        field.addEventListener("change", (event) => {
          syncCustomMonthsWithPreset(event.target.value);
          handleInput();
        });
      });

      form.elements.customTargetMonths?.addEventListener("input", () => {
        const customValue = parseNumber(form.elements.customTargetMonths.value, 1) ?? 6;
        const matchingPreset = form.querySelector(`input[name="targetPreset"][value="${customValue}"]`);
        if (matchingPreset) {
          matchingPreset.checked = true;
        } else {
          form.querySelectorAll('input[name="targetPreset"]').forEach((field) => {
            field.checked = false;
          });
        }
        handleInput();
      });

      form.addEventListener("input", handleInput);
      form.addEventListener("change", handleInput);
    }

    document.querySelector(selectors.exampleBtn)?.addEventListener("click", () => {
      setFormState(EXAMPLE_STATE);
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
    updateContributionLabel(state.contributionFrequency);
    bindEvents();
    renderResults();
    syncUrl();
    ensureCoreFooterLinks();
    window.setTimeout(ensureCoreFooterLinks, 300);
    window.setTimeout(ensureCoreFooterLinks, 1000);
  }

  initialize();
})();
