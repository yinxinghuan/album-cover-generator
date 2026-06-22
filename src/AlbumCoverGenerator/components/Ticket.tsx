// Common ticket shell — black die-cut card with scalloped top/bottom edges
// and a perforation divider line midway. Children provide content.

import React from 'react';
import { t } from '../i18n';

interface FooterAction {
  label: string;
  onClick: () => void;
}

interface Props {
  topLabel: string;
  catalog?: string;
  children: React.ReactNode;
  /** Hero footer text at the very bottom of the ticket. Default = brand. */
  footerHero?: string;
  /** If provided, the footer hero becomes a button that runs this on tap. */
  onFooterHeroClick?: () => void;
  /** 'forward' (default) shows arrow on right, 'back' on left. */
  footerHeroDirection?: 'forward' | 'back';
  /** Optional secondary action shown on the left of the foot (e.g. WALL). */
  footerLeftAction?: FooterAction;
  /** Optional className extension. */
  className?: string;
}

export default function Ticket({
  topLabel,
  catalog,
  children,
  footerHero,
  onFooterHeroClick,
  footerHeroDirection = 'forward',
  footerLeftAction,
  className = '',
}: Props) {
  return (
    <article className={`acg-ticket ${className}`}>
      <header className="acg-ticket__head">
        <img
          className="acg-ticket__mark"
          src={`${import.meta.env.BASE_URL}alteru.svg`}
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
        <footer className={`acg-ticket__foot ${onFooterHeroClick ? 'is-interactive' : ''}`}>
          {onFooterHeroClick ? (
            <button
              type="button"
              className="acg-ticket__foot-hero acg-ticket__foot-hero--btn"
              onPointerDown={onFooterHeroClick}
            >
              {footerHeroDirection === 'back' && (
                <svg viewBox="0 0 24 12" width={26} height={13} aria-hidden
                     className="acg-ticket__foot-arrow">
                  <path d="M 24 6 H 3 M 9 0 L 2 6 L 9 12"
                        stroke="currentColor" strokeWidth="2.4"
                        fill="none" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
              )}
              <span className="acg-ticket__foot-hero-label">{footerHero}</span>
              {footerHeroDirection === 'forward' && (
                <svg viewBox="0 0 24 12" width={26} height={13} aria-hidden
                     className="acg-ticket__foot-arrow">
                  <path d="M 0 6 H 21 M 15 0 L 22 6 L 15 12"
                        stroke="currentColor" strokeWidth="2.4"
                        fill="none" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
              )}
            </button>
          ) : (
            <div className="acg-ticket__foot-hero">{footerHero}</div>
          )}
          <div className="acg-ticket__foot-mark">
            {footerLeftAction ? (
              <button
                type="button"
                className="acg-ticket__foot-action"
                onPointerDown={footerLeftAction.onClick}
              >
                <svg viewBox="0 0 30 26" width={14} height={12} aria-hidden
                     fill="none" stroke="currentColor" strokeWidth={2}
                     strokeLinecap="square" strokeLinejoin="miter">
                  <line x1="9"  y1="4" x2="9"  y2="11" />
                  <line x1="15" y1="2" x2="15" y2="11" />
                  <line x1="21" y1="4" x2="21" y2="11" />
                  <rect x="2" y="11" width="26" height="13" />
                  <line x1="6" y1="18" x2="24" y2="18" />
                </svg>
                {footerLeftAction.label}
              </button>
            ) : (
              <span className="acg-ticket__brand">{t('brand')}</span>
            )}
            <span className="acg-ticket__mono">{t('brand_mark')}</span>
          </div>
        </footer>
      )}
    </article>
  );
}
