import {useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, extend, useFrame} from '@react-three/fiber';
import {Environment, Lightformer, useGLTF, useTexture} from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from '@react-three/rapier';
import {MeshLineGeometry, MeshLineMaterial} from 'meshline';
import * as THREE from 'three';
import cardGLB from './lanyard/card.glb?url';
import lanyardTexture from './lanyard/lanyard.png';
import {profile} from '../data/siteContent';
import './lanyard/Lanyard.css';

extend({MeshLineGeometry, MeshLineMaterial});

type PointerCaptureTarget = EventTarget & {
  setPointerCapture: (pointerId: number) => void;
};

type LanyardRigidBody = RapierRigidBody & {
  lerped?: THREE.Vector3;
};

type LanyardModel = {
  nodes: {
    card: {geometry: THREE.BufferGeometry};
    clip: {geometry: THREE.BufferGeometry};
    clamp: {geometry: THREE.BufferGeometry};
  };
  materials: {
    base: THREE.MeshPhysicalMaterial;
    metal: THREE.Material;
  };
};

type LanyardSceneProps = {
  isUnlocked: boolean;
  onUnlock: () => void;
  onDragChange?: (isDragging: boolean) => void;
  onPullProgressChange?: (progress: number) => void;
};

type BandProps = {
  isMobile: boolean;
  isUnlocked: boolean;
  onUnlock: () => void;
  onDragChange?: (isDragging: boolean) => void;
  onPullProgressChange?: (progress: number) => void;
};

const initialBandPoints = [1.5, 4, 0, 1, 4, 0, 0.5, 4, 0, 0, 4, 0];

function validBandPoints(points: number[]) {
  return points.length >= 6 && points.length % 3 === 0 && points.every(Number.isFinite);
}

function toFiniteBandPoints(points: THREE.Vector3[], fallback: number[]) {
  const nextPoints = points.flatMap((point) => [point.x, point.y, point.z]);

  return validBandPoints(nextPoints) ? nextPoints : fallback;
}

function finiteRigidBodyVector(body?: LanyardRigidBody | null) {
  const translation = body?.translation();

  if (!translation || !Number.isFinite(translation.x) || !Number.isFinite(translation.y) || !Number.isFinite(translation.z)) {
    return null;
  }

  return new THREE.Vector3(translation.x, translation.y, translation.z);
}

function safeSetBandPoints(mesh: THREE.Mesh<InstanceType<typeof MeshLineGeometry>>, points: number[]) {
  if (!validBandPoints(points)) {
    return false;
  }

  mesh.geometry.setPoints(points);
  return true;
}

