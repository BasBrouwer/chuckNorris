import { Link, type LinkProps } from "@tanstack/react-router";

import "./accent-link.css";

/** A router link styled as a small uppercase call to action. */
export function AccentLink(props: LinkProps) {
  return <Link {...props} className="accent-link" />;
}
