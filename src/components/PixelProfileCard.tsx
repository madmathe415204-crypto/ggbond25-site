import {assetPath} from '../assetPaths';
import {profile} from '../data/siteContent';
import {AnimatedLabel} from './AnimatedLabel';
import {InteractivePanel} from './InteractivePanel';

export function PixelProfileCard() {
  return (
    <section className="section-shell reveal-section" aria-labelledby="profile-title" data-panel-index="0">
      <div className="section-heading">
        <AnimatedLabel>PLAYER DOSSIER</AnimatedLabel>
        <h2 id="profile-title">Identity Dossier</h2>
      </div>
      <InteractivePanel className="profile-card hanging-profile-card">
        <div className="profile-lanyard" aria-hidden="true" />
        <div className="profile-avatar-frame">
          <img src={assetPath('assets/images/pixel-avatar.jpg')} alt="GGBOND-25 avatar" />
        </div>
        <div className="profile-copy">
          <p className="eyebrow">MAIN ID</p>
          <h3>{profile.name}</h3>
          <p>{profile.title}</p>
          <div className="status-grid">
            {profile.status.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </InteractivePanel>
    </section>
  );
}
