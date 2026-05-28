import {Canvas, useThree} from '@react-three/fiber';
import {shaderMaterial, useTrailTexture} from '@react-three/drei';
import {useEffect, useMemo, useRef} from 'react';
import type {CanvasProps} from '@react-three/fiber';
import * as THREE from 'three';

type PixelTrailProps = {
  className?: string;
  color?: string;
  gridSize?: number;
  trailSize?: number;
  maxAge?: number;
  interpolate?: number;
  canvasProps?: Partial<CanvasProps>;
};

type PixelTrailSceneProps = Required<Pick<PixelTrailProps, 'color' | 'gridSize' | 'trailSize' | 'maxAge' | 'interpolate'>>;

const DotMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(),
    mouseTrail: null,
    gridSize: 64,
    pixelColor: new THREE.Color('#61dafb'),
  },
  `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  `
    uniform vec2 resolution;
    uniform sampler2D mouseTrail;
    uniform float gridSize;
    uniform vec3 pixelColor;

    vec2 coverUv(vec2 uv) {
      vec2 screen = resolution.xy / max(resolution.x, resolution.y);
      return clamp((uv - 0.5) * screen + 0.5, 0.0, 1.0);
    }

    void main() {
      vec2 screenUv = gl_FragCoord.xy / resolution;
      vec2 uv = coverUv(screenUv);
      vec2 gridUvCenter = (floor(uv * gridSize) + 0.5) / gridSize;
      float trail = texture2D(mouseTrail, gridUvCenter).r;
      float pixelEdge = step(0.08, trail);
      gl_FragColor = vec4(pixelColor, trail * pixelEdge * 0.82);
    }
  `,
);

function PixelTrailScene({color, gridSize, trailSize, maxAge, interpolate}: PixelTrailSceneProps) {
  const {gl, invalidate, size, viewport} = useThree();
  const dotMaterial = useMemo(() => new DotMaterial(), []);
  const trailFrameTimer = useRef(0);
  const [trail, addTrailPoint] = useTrailTexture({
    size: 256,
    radius: trailSize,
    maxAge,
    interpolate,
    intensity: 0.34,
    smoothing: 0.82,
    minForce: 0.2,
    blend: 'screen',
    ease: (x: number) => 1 - Math.pow(1 - x, 2),
  });

  useEffect(() => {
    function runTrailDecayFrames() {
      window.clearTimeout(trailFrameTimer.current);
      const startedAt = performance.now();

      function queueNextFrame() {
        const age = performance.now() - startedAt;

        if (age > maxAge + 120) {
          trailFrameTimer.current = 0;
          return;
        }

        invalidate();
        trailFrameTimer.current = window.setTimeout(queueNextFrame, 1000 / 30);
      }

      queueNextFrame();
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = gl.domElement.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;

      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        addTrailPoint({uv: new THREE.Vector2(x, y)});
        runTrailDecayFrames();
      }
    }

    window.addEventListener('pointermove', handlePointerMove, {passive: true});
    return () => {
      window.clearTimeout(trailFrameTimer.current);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [addTrailPoint, gl.domElement, invalidate, maxAge]);

  const materialProps = useMemo(
    () => ({
      gridSize,
      mouseTrail: trail,
      pixelColor: new THREE.Color(color),
      resolution: new THREE.Vector2(size.width * viewport.dpr, size.height * viewport.dpr),
    }),
    [color, gridSize, size.height, size.width, trail, viewport.dpr],
  );

  return (
    <mesh scale={[Math.max(viewport.width, viewport.height) / 2, Math.max(viewport.width, viewport.height) / 2, 1]}>
      <planeGeometry args={[2, 2]} />
      <primitive object={dotMaterial} attach="material" {...materialProps} />
    </mesh>
  );
}

export function PixelTrail({
  className = '',
  color = '#61dafb',
  gridSize = 78,
  trailSize = 0.045,
  maxAge = 360,
  interpolate = 6,
  canvasProps = {},
}: PixelTrailProps) {
  return (
    <Canvas
      {...canvasProps}
      className={`pixel-canvas ${className}`.trim()}
      dpr={[1, 1]}
      frameloop="demand"
      gl={{alpha: true, antialias: false, powerPreference: 'high-performance'}}
    >
      <PixelTrailScene color={color} gridSize={gridSize} trailSize={trailSize} maxAge={maxAge} interpolate={interpolate} />
    </Canvas>
  );
}
