import { Link } from "@tanstack/react-router";

import "./SiteHeader.css";

interface SiteHeaderProps {
  favoritesCount: number;
}

export function SiteHeader({ favoritesCount }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__brand">
          <span className="site-header__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M13.5 2 5 13.5h5.5L9.5 22 19 9.5h-5.8z" />
            </svg>
          </span>
          Chuckles
        </Link>

        <nav className="site-header__nav" aria-label="Primary">
          <Link to="/" activeOptions={{ exact: true }} className="site-header__link">
            Jokes
          </Link>
          <Link
            to="/favorites"
            className="site-header__link"
            aria-label={`Favorites, ${favoritesCount} saved`}
          >
            Favorites
            <span className="site-header__badge" aria-hidden="true">
              {favoritesCount}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
