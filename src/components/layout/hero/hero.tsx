import "./hero.css";

interface HeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function Hero({ eyebrow, title, description }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__content">
          <p className="hero__eyebrow">{eyebrow}</p>
          <h1 className="hero__title">{title}</h1>
          <p className="hero__description">{description}</p>
        </div>
      </div>
    </section>
  );
}
