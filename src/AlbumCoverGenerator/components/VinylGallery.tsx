// Debug-only gallery — renders every (color × finish) combination so we
// can review the palette at a glance. Reached via ?demo=gallery.

import { RealisticVinyl } from './Vinyl';
import type { VinylColor, VinylFinish } from '../types';

const COLORS: VinylColor[] = [
  'black', 'orange', 'bone', 'oxblood', 'cobalt',
  'emerald', 'fuchsia', 'amber', 'violet', 'mint', 'frosted',
];
const FINISHES: VinylFinish[] = [
  'opaque', 'translucent', 'marbled', 'splatter',
  'half', 'swirl', 'galaxy',
  'stripes', 'glitter', 'drip', 'flame',
];

export default function VinylGallery() {
  return (
    <div className="acg-gallery">
      <header className="acg-gallery__head">
        <h1>VINYL PALETTE</h1>
        <p>11 colors × 11 finishes · 121 variants</p>
      </header>
      <table className="acg-gallery__grid">
        <thead>
          <tr>
            <th></th>
            {FINISHES.map((f) => <th key={f}>{f}</th>)}
          </tr>
        </thead>
        <tbody>
          {COLORS.map((c) => (
            <tr key={c}>
              <th className="acg-gallery__row-label">{c}</th>
              {FINISHES.map((f) => (
                <td key={f}>
                  <div className="acg-gallery__cell">
                    <RealisticVinyl
                      design={{ color: c, finish: f }}
                      catalog="ALT"
                      labelStyle="full"
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
