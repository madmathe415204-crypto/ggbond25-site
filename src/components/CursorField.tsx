import {useEffect, useRef} from 'react';
import {assetPath} from '../assetPaths';
import {CyberParticles} from './CyberParticles';
import {PixelTrail} from './PixelTrail';

const scrollVideoSrc = assetPath('assets/videos/ggbond25-scroll-background-scrub.mp4');

export function CursorField() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentVideoTime = useRef(0);
  const lastScrollMoveTime = useRef(0);
  const lastScrollY = useRef(0);
  const lastScrollDirection = useRef(0);
  const lastSeekTime = useRef(0);
  const lastFrameTime = useRef(0);
  const smoothScrollProgress = useRef(0);
  const targetScrollProgress = useRef(0);
  const targetVideoTime = useRef(0);
  const videoDuration = useRef(0);
  const isScrollFieldActive = useRef(false);
  const settledFrameCount = useRef(0);

  useEffect(() => {
    let rafId = 0;
    const seekEveryFrame = 18;

    const dampProgress = (current: number, target: number, damping: number, deltaMs: number) => {
      const deltaSeconds = Math.min(0.08, Math.max(0.001, deltaMs / 1000));
      return current + (target - current) * (1 - Math.exp(-damping * deltaSeconds));
    };

    function stopScrollFieldLoop() {
      isScrollFieldActive.current = false;
      settledFrameCount.current = 0;

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function startScrollFieldLoop() {
      if (isScrollFieldActive.current) {
        return;
      }

      isScrollFieldActive.current = true;
      settledFrameCount.current = 0;
      lastFrameTime.current = 0;
      rafId = requestAnimationFrame(updateScrollField);
    }

    function updateScrollField(frameTime: number) {
      rafId = 0;
      const field = fieldRef.current;
      const video = videoRef.current;
      const frameDelta = lastFrameTime.current ? frameTime - lastFrameTime.current : 16.7;
      const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollY = window.scrollY;
      const scrollDelta = scrollY - lastScrollY.current;
      const isScrollMoving = Math.abs(scrollDelta) > 0.4;

      lastFrameTime.current = frameTime;

      if (isScrollMoving) {
        lastScrollMoveTime.current = frameTime;
        lastScrollDirection.current = Math.sign(scrollDelta);
        lastScrollY.current = scrollY;
      }

      const isScrollActive = frameTime - lastScrollMoveTime.current < 140;
      targetScrollProgress.current = Math.min(1, Math.max(0, scrollY / scrollRange));
      const progressDistance = Math.abs(targetScrollProgress.current - smoothScrollProgress.current);
      const scrubEase = isScrollActive ? 13.5 : 22;
      smoothScrollProgress.current = dampProgress(
        smoothScrollProgress.current,
        targetScrollProgress.current,
        scrubEase,
        frameDelta,
      );

      if (
        targetScrollProgress.current > 0.985 ||
        targetScrollProgress.current < 0.015 ||
        (!isScrollActive && progressDistance < 0.0006)
      ) {
        smoothScrollProgress.current = targetScrollProgress.current;
      }

      const videoDrift = `${Math.round(smoothScrollProgress.current * -96)}px`;

      field?.style.setProperty('--scroll-progress', smoothScrollProgress.current.toFixed(4));
      field?.style.setProperty('--video-drift', videoDrift);

      let videoTimeGap = 0;

      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        if (!video.paused) {
          video.pause();
        }

        video.playbackRate = 1;
        videoDuration.current = video.duration;
        targetVideoTime.current = videoDuration.current * smoothScrollProgress.current;
        const dampedVideoTime = dampProgress(
          currentVideoTime.current,
          targetVideoTime.current,
          isScrollActive ? 18 : 28,
          frameDelta,
        );
        const directionalVideoTime =
          isScrollActive && lastScrollDirection.current > 0
            ? Math.max(currentVideoTime.current, dampedVideoTime)
            : isScrollActive && lastScrollDirection.current < 0
              ? Math.min(currentVideoTime.current, dampedVideoTime)
              : dampedVideoTime;
        currentVideoTime.current = directionalVideoTime;

        if (targetScrollProgress.current > 0.985 || targetScrollProgress.current < 0.015) {
          currentVideoTime.current = targetVideoTime.current;
        }

        const seekInterval = isScrollActive ? seekEveryFrame : 34;
        const nextVideoTime = Math.min(videoDuration.current - 0.04, Math.max(0, currentVideoTime.current));
        videoTimeGap = Math.abs(video.currentTime - nextVideoTime);

        if (
          videoTimeGap > 0.016 &&
          (frameTime - lastSeekTime.current > seekInterval || videoTimeGap > 0.16 || progressDistance > 0.28)
        ) {
          const fastSeek = (video as HTMLVideoElement & {fastSeek?: (time: number) => void}).fastSeek;

          if (typeof fastSeek === 'function' && videoTimeGap > 0.24) {
            fastSeek.call(video, nextVideoTime);
          } else {
            video.currentTime = nextVideoTime;
          }

          lastSeekTime.current = frameTime;
        }
      }

      const scrollProgressGap = Math.abs(targetScrollProgress.current - smoothScrollProgress.current);
      const isFieldSettled = !isScrollActive && scrollProgressGap < 0.0007 && videoTimeGap < 0.024;
      settledFrameCount.current = isFieldSettled ? settledFrameCount.current + 1 : 0;

      if (settledFrameCount.current > 12) {
        stopScrollFieldLoop();
        return;
      }

      if (isScrollFieldActive.current) {
        rafId = requestAnimationFrame(updateScrollField);
      }
    }

    function handleScrollOrResize() {
      lastScrollMoveTime.current = performance.now();
      startScrollFieldLoop();
    }

    const video = videoRef.current;
    video?.addEventListener('loadedmetadata', startScrollFieldLoop);
    window.addEventListener('scroll', handleScrollOrResize, {passive: true});
    window.addEventListener('resize', handleScrollOrResize);
    startScrollFieldLoop();

    return () => {
      video?.removeEventListener('loadedmetadata', startScrollFieldLoop);
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      stopScrollFieldLoop();
    };
  }, []);

  return (
    <div className="cursor-field" ref={fieldRef} aria-hidden="true">
      <video
        className="scroll-video-background"
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        src={scrollVideoSrc}
      />
      <div className="animation-stage-focus" />
      <div className="video-parallax-shade" />
      <CyberParticles className="cyber-particle-layer" />
      <PixelTrail className="pixel-cursor-trace" color="#61dafb" gridSize={70} maxAge={320} trailSize={0.046} />
      <div className="cyber-grid-overlay" />
    </div>
  );
}
