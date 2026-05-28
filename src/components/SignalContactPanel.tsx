import {contactSignals} from '../data/siteContent';
import {AnimatedLabel} from './AnimatedLabel';
import {InteractivePanel} from './InteractivePanel';

export function SignalContactPanel() {
  return (
    <section className="section-shell signal-panel reveal-section" aria-labelledby="signal-title" data-panel-index="4">
      <div className="section-heading">
        <AnimatedLabel>SIGNAL CHANNEL</AnimatedLabel>
        <h2 id="signal-title">Find GGBOND-25</h2>
      </div>
      <div className="signal-grid">
        {contactSignals.map((signal) => (
          <InteractivePanel as="div" className="signal-item" key={signal.label}>
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
          </InteractivePanel>
        ))}
      </div>
    </section>
  );
}
