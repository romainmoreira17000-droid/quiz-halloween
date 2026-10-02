/** @file French count with its noun: « 1 chiffre trouvé », « 3 mauvaises réponses ». */

/**
 * @param n Count.
 * @param one Noun for 0 or 1.
 * @param many Noun for 2 and more.
 * @returns e.g. "2 mauvaises réponses".
 */
export const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`
