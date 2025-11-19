
import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { ToolType } from '../types';
import { FaCube, FaEraser, FaFire, FaWater, FaSquare, FaTrash } from 'react-icons/fa';

// --- Constants ---
const GRID_SIZE = 16; // Reduced to 16 (4096 voxels) to prevent WebGL Context Loss on lower-end devices
const TOTAL_VOXELS = GRID_SIZE * GRID_SIZE * GRID_SIZE;

// Map tools to visual colors
const COLORS: Record<ToolType, string> = {
  [ToolType.SAND]: '#eab308', // Yellow-500
  [ToolType.WATER]: '#3b82f6', // Blue-500
  [ToolType.FIRE]: '#ef4444', // Red-500
  [ToolType.STONE]: '#64748b', // Slate-500
  [ToolType.ERASER]: '#000000',
};

// Helper to get index from 3D coordinates
const getIdx = (x: number, y: number, z: number) => {
  return x + y * GRID_SIZE + z * GRID_SIZE * GRID_SIZE;
};

// --- Voxel Engine Component ---
const VoxelWorld = ({ activeTool }: { activeTool: ToolType }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // State: 0 = Empty, 1 = Sand, 2 = Water, 3 = Fire, 4 = Stone
  const gridRef = useRef(new Uint8Array(TOTAL_VOXELS).fill(0));
  
  // Temp variables for matrix updates to avoid GC
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // --- Physics & Rendering Loop ---
  useFrame(() => {
    if (!meshRef.current) return;

    const grid = gridRef.current;
    let count = 0;

    // 1. Physics Logic (Bottom-Up)
    for (let y = 1; y < GRID_SIZE; y++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const idx = getIdx(x, y, z);
          const type = grid[idx];

          if (type === 0 || type === 4) continue; // Empty or Stone

          const belowIdx = getIdx(x, y - 1, z);
          
          // FIRE (Rises)
          if (type === 3) { 
             if (Math.random() > 0.85) { // Decay
                grid[idx] = 0;
                continue;
             }
             // Try move up
             if (y < GRID_SIZE - 1) {
                 const aboveIdx = getIdx(x, y+1, z);
                 if (grid[aboveIdx] === 0) {
                     grid[aboveIdx] = type;
                     grid[idx] = 0;
                 } else if (grid[aboveIdx] !== 4) {
                    // Try wiggle up
                    const rx = Math.random() > 0.5 ? 1 : -1;
                    const rz = Math.random() > 0.5 ? 1 : -1;
                    let moved = false;

                    // Check diagonals
                    if (x+rx >=0 && x+rx < GRID_SIZE) {
                        const diag = getIdx(x+rx, y+1, z);
                        if (grid[diag] === 0) {
                           grid[diag] = type;
                           grid[idx] = 0;
                           moved = true;
                        }
                    }
                    if (!moved && z+rz >=0 && z+rz < GRID_SIZE) {
                        const diag = getIdx(x, y+1, z+rz);
                        if (grid[diag] === 0) {
                           grid[diag] = type;
                           grid[idx] = 0;
                        }
                    }
                 }
             } else {
                // Top of world decay
                grid[idx] = 0;
             }
             continue;
          }

          // SAND & WATER (Gravity)
          if (grid[belowIdx] === 0) {
            grid[belowIdx] = type;
            grid[idx] = 0;
          } else {
            // Diagonal falling / Sliding
            const dirX = Math.random() > 0.5 ? 1 : -1;
            const dirZ = Math.random() > 0.5 ? 1 : -1;
            
            let moved = false;
            
            // Check neighbors below
            const candidates = [
                [x + dirX, z], [x - dirX, z], 
                [x, z + dirZ], [x, z - dirZ]
            ];

            for (const [nx, nz] of candidates) {
                if (nx >= 0 && nx < GRID_SIZE && nz >= 0 && nz < GRID_SIZE) {
                    const diagIdx = getIdx(nx, y - 1, nz);
                    if (grid[diagIdx] === 0) {
                        grid[diagIdx] = type;
                        grid[idx] = 0;
                        moved = true;
                        break;
                    }
                }
            }
            
            // Water Flow Horizontal
            if (!moved && type === 2) {
                 const sideCandidates = [
                    [x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]
                ];
                const randIndex = Math.floor(Math.random() * 4);
                const [sx, sz] = sideCandidates[randIndex];
                
                if (sx >= 0 && sx < GRID_SIZE && sz >= 0 && sz < GRID_SIZE) {
                    const sideIdx = getIdx(sx, y, sz);
                    if (grid[sideIdx] === 0) {
                        grid[sideIdx] = type;
                        grid[idx] = 0;
                    }
                }
            }
          }
        }
      }
    }

    // 2. Rendering Logic
    // Reset count before rendering pass
    count = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        for (let x = 0; x < GRID_SIZE; x++) {
           const idx = getIdx(x, y, z);
           const type = grid[idx];
           
           if (type !== 0) {
              tempObject.position.set(x - GRID_SIZE/2 + 0.5, y + 0.5, z - GRID_SIZE/2 + 0.5);
              tempObject.updateMatrix();
              meshRef.current.setMatrixAt(count, tempObject.matrix);
              
              let colorHex = '#ffffff';
              if (type === 1) colorHex = COLORS[ToolType.SAND];
              if (type === 2) colorHex = COLORS[ToolType.WATER];
              if (type === 3) colorHex = COLORS[ToolType.FIRE];
              if (type === 4) colorHex = COLORS[ToolType.STONE];
              
              tempColor.set(colorHex);
              meshRef.current.setColorAt(count, tempColor);
              
              count++;
           }
        }
      }
    }
    
    meshRef.current.count = count;
    
    // Safety check: if context is lost, these might throw, but R3F usually handles it.
    // We mark for update.
    if (meshRef.current.instanceMatrix) meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  // --- Interaction ---
  const placeVoxel = (x: number, y: number, z: number) => {
     if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || z < 0 || z >= GRID_SIZE) return;
     const idx = getIdx(x,y,z);
     
     let typeId = 0;
     if (activeTool === ToolType.SAND) typeId = 1;
     if (activeTool === ToolType.WATER) typeId = 2;
     if (activeTool === ToolType.FIRE) typeId = 3;
     if (activeTool === ToolType.STONE) typeId = 4;
     
     gridRef.current[idx] = typeId;
  };

  const handlePlaneClick = (e: ThreeEvent<MouseEvent>) => {
     e.stopPropagation();
     const point = e.point;
     const x = Math.floor(point.x + GRID_SIZE/2);
     const z = Math.floor(point.z + GRID_SIZE/2);
     const y = 0;
     
     if (activeTool !== ToolType.ERASER) {
        placeVoxel(x, y, z);
     }
  };
  
  const handleMeshClick = (e: ThreeEvent<MouseEvent>) => {
     e.stopPropagation();
     if (!e.face) return;
     
     const point = e.point;
     const normal = e.face.normal;
     const addOp = activeTool !== ToolType.ERASER;
     
     // Move slighly inside or outside based on operation
     const offset = addOp ? 0.5 : -0.5;
     
     const targetX = point.x + normal.x * offset;
     const targetY = point.y + normal.y * offset;
     const targetZ = point.z + normal.z * offset;
     
     const gx = Math.floor(targetX + GRID_SIZE/2);
     const gy = Math.floor(targetY);
     const gz = Math.floor(targetZ + GRID_SIZE/2);
     
     placeVoxel(gx, gy, gz);
  };

  return (
    <group>
       <instancedMesh 
          ref={meshRef} 
          args={[undefined, undefined, TOTAL_VOXELS]} 
          onClick={handleMeshClick}
          castShadow
          receiveShadow
       >
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial roughness={0.5} metalness={0.1} />
       </instancedMesh>

       {/* Floor Plane */}
       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={handlePlaneClick} receiveShadow>
          <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
          <meshBasicMaterial visible={false} />
       </mesh>

       {/* Grid Helper */}
       <gridHelper args={[GRID_SIZE, GRID_SIZE, 0x444444, 0x222222]} position={[0, 0, 0]} />
    </group>
  );
};

