import type {CSSProperties} from 'react';
import {useState} from 'react';
import {assetPath} from '../assetPaths';
import {profile} from '../data/siteContent';
import {AnimatedLabel} from './AnimatedLabel';
import {LanyardScene} from './LanyardScene';

type HeroIntroProps = {
  isUnlocked: boolean;
  onUnlock: () => void;
};

export function HeroIntro({isUnlocked, onUnlock}: HeroIntroProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [lanyardPullProgress, setLanyardPullProgress] = useState(0);
  const pullProgress = isUnlocked ? 1 : Math.max(isDragging ? 0.32 : 0.08, lanyardPullProgress);
  const avatarPoster = assetPath('assets/images/pixel-avatar.jpg');
  const introVideo = assetPath('assets/videos/ggbond25-intro.mp4');

  return (
    <section className={`hero-intro pixel-grid scanline ${isUnlocked ? 'is-unlocked' : ''}`} aria-labelledby="hero-title">
      <video className="hero-video" autoPlay muted loop playsInline poster={avatarPoster}>
        <source src={introVideo} type="video/mp4" />
      </video>
      <div className="hero-shade" />
      <div className="hero-content">
        <AnimatedLabel>{profile.tagline.toUpperCase()}</AnimatedLabel>
        <h1 id="hero-title">{profile.name}</h1>
        <p className="hero-title-tag">{profile.title}</p>
        <p className="hero-description">{profile.description}</p>
        <div className="chip-row" aria-label="identity tags">
          {profile.chips.map((chip) => (
            <span className="tech-chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      </div>
      <div
        className={`badge-boot ${isDragging ? 'is-dragging' : ''} ${isUnlocked ? 'is-unlocked' : ''}`}
        aria-label="Pull the badge downward to unlock the interface"
        style={{'--pull-progress': pullProgress} as CSSProperties}
      >
        <div className="interface-gate" aria-hidden="true">
          <span className="gate-panel gate-panel-left" />
          <span className="gate-panel gate-panel-right" />
        </div>
        <LanyardScene
          isUnlocked={isUnlocked}
          onUnlock={onUnlock}
          onDragChange={setIsDragging}
          onPullProgressChange={setLanyardPullProgress}
        />
        <button className="lanyard-key-unlock" disabled={isUnlocked} onClick={onUnlock} type="button">
          {isUnlocked ? 'OPEN' : 'ACCESS'}
        </button>
        <p className="unlock-hint">{isUnlocked ? 'INTERFACE OPEN' : 'DRAG THE BADGE DOWN'}</p>
      </div>
    </section>
  );
}
