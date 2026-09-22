/**
 * @file Big padlock seen in cross-section: one pin per step drops below the shear line when its digit
 * is found, lighting its slot; once every pin is down the shackle frees itself. Motion lives in lock.css.
 */

/** Props of CutawayLock. */
export interface CutawayLockProps {
  /** Number of steps, i.e. pins. */
  total: number
  /** Digits found so far, in step order: their pins are down. */
  foundDigits: number[]
  /** Pin that falls right now (the digit just earned); the other found pins are drawn already down. */
  fallingIndex?: number
}

/** Inner chamber of the lock body, in viewBox units. */
const CHAMBER = { x: 44, y: 122, width: 212, height: 78 }
/** Where the pins must go below for the shackle to move. */
const SHEAR_LINE_Y = 152
const PIN_HEIGHT = 36
const RIVETS = [[39, 118], [261, 118], [39, 234], [261, 234]]

/** @returns The French description read by screen readers. */
function lockLabel(total: number, down: number): string {
  if (down >= total) return 'Cadenas ouvert : toutes les goupilles sont tombées'
  return `Cadenas : ${down} ${down > 1 ? 'goupilles tombées' : 'goupille tombée'} sur ${total}`
}

/** @returns Class names of pin `i`. */
function pinClass(i: number, down: number, fallingIndex: number | undefined): string {
  if (i >= down) return 'lock-pin'
  return i === fallingIndex ? 'lock-pin lock-pin--down lock-pin--falling' : 'lock-pin lock-pin--down'
}

/** Metal gradients, with ids of their own (the backdrops have theirs). */
function LockGradients() {
  return (
    <defs>
      <linearGradient id="lock-steel" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4a4f55" /><stop offset=".45" stopColor="#c3c8cc" /><stop offset="1" stopColor="#3f444a" />
      </linearGradient>
      <linearGradient id="lock-brass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6d4e24" /><stop offset=".5" stopColor="#d2a95c" /><stop offset="1" stopColor="#4f371a" />
      </linearGradient>
      <linearGradient id="lock-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3a2c20" /><stop offset="1" stopColor="#1e1610" />
      </linearGradient>
      <linearGradient id="lock-pin" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8a6a2e" /><stop offset=".5" stopColor="#f0d28c" /><stop offset="1" stopColor="#8a6a2e" />
      </linearGradient>
      <radialGradient id="lock-glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#f2a541" stopOpacity=".5" /><stop offset="1" stopColor="#f2a541" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

/**
 * The padlock of the great hall.
 * @param props See CutawayLockProps.
 * @returns An SVG image of the lock, described in French for screen readers.
 */
export function CutawayLock({ total, foundDigits, fallingIndex }: CutawayLockProps) {
  const down = foundDigits.length
  const open = down >= total
  const pitch = CHAMBER.width / total
  // Pins stay readable with few steps and never touch each other with many.
  const pinWidth = Math.max(4, Math.min(22, pitch - 8))
  const fontSize = Math.min(30, pitch * 0.9)
  return (
    <svg className={open ? 'cutaway-lock cutaway-lock--open' : 'cutaway-lock'} viewBox="0 0 300 250"
      role="img" aria-label={lockLabel(total, down)}>
      <LockGradients />
      <ellipse cx="150" cy="165" rx="150" ry="90" fill="url(#lock-glow)" />
      <path className="lock-shackle" d="M78 116 V72 a72 72 0 0 1 144 0 V116" fill="none" stroke="url(#lock-steel)" strokeWidth="24" />
      <rect x="30" y="108" width="240" height="136" rx="22" fill="url(#lock-body)" stroke="url(#lock-brass)" strokeWidth="8" />
      {RIVETS.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="url(#lock-brass)" />)}
      <rect {...CHAMBER} rx="6" fill="#0f0a07" />
      {Array.from({ length: total }, (_, i) => {
        const x = CHAMBER.x + pitch * i
        const found = i < down
        return (
          <g key={i}>
            {found && <rect className="lock-slot-glow" x={x} y={CHAMBER.y} width={pitch} height={CHAMBER.height} fill="#f2a541" />}
            <rect className={pinClass(i, down, fallingIndex)} x={x + (pitch - pinWidth) / 2} y={CHAMBER.y + 4}
              width={pinWidth} height={PIN_HEIGHT} rx={Math.min(4, pinWidth / 2)} fill="url(#lock-pin)" />
            <text className={found ? 'lock-digit lock-digit--found' : 'lock-digit'} x={x + pitch / 2} y="232"
              fontSize={fontSize} textAnchor="middle">
              {found ? foundDigits[i] : '·'}
            </text>
          </g>
        )
      })}
      <line x1={CHAMBER.x} y1={SHEAR_LINE_Y} x2={CHAMBER.x + CHAMBER.width} y2={SHEAR_LINE_Y}
        stroke="#c9a26b" strokeOpacity=".35" strokeDasharray="4 4" />
      <rect {...CHAMBER} rx="6" fill="none" stroke="#000" strokeOpacity=".6" strokeWidth="3" />
    </svg>
  )
}
