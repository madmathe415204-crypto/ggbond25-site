import {lockedProjects} from '../data/siteContent';
import {AnimatedLabel} from './AnimatedLabel';
import {InteractivePanel} from './InteractivePanel';

export function LockedProjectArchive() {
  return (
    <section className="section-shell reveal-section" aria-labelledby="archive-title" data-panel-index="3">
      <div className="section-heading">
        <AnimatedLabel>PROJECT ARCHIVE</AnimatedLabel>
        <h2 id="archive-title">Locked Projects</h2>
      </div>
      <div className="archive-grid">
        {lockedProjects.map((project) => (
          <InteractivePanel className="locked-card" key={project.label}>
            <span className="lock-mark">LOCKED</span>
            <h3>{project.label}</h3>
            <p>{project.text}</p>
          </InteractivePanel>
        ))}
      </div>
    </section>
  );
}
