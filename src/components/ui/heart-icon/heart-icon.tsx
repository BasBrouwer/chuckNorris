interface HeartIconProps {
  /** Solid heart (favorited) instead of an outline. */
  filled?: boolean;
}

/** Decorative: always pair it with a text label on the surrounding control. */
export function HeartIcon({ filled = false }: HeartIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-8-5.6-8-11.2A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 8 2.8C20 15.4 12 21 12 21z" />
    </svg>
  );
}
