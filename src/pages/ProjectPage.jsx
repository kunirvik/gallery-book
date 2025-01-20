import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Experience } from "../components/Experience/Experience";
import { UI } from "../components/UI/UI";
import css from "../pages/ProjectPage.module.css"



function ProjectPage() {
  return (
    <><div className={css.canvasContainer} >

     <UI />
      <Loader />

    <Canvas  style={{margin:'0 auto',  position: 'fixed' , width: '100vw',
  height: '100vh',}}
       shadows camera={{
          position: [-0.5, 1, window.innerWidth > 800 ? 4 : 9],
        
          fov: 45,
        }}

       >   
        
        <group position-y={0}>
          <Suspense fallback={null}>
         
          

            <Experience />
          </Suspense>
        </group>
      </Canvas> </div> 
    </>
  );
}

export default ProjectPage;