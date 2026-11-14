import { useId, useState } from 'react';

/**
 * A tiny, honest explainer built on two facts that appear in the published abstracts: the WHO guideline
 * (below 10 µg/L) and the Bangladesh standard (50 µg/L or below). It uses ONE hypothetical reading chosen
 * by the visitor. It is not measured data and is labelled as such.
 */
export default function ThresholdExplainer() {
  const id = useId();
  const [value, setValue] = useState(30);
  const who = value < 10;
  const bd = value <= 50;
  return (
    <div className="explainer" role="group" aria-labelledby={`${id}-t`}>
      <span className="tag">Illustration · one hypothetical reading, not measured data</span>
      <h3 id={`${id}-t`}>Same well, two standards</h3>
      <p>
        The research reports results against two arsenic thresholds. Move the slider to see how one reading is judged
        by each.
      </p>
      <label htmlFor={`${id}-r`} style={{ fontWeight: 600 }}>
        Arsenic reading: <output htmlFor={`${id}-r`}>{value} µg/L</output>
      </label>
      <input id={`${id}-r`} type="range" min={0} max={120} step={1} value={value} onChange={(e) => setValue(Number(e.target.value))} />
      <div className="verdicts" aria-live="polite">
        <div className={`verdict ${who ? 'pass' : 'fail'}`}>
          <strong>WHO guideline (below 10 µg/L)</strong>
          {who ? 'Meets the guideline' : 'Does not meet the guideline'}
        </div>
        <div className={`verdict ${bd ? 'pass' : 'fail'}`}>
          <strong>Bangladesh standard (50 µg/L or below)</strong>
          {bd ? 'Meets the standard' : 'Does not meet the standard'}
        </div>
      </div>
      {who !== bd && (
        <p style={{ marginTop: '1rem' }}>
          <strong>This is why the threshold matters:</strong> at {value} µg/L the two standards disagree, so the choice of standard changes which
          wells count as safe.
        </p>
      )}
    </div>
  );
}
