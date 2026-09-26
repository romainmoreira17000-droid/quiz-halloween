/** @file Illustration of the current place, behind the screens, under a dark veil that keeps the text readable. */

/** Props of PhotoBackdrop. */
export interface PhotoBackdropProps {
  /** Image file name in public/images/. */
  file: string
}

/**
 * Full-screen photo backdrop, cropped to the middle on a portrait screen.
 * @param props See PhotoBackdropProps.
 * @returns The decorative image, hidden from screen readers.
 */
export function PhotoBackdrop({ file }: PhotoBackdropProps) {
  return (
    <div className="backdrop backdrop--photo" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}images/${file}`} alt="" />
    </div>
  )
}
