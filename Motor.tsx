import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Mesh } from 'three';
import { LegState, LegConfiguration, VisualConfig } from '../../types';

// Yeniden kullanılabilir matematik nesnelerine artık IK için ihtiyacımız yok, kaldırıldı.

interface MotorVisualProps {
  config: LegConfiguration;
  visualConfig: VisualConfig;
}

/**
 * MotorVisual
 * Sorumluluklar:
 * 1. Motor kasasını konumlandırma.
 * 2. Pervaneyi döndürme.
 */
const MotorVisual: React.FC<MotorVisualProps> = ({ config, visualConfig }) => {
  const motorGroup = useRef<Group>(null);
  const rotorMesh = useRef<Mesh>(null);

  // Motor hızı (Sürekli dönme)
  const rotationSpeed = config.id % 2 === 0 ? 0.3 : -0.3; // Motor 0, 2 saat yönünde, 1, 3 saat yönünün tersine döner

  useFrame((state, delta) => {
    if (rotorMesh.current) {
      // Pervanenin sürekli dönmesini sağlıyoruz.
      rotorMesh.current.rotation.z += delta * 100 * rotationSpeed; 
    }
  });

  return (
    <group ref={motorGroup} position={config.originOffset}>
      {/* -- Motor Kasası -- */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 16]} />
        <meshStandardMaterial color="#111" roughness={0.6} metalness={0.9} />
      </mesh>

      {/* -- Pervane/Rotor -- */}
      <mesh ref={rotorMesh} position={[0, 0.3, 0]}>
        {/* Pervane Bıçağı (Basit Kutu Görseli) */}
        <boxGeometry args={[1.5, 0.02, 0.2]} />
        <meshBasicMaterial color="#333" />
        
        {/* İkinci Bıçak (Çapraz) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[1.5, 0.02, 0.2]} />
          <meshBasicMaterial color="#333" />
        </mesh>

        {/* Orta Kapak */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      </mesh>
      
      {/* Motor Etkisi Işığı (Alt) */}
      <pointLight 
        position={[0, -0.2, 0]} 
        distance={2} 
        color="#00ffff" 
        intensity={2} 
        visible={visualConfig.showBody}
      />
    </group>
  );
};

interface MotorProxyProps {
  parentRef: React.RefObject<Group>;
  config: LegConfiguration;
  legState: LegState; // Artık kullanılmıyor ama arayüz için tutuluyor
  visualConfig: VisualConfig;
}

/**
 * Motor
 * Leg bileşenine benzer şekilde, motor görsellerini ana grup koordinat sistemine bağlar.
 * Ancak artık IK veya bacak pozisyonu hesaplamasına ihtiyacımız yok.
 */
export const Motor: React.FC<MotorProxyProps> = ({ parentRef, config, visualConfig }) => {
  // shoulderRef'e artık ihtiyacımız yok çünkü MotorVisual MotorProxy'nin child'ı olarak konumlanacak.

  return <MotorVisual config={config} visualConfig={visualConfig} />;
};