export function LanyardScene({isUnlocked, onUnlock, onDragChange, onPullProgressChange}: LanyardSceneProps) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="badge-scene-shell" aria-hidden="true">
      <div className="badge-scene-canvas">
        <Canvas
          camera={{position: [0, 0, 30], fov: 20}}
          dpr={[1, isMobile ? 1.35 : 1.75]}
          gl={{alpha: true, antialias: true, powerPreference: 'high-performance'}}
          onCreated={({gl}) => gl.setClearColor(new THREE.Color(0x000000), 0)}
        >
          <ambientLight intensity={Math.PI} />
          <Physics gravity={[0, -40, 0]} timeStep={isMobile ? 1 / 30 : 1 / 60}>
            <Band
              isMobile={isMobile}
              isUnlocked={isUnlocked}
              onUnlock={onUnlock}
              onDragChange={onDragChange}
              onPullProgressChange={onPullProgressChange}
            />
          </Physics>
          <Environment blur={0.75}>
            <Lightformer
              intensity={2}
              color="white"
              position={[0, -1, 5]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[-1, -1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[1, 1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={10}
              color="white"
              position={[-10, 0, 14]}
              rotation={[0, Math.PI / 2, Math.PI / 3]}
              scale={[100, 10, 1]}
            />
          </Environment>
        </Canvas>
      </div>
    </div>
  );
}

function Band({isMobile, isUnlocked, onUnlock, onDragChange, onPullProgressChange}: BandProps) {
  const band = useRef<THREE.Mesh<InstanceType<typeof MeshLineGeometry>>>(null!);
  const fixed = useRef<LanyardRigidBody>(null!);
  const j1 = useRef<LanyardRigidBody>(null!);
  const j2 = useRef<LanyardRigidBody>(null!);
  const j3 = useRef<LanyardRigidBody>(null!);
  const card = useRef<LanyardRigidBody>(null!);

  const vec = useMemo(() => new THREE.Vector3(), []);
  const ang = useMemo(() => new THREE.Vector3(), []);
  const rot = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const unlockedRef = useRef(isUnlocked);
  const stableInitialBandPoints = useMemo(() => initialBandPoints, []);
  const lastValidBandPoints = useRef(stableInitialBandPoints);
  const maxHangingReach = isMobile ? 5.6 : 6.8;
  const downwardUnlockDistance = isMobile ? 4.15 : 4.8;
  const lastPullProgress = useRef(0);

  const segmentProps = useMemo(
    () =>
      ({
        type: 'dynamic',
        canSleep: true,
        colliders: false,
        angularDamping: 4,
        linearDamping: 4,
      }) satisfies RigidBodyProps,
    [],
  );

  const {nodes, materials} = useGLTF(cardGLB) as unknown as LanyardModel;
  const rawTexture = useTexture(lanyardTexture);
  const texture = useMemo(() => {
    const nextTexture = rawTexture.clone();
    nextTexture.wrapS = THREE.RepeatWrapping;
    nextTexture.wrapT = THREE.RepeatWrapping;
    nextTexture.needsUpdate = true;
    return nextTexture;
  }, [rawTexture]);
  const avatarTexture = useTexture('/assets/images/pixel-avatar.jpg');
  const curve = useMemo(
    () => {
      const nextCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
      nextCurve.curveType = 'chordal';
      return nextCurve;
    },
    [],
  );
  const [dragged, setDragged] = useState<false | THREE.Vector3>(false);
  const [hovered, setHovered] = useState(false);
  const badgeFaceTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    ctx.scale(0.75, 0.75);

    ctx.fillStyle = '#061118';
    ctx.fillRect(0, 0, 1024, 1440);

    const bg = ctx.createLinearGradient(0, 0, 1024, 1440);
    bg.addColorStop(0, '#0b1822');
    bg.addColorStop(0.58, '#081017');
    bg.addColorStop(1, '#12090a');
    ctx.fillStyle = bg;
    ctx.fillRect(26, 26, 972, 1388);

    const border = ctx.createLinearGradient(0, 0, 1024, 1440);
    border.addColorStop(0, '#6be7ff');
    border.addColorStop(1, '#f4c156');
    ctx.strokeStyle = border;
    ctx.lineWidth = 18;
    ctx.strokeRect(34, 34, 956, 1372);

    ctx.fillStyle = 'rgba(97, 218, 251, 0.12)';
    ctx.fillRect(72, 86, 880, 148);

    ctx.fillStyle = '#6be7ff';
    ctx.font = '700 60px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('SYSTEM ACCESS', 96, 178);

    ctx.fillStyle = '#f3f5f7';
    ctx.font = '700 96px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(profile.name, 96, 324);

    ctx.fillStyle = '#9ec6d3';
    ctx.font = '600 42px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(profile.focus, 96, 388);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(96, 440, 832, 608);

    const avatarImage = avatarTexture.image as CanvasImageSource | undefined;
    if (avatarImage) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(118, 462, 788, 564);
      ctx.clip();
      ctx.drawImage(avatarImage, 118, 462, 788, 564);
      ctx.restore();
    }

    ctx.fillStyle = 'rgba(5, 10, 12, 0.68)';
    ctx.fillRect(96, 1060, 832, 200);

    ctx.fillStyle = '#f5c96c';
    ctx.font = '700 44px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('REACT BITS', 120, 1142);
    ctx.fillText('REMOTION', 120, 1208);

    ctx.fillStyle = '#d4f7ff';
    ctx.font = '500 34px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('Pull downward to unlock', 120, 1290);

    ctx.strokeStyle = 'rgba(212, 247, 255, 0.92)';
    ctx.lineWidth = 12;
    let x = 610;
    const y = 1348;
    for (let i = 0; i < 26; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x, y - 70);
      ctx.lineTo(x, y);
      ctx.stroke();
      x += i % 2 === 0 ? 16 : 12;
    }

    const gloss = ctx.createLinearGradient(0, 0, 1024, 1440);
    gloss.addColorStop(0.08, 'rgba(255,255,255,0.28)');
    gloss.addColorStop(0.22, 'rgba(255,255,255,0.04)');
    gloss.addColorStop(0.4, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, 1024, 1440);

    const output = new THREE.CanvasTexture(canvas);
    output.colorSpace = THREE.SRGBColorSpace;
    output.anisotropy = 8;
    return output;
  }, [avatarTexture]);
  const badgeFaceSize = useMemo(() => {
    nodes.card.geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    nodes.card.geometry.boundingBox?.getSize(size);
    return size;
  }, [nodes.card.geometry]);

  useEffect(() => {
    unlockedRef.current = isUnlocked;
  }, [isUnlocked]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (!hovered) {
      return undefined;
    }

    document.body.style.cursor = dragged && !isUnlocked ? 'grabbing' : 'grab';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [dragged, hovered, isUnlocked]);

  useEffect(() => {
    onDragChange?.(Boolean(dragged));
  }, [dragged, onDragChange]);

  useEffect(() => {
    if (!dragged) {
      return undefined;
    }

    function stopWindowDragging() {
      stopDragging();
    }

    window.addEventListener('pointerup', stopWindowDragging);
    window.addEventListener('pointercancel', stopWindowDragging);
    window.addEventListener('blur', stopWindowDragging);
    return () => {
      window.removeEventListener('pointerup', stopWindowDragging);
      window.removeEventListener('pointercancel', stopWindowDragging);
      window.removeEventListener('blur', stopWindowDragging);
    };
  }, [dragged]);

  useFrame((state, delta) => {
    if (dragged && !isUnlocked) {
      const fixedPoint = finiteRigidBodyVector(fixed.current);
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      const nextCardPosition = vec.sub(dragged);

      if (fixedPoint) {
        const fromAnchor = nextCardPosition.clone().sub(fixedPoint);

        if (fromAnchor.length() > maxHangingReach) {
          fromAnchor.setLength(maxHangingReach);
          nextCardPosition.copy(fixedPoint).add(fromAnchor);
        }
      }

      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: nextCardPosition.x,
        y: nextCardPosition.y,
        z: nextCardPosition.z,
      });

      const downPullDistance = fixedPoint ? fixedPoint.y - nextCardPosition.y : 0;
      const pullProgress = Math.max(0, Math.min(1, downPullDistance / downwardUnlockDistance));

      if (Math.abs(pullProgress - lastPullProgress.current) > 0.015) {
        lastPullProgress.current = pullProgress;
        onPullProgressChange?.(pullProgress);
      }

      if (!unlockedRef.current && downPullDistance > downwardUnlockDistance) {
        unlockedRef.current = true;
        onPullProgressChange?.(1);
        onUnlock();
      }
    }

    if (!dragged && lastPullProgress.current !== 0 && !isUnlocked) {
      lastPullProgress.current = 0;
      onPullProgressChange?.(0);
    }

    if (fixed.current && j1.current && j2.current && j3.current && card.current && band.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) {
          ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        }

        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(ref.current.translation(), delta * (clampedDistance * 50));
      });

      const fixedPoint = finiteRigidBodyVector(fixed.current);
      const j1Point = j1.current.lerped;
      const j2Point = j2.current.lerped;
      const j3Point = finiteRigidBodyVector(j3.current);

      if (
        fixedPoint &&
        j1Point &&
        j2Point &&
        j3Point &&
        [fixedPoint, j1Point, j2Point, j3Point].every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z))
      ) {
        curve.points[0].copy(j3Point);
        curve.points[1].copy(j2Point);
        curve.points[2].copy(j1Point);
        curve.points[3].copy(fixedPoint);

        const nextBandPoints = toFiniteBandPoints(curve.getPoints(isMobile ? 16 : 32), lastValidBandPoints.current);

        if (safeSetBandPoints(band.current, nextBandPoints)) {
          lastValidBandPoints.current = nextBandPoints;
        }
      }

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z}, true);
    }
  });

  function stopDragging(target?: EventTarget | null, pointerId?: number) {
    if (target && 'releasePointerCapture' in target && typeof pointerId === 'number') {
      try {
        (target as {releasePointerCapture: (id: number) => void}).releasePointerCapture(pointerId);
      } catch {
        // ignore pointer capture release failures
      }
    }

    setDragged(false);
  }

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged && !isUnlocked ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerUp={(event) => stopDragging(event.target, event.pointerId)}
            onPointerCancel={(event) => stopDragging(event.target, event.pointerId)}
            onLostPointerCapture={(event) => stopDragging(event.target, event.pointerId)}
            onPointerDown={(event) => {
              if (isUnlocked) {
                return;
              }

              (event.target as PointerCaptureTarget).setPointerCapture(event.pointerId);
              setDragged(new THREE.Vector3().copy(event.point).sub(vec.copy(card.current.translation())));
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={materials.base.map}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            {badgeFaceTexture ? (
              <mesh position={[0, 0.02, 0.006]}>
                <planeGeometry args={[badgeFaceSize.x * 0.82, badgeFaceSize.y * 0.88]} />
                <meshPhysicalMaterial
                  map={badgeFaceTexture}
                  transparent
                  roughness={0.54}
                  metalness={0.08}
                  clearcoat={1}
                  clearcoatRoughness={0.14}
                />
              </mesh>
            ) : null}
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry attach="geometry" />
        <meshLineMaterial
          color="white"
          depthTest={false}
          lineWidth={1}
          map={texture}
          repeat={[-4, 1]}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap={1}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(cardGLB);
