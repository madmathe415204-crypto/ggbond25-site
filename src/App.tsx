import {useEffect, useState} from 'react';
import {CursorField} from './components/CursorField';
import {GrowthRoute} from './components/GrowthRoute';
import {HeroIntro} from './components/HeroIntro';
import {LockedProjectArchive} from './components/LockedProjectArchive';
import {OpeningSubtitles} from './components/OpeningSubtitles';
import {PixelProfileCard} from './components/PixelProfileCard';
import {SignalContactPanel} from './components/SignalContactPanel';
import {SkillStatsPanel} from './components/SkillStatsPanel';
import './styles.css';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.reveal-section'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          target.classList.toggle('is-visible', entry.isIntersecting);
          target.classList.toggle('is-cutting-out', !entry.isIntersecting && entry.boundingClientRect.top < 0);
        });
      },
      {rootMargin: '-8% 0px -18% 0px', threshold: [0, 0.18, 0.42]},
    );

    sections.forEach((section, index) => {
      section.setAttribute('data-reveal-index', `${index}`);
      section.dataset.revealIndex = `${index}`;

      if (section.classList.contains('section-shell')) {
        const panelIndex = Number(section.dataset.panelIndex ?? index);
        section.classList.add('scroll-story-panel');
        section.style.setProperty('--panel-side', panelIndex % 2 === 0 ? '-1' : '1');
      }

      observer.observe(section);
    });

    return () => observer.disconnect();
  }, [isUnlocked]);

  return (
    <main className={isUnlocked ? 'is-unlocked' : ''}>
      <CursorField />
      <HeroIntro isUnlocked={isUnlocked} onUnlock={() => setIsUnlocked(true)} />
      <div className={`locked-content site-content story-panel-rail ${isUnlocked ? 'is-unlocked' : ''}`} aria-hidden={!isUnlocked}>
        <OpeningSubtitles />
        <PixelProfileCard />
        <SkillStatsPanel />
        <GrowthRoute />
        <LockedProjectArchive />
        <SignalContactPanel />
      </div>
    </main>
  );
}
