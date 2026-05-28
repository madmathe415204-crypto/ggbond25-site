import {gsap} from 'gsap';
import type {CSSProperties, PointerEvent, ReactNode} from 'react';
import {useEffect, useId, useRef} from 'react';

type InteractivePanelProps = {
  as?: 'article' | 'div';
  children: ReactNode;
  className?: string;
  maxDisplacement?: number;
  movementBound?: number;
};

const basePanelStyle = {
  '--pointer-x': '50%',
  '--pointer-y': '50%',
  '--rotate-x': '0deg',
  '--rotate-y': '0deg',
  '--decay-x': '0px',
  '--decay-y': '0px',
  '--decay-rotate-x': '0deg',
  '--decay-rotate-y': '0deg',
} as CSSProperties;

export function InteractivePanel({
  as = 'article',
  children,
  className = '',
  maxDisplacement = 8,
  movementBound = 12,
}: InteractivePanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const displacementMapRef = useRef<SVGFEDisplacementMapElement>(null);
  const cursorRef = useRef({x: 0.5, y: 0.5});
  const cachedCursorRef = useRef({x: 0.5, y: 0.5});
  const decayRef = useRef({x: 0, y: 0, rotateX: 0, rotateY: 0, displacementScale: 0});
  const rafIdRef = useRef(0);
  const isPanelAnimating = useRef(false);
  const idleFrameCount = useRef(0);
  const rawFilterId = useId();
  const filterId = `decay-card-displacement-${rawFilterId.replace(/:/g, '')}`;
  const settleThreshold = 0.04;
  const panelStyle = {
    ...basePanelStyle,
    '--decay-filter': `url(#${filterId})`,
  } as CSSProperties;

  const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  function stopPanelAnimation() {
    isPanelAnimating.current = false;
    idleFrameCount.current = 0;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }

    if (displacementMapRef.current) {
      gsap.set(displacementMapRef.current, {attr: {scale: '0'}});
    }
  }

  function renderPanelFrame() {
    const panel = panelRef.current;
    const displacementMap = displacementMapRef.current;

    if (!panel || !displacementMap) {
      stopPanelAnimation();
      return;
    }

    const cursor = cursorRef.current;
    const cachedCursor = cachedCursorRef.current;
    const targetX = clamp((cursor.x - 0.5) * movementBound * 2, -movementBound, movementBound);
    const targetY = clamp((cursor.y - 0.5) * movementBound * 2, -movementBound, movementBound);
    const targetRotateX = clamp((0.5 - cursor.y) * 7, -4, 4);
    const targetRotateY = clamp((cursor.x - 0.5) * 7, -4, 4);
    const cursorTravel = Math.hypot(cursor.x - cachedCursor.x, cursor.y - cachedCursor.y);

    decayRef.current.x = lerp(decayRef.current.x, targetX, 0.12);
    decayRef.current.y = lerp(decayRef.current.y, targetY, 0.12);
    decayRef.current.rotateX = lerp(decayRef.current.rotateX, targetRotateX, 0.1);
    decayRef.current.rotateY = lerp(decayRef.current.rotateY, targetRotateY, 0.1);
    decayRef.current.displacementScale = lerp(
      decayRef.current.displacementScale,
      clamp(cursorTravel * maxDisplacement * 42, 0, maxDisplacement),
      0.16,
    );

    gsap.set(panel, {
      '--decay-x': `${decayRef.current.x.toFixed(2)}px`,
      '--decay-y': `${decayRef.current.y.toFixed(2)}px`,
      '--decay-rotate-x': `${decayRef.current.rotateX.toFixed(2)}deg`,
      '--decay-rotate-y': `${decayRef.current.rotateY.toFixed(2)}deg`,
    });
    gsap.set(displacementMap, {
      attr: {scale: decayRef.current.displacementScale.toFixed(2)},
    });

    cachedCursorRef.current = {...cursor};

    const targetDistance = Math.hypot(decayRef.current.x - targetX, decayRef.current.y - targetY);
    const rotationDistance = Math.abs(decayRef.current.rotateX - targetRotateX) + Math.abs(decayRef.current.rotateY - targetRotateY);
    const isSettled =
      cursorTravel < settleThreshold &&
      targetDistance < settleThreshold &&
      rotationDistance < settleThreshold &&
      decayRef.current.displacementScale < settleThreshold;

    idleFrameCount.current = isSettled ? idleFrameCount.current + 1 : 0;

    if (idleFrameCount.current > 12) {
      stopPanelAnimation();
      return;
    }

    rafIdRef.current = requestAnimationFrame(renderPanelFrame);
  }

  function startPanelAnimation() {
    if (isPanelAnimating.current) {
      return;
    }

    isPanelAnimating.current = true;
    idleFrameCount.current = 0;
    rafIdRef.current = requestAnimationFrame(renderPanelFrame);
  }

  useEffect(() => () => stopPanelAnimation(), []);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const px = x / rect.width;
    const py = y / rect.height;

    cursorRef.current = {x: px, y: py};
    startPanelAnimation();
    gsap.set(event.currentTarget, {
      '--pointer-x': `${px * 100}%`,
      '--pointer-y': `${py * 100}%`,
      '--rotate-x': `${(0.5 - py) * 7}deg`,
      '--rotate-y': `${(px - 0.5) * 7}deg`,
    });
  }

  function resetTilt() {
    cursorRef.current = {x: 0.5, y: 0.5};
    startPanelAnimation();

    if (!panelRef.current) {
      return;
    }

    gsap.to(panelRef.current, {
      duration: 0.42,
      ease: 'power3.out',
      '--pointer-x': '50%',
      '--pointer-y': '50%',
      '--rotate-x': '0deg',
      '--rotate-y': '0deg',
    });
  }

  const panelClassName = `interactive-panel decay-card spotlight-card glow-card ${className}`.trim();
  const setPanelRef = (node: HTMLElement | null) => {
    panelRef.current = node;
  };
  const panelContent = (
    <>
      <svg className="decay-card-displacement-map" aria-hidden="true" focusable="false">
        <filter id={filterId}>
          <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="4" seed="8" result="turbulence" />
          <feDisplacementMap
            ref={displacementMapRef}
            in="SourceGraphic"
            in2="turbulence"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </svg>
      <div className="decay-card-content">{children}</div>
    </>
  );

  if (as === 'div') {
    return (
      <div
        className={panelClassName}
        onBlur={resetTilt}
        onPointerLeave={resetTilt}
        onPointerMove={handlePointerMove}
        ref={setPanelRef}
        style={panelStyle}
        tabIndex={0}
      >
        {panelContent}
      </div>
    );
  }

  return (
    <article
      className={panelClassName}
      onBlur={resetTilt}
      onPointerLeave={resetTilt}
      onPointerMove={handlePointerMove}
      ref={setPanelRef}
      style={panelStyle}
      tabIndex={0}
    >
      {panelContent}
    </article>
  );
}
