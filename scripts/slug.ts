/** @file Turns an illustration file name into a URL-safe WebP name. */

/**
 * Builds the WebP file name of an image: no accent, no space, no leading article.
 * @param fileName Original name, e.g. « la table hanté.png ».
 * @returns Lower-case kebab name ending in .webp, e.g. « table-hantee.webp ».
 */
export function toWebpName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const words = base.split(/[^a-z0-9]+/).filter(Boolean)
  // « la galerie des portraits » → « galerie-des-portraits »: the article adds nothing to the name.
  if (words.length > 1 && ['le', 'la', 'les', 'l'].includes(words[0])) words.shift()
  return `${words.join('-')}.webp`
}
