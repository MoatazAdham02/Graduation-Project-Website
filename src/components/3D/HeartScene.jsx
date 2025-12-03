import React, { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import './HeartScene.css'

// Preload the model for better performance
useGLTF.preload('/models/realistic_human_heart.glb')

// Error Boundary Component for 3D content
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error("3D Model failed to load:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <FallbackHeart />
    }
    return this.props.children
  }
}

// Loading fallback component
function LoadingSpinner() {
  return (
    <Html center>
      <div style={{ 
        color: '#667eea', 
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(102, 126, 234, 0.2)',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <span>Loading heart model...</span>
      </div>
    </Html>
  )
}

// Fallback heart if model fails to load
function FallbackHeart(props) {
  const mesh = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (mesh.current) {
      mesh.current.rotation.y = t / 2
      mesh.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1)
    }
  })

  return (
    <mesh ref={mesh} {...props}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color="#e74c3c" 
        wireframe 
        emissive="#e74c3c"
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

// Main Heart Model Component
function HeartModel(props) {
  const group = useRef()
  const { scene, nodes, materials } = useGLTF('/models/realistic_human_heart.glb')
  
  // Animate the heart with a subtle pulsing effect
  useFrame((state) => {
    if (group.current) {
      const t = state.clock.getElapsedTime()
      // Gentle rotation
      group.current.rotation.y = Math.sin(t / 4) / 4
      // Subtle floating/pulsing effect (centered around 0)
      group.current.position.y = Math.sin(t / 1.5) / 10
      // Subtle scale pulse (like heartbeat)
      const pulse = 1 + Math.sin(t * 2) * 0.02
      group.current.scale.setScalar(pulse)
    }
  })

  // Enhance materials for better visual appeal
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // Enable shadows
          child.castShadow = true
          child.receiveShadow = true
          
          // Enhance materials if they exist
          if (child.material) {
            // Make materials more vibrant
            if (child.material.color) {
              // Slightly enhance red tones for heart
              const color = child.material.color
              if (color.r > color.g && color.r > color.b) {
                child.material.color.multiplyScalar(1.1)
              }
            }
            
            // Add subtle emissive glow
            if (!child.material.emissive) {
              child.material.emissive = new THREE.Color(0x000000)
            }
            child.material.emissiveIntensity = 0.1
            
            // Improve roughness and metalness for realism
            if (child.material.roughness !== undefined) {
              child.material.roughness = Math.min(child.material.roughness * 0.8, 0.5)
            }
            if (child.material.metalness !== undefined) {
              child.material.metalness = Math.max(child.material.metalness, 0.1)
            }
          }
        }
      })
    }
  }, [scene])

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

// Main HeartScene Component
export default function HeartScene({ 
  autoRotate = true, 
  enableZoom = false,
  enablePan = false,
  className = '',
  style = {},
  scale = 2,
  position = [0, -0.5, 0]
}) {
  return (
    <div 
      className={`heart-3d-container ${className}`}
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '300px',
        position: 'relative',
        ...style
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]} // Limit pixel ratio for performance
      >
        {/* Lighting setup for realistic heart rendering */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight 
          position={[-5, 3, -5]} 
          intensity={0.4}
        />
        <pointLight position={[0, 5, 0]} intensity={0.3} />
        <spotLight 
          position={[0, 10, 0]} 
          angle={0.3} 
          penumbra={1} 
          intensity={0.5}
        />

        <Suspense fallback={<LoadingSpinner />}>
          <ModelErrorBoundary>
            <HeartModel 
              scale={scale} 
              position={position} 
            />
          </ModelErrorBoundary>
          
          {/* Environment for realistic reflections */}
          <Environment preset="sunset" />
          
          {/* Contact shadows for grounding */}
          <ContactShadows 
            position={[0, -1.5, 0]} 
            opacity={0.3} 
            scale={10} 
            blur={2.5} 
            far={4}
            color="#000000"
          />
        </Suspense>

        {/* Controls */}
        <OrbitControls 
          enableZoom={enableZoom}
          enablePan={enablePan}
          autoRotate={autoRotate}
          autoRotateSpeed={2.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={2 * Math.PI / 3}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  )
}



