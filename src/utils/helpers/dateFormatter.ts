import { ADToBS } from "bikram-sambat-js";

export type FiscalYear = {
    id: string;
    year: string;
    vatAmount: number;
};

export const getFiscalYearFromDate = (
    adDate: string,
    fiscalYears: FiscalYear[]
) => {
    if (!adDate || fiscalYears.length === 0) return null;

    const bsDate = ADToBS(adDate);

    const [yearStr, monthStr] = bsDate.split("-");

    const bsYear = Number(yearStr);
    const bsMonth = Number(monthStr);

    const startYear = bsMonth >= 4 ? bsYear : bsYear - 1;

    const fiscalYear = `${startYear}/${String(startYear + 1).slice(-2)}`;

    console.log({
        generatedFiscalYear: fiscalYear,
        availableFiscalYears: fiscalYears.map((f) => f.year),
    });

    return fiscalYears.find(
        (fy) => fy.year.trim() === fiscalYear
    );
};
export const toRFC3339 = (dateStr: string): string => {
  if (!dateStr) return "";
 
  return `${dateStr}T00:00:00Z`;
};