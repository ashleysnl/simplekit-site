(() => {
const PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
];

const DEFAULT_STATE = {
  taxYear: "2026",
  province: "ON",
  comparisonProvince: "NL",
  salaryMode: "monthly",
  salaryAmount: 5000,
  includeCpp: true,
  includeEi: true,
  compareAll: false,
};

const SAMPLE_STATE = {
  taxYear: "2026",
  province: "BC",
  comparisonProvince: "NL",
  salaryMode: "annual",
  salaryAmount: 210000,
  includeCpp: true,
  includeEi: true,
  compareAll: true,
};

const RELATED_TOOLS = [
  {
    key: "budgetPlanner",
    title: "Budget Planner",
    copy: "Turn your monthly take-home estimate into a practical spending plan.",
  },
  {
    key: "netWorthCalculator",
    title: "Net Worth Calculator",
    copy: "See how your income decisions fit into your broader financial picture.",
  },
  {
    key: "debtPayoffCalculator",
    title: "Debt Payoff Calculator",
    copy: "Use your after-tax income to plan a realistic debt repayment pace.",
  },
  {
    key: "mortgageCalculator",
    title: "Mortgage Calculator",
    copy: "Check what your estimated take-home pay could support in monthly housing costs.",
  },
];

const TAX_DATA = {
  "2025": {
    federal: {
      thresholds: [0, 57375, 114750, 177882, 253414],
      rates: [0.15, 0.205, 0.26, 0.29, 0.33],
      basicPersonalAmount: {
        min: 14538,
        max: 16316,
        phaseStart: 177882,
        phaseEnd: 253414,
      },
      quebecAbatementRate: 0.165,
    },
    cpp: {
      exemption: 3500,
      ympe: 71300,
      yampe: 81200,
      baseRate: 0.0495,
      firstAdditionalRate: 0.01,
      secondAdditionalRate: 0.04,
      label: "CPP",
    },
    qpp: {
      exemption: 3500,
      ympe: 71300,
      yampe: 81200,
      baseRate: 0.054,
      firstAdditionalRate: 0.01,
      secondAdditionalRate: 0.04,
      label: "QPP",
    },
    ei: {
      maxInsurableEarnings: 65700,
      rate: 0.0164,
      label: "EI",
    },
    eiQuebec: {
      maxInsurableEarnings: 65700,
      rate: 0.0131,
      label: "EI",
    },
    provinces: {
      AB: {
        thresholds: [0, 151234, 181481, 241974, 362961],
        rates: [0.1, 0.12, 0.13, 0.14, 0.15],
        basicPersonalAmount: { type: "flat", amount: 22161 },
      },
      BC: {
        thresholds: [0, 49279, 98560, 113158, 137407, 186306, 259829],
        rates: [0.0506, 0.077, 0.105, 0.1229, 0.147, 0.168, 0.205],
        basicPersonalAmount: { type: "flat", amount: 12432 },
      },
      MB: {
        thresholds: [0, 47000, 100000],
        rates: [0.108, 0.1275, 0.174],
        basicPersonalAmount: {
          type: "phaseout",
          max: 15780,
          phaseStart: 20000,
          phaseEnd: 20000 + (15780 - 10000) / 0.108,
          min: 10000,
        },
      },
      NB: {
        thresholds: [0, 51306, 102614, 190060],
        rates: [0.094, 0.14, 0.16, 0.195],
        basicPersonalAmount: { type: "flat", amount: 13744 },
      },
      NL: {
        thresholds: [0, 44192, 88382, 157792, 220910, 282214, 564429, 1128858],
        rates: [0.087, 0.145, 0.158, 0.178, 0.198, 0.208, 0.213, 0.218],
        basicPersonalAmount: { type: "flat", amount: 10818 },
      },
      NT: {
        thresholds: [0, 51964, 103930, 168967],
        rates: [0.059, 0.086, 0.122, 0.1405],
        basicPersonalAmount: { type: "flat", amount: 17119 },
      },
      NS: {
        thresholds: [0, 29590, 59180, 93000, 150000],
        rates: [0.0879, 0.1495, 0.1667, 0.175, 0.21],
        basicPersonalAmount: {
          type: "phaseout",
          max: 11481,
          phaseStart: 25000,
          phaseEnd: 75000,
          min: 8481,
        },
      },
      NU: {
        thresholds: [0, 54707, 109413, 177881],
        rates: [0.04, 0.07, 0.09, 0.115],
        basicPersonalAmount: { type: "flat", amount: 17925 },
      },
      ON: {
        thresholds: [0, 52886, 105775, 150000, 220000],
        rates: [0.0505, 0.0915, 0.1116, 0.1216, 0.1316],
        basicPersonalAmount: { type: "flat", amount: 12947 },
      },
      PE: {
        thresholds: [0, 32656, 64313, 105000, 140000],
        rates: [0.0965, 0.138, 0.1667, 0.18, 0.1875],
        basicPersonalAmount: { type: "flat", amount: 14250 },
      },
      QC: {
        thresholds: [0, 53255, 106495, 129590],
        rates: [0.14, 0.19, 0.24, 0.2575],
        basicPersonalAmount: { type: "flat", amount: 18571 },
      },
      SK: {
        thresholds: [0, 53463, 152750],
        rates: [0.105, 0.125, 0.145],
        basicPersonalAmount: { type: "flat", amount: 19291 },
      },
      YT: {
        thresholds: [0, 57375, 114750, 177882, 500000],
        rates: [0.064, 0.09, 0.109, 0.128, 0.15],
        basicPersonalAmount: { type: "federalLinked" },
      },
    },
  },
  "2026": {
    federal: {
      thresholds: [0, 58523, 117045, 181120, 258362],
      rates: [0.15, 0.205, 0.26, 0.29, 0.33],
      basicPersonalAmount: {
        min: 14722,
        max: 16535,
        phaseStart: 181120,
        phaseEnd: 258362,
      },
      quebecAbatementRate: 0.165,
    },
    cpp: {
      exemption: 3500,
      ympe: 72400,
      yampe: 82400,
      baseRate: 0.0495,
      firstAdditionalRate: 0.01,
      secondAdditionalRate: 0.04,
      label: "CPP",
    },
    qpp: {
      exemption: 3500,
      ympe: 72400,
      yampe: 82400,
      baseRate: 0.054,
      firstAdditionalRate: 0.01,
      secondAdditionalRate: 0.04,
      label: "QPP",
    },
    ei: {
      maxInsurableEarnings: 67700,
      rate: 0.0163,
      label: "EI",
    },
    eiQuebec: {
      maxInsurableEarnings: 67700,
      rate: 0.0128,
      label: "EI",
    },
    provinces: {
      AB: {
        thresholds: [0, 154244, 185092, 246789, 370185],
        rates: [0.1, 0.12, 0.13, 0.14, 0.15],
        basicPersonalAmount: { type: "flat", amount: 22611 },
      },
      BC: {
        thresholds: [0, 50535, 101070, 116894, 141483, 192658, 267929],
        rates: [0.0506, 0.077, 0.105, 0.1229, 0.147, 0.168, 0.205],
        basicPersonalAmount: { type: "flat", amount: 12580 },
      },
      MB: {
        thresholds: [0, 47864, 104000],
        rates: [0.108, 0.1275, 0.174],
        basicPersonalAmount: {
          type: "phaseout",
          max: 15869,
          phaseStart: 20000,
          phaseEnd: 20000 + (15869 - 10000) / 0.108,
          min: 10000,
        },
      },
      NB: {
        thresholds: [0, 52634, 105269, 194894],
        rates: [0.094, 0.14, 0.16, 0.195],
        basicPersonalAmount: { type: "flat", amount: 14032 },
      },
      NL: {
        thresholds: [0, 45700, 91400, 163800, 229800, 293500, 587000, 1174000],
        rates: [0.087, 0.145, 0.158, 0.178, 0.198, 0.208, 0.213, 0.218],
        basicPersonalAmount: { type: "flat", amount: 11132 },
      },
      NT: {
        thresholds: [0, 53424, 106851, 173205],
        rates: [0.059, 0.086, 0.122, 0.1405],
        basicPersonalAmount: { type: "flat", amount: 17415 },
      },
      NS: {
        thresholds: [0, 30000, 60000, 93000, 150000],
        rates: [0.0879, 0.1495, 0.1667, 0.175, 0.21],
        basicPersonalAmount: { type: "flat", amount: 11932 },
      },
      NU: {
        thresholds: [0, 56689, 113377, 184294],
        rates: [0.04, 0.07, 0.09, 0.115],
        basicPersonalAmount: { type: "flat", amount: 18290 },
      },
      ON: {
        thresholds: [0, 54016, 108033, 150000, 220000],
        rates: [0.0505, 0.0915, 0.1116, 0.1216, 0.1316],
        basicPersonalAmount: { type: "flat", amount: 13396 },
      },
      PE: {
        thresholds: [0, 33744, 66696, 105000, 140000],
        rates: [0.0965, 0.138, 0.1667, 0.18, 0.1875],
        basicPersonalAmount: { type: "flat", amount: 14500 },
      },
      QC: {
        thresholds: [0, 55935, 111870, 136495],
        rates: [0.14, 0.19, 0.24, 0.2575],
        basicPersonalAmount: { type: "flat", amount: 18900 },
      },
      SK: {
        thresholds: [0, 55000, 157500],
        rates: [0.105, 0.125, 0.145],
        basicPersonalAmount: { type: "flat", amount: 19700 },
      },
      YT: {
        thresholds: [0, 58523, 117045, 181120, 500000],
        rates: [0.064, 0.09, 0.109, 0.128, 0.15],
        basicPersonalAmount: { type: "federalLinked" },
      },
    },
  },
};

const selectors = {
  form: "#calculatorForm",
  taxYear: "#taxYear",
  province: "#province",
  comparisonProvince: "#comparisonProvince",
  salaryMode: "#salaryMode",
  salaryAmount: "#salaryAmount",
  salaryAmountLabel: "#salaryAmountLabel",
  salaryModeHelper: "#salaryModeHelper",
  salaryHelper: "#salaryHelper",
  comparisonHelper: "#comparisonHelper",
  includeCpp: "#includeCpp",
  includeEi: "#includeEi",
  compareAll: "#compareAll",
  resultsStatus: "#resultsStatus",
  resultCards: "#resultCards",
  monthlyNetValue: "#monthlyNetValue",
  annualNetValue: "#annualNetValue",
  annualDeductionValue: "#annualDeductionValue",
  monthlyNetCopy: "#monthlyNetCopy",
  annualNetCopy: "#annualNetCopy",
  annualDeductionCopy: "#annualDeductionCopy",
  keyTakeaway: "#keyTakeaway",
  heroPreviewNet: "#heroPreviewNet",
  heroPreviewCopy: "#heroPreviewCopy",
  cppPaidUpHeading: "#cppPaidUpHeading",
  cppPaidUpValue: "#cppPaidUpValue",
  eiPaidUpValue: "#eiPaidUpValue",
  comparisonSummary: "#comparisonSummary",
  comparisonTableBody: "#comparisonTableBody",
  shareBtn: "#shareBtn",
  shareFeedback: "#shareFeedback",
  relatedTools: "#relatedTools",
  loadSampleBtn: "#loadSampleBtn",
  resetBtn: "#resetBtn",
};

let state = { ...DEFAULT_STATE };

function $(selector) {
  return document.querySelector(selector);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function getProvinceName(code) {
  return PROVINCES.find((province) => province.code === code)?.name || code;
}

function getAnnualGrossIncome(inputState) {
  const salaryAmount = Math.max(0, Number(inputState.salaryAmount || 0));
  return inputState.salaryMode === "annual"
    ? salaryAmount
    : salaryAmount * 12;
}

function getSalaryDescription(inputState) {
  const salaryAmount = Math.max(0, Number(inputState.salaryAmount || 0));
  if (inputState.salaryMode === "annual") {
    return `${formatCurrency(salaryAmount)} per year`;
  }
  return `${formatCurrency(salaryAmount)} per month`;
}

function populateProvinceOptions() {
  const provinceField = $(selectors.province);
  const comparisonProvinceField = $(selectors.comparisonProvince);
  if (!provinceField) {
    return;
  }

  const optionsMarkup = PROVINCES.map((province) => `
    <option value="${province.code}">${province.name}</option>
  `).join("");

  provinceField.innerHTML = optionsMarkup;
  if (comparisonProvinceField) {
    comparisonProvinceField.innerHTML = optionsMarkup;
  }
}

function getFederalBasicPersonalAmount(yearConfig, income) {
  const config = yearConfig.federal.basicPersonalAmount;
  if (income <= config.phaseStart) {
    return config.max;
  }
  if (income >= config.phaseEnd) {
    return config.min;
  }

  const progress = (income - config.phaseStart) / (config.phaseEnd - config.phaseStart);
  return config.max - ((config.max - config.min) * progress);
}

function getProvinceBasicPersonalAmount(yearConfig, provinceCode, income) {
  const config = yearConfig.provinces[provinceCode].basicPersonalAmount;
  if (!config) {
    return 0;
  }

  if (config.type === "flat") {
    return config.amount;
  }

  if (config.type === "federalLinked") {
    return getFederalBasicPersonalAmount(yearConfig, income);
  }

  if (config.type === "phaseout") {
    if (income <= config.phaseStart) {
      return config.max;
    }
    if (income >= config.phaseEnd) {
      return config.min;
    }
    const progress = (income - config.phaseStart) / (config.phaseEnd - config.phaseStart);
    return config.max - ((config.max - config.min) * progress);
  }

  return 0;
}

function calculateProgressiveTax(income, thresholds, rates) {
  let total = 0;

  for (let index = 0; index < rates.length; index += 1) {
    const lower = thresholds[index];
    const upper = thresholds[index + 1] ?? Number.POSITIVE_INFINITY;
    const taxableAmount = Math.min(income, upper) - lower;

    if (taxableAmount > 0) {
      total += taxableAmount * rates[index];
    }
  }

  return total;
}

function getOntarioHealthPremium(income) {
  if (income <= 20000) return 0;
  if (income <= 25000) return (income - 20000) * 0.06;
  if (income <= 36000) return 300;
  if (income <= 38500) return 300 + ((income - 36000) * 0.06);
  if (income <= 48000) return 450;
  if (income <= 48600) return 450 + ((income - 48000) * 0.25);
  if (income <= 72000) return 600;
  if (income <= 72600) return 600 + ((income - 72000) * 0.25);
  if (income <= 200000) return 750;
  if (income <= 200600) return 750 + ((income - 200000) * 0.25);
  return 900;
}

function calculatePensionContribution(annualIncome, yearConfig, provinceCode, includeContribution) {
  const config = provinceCode === "QC" ? yearConfig.qpp : yearConfig.cpp;

  if (!includeContribution || annualIncome <= 0) {
    return {
      label: config.label,
      total: 0,
      baseOnly: 0,
      paidUpMonth: null,
      paidUpCopy: `${config.label} is turned off in your assumptions.`,
      maxContribution: calculateMaxPensionContribution(config),
    };
  }

  const firstBandIncome = clamp(Math.min(annualIncome, config.ympe) - config.exemption, 0, config.ympe - config.exemption);
  const secondBandIncome = clamp(Math.min(annualIncome, config.yampe) - config.ympe, 0, config.yampe - config.ympe);

  const baseContribution = firstBandIncome * config.baseRate;
  const firstAdditionalContribution = firstBandIncome * config.firstAdditionalRate;
  const secondAdditionalContribution = secondBandIncome * config.secondAdditionalRate;
  const total = roundCurrency(baseContribution + firstAdditionalContribution + secondAdditionalContribution);
  const maxContribution = calculateMaxPensionContribution(config);

  const monthlyIncome = annualIncome / 12;
  const monthlyFirstBandIncome = clamp(
    Math.min(monthlyIncome, config.ympe / 12) - (config.exemption / 12),
    0,
    (config.ympe - config.exemption) / 12
  );
  const monthlySecondBandIncome = clamp(
    Math.min(monthlyIncome, config.yampe / 12) - (config.ympe / 12),
    0,
    (config.yampe - config.ympe) / 12
  );
  const monthlyContribution = (monthlyFirstBandIncome * (config.baseRate + config.firstAdditionalRate))
    + (monthlySecondBandIncome * config.secondAdditionalRate);
  const paidUpMonth = estimateThresholdMonth(annualIncome, config.yampe);

  return {
    label: config.label,
    total,
    baseOnly: roundCurrency(baseContribution),
    paidUpMonth,
    paidUpCopy: buildPaidUpCopy(config.label, paidUpMonth),
    maxContribution,
  };
}

function calculateMaxPensionContribution(config) {
  const firstBandMax = clamp(config.ympe - config.exemption, 0, config.ympe - config.exemption);
  const secondBandMax = clamp(config.yampe - config.ympe, 0, config.yampe - config.ympe);
  return roundCurrency(
    (firstBandMax * config.baseRate)
      + (firstBandMax * config.firstAdditionalRate)
      + (secondBandMax * config.secondAdditionalRate)
  );
}

function calculateEiContribution(annualIncome, yearConfig, provinceCode, includeContribution) {
  const config = provinceCode === "QC" ? yearConfig.eiQuebec : yearConfig.ei;

  if (!includeContribution || annualIncome <= 0) {
    return {
      total: 0,
      paidUpMonth: null,
      paidUpCopy: `${config.label} is turned off in your assumptions.`,
      maxContribution: roundCurrency(config.maxInsurableEarnings * config.rate),
    };
  }

  const insurableIncome = Math.min(annualIncome, config.maxInsurableEarnings);
  const total = roundCurrency(insurableIncome * config.rate);
  const maxContribution = roundCurrency(config.maxInsurableEarnings * config.rate);
  const monthlyIncome = annualIncome / 12;
  const monthlyInsurableIncome = Math.min(monthlyIncome, config.maxInsurableEarnings / 12);
  const monthlyContribution = monthlyInsurableIncome * config.rate;
  const paidUpMonth = estimateThresholdMonth(annualIncome, config.maxInsurableEarnings);

  return {
    total,
    paidUpMonth,
    paidUpCopy: buildPaidUpCopy(config.label, paidUpMonth),
    maxContribution,
  };
}

function estimateThresholdMonth(annualIncome, earningsThreshold) {
  if (annualIncome <= 0 || earningsThreshold <= 0) {
    return null;
  }

  const monthlyIncome = annualIncome / 12;
  if (monthlyIncome <= 0) {
    return null;
  }

  let runningEarnings = 0;
  for (let month = 1; month <= 12; month += 1) {
    runningEarnings += monthlyIncome;
    if (runningEarnings + 0.01 >= earningsThreshold) {
      return month;
    }
  }

  return null;
}

function buildPaidUpCopy(label, paidUpMonth) {
  if (!paidUpMonth) {
    return `${label} is not expected to be fully paid within the year at this salary level.`;
  }

  const date = new Date(Date.UTC(2026, paidUpMonth - 1, 1));
  const monthName = new Intl.DateTimeFormat("en-CA", { month: "long", timeZone: "UTC" }).format(date);
  return `Under a steady salary assumption, ${label} is estimated to be fully paid around ${monthName}, so that deduction may stop after that point.`;
}

function calculateEstimate(inputState, provinceCode = inputState.province) {
  const yearConfig = TAX_DATA[inputState.taxYear] || TAX_DATA[DEFAULT_STATE.taxYear];
  const annualGrossIncome = getAnnualGrossIncome(inputState);
  const monthlyGrossIncome = annualGrossIncome / 12;

  const pension = calculatePensionContribution(annualGrossIncome, yearConfig, provinceCode, inputState.includeCpp);
  const ei = calculateEiContribution(annualGrossIncome, yearConfig, provinceCode, inputState.includeEi);
  const federalBasicPersonalAmount = getFederalBasicPersonalAmount(yearConfig, annualGrossIncome);
  const provinceBasicPersonalAmount = getProvinceBasicPersonalAmount(yearConfig, provinceCode, annualGrossIncome);

  const federalConfig = yearConfig.federal;
  const provinceConfig = yearConfig.provinces[provinceCode];

  const federalGrossTax = calculateProgressiveTax(
    annualGrossIncome,
    federalConfig.thresholds,
    federalConfig.rates
  );
  const federalCreditBase = federalBasicPersonalAmount + pension.baseOnly + ei.total;
  let estimatedFederalTax = Math.max(0, federalGrossTax - (federalCreditBase * federalConfig.rates[0]));

  if (provinceCode === "QC") {
    estimatedFederalTax *= (1 - federalConfig.quebecAbatementRate);
  }

  const provincialGrossTax = calculateProgressiveTax(
    annualGrossIncome,
    provinceConfig.thresholds,
    provinceConfig.rates
  );
  const provincialCreditBase = provinceBasicPersonalAmount + pension.baseOnly + ei.total;
  let estimatedProvincialTax = Math.max(0, provincialGrossTax - (provincialCreditBase * provinceConfig.rates[0]));

  if (provinceCode === "ON") {
    estimatedProvincialTax += getOntarioHealthPremium(annualGrossIncome);
  }

  estimatedFederalTax = roundCurrency(estimatedFederalTax);
  estimatedProvincialTax = roundCurrency(estimatedProvincialTax);

  const totalAnnualDeductions = roundCurrency(
    estimatedFederalTax + estimatedProvincialTax + pension.total + ei.total
  );
  const annualNetIncome = roundCurrency(Math.max(0, annualGrossIncome - totalAnnualDeductions));
  const monthlyNetIncome = roundCurrency(annualNetIncome / 12);
  const effectiveTaxRate = annualGrossIncome > 0 ? totalAnnualDeductions / annualGrossIncome : 0;

  return {
    provinceCode,
    provinceName: getProvinceName(provinceCode),
    annualGrossIncome: roundCurrency(annualGrossIncome),
    monthlyGrossIncome: roundCurrency(monthlyGrossIncome),
    estimatedFederalTax,
    estimatedProvincialTax,
    estimatedCpp: pension.total,
    estimatedEi: ei.total,
    totalAnnualDeductions,
    annualNetIncome,
    monthlyNetIncome,
    effectiveTaxRate,
    cppLabel: pension.label,
    cppPaidUpMonth: pension.paidUpMonth,
    cppPaidUpCopy: pension.paidUpCopy,
    eiPaidUpMonth: ei.paidUpMonth,
    eiPaidUpCopy: ei.paidUpCopy,
    yearlyNotes: [
      "Monthly salary is annualized before taxes and payroll deductions are estimated.",
      "Federal and provincial or territorial rules come from the selected tax year's data tables.",
      "CPP, QPP, and EI can stop later in the year once annual maximum employee contributions are reached.",
    ],
  };
}

function getGuidedSummary(result) {
  if (result.annualGrossIncome <= 0) {
    return "Enter a salary amount to see a clear estimate of annual deductions and monthly take-home pay.";
  }

  const provinceSummary = `${result.provinceName} uses its own provincial or territorial tax rules, so your after-tax income will not match every other jurisdiction in Canada.`;
  const capSummary = (result.cppPaidUpMonth && result.cppPaidUpMonth <= 12) || (result.eiPaidUpMonth && result.eiPaidUpMonth <= 12)
    ? "Because at least one payroll maximum is expected to be reached during the year, your net pay may increase later once that deduction stops."
    : "At this salary level, CPP or QPP and EI are not expected to be fully paid before year-end, so your monthly deductions should stay steadier through the year.";

  return `On an estimated gross salary of ${formatCurrency(result.monthlyGrossIncome)} per month, take-home pay is about ${formatCurrency(result.monthlyNetIncome)} per month in ${result.provinceName}. ${provinceSummary} ${capSummary}`;
}

function buildComparisonSummary(comparisonResults, selectedProvinceCode) {
  if (comparisonResults.length === 2) {
    const [first, second] = comparisonResults;
    const selected = comparisonResults.find((item) => item.provinceCode === selectedProvinceCode) || first;
    const other = selected.provinceCode === first.provinceCode ? second : first;
    const monthlyDifference = selected.monthlyNetIncome - other.monthlyNetIncome;
    const direction = monthlyDifference >= 0 ? "higher" : "lower";
    return `${selected.provinceName} is about ${formatCurrency(Math.abs(monthlyDifference))} per month ${direction} than ${other.provinceName} under the same salary and tax-year assumptions. This gives you a quick side-by-side view without opening the full Canada comparison.`;
  }

  const bestNet = comparisonResults.reduce((best, item) => (item.monthlyNetIncome > best.monthlyNetIncome ? item : best), comparisonResults[0]);
  const lowestDeductions = comparisonResults.reduce((best, item) => (item.totalAnnualDeductions < best.totalAnnualDeductions ? item : best), comparisonResults[0]);
  const selected = comparisonResults.find((item) => item.provinceCode === selectedProvinceCode);
  const rank = comparisonResults
    .slice()
    .sort((left, right) => right.monthlyNetIncome - left.monthlyNetIncome)
    .findIndex((item) => item.provinceCode === selectedProvinceCode) + 1;

  return `${bestNet.provinceName} currently shows the highest estimated monthly net pay at ${formatCurrency(bestNet.monthlyNetIncome)}. ${lowestDeductions.provinceName} has the lowest estimated total annual deductions at ${formatCurrency(lowestDeductions.totalAnnualDeductions)}. ${selected?.provinceName || "Your selected province"} ranks ${rank} of ${comparisonResults.length} for monthly net pay under these assumptions.`;
}

function renderResultCards(result) {
  const resultCards = $(selectors.resultCards);
  if (!resultCards) {
    return;
  }

  const cards = [
    {
      label: "Annual gross income",
      value: formatCurrency(result.annualGrossIncome),
      copy: "This is the annual salary figure used for the tax-year calculations.",
    },
    {
      label: "Federal income tax",
      value: formatCurrency(result.estimatedFederalTax),
      copy: "Estimated using the selected tax year's federal brackets and credits.",
    },
    {
      label: "Provincial or territorial tax",
      value: formatCurrency(result.estimatedProvincialTax),
      copy: `Estimated using ${escapeHtml(result.provinceName)}'s tax rules for the selected year.`,
    },
    {
      label: `${result.cppLabel} contributions`,
      value: formatCurrency(result.estimatedCpp),
      copy: `Includes pension contributions for ${result.cppLabel === "QPP" ? "Quebec" : "Canada"} based on a steady salary assumption.`,
    },
    {
      label: "EI premiums",
      value: formatCurrency(result.estimatedEi),
      copy: "EI is estimated with annual maximum employee premiums for the selected year.",
    },
    {
      label: "Effective deduction rate",
      value: formatPercent(result.effectiveTaxRate),
      copy: "A quick way to compare total deductions against gross income.",
    },
  ];

  resultCards.innerHTML = cards.map((card) => `
    <article class="result-card">
      <span class="trust-label">${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <p>${card.copy}</p>
    </article>
  `).join("");
}

function renderComparison(inputState) {
  const comparisonSummary = $(selectors.comparisonSummary);
  const comparisonTableBody = $(selectors.comparisonTableBody);

  if (!comparisonSummary || !comparisonTableBody) {
    return;
  }

  let comparisonResults;
  if (inputState.compareAll) {
    comparisonResults = PROVINCES.map((province) => calculateEstimate(inputState, province.code))
      .sort((left, right) => right.monthlyNetIncome - left.monthlyNetIncome);
  } else {
    const fallbackProvince = PROVINCES.find((province) => province.code !== inputState.province)?.code || inputState.province;
    const otherProvinceCode = inputState.comparisonProvince === inputState.province
      ? fallbackProvince
      : inputState.comparisonProvince;
    comparisonResults = [inputState.province, otherProvinceCode]
      .map((provinceCode) => calculateEstimate(inputState, provinceCode))
      .sort((left, right) => Number(right.provinceCode === inputState.province) - Number(left.provinceCode === inputState.province));
  }

  comparisonSummary.textContent = buildComparisonSummary(comparisonResults, inputState.province);
  comparisonTableBody.innerHTML = comparisonResults.map((result) => `
    <tr class="${result.provinceCode === inputState.province ? "is-selected" : ""}">
      <td>${escapeHtml(result.provinceName)}${result.provinceCode === inputState.province ? " (selected)" : ""}</td>
      <td>${escapeHtml(formatCurrency(result.monthlyNetIncome))}</td>
      <td>${escapeHtml(formatCurrency(result.annualNetIncome))}</td>
      <td>${escapeHtml(formatCurrency(result.totalAnnualDeductions / 12))}</td>
      <td>${escapeHtml(formatCurrency(result.estimatedFederalTax))}</td>
      <td>${escapeHtml(formatCurrency(result.estimatedProvincialTax))}</td>
    </tr>
  `).join("");
}

function renderRelatedTools() {
  const relatedTools = $(selectors.relatedTools);
  if (!relatedTools) {
    return;
  }

  relatedTools.innerHTML = RELATED_TOOLS.map((tool) => {
    const href = window.getSimpleKitToolUrl ? window.getSimpleKitToolUrl(tool.key) : "https://simplekit.app/tools/";
    return `
      <article class="info-card">
        <a class="tool-link-card" href="${escapeHtml(href)}">
          <span class="trust-label">SimpleKit tool</span>
          <strong>${escapeHtml(tool.title)}</strong>
          <span>${escapeHtml(tool.copy)}</span>
        </a>
      </article>
    `;
  }).join("");
}

function renderResults() {
  const result = calculateEstimate(state);
  const resultsStatus = $(selectors.resultsStatus);
  const salaryAmountLabel = $(selectors.salaryAmountLabel);
  const salaryModeHelper = $(selectors.salaryModeHelper);
  const salaryHelper = $(selectors.salaryHelper);
  const comparisonHelper = $(selectors.comparisonHelper);
  const monthlyNetValue = $(selectors.monthlyNetValue);
  const annualNetValue = $(selectors.annualNetValue);
  const annualDeductionValue = $(selectors.annualDeductionValue);
  const monthlyNetCopy = $(selectors.monthlyNetCopy);
  const annualNetCopy = $(selectors.annualNetCopy);
  const annualDeductionCopy = $(selectors.annualDeductionCopy);
  const keyTakeaway = $(selectors.keyTakeaway);
  const heroPreviewNet = $(selectors.heroPreviewNet);
  const heroPreviewCopy = $(selectors.heroPreviewCopy);
  const cppPaidUpHeading = $(selectors.cppPaidUpHeading);
  const cppPaidUpValue = $(selectors.cppPaidUpValue);
  const eiPaidUpValue = $(selectors.eiPaidUpValue);

  if (resultsStatus) {
    resultsStatus.innerHTML = `
      <strong>${escapeHtml(state.taxYear)} estimate for ${escapeHtml(result.provinceName)}</strong>
      <p class="muted">This planner starts from ${escapeHtml(getSalaryDescription(state))}, estimates income tax plus payroll deductions for the full tax year, and converts the answer back into practical monthly take-home pay.</p>
    `;
  }

  if (salaryAmountLabel) {
    salaryAmountLabel.textContent = state.salaryMode === "annual" ? "Annual gross salary" : "Monthly gross salary";
  }
  if (salaryModeHelper) {
    salaryModeHelper.textContent = state.salaryMode === "annual"
      ? "Annual salary is useful if your offer, contract, or compensation package is quoted yearly."
      : "Monthly salary is often easiest for budgeting and rent, mortgage, or cash-flow planning.";
  }
  if (salaryHelper) {
    salaryHelper.textContent = state.salaryAmount > 0
      ? "Use steady salary income for the clearest estimate. Irregular pay can change real payroll results."
      : "Enter a salary amount to calculate take-home pay, deduction timing, and province comparisons.";
  }
  if (comparisonHelper) {
    const fallbackProvince = PROVINCES.find((province) => province.code !== state.province)?.code || state.province;
    const comparisonProvinceCode = state.comparisonProvince === state.province ? fallbackProvince : state.comparisonProvince;
    comparisonHelper.textContent = state.compareAll
      ? "The comparison table is showing all provinces and territories with the same salary and tax year."
      : `The comparison table is showing ${getProvinceName(state.province)} beside ${getProvinceName(comparisonProvinceCode)}.`;
  }

  if (monthlyNetValue) {
    monthlyNetValue.textContent = formatCurrency(result.monthlyNetIncome);
  }
  if (annualNetValue) {
    annualNetValue.textContent = formatCurrency(result.annualNetIncome);
  }
  if (annualDeductionValue) {
    annualDeductionValue.textContent = formatCurrency(result.totalAnnualDeductions);
  }
  if (monthlyNetCopy) {
    monthlyNetCopy.textContent = `About ${formatCurrency(result.monthlyNetIncome)} per month after estimated federal tax, provincial or territorial tax, ${result.cppLabel}, and EI.`;
  }
  if (annualNetCopy) {
    annualNetCopy.textContent = `That is roughly ${formatCurrency(result.annualNetIncome)} in yearly after-tax income for budgeting or planning.`;
  }
  if (annualDeductionCopy) {
    annualDeductionCopy.textContent = `Estimated annual deductions equal ${formatPercent(result.effectiveTaxRate)} of gross income under these assumptions.`;
  }
  if (keyTakeaway) {
    keyTakeaway.textContent = getGuidedSummary(result);
  }
  if (heroPreviewNet) {
    heroPreviewNet.textContent = formatCurrency(result.monthlyNetIncome);
  }
  if (heroPreviewCopy) {
    heroPreviewCopy.textContent = `Estimated monthly take-home pay for ${result.provinceName} in ${state.taxYear} from ${getSalaryDescription(state)}.`;
  }
  if (cppPaidUpHeading) {
    cppPaidUpHeading.textContent = `${result.cppLabel} timing`;
  }
  if (cppPaidUpValue) {
    cppPaidUpValue.textContent = result.cppPaidUpCopy;
  }
  if (eiPaidUpValue) {
    eiPaidUpValue.textContent = result.eiPaidUpCopy;
  }

  renderResultCards(result);
  renderComparison(state);
}

function getFormState() {
  const form = $(selectors.form);
  if (!form) {
    return { ...DEFAULT_STATE };
  }

  return {
    taxYear: form.elements.taxYear.value,
    province: form.elements.province.value,
    comparisonProvince: form.elements.comparisonProvince.value,
    salaryMode: form.elements.salaryMode.value,
    salaryAmount: Math.max(0, Number(form.elements.salaryAmount.value || 0)),
    includeCpp: form.elements.includeCpp.checked,
    includeEi: form.elements.includeEi.checked,
    compareAll: form.elements.compareAll.checked,
  };
}

function setFormState(nextState) {
  state = { ...DEFAULT_STATE, ...nextState };
  const form = $(selectors.form);

  if (!form) {
    return;
  }

  form.elements.taxYear.value = state.taxYear;
  form.elements.province.value = state.province;
  form.elements.comparisonProvince.value = state.comparisonProvince;
  form.elements.salaryMode.value = state.salaryMode;
  form.elements.salaryAmount.value = state.salaryAmount;
  form.elements.includeCpp.checked = state.includeCpp;
  form.elements.includeEi.checked = state.includeEi;
  form.elements.compareAll.checked = state.compareAll;
  form.elements.comparisonProvince.disabled = state.compareAll;
}

function syncUrl() {
  const params = new URLSearchParams();
  params.set("taxYear", state.taxYear);
  params.set("province", state.province);
  params.set("comparisonProvince", state.comparisonProvince);
  params.set("salaryMode", state.salaryMode);
  params.set("salaryAmount", String(state.salaryAmount));
  params.set("includeCpp", String(state.includeCpp));
  params.set("includeEi", String(state.includeEi));
  params.set("compareAll", String(state.compareAll));
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

function restoreFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if ([...params.keys()].length === 0) {
    state = { ...DEFAULT_STATE };
    return;
  }

  state = {
    taxYear: params.get("taxYear") || DEFAULT_STATE.taxYear,
    province: params.get("province") || DEFAULT_STATE.province,
    comparisonProvince: params.get("comparisonProvince") || DEFAULT_STATE.comparisonProvince,
    salaryMode: params.get("salaryMode") || DEFAULT_STATE.salaryMode,
    salaryAmount: Math.max(0, Number(params.get("salaryAmount") || DEFAULT_STATE.salaryAmount)),
    includeCpp: (params.get("includeCpp") || String(DEFAULT_STATE.includeCpp)) === "true",
    includeEi: (params.get("includeEi") || String(DEFAULT_STATE.includeEi)) === "true",
    compareAll: (params.get("compareAll") || String(DEFAULT_STATE.compareAll)) === "true",
  };
}

function handleInput() {
  state = getFormState();
  if (state.comparisonProvince === state.province && !state.compareAll) {
    state.comparisonProvince = PROVINCES.find((province) => province.code !== state.province)?.code || state.province;
    setFormState(state);
  }
  const comparisonProvinceField = $(selectors.comparisonProvince);
  if (comparisonProvinceField) {
    comparisonProvinceField.disabled = state.compareAll;
  }
  renderResults();
  syncUrl();
}

async function copyShareLink() {
  const feedback = $(selectors.shareFeedback);
  const shareUrl = window.location.href;

  try {
    await navigator.clipboard.writeText(shareUrl);
    if (feedback) {
      feedback.textContent = "Share link copied. It keeps the current salary, province, comparison settings, and tax year.";
    }
  } catch (error) {
    if (feedback) {
      feedback.textContent = `Copy failed. Use this link manually: ${shareUrl}`;
    }
  }
}

function bindEvents() {
  const form = $(selectors.form);
  if (form) {
    form.addEventListener("input", handleInput);
    form.addEventListener("change", handleInput);
  }

  $(selectors.loadSampleBtn)?.addEventListener("click", () => {
    setFormState(SAMPLE_STATE);
    handleInput();
  });

  $(selectors.resetBtn)?.addEventListener("click", () => {
    setFormState(DEFAULT_STATE);
    handleInput();
  });

  $(selectors.shareBtn)?.addEventListener("click", copyShareLink);
}

function initialize() {
  populateProvinceOptions();
  restoreFromUrl();
  setFormState(state);
  renderRelatedTools();
  bindEvents();
  renderResults();
  syncUrl();
}

initialize();
})();
