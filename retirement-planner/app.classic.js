/* Auto-generated classic bundle fallback for file:// usage */

/* FILE: src/model/constants.js */
const APP = {
  storageKey: "retirementPlanner.plan.v2",
  version: 4,
  currentYear: new Date().getFullYear(),
  defaultProvince: "NL",
};


const PROVINCES = {
  NL: "Newfoundland and Labrador",
  PE: "Prince Edward Island",
  NS: "Nova Scotia",
  NB: "New Brunswick",
  QC: "Quebec",
  ON: "Ontario",
  MB: "Manitoba",
  SK: "Saskatchewan",
  AB: "Alberta",
  BC: "British Columbia",
};

const RISK_RETURNS = {
  conservative: 0.04,
  balanced: 0.055,
  aggressive: 0.07,
};

const TAX_BRACKETS = {
  federal: {
    thresholds: [0, 57375, 114750, 177882, 253414],
    rates: [0.15, 0.205, 0.26, 0.29, 0.33],
  },
  provincial: {
    NL: { thresholds: [0, 43198, 86395, 154244, 215943, 275870, 551739, 1103478], rates: [0.087, 0.145, 0.158, 0.178, 0.198, 0.208, 0.213, 0.218] },
    PE: { thresholds: [0, 32656, 64313, 105000, 140000], rates: [0.098, 0.138, 0.167, 0.176, 0.19] },
    NS: { thresholds: [0, 29590, 59180, 93000, 150000], rates: [0.0879, 0.1495, 0.1667, 0.175, 0.21] },
    NB: { thresholds: [0, 49958, 99916, 185064], rates: [0.094, 0.14, 0.16, 0.195] },
    QC: { thresholds: [0, 51780, 103545, 126000], rates: [0.14, 0.19, 0.24, 0.2575] },
    ON: { thresholds: [0, 52886, 105775, 150000, 220000], rates: [0.0505, 0.0915, 0.1116, 0.1216, 0.1316] },
    MB: { thresholds: [0, 47000, 100000], rates: [0.108, 0.1275, 0.174] },
    SK: { thresholds: [0, 52057, 148734], rates: [0.105, 0.125, 0.145] },
    AB: { thresholds: [0, 151234, 181481, 241974, 362961], rates: [0.1, 0.12, 0.13, 0.14, 0.15] },
    BC: { thresholds: [0, 47937, 95875, 110076, 133664, 181232, 252752], rates: [0.0506, 0.077, 0.105, 0.1229, 0.147, 0.168, 0.205] },
  },
};

const RRIF_MIN_WITHDRAWAL = {
  71: 0.0528,
  72: 0.054,
  73: 0.0553,
  74: 0.0567,
  75: 0.0582,
  76: 0.0598,
  77: 0.0617,
  78: 0.0636,
  79: 0.0658,
  80: 0.0682,
  81: 0.0708,
  82: 0.0738,
  83: 0.0771,
  84: 0.0808,
  85: 0.0851,
  86: 0.0899,
  87: 0.0955,
  88: 0.1021,
  89: 0.1099,
  90: 0.1192,
  91: 0.1306,
  92: 0.1449,
  93: 0.1634,
  94: 0.1879,
  95: 0.2,
};

/* FILE: src/model/calculations.js */

function adjustedCPP(amountAt65, startAge) {
  const ageDiff = startAge - 65;
  if (ageDiff >= 0) return amountAt65 * (1 + ageDiff * 0.084);
  return amountAt65 * Math.max(0.58, 1 + ageDiff * 0.072);
}

function adjustedOAS(amountAt65, startAge) {
  const safeAge = Math.max(65, startAge);
  const ageDiff = safeAge - 65;
  return amountAt65 * (1 + ageDiff * 0.072);
}

function estimateOasClawback(plan, taxableIncome, oasAmount, yearOffset) {
  if (plan?.strategy?.estimateTaxes === false) return 0;
  if (!oasAmount) return 0;
  const thresholdBase = 93000;
  const threshold = plan.assumptions.taxBracketInflation
    ? thresholdBase * Math.pow(1 + plan.assumptions.inflation, yearOffset)
    : thresholdBase;
  const excess = Math.max(0, taxableIncome - threshold);
  return Math.min(oasAmount, excess * 0.15);
}

function estimateEffectiveTaxRate(plan, income, yearOffset) {
  if (plan?.strategy?.estimateTaxes === false) return 0;
  const taxable = Math.max(0, income);
  if (taxable <= 0) return 0;

  const grossTax = estimateTotalTax(plan, taxable, yearOffset);
  const effective = grossTax / taxable;
  return clamp(effective, 0, 0.53);
}

function estimateTotalTax(plan, income, yearOffset) {
  if (plan?.strategy?.estimateTaxes === false) return 0;
  const taxable = Math.max(0, income);
  const federal = computeBracketTax(taxable, TAX_BRACKETS.federal, plan, yearOffset);
  const provincialBase = TAX_BRACKETS.provincial[plan.profile.province] || TAX_BRACKETS.provincial.NL;
  const provincial = computeBracketTax(taxable, provincialBase, plan, yearOffset);
  return federal + provincial;
}

function solveGrossWithdrawal(plan, otherTaxableIncome, targetNetFromWithdrawal, yearOffset) {
  const target = Math.max(0, targetNetFromWithdrawal);
  if (target <= 0) return 0;
  const baseTax = estimateTotalTax(plan, otherTaxableIncome, yearOffset);
  let low = target;
  let high = target * 2 + 10000;

  for (let i = 0; i < 16; i += 1) {
    const taxable = otherTaxableIncome + high;
    const totalTax = estimateTotalTax(plan, taxable, yearOffset);
    const taxOnWithdrawal = Math.max(0, totalTax - baseTax);
    const net = high - taxOnWithdrawal;
    if (net >= target) break;
    high *= 1.6;
  }

  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    const taxable = otherTaxableIncome + mid;
    const totalTax = estimateTotalTax(plan, taxable, yearOffset);
    const taxOnWithdrawal = Math.max(0, totalTax - baseTax);
    const net = mid - taxOnWithdrawal;
    if (net >= target) high = mid;
    else low = mid;
  }

  return high;
}

function getRrifMinimumRequired(plan, age, registeredBalance) {
  if (!plan.strategy.applyRrifMinimums) return 0;
  if (age < plan.strategy.rrifConversionAge) return 0;
  const factor = RRIF_MIN_WITHDRAWAL[age] ?? 0.2;
  return Math.max(0, registeredBalance) * factor;
}

function computeBracketTax(income, bracket, plan, yearOffset) {
  const inflationFactor = plan.assumptions.taxBracketInflation
    ? Math.pow(1 + plan.assumptions.inflation, yearOffset)
    : 1;

  const thresholds = bracket.thresholds.map((t) => t * inflationFactor);
  const rates = bracket.rates;

  let tax = 0;
  for (let i = 0; i < rates.length; i += 1) {
    const floor = thresholds[i];
    const ceiling = thresholds[i + 1] ?? Number.POSITIVE_INFINITY;
    const taxableInBand = Math.max(0, Math.min(income, ceiling) - floor);
    if (taxableInBand <= 0) continue;
    tax += taxableInBand * rates[i];
  }

  return tax;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/* FILE: src/model/projection.js */

function buildPlanModel(plan) {
  const currentAge = currentAgeForPlan(plan);
  const baseReturn = getReturnRate(plan);
  const base = runSimpleProjection(plan, {
    returnRate: baseReturn,
    inflationRate: plan.assumptions.inflation,
    currentAge,
  });
  const baseNoMeltdown = runSimpleProjection(plan, {
    returnRate: baseReturn,
    inflationRate: plan.assumptions.inflation,
    currentAge,
    disableMeltdown: true,
  });

  const spread = plan.assumptions.scenarioSpread;
  const scenarioDefs = [
    { key: "best", label: "Best", returnRate: baseReturn + spread },
    { key: "base", label: "Base", returnRate: baseReturn },
    { key: "worst", label: "Worst", returnRate: Math.max(0.01, baseReturn - spread) },
  ];

  const scenarioRuns = scenarioDefs.map((def) => {
    const res = runSimpleProjection(plan, {
      returnRate: def.returnRate,
      inflationRate: plan.assumptions.inflation,
      currentAge,
    });
    return {
      key: def.key,
      label: def.label,
      returnRate: def.returnRate,
      balanceAtRetirement: res.kpis.balanceAtRetirement,
      depletionAge: res.kpis.depletionAge,
      firstYearGap: res.kpis.firstYearGap,
      rows: res.rows,
    };
  });

  const scenarioRows = scenarioRuns.map((row) => ({
    label: row.label,
    returnRate: row.returnRate,
    balanceAtRetirement: row.balanceAtRetirement,
    depletionAge: row.depletionAge,
    firstYearGap: row.firstYearGap,
  }));

  const best = scenarioRuns.find((x) => x.key === "best") || { rows: base.rows };
  const worst = scenarioRuns.find((x) => x.key === "worst") || { rows: base.rows };

  const stressMatrix = [];
  const returnShifts = [-0.02, 0, 0.02];
  const inflationShifts = [-0.01, 0, 0.01];
  for (const rShift of returnShifts) {
    for (const iShift of inflationShifts) {
      const r = Math.max(0.01, baseReturn + rShift);
      const inf = clamp(plan.assumptions.inflation + iShift, 0.005, 0.08);
      const res = runSimpleProjection(plan, {
        returnRate: r,
        inflationRate: inf,
        currentAge,
      });
      stressMatrix.push({
        returnShift: rShift,
        inflationShift: iShift,
        balanceAtRetirement: res.kpis.balanceAtRetirement,
        depletionAge: res.kpis.depletionAge,
        firstYearGap: res.kpis.firstYearGap,
      });
    }
  }

  const strategyComparisons = [
    runStrategyProjection(plan, "tax-smart", currentAge),
    runStrategyProjection(plan, "rrsp-first", currentAge),
    runStrategyProjection(plan, "tfsa-first", currentAge),
  ];

  const firstRet = base.rows.find((row) => row.age === plan.profile.retirementAge) || base.rows[0];
  const spouseCurrentIncome = plan.profile.hasSpouse && plan.income.spouse.enabled
    ? Math.max(0, plan.income.spouse.pensionAmount)
    : 0;
  const taxCurrentIncome = Math.max(0, plan.income.pension.enabled ? plan.income.pension.amount : 0) + spouseCurrentIncome;
  const taxRetIncome = Math.max(0, firstRet.taxableIncome);

  return {
    base,
    baseNoMeltdown,
    best,
    worst,
    scenarioRows,
    stressMatrix,
    strategyComparisons,
    tax: {
      currentEffectiveRate: estimateEffectiveTaxRate(plan, taxCurrentIncome, 0),
      firstRetirementEffectiveRate: estimateEffectiveTaxRate(plan, taxRetIncome, Math.max(0, plan.profile.retirementAge - currentAge)),
    },
    kpis: base.kpis,
  };
}

function getReturnRate(plan) {
  const profile = plan.assumptions.riskProfile;
  return plan.assumptions.returns?.[profile]
    || plan.assumptions.returns?.balanced
    || RISK_RETURNS[profile]
    || RISK_RETURNS.balanced;
}

function runSimpleProjection(plan, options) {
  const currentAge = Number.isFinite(options.currentAge) ? options.currentAge : currentAgeForPlan(plan);
  const startYear = APP.currentYear;
  const endYear = startYear + Math.max(1, plan.profile.lifeExpectancy - currentAge);
  const retireAge = plan.profile.retirementAge;
  const birthYear = plan.profile.birthYear;
  const returnRate = options.returnRate;
  const inflationRate = options.inflationRate;
  const contributionIncrease = plan.savings.contributionIncrease;
  const disableMeltdown = Boolean(options.disableMeltdown);

  let balance = plan.savings.currentTotal;
  let depletionAge = null;
  let balanceAtRetirement = plan.savings.currentTotal;
  let totalRetirementTax = 0;

  const rows = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const age = year - birthYear;
    const retired = age >= retireAge;
    const yearsFromStart = Math.max(0, year - startYear);
    const capitalInject = getCapitalInjectAtAge(plan, age);
    const contribution = retired
      ? 0
      : plan.savings.annualContribution * Math.pow(1 + contributionIncrease, yearsFromStart);

    const pension = plan.income.pension.enabled && age >= plan.income.pension.startAge ? plan.income.pension.amount : 0;
    const cpp = age >= plan.income.cpp.startAge ? adjustedCPP(plan.income.cpp.amountAt65, plan.income.cpp.startAge) : 0;
    const oas = age >= plan.income.oas.startAge ? adjustedOAS(plan.income.oas.amountAt65, plan.income.oas.startAge) : 0;

    const spouseEnabled = plan.profile.hasSpouse && plan.income.spouse.enabled;
    const spousePension = spouseEnabled && age >= plan.income.spouse.pensionStartAge ? plan.income.spouse.pensionAmount : 0;
    const spouseCpp = spouseEnabled && age >= plan.income.spouse.cppStartAge ? adjustedCPP(plan.income.spouse.cppAmountAt65, plan.income.spouse.cppStartAge) : 0;
    const spouseOas = spouseEnabled && age >= plan.income.spouse.oasStartAge ? adjustedOAS(plan.income.spouse.oasAmountAt65, plan.income.spouse.oasStartAge) : 0;

    const guaranteedGross = pension + cpp + oas + spousePension + spouseCpp + spouseOas;

    const yearsFromRetirementStart = Math.max(0, age - retireAge);
    const targetAfterTax = retired
      ? inflateAmountToRetirement(plan.profile.desiredSpending, inflationRate, Math.max(0, retireAge - currentAge))
        * Math.pow(1 + inflationRate, yearsFromRetirementStart)
      : 0;

    let withdrawal = 0;
    let tax = 0;
    let taxableIncome = guaranteedGross;
    let guaranteedTax = 0;
    let guaranteedNet = guaranteedGross;
    let pensionNet = pension;
    let cppNet = cpp;
    let oasNet = oas;
    let spousePensionNet = spousePension;
    let spouseCppNet = spouseCpp;
    let spouseOasNet = spouseOas;
    let netFromWithdrawal = 0;
    let taxOnWithdrawal = 0;
    let netGap = 0;
    let oasClawback = 0;
    let rrifMinimum = 0;
    let plannedMeltdownWithdrawal = 0;
    let gap = 0;

    if (retired) {
      const yearOffset = Math.max(0, year - startYear);
      guaranteedTax = estimateTotalTax(plan, guaranteedGross, yearOffset);
      guaranteedNet = Math.max(0, guaranteedGross - guaranteedTax);
      const netFactor = guaranteedGross > 0 ? guaranteedNet / guaranteedGross : 1;
      pensionNet = pension * netFactor;
      cppNet = cpp * netFactor;
      oasNet = oas * netFactor;
      spousePensionNet = spousePension * netFactor;
      spouseCppNet = spouseCpp * netFactor;
      spouseOasNet = spouseOas * netFactor;
      netGap = Math.max(0, targetAfterTax - guaranteedNet);
      const requiredWithdrawal = solveGrossWithdrawal(plan, guaranteedGross, netGap, yearOffset);
      const availableForWithdrawal = Math.max(0, balance + capitalInject);
      rrifMinimum = getRrifMinimumRequired(plan, age, availableForWithdrawal);
      plannedMeltdownWithdrawal = disableMeltdown ? 0 : getPlannedMeltdownWithdrawal(plan, age, guaranteedGross, availableForWithdrawal);
      const baseNeed = Math.max(requiredWithdrawal, rrifMinimum);
      withdrawal = Math.min(baseNeed + plannedMeltdownWithdrawal, availableForWithdrawal);
      taxableIncome = guaranteedGross + withdrawal;
      tax = estimateTotalTax(plan, taxableIncome, yearOffset);
      taxOnWithdrawal = Math.max(0, tax - guaranteedTax);
      oasClawback = plan.strategy.oasClawbackModeling ? estimateOasClawback(plan, taxableIncome, oas + spouseOas, yearOffset) : 0;
      netFromWithdrawal = Math.max(0, withdrawal - taxOnWithdrawal - oasClawback);
      const netIncome = guaranteedNet + netFromWithdrawal;
      gap = netIncome - targetAfterTax;
      totalRetirementTax += tax + oasClawback;
    } else {
      tax = estimateTotalTax(plan, guaranteedGross, Math.max(0, year - startYear));
      guaranteedTax = tax;
      guaranteedNet = Math.max(0, guaranteedGross - guaranteedTax);
      const netFactor = guaranteedGross > 0 ? guaranteedNet / guaranteedGross : 1;
      pensionNet = pension * netFactor;
      cppNet = cpp * netFactor;
      oasNet = oas * netFactor;
      spousePensionNet = spousePension * netFactor;
      spouseCppNet = spouseCpp * netFactor;
      spouseOasNet = spouseOas * netFactor;
    }

    const preGrowth = retired
      ? Math.max(0, balance + capitalInject - withdrawal)
      : balance + contribution + capitalInject;
    balance = preGrowth * (1 + returnRate);

    if (!depletionAge && retired && preGrowth <= 0) depletionAge = age;
    if (age === retireAge) balanceAtRetirement = preGrowth;

    rows.push({
      year,
      age,
      balance,
      balanceStart: retired ? Math.max(0, preGrowth + withdrawal) : balance - contribution,
      contribution,
      capitalInject,
      withdrawal,
      spending: targetAfterTax,
      tax,
      taxableIncome,
      effectiveTaxRate: taxableIncome > 0 ? tax / taxableIncome : 0,
      pension,
      cpp,
      oas,
      spousePension,
      spouseCpp,
      spouseOas,
      pensionNet,
      cppNet,
      oasNet,
      spousePensionNet,
      spouseCppNet,
      spouseOasNet,
      guaranteedGross,
      guaranteedTax,
      guaranteedNet,
      netGap,
      netFromWithdrawal,
      taxOnWithdrawal,
      oasClawback,
      rrifMinimum,
      plannedMeltdownWithdrawal,
      gap,
    });
  }

  const firstRet = rows.find((row) => row.age === retireAge) || rows[0];
  const sustainableIncome = estimateSustainableIncome(rows, retireAge);

  const kpis = {
    balanceAtRetirement,
    firstYearGap: firstRet ? firstRet.gap : 0,
    depletionAge,
    firstYearGuaranteed: firstRet ? firstRet.guaranteedGross : 0,
    firstYearSpendingTarget: firstRet ? firstRet.spending : 0,
    firstYearNetGap: firstRet ? firstRet.netGap : 0,
    firstYearGrossWithdrawal: firstRet ? firstRet.withdrawal : 0,
    firstYearTaxWedge: firstRet ? firstRet.taxOnWithdrawal : 0,
    firstYearOasClawback: firstRet ? firstRet.oasClawback : 0,
    firstYearRrifMinimum: firstRet ? firstRet.rrifMinimum : 0,
    totalRetirementTax,
    firstRetirementBreakdown: {
      pension: firstRet ? firstRet.pension : 0,
      cpp: firstRet ? firstRet.cpp : 0,
      oas: firstRet ? firstRet.oas : 0,
      withdrawal: firstRet ? firstRet.withdrawal : 0,
    },
    sustainableIncome,
  };

  return { rows, kpis, returnRate };
}

function getPlannedMeltdownWithdrawal(plan, age, guaranteedGross, availableForWithdrawal) {
  if (!plan.strategy?.meltdownEnabled) return 0;
  const start = Number(plan.strategy.meltdownStartAge || plan.profile.retirementAge || 60);
  const end = Number(plan.strategy.meltdownEndAge || 65);
  if (age < start || age > end) return 0;
  let amount = Math.max(0, Number(plan.strategy.meltdownAmount || 0));
  const ceiling = Math.max(0, Number(plan.strategy.meltdownIncomeCeiling || 0));
  if (ceiling > 0) {
    amount = Math.max(0, Math.min(amount, ceiling - guaranteedGross));
  }
  return Math.min(amount, Math.max(0, availableForWithdrawal));
}

function runStrategyProjection(plan, strategyKey, currentAge) {
  const ageNowValue = Number.isFinite(currentAge) ? currentAge : currentAgeForPlan(plan);
  const retireAge = plan.profile.retirementAge;
  const deathAge = plan.profile.lifeExpectancy;
  const yearsToRetirement = Math.max(0, retireAge - ageNowValue);
  const returnRate = getReturnRate(plan);
  const inflationRate = plan.assumptions.inflation;

  const balances = growAccountsToRetirement(
    plan,
    plan.accounts,
    plan.savings.annualContribution,
    plan.savings.contributionIncrease,
    returnRate,
    yearsToRetirement
  );

  let totalTax = 0;
  let totalClawback = 0;
  let depletionAge = null;
  const snapshotsByAge = {};

  for (let age = retireAge; age <= deathAge; age += 1) {
    const yearOffset = Math.max(0, age - ageNowValue);
    const spend = inflateAmountToRetirement(plan.profile.desiredSpending, inflationRate, yearsToRetirement)
      * Math.pow(1 + inflationRate, Math.max(0, age - retireAge));

    const pension = plan.income.pension.enabled && age >= plan.income.pension.startAge ? plan.income.pension.amount : 0;
    const cpp = age >= plan.income.cpp.startAge ? adjustedCPP(plan.income.cpp.amountAt65, plan.income.cpp.startAge) : 0;
    const oas = age >= plan.income.oas.startAge ? adjustedOAS(plan.income.oas.amountAt65, plan.income.oas.startAge) : 0;
    const spouseEnabled = plan.profile.hasSpouse && plan.income.spouse.enabled;
    const spousePension = spouseEnabled && age >= plan.income.spouse.pensionStartAge ? plan.income.spouse.pensionAmount : 0;
    const spouseCpp = spouseEnabled && age >= plan.income.spouse.cppStartAge ? adjustedCPP(plan.income.spouse.cppAmountAt65, plan.income.spouse.cppStartAge) : 0;
    const spouseOas = spouseEnabled && age >= plan.income.spouse.oasStartAge ? adjustedOAS(plan.income.spouse.oasAmountAt65, plan.income.spouse.oasStartAge) : 0;
    const guaranteedGross = pension + cpp + oas + spousePension + spouseCpp + spouseOas;
    const capitalInject = getCapitalInjectAtAge(plan, age);
    if (capitalInject > 0) balances.cash += capitalInject;

    let guessNeed = Math.max(0, spend - guaranteedGross * (1 - estimateEffectiveTaxRate(plan, guaranteedGross, yearOffset)));
    let chosen = { rrsp: 0, tfsa: 0, nonRegistered: 0, cash: 0, total: 0 };
    let taxes = 0;
    let clawback = 0;

    for (let i = 0; i < 5; i += 1) {
      const order = getWithdrawalOrder(strategyKey, {
        balances,
        taxableBeforeWithdrawals: guaranteedGross,
        oas,
      });
      chosen = distributeFromAccounts(order, balances, guessNeed);
      const taxableDraw = chosen.rrsp + chosen.nonRegistered * 0.3;
      const taxableTotal = guaranteedGross + taxableDraw;
      taxes = taxableTotal * estimateEffectiveTaxRate(plan, taxableTotal, yearOffset);
      clawback = plan.strategy.oasClawbackModeling ? estimateOasClawback(plan, taxableTotal, oas, yearOffset) : 0;
      const net = guaranteedGross + chosen.total - taxes - clawback;
      const short = spend - net;
      if (Math.abs(short) < 10) break;
      guessNeed = Math.max(0, guessNeed + short);
      if (sumAccounts(balances) <= 0) break;
    }

    totalTax += taxes;
    totalClawback += clawback;

    if (age === retireAge || age === 65 || age === 71) {
      snapshotsByAge[age] = {
        age,
        guaranteedGross,
        spend,
        tax: taxes,
        clawback,
        accountWithdrawals: {
          rrsp: chosen.rrsp,
          tfsa: chosen.tfsa,
          nonRegistered: chosen.nonRegistered,
          cash: chosen.cash,
          total: chosen.total,
        },
      };
    }

    if (!depletionAge && sumAccounts(balances) <= 0) depletionAge = age;

    for (const key of Object.keys(balances)) {
      balances[key] *= 1 + returnRate;
    }
  }

  const reasons = strategyReasons(strategyKey);

  return {
    key: strategyKey,
    label: strategyLabel(strategyKey),
    totalTax,
    totalClawback,
    depletionAge,
    reasons,
    snapshotsByAge,
  };
}

function growAccountsToRetirement(plan, accounts, annualContribution, contributionIncrease, returnRate, years) {
  const next = {
    rrsp: Math.max(0, accounts.rrsp),
    tfsa: Math.max(0, accounts.tfsa),
    nonRegistered: Math.max(0, accounts.nonRegistered),
    cash: Math.max(0, accounts.cash),
  };

  const total = sumAccounts(next);
  if (total <= 0) {
    next.rrsp = plan.savings.currentTotal * 0.5;
    next.tfsa = plan.savings.currentTotal * 0.3;
    next.nonRegistered = plan.savings.currentTotal * 0.15;
    next.cash = plan.savings.currentTotal * 0.05;
  }

  const startAge = currentAgeForPlan(plan);
  for (let i = 0; i < years; i += 1) {
    const age = startAge + i;
    const capitalInject = getCapitalInjectAtAge(plan, age);
    if (capitalInject > 0) next.cash += capitalInject;
    const contributionThisYear = annualContribution * Math.pow(1 + contributionIncrease, i);
    next.rrsp = (next.rrsp + contributionThisYear * 0.5) * (1 + returnRate);
    next.tfsa = (next.tfsa + contributionThisYear * 0.35) * (1 + returnRate);
    next.nonRegistered = (next.nonRegistered + contributionThisYear * 0.1) * (1 + returnRate);
    next.cash += contributionThisYear * 0.05;
  }

  return next;
}

function distributeFromAccounts(order, balances, amount) {
  let remaining = Math.max(0, amount);
  const draw = { rrsp: 0, tfsa: 0, nonRegistered: 0, cash: 0, total: 0 };

  for (const key of order) {
    if (remaining <= 0) break;
    const available = Math.max(0, balances[key]);
    const used = Math.min(available, remaining);
    balances[key] = available - used;
    draw[key] += used;
    draw.total += used;
    remaining -= used;
  }

  return draw;
}

function getWithdrawalOrder(strategyKey, context) {
  if (strategyKey === "rrsp-first") return ["rrsp", "nonRegistered", "tfsa", "cash"];
  if (strategyKey === "tfsa-first") return ["tfsa", "cash", "nonRegistered", "rrsp"];

  const threshold = 93000;
  if (context.taxableBeforeWithdrawals > threshold * 0.9) return ["tfsa", "cash", "nonRegistered", "rrsp"];
  if (context.taxableBeforeWithdrawals < 50000 && context.balances.rrsp > context.balances.tfsa) {
    return ["rrsp", "nonRegistered", "tfsa", "cash"];
  }
  return ["nonRegistered", "tfsa", "rrsp", "cash"];
}

function strategyReasons(strategyKey) {
  if (strategyKey === "rrsp-first") {
    return [
      "Draws taxable registered funds earlier to reduce future forced RRIF pressure.",
      "Can work when current taxable income is relatively low.",
      "May reduce late-retirement concentration in fully taxable accounts.",
    ];
  }
  if (strategyKey === "tfsa-first") {
    return [
      "Uses tax-free balances first to reduce immediate tax drag.",
      "Keeps taxable income lower in early years.",
      "Can increase later taxes if registered balances remain large.",
    ];
  }
  return [
    "Prioritizes lower immediate tax impact while monitoring clawback risk.",
    "Adjusts order based on taxable income level and account mix.",
    "Targets smoother taxes across retirement years rather than one strict order.",
  ];
}

function strategyLabel(key) {
  if (key === "rrsp-first") return "RRSP-first";
  if (key === "tfsa-first") return "TFSA-first";
  return "Tax-smart";
}

function estimateSustainableIncome(rows, retireAge) {
  const retirementRows = rows.filter((row) => row.age >= retireAge);
  if (!retirementRows.length) return 0;
  const withdrawals = retirementRows.map((row) => row.withdrawal);
  const avg = withdrawals.reduce((sum, value) => sum + value, 0) / withdrawals.length;
  return avg;
}

function inflateAmountToRetirement(amount, inflationRate, years) {
  return amount * Math.pow(1 + inflationRate, Math.max(0, years));
}

function getCapitalInjectAtAge(plan, age) {
  const items = Array.isArray(plan.savings?.capitalInjects) ? plan.savings.capitalInjects : [];
  return items.reduce((sum, item) => {
    if (!item.enabled) return sum;
    return Number(item.age) === Number(age) ? sum + Math.max(0, Number(item.amount || 0)) : sum;
  }, 0);
}

function sumAccounts(accounts) {
  return Math.max(0, accounts.rrsp) + Math.max(0, accounts.tfsa) + Math.max(0, accounts.nonRegistered) + Math.max(0, accounts.cash);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function currentAgeForPlan(plan) {
  return APP.currentYear - Number(plan.profile?.birthYear || APP.currentYear);
}

/* FILE: src/model/score.js */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeCoverageScore(plan, model) {
  const rows = model?.base?.rows || [];
  const retireAge = Number(plan.profile.retirementAge || 65);
  const lifeExpectancy = Number(plan.profile.lifeExpectancy || 90);
  const firstRet = rows.find((r) => r.age === retireAge) || rows[0];
  const retirementRows = rows.filter((r) => r.age >= retireAge);
  const row70 = rows.find((r) => r.age === 70) || firstRet;
  const row71 = rows.find((r) => r.age === 71) || firstRet;

  const coverageRatio = firstRet?.spending > 0 ? firstRet.guaranteedNet / firstRet.spending : 1;
  const coveragePoints = clamp(coverageRatio, 0, 1) * 35;

  const depletionAge = model?.kpis?.depletionAge;
  const longevityRatio = depletionAge
    ? (depletionAge - retireAge) / Math.max(1, lifeExpectancy - retireAge)
    : 1;
  const longevityPoints = clamp(longevityRatio, 0, 1) * 30;

  const avgTaxWedgeRate = retirementRows.length
    ? retirementRows.reduce((sum, r) => {
      const gross = Number(r.withdrawal || 0);
      const wedge = Number((r.taxOnWithdrawal || 0) + (r.oasClawback || 0));
      return sum + (gross > 0 ? wedge / gross : 0);
    }, 0) / retirementRows.length
    : 0;
  const taxEfficiencyPoints = clamp(1 - (avgTaxWedgeRate / 0.45), 0, 1) * 15;

  const oasTotal = retirementRows.reduce((sum, r) => sum + (r.oas || 0) + (r.spouseOas || 0), 0);
  const clawbackTotal = retirementRows.reduce((sum, r) => sum + (r.oasClawback || 0), 0);
  const clawbackRatio = oasTotal > 0 ? clawbackTotal / oasTotal : 0;
  const clawbackPoints = plan.strategy.oasClawbackModeling
    ? clamp(1 - (clawbackRatio / 0.5), 0, 1) * 10
    : 10;

  const rrifShockJump = Math.max(0, Number(row71?.taxableIncome || 0) - Number(row70?.taxableIncome || 0));
  const rrifShockPoints = plan.strategy.applyRrifMinimums
    ? clamp(1 - (rrifShockJump / 50000), 0, 1) * 10
    : 10;

  const total = Math.round(coveragePoints + longevityPoints + taxEfficiencyPoints + clawbackPoints + rrifShockPoints);

  let band = "Very Strong";
  if (total < 60) band = "Needs Attention";
  else if (total < 75) band = "Moderate";
  else if (total < 90) band = "Strong";

  return {
    total,
    band,
    subs: {
      coverage: Math.round(coveragePoints), // /35
      longevity: Math.round(longevityPoints), // /30
      taxDrag: Math.round(taxEfficiencyPoints), // /15
      clawback: Math.round(clawbackPoints), // /10
      rrifShock: Math.round(rrifShockPoints), // /10
    },
    metrics: {
      coverageRatio,
      depletionAge: depletionAge || null,
      avgTaxWedgeRate,
      clawbackRatio,
      rrifShockJump,
    },
  };
}

/* FILE: src/model/timingSim.js */
function rowAt(rows, age) {
  return rows.find((r) => r.age === age) || rows[0] || null;
}

function cumulativeBenefit(rows, keyA, keyB = null) {
  return rows.reduce((sum, row) => {
    const a = Number(row[keyA] || 0);
    const b = keyB ? Number(row[keyB] || 0) : 0;
    return sum + a + b;
  }, 0);
}

function buildTimingPreview({ plan, sim, buildModel }) {
  const baseModel = buildModel(plan);
  const previewPlan = (typeof structuredClone === "function")
    ? structuredClone(plan)
    : JSON.parse(JSON.stringify(plan));

  previewPlan.income.cpp.startAge = Number(sim.cppStartAge);
  previewPlan.income.oas.startAge = Number(sim.oasStartAge);
  if (sim.linkTiming) {
    const delta = Number(sim.cppStartAge) - 60;
    previewPlan.income.oas.startAge = Math.min(70, Math.max(65, 65 + delta));
  }

  const previewModel = buildModel(previewPlan);
  const retireAge = Number(plan.profile.retirementAge || 65);
  const baseRow = rowAt(baseModel.base.rows, retireAge);
  const previewRow = rowAt(previewModel.base.rows, retireAge);

  const baseRows = baseModel.base.rows.filter((r) => r.age >= retireAge);
  const previewRows = previewModel.base.rows.filter((r) => r.age >= retireAge);

  const baseLifetimeBenefits = cumulativeBenefit(baseRows, "cpp", "oas");
  const previewLifetimeBenefits = cumulativeBenefit(previewRows, "cpp", "oas");

  return {
    plan: previewPlan,
    model: previewModel,
    deltas: {
      lifetimeBenefits: previewLifetimeBenefits - baseLifetimeBenefits,
      effectiveTaxAtRetire: (previewRow?.effectiveTaxRate || 0) - (baseRow?.effectiveTaxRate || 0),
      clawbackAtRetire: (previewRow?.oasClawback || 0) - (baseRow?.oasClawback || 0),
      grossWithdrawalAtRetire: (previewRow?.withdrawal || 0) - (baseRow?.withdrawal || 0),
    },
    baseRow,
    previewRow,
  };
}


/* FILE: src/model/meltdown.js */
function rowAt(rows, age) {
  return rows.find((r) => r.age === age) || null;
}

function buildMeltdownComparison(model, plan) {
  const withRows = model?.base?.rows || [];
  const baseRows = model?.baseNoMeltdown?.rows || withRows;
  const startAge = Number(plan.profile.retirementAge || 65);
  const age71With = rowAt(withRows, 71);
  const age71Base = rowAt(baseRows, 71);

  const withRetirementRows = withRows.filter((r) => r.age >= startAge);
  const baseRetirementRows = baseRows.filter((r) => r.age >= startAge);

  const sum = (rows, key) => rows.reduce((acc, r) => acc + Number(r[key] || 0), 0);
  const maxRate = (rows) => rows.reduce((m, r) => Math.max(m, Number(r.effectiveTaxRate || 0)), 0);

  const baseClawback = sum(baseRetirementRows, "oasClawback");
  const withClawback = sum(withRetirementRows, "oasClawback");
  const baseTax = sum(baseRetirementRows, "tax");
  const withTax = sum(withRetirementRows, "tax");

  return {
    enabled: Boolean(plan.strategy.meltdownEnabled),
    before: {
      peakEffectiveTax: maxRate(baseRetirementRows),
      totalClawback: baseClawback,
      totalTax: baseTax,
      rrifShockAt71: age71Base ? age71Base.rrifMinimum : 0,
      depletionAge: model?.baseNoMeltdown?.kpis?.depletionAge ?? model?.kpis?.depletionAge ?? null,
    },
    after: {
      peakEffectiveTax: maxRate(withRetirementRows),
      totalClawback: withClawback,
      totalTax: withTax,
      rrifShockAt71: age71With ? age71With.rrifMinimum : 0,
      depletionAge: model?.kpis?.depletionAge ?? null,
    },
  };
}


/* FILE: src/model/diff.js */
function rowAt(rows, age) {
  if (!Array.isArray(rows) || !rows.length) return null;
  return rows.find((r) => r.age === age) || rows[0];
}

function formatDelta(value) {
  const n = Number(value || 0);
  if (Math.abs(n) < 0.5) return "$0";
  if (n > 0) return `+$${Math.round(n).toLocaleString()}`;
  return `-$${Math.abs(Math.round(n)).toLocaleString()}`;
}

function formatYearDelta(value) {
  const n = Number(value || 0);
  if (n > 0) return `+${n} years`;
  if (n < 0) return `${n} years`;
  return "no change";
}

function buildChangeSummary(beforeModel, afterModel, plan) {
  if (!beforeModel || !afterModel) return null;
  const retirementAge = Number(plan.profile.retirementAge || 65);
  const before65 = rowAt(beforeModel.base.rows, 65);
  const after65 = rowAt(afterModel.base.rows, 65);
  const before71 = rowAt(beforeModel.base.rows, 71);
  const after71 = rowAt(afterModel.base.rows, 71);

  const depletionBefore = beforeModel.kpis.depletionAge || null;
  const depletionAfter = afterModel.kpis.depletionAge || null;
  const depletionDelta = (depletionAfter != null && depletionBefore != null)
    ? depletionAfter - depletionBefore
    : null;
  const beforeRows = beforeModel.base.rows.filter((r) => r.age >= retirementAge);
  const afterRows = afterModel.base.rows.filter((r) => r.age >= retirementAge);
  const sum = (rows, key) => rows.reduce((acc, row) => acc + Number(row[key] || 0), 0);
  const peak = (rows, key) => rows.reduce((max, row) => Math.max(max, Number(row[key] || 0)), 0);
  const beforeClawbackPeak = peak(beforeRows, "oasClawback");
  const afterClawbackPeak = peak(afterRows, "oasClawback");
  const beforeCoverage = before65?.spending > 0 ? (before65.guaranteedNet / before65.spending) : 1;
  const afterCoverage = after65?.spending > 0 ? (after65.guaranteedNet / after65.spending) : 1;
  const beforeWedge = Number((before65?.taxOnWithdrawal || 0) + (before65?.oasClawback || 0));
  const afterWedge = Number((after65?.taxOnWithdrawal || 0) + (after65?.oasClawback || 0));

  return {
    title: "What changed?",
    bullets: [
      `OAS clawback at age 65: ${formatDelta((after65?.oasClawback || 0) - (before65?.oasClawback || 0))}; peak clawback: ${formatDelta(afterClawbackPeak - beforeClawbackPeak)}.`,
      `Gross withdrawal at age 65: ${formatDelta((after65?.withdrawal || 0) - (before65?.withdrawal || 0))}.`,
      `Tax wedge at age 65: ${formatDelta(afterWedge - beforeWedge)}.`,
      `RRIF minimum at age 71: ${formatDelta((after71?.rrifMinimum || 0) - (before71?.rrifMinimum || 0))}.`,
      `Coverage at age 65: ${((afterCoverage - beforeCoverage) * 100).toFixed(1)} percentage points.`,
      depletionDelta == null
        ? `Depletion age changed from ${depletionBefore ?? "none"} to ${depletionAfter ?? "none"}.`
        : `Depletion age: ${formatYearDelta(depletionDelta)}.`,
    ],
    before: {
      age65: {
        gross: before65?.withdrawal || 0,
        tax: before65?.tax || 0,
        wedge: beforeWedge,
        clawback: before65?.oasClawback || 0,
        coverage: beforeCoverage,
      },
      age71: {
        rrifMinimum: before71?.rrifMinimum || 0,
      },
      retirementTaxTotal: sum(beforeRows, "tax"),
      depletionAge: depletionBefore,
    },
    after: {
      age65: {
        gross: after65?.withdrawal || 0,
        tax: after65?.tax || 0,
        wedge: afterWedge,
        clawback: after65?.oasClawback || 0,
        coverage: afterCoverage,
      },
      age71: {
        rrifMinimum: after71?.rrifMinimum || 0,
      },
      retirementTaxTotal: sum(afterRows, "tax"),
      depletionAge: depletionAfter,
    },
    createdAt: Date.now(),
  };
}

/* FILE: src/model/risks.js */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function severityFromScore(score) {
  if (score >= 67) return "High";
  if (score >= 34) return "Medium";
  return "Low";
}

function rowAt(rows, age) {
  return (rows || []).find((r) => r.age === age) || null;
}

function buildRiskDiagnostics(plan, model, selectedAge) {
  const rows = (model?.base?.rows || []).filter((r) => r.age >= plan.profile.retirementAge);
  if (!rows.length) return [];
  const selected = rowAt(rows, selectedAge) || rows[0];
  const risks = [];

  if (!plan.strategy.oasClawbackModeling) {
    risks.push({
      key: "clawback-off",
      title: "OAS clawback modeling is OFF",
      severity: "Medium",
      detail: "Turn it on to estimate potential OAS recovery tax in higher-income years.",
      learnLabel: "Learn OAS clawback",
      learnTarget: "learn",
      actionLabel: "Enable clawback",
      action: "enable-clawback",
    });
  } else {
    const peakClawback = rows.reduce((m, r) => Math.max(m, Number(r.oasClawback || 0)), 0);
    const oasAtSelected = Number((selected.oas || 0) + (selected.spouseOas || 0));
    const clawbackRatio = oasAtSelected > 0 ? Number(selected.oasClawback || 0) / oasAtSelected : 0;
    const score = clamp((peakClawback / 5000) * 100 + (clawbackRatio * 100), 0, 100);
    risks.push({
      key: "clawback",
      title: "OAS clawback risk",
      severity: severityFromScore(score),
      detail: `Selected year clawback: $${Math.round(selected.oasClawback || 0).toLocaleString()} | peak: $${Math.round(peakClawback).toLocaleString()}.`,
      learnLabel: "Learn OAS clawback",
      learnTarget: "learn",
      actionLabel: "Test CPP/OAS timing",
      action: "focus-timing-sim",
    });
  }

  if (!plan.strategy.applyRrifMinimums) {
    risks.push({
      key: "rrif-off",
      title: "RRIF minimum modeling is OFF",
      severity: "Medium",
      detail: "RRIF minimums can force withdrawals later in retirement and raise taxable income.",
      learnLabel: "Learn RRIF basics",
      learnTarget: "learn",
      actionLabel: "Enable RRIF rules",
      action: "enable-rrif",
    });
  } else {
    const convAge = Number(plan.strategy.rrifConversionAge || 71);
    const convRow = rowAt(rows, convAge);
    const prevRow = rowAt(rows, convAge - 1);
    const jump = Math.max(0, Number(convRow?.taxableIncome || 0) - Number(prevRow?.taxableIncome || 0));
    const rrifMin = Number(convRow?.rrifMinimum || 0);
    const baseSpend = Math.max(1, Number(convRow?.spending || selected.spending || 1));
    const shockRatio = rrifMin / baseSpend;
    const score = clamp((shockRatio * 100) + ((jump / 20000) * 100), 0, 100);
    risks.push({
      key: "rrif",
      title: "RRIF shock at conversion age",
      severity: severityFromScore(score),
      detail: `Age ${convAge} RRIF minimum: $${Math.round(rrifMin).toLocaleString()} | taxable income jump: $${Math.round(jump).toLocaleString()}.`,
      learnLabel: "Learn RRIF minimums",
      learnTarget: "learn",
      actionLabel: "Try RRSP meltdown",
      action: "focus-meltdown-sim",
    });
  }

  const gross = Number(selected.withdrawal || 0);
  const wedge = Number((selected.taxOnWithdrawal || 0) + (selected.oasClawback || 0));
  const wedgeRate = gross > 0 ? wedge / gross : 0;
  if (gross > 0) {
    risks.push({
      key: "tax-drag",
      title: "Tax drag risk",
      severity: wedgeRate > 0.3 ? "High" : (wedgeRate > 0.2 ? "Medium" : "Low"),
      detail: `Tax wedge rate this year: ${(wedgeRate * 100).toFixed(1)}% of gross withdrawals.`,
      learnLabel: "Learn gross vs net",
      learnTarget: "learn",
      actionLabel: "Review strategy",
      action: "open-advanced",
    });
  }

  const depletionAge = model?.kpis?.depletionAge;
  const yearsShort = depletionAge ? plan.profile.lifeExpectancy - depletionAge : 0;
  if (depletionAge && yearsShort > 0) {
    risks.push({
      key: "depletion",
      title: "Longevity / depletion risk",
      severity: yearsShort >= 5 ? "High" : "Medium",
      detail: `Savings deplete around age ${depletionAge}, about ${yearsShort} years before life expectancy.`,
      learnLabel: "Learn longevity planning",
      learnTarget: "learn",
      actionLabel: "Run stress test",
      action: "open-stress",
    });
  } else {
    risks.push({
      key: "depletion-buffer",
      title: "Longevity buffer",
      severity: "Low",
      detail: "Projected savings last through the full planning horizon under current assumptions.",
      learnLabel: "Learn stress testing",
      learnTarget: "learn",
      actionLabel: "Run stress test",
      action: "open-stress",
    });
  }

  const dependency = selected.spending > 0 ? (selected.netFromWithdrawal || 0) / selected.spending : 0;
  if (dependency > 0.5) {
    risks.push({
      key: "concentration",
      title: "Income concentration risk",
      severity: dependency > 0.75 ? "High" : "Medium",
      detail: `${Math.round(dependency * 100)}% of spending is funded by savings withdrawals in the selected year.`,
      learnLabel: "Learn income sources",
      learnTarget: "learn",
      actionLabel: "Adjust income timing",
      action: "focus-timing-sim",
    });
  }

  return risks.slice(0, 6);
}


/* FILE: src/model/planStatus.js */

const PLAN_STATUS_THRESHOLDS = {
  strongScore: 85,
  mostlyOnTrackScore: 72,
  tightScore: 58,
  strongCoverage: 1,
  workableCoverage: 0.9,
  tightCoverage: 0.75,
  highTaxDrag: 0.28,
};

function firstRetirementRow(plan, model) {
  const rows = model?.base?.rows || [];
  return rows.find((row) => row.age === plan.profile.retirementAge) || rows[0] || null;
}

function peakClawback(rows) {
  return (rows || []).reduce((max, row) => Math.max(max, Number(row.oasClawback || 0)), 0);
}

function avgTaxDrag(rows) {
  const retirementRows = (rows || []).filter((row) => row.age != null);
  if (!retirementRows.length) return 0;
  return retirementRows.reduce((sum, row) => {
    const gross = Number(row.withdrawal || 0);
    const wedge = Number((row.taxOnWithdrawal || 0) + (row.oasClawback || 0));
    return sum + (gross > 0 ? wedge / gross : 0);
  }, 0) / retirementRows.length;
}

function buildPlanStatus(plan, model) {
  const score = computeCoverageScore(plan, model);
  const row = firstRetirementRow(plan, model);
  const rows = (model?.base?.rows || []).filter((r) => r.age >= plan.profile.retirementAge);
  const coverageRatio = score.metrics.coverageRatio || 0;
  const depletionAge = model?.kpis?.depletionAge || null;
  const worst = (model?.scenarioRows || []).find((item) => item.label === "Worst") || null;
  const taxDrag = avgTaxDrag(rows);
  const clawbackPeak = peakClawback(rows);
  const risks = buildRiskDiagnostics(plan, model, row?.age || plan.profile.retirementAge);
  const biggestRisk = risks.find((risk) => risk.severity === "High")
    || risks.find((risk) => risk.severity === "Medium")
    || risks[0]
    || null;

  let status = "Mostly On Track";
  let summary = "Your plan appears broadly workable under the current assumptions, with some areas worth reviewing.";

  if (coverageRatio >= PLAN_STATUS_THRESHOLDS.strongCoverage && !depletionAge && score.total >= PLAN_STATUS_THRESHOLDS.strongScore) {
    status = taxDrag >= PLAN_STATUS_THRESHOLDS.highTaxDrag
      ? "Strong but Tax-Inefficient"
      : clawbackPeak > 0
        ? "Sustainable but Clawback Exposure"
        : "On Track";
    summary = taxDrag >= PLAN_STATUS_THRESHOLDS.highTaxDrag
      ? "Your plan looks sustainable, but taxes reduce flexibility more than necessary under the current withdrawal pattern."
      : clawbackPeak > 0
        ? "Your plan looks sustainable, but later-income levels appear high enough to create OAS clawback exposure."
        : "Your current assumptions support retirement spending and portfolio longevity reasonably well.";
  } else if (coverageRatio >= PLAN_STATUS_THRESHOLDS.workableCoverage && score.total >= PLAN_STATUS_THRESHOLDS.mostlyOnTrackScore) {
    status = "Mostly On Track";
    summary = "Your current plan appears broadly workable, but later-life taxes, withdrawals, or stress outcomes deserve a review.";
  } else if (coverageRatio >= PLAN_STATUS_THRESHOLDS.tightCoverage && score.total >= PLAN_STATUS_THRESHOLDS.tightScore) {
    status = "Tight / Needs Review";
    summary = "The plan may work, but it relies on narrower assumptions or meaningful savings withdrawals to stay on course.";
  } else {
    status = "Shortfall Likely";
    summary = "The current assumptions likely create a funding gap, early depletion, or both unless something changes.";
  }

  const keyDrivers = [
    `How much of your target income is covered: ${Math.round(coverageRatio * 100)}%`,
    depletionAge ? `Savings last to about age ${depletionAge}` : `Savings project beyond age ${plan.profile.lifeExpectancy}`,
    clawbackPeak > 0
      ? `Peak OAS clawback estimate: $${Math.round(clawbackPeak).toLocaleString()}`
      : `Average tax drag on withdrawals: ${Math.round(taxDrag * 100)}%`,
  ];

  let nextBestAction = {
    label: "Compare scenarios",
    detail: "Test a later retirement age, lower spending, or alternate withdrawal strategy.",
    action: "open-scenario-compare",
  };

  if (biggestRisk?.key === "clawback") {
    nextBestAction = {
      label: "Use the OAS Clawback Calculator",
      detail: "Look at the clawback issue directly, then bring that learning back into the full planner.",
      href: "./oas-clawback-calculator.html",
    };
  } else if (biggestRisk?.key === "rrif") {
    nextBestAction = {
      label: "Use the RRIF Withdrawal Calculator",
      detail: "Review how required withdrawals may change taxes and income later in retirement.",
      href: "./rrif-withdrawal-calculator.html",
    };
  } else if (biggestRisk?.key === "tax-drag") {
    nextBestAction = {
      label: "Review withdrawal strategy",
      detail: "Compare withdrawal order and earlier RRSP withdrawals to reduce drag.",
      action: "focus-meltdown-sim",
    };
  } else if (biggestRisk?.key === "depletion") {
    nextBestAction = {
      label: "Test a later retirement age",
      detail: "A later retirement date or lower spending target is usually the fastest way to improve sustainability.",
      action: "open-scenario-compare",
    };
  }

  return {
    status,
    summary,
    score,
    keyDrivers,
    biggestRisk,
    nextBestAction,
  };
}

/* FILE: src/model/reportMetrics.js */
function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getReportMetrics(plan, row) {
  const estimateTaxes = plan?.strategy?.estimateTaxes !== false;
  const spending = Math.max(0, num(row?.spending));
  const guaranteedGross = Math.max(0, num(row?.guaranteedGross));
  const guaranteedNet = Math.max(0, estimateTaxes ? num(row?.guaranteedNet) : guaranteedGross);
  const netGap = Math.max(0, num(row?.netGap));
  const grossWithdrawal = Math.max(0, num(row?.withdrawal));
  const incomeTax = Math.max(0, estimateTaxes ? num(row?.taxOnWithdrawal) : 0);
  const clawback = Math.max(0, estimateTaxes ? num(row?.oasClawback) : 0);
  const dragAmount = incomeTax + clawback;
  const netWithdrawal = Math.max(0, estimateTaxes ? num(row?.netFromWithdrawal) : grossWithdrawal);
  const totalSpendable = guaranteedNet + netWithdrawal;
  const coverageRatio = spending > 0 ? guaranteedNet / spending : 1;
  const surplus = Math.max(0, guaranteedNet - spending);
  const effectiveTaxRate = estimateTaxes ? num(row?.effectiveTaxRate) : 0;

  return {
    estimateTaxes,
    spending,
    guaranteedGross,
    guaranteedNet,
    netGap,
    grossWithdrawal,
    netWithdrawal,
    incomeTax,
    clawback,
    dragAmount,
    totalSpendable,
    coverageRatio,
    surplus,
    effectiveTaxRate,
  };
}

/* FILE: src/model/yearBreakdown.js */
function buildYearBreakdown(plan, model) {
  const rows = (model?.base?.rows || []).filter((row) => row.age >= plan.profile.retirementAge);
  return rows.map((row) => {
    const pensionGross = Number(row.pension || 0) + Number(row.spousePension || 0);
    const cppGross = Number(row.cpp || 0) + Number(row.spouseCpp || 0);
    const oasGross = Number(row.oas || 0) + Number(row.spouseOas || 0);
    const taxOnWithdrawal = Number(row.taxOnWithdrawal || 0);
    const clawback = Number(row.oasClawback || 0);
    const withdrawalGross = Number(row.withdrawal || 0);
    const withdrawalNet = Math.max(0, Number(row.netFromWithdrawal || 0));
    return {
      age: Number(row.age),
      year: Number(row.year),
      spendingAfterTax: Number(row.spending || 0),
      pensionGross,
      cppGross,
      oasGross,
      guaranteedGross: Number(row.guaranteedGross || 0),
      guaranteedNet: Number(row.guaranteedNet || 0),
      withdrawalGross,
      withdrawalNet,
      taxOnWithdrawal,
      oasClawback: clawback,
      taxTotal: Number(row.tax || 0) + clawback,
      rrifMin: Number(row.rrifMinimum || 0),
      portfolioBalanceStart: Number(row.balanceStart || 0),
      portfolioBalanceEnd: Number(row.balance || 0),
      coveragePct: Number(row.spending || 0) > 0 ? (Number(row.guaranteedNet || 0) / Number(row.spending || 0)) : 1,
    };
  });
}


/* FILE: src/model/phases.js */
function hasRow(rows, age) {
  return rows.some((row) => row.age === age);
}

function buildRetirementPhases(plan, rows) {
  const retireAge = Number(plan.profile.retirementAge || 65);
  const lastAge = rows.length ? rows[rows.length - 1].age : retireAge;
  const cppAge = Number(plan.income.cpp.startAge || 65);
  const oasAge = Number(plan.income.oas.startAge || 65);
  const rrifAge = plan.strategy.applyRrifMinimums
    ? Number(plan.strategy.rrifConversionAge || 71)
    : null;

  const firstTransition = Math.min(
    ...[cppAge, oasAge, rrifAge].filter((x) => Number.isFinite(x) && x > retireAge)
  );
  const earlyEnd = Number.isFinite(firstTransition) ? firstTransition - 1 : lastAge;

  const bothBenefitsAge = Math.max(cppAge, oasAge);
  const middleStart = Math.max(retireAge, bothBenefitsAge);
  const middleEnd = rrifAge && rrifAge > middleStart ? rrifAge - 1 : null;

  const phases = [];
  if (earlyEnd >= retireAge && hasRow(rows, retireAge)) {
    phases.push({
      key: "early",
      label: "Early Retirement",
      startAge: retireAge,
      endAge: Math.min(earlyEnd, lastAge),
      why: "Bridge years before full government benefits and/or RRIF minimums.",
    });
  }

  if (middleEnd != null && middleEnd >= middleStart && hasRow(rows, middleStart)) {
    phases.push({
      key: "benefits",
      label: "CPP + OAS Phase",
      startAge: middleStart,
      endAge: Math.min(middleEnd, lastAge),
      why: "CPP and OAS are both active, often reducing withdrawal pressure.",
    });
  }

  if (rrifAge != null && hasRow(rows, rrifAge)) {
    phases.push({
      key: "rrif",
      label: "RRIF Minimum Phase",
      startAge: rrifAge,
      endAge: lastAge,
      why: "Minimum RRIF withdrawals can increase taxable income and tax drag.",
    });
  }

  return phases.filter((p) => p.endAge >= p.startAge);
}


/* FILE: src/model/peakTax.js */

function computeBracketTax(income, bracket, inflation, yearOffset, inflateBrackets) {
  const inflationFactor = inflateBrackets ? Math.pow(1 + inflation, yearOffset) : 1;
  const thresholds = bracket.thresholds.map((t) => t * inflationFactor);
  let tax = 0;
  for (let i = 0; i < bracket.rates.length; i += 1) {
    const floor = thresholds[i];
    const ceiling = thresholds[i + 1] ?? Number.POSITIVE_INFINITY;
    const taxableInBand = Math.max(0, Math.min(income, ceiling) - floor);
    if (taxableInBand > 0) tax += taxableInBand * bracket.rates[i];
  }
  return tax;
}

function causeLabel(row) {
  const reasons = [];
  if ((row.oasClawback || 0) > 0) reasons.push({ k: "clawback", v: row.oasClawback });
  if ((row.rrifMinimum || 0) > 0 && (row.withdrawal || 0) >= (row.rrifMinimum || 0)) reasons.push({ k: "rrif", v: row.rrifMinimum });
  if ((row.withdrawal || 0) > 35000) reasons.push({ k: "withdrawal", v: row.withdrawal });
  if ((row.pension || 0) + (row.cpp || 0) + (row.oas || 0) > 35000) reasons.push({ k: "overlap", v: (row.pension || 0) + (row.cpp || 0) + (row.oas || 0) });
  reasons.sort((a, b) => b.v - a.v);
  const top = reasons[0]?.k || "combination";
  if (top === "rrif") return "RRIF minimum withdrawals";
  if (top === "clawback") return "OAS clawback";
  if (top === "withdrawal") return "High registered withdrawals";
  if (top === "overlap") return "Pension + CPP/OAS overlap";
  return "Combination of income sources";
}

function findPeakTaxYear(plan, model) {
  const rows = (model?.base?.rows || []).filter((r) => r.age >= plan.profile.retirementAge);
  if (!rows.length) return null;
  let best = rows[0];
  let bestTax = (best.tax || 0) + (best.oasClawback || 0);
  for (const row of rows) {
    const t = (row.tax || 0) + (row.oasClawback || 0);
    if (t > bestTax) {
      best = row;
      bestTax = t;
    }
  }
  const yearOffset = Math.max(0, best.year - new Date().getFullYear());
  const taxableIncome = Math.max(0, best.taxableIncome || 0);
  const federal = computeBracketTax(
    taxableIncome,
    TAX_BRACKETS.federal,
    plan.assumptions.inflation,
    yearOffset,
    plan.assumptions.taxBracketInflation
  );
  const provincialBracket = TAX_BRACKETS.provincial[plan.profile.province] || TAX_BRACKETS.provincial.NL;
  const provincial = computeBracketTax(
    taxableIncome,
    provincialBracket,
    plan.assumptions.inflation,
    yearOffset,
    plan.assumptions.taxBracketInflation
  );
  return {
    age: best.age,
    year: best.year,
    totalTax: (best.tax || 0) + (best.oasClawback || 0),
    federalTax: federal,
    provincialTax: provincial,
    clawback: best.oasClawback || 0,
    cause: causeLabel(best),
  };
}


/* FILE: src/model/scenarioStore.js */
function localId() {
  return `scn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function baseMetrics(model, plan) {
  const row65 = model.base.rows.find((r) => r.age === 65) || model.base.rows[0];
  return {
    coveragePct: row65 && row65.spending > 0 ? (row65.guaranteedNet / row65.spending) : 1,
    netGap65: row65?.netGap || 0,
    gross65: row65?.withdrawal || 0,
    taxWedge65: (row65?.taxOnWithdrawal || 0) + (row65?.oasClawback || 0),
    clawback65: row65?.oasClawback || 0,
    depletionAge: model.kpis.depletionAge || null,
    retirementAge: Number(plan.profile.retirementAge || 65),
  };
}

function saveScenarioSnapshot(state, model, name = "Scenario") {
  if (!state.uiState.scenarios) state.uiState.scenarios = [];
  const scenario = {
    id: localId(),
    name: String(name || "Scenario"),
    createdAt: Date.now(),
    payload: {
      profile: state.profile,
      assumptions: state.assumptions,
      savings: state.savings,
      income: state.income,
      accounts: state.accounts,
      strategy: state.strategy,
    },
    metrics: baseMetrics(model, state),
  };
  state.uiState.scenarios.push(scenario);
  state.uiState.scenarios = state.uiState.scenarios.slice(-12);
  return scenario;
}

function removeScenarioSnapshot(state, id) {
  const list = Array.isArray(state.uiState.scenarios) ? state.uiState.scenarios : [];
  state.uiState.scenarios = list.filter((x) => x.id !== id);
}

function renameScenarioSnapshot(state, id, name) {
  const list = Array.isArray(state.uiState.scenarios) ? state.uiState.scenarios : [];
  const found = list.find((x) => x.id === id);
  if (!found) return;
  found.name = String(name || found.name || "Scenario").trim() || "Scenario";
}


/* FILE: src/model/planStore.js */
function loadPlanFromStorage(storageKey, normalizePlan, createDefaultPlan) {
  const storages = [];
  try {
    if (typeof localStorage !== "undefined") storages.push(localStorage);
  } catch (error) {
    void error;
  }
  try {
    if (typeof sessionStorage !== "undefined") storages.push(sessionStorage);
  } catch (error) {
    void error;
  }

  for (const storage of storages) {
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      return normalizePlan(parsed);
    } catch (error) {
      void error;
      // try next storage
    }
  }

  return createDefaultPlan();
}

function savePlanToStorage(storageKey, plan) {
  const serialized = JSON.stringify(plan);
  let saved = false;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(storageKey, serialized);
      if (localStorage.getItem(storageKey) === serialized) saved = true;
    }
  } catch (error) {
    void error;
  }

  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(storageKey, serialized);
      if (sessionStorage.getItem(storageKey) === serialized) saved = true;
    }
  } catch (error) {
    void error;
  }

  return saved;
}

function clearPlanFromStorage(storageKey) {
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(storageKey);
  } catch (error) {
    void error;
  }
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(storageKey);
  } catch (error) {
    void error;
  }
}

/* FILE: src/model/planSchema.js */
function createLocalId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultLearnState() {
  return {
    phaseDefaultsSeeded: false,
    inflation: {
      spendingToday: 80000,
      years: 10,
      rate: 0.025,
    },
    indexedIncome: {
      startIncome: 30000,
      years: 25,
      inflation: 0.02,
      highlight: "indexed",
    },
    taxGrossUp: {
      netGoal: 80000,
      rate: 0.22,
    },
    rrif: {
      age: 72,
      balance: 600000,
    },
    oas: {
      income: 95000,
      monthly: 742,
      recipients: 1,
    },
    spousalSplit: {
      spouseA: 70000,
      spouseB: 30000,
      splitPct: 0.25,
    },
    phases: {
      base: 80000,
      goYears: 10,
      goPct: 1.1,
      slowYears: 10,
      slowPct: 0.9,
      noYears: 10,
      noPct: 0.75,
    },
  };
}

function createDefaultLearningProgress(learnProgressItems) {
  return (learnProgressItems || []).reduce((acc, item) => {
    acc[item.key] = false;
    return acc;
  }, {});
}

function normalizeLearnState(input) {
  const base = createDefaultLearnState();
  const wasSeeded = Boolean(input?.phaseDefaultsSeeded);
  const out = {
    phaseDefaultsSeeded: true,
    inflation: { ...base.inflation, ...(input?.inflation || {}) },
    indexedIncome: { ...base.indexedIncome, ...(input?.indexedIncome || {}) },
    taxGrossUp: { ...base.taxGrossUp, ...(input?.taxGrossUp || {}) },
    rrif: { ...base.rrif, ...(input?.rrif || {}) },
    oas: { ...base.oas, ...(input?.oas || {}) },
    spousalSplit: { ...base.spousalSplit, ...(input?.spousalSplit || {}) },
    phases: { ...base.phases, ...(input?.phases || {}) },
  };

  out.inflation.spendingToday = Math.max(10000, Number(out.inflation.spendingToday));
  out.inflation.years = clamp(Number(out.inflation.years), 0, 45);
  out.inflation.rate = clamp(normalizePct(out.inflation.rate), 0.005, 0.08);

  out.indexedIncome.startIncome = Math.max(0, Number(out.indexedIncome.startIncome));
  out.indexedIncome.years = clamp(Number(out.indexedIncome.years), 1, 40);
  out.indexedIncome.inflation = clamp(normalizePct(out.indexedIncome.inflation), 0, 0.08);
  out.indexedIncome.highlight = out.indexedIncome.highlight === "flat" ? "flat" : "indexed";

  out.taxGrossUp.netGoal = Math.max(12000, Number(out.taxGrossUp.netGoal));
  out.taxGrossUp.rate = clamp(normalizePct(out.taxGrossUp.rate), 0.05, 0.45);

  out.rrif.age = clamp(Number(out.rrif.age), 65, 95);
  out.rrif.balance = Math.max(0, Number(out.rrif.balance));

  out.oas.income = Math.max(0, Number(out.oas.income));
  out.oas.monthly = Math.max(0, Number(out.oas.monthly));
  out.oas.recipients = clamp(Number(out.oas.recipients), 1, 2);

  out.spousalSplit.spouseA = Math.max(0, Number(out.spousalSplit.spouseA));
  out.spousalSplit.spouseB = Math.max(0, Number(out.spousalSplit.spouseB));
  out.spousalSplit.splitPct = clamp(normalizePct(out.spousalSplit.splitPct), 0, 0.5);

  out.phases.base = Math.max(12000, Number(out.phases.base));
  out.phases.goYears = clamp(Number(out.phases.goYears), 1, 20);
  out.phases.slowYears = clamp(Number(out.phases.slowYears), 1, 20);
  out.phases.noYears = clamp(Number(out.phases.noYears), 1, 25);
  out.phases.goPct = normalizePhasePct(out.phases.goPct, 0.6, 1.5);
  out.phases.slowPct = normalizePhasePct(out.phases.slowPct, 0.5, 1.3);
  out.phases.noPct = normalizePhasePct(out.phases.noPct, 0.4, 1.2);
  if (!wasSeeded) {
    out.phases.goPct = 1.1;
    out.phases.slowPct = 0.9;
    out.phases.noPct = 0.75;
  }

  return out;
}

function normalizeCapitalInjects(items, defaultAge = 65) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: String(item?.id || createLocalId()),
      enabled: Boolean(item?.enabled ?? true),
      label: String(item?.label || "Lump sum").trim() || "Lump sum",
      amount: Math.max(0, Number(item?.amount || 0)),
      age: clamp(Number(item?.age || defaultAge), 45, 105),
    }))
    .slice(0, 12);
}

function createDefaultPlan({ app, riskReturns, learnProgressItems }) {
  return {
    version: app.version,
    profile: {
      province: app.defaultProvince,
      birthYear: app.currentYear - 35,
      annualIncome: 90000,
      retirementAge: 65,
      lifeExpectancy: 92,
      desiredSpending: 60000,
      hasSpouse: false,
    },
    assumptions: {
      inflation: 0.02,
      returns: {
        conservative: riskReturns.conservative,
        balanced: riskReturns.balanced,
        aggressive: riskReturns.aggressive,
      },
      riskProfile: "balanced",
      scenarioSpread: 0.02,
      volatility: 0.09,
      taxBracketInflation: true,
    },
    savings: {
      currentTotal: 120000,
      annualContribution: 9000,
      contributionIncrease: 0,
      capitalInjects: [],
    },
    income: {
      pension: { enabled: false, amount: 0, startAge: 65 },
      cpp: { amountAt65: 12000, startAge: 65 },
      oas: { amountAt65: 9000, startAge: 65 },
      spouse: {
        enabled: false,
        pensionAmount: 0,
        pensionStartAge: 65,
        cppAmountAt65: 10000,
        cppStartAge: 65,
        oasAmountAt65: 8500,
        oasStartAge: 65,
      },
    },
    accounts: {
      rrsp: 70000,
      tfsa: 35000,
      nonRegistered: 10000,
      cash: 5000,
    },
    strategy: {
      withdrawal: "tax-smart",
      estimateTaxes: true,
      oasClawbackModeling: true,
      rrifConversionAge: 71,
      applyRrifMinimums: true,
      meltdownEnabled: false,
      meltdownAmount: 0,
      meltdownStartAge: 60,
      meltdownEndAge: 65,
      meltdownIncomeCeiling: 0,
    },
    uiState: {
      firstRun: true,
      hasStarted: false,
      activeNav: "plan",
      experienceMode: "beginner",
      wizardStep: 1,
      showScenarioCompare: false,
      dashboardScenario: "base",
      showAdvancedControls: false,
      advancedSearch: "",
      supportDismissedUntil: 0,
      supportCardShownCount: 0,
      supportCardDismissCount: 0,
      lastSupportTriggerReason: "",
      supportOptOut: false,
      supportShownEvents: {
        wizardComplete: false,
        firstGrossUp: false,
        firstClawback: false,
        reportGenerated: false,
      },
      lastSharedScenarioBannerDismissed: false,
      justCompletedWizard: false,
      selectedScenarioLabel: "",
      showGrossWithdrawals: true,
      emphasizeTaxes: true,
      timelineSelectedAge: null,
      incomeMap: {
        startAge: null,
        windowYears: 25,
        highlightKeyAges: true,
        showTable: false,
      },
      lastChangeSummary: null,
      scenarios: [],
      timingSim: {
        cppStartAge: 65,
        oasStartAge: 65,
        linkTiming: false,
      },
      clientSummary: {
        enabled: false,
        preparedFor: "",
        scenarioLabel: "",
        preparedBy: "",
        summaryDate: "",
      },
      guided: {
        lifestylePreset: "comfortable",
        retirementIncomeMode: "percent",
        retirementIncomePercent: 0.7,
        estimateRetirementAge: false,
        savingsContributionMode: "annual",
        rrspShare: 0.6,
        useCanadianDefaults: true,
      },
      learn: createDefaultLearnState(),
      learningProgress: createDefaultLearningProgress(learnProgressItems),
      unlocked: {
        advanced: false,
        spouse: false,
      },
    },
    notes: "",
  };
}

function createBlankPlan({ app, riskReturns, learnProgressItems }) {
  const plan = createDefaultPlan({ app, riskReturns, learnProgressItems });
  plan.profile.desiredSpending = 12000;
  plan.savings.currentTotal = 0;
  plan.savings.annualContribution = 0;
  plan.savings.contributionIncrease = 0;
  plan.savings.capitalInjects = [];
  plan.income.pension.enabled = false;
  plan.income.pension.amount = 0;
  plan.income.pension.startAge = 65;
  plan.income.cpp.amountAt65 = 0;
  plan.income.cpp.startAge = 65;
  plan.income.oas.amountAt65 = 0;
  plan.income.oas.startAge = 65;
  plan.income.spouse.enabled = false;
  plan.income.spouse.pensionAmount = 0;
  plan.income.spouse.pensionStartAge = 65;
  plan.income.spouse.cppAmountAt65 = 0;
  plan.income.spouse.cppStartAge = 65;
  plan.income.spouse.oasAmountAt65 = 0;
  plan.income.spouse.oasStartAge = 65;
  plan.accounts = {
    rrsp: 0,
    tfsa: 0,
    nonRegistered: 0,
    cash: 0,
  };
  plan.strategy.meltdownEnabled = false;
  plan.strategy.meltdownAmount = 0;
  plan.strategy.meltdownIncomeCeiling = 0;
  plan.uiState.firstRun = true;
  plan.uiState.hasStarted = false;
  plan.uiState.activeNav = "start";
  plan.uiState.showScenarioCompare = false;
  plan.uiState.dashboardScenario = "base";
  plan.uiState.lastChangeSummary = null;
  plan.notes = "";
  return plan;
}

function createDemoPlan({ app, riskReturns, learnProgressItems }) {
  const plan = createDefaultPlan({ app, riskReturns, learnProgressItems });
  plan.profile.birthYear = app.currentYear - 45;
  plan.profile.retirementAge = 63;
  plan.profile.lifeExpectancy = 94;
  plan.profile.annualIncome = 105000;
  plan.profile.desiredSpending = 70000;
  plan.savings.currentTotal = 380000;
  plan.savings.annualContribution = 12000;
  plan.assumptions.riskProfile = "balanced";
  plan.income.pension.enabled = true;
  plan.income.pension.amount = 15000;
  plan.income.pension.startAge = 63;
  plan.income.cpp.amountAt65 = 13000;
  plan.income.cpp.startAge = 65;
  plan.income.oas.amountAt65 = 9200;
  plan.income.oas.startAge = 67;
  plan.accounts = {
    rrsp: 210000,
    tfsa: 110000,
    nonRegistered: 45000,
    cash: 15000,
  };
  plan.savings.capitalInjects = [
    { id: createLocalId(), enabled: true, label: "Downsize home", amount: 180000, age: 67 },
  ];
  plan.uiState.firstRun = false;
  plan.uiState.hasStarted = true;
  plan.uiState.activeNav = "dashboard";
  plan.uiState.wizardStep = 7;
  plan.uiState.unlocked.advanced = true;
  plan.notes = "Demo assumptions loaded. Review advanced strategy and stress tests.";
  return plan;
}

function normalizePlan(input, { app, provinces, riskReturns, learnProgressItems }) {
  if (!input || typeof input !== "object") throw new Error("Plan file is not a valid object.");
  const migrated = migratePlan(input, { app, riskReturns, learnProgressItems });
  const base = createDefaultPlan({ app, riskReturns, learnProgressItems });

  const out = {
    ...base,
    ...migrated,
    profile: { ...base.profile, ...(migrated.profile || {}) },
    assumptions: {
      ...base.assumptions,
      ...(migrated.assumptions || {}),
      returns: { ...base.assumptions.returns, ...(migrated.assumptions?.returns || {}) },
    },
    savings: {
      ...base.savings,
      ...(migrated.savings || {}),
      capitalInjects: normalizeCapitalInjects(
        migrated.savings?.capitalInjects ?? base.savings.capitalInjects,
        migrated.profile?.retirementAge ?? base.profile.retirementAge
      ),
    },
    income: {
      ...base.income,
      ...(migrated.income || {}),
      pension: { ...base.income.pension, ...(migrated.income?.pension || {}) },
      cpp: { ...base.income.cpp, ...(migrated.income?.cpp || {}) },
      oas: { ...base.income.oas, ...(migrated.income?.oas || {}) },
      spouse: { ...base.income.spouse, ...(migrated.income?.spouse || {}) },
    },
    accounts: { ...base.accounts, ...(migrated.accounts || {}) },
    strategy: { ...base.strategy, ...(migrated.strategy || {}) },
    uiState: {
      ...base.uiState,
      ...(migrated.uiState || {}),
      unlocked: { ...base.uiState.unlocked, ...(migrated.uiState?.unlocked || {}) },
      supportShownEvents: {
        ...base.uiState.supportShownEvents,
        ...(migrated.uiState?.supportShownEvents || {}),
      },
      scenarios: Array.isArray(migrated.uiState?.scenarios) ? migrated.uiState.scenarios : [],
      timingSim: {
        ...base.uiState.timingSim,
        ...(migrated.uiState?.timingSim || {}),
      },
      clientSummary: {
        ...base.uiState.clientSummary,
        ...(migrated.uiState?.clientSummary || {}),
      },
      guided: {
        ...base.uiState.guided,
        ...(migrated.uiState?.guided || {}),
      },
      learn: normalizeLearnState(migrated.uiState?.learn || base.uiState.learn),
      learningProgress: {
        ...createDefaultLearningProgress(learnProgressItems),
        ...(migrated.uiState?.learningProgress || {}),
      },
    },
  };

  validatePlan(out, { app, provinces, learnProgressItems });
  return out;
}

function ensureValidState(state, { app, provinces, learnProgressItems }) {
  state.profile.birthYear = clamp(Number(state.profile.birthYear), 1940, app.currentYear - 18);
  state.profile.annualIncome = Math.max(0, Number(state.profile.annualIncome || 0));
  state.profile.retirementAge = clamp(Number(state.profile.retirementAge), 50, 75);
  state.profile.lifeExpectancy = clamp(Number(state.profile.lifeExpectancy), state.profile.retirementAge + 1, 105);
  state.profile.desiredSpending = Math.max(12000, Number(state.profile.desiredSpending));
  state.assumptions.inflation = normalizePct(state.assumptions.inflation);
  state.assumptions.scenarioSpread = normalizePct(state.assumptions.scenarioSpread);
  state.assumptions.volatility = normalizePct(state.assumptions.volatility);
  state.assumptions.returns.conservative = normalizePct(state.assumptions.returns.conservative);
  state.assumptions.returns.balanced = normalizePct(state.assumptions.returns.balanced);
  state.assumptions.returns.aggressive = normalizePct(state.assumptions.returns.aggressive);
  state.savings.currentTotal = Math.max(0, Number(state.savings.currentTotal));
  state.savings.annualContribution = Math.max(0, Number(state.savings.annualContribution));
  state.savings.contributionIncrease = clamp(normalizePct(state.savings.contributionIncrease), 0, 0.2);
  state.savings.capitalInjects = normalizeCapitalInjects(state.savings.capitalInjects, state.profile.retirementAge);
  state.income.cpp.startAge = clamp(Number(state.income.cpp.startAge), 60, 70);
  state.income.oas.startAge = clamp(Number(state.income.oas.startAge), 65, 70);
  state.income.pension.startAge = clamp(Number(state.income.pension.startAge), 50, 75);
  state.income.pension.amount = Math.max(0, Number(state.income.pension.amount));
  state.income.cpp.amountAt65 = Math.max(0, Number(state.income.cpp.amountAt65));
  state.income.oas.amountAt65 = Math.max(0, Number(state.income.oas.amountAt65));
  state.income.spouse.pensionStartAge = clamp(Number(state.income.spouse.pensionStartAge), 50, 75);
  state.income.spouse.cppStartAge = clamp(Number(state.income.spouse.cppStartAge), 60, 70);
  state.income.spouse.oasStartAge = clamp(Number(state.income.spouse.oasStartAge), 65, 70);
  state.income.spouse.pensionAmount = Math.max(0, Number(state.income.spouse.pensionAmount));
  state.income.spouse.cppAmountAt65 = Math.max(0, Number(state.income.spouse.cppAmountAt65));
  state.income.spouse.oasAmountAt65 = Math.max(0, Number(state.income.spouse.oasAmountAt65));
  state.strategy.rrifConversionAge = clamp(Number(state.strategy.rrifConversionAge || 71), 65, 75);
  state.strategy.estimateTaxes = Boolean(state.strategy.estimateTaxes ?? true);
  state.strategy.applyRrifMinimums = Boolean(state.strategy.applyRrifMinimums ?? true);
  state.strategy.meltdownEnabled = Boolean(state.strategy.meltdownEnabled);
  state.strategy.meltdownAmount = Math.max(0, Number(state.strategy.meltdownAmount || 0));
  state.strategy.meltdownStartAge = clamp(Number(state.strategy.meltdownStartAge || state.profile.retirementAge), 50, 75);
  state.strategy.meltdownEndAge = clamp(Number(state.strategy.meltdownEndAge || 65), state.strategy.meltdownStartAge, 80);
  state.strategy.meltdownIncomeCeiling = Math.max(0, Number(state.strategy.meltdownIncomeCeiling || 0));
  state.uiState.learn = normalizeLearnState(state.uiState.learn);
  state.uiState.showAdvancedControls = Boolean(state.uiState.showAdvancedControls);
  state.uiState.dashboardScenario = ["base", "inflation", "returns", "longevity", "custom"].includes(state.uiState.dashboardScenario)
    ? state.uiState.dashboardScenario
    : "base";
  state.uiState.experienceMode = state.uiState.experienceMode === "advanced" ? "advanced" : "beginner";
  state.uiState.advancedSearch = String(state.uiState.advancedSearch || "");
  state.uiState.supportDismissedUntil = Math.max(0, Number(state.uiState.supportDismissedUntil || 0));
  state.uiState.supportCardShownCount = Math.max(0, Number(state.uiState.supportCardShownCount || 0));
  state.uiState.supportCardDismissCount = Math.max(0, Number(state.uiState.supportCardDismissCount || 0));
  state.uiState.lastSupportTriggerReason = String(state.uiState.lastSupportTriggerReason || "");
  state.uiState.supportOptOut = Boolean(state.uiState.supportOptOut);
  state.uiState.supportShownEvents = {
    wizardComplete: Boolean(state.uiState.supportShownEvents?.wizardComplete),
    firstGrossUp: Boolean(state.uiState.supportShownEvents?.firstGrossUp),
    firstClawback: Boolean(state.uiState.supportShownEvents?.firstClawback),
    reportGenerated: Boolean(state.uiState.supportShownEvents?.reportGenerated),
  };
  state.uiState.lastSharedScenarioBannerDismissed = Boolean(state.uiState.lastSharedScenarioBannerDismissed);
  state.uiState.justCompletedWizard = Boolean(state.uiState.justCompletedWizard);
  state.uiState.selectedScenarioLabel = String(state.uiState.selectedScenarioLabel || "");
  state.uiState.showGrossWithdrawals = Boolean(state.uiState.showGrossWithdrawals ?? true);
  state.uiState.emphasizeTaxes = Boolean(state.uiState.emphasizeTaxes ?? true);
  state.uiState.timelineSelectedAge = Number.isFinite(Number(state.uiState.timelineSelectedAge))
    ? Number(state.uiState.timelineSelectedAge)
    : null;
  state.uiState.incomeMap = {
    startAge: Number.isFinite(Number(state.uiState.incomeMap?.startAge)) ? Number(state.uiState.incomeMap.startAge) : null,
    windowYears: clamp(Number(state.uiState.incomeMap?.windowYears ?? 25), 8, 45),
    highlightKeyAges: Boolean(state.uiState.incomeMap?.highlightKeyAges ?? true),
    showTable: Boolean(state.uiState.incomeMap?.showTable),
  };
  state.uiState.lastChangeSummary = state.uiState.lastChangeSummary && typeof state.uiState.lastChangeSummary === "object"
    ? state.uiState.lastChangeSummary
    : null;
  state.uiState.scenarios = Array.isArray(state.uiState.scenarios) ? state.uiState.scenarios.slice(-12) : [];
  state.uiState.timingSim = {
    cppStartAge: clamp(Number(state.uiState.timingSim?.cppStartAge ?? state.income.cpp.startAge), 60, 70),
    oasStartAge: clamp(Number(state.uiState.timingSim?.oasStartAge ?? state.income.oas.startAge), 65, 70),
    linkTiming: Boolean(state.uiState.timingSim?.linkTiming),
  };
  state.uiState.clientSummary = {
    enabled: Boolean(state.uiState.clientSummary?.enabled),
    preparedFor: String(state.uiState.clientSummary?.preparedFor || ""),
    scenarioLabel: String(state.uiState.clientSummary?.scenarioLabel || ""),
    preparedBy: String(state.uiState.clientSummary?.preparedBy || ""),
    summaryDate: String(state.uiState.clientSummary?.summaryDate || ""),
  };
  state.uiState.guided = {
    lifestylePreset: ["basic", "comfortable", "higher"].includes(state.uiState.guided?.lifestylePreset)
      ? state.uiState.guided.lifestylePreset
      : "comfortable",
    retirementIncomeMode: state.uiState.guided?.retirementIncomeMode === "dollar" ? "dollar" : "percent",
    retirementIncomePercent: clamp(normalizePct(state.uiState.guided?.retirementIncomePercent ?? 0.7), 0.3, 1.2),
    estimateRetirementAge: Boolean(state.uiState.guided?.estimateRetirementAge),
    savingsContributionMode: state.uiState.guided?.savingsContributionMode === "percent" ? "percent" : "annual",
    rrspShare: clamp(normalizePct(state.uiState.guided?.rrspShare ?? 0.6), 0, 1),
    useCanadianDefaults: Boolean(state.uiState.guided?.useCanadianDefaults ?? true),
  };
  const defaultProgress = createDefaultLearningProgress(learnProgressItems);
  state.uiState.learningProgress = {
    ...defaultProgress,
    ...(state.uiState.learningProgress || {}),
  };

  if (!provinces[state.profile.province]) state.profile.province = app.defaultProvince;
}

function validatePlan(plan, { app, provinces, learnProgressItems }) {
  if (!plan.profile || !plan.assumptions || !plan.savings || !plan.income || !plan.strategy || !plan.uiState) {
    throw new Error("Plan file is missing required sections.");
  }
  if (!provinces[plan.profile.province]) throw new Error("Province code is invalid.");
  if (plan.profile.retirementAge <= 40 || plan.profile.retirementAge >= 90) {
    throw new Error("Retirement age is outside supported planning range.");
  }
  if (plan.profile.lifeExpectancy <= plan.profile.retirementAge) {
    throw new Error("Life expectancy must be greater than retirement age.");
  }
  if (!["conservative", "balanced", "aggressive"].includes(plan.assumptions.riskProfile)) {
    throw new Error("Risk profile is invalid.");
  }
  if (!["tax-smart", "rrsp-first", "tfsa-first"].includes(plan.strategy.withdrawal)) {
    throw new Error("Withdrawal strategy is invalid.");
  }
  plan.strategy.estimateTaxes = Boolean(plan.strategy.estimateTaxes ?? true);
  plan.uiState.learn = normalizeLearnState(plan.uiState.learn || createDefaultLearnState());
  plan.uiState.learningProgress = {
    ...createDefaultLearningProgress(learnProgressItems),
    ...(plan.uiState.learningProgress || {}),
  };
  plan.uiState.supportDismissedUntil = Math.max(0, Number(plan.uiState.supportDismissedUntil || 0));
  plan.uiState.experienceMode = plan.uiState.experienceMode === "advanced" ? "advanced" : "beginner";
  plan.uiState.supportCardShownCount = Math.max(0, Number(plan.uiState.supportCardShownCount || 0));
  plan.uiState.supportCardDismissCount = Math.max(0, Number(plan.uiState.supportCardDismissCount || 0));
  plan.uiState.lastSupportTriggerReason = String(plan.uiState.lastSupportTriggerReason || "");
  plan.uiState.supportOptOut = Boolean(plan.uiState.supportOptOut);
  plan.uiState.supportShownEvents = {
    wizardComplete: Boolean(plan.uiState.supportShownEvents?.wizardComplete),
    firstGrossUp: Boolean(plan.uiState.supportShownEvents?.firstGrossUp),
    firstClawback: Boolean(plan.uiState.supportShownEvents?.firstClawback),
    reportGenerated: Boolean(plan.uiState.supportShownEvents?.reportGenerated),
  };
  plan.uiState.lastSharedScenarioBannerDismissed = Boolean(plan.uiState.lastSharedScenarioBannerDismissed);
  plan.uiState.justCompletedWizard = Boolean(plan.uiState.justCompletedWizard);
  plan.uiState.selectedScenarioLabel = String(plan.uiState.selectedScenarioLabel || "");
  plan.uiState.showGrossWithdrawals = Boolean(plan.uiState.showGrossWithdrawals ?? true);
  plan.uiState.emphasizeTaxes = Boolean(plan.uiState.emphasizeTaxes ?? true);
  plan.uiState.timelineSelectedAge = Number.isFinite(Number(plan.uiState.timelineSelectedAge))
    ? Number(plan.uiState.timelineSelectedAge)
    : null;
  plan.uiState.incomeMap = {
    startAge: Number.isFinite(Number(plan.uiState.incomeMap?.startAge)) ? Number(plan.uiState.incomeMap.startAge) : null,
    windowYears: clamp(Number(plan.uiState.incomeMap?.windowYears ?? 25), 8, 45),
    highlightKeyAges: Boolean(plan.uiState.incomeMap?.highlightKeyAges ?? true),
    showTable: Boolean(plan.uiState.incomeMap?.showTable),
  };
  plan.uiState.lastChangeSummary = plan.uiState.lastChangeSummary && typeof plan.uiState.lastChangeSummary === "object"
    ? plan.uiState.lastChangeSummary
    : null;
  plan.uiState.scenarios = Array.isArray(plan.uiState.scenarios) ? plan.uiState.scenarios.slice(-12) : [];
  plan.uiState.timingSim = {
    cppStartAge: clamp(Number(plan.uiState.timingSim?.cppStartAge ?? plan.income.cpp.startAge), 60, 70),
    oasStartAge: clamp(Number(plan.uiState.timingSim?.oasStartAge ?? plan.income.oas.startAge), 65, 70),
    linkTiming: Boolean(plan.uiState.timingSim?.linkTiming),
  };
  plan.uiState.clientSummary = {
    enabled: Boolean(plan.uiState.clientSummary?.enabled),
    preparedFor: String(plan.uiState.clientSummary?.preparedFor || ""),
    scenarioLabel: String(plan.uiState.clientSummary?.scenarioLabel || ""),
    preparedBy: String(plan.uiState.clientSummary?.preparedBy || ""),
    summaryDate: String(plan.uiState.clientSummary?.summaryDate || ""),
  };
  if (!plan.version) plan.version = app.version;
  plan.profile.annualIncome = Math.max(0, Number(plan.profile.annualIncome || 0));
  plan.uiState.guided = {
    lifestylePreset: ["basic", "comfortable", "higher"].includes(plan.uiState.guided?.lifestylePreset)
      ? plan.uiState.guided.lifestylePreset
      : "comfortable",
    retirementIncomeMode: plan.uiState.guided?.retirementIncomeMode === "dollar" ? "dollar" : "percent",
    retirementIncomePercent: clamp(normalizePct(plan.uiState.guided?.retirementIncomePercent ?? 0.7), 0.3, 1.2),
    estimateRetirementAge: Boolean(plan.uiState.guided?.estimateRetirementAge),
    savingsContributionMode: plan.uiState.guided?.savingsContributionMode === "percent" ? "percent" : "annual",
    rrspShare: clamp(normalizePct(plan.uiState.guided?.rrspShare ?? 0.6), 0, 1),
    useCanadianDefaults: Boolean(plan.uiState.guided?.useCanadianDefaults ?? true),
  };
}

function migratePlan(plan, { app, riskReturns, learnProgressItems }) {
  const next = clonePlan(plan);
  if (!next.version) next.version = 1;
  if (next.version < 2) {
    next.version = 2;
  }
  if (next.version < 3) {
    next.version = 3;
  }
  if (!next.uiState) next.uiState = createDefaultPlan({ app, riskReturns, learnProgressItems }).uiState;
  if (!next.uiState.learn) next.uiState.learn = createDefaultLearnState();
  if (next.uiState.experienceMode == null) next.uiState.experienceMode = "beginner";
  if (!next.uiState.supportShownEvents) next.uiState.supportShownEvents = { wizardComplete: false, firstGrossUp: false, firstClawback: false };
  if (next.uiState.supportShownEvents.reportGenerated == null) next.uiState.supportShownEvents.reportGenerated = false;
  if (next.uiState.supportDismissedUntil == null) next.uiState.supportDismissedUntil = 0;
  if (next.uiState.supportCardShownCount == null) next.uiState.supportCardShownCount = 0;
  if (next.uiState.supportCardDismissCount == null) next.uiState.supportCardDismissCount = 0;
  if (next.uiState.lastSupportTriggerReason == null) next.uiState.lastSupportTriggerReason = "";
  if (next.uiState.supportOptOut == null) next.uiState.supportOptOut = false;
  if (next.uiState.lastSharedScenarioBannerDismissed == null) next.uiState.lastSharedScenarioBannerDismissed = false;
  if (next.uiState.justCompletedWizard == null) next.uiState.justCompletedWizard = false;
  if (next.uiState.selectedScenarioLabel == null) next.uiState.selectedScenarioLabel = "";
  if (next.uiState.showGrossWithdrawals == null) next.uiState.showGrossWithdrawals = true;
  if (next.uiState.emphasizeTaxes == null) next.uiState.emphasizeTaxes = true;
  if (next.uiState.timelineSelectedAge == null) next.uiState.timelineSelectedAge = null;
  if (!next.uiState.incomeMap) {
    next.uiState.incomeMap = { startAge: null, windowYears: 25, highlightKeyAges: true, showTable: false };
  }
  if (!Array.isArray(next.uiState.scenarios)) next.uiState.scenarios = [];
  if (next.uiState.lastChangeSummary == null) next.uiState.lastChangeSummary = null;
  if (!next.uiState.timingSim) next.uiState.timingSim = { cppStartAge: 65, oasStartAge: 65, linkTiming: false };
  if (!next.uiState.guided) {
    next.uiState.guided = {
      lifestylePreset: "comfortable",
      retirementIncomeMode: "percent",
      retirementIncomePercent: 0.7,
      estimateRetirementAge: false,
      savingsContributionMode: "annual",
      rrspShare: 0.6,
      useCanadianDefaults: true,
    };
  }
  if (!next.savings) next.savings = createDefaultPlan({ app, riskReturns, learnProgressItems }).savings;
  if (!Array.isArray(next.savings.capitalInjects)) next.savings.capitalInjects = [];
  if (!next.accounts) next.accounts = createDefaultPlan({ app, riskReturns, learnProgressItems }).accounts;
  return next;
}

function clonePlan(plan) {
  if (typeof structuredClone === "function") return structuredClone(plan);
  return JSON.parse(JSON.stringify(plan));
}

function normalizePhasePct(value, min, max) {
  let n = Number(value);
  if (!Number.isFinite(n)) return min;
  if (n > 2) n /= 100;
  return clamp(n, min, max);
}

function normalizePct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n > 1) return n / 100;
  return n;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/* FILE: src/content/sources.js */
const SOURCES_LAST_VERIFIED = "2026-03-05";

const OFFICIAL_SOURCES = [
  {
    label: "CPP retirement pension (overview)",
    href: "https://www.canada.ca/en/services/benefits/publicpensions/cpp.html",
    source: "Canada.ca (Service Canada)",
  },
  {
    label: "CPP start-age timing (60-70)",
    href: "https://www.canada.ca/en/services/benefits/publicpensions/cpp/when-start.html",
    source: "Canada.ca (Service Canada)",
  },
  {
    label: "Old Age Security (OAS) overview",
    href: "https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html",
    source: "Canada.ca (Service Canada)",
  },
  {
    label: "OAS start-age timing (65-70)",
    href: "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/when-start.html",
    source: "Canada.ca (Service Canada)",
  },
  {
    label: "OAS recovery tax (clawback)",
    href: "https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/recovery-tax.html",
    source: "Canada.ca",
  },
  {
    label: "RRSPs and other registered plans (T4040)",
    href: "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4040/rrsps-other-registered-plans-retirement.html",
    source: "CRA",
  },
  {
    label: "Registered Retirement Income Fund (RRIF)",
    href: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/registered-retirement-income-fund-rrif.html",
    source: "CRA",
  },
  {
    label: "RRIF minimum withdrawals",
    href: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/registered-retirement-income-fund-rrif/receiving-income-a-rrif.html",
    source: "CRA",
  },
  {
    label: "Personal tax rates and brackets hub",
    href: "https://www.canada.ca/en/revenue-agency/services/tax/rates.html",
    source: "CRA",
  },
];


/* FILE: src/content/referenceLinks.js */
const REFERENCE_LINKS = [
  {
    title: "OAS recovery tax (clawback)",
    description: "How OAS repayment is calculated when net income exceeds the annual threshold.",
    href: "https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/recovery-tax.html",
    reviewed: "2026-03-06",
    source: "Government of Canada",
  },
  {
    title: "CPP retirement pension overview",
    description: "CPP eligibility, payment basics, and key retirement pension details.",
    href: "https://www.canada.ca/en/services/benefits/publicpensions/cpp.html",
    reviewed: "2026-03-06",
    source: "Government of Canada",
  },
  {
    title: "CPP start timing (age 60 to 70)",
    description: "How starting CPP earlier or later changes payment amounts.",
    href: "https://www.canada.ca/en/services/benefits/publicpensions/cpp/when-start.html",
    reviewed: "2026-03-06",
    source: "Government of Canada",
  },
  {
    title: "RRIF minimum withdrawal rules",
    description: "CRA rules for RRIF income and minimum annual withdrawals by age.",
    href: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/registered-retirement-income-fund-rrif/receiving-income-a-rrif.html",
    reviewed: "2026-03-06",
    source: "CRA",
  },
  {
    title: "Federal and provincial tax rates",
    description: "Official CRA hub for personal income tax rates and bracket references.",
    href: "https://www.canada.ca/en/revenue-agency/services/tax/rates.html",
    reviewed: "2026-03-06",
    source: "CRA",
  },
  {
    title: "CRA Newfoundland and Labrador tax package",
    description: "Official package and schedules used for NL personal tax filing context.",
    href: "https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/newfoundland-labrador.html",
    reviewed: "2026-03-06",
    source: "CRA",
  },
];


/* FILE: src/content/constants.js */

const SUPPORT_URL = "https://buymeacoffee.com/ashleysnl";

const TOOLTIPS = {
  province: {
    term: "Province",
    plain: "Your province changes estimated provincial tax and benefit context.",
    why: "Taxes can materially change retirement income needs.",
    range: "All Canadian provinces are available. Default: NL.",
    example: "A plan in NL may estimate a different tax burden than the same income in ON.",
  },
  birthYear: {
    term: "Year of birth",
    plain: "Used to estimate your age each year in the projection.",
    why: "Age controls CPP/OAS start timing and retirement duration.",
    range: "Typical range: 1940-2008.",
    example: "Born in 1985 means age 65 in 2050.",
  },
  retirementAge: {
    term: "Retirement age",
    plain: "Age when your plan switches from saving to drawing income.",
    why: "Earlier retirement means fewer saving years and longer drawdown years.",
    range: "Typical range: 55-70.",
    example: "Retiring at 60 instead of 65 increases years your savings must support.",
  },
  lifeExpectancy: {
    term: "Life expectancy",
    plain: "How long the model projects your retirement spending.",
    why: "Longer horizon requires more assets or lower annual spending.",
    range: "Typical planning range: 85-100.",
    example: "Planning to age 95 tests longevity risk.",
  },
  desiredSpending: {
    term: "Desired retirement spending",
    plain: "Your annual after-tax spending goal in today’s dollars.",
    why: "This is the target your income sources and savings must cover.",
    range: "Varies by household and location.",
    example: "$60,000 today at 2% inflation is about $73,000 in 10 years.",
  },
  inflation: {
    term: "Inflation",
    plain: "Annual increase applied to future spending and optionally tax brackets.",
    why: "Higher inflation can raise the long-term draw required from savings.",
    range: "Typical long-term assumption: 1.5%-3.0%.",
    example: "At 2%, costs roughly double in about 36 years.",
  },
  currentSavings: {
    term: "Current total savings",
    plain: "Your starting investable balance across all accounts.",
    why: "Starting balance is a major driver of retirement readiness.",
    range: "Any non-negative value.",
    example: "$200,000 today compounds over your remaining working years.",
  },
  annualContribution: {
    term: "Annual contribution",
    plain: "How much you add to savings each year before retirement.",
    why: "Regular contributions can significantly increase retirement assets.",
    range: "Any non-negative value.",
    example: "$8,000 per year for 20 years adds $160,000 before growth.",
  },
  contributionIncrease: {
    term: "Contribution increase (%/year)",
    plain: "Annual percentage increase applied to your savings contribution before retirement.",
    why: "Gradually increasing contributions can materially improve retirement readiness.",
    range: "Typical range: 0%-5% per year.",
    example: "A $10,000 contribution growing 3% yearly becomes about $13,439 in year 10.",
  },
  capitalInjectAmount: {
    term: "Lump-sum amount",
    plain: "A one-time amount added to investable assets at a specific age.",
    why: "Large one-time proceeds can materially improve retirement sustainability.",
    range: "Any non-negative value.",
    example: "Downsizing a home might add a $150,000 one-time injection at age 67.",
  },
  capitalInjectAge: {
    term: "Lump-sum age",
    plain: "The age when the one-time capital injection is received.",
    why: "Timing changes compounding and how long the capital supports spending.",
    range: "Typical planning range: 50-95.",
    example: "A lump sum at 60 has more time to compound than the same amount at 75.",
  },
  riskProfile: {
    term: "Risk profile",
    plain: "Maps to default long-term return assumptions.",
    why: "Expected returns directly affect projected balances.",
    range: "Conservative, Balanced, Aggressive.",
    example: "Balanced defaults near 5.5% nominal annual return.",
  },
  pensionAmount: {
    term: "Workplace pension amount",
    plain: "Annual pension income before tax once it starts.",
    why: "Guaranteed income reduces withdrawal pressure on savings.",
    range: "Depends on pension plan terms.",
    example: "$18,000/year pension can cover a meaningful baseline of spending.",
  },
  pensionStartAge: {
    term: "Pension start age",
    plain: "Age pension payments begin.",
    why: "Later starts create more early-retirement funding needs.",
    range: "Typical range: 55-70.",
    example: "If pension starts at 65 but retirement is 60, savings bridge 5 years.",
  },
  cppAmount65: {
    term: "CPP estimate at 65",
    plain: "Estimated annual CPP amount if started at age 65.",
    why: "CPP is a core retirement income source for many Canadians.",
    range: "Personal estimate from Service Canada statements.",
    example: "$12,000/year at 65 can change with early or late start.",
  },
  cppStartAge: {
    term: "CPP start age",
    plain: "Age you plan to start CPP (60-70).",
    why: "Starting earlier lowers annual amount; delaying raises it.",
    range: "Allowed range: 60-70.",
    example: "Starting at 70 can materially increase annual CPP versus 65.",
  },
  oasAmount65: {
    term: "OAS estimate at 65",
    plain: "Estimated annual OAS amount if started at 65.",
    why: "OAS contributes to baseline retirement income after 65.",
    range: "Based on residency and eligibility.",
    example: "Delaying OAS can increase annual benefit.",
  },
  oasStartAge: {
    term: "OAS start age",
    plain: "Age you plan to start OAS (65-70).",
    why: "Start timing changes annual OAS amount and clawback exposure.",
    range: "Allowed range: 65-70.",
    example: "Starting at 68 increases annual OAS versus 65.",
  },
  spousePensionAmount: {
    term: "Spouse pension amount",
    plain: "Annual workplace/private pension income for spouse before tax.",
    why: "Spousal guaranteed income can reduce household savings withdrawals.",
    range: "Any non-negative value.",
    example: "A spouse pension of $10,000/year lowers portfolio draw needs.",
  },
  spousePensionStartAge: {
    term: "Spouse pension start age",
    plain: "Age when spouse pension starts.",
    why: "Timing determines how much early-retirement gap remains.",
    range: "Typical range: 55-70.",
    example: "If spouse pension starts at 65, years before 65 need other funding.",
  },
  spouseCppAmount65: {
    term: "Spouse CPP estimate at 65",
    plain: "Estimated annual spouse CPP at age 65.",
    why: "Adds household guaranteed income in retirement.",
    range: "Personal estimate from Service Canada statements.",
    example: "Spouse CPP can materially improve first-year retirement coverage.",
  },
  spouseCppStartAge: {
    term: "Spouse CPP start age",
    plain: "Age spouse plans to start CPP (60-70).",
    why: "Earlier or later start changes annual spouse CPP amount.",
    range: "Allowed range: 60-70.",
    example: "Delaying spouse CPP can increase late-retirement guaranteed income.",
  },
  spouseOasAmount65: {
    term: "Spouse OAS estimate at 65",
    plain: "Estimated annual spouse OAS at age 65.",
    why: "Adds to household baseline retirement income.",
    range: "Based on eligibility and residency history.",
    example: "Spouse OAS can reduce total required account withdrawals.",
  },
  spouseOasStartAge: {
    term: "Spouse OAS start age",
    plain: "Age spouse plans to start OAS (65-70).",
    why: "Start timing affects annual benefit and clawback exposure.",
    range: "Allowed range: 65-70.",
    example: "Starting at 67 gives higher annual OAS than 65.",
  },
  scenarioSpread: {
    term: "Scenario spread",
    plain: "Difference used to create best/base/worst deterministic return scenarios.",
    why: "Helps compare sensitivity to return assumptions.",
    range: "Typical range: 1%-3%.",
    example: "Base 5.5% with spread 2% gives 3.5% worst and 7.5% best.",
  },
  volatility: {
    term: "Volatility",
    plain: "Planning volatility input for education and stress framing.",
    why: "Higher volatility means wider range of possible outcomes.",
    range: "Typical long-term annualized range: 6%-15%.",
    example: "A more volatile portfolio may deviate further from base projections.",
  },
  rrsp: {
    term: "RRSP/RRIF account",
    plain: "Tax-deferred account; withdrawals are generally taxable.",
    why: "Withdrawal order affects taxes and government benefit interactions.",
    range: "Any non-negative value.",
    example: "Large RRSP withdrawals can raise taxable income and clawback risk.",
  },
  tfsa: {
    term: "TFSA account",
    plain: "Tax-free savings account; eligible withdrawals are tax-free.",
    why: "Useful for flexible, tax-efficient retirement cash flow.",
    range: "Any non-negative value.",
    example: "Using TFSA withdrawals can reduce taxable income in high-tax years.",
  },
  nonRegistered: {
    term: "Non-registered account",
    plain: "Taxable investment account outside RRSP/TFSA.",
    why: "Some withdrawal amounts may be taxable depending on gains/income type.",
    range: "Any non-negative value.",
    example: "Capital gains are typically taxed more favorably than full-income withdrawals.",
  },
  cash: {
    term: "Cash account",
    plain: "Liquid cash reserve for short-term spending needs.",
    why: "Can reduce forced selling during market stress.",
    range: "Any non-negative value.",
    example: "A cash buffer can help cover 1-2 years of spending gaps.",
  },
  kpiBalanceRetirement: {
    term: "Balance at retirement",
    plain: "Estimated portfolio value at your retirement age.",
    why: "This is your starting pool for retirement withdrawals.",
    range: "Based on your savings, contributions, returns, and timeline.",
    example: "Higher contributions can lift this value materially.",
  },
  kpiSpendingTarget: {
    term: "After-tax spending target",
    plain: "How much spendable cash you want in retirement.",
    why: "This is the benchmark income your plan needs to deliver.",
    range: "Set in guided and advanced inputs.",
    example: "$70,000 means $70,000 to spend after tax.",
  },
  kpiGuaranteedIncome: {
    term: "Guaranteed income",
    plain: "Combined pension, CPP, and OAS available for spending in the year. In summary views this is shown after estimated tax when tax estimates are enabled.",
    why: "This is the portion of spending covered before savings withdrawals are needed.",
    range: "Depends on benefit amounts and start ages.",
    example: "If after-tax guaranteed income covers most spending, required withdrawals are lower.",
  },
  kpiCoveragePercent: {
    term: "Guaranteed-income coverage",
    plain: "The share of your after-tax spending target covered by after-tax guaranteed income alone.",
    why: "It shows how dependent the plan is on savings withdrawals.",
    range: "100% means guaranteed income alone covers the full spending target on the same after-tax basis.",
    example: "If after-tax guaranteed income is $45k and spending target is $60k, coverage is 75%.",
  },
  kpiNetGap: {
    term: "Net gap from savings",
    plain: "The after-tax spending shortfall not covered by guaranteed income.",
    why: "This is the net amount your savings must provide.",
    range: "Cannot be below zero.",
    example: "If spending is $60k and guaranteed net is $45k, gap is about $15k.",
  },
  kpiGrossWithdrawal: {
    term: "Gross withdrawal required",
    plain: "The pre-tax RRSP/RRIF withdrawal needed to fund the net gap.",
    why: "Withdrawals are taxable, so gross is often higher than net needed.",
    range: "Depends on taxable income and tax rate in that year.",
    example: "A $20k net gap may require a $26k gross withdrawal.",
  },
  netSpendingAvailable: {
    term: "Net spending available",
    plain: "Total spendable cash flow after estimated tax and clawback for the selected year.",
    why: "This is the amount available to actually fund spending.",
    range: "Usually equals guaranteed income after tax plus net withdrawals.",
    example: "If guaranteed income nets $45k and net withdrawals add $15k, net spending available is $60k.",
  },
  taxDrag: {
    term: "Tax and clawback drag",
    plain: "The portion of gross withdrawals that does not become spendable cash because of estimated income tax and any modeled OAS clawback.",
    why: "This explains why gross withdrawals can be larger than the net spending gap.",
    range: "Zero when tax estimates are disabled or no taxable withdrawal is required.",
    example: "A $28k gross withdrawal with $6k tax/clawback drag leaves about $22k net to spend.",
  },
  registeredAssumption: {
    term: "Registered-only assumption",
    plain: "This dashboard currently treats all savings withdrawals as RRSP/RRIF taxable withdrawals.",
    why: "It makes the tax wedge clear and easier to interpret.",
    range: "TFSA/cash effects are intentionally excluded here.",
    example: "If you had TFSA withdrawals, tax wedge could be smaller than shown.",
  },
  rrifConversionAge: {
    term: "RRIF conversion age",
    plain: "Age when RRSP is treated as RRIF for minimum withdrawal rules.",
    why: "From this age, minimum withdrawals can force taxable income.",
    range: "Typical conversion age: 71.",
    example: "At 71, required RRIF minimums may raise taxable income even if spending is lower.",
  },
  rrifMinimums: {
    term: "RRIF minimum withdrawals",
    plain: "Annual minimum percentage that must be withdrawn from RRIF by age.",
    why: "Can increase taxes and OAS clawback exposure in later retirement.",
    range: "Age-based schedule from CRA.",
    example: "If required minimum exceeds your spending gap, taxable income still rises.",
  },
  oasClawback: {
    term: "OAS clawback",
    plain: "OAS can be reduced when taxable income exceeds the recovery threshold.",
    why: "Higher taxable withdrawals can reduce net OAS received.",
    range: "Calculated using a planning threshold and 15% recovery rate.",
    example: "Large RRIF withdrawals can trigger partial OAS recovery tax.",
  },
  learnInflationCalc: {
    term: "Inflation spending calculator",
    plain: "Shows how a spending amount today grows over time with inflation.",
    why: "Retirement budgets need future-dollar planning, not just today’s prices.",
    range: "Common inflation assumptions are around 1.5%-3.0%.",
    example: "$80,000 today at 2.5% for 10 years is about $102,000.",
  },
  learnTaxGrossUp: {
    term: "Tax gross-up",
    plain: "To receive a net amount after tax, you must withdraw a larger gross amount.",
    why: "This explains why RRSP/RRIF withdrawals can exceed your spending gap.",
    range: "Effective tax rates vary by income and province.",
    example: "If you need $80,000 net and tax is 22%, gross is about $102,564.",
  },
  learnRrifMinimum: {
    term: "RRIF minimum withdrawal",
    plain: "RRIF rules require a minimum annual withdrawal based on age.",
    why: "Minimums can force higher taxable income in later retirement.",
    range: "Starts at age 71 conversion, then rises with age.",
    example: "At age 72, minimum is about 5.40% of RRIF balance.",
  },
  learnOasClawback: {
    term: "OAS clawback estimator",
    plain: "OAS can be reduced when income exceeds the annual recovery threshold.",
    why: "Higher taxable income may reduce government benefits.",
    range: "Recovery tax is 15% of income above threshold (up to full OAS).",
    example: "If income is above threshold, part of OAS is paid back.",
  },
  learnPensionSplit: {
    term: "Spousal pension splitting",
    plain: "Eligible pension income can be shifted between spouses (up to 50%) for tax purposes.",
    why: "Balancing taxable income between spouses can lower total household tax.",
    range: "Split percentage can range from 0% to 50%.",
    example: "Shifting pension from higher-income spouse may reduce combined tax.",
  },
  phaseWeightedSpending: {
    term: "Phase-weighted annual spending",
    plain: "A single average annual spending value based on your Go-Go, Slow-Go, and No-Go years.",
    why: "It summarizes a changing spending path into one planning benchmark.",
    range: "Depends on your base spending, phase percentages, and years in each phase.",
    example: "Higher Go-Go spending and longer Go-Go years raise the weighted average.",
  },
  stressScenario: {
    term: "Stress scenario",
    plain: "A simple what-if case that changes return and inflation assumptions.",
    why: "It helps you see how sensitive your plan is to good or bad environments.",
    range: "Shown as best, base, and downside cases.",
    example: "Downside means lower returns and higher inflation than your base assumptions.",
  },
  stressGapSurplus: {
    term: "First-year gap/surplus",
    plain: "Difference between your retirement spending target and available income in the first retirement year.",
    why: "A gap means savings must fund the shortfall; a surplus gives flexibility.",
    range: "Negative values are gaps, positive values are surpluses.",
    example: "-$8,000 means you need extra savings withdrawals in year one.",
  },
  depletionAge: {
    term: "Depletion age",
    plain: "The age when projected savings reach zero in a scenario.",
    why: "It highlights longevity risk if withdrawals outpace portfolio growth.",
    range: "If assets last through your horizon, depletion is not triggered.",
    example: "Depletion at age 88 means the model runs out of savings at 88.",
  },
  strategyLifetimeTaxes: {
    term: "Estimated lifetime taxes",
    plain: "Total projected taxes paid across your full retirement projection for this strategy.",
    why: "Comparing lifetime tax totals helps evaluate withdrawal order tradeoffs.",
    range: "Planning estimate only; actual taxes will vary by year and rules.",
    example: "A lower lifetime tax total can leave more net spending capacity.",
  },
  strategyLifetimeClawback: {
    term: "Estimated lifetime OAS clawback",
    plain: "Total projected OAS recovery tax across your full retirement projection.",
    why: "Strategies with higher taxable income can increase clawback over time.",
    range: "Zero if income stays below clawback thresholds or OAS is not received.",
    example: "Large RRIF withdrawals can raise lifetime clawback totals.",
  },
  forcedRrifDrawdown: {
    term: "Forced RRIF drawdown",
    plain: "After RRSP converts to RRIF, Canada requires a minimum annual withdrawal.",
    why: "This can increase taxable income and tax even if spending needs are lower.",
    range: "Starts at your RRIF conversion age (commonly 71) and rises with age.",
    example: "At older ages, minimum RRIF withdrawals can exceed your spending gap.",
  },
  oasRiskMeter: {
    term: "OAS clawback risk",
    plain: "A simple Low/Med/High badge based on projected clawback amount.",
    why: "It helps quickly identify if taxable retirement income may reduce OAS.",
    range: "Low: none/minimal, Medium: moderate, High: substantial.",
    example: "High risk suggests withdrawals may be pushing income above clawback thresholds.",
  },
  retirementScore: {
    term: "Retirement plan score",
    plain: "A planning heuristic score from 0-100 based on coverage, longevity buffer, tax drag, clawback exposure, and RRIF shock.",
    why: "It provides a quick directional summary of plan strength and weak spots.",
    range: "Higher is generally better under current assumptions.",
    example: "A low depletion sub-score indicates longevity risk.",
  },
  coverageScoreWeights: {
    term: "Coverage score weights",
    plain: "The score blends coverage ratio, depletion risk, tax drag, clawback exposure, and RRIF shock.",
    why: "It keeps the score transparent and easy to audit.",
    range: "Coverage 35 points, longevity 30, tax drag 15, clawback 10, RRIF shock 10.",
    example: "If your coverage ratio improves, your score usually rises first.",
  },
  cppOasTimingSim: {
    term: "CPP/OAS timing simulator",
    plain: "Previews start-age changes for CPP and OAS without immediately overwriting your plan.",
    why: "Timing affects withdrawals, tax drag, and clawback in different years.",
    range: "CPP ages 60-70 and OAS ages 65-70.",
    example: "Delaying CPP can reduce early cash flow but increase later guaranteed income.",
  },
  rrspMeltdown: {
    term: "RRSP meltdown strategy",
    plain: "A planned early-withdrawal approach from RRSP/RRIF to smooth later taxes.",
    why: "It can reduce future RRIF pressure and potential OAS clawback exposure.",
    range: "Strategy setting only; personal suitability varies.",
    example: "Extra withdrawals before age 71 can reduce forced minimum pressure later.",
  },
};

const OFFICIAL_REFERENCES = OFFICIAL_SOURCES;

const PLAN_SUMMARY_ROWS = [
  { key: "province", label: "Province", tooltip: "province" },
  { key: "retirementAge", label: "Retirement age", tooltip: "retirementAge" },
  { key: "desiredSpending", label: "Annual spending target", tooltip: "desiredSpending" },
  { key: "inflation", label: "Inflation", tooltip: "inflation" },
  { key: "returnProfile", label: "Investment return profile", tooltip: "riskProfile" },
  { key: "cpp", label: "CPP income at 65", tooltip: "cppAmount65" },
  { key: "oas", label: "OAS income at 65", tooltip: "oasAmount65" },
  { key: "pension", label: "Private/workplace pension", tooltip: "pensionAmount" },
  { key: "savings", label: "Savings balance", tooltip: "currentSavings" },
  { key: "contribution", label: "Annual contributions", tooltip: "annualContribution" },
];

const LEARN_PROGRESS_ITEMS = [
  { key: "inflation", label: "Inflation" },
  { key: "income", label: "Income Sources" },
  { key: "taxes", label: "Taxes" },
  { key: "rrif", label: "RRIF Rules" },
  { key: "oas", label: "OAS Clawback" },
  { key: "strategy", label: "Withdrawal Strategy" },
  { key: "stress", label: "Stress Testing" },
];

/* FILE: src/ui/formatters.js */
function toPct(decimal) {
  return Number(decimal) * 100;
}

function normalizePct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n > 1) return n / 100;
  return n;
}

function formatPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatSignedPct(value) {
  const pct = value * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value || 0);
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 1, notation: "compact" }).format(value || 0);
}

function formatSignedCurrency(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatCurrency(value)}`;
}

function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return String(Math.round(n * 1000) / 1000);
}

function capitalize(value) {
  return String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* FILE: src/ui/actions/planActions.js */
function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function shouldUseBlockingImportMessage() {
  try {
    return typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(max-width: 1100px)").matches;
  } catch {
    return false;
  }
}

function stripBom(text) {
  return typeof text === "string" ? text.replace(/^\uFEFF/, "") : "";
}

function readFileAsText(file) {
  if (!file) return Promise.resolve("");
  if (typeof file.text === "function") {
    return file.text().then(stripBom);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => resolve(stripBom(String(reader.result || "")));
    reader.readAsText(file);
  });
}

function hasOwnPath(obj, path) {
  const keys = path.split(".");
  let ref = obj;
  for (const key of keys) {
    if (!ref || typeof ref !== "object" || !Object.prototype.hasOwnProperty.call(ref, key)) return false;
    ref = ref[key];
  }
  return true;
}

function getByPath(obj, path) {
  const keys = path.split(".");
  let ref = obj;
  for (const key of keys) {
    if (!ref || typeof ref !== "object") return undefined;
    ref = ref[key];
  }
  return ref;
}

function verifyImportedCoreFields(parsed, normalized) {
  const mismatches = [];
  const checks = [
    ["profile.retirementAge", (value) => Number(value), (value) => Number(value)],
    ["profile.lifeExpectancy", (value) => Number(value), (value) => Number(value)],
    ["profile.desiredSpending", (value) => Number(value), (value) => Number(value)],
    ["savings.currentTotal", (value) => Number(value), (value) => Number(value)],
    ["savings.annualContribution", (value) => Number(value), (value) => Number(value)],
    ["income.pension.enabled", (value) => Boolean(value), (value) => Boolean(value)],
    ["income.pension.amount", (value) => Number(value), (value) => Number(value)],
  ];

  checks.forEach(([path, parseExpected, parseActual]) => {
    if (!hasOwnPath(parsed, path)) return;
    const expected = parseExpected(getByPath(parsed, path));
    const actual = parseActual(getByPath(normalized, path));
    if (Number.isNaN(expected) || Number.isNaN(actual)) return;
    if (expected !== actual) mismatches.push(`${path}: expected ${expected}, got ${actual}`);
  });

  if (mismatches.length) {
    throw new Error(`Imported file did not round-trip cleanly. ${mismatches.slice(0, 3).join(" • ")}`);
  }
}

function buildPortableUiState(uiState = {}) {
  return {
    hasStarted: Boolean(uiState.hasStarted),
    experienceMode: uiState.experienceMode === "advanced" ? "advanced" : "beginner",
    wizardStep: Number.isFinite(Number(uiState.wizardStep)) ? Number(uiState.wizardStep) : 1,
    showAdvancedControls: Boolean(uiState.showAdvancedControls),
    showScenarioCompare: Boolean(uiState.showScenarioCompare),
    showGrossWithdrawals: Boolean(uiState.showGrossWithdrawals ?? true),
    emphasizeTaxes: Boolean(uiState.emphasizeTaxes ?? true),
    timelineSelectedAge: Number.isFinite(Number(uiState.timelineSelectedAge)) ? Number(uiState.timelineSelectedAge) : null,
    incomeMap: cloneJson(uiState.incomeMap || {}),
    timingSim: cloneJson(uiState.timingSim || {}),
    clientSummary: cloneJson(uiState.clientSummary || {}),
    learn: cloneJson(uiState.learn || {}),
    learningProgress: cloneJson(uiState.learningProgress || {}),
    unlocked: cloneJson(uiState.unlocked || {}),
  };
}

function buildPortablePlan(state) {
  return {
    version: state.version,
    profile: cloneJson(state.profile || {}),
    assumptions: cloneJson(state.assumptions || {}),
    savings: cloneJson(state.savings || {}),
    income: cloneJson(state.income || {}),
    accounts: cloneJson(state.accounts || {}),
    strategy: cloneJson(state.strategy || {}),
    uiState: buildPortableUiState(state.uiState || {}),
    notes: typeof state.notes === "string" ? state.notes : "",
  };
}

function sanitizeImportedPlan(parsed) {
  if (!parsed || typeof parsed !== "object") return parsed;
  const sanitized = buildPortablePlan(parsed);
  sanitized.uiState = {
    ...sanitized.uiState,
    firstRun: false,
    hasStarted: true,
    activeNav: "dashboard",
    dashboardScenario: "base",
    advancedSearch: "",
    justCompletedWizard: false,
    selectedScenarioLabel: "",
    lastChangeSummary: null,
    scenarios: [],
    supportShownEvents: {
      wizardComplete: false,
      firstGrossUp: false,
      firstClawback: false,
      reportGenerated: false,
    },
  };
  return sanitized;
}

function exportPlanJson(state, toast) {
  const exportObject = {
    ...buildPortablePlan(state),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `retirement-plan-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  if (typeof toast === "function") toast("Plan exported.");
}

async function importPlanFromFile({
  file,
  normalizePlan,
  onPlanLoaded,
  toast,
  onImportError,
}) {
  if (!file) return;

  try {
    const text = await readFileAsText(file);
    const parsed = JSON.parse(text);
    const normalized = normalizePlan(sanitizeImportedPlan(parsed));
    verifyImportedCoreFields(parsed, normalized);
    onPlanLoaded(normalized);
    if (typeof toast === "function") toast("Plan imported.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    if (typeof toast === "function") toast(`Import error: ${message}`);
    if (typeof onImportError === "function") onImportError(message);
    else if (shouldUseBlockingImportMessage()) alert(`Import error:\n${message}`);
  }
}

async function importPlanFromFileInput({
  fileInput,
  normalizePlan,
  onPlanLoaded,
  toast,
  onImportError,
}) {
  const file = fileInput?.files?.[0];
  try {
    await importPlanFromFile({
      file,
      normalizePlan,
      onPlanLoaded,
      toast,
      onImportError,
    });
  } finally {
    if (fileInput) fileInput.value = "";
  }
}

function promptImportPlan(options) {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "application/json,.json";
  picker.style.position = "fixed";
  picker.style.left = "-9999px";
  picker.style.opacity = "0";
  document.body.appendChild(picker);

  const cleanup = () => {
    picker.value = "";
    picker.remove();
  };

  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    try {
      await importPlanFromFile({
        file,
        normalizePlan: options.normalizePlan,
        onPlanLoaded: options.onPlanLoaded,
        toast: options.toast,
        onImportError: options.onImportError,
      });
    } finally {
      cleanup();
    }
  }, { once: true });

  picker.click();
}

/* FILE: src/ui/fields.js */
function createUiFieldHelpers({ tooltips, escapeHtml, formatNumber }) {
  function tooltipButton(key) {
    const term = tooltips[key]?.term || key;
    return `<button class="tooltip-trigger" type="button" aria-label="Help: ${escapeHtml(term)}" data-tooltip-key="${escapeHtml(key)}">ⓘ</button>`;
  }

  function numberField(label, bind, value, attrs, tooltipKey, percentInput = false, disabled = false, compact = false) {
    const finalValue = percentInput ? formatNumber(value) : formatNumber(value);
    const attrString = Object.entries(attrs || {})
      .map(([k, v]) => `${k}="${String(v)}"`)
      .join(" ");

    return `
      <label class="${compact ? "compact-field" : ""}">
        <span class="label-row">${escapeHtml(label)} ${tooltipButton(tooltipKey)}</span>
        <input
          type="number"
          data-bind="${bind}"
          data-type="number"
          ${percentInput ? 'data-percent-input="1"' : ""}
          value="${finalValue}"
          ${attrString}
          ${disabled ? "disabled" : ""}
          aria-label="${escapeHtml(label)}"
        />
      </label>
    `;
  }

  function learnNumberField(label, bind, value, attrs, tooltipKey, percentInput = false, disabled = false, compact = false) {
    const finalValue = percentInput ? formatNumber(value) : formatNumber(value);
    const attrString = Object.entries(attrs || {})
      .map(([k, v]) => `${k}="${String(v)}"`)
      .join(" ");

    return `
      <label class="${compact ? "compact-field" : ""}">
        <span class="label-row">${escapeHtml(label)} ${tooltipButton(tooltipKey)}</span>
        <input
          type="number"
          data-learn-bind="${bind}"
          data-type="number"
          ${percentInput ? 'data-percent-input="1"' : ""}
          value="${finalValue}"
          ${attrString}
          ${disabled ? "disabled" : ""}
          aria-label="${escapeHtml(label)}"
        />
      </label>
    `;
  }

  function selectField(label, bind, options, selected, tooltipKey, compact = false) {
    return `
      <label class="${compact ? "compact-field" : ""}">
        <span class="label-row">${escapeHtml(label)} ${tooltipButton(tooltipKey)}</span>
        <select data-bind="${bind}" aria-label="${escapeHtml(label)}">
          ${options.map((opt) => `
            <option value="${opt.value}" ${opt.value === selected ? "selected" : ""}>${escapeHtml(opt.label)}</option>
          `).join("")}
        </select>
      </label>
    `;
  }

  return {
    tooltipButton,
    numberField,
    learnNumberField,
    selectField,
  };
}

/* FILE: src/ui/charts.js */
function drawPortfolioChart({
  canvas,
  rows,
  bestRows,
  worstRows,
  showStressBand,
  formatCurrency,
  formatCompactCurrency,
}) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 40) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(800, Math.floor(rect.width * dpr));
  canvas.height = Math.floor(320 * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 320;
  const pad = { left: 54, right: 16, top: 18, bottom: 36 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  const values = [];
  rows.forEach((row) => values.push(row.balance));
  if (showStressBand) {
    (bestRows || []).forEach((row) => values.push(row.balance));
    (worstRows || []).forEach((row) => values.push(row.balance));
  }
  const maxY = Math.max(1, ...values) * 1.06;

  ctx.strokeStyle = "#dfe7f3";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const gy = pad.top + (innerH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, gy);
    ctx.lineTo(w - pad.right, gy);
    ctx.stroke();
  }

  const x = (index) => pad.left + (innerW * index) / Math.max(1, rows.length - 1);
  const y = (value) => pad.top + innerH - (value / maxY) * innerH;
  const baselineY = pad.top + innerH;

  const balanceGradient = ctx.createLinearGradient(pad.left, pad.top, w - pad.right, h - pad.bottom);
  balanceGradient.addColorStop(0, "#0f6abf");
  balanceGradient.addColorStop(1, "#0ea5a8");
  const balanceArea = ctx.createLinearGradient(0, pad.top, 0, baselineY);
  balanceArea.addColorStop(0, "rgba(15, 106, 191, 0.26)");
  balanceArea.addColorStop(1, "rgba(14, 165, 168, 0.04)");

  if (showStressBand && Array.isArray(bestRows) && bestRows.length === rows.length) {
    plotLine(ctx, bestRows.map((r, i) => [x(i), y(r.balance)]), "#7aa7d8", 1.6, [4, 4]);
  }
  if (showStressBand && Array.isArray(worstRows) && worstRows.length === rows.length) {
    plotLine(ctx, worstRows.map((r, i) => [x(i), y(r.balance)]), "#7aa7d8", 1.6, [4, 4]);
  }

  const balancePoints = rows.map((r, i) => [x(i), y(r.balance)]);
  if (balancePoints.length > 1) {
    ctx.beginPath();
    ctx.moveTo(balancePoints[0][0], baselineY);
    balancePoints.forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(balancePoints[balancePoints.length - 1][0], baselineY);
    ctx.closePath();
    ctx.fillStyle = balanceArea;
    ctx.fill();
  }

  plotLine(ctx, balancePoints, balanceGradient, 2.8);

  ctx.fillStyle = "#5f6b7d";
  ctx.font = "12px Avenir Next";
  ctx.fillText(formatCurrency(0), 8, h - 10);
  ctx.fillText(formatCompactCurrency(maxY), 8, pad.top + 4);

  const last = rows[rows.length - 1];
  const approxTickCount = Math.max(3, Math.floor(innerW / 120));
  const step = Math.max(1, Math.ceil((rows.length - 1) / approxTickCount));
  for (let i = 0; i < rows.length; i += step) {
    const label = `Age ${rows[i].age}`;
    const lx = x(i);
    const lw = ctx.measureText(label).width;
    const drawX = Math.max(pad.left, Math.min(w - pad.right - lw, lx - lw / 2));
    ctx.fillText(label, drawX, h - 10);
  }
  const endLabel = `Age ${last.age}`;
  const endWidth = ctx.measureText(endLabel).width;
  ctx.fillText(endLabel, w - pad.right - endWidth, h - 10);
}

function drawIncomeCoverageChart({
  canvas,
  rows,
  selectedAge,
  showTodaysDollars,
  showGrossWithdrawals,
  emphasizeTaxes = true,
  currentYear,
  inflationRate,
  formatCurrency,
  formatCompactCurrency,
}) {
  if (!canvas || !rows.length) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 40) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(800, Math.floor(rect.width * dpr));
  canvas.height = Math.floor(340 * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = 340;
  const pad = { left: 52, right: 16, top: 16, bottom: 36 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  ctx.clearRect(0, 0, w, h);

  const amountForDisplay = (row, amount) => {
    if (!showTodaysDollars) return amount;
    const yearsFromNow = Math.max(0, row.year - currentYear);
    return amount / Math.pow(1 + inflationRate, yearsFromNow);
  };

  const values = [];
  rows.forEach((row) => {
    values.push(
      amountForDisplay(row, row.guaranteedNet + row.netFromWithdrawal + row.taxOnWithdrawal + row.oasClawback),
      amountForDisplay(row, row.spending)
    );
  });
  const maxY = Math.max(1, ...values) * 1.15;

  const x = (i) => pad.left + (innerW * i) / Math.max(1, rows.length - 1);
  const y = (v) => pad.top + innerH - (v / maxY) * innerH;
  const barW = Math.max(6, Math.min(14, innerW / Math.max(rows.length, 30)));

  ctx.strokeStyle = "#e1e8f3";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const gy = pad.top + (innerH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, gy);
    ctx.lineTo(w - pad.right, gy);
    ctx.stroke();
  }

  rows.forEach((row, idx) => {
    const cx = x(idx) - barW / 2;
    const pension = amountForDisplay(row, row.pensionNet + row.spousePensionNet);
    const cpp = amountForDisplay(row, row.cppNet + row.spouseCppNet);
    const oas = amountForDisplay(row, row.oasNet + row.spouseOasNet);
    const netW = amountForDisplay(row, row.netFromWithdrawal);
    const taxW = amountForDisplay(row, row.taxOnWithdrawal + row.oasClawback);

    let stack = 0;
    const segments = [
      [pension, "#f59e0b"],
      [cpp, "#16a34a"],
      [oas, "#0ea5a8"],
      [netW, "#0f6abf"],
      [showGrossWithdrawals ? taxW : Math.min(taxW, maxY * 0.01), emphasizeTaxes ? "#d9485f" : "#e48a98"],
    ];
    segments.forEach(([value, color], segIdx) => {
      if (value <= 0) return;
      const yTop = y(stack + value);
      const yBottom = y(stack);
      ctx.fillStyle = color;
      ctx.fillRect(cx, yTop, barW, Math.max(1, yBottom - yTop));
      if (segIdx === 4 && emphasizeTaxes) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 1;
        const hSeg = Math.max(1, yBottom - yTop);
        for (let yy = yTop - barW; yy < yTop + hSeg + barW; yy += 5) {
          ctx.beginPath();
          ctx.moveTo(cx, yy);
          ctx.lineTo(cx + barW, yy + barW);
          ctx.stroke();
        }
        ctx.restore();
        if (hSeg > 14) {
          ctx.fillStyle = "rgba(255,255,255,0.86)";
          ctx.fillRect(cx + 1, yTop + 1, Math.max(1, barW - 2), 12);
          ctx.fillStyle = "#7f1d1d";
          ctx.font = "10px Avenir Next";
          ctx.fillText("Tax", cx + 3, yTop + Math.min(11, hSeg - 2));
        }
      }
      stack += value;
    });
  });

  const linePts = rows.map((r, i) => [x(i), y(amountForDisplay(r, r.spending))]);
  plotLine(ctx, linePts, "#111827", 1.8);

  const mark = findNearestRowByAge(rows, selectedAge);
  if (mark) {
    const idx = rows.findIndex((r) => r.age === mark.age);
    const mx = x(idx);
    ctx.strokeStyle = "rgba(15,106,191,0.45)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(mx, pad.top);
    ctx.lineTo(mx, pad.top + innerH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "#5f6b7d";
  ctx.font = "12px Avenir Next";
  ctx.fillText(formatCurrency(0), 8, h - 10);
  ctx.fillText(formatCompactCurrency(maxY), 8, pad.top + 4);
  const step = Math.max(1, Math.ceil((rows.length - 1) / Math.max(3, Math.floor(innerW / 110))));
  for (let i = 0; i < rows.length; i += step) {
    const label = `Age ${rows[i].age}`;
    const lx = x(i);
    const lw = ctx.measureText(label).width;
    ctx.fillText(label, clamp(lx - lw / 2, pad.left, w - pad.right - lw), h - 10);
  }
}

function plotLine(ctx, points, color, width, dash = []) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  points.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p[0], p[1]);
    else ctx.lineTo(p[0], p[1]);
  });
  ctx.stroke();
  ctx.setLineDash([]);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function findNearestRowByAge(rows, age) {
  if (!rows.length) return null;
  const exact = rows.find((row) => row.age === age);
  if (exact) return exact;
  let best = rows[0];
  let bestDistance = Math.abs(best.age - age);
  for (const row of rows) {
    const d = Math.abs(row.age - age);
    if (d < bestDistance) {
      best = row;
      bestDistance = d;
    }
  }
  return best;
}

/* FILE: src/ui/tooltips.js */
function renderTooltipPopover({ key, anchor, tooltipMap, layerEl, escapeHtml }) {
  const tip = tooltipMap[key];
  if (!tip || !anchor || !layerEl) return false;

  clearTooltipLayer(layerEl);

  const rect = anchor.getBoundingClientRect();
  const pop = document.createElement("div");
  pop.className = "tooltip-popover";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", `${tip.term} information`);
  pop.innerHTML = `
    <h4>${escapeHtml(tip.term)}</h4>
    <p><strong>Plain language:</strong> ${escapeHtml(tip.plain)}</p>
    <p><strong>Why it matters:</strong> ${escapeHtml(tip.why)}</p>
    <p><strong>Typical range:</strong> ${escapeHtml(tip.range)}</p>
    <div class="tooltip-actions">
      <button class="btn btn-primary" type="button" data-action="tooltip-example" data-value="${escapeHtml(key)}">Show example</button>
      <button class="btn btn-secondary" type="button" data-action="open-methodology">Learn more</button>
    </div>
    <p class="tooltip-example muted"></p>
  `;

  if (window.matchMedia("(max-width: 900px)").matches) {
    pop.classList.add("mobile-centered");
  } else {
    const top = rect.bottom + 8;
    const left = Math.max(10, Math.min(window.innerWidth - 330, rect.left - 140));
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;
  }
  layerEl.appendChild(pop);
  return true;
}

function clearTooltipLayer(layerEl) {
  if (!layerEl) return;
  layerEl.innerHTML = "";
}

function renderGlossaryHtml(tooltipMap, escapeHtml) {
  const entries = Object.values(tooltipMap).sort((a, b) => a.term.localeCompare(b.term));
  return entries.map((entry) => `
    <article class="glossary-item">
      <h3>${escapeHtml(entry.term)}</h3>
      <p><strong>Plain language:</strong> ${escapeHtml(entry.plain)}</p>
      <p><strong>Why it matters:</strong> ${escapeHtml(entry.why)}</p>
      <p><strong>Typical range:</strong> ${escapeHtml(entry.range)}</p>
      <p><strong>Example:</strong> ${escapeHtml(entry.example || "-")}</p>
    </article>
  `).join("");
}

/* FILE: src/ui/interactions.js */
function bindTooltipTriggers(container, { ui, openTooltip, closeTooltip }) {
  if (!(container instanceof HTMLElement)) return;
  const buttons = container.querySelectorAll("[data-tooltip-key]");
  buttons.forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    if (button.dataset.tipBound === "1") return;
    button.dataset.tipBound = "1";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const key = button.getAttribute("data-tooltip-key") || "";
      if (!key) return;
      if (ui.tooltipKey === key) closeTooltip();
      else openTooltip(key, button);
    });
    button.addEventListener("keydown", (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      const key = button.getAttribute("data-tooltip-key") || "";
      if (!key) return;
      if (ui.tooltipKey === key) closeTooltip();
      else openTooltip(key, button);
    });
  });
}

function renderCoverageHover(event, {
  model,
  state,
  chartEl,
  hoverEl,
  amountForDisplay,
  formatCurrency,
  clamp,
}) {
  if (!model || !chartEl || !hoverEl) return;
  const rows = model.base.rows.filter((row) => row.age >= state.profile.retirementAge);
  if (!rows.length) return;
  const rect = chartEl.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const idx = clamp(Math.round((x / rect.width) * (rows.length - 1)), 0, rows.length - 1);
  const row = rows[idx];
  const pension = amountForDisplay(row, row.pensionNet + row.spousePensionNet);
  const cpp = amountForDisplay(row, row.cppNet + row.spouseCppNet);
  const oas = amountForDisplay(row, row.oasNet + row.spouseOasNet);
  const netW = amountForDisplay(row, row.netFromWithdrawal);
  const taxW = amountForDisplay(row, row.taxOnWithdrawal + row.oasClawback);
  const spend = amountForDisplay(row, row.spending);
  hoverEl.innerHTML = `
    <strong>Age ${row.age}</strong><br>
    Pension: ${formatCurrency(pension)}<br>
    CPP: ${formatCurrency(cpp)}<br>
    OAS: ${formatCurrency(oas)}<br>
    Net withdrawal: ${formatCurrency(netW)}<br>
    Tax wedge (tax + clawback): ${formatCurrency(taxW)}<br>
    Spending target: ${formatCurrency(spend)}
  `;
  hoverEl.hidden = false;
  hoverEl.style.left = `${clamp(x + 10, 8, rect.width - 220)}px`;
  hoverEl.style.top = "8px";
}

function renderBalanceHover(event, {
  model,
  chartEl,
  hoverEl,
  formatCurrency,
  clamp,
}) {
  if (!model || !chartEl || !hoverEl) return;
  const rows = model.base.rows;
  if (!rows.length) return;
  const rect = chartEl.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const idx = clamp(Math.round((x / rect.width) * (rows.length - 1)), 0, rows.length - 1);
  const row = rows[idx];
  hoverEl.innerHTML = `<strong>Age ${row.age}</strong><br>Balance: ${formatCurrency(row.balance)}`;
  hoverEl.hidden = false;
  hoverEl.style.left = `${clamp(x + 10, 8, rect.width - 190)}px`;
  hoverEl.style.top = "8px";
}

/* FILE: src/ui/learnCharts.js */

function drawLearnLineChart(canvas, series, options = {}, formatCurrency, formatCompactCurrency) {
  drawLearnMultiLineChart(
    canvas,
    [series],
    {
      colors: [options.color || "#0f6abf"],
      fills: [options.fill || "rgba(15, 106, 191, 0.1)"],
      labels: [],
      xLabeler: options.xLabeler,
    },
    formatCurrency,
    formatCompactCurrency
  );
}

function drawLearnMultiLineChart(canvas, seriesList, options = {}, formatCurrency, formatCompactCurrency) {
  if (!canvas || !Array.isArray(seriesList) || !seriesList.length) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 40) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(640, Math.floor(rect.width * dpr));
  canvas.height = Math.floor(220 * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = 220;
  const pad = { left: 50, right: 12, top: 14, bottom: 30 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  ctx.clearRect(0, 0, w, h);

  const allValues = [];
  for (let i = 0; i < seriesList.length; i += 1) {
    const row = Array.isArray(seriesList[i]) ? seriesList[i] : [];
    for (let j = 0; j < row.length; j += 1) {
      const val = Number(row[j]);
      if (Number.isFinite(val)) allValues.push(val);
    }
  }
  if (!allValues.length) return;
  const maxY = Math.max(1, ...allValues) * 1.1;
  const maxLen = Math.max(2, ...seriesList.map((s) => s.length));
  const x = (idx) => pad.left + (innerW * idx) / Math.max(1, maxLen - 1);
  const y = (v) => pad.top + innerH - (v / maxY) * innerH;

  ctx.strokeStyle = "#e1e8f3";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const gy = pad.top + (innerH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, gy);
    ctx.lineTo(w - pad.right, gy);
    ctx.stroke();
  }

  seriesList.forEach((series, index) => {
    const points = series.map((v, i) => [x(i), y(v)]);
    const fill = options.fills?.[index];
    if (fill && points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], y(0));
      points.forEach((p) => ctx.lineTo(p[0], p[1]));
      ctx.lineTo(points[points.length - 1][0], y(0));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    plotLine(ctx, points, options.colors?.[index] || "#0f6abf", 2);
  });

  ctx.fillStyle = "#5f6b7d";
  ctx.font = "12px Avenir Next";
  const yMinLabel = safeFormat(formatCurrency, 0, "0");
  const yMaxLabel = safeFormat(formatCompactCurrency, maxY, String(Math.round(maxY)));
  ctx.fillText(yMinLabel, 8, h - 10);
  ctx.fillText(yMaxLabel, 8, pad.top + 4);
  const labeler = typeof options.xLabeler === "function"
    ? options.xLabeler
    : (i, total) => (i % Math.max(1, Math.ceil(total / 6)) === 0 ? `${i}` : "");
  let xLabelCount = 0;
  for (let i = 0; i < maxLen; i += 1) {
    const label = labeler(i, maxLen - 1);
    if (!label) continue;
    const lx = x(i);
    const lw = ctx.measureText(label).width;
    ctx.fillText(label, clamp(lx - lw / 2, pad.left, w - pad.right - lw), h - 10);
    xLabelCount += 1;
  }
  // Fallback labels for strict/buggy environments where custom label callbacks produce none.
  if (xLabelCount === 0) {
    const fallbackIdx = [0, Math.floor((maxLen - 1) / 2), maxLen - 1];
    fallbackIdx.forEach((i) => {
      const label = `${i}`;
      const lx = x(i);
      const lw = ctx.measureText(label).width;
      ctx.fillText(label, clamp(lx - lw / 2, pad.left, w - pad.right - lw), h - 10);
    });
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeFormat(formatter, value, fallback) {
  if (typeof formatter !== "function") return fallback;
  try {
    const out = formatter(value);
    if (out == null) return fallback;
    const text = String(out);
    return text.length ? text : fallback;
  } catch {
    return fallback;
  }
}

/* FILE: src/ui/navigation.js */
function navFromHash(hash, normalizeNavTarget) {
  const key = String(hash || "").replace("#", "").trim();
  if (key.startsWith("learn-")) return "learn";
  return normalizeNavTarget(key);
}

function syncNavHash(nav, normalizeNavTarget) {
  if (!history.replaceState) return;
  const safeNav = normalizeNavTarget(nav) || "results";
  history.replaceState(null, "", `#${safeNav}`);
}

function normalizeNavTarget(value) {
  const key = String(value || "").trim();
  if (key === "guided" || key === "start" || key === "inputs") return "plan";
  if (key === "dashboard" || key === "home") return "results";
  if (key === "stress" || key === "scenario") return "scenarios";
  if (key === "notes" || key === "export" || key === "advanced") return "tools";
  if (key === "method" || key === "methodology") return "tools";
  const allowed = new Set(["plan", "results", "scenarios", "learn", "tools", "support"]);
  return allowed.has(key) ? key : "";
}

/* FILE: src/ui/dashboardHelpers.js */
function getOasRiskLevel(amount) {
  const value = Math.max(0, Number(amount || 0));
  if (value < 500) return { label: "Low", className: "risk-low" };
  if (value < 3000) return { label: "Med", className: "risk-med" };
  return { label: "High", className: "risk-high" };
}

function amountForDisplay(row, amount, { showTodaysDollars, currentYear, inflationRate }) {
  if (!showTodaysDollars) return amount;
  const yearsFromNow = Math.max(0, row.year - currentYear);
  return amount / Math.pow(1 + inflationRate, yearsFromNow);
}

function findRowByAge(rows, age) {
  if (!rows.length) return null;
  const exact = rows.find((row) => row.age === age);
  if (exact) return exact;
  let best = rows[0];
  let bestDistance = Math.abs(best.age - age);
  for (const row of rows) {
    const d = Math.abs(row.age - age);
    if (d < bestDistance) {
      best = row;
      bestDistance = d;
    }
  }
  return best;
}

function findFirstRetirementRow(rows, retirementAge) {
  return rows.find((row) => row.age >= retirementAge) || rows[0] || null;
}

function getBalanceLegendItems(showStressBand) {
  const items = [["Portfolio balance", "#0f6abf"]];
  if (showStressBand) items.push(["Stress band (best/worst)", "#7aa7d8"]);
  return items;
}

function getCoverageLegendItems() {
  return [
    ["Guaranteed income: Pension", "#f59e0b"],
    ["Guaranteed income: CPP", "#16a34a"],
    ["Guaranteed income: OAS", "#0ea5a8"],
    ["From savings: RRSP/RRIF withdrawal (net)", "#0f6abf"],
    ["Tax on withdrawal + clawback (drag)", "#d9485f"],
    ["After-tax spending target", "#111827"],
  ];
}

function buildNextActions(model, advancedUnlocked) {
  const actions = [];
  if (model.kpis.firstYearGap < 0) {
    actions.push("Test a later retirement age or a lower spending target first.");
    actions.push("If the gap still remains, increase annual savings or add more guaranteed income.");
  } else {
    actions.push("Your base case looks workable. Pressure-test it with the stress check before relying on it.");
  }

  if (model.kpis.depletionAge) {
    actions.push(`Savings deplete at age ${model.kpis.depletionAge}. Compare lower spending, later retirement, or stronger income timing.`);
  } else {
    actions.push("Savings remain through the planning horizon under the base assumptions.");
  }

  actions.push("Use the niche calculators when you want to go deeper on one issue, then bring the result back into the full planner.");
  if (!advancedUnlocked) actions.push("Finish guided setup to unlock tax-aware strategy comparisons and advanced assumptions.");
  return actions;
}

/* FILE: src/ui/startupGuard.js */
function buildStartupDiagnostics({ error, failingResources = [] }) {
  return {
    userAgent: navigator.userAgent,
    url: location.href,
    error: error ? String(error?.stack || error?.message || error) : "",
    failingResources: Array.isArray(failingResources) ? failingResources : [],
    stage: globalThis.__RETIREMENT_APP_STAGE || "",
  };
}


/* FILE: src/ui/retirementGapHeadline.js */

function renderRetirementGapHeadline(ctx) {
  const {
    mountEl,
    row,
    model,
    selectedAge,
    minAge,
    maxAge,
    tooltipButton,
    formatCurrency,
    formatPct,
  } = ctx;
  if (!mountEl || !row) return;

  const metrics = getReportMetrics(ctx.plan, row);
  const spending = metrics.spending;
  const guaranteed = metrics.guaranteedNet;
  const netGap = metrics.netGap;
  const gross = metrics.grossWithdrawal;
  const taxWedge = metrics.dragAmount;
  const coverage = metrics.coverageRatio;
  const surplus = metrics.surplus > 0;
  const depletionAge = model?.kpis?.depletionAge;
  const highTaxDrag = gross > 0 ? (taxWedge / gross) > 0.25 : false;

  mountEl.innerHTML = `
    <article class="subsection gap-headline">
      <div class="results-strip-head">
        <h3>Retirement Gap ${tooltipButton("kpiNetGap")}</h3>
        <div class="results-strip-controls">
          <label for="gapAgePicker" class="small-copy">Pick age</label>
          <input id="gapAgePicker" type="range" min="${minAge}" max="${maxAge}" step="1" value="${selectedAge}" aria-label="Retirement gap age selector" />
          <strong>Age ${selectedAge}</strong>
        </div>
      </div>
      <p><strong>Your guaranteed income ${tooltipButton("kpiCoveragePercent")} covers ${formatPct(coverage)}</strong> of your retirement spending.</p>
      ${surplus
        ? `<p class="status-good">You are covered. Surplus: <strong>${formatCurrency(metrics.surplus)}</strong>.</p>`
        : metrics.estimateTaxes
          ? `<p>You need <strong>${formatCurrency(netGap)}/yr</strong> from savings (after tax). Because withdrawals are taxable, you must withdraw about <strong>${formatCurrency(gross)}/yr</strong>.</p>`
          : `<p>You need <strong>${formatCurrency(netGap)}/yr</strong> from savings. With tax estimates off, the gross withdrawal shown is not tax-adjusted.</p>`
      }
      <p class="small-copy muted">
        Spend ${tooltipButton("kpiSpendingTarget")} ${formatCurrency(spending)} |
        Guaranteed after tax ${tooltipButton("kpiGuaranteedIncome")} ${formatCurrency(guaranteed)} |
        Net gap ${tooltipButton("kpiNetGap")} ${formatCurrency(netGap)} |
        Gross draw ${tooltipButton("kpiGrossWithdrawal")} ${formatCurrency(gross)} |
        ${metrics.estimateTaxes ? `Tax + clawback drag ${tooltipButton("taxDrag")} ${formatCurrency(taxWedge)}` : `Tax estimates off`}
      </p>
      ${highTaxDrag ? `<span class="status-pill borderline">High tax drag this year</span>` : ""}
      ${depletionAge ? `<span class="status-pill off-track">Savings run out at age ${depletionAge}</span>` : ""}
    </article>
  `;
}

/* FILE: src/ui/taxWedgeMini.js */
function renderTaxWedgeMini(ctx) {
  const { mountEl, row, tooltipButton, formatCurrency } = ctx;
  if (!mountEl || !row) return;
  const gross = Math.max(0, Number(row.withdrawal || 0));
  const tax = Math.max(0, Number((row.taxOnWithdrawal || 0) + (row.oasClawback || 0)));
  const net = Math.max(0, gross - tax);
  const total = Math.max(1, gross);
  const netPct = (net / total) * 100;
  const taxPct = (tax / total) * 100;
  const netLabel = netPct < 26 ? "Net" : `Net cash ${formatCurrency(net)}`;
  const taxLabel = taxPct < 26 ? "Tax" : `Tax wedge ${formatCurrency(tax)}`;
  const highTaxDrag = gross > 0 ? (tax / gross) > 0.25 : false;

  mountEl.innerHTML = `
    <article class="subsection">
      <h3>Why gross withdrawal &gt; what you spend ${tooltipButton("kpiGrossWithdrawal")}</h3>
      <div class="mini-split-bar" role="img" aria-label="Gross vs net withdrawal split">
        <span class="seg netdraw" style="width:${netPct.toFixed(1)}%">${netLabel}</span>
        <span class="seg tax hatch" style="width:${taxPct.toFixed(1)}%">${taxLabel}</span>
      </div>
      <p class="mini-split-meta">
        <strong>Net cash you keep:</strong> ${formatCurrency(net)}
        <span aria-hidden="true"> | </span>
        <strong>Tax sent to CRA:</strong> ${formatCurrency(tax)}
      </p>
      ${highTaxDrag ? `<span class="status-pill borderline">High tax drag this year</span>` : ""}
      <label class="inline-check small-copy">
        <input type="checkbox" data-bind="uiState.showGrossWithdrawals" checked />
        Show gross withdrawals
      </label>
    </article>
  `;
}

/* FILE: src/ui/retirementInsight.js */

function renderRetirementInsight(ctx) {
  const {
    mountEl,
    row,
    model,
    age,
    tooltipButton,
    formatCurrency,
    formatPct,
  } = ctx;
  if (!mountEl || !row) return;

  const metrics = getReportMetrics(ctx.plan, row);
  const guaranteed = metrics.guaranteedNet;
  const spending = metrics.spending;
  const gross = metrics.grossWithdrawal;
  const taxWedge = metrics.dragAmount;
  const coverage = metrics.coverageRatio;
  const surplus = metrics.surplus > 0;
  const depletionAge = model?.kpis?.depletionAge;

  const sentence = surplus
    ? `At age ${age}, you are fully covered. Surplus: ${formatCurrency(metrics.surplus)}/yr.`
    : metrics.estimateTaxes
      ? `At age ${age}, your guaranteed income covers ${formatPct(coverage)} of retirement spending. You need about ${formatCurrency(gross)}/yr from RRSP/RRIF, and about ${formatCurrency(taxWedge)}/yr goes to estimated tax and clawback.`
      : `At age ${age}, your guaranteed income covers ${formatPct(coverage)} of retirement spending. You need about ${formatCurrency(gross)}/yr from RRSP/RRIF with tax estimates turned off.`;

  mountEl.innerHTML = `
    <article class="subsection insight-banner insight-verdict">
      <h3>Retirement Insight</h3>
      <p class="insight-line"><strong>${sentence}</strong></p>
      <p class="small-copy muted insight-terms">
        Guaranteed income ${tooltipButton("kpiGuaranteedIncome")} |
        Coverage % ${tooltipButton("kpiCoveragePercent")} |
        Gross withdrawal ${tooltipButton("kpiGrossWithdrawal")} |
        Tax drag ${tooltipButton("taxDrag")} |
        <button class="text-link-btn" type="button" data-action="open-methodology">Methodology</button>
      </p>
      ${depletionAge ? `<span class="status-pill off-track">Savings run out around age ${depletionAge}</span>` : ""}
    </article>
  `;
}

/* FILE: src/ui/taxWedgeEnhancements.js */
function renderGrossNetCallout(ctx) {
  const {
    mountEl,
    row,
    formatCurrency,
    formatPct,
    emphasizeTaxes,
  } = ctx;
  if (!mountEl || !row) return;
  const gross = Math.max(0, Number(row.withdrawal || 0));
  const tax = Math.max(0, Number((row.taxOnWithdrawal || 0) + (row.oasClawback || 0)));
  const net = Math.max(0, gross - tax);
  const total = Math.max(1, gross);
  const taxPct = tax / total;
  const netPct = 1 - taxPct;
  mountEl.innerHTML = `
    <article class="subsection gross-net-callout ${emphasizeTaxes ? "emphasize" : ""}">
      <h3>Why gross &gt; net</h3>
      <div class="mini-split-bar" role="img" aria-label="Gross withdrawal split into net cash and tax wedge">
        <span class="seg netdraw" style="width:${(netPct * 100).toFixed(1)}%">
          <span class="seg-label">${netPct > 0.16 ? "Net you keep" : ""}</span>
        </span>
        <span class="seg tax hatch" style="width:${(taxPct * 100).toFixed(1)}%">
          <span class="seg-label">${taxPct > 0.14 ? "Tax wedge" : ""}</span>
        </span>
      </div>
      <div class="gross-net-legend">
        <span class="gross-net-chip net">
          <span class="legend-dot netdraw"></span>
          <strong>Net you keep:</strong> ${formatCurrency(net)}
        </span>
        <span class="gross-net-chip tax">
          <span class="legend-dot tax"></span>
          <strong>Tax + clawback drag:</strong> ${formatCurrency(tax)}
        </span>
      </div>
      <p class="small-copy muted">
        Withdrawal required: <strong>${formatCurrency(gross)}</strong> |
        You keep: <strong>${formatCurrency(net)}</strong> |
        Tax + clawback drag: <strong>${formatCurrency(tax)}</strong> |
        Effective rate: <strong>${formatPct(row.effectiveTaxRate || 0)}</strong>
      </p>
      <label class="inline-check small-copy">
        <input type="checkbox" data-bind="uiState.emphasizeTaxes" ${emphasizeTaxes ? "checked" : ""} />
        Emphasize taxes
      </label>
      ${taxPct > 0.25 ? `<span class="status-pill borderline">High tax drag</span>` : ""}
    </article>
  `;
}

/* FILE: src/ui/whatChangedPanel.js */
function renderWhatChangedPanel(ctx) {
  const { mountEl, summary } = ctx;
  if (!mountEl) return;
  if (!summary) {
    mountEl.innerHTML = "";
    return;
  }
  mountEl.innerHTML = `
    <details class="subsection" open>
      <summary>${summary.title}</summary>
      <ul class="plain-list">
        ${(summary.bullets || []).map((b) => `<li>${b}</li>`).join("")}
      </ul>
      <div class="landing-actions">
        <button class="btn btn-secondary" type="button" data-action="dismiss-last-change">Dismiss</button>
        <button class="btn btn-primary" type="button" data-action="undo-last-change">Undo</button>
      </div>
    </details>
  `;
}


/* FILE: src/ui/scenarioCompare.js */
function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function buildScenarioRow(name, metrics, formatCurrency, formatPct, actionsHtml = "") {
  return `
    <tr>
      <td>${esc(name)}</td>
      <td>${formatPct(metrics.coveragePct || 0)}</td>
      <td>${formatCurrency(metrics.netGap65 || 0)}</td>
      <td>${formatCurrency(metrics.gross65 || 0)}</td>
      <td>${formatCurrency(metrics.taxWedge65 || 0)}</td>
      <td>${formatCurrency(metrics.clawback65 || 0)}</td>
      <td>${metrics.depletionAge ? `Age ${metrics.depletionAge}` : "No depletion"}</td>
      <td>${actionsHtml}</td>
    </tr>
  `;
}

function renderScenarioCompareModal(ctx) {
  const {
    mountEl,
    baseMetrics,
    strategyMetrics,
    savedScenarios,
    formatCurrency,
    formatPct,
  } = ctx;
  if (!mountEl) return;
  const savedRows = (savedScenarios || []).map((s) => buildScenarioRow(
    s.name,
    s.metrics,
    formatCurrency,
    formatPct,
    `<button class="text-link-btn" data-action="preview-scenario" data-value="${esc(s.id)}">Preview</button> <button class="text-link-btn" data-action="share-scenario" data-value="${esc(s.id)}">Share</button> <button class="text-link-btn" data-action="rename-scenario" data-value="${esc(s.id)}">Rename</button> <button class="text-link-btn" data-action="delete-scenario" data-value="${esc(s.id)}">Delete</button>`
  ));
  const rows = [
    buildScenarioRow("Base plan", baseMetrics, formatCurrency, formatPct),
    ...(strategyMetrics || []).map((s) => buildScenarioRow(s.label, s.metrics, formatCurrency, formatPct)),
    ...savedRows,
  ].join("");
  mountEl.innerHTML = `
    <div class="subsection">
      <h3>Compare scenarios</h3>
      <div class="landing-actions">
        <button class="btn btn-secondary" type="button" data-action="save-current-scenario">Save current as scenario</button>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Coverage %</th>
              <th>Net gap (65)</th>
              <th>Gross (65)</th>
              <th>Tax wedge (65)</th>
              <th>Clawback (65)</th>
              <th>Depletion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* FILE: src/ui/printSummary.js */

function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function fmtListItems(items) {
  return items.map((item) => `<li>${esc(item)}</li>`).join("");
}

function renderLegend(items) {
  if (!Array.isArray(items) || !items.length) return "";
  return `
    <div class="print-legend">
      ${items.map((item) => `
        <span class="print-legend-item">
          <span class="print-legend-swatch" style="background:${item.color};"></span>
          ${esc(item.label)}
        </span>
      `).join("")}
    </div>
  `;
}

function qrCodeUrl(value, size = 132) {
  const url = String(value || "").trim();
  if (!url) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}

function bandClass(band) {
  if (band === "Very Strong" || band === "Strong") return "good";
  if (band === "Moderate") return "medium";
  return "warn";
}

function severityClass(severity) {
  if (severity === "High") return "high";
  if (severity === "Medium") return "medium";
  return "low";
}

function buildSnapshotCards({ score, retMetrics, model, formatCurrency, formatPct }) {
  const depletionAge = model.kpis.depletionAge ? `Age ${model.kpis.depletionAge}` : "Beyond plan";
  const taxDragText = retMetrics.estimateTaxes
    ? `${formatCurrency(retMetrics.dragAmount)} (${formatPct(retMetrics.effectiveTaxRate)})`
    : "Tax estimates off";
  return [
    { label: "How much of your target income is covered", value: formatPct(retMetrics.coverageRatio), sub: "Guaranteed income coverage" },
    { label: "Savings projected to last", value: depletionAge, sub: "Longevity buffer" },
    { label: "Tax efficiency", value: taxDragText, sub: "Estimated tax drag" },
    { label: "Overall readiness", value: `${score.total}/100`, sub: score.band },
  ];
}

function buildMeaningSummary({ planStatus, retMetrics, rowRet, formatCurrency, formatPct }) {
  const statements = [];
  statements.push(`Guaranteed income covers ${formatPct(retMetrics.coverageRatio)} of your retirement-year spending target.`);
  if (retMetrics.netGap > 0) {
    statements.push(`Savings act as a top-up: about ${formatCurrency(retMetrics.grossWithdrawal)} of gross RRSP/RRIF withdrawals are needed in the retirement year.`);
  } else {
    statements.push(`Guaranteed income appears sufficient for the retirement-year target without required savings withdrawals.`);
  }
  if (rowRet.rrifMinimum > 0) {
    statements.push(`Later retirement years should still be watched because RRIF minimums can force taxable withdrawals.`);
  } else {
    statements.push(`The plan appears broadly workable under the current assumptions, but later taxes and withdrawals still matter.`);
  }
  if (planStatus.status === "Shortfall Likely" || planStatus.status === "Tight / Needs Review") {
    statements[2] = `The plan may need adjustment because longevity, withdrawal pressure, or tax drag reduce flexibility.`;
  }
  return statements;
}

function buildRecommendedMoves({ planStatus, risks }) {
  const moves = [];
  if (planStatus?.nextBestAction) {
    moves.push({
      title: planStatus.nextBestAction.label,
      detail: planStatus.nextBestAction.detail || "This is the clearest next test based on the current plan output.",
    });
  }
  for (const risk of risks || []) {
    if (moves.length >= 4) break;
    const exists = moves.some((item) => item.title === risk.actionLabel);
    if (risk.actionLabel && !exists) {
      moves.push({
        title: risk.actionLabel,
        detail: risk.detail,
      });
    }
  }
  if (moves.length < 4) {
    const fallback = [
      { title: "Compare another retirement age", detail: "A small age change often improves both coverage and longevity." },
      { title: "Test lower retirement spending", detail: "A spending sensitivity test quickly shows how much margin exists in the plan." },
      { title: "Review CPP timing", detail: "CPP timing changes both guaranteed income and later withdrawal pressure." },
      { title: "Open the full planner online", detail: "The interactive planner lets you test assumptions, scenarios, and strategies." },
    ];
    for (const item of fallback) {
      if (moves.length >= 4) break;
      if (!moves.some((existing) => existing.title === item.title)) moves.push(item);
    }
  }
  return moves.slice(0, 4);
}

function buildInputSets(state, formatCurrency, formatPct) {
  const spouse = state.income?.spouse || {};
  const injects = Array.isArray(state.savings?.capitalInjects)
    ? state.savings.capitalInjects.filter((x) => x && x.enabled)
    : [];
  return {
    summary: [
      `Province: ${state.profile.province}`,
      `Birth year: ${state.profile.birthYear}`,
      `Retirement age: ${state.profile.retirementAge}`,
      `Life expectancy: ${state.profile.lifeExpectancy}`,
      `Spending target (today's dollars): ${formatCurrency(state.profile.desiredSpending)}`,
      `Inflation: ${formatPct(state.assumptions.inflation)}`,
      `Risk profile: ${state.assumptions.riskProfile}`,
      `Current savings: ${formatCurrency(state.savings.currentTotal)}`,
      `Annual contribution: ${formatCurrency(state.savings.annualContribution)}`,
      `Private pension: ${state.income.pension.enabled ? `${formatCurrency(state.income.pension.amount)} from age ${state.income.pension.startAge}` : "Not modeled"}`,
      `CPP: ${formatCurrency(state.income.cpp.amountAt65)} from age ${state.income.cpp.startAge}`,
      `OAS: ${formatCurrency(state.income.oas.amountAt65)} from age ${state.income.oas.startAge}`,
      `Withdrawal strategy: ${state.strategy.withdrawal}`,
    ],
    appendix: {
      Profile: [
        `Province: ${state.profile.province}`,
        `Year of birth: ${state.profile.birthYear}`,
        `Retirement age: ${state.profile.retirementAge}`,
        `Life expectancy: ${state.profile.lifeExpectancy}`,
        `Desired retirement spending (today's dollars): ${formatCurrency(state.profile.desiredSpending)}`,
        `Spouse planning enabled: ${yesNo(state.profile.hasSpouse)}`,
      ],
      Assumptions: [
        `Inflation: ${formatPct(state.assumptions.inflation)}`,
        `Risk profile: ${state.assumptions.riskProfile}`,
        `Conservative return: ${formatPct(state.assumptions.returns.conservative)}`,
        `Balanced return: ${formatPct(state.assumptions.returns.balanced)}`,
        `Aggressive return: ${formatPct(state.assumptions.returns.aggressive)}`,
        `Scenario spread: ${formatPct(state.assumptions.scenarioSpread)}`,
        `Index tax brackets with inflation: ${yesNo(state.assumptions.taxBracketInflation)}`,
      ],
      Savings: [
        `Current savings: ${formatCurrency(state.savings.currentTotal)}`,
        `Annual contribution: ${formatCurrency(state.savings.annualContribution)}`,
        `Contribution increase YoY: ${formatPct(state.savings.contributionIncrease || 0)}`,
        `Capital injections: ${injects.length ? injects.map((x) => `${x.label || "Lump sum"} ${formatCurrency(x.amount)} at age ${x.age}`).join("; ") : "None"}`,
      ],
      Income: [
        `Private pension enabled: ${yesNo(state.income.pension.enabled)}`,
        `Private pension amount / start age: ${formatCurrency(state.income.pension.amount)} / ${state.income.pension.startAge}`,
        `CPP amount at 65 / start age: ${formatCurrency(state.income.cpp.amountAt65)} / ${state.income.cpp.startAge}`,
        `OAS amount at 65 / start age: ${formatCurrency(state.income.oas.amountAt65)} / ${state.income.oas.startAge}`,
        `Spousal income enabled: ${yesNo(spouse.enabled)}`,
        `Spouse pension amount / start age: ${formatCurrency(spouse.pensionAmount || 0)} / ${spouse.pensionStartAge || "-"}`,
        `Spouse CPP amount / start age: ${formatCurrency(spouse.cppAmountAt65 || 0)} / ${spouse.cppStartAge || "-"}`,
        `Spouse OAS amount / start age: ${formatCurrency(spouse.oasAmountAt65 || 0)} / ${spouse.oasStartAge || "-"}`,
      ],
      Accounts: [
        `RRSP/RRIF: ${formatCurrency(state.accounts.rrsp)}`,
        `TFSA: ${formatCurrency(state.accounts.tfsa)}`,
        `Non-registered: ${formatCurrency(state.accounts.nonRegistered)}`,
        `Cash: ${formatCurrency(state.accounts.cash)}`,
      ],
      Strategy: [
        `Withdrawal strategy: ${state.strategy.withdrawal}`,
        `Estimate taxes: ${yesNo(state.strategy.estimateTaxes !== false)}`,
        `OAS clawback modeling: ${yesNo(state.strategy.oasClawbackModeling)}`,
        `Apply RRIF minimums: ${yesNo(state.strategy.applyRrifMinimums)}`,
        `RRIF conversion age: ${state.strategy.rrifConversionAge}`,
        `RRSP meltdown enabled: ${yesNo(state.strategy.meltdownEnabled)}`,
        `RRSP meltdown amount: ${formatCurrency(state.strategy.meltdownAmount || 0)}`,
        `RRSP meltdown range: ${state.strategy.meltdownStartAge || "-"} to ${state.strategy.meltdownEndAge || "-"}`,
        `RRSP meltdown income ceiling: ${formatCurrency(state.strategy.meltdownIncomeCeiling || 0)}`,
      ],
    },
  };
}

function buildSummaryHtml(ctx) {
  const {
    state,
    rowRet,
    row65,
    row71,
    model,
    formatCurrency,
    formatPct,
    methodologyUrl,
    toolUrl,
    supportUrl,
    chartImages,
    projectionLegend,
    coverageLegend,
  } = ctx;

  const planStatus = buildPlanStatus(state, model);
  const risks = buildRiskDiagnostics(state, model, state.profile.retirementAge);
  const retMetrics = getReportMetrics(state, rowRet);
  const age65Metrics = getReportMetrics(state, row65);
  const age71Metrics = getReportMetrics(state, row71);
  const snapshot = buildSnapshotCards({ score: planStatus.score, retMetrics, model, formatCurrency, formatPct });
  const meaning = buildMeaningSummary({ planStatus, retMetrics, rowRet, formatCurrency, formatPct });
  const moves = buildRecommendedMoves({ planStatus, risks });
  const inputs = buildInputSets(state, formatCurrency, formatPct);
  const prefs = state.uiState?.clientSummary || {};
  const plannerHref = esc(toolUrl || "https://simplekit.app/retirement-planner/");
  const supportHref = esc(supportUrl || "https://buymeacoffee.com/ashleysnl");
  const plannerQr = qrCodeUrl(toolUrl || "https://simplekit.app/retirement-planner/");
  const supportQr = qrCodeUrl(supportUrl || "https://buymeacoffee.com/ashleysnl");

  return `
    <section class="print-summary report-shell">
      <section class="report-page report-cover">
        <div class="report-section report-header">
          <div>
            <p class="report-kicker">SimpleKit Retirement Planner</p>
            <h1>Canadian Retirement Planning Summary</h1>
            <p class="report-subtitle">A planning-level retirement summary based on your current assumptions, taxes, government benefits, and withdrawal strategy.</p>
          </div>
          <div class="report-meta-card">
            <div><span>Prepared date</span><strong>${esc(prefs.summaryDate || new Date().toISOString().slice(0, 10))}</strong></div>
            <div><span>Scenario</span><strong>${esc(prefs.scenarioLabel || "Current plan")}</strong></div>
            <div><span>Prepared for</span><strong>${esc(prefs.preparedFor || "-")}</strong></div>
          </div>
        </div>

        <div class="report-section report-hero-card ${bandClass(planStatus.score.band)}">
          <div>
            <p class="report-label">Retirement status</p>
            <h2>${esc(planStatus.status)}</h2>
            <p>${esc(planStatus.summary)}</p>
          </div>
          <div class="report-score">
            <strong>${planStatus.score.total}</strong>
            <span>${esc(planStatus.score.band)}</span>
          </div>
        </div>

        <div class="report-section report-scorecard-grid report-card-grid">
          ${snapshot.map((item) => `
            <article class="report-metric-card">
              <span class="report-metric-label">${esc(item.label)}</span>
              <strong>${esc(item.value)}</strong>
              <span class="report-metric-sub">${esc(item.sub)}</span>
            </article>
          `).join("")}
        </div>

        <div class="report-section report-grid-two">
          <section class="report-panel report-section">
            <h3>What this means</h3>
            <ul class="report-clean-list">
              ${meaning.map((line) => `<li>${esc(line)}</li>`).join("")}
            </ul>
          </section>
          <section class="report-panel report-section">
            <h3>Retirement score snapshot</h3>
            <div class="report-mini-score-grid">
              <div><span>Coverage</span><strong>${planStatus.score.subs.coverage}/35</strong></div>
              <div><span>Longevity</span><strong>${planStatus.score.subs.longevity}/30</strong></div>
              <div><span>Tax efficiency</span><strong>${planStatus.score.subs.taxDrag}/15</strong></div>
              <div><span>Clawback</span><strong>${planStatus.score.subs.clawback}/10</strong></div>
              <div><span>RRIF shock</span><strong>${planStatus.score.subs.rrifShock}/10</strong></div>
            </div>
            <p class="report-footnote">This score is a planning heuristic, not a guarantee. It summarizes coverage, longevity, tax drag, clawback pressure, and RRIF shock under the current assumptions.</p>
          </section>
        </div>

        <section class="report-section report-cta-section report-cta-band">
          <div class="report-cta-copy">
            <h3>Where to click next</h3>
            <p>Use the interactive planner to test retirement age, CPP timing, spending, inflation, and withdrawal strategy. If this report helped, you can also support future improvements.</p>
          </div>
          <div class="report-cta-grid">
            <a class="report-cta-card primary" href="${plannerHref}" target="_blank" rel="noopener noreferrer">
              <span>Open the Interactive Calculator</span>
              <strong>${plannerHref}</strong>
            </a>
            <a class="report-cta-card" href="${supportHref}" target="_blank" rel="noopener noreferrer">
              <span>Support this Free Tool</span>
              <strong>buymeacoffee.com/ashleysnl</strong>
            </a>
          </div>
        </section>
      </section>

      <section class="report-page">
        <section class="report-section report-panel report-chart-section">
          <h2>Portfolio Projection</h2>
          <p class="report-intro">This chart shows how savings are expected to build and then be drawn down over time under the current assumptions. Use it to spot whether the portfolio appears durable and when major retirement phases begin.</p>
          ${chartImages?.projection
            ? `<figure class="print-chart"><img src="${chartImages.projection}" alt="Projection chart" /><figcaption>Projection from today's age through the full planning horizon. Milestones to watch: retirement age ${state.profile.retirementAge}, age 65 for government benefits, and age ${state.strategy.rrifConversionAge || 71} for RRIF conversion.</figcaption>${renderLegend(projectionLegend)}</figure>`
            : "<p class=\"report-footnote\">Projection chart was unavailable in this export.</p>"
          }
        </section>

      </section>

      <section class="report-page">
        <section class="report-section report-panel report-chart-section">
          <h2>Income Timeline / Income Map</h2>
          <p class="report-intro">The stacked bars show where retirement cash flow comes from each year. Pension, CPP, and OAS form the income floor. RRSP/RRIF withdrawals fill the remaining gap. The tax wedge shows the part of gross withdrawals that goes to tax instead of spending.</p>
          ${chartImages?.coverage
            ? `<figure class="print-chart"><img src="${chartImages.coverage}" alt="Income coverage chart" /><figcaption>The spending line is your after-tax target. The tax wedge helps explain why gross RRSP/RRIF withdrawals can exceed the net spending gap.</figcaption>${renderLegend(coverageLegend)}</figure>`
            : "<p class=\"report-footnote\">Income map chart was unavailable in this export.</p>"
          }
          <div class="report-section report-grid-two compact">
            <div class="report-callout">
              <span class="report-callout-label">Retirement start</span>
              <strong>Age ${rowRet.age}</strong>
              <p>Spending target: ${formatCurrency(retMetrics.spending)} | Guaranteed income after estimated tax: ${formatCurrency(retMetrics.guaranteedNet)}</p>
            </div>
            <div class="report-callout">
              <span class="report-callout-label">Age 65</span>
              <strong>Government benefits phase</strong>
              <p>Guaranteed income after estimated tax: ${formatCurrency(age65Metrics.guaranteedNet)} | Gross withdrawal: ${formatCurrency(age65Metrics.grossWithdrawal)}</p>
            </div>
            <div class="report-callout">
              <span class="report-callout-label">Age ${row71.age}</span>
              <strong>RRIF minimum phase</strong>
              <p>Mandatory RRIF minimum: ${formatCurrency(row71.rrifMinimum || 0)} | Tax drag: ${formatCurrency(age71Metrics.dragAmount)}</p>
            </div>
          </div>
        </section>
      </section>

      <section class="report-page">
        <section class="report-section report-panel">
          <h2>Retirement Watchlist</h2>
          <div class="report-watchlist report-card-grid">
            ${(risks || []).slice(0, 5).map((risk) => `
              <article class="report-watch-card ${severityClass(risk.severity)}">
                <div class="report-watch-head">
                  <h3>${esc(risk.title)}</h3>
                  <span class="report-severity">${esc(risk.severity)}</span>
                </div>
                <p>${esc(risk.detail)}</p>
                <p class="report-footnote">Why it matters: ${esc(risk.actionLabel || "This is worth stress-testing in the interactive planner.")}</p>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="report-section report-panel">
          <h2>Recommended Next Moves</h2>
          <div class="report-actions report-card-grid">
            ${moves.map((move, index) => `
              <article class="report-action-card">
                <span class="report-action-step">${index + 1}</span>
                <div>
                  <h3>${esc(move.title)}</h3>
                  <p>${esc(move.detail)}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="report-section report-cta-section report-cta-band report-cta-band-secondary">
          <div class="report-cta-copy">
            <h3>Test another scenario online</h3>
            <p>Change retirement age, savings, inflation, pension income, and withdrawal strategy in the interactive planner to see how the outcome changes.</p>
          </div>
          <div class="report-cta-grid">
            <a class="report-cta-card primary" href="${plannerHref}" target="_blank" rel="noopener noreferrer">
              <span>Explore Your Plan Online</span>
              <strong>simplekit.app/retirement-planner/</strong>
            </a>
            <a class="report-cta-card" href="${supportHref}" target="_blank" rel="noopener noreferrer">
              <span>Found this helpful?</span>
              <strong>Buy me a coffee</strong>
            </a>
          </div>
        </section>
      </section>

      <section class="report-page report-page-start">
        <section class="report-section report-panel">
          <h2>Plan Inputs Summary</h2>
          <div class="report-summary-grid">
            ${inputs.summary.map((item) => `<div class="report-summary-item">${esc(item)}</div>`).join("")}
          </div>
          <p class="report-footnote">Annual retirement outputs in this report are shown in nominal dollars for the age/year shown. Spending starts as today's dollars in the planner and is inflated through the projection.</p>
        </section>

      </section>

      <section class="report-page report-page-start">
        <section class="report-section report-panel">
          <h2>Appendix: Detailed Inputs</h2>
          <div class="report-appendix-grid">
            ${Object.entries(inputs.appendix).map(([title, items]) => `
              <article class="report-appendix-card report-appendix-section">
                <h3>${esc(title)}</h3>
                <ul class="report-clean-list">${fmtListItems(items)}</ul>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="report-section report-cta-section report-cta-band report-cta-band-secondary">
          <div class="report-cta-copy">
            <h3>Reopen this report online</h3>
            <p>Scan or click to test another scenario in the calculator, or support the tool if this summary was useful.</p>
          </div>
          <div class="report-qr-row">
            ${plannerQr ? `<figure class="report-qr-card"><img class="print-qr" src="${plannerQr}" alt="QR code linking to the calculator" /><figcaption>Calculator</figcaption></figure>` : ""}
            ${supportQr ? `<figure class="report-qr-card"><img class="print-qr" src="${supportQr}" alt="QR code linking to Buy Me a Coffee" /><figcaption>☕ Support</figcaption></figure>` : ""}
          </div>
        </section>

        <section class="report-section report-footer-panel">
          <div>
            <h3>Disclaimer</h3>
            <p>This is an educational planning estimate only. It is not tax, legal, investment, or financial advice. Results depend on the assumptions shown in this report and real-world outcomes will differ.</p>
          </div>
          <div>
            <h3>Methodology</h3>
            <p>Tax estimates, government benefits, withdrawal logic, stress assumptions, and RRIF rules are described in the online methodology.</p>
            <p><a href="${esc(methodologyUrl)}" target="_blank" rel="noopener noreferrer">${esc(methodologyUrl)}</a></p>
          </div>
        </section>
      </section>
    </section>
  `;
}

function openPrintWindow(summaryHtml) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const printWhenReady = () => {
    try { w.focus(); } catch {}
    try { w.print(); } catch {}
  };
  w.document.open();
  w.document.write(`
    <html><head><title>Retirement Summary</title>
      <style>
        :root{
          --ink:#132033;
          --muted:#5f6b7d;
          --line:#dbe5f2;
          --soft:#f6f9fd;
          --panel:#ffffff;
          --brand:#0f6abf;
          --brand-soft:#eaf4ff;
          --good:#0a7a49;
          --good-soft:#e9f8f0;
          --warn:#b65015;
          --warn-soft:#fff2e8;
          --medium:#7a5b00;
          --medium-soft:#fff9df;
        }
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;margin:0;padding:24px;color:var(--ink);background:#fff;line-height:1.45}
        h1,h2,h3,p,ul,figure{margin:0}
        img{max-width:100%;height:auto}
        a{color:#0b4f8f;text-decoration:none}
        .report-shell{display:flex;flex-direction:column;gap:22px}
        .report-page{display:flex;flex-direction:column;gap:18px;page-break-after:always;break-after:page}
        .report-page:last-child{page-break-after:auto}
        .report-page-start{page-break-before:always;break-before:page}
        .report-section,.report-panel,.report-chart-section,.report-cta-section,.report-footer-panel,.report-appendix-section,.report-card-grid,.report-watch-card,.report-action-card,.report-callout,.report-metric-card,.report-meta-card,.report-hero-card,.print-chart,.print-chart img,.print-legend,.print-chart figcaption{break-inside:avoid;page-break-inside:avoid}
        h1,h2,h3{break-after:avoid;page-break-after:avoid}
        .report-panel > h2,.report-panel > h3,.report-intro,.report-footnote{break-after:avoid;page-break-after:avoid}
        .report-header{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(260px,1fr);gap:18px;align-items:start}
        .report-kicker{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--brand)}
        .report-subtitle{margin-top:8px;color:var(--muted);max-width:52rem}
        .report-meta-card,.report-panel,.report-footer-panel,.report-hero-card,.report-cta-band,.report-watch-card,.report-action-card,.report-metric-card,.report-appendix-card{border:1px solid var(--line);border-radius:16px;background:var(--panel)}
        .report-meta-card{padding:16px;display:grid;gap:10px}
        .report-meta-card span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
        .report-meta-card strong{font-size:15px}
        .report-hero-card{padding:20px 22px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start;background:linear-gradient(180deg,var(--brand-soft),#fff)}
        .report-hero-card.good{background:linear-gradient(180deg,#eef8f3,#fff)}
        .report-hero-card.warn{background:linear-gradient(180deg,#fff2ef,#fff)}
        .report-label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:8px}
        .report-score{min-width:124px;text-align:center;padding:14px 12px;border-radius:14px;background:#fff;border:1px solid var(--line)}
        .report-score strong{display:block;font-size:40px;line-height:1;color:var(--brand)}
        .report-score span{display:block;margin-top:6px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
        .report-scorecard-grid,.report-summary-grid,.report-appendix-grid,.report-watchlist,.report-actions{display:grid;gap:14px}
        .report-scorecard-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
        .report-metric-card{padding:16px}
        .report-metric-label{display:block;font-size:12px;color:var(--muted);margin-bottom:8px}
        .report-metric-card strong{display:block;font-size:24px;line-height:1.15}
        .report-metric-sub{display:block;margin-top:8px;font-size:12px;color:var(--muted)}
        .report-grid-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
        .report-grid-two.compact{grid-template-columns:repeat(3,minmax(0,1fr))}
        .report-panel{padding:18px}
        .report-panel h2,.report-panel h3{margin-bottom:10px}
        .report-clean-list{padding-left:18px;display:grid;gap:8px}
        .report-mini-score-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .report-mini-score-grid div{padding:12px;border-radius:12px;background:var(--soft);border:1px solid var(--line)}
        .report-mini-score-grid span{display:block;font-size:12px;color:var(--muted)}
        .report-mini-score-grid strong{display:block;margin-top:4px;font-size:18px}
        .report-footnote,.print-chart figcaption{font-size:12px;color:var(--muted)}
        .report-cta-band{padding:16px;border-radius:18px;background:linear-gradient(180deg,#f7fbff,#fff);display:grid;gap:12px}
        .report-cta-band-secondary{background:linear-gradient(180deg,#f8fbff,#fff)}
        .report-cta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .report-cta-card{display:block;padding:16px 18px;border-radius:14px;border:1px solid var(--line);background:#fff}
        .report-cta-card.primary{border-color:#9fc8f0;background:var(--brand-soft)}
        .report-cta-card span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
        .report-cta-card strong{display:block;margin-top:8px;font-size:18px;color:var(--ink);word-break:break-word}
        .report-qr-row{display:flex;gap:10px;flex-wrap:wrap}
        .report-qr-card{display:flex;flex-direction:column;align-items:center;gap:6px}
        .print-qr{width:104px;height:104px;border:1px solid var(--line);border-radius:10px;background:#fff}
        .print-chart{display:grid;gap:6px}
        .print-chart img{display:block;border:1px solid var(--line);border-radius:14px}
        .print-legend{display:flex;flex-wrap:wrap;gap:12px}
        .print-legend-item{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#334155}
        .print-legend-swatch{width:10px;height:10px;border-radius:999px;display:inline-block;border:1px solid rgba(0,0,0,.08)}
        .report-callout{padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}
        .report-callout-label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:6px}
        .report-watchlist{grid-template-columns:repeat(2,minmax(0,1fr))}
        .report-watch-card{padding:16px}
        .report-watch-card.high{background:#fff3f1}
        .report-watch-card.medium{background:#fff9e8}
        .report-watch-card.low{background:#f4fbf7}
        .report-watch-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:8px}
        .report-severity{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
        .report-actions{grid-template-columns:1fr}
        .report-action-card{padding:16px;display:grid;grid-template-columns:44px minmax(0,1fr);gap:14px;align-items:start}
        .report-action-step{width:44px;height:44px;border-radius:999px;background:var(--brand-soft);display:grid;place-items:center;font-weight:700;color:var(--brand)}
        .report-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .report-summary-item{padding:12px 14px;border-radius:12px;background:var(--soft);border:1px solid var(--line)}
        .report-appendix-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .report-appendix-card{padding:16px}
        .report-footer-panel{padding:18px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;background:linear-gradient(180deg,#fbfdff,#fff)}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid var(--line);padding:8px 10px;font-size:12px;text-align:left}
        @page{margin:14mm}
        @media (max-width:900px){
          .report-header,.report-grid-two,.report-grid-two.compact,.report-scorecard-grid,.report-watchlist,.report-summary-grid,.report-appendix-grid,.report-footer-panel,.report-cta-grid{grid-template-columns:1fr}
          .report-hero-card{flex-direction:column}
          .report-score{min-width:auto}
        }
        @media print{
          body{padding:0;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
          a{text-decoration:none;color:#0b4f8f}
          .report-page{min-height:auto}
          .report-cta-band{padding:14px}
          .report-panel{padding:16px}
          .report-metric-card,.report-action-card,.report-watch-card,.report-appendix-card{padding:14px}
          .print-chart img{max-height:300mm;object-fit:contain}
        }
      </style>
    </head><body>${summaryHtml}</body></html>
  `);
  w.document.close();
  if (typeof w.addEventListener === "function") {
    w.addEventListener("load", () => setTimeout(printWhenReady, 140), { once: true });
  }
  setTimeout(printWhenReady, 260);
  return true;
}

/* FILE: src/ui/keyRisks.js */
function severityClass(level) {
  const norm = String(level || "").toLowerCase();
  if (norm === "high") return "risk-high";
  if (norm === "medium") return "risk-medium";
  return "risk-low";
}

function renderKeyRisks(ctx) {
  const {
    mountEl,
    risks,
    tooltipButton,
  } = ctx;
  if (!mountEl) return;
  if (!Array.isArray(risks) || !risks.length) {
    mountEl.innerHTML = "";
    return;
  }
  mountEl.innerHTML = `
    <article class="subsection key-risks">
      <h3>Key Retirement Risks ${tooltipButton("retirementScore")}</h3>
      <div class="risk-list">
        ${risks.map((risk) => `
          <article class="risk-row ${severityClass(risk.severity)}">
            <div class="risk-row-main">
              <h4>${risk.title}</h4>
              <span class="risk-badge">${risk.severity}</span>
            </div>
            <p class="small-copy">${risk.detail}</p>
            <div class="landing-actions">
              <button class="btn btn-secondary" type="button" data-nav-target="${risk.learnTarget || "learn"}">${risk.learnLabel || "Learn more"}</button>
              ${risk.action ? `<button class="btn btn-secondary" type="button" data-action="${risk.action}">${risk.actionLabel || "Take action"}</button>` : ""}
            </div>
          </article>
        `).join("")}
      </div>
    </article>
  `;
}


/* FILE: src/ui/timeline.js */
function sortEvents(events) {
  return [...events].sort((a, b) => Number(a.age) - Number(b.age));
}

function groupEventsByAge(events) {
  const map = new Map();
  for (const event of events) {
    const age = Number(event.age);
    if (!map.has(age)) map.set(age, { age, items: [] });
    map.get(age).items.push(event);
  }
  return Array.from(map.values()).sort((a, b) => a.age - b.age);
}

function buildTimelineEvents(plan) {
  const events = [
    { key: "retire", age: Number(plan.profile.retirementAge || 65), label: "Retirement starts", detail: "Portfolio withdrawals can begin." },
    { key: "cpp", age: Number(plan.income.cpp.startAge || 65), label: "CPP starts", detail: "CPP income begins at this age." },
    { key: "oas", age: Number(plan.income.oas.startAge || 65), label: "OAS starts", detail: "OAS begins and may later face clawback." },
  ];
  if (plan.income.pension.enabled) {
    events.push({
      key: "pension",
      age: Number(plan.income.pension.startAge || plan.profile.retirementAge || 65),
      label: "Private pension starts",
      detail: "Guaranteed pension income begins.",
    });
  }
  if (plan.strategy.applyRrifMinimums) {
    const conversionAge = Number(plan.strategy.rrifConversionAge || 71);
    events.push({
      key: "rrif",
      age: conversionAge,
      label: "RRIF minimums begin",
      detail: "Minimum taxable RRIF withdrawals apply.",
    });
  } else {
    events.push({
      key: "rrif-off",
      age: 71,
      label: "RRIF rules OFF",
      detail: "Enable RRIF minimums to model forced withdrawals.",
      disabled: true,
    });
  }
  return sortEvents(events);
}

function renderTimeline(ctx) {
  const {
    mountEl,
    events,
    selectedAge,
  } = ctx;
  if (!mountEl) return;
  if (!Array.isArray(events) || !events.length) {
    mountEl.innerHTML = "";
    return;
  }

  const grouped = groupEventsByAge(events);
  const minAge = Math.min(...grouped.map((e) => Number(e.age)));
  const maxAge = Math.max(...grouped.map((e) => Number(e.age)));
  const span = Math.max(1, maxAge - minAge);

  mountEl.innerHTML = `
    <article class="subsection retirement-timeline">
      <h3>Retirement Timeline</h3>
      <div class="timeline-track" role="list" aria-label="Retirement timeline markers">
        ${grouped.map((group) => {
          const pct = ((Number(group.age) - minAge) / span) * 100;
          const isActive = Number(group.age) === Number(selectedAge);
          const edgeClass = pct <= 8 ? "edge-left" : (pct >= 92 ? "edge-right" : "");
          const disabled = group.items.every((item) => item.disabled);
          const label = group.items.length === 1 ? group.items[0].label : `${group.items.length} events`;
          return `
            <button
              role="listitem"
              type="button"
              class="timeline-marker ${isActive ? "active" : ""} ${disabled ? "disabled" : ""} ${edgeClass}"
              style="left:${pct.toFixed(2)}%;"
              data-action="set-selected-age"
              data-value="${group.age}"
              aria-label="${label} at age ${group.age}"
            >
              <span class="timeline-dot"></span>
              <span class="timeline-age">Age ${group.age}</span>
              <span class="timeline-pill">${label}</span>
            </button>
          `;
        }).join("")}
      </div>
      <div class="timeline-events" role="list" aria-label="Timeline event details">
        ${grouped.map((group) => `
          <button
            role="listitem"
            type="button"
            class="timeline-event-card ${Number(group.age) === Number(selectedAge) ? "active" : ""}"
            data-action="set-selected-age"
            data-value="${group.age}"
            aria-label="Jump to age ${group.age}"
          >
            <strong>Age ${group.age}</strong>
            <ul class="plain-list">
              ${group.items.map((item) => `<li>${item.label}: ${item.detail}</li>`).join("")}
            </ul>
          </button>
        `).join("")}
      </div>
      <div class="timeline-stack" aria-hidden="true">
        ${events.map((event) => `
          <button
            type="button"
            class="timeline-stack-row ${Number(event.age) === Number(selectedAge) ? "active" : ""} ${event.disabled ? "disabled" : ""}"
            data-action="set-selected-age"
            data-value="${event.age}"
          >
            <strong>Age ${event.age}</strong> - ${event.label}
          </button>
        `).join("")}
      </div>
      <p class="small-copy muted">Tip: Tap a marker to jump dashboard visuals to that age.</p>
    </article>
  `;
}

/* FILE: src/ui/presets.js */
function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function parsePresetFromUrl(locationObj) {
  try {
    const url = new URL(locationObj.href);
    const preset = (url.searchParams.get("preset") || "").trim().toLowerCase();
    if (!preset) return null;
    const allowed = new Set([
      "oas-clawback",
      "rrif-withdrawal",
      "cpp-timing",
      "rrsp-withdrawal-strategy",
      "retirement-tax",
      "rrif-minimum",
      "retirement-income",
    ]);
    if (!allowed.has(preset)) return null;
    return { key: preset };
  } catch {
    return null;
  }
}

function buildPresetBannerHtml(preset) {
  if (!preset) return "";
  const map = {
    "oas-clawback": {
      title: "Loaded preset: OAS Clawback Calculator",
      text: "Turns on clawback and RRIF rules with standard start ages to test OAS recovery risk.",
    },
    "rrif-withdrawal": {
      title: "Loaded preset: RRIF Withdrawal Calculator",
      text: "Turns on RRIF rules and conversion-focused defaults to illustrate minimum-withdrawal effects.",
    },
    "cpp-timing": {
      title: "Loaded preset: CPP Timing Calculator (Canada)",
      text: "Highlights CPP timing tradeoffs with age-based defaults for quick comparison.",
    },
    "rrsp-withdrawal-strategy": {
      title: "Loaded preset: RRSP Withdrawal Strategy (Canada)",
      text: "Highlights RRSP/RRIF withdrawal order and tax drag effects.",
    },
    "retirement-tax": {
      title: "Loaded preset: Retirement Tax Calculator (Canada)",
      text: "Highlights tax drag, clawback, and gross-vs-net withdrawal behavior.",
    },
    "rrif-minimum": {
      title: "Loaded preset: RRIF Minimum Withdrawal Calculator",
      text: "Highlights RRIF conversion-age rules and minimum drawdown effects.",
    },
    "retirement-income": {
      title: "Loaded preset: Canadian Retirement Income Calculator",
      text: "Balanced baseline preset showing pension/CPP/OAS plus withdrawal gap.",
    },
  };
  const config = map[preset.key] || map["retirement-income"];
  return `
    <div class="banner-row">
      <div>
        <strong>${config.title}</strong>
        <p class="small-copy muted">${config.text}</p>
      </div>
      <div class="landing-actions">
        <button class="btn btn-primary" type="button" data-action="apply-preset">Apply preset</button>
        <button class="btn btn-secondary" type="button" data-action="dismiss-preset">Dismiss</button>
      </div>
    </div>
  `;
}

function applyPresetToPlan(state, preset, createDemoPlan) {
  const next = clone(state);
  const hasMeaningfulPlan = !next.uiState.firstRun || Number(next.savings.currentTotal || 0) > 0;
  if (!hasMeaningfulPlan && typeof createDemoPlan === "function") {
    return applyPresetToPlan(createDemoPlan(), preset, null);
  }

  next.uiState.firstRun = false;
  next.uiState.hasStarted = true;
  next.uiState.activeNav = "dashboard";
  next.strategy.oasClawbackModeling = true;
  next.strategy.applyRrifMinimums = true;
  next.strategy.rrifConversionAge = 71;
  next.income.cpp.startAge = 65;
  next.income.oas.startAge = 65;
  next.profile.retirementAge = Math.max(55, Math.min(next.profile.retirementAge || 65, 70));

  if (preset?.key === "oas-clawback") {
    next.profile.desiredSpending = Math.max(60000, Number(next.profile.desiredSpending || 60000));
    next.income.pension.enabled = true;
    next.income.pension.amount = Math.max(12000, Number(next.income.pension.amount || 12000));
  } else if (preset?.key === "rrif-withdrawal" || preset?.key === "rrif-minimum") {
    next.strategy.meltdownEnabled = false;
    next.savings.currentTotal = Math.max(300000, Number(next.savings.currentTotal || 300000));
    next.profile.retirementAge = Math.min(67, Math.max(60, Number(next.profile.retirementAge || 65)));
  } else if (preset?.key === "cpp-timing") {
    next.income.cpp.startAge = 70;
    next.income.oas.startAge = 67;
    next.profile.retirementAge = Math.max(60, Number(next.profile.retirementAge || 65));
  } else if (preset?.key === "rrsp-withdrawal-strategy") {
    next.strategy.meltdownEnabled = true;
    next.strategy.meltdownAmount = Math.max(10000, Number(next.strategy.meltdownAmount || 10000));
    next.strategy.meltdownStartAge = Math.min(next.profile.retirementAge, 63);
    next.strategy.meltdownEndAge = Math.max(next.strategy.meltdownStartAge + 1, 70);
  } else if (preset?.key === "retirement-tax") {
    next.profile.desiredSpending = Math.max(70000, Number(next.profile.desiredSpending || 70000));
    next.income.pension.enabled = true;
    next.income.pension.amount = Math.max(15000, Number(next.income.pension.amount || 15000));
  } else if (preset?.key === "retirement-income") {
    next.profile.desiredSpending = Math.max(65000, Number(next.profile.desiredSpending || 65000));
    next.income.pension.enabled = true;
    next.income.pension.amount = Math.max(10000, Number(next.income.pension.amount || 10000));
  }
  return next;
}

function clearPresetQuery() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("preset");
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore
  }
}

/* FILE: src/ui/incomeMap.js */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function findByAge(rows, age) {
  return rows.find((row) => row.age === age) || null;
}

function markerAges(plan) {
  const out = [];
  if (plan.income.pension.enabled) out.push({ age: Number(plan.income.pension.startAge || 65), label: "Pension start" });
  out.push({ age: Number(plan.income.cpp.startAge || 65), label: "CPP start" });
  out.push({ age: Number(plan.income.oas.startAge || 65), label: "OAS start" });
  out.push({
    age: Number(plan.strategy.rrifConversionAge || 71),
    label: plan.strategy.applyRrifMinimums ? "RRIF start" : "RRIF rules off",
  });
  return out;
}

function renderIncomeMap(ctx) {
  const {
    mountEl,
    plan,
    rows,
    selectedAge,
    formatCurrency,
    formatPct,
    state,
    phases = [],
  } = ctx;
  if (!mountEl) return null;
  if (!rows.length) {
    mountEl.innerHTML = "";
    return null;
  }
  const minAge = rows[0].age;
  const maxAge = rows[rows.length - 1].age;
  const uiMap = state.uiState.incomeMap || {};
  const showGross = Boolean(state.uiState.showGrossWithdrawals ?? true);
  const showMarkers = Boolean(uiMap.highlightKeyAges ?? true);
  const showTable = Boolean(uiMap.showTable);
  const visible = rows.slice();
  const keys = markerAges(plan).filter((m) => m.age >= minAge && m.age <= maxAge);
  const visiblePhases = (phases || []).filter((phase) => !(phase.endAge < minAge || phase.startAge > maxAge));
  const ageSpan = Math.max(1, maxAge - minAge);
  const phaseTrackHtml = visiblePhases.length
    ? `
      <div class="income-phase-track" aria-label="Retirement phases aligned to timeline">
        <div class="income-phase-track-inner">
          ${visiblePhases.map((phase) => {
            const start = clamp(Number(phase.startAge), minAge, maxAge);
            const end = clamp(Number(phase.endAge), minAge, maxAge);
            const leftPct = ((start - minAge) / ageSpan) * 100;
            const widthPct = Math.max(2, ((Math.max(start, end) - start + 1) / (ageSpan + 1)) * 100);
            return `
              <button
                type="button"
                class="phase-ruler"
                style="left:${leftPct.toFixed(2)}%; width:${widthPct.toFixed(2)}%;"
                data-tooltip-key="${phaseTooltipKey(phase.key)}"
                aria-label="${phase.label} from age ${start} to ${end}"
                title="${phase.label} (${start}-${end})"
              >
                <span class="phase-ruler-line" aria-hidden="true">
                  <span class="phase-ruler-arrow phase-ruler-arrow-left"></span>
                  <span class="phase-ruler-stroke"></span>
                  <span class="phase-ruler-arrow phase-ruler-arrow-right"></span>
                </span>
                <span class="phase-ruler-pill">${phase.label}</span>
                <span class="phase-ruler-range">${start}-${end}</span>
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `
    : "";
  const tableHtml = showTable
    ? `
      <div class="table-scroll income-map-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Age</th><th>Phase</th><th>Pension</th><th>CPP</th><th>OAS</th><th>${showGross ? "RRSP/RRIF (gross)" : "RRSP/RRIF (net)"}</th><th>Tax wedge</th><th>Spending</th><th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            ${visible.map((row) => `
              <tr>
                <td>${row.age}</td>
                <td>${phaseLabelForAge(row.age, visiblePhases)}</td>
                <td>${formatCurrency(row.pensionGross)}</td>
                <td>${formatCurrency(row.cppGross)}</td>
                <td>${formatCurrency(row.oasGross)}</td>
                <td>${formatCurrency(showGross ? row.withdrawalGross : row.withdrawalNet)}</td>
                <td>${formatCurrency(row.taxOnWithdrawal + row.oasClawback)}</td>
                <td>${formatCurrency(row.spendingAfterTax)}</td>
                <td>${formatPct(row.coveragePct)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : "";

  mountEl.innerHTML = `
    <article class="subsection income-map">
      <div class="chart-head-row">
        <h3>Retirement Income Map</h3>
        <div class="legend-row">
          <span class="legend-item"><span class="legend-chip" style="background:#f59e0b;"></span>Pension</span>
          <span class="legend-item"><span class="legend-chip" style="background:#16a34a;"></span>CPP</span>
          <span class="legend-item"><span class="legend-chip" style="background:#0ea5a8;"></span>OAS</span>
          <span class="legend-item"><span class="legend-chip" style="background:#0f6abf;"></span>RRSP/RRIF</span>
          <span class="legend-item"><span class="legend-chip" style="background:#d9485f;"></span>Tax wedge</span>
          <span class="legend-item"><span class="legend-chip" style="background:#111827;"></span>Spending target</span>
        </div>
      </div>
      <p class="small-copy muted">Where each retirement dollar comes from each year. Click a bar to jump your selected age.</p>
      <div class="income-map-controls">
        <label class="inline-check small-copy"><input type="checkbox" data-bind="uiState.showGrossWithdrawals" ${showGross ? "checked" : ""} /> Show withdrawals as gross</label>
        <label class="inline-check small-copy"><input type="checkbox" data-bind="uiState.incomeMap.highlightKeyAges" ${showMarkers ? "checked" : ""} /> Highlight key ages</label>
        <label class="inline-check small-copy"><input type="checkbox" data-bind="uiState.incomeMap.showTable" ${showTable ? "checked" : ""} /> View as table</label>
      </div>
      ${phaseTrackHtml}
      <div class="chart-canvas-wrap income-map-canvas-wrap">
        <canvas id="incomeMapCanvas" width="1200" height="360" aria-label="Retirement income map chart" role="img"></canvas>
        <div id="incomeMapHover" class="chart-hover" hidden></div>
      </div>
      ${showMarkers ? `<p class="small-copy muted">Markers: ${keys.map((k) => `${k.label} (Age ${k.age})`).join(" • ") || "none in current window"}</p>` : ""}
      ${tableHtml}
    </article>
  `;

  return {
    visibleRows: visible,
    visiblePhases,
    showGross,
    showMarkers,
    markers: keys,
    selectedAge,
  };
}

function drawIncomeMapCanvas(ctx) {
  const {
    canvas,
    visibleRows,
    selectedAge,
    showGross,
    showMarkers,
    markers,
    phases = [],
    formatCurrency,
  } = ctx;
  if (!canvas || !visibleRows?.length) return { hitZones: [] };
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 40) return { hitZones: [] };

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(900, Math.floor(rect.width * dpr));
  canvas.height = Math.floor(360 * dpr);
  const g = canvas.getContext("2d");
  if (!g) return { hitZones: [] };
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = 360;
  const pad = { left: 52, right: 16, top: 16, bottom: 38 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  g.clearRect(0, 0, w, h);

  const vals = [];
  for (const row of visibleRows) {
    const taxWedge = row.taxOnWithdrawal + row.oasClawback;
    const withdrawalPart = showGross ? Math.max(0, row.withdrawalGross - taxWedge) : row.withdrawalNet;
    vals.push(row.pensionGross + row.cppGross + row.oasGross + withdrawalPart + taxWedge);
    vals.push(row.spendingAfterTax);
  }
  const maxY = Math.max(1, ...vals) * 1.15;
  const x = (i) => pad.left + (innerW * i) / Math.max(1, visibleRows.length - 1);
  const y = (v) => pad.top + innerH - (v / maxY) * innerH;
  const barW = Math.max(8, Math.min(18, innerW / Math.max(visibleRows.length, 24)));

  for (const phase of phases) {
    const startIdx = visibleRows.findIndex((r) => r.age >= phase.startAge);
    const endIdx = (() => {
      let idx = -1;
      for (let i = visibleRows.length - 1; i >= 0; i -= 1) {
        if (visibleRows[i].age <= phase.endAge) {
          idx = i;
          break;
        }
      }
      return idx;
    })();
    if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) continue;
    const x0 = x(startIdx) - (barW / 2);
    const x1 = x(endIdx) + (barW / 2);
    g.fillStyle = "rgba(15, 106, 191, 0.03)";
    g.fillRect(x0, pad.top, Math.max(1, x1 - x0), innerH);
  }

  g.strokeStyle = "#dfe7f3";
  for (let i = 0; i <= 4; i += 1) {
    const gy = pad.top + (innerH * i) / 4;
    g.beginPath();
    g.moveTo(pad.left, gy);
    g.lineTo(w - pad.right, gy);
    g.stroke();
  }

  if (showMarkers) {
    for (const marker of markers || []) {
      const idx = visibleRows.findIndex((r) => r.age === marker.age);
      if (idx < 0) continue;
      const mx = x(idx);
      g.strokeStyle = "rgba(31, 42, 61, 0.24)";
      g.setLineDash([3, 4]);
      g.beginPath();
      g.moveTo(mx, pad.top);
      g.lineTo(mx, pad.top + innerH);
      g.stroke();
      g.setLineDash([]);
    }
  }

  const hitZones = [];
  visibleRows.forEach((row, idx) => {
    const taxWedge = row.taxOnWithdrawal + row.oasClawback;
    const withdrawalPart = showGross ? Math.max(0, row.withdrawalGross - taxWedge) : row.withdrawalNet;
    const parts = [
      [row.pensionGross, "#f59e0b"],
      [row.cppGross, "#16a34a"],
      [row.oasGross, "#0ea5a8"],
      [withdrawalPart, "#0f6abf"],
      [taxWedge, "#d9485f"],
    ];
    let stack = 0;
    const cx = x(idx) - barW / 2;
    for (const [v, c] of parts) {
      if (v <= 0) continue;
      const yTop = y(stack + v);
      const yBottom = y(stack);
      g.fillStyle = c;
      g.fillRect(cx, yTop, barW, Math.max(1, yBottom - yTop));
      stack += v;
    }
    hitZones.push({
      x: cx,
      y: y(stack),
      w: barW,
      h: Math.max(1, y(0) - y(stack)),
      row,
    });
  });

  const linePts = visibleRows.map((r, i) => [x(i), y(r.spendingAfterTax)]);
  g.strokeStyle = "#111827";
  g.lineWidth = 1.8;
  g.beginPath();
  linePts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.stroke();

  const selected = findByAge(visibleRows, selectedAge);
  if (selected) {
    const idx = visibleRows.findIndex((r) => r.age === selected.age);
    const sx = x(idx);
    g.strokeStyle = "rgba(15,106,191,0.5)";
    g.setLineDash([4, 4]);
    g.beginPath();
    g.moveTo(sx, pad.top);
    g.lineTo(sx, pad.top + innerH);
    g.stroke();
    g.setLineDash([]);
  }

  g.fillStyle = "#5f6b7d";
  g.font = "12px Avenir Next";
  g.fillText(formatCurrency(0), 8, h - 10);
  g.fillText(formatCurrency(maxY), 8, pad.top + 4);
  const step = Math.max(1, Math.ceil((visibleRows.length - 1) / Math.max(3, Math.floor(innerW / 110))));
  for (let i = 0; i < visibleRows.length; i += step) {
    const label = `Age ${visibleRows[i].age}`;
    const lx = x(i);
    const lw = g.measureText(label).width;
    g.fillText(label, clamp(lx - lw / 2, pad.left, w - pad.right - lw), h - 10);
  }
  return { hitZones };
}

function bindIncomeMapHover(event, ctx) {
  const { hitZones, hoverEl, chartEl, formatCurrency, formatPct, showGross } = ctx;
  if (!hoverEl || !chartEl || !hitZones?.length) return;
  const rect = chartEl.getBoundingClientRect();
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;
  const hit = hitZones.find((z) => px >= z.x && px <= (z.x + z.w) && py >= z.y && py <= (z.y + z.h));
  if (!hit) {
    hoverEl.hidden = true;
    return;
  }
  const row = hit.row;
  const wedge = row.taxOnWithdrawal + row.oasClawback;
  hoverEl.hidden = false;
  hoverEl.innerHTML = `
    <strong>Age ${row.age}</strong><br />
    Pension: ${formatCurrency(row.pensionGross)}<br />
    CPP: ${formatCurrency(row.cppGross)}<br />
    OAS: ${formatCurrency(row.oasGross)}<br />
    Withdrawal (${showGross ? "gross" : "net"}): ${formatCurrency(showGross ? row.withdrawalGross : row.withdrawalNet)}<br />
    Tax wedge: ${formatCurrency(wedge)}<br />
    Spending target: ${formatCurrency(row.spendingAfterTax)}<br />
    Coverage: ${formatPct(row.coveragePct)}
  `;
}

function pickIncomeMapAge(event, hitZones) {
  if (!hitZones?.length) return null;
  const rect = event.currentTarget?.getBoundingClientRect?.();
  if (!rect) return null;
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;
  const hit = hitZones.find((z) => px >= z.x && px <= (z.x + z.w) && py >= z.y && py <= (z.y + z.h));
  return hit?.row?.age ?? null;
}

function phaseLabelForAge(age, phases) {
  const match = (phases || []).find((p) => age >= p.startAge && age <= p.endAge);
  return match ? match.label : "-";
}

function phaseTooltipKey(key) {
  if (key === "rrif") return "forcedRrifDrawdown";
  if (key === "benefits") return "cppStartAge";
  return "retirementAge";
}

/* FILE: src/ui/peakTaxYear.js */
function renderPeakTaxYear(ctx) {
  const {
    mountEl,
    peak,
    formatCurrency,
  } = ctx;
  if (!mountEl) return;
  if (!peak) {
    mountEl.innerHTML = "";
    return;
  }
  mountEl.innerHTML = `
    <article class="subsection peak-tax-card">
      <h3>Peak Tax Year</h3>
      <p><strong>Highest tax year: age ${peak.age}</strong></p>
      <p class="small-copy muted">Estimated total tax: <strong>${formatCurrency(peak.totalTax)}</strong></p>
      <p class="small-copy muted">Main driver: <strong>${peak.cause}</strong></p>
      <p class="small-copy muted">Federal: ${formatCurrency(peak.federalTax)} | Provincial: ${formatCurrency(peak.provincialTax)} | OAS clawback: ${formatCurrency(peak.clawback)}</p>
      <div class="landing-actions">
        <button type="button" class="btn btn-secondary" data-action="focus-strategies">Try strategies to reduce this</button>
      </div>
    </article>
  `;
}


/* FILE: src/ui/strategySuggestions.js */
function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

const STRATEGY_SUGGESTIONS = [
  {
    key: "delay-cpp",
    title: "Delay CPP to 70",
    desc: "Can reduce early draw pressure and increase later guaranteed income.",
  },
  {
    key: "meltdown",
    title: "Try RRSP meltdown",
    desc: "Test planned early withdrawals to reduce later RRIF/tax pressure.",
  },
  {
    key: "spend-down-10",
    title: "Reduce spending by 10%",
    desc: "Quick sensitivity test for plan resilience.",
  },
  {
    key: "retire-later-2",
    title: "Retire 2 years later",
    desc: "Adds contribution years and shortens drawdown.",
  },
];

function renderStrategySuggestions(ctx) {
  const { mountEl, pendingKey } = ctx;
  if (!mountEl) return;
  mountEl.innerHTML = `
    <article class="subsection" id="strategySuggestions">
      <h3>Strategies to explore</h3>
      <div class="strategy-grid">
        ${STRATEGY_SUGGESTIONS.map((s) => `
          <article class="strategy-card ${pendingKey === s.key ? "active" : ""}">
            <strong>${esc(s.title)}</strong>
            <p class="small-copy muted">${esc(s.desc)}</p>
            <button type="button" class="btn btn-secondary" data-action="preview-strategy" data-value="${esc(s.key)}">Preview strategy</button>
          </article>
        `).join("")}
      </div>
      ${pendingKey ? `
        <div class="landing-actions">
          <button type="button" class="btn btn-primary" data-action="apply-strategy-preview">Apply</button>
          <button type="button" class="btn btn-secondary" data-action="undo-strategy-preview">Undo preview</button>
        </div>
      ` : ""}
    </article>
  `;
}


/* FILE: src/model/clientSummary.js */

function buildClientSummaryData({ plan, model, selectedAge, rows, phases, risks }) {
  const allRows = Array.isArray(rows) && rows.length
    ? rows
    : (model?.base?.rows || []).filter((r) => r.age >= Number(plan.profile.retirementAge || 65));
  if (!allRows.length) return null;

  const fallbackAge = Number(plan.profile.retirementAge || allRows[0].age);
  const current = allRows.find((r) => Number(r.age) === Number(selectedAge))
    || allRows.find((r) => Number(r.age) === fallbackAge)
    || allRows[0];

  const report = getReportMetrics(plan, current);

  const depletionAge = model?.kpis?.depletionAge || null;
  const rrifPhaseAge = plan.strategy.applyRrifMinimums
    ? Number(plan.strategy.rrifConversionAge || 71)
    : null;
  const clawbackRisk = risks?.find((r) => r.key === "clawback") || null;

  return {
    selected: current,
    metrics: {
      spending: report.spending,
      guaranteed: report.guaranteedNet,
      guaranteedGross: report.guaranteedGross,
      netGap: report.netGap,
      grossWithdrawal: report.grossWithdrawal,
      taxWedge: report.dragAmount,
      incomeTax: report.incomeTax,
      clawback: report.clawback,
      netSpendingAvailable: report.totalSpendable,
      coverageRatio: report.coverageRatio,
      effectiveRate: report.effectiveTaxRate,
      estimateTaxes: report.estimateTaxes,
    },
    warnings: {
      depletionAge,
      hasRrifPressure: Boolean(rrifPhaseAge && Number(current.age) >= rrifPhaseAge && Number(current.rrifMinimum || 0) > 0),
      clawbackSeverity: clawbackRisk?.severity || "Low",
      clawbackAmount: Number(current.oasClawback || 0),
    },
    phases: Array.isArray(phases) ? phases : [],
  };
}

/* FILE: src/ui/clientSummaryMode.js */

function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function severityClass(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "high") return "risk-high";
  if (s === "medium") return "risk-medium";
  return "risk-low";
}

function fmtRange(phase) {
  if (!phase) return "";
  if (Number(phase.startAge) === Number(phase.endAge)) return `Age ${phase.startAge}`;
  return `Age ${phase.startAge}-${phase.endAge}`;
}

function renderClientSummaryMode(ctx) {
  const {
    mountEl,
    enabled,
    summary,
    risks,
    selectedAge,
    formatCurrency,
    formatPct,
    tooltipButton,
    pendingStrategyKey,
    changeSummary,
    prefs,
  } = ctx;

  if (!mountEl) return;
  mountEl.hidden = !enabled;
  if (!enabled || !summary) {
    mountEl.innerHTML = "";
    return;
  }

  const row = summary.selected;
  const m = summary.metrics;
  const coveragePct = m.coverageRatio;
  const surplus = Math.max(0, m.guaranteed - m.spending);
  const hasSurplus = surplus > 0.5;

  mountEl.innerHTML = `
    <article class="subsection client-summary-mode" aria-live="polite">
      <div class="client-summary-banner">
        <strong>Simplified communication view using your current plan assumptions.</strong>
        <div class="landing-actions">
          <button type="button" class="btn btn-secondary" data-action="print-client-summary">Print Client Report</button>
          <button type="button" class="btn btn-secondary" data-action="exit-client-summary">Open full planner view</button>
        </div>
      </div>

      <div class="subsection client-meta-grid">
        <h3>Prepared details</h3>
        <label>
          <span class="small-copy muted">Prepared for</span>
          <input data-bind="uiState.clientSummary.preparedFor" type="text" value="${esc(prefs.preparedFor || "")}" placeholder="Client or household name" />
        </label>
        <label>
          <span class="small-copy muted">Scenario label</span>
          <input data-bind="uiState.clientSummary.scenarioLabel" type="text" value="${esc(prefs.scenarioLabel || "")}" placeholder="Base plan / Strategy A" />
        </label>
        <label>
          <span class="small-copy muted">Prepared by</span>
          <input data-bind="uiState.clientSummary.preparedBy" type="text" value="${esc(prefs.preparedBy || "")}" placeholder="Advisor or planner" />
        </label>
        <label>
          <span class="small-copy muted">Date</span>
          <input data-bind="uiState.clientSummary.summaryDate" type="date" value="${esc(prefs.summaryDate || "")}" />
        </label>
      </div>

      <section class="subsection">
        <h3>Retirement Readiness Snapshot</h3>
        <p><strong>At age ${row.age}, guaranteed income ${tooltipButton("kpiGuaranteedIncome")} covers <span class="client-summary-number">${formatPct(coveragePct)}</span> of your target spending ${tooltipButton("kpiSpendingTarget")}.</strong> ${hasSurplus
          ? `You are fully covered with an estimated surplus of <strong>${formatCurrency(surplus)}</strong> per year.`
          : m.estimateTaxes
            ? `You need about <strong>${formatCurrency(m.grossWithdrawal)}</strong>/yr from RRSP/RRIF ${tooltipButton("kpiGrossWithdrawal")}, and about <strong>${formatCurrency(m.taxWedge)}</strong>/yr goes to estimated tax and clawback.`
            : `You need about <strong>${formatCurrency(m.grossWithdrawal)}</strong>/yr from RRSP/RRIF ${tooltipButton("kpiGrossWithdrawal")}. Tax estimates are off in this scenario.`}
        </p>
        <div class="metric-grid metric-grid-wide">
          <article class="metric-card metric-card-primary">
            <span class="label">Coverage ${tooltipButton("kpiCoveragePercent")}</span>
            <span class="value">${formatPct(coveragePct)}</span>
          </article>
          <article class="metric-card metric-card-primary">
            <span class="label">Guaranteed income ${tooltipButton("kpiGuaranteedIncome")}</span>
            <span class="value">${formatCurrency(m.guaranteed)}</span>
            <span class="sub">${m.estimateTaxes ? "After estimated tax" : "Tax estimates off"}</span>
          </article>
          <article class="metric-card metric-card-primary">
            <span class="label">Savings withdrawals ${tooltipButton("kpiGrossWithdrawal")}</span>
            <span class="value">${formatCurrency(m.grossWithdrawal)}</span>
          </article>
          <article class="metric-card metric-card-primary">
            <span class="label">${m.estimateTaxes ? `Tax + clawback drag ${tooltipButton("taxDrag")}` : "Tax estimates"}</span>
            <span class="value">${m.estimateTaxes ? formatCurrency(m.taxWedge) : "Off"}</span>
          </article>
          <article class="metric-card metric-card-primary">
            <span class="label">Net spending available ${tooltipButton("netSpendingAvailable")}</span>
            <span class="value">${formatCurrency(m.netSpendingAvailable)}</span>
          </article>
        </div>
        <div class="landing-actions">
          ${summary.warnings.clawbackAmount > 0 ? `<span class="risk-badge ${severityClass(summary.warnings.clawbackSeverity)}">OAS clawback risk: ${esc(summary.warnings.clawbackSeverity)}</span>` : ""}
          ${summary.warnings.depletionAge ? `<span class="risk-badge risk-high">Savings run out around age ${summary.warnings.depletionAge}</span>` : ""}
          ${summary.warnings.hasRrifPressure ? `<span class="risk-badge risk-medium">RRIF minimum phase active</span>` : ""}
        </div>
      </section>

      <section class="chart-wrap">
        <div class="chart-head-row">
          <h3>Projection</h3>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="clientSummaryProjectionChart" width="1000" height="340" aria-label="Client summary projected portfolio balance chart" role="img"></canvas>
        </div>
        <div id="clientSummaryProjectionLegend" class="legend-row"></div>
      </section>

      <section class="subsection">
        <h3>Retirement Income Map</h3>
        <p class="small-copy muted">Where retirement cash flow comes from each year, including tax wedge impact.</p>
        <div id="clientSummaryIncomeMapMount"></div>
      </section>

      <section class="subsection">
        <h3>Income Timeline</h3>
        <div class="client-timeline-grid">
          ${(summary.phases || []).map((phase) => {
            const title = phase.key === "early"
              ? "Early retirement"
              : phase.key === "benefits"
                ? "CPP + OAS phase"
                : "RRIF minimum phase";
            return `
              <button type="button" class="client-phase-card" data-action="set-selected-age" data-value="${phase.startAge}" aria-label="Jump to ${title} at age ${phase.startAge}">
                <strong>${esc(title)}</strong>
                <span>${esc(fmtRange(phase))}</span>
                <p class="small-copy muted">${esc(phase.why || "")}</p>
              </button>
            `;
          }).join("")}
        </div>
      </section>

      <section class="subsection">
        <h3>Key Risks</h3>
        <div class="risk-list compact">
          ${(risks || []).slice(0, 5).map((risk) => `
            <article class="risk-row ${severityClass(risk.severity)}">
              <div class="risk-row-main">
                <h4>${esc(risk.title)}</h4>
                <span class="risk-badge">${esc(risk.severity)}</span>
              </div>
              <p class="small-copy">${esc(risk.detail)}</p>
            </article>
          `).join("")}
        </div>
      </section>

      <section class="subsection" id="clientStrategySuggestions">
        <h3>Strategy Suggestions</h3>
        <div class="strategy-grid">
          ${STRATEGY_SUGGESTIONS.map((s) => `
            <article class="strategy-card ${pendingStrategyKey === s.key ? "active" : ""}">
              <strong>${esc(s.title)}</strong>
              <p class="small-copy muted">${esc(s.desc)}</p>
              <button type="button" class="btn btn-secondary" data-action="preview-strategy" data-value="${esc(s.key)}">Preview impact</button>
            </article>
          `).join("")}
        </div>
        ${pendingStrategyKey && changeSummary ? `
          <div class="subsection">
            <strong>What changed?</strong>
            <ul class="plain-list">
              ${(changeSummary.bullets || []).slice(0, 6).map((b) => `<li>${esc(b)}</li>`).join("")}
            </ul>
            <div class="landing-actions">
              <button type="button" class="btn btn-primary" data-action="apply-strategy-preview">Apply</button>
              <button type="button" class="btn btn-secondary" data-action="undo-strategy-preview">Undo preview</button>
            </div>
          </div>
        ` : ""}
      </section>

      <p class="small-copy muted">Planning estimate only - not tax, legal, or financial advice.</p>
    </article>
  `;
}

/* FILE: src/ui/clientSummaryPrint.js */
function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function phaseTitle(key) {
  if (key === "early") return "Early retirement";
  if (key === "benefits") return "CPP + OAS phase";
  return "RRIF minimum phase";
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function fmtListItems(items) {
  return items.map((item) => `<li>${esc(item)}</li>`).join("");
}

function renderLegend(items) {
  if (!Array.isArray(items) || !items.length) return "";
  return `
    <div class="print-legend">
      ${items.map((item) => `
        <span class="print-legend-item">
          <span class="print-legend-swatch" style="background:${item.color};"></span>
          ${esc(item.label)}
        </span>
      `).join("")}
    </div>
  `;
}

function qrCodeUrl(value, size = 132) {
  const url = String(value || "").trim();
  if (!url) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}

function severityClass(severity) {
  if (severity === "High") return "high";
  if (severity === "Medium") return "medium";
  return "low";
}

function buildClientSummaryHtml(ctx) {
  const {
    state,
    summary,
    risks,
    strategySuggestions,
    formatCurrency,
    formatPct,
    methodologyUrl,
    toolUrl,
    supportUrl,
    chartImages,
  } = ctx;

  const row = summary.selected;
  const m = summary.metrics;
  const prefs = state.uiState.clientSummary || {};
  const dateValue = prefs.summaryDate || new Date().toISOString().slice(0, 10);
  const spouse = state.income?.spouse || {};
  const injects = Array.isArray(state.savings?.capitalInjects)
    ? state.savings.capitalInjects.filter((x) => x && x.enabled)
    : [];
  const detailedInputs = {
    "Plan inputs summary": [
      `Province: ${state.profile.province}`,
      `Year of birth: ${state.profile.birthYear}`,
      `Retirement age: ${state.profile.retirementAge}`,
      `Life expectancy: ${state.profile.lifeExpectancy}`,
      `After-tax spending target (today's dollars): ${formatCurrency(state.profile.desiredSpending)}`,
      `Inflation: ${formatPct(state.assumptions.inflation)}`,
      `Risk profile: ${state.assumptions.riskProfile}`,
      `Current savings: ${formatCurrency(state.savings.currentTotal)}`,
      `Annual contribution: ${formatCurrency(state.savings.annualContribution)}`,
      `Private pension: ${state.income.pension.enabled ? `${formatCurrency(state.income.pension.amount)} from age ${state.income.pension.startAge}` : "Not modeled"}`,
      `CPP: ${formatCurrency(state.income.cpp.amountAt65)} from age ${state.income.cpp.startAge}`,
      `OAS: ${formatCurrency(state.income.oas.amountAt65)} from age ${state.income.oas.startAge}`,
      `Withdrawal strategy: ${state.strategy.withdrawal}`,
    ],
    "Appendix: Assumptions": [
      `Conservative return: ${formatPct(state.assumptions.returns.conservative)}`,
      `Balanced return: ${formatPct(state.assumptions.returns.balanced)}`,
      `Aggressive return: ${formatPct(state.assumptions.returns.aggressive)}`,
      `Scenario spread: ${formatPct(state.assumptions.scenarioSpread)}`,
      `Tax brackets indexed with inflation: ${yesNo(state.assumptions.taxBracketInflation)}`,
    ],
    "Appendix: Savings and accounts": [
      `Contribution increase YoY: ${formatPct(state.savings.contributionIncrease || 0)}`,
      `Capital injections: ${injects.length ? injects.map((x) => `${x.label || "Lump sum"} ${formatCurrency(x.amount)} at age ${x.age}`).join("; ") : "None"}`,
      `RRSP/RRIF: ${formatCurrency(state.accounts.rrsp)}`,
      `TFSA: ${formatCurrency(state.accounts.tfsa)}`,
      `Non-registered: ${formatCurrency(state.accounts.nonRegistered)}`,
      `Cash: ${formatCurrency(state.accounts.cash)}`,
    ],
    "Appendix: Income and strategy": [
      `Private pension enabled: ${yesNo(state.income.pension.enabled)}`,
      `CPP amount at 65 / start age: ${formatCurrency(state.income.cpp.amountAt65)} / ${state.income.cpp.startAge}`,
      `OAS amount at 65 / start age: ${formatCurrency(state.income.oas.amountAt65)} / ${state.income.oas.startAge}`,
      `Spousal income enabled: ${yesNo(spouse.enabled)}`,
      `Spouse pension amount / start age: ${formatCurrency(spouse.pensionAmount || 0)} / ${spouse.pensionStartAge || "-"}`,
      `Spouse CPP amount / start age: ${formatCurrency(spouse.cppAmountAt65 || 0)} / ${spouse.cppStartAge || "-"}`,
      `Spouse OAS amount / start age: ${formatCurrency(spouse.oasAmountAt65 || 0)} / ${spouse.oasStartAge || "-"}`,
      `Estimate taxes: ${yesNo(state.strategy.estimateTaxes !== false)}`,
      `OAS clawback modeling: ${yesNo(state.strategy.oasClawbackModeling)}`,
      `Apply RRIF minimums: ${yesNo(state.strategy.applyRrifMinimums)}`,
      `RRIF conversion age: ${state.strategy.rrifConversionAge}`,
      `RRSP meltdown enabled: ${yesNo(state.strategy.meltdownEnabled)}`,
      `Meltdown amount / range: ${formatCurrency(state.strategy.meltdownAmount || 0)} | ${state.strategy.meltdownStartAge || "-"} to ${state.strategy.meltdownEndAge || "-"}`,
      `Meltdown income ceiling: ${formatCurrency(state.strategy.meltdownIncomeCeiling || 0)}`,
    ],
  };

  const plannerHref = esc(toolUrl || "https://simplekit.app/retirement-planner/");
  const supportHref = esc(supportUrl || "https://buymeacoffee.com/ashleysnl");
  const plannerQr = qrCodeUrl(toolUrl || "https://simplekit.app/retirement-planner/");
  const supportQr = qrCodeUrl(supportUrl || "https://buymeacoffee.com/ashleysnl");
  const coverageBand = m.coverageRatio >= 1 ? "Strong" : m.coverageRatio >= 0.85 ? "Mostly on track" : "Needs review";

  return `
    <section class="print-summary report-shell">
      <section class="report-page">
        <div class="report-section report-header">
          <div>
            <p class="report-kicker">SimpleKit Retirement Planner</p>
            <h1>Client Retirement Summary</h1>
            <p class="report-subtitle">A presentation-friendly summary of the current plan, built from the same assumptions and calculations used in the interactive planner.</p>
          </div>
          <div class="report-meta-card">
            <div><span>Prepared for</span><strong>${esc(prefs.preparedFor || "-")}</strong></div>
            <div><span>Scenario</span><strong>${esc(prefs.scenarioLabel || "Current plan")}</strong></div>
            <div><span>Prepared by</span><strong>${esc(prefs.preparedBy || "-")}</strong></div>
            <div><span>Date</span><strong>${esc(dateValue)}</strong></div>
          </div>
        </div>

        <div class="report-section report-hero-card ${m.coverageRatio >= 1 ? "good" : "warn"}">
          <div>
            <p class="report-label">Retirement readiness snapshot</p>
            <h2>${coverageBand}</h2>
            <p>At age ${row.age}, guaranteed income covers ${formatPct(m.coverageRatio)} of the spending target. ${m.netGap > 0 ? `The rest comes from RRSP/RRIF withdrawals, with about ${formatCurrency(m.taxWedge)} going to tax and clawback.` : "Guaranteed income appears to cover the target without required withdrawals in that year."}</p>
          </div>
          <div class="report-score">
            <strong>${Math.round(m.coverageRatio * 100)}%</strong>
            <span>Coverage</span>
          </div>
        </div>

        <div class="report-section report-scorecard-grid report-card-grid">
          <article class="report-metric-card">
            <span class="report-metric-label">Guaranteed income</span>
            <strong>${formatCurrency(m.guaranteed)}</strong>
            <span class="report-metric-sub">${m.estimateTaxes ? "After estimated tax" : "Tax estimates off"}</span>
          </article>
          <article class="report-metric-card">
            <span class="report-metric-label">Savings withdrawals needed</span>
            <strong>${formatCurrency(m.grossWithdrawal)}</strong>
            <span class="report-metric-sub">Gross RRSP/RRIF withdrawal</span>
          </article>
          <article class="report-metric-card">
            <span class="report-metric-label">Estimated tax drag</span>
            <strong>${m.estimateTaxes ? formatCurrency(m.taxWedge) : "Off"}</strong>
            <span class="report-metric-sub">${m.estimateTaxes ? `Effective rate ${formatPct(m.effectiveRate)}` : "Planning estimate disabled"}</span>
          </article>
          <article class="report-metric-card">
            <span class="report-metric-label">Net spending available</span>
            <strong>${formatCurrency(m.netSpendingAvailable)}</strong>
            <span class="report-metric-sub">Spendable income for this year</span>
          </article>
        </div>

        <section class="report-section report-cta-section report-cta-band">
          <div class="report-cta-copy">
            <h3>Use the interactive planner next</h3>
            <p>Open the calculator to test retirement age, spending, inflation, CPP timing, and withdrawal strategy. If this report helped, you can support the tool’s upkeep as well.</p>
          </div>
          <div class="report-cta-grid">
            <a class="report-cta-card primary" href="${plannerHref}" target="_blank" rel="noopener noreferrer">
              <span>Open the Interactive Calculator</span>
              <strong>${plannerHref}</strong>
            </a>
            <a class="report-cta-card" href="${supportHref}" target="_blank" rel="noopener noreferrer">
              <span>Support this Free Tool</span>
              <strong>buymeacoffee.com/ashleysnl</strong>
            </a>
          </div>
        </section>
      </section>

      <section class="report-page">
        <section class="report-section report-panel report-chart-section">
          <h2>Portfolio Projection</h2>
          <p class="report-intro">This chart shows how savings build and then get used over time under the current assumptions. It helps answer whether the plan appears durable through the full planning horizon.</p>
          ${chartImages?.projection
            ? `<figure class="print-chart"><img src="${chartImages.projection}" alt="Projection chart" /><figcaption>Projection chart from the current client summary view.</figcaption>${renderLegend([
              { label: "Portfolio balance", color: "#0f6abf" },
              { label: "Stress band (best/worst)", color: "#7aa7d8" },
            ])}</figure>`
            : "<p class=\"report-footnote\">Projection chart was unavailable in this export.</p>"
          }
        </section>

      </section>

      <section class="report-page">
        <section class="report-section report-panel report-chart-section">
          <h2>Income Timeline / Income Map</h2>
          <p class="report-intro">This chart shows where retirement income comes from each year. Guaranteed income forms the base. RRSP/RRIF withdrawals act as a top-up. The tax wedge shows the part of withdrawals that goes to tax instead of spending.</p>
          ${chartImages?.incomeMap
            ? `<figure class="print-chart"><img src="${chartImages.incomeMap}" alt="Retirement income map chart" /><figcaption>Retirement income map from the current client summary view.</figcaption>${renderLegend([
              { label: "Pension", color: "#f59e0b" },
              { label: "CPP", color: "#16a34a" },
              { label: "OAS", color: "#0ea5a8" },
              { label: "RRSP/RRIF", color: "#0f6abf" },
              { label: "Tax wedge", color: "#d9485f" },
              { label: "Spending target", color: "#111827" },
            ])}</figure>`
            : "<p class=\"report-footnote\">Income map chart was unavailable in this export.</p>"
          }
        </section>

        <section class="report-section report-panel">
          <h2>Income Timeline</h2>
          <div class="report-actions">
            ${(summary.phases || []).map((phase, index) => {
              const range = Number(phase.startAge) === Number(phase.endAge)
                ? `Age ${phase.startAge}`
                : `Age ${phase.startAge}-${phase.endAge}`;
              return `
                <article class="report-action-card">
                  <span class="report-action-step">${index + 1}</span>
                  <div>
                    <h3>${esc(phaseTitle(phase.key))} (${range})</h3>
                    <p>${esc(phase.why || "")}</p>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        </section>
      </section>

      <section class="report-page">
        <section class="report-section report-panel">
          <h2>Key Risks to Watch</h2>
          <div class="report-watchlist report-card-grid">
            ${(risks || []).slice(0, 5).map((risk) => `
              <article class="report-watch-card ${severityClass(risk.severity)}">
                <div class="report-watch-head">
                  <h3>${esc(risk.title)}</h3>
                  <span class="report-severity">${esc(risk.severity)}</span>
                </div>
                <p>${esc(risk.detail)}</p>
                <p class="report-footnote">Why it matters: ${esc(risk.actionLabel || "This area is worth reviewing in the planner.")}</p>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="report-section report-panel">
          <h2>Recommended Next Moves</h2>
          <div class="report-actions report-card-grid">
            ${(strategySuggestions || []).map((s, index) => `
              <article class="report-action-card">
                <span class="report-action-step">${index + 1}</span>
                <div>
                  <h3>${esc(s.title)}</h3>
                  <p>${esc(s.desc)}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="report-section report-cta-section report-cta-band report-cta-band-secondary">
          <div class="report-cta-copy">
            <h3>Keep planning online</h3>
            <p>Use the full planner to compare scenarios, revisit retirement age, and test different tax-aware withdrawal strategies.</p>
          </div>
          <div class="report-cta-grid">
            <a class="report-cta-card primary" href="${plannerHref}" target="_blank" rel="noopener noreferrer">
              <span>Explore Your Plan Online</span>
              <strong>simplekit.app/retirement-planner/</strong>
            </a>
            <a class="report-cta-card" href="${supportHref}" target="_blank" rel="noopener noreferrer">
              <span>Found this helpful?</span>
              <strong>Buy me a coffee</strong>
            </a>
          </div>
        </section>
      </section>

      <section class="report-page report-page-start">
        ${Object.entries(detailedInputs).map(([title, items]) => `
          <section class="report-section report-panel report-appendix-section">
            <h2>${esc(title)}</h2>
            <ul class="report-clean-list">${fmtListItems(items)}</ul>
          </section>
        `).join("")}

        <section class="report-section report-cta-section report-cta-band report-cta-band-secondary">
          <div class="report-cta-copy">
            <h3>Reopen this report online</h3>
            <p>Scan or click to reopen the calculator, compare another scenario, or support the tool.</p>
          </div>
          <div class="report-qr-row">
            ${plannerQr ? `<figure class="report-qr-card"><img class="print-qr" src="${plannerQr}" alt="QR code linking to the retirement calculator" /><figcaption>Calculator</figcaption></figure>` : ""}
            ${supportQr ? `<figure class="report-qr-card"><img class="print-qr" src="${supportQr}" alt="QR code linking to Buy Me a Coffee" /><figcaption>☕ Support</figcaption></figure>` : ""}
          </div>
        </section>

        <section class="report-section report-footer-panel">
          <div>
            <h3>Disclaimer</h3>
            <p>This is an educational planning estimate only. It is not tax, legal, investment, or financial advice. Results depend on the assumptions shown in this report and real-world outcomes will differ.</p>
          </div>
          <div>
            <h3>Methodology</h3>
            <p>Government benefits, taxes, withdrawal logic, RRIF rules, and scenario methods are explained in the methodology section online.</p>
            <p><a href="${esc(methodologyUrl)}" target="_blank" rel="noopener noreferrer">${esc(methodologyUrl)}</a></p>
          </div>
        </section>
      </section>
    </section>
  `;
}

function openClientSummaryPrintWindow(summaryHtml) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const printWhenReady = () => {
    try { w.focus(); } catch {}
    try { w.print(); } catch {}
  };
  w.document.open();
  w.document.write(`
    <html><head><title>Client Summary</title>
      <style>
        :root{
          --ink:#132033;
          --muted:#5f6b7d;
          --line:#dbe5f2;
          --soft:#f6f9fd;
          --panel:#ffffff;
          --brand:#0f6abf;
          --brand-soft:#eaf4ff;
        }
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;margin:0;padding:24px;color:var(--ink);background:#fff;line-height:1.45}
        h1,h2,h3,p,ul,figure{margin:0}
        img{max-width:100%;height:auto}
        a{color:#0b4f8f;text-decoration:none}
        .report-shell{display:flex;flex-direction:column;gap:22px}
        .report-page{display:flex;flex-direction:column;gap:18px;page-break-after:always;break-after:page}
        .report-page:last-child{page-break-after:auto}
        .report-page-start{page-break-before:always;break-before:page}
        .report-section,.report-panel,.report-chart-section,.report-cta-section,.report-footer-panel,.report-appendix-section,.report-card-grid,.report-watch-card,.report-action-card,.report-metric-card,.report-meta-card,.report-hero-card,.print-chart,.print-chart img,.print-legend,.print-chart figcaption{break-inside:avoid;page-break-inside:avoid}
        h1,h2,h3{break-after:avoid;page-break-after:avoid}
        .report-panel > h2,.report-panel > h3,.report-intro,.report-footnote{break-after:avoid;page-break-after:avoid}
        .report-header{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(260px,1fr);gap:18px;align-items:start}
        .report-kicker{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--brand)}
        .report-subtitle{margin-top:8px;color:var(--muted);max-width:52rem}
        .report-meta-card,.report-panel,.report-footer-panel,.report-hero-card,.report-cta-band,.report-watch-card,.report-action-card,.report-metric-card{border:1px solid var(--line);border-radius:16px;background:var(--panel)}
        .report-meta-card{padding:16px;display:grid;gap:10px}
        .report-meta-card span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
        .report-meta-card strong{font-size:15px}
        .report-hero-card{padding:20px 22px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start;background:linear-gradient(180deg,#eef8f3,#fff)}
        .report-hero-card.warn{background:linear-gradient(180deg,#fff2ef,#fff)}
        .report-label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:8px}
        .report-score{min-width:124px;text-align:center;padding:14px 12px;border-radius:14px;background:#fff;border:1px solid var(--line)}
        .report-score strong{display:block;font-size:40px;line-height:1;color:var(--brand)}
        .report-score span{display:block;margin-top:6px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
        .report-scorecard-grid,.report-watchlist,.report-actions,.report-cta-grid{display:grid;gap:14px}
        .report-scorecard-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
        .report-metric-card,.report-panel{padding:16px}
        .report-metric-label{display:block;font-size:12px;color:var(--muted);margin-bottom:8px}
        .report-metric-card strong{display:block;font-size:24px;line-height:1.15}
        .report-metric-sub{display:block;margin-top:8px;font-size:12px;color:var(--muted)}
        .report-intro,.report-footnote,.print-chart figcaption{font-size:12px;color:var(--muted)}
        .print-chart{display:grid;gap:8px}
        .print-chart img{display:block;border:1px solid var(--line);border-radius:14px}
        .print-legend{display:flex;flex-wrap:wrap;gap:12px}
        .print-legend-item{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#334155}
        .print-legend-swatch{width:10px;height:10px;border-radius:999px;display:inline-block;border:1px solid rgba(0,0,0,.08)}
        .report-watchlist{grid-template-columns:repeat(2,minmax(0,1fr))}
        .report-watch-card{padding:16px}
        .report-watch-card.high{background:#fff3f1}
        .report-watch-card.medium{background:#fff9e8}
        .report-watch-card.low{background:#f4fbf7}
        .report-watch-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:8px}
        .report-severity{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
        .report-action-card{padding:16px;display:grid;grid-template-columns:44px minmax(0,1fr);gap:14px;align-items:start}
        .report-action-step{width:44px;height:44px;border-radius:999px;background:var(--brand-soft);display:grid;place-items:center;font-weight:700;color:var(--brand)}
        .report-clean-list{padding-left:18px;display:grid;gap:8px}
        .report-cta-band{padding:16px;border-radius:18px;background:linear-gradient(180deg,#f7fbff,#fff);display:grid;gap:12px}
        .report-cta-band-secondary{background:linear-gradient(180deg,#f8fbff,#fff)}
        .report-cta-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .report-cta-card{display:block;padding:16px 18px;border-radius:14px;border:1px solid var(--line);background:#fff}
        .report-cta-card.primary{border-color:#9fc8f0;background:var(--brand-soft)}
        .report-cta-card span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
        .report-cta-card strong{display:block;margin-top:8px;font-size:18px;color:var(--ink);word-break:break-word}
        .report-qr-row{display:flex;gap:10px;flex-wrap:wrap}
        .report-qr-card{display:flex;flex-direction:column;align-items:center;gap:6px}
        .print-qr{width:104px;height:104px;border:1px solid var(--line);border-radius:10px;background:#fff}
        .report-footer-panel{padding:18px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;background:linear-gradient(180deg,#fbfdff,#fff)}
        @page{margin:14mm}
        @media (max-width:900px){
          .report-header,.report-scorecard-grid,.report-watchlist,.report-cta-grid,.report-footer-panel{grid-template-columns:1fr}
          .report-hero-card{flex-direction:column}
          .report-score{min-width:auto}
        }
        @media print{
          body{padding:0;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
          a{text-decoration:none;color:#0b4f8f}
          .report-cta-band{padding:14px}
          .report-panel{padding:14px}
          .report-metric-card,.report-action-card,.report-watch-card{padding:14px}
          .print-chart img{max-height:300mm;object-fit:contain}
        }
      </style>
    </head><body>${summaryHtml}</body></html>
  `);
  w.document.close();
  if (typeof w.addEventListener === "function") {
    w.addEventListener("load", () => setTimeout(printWhenReady, 140), { once: true });
  }
  setTimeout(printWhenReady, 260);
  return true;
}

/* FILE: src/ui/coverageScore.js */
function renderCoverageScore(ctx) {
  const { mountEl, score, tooltipButton, formatPct } = ctx;
  if (!mountEl || !score) return;
  const improveTarget = score.total < 60 ? "open-advanced" : "open-stress";
  mountEl.innerHTML = `
    <article class="subsection">
      <h3>Plan Health Score ${tooltipButton("retirementScore")}</h3>
      <div class="preview-kpi">
        <div class="preview-kpi-item"><strong>Total</strong><span>${score.total}/100</span></div>
        <div class="preview-kpi-item"><strong>Status</strong><span>${score.band}</span></div>
        <div class="preview-kpi-item"><strong>Coverage</strong><span>${score.subs.coverage}/35</span></div>
        <div class="preview-kpi-item"><strong>Longevity</strong><span>${score.subs.longevity}/30</span></div>
        <div class="preview-kpi-item"><strong>Tax drag</strong><span>${score.subs.taxDrag}/15</span></div>
        <div class="preview-kpi-item"><strong>Clawback</strong><span>${score.subs.clawback}/10</span></div>
        <div class="preview-kpi-item"><strong>RRIF shock</strong><span>${score.subs.rrifShock}/10</span></div>
      </div>
      <details>
        <summary>How this score is calculated ${tooltipButton("coverageScoreWeights")}</summary>
        <ul class="plain-list small-copy muted">
          <li>Coverage ratio (0-35): guaranteed income vs spending in early retirement.</li>
          <li>Longevity risk (0-30): depletion age vs life expectancy.</li>
          <li>Tax drag (0-15): average tax wedge rate on registered withdrawals.</li>
          <li>Clawback exposure (0-10): estimated OAS clawback as a share of OAS.</li>
          <li>RRIF shock (0-10): taxable-income jump around RRIF minimum years.</li>
        </ul>
      </details>
      <div class="landing-actions">
        <button class="btn btn-secondary" type="button" data-action="${improveTarget}">Improve this score</button>
      </div>
      <p class="small-copy muted">Planning estimate only. Not advice.</p>
      <p class="small-copy muted">Average tax wedge in retirement: ${formatPct(score.metrics.avgTaxWedgeRate)}</p>
    </article>
  `;
}

/* FILE: src/ui/cppOasTimingSimulator.js */
function renderCppOasTimingSimulator(ctx) {
  const {
    mountEl,
    sim,
    preview,
    tooltipButton,
    numberField,
    formatCurrency,
    formatPct,
  } = ctx;
  if (!mountEl || !preview) return;
  mountEl.innerHTML = `
    <article class="subsection">
      <h3>CPP & OAS Start Age Simulator ${tooltipButton("cppOasTimingSim")}</h3>
      <p class="small-copy muted">Preview only. Compare timing tradeoffs, then apply if you want.</p>
      <div class="form-grid compact-mobile-two">
        ${numberField("CPP start age", "uiState.timingSim.cppStartAge", sim.cppStartAge, { min: 60, max: 70, step: 1 }, "cppStartAge", false, false, true)}
        ${numberField("OAS start age", "uiState.timingSim.oasStartAge", sim.oasStartAge, { min: 65, max: 70, step: 1 }, "oasStartAge", false, false, true)}
        <label class="inline-check form-span-full"><input type="checkbox" data-bind="uiState.timingSim.linkTiming" ${sim.linkTiming ? "checked" : ""} />Link timing</label>
      </div>
      <div class="preview-kpi">
        <div class="preview-kpi-item"><strong>Lifetime CPP+OAS</strong><span>${formatCurrency(preview.deltas.lifetimeBenefits)}</span><small class="muted">Delta vs current</small></div>
        <div class="preview-kpi-item"><strong>Retirement gross draw</strong><span>${formatCurrency(preview.deltas.grossWithdrawalAtRetire)}</span><small class="muted">Delta at retirement start</small></div>
        <div class="preview-kpi-item"><strong>Tax rate</strong><span>${formatPct(preview.deltas.effectiveTaxAtRetire)}</span><small class="muted">Delta at retirement start</small></div>
        <div class="preview-kpi-item"><strong>OAS clawback</strong><span>${formatCurrency(preview.deltas.clawbackAtRetire)}</span><small class="muted">Delta at retirement start</small></div>
      </div>
      <div class="landing-actions">
        <button class="btn btn-primary" type="button" data-action="apply-timing-preview">Apply timing</button>
        <button class="btn btn-secondary" type="button" data-action="reset-timing-preview">Reset preview</button>
      </div>
      <p class="small-copy muted">Tradeoff: starting earlier gives more years of smaller payments. Starting later gives fewer years of larger payments and can raise taxable income later.</p>
      <p class="small-copy muted">Guaranteed income ${tooltipButton("kpiGuaranteedIncome")} | Tax wedge ${tooltipButton("learnTaxGrossUp")} | OAS clawback ${tooltipButton("oasClawback")}</p>
    </article>
  `;
}

/* FILE: src/ui/rrspMeltdownSimulator.js */
function renderRrspMeltdownSimulator(ctx) {
  const {
    mountEl,
    plan,
    comparison,
    numberField,
    tooltipButton,
    formatCurrency,
    formatPct,
  } = ctx;
  if (!mountEl || !comparison) return;

  const before = comparison.before;
  const after = comparison.after;
  const d = {
    peakTax: after.peakEffectiveTax - before.peakEffectiveTax,
    clawback: after.totalClawback - before.totalClawback,
    rrifShock: after.rrifShockAt71 - before.rrifShockAt71,
    depletion: (after.depletionAge || 0) - (before.depletionAge || 0),
    totalTax: after.totalTax - before.totalTax,
  };

  mountEl.innerHTML = `
    <article class="subsection">
      <h3>RRSP Meltdown Strategy (Optional) ${tooltipButton("rrspMeltdown")}</h3>
      <p class="small-copy muted">Illustration only. Planned early RRSP withdrawals can reduce later RRIF pressure and clawback exposure.</p>
      <div class="form-grid compact-mobile-two">
        <label class="inline-check form-span-full">
          <input type="checkbox" data-bind="strategy.meltdownEnabled" ${plan.strategy.meltdownEnabled ? "checked" : ""} />
          Enable planned early RRSP withdrawals
        </label>
        ${numberField("Extra RRSP withdrawal / year", "strategy.meltdownAmount", plan.strategy.meltdownAmount, { min: 0, max: 50000, step: 500 }, "rrsp", false, !plan.strategy.meltdownEnabled, true)}
        ${numberField("Start age", "strategy.meltdownStartAge", plan.strategy.meltdownStartAge, { min: 50, max: 71, step: 1 }, "retirementAge", false, !plan.strategy.meltdownEnabled, true)}
        ${numberField("End age", "strategy.meltdownEndAge", plan.strategy.meltdownEndAge, { min: 55, max: 75, step: 1 }, "rrifConversionAge", false, !plan.strategy.meltdownEnabled, true)}
        ${numberField("Income ceiling (optional)", "strategy.meltdownIncomeCeiling", plan.strategy.meltdownIncomeCeiling, { min: 0, max: 250000, step: 1000 }, "learnTaxGrossUp", false, !plan.strategy.meltdownEnabled, true)}
      </div>
      <div class="preview-kpi">
        <div class="preview-kpi-item"><strong>Peak effective tax</strong><span>${formatPct(d.peakTax)}</span></div>
        <div class="preview-kpi-item"><strong>Total OAS clawback</strong><span>${formatCurrency(d.clawback)}</span></div>
        <div class="preview-kpi-item"><strong>RRIF shock at 71</strong><span>${formatCurrency(d.rrifShock)}</span></div>
        <div class="preview-kpi-item"><strong>Total tax estimate</strong><span>${formatCurrency(d.totalTax)}</span></div>
        <div class="preview-kpi-item"><strong>Depletion age change</strong><span>${before.depletionAge && after.depletionAge ? `${d.depletion >= 0 ? "+" : ""}${d.depletion} years` : "No depletion change"}</span></div>
      </div>
      <p class="small-copy muted">This is a strategy illustration. Real planning requires personal details.</p>
      <p class="small-copy muted">Tax wedge ${tooltipButton("learnTaxGrossUp")} | RRIF minimums ${tooltipButton("rrifMinimums")} | OAS clawback ${tooltipButton("oasClawback")}</p>
    </article>
  `;
}

/* FILE: src/ui/resultsStrip.js */

function renderResultsStrip(ctx) {
  const {
    mountEl,
    row,
    selectedAge,
    minAge,
    maxAge,
    tooltipButton,
    formatCurrency,
    formatPct,
    clamp,
  } = ctx;
  if (!mountEl || !row) return;

  const metrics = getReportMetrics(ctx.plan, row);
  const spending = metrics.spending;
  const guaranteed = metrics.guaranteedNet;
  const netGap = metrics.netGap;
  const gross = metrics.grossWithdrawal;
  const taxWedge = metrics.dragAmount;
  const coverageRatio = metrics.coverageRatio;
  const coveragePct = clamp(coverageRatio * 100, 0, 300);
  const surplus = metrics.surplus > 0;
  const barTotal = Math.max(1, guaranteed + Math.max(0, gross - taxWedge) + taxWedge);
  const guaranteedW = (guaranteed / barTotal) * 100;
  const netW = (Math.max(0, gross - taxWedge) / barTotal) * 100;
  const taxW = (taxWedge / barTotal) * 100;

  mountEl.innerHTML = `
    <div class="results-strip-head">
      <h3>At a glance ${tooltipButton("kpiNetGap")}</h3>
      <div class="results-strip-controls">
        <label for="resultsAgePicker" class="small-copy">Pick age</label>
        <input id="resultsAgePicker" type="range" min="${minAge}" max="${maxAge}" step="1" value="${selectedAge}" aria-label="Results strip age selector" />
        <strong id="resultsAgeLabel">Age ${selectedAge}</strong>
      </div>
    </div>
    <div class="results-strip-kpis">
      <article class="metric-card">
        <span class="label">After-tax spending ${tooltipButton("kpiSpendingTarget")}</span>
        <span class="value">${formatCurrency(spending)}</span>
        <span class="sub">Target this age</span>
      </article>
      <article class="metric-card">
        <span class="label">Guaranteed income ${tooltipButton("kpiGuaranteedIncome")}</span>
        <span class="value">${formatCurrency(guaranteed)}</span>
        <span class="sub">${metrics.estimateTaxes ? "After estimated tax" : "Tax estimates off"}</span>
      </article>
      <article class="metric-card ${surplus ? "metric-good" : ""}">
        <span class="label">Net gap from savings ${tooltipButton("kpiNetGap")}</span>
        <span class="value">${surplus ? "Surplus" : formatCurrency(netGap)}</span>
        <span class="sub">${surplus ? "Guaranteed exceeds target" : "After-tax gap"}</span>
      </article>
      <article class="metric-card">
        <span class="label">Gross withdrawal needed ${tooltipButton("kpiGrossWithdrawal")}</span>
        <span class="value">${formatCurrency(gross)}</span>
        <span class="sub">${metrics.estimateTaxes ? `Tax + clawback drag: ${formatCurrency(taxWedge)}` : "Tax estimates off"}</span>
      </article>
    </div>
    <div class="results-strip-meta">
      <span class="coverage-badge ${surplus ? "coverage-good" : ""}">
        Guaranteed income covers ${formatPct(Math.min(2.99, coverageRatio))}
      </span>
      <div class="results-mini-bar" role="img" aria-label="Income coverage mini bar">
        <span class="seg guaranteed" style="width:${guaranteedW.toFixed(1)}%"></span>
        <span class="seg netdraw" style="width:${netW.toFixed(1)}%"></span>
        <span class="seg tax" style="width:${taxW.toFixed(1)}%"></span>
      </div>
      <p class="small-copy muted">All comparisons are on an after-tax spending basis. Gross draw = net withdrawal plus estimated tax/clawback drag.</p>
    </div>
  `;
}

/* FILE: src/ui/supportMoments.js */
const SUPPORT_COOLDOWN_DAYS = 14;

function ensureSupportMomentState(uiState) {
  if (!uiState.supportShownEvents || typeof uiState.supportShownEvents !== "object") {
    uiState.supportShownEvents = {};
  }
  uiState.supportShownEvents = {
    wizardComplete: Boolean(uiState.supportShownEvents.wizardComplete),
    firstGrossUp: Boolean(uiState.supportShownEvents.firstGrossUp),
    firstClawback: Boolean(uiState.supportShownEvents.firstClawback),
    reportGenerated: Boolean(uiState.supportShownEvents.reportGenerated),
  };
  uiState.supportDismissedUntil = Number(uiState.supportDismissedUntil || 0);
  uiState.supportCardShownCount = Math.max(0, Number(uiState.supportCardShownCount || 0));
  uiState.supportCardDismissCount = Math.max(0, Number(uiState.supportCardDismissCount || 0));
  uiState.lastSupportTriggerReason = String(uiState.lastSupportTriggerReason || "");
  uiState.supportOptOut = Boolean(uiState.supportOptOut);
}

function isSupportDismissed(uiState, now = Date.now()) {
  ensureSupportMomentState(uiState);
  return uiState.supportDismissedUntil > now;
}

function markSupportMomentShown(uiState, key) {
  ensureSupportMomentState(uiState);
  uiState.supportShownEvents[key] = true;
  uiState.supportCardShownCount += 1;
  uiState.lastSupportTriggerReason = key;
}

function dismissSupportMoment(uiState, now = Date.now()) {
  ensureSupportMomentState(uiState);
  uiState.supportCardDismissCount += 1;
  uiState.supportDismissedUntil = now + (SUPPORT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
}

function maybeTriggerSupportMoment({ state, model, row, trigger, sessionShown = false }) {
  ensureSupportMomentState(state.uiState);
  if (state.uiState.supportOptOut) return "";
  if (state.uiState.supportCardDismissCount >= 3) return "";
  if (sessionShown) return "";
  if (isSupportDismissed(state.uiState)) return "";
  if (trigger === "wizardComplete" && !state.uiState.supportShownEvents.wizardComplete) return "wizardComplete";
  if (trigger === "firstGrossUp" && !state.uiState.supportShownEvents.firstGrossUp) {
    if ((row?.withdrawal || 0) > (row?.netFromWithdrawal || 0) && (row?.taxOnWithdrawal || 0) > 0) return "firstGrossUp";
  }
  if (trigger === "firstClawback" && !state.uiState.supportShownEvents.firstClawback) {
    if (state.strategy.oasClawbackModeling && (row?.oasClawback || 0) > 0) return "firstClawback";
  }
  if (trigger === "reportGenerated" && !state.uiState.supportShownEvents.reportGenerated) return "reportGenerated";
  if (!model || !row) return "";
  return "";
}

function supportMomentCopy(eventKey) {
  if (eventKey === "wizardComplete") {
    return "If this clarified your retirement withdrawals and taxes, consider supporting development.";
  }
  if (eventKey === "firstClawback") {
    return "If this helped you understand OAS clawback risk, consider supporting development.";
  }
  return "If this clarified your retirement withdrawals and taxes, consider supporting development.";
}

function buildSupportMomentCard(eventKey) {
  if (!eventKey) return "";
  return `
    <article class="subsection support-moment-card" aria-live="polite">
      <h3>Did this help clarify your retirement plan?</h3>
      <p class="muted">This tool is free and built by an independent developer. If it saved you time or helped you understand taxes and withdrawals, consider supporting its development.</p>
      <p class="small-copy muted">${supportMomentCopy(eventKey)}</p>
      <p class="small-copy muted">No paywall. Your support keeps it updated.</p>
      <div class="landing-actions">
        <a class="btn btn-primary" href="https://buymeacoffee.com/ashleysnl" target="_blank" rel="noopener noreferrer" aria-label="Buy me a coffee">☕ Buy me a coffee</a>
        <a class="btn btn-secondary" href="https://buymeacoffee.com/ashleysnl" target="_blank" rel="noopener noreferrer" aria-label="Become monthly supporter">☕ Become monthly supporter</a>
        <button class="btn btn-secondary" type="button" data-action="support-opt-out" aria-label="I already supported">I supported</button>
        <button class="btn btn-secondary" type="button" data-action="dismiss-support-moment">Not now</button>
      </div>
    </article>
  `;
}

/* FILE: src/ui/share.js */

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildSharePayload(state, minimal = false) {
  const payload = {
    by: state.profile.birthYear,
    p: state.profile.province,
    ra: state.profile.retirementAge,
    le: state.profile.lifeExpectancy,
    sp: state.profile.desiredSpending,
    inf: state.assumptions.inflation,
    rr: state.assumptions.riskProfile,
    bal: state.savings.currentTotal,
    con: state.savings.annualContribution,
    pEn: state.income.pension.enabled ? 1 : 0,
    pAmt: state.income.pension.amount,
    pAge: state.income.pension.startAge,
    cpp: state.income.cpp.amountAt65,
    cppAge: state.income.cpp.startAge,
    oas: state.income.oas.amountAt65,
    oasAge: state.income.oas.startAge,
    claw: state.strategy.oasClawbackModeling ? 1 : 0,
    rrif: state.strategy.applyRrifMinimums ? 1 : 0,
    sn: state.uiState.selectedScenarioLabel || "",
  };
  if (!minimal) {
    payload.spouse = state.profile.hasSpouse ? 1 : 0;
    payload.cInc = state.savings.contributionIncrease;
    payload.scn = state.assumptions.scenarioSpread;
    payload.mEn = state.strategy.meltdownEnabled ? 1 : 0;
    payload.mAmt = state.strategy.meltdownAmount;
    payload.mStart = state.strategy.meltdownStartAge;
    payload.mEnd = state.strategy.meltdownEndAge;
    payload.mCap = state.strategy.meltdownIncomeCeiling;
  }
  return payload;
}

function buildShareUrl(baseUrl, state, minimal = false) {
  const payload = buildSharePayload(state, minimal);
  const encoded = encodeURIComponent(JSON.stringify(payload));
  const url = new URL(baseUrl);
  const key = minimal ? "shareMin" : "share";
  url.hash = `${key}=${encoded}`;
  return url.toString();
}

function parseSharedScenarioFromUrl(locationObj) {
  try {
    const url = new URL(locationObj.href);
    let raw = url.searchParams.get("share") || url.searchParams.get("shareMin");
    if (!raw && url.hash) {
      const hash = String(url.hash).replace(/^#/, "");
      const [k, v] = hash.split("=");
      if (k === "share" || k === "shareMin") raw = v || "";
    }
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function applySharedScenarioToPlan(state, payload) {
  if (!payload || typeof payload !== "object") return state;
  const next = (typeof structuredClone === "function")
    ? structuredClone(state)
    : JSON.parse(JSON.stringify(state));
  next.profile.birthYear = safeNumber(payload.by, next.profile.birthYear);
  next.profile.province = String(payload.p || next.profile.province);
  next.profile.retirementAge = safeNumber(payload.ra, next.profile.retirementAge);
  next.profile.lifeExpectancy = safeNumber(payload.le, next.profile.lifeExpectancy);
  next.profile.desiredSpending = safeNumber(payload.sp, next.profile.desiredSpending);
  next.assumptions.inflation = safeNumber(payload.inf, next.assumptions.inflation);
  next.assumptions.riskProfile = String(payload.rr || next.assumptions.riskProfile);
  next.savings.currentTotal = safeNumber(payload.bal, next.savings.currentTotal);
  next.savings.annualContribution = safeNumber(payload.con, next.savings.annualContribution);
  next.income.pension.enabled = Boolean(payload.pEn);
  next.income.pension.amount = safeNumber(payload.pAmt, next.income.pension.amount);
  next.income.pension.startAge = safeNumber(payload.pAge, next.income.pension.startAge);
  next.income.cpp.amountAt65 = safeNumber(payload.cpp, next.income.cpp.amountAt65);
  next.income.cpp.startAge = safeNumber(payload.cppAge, next.income.cpp.startAge);
  next.income.oas.amountAt65 = safeNumber(payload.oas, next.income.oas.amountAt65);
  next.income.oas.startAge = safeNumber(payload.oasAge, next.income.oas.startAge);
  next.strategy.oasClawbackModeling = Boolean(payload.claw);
  next.strategy.applyRrifMinimums = Boolean(payload.rrif);
  next.uiState.selectedScenarioLabel = String(payload.sn || "");
  if (payload.spouse != null) next.profile.hasSpouse = Boolean(payload.spouse);
  if (payload.cInc != null) next.savings.contributionIncrease = safeNumber(payload.cInc, next.savings.contributionIncrease);
  if (payload.scn != null) next.assumptions.scenarioSpread = safeNumber(payload.scn, next.assumptions.scenarioSpread);
  if (payload.mEn != null) next.strategy.meltdownEnabled = Boolean(payload.mEn);
  if (payload.mAmt != null) next.strategy.meltdownAmount = safeNumber(payload.mAmt, next.strategy.meltdownAmount);
  if (payload.mStart != null) next.strategy.meltdownStartAge = safeNumber(payload.mStart, next.strategy.meltdownStartAge);
  if (payload.mEnd != null) next.strategy.meltdownEndAge = safeNumber(payload.mEnd, next.strategy.meltdownEndAge);
  if (payload.mCap != null) next.strategy.meltdownIncomeCeiling = safeNumber(payload.mCap, next.strategy.meltdownIncomeCeiling);
  return next;
}

function buildShareSummary({ state, row, formatCurrency, formatPct, link, depletionAge = null }) {
  const pension = safeNumber(row?.pensionGross || state.income.pension.amount, 0);
  const cpp = safeNumber(row?.cppGross || state.income.cpp.amountAt65, 0);
  const oas = safeNumber(row?.oasGross || state.income.oas.amountAt65, 0);
  const metrics = getReportMetrics(state, row || {});
  const guaranteed = metrics.guaranteedNet;
  const netGap = metrics.netGap;
  const gross = metrics.grossWithdrawal;
  const tax = metrics.dragAmount;
  const age = safeNumber(row?.age, state.profile.retirementAge);
  const scenario = String(state.uiState.selectedScenarioLabel || "Current plan");
  return [
    "Canadian Retirement Planner - Summary",
    `Scenario: ${scenario}`,
    `Age: ${age}`,
    `Retirement age: ${state.profile.retirementAge}`,
    `After-tax spending target: ${formatCurrency(row?.spending || state.profile.desiredSpending)}`,
    `Guaranteed income after estimated tax: ${formatCurrency(guaranteed)} (Gross sources: Pension ${formatCurrency(pension)} / CPP ${formatCurrency(cpp)} / OAS ${formatCurrency(oas)})`,
    `Net gap from savings: ${formatCurrency(netGap)}`,
    `Gross RRSP/RRIF withdrawal required: ${formatCurrency(gross)}`,
    metrics.estimateTaxes
      ? `Estimated tax + clawback drag: ${formatCurrency(tax)} (effective rate ${formatPct(metrics.effectiveTaxRate)})`
      : "Tax estimates: Off",
    `OAS clawback: ${formatCurrency(metrics.clawback)}${state.strategy.oasClawbackModeling && metrics.estimateTaxes ? "" : " (modeling off)"}`,
    metrics.netGap > 0 ? `Status: Gap remains (${formatCurrency(metrics.netGap)})` : `Status: Surplus/covered`,
    depletionAge ? `Depletion age: ${depletionAge}` : "Depletion age: none in projection",
    `Link: ${link}`,
  ].join("\n");
}

function buildScenarioPayloadFromSnapshot(snapshot) {
  const payload = snapshot?.payload || {};
  const strategy = payload.strategy || {};
  const income = payload.income || {};
  return {
    by: payload.profile?.birthYear,
    p: payload.profile?.province,
    ra: payload.profile?.retirementAge,
    le: payload.profile?.lifeExpectancy,
    sp: payload.profile?.desiredSpending,
    inf: payload.assumptions?.inflation,
    rr: payload.assumptions?.riskProfile,
    bal: payload.savings?.currentTotal,
    con: payload.savings?.annualContribution,
    pEn: income.pension?.enabled ? 1 : 0,
    pAmt: income.pension?.amount,
    pAge: income.pension?.startAge,
    cpp: income.cpp?.amountAt65,
    cppAge: income.cpp?.startAge,
    oas: income.oas?.amountAt65,
    oasAge: income.oas?.startAge,
    claw: strategy.oasClawbackModeling ? 1 : 0,
    rrif: strategy.applyRrifMinimums ? 1 : 0,
    mEn: strategy.meltdownEnabled ? 1 : 0,
    mAmt: strategy.meltdownAmount,
    mStart: strategy.meltdownStartAge,
    mEnd: strategy.meltdownEndAge,
    mCap: strategy.meltdownIncomeCeiling,
    sn: snapshot?.name || "Scenario",
  };
}

function buildScenarioShareUrl(baseUrl, payload) {
  const encoded = encodeURIComponent(JSON.stringify(payload || {}));
  const url = new URL(baseUrl);
  url.hash = `share=${encoded}`;
  return url.toString();
}

/* FILE: src/ui/learnUtils.js */
function learnCallouts(titleA, bodyA, titleB, bodyB, escapeHtml) {
  return `
    <div class="learn-callout-grid">
      <article class="learn-callout">
        <strong>${escapeHtml(titleA)}</strong>
        <p>${escapeHtml(bodyA)}</p>
      </article>
      <article class="learn-callout">
        <strong>${escapeHtml(titleB)}</strong>
        <p>${escapeHtml(bodyB)}</p>
      </article>
    </div>
  `;
}

function calculatePhaseWeightedSpending(phases) {
  const totalYears = Math.max(1, Number(phases.goYears) + Number(phases.slowYears) + Number(phases.noYears));
  const totalAmount = Number(phases.base) * (
    Number(phases.goYears) * Number(phases.goPct)
    + Number(phases.slowYears) * Number(phases.slowPct)
    + Number(phases.noYears) * Number(phases.noPct)
  );
  return totalAmount / totalYears;
}

/* FILE: src/ui/referenceLinksList.js */
function renderReferenceLinksList(links, escapeHtml) {
  if (!Array.isArray(links) || !links.length) {
    return `<p class="small-copy muted">No links available yet.</p>`;
  }
  return `
    <ul class="plain-list reference-links-list">
      ${links.map((item) => `
        <li class="reference-item">
          <a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(item.title)} (opens external link)">
            ${escapeHtml(item.title)} ↗
          </a>
          <p class="small-copy muted">${escapeHtml(item.description)}</p>
          <p class="small-copy muted">${escapeHtml(item.source)} • Last reviewed: ${escapeHtml(item.reviewed)}</p>
        </li>
      `).join("")}
    </ul>
  `;
}


/* FILE: src/content/methodology.js */

const METHODOLOGY_LAST_UPDATED = "2026";

const METHODOLOGY_SECTIONS = [
  {
    id: "method-scope",
    title: "What this simulator is / is not",
    body: [
      "This is a planning-level simulator to help you understand retirement cash flow and tax interactions.",
      "It is not financial, legal, or tax advice, and it does not replace licensed professional advice.",
      "Outputs are scenario estimates based on your assumptions.",
    ],
  },
  {
    id: "method-tax",
    title: "How taxes are estimated",
    body: [
      "The model uses a simplified progressive federal + provincial bracket approach.",
      "It reports planning-level effective tax rates and estimated tax drag in withdrawal years.",
      `Tax assumptions and brackets are hardcoded planning tables. Last updated: ${METHODOLOGY_LAST_UPDATED}.`,
    ],
  },
  {
    id: "method-oas",
    title: "OAS clawback",
    body: [
      "OAS clawback is estimated as a recovery tax when taxable income exceeds the threshold for a given year.",
      "Estimated clawback is shown as part of the tax wedge and year cards when enabled.",
    ],
  },
  {
    id: "method-rrif",
    title: "RRIF minimum withdrawals",
    body: [
      "RRSP to RRIF conversion is modeled at your selected conversion age (default age 71).",
      "Minimum RRIF withdrawal rates by age are applied when RRIF minimum modeling is enabled.",
    ],
  },
  {
    id: "method-benefits",
    title: "CPP and OAS handling",
    body: [
      "CPP and OAS are modeled from user-entered age-65 estimates and selected start ages.",
      "Start-age adjustments are applied for earlier/later starts as planning approximations.",
      "Indexation and timing impacts are handled at planning level, not benefit-statement precision.",
    ],
  },
  {
    id: "method-limits",
    title: "Limitations",
    body: [
      "Future tax rules and benefit formulas can change.",
      "The simulator does not model every personal tax credit, deduction, or pension detail.",
      "Use results directionally and validate key decisions with an advisor.",
    ],
  },
];

function renderMethodologyHtml(escapeHtml) {
  return `
    <section class="subsection">
      ${METHODOLOGY_SECTIONS.map((section) => `
        <article id="${escapeHtml(section.id)}" class="subsection">
          <h3>${escapeHtml(section.title)}</h3>
          <ul class="plain-list">
            ${section.body.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
          </ul>
        </article>
      `).join("")}
      <article class="subsection">
        <h3>Reference Links</h3>
        <p class="small-copy muted">Last verified: ${escapeHtml(SOURCES_LAST_VERIFIED)}</p>
        <p class="small-copy muted">
          Focused calculators:
          <a href="./oas-clawback-calculator.html">OAS clawback calculator</a> |
          <a href="./rrif-withdrawal-calculator.html">RRIF withdrawal calculator</a>
        </p>
        ${renderReferenceLinksList(REFERENCE_LINKS, escapeHtml)}
        <p class="small-copy muted">These references support the planning assumptions used in the simulator. Rules can change.</p>
      </article>
    </section>
  `;
}

/* FILE: src/ui/views/wizardView.js */
function explainer(title, text, action = "") {
  return `
    <aside class="guided-explainer">
      <strong>${title}</strong>
      <p class="muted">${text}</p>
      ${action}
    </aside>
  `;
}

function optionButton({ action, value, label, active, sublabel = "" }) {
  return `
    <button class="choice-card ${active ? "active" : ""}" type="button" data-action="${action}" data-value="${value}" aria-pressed="${active ? "true" : "false"}">
      <strong>${label}</strong>
      ${sublabel ? `<span>${sublabel}</span>` : ""}
    </button>
  `;
}

function segmentedButton({ action, value, label, active }) {
  return `<button class="segmented-btn ${active ? "active" : ""}" type="button" data-action="${action}" data-value="${value}" aria-pressed="${active ? "true" : "false"}">${label}</button>`;
}

function inlineNote(title, text) {
  return `
    <details class="inline-learn">
      <summary>${title}</summary>
      <p class="muted small-copy">${text}</p>
    </details>
  `;
}

function simpleNumberField({ label, bind, value, min, max, step = 1, suffix = "", hint = "", disabled = false, percent = false, inputMode = "decimal", displayAs = "" }) {
  return `
    <label class="guided-field ${disabled ? "is-disabled" : ""}">
      <span class="label-row">${label}</span>
      <div class="guided-input-wrap">
        <input
          type="number"
          data-bind="${bind}"
          data-type="number"
          value="${value}"
          min="${min}"
          max="${max}"
          step="${step}"
          inputmode="${inputMode}"
          ${disabled ? "disabled" : ""}
          ${percent ? 'data-percent-input="1"' : ""}
          ${displayAs ? `data-display-as="${displayAs}"` : ""}
        />
        ${suffix ? `<span class="guided-input-suffix">${suffix}</span>` : ""}
      </div>
      ${hint ? `<small>${hint}</small>` : ""}
    </label>
  `;
}

function buildWizardStepHtml(step, ctx) {
  const {
    state,
    model,
    provinces,
    ageNow,
    numberField,
    selectField,
    toPct,
    formatCurrency,
  } = ctx;

  const age = ageNow();
  const yearsToRetirement = Math.max(0, Number(state.profile.retirementAge || 65) - age);
  const guided = state.uiState.guided || {};
  const annualIncome = Math.max(0, Number(state.profile.annualIncome || 0));
  const retirementIncomePercent = Math.max(0.3, Number(guided.retirementIncomePercent || 0.7));
  const estimatedRetirementIncome = annualIncome * retirementIncomePercent;
  const firstRetirementRow = model?.base?.rows?.find((row) => row.age === state.profile.retirementAge) || model?.base?.rows?.[0] || null;
  const projectedBalance = Math.max(0, Number(model?.kpis?.balanceAtRetirement || firstRetirementRow?.balanceStart || 0));

  if (step === 1) {
    return `
      <div class="wizard-step-head">
        <p class="wizard-step-kicker">Step 1</p>
        <h3>Your basics</h3>
        <p class="muted">Start with the few inputs that matter most. This is enough to get a strong first answer.</p>
      </div>
      <div class="guided-step-layout">
        <div class="guided-step-main">
          <div class="guided-grid guided-grid-basics">
            ${simpleNumberField({ label: "Your age", bind: "profile.birthYear", value: age, min: 18, max: 85, step: 1, hint: "We store this as birth year behind the scenes.", displayAs: "age", inputMode: "numeric" })}
            ${numberField("Current savings", "savings.currentTotal", state.savings.currentTotal, { min: 0, max: 5000000, step: 1000 }, "currentSavings", false, false, true)}
            ${numberField("Annual income", "profile.annualIncome", annualIncome, { min: 0, max: 1000000, step: 1000 }, "annualIncome", false, false, true)}
            ${numberField("Retirement age", "profile.retirementAge", state.profile.retirementAge, { min: 50, max: 75, step: 1 }, "retirementAge", false, false, true)}
          </div>
          <div class="guided-inline-row">
            <label class="inline-check">
              <input type="checkbox" data-bind="uiState.guided.estimateRetirementAge" ${guided.estimateRetirementAge ? "checked" : ""} />
              I don't know. Estimate a typical retirement age for me.
            </label>
          </div>
          ${explainer("Quick read", `You have about ${yearsToRetirement} years until retirement based on the current target. You can refine everything later without losing this first plan.`)}
        </div>
        <aside class="guided-step-side">
          <div class="guided-summary-card">
            <strong>Why we start here</strong>
            <p class="muted">Age, savings, income, and retirement timing shape the whole projection. Everything else is refinement.</p>
            <div class="mini-stat-list">
              <span><strong>${yearsToRetirement}</strong> years to save</span>
              <span><strong>${formatCurrency(projectedBalance)}</strong> projected at retirement</span>
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  if (step === 2) {
    const lifestylePreset = guided.lifestylePreset || "comfortable";
    return `
      <div class="wizard-step-head">
        <p class="wizard-step-kicker">Step 2</p>
        <h3>Lifestyle</h3>
        <p class="muted">Pick a simple retirement lifestyle, then use a percent of income or a dollar target if you want more control.</p>
      </div>
      <div class="choice-card-grid">
        ${optionButton({ action: "set-lifestyle-preset", value: "basic", label: "Basic lifestyle", active: lifestylePreset === "basic", sublabel: "Leaner spending, more buffer" })}
        ${optionButton({ action: "set-lifestyle-preset", value: "comfortable", label: "Comfortable", active: lifestylePreset === "comfortable", sublabel: "A balanced default for most plans" })}
        ${optionButton({ action: "set-lifestyle-preset", value: "higher", label: "Higher income", active: lifestylePreset === "higher", sublabel: "More travel and discretionary spending" })}
      </div>
      <div class="guided-card">
        <div class="segmented-control" aria-label="Retirement income mode">
          ${segmentedButton({ action: "set-retirement-income-mode", value: "percent", label: "Use % of income", active: guided.retirementIncomeMode !== "dollar" })}
          ${segmentedButton({ action: "set-retirement-income-mode", value: "dollar", label: "Use dollar amount", active: guided.retirementIncomeMode === "dollar" })}
        </div>
        <div class="guided-grid compact-mobile-two">
          ${guided.retirementIncomeMode === "dollar"
            ? numberField("Desired retirement income", "profile.desiredSpending", state.profile.desiredSpending, { min: 12000, max: 350000, step: 500 }, "desiredSpending", false, false, true)
            : simpleNumberField({ label: "Target retirement income", bind: "uiState.guided.retirementIncomePercent", value: Math.round(retirementIncomePercent * 100), min: 30, max: 120, step: 1, suffix: "% of income", hint: `About ${formatCurrency(estimatedRetirementIncome)} per year with your current income.`, percent: true, inputMode: "numeric" })}
        </div>
      </div>
      ${explainer("Why this matters", "A retirement target turns your income and savings into a real answer. Start simple here. Fine-tune inflation and taxes later if you want.")}
      <div class="guided-learn-stack">
        ${inlineNote("What is a safe withdrawal rate?", "It is a planning rule of thumb for how much savings can support income over a long retirement. This planner uses a full year-by-year projection instead of a single rule.")}
        ${inlineNote("Why inflation matters", "Your target is entered in today's dollars so it feels familiar. The projection then grows future spending using the inflation assumption.")}
      </div>
    `;
  }

  if (step === 3) {
    return `
      <div class="wizard-step-head">
        <p class="wizard-step-kicker">Step 3</p>
        <h3>Savings and contributions</h3>
        <p class="muted">Tell us what you save today and roughly how it is split. You can use Canadian defaults if you don't want to think about accounts yet.</p>
      </div>
      <div class="guided-card">
        <div class="segmented-control" aria-label="Contribution mode">
          ${segmentedButton({ action: "set-contribution-mode", value: "annual", label: "Annual savings", active: guided.savingsContributionMode !== "percent" })}
          ${segmentedButton({ action: "set-contribution-mode", value: "percent", label: "% of income", active: guided.savingsContributionMode === "percent" })}
        </div>
        <div class="guided-grid compact-mobile-two">
          ${guided.savingsContributionMode === "percent"
            ? simpleNumberField({ label: "Savings rate", bind: "savings.annualContribution", value: annualIncome > 0 ? Math.round((Number(state.savings.annualContribution || 0) / annualIncome) * 100) : 0, min: 0, max: 60, step: 1, suffix: "% of income", hint: annualIncome > 0 ? `${formatCurrency(state.savings.annualContribution)} per year at current income.` : "", displayAs: "income-percent", inputMode: "numeric" })
            : numberField("Annual savings", "savings.annualContribution", state.savings.annualContribution, { min: 0, max: 250000, step: 500 }, "annualContribution", false, false, true)}
          ${simpleNumberField({ label: "RRSP share", bind: "uiState.guided.rrspShare", value: Math.round(Number(guided.rrspShare || 0.6) * 100), min: 0, max: 100, step: 5, suffix: "%", hint: "TFSA automatically gets the rest.", percent: true, inputMode: "numeric" })}
        </div>
        <label class="inline-check">
          <input type="checkbox" data-bind="uiState.guided.useCanadianDefaults" ${guided.useCanadianDefaults ? "checked" : ""} />
          Use typical Canadian defaults for my account split and assumptions.
        </label>
      </div>
      ${explainer("Current split", `${formatCurrency(state.accounts.rrsp || 0)} in RRSP/RRIF and ${formatCurrency(state.accounts.tfsa || 0)} in TFSA based on your simple split.`)}
      <div class="guided-learn-stack">
        ${inlineNote("What is CPP?", "CPP is the Canada Pension Plan. It is a government benefit based on your work history and contribution record.")}
        ${inlineNote("RRSP vs TFSA", "RRSP withdrawals are taxable later. TFSA withdrawals are not. Keeping a simple split helps the planner estimate tax drag more realistically.")}
      </div>
    `;
  }

  if (step === 4) {
    return `
      <div class="wizard-step-head">
        <p class="wizard-step-kicker">Step 4</p>
        <h3>Advanced assumptions</h3>
        <p class="muted">These are collapsed by default so beginners can keep moving. The planner already starts with Canadian defaults.</p>
      </div>
      <div class="guided-card">
        <label class="inline-check">
          <input type="checkbox" data-bind="uiState.showAdvancedControls" ${state.uiState.showAdvancedControls ? "checked" : ""} />
          Show advanced assumptions
        </label>
        <p class="small-copy muted">Defaults: 5% balanced return, 2% inflation, CPP and OAS included, tax-aware income modeling on.</p>
      </div>
      ${state.uiState.showAdvancedControls ? `
        <div class="guided-grid compact-mobile-two">
          ${selectField("Province", "profile.province", Object.entries(provinces).map(([value, label]) => ({ value, label })), state.profile.province, "province")}
          ${numberField("Balanced return", "assumptions.returns.balanced", toPct(state.assumptions.returns.balanced), { min: 1, max: 12, step: 0.1 }, "riskProfile", true)}
          ${numberField("Inflation", "assumptions.inflation", toPct(state.assumptions.inflation), { min: 0.5, max: 5, step: 0.1 }, "inflation", true)}
          ${numberField("CPP at 65", "income.cpp.amountAt65", state.income.cpp.amountAt65, { min: 0, max: 35000, step: 100 }, "cppAmount65", false, false, true)}
          ${numberField("CPP start age", "income.cpp.startAge", state.income.cpp.startAge, { min: 60, max: 70, step: 1 }, "cppStartAge", false, false, true)}
          ${numberField("OAS at 65", "income.oas.amountAt65", state.income.oas.amountAt65, { min: 0, max: 12000, step: 100 }, "oasAmount65", false, false, true)}
          ${numberField("OAS start age", "income.oas.startAge", state.income.oas.startAge, { min: 65, max: 70, step: 1 }, "oasStartAge", false, false, true)}
        </div>
      ` : `
        <div class="guided-placeholder-card">
          <strong>Keeping it simple</strong>
          <p class="muted">You can skip this step and still get a useful answer. Detailed assumptions stay available anytime in the detailed planner.</p>
        </div>
      `}
      <div class="guided-learn-stack">
        ${inlineNote("Why inflation matters", "Even modest inflation changes what your future spending target needs to be.")}
        ${inlineNote("What is CPP?", "CPP is a monthly federal retirement benefit based on your earnings history.")}
        ${inlineNote("Why taxes matter", "A retirement target is spending after tax. Registered withdrawals often need to be higher than the net spending gap.")}
      </div>
    `;
  }

  return `
    <div class="wizard-step-head">
      <p class="wizard-step-kicker">Step 5</p>
      <h3>Your first result is ready</h3>
      <p class="muted">You have enough information for a real first pass. Open the results to see if you are on track and what to do next.</p>
    </div>
    <div class="guided-result-preview">
      <div class="guided-result-card">
        <span class="result-label">Expected monthly retirement income</span>
        <strong>${formatCurrency(Math.max(0, Number(firstRetirementRow?.spending || state.profile.desiredSpending)) / 12)}</strong>
        <span class="muted">Based on your current plan inputs.</span>
      </div>
      <div class="guided-result-card">
        <span class="result-label">Projected portfolio at retirement</span>
        <strong>${formatCurrency(projectedBalance)}</strong>
        <span class="muted">${yearsToRetirement} years until retirement.</span>
      </div>
    </div>
    ${explainer("What unlocks next", "Results will show the big answer first, then the chart, income breakdown, and plain-language ways to improve the plan.", `
      <div class="landing-actions">
        <button class="btn btn-primary" type="button" data-nav-target="results">See my result</button>
        <button class="btn btn-secondary" type="button" data-action="open-advanced">Switch to detailed planner</button>
      </div>
    `)}
  `;
}

/* FILE: src/ui/views/learnView.js */
function buildLearnHtml(ctx) {
  const {
    learn,
    progress,
    completed,
    learnProgressItems,
    learnNumberField,
    buildLearnCallouts,
    tooltipButton,
    toPct,
    formatNumber,
    formatCurrency,
    supportUrl,
    escapeHtml,
  } = ctx;

  return `
    <div class="learn-layout">
      <aside class="learn-toc-wrap no-print">
        <nav class="learn-toc" aria-label="Learn table of contents">
          <h3>On this page</h3>
          <a href="#learn-inflation">1. Today Dollars vs Future Dollars (Inflation)</a>
          <a href="#learn-income">2. Retirement Income Sources</a>
          <a href="#learn-indexing">3. What Indexing Means</a>
          <a href="#learn-taxes">4. Taxes in Retirement</a>
          <a href="#learn-rrif">5. RRSP to RRIF Rules</a>
          <a href="#learn-spousal">6. Spousal Tax Sharing</a>
          <a href="#learn-oas">7. OAS Clawback</a>
          <a href="#learn-life">8. Life Expectancy and Planning Horizon</a>
          <a href="#learn-phases">9. Go-Go / Slow-Go / No-Go Retirement Years</a>
          <a href="#learn-together">10. Bringing It All Together</a>
          <a href="#learn-grossnet">11. Gross vs Net Withdrawals (Tax Wedge)</a>
          <a href="#learn-meltdown">12. RRSP Meltdown Strategy</a>
        </nav>
      </aside>
      <div class="learn-content">
        <section class="learn-section">
          <h3>Retirement Knowledge Progress</h3>
          <p class="muted small-copy">${completed}/${learnProgressItems.length} lessons marked complete.</p>
          <div class="learn-progress-list">
            ${learnProgressItems.map((item) => `
              <button type="button" class="learn-progress-item ${progress[item.key] ? "done" : ""}" data-action="toggle-learn-progress" data-value="${item.key}" aria-pressed="${progress[item.key] ? "true" : "false"}">
                <span>${progress[item.key] ? "✓" : "○"}</span>
                <span>${escapeHtml(item.label)}</span>
              </button>
            `).join("")}
          </div>
        </section>

        <section class="learn-section" id="learn-inflation">
          <h3>1) Today Dollars vs Future Dollars (Inflation)</h3>
          <p class="muted">A retirement budget set in today’s dollars will be higher in future years. Inflation quietly changes what your money buys.</p>
          ${buildLearnCallouts("Common misconception", "If inflation looks low today, it will not matter over decades.", "Try moving the slider", "Increase years and inflation to see compounding in action.", escapeHtml)}
          <div class="form-grid compact-mobile-two">
            ${learnNumberField("Retirement Annual Budget (Today's Dollars)", "uiState.learn.inflation.spendingToday", learn.inflation.spendingToday, { min: 10000, max: 400000, step: 500 }, "learnInflationCalc")}
            ${learnNumberField("Years until retirement", "uiState.learn.inflation.years", learn.inflation.years, { min: 0, max: 45, step: 1 }, "retirementAge", false, false, true)}
            <label class="form-span-full">
              <span class="label-row">Inflation rate <strong id="learnInflationRateValue">${formatNumber(toPct(learn.inflation.rate))}%</strong> ${tooltipButton("inflation")}</span>
              <input type="range" data-learn-bind="uiState.learn.inflation.rate" data-type="number" data-percent-input="1" min="1" max="5" step="0.1" value="${formatNumber(toPct(learn.inflation.rate))}" aria-label="Inflation rate slider" />
            </label>
          </div>
          <div class="preview-kpi" id="learnInflationOut"></div>
          <canvas id="learnInflationChart" width="1000" height="240" aria-label="Inflation spending growth chart" role="img"></canvas>
          <p class="small-copy muted"><strong>Why this matters:</strong> If your spending target is not inflation-aware, your future plan can be underfunded.</p>
        </section>

        <section class="learn-section" id="learn-income">
          <h3>2) Retirement Income Sources</h3>
          <p class="muted">Most plans combine guaranteed income (private pension, CPP, OAS) with withdrawals from savings.</p>
          <ul class="plain-list">
            <li><strong>Private pension:</strong> often starts at a set age and may or may not be indexed.</li>
            <li><strong>CPP:</strong> public pension based on your contribution history.</li>
            <li><strong>OAS:</strong> age-based benefit, separate from CPP, with clawback at higher incomes.</li>
            <li><strong>RRSP/RRIF withdrawals:</strong> taxable income used to fill the remaining gap.</li>
            <li><strong>TFSA savings:</strong> eligible withdrawals are tax-free, including TFSA capital gains.</li>
            <li><strong>Cash / non-registered savings:</strong> growth can create taxable income (for example interest, dividends, or capital gains).</li>
          </ul>
          <p class="small-copy muted"><strong>Tax note:</strong> TFSA capital gains are not taxed when withdrawn. Capital gains from cash/non-registered investing are taxable under current tax rules.</p>
        </section>

        <section class="learn-section" id="learn-indexing">
          <h3>3) What Indexing Means</h3>
          <p class="muted">Indexed income grows with inflation. Non-indexed income stays flat in dollars but loses purchasing power over time.</p>
          ${buildLearnCallouts("Why this matters", "CPP and OAS are indexed. This helps protect spending power as prices rise.", "Try moving the slider", "Raise inflation and compare indexed vs flat income over 25 years.", escapeHtml)}
          <div class="form-grid compact-mobile-two">
            ${learnNumberField("Starting income", "uiState.learn.indexedIncome.startIncome", learn.indexedIncome.startIncome, { min: 0, max: 100000, step: 250 }, "cppAmount65")}
            ${learnNumberField("Years", "uiState.learn.indexedIncome.years", learn.indexedIncome.years, { min: 1, max: 40, step: 1 }, "lifeExpectancy", false, false, true)}
            <label class="form-span-full">
              <span class="label-row">Inflation rate <strong id="learnIndexedInflationValue">${formatNumber(toPct(learn.indexedIncome.inflation))}%</strong> ${tooltipButton("inflation")}</span>
              <input type="range" data-learn-bind="uiState.learn.indexedIncome.inflation" data-type="number" data-percent-input="1" min="0" max="5" step="0.1" value="${formatNumber(toPct(learn.indexedIncome.inflation))}" aria-label="Indexed income inflation slider" />
            </label>
          </div>
          <canvas id="learnIndexedChart" width="1000" height="240" aria-label="Indexed vs non-indexed income chart" role="img"></canvas>
          <div class="legend-row learn-chart-legend">
            <span class="legend-item"><span class="legend-chip" style="background:#16a34a;"></span>Indexed income</span>
            <span class="legend-item"><span class="legend-chip" style="background:#f59e0b;"></span>Non-indexed income (nominal)</span>
            <span class="legend-item"><span class="legend-chip" style="background:#d9485f;"></span>Non-indexed purchasing power (today's dollars)</span>
          </div>
          <p class="small-copy muted"><strong>Why this matters:</strong> A flat pension can feel smaller each year when prices rise.</p>
          <p class="small-copy muted"><a href="./cpp-timing-calculator-canada.html">Try the CPP timing calculator page</a>.</p>
        </section>

        <section class="learn-section" id="learn-taxes">
          <h3>4) Taxes in Retirement</h3>
          <p class="muted">Retirement spending targets are usually after-tax, but withdrawals from RRSP/RRIF are taxable. That creates a gross-up need.</p>
          ${buildLearnCallouts("Common misconception", "If I need $80,000 to spend, I only need to withdraw $80,000.", "Why this matters", "You need to withdraw enough to cover both spending and tax.", escapeHtml)}
          <div class="form-grid compact-mobile-two">
            ${learnNumberField("After-tax income goal", "uiState.learn.taxGrossUp.netGoal", learn.taxGrossUp.netGoal, { min: 12000, max: 300000, step: 500 }, "desiredSpending")}
            <label class="form-span-full">
              <span class="label-row">Effective tax rate <strong id="learnTaxRateValue">${formatNumber(toPct(learn.taxGrossUp.rate))}%</strong> ${tooltipButton("learnTaxGrossUp")}</span>
              <input type="range" data-learn-bind="uiState.learn.taxGrossUp.rate" data-type="number" data-percent-input="1" min="5" max="45" step="0.5" value="${formatNumber(toPct(learn.taxGrossUp.rate))}" aria-label="Effective tax rate slider" />
            </label>
          </div>
          <div class="preview-kpi" id="learnTaxOut"></div>
          <p class="small-copy muted">Marginal tax applies to the next dollar. Effective tax is average tax across all dollars.</p>
          <p class="small-copy muted"><a href="./retirement-tax-calculator-canada.html">Try the retirement tax calculator page</a>.</p>
        </section>

        <section class="learn-section" id="learn-rrif">
          <h3>5) RRSP to RRIF Rules</h3>
          <p class="muted">You must convert RRSP assets to a RRIF (or annuity) by the end of age 71. RRIF has minimum withdrawals that grow with age.</p>
          <div class="form-grid compact-mobile-two">
            <label class="form-span-full">
              <span class="label-row">Age <strong id="learnRrifAgeValue">${formatNumber(learn.rrif.age)}</strong> ${tooltipButton("learnRrifMinimum")}</span>
              <input type="range" data-learn-bind="uiState.learn.rrif.age" data-type="number" min="65" max="95" step="1" value="${formatNumber(learn.rrif.age)}" aria-label="RRIF age slider" />
            </label>
            ${learnNumberField("RRIF balance", "uiState.learn.rrif.balance", learn.rrif.balance, { min: 0, max: 5000000, step: 1000 }, "rrifMinimums")}
          </div>
          <div class="preview-kpi learn-rrif-out" id="learnRrifOut"></div>
          <p class="small-copy muted"><strong>Why this matters:</strong> Even when spending drops, RRIF minimums can keep taxable income elevated.</p>
          <p class="small-copy muted"><a href="./rrif-withdrawal-calculator.html">Try the RRIF withdrawal landing calculator</a>.</p>
          <p class="small-copy muted"><a href="./rrif-minimum-withdrawal-calculator.html">Try the RRIF minimum calculator page</a>.</p>
        </section>

        <section class="learn-section" id="learn-spousal">
          <h3>6) Spousal Tax Sharing</h3>
          <p class="muted">Pension income splitting can move up to 50% of eligible pension income between spouses, potentially reducing combined tax.</p>
          <div class="form-grid compact-mobile-two">
            ${learnNumberField("Spouse A Income", "uiState.learn.spousalSplit.spouseA", learn.spousalSplit.spouseA, { min: 0, max: 300000, step: 500 }, "learnPensionSplit")}
            ${learnNumberField("Spouse B Income", "uiState.learn.spousalSplit.spouseB", learn.spousalSplit.spouseB, { min: 0, max: 300000, step: 500 }, "learnPensionSplit")}
            <label class="form-span-full">
              <span class="label-row">Split to spouse B <strong id="learnSplitPctValue">${formatNumber(toPct(learn.spousalSplit.splitPct))}%</strong> ${tooltipButton("learnPensionSplit")}</span>
              <input type="range" data-learn-bind="uiState.learn.spousalSplit.splitPct" data-type="number" data-percent-input="1" min="0" max="50" step="1" value="${formatNumber(toPct(learn.spousalSplit.splitPct))}" aria-label="Pension split percentage slider" />
            </label>
          </div>
          <div class="preview-kpi" id="learnSpousalOut"></div>
        </section>

        <section class="learn-section" id="learn-oas">
          <h3>7) OAS Clawback</h3>
          <p class="muted">When taxable income rises above the OAS recovery threshold, part of OAS is repaid through recovery tax.</p>
          <div class="form-grid compact-mobile-two">
            <label class="form-span-full">
              <span class="label-row">Annual income <strong id="learnOasIncomeValue">${formatCurrency(learn.oas.income)}</strong> ${tooltipButton("learnOasClawback")}</span>
              <input type="range" data-learn-bind="uiState.learn.oas.income" data-type="number" min="30000" max="250000" step="500" value="${formatNumber(learn.oas.income)}" aria-label="Annual income slider" />
            </label>
            ${learnNumberField("OAS monthly (per person)", "uiState.learn.oas.monthly", learn.oas.monthly, { min: 500, max: 1200, step: 1 }, "oasAmount65", false, false, true)}
            <label class="compact-field">
              <span class="label-row">Recipients ${tooltipButton("learnOasClawback")}</span>
              <select data-learn-bind="uiState.learn.oas.recipients" data-type="number" aria-label="OAS recipients">
                <option value="1" ${Number(learn.oas.recipients) === 1 ? "selected" : ""}>1</option>
                <option value="2" ${Number(learn.oas.recipients) === 2 ? "selected" : ""}>2</option>
              </select>
            </label>
          </div>
          <div class="preview-kpi" id="learnOasOut"></div>
          <p class="small-copy muted"><a href="./oas-clawback-calculator.html">Try the OAS clawback landing calculator</a>.</p>
        </section>

        <section class="learn-section" id="learn-life">
          <h3>8) Life Expectancy and Planning Horizon</h3>
          <p class="muted">Planning for a longer horizon helps protect against outliving your money.</p>
          <ul class="plain-list">
            <li>Retiring at 60 and planning to 95 means a 35-year drawdown horizon.</li>
            <li>Small spending or return changes compound over long horizons.</li>
            <li>Use stress tests to understand downside risk.</li>
          </ul>
        </section>

        <section class="learn-section" id="learn-phases">
          <h3>9) Go-Go / Slow-Go / No-Go Retirement Years</h3>
          <p class="muted">Many retirees spend more in early active years, then less later. This can improve planning realism.</p>
          <div class="form-grid">
            <div class="form-span-full">
              ${learnNumberField("Base Annual Spend", "uiState.learn.phases.base", learn.phases.base, { min: 12000, max: 250000, step: 500 }, "desiredSpending")}
            </div>
            ${learnNumberField("Go-Go years (spend more)", "uiState.learn.phases.goYears", learn.phases.goYears, { min: 1, max: 20, step: 1 }, "lifeExpectancy", false, false, true)}
            ${learnNumberField("Go-Go spending % of base", "uiState.learn.phases.goPct", toPct(learn.phases.goPct), { min: 60, max: 150, step: 1 }, "desiredSpending", true, false, true)}
            ${learnNumberField("Slow-Go years (spend less)", "uiState.learn.phases.slowYears", learn.phases.slowYears, { min: 1, max: 20, step: 1 }, "lifeExpectancy", false, false, true)}
            ${learnNumberField("Slow-Go spending % of base", "uiState.learn.phases.slowPct", toPct(learn.phases.slowPct), { min: 50, max: 130, step: 1 }, "desiredSpending", true, false, true)}
            ${learnNumberField("No-Go years (spend less again)", "uiState.learn.phases.noYears", learn.phases.noYears, { min: 1, max: 25, step: 1 }, "lifeExpectancy", false, false, true)}
            ${learnNumberField("No-Go spending % of base", "uiState.learn.phases.noPct", toPct(learn.phases.noPct), { min: 40, max: 120, step: 1 }, "desiredSpending", true, false, true)}
          </div>
          <canvas id="learnPhaseChart" width="1000" height="240" aria-label="Retirement spending phases chart" role="img"></canvas>
          <div class="preview-kpi" id="learnPhaseOut"></div>
          <p class="small-copy muted"><strong>Important takeaway:</strong> Oversaving has opportunity cost. A phased spending plan can better match real life.</p>
        </section>

        <section class="learn-section" id="learn-together">
          <h3>10) Bringing It All Together</h3>
          <p class="muted">You now have the core concepts to build a stronger retirement plan with confidence.</p>
          <p class="small-copy muted">Use your new understanding of inflation, indexing, taxes, RRIF rules, and spending phases in the Guided Setup flow.</p>
          <p class="small-copy muted">If this tool helped you understand retirement planning, consider supporting its development: <a href="${escapeHtml(supportUrl)}" target="_blank" rel="noopener noreferrer">☕ Support</a>.</p>
          <div class="landing-actions">
            <button class="btn btn-primary" type="button" data-action="launch-planner">Go to Guided setup</button>
          </div>
        </section>

        <section class="learn-section" id="learn-grossnet">
          <h3>11) Gross vs Net Withdrawals (Tax Wedge)</h3>
          <p class="muted">If you need a net spending amount, you often need a larger gross RRSP/RRIF withdrawal because some goes to tax.</p>
          <ul class="plain-list">
            <li><strong>Net spending need:</strong> what you keep to live on.</li>
            <li><strong>Gross withdrawal:</strong> total amount taken from RRSP/RRIF.</li>
            <li><strong>Tax wedge:</strong> the part of gross sent to tax.</li>
          </ul>
          <p class="small-copy muted">This is why the planner shows both net gap and gross withdrawal.</p>
        </section>

        <section class="learn-section" id="learn-meltdown">
          <h3>12) RRSP Meltdown: Why earlier withdrawals can help</h3>
          <p class="muted">A planned early withdrawal strategy can reduce large forced RRIF withdrawals later, potentially lowering peak tax and clawback pressure.</p>
          <ul class="plain-list">
            <li>Withdraw moderately in lower-tax years.</li>
            <li>Reduce RRSP size before RRIF minimums rise.</li>
            <li>Potentially reduce OAS clawback in high-income years.</li>
          </ul>
          <p class="small-copy muted">This is a planning illustration, not advice.</p>
        </section>
      </div>
    </div>
  `;
}

/* FILE: src/ui/views/learnOutputsView.js */
function updateLearnOutputsView(ctx) {
  const {
    state,
    el,
    rrifMinWithdrawal,
    estimateTotalTax,
    calculatePhaseWeightedSpending,
    drawLearnLineChart,
    drawLearnMultiLineChart,
    formatCurrency,
    formatCompactCurrency,
    formatPct,
    formatNumber,
    formatSignedCurrency,
    toPct,
    clamp,
    tooltipButton,
    bindInlineTooltipTriggers,
  } = ctx;

  if (!el.learnPanel || !el.learnPanel.querySelector("#learnInflationOut")) return;
  const learn = state.uiState.learn;

  const infAnnual = learn.inflation.spendingToday * Math.pow(1 + learn.inflation.rate, learn.inflation.years);
  const infRateValue = el.learnPanel.querySelector("#learnInflationRateValue");
  if (infRateValue) infRateValue.textContent = `${formatNumber(toPct(learn.inflation.rate))}%`;
  const infOut = el.learnPanel.querySelector("#learnInflationOut");
  if (infOut) {
    infOut.innerHTML = `
      <div class="preview-kpi-item"><strong>Future Annual Budget</strong><span>${formatCurrency(infAnnual)}</span></div>
    `;
  }

  const gross = learn.taxGrossUp.rate >= 0.99 ? learn.taxGrossUp.netGoal : learn.taxGrossUp.netGoal / (1 - learn.taxGrossUp.rate);
  const tax = Math.max(0, gross - learn.taxGrossUp.netGoal);
  const taxRateValue = el.learnPanel.querySelector("#learnTaxRateValue");
  if (taxRateValue) taxRateValue.textContent = `${formatNumber(toPct(learn.taxGrossUp.rate))}%`;
  const taxOut = el.learnPanel.querySelector("#learnTaxOut");
  if (taxOut) {
    taxOut.innerHTML = `
      <div class="preview-kpi-item"><strong>Required gross withdrawal</strong><span>${formatCurrency(gross)}</span></div>
      <div class="preview-kpi-item"><strong>Tax amount</strong><span>${formatCurrency(tax)}</span></div>
      <div class="preview-kpi-item"><strong>Net target</strong><span>${formatCurrency(learn.taxGrossUp.netGoal)}</span></div>
      <div class="preview-kpi-item"><strong>Gross-up difference</strong><span>${formatCurrency(gross - learn.taxGrossUp.netGoal)}</span></div>
    `;
  }

  const rrifFactor = rrifMinWithdrawal[learn.rrif.age] ?? 0.2;
  const rrifMin = learn.rrif.balance * rrifFactor;
  const rrifAgeValue = el.learnPanel.querySelector("#learnRrifAgeValue");
  if (rrifAgeValue) rrifAgeValue.textContent = `${formatNumber(learn.rrif.age)}`;
  const rrifOut = el.learnPanel.querySelector("#learnRrifOut");
  if (rrifOut) {
    rrifOut.innerHTML = `
      <div class="preview-kpi-item"><strong>Minimum withdrawal %</strong><span>${formatPct(rrifFactor)}</span></div>
      <div class="preview-kpi-item"><strong>Minimum withdrawal amount</strong><span>${formatCurrency(rrifMin)}</span></div>
    `;
  }

  const oasAnnualTotal = learn.oas.monthly * 12 * Number(learn.oas.recipients || 1);
  const oasThreshold = 90000;
  const oasLoss = Math.min(oasAnnualTotal, Math.max(0, (learn.oas.income - oasThreshold) * 0.15));
  const oasRemain = Math.max(0, oasAnnualTotal - oasLoss);
  const oasIncomeValue = el.learnPanel.querySelector("#learnOasIncomeValue");
  if (oasIncomeValue) oasIncomeValue.textContent = `${formatCurrency(learn.oas.income)}`;
  const oasOut = el.learnPanel.querySelector("#learnOasOut");
  if (oasOut) {
    oasOut.innerHTML = `
      <div class="preview-kpi-item"><strong>Estimated OAS lost</strong><span>${formatCurrency(oasLoss)}</span></div>
      <div class="preview-kpi-item"><strong>Estimated OAS remaining</strong><span>${formatCurrency(oasRemain)}</span></div>
      <div class="preview-kpi-item"><strong>OAS before clawback</strong><span>${formatCurrency(oasAnnualTotal)}</span></div>
      <div class="preview-kpi-item"><strong>Threshold used</strong><span>${formatCurrency(oasThreshold)}</span></div>
    `;
  }

  const split = clamp(learn.spousalSplit.splitPct, 0, 0.5);
  const splitPctValue = el.learnPanel.querySelector("#learnSplitPctValue");
  if (splitPctValue) splitPctValue.textContent = `${formatNumber(toPct(split))}%`;
  const move = learn.spousalSplit.spouseA * split;
  const beforeTax = estimateTotalTax(state, learn.spousalSplit.spouseA, 0) + estimateTotalTax(state, learn.spousalSplit.spouseB, 0);
  const afterTax = estimateTotalTax(state, Math.max(0, learn.spousalSplit.spouseA - move), 0)
    + estimateTotalTax(state, learn.spousalSplit.spouseB + move, 0);
  const spousalOut = el.learnPanel.querySelector("#learnSpousalOut");
  if (spousalOut) {
    spousalOut.innerHTML = `
      <div class="preview-kpi-item"><strong>Combined tax before split</strong><span>${formatCurrency(beforeTax)}</span></div>
      <div class="preview-kpi-item"><strong>Combined tax after split</strong><span>${formatCurrency(afterTax)}</span></div>
      <div class="preview-kpi-item"><strong>Estimated tax difference</strong><span>${formatSignedCurrency(beforeTax - afterTax)}</span></div>
      <div class="preview-kpi-item"><strong>Income shifted</strong><span>${formatCurrency(move)}</span></div>
    `;
  }

  const weightedSpending = calculatePhaseWeightedSpending(learn.phases);
  const phaseOut = el.learnPanel.querySelector("#learnPhaseOut");
  if (phaseOut) {
    phaseOut.innerHTML = `
      <div class="preview-kpi-item"><strong>Phase-weighted annual spending ${tooltipButton("phaseWeightedSpending")}</strong><span>${formatCurrency(weightedSpending)}</span></div>
      <div class="preview-kpi-item"><strong>Total years modeled</strong><span>${learn.phases.goYears + learn.phases.slowYears + learn.phases.noYears}</span></div>
    `;
    bindInlineTooltipTriggers(phaseOut);
  }

  safeDraw(drawInflationChart);
  safeDraw(drawIndexedChart);
  safeDraw(drawPhaseChart);

  function drawInflationChart() {
    const canvas = el.learnPanel?.querySelector("#learnInflationChart");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const d = state.uiState.learn.inflation;
    const points = [];
    for (let i = 0; i <= d.years; i += 1) {
      points.push(d.spendingToday * Math.pow(1 + d.rate, i));
    }
    drawLearnLineChart(canvas, points, {
      color: "#0f6abf",
      fill: "rgba(15, 106, 191, 0.16)",
      xLabeler: (i) => `${i}y`,
    }, formatCurrency, formatCompactCurrency);
  }

  function drawIndexedChart() {
    const canvas = el.learnPanel?.querySelector("#learnIndexedChart");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const d = state.uiState.learn?.indexedIncome || {};
    const startIncome = safeNumber(d.startIncome, 30000);
    const years = clamp(Math.round(safeNumber(d.years, 25)), 1, 40);
    const inflation = clamp(safeNumber(d.inflation, 0.02), 0, 0.08);
    const infValue = el.learnPanel?.querySelector("#learnIndexedInflationValue");
    if (infValue) infValue.textContent = `${formatNumber(toPct(inflation))}%`;
    const indexed = [];
    const flatNominal = [];
    const flatReal = [];
    for (let i = 0; i <= years; i += 1) {
      indexed.push(startIncome * Math.pow(1 + inflation, i));
      flatNominal.push(startIncome);
      flatReal.push(startIncome / Math.pow(1 + inflation, i));
    }
    try {
      drawLearnMultiLineChart(canvas, [indexed, flatNominal, flatReal], {
        colors: ["#16a34a", "#f59e0b", "#d9485f"],
        xLabeler: (i, total) => (i % Math.max(1, Math.ceil(total / 5)) === 0 ? `${i}y` : ""),
      }, formatCurrency, formatCompactCurrency);
    } catch {
      // Fallback to single indexed line if multi-series draw fails in older webviews.
      drawLearnLineChart(canvas, indexed, {
        color: "#16a34a",
        fill: "rgba(22, 163, 74, 0.12)",
        xLabeler: (i, total) => (i % Math.max(1, Math.ceil(total / 5)) === 0 ? `${i}y` : ""),
      }, formatCurrency, formatCompactCurrency);
    }
  }

  function drawPhaseChart() {
    const canvas = el.learnPanel?.querySelector("#learnPhaseChart");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const d = state.uiState.learn?.phases || {};
    const base = Math.max(0, safeNumber(d.base, 80000));
    const goYears = clamp(Math.round(safeNumber(d.goYears, 10)), 1, 20);
    const slowYears = clamp(Math.round(safeNumber(d.slowYears, 10)), 1, 20);
    const noYears = clamp(Math.round(safeNumber(d.noYears, 10)), 1, 25);
    const goPct = clamp(safePercent(d.goPct, 1.1), 0.6, 1.5);
    const slowPct = clamp(safePercent(d.slowPct, 0.9), 0.5, 1.3);
    const noPct = clamp(safePercent(d.noPct, 0.75), 0.4, 1.2);
    const points = [];
    for (let i = 0; i < goYears; i += 1) points.push(base * goPct);
    for (let i = 0; i < slowYears; i += 1) points.push(base * slowPct);
    for (let i = 0; i < noYears; i += 1) points.push(base * noPct);
    drawLearnLineChart(canvas, points, {
      color: "#0ea5a8",
      fill: "rgba(14, 165, 168, 0.14)",
      xLabeler: (i, total) => (i % Math.max(1, Math.ceil(total / 6)) === 0 ? `Y${i + 1}` : ""),
    }, formatCurrency, formatCompactCurrency);
  }

  function safeNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function safePercent(value, fallback) {
    const n = safeNumber(value, fallback);
    if (n > 1.6) return n / 100;
    return n;
  }

  function safeDraw(fn) {
    try {
      fn();
    } catch {
      // Keep other learning visuals rendering if one chart fails.
    }
  }
}

/* FILE: src/ui/views/planInputsView.js */
function plannerCard(title, description, content, open = false) {
  return `
    <details class="accordion planner-card planner-card-guided" ${open ? "open" : ""}>
      <summary>${title}</summary>
      <div class="accordion-content">
        <p class="small-copy muted">${description}</p>
        ${content}
      </div>
    </details>
  `;
}

function detailPlannerHint() {
  return `
    <div class="advanced-inline-callout advanced-inline-callout-soft">
      <strong>Need more precision?</strong>
      <p class="muted">Switch to the detailed planner for full assumptions, strategy controls, RRIF rules, and richer scenario tools.</p>
      <div class="landing-actions">
        <button class="btn btn-primary" type="button" data-nav-target="results">View results</button>
        <button class="btn btn-secondary" type="button" data-action="open-advanced">Switch to detailed planner</button>
      </div>
    </div>
  `;
}

function buildPlanInputsHtml(ctx) {
  const {
    state,
    provinces,
    selectField,
    numberField,
    tooltipButton,
    toPct,
  } = ctx;

  const guided = state.uiState.guided || {};
  const annualIncome = Number(state.profile.annualIncome || 0);
  const basics = `
    <div class="form-grid compact-mobile-two">
      ${selectField("Province", "profile.province", Object.entries(provinces).map(([value, label]) => ({ value, label })), state.profile.province, "province")}
      ${numberField("Annual income", "profile.annualIncome", annualIncome, { min: 0, max: 1000000, step: 1000 }, "annualIncome", false, false, true)}
      ${numberField("Retirement age", "profile.retirementAge", state.profile.retirementAge, { min: 50, max: 75, step: 1 }, "retirementAge", false, false, true)}
      ${numberField("Plan until age", "profile.lifeExpectancy", state.profile.lifeExpectancy, { min: 75, max: 105, step: 1 }, "lifeExpectancy", false, false, true)}
      ${numberField("Current savings", "savings.currentTotal", state.savings.currentTotal, { min: 0, max: 5000000, step: 1000 }, "currentSavings", false, false, true)}
      ${numberField("Annual savings", "savings.annualContribution", state.savings.annualContribution, { min: 0, max: 250000, step: 500 }, "annualContribution", false, false, true)}
    </div>
  `;

  const lifestyle = `
    <div class="form-grid compact-mobile-two">
      ${numberField("Retirement income target", "profile.desiredSpending", state.profile.desiredSpending, { min: 12000, max: 350000, step: 500 }, "desiredSpending", false, false, true)}
      ${numberField("Inflation", "assumptions.inflation", toPct(state.assumptions.inflation), { min: 0.5, max: 5, step: 0.1 }, "inflation", true, false, true)}
    </div>
    <p class="field-microcopy">Lifestyle preset: <strong>${guided.lifestylePreset || "comfortable"}</strong>. This target stays editable if you want to override the preset.</p>
  `;

  const income = `
    <div class="form-grid compact-mobile-two">
      ${numberField("CPP amount at 65", "income.cpp.amountAt65", state.income.cpp.amountAt65, { min: 0, max: 35000, step: 100 }, "cppAmount65", false, false, true)}
      ${numberField("CPP start age", "income.cpp.startAge", state.income.cpp.startAge, { min: 60, max: 70, step: 1 }, "cppStartAge", false, false, true)}
      ${numberField("OAS amount at 65", "income.oas.amountAt65", state.income.oas.amountAt65, { min: 0, max: 12000, step: 100 }, "oasAmount65", false, false, true)}
      ${numberField("OAS start age", "income.oas.startAge", state.income.oas.startAge, { min: 65, max: 70, step: 1 }, "oasStartAge", false, false, true)}
      <label class="inline-check form-span-full">
        <input type="checkbox" data-bind="income.pension.enabled" ${state.income.pension.enabled ? "checked" : ""} />
        Include a work pension
      </label>
      ${numberField("Work pension per year", "income.pension.amount", state.income.pension.amount, { min: 0, max: 200000, step: 500 }, "pensionAmount", false, !state.income.pension.enabled, true)}
      ${numberField("Pension start age", "income.pension.startAge", state.income.pension.startAge, { min: 50, max: 75, step: 1 }, "pensionStartAge", false, !state.income.pension.enabled, true)}
    </div>
    <p class="field-microcopy">CPP and OAS are included by default because most Canadian retirement plans depend on them.</p>
  `;

  const assumptions = `
    <div class="form-grid compact-mobile-two">
      ${numberField("Balanced return", "assumptions.returns.balanced", toPct(state.assumptions.returns.balanced), { min: 1, max: 12, step: 0.1 }, "riskProfile", true)}
      ${numberField("RRSP share", "uiState.guided.rrspShare", Math.round((guided.rrspShare || 0.6) * 100), { min: 0, max: 100, step: 5 }, "rrsp", true, false, true)}
    </div>
    <p class="field-microcopy">What is a safe withdrawal rate? ${tooltipButton("riskProfile")} This planner uses a year-by-year projection rather than a single withdrawal rule.</p>
  `;

  return `
    <p class="what-affects"><strong>Simple-first editing:</strong> make one or two changes, then go back to Results to see the story update.</p>
    ${plannerCard("Your basics", "Age, timing, income, and savings for a fast first answer.", basics, true)}
    ${plannerCard("Lifestyle target", "Retirement income target in today's dollars, plus inflation.", lifestyle, true)}
    ${plannerCard("Canadian income sources", "CPP, OAS, and optional workplace pension.", income)}
    ${plannerCard("Advanced assumptions", "Only the highest-impact assumptions stay here in simple mode.", assumptions)}
    ${detailPlannerHint()}
  `;
}

/* FILE: src/ui/views/planEditorView.js */
function getPlanEditorConfigView(key, ctx) {
  const {
    state,
    provinces,
    numberField,
    selectField,
    tooltipButton,
    riskButton,
    toPct,
  } = ctx;

  if (key === "retirementAge") {
    return {
      title: "Edit Retirement Age",
      body: `
        ${numberField("Retirement age", "profile.retirementAge", state.profile.retirementAge, { min: 50, max: 75, step: 1 }, "retirementAge")}
      `,
    };
  }
  if (key === "desiredSpending") {
    return {
      title: "Edit Annual Spending",
      body: `
        ${numberField("Desired retirement spending (after-tax, today's dollars)", "profile.desiredSpending", state.profile.desiredSpending, { min: 12000, max: 350000, step: 500 }, "desiredSpending")}
      `,
    };
  }
  if (key === "inflation") {
    return {
      title: "Edit Inflation",
      body: `
        ${numberField("Inflation assumption", "assumptions.inflation", toPct(state.assumptions.inflation), { min: 0.5, max: 5, step: 0.1 }, "inflation", true)}
      `,
    };
  }
  if (key === "returnProfile") {
    return {
      title: "Edit Investment Return Profile",
      body: `
        <div class="label-row">Risk profile ${tooltipButton("riskProfile")}</div>
        <div class="inline-radio-row">
          ${riskButton("conservative")}
          ${riskButton("balanced")}
          ${riskButton("aggressive")}
        </div>
      `,
    };
  }
  if (key === "cpp") {
    return {
      title: "Edit CPP Income",
      body: `
        ${numberField("Estimated CPP at 65", "income.cpp.amountAt65", state.income.cpp.amountAt65, { min: 0, max: 35000, step: 100 }, "cppAmount65")}
        ${numberField("CPP start age", "income.cpp.startAge", state.income.cpp.startAge, { min: 60, max: 70, step: 1 }, "cppStartAge")}
      `,
    };
  }
  if (key === "oas") {
    return {
      title: "Edit OAS Income",
      body: `
        ${numberField("Estimated OAS at 65", "income.oas.amountAt65", state.income.oas.amountAt65, { min: 0, max: 12000, step: 100 }, "oasAmount65")}
        ${numberField("OAS start age", "income.oas.startAge", state.income.oas.startAge, { min: 65, max: 70, step: 1 }, "oasStartAge")}
      `,
    };
  }
  if (key === "pension") {
    return {
      title: "Edit Private Pension",
      body: `
        <label class="inline-check form-span-full">
          <input type="checkbox" data-bind="income.pension.enabled" ${state.income.pension.enabled ? "checked" : ""} />
          Enable private/workplace pension
        </label>
        ${numberField("Pension amount", "income.pension.amount", state.income.pension.amount, { min: 0, max: 200000, step: 500 }, "pensionAmount", false, !state.income.pension.enabled)}
        ${numberField("Pension start age", "income.pension.startAge", state.income.pension.startAge, { min: 50, max: 75, step: 1 }, "pensionStartAge", false, !state.income.pension.enabled)}
      `,
    };
  }
  if (key === "savings") {
    return {
      title: "Edit Savings Balance",
      body: `
        ${numberField("Current registered savings", "savings.currentTotal", state.savings.currentTotal, { min: 0, max: 5000000, step: 1000 }, "currentSavings")}
      `,
    };
  }
  if (key === "contribution") {
    return {
      title: "Edit Contributions",
      body: `
        ${numberField("Annual contribution", "savings.annualContribution", state.savings.annualContribution, { min: 0, max: 250000, step: 500 }, "annualContribution")}
        ${numberField("Contribution increase (%/yr)", "savings.contributionIncrease", toPct(state.savings.contributionIncrease), { min: 0, max: 15, step: 0.1 }, "contributionIncrease", true)}
      `,
    };
  }
  if (key === "province") {
    return {
      title: "Edit Province",
      body: `
        ${selectField("Province", "profile.province", Object.entries(provinces).map(([code, name]) => ({ value: code, label: name })), state.profile.province, "province")}
      `,
    };
  }
  return null;
}

/* FILE: src/ui/views/dashboardView.js */

function clonePlan(input) {
  if (typeof structuredClone === "function") return structuredClone(input);
  return JSON.parse(JSON.stringify(input));
}

function buildStrategyPreviewPlan(currentPlan, key) {
  const next = clonePlan(currentPlan);
  if (key === "delay-cpp") {
    next.income.cpp.startAge = 70;
    if (next.profile.hasSpouse && next.income.spouse?.enabled) next.income.spouse.cppStartAge = 70;
  }
  if (key === "meltdown") {
    next.strategy.meltdownEnabled = true;
    next.strategy.meltdownAmount = Math.max(10000, Number(next.strategy.meltdownAmount || 0));
    next.strategy.meltdownStartAge = Math.min(next.profile.retirementAge, 63);
    next.strategy.meltdownEndAge = Math.max(next.strategy.meltdownStartAge + 1, 70);
  }
  if (key === "spend-down-10") {
    next.profile.desiredSpending = Math.max(12000, Number(next.profile.desiredSpending || 0) * 0.9);
  }
  if (key === "retire-later-2") {
    next.profile.retirementAge = Math.min(75, Number(next.profile.retirementAge || 65) + 2);
  }
  if (key === "save-more-5000") {
    next.savings.annualContribution = Math.max(0, Number(next.savings.annualContribution || 0) + 5000);
  }
  return next;
}

function buildDashboardScenarioPreviewPlan(currentPlan, key) {
  const next = clonePlan(currentPlan);
  if (key === "inflation") {
    next.assumptions.inflation = Math.min(0.06, Number(next.assumptions.inflation || 0.02) + 0.015);
  }
  if (key === "returns") {
    next.assumptions.returns.conservative = Math.max(0.01, Number(next.assumptions.returns.conservative || 0) - 0.015);
    next.assumptions.returns.balanced = Math.max(0.015, Number(next.assumptions.returns.balanced || 0) - 0.015);
    next.assumptions.returns.aggressive = Math.max(0.02, Number(next.assumptions.returns.aggressive || 0) - 0.015);
  }
  if (key === "longevity") {
    next.profile.lifeExpectancy = Math.min(105, Number(next.profile.lifeExpectancy || 90) + 5);
  }
  return next;
}

function renderDashboardView(ctx) {
  const {
    state,
    ui,
    el,
    app,
    supportUrl,
    provinces,
    officialReferences,
    formatCurrency,
    formatPct,
    escapeHtml,
    clamp,
    tooltipButton,
    bindInlineTooltipTriggers,
    drawMainChart,
    drawCoverageChart,
    getBalanceLegendItems,
    getCoverageLegendItems,
    findRowByAge,
    findFirstRetirementRow,
    amountForDisplay,
    getOasRiskLevel,
    buildNextActions,
    dashboardModel,
  } = ctx;

  const model = dashboardModel || ui.lastModel;
  if (!model) return;
  const beginnerMode = state.uiState.experienceMode !== "advanced";
  const planStatus = buildPlanStatus(state, model);
  const planScore = planStatus.score;
  const dashboardScenario = state.uiState.dashboardScenario || "base";

  const retireRows = model.base.rows.filter((row) => row.age >= state.profile.retirementAge);
  const minAge = retireRows[0]?.age ?? state.profile.retirementAge;
  const maxAge = retireRows[retireRows.length - 1]?.age ?? state.profile.lifeExpectancy;
  if (ui.selectedAge == null) ui.selectedAge = minAge;
  ui.selectedAge = clamp(ui.selectedAge, minAge, maxAge);

  if (el.dashboardStressToggle) el.dashboardStressToggle.checked = ui.showStressBand;
  if (el.dollarModeToggle) el.dollarModeToggle.checked = ui.showTodaysDollars;
  if (el.coverageTableToggle) el.coverageTableToggle.checked = ui.showCoverageTable;
  if (el.yearScrubber) {
    el.yearScrubber.min = String(minAge);
    el.yearScrubber.max = String(maxAge);
    el.yearScrubber.value = String(ui.selectedAge);
  }
  if (el.yearScrubberValue) el.yearScrubberValue.textContent = `Age ${ui.selectedAge}`;

  renderKpiCards();
  renderCanIRetire();
  renderReadinessSummary();
  renderNarrativeHero();
  renderScenarioToolbar();
  renderQuickControls();
  renderProjectionInterpretation();
  renderAdvisorSection();
  renderIncomeStory();
  renderPlanQuality();
  renderComparisonModule();
  renderActionHub();
  renderCoverageMix();
  renderBalanceLegend();
  drawMainChart(model.base.rows, model.best.rows, model.worst.rows);
  renderCoverageLegend();
  drawCoverageChart(model, ui.selectedAge);
  renderCoverageTable();
  renderDashboardNarrative();
  renderCommonMistakes();
  renderMethodologySummary();
  renderDashboardReferences();
  renderDashboardStatus();
  syncDashboardDisclosure();

  if (el.nextActions) {
    const actions = buildNextActions(model);
    el.nextActions.innerHTML = actions.map((text) => `<li>${escapeHtml(text)}</li>`).join("");
  }

  if (el.basicsSummary) {
    el.basicsSummary.innerHTML = [
      `Province: <strong>${provinces[state.profile.province]}</strong>`,
      `Retire at <strong>${state.profile.retirementAge}</strong>, plan through age <strong>${state.profile.lifeExpectancy}</strong>.`,
      `Risk profile: <strong>${state.assumptions.riskProfile.charAt(0).toUpperCase()}${state.assumptions.riskProfile.slice(1)}</strong> (${formatPct(model.base.returnRate)} return).`,
      `Estimated first retirement year guaranteed income after tax: <strong>${formatCurrency(getReportMetrics(state, findRowByAge(model.base.rows, state.profile.retirementAge) || model.base.rows[0]).guaranteedNet)}</strong>.`,
      `Dashboard assumption: withdrawals are modeled as RRSP/RRIF taxable withdrawals for this explanatory view.`,
    ].join("<br>");
  }

  function renderDashboardStatus() {
    if (!el.dashboardStatus) return;
    const gap = model.kpis.firstYearGap;
    const depletionAge = model.kpis.depletionAge;
    let label = planStatus.status;
    let css = "status-pill borderline";

    if (gap >= 0 && !depletionAge && planScore.total >= 80) {
      label = planStatus.status;
      css = "status-pill on-track";
    } else if (gap < -10000 || depletionAge || planScore.total < 60) {
      label = planStatus.status;
      css = "status-pill off-track";
    }

    el.dashboardStatus.className = css;
    el.dashboardStatus.textContent = `Plan health: ${label}`;
  }

  function syncDashboardDisclosure() {
    const coverageDetails = document.getElementById("coverageDetails");
    const keyYearsDetails = document.getElementById("keyYearsDetails");
    const optimizationDetails = document.getElementById("optimizationDetails");
    const actionHubDetails = document.getElementById("actionHubDetails");
    const methodologyDetails = document.getElementById("methodologyDetails");
    const all = [coverageDetails, keyYearsDetails, optimizationDetails, actionHubDetails, methodologyDetails]
      .filter((item) => item instanceof HTMLDetailsElement);
    const openNow = all.find((item) => item.open);
    if (openNow) {
      all.forEach((item) => {
        item.open = item === openNow;
      });
      return;
    }
    if (coverageDetails) coverageDetails.open = true;
    if (keyYearsDetails) keyYearsDetails.open = false;
    if (optimizationDetails) optimizationDetails.open = false;
    if (actionHubDetails) actionHubDetails.open = false;
    if (methodologyDetails) methodologyDetails.open = false;
  }

  function renderDashboardReferences() {
    if (!el.dashboardReferences) return;
    el.dashboardReferences.innerHTML = officialReferences.map((item, index) => `
      ${index > 0 ? '<span class="reference-sep" aria-hidden="true">|</span>' : ""}
      <a class="footer-reference-link" href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">
        ${escapeHtml(item.label)}
      </a>
    `).join("");
  }

  function renderScenarioToolbar() {
    if (!el.scenarioToolbar) return;
    const scenarios = [
      { key: "base", label: "Base case" },
      { key: "inflation", label: "High inflation" },
      { key: "returns", label: "Lower returns" },
      { key: "longevity", label: "Longer life" },
      { key: "custom", label: "Custom stress test" },
    ];
    el.scenarioToolbar.innerHTML = `
      <details class="scenario-toolbar-inner">
        <summary>View options</summary>
        <div class="scenario-toolbar-panel">
          <div class="scenario-chip-grid">
            ${scenarios.map((item) => {
              const active = dashboardScenario === item.key;
              const tag = item.key === "custom" ? "button" : "button";
              return `<${tag} class="scenario-chip ${active ? "active" : ""}" type="button" data-action="set-dashboard-scenario" data-value="${item.key}" aria-pressed="${active ? "true" : "false"}">${item.label}</${tag}>`;
            }).join("")}
          </div>
          <label class="inline-check small-copy">
            <input id="dashboardStressToggle" type="checkbox" ${ui.showStressBand ? "checked" : ""} />
            Show stress band
          </label>
        </div>
      </details>
    `;
  }

  function renderReadinessSummary() {
    if (!el.readinessSummaryModule) return;
    const row = findRowByAge(model.base.rows, state.profile.retirementAge) || model.base.rows[0];
    if (!row) {
      el.readinessSummaryModule.innerHTML = "";
      return;
    }
    const report = getReportMetrics(state, row);
    const balanceAtRetirement = Math.max(0, Number(row.balanceStart || row.balance || 0));
    const moneyLasts = model.kpis.depletionAge ? `Age ${model.kpis.depletionAge}` : `Beyond ${state.profile.lifeExpectancy}`;
    const currentAge = app.currentYear - Number(state.profile.birthYear || app.currentYear);
    const yearsToRetirement = Math.max(0, state.profile.retirementAge - currentAge);
    const statusCard = report.netGap > 0
      ? { label: "Shortfall or surplus", value: `-${formatCurrency(report.netGap)}`, sub: "First retirement year after tax" }
      : { label: "Shortfall or surplus", value: `+${formatCurrency(report.surplus)}`, sub: "Covered before extra withdrawals" };
    const cards = [
      { label: "Retirement readiness", value: planStatus.status, sub: dashboardScenario === "base" ? "Base plan" : `Scenario: ${dashboardScenario.replace("-", " ")}` },
      { label: "Monthly retirement income", value: formatCurrency(report.totalSpendable / 12), sub: report.estimateTaxes ? "Estimated spendable income" : "Before tax estimate" },
      statusCard,
      { label: "Years until retirement", value: String(Math.max(0, yearsToRetirement)), sub: `Target age ${state.profile.retirementAge}` },
      { label: "Projected portfolio value", value: formatCurrency(balanceAtRetirement), sub: "At retirement" },
      { label: "Money lasts", value: moneyLasts, sub: model.kpis.depletionAge ? "Projection under current assumptions" : "No depletion in plan horizon" },
    ];
    el.readinessSummaryModule.innerHTML = `
      <section class="subsection readiness-summary">
        <div class="section-head-tight">
          <div>
            <h3>Top numbers</h3>
            <p class="muted">The simplest read of your current retirement plan.</p>
          </div>
        </div>
        <div class="readiness-grid">
          ${cards.map((card) => `
            <article class="readiness-card">
              <span class="label">${escapeHtml(card.label)}</span>
              <strong class="${escapeHtml(card.badgeClass || "")}">${escapeHtml(card.value)}</strong>
              <span class="sub">${escapeHtml(card.sub)}</span>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderQuickControls() {
    if (!el.quickControlsModule) return;
    el.quickControlsModule.innerHTML = `
      <details class="subsection dashboard-quick-controls">
        <summary>Adjust the plan inputs that matter most</summary>
        <div class="section-head-tight">
          <div>
            <h3>Most important inputs</h3>
            <p class="muted">Open this only when you want to change the plan. The result story above is the main read.</p>
          </div>
        </div>
        <div class="quick-control-list">
          <button class="plan-row-btn" type="button" data-nav-target="plan">
            <span class="plan-row-main"><strong>Retirement age</strong><span class="muted small-copy">Age ${state.profile.retirementAge}</span></span>
            <span class="plan-row-edit">Edit</span>
          </button>
          <button class="plan-row-btn" type="button" data-nav-target="plan">
            <span class="plan-row-main"><strong>Spending goal</strong><span class="muted small-copy">${formatCurrency(state.profile.desiredSpending)} today</span></span>
            <span class="plan-row-edit">Edit</span>
          </button>
          <button class="plan-row-btn" type="button" data-nav-target="plan">
            <span class="plan-row-main"><strong>Savings & contributions</strong><span class="muted small-copy">${formatCurrency(state.savings.currentTotal)} + ${formatCurrency(state.savings.annualContribution)}/yr</span></span>
            <span class="plan-row-edit">Edit</span>
          </button>
          <button class="plan-row-btn" type="button" data-nav-target="plan">
            <span class="plan-row-main"><strong>CPP / OAS / pension</strong><span class="muted small-copy">Income timing and amounts</span></span>
            <span class="plan-row-edit">Review</span>
          </button>
        </div>
        <div class="landing-actions">
          <button class="btn btn-secondary" type="button" data-nav-target="plan">Open plan inputs</button>
          <button class="btn btn-secondary" type="button" data-action="open-advanced">Advanced settings</button>
        </div>
        ${beginnerMode ? `
          <p class="small-copy muted quick-controls-note">New here? Start with Guided Setup or Learn the basics before changing advanced assumptions.</p>
          <div class="landing-actions">
            <button class="btn btn-secondary" type="button" data-nav-target="plan">Guided Setup</button>
            <button class="btn btn-secondary" type="button" data-action="open-learn">Learn the basics</button>
          </div>
        ` : ""}
      </details>
    `;
  }

  function renderProjectionInterpretation() {
    if (!el.projectionInterpretationModule) return;
    const row = findRowByAge(model.base.rows, state.profile.retirementAge) || model.base.rows[0];
    if (!row) {
      el.projectionInterpretationModule.innerHTML = "";
      return;
    }
    const report = getReportMetrics(state, row);
    const takeaways = [
      planStatus.summary,
      model.kpis.depletionAge
        ? `Savings are projected to run out around age ${model.kpis.depletionAge}.`
        : `Savings are projected to last through age ${state.profile.lifeExpectancy}.`,
      report.netGap > 0
        ? `You still need ${formatCurrency(report.netGap)} after tax from savings in the first retirement year.`
        : "Guaranteed income appears to cover the first retirement-year spending target.",
      report.dragAmount > 0
        ? `Taxes and clawback reduce spendable income by about ${formatCurrency(report.dragAmount)} in that first retirement year.`
        : "Tax drag is not the primary issue in the current first-year view.",
    ];
    el.projectionInterpretationModule.innerHTML = `
      <section class="subsection projection-interpretation">
        <h3>What to understand before changing anything</h3>
        <ul class="plain-list small-copy muted">
          ${takeaways.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <div class="landing-actions">
          <button class="btn btn-secondary" type="button" data-action="focus-results-section" data-value="coverageDetails">See taxes and gap</button>
          <button class="btn btn-secondary" type="button" data-action="focus-results-section" data-value="optimizationDetails">See next actions</button>
        </div>
      </section>
    `;
  }

  function renderNarrativeHero() {
    if (!el.resultsNarrativeModule) return;
    const row = findRowByAge(model.base.rows, state.profile.retirementAge) || model.base.rows[0];
    if (!row) {
      el.resultsNarrativeModule.innerHTML = "";
      return;
    }
    const report = getReportMetrics(state, row);
    const guaranteedPct = Math.round((report.coverageRatio || 0) * 100);
    const topMessage = report.netGap > 0
      ? `Your first retirement-year gap is about ${formatCurrency(report.netGap)} after tax.`
      : `Your first retirement year appears funded under the current assumptions.`;
    const pressurePoint = report.dragAmount > Math.max(5000, report.grossWithdrawal * 0.18)
      ? `Taxes and clawback reduce spendable income by about ${formatCurrency(report.dragAmount)} in that first retirement year.`
      : model.kpis.depletionAge
        ? `The main pressure point is longevity: savings are projected to run out around age ${model.kpis.depletionAge}.`
        : `Guaranteed income covers about ${guaranteedPct}% of your retirement target before extra savings withdrawals.`;
    const nextMove = planStatus.nextBestAction?.detail || "Compare one simple scenario before editing advanced settings.";
    el.resultsNarrativeModule.innerHTML = `
      <section class="subsection results-narrative-hero">
        <div class="section-head-tight">
          <div>
            <h3>What is driving this result</h3>
            <p class="muted">The plain-language version before you get into charts and deeper tools.</p>
          </div>
          <span class="coverage-badge ${report.netGap <= 0 && !model.kpis.depletionAge ? "coverage-good" : ""}">${planStatus.status}</span>
        </div>
        <div class="comparison-card-grid">
          <article class="comparison-card">
            <strong>Bottom line</strong>
            <p>${escapeHtml(topMessage)}</p>
          </article>
          <article class="comparison-card">
            <strong>Main pressure point</strong>
            <p>${escapeHtml(pressurePoint)}</p>
          </article>
          <article class="comparison-card">
            <strong>What would improve it</strong>
            <p>${escapeHtml(nextMove)}</p>
          </article>
        </div>
        <div class="preview-kpi">
          <div class="preview-kpi-item"><strong>Guaranteed income at retirement</strong><span>${guaranteedPct}%</span></div>
          <div class="preview-kpi-item"><strong>Net gap to cover</strong><span>${formatCurrency(report.netGap || 0)}</span></div>
          <div class="preview-kpi-item"><strong>Tax drag</strong><span>${formatCurrency(report.dragAmount || 0)}</span></div>
        </div>
        <div class="landing-actions">
          <button class="btn btn-primary" type="button" data-action="focus-results-section" data-value="incomeSection">See income story</button>
          <button class="btn btn-secondary" type="button" data-nav-target="scenarios">Compare scenarios</button>
          <button class="btn btn-secondary" type="button" data-nav-target="plan">Adjust plan inputs</button>
        </div>
      </section>
    `;
  }

  function renderAdvisorSection() {
    if (!el.advisorSectionModule) return;
    const retirementRow = findRowByAge(model.base.rows, state.profile.retirementAge) || model.base.rows[0];
    if (!retirementRow) {
      el.advisorSectionModule.innerHTML = "";
      return;
    }

    const report = getReportMetrics(state, retirementRow);
    const depletionAge = model.kpis.depletionAge;
    const suggestions = [];
    const buildPreviewMetrics = (key) => {
      const previewPlan = buildStrategyPreviewPlan(state, key);
      const previewModel = buildPlanModel(previewPlan);
      const summary = buildChangeSummary(model, previewModel, previewPlan);
      return {
        plan: previewPlan,
        model: previewModel,
        summary,
      };
    };
    const buildScenarioMetrics = (key) => {
      const previewPlan = buildDashboardScenarioPreviewPlan(state, key);
      const previewModel = buildPlanModel(previewPlan);
      return {
        plan: previewPlan,
        model: previewModel,
      };
    };
    const laterRetirementPreview = buildPreviewMetrics("retire-later-2");
    const lowerSpendingPreview = buildPreviewMetrics("spend-down-10");
    const cppPreview = buildPreviewMetrics("delay-cpp");
    const meltdownPreview = buildPreviewMetrics("meltdown");
    const saveMorePreview = buildPreviewMetrics("save-more-5000");
    const lowerReturnsPreview = buildScenarioMetrics("returns");
    const longerLifePreview = buildScenarioMetrics("longevity");
    const highInflationPreview = buildScenarioMetrics("inflation");

    const addSuggestion = (item) => {
      if (!item || suggestions.some((existing) => existing.key === item.key)) return;
      suggestions.push(item);
    };
    const currentCoveragePct = Math.round((report.coverageRatio || 0) * 100);

    if (depletionAge && depletionAge < state.profile.lifeExpectancy) {
      const laterYears = laterRetirementPreview.model.kpis.depletionAge && depletionAge
        ? laterRetirementPreview.model.kpis.depletionAge - depletionAge
        : null;
      addSuggestion({
        key: "retire-later-2",
        title: "Retire 2 years later",
        why: `Adds saving years and may push depletion later than age ${depletionAge}.`,
        impact: laterRetirementPreview.model.kpis.depletionAge
          ? `Preview: savings last to about age ${laterRetirementPreview.model.kpis.depletionAge}${laterYears != null ? ` (${laterYears >= 0 ? "+" : ""}${laterYears} years)` : ""}.`
          : `Preview: savings last through age ${laterRetirementPreview.plan.profile.lifeExpectancy}.`,
        button: { type: "action", action: "preview-strategy", value: "retire-later-2", label: "Preview impact" },
      });
      const previewCoveragePct = Math.round((((findRowByAge(lowerSpendingPreview.model.base.rows, lowerSpendingPreview.plan.profile.retirementAge) || retirementRow).guaranteedNet / Math.max(1, (findRowByAge(lowerSpendingPreview.model.base.rows, lowerSpendingPreview.plan.profile.retirementAge) || retirementRow).spending)) || 0) * 100);
      addSuggestion({
        key: "spend-down-10",
        title: "Reduce annual spending by 10%",
        why: "Lowers the withdrawal load in every retirement year.",
        impact: `Preview: early-retirement coverage improves from ${currentCoveragePct}% to about ${previewCoveragePct}%.`,
        button: { type: "action", action: "preview-strategy", value: "spend-down-10", label: "Try this" },
      });
    }

    if (report.netGap > 0) {
      addSuggestion({
        key: "returns",
        title: "Stress test lower returns",
        why: "Your plan still depends on savings in early retirement.",
        impact: lowerReturnsPreview.model.kpis.depletionAge
          ? `Preview: under lower returns, savings last to about age ${lowerReturnsPreview.model.kpis.depletionAge}.`
          : `Preview: under lower returns, savings still last through age ${lowerReturnsPreview.plan.profile.lifeExpectancy}.`,
        button: { type: "action", action: "set-dashboard-scenario", value: "returns", label: "View lower returns" },
      });
    }

    const currentAgeForSavings = app.currentYear - Number(state.profile.birthYear || app.currentYear);
    const savingYears = Math.max(0, state.profile.retirementAge - currentAgeForSavings);
    if (savingYears >= 3 && (depletionAge || report.netGap > 0)) {
      const currentRetirementRow = findRowByAge(model.base.rows, state.profile.retirementAge) || retirementRow;
      const previewRetirementRow = findRowByAge(saveMorePreview.model.base.rows, saveMorePreview.plan.profile.retirementAge) || currentRetirementRow;
      const saveMoreYears = saveMorePreview.model.kpis.depletionAge && depletionAge
        ? saveMorePreview.model.kpis.depletionAge - depletionAge
        : null;
      addSuggestion({
        key: "save-more-5000",
        title: "Save $5,000 more per year before retirement",
        why: "Extra pre-retirement saving increases your retirement balance before withdrawals begin.",
        impact: `Preview: retirement savings rise by ${formatCurrency(Math.max(0, (previewRetirementRow.balanceStart || previewRetirementRow.balance || 0) - (currentRetirementRow.balanceStart || currentRetirementRow.balance || 0)))}${saveMoreYears != null ? ` and may add ${saveMoreYears >= 0 ? "+" : ""}${saveMoreYears} years of runway.` : "."}`,
        button: { type: "action", action: "preview-strategy", value: "save-more-5000", label: "Preview impact" },
      });
    }

    const dragAmount = Number((retirementRow.taxOnWithdrawal || 0) + (retirementRow.oasClawback || 0));
    if (dragAmount > Math.max(10000, report.grossWithdrawal * 0.25)) {
      addSuggestion({
        key: "meltdown",
        title: "Review earlier RRSP withdrawals",
        why: "Large gross withdrawals suggest tax drag is eating into spendable income.",
        impact: meltdownPreview.summary?.bullets?.[2]
          ? meltdownPreview.summary.bullets[2].replace("Tax wedge at age 65:", "Preview tax wedge at age 65:")
          : "Earlier withdrawals may reduce later RRIF pressure and clawback exposure.",
        button: { type: "action", action: "preview-strategy", value: "meltdown", label: "Preview RRSP strategy" },
      });
    }

    if (retirementRow.oasClawback > 0 || planStatus.biggestRisk?.key === "clawback") {
      addSuggestion({
        key: "clawback-tool",
        title: "Review OAS clawback exposure",
        why: "Later taxable income is high enough to reduce OAS.",
        impact: "Use the focused clawback tool, then bring the learning back into the full plan.",
        button: { type: "href", href: "./oas-clawback-calculator.html", label: "Open OAS calculator" },
      });
    }

    if (state.income.cpp.startAge < 70 || planStatus.biggestRisk?.key === "tax-drag") {
      addSuggestion({
        key: "delay-cpp",
        title: "Compare CPP timing",
        why: "Benefit timing changes both guaranteed income and later tax pressure.",
        impact: (() => {
          const base71 = findRowByAge(model.base.rows, 71) || retirementRow;
          const preview71 = findRowByAge(cppPreview.model.base.rows, 71) || base71;
          const delta = Number((preview71.cppNet || 0) - (base71.cppNet || 0));
          return delta !== 0
            ? `Preview: net CPP at age 71 changes by about ${formatCurrency(delta)} a year.`
            : "Helpful when early coverage is tight or late-retirement taxes rise.";
        })(),
        button: { type: "action", action: "preview-strategy", value: "delay-cpp", label: "Preview later CPP" },
      });
    }

    if (report.netGap > 0 && ((state.income.cpp.startAge || 65) <= 65 || (state.income.oas.startAge || 65) <= 65)) {
      addSuggestion({
        key: "timing-review",
        title: "Review age-65 income timing",
        why: "Benefit start dates can change early-retirement taxes and withdrawal pressure.",
        impact: "Open the timing simulator to test how changing CPP or OAS start ages shifts guaranteed income and taxes.",
        button: { type: "action", action: "focus-timing-sim", label: "Jump to timing review" },
      });
    }

    if (!suggestions.length || planStatus.status === "On Track") {
      addSuggestion({
        key: "inflation",
        title: "Check a high-inflation case",
        why: "A strong base plan should still be pressure-tested.",
        impact: highInflationPreview.model.kpis.depletionAge
          ? `Preview: with higher inflation, savings last to about age ${highInflationPreview.model.kpis.depletionAge}.`
          : `Preview: with higher inflation, savings still last through age ${highInflationPreview.plan.profile.lifeExpectancy}.`,
        button: { type: "action", action: "set-dashboard-scenario", value: "inflation", label: "Stress test plan" },
      });
      addSuggestion({
        key: "longevity",
        title: "Test a longer-life scenario",
        why: "Longer retirement can quietly increase drawdown pressure even when the base case looks strong.",
        impact: longerLifePreview.model.kpis.depletionAge
          ? `Preview: with 5 extra planning years, savings last to about age ${longerLifePreview.model.kpis.depletionAge}.`
          : `Preview: even with a longer life, savings still cover the full planning horizon to age ${longerLifePreview.plan.profile.lifeExpectancy}.`,
        button: { type: "action", action: "set-dashboard-scenario", value: "longevity", label: "Test longer life" },
      });
      addSuggestion({
        key: "compare",
        title: "Compare another scenario",
        why: "Small changes to retirement age or spending often matter more than expected.",
        impact: "See tradeoffs side by side before changing your base plan.",
        button: { type: "action", action: "open-scenario-compare", label: "Compare scenarios" },
      });
    }

    el.advisorSectionModule.innerHTML = `
      <section class="subsection advisor-section">
        <div class="section-head-tight">
          <div>
            <h3>What should I do next?</h3>
            <p class="muted">These are the clearest ways to improve this result before opening the full detailed planner.</p>
          </div>
          <a class="small-copy muted advisor-support-note" href="${escapeHtml(supportUrl || "https://buymeacoffee.com/ashleysnl")}" target="_blank" rel="noopener noreferrer">☕ This free tool is community-supported.</a>
        </div>
        <div class="comparison-card-grid advisor-summary-grid">
          <article class="comparison-card advisor-summary-card">
            <strong>What is holding this back</strong>
            <p>${escapeHtml(planStatus.biggestRisk?.title || "No immediate critical issue stands out in the current base view.")}</p>
            <p class="small-copy muted">${escapeHtml(planStatus.biggestRisk?.detail || "Keep validating the plan under alternate scenarios.")}</p>
          </article>
          <article class="comparison-card advisor-summary-card">
            <strong>Best next move</strong>
            <p>${escapeHtml(planStatus.nextBestAction?.detail || "Use the suggestions below to test the next most important change.")}</p>
          </article>
        </div>
        <div class="advisor-card-grid">
          ${suggestions.slice(0, beginnerMode ? 3 : 5).map((item) => `
            <article class="comparison-card advisor-card">
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.why)}</p>
              <p class="small-copy muted">${escapeHtml(item.impact)}</p>
              <div class="landing-actions">
                ${item.button?.type === "href"
                  ? `<a class="btn btn-secondary" href="${escapeHtml(item.button.href)}">${escapeHtml(item.button.label)}</a>`
                  : `<button class="btn btn-secondary" type="button" data-action="${escapeHtml(item.button?.action || "open-scenario-compare")}" ${item.button?.value ? `data-value="${escapeHtml(item.button.value)}"` : ""}>${escapeHtml(item.button?.label || "Preview impact")}</button>`}
                ${ui.pendingStrategyKey === item.key ? `
                  <button class="btn btn-primary" type="button" data-action="apply-strategy-preview">Apply</button>
                  <button class="btn btn-secondary" type="button" data-action="undo-strategy-preview">Undo</button>
                ` : ""}
              </div>
            </article>
          `).join("")}
        </div>
        ${ui.pendingStrategyKey ? `
          <div class="subsection advisor-preview-band">
            <strong>Preview ready:</strong> ${escapeHtml(ui.pendingStrategyKey.replaceAll("-", " "))}
            <div class="landing-actions">
              <button class="btn btn-primary" type="button" data-action="apply-strategy-preview">Apply preview</button>
              <button class="btn btn-secondary" type="button" data-action="undo-strategy-preview">Undo preview</button>
            </div>
          </div>
        ` : ""}
        <p class="small-copy muted advisor-footer-note">If this helped you plan your retirement, support helps keep Canadian tax rules, RRIF logic, and planner updates current.</p>
      </section>
    `;
  }

  function renderCoverageMix() {
    if (!el.coverageMixModule) return;
    const row = findRowByAge(model.base.rows, ui.selectedAge || state.profile.retirementAge) || model.base.rows[0];
    if (!row) {
      el.coverageMixModule.innerHTML = "";
      return;
    }
    const pension = Number(row.pensionNet || 0) + Number(row.spousePensionNet || 0);
    const cpp = Number(row.cppNet || 0) + Number(row.spouseCppNet || 0);
    const oas = Number(row.oasNet || 0) + Number(row.spouseOasNet || 0);
    const savings = Number(row.netFromWithdrawal || 0);
    const taxImpact = Number(row.taxOnWithdrawal || 0) + Number(row.oasClawback || 0);
    const total = Math.max(1, pension + cpp + oas + savings + taxImpact);
    const segments = [
      { label: "Pension", value: pension, className: "pension" },
      { label: "CPP", value: cpp, className: "cpp" },
      { label: "OAS", value: oas, className: "oas" },
      { label: "Savings withdrawals", value: savings, className: "withdrawals" },
      { label: "Tax impact", value: taxImpact, className: "tax" },
    ].filter((item) => item.value > 0);
    el.coverageMixModule.innerHTML = `
      <section class="subsection coverage-mix">
        <div class="section-head-tight">
          <div>
            <h3>Income source mix</h3>
            <p class="muted">A quick read on what funds spending at age ${row.age}.</p>
          </div>
          <span class="coverage-badge">${formatCurrency(row.spending)} spending target</span>
        </div>
        <div class="coverage-mix-bar" role="img" aria-label="Income source mix for the selected age">
          ${segments.map((item) => `<span class="${escapeHtml(item.className)}" style="width:${((item.value / total) * 100).toFixed(1)}%"></span>`).join("")}
        </div>
        <ul class="coverage-mix-legend">
          ${segments.map((item) => `<li><span class="mix-dot ${escapeHtml(item.className)}"></span><strong>${escapeHtml(item.label)}:</strong> ${formatCurrency(item.value)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function renderKpiCards() {
    const row = findRowByAge(model.base.rows, ui.selectedAge || state.profile.retirementAge)
      || findRowByAge(model.base.rows, state.profile.retirementAge);
    if (!row) return;
    const report = getReportMetrics(state, row);
    const taxWedge = report.dragAmount;
    const netKeep = Math.max(0, report.netWithdrawal);
    const gross = Math.max(1, report.grossWithdrawal);
    const wedgePct = (taxWedge / gross) * 100;
    if (el.kpiContext) {
      el.kpiContext.textContent = `At a glance for age ${row.age}. Planning estimate only.`;
    }
    const kpis = [
      { label: "After-tax spending", value: formatCurrency(row.spending), sub: "Spending target", tip: "kpiSpendingTarget" },
      { label: "Guaranteed income", value: formatCurrency(report.guaranteedNet), sub: report.estimateTaxes ? "After estimated tax" : "Tax estimates off", tip: "kpiGuaranteedIncome" },
      { label: "Net gap from savings", value: report.netGap > 0 ? formatCurrency(report.netGap) : formatCurrency(0), sub: report.netGap > 0 ? "After-tax gap" : "No gap (surplus)", tip: "kpiNetGap" },
      {
        label: "Gross withdrawal needed",
        value: formatCurrency(report.grossWithdrawal),
        sub: report.estimateTaxes ? `Tax + clawback drag: ${formatCurrency(taxWedge)}` : "Tax estimates off",
        tip: "kpiGrossWithdrawal",
        mini: true,
      },
    ];
    if (el.kpiGrid) {
      el.kpiGrid.innerHTML = kpis.map((card) => `
        <article class="metric-card metric-card-primary">
          <span class="label">${escapeHtml(card.label)} ${tooltipButton(card.tip)}</span>
          <span class="value">${escapeHtml(card.value)}</span>
          <span class="sub">${escapeHtml(card.sub)}</span>
          ${card.mini ? `
            <div class="results-mini-bar kpi-mini-bar" role="img" aria-label="Gross withdrawal split into net and tax wedge">
              <span class="seg netdraw" style="width:${((netKeep / gross) * 100).toFixed(1)}%"></span>
              <span class="seg tax" style="width:${Math.max(0, wedgePct).toFixed(1)}%"></span>
            </div>
          ` : ""}
        </article>
      `).join("");
    }
  }

  function renderCanIRetire() {
    if (!el.canIRetireModule) return;
    const row = findRowByAge(model.base.rows, state.profile.retirementAge) || model.base.rows[0];
    if (!row) {
      el.canIRetireModule.innerHTML = "";
      return;
    }
    const report = getReportMetrics(state, row);
    const depletionAge = model.kpis.depletionAge;
    const earlierAge = state.profile.retirementAge > 52 ? state.profile.retirementAge - 1 : state.profile.retirementAge;
    const earlierRow = findRowByAge(model.base.rows, earlierAge) || row;
    let verdictClass = "verdict-moderate";
    let bigAnswer = "You are close, but this plan needs a review.";
    let explainer = planStatus.summary;
    if (report.netGap <= 0 && !depletionAge) {
      verdictClass = "verdict-strong";
      bigAnswer = "You are on track.";
    } else if (report.netGap > 0) {
      verdictClass = "verdict-attention";
      bigAnswer = `You may be short by ${formatCurrency(report.netGap)} per year.`;
    } else if (depletionAge) {
      verdictClass = "verdict-attention";
      bigAnswer = `Your plan may run short around age ${depletionAge}.`;
    }
    const earlierPossible = !depletionAge && earlierAge < state.profile.retirementAge && Number(earlierRow.netGap || 0) <= 0;
    const warning = depletionAge ? `<span class="insight-warning">Current projection runs out around age ${depletionAge}</span>` : "";
    el.canIRetireModule.innerHTML = `
      <section class="subsection verdict-hero ${verdictClass}">
        <div class="verdict-hero-main">
          <div>
            <p class="eyebrow muted">Big answer</p>
            <h3>${bigAnswer}</h3>
            <p class="verdict-copy">${explainer}</p>
            <p class="small-copy muted">Based on retirement age ${state.profile.retirementAge}, your current savings, and your current lifestyle target. ${warning}</p>
            ${earlierPossible ? `<p class="small-copy muted">Good news: this projection also suggests you may be able to retire earlier at age ${earlierAge}.</p>` : ""}
            <details>
              <summary>What is driving this result?</summary>
              <ul class="plain-list small-copy muted">
                ${planStatus.keyDrivers.map((driver) => `<li>${escapeHtml(driver)}</li>`).join("")}
              </ul>
            </details>
          </div>
          <div class="verdict-badge-block">
            <span class="verdict-score">${formatCurrency(report.totalSpendable / 12)}</span>
            <span class="coverage-badge ${report.netGap <= 0 && !depletionAge ? "coverage-good" : ""}">${planStatus.status}</span>
          </div>
        </div>
      </section>
    `;
  }

  function renderPlanQuality() {
    if (!el.planQualityModule) return;
    const row = findRowByAge(model.base.rows, state.profile.retirementAge) || model.base.rows[0];
    if (!row) {
      el.planQualityModule.innerHTML = "";
      return;
    }
    const report = getReportMetrics(state, row);
    const worst = model.scenarioRows.find((x) => x.label === "Worst");
    const stressLabel = !worst || !worst.depletionAge
      ? "High"
      : worst.depletionAge >= state.profile.lifeExpectancy
        ? "Moderate"
        : "Low";
    const taxEfficiencyLabel = row.effectiveTaxRate < 0.18 ? "Strong" : row.effectiveTaxRate < 0.26 ? "Moderate" : "Needs work";
    const replacement = row.spending > 0 ? report.totalSpendable / row.spending : 1;
    const changeSummary = state.uiState.lastChangeSummary || null;
    el.planQualityModule.innerHTML = `
      <section class="subsection plan-health-hero">
        <div class="section-head-tight">
          <div>
            <h3>Plan quality ${tooltipButton("retirementScore")}</h3>
            <p class="muted">One place for plan health, resilience, and any recent change summary.</p>
          </div>
          <div class="plan-health-total">
            <strong>${planScore.total}</strong>
            <span>${planScore.band}</span>
          </div>
        </div>
        <div class="preview-kpi">
          <div class="preview-kpi-item"><strong>Savings lasts to</strong><span>${model.kpis.depletionAge ? `Age ${model.kpis.depletionAge}` : `Beyond ${state.profile.lifeExpectancy}`}</span></div>
          <div class="preview-kpi-item"><strong>Income replacement</strong><span>${formatPct(replacement)}</span></div>
          <div class="preview-kpi-item"><strong>Tax efficiency</strong><span>${taxEfficiencyLabel}</span></div>
          <div class="preview-kpi-item"><strong>Stress resilience</strong><span>${stressLabel}</span></div>
          <div class="preview-kpi-item"><strong>Guaranteed-income coverage</strong><span>${formatPct(report.coverageRatio)}</span></div>
          ${!beginnerMode ? `<div class="preview-kpi-item"><strong>Score</strong><span>${planScore.total}/100</span></div>` : ""}
        </div>
        ${changeSummary ? `
          <details class="subsection" open>
            <summary>${escapeHtml(changeSummary.title)}</summary>
            <ul class="plain-list">
              ${(changeSummary.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
            </ul>
            <div class="landing-actions">
              <button class="btn btn-secondary" type="button" data-action="dismiss-last-change">Dismiss</button>
              <button class="btn btn-primary" type="button" data-action="undo-last-change">Undo</button>
            </div>
          </details>
        ` : ""}
        <details>
          <summary>How plan quality is judged ${tooltipButton("coverageScoreWeights")}</summary>
          <ul class="plain-list small-copy muted">
            <li>Coverage ratio checks how much of early retirement spending is covered before drawing on savings.</li>
            <li>Longevity checks whether projected savings last to or past life expectancy.</li>
            <li>Tax efficiency reflects average withdrawal drag under the current assumptions.</li>
            <li>Clawback and RRIF shock penalties increase when forced taxable income rises later.</li>
          </ul>
        </details>
      </section>
    `;
    bindInlineTooltipTriggers(el.planQualityModule);
  }

  function renderIncomeStory() {
    if (!el.incomeStoryModule) return;
    const retireRow = findRowByAge(model.base.rows, state.profile.retirementAge) || model.base.rows[0];
    const selectedRow = findRowByAge(model.base.rows, ui.selectedAge || state.profile.retirementAge) || retireRow;
    if (!retireRow || !selectedRow) {
      el.incomeStoryModule.innerHTML = "";
      return;
    }
    const peakTax = findPeakTaxYear(state, model);
    const replacement = retireRow.spending > 0 ? (retireRow.guaranteedNet + retireRow.netFromWithdrawal) / retireRow.spending : 1;
    const insights = [
      {
        title: "Guaranteed income floor",
        body: `Guaranteed income covers ${Math.round((retireRow.spending > 0 ? retireRow.guaranteedNet / retireRow.spending : 1) * 100)}% of spending at retirement, so the rest must come from savings withdrawals.`,
      },
      {
        title: "Longevity outlook",
        body: model.kpis.depletionAge
          ? `Portfolio depletion is projected around age ${model.kpis.depletionAge}, which is ${Math.max(0, state.profile.lifeExpectancy - model.kpis.depletionAge)} years before your planning horizon ends.`
          : `Savings are projected to last through age ${state.profile.lifeExpectancy} under the current assumptions.`,
      },
      {
        title: "Tax pressure point",
        body: peakTax
          ? `Peak tax year is age ${peakTax.age}, driven mainly by ${peakTax.cause.toLowerCase()}.`
          : "No clear peak-tax pressure point was detected in the current projection.",
      },
      {
        title: "Income replacement",
        body: `At retirement start, total spendable income reaches about ${formatPct(replacement)} of your target spending under the base scenario.`,
      },
    ];
    if (state.strategy.oasClawbackModeling && selectedRow.oasClawback > 0) {
      insights.push({
        title: "Clawback exposure",
        body: `OAS clawback begins by age ${selectedRow.age} in the selected view, reducing spendable income by ${formatCurrency(selectedRow.oasClawback)} that year.`,
      });
    } else if (state.income.cpp.startAge < 70) {
      insights.push({
        title: "Timing still matters",
        body: "CPP and OAS start ages are still adjustable. Testing later starts may raise guaranteed income in later retirement years.",
      });
    }
    const row = selectedRow;
    const segments = [
      { label: "Pension", value: row.pensionNet + row.spousePensionNet, color: "#f59e0b" },
      { label: "CPP", value: row.cppNet + row.spouseCppNet, color: "#16a34a" },
      { label: "OAS", value: row.oasNet + row.spouseOasNet, color: "#0ea5a8" },
      { label: "Savings withdrawals", value: row.netFromWithdrawal, color: "#0f6abf" },
    ].filter((item) => item.value > 0);
    const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0));
    const largest = segments.slice().sort((a, b) => b.value - a.value)[0];
    const withdrawalShare = total > 0 ? row.netFromWithdrawal / total : 0;
    let sentence = "Your retirement income is spread across several sources.";
    if (withdrawalShare > 0.45) {
      sentence = "Your plan depends heavily on portfolio withdrawals, which makes market returns and tax drag more important.";
    } else if (largest?.label === "Pension") {
      sentence = "Most of your retirement income comes from pension income, with savings acting as a top-up.";
    } else if ((row.cppNet + row.oasNet + row.spouseCppNet + row.spouseOasNet) / total > 0.35) {
      sentence = "Government benefits provide a meaningful base layer, reducing the amount you need from savings.";
    }
    el.incomeStoryModule.innerHTML = `
      <section class="subsection">
        <div class="section-head-tight">
          <div>
            <h3>Income story</h3>
            <p class="muted">One combined view of what is driving the plan at retirement and at age ${row.age}.</p>
          </div>
          <span class="coverage-badge ${withdrawalShare < 0.4 ? "coverage-good" : ""}">${formatPct(total > 0 ? (total - row.netFromWithdrawal) / total : 0)} guaranteed</span>
        </div>
        <div class="preview-kpi">
          <div class="preview-kpi-item"><strong>Selected age</strong><span>Age ${row.age}</span></div>
          <div class="preview-kpi-item"><strong>Income replacement</strong><span>${formatPct(replacement)}</span></div>
          <div class="preview-kpi-item"><strong>Net gap</strong><span>${formatCurrency(row.netGap || 0)}</span></div>
          <div class="preview-kpi-item"><strong>Gross withdrawal</strong><span>${formatCurrency(row.withdrawal || 0)}</span></div>
        </div>
        <div class="income-stack-bar" role="img" aria-label="Retirement income stack by source">
          ${segments.map((item) => `<span style="width:${((item.value / total) * 100).toFixed(1)}%; background:${item.color};"></span>`).join("")}
        </div>
        <ul class="source-legend">
          ${segments.map((item) => `
            <li>
              <span class="source-dot" style="background:${item.color};"></span>
              <strong>${escapeHtml(item.label)}:</strong> ${formatCurrency(item.value)}
            </li>
          `).join("")}
        </ul>
        <p class="small-copy muted">${escapeHtml(sentence)} Main dashboard view assumes the savings gap is funded from taxable registered withdrawals.</p>
        <div class="insight-card-grid">
          ${insights.slice(0, beginnerMode ? 3 : 4).map((item) => `
            <article class="insight-card">
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.body)}</p>
            </article>
          `).join("")}
        </div>
        <div class="landing-actions">
          <button class="btn btn-secondary" type="button" data-action="focus-results-section" data-value="coverageDetails">Understand taxes and gap</button>
          <button class="btn btn-secondary" type="button" data-action="focus-results-section" data-value="keyYearsDetails">See timeline by age</button>
        </div>
      </section>
    `;
    bindInlineTooltipTriggers(el.incomeStoryModule);
  }

  function renderComparisonModule() {
    if (!el.plannerComparisonModule) return;
    el.plannerComparisonModule.innerHTML = `
      <section class="subsection">
        <div class="section-head-tight">
          <div>
            <h3>Plan comparison</h3>
            <p class="muted">Compare this plan with alternate retirement dates, spending levels, or benefit timing without losing your current assumptions.</p>
          </div>
        </div>
        <div class="comparison-card-grid">
          <article class="comparison-card">
            <strong>Save current as a scenario</strong>
            <p class="small-copy muted">Create a baseline before testing alternatives.</p>
            <button class="btn btn-secondary" type="button" data-action="save-current-scenario">Save scenario</button>
          </article>
          <article class="comparison-card">
            <strong>Open comparison mode</strong>
            <p class="small-copy muted">View saved scenarios side by side using the most important metrics.</p>
            <button class="btn btn-secondary" type="button" data-action="open-scenario-compare">Compare scenarios</button>
          </article>
          <article class="comparison-card">
            <strong>Quick strategy preview</strong>
            <p class="small-copy muted">Use strategy suggestions below for delay CPP, earlier RRSP withdrawals, or lower spending tests.</p>
            <button class="btn btn-secondary" type="button" data-action="focus-strategies">Go to strategy suggestions</button>
          </article>
        </div>
      </section>
    `;
  }

  function renderActionHub() {
    if (!el.dashboardActionHub) return;
    el.dashboardActionHub.innerHTML = `
      <div class="action-hub-grid">
        <article class="comparison-card">
          <strong>Share</strong>
          <p class="small-copy muted">Copy a link or plain-English summary for a spouse, client, or advisor.</p>
          <div class="landing-actions">
            <button class="btn btn-secondary" type="button" data-action="copy-share-link">Copy share link</button>
            <button class="btn btn-secondary" type="button" data-action="copy-minimal-link">Copy minimal link</button>
            <button class="btn btn-secondary" type="button" data-action="copy-plan-summary">Copy summary</button>
          </div>
        </article>
        <article class="comparison-card">
          <strong>Compare</strong>
          <p class="small-copy muted">Save this plan as a scenario or open side-by-side comparison.</p>
          <div class="landing-actions">
            <button class="btn btn-secondary" type="button" data-action="save-current-scenario">Save scenario</button>
            <button class="btn btn-secondary" type="button" data-action="open-scenario-compare">Compare scenarios</button>
            <button class="btn btn-secondary" type="button" data-action="copy-scenario-share">Share this scenario</button>
          </div>
        </article>
        <article class="comparison-card">
          <strong>Export</strong>
          <p class="small-copy muted">Download a standard summary or print the client-ready report.</p>
          <div class="landing-actions">
            <button class="btn btn-secondary" type="button" data-action="download-summary">Download retirement summary</button>
            <button class="btn btn-secondary" type="button" data-action="print-client-summary">Print client summary</button>
            <button class="btn btn-secondary" type="button" data-action="copy-scenario-summary">Copy scenario summary</button>
          </div>
        </article>
        <article class="comparison-card support-action-card">
          <strong>Support this free tool</strong>
          <p class="small-copy muted">If this planner saved you time or helped clarify retirement decisions, consider supporting future updates.</p>
          <div class="landing-actions">
            <a class="btn btn-secondary" href="https://buymeacoffee.com/ashleysnl" target="_blank" rel="noopener noreferrer">☕ Support</a>
          </div>
        </article>
      </div>
    `;
  }

  function renderCoverageTable() {
    if (!el.coverageTableWrap || !el.coverageTable) return;
    const rows = model.base.rows.filter((row) => row.age >= state.profile.retirementAge);
    el.coverageTableWrap.hidden = !ui.showCoverageTable;
    if (!ui.showCoverageTable) return;
    el.coverageTable.innerHTML = `
      <thead>
        <tr>
          <th>Age</th>
          <th>Pension</th>
          <th>CPP</th>
          <th>OAS</th>
          <th>Net from savings</th>
          <th>Tax wedge</th>
          <th>Spending target</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r) => `
          <tr>
            <td>${r.age}</td>
            <td>${formatCurrency(amountForDisplay(r, r.pensionNet + r.spousePensionNet))}</td>
            <td>${formatCurrency(amountForDisplay(r, r.cppNet + r.spouseCppNet))}</td>
            <td>${formatCurrency(amountForDisplay(r, r.oasNet + r.spouseOasNet))}</td>
            <td>${formatCurrency(amountForDisplay(r, r.netFromWithdrawal))}</td>
            <td>${formatCurrency(amountForDisplay(r, r.taxOnWithdrawal + r.oasClawback))}</td>
            <td>${formatCurrency(amountForDisplay(r, r.spending))}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
  }

  function renderDashboardNarrative() {
    const current = findRowByAge(model.base.rows, ui.selectedAge || state.profile.retirementAge);
    if (!current) return;
    if (el.walkthroughHeading) {
      el.walkthroughHeading.textContent = `Explain for Age ${current.age}`;
    }
    const coveragePct = current.spending > 0 ? (current.guaranteedNet / current.spending) * 100 : 0;
    const rrifThresholdAge = state.strategy.rrifConversionAge || 71;
    const showRrifExplanation = state.strategy.applyRrifMinimums && current.age >= rrifThresholdAge && current.rrifMinimum > 0;
    if (el.walkthroughStrip) {
      el.walkthroughStrip.innerHTML = `
        <article class="walk-step">
          <h4>Step 1 ${tooltipButton("kpiGuaranteedIncome")}</h4>
          <p>Guaranteed income covers <strong>${coveragePct.toFixed(0)}%</strong> of your spending target.</p>
        </article>
        <article class="walk-step">
          <h4>Step 2 ${tooltipButton("kpiNetGap")}</h4>
          <p>Remaining <strong>after-tax gap</strong> is <strong>${formatCurrency(current.netGap)}</strong>.</p>
        </article>
        <article class="walk-step">
          <h4>Step 3 ${tooltipButton("kpiGrossWithdrawal")}</h4>
          <p>You withdraw <strong>${formatCurrency(current.withdrawal)}</strong> gross; tax drag is <strong>${formatCurrency(current.taxOnWithdrawal)}</strong>.</p>
        </article>
        ${showRrifExplanation ? `
          <article class="walk-step">
            <h4>RRIF Rule ${tooltipButton("forcedRrifDrawdown")}</h4>
            <p>From age <strong>${rrifThresholdAge}</strong>, minimum RRIF withdrawals can be required. This can raise income and taxes even when your spending need is lower.</p>
          </article>
        ` : ""}
      `;
      bindInlineTooltipTriggers(el.walkthroughStrip);
    }
    renderYearCards();
  }

  function renderCommonMistakes() {
    if (!el.commonMistakesModule) return;
    el.commonMistakesModule.innerHTML = `
      <details class="subsection">
        <summary>Common retirement planning mistakes</summary>
        <ul class="plain-list small-copy muted">
          <li>Underestimating inflation and assuming today’s spending will buy the same lifestyle later.</li>
          <li>Comparing after-tax spending needs with before-tax income sources.</li>
          <li>Ignoring tax on RRSP/RRIF withdrawals and the extra gross withdrawal needed to net spending.</li>
          <li>Taking CPP or OAS timing for granted without checking the tradeoff.</li>
          <li>Forgetting that RRIF minimums can raise taxable income even if spending drops.</li>
        </ul>
      </details>
    `;
  }

  function renderMethodologySummary() {
    if (!el.methodologySummaryModule) return;
    el.methodologySummaryModule.innerHTML = `
      <details class="subsection">
        <summary>How this calculator works</summary>
        <div class="methodology-summary-grid small-copy muted">
          <div>
            <strong>Inflation</strong>
            <p>Your spending goal starts in today’s dollars and is inflated into future-year nominal amounts.</p>
          </div>
          <div>
            <strong>Taxes</strong>
            <p>When enabled, the planner estimates federal + provincial tax and OAS clawback using your selected province.</p>
          </div>
          <div>
            <strong>Withdrawals</strong>
            <p>Guaranteed income is applied first, then savings withdrawals fill the remaining after-tax gap.</p>
          </div>
          <div>
            <strong>Benefits</strong>
            <p>CPP and OAS start at their configured ages. RRIF minimum rules can force later withdrawals when enabled.</p>
          </div>
        </div>
        <p class="small-copy"><button class="text-link-btn" type="button" data-nav-target="tools">Read full methodology & sources</button></p>
      </details>
    `;
  }

  function renderYearCards() {
    if (!el.yearCards) return;
    const firstRetRow = findFirstRetirementRow(model.base.rows, state.profile.retirementAge);
    const checkpoints = [
      { label: `First retirement year (Age ${firstRetRow?.age ?? state.profile.retirementAge})`, row: firstRetRow },
      { label: "Age 65", row: findRowByAge(model.base.rows, 65) },
      { label: "RRIF conversion year (Age 71)", row: findRowByAge(model.base.rows, 71) },
    ];

    el.yearCards.innerHTML = checkpoints.map((point) => {
      if (!point.row) return `<article class="withdrawal-card"><h4>${escapeHtml(point.label)}</h4><p class="muted small-copy">Not in projection horizon.</p></article>`;
      const row = point.row;
      const parts = [
        { label: "Guaranteed income", value: row.guaranteedNet, color: "#16a34a" },
        { label: "Net withdrawal", value: row.netFromWithdrawal, color: "#0f6abf" },
        { label: "Tax wedge", value: row.taxOnWithdrawal + row.oasClawback, color: "#d9485f" },
      ];
      const total = Math.max(1, parts.reduce((sum, p) => sum + p.value, 0));
      return `
        <article class="withdrawal-card">
          <h4>${escapeHtml(point.label)}</h4>
          <div class="withdrawal-bar">
            ${parts.map((p) => `<span title="${escapeHtml(p.label)} ${formatCurrency(p.value)}" style="width:${((p.value / total) * 100).toFixed(1)}%; background:${p.color};"></span>`).join("")}
          </div>
          <div class="withdrawal-metrics">
            <div><strong>Spending target (after-tax) ${tooltipButton("kpiSpendingTarget")}</strong><span>${formatCurrency(row.spending)}</span></div>
            <div><strong>Guaranteed income after estimated tax ${tooltipButton("kpiGuaranteedIncome")}</strong><span>${formatCurrency(row.guaranteedNet)}</span></div>
            <div><strong>Net gap funded by savings ${tooltipButton("kpiNetGap")}</strong><span>${formatCurrency(row.netGap)}</span></div>
            <div><strong>Gross withdrawal required ${tooltipButton("kpiGrossWithdrawal")}</strong><span>${formatCurrency(row.withdrawal)}</span></div>
            <div><strong>Tax on withdrawal ${tooltipButton("learnTaxGrossUp")}</strong><span>${formatCurrency(row.taxOnWithdrawal)}</span></div>
            <div><strong>OAS clawback ${tooltipButton("oasClawback")}</strong><span>${formatCurrency(row.oasClawback)}</span></div>
            <div><strong>RRIF minimum (if applicable) ${tooltipButton("rrifMinimums")}</strong><span>${formatCurrency(row.rrifMinimum)}</span></div>
            <div><strong>Effective tax rate ${tooltipButton("learnTaxGrossUp")}</strong><span>${formatPct(row.effectiveTaxRate)}</span></div>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderBalanceLegend() {
    if (!el.chartLegend) return;
    const items = getBalanceLegendItems(ui.showStressBand);
    el.chartLegend.innerHTML = items.map((item) => `
      <span class="legend-item">
        <span class="legend-chip" style="background:${item[1]};"></span>${item[0]}
      </span>
    `).join("");
  }

  function renderCoverageLegend() {
    if (!el.coverageLegend) return;
    const items = getCoverageLegendItems();
    el.coverageLegend.innerHTML = items.map((item) => `
      <span class="legend-item"><span class="legend-chip" style="background:${item[1]};"></span>${item[0]}</span>
    `).join("");
  }
}

/* FILE: src/ui/views/advancedView.js */
function renderAdvancedView(ctx) {
  const {
    state,
    ui,
    el,
    app,
    provinces,
    rrifMinWithdrawal,
    officialReferences,
    formatCurrency,
    formatPct,
    escapeHtml,
    numberField,
    selectField,
    tooltipButton,
    strategyButton,
    accordionSection,
    renderCapitalInjectRows,
    toPct,
    applyAdvancedSearchFilter,
  } = ctx;

  const model = ui.lastModel;
  if (!model || !el.advancedAccordion) return;
  const locked = !state.uiState.unlocked.advanced;
  if (locked) {
    el.advancedAccordion.innerHTML = `<div class="subsection"><strong>Locked</strong><p class="muted">Complete Guided Setup step 5 to unlock advanced inputs.</p></div>`;
    return;
  }

  if (!state.uiState.showAdvancedControls) {
    el.advancedAccordion.innerHTML = `
      <div class="subsection">
        <p class="muted">Advanced settings are hidden by default to keep planning simple.</p>
        <label class="inline-check">
          <input type="checkbox" data-bind="uiState.showAdvancedControls" ${state.uiState.showAdvancedControls ? "checked" : ""} />
          Show Advanced Controls
        </label>
      </div>
    `;
    return;
  }

  const strategyRows = model.strategyComparisons.map((row) => `
    <tr>
      <td>${escapeHtml(row.label)}</td>
      <td>${formatCurrency(row.totalTax)}</td>
      <td>${formatCurrency(row.totalClawback)}</td>
      <td>${row.depletionAge ? `Age ${row.depletionAge}` : "No depletion"}</td>
    </tr>
  `).join("");

  const selectedStrategy = state.strategy.withdrawal;
  const selected = model.strategyComparisons.find((x) => x.key === selectedStrategy) || model.strategyComparisons[0];

  el.advancedAccordion.innerHTML = `
    <div class="subsection">
      <label class="inline-check">
        <input type="checkbox" data-bind="uiState.showAdvancedControls" ${state.uiState.showAdvancedControls ? "checked" : ""} />
        Show Advanced Controls
      </label>
      <label>
        <span class="label-row">Search settings</span>
        <input type="search" data-bind="uiState.advancedSearch" data-live-input="1" value="${escapeHtml(state.uiState.advancedSearch || "")}" placeholder="Search tax, inflation, clawback, RRIF..." aria-label="Search advanced settings" />
      </label>
    </div>
    ${accordionSection("basics", "Basics", "Changes timeline, spending target, and core savings assumptions used across all models.", `
      <div class="form-grid compact-mobile-two">
        <div class="form-span-full">
          ${selectField("Province", "profile.province", Object.entries(provinces).map(([code, name]) => ({ value: code, label: name })), state.profile.province, "province")}
        </div>
        ${numberField("Year of birth", "profile.birthYear", state.profile.birthYear, { min: 1940, max: app.currentYear - 18, step: 1 }, "birthYear", false, false, true)}
        ${numberField("Retirement age", "profile.retirementAge", state.profile.retirementAge, { min: 50, max: 75, step: 1 }, "retirementAge", false, false, true)}
        ${numberField("Life expectancy", "profile.lifeExpectancy", state.profile.lifeExpectancy, { min: 75, max: 105, step: 1 }, "lifeExpectancy", false, false, true)}
        ${numberField("Desired spending (today's dollars)", "profile.desiredSpending", state.profile.desiredSpending, { min: 12000, max: 350000, step: 500 }, "desiredSpending")}
        ${numberField("Inflation", "assumptions.inflation", toPct(state.assumptions.inflation), { min: 0.5, max: 5, step: 0.1 }, "inflation", true, false, true)}
        ${numberField("Current total savings", "savings.currentTotal", state.savings.currentTotal, { min: 0, max: 5000000, step: 1000 }, "currentSavings")}
        ${numberField("Annual contribution", "savings.annualContribution", state.savings.annualContribution, { min: 0, max: 250000, step: 500 }, "annualContribution")}
      </div>
    `, true)}

    ${accordionSection("assumptions", "Assumptions", "Changes growth, spending escalation, scenario dispersion, and tax estimate framing.", `
      <div class="form-grid">
        ${numberField("Conservative return", "assumptions.returns.conservative", toPct(state.assumptions.returns.conservative), { min: 1, max: 10, step: 0.1 }, "riskProfile", true)}
        ${numberField("Balanced return", "assumptions.returns.balanced", toPct(state.assumptions.returns.balanced), { min: 1, max: 12, step: 0.1 }, "riskProfile", true)}
        ${numberField("Aggressive return", "assumptions.returns.aggressive", toPct(state.assumptions.returns.aggressive), { min: 1, max: 14, step: 0.1 }, "riskProfile", true)}
        ${numberField("Inflation", "assumptions.inflation", toPct(state.assumptions.inflation), { min: 0.5, max: 5, step: 0.1 }, "inflation", true)}
        ${numberField("Scenario spread", "assumptions.scenarioSpread", toPct(state.assumptions.scenarioSpread), { min: 0.5, max: 5, step: 0.1 }, "scenarioSpread", true)}
        ${numberField("Volatility", "assumptions.volatility", toPct(state.assumptions.volatility), { min: 3, max: 20, step: 0.5 }, "volatility", true)}
        ${numberField("Contribution increase (%/yr)", "savings.contributionIncrease", toPct(state.savings.contributionIncrease), { min: 0, max: 15, step: 0.1 }, "contributionIncrease", true)}
        <label class="form-span-full inline-check"><input type="checkbox" data-bind="assumptions.taxBracketInflation" ${state.assumptions.taxBracketInflation ? "checked" : ""} />Inflate tax brackets over time</label>
      </div>
    `)}

    ${accordionSection("income", "Income sources", "Changes non-portfolio income and timing dependencies.", `
      <div class="form-grid">
        <label class="inline-check form-span-full"><input type="checkbox" data-bind="income.pension.enabled" ${state.income.pension.enabled ? "checked" : ""} />Enable workplace pension</label>
        ${numberField("Pension amount", "income.pension.amount", state.income.pension.amount, { min: 0, max: 200000, step: 500 }, "pensionAmount")}
        ${numberField("Pension start age", "income.pension.startAge", state.income.pension.startAge, { min: 50, max: 75, step: 1 }, "pensionStartAge")}
        ${numberField("CPP at 65", "income.cpp.amountAt65", state.income.cpp.amountAt65, { min: 0, max: 35000, step: 100 }, "cppAmount65")}
        ${numberField("CPP start age", "income.cpp.startAge", state.income.cpp.startAge, { min: 60, max: 70, step: 1 }, "cppStartAge")}
        ${numberField("OAS at 65", "income.oas.amountAt65", state.income.oas.amountAt65, { min: 0, max: 12000, step: 100 }, "oasAmount65")}
        ${numberField("OAS start age", "income.oas.startAge", state.income.oas.startAge, { min: 65, max: 70, step: 1 }, "oasStartAge")}
        <label class="inline-check form-span-full"><input type="checkbox" data-bind="profile.hasSpouse" ${state.profile.hasSpouse ? "checked" : ""} />Enable spousal income</label>
        ${state.profile.hasSpouse ? `
          <label class="inline-check form-span-full"><input type="checkbox" data-bind="income.spouse.enabled" ${state.income.spouse.enabled ? "checked" : ""} />Include spouse private pension / CPP / OAS</label>
          ${numberField("Spouse private pension", "income.spouse.pensionAmount", state.income.spouse.pensionAmount, { min: 0, max: 200000, step: 500 }, "spousePensionAmount", false, !state.income.spouse.enabled)}
          ${numberField("Spouse pension start age", "income.spouse.pensionStartAge", state.income.spouse.pensionStartAge, { min: 50, max: 75, step: 1 }, "spousePensionStartAge", false, !state.income.spouse.enabled)}
          ${numberField("Spouse CPP at 65", "income.spouse.cppAmountAt65", state.income.spouse.cppAmountAt65, { min: 0, max: 35000, step: 100 }, "spouseCppAmount65", false, !state.income.spouse.enabled)}
          ${numberField("Spouse CPP start age", "income.spouse.cppStartAge", state.income.spouse.cppStartAge, { min: 60, max: 70, step: 1 }, "spouseCppStartAge", false, !state.income.spouse.enabled)}
          ${numberField("Spouse OAS at 65", "income.spouse.oasAmountAt65", state.income.spouse.oasAmountAt65, { min: 0, max: 12000, step: 100 }, "spouseOasAmount65", false, !state.income.spouse.enabled)}
          ${numberField("Spouse OAS start age", "income.spouse.oasStartAge", state.income.spouse.oasStartAge, { min: 65, max: 70, step: 1 }, "spouseOasStartAge", false, !state.income.spouse.enabled)}
        ` : ""}
      </div>
    `)}

    ${accordionSection("accounts", "Accounts", "Changes withdrawal taxation and longevity under strategy comparisons.", `
      <div class="form-grid">
        ${numberField("RRSP / RRIF", "accounts.rrsp", state.accounts.rrsp, { min: 0, max: 5000000, step: 1000 }, "rrsp")}
        ${numberField("TFSA", "accounts.tfsa", state.accounts.tfsa, { min: 0, max: 5000000, step: 1000 }, "tfsa")}
        ${numberField("Non-registered", "accounts.nonRegistered", state.accounts.nonRegistered, { min: 0, max: 5000000, step: 1000 }, "nonRegistered")}
        ${numberField("Cash", "accounts.cash", state.accounts.cash, { min: 0, max: 5000000, step: 500 }, "cash")}
      </div>
    `)}

    ${accordionSection("rrif", "RRIF rules", "Applies RRSP to RRIF conversion age and minimum withdrawal schedule effects.", `
      <div class="form-grid compact-mobile-two">
        ${numberField("RRIF conversion age", "strategy.rrifConversionAge", state.strategy.rrifConversionAge, { min: 65, max: 75, step: 1 }, "rrifConversionAge", false, false, true)}
        <label class="inline-check compact-field">
          <input type="checkbox" data-bind="strategy.applyRrifMinimums" ${state.strategy.applyRrifMinimums ? "checked" : ""} />
          Apply RRIF minimum schedule ${tooltipButton("rrifMinimums")}
        </label>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>Age</th><th>Minimum %</th></tr></thead>
          <tbody>
            ${Object.entries(rrifMinWithdrawal).map(([age, pct]) => `<tr><td>${age}</td><td>${(pct * 100).toFixed(2)}%</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    `)}

    ${accordionSection("capitalInjects", "Capital injects", "Adds one-time lump-sum proceeds (for example home downsizing) at chosen ages.", `
      <div class="subsection">
        <p class="muted small-copy">Each enabled row is a one-time injection added to plan assets at the selected age.</p>
        <button type="button" class="btn btn-secondary" data-action="add-capital-inject">Add lump-sum event</button>
      </div>
      <div class="form-grid">
        ${renderCapitalInjectRows()}
      </div>
    `)}

    ${accordionSection("withdrawal", "Withdrawal strategy", "Changes account draw order, taxes, and potential OAS clawback.", `
      <div class="form-span-full">
        <div class="inline-radio-row">
          ${strategyButton("tax-smart", "Tax-smart")}
          ${strategyButton("rrsp-first", "RRSP-first")}
          ${strategyButton("tfsa-first", "TFSA-first")}
        </div>
      </div>
      <label class="inline-check"><input type="checkbox" data-bind="strategy.oasClawbackModeling" ${state.strategy.oasClawbackModeling ? "checked" : ""} />Model OAS clawback</label>
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>Strategy</th><th>Estimated lifetime taxes ${tooltipButton("strategyLifetimeTaxes")}</th><th>Estimated lifetime OAS clawback ${tooltipButton("strategyLifetimeClawback")}</th><th>Depletion ${tooltipButton("depletionAge")}</th></tr></thead>
          <tbody>${strategyRows}</tbody>
        </table>
      </div>
      <p class="small-copy muted">These tax and clawback values are totals across the full retirement projection horizon (planning estimate).</p>
      <div class="subsection">
        <h3>Why this order?</h3>
        <ul class="plain-list">${selected.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
      </div>
    `)}

    ${accordionSection("tax", "Tax estimate", "Provides planning-level yearly tax estimates using federal + provincial brackets.", `
      <p class="muted">Planning estimate only. Uses province-aware bracket math and can escalate brackets with inflation.</p>
      <label class="inline-check"><input type="checkbox" data-bind="strategy.estimateTaxes" ${state.strategy.estimateTaxes !== false ? "checked" : ""} />Estimate taxes and withdrawal drag</label>
      <div class="preview-kpi">
        <div class="preview-kpi-item"><strong>Current effective tax rate</strong><span>${formatPct(model.tax.currentEffectiveRate)}</span></div>
        <div class="preview-kpi-item"><strong>First retirement-year effective tax rate</strong><span>${formatPct(model.tax.firstRetirementEffectiveRate)}</span></div>
      </div>
    `)}

    ${accordionSection("references", "Official references", "Links to current CRA and Canada.ca source material used for planning context.", `
      <p class="muted">These links are official government references. Rates and rules can change by tax year.</p>
      <ul class="plain-list resource-list">
        ${officialReferences.map((item) => `
          <li>
            <a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)}</a>
            <span class="muted small-copy"> (${escapeHtml(item.source)})</span>
          </li>
        `).join("")}
      </ul>
    `)}

    ${accordionSection("modules", "Educational unlock modules", "Adds concept-level guidance. Some modules are educational-only if not fully modeled.", `
      <div class="lesson-box">
        <h3>Coming soon feature</h3>
        <p class="muted">Educational unlock modules are being rebuilt for a more guided learning experience.</p>
        <p class="small-copy muted">Current planning calculations remain available in Dashboard, Guided Setup, and Advanced inputs.</p>
      </div>
    `)}
  `;
  applyAdvancedSearchFilter();
}

function renderStressView(ctx) {
  const {
    ui,
    el,
    formatCurrency,
    formatPct,
    formatSignedCurrency,
    tooltipButton,
    bindInlineTooltipTriggers,
  } = ctx;

  const model = ui.lastModel;
  if (!model || !el.scenarioSummary || !el.stressTable) return;

  const best = model.scenarioRows.find((r) => r.label === "Best") || model.scenarioRows[0];
  const base = model.scenarioRows.find((r) => r.label === "Base") || model.scenarioRows[1] || model.scenarioRows[0];
  const worst = model.scenarioRows.find((r) => r.label === "Worst") || model.scenarioRows[2] || model.scenarioRows[0];
  const quickRows = [best, base, worst].filter(Boolean);

  el.scenarioSummary.innerHTML = `
    <div class="section-head-tight">
      <div>
        <h3>Base plan vs stress cases ${tooltipButton("stressScenario")}</h3>
        <p class="muted">Use this section to see how retirement balance, first-year gap, and depletion risk move when assumptions improve or weaken.</p>
      </div>
      <div class="landing-actions no-print">
        <button class="btn btn-secondary" type="button" data-action="set-dashboard-scenario" data-value="base">Base plan</button>
        <button class="btn btn-secondary" type="button" data-action="set-dashboard-scenario" data-value="inflation">High inflation</button>
        <button class="btn btn-secondary" type="button" data-action="set-dashboard-scenario" data-value="returns">Lower returns</button>
      </div>
    </div>
    <div class="readiness-grid">
      ${quickRows.map((row) => `
        <article class="readiness-card">
          <span class="label">${row.label === "Worst" ? "Downside case" : `${row.label} case`}</span>
          <strong>${formatCurrency(row.balanceAtRetirement)}</strong>
          <span class="sub">Balance at retirement</span>
          <span class="sub">${row.depletionAge ? `Funds to age ${row.depletionAge}` : "No depletion in plan horizon"}</span>
        </article>
      `).join("")}
    </div>
  `;

  el.stressTable.innerHTML = `
    <thead>
      <tr>
        <th>Scenario ${tooltipButton("stressScenario")}</th>
        <th>Return ${tooltipButton("scenarioSpread")}</th>
        <th>Balance at retirement ${tooltipButton("kpiBalanceRetirement")}</th>
        <th>Depletion ${tooltipButton("depletionAge")}</th>
        <th>First-year gap or surplus ${tooltipButton("stressGapSurplus")}</th>
      </tr>
    </thead>
    <tbody>
      ${quickRows.map((row) => `
        <tr>
          <td>${row.label === "Worst" ? "Downside" : row.label}</td>
          <td>${formatPct(row.returnRate)}</td>
          <td>${formatCurrency(row.balanceAtRetirement)}</td>
          <td>${row.depletionAge ? `Age ${row.depletionAge}` : "No depletion"}</td>
          <td>${formatSignedCurrency(row.firstYearGap)}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
  bindInlineTooltipTriggers(el.scenarioSummary);
  bindInlineTooltipTriggers(el.stressTable);
}

const drawLearnLineChartUi = drawLearnLineChart;
const drawLearnMultiLineChartUi = drawLearnMultiLineChart;

const navFromHashUi = navFromHash;
const syncNavHashUi = syncNavHash;
const normalizeNavTargetUi = normalizeNavTarget;

const buildLearnCallouts = learnCallouts;
const calculatePhaseWeightedSpendingUi = calculatePhaseWeightedSpending;

const createDefaultLearningProgressSchema = createDefaultLearningProgress;
const createDefaultPlanSchema = createDefaultPlan;
const createDemoPlanSchema = createDemoPlan;
const normalizePlanSchema = normalizePlan;
const ensureValidStateSchema = ensureValidState;

const getOasRiskLevelHelper = getOasRiskLevel;
const amountForDisplayHelper = amountForDisplay;
const findRowByAgeHelper = findRowByAge;
const findFirstRetirementRowHelper = findFirstRetirementRow;
const buildNextActionsHelper = buildNextActions;

/* FILE: app.js (imports removed) */

globalThis.__RETIREMENT_APP_SCRIPT_EXECUTED = true;
globalThis.__RETIREMENT_APP_STAGE = "script-start";

const el = {
  heroHeader: document.getElementById("heroHeader"),
  landingPanel: document.getElementById("landingPanel"),
  appPanel: document.getElementById("appPanel"),
  startSimpleBtn: document.getElementById("startSimpleBtn"),
  landingDemoBtn: document.getElementById("landingDemoBtn"),
  landingImportBtn: document.getElementById("landingImportBtn"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  exportJsonBtnSecondary: document.getElementById("exportJsonBtnSecondary"),
  exportJsonBtnToolsTop: document.getElementById("exportJsonBtnToolsTop"),
  importJsonBtn: document.getElementById("importJsonBtn"),
  importJsonBtnSecondary: document.getElementById("importJsonBtnSecondary"),
  importJsonBtnToolsTop: document.getElementById("importJsonBtnToolsTop"),
  loadDemoBtn: document.getElementById("loadDemoBtn"),
  loadDemoBtnHome: document.getElementById("loadDemoBtnHome"),
  resetBtnHome: document.getElementById("resetBtnHome"),
  loadDemoBtnSecondary: document.getElementById("loadDemoBtnSecondary"),
  resetBtn: document.getElementById("resetBtn"),
  resetBtnSecondary: document.getElementById("resetBtnSecondary"),
  resetBtnToolsTop: document.getElementById("resetBtnToolsTop"),
  openGlossaryBtn: document.getElementById("openGlossaryBtn"),
  openGlossaryBtnToolsTop: document.getElementById("openGlossaryBtnToolsTop"),
  importJsonFile: document.getElementById("importJsonFile"),
  importJsonBtnHome: document.getElementById("importJsonBtnHome"),

  tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
  experienceModeButtons: Array.from(document.querySelectorAll("[data-action='set-experience-mode']")),
  navPanels: Array.from(document.querySelectorAll(".nav-panel")),

  canIRetireModule: document.getElementById("canIRetireModule"),
  readinessSummaryModule: document.getElementById("readinessSummaryModule"),
  planHealthHeroModule: document.getElementById("planHealthHeroModule"),
  advisorSectionModule: document.getElementById("advisorSectionModule"),
  keyInsightsModule: document.getElementById("keyInsightsModule"),
  incomeStoryModule: document.getElementById("incomeStoryModule"),
  planQualityModule: document.getElementById("planQualityModule"),
  quickControlsModule: document.getElementById("quickControlsModule"),
  projectionInterpretationModule: document.getElementById("projectionInterpretationModule"),
  incomeStackModule: document.getElementById("incomeStackModule"),
  plannerComparisonModule: document.getElementById("plannerComparisonModule"),
  dashboardActionHub: document.getElementById("dashboardActionHub"),
  scenarioToolbar: document.getElementById("scenarioToolbar"),
  kpiGrid: document.getElementById("kpiGrid"),
  kpiContext: document.getElementById("kpiContext"),
  resultsNarrativeModule: document.getElementById("resultsNarrativeModule"),
  retirementGapHeadline: document.getElementById("retirementGapHeadline"),
  retirementInsight: document.getElementById("retirementInsight"),
  incomeMapModule: document.getElementById("incomeMapModule"),
  whatChangedPanel: document.getElementById("whatChangedPanel"),
  presetBanner: document.getElementById("presetBanner"),
  resultsStrip: document.getElementById("resultsStrip"),
  taxWedgeMini: document.getElementById("taxWedgeMini"),
  coverageMixModule: document.getElementById("coverageMixModule"),
  coverageScoreModule: document.getElementById("coverageScoreModule"),
  timelineModule: document.getElementById("timelineModule"),
  keyRisksModule: document.getElementById("keyRisksModule"),
  strategySuggestionsModule: document.getElementById("strategySuggestionsModule"),
  peakTaxYearModule: document.getElementById("peakTaxYearModule"),
  timingSimulator: document.getElementById("timingSimulator"),
  meltdownSimulator: document.getElementById("meltdownSimulator"),
  commonMistakesModule: document.getElementById("commonMistakesModule"),
  methodologySummaryModule: document.getElementById("methodologySummaryModule"),
  sharedScenarioBanner: document.getElementById("sharedScenarioBanner"),
  supportMomentMount: document.getElementById("supportMomentMount"),
  clientSummaryModeMount: document.getElementById("clientSummaryModeMount"),
  plannerDashboardContent: document.getElementById("plannerDashboardContent"),
  clientSummaryToggleBtn: document.getElementById("clientSummaryToggleBtn"),
  exitClientSummaryBtn: document.getElementById("exitClientSummaryBtn"),
  mainChart: document.getElementById("mainChart"),
  balanceHover: document.getElementById("balanceHover"),
  chartLegend: document.getElementById("chartLegend"),
  dashboardStressToggle: document.getElementById("dashboardStressToggle"),
  dollarModeToggle: document.getElementById("dollarModeToggle"),
  yearScrubber: document.getElementById("yearScrubber"),
  yearScrubberValue: document.getElementById("yearScrubberValue"),
  coverageChart: document.getElementById("coverageChart"),
  coverageLegend: document.getElementById("coverageLegend"),
  coverageHover: document.getElementById("coverageHover"),
  incomeMapHover: null,
  coverageTableToggle: document.getElementById("coverageTableToggle"),
  coverageTableWrap: document.getElementById("coverageTableWrap"),
  coverageTable: document.getElementById("coverageTable"),
  walkthroughStrip: document.getElementById("walkthroughStrip"),
  walkthroughHeading: document.getElementById("walkthroughHeading"),
  yearCards: document.getElementById("yearCards"),
  dashboardReferences: document.getElementById("dashboardReferences"),
  planInputsPanel: document.getElementById("planInputsPanel"),
  learnPanel: document.getElementById("learnPanel"),
  nextActions: document.getElementById("nextActions"),
  basicsSummary: document.getElementById("basicsSummary"),
  dashboardStatus: document.getElementById("dashboardStatus"),
  resultLiveSummary: document.getElementById("resultLiveSummary"),
  retirementScoreCard: document.getElementById("retirementScoreCard"),
  copyShareLinkBtn: document.getElementById("copyShareLinkBtn"),
  copyMinimalLinkBtn: document.getElementById("copyMinimalLinkBtn"),
  copySummaryBtn: document.getElementById("copySummaryBtn"),
  copyScenarioShareBtn: document.getElementById("copyScenarioShareBtn"),
  copyScenarioSummaryBtn: document.getElementById("copyScenarioSummaryBtn"),
  compareScenariosBtn: document.getElementById("compareScenariosBtn"),
  downloadSummaryBtn: document.getElementById("downloadSummaryBtn"),
  downloadClientSummaryBtn: document.getElementById("downloadClientSummaryBtn"),

  wizardProgressBar: document.getElementById("wizardProgressBar"),
  wizardStepLabel: document.getElementById("wizardStepLabel"),
  wizardBody: document.getElementById("wizardBody"),
  wizardBackBtn: document.getElementById("wizardBackBtn"),
  wizardNextBtn: document.getElementById("wizardNextBtn"),

  advancedAccordion: document.getElementById("advancedAccordion"),
  scenarioCompareToggle: document.getElementById("scenarioCompareToggle"),
  scenarioSummary: document.getElementById("scenarioSummary"),
  stressTable: document.getElementById("stressTable"),
  openGlossaryBtnTools: document.getElementById("openGlossaryBtnTools"),
  resetCacheBtnTools: document.getElementById("resetCacheBtnTools"),
  methodologyPanel: document.getElementById("methodologyPanel"),

  notesInput: document.getElementById("notesInput"),
  tooltipLayer: document.getElementById("tooltipLayer"),

  glossaryModal: document.getElementById("glossaryModal"),
  openGlossary: document.getElementById("openGlossaryBtn"),
  closeGlossaryBtn: document.getElementById("closeGlossaryBtn"),
  glossaryContent: document.getElementById("glossaryContent"),
  planEditorModal: document.getElementById("planEditorModal"),
  planEditorTitle: document.getElementById("planEditorTitle"),
  planEditorContent: document.getElementById("planEditorContent"),
  closePlanEditorBtn: document.getElementById("closePlanEditorBtn"),
  scenarioCompareModal: document.getElementById("scenarioCompareModal"),
  scenarioCompareContent: document.getElementById("scenarioCompareContent"),
  closeScenarioCompareBtn: document.getElementById("closeScenarioCompareBtn"),
  printSummaryModal: document.getElementById("printSummaryModal"),
  printSummaryContent: document.getElementById("printSummaryContent"),
  closePrintSummaryBtn: document.getElementById("closePrintSummaryBtn"),
  printSummaryBtn: document.getElementById("printSummaryBtn"),
  copySummaryTextBtn: document.getElementById("copySummaryTextBtn"),

  appToast: document.getElementById("appToast"),
  supportButton: document.getElementById("supportButton"),
  bottomTabs: document.getElementById("bottomTabs"),
};
globalThis.__RETIREMENT_APP_STAGE = "elements-bound";

const schemaDeps = {
  app: APP,
  provinces: PROVINCES,
  riskReturns: RISK_RETURNS,
  learnProgressItems: LEARN_PROGRESS_ITEMS,
};
globalThis.__RETIREMENT_APP_STAGE = "schema-ready";

let state = loadPlan();
globalThis.__RETIREMENT_APP_STAGE = "state-loaded";
let sharedScenarioPayload = null;
let presetPayload = null;
const sessionSupportShown = (() => {
  try {
    return sessionStorage.getItem("supportMomentShown") === "1";
  } catch {
    return false;
  }
})();
let ui = {
  activeNav: state.uiState.activeNav || "results",
  tooltipKey: "",
  toastTimer: null,
  lastModel: null,
  selectedAge: state.uiState.timelineSelectedAge ?? null,
  showStressBand: true,
  showTodaysDollars: false,
  showGrossWithdrawals: Boolean(state.uiState.showGrossWithdrawals ?? true),
  showCoverageTable: false,
  advancedOpen: {
    basics: false,
    assumptions: false,
    income: false,
    accounts: false,
    rrif: false,
    capitalInjects: false,
    withdrawal: false,
    tax: false,
    references: false,
    modules: false,
  },
  learnChartHover: {
    inflation: null,
    indexed: null,
    phases: null,
  },
  planEditorKey: "",
  isMobileLayout: false,
  eventsBound: false,
  activeSupportMoment: "",
  undoPlanSnapshot: null,
  pendingStrategyPreview: null,
  pendingStrategyKey: "",
  supportShownThisSession: sessionSupportShown,
  incomeMapHitZones: [],
  pendingPlanStartScroll: false,
};
globalThis.__RETIREMENT_APP_STAGE = "ui-created";

const WIZARD_STEP_COUNT = 5;
const LIFESTYLE_PRESETS = {
  basic: 0.55,
  comfortable: 0.7,
  higher: 0.85,
};

const { tooltipButton, numberField, learnNumberField, selectField } = createUiFieldHelpers({
  tooltips: TOOLTIPS,
  escapeHtml,
  formatNumber,
});
globalThis.__RETIREMENT_APP_STAGE = "helpers-ready";

init();

function init() {
  globalThis.__RETIREMENT_APP_STAGE = "init-enter";
  try {
    sharedScenarioPayload = parseSharedScenarioFromUrl(window.location);
    if (sharedScenarioPayload) state.uiState.lastSharedScenarioBannerDismissed = false;
    presetPayload = parsePresetFromUrl(window.location);
    state.uiState.lastChangeSummary = null;
    const hashNav = navFromHashUi(location.hash, normalizeNavTargetUi);
    if (hashNav) {
      ui.activeNav = hashNav;
      state.uiState.firstRun = false;
      state.uiState.activeNav = hashNav;
    }
    if (el.supportButton) el.supportButton.href = SUPPORT_URL;
    bindEvents();
    updateResponsiveLayout();
    renderAll();
    registerServiceWorker();
    globalThis.__RETIREMENT_APP_READY = true;
    globalThis.__RETIREMENT_APP_STAGE = "init-complete";
  } catch (error) {
    globalThis.__RETIREMENT_APP_STAGE = "init-recovering";
    console.error("App init failed. Attempting safe recovery.", error);
    try {
      state = createDefaultPlanLocal();
      ui.activeNav = "plan";
      if (el.supportButton) el.supportButton.href = SUPPORT_URL;
      bindEvents();
      updateResponsiveLayout();
      renderAll();
      registerServiceWorker();
      globalThis.__RETIREMENT_APP_READY = true;
      globalThis.__RETIREMENT_APP_STAGE = "init-recovered";
      toast("Recovered from startup issue by loading a clean local plan.");
    } catch (recoveryError) {
      globalThis.__RETIREMENT_APP_STAGE = "init-failed";
      console.error("App recovery failed.", recoveryError);
      globalThis.__RETIREMENT_APP_INIT_ERROR = String(recoveryError?.message || recoveryError || "Unknown initialization error");
      throw recoveryError;
    }
  }
}

function bindEvents() {
  if (ui.eventsBound) return;
  ui.eventsBound = true;

  el.startSimpleBtn?.addEventListener("click", () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    state.uiState.firstRun = false;
    state.uiState.hasStarted = true;
    state.uiState.activeNav = "plan";
    state.uiState.wizardStep = 1;
    state.uiState.experienceMode = "beginner";
    state.uiState.showAdvancedControls = false;
    ui.activeNav = "plan";
    ui.pendingPlanStartScroll = true;
    savePlan();
    renderAll();
    queueGuidedSetupScroll();
  });

  el.landingDemoBtn?.addEventListener("click", () => {
    state = createDemoPlanLocal();
    ui.activeNav = "results";
    savePlan();
    renderAll();
    toast("Demo plan loaded.");
  });

  el.loadDemoBtn?.addEventListener("click", () => {
    state = createDemoPlanLocal();
    ui.activeNav = "results";
    savePlan();
    renderAll();
    toast("Demo plan loaded.");
  });
  el.loadDemoBtnHome?.addEventListener("click", () => {
    state = createDemoPlanLocal();
    ui.activeNav = "results";
    savePlan();
    renderAll();
    toast("Demo plan loaded.");
  });
  el.resetBtnHome?.addEventListener("click", resetPlanToBlank);

  el.exportJsonBtn?.addEventListener("click", exportJson);
  el.exportJsonBtnSecondary?.addEventListener("click", exportJson);
  el.exportJsonBtnToolsTop?.addEventListener("click", exportJson);
  el.importJsonBtn?.addEventListener("click", openImportPicker);
  el.importJsonBtnSecondary?.addEventListener("click", openImportPicker);
  el.importJsonBtnToolsTop?.addEventListener("click", openImportPicker);
  el.importJsonBtnHome?.addEventListener("click", openImportPicker);
  el.landingImportBtn?.addEventListener("click", openImportPicker);
  el.importJsonFile?.addEventListener("change", importJsonFromFile);
  el.loadDemoBtnSecondary?.addEventListener("click", () => {
    state = createDemoPlanLocal();
    ui.activeNav = "results";
    savePlan();
    renderAll();
    toast("Demo plan loaded.");
  });
  el.resetBtnSecondary?.addEventListener("click", resetPlanToBlank);
  el.resetBtnToolsTop?.addEventListener("click", resetPlanToBlank);

  el.resetBtn?.addEventListener("click", resetPlanToBlank);

  el.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.navTarget || "results";
      setActiveNav(target);
    });
  });

  el.wizardBackBtn?.addEventListener("click", () => {
    state.uiState.wizardStep = Math.max(1, state.uiState.wizardStep - 1);
    savePlan();
    renderAll();
  });

  el.wizardNextBtn?.addEventListener("click", () => {
    if (state.uiState.wizardStep >= WIZARD_STEP_COUNT) {
      state.uiState.wizardStep = WIZARD_STEP_COUNT;
      state.uiState.unlocked.advanced = true;
      state.uiState.justCompletedWizard = true;
      state.uiState.activeNav = "results";
      ui.activeNav = "results";
      savePlan();
      renderAll();
      toast("Your first retirement result is ready.");
      return;
    }

    state.uiState.wizardStep = Math.min(WIZARD_STEP_COUNT, state.uiState.wizardStep + 1);
    if (state.uiState.wizardStep >= WIZARD_STEP_COUNT) state.uiState.unlocked.advanced = true;
    savePlan();
    renderAll();
  });

  el.notesInput?.addEventListener("input", () => {
    state.notes = el.notesInput.value;
    savePlan();
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === "dashboardStressToggle" && target instanceof HTMLInputElement) {
      ui.showStressBand = !!target.checked;
      renderDashboard();
      return;
    }
    if (target.id === "dollarModeToggle" && target instanceof HTMLInputElement) {
      ui.showTodaysDollars = !!target.checked;
      renderDashboard();
      return;
    }
    if (target.id === "coverageTableToggle" && target instanceof HTMLInputElement) {
      ui.showCoverageTable = !!target.checked;
      renderDashboard();
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === "yearScrubber" && target instanceof HTMLInputElement) {
      ui.selectedAge = Number(target.value);
      state.uiState.timelineSelectedAge = ui.selectedAge;
      if (el.yearScrubberValue) el.yearScrubberValue.textContent = `Age ${ui.selectedAge}`;
      renderDashboard();
    }
  });

  el.coverageChart?.addEventListener("mousemove", handleCoverageChartPointer);
  el.coverageChart?.addEventListener("mouseleave", () => {
    if (el.coverageHover) el.coverageHover.hidden = true;
  });
  el.mainChart?.addEventListener("mousemove", handleBalanceChartPointer);
  el.mainChart?.addEventListener("mouseleave", () => {
    if (el.balanceHover) el.balanceHover.hidden = true;
  });
  document.addEventListener("mousemove", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id !== "incomeMapCanvas") return;
    const hover = document.getElementById("incomeMapHover");
    bindIncomeMapHover(event, {
      hitZones: ui.incomeMapHitZones,
      hoverEl: hover,
      chartEl: target,
      formatCurrency,
      formatPct,
      showGross: Boolean(state.uiState.showGrossWithdrawals ?? true),
    });
  });
  document.addEventListener("mouseleave", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id !== "incomeMapCanvas") return;
    const hover = document.getElementById("incomeMapHover");
    if (hover) hover.hidden = true;
  }, true);
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLCanvasElement)) return;
    if (target.id !== "incomeMapCanvas") return;
    const age = pickIncomeMapAge(event, ui.incomeMapHitZones);
    if (!Number.isFinite(age)) return;
    ui.selectedAge = age;
    state.uiState.timelineSelectedAge = age;
    if (el.yearScrubber) el.yearScrubber.value = String(age);
    if (el.yearScrubberValue) el.yearScrubberValue.textContent = `Age ${age}`;
    renderDashboard();
  });

  el.scenarioCompareToggle?.addEventListener("change", () => {
    state.uiState.showScenarioCompare = !!el.scenarioCompareToggle.checked;
    savePlan();
    renderStress();
  });

  document.addEventListener("input", handleBoundInput);
  document.addEventListener("change", handleBoundInput);
  document.addEventListener("input", handleLearnBoundInput);
  document.addEventListener("change", handleLearnBoundInput);
  document.addEventListener("input", handleDashboardInput);
  document.addEventListener("change", handleDashboardInput);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("toggle", handleDetailsToggle, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeTooltip();
  });
  window.addEventListener("resize", updateResponsiveLayout);
  window.addEventListener("orientationchange", updateResponsiveLayout);

  el.openGlossary?.addEventListener("click", openGlossary);
  el.openGlossaryBtnTools?.addEventListener("click", openGlossary);
  el.openGlossaryBtnToolsTop?.addEventListener("click", openGlossary);
  el.closeGlossaryBtn?.addEventListener("click", () => el.glossaryModal?.close());
  el.glossaryModal?.addEventListener("click", (event) => {
    if (event.target === el.glossaryModal) el.glossaryModal.close();
  });
  el.copyShareLinkBtn?.addEventListener("click", () => copyShare(false));
  el.copyMinimalLinkBtn?.addEventListener("click", () => copyShare(true));
  el.copySummaryBtn?.addEventListener("click", copySummary);
  el.copyScenarioShareBtn?.addEventListener("click", copyScenarioShare);
  el.copyScenarioSummaryBtn?.addEventListener("click", copyScenarioSummary);
  el.compareScenariosBtn?.addEventListener("click", openScenarioCompare);
  el.downloadSummaryBtn?.addEventListener("click", openPrintSummary);
  el.downloadClientSummaryBtn?.addEventListener("click", printClientSummaryNow);
  el.resetCacheBtnTools?.addEventListener("click", resetCachedAppData);
  el.closePlanEditorBtn?.addEventListener("click", closePlanEditor);
  el.closeScenarioCompareBtn?.addEventListener("click", () => el.scenarioCompareModal?.close());
  el.scenarioCompareModal?.addEventListener("click", (event) => {
    if (event.target === el.scenarioCompareModal) el.scenarioCompareModal.close();
  });
  el.closePrintSummaryBtn?.addEventListener("click", () => el.printSummaryModal?.close());
  el.printSummaryModal?.addEventListener("click", (event) => {
    if (event.target === el.printSummaryModal) el.printSummaryModal.close();
  });
  el.printSummaryBtn?.addEventListener("click", printSummaryNow);
  el.copySummaryTextBtn?.addEventListener("click", copySummary);
  el.clientSummaryToggleBtn?.addEventListener("click", () => setClientSummaryMode(true));
  el.exitClientSummaryBtn?.addEventListener("click", () => setClientSummaryMode(false));
  el.planEditorModal?.addEventListener("click", (event) => {
    if (event.target === el.planEditorModal) closePlanEditor();
  });
}

function updateResponsiveLayout() {
  const mobile = typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 1100px)").matches
    : window.innerWidth <= 1100;
  ui.isMobileLayout = mobile;
  document.body.classList.toggle("mobile-layout", mobile);
}

function applyLifestylePreset(preset) {
  const nextPreset = Object.prototype.hasOwnProperty.call(LIFESTYLE_PRESETS, preset) ? preset : "comfortable";
  if (!state.uiState.guided) state.uiState.guided = {};
  state.uiState.guided.lifestylePreset = nextPreset;
  state.uiState.guided.retirementIncomePercent = LIFESTYLE_PRESETS[nextPreset];
  if (state.uiState.guided.retirementIncomeMode !== "dollar") {
    syncDesiredSpendingFromGuided();
  }
}

function syncDesiredSpendingFromGuided() {
  const percent = clamp(normalizePct(state.uiState.guided?.retirementIncomePercent ?? 0.7), 0.3, 1.2);
  state.uiState.guided.retirementIncomePercent = percent;
  state.profile.desiredSpending = Math.max(12000, Math.round(Number(state.profile.annualIncome || 0) * percent / 500) * 500);
}

function syncAnnualContributionFromPercent(percentInput) {
  const income = Math.max(0, Number(state.profile.annualIncome || 0));
  const rawPercent = normalizePct(percentInput);
  state.savings.annualContribution = Math.max(0, Math.round((income * rawPercent) / 500) * 500);
}

function syncAccountsFromGuidedSplit() {
  const total = Math.max(0, Number(state.savings.currentTotal || 0));
  const rrspShare = clamp(normalizePct(state.uiState.guided?.rrspShare ?? 0.6), 0, 1);
  const rrsp = Math.round(total * rrspShare);
  const tfsa = Math.round(total - rrsp);
  state.uiState.guided.rrspShare = rrspShare;
  state.accounts.rrsp = rrsp;
  state.accounts.tfsa = tfsa;
  state.accounts.nonRegistered = 0;
  state.accounts.cash = 0;
}

function applyGuidedDefaults() {
  if (state.uiState.guided?.useCanadianDefaults) {
    state.assumptions.inflation = 0.02;
    state.assumptions.riskProfile = "balanced";
    state.assumptions.returns.balanced = 0.05;
    state.strategy.estimateTaxes = true;
    state.strategy.oasClawbackModeling = true;
    state.income.cpp.amountAt65 = Math.max(12000, Number(state.income.cpp.amountAt65 || 0));
    state.income.oas.amountAt65 = Math.max(9000, Number(state.income.oas.amountAt65 || 0));
  }
}

function applyGuidedEstimateRetirementAge() {
  if (!state.uiState.guided?.estimateRetirementAge) return;
  const currentAge = ageNow();
  const estimatedAge = currentAge < 35 ? 67 : currentAge < 50 ? 65 : 63;
  state.profile.retirementAge = clamp(estimatedAge, 50, 75);
}

function finalizeGuidedPlan() {
  if (!state.uiState.guided) return;
  applyGuidedEstimateRetirementAge();
  if (state.uiState.guided.retirementIncomeMode !== "dollar") syncDesiredSpendingFromGuided();
  if (state.uiState.experienceMode !== "advanced") {
    syncAccountsFromGuidedSplit();
    applyGuidedDefaults();
  }
}

function wizardStepForPath(path) {
  if (path.startsWith("profile.birthYear") || path.startsWith("profile.annualIncome") || path.startsWith("profile.retirementAge") || path.startsWith("savings.currentTotal") || path.startsWith("uiState.guided.estimateRetirementAge")) return 1;
  if (path.startsWith("profile.desiredSpending") || path.startsWith("uiState.guided.retirementIncome") || path.startsWith("uiState.guided.lifestylePreset")) return 2;
  if (path.startsWith("savings.annualContribution") || path.startsWith("uiState.guided.rrspShare") || path.startsWith("uiState.guided.savingsContributionMode") || path.startsWith("uiState.guided.useCanadianDefaults")) return 3;
  if (path.startsWith("assumptions.") || path.startsWith("income.cpp.") || path.startsWith("income.oas.") || path.startsWith("profile.province") || path.startsWith("uiState.showAdvancedControls")) return 4;
  return 0;
}

function maybeAdvanceWizard(step) {
  if (ui.activeNav !== "plan") return false;
  if (state.uiState.wizardStep !== step) return false;
  if (step >= WIZARD_STEP_COUNT) return false;
  state.uiState.wizardStep = step + 1;
  return true;
}

function handleDocumentClick(event) {
  const rawTarget = event.target;
  const target = rawTarget instanceof Element ? rawTarget : rawTarget?.parentElement;
  if (!(target instanceof Element)) return;

  const navTargetBtn = target.closest("[data-nav-target]");
  if (navTargetBtn && !(navTargetBtn instanceof HTMLButtonElement && navTargetBtn.classList.contains("tab-btn"))) {
    const navTarget = navTargetBtn.getAttribute("data-nav-target");
    if (navTarget) {
      if (navTarget === "plan")
        ui.pendingPlanStartScroll = true;
      setActiveNav(navTarget);
      if (navTarget === "plan")
        queueGuidedSetupScroll();
      return;
    }
  }

  const tooltipBtn = target.closest("[data-tooltip-key]");
  if (tooltipBtn) {
    event.preventDefault();
    const key = tooltipBtn.getAttribute("data-tooltip-key") || "";
    if (!key) return;
    if (ui.tooltipKey === key) {
      closeTooltip();
      return;
    }
    openTooltip(key, tooltipBtn);
    return;
  }

  const actionBtn = target.closest("[data-action]");
  if (actionBtn) {
    const action = actionBtn.getAttribute("data-action");
    if (action === "open-methodology") {
      setActiveNav("tools");
      closeTooltip();
      return;
    }
    if (action === "focus-results-section") {
      const targetId = actionBtn.getAttribute("data-value") || "";
      ui.activeNav = "results";
      state.uiState.activeNav = "results";
      renderAll();
      if (targetId) {
        requestAnimationFrame(() => {
          const detailsTarget = document.getElementById(targetId);
          if (detailsTarget instanceof HTMLDetailsElement) {
            const peerDetails = Array.from(document.querySelectorAll(".dashboard-detail-accordion"));
            peerDetails.forEach((item) => {
              if (item instanceof HTMLDetailsElement) item.open = item.id === targetId;
            });
          }
          document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return;
    }
    if (action === "apply-timing-preview") {
      const beforePlan = clonePlan(state);
      const beforeModel = buildPlanModel(beforePlan);
      const sim = state.uiState.timingSim;
      state.income.cpp.startAge = Number(sim.cppStartAge);
      state.income.oas.startAge = Number(sim.oasStartAge);
      const afterModel = buildPlanModel(state);
      state.uiState.lastChangeSummary = buildChangeSummary(beforeModel, afterModel, state);
      ui.undoPlanSnapshot = beforePlan;
      savePlan();
      renderAll();
      toast("Timing preview applied. See What changed?");
      return;
    }
    if (action === "reset-timing-preview") {
      state.uiState.timingSim.cppStartAge = state.income.cpp.startAge;
      state.uiState.timingSim.oasStartAge = state.income.oas.startAge;
      state.uiState.timingSim.linkTiming = false;
      savePlan();
      renderAll();
      toast("Timing preview reset.");
      return;
    }
    if (action === "open-learn") {
      setActiveNav("learn");
      return;
    }
    if (action === "see-how-it-works") {
      setActiveNav("plan");
      requestAnimationFrame(() => {
        document.querySelector(".guided-stepper-shell")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    if (action === "set-lifestyle-preset") {
      applyLifestylePreset(actionBtn.getAttribute("data-value") || "comfortable");
      savePlan();
      renderAll();
      return;
    }
    if (action === "set-retirement-income-mode") {
      if (!state.uiState.guided) state.uiState.guided = {};
      state.uiState.guided.retirementIncomeMode = actionBtn.getAttribute("data-value") === "dollar" ? "dollar" : "percent";
      if (state.uiState.guided.retirementIncomeMode !== "dollar") syncDesiredSpendingFromGuided();
      savePlan();
      renderAll();
      return;
    }
    if (action === "set-contribution-mode") {
      if (!state.uiState.guided) state.uiState.guided = {};
      state.uiState.guided.savingsContributionMode = actionBtn.getAttribute("data-value") === "percent" ? "percent" : "annual";
      savePlan();
      renderAll();
      return;
    }
    if (action === "tools-save-plan") {
      exportJson();
      return;
    }
    if (action === "tools-load-plan") {
      openImportPicker();
      return;
    }
    if (action === "tools-reset-plan") {
      resetPlanToBlank();
      return;
    }
    if (action === "tools-open-glossary") {
      openGlossary();
      return;
    }
    if (action === "set-experience-mode") {
      const value = actionBtn.getAttribute("data-value") === "advanced" ? "advanced" : "beginner";
      state.uiState.experienceMode = value;
      if (value === "advanced") {
        state.uiState.unlocked.advanced = true;
      }
      savePlan();
      renderAll();
      toast(value === "advanced" ? "Advanced Mode enabled." : "Beginner Mode enabled.");
      return;
    }
    if (action === "set-dashboard-scenario") {
      const value = actionBtn.getAttribute("data-value") || "base";
      if (value === "custom") {
        setActiveNav("scenarios");
        return;
      }
      state.uiState.dashboardScenario = ["base", "inflation", "returns", "longevity"].includes(value) ? value : "base";
      savePlan();
      ui.activeNav = "results";
      state.uiState.activeNav = "results";
      renderAll();
      toast(state.uiState.dashboardScenario === "base" ? "Base case shown." : "Scenario view updated.");
      return;
    }
    if (action === "edit-plan-row") {
      const key = actionBtn.getAttribute("data-value") || "";
      if (!key) return;
      openPlanEditor(key);
      return;
    }
    if (action === "toggle-learn-progress") {
      const key = actionBtn.getAttribute("data-value") || "";
      if (!key) return;
      const current = Boolean(state.uiState.learningProgress?.[key]);
      if (!state.uiState.learningProgress) state.uiState.learningProgress = createDefaultLearningProgressLocal();
      state.uiState.learningProgress[key] = !current;
      savePlan();
      renderLearn();
      return;
    }
    if (action === "launch-planner") {
      setActiveNav("plan");
      return;
    }
    if (action === "copy-share-link") {
      copyShare(false);
      return;
    }
    if (action === "copy-minimal-link") {
      copyShare(true);
      return;
    }
    if (action === "copy-plan-summary") {
      copySummary();
      return;
    }
    if (action === "copy-scenario-share") {
      copyScenarioShare();
      return;
    }
    if (action === "copy-scenario-summary") {
      copyScenarioSummary();
      return;
    }
    if (action === "download-summary") {
      openPrintSummary();
      return;
    }
    if (action === "open-advanced") {
      state.uiState.unlocked.advanced = true;
      state.uiState.experienceMode = "advanced";
      state.uiState.showAdvancedControls = true;
      setActiveNav("tools");
      savePlan();
      return;
    }
    if (action === "open-stress") {
      setActiveNav("scenarios");
      return;
    }
    if (action === "open-spouse") {
      state.profile.hasSpouse = true;
      state.uiState.unlocked.spouse = true;
      state.uiState.unlocked.advanced = true;
      setActiveNav("tools");
      savePlan();
      renderAll();
      return;
    }
    if (action === "risk") {
      const value = actionBtn.getAttribute("data-value") || "balanced";
      state.assumptions.riskProfile = value;
      savePlan();
      renderAll();
      return;
    }
    if (action === "strategy") {
      const beforePlan = clonePlan(state);
      const beforeModel = buildPlanModel(beforePlan);
      const value = actionBtn.getAttribute("data-value") || "tax-smart";
      state.strategy.withdrawal = value;
      const afterModel = buildPlanModel(state);
      state.uiState.lastChangeSummary = buildChangeSummary(beforeModel, afterModel, state);
      ui.undoPlanSnapshot = beforePlan;
      savePlan();
      renderAll();
      toast("Strategy updated. See What changed?");
      return;
    }
    if (action === "preview-strategy") {
      const key = actionBtn.getAttribute("data-value") || "";
      if (!key) return;
      const previewPlan = buildStrategyPreviewPlan(state, key);
      const summary = buildChangeSummary(ui.lastModel, buildPlanModel(previewPlan), previewPlan);
      ui.pendingStrategyPreview = previewPlan;
      ui.pendingStrategyKey = key;
      state.uiState.selectedScenarioLabel = `Preview: ${key}`;
      state.uiState.lastChangeSummary = summary;
      ui.activeNav = "results";
      state.uiState.activeNav = "results";
      renderAll();
      scrollDashboardToTop();
      toast("Strategy preview ready.");
      return;
    }
    if (action === "apply-strategy-preview") {
      if (!ui.pendingStrategyPreview) return;
      const beforePlan = clonePlan(state);
      state = clonePlan(ui.pendingStrategyPreview);
      state.uiState.selectedScenarioLabel = `Applied: ${ui.pendingStrategyKey}`;
      ui.pendingStrategyPreview = null;
      ui.pendingStrategyKey = "";
      ui.undoPlanSnapshot = beforePlan;
      savePlan();
      renderAll();
      scrollDashboardToTop();
      toast("Strategy preview applied.");
      return;
    }
    if (action === "undo-strategy-preview") {
      ui.pendingStrategyPreview = null;
      ui.pendingStrategyKey = "";
      state.uiState.lastChangeSummary = null;
      savePlan();
      renderDashboard();
      scrollDashboardToTop();
      toast("Strategy preview cleared.");
      return;
    }
    if (action === "add-capital-inject") {
      state.savings.capitalInjects.push(createCapitalInjectItem());
      savePlan();
      renderAll();
      return;
    }
    if (action === "remove-capital-inject") {
      const id = actionBtn.getAttribute("data-value") || "";
      state.savings.capitalInjects = state.savings.capitalInjects.filter((item) => item.id !== id);
      savePlan();
      renderAll();
      return;
    }
    if (action === "tooltip-example") {
      const key = actionBtn.getAttribute("data-value") || "";
      const body = actionBtn.closest(".tooltip-popover")?.querySelector(".tooltip-example");
      const tip = TOOLTIPS[key];
      if (tip && body) body.textContent = tip.example || "No example available.";
      return;
    }
    if (action === "dismiss-support-moment") {
      dismissSupportMoment(state.uiState);
      ui.activeSupportMoment = "";
      savePlan();
      renderDashboardSupportMoment();
      return;
    }
    if (action === "support-opt-out") {
      state.uiState.supportOptOut = true;
      ui.activeSupportMoment = "";
      savePlan();
      renderDashboardSupportMoment();
      toast("Thanks for supporting.");
      return;
    }
    if (action === "dismiss-last-change") {
      state.uiState.lastChangeSummary = null;
      savePlan();
      renderDashboard();
      return;
    }
    if (action === "undo-last-change") {
      if (!ui.undoPlanSnapshot) {
        toast("Nothing to undo.");
        return;
      }
      state = clonePlan(ui.undoPlanSnapshot);
      ui.undoPlanSnapshot = null;
      state.uiState.lastChangeSummary = null;
      savePlan();
      renderAll();
      toast("Last change undone.");
      return;
    }
    if (action === "save-current-scenario") {
      const scenario = saveScenarioSnapshot(state, ui.lastModel, `Scenario ${((state.uiState.scenarios || []).length || 0) + 1}`);
      savePlan();
      openScenarioCompare();
      toast(`Saved ${scenario.name}.`);
      return;
    }
    if (action === "open-scenario-compare") {
      openScenarioCompare();
      return;
    }
    if (action === "delete-scenario") {
      const id = actionBtn.getAttribute("data-value") || "";
      if (!id) return;
      removeScenarioSnapshot(state, id);
      savePlan();
      openScenarioCompare();
      return;
    }
    if (action === "rename-scenario") {
      const id = actionBtn.getAttribute("data-value") || "";
      if (!id) return;
      const next = prompt("Rename scenario");
      if (!next) return;
      renameScenarioSnapshot(state, id, next);
      savePlan();
      openScenarioCompare();
      return;
    }
    if (action === "preview-scenario") {
      const id = actionBtn.getAttribute("data-value") || "";
      if (!id) return;
      const scenario = (state.uiState.scenarios || []).find((s) => s.id === id);
      if (!scenario) return;
      const payload = buildScenarioPayloadFromSnapshot(scenario);
      sharedScenarioPayload = payload;
      state.uiState.lastSharedScenarioBannerDismissed = false;
      state.uiState.selectedScenarioLabel = scenario.name || "";
      savePlan();
      renderDashboardSharedScenarioBanner();
      toast("Scenario loaded in preview banner.");
      return;
    }
    if (action === "share-scenario") {
      const id = actionBtn.getAttribute("data-value") || "";
      if (!id) return;
      copyScenarioShare(id);
      return;
    }
    if (action === "apply-shared-scenario") {
      if (!sharedScenarioPayload) return;
      state = applySharedScenarioToPlan(state, sharedScenarioPayload);
      state.uiState.firstRun = false;
      state.uiState.hasStarted = true;
      state.uiState.lastSharedScenarioBannerDismissed = true;
      sharedScenarioPayload = null;
      clearSharedScenarioQuery();
      ensureValidStateLocal();
      savePlan();
      renderAll();
      toast("Shared scenario applied to your local plan.");
      return;
    }
    if (action === "preview-shared-scenario") {
      if (!sharedScenarioPayload || !ui.lastModel) return;
      const previewPlan = applySharedScenarioToPlan(state, sharedScenarioPayload);
      state.uiState.lastChangeSummary = buildChangeSummary(ui.lastModel, buildPlanModel(previewPlan), previewPlan);
      renderWhatChangedModule();
      toast("Shared scenario preview generated.");
      return;
    }
    if (action === "apply-preset") {
      if (!presetPayload) return;
      if (!state.uiState.firstRun) {
        const ok = confirm("Apply preset to your current plan? This will update assumptions but you can Undo via your saved copy/export.");
        if (!ok) return;
      }
      state = applyPresetToPlan(state, presetPayload, createDemoPlanLocal);
      ensureValidStateLocal();
      presetPayload = null;
      clearPresetQuery();
      savePlan();
      renderAll();
      toast("Preset applied to your local plan.");
      return;
    }
    if (action === "dismiss-preset") {
      presetPayload = null;
      clearPresetQuery();
      renderDashboardPresetBanner();
      return;
    }
    if (action === "focus-strategies") {
      document.getElementById("strategySuggestions")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "dismiss-shared-scenario") {
      state.uiState.lastSharedScenarioBannerDismissed = true;
      sharedScenarioPayload = null;
      clearSharedScenarioQuery();
      savePlan();
      renderDashboardSharedScenarioBanner();
      return;
    }
    if (action === "enable-clawback") {
      state.strategy.oasClawbackModeling = true;
      savePlan();
      renderAll();
      toast("OAS clawback modeling enabled.");
      return;
    }
    if (action === "enable-rrif") {
      state.strategy.applyRrifMinimums = true;
      savePlan();
      renderAll();
      toast("RRIF minimum rules enabled.");
      return;
    }
    if (action === "focus-timing-sim" || action === "focus-meltdown-sim") {
      setActiveNav("results");
      const targetId = action === "focus-timing-sim" ? "timingSimulator" : "meltdownSimulator";
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    if (action === "set-selected-age") {
      const nextAge = Number(actionBtn.getAttribute("data-value"));
      if (!Number.isFinite(nextAge)) return;
      ui.selectedAge = nextAge;
      state.uiState.timelineSelectedAge = nextAge;
      if (el.yearScrubber) el.yearScrubber.value = String(nextAge);
      if (el.yearScrubberValue) el.yearScrubberValue.textContent = `Age ${nextAge}`;
      const rs = document.getElementById("resultsAgePicker");
      if (rs) rs.value = String(nextAge);
      const gp = document.getElementById("gapAgePicker");
      if (gp) gp.value = String(nextAge);
      savePlan();
      renderDashboard();
      return;
    }
    if (action === "open-client-summary") {
      setClientSummaryMode(true);
      return;
    }
    if (action === "exit-client-summary") {
      setClientSummaryMode(false);
      return;
    }
    if (action === "print-client-summary") {
      printClientSummaryNow();
      return;
    }
    if (action === "learn-send-spending") {
      state.profile.desiredSpending = Math.max(12000, Number(state.uiState.learn.inflation.spendingToday || state.profile.desiredSpending));
      state.assumptions.inflation = clamp(normalizePct(state.uiState.learn.inflation.rate), 0.005, 0.08);
      savePlan();
      renderAll();
      toast("Spending and inflation sent to planner.");
      return;
    }
    if (action === "learn-send-tax-rate") {
      state.uiState.learn.taxGrossUp.rate = clamp(normalizePct(state.uiState.learn.taxGrossUp.rate), 0, 0.5);
      savePlan();
      toast("Tax gross-up assumption saved in Learn.");
      return;
    }
    if (action === "learn-send-phases") {
      const weighted = calculatePhaseWeightedSpendingUi(state.uiState.learn.phases);
      state.profile.desiredSpending = Math.max(12000, weighted);
      savePlan();
      renderAll();
      toast("Phase-adjusted spending estimate sent to planner.");
      return;
    }
  }

  if (!target.closest(".tooltip-popover")) closeTooltip();
}

function handleBoundInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.matches("[data-bind]")) return;

  const path = target.getAttribute("data-bind");
  if (!path) return;
  const trackChange = event.type === "change" && isMaterialChangePath(path);
  const beforePlan = trackChange ? clonePlan(state) : null;
  const beforeModel = trackChange ? buildPlanModel(beforePlan) : null;

  captureAdvancedAccordionState();

  let value;
  if (target instanceof HTMLInputElement && target.type === "checkbox") {
    value = target.checked;
  } else {
    value = target.value;
  }

  const type = target.getAttribute("data-type") || "string";
  if (type === "number") {
    const parsed = Number(value);
    value = Number.isFinite(parsed) ? parsed : 0;
  }
  if (target.getAttribute("data-percent-input") === "1" && typeof value === "number") {
    value /= 100;
  }
  const displayAs = target.getAttribute("data-display-as") || "";
  if (displayAs === "age" && typeof value === "number") {
    value = APP.currentYear - value;
  }
  if (displayAs === "income-percent" && typeof value === "number") {
    syncAnnualContributionFromPercent(value);
    value = state.savings.annualContribution;
  }

  setByPath(state, path, value);

  if (path === "income.pension.enabled" && !value) state.income.pension.amount = 0;
  if (path === "profile.retirementAge") {
    state.income.pension.startAge = Math.max(state.income.pension.startAge, 40);
  }
  if (path === "profile.annualIncome" && state.uiState.guided?.retirementIncomeMode !== "dollar") {
    syncDesiredSpendingFromGuided();
  }
  if (path === "uiState.guided.retirementIncomePercent" && state.uiState.guided?.retirementIncomeMode !== "dollar") {
    syncDesiredSpendingFromGuided();
  }
  if ((path === "uiState.guided.rrspShare" || path === "savings.currentTotal") && state.uiState.experienceMode !== "advanced") {
    syncAccountsFromGuidedSplit();
  }
  if (path === "uiState.guided.useCanadianDefaults" && value && state.uiState.experienceMode !== "advanced") {
    applyGuidedDefaults();
  }
  if (path === "uiState.guided.estimateRetirementAge") {
    applyGuidedEstimateRetirementAge();
  }
  if (path === "uiState.showGrossWithdrawals") {
    ui.showGrossWithdrawals = Boolean(value);
  }
  if (path === "uiState.timingSim.linkTiming" && value) {
    const cppAge = Number(state.uiState.timingSim.cppStartAge);
    state.uiState.timingSim.oasStartAge = Math.min(70, Math.max(65, 65 + (cppAge - 60)));
  }
  if (path === "uiState.timingSim.cppStartAge" && state.uiState.timingSim.linkTiming) {
    const cppAge = Number(state.uiState.timingSim.cppStartAge);
    state.uiState.timingSim.oasStartAge = Math.min(70, Math.max(65, 65 + (cppAge - 60)));
  }

  // Avoid re-rendering while the user is actively editing.
  // Full recalculation runs on committed change events.
  if (event.type === "input" && !(target instanceof HTMLInputElement && target.type === "checkbox")) {
    if (target.getAttribute("data-live-input") === "1") {
      if (path === "uiState.advancedSearch") applyAdvancedSearchFilter();
      if (path.startsWith("uiState.incomeMap.")) {
        renderDashboard();
      }
    }
    savePlan();
    return;
  }

  const stepForPath = wizardStepForPath(path);
  const advanced = stepForPath === 4 && state.uiState.showAdvancedControls;
  const autoAdvanced = stepForPath > 0 && event.type === "change" && maybeAdvanceWizard(stepForPath) && !advanced;
  renderAll();
  if (trackChange && beforeModel) {
    const summary = buildChangeSummary(beforeModel, ui.lastModel, state);
    if (summary) {
      ui.undoPlanSnapshot = beforePlan;
      state.uiState.lastChangeSummary = summary;
      toast("Plan updated. See What changed?");
    }
  }
  savePlan();
  if (autoAdvanced) {
    toast(`Step ${Math.max(1, state.uiState.wizardStep - 1)} saved. Moving to the next step.`);
  }
}

function handleLearnBoundInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.matches("[data-learn-bind]")) return;

  const path = target.getAttribute("data-learn-bind");
  if (!path) return;

  let value;
  if (target instanceof HTMLInputElement && target.type === "checkbox") value = target.checked;
  else value = target.value;

  const type = target.getAttribute("data-type") || "string";
  if (type === "number") {
    const parsed = Number(value);
    value = Number.isFinite(parsed) ? parsed : 0;
  }
  if (target.getAttribute("data-percent-input") === "1" && typeof value === "number") {
    value /= 100;
  }

  setByPath(state, path, value);
  ensureValidStateLocal();
  savePlan();
  updateLearnOutputs();
}

function handleDashboardInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.id !== "resultsAgePicker" && target.id !== "gapAgePicker") return;
  const nextAge = Number(target.value);
  if (!Number.isFinite(nextAge)) return;
  ui.selectedAge = nextAge;
  state.uiState.timelineSelectedAge = nextAge;
  if (el.yearScrubber) el.yearScrubber.value = String(nextAge);
  if (el.yearScrubberValue) el.yearScrubberValue.textContent = `Age ${nextAge}`;
  const rs = document.getElementById("resultsAgePicker");
  if (rs) rs.value = String(nextAge);
  const gp = document.getElementById("gapAgePicker");
  if (gp) gp.value = String(nextAge);
  renderDashboard();
}

function renderAll() {
  ensureValidStateLocal();
  finalizeGuidedPlan();
  ensureValidStateLocal();
  ui.showGrossWithdrawals = Boolean(state.uiState.showGrossWithdrawals ?? true);
  ui.activeNav = normalizeNavTargetUi(ui.activeNav || state.uiState.activeNav || "results");
  state.uiState.activeNav = ui.activeNav;
  ui.lastModel = buildPlanModel(state);
  document.body.classList.remove("mobile-plan-focus");
  if (el.heroHeader) el.heroHeader.hidden = false;

  const showLanding = state.uiState.firstRun;
  if (el.landingPanel) el.landingPanel.hidden = !showLanding;
  if (el.appPanel) el.appPanel.hidden = showLanding;
  if (el.bottomTabs) el.bottomTabs.hidden = showLanding;

  syncExperienceModeUi();
  renderNav();
  renderDashboard();
  renderLearn();
  renderWizard();
  renderPlanInputs();
  renderAdvanced();
  renderStress();
  renderMethodology();
  renderNotes();
  bindInlineTooltipTriggers(document.body);
  if (ui.pendingPlanStartScroll && ui.activeNav === "plan") {
    ui.pendingPlanStartScroll = false;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.scrollTo(0, 0);
    queueGuidedSetupScroll();
  }
}

function syncExperienceModeUi() {
  const mode = state.uiState.experienceMode === "advanced" ? "advanced" : "beginner";
  document.body.classList.toggle("advanced-experience", mode === "advanced");
  document.body.classList.toggle("beginner-experience", mode !== "advanced");
  el.experienceModeButtons.forEach((btn) => {
    const active = (btn.getAttribute("data-value") || "beginner") === mode;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderNav() {
  const nav = ui.activeNav;
  el.tabButtons.forEach((btn) => {
    const isActive = (btn.dataset.navTarget || "") === nav;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-current", isActive ? "page" : "false");
  });
  el.navPanels.forEach((panel) => {
    const isActive = panel.dataset.navPanel === nav;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}

function setActiveNav(next) {
  ui.activeNav = normalizeNavTargetUi(next);
  state.uiState.firstRun = false;
  state.uiState.activeNav = ui.activeNav;
  state.uiState.hasStarted = true;
  syncNavHashUi(ui.activeNav, normalizeNavTargetUi);
  savePlan();
  renderAll();
}

function scrollDashboardToTop() {
  const panel = document.querySelector('[data-nav-panel="results"]');
  if (panel instanceof HTMLElement) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function scrollPlanToGuidedSetup() {
  const guidedSetup = document.getElementById("guidedSetupSection") || document.querySelector(".guided-stepper-shell");
  if (guidedSetup instanceof HTMLElement) {
    guidedSetup.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      guidedSetup.focus({ preventScroll: true });
    } catch {}
    return;
  }
  const planPanel = document.querySelector('[data-nav-panel="plan"]');
  if (planPanel instanceof HTMLElement) {
    planPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function queueGuidedSetupScroll() {
  const runScroll = () => {
    scrollPlanToGuidedSetup();
    setTimeout(scrollPlanToGuidedSetup, 140);
    setTimeout(scrollPlanToGuidedSetup, 320);
    setTimeout(scrollPlanToGuidedSetup, 640);
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(runScroll);
    requestAnimationFrame(() => {
      setTimeout(runScroll, 60);
    });
    return;
  }
  runScroll();
}

function getDashboardScenario() {
  return state.uiState.dashboardScenario || "base";
}

function buildDashboardScenarioPlan() {
  const scenario = getDashboardScenario();
  if (scenario === "base" || scenario === "custom") return state;
  const preview = clonePlan(state);
  if (scenario === "inflation") {
    preview.assumptions.inflation = Math.min(0.06, Number(preview.assumptions.inflation || 0.02) + 0.015);
  } else if (scenario === "returns") {
    preview.assumptions.returns.conservative = Math.max(0.01, Number(preview.assumptions.returns.conservative || 0) - 0.015);
    preview.assumptions.returns.balanced = Math.max(0.015, Number(preview.assumptions.returns.balanced || 0) - 0.015);
    preview.assumptions.returns.aggressive = Math.max(0.02, Number(preview.assumptions.returns.aggressive || 0) - 0.015);
  } else if (scenario === "longevity") {
    preview.profile.lifeExpectancy = Math.min(105, Number(preview.profile.lifeExpectancy || 90) + 5);
  }
  return preview;
}

function getActiveDashboardPlan() {
  const scenario = getDashboardScenario();
  if (scenario === "base" || scenario === "custom") return state;
  return buildDashboardScenarioPlan();
}

function getActiveDashboardModel() {
  const scenario = getDashboardScenario();
  if (!ui.lastModel || scenario === "base" || scenario === "custom") return ui.lastModel;
  return buildPlanModel(buildDashboardScenarioPlan());
}

function renderDashboard() {
  syncClientSummaryModeUi();
  const dashboardModel = getActiveDashboardModel();
  renderDashboardView({
    state,
    ui,
    el,
    app: APP,
    supportUrl: SUPPORT_URL,
    provinces: PROVINCES,
    officialReferences: OFFICIAL_REFERENCES,
    formatCurrency,
    formatPct,
    escapeHtml,
    clamp,
    tooltipButton,
    bindInlineTooltipTriggers,
    drawMainChart,
    drawCoverageChart,
    getBalanceLegendItems,
    getCoverageLegendItems,
    findRowByAge: findRowByAgeLocal,
    findFirstRetirementRow: findFirstRetirementRowLocal,
    amountForDisplay: amountForDisplayLocal,
    getOasRiskLevel: getOasRiskLevelLocal,
    buildNextActions: buildNextActionsLocal,
    dashboardModel,
  });
  renderDashboardResultsStrip();
  renderRetirementGapModule();
  renderRetirementInsightModule();
  renderDashboardSupportMoment();
  renderIncomeMapModule();
  renderTaxWedgeMiniModule();
  renderWhatChangedModule();
  renderCoverageScoreModule();
  renderPeakTaxYearModule();
  renderTimelineModule();
  renderKeyRisksModule();
  renderStrategySuggestionsModule();
  renderTimingSimulatorModule();
  renderMeltdownSimulatorModule();
  renderDashboardPresetBanner();
  renderDashboardSharedScenarioBanner();
  renderClientSummaryModeModule();
  syncDashboardLiveSummary();
}

function syncDashboardLiveSummary() {
  if (!el.resultLiveSummary) return;
  const status = (el.dashboardStatus?.textContent || "").trim();
  const verdict = (document.querySelector("#canIRetireModule h3")?.textContent || "").trim();
  const summary = [status, verdict].filter(Boolean).join(". ");
  if (!summary || el.resultLiveSummary.textContent === summary) return;
  el.resultLiveSummary.textContent = summary;
}

function syncClientSummaryModeUi() {
  const enabled = Boolean(state.uiState.clientSummary?.enabled);
  if (el.clientSummaryToggleBtn) el.clientSummaryToggleBtn.hidden = enabled;
  if (el.exitClientSummaryBtn) el.exitClientSummaryBtn.hidden = !enabled;
  if (el.clientSummaryModeMount) el.clientSummaryModeMount.hidden = !enabled;
  if (el.plannerDashboardContent) el.plannerDashboardContent.hidden = enabled;
}

function setClientSummaryMode(enabled) {
  if (!state.uiState.clientSummary || typeof state.uiState.clientSummary !== "object") {
    state.uiState.clientSummary = { enabled: false, preparedFor: "", scenarioLabel: "", preparedBy: "", summaryDate: "" };
  }
  state.uiState.clientSummary.enabled = Boolean(enabled);
  savePlan();
  renderDashboard();
}

function dashboardRetirementRows() {
  const dashboardModel = getActiveDashboardModel();
  return (dashboardModel?.base?.rows || []).filter((row) => row.age >= state.profile.retirementAge);
}

function selectedDashboardAgeBounds() {
  const rows = dashboardRetirementRows();
  if (!rows.length) return { minAge: state.profile.retirementAge, maxAge: state.profile.lifeExpectancy };
  return { minAge: rows[0].age, maxAge: rows[rows.length - 1].age };
}

function getDashboardSelectedRow() {
  const rows = dashboardRetirementRows().length ? dashboardRetirementRows() : (ui.lastModel?.base?.rows || []);
  return findRowByAgeLocal(rows, ui.selectedAge || state.profile.retirementAge)
    || findRowByAgeLocal(rows, state.profile.retirementAge)
    || rows[0]
    || null;
}

function renderDashboardResultsStrip() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.resultsStrip || !dashboardModel) return;
  const rows = dashboardRetirementRows();
  if (!rows.length) {
    el.resultsStrip.innerHTML = "";
    return;
  }
  const minAge = rows[0].age;
  const maxAge = rows[rows.length - 1].age;
  const selected = clamp(ui.selectedAge ?? minAge, minAge, maxAge);
  ui.selectedAge = selected;
  state.uiState.timelineSelectedAge = selected;
  const row = findRowByAgeLocal(rows, selected) || rows[0];
  renderResultsStrip({
    mountEl: el.resultsStrip,
    plan: state,
    row,
    selectedAge: selected,
    minAge,
    maxAge,
    tooltipButton,
    formatCurrency,
    formatPct,
    clamp,
  });
  bindInlineTooltipTriggers(el.resultsStrip);
}

function renderRetirementGapModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.retirementGapHeadline || !dashboardModel) return;
  const rows = dashboardRetirementRows();
  if (!rows.length) {
    el.retirementGapHeadline.innerHTML = "";
    return;
  }
  const { minAge, maxAge } = selectedDashboardAgeBounds();
  const selected = clamp(ui.selectedAge ?? minAge, minAge, maxAge);
  const row = findRowByAgeLocal(rows, selected) || rows[0];
  renderRetirementGapHeadline({
    mountEl: el.retirementGapHeadline,
    plan: state,
    row,
    model: dashboardModel,
    selectedAge: selected,
    minAge,
    maxAge,
    tooltipButton,
    formatCurrency,
    formatPct,
  });
  bindInlineTooltipTriggers(el.retirementGapHeadline);
}

function renderRetirementInsightModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.retirementInsight || !dashboardModel) return;
  const row = getDashboardSelectedRow();
  if (!row) {
    el.retirementInsight.innerHTML = "";
    return;
  }
  renderRetirementInsight({
    mountEl: el.retirementInsight,
    plan: state,
    row,
    model: dashboardModel,
    age: row.age,
    tooltipButton,
    formatCurrency,
    formatPct,
  });
  bindInlineTooltipTriggers(el.retirementInsight);
}

function renderTaxWedgeMiniModule() {
  if (!el.taxWedgeMini) return;
  const row = getDashboardSelectedRow();
  if (!row) {
    el.taxWedgeMini.innerHTML = "";
    return;
  }
  renderGrossNetCallout({
    mountEl: el.taxWedgeMini,
    row,
    formatCurrency,
    formatPct,
    emphasizeTaxes: Boolean(state.uiState.emphasizeTaxes ?? true),
  });
  bindInlineTooltipTriggers(el.taxWedgeMini);
}

function renderIncomeMapModule() {
  if (!el.incomeMapModule || !getActiveDashboardModel()) return;
  renderIncomeMapAtMount(el.incomeMapModule);
}

function renderIncomeMapAtMount(mountEl) {
  const dashboardModel = getActiveDashboardModel();
  if (!mountEl || !dashboardModel) return;
  const breakdown = buildYearBreakdown(state, dashboardModel);
  const phases = buildRetirementPhases(state, breakdown);
  const rendered = renderIncomeMap({
    mountEl,
    plan: state,
    rows: breakdown,
    phases,
    selectedAge: ui.selectedAge || state.profile.retirementAge,
    formatCurrency,
    formatPct,
    state,
  });
  if (!rendered) return;
  const canvas = mountEl.querySelector("#incomeMapCanvas");
  const draw = drawIncomeMapCanvas({
    canvas,
    visibleRows: rendered.visibleRows,
    selectedAge: ui.selectedAge || state.profile.retirementAge,
    showGross: rendered.showGross,
    showMarkers: rendered.showMarkers,
    markers: rendered.markers,
    phases: rendered.visiblePhases,
    formatCurrency,
  });
  ui.incomeMapHitZones = draw?.hitZones || [];
  bindInlineTooltipTriggers(mountEl);
}

function renderWhatChangedModule() {
  renderWhatChangedPanel({
    mountEl: el.whatChangedPanel,
    summary: state.uiState.lastChangeSummary || null,
  });
}

function renderCoverageScoreModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.coverageScoreModule || !dashboardModel) return;
  if (state.uiState.experienceMode !== "advanced") {
    el.coverageScoreModule.innerHTML = "";
    return;
  }
  const score = computeCoverageScore(state, dashboardModel);
  renderCoverageScore({
    mountEl: el.coverageScoreModule,
    score,
    tooltipButton,
    formatPct,
  });
  bindInlineTooltipTriggers(el.coverageScoreModule);
}

function renderPeakTaxYearModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.peakTaxYearModule || !dashboardModel) return;
  const peak = findPeakTaxYear(state, dashboardModel);
  renderPeakTaxYear({
    mountEl: el.peakTaxYearModule,
    peak,
    formatCurrency,
  });
}

function renderStrategySuggestionsModule() {
  if (!el.strategySuggestionsModule) return;
  if (state.uiState.clientSummary?.enabled) {
    el.strategySuggestionsModule.innerHTML = "";
    return;
  }
  renderStrategySuggestions({
    mountEl: el.strategySuggestionsModule,
    pendingKey: ui.pendingStrategyKey,
  });
}

function renderTimelineModule() {
  if (!el.timelineModule) return;
  const events = buildTimelineEvents(state);
  renderTimeline({
    mountEl: el.timelineModule,
    events,
    selectedAge: ui.selectedAge || state.profile.retirementAge,
  });
}

function renderKeyRisksModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.keyRisksModule || !dashboardModel) return;
  const selected = getDashboardSelectedRow();
  const risks = buildRiskDiagnostics(state, dashboardModel, selected?.age || state.profile.retirementAge);
  renderKeyRisks({
    mountEl: el.keyRisksModule,
    risks,
    tooltipButton,
  });
  bindInlineTooltipTriggers(el.keyRisksModule);
}

function renderTimingSimulatorModule() {
  if (!el.timingSimulator || !ui.lastModel) return;
  if (state.uiState.clientSummary?.enabled || state.uiState.experienceMode !== "advanced") {
    el.timingSimulator.innerHTML = "";
    return;
  }
  const sim = state.uiState.timingSim;
  const preview = buildTimingPreview({
    plan: state,
    sim,
    buildModel: buildPlanModel,
  });
  renderCppOasTimingSimulator({
    mountEl: el.timingSimulator,
    sim,
    preview,
    tooltipButton,
    numberField,
    formatCurrency,
    formatPct,
  });
  bindInlineTooltipTriggers(el.timingSimulator);
}

function renderMeltdownSimulatorModule() {
  if (!el.meltdownSimulator || !ui.lastModel) return;
  if (state.uiState.clientSummary?.enabled || state.uiState.experienceMode !== "advanced") {
    el.meltdownSimulator.innerHTML = "";
    return;
  }
  const comparison = buildMeltdownComparison(ui.lastModel, state);
  renderRrspMeltdownSimulator({
    mountEl: el.meltdownSimulator,
    plan: state,
    comparison,
    numberField,
    tooltipButton,
    formatCurrency,
    formatPct,
  });
  bindInlineTooltipTriggers(el.meltdownSimulator);
}

function renderDashboardSharedScenarioBanner() {
  if (!el.sharedScenarioBanner) return;
  const show = Boolean(sharedScenarioPayload) && !state.uiState.lastSharedScenarioBannerDismissed;
  el.sharedScenarioBanner.hidden = !show;
  if (!show) {
    el.sharedScenarioBanner.innerHTML = "";
    return;
  }
  el.sharedScenarioBanner.innerHTML = `
    <div class="banner-row">
      <div>
        <strong>Shared scenario loaded</strong>
        <p class="small-copy muted">Preview loaded from link. Apply only if you want to replace current assumptions.</p>
      </div>
      <div class="landing-actions">
        <button class="btn btn-secondary" type="button" data-action="preview-shared-scenario">Preview</button>
        <button class="btn btn-primary" type="button" data-action="apply-shared-scenario">Apply to my plan</button>
        <button class="btn btn-secondary" type="button" data-action="dismiss-shared-scenario">Dismiss</button>
      </div>
    </div>
  `;
}

function renderDashboardPresetBanner() {
  if (!el.presetBanner) return;
  const show = Boolean(presetPayload);
  el.presetBanner.hidden = !show;
  el.presetBanner.innerHTML = show ? buildPresetBannerHtml(presetPayload) : "";
}

function renderDashboardSupportMoment() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.supportMomentMount || !dashboardModel) return;
  if (state.uiState.clientSummary?.enabled) {
    el.supportMomentMount.innerHTML = "";
    return;
  }
  ensureSupportMomentState(state.uiState);
  const row = getDashboardSelectedRow();
  let trigger = "";
  if (state.uiState.justCompletedWizard) {
    trigger = maybeTriggerSupportMoment({ state, model: dashboardModel, row, trigger: "wizardComplete", sessionShown: ui.supportShownThisSession });
    state.uiState.justCompletedWizard = false;
  }
  if (!trigger) trigger = maybeTriggerSupportMoment({ state, model: dashboardModel, row, trigger: "firstGrossUp", sessionShown: ui.supportShownThisSession });
  if (!trigger) trigger = maybeTriggerSupportMoment({ state, model: dashboardModel, row, trigger: "firstClawback", sessionShown: ui.supportShownThisSession });
  if (trigger) {
    ui.activeSupportMoment = trigger;
    ui.supportShownThisSession = true;
    try { sessionStorage.setItem("supportMomentShown", "1"); } catch {}
    markSupportMomentShown(state.uiState, trigger);
    savePlan();
  }
  if (!ui.activeSupportMoment || isSupportDismissed(state.uiState)) {
    el.supportMomentMount.innerHTML = "";
    return;
  }
  el.supportMomentMount.innerHTML = buildSupportMomentCard(ui.activeSupportMoment);
}

function triggerSupportMoment(trigger) {
  if (!ui.lastModel) return;
  const row = getDashboardSelectedRow();
  const hit = maybeTriggerSupportMoment({
    state,
    model: ui.lastModel,
    row,
    trigger,
    sessionShown: ui.supportShownThisSession,
  });
  if (!hit) return;
  ui.activeSupportMoment = hit;
  ui.supportShownThisSession = true;
  try { sessionStorage.setItem("supportMomentShown", "1"); } catch {}
  markSupportMomentShown(state.uiState, hit);
  savePlan();
  renderDashboardSupportMoment();
}

function renderClientSummaryModeModule() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.clientSummaryModeMount || !dashboardModel) return;
  const enabled = Boolean(state.uiState.clientSummary?.enabled);
  const rows = buildYearBreakdown(state, dashboardModel);
  const phases = buildRetirementPhases(state, rows);
  const selected = getDashboardSelectedRow();
  const risks = buildRiskDiagnostics(state, dashboardModel, selected?.age || state.profile.retirementAge);
  const summary = buildClientSummaryData({
    plan: state,
    model: dashboardModel,
    selectedAge: selected?.age || state.profile.retirementAge,
    rows,
    phases,
    risks,
  });
  renderClientSummaryMode({
    mountEl: el.clientSummaryModeMount,
    enabled,
    summary,
    risks,
    selectedAge: selected?.age || state.profile.retirementAge,
    formatCurrency,
    formatPct,
    tooltipButton,
    pendingStrategyKey: ui.pendingStrategyKey,
    changeSummary: state.uiState.lastChangeSummary || null,
    prefs: state.uiState.clientSummary || {},
  });
  if (enabled) {
    renderClientSummaryProjectionChart();
    const mapMount = document.getElementById("clientSummaryIncomeMapMount");
    if (mapMount) renderIncomeMapAtMount(mapMount);
  }
  bindInlineTooltipTriggers(el.clientSummaryModeMount);
}

function renderClientSummaryProjectionChart() {
  const dashboardModel = getActiveDashboardModel();
  if (!dashboardModel) return;
  const canvas = document.getElementById("clientSummaryProjectionChart");
  const legendEl = document.getElementById("clientSummaryProjectionLegend");
  if (!canvas) return;
  const rows = dashboardModel.base.rows.slice();
  const best = dashboardModel.best.rows.slice();
  const worst = dashboardModel.worst.rows.slice();
  drawPortfolioChart({
    canvas,
    rows,
    bestRows: best,
    worstRows: worst,
    showStressBand: ui.showStressBand,
    formatCurrency,
    formatCompactCurrency,
  });
  if (legendEl) {
    const items = getBalanceLegendItems(ui.showStressBand);
    legendEl.innerHTML = items.map((item) => `
      <span class="legend-item"><span class="legend-chip" style="background:${item[1]};"></span>${item[0]}</span>
    `).join("");
  }
}

function getOasRiskLevelLocal(amount) {
  return getOasRiskLevelHelper(amount);
}

function bindInlineTooltipTriggers(container) {
  bindTooltipTriggers(container, {
    ui,
    openTooltip,
    closeTooltip,
  });
}

function handleCoverageChartPointer(event) {
  renderCoverageHover(event, {
    model: ui.lastModel,
    state,
    chartEl: el.coverageChart,
    hoverEl: el.coverageHover,
    amountForDisplay: amountForDisplayLocal,
    formatCurrency,
    clamp,
  });
}

function drawCoverageChart(model, selectedAge) {
  const dashboardPlan = getActiveDashboardPlan();
  const rows = model.base.rows.filter((row) => row.age >= state.profile.retirementAge);
  drawIncomeCoverageChart({
    canvas: el.coverageChart,
    rows,
    selectedAge,
    showTodaysDollars: ui.showTodaysDollars,
    showGrossWithdrawals: ui.showGrossWithdrawals,
    emphasizeTaxes: Boolean(state.uiState.emphasizeTaxes ?? true),
    currentYear: APP.currentYear,
    inflationRate: dashboardPlan.assumptions.inflation,
    formatCurrency,
    formatCompactCurrency,
  });
}

function amountForDisplayLocal(row, amount) {
  const dashboardPlan = getActiveDashboardPlan();
  return amountForDisplayHelper(row, amount, {
    showTodaysDollars: ui.showTodaysDollars,
    currentYear: APP.currentYear,
    inflationRate: dashboardPlan.assumptions.inflation,
  });
}

function findRowByAgeLocal(rows, age) {
  return findRowByAgeHelper(rows, age);
}

function findFirstRetirementRowLocal(rows, retirementAge) {
  return findFirstRetirementRowHelper(rows, retirementAge);
}

function renderPlanInputs() {
  if (!el.planInputsPanel) return;
  el.planInputsPanel.innerHTML = buildPlanInputsHtml({
    state,
    provinces: PROVINCES,
    selectField,
    numberField,
    riskButton,
    tooltipButton,
    toPct,
  });
}

function openPlanEditor(key) {
  ui.planEditorKey = key;
  if (!el.planEditorModal || !el.planEditorContent || !el.planEditorTitle) return;
  const config = getPlanEditorConfig(key);
  if (!config) return;
  el.planEditorTitle.textContent = config.title;
  el.planEditorContent.innerHTML = config.body;
  bindInlineTooltipTriggers(el.planEditorContent);
  el.planEditorModal.showModal();
}

function closePlanEditor() {
  ui.planEditorKey = "";
  el.planEditorModal?.close();
}

function getPlanEditorConfig(key) {
  return getPlanEditorConfigView(key, {
    state,
    provinces: PROVINCES,
    numberField,
    selectField,
    tooltipButton,
    riskButton,
    toPct,
  });
}

function renderLearn() {
  if (!el.learnPanel) return;
  const learn = state.uiState.learn;
  if (!learn) return;
  const progress = state.uiState.learningProgress || createDefaultLearningProgressLocal();
  const completed = LEARN_PROGRESS_ITEMS.filter((item) => progress[item.key]).length;
  el.learnPanel.innerHTML = buildLearnHtml({
    learn,
    progress,
    completed,
    learnProgressItems: LEARN_PROGRESS_ITEMS,
    learnNumberField,
    buildLearnCallouts,
    tooltipButton,
    toPct,
    formatNumber,
    formatCurrency,
    supportUrl: SUPPORT_URL,
    escapeHtml,
  });

  updateLearnOutputs();
}

function updateLearnOutputs() {
  updateLearnOutputsView({
    state,
    el,
    rrifMinWithdrawal: RRIF_MIN_WITHDRAWAL,
    estimateTotalTax,
    calculatePhaseWeightedSpending: calculatePhaseWeightedSpendingUi,
    drawLearnLineChart: drawLearnLineChartUi,
    drawLearnMultiLineChart: drawLearnMultiLineChartUi,
    formatCurrency,
    formatCompactCurrency,
    formatPct,
    formatNumber,
    formatSignedCurrency,
    toPct,
    clamp,
    tooltipButton,
    bindInlineTooltipTriggers,
  });
}


function renderWizard() {
  const step = clamp(state.uiState.wizardStep || 1, 1, WIZARD_STEP_COUNT);
  state.uiState.wizardStep = step;
  const progress = (step / WIZARD_STEP_COUNT) * 100;
  el.wizardProgressBar.style.width = `${progress}%`;
  el.wizardStepLabel.textContent = `Step ${step} of ${WIZARD_STEP_COUNT}`;
  el.wizardBackBtn.disabled = step === 1;
  el.wizardNextBtn.textContent = step === WIZARD_STEP_COUNT ? "See my result" : "Next";

  el.wizardBody.innerHTML = buildWizardStepHtml(step, {
    state,
    model: ui.lastModel,
    app: APP,
    provinces: PROVINCES,
    ageNow,
    numberField,
    selectField,
    riskButton,
    tooltipButton,
    toPct,
    formatCurrency,
    formatPct,
    findFirstRetirementRow: findFirstRetirementRowLocal,
    escapeHtml,
  });
}

function renderAdvanced() {
  renderAdvancedView({
    state,
    ui,
    el,
    app: APP,
    provinces: PROVINCES,
    rrifMinWithdrawal: RRIF_MIN_WITHDRAWAL,
    officialReferences: OFFICIAL_REFERENCES,
    formatCurrency,
    formatPct,
    escapeHtml,
    numberField,
    selectField,
    tooltipButton,
    strategyButton,
    accordionSection,
    renderCapitalInjectRows,
    toPct,
    applyAdvancedSearchFilter,
  });
}

function renderStress() {
  renderStressView({
    ui,
    el,
    formatCurrency,
    formatPct,
    formatSignedCurrency,
    tooltipButton,
    bindInlineTooltipTriggers,
  });
}

function renderMethodology() {
  if (!el.methodologyPanel) return;
  el.methodologyPanel.innerHTML = renderMethodologyHtml(escapeHtml);
}

function renderNotes() {
  el.notesInput.value = state.notes || "";
}

function buildNextActionsLocal(model) {
  return buildNextActionsHelper(model, state.uiState.unlocked.advanced);
}

function drawMainChart(rows, bestRows, worstRows) {
  drawPortfolioChart({
    canvas: el.mainChart,
    rows,
    bestRows,
    worstRows,
    showStressBand: ui.showStressBand,
    formatCurrency,
    formatCompactCurrency,
  });
}

function handleBalanceChartPointer(event) {
  renderBalanceHover(event, {
    model: ui.lastModel,
    chartEl: el.mainChart,
    hoverEl: el.balanceHover,
    formatCurrency,
    clamp,
  });
}

function openTooltip(key, anchor) {
  const ok = renderTooltipPopover({
    key,
    anchor,
    tooltipMap: TOOLTIPS,
    layerEl: el.tooltipLayer,
    escapeHtml,
  });
  ui.tooltipKey = ok ? key : "";
}

function closeTooltip() {
  ui.tooltipKey = "";
  clearTooltipLayer(el.tooltipLayer);
}

function openGlossary() {
  el.glossaryContent.innerHTML = renderGlossaryHtml(TOOLTIPS, escapeHtml);

  el.glossaryModal?.showModal();
}

function exportJson() {
  exportPlanJson(state, (msg) => {
    toast(msg);
    setTimeout(() => {
      toast("Saved your plan. If this saved you time, you can support the project.");
    }, 900);
  });
}

function openImportPicker() {
  promptImportPlan({
    normalizePlan: normalizePlanLocal,
    onPlanLoaded: (normalized) => {
      state = normalized;
      state.uiState.firstRun = false;
      state.uiState.hasStarted = true;
      state.uiState.activeNav = "results";
      state.uiState.dashboardScenario = "base";
      state.uiState.lastChangeSummary = null;
      ui.activeNav = "results";
      savePlan();
      renderAll();
      const message = `Imported plan: retire at ${state.profile.retirementAge}, savings ${formatCurrency(state.savings.currentTotal)}.`;
      toast(message);
      if (ui.isMobileLayout) {
        alert(message);
      }
    },
    onImportError: (message) => {
      if (ui.isMobileLayout) {
        alert(`Import error:\n${message}`);
      }
    },
    toast,
  });
}

async function importJsonFromFile() {
  await importPlanFromFileInput({
    fileInput: el.importJsonFile,
    normalizePlan: normalizePlanLocal,
    onPlanLoaded: (normalized) => {
      state = normalized;
      state.uiState.firstRun = false;
      state.uiState.hasStarted = true;
      state.uiState.activeNav = "results";
      state.uiState.dashboardScenario = "base";
      state.uiState.lastChangeSummary = null;
      ui.activeNav = "results";
      savePlan();
      renderAll();
      const message = `Imported plan: retire at ${state.profile.retirementAge}, savings ${formatCurrency(state.savings.currentTotal)}.`;
      toast(message);
      if (ui.isMobileLayout) {
        alert(message);
      }
    },
    onImportError: (message) => {
      if (ui.isMobileLayout) {
        alert(`Import error:\n${message}`);
      }
    },
    toast,
  });
}

function loadPlan() {
  try {
    return loadPlanFromStorage(APP.storageKey, normalizePlanLocal, createDefaultPlanLocal);
  } catch {
    return createDefaultPlanLocal();
  }
}

function savePlan() {
  try {
    const saved = savePlanToStorage(APP.storageKey, state);
    if (!saved) {
      toast("Could not persist this plan on this device.");
    }
  } catch {
    toast("Could not save to local storage.");
  }
}

function resetPlanToBlank() {
  const ok = confirm("Reset your local plan to a blank baseline?");
  if (!ok) return;
  state = createBlankPlanLocal();
  ui.activeNav = "plan";
  savePlan();
  renderAll();
  toast("Plan reset to a blank baseline.");
}

function shareBaseUrl() {
  const origin = window.location.origin && window.location.origin !== "null"
    ? window.location.origin
    : "https://simplekit.app/retirement-planner/";
  return `${origin}${window.location.pathname || "/"}`;
}

async function copyShare(minimal = false) {
  const url = buildShareUrl(shareBaseUrl(), state, minimal);
  const copied = await writeClipboardText(url);
  if (copied) {
    toast(minimal ? "Minimal share link copied." : "Share link copied.");
  } else {
    toast(url);
  }
}

async function copySummary() {
  const row = getDashboardSelectedRow();
  const dashboardModel = getActiveDashboardModel();
  const link = buildShareUrl(shareBaseUrl(), state, false);
  const summary = buildShareSummary({
    state,
    row,
    formatCurrency,
    formatPct,
    link,
    depletionAge: dashboardModel?.kpis?.depletionAge || null,
  });
  const copied = await writeClipboardText(summary);
  if (copied) {
    toast("Summary copied.");
  } else {
    toast("Could not copy summary.");
  }
}

function getScenarioSnapshotById(id) {
  const list = Array.isArray(state.uiState.scenarios) ? state.uiState.scenarios : [];
  return list.find((s) => s.id === id) || null;
}

async function copyScenarioShare(id = "") {
  const scenario = id ? getScenarioSnapshotById(id) : null;
  const payload = scenario ? buildScenarioPayloadFromSnapshot(scenario) : buildSharePayload(state, false);
  if (scenario) payload.sn = scenario.name || "Scenario";
  const url = buildScenarioShareUrl(shareBaseUrl(), payload);
  const copied = await writeClipboardText(url);
  if (copied) toast("Scenario share link copied.");
  else toast(url);
}

async function copyScenarioSummary() {
  const row = getDashboardSelectedRow();
  const dashboardModel = getActiveDashboardModel();
  const link = buildShareUrl(shareBaseUrl(), state, false);
  const summary = buildShareSummary({
    state,
    row,
    formatCurrency,
    formatPct,
    link,
    depletionAge: dashboardModel?.kpis?.depletionAge || null,
  });
  const copied = await writeClipboardText(summary);
  if (copied) toast("Scenario summary copied.");
  else toast("Could not copy scenario summary.");
}

async function writeClipboardText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // continue to fallback
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = String(text || "");
    ta.setAttribute("readonly", "readonly");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return !!ok;
  } catch {
    return false;
  }
}

async function resetCachedAppData() {
  const ok = confirm("Clear cached app files and reload? This is a DEV recovery action.");
  if (!ok) return;
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    toast("Cached app reset. Reloading...");
    setTimeout(() => location.reload(), 350);
  } catch {
    toast("Could not reset cached app.");
  }
}

function openScenarioCompare() {
  if (!el.scenarioCompareModal || !el.scenarioCompareContent || !ui.lastModel) return;
  const row65 = findRowByAgeLocal(ui.lastModel.base.rows, 65) || ui.lastModel.base.rows[0];
  const baseMetrics = {
    coveragePct: row65.spending > 0 ? row65.guaranteedNet / row65.spending : 1,
    netGap65: row65.netGap || 0,
    gross65: row65.withdrawal || 0,
    taxWedge65: (row65.taxOnWithdrawal || 0) + (row65.oasClawback || 0),
    clawback65: row65.oasClawback || 0,
    depletionAge: ui.lastModel.kpis.depletionAge || null,
  };
  const strategyMetrics = (ui.lastModel.strategyComparisons || []).map((s) => {
    const snap = s.snapshotsByAge?.[65] || s.snapshotsByAge?.[state.profile.retirementAge] || null;
    const snapAge = Number(snap?.age || state.profile.retirementAge || 65);
    const yearOffset = Math.max(0, snapAge - (APP.currentYear - Number(state.profile.birthYear || APP.currentYear)));
    const guaranteedGross = Number(snap?.guaranteedGross || 0);
    const guaranteedTax = state.strategy.estimateTaxes === false
      ? 0
      : estimateTotalTax(state, guaranteedGross, yearOffset);
    const guaranteedClawback = state.strategy.estimateTaxes === false || !state.strategy.oasClawbackModeling
      ? 0
      : estimateOasClawback(state, guaranteedGross, guaranteedGross > 0 ? guaranteedGross : 0, yearOffset);
    const guaranteedNet = Math.max(0, guaranteedGross - guaranteedTax - guaranteedClawback);
    const netGap = Math.max(0, (snap?.spend || 0) - guaranteedNet);
    return {
      label: s.label,
      metrics: {
        coveragePct: snap?.spend > 0 ? (guaranteedNet / snap.spend) : 1,
        netGap65: netGap,
        gross65: snap?.accountWithdrawals?.total || 0,
        taxWedge65: (snap?.tax || 0) + (snap?.clawback || 0),
        clawback65: snap?.clawback || 0,
        depletionAge: s.depletionAge || null,
      },
    };
  });

  renderScenarioCompareModal({
    mountEl: el.scenarioCompareContent,
    baseMetrics,
    strategyMetrics,
    savedScenarios: state.uiState.scenarios || [],
    formatCurrency,
    formatPct,
  });
  el.scenarioCompareModal.showModal();
}

function openPrintSummary() {
  const dashboardModel = getActiveDashboardModel();
  if (!el.printSummaryModal || !el.printSummaryContent || !dashboardModel) return;
  const rowRet = findRowByAgeLocal(dashboardModel.base.rows, state.profile.retirementAge) || dashboardModel.base.rows[0];
  const row65 = findRowByAgeLocal(dashboardModel.base.rows, 65) || rowRet;
  const row71 = findRowByAgeLocal(dashboardModel.base.rows, 71) || rowRet;
  const chartImages = capturePlannerCharts();
  const html = buildSummaryHtml({
    state,
    rowRet,
    row65,
    row71,
    model: dashboardModel,
    formatCurrency,
    formatPct,
    methodologyUrl: `${shareBaseUrl()}#methodology`,
    toolUrl: shareBaseUrl(),
    supportUrl: SUPPORT_URL,
    chartImages,
    projectionLegend: getBalanceLegendItems(ui.showStressBand),
    coverageLegend: getCoverageLegendItems(),
  });
  el.printSummaryContent.innerHTML = html;
  el.printSummaryModal.showModal();
  triggerSupportMoment("reportGenerated");
}

function printSummaryNow() {
  const dashboardModel = getActiveDashboardModel();
  if (!dashboardModel) return;
  const rowRet = findRowByAgeLocal(dashboardModel.base.rows, state.profile.retirementAge) || dashboardModel.base.rows[0];
  const row65 = findRowByAgeLocal(dashboardModel.base.rows, 65) || rowRet;
  const row71 = findRowByAgeLocal(dashboardModel.base.rows, 71) || rowRet;
  const chartImages = capturePlannerCharts();
  const html = buildSummaryHtml({
    state,
    rowRet,
    row65,
    row71,
    model: dashboardModel,
    formatCurrency,
    formatPct,
    methodologyUrl: `${shareBaseUrl()}#methodology`,
    toolUrl: shareBaseUrl(),
    supportUrl: SUPPORT_URL,
    chartImages,
    projectionLegend: getBalanceLegendItems(ui.showStressBand),
    coverageLegend: getCoverageLegendItems(),
  });
  const ok = openPrintWindow(html);
  if (!ok) toast("Could not open print window.");
  if (ok) triggerSupportMoment("reportGenerated");
}

function printClientSummaryNow() {
  const dashboardModel = getActiveDashboardModel();
  if (!dashboardModel) return;
  const rows = buildYearBreakdown(state, dashboardModel);
  const phases = buildRetirementPhases(state, rows);
  const selected = getDashboardSelectedRow();
  const risks = buildRiskDiagnostics(state, dashboardModel, selected?.age || state.profile.retirementAge);
  const summary = buildClientSummaryData({
    plan: state,
    model: dashboardModel,
    selectedAge: selected?.age || state.profile.retirementAge,
    rows,
    phases,
    risks,
  });
  if (!summary) return;
  const chartImages = captureClientSummaryCharts();
  const html = buildClientSummaryHtml({
    state,
    summary,
    risks,
    strategySuggestions: [
      { title: "Delay CPP to 70", desc: "May increase guaranteed income later and reduce later withdrawal pressure." },
      { title: "Try earlier RRSP withdrawals", desc: "Can smooth taxable income and reduce later RRIF/clawback pressure." },
      { title: "Reduce retirement spending", desc: "Sensitivity test to improve coverage ratio and longevity buffer." },
      { title: "Retire later", desc: "Adds savings years and shortens drawdown years." },
    ],
    formatCurrency,
    formatPct,
    methodologyUrl: `${shareBaseUrl()}#methodology`,
    toolUrl: shareBaseUrl(),
    supportUrl: SUPPORT_URL,
    chartImages,
  });
  const ok = openClientSummaryPrintWindow(html);
  if (!ok) {
    toast("Could not open client summary print window.");
    return;
  }
  triggerSupportMoment("reportGenerated");
}

function captureClientSummaryCharts() {
  const toDataUrl = (canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) return "";
    try {
      return canvas.toDataURL("image/png");
    } catch {
      return "";
    }
  };
  const projectionCanvas = document.getElementById("clientSummaryProjectionChart");
  const incomeMapCanvas = el.clientSummaryModeMount?.querySelector("#incomeMapCanvas")
    || document.querySelector("#clientSummaryIncomeMapMount #incomeMapCanvas");
  return {
    projection: toDataUrl(projectionCanvas),
    incomeMap: toDataUrl(incomeMapCanvas),
  };
}

function capturePlannerCharts() {
  const toDataUrl = (canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) return "";
    try {
      return canvas.toDataURL("image/png");
    } catch {
      return "";
    }
  };
  return {
    projection: toDataUrl(el.mainChart),
    coverage: toDataUrl(el.coverageChart),
  };
}

function clearSharedScenarioQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete("share");
  url.searchParams.delete("shareMin");
  if (url.hash.startsWith("#share=") || url.hash.startsWith("#shareMin=")) {
    url.hash = "";
  }
  window.history.replaceState({}, "", url.toString());
}

function isMaterialChangePath(path) {
  return (
    path.startsWith("strategy.") ||
    path.startsWith("income.cpp.") ||
    path.startsWith("income.oas.") ||
    path.startsWith("income.pension.") ||
    path.startsWith("profile.annualIncome") ||
    path.startsWith("profile.retirementAge") ||
    path.startsWith("profile.desiredSpending") ||
    path.startsWith("assumptions.")
  );
}

function clonePlan(input) {
  if (typeof structuredClone === "function") return structuredClone(input);
  return JSON.parse(JSON.stringify(input));
}

function buildStrategyPreviewPlan(currentPlan, key) {
  const next = clonePlan(currentPlan);
  if (key === "delay-cpp") {
    next.income.cpp.startAge = 70;
    if (next.profile.hasSpouse && next.income.spouse?.enabled) next.income.spouse.cppStartAge = 70;
  }
  if (key === "meltdown") {
    next.strategy.meltdownEnabled = true;
    next.strategy.meltdownAmount = Math.max(10000, Number(next.strategy.meltdownAmount || 0));
    next.strategy.meltdownStartAge = Math.min(next.profile.retirementAge, 63);
    next.strategy.meltdownEndAge = Math.max(next.strategy.meltdownStartAge + 1, 70);
  }
  if (key === "spend-down-10") {
    next.profile.desiredSpending = Math.max(12000, Number(next.profile.desiredSpending || 0) * 0.9);
  }
  if (key === "retire-later-2") {
    next.profile.retirementAge = Math.min(75, Number(next.profile.retirementAge || 65) + 2);
  }
  if (key === "save-more-5000") {
    next.savings.annualContribution = Math.max(0, Number(next.savings.annualContribution || 0) + 5000);
  }
  return next;
}

function normalizePlanLocal(input) {
  return normalizePlanSchema(input, schemaDeps);
}

function ensureValidStateLocal() {
  ensureValidStateSchema(state, schemaDeps);
}

function createDefaultPlanLocal() {
  return createDefaultPlanSchema(schemaDeps);
}

function createBlankPlanLocal() {
  return createBlankPlanSchema(schemaDeps);
}

function createDefaultLearningProgressLocal() {
  return createDefaultLearningProgressSchema(LEARN_PROGRESS_ITEMS);
}

function createDemoPlanLocal() {
  return createDemoPlanSchema(schemaDeps);
}

function createCapitalInjectItem() {
  return {
    id: createLocalId(),
    enabled: true,
    label: "Lump sum",
    amount: 50000,
    age: Math.max(state.profile.retirementAge, ageNow()),
  };
}

function renderCapitalInjectRows() {
  const items = Array.isArray(state.savings.capitalInjects) ? state.savings.capitalInjects : [];
  if (!items.length) return "<p class='muted form-span-full'>No lump-sum events added yet.</p>";

  return items.map((item, index) => `
    <div class="subsection form-span-full">
      <div class="wizard-grid compact-mobile-two">
        <label class="form-span-full inline-check">
          <input type="checkbox" data-bind="savings.capitalInjects.${index}.enabled" ${item.enabled ? "checked" : ""} />
          Include this event
        </label>
        <label>
          <span class="label-row">Event label</span>
          <input type="text" data-bind="savings.capitalInjects.${index}.label" value="${escapeHtml(item.label || "Lump sum")}" aria-label="Lump sum label" />
        </label>
        ${numberField("Amount", `savings.capitalInjects.${index}.amount`, Number(item.amount || 0), { min: 0, max: 5000000, step: 1000 }, "capitalInjectAmount", false, false, true)}
        ${numberField("Age received", `savings.capitalInjects.${index}.age`, Number(item.age || state.profile.retirementAge), { min: 45, max: 105, step: 1 }, "capitalInjectAge", false, false, true)}
      </div>
      <div class="landing-actions">
        <button type="button" class="btn btn-secondary" data-action="remove-capital-inject" data-value="${escapeHtml(item.id)}">Remove event</button>
      </div>
    </div>
  `).join("");
}

function riskButton(key) {
  const active = state.assumptions.riskProfile === key;
  return `<button type="button" class="pill-radio ${active ? "active" : ""}" data-action="risk" data-value="${key}" aria-pressed="${active}">${capitalize(key)}</button>`;
}

function strategyButton(key, label) {
  const active = state.strategy.withdrawal === key;
  return `<button type="button" class="pill-radio ${active ? "active" : ""}" data-action="strategy" data-value="${key}" aria-pressed="${active}">${label}</button>`;
}

function accordionSection(id, title, affects, content) {
  const open = !!ui.advancedOpen[id];
  return `
    <details class="accordion" data-accordion-id="${escapeHtml(id)}" ${open ? "open" : ""}>
      <summary>${escapeHtml(title)}</summary>
      <div class="accordion-content">
        <p class="what-affects"><strong>What this affects:</strong> ${escapeHtml(affects)}</p>
        ${content}
      </div>
    </details>
  `;
}

function captureAdvancedAccordionState() {
  const sections = Array.from(document.querySelectorAll("#advancedAccordion details[data-accordion-id]"));
  if (!sections.length) return;
  sections.forEach((details) => {
    const id = details.getAttribute("data-accordion-id");
    if (!id) return;
    ui.advancedOpen[id] = details.open;
  });
}

function handleDetailsToggle(event) {
  const target = event.target;
  if (!(target instanceof HTMLDetailsElement)) return;
  if (target.matches(".dashboard-detail-accordion") && target.open) {
    const group = Array.from(document.querySelectorAll(".dashboard-detail-accordion"));
    group.forEach((item) => {
      if (item instanceof HTMLDetailsElement && item !== target) item.open = false;
    });
  }
  if (!target.matches("#advancedAccordion details[data-accordion-id]")) return;
  const id = target.getAttribute("data-accordion-id");
  if (!id) return;
  ui.advancedOpen[id] = target.open;
}

function applyAdvancedSearchFilter() {
  const query = String(state.uiState.advancedSearch || "").trim().toLowerCase();
  const sections = Array.from(document.querySelectorAll("#advancedAccordion details[data-accordion-id]"));
  if (!sections.length) return;
  sections.forEach((details) => {
    const text = details.textContent?.toLowerCase() || "";
    details.hidden = query ? !text.includes(query) : false;
  });
}

function ageNow() {
  return APP.currentYear - state.profile.birthYear;
}

function setByPath(obj, path, value) {
  const keys = path.split(".");
  let ref = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!ref[key] || typeof ref[key] !== "object") ref[key] = {};
    ref = ref[key];
  }

  const finalKey = keys[keys.length - 1];

  ref[finalKey] = value;
}

function toast(message) {
  el.appToast.textContent = message;
  el.appToast.classList.add("visible");
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    el.appToast.classList.remove("visible");
  }, 2200);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {
    // ignore registration errors in local file mode
  });
}
