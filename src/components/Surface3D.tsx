import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Fn2 } from '../lib/math/calculus';

interface Props {
  f: Fn2;
  xDomain: [number, number];
  yDomain: [number, number];
  /** Optional path drawn on the surface, in (x, y) coordinates. */
  path?: [number, number][];
  marker?: [number, number];
  /** Height transform for display (e.g. log1p for steep losses). */
  transform?: (v: number) => number;
  n?: number;
}

/**
 * 3D surface z = f(x, y), normalised into a 4x4x2 box so any function fits the view.
 * Default export so it can be lazy-loaded (three.js is large).
 */
export default function Surface3D({ f, xDomain, yDomain, path, marker, transform = (v) => v, n = 70 }: Props) {
  const { geometry, toWorld } = useMemo(() => {
    const zs: number[] = [];
    for (let j = 0; j <= n; j++)
      for (let i = 0; i <= n; i++) {
        const x = xDomain[0] + ((xDomain[1] - xDomain[0]) * i) / n;
        const y = yDomain[0] + ((yDomain[1] - yDomain[0]) * j) / n;
        zs.push(transform(f(x, y)));
      }
    const finite = zs.filter(Number.isFinite);
    const zlo = Math.min(...finite);
    const zhi = Math.max(...finite);
    const zn = (z: number) => (zhi === zlo ? 0 : ((z - zlo) / (zhi - zlo)) * 2);
    const toWorld = (x: number, y: number): [number, number, number] => [
      ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * 4 - 2,
      zn(transform(f(x, y))),
      -(((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * 4 - 2),
    ];

    const g = new THREE.BufferGeometry();
    const pos: number[] = [];
    const col: number[] = [];
    const lo = new THREE.Color('#c7d2fe');
    const hi = new THREE.Color('#312e81');
    for (let j = 0; j <= n; j++)
      for (let i = 0; i <= n; i++) {
        const z = zn(zs[j * (n + 1) + i]);
        pos.push((i / n) * 4 - 2, Number.isFinite(z) ? z : 2, -((j / n) * 4 - 2));
        const c = lo.clone().lerp(hi, Math.min(1, Math.max(0, z / 2)));
        col.push(c.r, c.g, c.b);
      }
    const idx: number[] = [];
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const a = j * (n + 1) + i;
        idx.push(a, a + 1, a + n + 1, a + 1, a + n + 2, a + n + 1);
      }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return { geometry: g, toWorld };
  }, [f, xDomain, yDomain, transform, n]);

  const pathGeom = useMemo(() => {
    if (!path || path.length < 2) return null;
    const pts = path.map(([x, y]) => {
      const [a, b, c] = toWorld(x, y);
      return new THREE.Vector3(a, b + 0.02, c);
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [path, toWorld]);

  return (
    <div className="surface3d">
      <Canvas camera={{ position: [4.2, 3.6, 4.2], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 6, 2]} intensity={1.2} />
        <mesh geometry={geometry}>
          <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
        <mesh geometry={geometry}>
          <meshBasicMaterial wireframe color="#ffffff" transparent opacity={0.08} />
        </mesh>
        {pathGeom && (
          <primitive object={new THREE.Line(pathGeom, new THREE.LineBasicMaterial({ color: '#f97316' }))} />
        )}
        {marker && (
          <mesh position={toWorld(marker[0], marker[1])}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
        )}
        <gridHelper args={[4, 8, '#888', '#bbb']} position={[0, -0.01, 0]} />
        <OrbitControls enablePan={false} />
      </Canvas>
      <p className="hint">Drag to rotate · scroll to zoom</p>
    </div>
  );
}
