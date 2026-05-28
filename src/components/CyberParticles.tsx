import {Camera, Geometry, Mesh, Program, Renderer} from 'ogl';
import {useEffect, useRef} from 'react';

type CyberParticlesProps = {
  alphaParticles?: boolean;
  cameraDistance?: number;
  className?: string;
  disableRotation?: boolean;
  moveParticlesOnHover?: boolean;
  particleBaseSize?: number;
  particleColors?: string[];
  particleCount?: number;
  particleHoverFactor?: number;
  particleSpread?: number;
  pixelRatio?: number;
  sizeRandomness?: number;
  speed?: number;
};

const defaultColors = ['#61dafb', '#f3b33d', '#b32634'];

const vertex = `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;

  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;

  varying vec4 vRandom;
  varying vec3 vColor;

  void main() {
    vRandom = random;
    vColor = color;

    vec3 pos = position * uSpread;
    pos.z *= 8.0;

    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.08, 1.15, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.08, 1.15, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.08, 1.1, random.z);

    vec4 mvPos = viewMatrix * mPos;
    gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = `
  precision highp float;

  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord.xy;
    vec2 pixelUv = floor(uv * 5.0) / 5.0;
    float d = length(pixelUv - vec2(0.5));
    float square = step(max(abs(uv.x - 0.5), abs(uv.y - 0.5)), 0.45);
    vec3 flicker = vColor + 0.18 * sin(uv.yxx + uTime + vRandom.y * 6.28);

    if (uAlphaParticles < 0.5) {
      if (d > 0.62) discard;
      gl_FragColor = vec4(flicker, square);
    } else {
      float glow = smoothstep(0.62, 0.18, d) * 0.72;
      gl_FragColor = vec4(flicker, glow * square);
    }
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  let normalized = hex.replace(/^#/, '');

  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const int = Number.parseInt(normalized, 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

export function CyberParticles({
  alphaParticles = true,
  cameraDistance = 20,
  className = '',
  disableRotation = false,
  moveParticlesOnHover = true,
  particleBaseSize = 64,
  particleColors = defaultColors,
  particleCount = 280,
  particleHoverFactor = 0.85,
  particleSpread = 11,
  pixelRatio = 1,
  sizeRandomness = 1,
  speed = 0.18,
}: CyberParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({x: 0, y: 0});

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const currentContainer = container;
    const renderer = new Renderer({alpha: true, depth: false, dpr: pixelRatio});
    const gl = renderer.gl;
    const camera = new Camera(gl, {fov: 15});
    const positions = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount * 4);
    const colors = new Float32Array(particleCount * 3);

    currentContainer.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);
    camera.position.set(0, 0, cameraDistance);

    for (let i = 0; i < particleCount; i += 1) {
      let x: number;
      let y: number;
      let z: number;
      let len: number;

      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        len = x * x + y * y + z * z;
      } while (len > 1 || len === 0);

      const radius = Math.cbrt(Math.random());
      positions.set([x * radius, y * radius, z * radius], i * 3);
      randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      colors.set(hexToRgb(particleColors[i % particleColors.length]), i * 3);
    }

    const geometry = new Geometry(gl, {
      color: {data: colors, size: 3},
      position: {data: positions, size: 3},
      random: {data: randoms, size: 4},
    });
    const program = new Program(gl, {
      depthTest: false,
      fragment,
      transparent: true,
      uniforms: {
        uAlphaParticles: {value: alphaParticles ? 1 : 0},
        uBaseSize: {value: particleBaseSize * pixelRatio},
        uSizeRandomness: {value: sizeRandomness},
        uSpread: {value: particleSpread},
        uTime: {value: 0},
      },
      vertex,
    });
    const particles = new Mesh(gl, {geometry, mode: gl.POINTS, program});
    let animationFrameId = 0;
    let particlesFrameTimer = 0;
    let elapsed = 0;
    let lastTime = performance.now();
    let lastRenderTime = 0;
    const targetFrameInterval = 1000 / 30;

    function resize() {
      const width = currentContainer.clientWidth;
      const height = currentContainer.clientHeight;
      renderer.setSize(width, height);
      camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = currentContainer.getBoundingClientRect();
      mouseRef.current = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      };
    }

    function scheduleParticleFrame() {
      window.clearTimeout(particlesFrameTimer);
      particlesFrameTimer = window.setTimeout(
        () => {
          animationFrameId = requestAnimationFrame(update);
        },
        document.hidden ? 250 : targetFrameInterval,
      );
    }

    function update(time: number) {
      const shouldRenderParticles = !document.hidden && time - lastRenderTime >= targetFrameInterval;

      if (!shouldRenderParticles) {
        lastTime = time;
        scheduleParticleFrame();
        return;
      }

      elapsed += (time - lastTime) * speed;
      lastTime = time;
      lastRenderTime = time;
      program.uniforms.uTime.value = elapsed * 0.001;

      if (moveParticlesOnHover) {
        particles.position.x = -mouseRef.current.x * particleHoverFactor;
        particles.position.y = -mouseRef.current.y * particleHoverFactor;
      }

      if (!disableRotation) {
        particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
        particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
        particles.rotation.z += 0.01 * speed;
      }

      renderer.render({camera, scene: particles});
      scheduleParticleFrame();
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, {passive: true});
    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.clearTimeout(particlesFrameTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);

      if (currentContainer.contains(gl.canvas)) {
        currentContainer.removeChild(gl.canvas);
      }
    };
  }, [
    alphaParticles,
    cameraDistance,
    disableRotation,
    moveParticlesOnHover,
    particleBaseSize,
    particleColors,
    particleCount,
    particleHoverFactor,
    particleSpread,
    pixelRatio,
    sizeRandomness,
    speed,
  ]);

  return <div className={`particles-container ${className}`.trim()} ref={containerRef} />;
}
