export type AQLLevel = "1.0" | "1.5" | "2.5" | "4.0" | "6.5";
export type InspectionLevel = "I" | "II" | "III";

interface CodeLetterEntry {
  lotMin: number;
  lotMax: number;
  code: string;
}

interface AcceptRejectEntry {
  sampleSize: number;
  accept: number;
  reject: number;
}

export const AQL_CODE_LETTERS: Record<InspectionLevel, CodeLetterEntry[]> = {
  I: [
    { lotMin: 1, lotMax: 8, code: "A" },
    { lotMin: 9, lotMax: 15, code: "B" },
    { lotMin: 16, lotMax: 25, code: "C" },
    { lotMin: 26, lotMax: 50, code: "D" },
    { lotMin: 51, lotMax: 90, code: "E" },
    { lotMin: 91, lotMax: 150, code: "F" },
    { lotMin: 151, lotMax: 280, code: "G" },
    { lotMin: 281, lotMax: 500, code: "H" },
  ],
  II: [
    { lotMin: 1, lotMax: 8, code: "B" },
    { lotMin: 9, lotMax: 15, code: "C" },
    { lotMin: 16, lotMax: 25, code: "D" },
    { lotMin: 26, lotMax: 50, code: "E" },
    { lotMin: 51, lotMax: 90, code: "F" },
    { lotMin: 91, lotMax: 150, code: "G" },
    { lotMin: 151, lotMax: 280, code: "H" },
    { lotMin: 281, lotMax: 500, code: "J" },
  ],
  III: [
    { lotMin: 1, lotMax: 8, code: "C" },
    { lotMin: 9, lotMax: 15, code: "D" },
    { lotMin: 16, lotMax: 25, code: "E" },
    { lotMin: 26, lotMax: 50, code: "F" },
    { lotMin: 51, lotMax: 90, code: "G" },
    { lotMin: 91, lotMax: 150, code: "H" },
    { lotMin: 151, lotMax: 280, code: "J" },
    { lotMin: 281, lotMax: 500, code: "K" },
  ],
};

export const AQL_ACCEPT_REJECT: Record<string, Partial<Record<AQLLevel, AcceptRejectEntry>>> = {
  A: { "2.5": { sampleSize: 2, accept: 0, reject: 1 } },
  B: { "2.5": { sampleSize: 3, accept: 0, reject: 1 } },
  C: { "2.5": { sampleSize: 5, accept: 0, reject: 1 } },
  D: { "2.5": { sampleSize: 8, accept: 0, reject: 1 } },
  E: { "2.5": { sampleSize: 13, accept: 1, reject: 2 } },
  F: { "2.5": { sampleSize: 20, accept: 1, reject: 2 } },
  G: { "2.5": { sampleSize: 32, accept: 2, reject: 3 } },
  H: { "2.5": { sampleSize: 50, accept: 3, reject: 4 } },
  J: { "2.5": { sampleSize: 80, accept: 5, reject: 6 } },
  K: { "2.5": { sampleSize: 125, accept: 7, reject: 8 } },
};

