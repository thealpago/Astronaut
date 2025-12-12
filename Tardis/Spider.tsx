
import React from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useSpiderController } from '../hooks/useSpiderController';
import { Body } from './spider/Body';
import { Leg } from './spider/Leg';
import { VisualConfig, PhysicsConfig, TerrainType } from '../types';

interface SpiderProps {
  target: Vector3;
  mousePosRef: React.MutableRefObject<Vector3>;
  onMoveStateChange: (isMoving: boolean) => void;
  isLocked: boolean;
  controlsRef: React.RefObject<any>;
  visualConfig: VisualConfig;
  physicsConfig: PhysicsConfig;
  terrainType: TerrainType;
}

const Spider: React.FC<SpiderProps> = ({ 
    target, 
    mousePosRef, 
    onMoveStateChange, 
    isLocked, 
    controlsRef, 
    visualConfig, 
    physicsConfig,
    terrainType
}) => {
  const { groupRef, headRef, bodyMeshRef, legs, legConfigs } = useSpiderController(
      target, 
      mousePosRef, 
      onMoveStateChange, 
      physicsConfig,
      terrainType
  );

  useFrame((state) => {
    if (isLocked && groupRef.current && controlsRef.current) {
      const controls = controlsRef.current;
      const camera = state.camera;
      const targetPos = groupRef.current.position;

      // Smooth follow logic:
      // Maintain the relative offset between camera and target
      const offset = camera.position.clone().sub(controls.target);
      
      // Update OrbitControls target to match spider
      controls.target.copy(targetPos);
      
      // Move camera to keep the same relative view
      camera.position.addVectors(targetPos, offset);
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <Body 
            headRef={headRef} 
            bodyMeshRef={bodyMeshRef} 
            visualConfig={visualConfig} 
            abdomenScale={physicsConfig.abdomenScale}
        />
        
        {/* Shoulder Mounts Visuals */}
        {legConfigs.map(config => (
            <mesh key={`mount-${config.id}`} position={config.originOffset} visible={visualConfig.showBody}>
                <cylinderGeometry args={[0.15, 0.2, 0.2, 8]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        ))}
      </group>

      {/* -- Legs -- */}
      {legs.map((legState, i) => {
          return (
             <Leg 
                key={i} 
                parentRef={groupRef} 
                config={legConfigs[i]} 
                legState={legState} 
                visualConfig={visualConfig}
             />
          );
      })}
    </>
  );
};

export default Spider;
