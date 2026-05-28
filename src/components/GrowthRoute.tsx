import {growthRoute} from '../data/siteContent';
import {AnimatedLabel} from './AnimatedLabel';
import {InteractivePanel} from './InteractivePanel';

export function GrowthRoute() {
  return (
    <section className="section-shell reveal-section" aria-labelledby="growth-title" data-panel-index="2">
      <div className="section-heading">
        <AnimatedLabel>MISSION ROUTE</AnimatedLabel>
        <h2 id="growth-title">Growth Route</h2>
      </div>
      <div className="growth-route">
        {growthRoute.map((phase) => (
          <InteractivePanel className={`route-node ${phase.unlocked ? 'is-unlocked' : 'is-locked'}`} key={phase.phase}>
            <span className="phase-code">PHASE {phase.phase}</span>
            <h3>{phase.title}</h3>
            <p>{phase.text}</p>
          </InteractivePanel>
        ))}
      </div>
    </section>
  );
}
