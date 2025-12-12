
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, Object3D, Group, Mesh } from 'three';
import { LegState, LegConfiguration, VisualConfig } from '../../types';
import { solveIK } from '../../utils/helpers';
import { SPIDER_CONFIG } from '../../config';

// Reusable math objects for Visuals to avoid GC
const _vec3_a = new Vector3();
const _vec3_b = new Vector3();
const _vec3_c = new Vector3();
const _quat_a = new Quaternion();
const _vec3_upperMid = new Vector3();
const _vec3_lowerMid = new Vector3();
const _vec3_upperVec = new Vector3();
const _vec3_lowerVec = new Vector3();
const _vec3_axis = new Vector3();
const _vec3_look = new Vector3();

interface LegVisualProps {
  shoulderRef: React.MutableRefObject<Object3D>;
  legState: LegState;
  config: LegConfiguration;
  visualConfig: VisualConfig;
}

/**
 * LegVisual
 * Responsibilities:
 * 1. Solving IK (Where is the elbow?)
 * 2. Positioning and orienting meshes (Thigh, Calf, Foot)
 * 3. Handling visual overrides (Plating visibility)
 */
const LegVisual: React.FC<LegVisualProps> = ({ shoulderRef, legState, config, visualConfig }) => {
  const upperLeg = useRef<Mesh>(null);
  const lowerLeg = useRef<Mesh>(null);
  const jointMesh = useRef<Group>(null);
  const footMesh = useRef<Mesh>(null);
  const pistonRef = useRef<Mesh>(null);
  
  const legColor = visualConfig.spiderLegColor || "#2a2a35";

  useFrame(() => {
    if (!shoulderRef.current || !upperLeg.current || !lowerLeg.current || !jointMesh.current || !footMesh.current) return;

    // 1. Get World Positions
    const shoulderPos = _vec3_a.set(0, 0, 0).applyMatrix4(shoulderRef.current.matrixWorld);

    // Safety: Clamp foot position to max reach to prevent visual stretching
    let footPos = legState.currentPos; // Reference directly (optimization)
    const dist = shoulderPos.distanceTo(footPos);
    const maxReach = config.maxReach * 0.99; // 99% to avoid straight-line singularity

    if (dist > maxReach) {
      const dir = _vec3_b.subVectors(footPos, shoulderPos).normalize();
      // Write into _vec3_c to avoid modifying legState.currentPos
      footPos = _vec3_c.copy(shoulderPos).add(dir.multiplyScalar(maxReach));
    }

    // 2. Solve IK
    const bodyUp = _vec3_b.set(0, 1, 0).applyQuaternion(shoulderRef.current.getWorldQuaternion(_quat_a));
    const bodyCenter = _vec3_look.setFromMatrixPosition(shoulderRef.current.parent?.matrixWorld || shoulderRef.current.matrixWorld);
    const hintForward = new Vector3().subVectors(shoulderPos, bodyCenter).normalize();

    // solveIK returns a shared internal vector. We must read it immediately.
    // Use the specific length from config (supports variable leg lengths)
    const elbowPos = solveIK(shoulderPos, footPos, config.l1, config.l2, bodyUp, hintForward);

    if (elbowPos) {
      // 3. Orient Meshes

      // Upper Leg
      _vec3_upperMid.addVectors(shoulderPos, elbowPos).multiplyScalar(0.5);
      upperLeg.current.position.copy(_vec3_upperMid);
      upperLeg.current.lookAt(elbowPos);
      upperLeg.current.rotateX(Math.PI / 2); // Cylinder alignment
      upperLeg.current.scale.set(1, shoulderPos.distanceTo(elbowPos), 1);

      // Lower Leg
      _vec3_lowerMid.addVectors(elbowPos, footPos).multiplyScalar(0.5);
      lowerLeg.current.position.copy(_vec3_lowerMid);
      lowerLeg.current.lookAt(footPos);
      lowerLeg.current.rotateX(Math.PI / 2);
      lowerLeg.current.scale.set(1, elbowPos.distanceTo(footPos), 1);

      // Joint
      jointMesh.current.position.copy(elbowPos);

      // Align joint to bend axis (cross product of upper and lower leg vectors)
      _vec3_upperVec.subVectors(elbowPos, shoulderPos).normalize();
      _vec3_lowerVec.subVectors(footPos, elbowPos).normalize();
      _vec3_axis.crossVectors(_vec3_upperVec, _vec3_lowerVec).normalize();

      if (_vec3_axis.lengthSq() > 0.01) {
        _vec3_look.copy(elbowPos).add(_vec3_axis);
        jointMesh.current.lookAt(_vec3_look);
      }

      // Foot
      footMesh.current.position.copy(footPos);

      // Piston (Visual Flair)
      if (pistonRef.current) {
        pistonRef.current.lookAt(elbowPos);
      }
    }
  });

  return (
    <group>
      {/* Upper Segment */}
      <mesh ref={upperLeg} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 1, 6]} />
        <meshStandardMaterial color={legColor} roughness={0.4} metalness={0.8} />
        {/* Decorative plating (The "Square" thing) */}
        <mesh position={[0, -0.2, 0.12]} scale={[1.2, 0.6, 0.2]} visible={visualConfig.showPlating}>
          <boxGeometry />
          <meshStandardMaterial 
            color="#4a4a55" 
            metalness={0.9} 
            transparent={true} 
            opacity={visualConfig.platingOpacity}
          />
        </mesh>
      </mesh>

      {/* Joint - No Shadow (Optimization) */}
      <group ref={jointMesh}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.4, 12]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
        <mesh position={[0.15, 0, 0]}>
          <ringGeometry args={[0.08, 0.12, 16]} />
          <meshBasicMaterial color="#00ffcc" side={2} transparent opacity={0.6} />
        </mesh>
        <mesh position={[-0.15, 0, 0]}>
          <ringGeometry args={[0.08, 0.12, 16]} />
          <meshBasicMaterial color="#00ffcc" side={2} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Lower Segment */}
      <mesh ref={lowerLeg} castShadow>
        <cylinderGeometry args={[0.08, 0.04, 1, 6]} />
        <meshStandardMaterial color={legColor} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Foot - Now casting shadow for better ground contact visuals */}
      <mesh ref={footMesh} receiveShadow castShadow>
        <cylinderGeometry args={[0.03, 0.08, 0.2, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
};

interface LegProxyProps {
  parentRef: React.RefObject<Group>;
  config: LegConfiguration;
  legState: LegState;
  visualConfig: VisualConfig;
}

/**
 * LegProxy
 * React Three Fiber quirk: We need to calculate world positions from the BODY's coordinate system,
 * but the legs are rendered as children of the Scene (conceptually).
 * 
 * This component attaches a "Shoulder" object to the Body group via the parentRef,
 * but renders the visual leg independently. This prevents double-transforms.
 */
export const Leg: React.FC<LegProxyProps> = ({ parentRef, config, legState, visualConfig }) => {
  const shoulderRef = useRef<Object3D>(null);

  // Initialize shoulder ref value if null, but safer to do lazily
  if (!shoulderRef.current) {
    shoulderRef.current = new Object3D();
  }

  useFrame(() => {
    if (parentRef.current && shoulderRef.current) {
      if (shoulderRef.current.parent !== parentRef.current) {
        parentRef.current.add(shoulderRef.current);
        shoulderRef.current.position.copy(config.originOffset);
      }
    }
  });

  return <LegVisual shoulderRef={shoulderRef} legState={legState} config={config} visualConfig={visualConfig} />;
};
