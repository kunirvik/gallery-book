import React, { useRef, useEffect, useState } from 'react';
import { Environment, Float, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Book } from "../Book/Book";
import { WaterPlane } from "../WaterShader/WaterShader";
import * as THREE from 'three'; 



export const Experience = () => {


  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {  // Ширина экрана для мобильных устройств
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Проверяем размер при первом рендере

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); 


  return (

    <>
    

    <WaterPlane ></WaterPlane>
      {/* Анимация книги */}
      <Float
        position={[0, 0.2, 2]} 
        rotation-x={-Math.PI / 12}
        floatIntensity={1}
        speed={1}
        rotationIntensity={2}
      >
        <Book position={[0, 1, 0]}/>
        
      </Float>
      {/* <PerspectiveCamera makeDefault  position={[0, 1, 5]} /> */}
      <PerspectiveCamera makeDefault position={isMobile ? [0, 1, 5] : [0, 1, 4]} fov={75} />
      {/* Контроллер камеры */}
      {/* <OrbitControls      target={[0, 1, 0]} 
       enableZoom={false}
        enablePan={true} // Отключение панорамирования
        maxPolarAngle={Math.PI / 2} // Ограничение вертикального вращения
        minPolarAngle={0} /> */}



      {/* Окружающая среда */}
      <Environment preset="studio" />

      {/* Направленный свет */}
      <directionalLight
        position={[2, 5, 2]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Плоскость для теней */}
      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </>
  );
};
