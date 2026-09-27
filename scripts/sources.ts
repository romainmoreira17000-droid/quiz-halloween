/** @file Picks the source illustrations to convert, with a clear French message when there are none. */

/** Outcome of the source check: the images to convert, or why there is nothing to do. */
export type SourceImages = { ok: true; files: string[] } | { ok: false; message: string }

/**
 * Keeps the PNG and JPEG files of images-sources/.
 * @param entries File names of the folder, or null when the folder does not exist.
 * @returns The files to convert, or a message telling the animator what to do.
 */
export function pickSourceImages(entries: string[] | null): SourceImages {
  // The originals are gitignored: a fresh clone has no images-sources/ folder at all.
  if (entries === null) {
    return { ok: false, message: 'Le dossier images-sources/ est introuvable : crée-le à la racine du projet et mets-y les illustrations PNG.' }
  }
  const files = entries.filter((name) => /\.(png|jpe?g)$/i.test(name))
  if (files.length === 0) {
    return { ok: false, message: 'Le dossier images-sources/ ne contient aucune image PNG ou JPG à convertir.' }
  }
  return { ok: true, files }
}
