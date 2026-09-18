import Loom from './Loom';

/** Server Component. Copy is verbatim from design-reference/index.html. */
export default function Hero() {
  return (
    <header className="hero" id="top">
      <Loom />

      <div className="hero-in">
        <p className="hero-kicker">
          <span className="kicker-since">卍&ensp;SINCE 1970&ensp;卍</span>
          <span className="kicker-loc">MANIK CHOWK, JHANSI</span>
        </p>
        <h1 className="hero-title">MVB</h1>
        <p className="hero-name">Mahesh Vastra Bhandar</p>
        <p className="hero-sub">
          Handpicked lehengas, sarees, suits and gowns — woven for the woman you
          are today, at every age and every chapter.
        </p>
        <div className="hero-acts">
          <a className="btn btn-gold" href="#lehengas">
            Browse the collections
          </a>
          <a className="btn btn-ghost" href="#enquire">
            Talk to our stylist
          </a>
        </div>
      </div>

      <div className="scroll-cue">
        SCROLL
        <span />
      </div>
    </header>
  );
}
