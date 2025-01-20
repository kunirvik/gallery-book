  import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GUI } from 'dat.gui';



// Компонент для кастомного шейдера воды
const WaterShaderMaterial = React.forwardRef((props, ref) => {
  const uniforms = {
    uTime: { value: 0 },
    uBigWavesElevation: { value: 0.2 },
    uBigWavesFrequency: { value: new THREE.Vector2(4, 2) },
    uBigWaveSpeed: { value: 0.75 },
    uSmallWavesElevation: { value: 0.15 },
    uSmallWavesFrequency: { value: 3 },
    uSmallWavesSpeed: { value: 0.2 },
    uSmallWavesIterations: { value: 4 },
    uDepthColor: { value: new THREE.Color('rgb(36, 123, 42)') },
    uSurfaceColor: { value: new THREE.Color('rgb(0, 0, 0)') },
    uColorOffset: { value: 0.08 },
    uColorMultiplier: { value: 5 },
    uFogStart: { value: 10 },  // Added for fog start
    uFogEnd: { value: 50 },   // Added for fog end
    uVisibilityStart: { value: 11.3},
    uVisibilityEnd: { value: 0}, 


  };

  const materialRef = ref || useRef();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <shaderMaterial
      ref={materialRef}
      attach="material"
      vertexShader={`
        #include <fog_pars_vertex>

uniform float uTime;
uniform vec2 uBigWavesFrequency;
uniform float uBigWavesElevation;
uniform float uBigWaveSpeed;

uniform float uSmallWavesElevation;
uniform float uSmallWavesFrequency;
uniform float uSmallWavesSpeed;
uniform float uSmallWavesIterations;

varying float vElevation;
varying vec3 vWorldPosition;

// Простой Перлин-шум для создания волн
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Целая часть для индексации
  vec3 Pi1 = Pi0 + vec3(1.0); // Целая часть + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Дробная часть для интерполяции
  vec3 Pf1 = Pf0 - vec3(1.0); // Дробная часть - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

void main() {
  #include <begin_vertex>
  #include <project_vertex>
  #include <fog_vertex>
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  float elevation = 
    sin(modelPosition.x * uBigWavesFrequency.x + uTime * uBigWaveSpeed) 
    * sin(modelPosition.z * uBigWavesFrequency.y + uTime * uBigWaveSpeed) 
    * uBigWavesElevation;
  
  for(float i = 1.0; i <= 10.0; i++) {
    elevation -= abs(
      cnoise(
        vec3(modelPosition.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)
        ) 
        * uSmallWavesElevation / i
      );
     if(i >= uSmallWavesIterations ) {
      break;
    }
  }

  modelPosition.y += elevation;
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  vElevation = elevation;
}
      `}
      fragmentShader={`
        #include <fog_pars_fragment>

precision mediump float;

uniform float uFogStart;  // Начало зоны размытости
uniform float uFogEnd;  


uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;

uniform float uColorOffset;
uniform float uColorMultiplier;

uniform float uVisibilityStart;
uniform float uVisibilityEnd;

varying float vElevation;
varying vec3 vWorldPosition;



void main() {
  // Рассчитываем смешивание цветов воды
  float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
  vec3 baseColor = mix(uDepthColor, uSurfaceColor, mixStrength);

  // Высотный туман
  float fogHeightStart = 0.0; // Начальная высота тумана
  float fogHeightEnd = 1.5;   // Конечная высота тумана
  float heightFogFactor = smoothstep(fogHeightStart, fogHeightEnd, vWorldPosition.y);

    // Расстояние от камеры до текущего фрагмента
  float distance = length(vWorldPosition - cameraPosition);

  // Вычисляем размытость на основе расстояния
  float fogFactor = smoothstep(uFogStart, uFogEnd, distance); 


  // Вычисляем ограничения видимости
  float visibility = smoothstep(uVisibilityStart, uVisibilityEnd, distance);

 // Прозрачность, зависящая от тумана
    float alpha = 1.0 - smoothstep(uFogStart, uFogEnd, distance);

  // Цвет тумана
  vec3 fogColor = vec3(0.8, 0.8, 0.8);

  // Итоговое смешивание с учётом тумана
  vec3 finalColor = mix(baseColor, fogColor, fogFactor + heightFogFactor);

  gl_FragColor = vec4(finalColor, alpha * visibility);

  #include <fog_fragment>
}

      `}
      uniforms={uniforms}
      transparent
    />
  );
});

// Компонент с плоскостью воды
export const WaterPlane = () => {
  const materialRef = useRef();

  // Добавление GUI для настройки
  // React.useEffect(() => {
  //   const gui = new GUI();
  //   const uniforms = materialRef.current.uniforms;

  //   const bigWavesFolder = gui.addFolder('Large Waves');
  //   bigWavesFolder.add(uniforms.uBigWavesElevation, 'value', 0, 1, 0.001).name('Elevation');
  //   bigWavesFolder.add(uniforms.uBigWavesFrequency.value, 'x', 0, 10, 0.001).name('Frequency X');
  //   bigWavesFolder.add(uniforms.uBigWavesFrequency.value, 'y', 0, 10, 0.001).name('Frequency Y');
  //   bigWavesFolder.add(uniforms.uBigWaveSpeed, 'value', 0.25, 5, 0.001).name('Speed');

  //   const colorFolder = gui.addFolder('Colors');
  //   colorFolder.addColor({ color: uniforms.uDepthColor.value.getStyle() }, 'color').name('Depth Color').onChange((value) => {
  //     uniforms.uDepthColor.value.set(value);
  //   });
  //   colorFolder.addColor({ color: uniforms.uSurfaceColor.value.getStyle() }, 'color').name('Surface Color').onChange((value) => {
  //     uniforms.uSurfaceColor.value.set(value);
  //   });

  //   const fogFolder = gui.addFolder('Fog Settings');
  //   fogFolder.add(uniforms.uFogStart, 'value', 0, 10, 0.1).name('Fog Start');
  //   fogFolder.add(uniforms.uFogEnd, 'value', 0, 50, 0.1).name('Fog End');
  
  //   const visibilityFolder = gui.addFolder('Visibility Settings');
  //   visibilityFolder.add(uniforms.uVisibilityStart, 'value', 0, 100, 0.1).name('Visibility Start');
  //   visibilityFolder.add(uniforms.uVisibilityEnd, 'value', 0, 100, 0.1).name('Visibility End');

  //   return () => gui.destroy();
  // }, []);

  return (
    <mesh position={[0, 0, 0]}   rotation-x={-Math.PI * 0.5}>
    
      <planeGeometry args={[12, 12, 512, 512]} />
      <WaterShaderMaterial ref={materialRef} />
    
    </mesh>
    
  );
}; 





