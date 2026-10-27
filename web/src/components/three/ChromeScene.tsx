"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
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
function PointerRig({ children, fitWidth }: { children: React.ReactNode; fitWidth: number }) {
  const ref = useRef<Group>(null);
  const width = useThree((s) => s.viewport.width);
  const scale = Math.min(1, width / fitWidth);
  // On phones the scene shrinks, so lift it up to stay behind the headline.
  const lift = (1 - scale) * 1.3;
  useFrame((state, delta) => {
    if (!ref.current) return;
    const { x, y } = state.pointer;
    ref.current.rotation.y += (x * 0.4 - ref.current.rotation.y) * Math.min(1, delta * 2.5);
    ref.current.rotation.x += (-y * 0.25 - ref.current.rotation.x) * Math.min(1, delta * 2.5);
  });
  return (
    <group ref={ref} scale={scale} position={[0, lift, 0]}>
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

function GlassRing({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1.8} rotationIntensity={1.2} floatIntensity={1.2}>
      <mesh position={position} rotation={[0.9, 0.4, 0]} scale={1.15}>
        <torusGeometry args={[0.62, 0.2, 48, 128]} />
        <meshPhysicalMaterial color="#ffffff" transmission={1} roughness={0.03} thickness={1.2} ior={1.5} iridescence={0.6} />
      </mesh>
    </Float>
  );
}

function Pearl({ position, scale, color }: { position: [number, number, number]; scale: number; color: string }) {
  return (
    <Float speed={2.4} floatIntensity={2} rotationIntensity={0.6}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial color={color} metalness={0.2} roughness={0.18} clearcoat={1} />
      </mesh>
    </Float>
  );
}

function ChromeKnot({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1.4} rotationIntensity={2} floatIntensity={1}>
      <mesh position={position} scale={0.4}>
        <torusKnotGeometry args={[1, 0.32, 220, 32]} />
        <meshStandardMaterial color="#e9ebef" metalness={1} roughness={0.12} />
      </mesh>
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

export default function ChromeScene({
  variant = "bio",
  color = "#eceef2",
  accentColor = "#ff758c",
}: {
  variant?: "hero" | "bio" | "bakes" | "clay";
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
      <PointerRig fitWidth={hero ? 5.2 : 3}>
        {!hero && !isBakes && !isClay && (
          <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.8}>
            <group position={[0, 0, 0]}>
              <Blob scale={1.3} color={ballColor} />
            </group>
          </Float>
        )}
        {hero && (
          <>
            <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.8}>
              <group position={[2.85, -0.35, -0.6]}>
                <Blob scale={1.35} color={ballColor} />
              </group>
            </Float>
            <GlassRing position={[-2.8, 1.05, 0.1]} />
            <ChromeKnot position={[-2.4, -0.65, -0.1]} />
            <Pearl position={[3.4, 1.4, -0.4]} scale={0.24} color="#ffb7a5" />
            <Pearl position={[-1.5, -1.05, 0.5]} scale={0.17} color="#ff5b37" />
            <Pearl position={[1.5, -1.8, -1]} scale={0.14} color="#c9b8ff" />
          </>
        )}
        {isBakes && (
          <>
            {/* Positioned delicately on the outer side margins, scaled small, zero overlap with name/avatar */}
            <PastelDonut position={[-2.2, 1.5, -0.5]} color="#ffd23f" />
            <Pearl position={[2.1, 1.6, -0.3]} scale={0.22} color={accentColor} />
            <Pearl position={[-1.9, -0.5, 0.2]} scale={0.16} color="#ffffff" />
          </>
        )}
        {isClay && (
          <>
            {/* Soft decorative spheres tucked in the margins outside the avatar */}
            <Pearl position={[2.2, 1.6, -0.3]} scale={0.24} color={accentColor} />
            <Pearl position={[-2.1, 1.4, 0.1]} scale={0.18} color="#ded9cc" />
          </>
        )}
      </PointerRig>
    </Canvas>
  );
}
