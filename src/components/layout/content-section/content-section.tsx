import { useId } from "react";
import type { ReactNode } from "react";

import "./content-section.css";

interface ContentSectionProps {
  title: string;
  /** Highlighted figure under the title, e.g. "3 / 10 saved". */
  metaAccent?: string | undefined;
  /** Quieter note after the figure, separated by a divider. */
  metaNote?: string | undefined;
  /** Right-aligned header content, e.g. controls. */
  aside?: ReactNode;
  children: ReactNode;
}

export function ContentSection({
  title,
  metaAccent,
  metaNote,
  aside,
  children,
}: ContentSectionProps) {
  const titleId = useId();
  const hasMeta = metaAccent !== undefined || metaNote !== undefined;

  return (
    <section className="content-section" aria-labelledby={titleId}>
      <div className="content-section__header">
        <div>
          <h2 id={titleId} className="content-section__title">
            {title}
          </h2>
          {/* Always rendered so the header keeps its height while there is no meta. */}
          <p className="content-section__meta" aria-hidden={!hasMeta}>
            {hasMeta ? (
              <>
                {metaAccent === undefined ? null : (
                  <span className="content-section__meta-accent">{metaAccent}</span>
                )}
                {metaNote === undefined ? null : (
                  <span className="content-section__meta-note">{metaNote}</span>
                )}
              </>
            ) : (
              "\u00a0"
            )}
          </p>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
