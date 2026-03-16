import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarProps {
  position: [number, number, number];
  color: string;
  name: string;
  isLocal?: boolean;
}

export function Avatar({ position, color, name, isLocal }: AvatarProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (isLocal) {
        // Subtle hover effect for local user
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
        </mesh>
      </Float>
      
      <Text
        position={[0, 1, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {name} {isLocal ? '(You)' : ''}
      </Text>
      
      {/* Small light following the avatar */}
      <pointLight position={[0, 0, 0]} intensity={0.5} color={color} distance={3} />
    </group>
  );
}
