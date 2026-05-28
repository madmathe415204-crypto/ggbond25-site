import {skills} from '../data/siteContent';
import {AnimatedLabel} from './AnimatedLabel';
import {InteractivePanel} from './InteractivePanel';

export function SkillStatsPanel() {
  return (
    <section className="section-shell reveal-section" aria-labelledby="skills-title" data-panel-index="1">
      <div className="section-heading">
        <AnimatedLabel>SKILL STATS</AnimatedLabel>
        <h2 id="skills-title">Technical Attributes</h2>
      </div>
      <div className="skill-panel">
        {skills.map((skill) => (
          <InteractivePanel className="skill-row" key={skill.label}>
            <div className="skill-row-head">
              <h3>{skill.label}</h3>
              <span>{skill.value}%</span>
            </div>
            <p>{skill.note}</p>
            <div className="skill-track" aria-hidden="true">
              <div className="skill-fill" style={{transform: `scaleX(${skill.value / 100})`}} />
            </div>
          </InteractivePanel>
        ))}
      </div>
    </section>
  );
}
