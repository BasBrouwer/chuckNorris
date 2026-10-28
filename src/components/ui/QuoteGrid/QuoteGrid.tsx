import type { ReactNode } from "react";

import "./QuoteGrid.css";

export function QuoteGrid({ children }: { children: ReactNode }) {
  return <ul className="quote-grid">{children}</ul>;
}
