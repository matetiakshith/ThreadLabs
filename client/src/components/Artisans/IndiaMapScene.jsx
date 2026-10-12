import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { animate } from 'animejs';
import { Vector3, TOUCH, Matrix4, Ray, Plane, Color } from 'three';
import { pointInRegion } from './indiaGeography';


function StateMesh({ region, active, selected, dark, reduced, onHover, onChoose }) {
  const group = useRef();
  const material = useRef();
  const { invalidate } = useThree();
  // Hit the real polygon surface, including holes, rather than scanning 1.2M mesh vertices.
  const raycast = useMemo(() => {
    const inverse = new Matrix4(), ray = new Ray(), plane = new Plane(new Vector3(0, 0, 1), -0.075), point = new Vector3();
    return function geographicRaycast(raycaster, intersections) {
      inverse.copy(this.matrixWorld).invert(); ray.copy(raycaster.ray).applyMatrix4(inverse);
      if (!ray.intersectPlane(plane, point) || !pointInRegion(point.x, point.y, region)) return;
      point.applyMatrix4(this.matrixWorld);
      const distance = raycaster.ray.origin.distanceTo(point);
      if (distance >= raycaster.near && distance <= raycaster.far) intersections.push({ distance, point: point.clone(), object: this });
    };
  }, [region]);
  useEffect(() => {
    const target = new Color(active ? (dark ? '#c6a779' : '#b49368') : (dark ? '#58564f' : '#d6cebe'));
    const values = { y: group.current.position.y, r: material.current.color.r, g: material.current.color.g, b: material.current.color.b };
    const motion = animate(values, { y: active ? 0.16 : 0, r: target.r, g: target.g, b: target.b, duration: reduced ? 0 : 300,
      ease: 'out(3)', onUpdate: () => {
        group.current.position.y = values.y;
        material.current.color.setRGB(values.r, values.g, values.b); invalidate();
      } });
    invalidate();
    return () => motion.cancel();
  }, [active, dark, reduced, invalidate]);
  return <group ref={group}>
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh castShadow receiveShadow raycast={raycast}
        onPointerOver={event => { event.stopPropagation(); onHover(region.name); }}
        onPointerMove={event => { event.stopPropagation(); onHover(region.name); }}
        onPointerOut={() => onHover(null)}
        onClick={event => { event.stopPropagation(); if (event.delta <= 5) onChoose(region.name); }}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[region.positions, 3]} />
          <bufferAttribute attach="attributes-normal" args={[region.normals, 3]} />
        </bufferGeometry>
        <meshStandardMaterial ref={material} color={dark ? '#58564f' : '#d6cebe'} roughness={0.82} metalness={0.13} />
      </mesh>
      <lineSegments raycast={() => null}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[region.borders, 3]} /></bufferGeometry>
        <lineBasicMaterial color={selected ? (dark ? '#f4d9a8' : '#725332') : (dark ? '#a29b8c' : '#887e6d')} transparent opacity={active ? 1 : 0.65} />
      </lineSegments>
    </group>
  </group>;
}

function CameraRig({ regions, command, reduced }) {
  const controls = useRef();
  const animation = useRef();
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    animation.current?.cancel();
    const baseZoom = Math.min(size.width / 9.8, size.height / 11.8);
    const target = new Vector3();
    const position = new Vector3(0, 13, 7);
    let zoom = baseZoom;
    if (command.type === 'focus') {
      const region = regions.find(region => region.name === command.name);
      if (region) {
        const [x1, y1, x2, y2] = region.bounds;
        target.set((x1 + x2) / 2, 0, -(y1 + y2) / 2);
        position.add(target);
        zoom = Math.min(baseZoom * 3.2, size.width / (x2 - x1 + 1.5), size.height / (y2 - y1 + 2));
      }
    } else if (command.type === 'zoom') {
      target.copy(orbit.target); position.copy(camera.position);
      zoom = Math.max(baseZoom * 0.8, Math.min(baseZoom * 5, camera.zoom * command.factor));
    }
    const values = { x: camera.position.x, y: camera.position.y, z: camera.position.z,
      tx: orbit.target.x, ty: orbit.target.y, tz: orbit.target.z, zoom: camera.zoom };
    invalidate();
    animation.current = animate(values, {
      x: position.x, y: position.y, z: position.z, tx: target.x, ty: target.y, tz: target.z, zoom,
      duration: reduced ? 0 : 600, ease: 'inOut(3)',
      onUpdate: () => {
        camera.position.set(values.x, values.y, values.z); camera.zoom = values.zoom;
        camera.updateProjectionMatrix(); orbit.target.set(values.tx, values.ty, values.tz);
        orbit.update(); invalidate();
      },
    });
    return () => animation.current?.cancel();
  }, [camera, command, invalidate, reduced, regions, size.height, size.width]);
  return <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping={false}
    minPolarAngle={0.08} maxPolarAngle={Math.PI / 3} minAzimuthAngle={-0.55} maxAzimuthAngle={0.55}
    minZoom={Math.min(size.width / 9.8, size.height / 11.8) * 0.8}
    maxZoom={Math.min(size.width / 9.8, size.height / 11.8) * 5}
    rotateSpeed={0.5} zoomSpeed={0.6} touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_ROTATE }}
    onStart={() => animation.current?.cancel()} />;
}

function Scene({ regions, selected, hovered, dark, reduced, command, onHover, onChoose, onFailure }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = event => { event.preventDefault(); onFailure(); };
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  return <>
    <ambientLight intensity={dark ? 1.1 : 1.4} />
    <directionalLight position={[-4, 12, 5]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7}
      shadow-normalBias={0.025} shadow-bias={-0.0002} />
    <directionalLight position={[6, 4, -5]} intensity={0.65} />
    {regions.map(region => <StateMesh key={region.iso} region={region} selected={selected === region.name}
      active={selected === region.name || hovered === region.name} dark={dark} reduced={reduced} onHover={onHover} onChoose={onChoose} />)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} receiveShadow raycast={() => null}>
      <planeGeometry args={[200, 200]} /><shadowMaterial transparent opacity={dark ? 0.2 : 0.12} />
    </mesh>
    <CameraRig regions={regions} command={command} reduced={reduced} />
  </>;
}

export default function IndiaMapScene(props) {
  return <Canvas orthographic frameloop="demand" shadows="percentage" dpr={[1, 1.5]}
    camera={{ position: [0, 13, 7], zoom: 30, near: 0.1, far: 100 }}
    gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
    onCreated={({ gl }) => {
      gl.domElement.setAttribute('aria-label', 'Interactive India map. Use the state search below for keyboard selection.');
      gl.domElement.setAttribute('role', 'img');
    }}>
    <Scene {...props} />
  </Canvas>;
}
