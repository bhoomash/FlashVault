import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// Realistic Earth with proper blue oceans
function Earth() {
  const meshRef = useRef()
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
    }
  })

  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 6; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        void main() {
          float lon = vUv.x * 6.28318 - 3.14159;
          float lat = vUv.y * 3.14159 - 1.5708;
          
          vec2 noiseCoord = vec2(lon * 2.0, lat * 3.0);
          float continentNoise = fbm(noiseCoord * 1.2);
          float detailNoise = fbm(noiseCoord * 6.0) * 0.25;
          
          // Beautiful ocean colors
          vec3 oceanDeep = vec3(0.02, 0.15, 0.4);
          vec3 oceanMid = vec3(0.05, 0.25, 0.55);
          vec3 oceanShallow = vec3(0.1, 0.4, 0.7);
          
          // Land colors
          vec3 landGreen = vec3(0.15, 0.45, 0.2);
          vec3 landForest = vec3(0.1, 0.35, 0.15);
          vec3 landBrown = vec3(0.45, 0.35, 0.2);
          vec3 desert = vec3(0.85, 0.75, 0.55);
          vec3 snow = vec3(0.98, 0.98, 1.0);
          
          float landMask = smoothstep(0.48, 0.52, continentNoise + detailNoise * 0.4);
          
          // Ocean depth variation
          float oceanDepth = fbm(noiseCoord * 2.5);
          vec3 ocean = mix(oceanDeep, oceanMid, oceanDepth);
          ocean = mix(ocean, oceanShallow, smoothstep(0.4, 0.48, continentNoise) * 0.5);
          
          // Land variation
          float terrainVar = fbm(noiseCoord * 3.0);
          vec3 landColor = mix(landForest, landGreen, terrainVar);
          landColor = mix(landColor, landBrown, smoothstep(0.5, 0.7, terrainVar));
          
          // Desert bands near equator
          float equatorDist = abs(lat);
          landColor = mix(landColor, desert, smoothstep(0.2, 0.5, terrainVar) * smoothstep(0.8, 0.3, equatorDist));
          
          // Polar ice
          float polar = smoothstep(1.1, 1.4, abs(lat));
          landColor = mix(landColor, snow, polar);
          ocean = mix(ocean, snow * 0.9, polar * 0.7);
          
          vec3 color = mix(ocean, landColor, landMask);
          
          // Lighting
          vec3 lightDir = normalize(vec3(1.0, 0.5, 0.8));
          float diff = max(dot(vNormal, lightDir), 0.0);
          float ambient = 0.35;
          color *= (ambient + diff * 0.65);
          
          // Specular on ocean
          vec3 viewDir = normalize(-vPosition);
          vec3 reflectDir = reflect(-lightDir, vNormal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
          color += vec3(1.0) * spec * (1.0 - landMask) * 0.3;
          
          // Atmosphere rim
          float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
          rim = pow(rim, 2.5);
          color += vec3(0.4, 0.7, 1.0) * rim * 0.4;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    })
  }, [])

  // Atmosphere glow
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.4, 0.7, 1.0, 1.0) * intensity * 0.6;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    })
  }, [])

  // Clouds layer
  const cloudsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }
        
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }
        
        void main() {
          vec2 uv = vUv * vec2(4.0, 2.0);
          float clouds = fbm(uv * 3.0);
          clouds = smoothstep(0.4, 0.8, clouds);
          
          vec3 lightDir = normalize(vec3(1.0, 0.5, 0.8));
          float diff = max(dot(vNormal, lightDir), 0.0);
          
          vec3 cloudColor = vec3(1.0) * (0.7 + diff * 0.3);
          gl_FragColor = vec4(cloudColor, clouds * 0.35);
        }
      `
    })
  }, [])

  const cloudsRef = useRef()
  
  useFrame(() => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0015
    }
  })

  return (
    <group>
      <mesh ref={meshRef} material={earthMaterial}>
        <sphereGeometry args={[2, 64, 64]} />
      </mesh>
      <mesh ref={cloudsRef} material={cloudsMaterial}>
        <sphereGeometry args={[2.02, 64, 64]} />
      </mesh>
      <mesh material={atmosphereMaterial}>
        <sphereGeometry args={[2.2, 64, 64]} />
      </mesh>
    </group>
  )
}

// Animated arcs
function ConnectionArcs() {
  const groupRef = useRef()
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
    }
  })
  
  const arcData = useMemo(() => {
    const cities = [
      { lat: 40.7128, lng: -74.006 },
      { lat: 51.5074, lng: -0.1278 },
      { lat: 35.6762, lng: 139.6503 },
      { lat: -33.8688, lng: 151.2093 },
      { lat: 1.3521, lng: 103.8198 },
      { lat: 22.3193, lng: 114.1694 },
      { lat: 48.8566, lng: 2.3522 },
      { lat: 28.6139, lng: 77.209 },
      { lat: -23.5505, lng: -46.6333 },
      { lat: 55.7558, lng: 37.6173 },
      { lat: 37.7749, lng: -122.4194 },
      { lat: 19.4326, lng: -99.1332 },
    ]
    
    const arcs = []
    for (let i = 0; i < 20; i++) {
      const start = cities[Math.floor(Math.random() * cities.length)]
      let end = cities[Math.floor(Math.random() * cities.length)]
      while (end === start) {
        end = cities[Math.floor(Math.random() * cities.length)]
      }
      arcs.push({ start, end })
    }
    return arcs
  }, [])

  const latLngToVector3 = (lat, lng, radius) => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    )
  }

  const createArcGeometry = (start, end) => {
    const startVec = latLngToVector3(start.lat, start.lng, 2.03)
    const endVec = latLngToVector3(end.lat, end.lng, 2.03)
    
    const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5)
    const distance = startVec.distanceTo(endVec)
    midPoint.normalize().multiplyScalar(2.03 + distance * 0.25)
    
    const curve = new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec)
    const points = curve.getPoints(40)
    return new THREE.BufferGeometry().setFromPoints(points)
  }

  const arcColors = ['#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4']

  return (
    <group ref={groupRef}>
      {arcData.map((arc, i) => (
        <line key={i} geometry={createArcGeometry(arc.start, arc.end)}>
          <lineBasicMaterial 
            color={arcColors[i % arcColors.length]} 
            transparent 
            opacity={0.7}
          />
        </line>
      ))}
    </group>
  )
}

// City dots
function CityPoints() {
  const groupRef = useRef()
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
    }
  })
  
  const cities = [
    { lat: 40.7128, lng: -74.006 },
    { lat: 51.5074, lng: -0.1278 },
    { lat: 35.6762, lng: 139.6503 },
    { lat: -33.8688, lng: 151.2093 },
    { lat: 1.3521, lng: 103.8198 },
    { lat: 22.3193, lng: 114.1694 },
    { lat: 48.8566, lng: 2.3522 },
    { lat: 28.6139, lng: 77.209 },
    { lat: 37.7749, lng: -122.4194 },
    { lat: -23.5505, lng: -46.6333 },
  ]

  const latLngToVector3 = (lat, lng, radius) => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    )
  }

  return (
    <group ref={groupRef}>
      {cities.map((city, i) => {
        const pos = latLngToVector3(city.lat, city.lng, 2.04)
        return (
          <mesh key={i} position={[pos.x, pos.y, pos.z]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="#a855f7" />
          </mesh>
        )
      })}
    </group>
  )
}

export default function Globe3D() {
  return (
    <div className="w-full h-full" style={{ background: 'transparent' }}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        style={{ background: 'none' }}
        gl={{ alpha: true, antialias: true, clearColor: 0x000000, clearAlpha: 0 }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />
        <Earth />
        <ConnectionArcs />
        <CityPoints />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  )
}
