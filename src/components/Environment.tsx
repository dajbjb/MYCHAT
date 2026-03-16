import { Stars, Sky, ContactShadows, Environment as DreiEnvironment } from '@react-three/drei';

interface EnvironmentProps {
  type: 'space' | 'forest' | 'minimal';
}

export function Environment({ type }: EnvironmentProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {type === 'space' && (
        <>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <DreiEnvironment preset="night" />
          <fog attach="fog" args={['#000000', 10, 50]} />
        </>
      )}
      
      {type === 'minimal' && (
        <>
          <Sky sunPosition={[100, 20, 100]} />
          <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
          <DreiEnvironment preset="city" />
          <gridHelper args={[100, 100, '#444', '#222']} position={[0, -1, 0]} />
        </>
      )}

      {type === 'forest' && (
        <>
          <Sky sunPosition={[100, 10, 100]} turbidity={0.1} rayleigh={2} />
          <DreiEnvironment preset="forest" />
          <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#2d4a22" />
          </mesh>
        </>
      )}
    </>
  );
}
