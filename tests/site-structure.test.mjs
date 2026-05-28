import {existsSync, readFileSync, statSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const requiredFiles = [
  'src/data/siteContent.ts',
  'src/components/HeroIntro.tsx',
  'src/components/CursorField.tsx',
  'src/components/OpeningSubtitles.tsx',
  'src/components/PixelTrail.tsx',
  'src/components/CyberParticles.tsx',
  'src/components/LanyardScene.tsx',
  'src/components/InteractivePanel.tsx',
  'src/components/lanyard/Lanyard.css',
  'src/components/lanyard/card.glb',
  'src/components/lanyard/lanyard.png',
  'src/components/PixelProfileCard.tsx',
  'src/components/SkillStatsPanel.tsx',
  'src/components/GrowthRoute.tsx',
  'src/components/LockedProjectArchive.tsx',
  'src/components/SignalContactPanel.tsx',
  'src/components/AnimatedLabel.tsx',
  'src/styles.css',
  'public/assets/images/pixel-avatar.jpg',
  'public/assets/videos/ggbond25-intro.mp4',
  'public/assets/videos/ggbond25-scroll-background.mp4',
  'public/assets/videos/ggbond25-scroll-background-scrub.mp4',
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing required file: ${file}`);
}

assert(statSync(join(root, 'public/assets/images/pixel-avatar.jpg')).size > 0, 'Avatar asset is empty');
assert(statSync(join(root, 'public/assets/videos/ggbond25-intro.mp4')).size > 0, 'Intro video is empty');
assert(statSync(join(root, 'public/assets/videos/ggbond25-scroll-background.mp4')).size > 0, 'Scroll background video is empty');
assert(
  statSync(join(root, 'public/assets/videos/ggbond25-scroll-background-scrub.mp4')).size > 0,
  'Scrub-optimized scroll background video is empty',
);
assert(statSync(join(root, 'src/components/lanyard/card.glb')).size > 0, 'Official Lanyard model is empty');
assert(statSync(join(root, 'src/components/lanyard/lanyard.png')).size > 0, 'Official Lanyard texture is empty');

const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const hero = readFileSync(join(root, 'src/components/HeroIntro.tsx'), 'utf8');
const cursorField = readFileSync(join(root, 'src/components/CursorField.tsx'), 'utf8');
const openingSubtitles = readFileSync(join(root, 'src/components/OpeningSubtitles.tsx'), 'utf8');
const pixelTrail = readFileSync(join(root, 'src/components/PixelTrail.tsx'), 'utf8');
const cyberParticles = readFileSync(join(root, 'src/components/CyberParticles.tsx'), 'utf8');
const lanyard = readFileSync(join(root, 'src/components/LanyardScene.tsx'), 'utf8');
const interactivePanel = readFileSync(join(root, 'src/components/InteractivePanel.tsx'), 'utf8');
const profileCard = readFileSync(join(root, 'src/components/PixelProfileCard.tsx'), 'utf8');
const skillPanel = readFileSync(join(root, 'src/components/SkillStatsPanel.tsx'), 'utf8');
const growthPanel = readFileSync(join(root, 'src/components/GrowthRoute.tsx'), 'utf8');
const archivePanel = readFileSync(join(root, 'src/components/LockedProjectArchive.tsx'), 'utf8');
const signalPanel = readFileSync(join(root, 'src/components/SignalContactPanel.tsx'), 'utf8');
const content = readFileSync(join(root, 'src/data/siteContent.ts'), 'utf8');
const css = readFileSync(join(root, 'src/styles.css'), 'utf8');
const packageJson = readFileSync(join(root, 'package.json'), 'utf8');

for (const snippet of [
  'GGBOND-25',
  'React Bits / Remotion / AI Frontend',
  'Identity interface online',
  'TECH / FRONTEND / AI VISION',
  'My first AI-powered personal website',
  'Frontend learner',
  'AI tool explorer',
  'Motion experimenter',
  'Archive loading',
]) {
  assert(content.includes(snippet) || hero.includes(snippet), `Missing content snippet: ${snippet}`);
}

for (const dep of ['@react-three/drei', '@react-three/fiber', '@react-three/rapier', 'meshline', 'three', 'gsap', 'ogl']) {
  assert(packageJson.includes(dep), `Missing required dependency: ${dep}`);
}

for (const snippet of [
  'CursorField',
  'PixelTrail',
  'CyberParticles',
  'ggbond25-scroll-background-scrub.mp4',
  'scroll-video-background',
  'animation-stage-focus',
  'requestAnimationFrame',
  '--scroll-progress',
  '--video-drift',
  'targetVideoTime',
  'currentVideoTime',
  'videoDuration',
  'targetScrollProgress',
  'smoothScrollProgress',
  'lastSeekTime',
  'lastScrollY',
  'lastScrollDirection',
  'lastScrollMoveTime',
  'seekInterval',
  'isScrollActive',
  'scrubEase',
  'dampProgress',
  'directionalVideoTime',
  'seekEveryFrame',
  'fastSeek',
  'lastFrameTime',
  'playbackRate',
  'isScrollFieldActive',
  'startScrollFieldLoop',
  'stopScrollFieldLoop',
  'settledFrameCount',
  'window.addEventListener(\'scroll\'',
  'cursor-field',
  'pixel-cursor-trace',
  'cyber-particle-layer',
]) {
  assert(app.includes(snippet) || cursorField.includes(snippet), `Missing cursor field snippet: ${snippet}`);
}

for (const snippet of [
  'OpeningSubtitles',
  'opening-subtitles',
  'subtitle-cue',
  'This is my first AI-powered website',
  'reveal-section',
  'data-reveal-index',
]) {
  assert(app.includes(snippet) || openingSubtitles.includes(snippet) || css.includes(snippet), `Missing opening subtitle snippet: ${snippet}`);
}

for (const snippet of [
  'Canvas',
  'shaderMaterial',
  'useTrailTexture',
  'invalidate',
  'frameloop="demand"',
  'size: 256',
  'dpr={[1, 1]}',
  'window.addEventListener',
  'floor(uv * gridSize)',
  'gridSize',
  'trailSize',
  'maxAge',
  'pixel-canvas',
]) {
  assert(pixelTrail.includes(snippet), `Missing React Bits PixelTrail behavior: ${snippet}`);
}

for (const snippet of [
  'Renderer',
  'Camera',
  'Geometry',
  'Program',
  'Mesh',
  'particleCount',
  'particleSpread',
  'moveParticlesOnHover',
  'particleColors',
  'targetFrameInterval',
  'lastRenderTime',
  'shouldRenderParticles',
  'particlesFrameTimer',
  'window.setTimeout',
  'window.clearTimeout',
  'document.hidden',
  'particles-container',
]) {
  assert(cyberParticles.includes(snippet), `Missing React Bits Particles behavior: ${snippet}`);
}

for (const snippet of [
  'LanyardScene',
  'onUnlock',
  'isUnlocked',
  'onDragChange',
  'onPullProgressChange',
  '--pull-progress',
  'lanyard-key-unlock',
  'DRAG THE BADGE DOWN',
  'Pull the badge downward to unlock the interface',
  'aria-label',
]) {
  assert(hero.includes(snippet), `Missing lanyard boot flow snippet: ${snippet}`);
}

for (const forbiddenHeroSnippet of [
  'dragStartY',
  'event.clientY - dragStartY',
  'onPointerDown={startBadgePull}',
  'onPointerMove={updateBadgePull}',
  'onPointerUp={stopBadgePull}',
]) {
  assert(!hero.includes(forbiddenHeroSnippet), `Outer badge shell should not simulate React Bits dragging: ${forbiddenHeroSnippet}`);
}

for (const snippet of [
  'Canvas',
  'Physics',
  'Environment',
  'Lightformer',
  'meshPhysicalMaterial',
  'useRopeJoint',
  'useSphericalJoint',
  'card.glb',
  'lanyard.png',
  'setPointerCapture',
  'onLostPointerCapture',
  'onPointerCancel',
  'window.addEventListener',
  'setNextKinematicTranslation',
  'maxHangingReach',
  'downwardUnlockDistance',
  'fixedPoint.y - nextCardPosition.y',
  'false | THREE.Vector3',
  'initialBandPoints',
  'toFiniteBandPoints',
  'validBandPoints',
  'finiteRigidBodyVector',
  'safeSetBandPoints',
  'lastValidBandPoints',
  'Number.isFinite',
  'lerp',
  'Pull downward to unlock',
  '<meshLineMaterial',
  'map={texture}',
  'repeat={[-4, 1]}',
  'useMap',
  'lineWidth={1}',
]) {
  assert(lanyard.includes(snippet), `Missing official React Bits lanyard snippet: ${snippet}`);
}

for (const forbiddenLanyardSnippet of [
  'lanyard-visual-strap',
  'lanyard-visual-strap-left',
  'lanyard-visual-strap-right',
  'dragVelocity',
  'setLinvel',
]) {
  assert(!lanyard.includes(forbiddenLanyardSnippet), `Lanyard should use real React Bits rope/drag behavior, not fallback code: ${forbiddenLanyardSnippet}`);
}

for (const snippet of [
  'InteractivePanel',
  'gsap',
  'useRef',
  'isPanelAnimating',
  'startPanelAnimation',
  'stopPanelAnimation',
  'idleFrameCount',
  'settleThreshold',
  'onPointerMove',
  '--pointer-x',
  '--pointer-y',
  '--decay-x',
  '--decay-y',
  '--decay-rotate-x',
  '--decay-rotate-y',
  'movementBound',
  'maxDisplacement',
  'filterId',
  'decay-card',
  'decay-card-content',
  'decay-card-displacement-map',
  '--rotate-x',
  '--rotate-y',
  'spotlight-card',
]) {
  assert(interactivePanel.includes(snippet), `Missing interactive panel behavior: ${snippet}`);
}

for (const [label, source] of [
  ['profile card', profileCard],
  ['skill panel', skillPanel],
  ['growth route', growthPanel],
  ['project archive', archivePanel],
  ['signal panel', signalPanel],
]) {
  assert(source.includes('InteractivePanel'), `Missing InteractivePanel usage in ${label}`);
}

for (const [label, source] of [
  ['profile card', profileCard],
  ['skill panel', skillPanel],
  ['growth route', growthPanel],
  ['project archive', archivePanel],
  ['signal panel', signalPanel],
]) {
  assert(source.includes('data-panel-index'), `Missing panel index in ${label}`);
}

for (const snippet of ['onUnlock', 'isUnlocked', 'locked-content', 'site-content', "? 'is-unlocked'"]) {
  assert(hero.includes(snippet) || app.includes(snippet), `Missing unlock flow snippet: ${snippet}`);
}

for (const snippet of [
  'IntersectionObserver',
  'reveal-section',
  'is-visible',
  'is-cutting-out',
  'scroll-story-panel',
  'opening-subtitles',
  'subtitle-cue',
  'subtitle-cue.is-visible',
  'subtitle-cue.is-cutting-out',
  'story-panel-rail',
  'data-reveal-index',
]) {
  assert(app.includes(snippet) || css.includes(snippet), `Missing scroll reveal snippet: ${snippet}`);
}

for (const component of [
  'CursorField',
  'OpeningSubtitles',
  'HeroIntro',
  'PixelProfileCard',
  'SkillStatsPanel',
  'GrowthRoute',
  'LockedProjectArchive',
  'SignalContactPanel',
]) {
  assert(app.includes(component), `App does not render ${component}`);
}

for (const cssSnippet of [
  'badge-boot',
  '.badge-boot {\n  position: absolute',
  'touch-action: none',
  'badge-scene-shell',
  'badge-scene-canvas',
  'lanyard-key-unlock',
  'interface-gate',
  'is-dragging',
  'is-unlocked',
  'unlock-hint',
  'locked-content',
  'hero-avatar-card',
  'interactive-panel',
  'cursor-field',
  'pixel-cursor-trace',
  'cyber-particle-layer',
  'scroll-video-background',
  'animation-stage-focus',
  'video-parallax-shade',
  'cyber-grid-overlay',
  'story-panel-rail',
  'scroll-story-panel',
  'opening-subtitles',
  'subtitle-cue',
  '--scroll-progress',
  '--video-drift',
  '--panel-side',
  '--panel-entrance-offset',
  'repeat(auto-fit, minmax(360px, 1fr))',
  'repeat(auto-fit, minmax(300px, 1fr))',
  'word-break: normal',
  'overflow-wrap: normal',
  'hyphens: none',
  'badgeDropBounce',
  'badge-boot.is-unlocked .interface-gate',
  'pixel-canvas',
  'particles-container',
  'mix-blend-mode: screen',
  'pointer-events: none',
  'spotlight-card',
  'decay-card',
  'decay-card-content',
  'decay-card-displacement-map',
  'filter: var(--decay-filter, none)',
  '--decay-x',
  '--decay-rotate-x',
  '--pointer-x',
  '--rotate-x',
]) {
  assert(css.includes(cssSnippet), `Missing CSS hook: ${cssSnippet}`);
}

assert(
  !css.includes('.hero-content {\n  width: min(100%, var(--max));\n  margin: 0 auto;\n  position: relative;\n  z-index: 2;\n  padding-right: min(42vw, 430px);\n  opacity: 0;'),
  'Hero intro copy must be visible before unlocking the interface',
);
assert(
  !css.includes('inset: -42px -84px -18px -84px;'),
  'Desktop lanyard scene should not overflow the viewport with wide negative side insets',
);

for (const forbiddenCssSnippet of [
  'lanyard-visual-strap',
  'lanyard-visual-strap-left',
  'lanyard-visual-strap-right',
]) {
  assert(!css.includes(forbiddenCssSnippet), `CSS should not render a fake lanyard strap: ${forbiddenCssSnippet}`);
}

for (const forbiddenCssSnippet of [
  '.badge-boot.is-dragging .badge-scene-shell',
  '.badge-boot.is-unlocked .badge-scene-shell',
]) {
  assert(!css.includes(forbiddenCssSnippet), `3D lanyard shell should not be moved by CSS: ${forbiddenCssSnippet}`);
}

console.log('GGBOND-25 site structure ok');