// --- Main Wrapper ---

const ThreeMode: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.STONE);

  const tools = [
    { id: ToolType.STONE, icon: FaSquare, color: 'bg-slate-500' },
    { id: ToolType.SAND, icon: FaCube, color: 'bg-yellow-500' },
    { id: ToolType.WATER, icon: FaWater, color: 'bg-blue-500' },
    { id: ToolType.FIRE, icon: FaFire, color: 'bg-red-500' },
    { id: ToolType.ERASER, icon: FaEraser, color: 'bg-gray-700' },
  ];

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-900">
      <Canvas shadows camera={{ position: [15, 15, 15], fov: 45 }}>
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 20, 60]} />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[20, 50, 20]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        >
           <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
        </directionalLight>
        
        <OrbitControls maxPolarAngle={Math.PI / 2 - 0.1} />
        
        <Suspense fallback={null}>
          <VoxelWorld activeTool={activeTool} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* HUD Tools */}
      <div className="absolute top-1/2 -translate-y-1/2 left-6 bg-black/30 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-2 z-50">
        {tools.map((t) => (
           <button
             key={t.id}
             onClick={() => setActiveTool(t.id)}
             className={`
               w-10 h-10 rounded-xl flex items-center justify-center transition-all
               ${activeTool === t.id ? `${t.color} text-white scale-110 shadow-lg` : 'text-white/40 hover:text-white hover:bg-white/10'}
             `}
           >
             <t.icon size={16} />
           </button>
        ))}
        <div className="h-px bg-white/10 my-1" />
        <button 
           className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white/10 transition-all"
           onClick={() => window.location.reload()}
           title="Reset World"
        >
           <FaTrash size={14} />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-white/30 text-[10px] tracking-[0.2em] font-bold uppercase bg-black/20 backdrop-blur px-4 py-2 rounded-full z-50">
         Left Click to Build • Rotate to View
      </div>
    </div>
  );
};

export default ThreeMode;
