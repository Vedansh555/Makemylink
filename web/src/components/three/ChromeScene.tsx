"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

/**
 * Studio lighting built from soft light strips, so no HDR files are downloaded.
 * Long strips give clean chrome streaks; round lights read as odd shapes on the blob.
 * Tuned dark so the chrome reads clearly against the site's white background.
 */
function Studio() {
  return (
    <Environment resolution={256}>
      <color attach="background" args={["#2b2d33"]} />
      <Lightformer form="rect" intensity={4} position={[0, 6, -2]} scale={[16, 2.5, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
      <Lightformer form="rect" intensity={1.2} position={[0, -6, 2]} scale={[16, 3, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
      <Lightformer form="rect" intensity={3} position={[-7, 0, 3]} scale={[1.5, 14, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
      <Lightformer form="rect" color="#ffd2c4" intensity={2} position={[7, 1, 3]} scale={[1.2, 14, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
      <Lightformer form="rect" color="#cfd6ff" intensity={1.5} position={[-5, 5, 5]} scale={[8, 1, 1]} rotation-z={0.6} onUpdate={(self) => self.lookAt(0, 0, 0)} />
    </Environment>
  );
}

/** Follows the pointer with a soft lag, and shrinks the scene to fit its box. */
function PointerRig({ children, fitWidth, isHero = false }: { children: React.ReactNode; fitWidth: number; isHero?: boolean }) {
  const ref = useRef<Group>(null);
  const width = useThree((s) => s.viewport.width);
  const scale = Math.min(1, width / fitWidth);
  // On mobile viewports (narrow screens), do not lift upward into the headline text and CTA
  const isNarrow = width < 4.2;
  const lift = isHero ? (isNarrow ? -0.2 : (1 - scale) * 0.9) : 0;
  const responsiveScale = isHero && isNarrow ? scale * 0.72 : scale;

  useFrame((state, delta) => {
    if (!ref.current) return;
    const { x, y } = state.pointer;
    ref.current.rotation.y += (x * 0.4 - ref.current.rotation.y) * Math.min(1, delta * 2.5);
    ref.current.rotation.x += (-y * 0.25 - ref.current.rotation.x) * Math.min(1, delta * 2.5);
  });
  return (
    <group ref={ref} scale={responsiveScale} position={[0, lift, 0]}>
      {children}
    </group>
  );
}

function Blob({ scale = 1.6, color = "#d6d9df" }: { scale?: number; color?: string }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.12;
  });
  return (
    <group ref={ref}>
      <mesh scale={scale}>
        <icosahedronGeometry args={[1, 48]} />
        <MeshDistortMaterial color={color} metalness={1} roughness={0.1} distort={0.4} speed={1.4} envMapIntensity={1.3} />
      </mesh>
    </group>
  );
}

function Pearl({
  position,
  scale,
  color,
  metalness = 0.2,
  roughness = 0.18,
  clearcoat = 1,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
}) {
  return (
    <Float speed={2.4} floatIntensity={2} rotationIntensity={0.6}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          clearcoat={clearcoat}
          envMapIntensity={1.8}
        />
      </mesh>
    </Float>
  );
}

/**
 * A chain of interlocked chrome links: the "link" in Makemylink.
 * Neighbouring links alternate between flat and edge-on so each one passes through the next.
 */
function ChainLinks({ count = 3, scale = 1, position = [0, 0, 0], tilt = 0.35 }: { count?: number; scale?: number; position?: [number, number, number]; tilt?: number }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.x += delta * 0.45;
  });
  const spacing = 0.88;
  return (
    <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.6}>
      <group position={position} rotation={[0, 0, tilt]} scale={scale}>
        <group ref={ref}>
          {Array.from({ length: count }, (_, i) => (
            <mesh key={i} position={[(i - (count - 1) / 2) * spacing, 0, 0]} rotation={[i % 2 ? Math.PI / 2 : 0, 0, 0]} scale={[1.35, 1, 1]}>
              <torusGeometry args={[0.5, 0.15, 48, 96]} />
              <meshStandardMaterial color="#e9ebef" metalness={1} roughness={0.12} envMapIntensity={1.4} />
            </mesh>
          ))}
        </group>
      </group>
    </Float>
  );
}

function PastelDonut({ position, color = "#ffb5c5" }: { position: [number, number, number]; color?: string }) {
  return (
    <Float speed={2} rotationIntensity={1.2} floatIntensity={1.2}>
      <mesh position={position} rotation={[0.8, 0.5, 0.2]} scale={0.42}>
        <torusGeometry args={[0.55, 0.24, 32, 64]} />
        <meshPhysicalMaterial color={color} roughness={0.15} transmission={0.1} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
    </Float>
  );
}

function HeroElements() {
  const vw = useThree((s) => s.viewport.width);
  const px = useThree((s) => s.size.width);
  // The headline is about 26% of the page width on each side of centre (capped at 400px).
  // A chain is drawn only when it fits entirely in the white space beside it, so it can never sit behind text, phones or the nav.
  const unitsPerPx = vw / px;
  const textHalf = Math.min(0.27 * px, 400) * unitsPerPx;
  const chainHalf = 0.5; // half the width of a 3-link chain at this size, in world units
  const worldX = vw / 2 - 0.35 - chainHalf;
  if (vw < 5.2 || worldX - chainHalf < textHalf + 0.15) return null;
  // PointerRig scales this group by min(1, vw / 5.2); undo it so positions are in world units.
  const k = Math.min(1, vw / 5.2);
  const x = worldX / k;
  return (
    <>
      <ChainLinks count={3} scale={0.34} position={[-x, 0.5, 0]} tilt={0.5} />
      <ChainLinks count={3} scale={0.34} position={[x, 0.6, 0]} tilt={-0.5} />
    </>
  );
}

/**
 * Browsers allow only a handful of live 3D scenes. A page with many themed phones would starve the hero,
 * so each scene runs only while it is on (or near) the screen.
 */
function OnScreen({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return setOn(true);
    const io = new IntersectionObserver(([e]) => setOn(e!.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className="h-full w-full">
      {on && children}
    </div>
  );
}

export default function ChromeScene(props: {
  variant?: "hero" | "chain" | "bio" | "bakes" | "clay";
  color?: string;
  accentColor?: string;
}) {
  return (
    <OnScreen>
      <Scene {...props} />
    </OnScreen>
  );
}

function Scene({
  variant = "bio",
  color = "#eceef2",
  accentColor = "#ff758c",
}: {
  variant?: "hero" | "chain" | "bio" | "bakes" | "clay";
  color?: string;
  accentColor?: string;
}) {
  const hero = variant === "hero";
  const isBakes = variant === "bakes";
  const isClay = variant === "clay";
  // A darker base tone reads clearly against the page's white background.
  const ballColor = hero ? "#aeb2ba" : color;
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, hero ? 6.4 : 5.4], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
      // Track the pointer across the whole page, even when content sits on top of the canvas.
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      <ambientLight intensity={0.4} />
      <Studio />
      <PointerRig fitWidth={hero ? 5.2 : 3} isHero={hero}>
        {variant === "chain" && <ChainLinks count={4} scale={0.8} />}
        {!hero && !isBakes && !isClay && variant !== "chain" && (
          <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
            <group position={[0, 0, 0]}>
              <Blob scale={0.72} color={ballColor} />
            </group>
          </Float>
        )}
        {hero && <HeroElements />}
        {isBakes && (
          <>
            {/* Kept within the viewport and clear of the top speaker notch and text */}
            <PastelDonut position={[-1.4, 0.8, -0.4]} color="#ffd23f" />
            <Pearl position={[1.3, 0.9, -0.3]} scale={0.18} color={accentColor} />
            <Pearl position={[-1.3, -0.7, 0.2]} scale={0.13} color="#ffffff" />
          </>
        )}
        {isClay && (
          <>
            {/* Clear of the top bezel notch */}
            <Pearl position={[1.3, 0.9, -0.3]} scale={0.18} color={accentColor} />
            <Pearl position={[-1.3, 0.7, 0.1]} scale={0.15} color="#ded9cc" />
          </>
        )}
      </PointerRig>
    </Canvas>
  );
}
