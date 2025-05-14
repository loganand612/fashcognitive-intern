export type AQLLevel = "1.5" | "2.5" | "4.0" | "6.5";
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
    { lotMin: 2, lotMax: 8, code: "A" },
    { lotMin: 9, lotMax: 15, code: "B" },
    { lotMin: 16, lotMax: 25, code: "C" },
    { lotMin: 26, lotMax: 50, code: "D" },
    { lotMin: 51, lotMax: 90, code: "E" },
    { lotMin: 91, lotMax: 150, code: "F" },
    { lotMin: 151, lotMax: 280, code: "G" },
    { lotMin: 281, lotMax: 500, code: "H" },
    { lotMin: 501, lotMax: 1200, code: "J" },
    { lotMin: 1201, lotMax: 3200, code: "K" },
    { lotMin: 3201, lotMax: 10000, code: "L" },
    { lotMin: 10001, lotMax: 35000, code: "M" },
  ],
  II: [
    { lotMin: 2, lotMax: 8, code: "B" },
    { lotMin: 9, lotMax: 15, code: "C" },
    { lotMin: 16, lotMax: 25, code: "D" },
    { lotMin: 26, lotMax: 50, code: "E" },
    { lotMin: 51, lotMax: 90, code: "F" },
    { lotMin: 91, lotMax: 150, code: "G" },
    { lotMin: 151, lotMax: 280, code: "H" },
    { lotMin: 281, lotMax: 500, code: "J" },
    { lotMin: 501, lotMax: 1200, code: "K" },
    { lotMin: 1201, lotMax: 3200, code: "L" },
    { lotMin: 3201, lotMax: 10000, code: "M" },
    { lotMin: 10001, lotMax: 35000, code: "N" },
  ],
  III: [
    { lotMin: 2, lotMax: 8, code: "C" },
    { lotMin: 9, lotMax: 15, code: "D" },
    { lotMin: 16, lotMax: 25, code: "E" },
    { lotMin: 26, lotMax: 50, code: "F" },
    { lotMin: 51, lotMax: 90, code: "G" },
    { lotMin: 91, lotMax: 150, code: "H" },
    { lotMin: 151, lotMax: 280, code: "J" },
    { lotMin: 281, lotMax: 500, code: "K" },
    { lotMin: 501, lotMax: 1200, code: "L" },
    { lotMin: 1201, lotMax: 3200, code: "M" },
    { lotMin: 3201, lotMax: 10000, code: "N" },
    { lotMin: 10001, lotMax: 35000, code: "P" },
  ],
};

export const AQL_ACCEPT_REJECT: Record<string, Partial<Record<AQLLevel, AcceptRejectEntry>>> = {
  A: {
    "1.5": { sampleSize: 2, accept: 0, reject: 1 },
    "2.5": { sampleSize: 2, accept: 0, reject: 1 },
    "4.0": { sampleSize: 2, accept: 0, reject: 1 },
    "6.5": { sampleSize: 2, accept: 0, reject: 1 }
  },
  B: {
    "1.5": { sampleSize: 3, accept: 0, reject: 1 },
    "2.5": { sampleSize: 3, accept: 0, reject: 1 },
    "4.0": { sampleSize: 3, accept: 0, reject: 1 },
    "6.5": { sampleSize: 3, accept: 0, reject: 1 }
  },
  C: {
    "1.5": { sampleSize: 5, accept: 0, reject: 1 },
    "2.5": { sampleSize: 5, accept: 0, reject: 1 },
    "4.0": { sampleSize: 5, accept: 0, reject: 1 },
    "6.5": { sampleSize: 5, accept: 0, reject: 1 }
  },
  D: {
    "1.5": { sampleSize: 8, accept: 0, reject: 1 },
    "2.5": { sampleSize: 8, accept: 0, reject: 1 },
    "4.0": { sampleSize: 8, accept: 1, reject: 2 },
    "6.5": { sampleSize: 8, accept: 1, reject: 2 }
  },
  E: {
    "1.5": { sampleSize: 13, accept: 0, reject: 1 },
    "2.5": { sampleSize: 13, accept: 1, reject: 2 },
    "4.0": { sampleSize: 13, accept: 1, reject: 2 },
    "6.5": { sampleSize: 13, accept: 2, reject: 3 }
  },
  F: {
    "1.5": { sampleSize: 20, accept: 0, reject: 1 },
    "2.5": { sampleSize: 20, accept: 1, reject: 2 },
    "4.0": { sampleSize: 20, accept: 1, reject: 2 },
    "6.5": { sampleSize: 20, accept: 3, reject: 4 }
  },
  G: {
    "1.5": { sampleSize: 32, accept: 1, reject: 2 },
    "2.5": { sampleSize: 32, accept: 2, reject: 3 },
    "4.0": { sampleSize: 32, accept: 3, reject: 4 },
    "6.5": { sampleSize: 32, accept: 5, reject: 6 }
  },
  H: {
    "1.5": { sampleSize: 50, accept: 2, reject: 3 },
    "2.5": { sampleSize: 50, accept: 3, reject: 4 },
    "4.0": { sampleSize: 50, accept: 5, reject: 6 },
    "6.5": { sampleSize: 50, accept: 7, reject: 8 }
  },
  J: {
    "1.5": { sampleSize: 80, accept: 3, reject: 4 },
    "2.5": { sampleSize: 80, accept: 5, reject: 6 },
    "4.0": { sampleSize: 80, accept: 7, reject: 8 },
    "6.5": { sampleSize: 80, accept: 10, reject: 11 }
  },
  K: {
    "1.5": { sampleSize: 125, accept: 5, reject: 6 },
    "2.5": { sampleSize: 125, accept: 7, reject: 8 },
    "4.0": { sampleSize: 125, accept: 10, reject: 11 },
    "6.5": { sampleSize: 125, accept: 14, reject: 15 }
  },
  L: {
    "1.5": { sampleSize: 200, accept: 7, reject: 8 },
    "2.5": { sampleSize: 200, accept: 10, reject: 11 },
    "4.0": { sampleSize: 200, accept: 14, reject: 15 },
    "6.5": { sampleSize: 200, accept: 21, reject: 22 }
  },
  M: {
    "1.5": { sampleSize: 315, accept: 10, reject: 11 },
    "2.5": { sampleSize: 315, accept: 14, reject: 15 },
    "4.0": { sampleSize: 315, accept: 21, reject: 22 },
    "6.5": { sampleSize: 315, accept: 21, reject: 22 }
  }
};

