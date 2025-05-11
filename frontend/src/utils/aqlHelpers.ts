import { AQL_CODE_LETTERS, AQL_ACCEPT_REJECT, AQLLevel, InspectionLevel } from "./aqlTables";

export function getAqlCodeLetter(lotSize: number, level: InspectionLevel): string | null {
  const range = AQL_CODE_LETTERS[level];
  const entry = range.find(r => lotSize >= r.lotMin && lotSize <= r.lotMax);
  return entry ? entry.code : null;
}

export function getSamplePlan(code: string, aql: AQLLevel) {
  return AQL_ACCEPT_REJECT[code]?.[aql] || null;
}
