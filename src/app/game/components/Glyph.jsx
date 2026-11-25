/** Oyun ekraninin kucuk ikon seti: 16'lik izgara, 1.5 cizgi. */
const Svg = ({ children, className = "h-4 w-4" }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

export const Expand = (p) => (
  <Svg {...p}>
    <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9.25 6.75M2.5 13.5l4.25-4.25" />
  </Svg>
);

export const Collapse = (p) => (
  <Svg {...p}>
    <path d="M13.5 6.5h-4v-4M2.5 9.5h4v4M9.5 6.5l4-4M6.5 9.5l-4 4" />
  </Svg>
);

export const Close = (p) => (
  <Svg {...p}>
    <path d="m3.5 3.5 9 9M12.5 3.5l-9 9" />
  </Svg>
);

export const ChevronDown = (p) => (
  <Svg {...p}>
    <path d="m3.5 6 4.5 4.5L12.5 6" />
  </Svg>
);

export const ArrowRight = (p) => (
  <Svg {...p}>
    <path d="M2.5 8h11M9.5 4l4 4-4 4" />
  </Svg>
);

/** Katlanmis harita. */
export const MapFold = (p) => (
  <Svg {...p}>
    <path d="M1.75 4 5.5 2.5l5 1.5 3.75-1.5V12l-3.75 1.5-5-1.5L1.75 13.5zM5.5 2.5V12M10.5 4v9.5" />
  </Svg>
);

export const Plus = (p) => (
  <Svg {...p}>
    <path d="M8 3.5v9M3.5 8h9" />
  </Svg>
);

export const Minus = (p) => (
  <Svg {...p}>
    <path d="M3.5 8h9" />
  </Svg>
);

/** Kose cerceveleri: tum kampusu sigdir. */
export const Fit = (p) => (
  <Svg {...p}>
    <path d="M2.5 5.5v-3h3M10.5 2.5h3v3M13.5 10.5v3h-3M5.5 13.5h-3v-3" />
  </Svg>
);

/** Raptiye: haritayi acik tut. */
export const Pin = (p) => (
  <Svg {...p}>
    <path d="M5.5 2.5h5M6.5 2.5v4l-2 2.5h7l-2-2.5v-4M8 9v4.5" />
  </Svg>
);

/** Yatay surukleme ipucu. */
export const Drag = (p) => (
  <Svg {...p}>
    <path d="M1.75 8h12.5M4.5 5.25 1.75 8 4.5 10.75M11.5 5.25 14.25 8l-2.75 2.75" />
  </Svg>
);
