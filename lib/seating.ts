/** Dynamic seating tables: a number (1..99) and how many people fit at it. */
export const DEFAULT_TABLE_CAPACITY = 10;
export const MIN_TABLE_CAPACITY = 1;
export const MAX_TABLE_CAPACITY = 30;
export const MAX_TABLE_NUMBER = 99;

export type SeatingTable = { number: number; capacity: number };

export function isValidCapacity(value: number) {
  return Number.isInteger(value) && value >= MIN_TABLE_CAPACITY && value <= MAX_TABLE_CAPACITY;
}

export function isValidTableNumber(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_TABLE_NUMBER;
}

/** First free table number, used when the admin leaves the number empty. */
export function nextFreeTableNumber(tables: readonly SeatingTable[]) {
  const used = new Set(tables.map((t) => t.number));
  for (let n = 1; n <= MAX_TABLE_NUMBER; n += 1) {
    if (!used.has(n)) return n;
  }
  return null;
}
