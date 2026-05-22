// Debug-only demo — loops the insertion animation at 4x duration so the
// "vinyl sliding in" choreography is easy to see. Reached via ?demo=anim.

import { useEffect, useState } from 'react';
import { RealisticVinyl } from './Vinyl';
import { vinylFor } from '../utils/vinyl';

const SEEDS = ['neon|salt|sea', 'fire|glass|gold', 'velvet|moon|cold', 'burnt|map|edge'];

export default function AnimDemo() {
  const [step, setStep] = useState(0);
  // Each loop iteration remounts the vinyl with a fresh key, replaying
  // the insertion animation. Slow it down via inline style.
  useEffect(() => {
    const id = setInterval(() => setStep(s => s + 1), 3600);
    return () => clearInterval(id);
  }, []);

  const design = vinylFor(SEEDS[step % SEEDS.length]);

  return (
    <div className="acg-anim-demo">
      <header className="acg-anim-demo__head">
        <h1>INSERTION ANIMATION</h1>
        <p>720ms slowed to 3000ms · loops every 3.6s · plays once on every press</p>
      </header>
      <div className="acg-anim-demo__stage">
        <div className="acg-anim-demo__vinyl-slot" key={step}>
          <RealisticVinyl design={design} labelStyle="blank" inserting />
        </div>
      </div>
      <p className="acg-anim-demo__label">
        {design.color} · {design.finish}
      </p>
    </div>
  );
}
