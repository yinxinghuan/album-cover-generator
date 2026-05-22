// Common ticket shell — black die-cut card with scalloped top/bottom edges
// and a perforation divider line midway. Children provide content.

import React from 'react';
import { t } from '../i18n';

interface Props {
  topLabel: string;
  catalog?: string;
  children: React.ReactNode;
  /** Hero footer text at the very bottom of the ticket. Default = brand. */
  footerHero?: string;
  /** Optional className extension. */
  className?: string;
}

export default function Ticket({ topLabel, catalog, children, footerHero, className = '' }: Props) {
  return (
    <article className={`acg-ticket ${className}`}>
      <header className="acg-ticket__head">
        <img
          className="acg-ticket__mark"
          src="/album-cover-generator/alteru.svg"
          alt="ALTERU"
          draggable={false}
          aria-hidden
        />
        <span className="acg-ticket__head-label">{topLabel}</span>
        {catalog && <span className="acg-ticket__head-cat">{catalog}</span>}
      </header>

      <div className="acg-ticket__body">
        {children}
      </div>

      {footerHero && (
        <footer className="acg-ticket__foot">
          <div className="acg-ticket__foot-hero">{footerHero}</div>
          <div className="acg-ticket__foot-mark">
            <span className="acg-ticket__brand">{t('brand')}</span>
            <span className="acg-ticket__mono">{t('brand_mark')}</span>
          </div>
        </footer>
      )}
    </article>
  );
}
