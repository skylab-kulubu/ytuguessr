/* ARTLAB robotu. Cizim skylab-kulubu/artlab-site deposundan kopyalandi
   (src/themes/2026: Sleep, Soon/Contact, Butterfly); renkler Guessr paletine cevrildi.
   Yesil accent yalniz uyanik robotun gozunde: "etkinlik suruyor" gostergesi. */

const LINE = "var(--color-muted)";
const FACE = "var(--color-ink)";
const FILL = "var(--color-canvas)";
const INNER = "var(--color-canvas-2)";
const fade = "transition-opacity duration-300";

function Butterfly({ x, y, scale = 1 }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="none"
      stroke={FACE}
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <ellipse cx="-6.3" cy="2.7" rx="6.3" ry="3.8" transform="rotate(35 -6.3 2.7)" />
      <ellipse cx="-4.5" cy="9" rx="4" ry="2.7" transform="rotate(-30 -4.5 9)" />
      <ellipse cx="6.3" cy="2.7" rx="6.3" ry="3.8" transform="rotate(-35 6.3 2.7)" />
      <ellipse cx="4.5" cy="9" rx="4" ry="2.7" transform="rotate(30 4.5 9)" />
      <path d="M0 0 Q-1.8 -4.5 -4.5 -5.4 M0 0 Q1.8 -4.5 4.5 -5.4" strokeWidth="1.1" />
      <line x1="0" y1="0" x2="0" y2="12.6" />
    </g>
  );
}

/** Uyuyan robot (bos tablo). Ustune gelince uyanir: kapsayicida `group/robot` olmali. */
export function SleepingRobot({ className }) {
  return (
    <svg width="180" height="117" viewBox="0 -14 120 78" aria-hidden="true" className={className}>
      <circle cx="60" cy="46" r="26" fill={FILL} stroke={LINE} strokeWidth="1.6" />
      <path d="M39.7 38.2 Q60 24.7 80.3 38.2" fill="none" stroke={LINE} strokeWidth="1.1" opacity="0.45" />
      {[35, 85].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="48.1" r="7.8" fill={FILL} stroke={LINE} strokeWidth="1.6" />
          <circle cx={cx} cy="48.1" r="3.4" fill="none" stroke={LINE} strokeWidth="1" opacity="0.7" />
        </g>
      ))}
      <circle cx="60" cy="48.6" r="12.2" fill={INNER} stroke={LINE} strokeWidth="1.2" />
      <path
        d="M53.2 48.6 Q60 53.8 66.8 48.6"
        fill="none"
        stroke={FACE}
        strokeWidth="1.6"
        className={`${fade} group-hover/robot:opacity-0`}
      />
      <g className={`${fade} opacity-0 group-hover/robot:opacity-100`} fill="none" stroke={FACE}>
        <circle cx="60" cy="48.6" r="8.8" strokeWidth="1.6" />
        <circle cx="60" cy="48.6" r="5.2" strokeWidth="1" opacity="0.6" />
        <circle cx="61.5" cy="47" r="2.2" fill={FACE} stroke="none" />
      </g>
      <g className="transition-transform duration-700 ease-out group-hover/robot:translate-x-[-10px] group-hover/robot:translate-y-[-8px]">
        <Butterfly x={42} y={9.5} scale={0.82} />
      </g>
      <g className={`${fade} group-hover/robot:opacity-0`}>
        <text x="94" y="16" fill="var(--color-muted)" fontSize="9">
          z
        </text>
        <text x="102" y="8" fill="var(--color-faint)" fontSize="7">
          z
        </text>
      </g>
      {[6, 94].map((x) => (
        <g key={x}>
          <rect x={x} y="52" width="20" height="12" rx="4" fill={FILL} stroke={LINE} strokeWidth="2" />
          <path d={`M${x + 6} 55 V60 M${x + 10} 55 V60 M${x + 14} 55 V60`} stroke={LINE} strokeWidth="1.2" opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

/** Uyanik robot basi. active: goz yesil (etkinlik suruyor). */
export function RobotHead({ active = false, className }) {
  const eye = active ? "var(--color-accent)" : FACE;
  return (
    <svg width="92" height="52" viewBox="0 14 120 68" aria-hidden="true" className={className}>
      <g fill="none" stroke={LINE}>
        <circle cx="60" cy="48" r="30" strokeWidth="2" />
        <path d="M36.6 39 Q60 23.4 83.4 39" strokeWidth="1.4" opacity="0.45" />
        <circle cx="31.2" cy="50.4" r="9" strokeWidth="2" />
        <circle cx="31.2" cy="50.4" r="3.9" strokeWidth="1.2" opacity="0.7" />
        <circle cx="88.8" cy="50.4" r="9" strokeWidth="2" />
        <circle cx="88.8" cy="50.4" r="3.9" strokeWidth="1.2" opacity="0.7" />
      </g>
      <circle cx="60" cy="51" r="14.1" fill={INNER} stroke={LINE} strokeWidth="1.5" />
      <circle cx="60" cy="51" r="10.2" fill="none" stroke={eye} strokeWidth="2" />
      <circle cx="60" cy="51" r="6" fill="none" stroke={eye} strokeWidth="1.2" opacity="0.6" />
      <circle cx="63" cy="49" r="3" fill={eye} />
    </svg>
  );
}
