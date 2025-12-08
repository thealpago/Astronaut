import React from 'react';
import { Vector3, Euler } from 'three';
import { useFrame } from '@react-three/fiber';
// Kontrolcü hook'unun hala gerekli olduğunu varsayıyoruz, ancak bacakları ihmal edecek şekilde yeniden yazılmalı.
// Basitlik için, şimdilik aynı hook'u kullanacağız ancak bacak mantığını yoksayacağız.
import { useSpiderController } from '../hooks/useSpiderController'; // Burayı yeni bir hook ile değiştirmelisiniz
import { AeroCreatureBody } from './AeroCreatureBody'; // YENİ İsim
import { Motor } from './Motor'; // YENİ İsim
import { VisualConfig, PhysicsConfig, TerrainType, LegConfiguration } from '../types';

// Motorların konumlarını tanımlamak için yeni sabitler
const MOTOR_CONFIGS: LegConfiguration[] = [
  // Basit 4 motorlu (Quadcopter) düzeni
  { id: 0, originOffset: new Vector3(1.0, 0, 1.0), l1: 1, l2: 1, maxReach: 2 }, // Ön Sağ
  { id: 1, originOffset: new Vector3(-1.0, 0, 1.0), l1: 1, l2: 1, maxReach: 2 }, // Ön Sol
  { id: 2, originOffset: new Vector3(1.0, 0, -1.0), l1: 1, l2: 1, maxReach: 2 }, // Arka Sağ
  { id: 3, originOffset: new Vector3(-1.0, 0, -1.0), l1: 1, l2: 1, maxReach: 2 }, // Arka Sol
];

interface AeroCreatureProps {
  target: Vector3;
  mousePosRef: React.MutableRefObject<Vector3>;
  onMoveStateChange: (isMoving: boolean) => void;
  isLocked: boolean;
  controlsRef: React.RefObject<any>;
  visualConfig: VisualConfig;
  physicsConfig: PhysicsConfig;
  terrainType: TerrainType;
}

const AeroCreature: React.FC<AeroCreatureProps> = ({ 
    target, 
    mousePosRef, 
    onMoveStateChange, 
    isLocked, 
    controlsRef, 
    visualConfig, 
    physicsConfig,
    terrainType
}) => {
  // Bacaklar yerine motorlarımız var, ancak Motor bileşeni LegState'i kullanmayacak.
  const { groupRef, headRef, bodyMeshRef, legConfigs: _ } = useSpiderController(
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

      // === Uçan Cisim Takip Mantığı (Örümcekten Basitleştirilmiş) ===
      
      // Kameranın mevcut örümceğe göre konumu korunur.
      const offset = camera.position.clone().sub(controls.target);
      
      // Takip hedefi yaratığın konumuna ayarlanır
      controls.target.copy(targetPos);
      
      // Kamera, yaratığı merkezde tutmak için hareket ettirilir
      camera.position.addVectors(targetPos, offset);

      // Yaratığın hedefe bakmasını sağlamak için basit bir döndürme
      // Bu, `useSpiderController` içinde yapılmalıdır, ancak görsel bir etki için buraya ekliyoruz:
      const direction = target.clone().sub(targetPos);
      if (direction.lengthSq() > 0.01) {
          const rotationY = Math.atan2(direction.x, direction.z);
          groupRef.current.rotation.y = rotationY;
      }
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <AeroCreatureBody // YENİ İsim
            headRef={headRef} 
            bodyMeshRef={bodyMeshRef} 
            visualConfig={visualConfig} 
            // Abdomen ölçeği artık drone için uygun olmayabilir, ancak varsayılan olarak tutuyoruz
            abdomenScale={physicsConfig.abdomenScale} 
        />
        
        {/* Motor Bağlantı Noktası Görselleri (İsteğe Bağlı) */}
        {MOTOR_CONFIGS.map(config => (
            <mesh key={`mount-${config.id}`} position={config.originOffset} visible={visualConfig.showBody}>
                <boxGeometry args={[0.3, 0.2, 0.3]} />
                <meshStandardMaterial color="#555" />
            </mesh>
        ))}
      </group>

      {/* -- Motorlar (Pervaneler) -- */}
      {MOTOR_CONFIGS.map((config, i) => {
          return (
             <Motor // YENİ İsim
                key={i} 
                parentRef={groupRef} 
                config={config} 
                // LegState'e artık ihtiyacımız yok, ancak arayüz tutarlılığı için boş bir nesne gönderebiliriz
                // YENİ Motor bileşeni bu prop'u yoksayacaktır
                legState={{ currentPos: new Vector3(), targetPos: new Vector3(), isGrounded: false, isMoving: false }} 
                visualConfig={visualConfig}
             />
          );
      })}
    </>
  );
};

export default AeroCreature;