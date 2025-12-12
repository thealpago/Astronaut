
import React, { useMemo } from 'react';
import { Group, Mesh, Object3D } from 'three';
import { VisualConfig } from '../../types';

interface BodyProps {
  headRef: React.MutableRefObject<Group>;
  bodyMeshRef: React.MutableRefObject<Mesh>;
  visualConfig: VisualConfig;
  abdomenScale?: number;
}

export const Body: React.FC<BodyProps> = ({ headRef, bodyMeshRef, visualConfig, abdomenScale = 1.0 }) => {
  
  // Create a persistent target object for the spotlight.
  // We use useMemo so the object instance stays stable across renders.
  const lightTarget = useMemo(() => {
    const obj = new Object3D();
    // Local Position relative to Head:
    // 0 X (Center)
    // -2 Y (Down towards ground)
    // 15 Z (Far forward)
    obj.position.set(0, -2, 15);
    return obj;
  }, []);

  // Use configured colors
  const bodyColor = visualConfig.spiderBodyColor || "#1a1a20";
  const headColor = visualConfig.spiderHeadColor || "#222222";

  return (
    <>
      {/* -- Main Body Hull -- */}
      <mesh ref={bodyMeshRef} castShadow receiveShadow visible={visualConfig.showBody}>
        <boxGeometry args={[1.4, 0.8, 2.2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Abdomen (Rear Body Segment) */}
      <group position={[0, 0.15, -1.6]} visible={visualConfig.showBody} scale={[abdomenScale, abdomenScale, abdomenScale]}>
        <mesh castShadow receiveShadow scale={[1.1, 0.9, 1.3]}>
           <sphereGeometry args={[0.85, 32, 32]} />
           <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Decorative Ring on Abdomen (Keep dark/metallic for contrast) */}
        <mesh position={[0, 0, 0.4]} scale={[1.12, 0.92, 0.1]}>
           <sphereGeometry args={[0.85, 16, 16]} />
           <meshStandardMaterial color="#222" roughness={0.7} />
        </mesh>
      </group>

      {/* Engine/Core Glow */}
      <mesh position={[0, 0.2, -0.5]} visible={visualConfig.showBody}>
        <boxGeometry args={[0.8, 0.41, 0.8]} />
        <meshStandardMaterial color="#000" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 0.5, -0.5]} distance={3} color="#00ffff" intensity={1} visible={visualConfig.showBody} />

      {/* Head Unit */}
      <group ref={headRef} position={[0, 0.1, 1.2]} visible={visualConfig.showBody}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.6, 0.8]} />
          <meshStandardMaterial color={headColor} roughness={0.5} metalness={0.7} />
        </mesh>
        
        {/* Squid Game Mask Style Face (Circle) */}
        <mesh position={[0, 0.05, 0.41]}>
          <torusGeometry args={[0.18, 0.035, 16, 48]} />
          <meshBasicMaterial color={visualConfig.faceLightColor} toneMapped={false} />
        </mesh>
        
        {/* 
           Spotlight Target 
           We attach this primitive to the Head Group so it rotates WITH the head.
           This ensures the light always points "Forward" relative to the spider.
        */}
        <primitive object={lightTarget} />

        <spotLight
          position={[0, 0, 0.5]}
          target={lightTarget}
          angle={visualConfig.faceLightAngle}
          penumbra={visualConfig.faceLightPenumbra}
          intensity={visualConfig.faceLightIntensity}
          distance={visualConfig.faceLightDistance}
          color={visualConfig.faceLightColor}
          castShadow
        />
      </group>
    </>
  );
};
