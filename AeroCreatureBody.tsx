import React, { useMemo } from 'react';
import { Group, Mesh, Object3D } from 'three';
import { VisualConfig } from '../../types';

interface BodyProps {
  headRef: React.MutableRefObject<Group>;
  bodyMeshRef: React.MutableRefObject<Mesh>;
  visualConfig: VisualConfig;
  abdomenScale?: number;
}

export const AeroCreatureBody: React.FC<BodyProps> = ({ headRef, bodyMeshRef, visualConfig, abdomenScale = 1.0 }) => {
  
  // Spotlight için kalıcı hedef nesnesi
  const lightTarget = useMemo(() => {
    const obj = new Object3D();
    // Konum: 0 X, 0 Y, 10 Z (İleri)
    obj.position.set(0, 0, 10);
    return obj;
  }, []);

  return (
    <>
      {/* -- Ana Gövde Şasisi (Daha Alçak ve Geniş) -- */}
      <mesh ref={bodyMeshRef} castShadow receiveShadow visible={visualConfig.showBody} position={[0, 0.5, 0]}>
        <boxGeometry args={[2.5, 0.5, 2.5]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Merkezi Çekirdek/Güç Kaynağı */}
      <mesh position={[0, 0.55, 0]} visible={visualConfig.showBody}>
        <cylinderGeometry args={[0.5, 0.5, 0.7, 12]} />
        <meshStandardMaterial color="#000" emissive="#00ccff" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0, 0.9, 0]} distance={4} color="#00ccff" intensity={2} visible={visualConfig.showBody} />

      {/* Ön Sensör/Kamera Birimi */}
      <group ref={headRef} position={[0, 0.6, 1.4]} visible={visualConfig.showBody}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.2, 0.8]} />
          <meshStandardMaterial color="#333" roughness={0.5} metalness={0.7} />
        </mesh>
        
        {/* Lazer/Sensör Işığı (Basit Bir Kırmızı Işık) */}
        <mesh position={[0, 0, 0.41]}>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
          <meshBasicMaterial color="#ff0000" toneMapped={false} />
        </mesh>
        
        {/* Spotlight Target'ı Head Group'a iliştirme */}
        <primitive object={lightTarget} />

        <spotLight
          position={[0, 0, 0.5]}
          target={lightTarget}
          angle={visualConfig.faceLightAngle}
          penumbra={visualConfig.faceLightPenumbra}
          intensity={visualConfig.faceLightIntensity * 0.5} // Daha düşük parlaklık
          distance={visualConfig.faceLightDistance}
          color="#ff0000" // Kırmızı sensör ışığı
          castShadow
        />
      </group>
    </>
  );
};