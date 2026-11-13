'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface Hero3DCanvasProps {
  isRTL?: boolean
  className?: string
}

// Channel colors matching the actual brand channels
const CHANNEL_COLORS = [
  0x25d366, // WhatsApp (Green)
  0xe4405f, // Instagram (Pink)
  0x00b4d8, // Salla (Cyan)
  0x95bf47, // Shopify (Lime)
  0x1877f2, // Facebook (Blue)
  0x2aabee, // Telegram (Sky)
  0x96588a, // WooCommerce (Purple)
  0xea4335, // Gmail (Red)
]

export default function Hero3DCanvas({ isRTL = false, className = '' }: Hero3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webGLSupported, setWebGLSupported] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if WebGL is supported
    const canvasTest = document.createElement('canvas')
    const gl = canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl')
    if (!gl) {
      setWebGLSupported(false)
      return
    }

    const container = containerRef.current
    if (!container) return

    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Dimensions
    const width = container.clientWidth || 580
    const height = container.clientHeight || 520

    // Scene setup
    const scene = new THREE.Scene()

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 1.2, 5.2)

    // Renderer setup with capped DPR for performance
    let renderer: THREE.WebGLRenderer | null = null
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      setWebGLSupported(false)
      return
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    // ── LIGHTS ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00d9ff, 3, 20)
    pointLight.position.set(3, 4, 3)
    scene.add(pointLight)

    const secondaryLight = new THREE.PointLight(0x713cff, 2.5, 20)
    secondaryLight.position.set(-3, -2, 2)
    scene.add(secondaryLight)

    // ── CENTRAL AI CORE ──
    // Inner glowing sphere
    const innerCoreGeo = new THREE.SphereGeometry(0.72, 32, 32)
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0x0f2b5c,
      emissive: 0x1769ff,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.85,
    })
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat)
    scene.add(innerCore)

    // Outer crystalline intelligence cage (Icosahedron)
    const outerCageGeo = new THREE.IcosahedronGeometry(1.05, 1)
    const outerCageMat = new THREE.MeshStandardMaterial({
      color: 0x00d9ff,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    })
    const outerCage = new THREE.Mesh(outerCageGeo, outerCageMat)
    scene.add(outerCage)

    // Second counter-rotating cage
    const secondCageGeo = new THREE.IcosahedronGeometry(1.22, 1)
    const secondCageMat = new THREE.MeshStandardMaterial({
      color: 0x713cff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    })
    const secondCage = new THREE.Mesh(secondCageGeo, secondCageMat)
    scene.add(secondCage)

    // ── ORBITAL COMMUNICATION RINGS ──
    const ringGroup = new THREE.Group()
    scene.add(ringGroup)

    const createRing = (radius: number, tiltX: number, tiltY: number, color: number) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.012, radius + 0.012, 64)
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.28,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.rotation.x = tiltX
      ringMesh.rotation.y = tiltY
      return ringMesh
    }

    const ring1 = createRing(1.85, Math.PI / 2.6, 0.2, 0x00d9ff)
    const ring2 = createRing(2.35, Math.PI / 1.7, -0.35, 0x713cff)
    ringGroup.add(ring1)
    ringGroup.add(ring2)

    // ── CHANNEL SATELLITE NODES ──
    const nodeCount = CHANNEL_COLORS.length
    const nodesGroup = new THREE.Group()
    scene.add(nodesGroup)

    const nodeMeshes: THREE.Mesh[] = []
    const nodeAngles: number[] = []
    const nodeDistances: number[] = []

    const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16)

    for (let i = 0; i < nodeCount; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: CHANNEL_COLORS[i],
        emissive: CHANNEL_COLORS[i],
        emissiveIntensity: 0.8,
        roughness: 0.2,
      })
      const mesh = new THREE.Mesh(nodeGeo, mat)
      const angle = (i / nodeCount) * Math.PI * 2
      const dist = 1.9 + (i % 2) * 0.45
      nodeAngles.push(angle)
      nodeDistances.push(dist)

      mesh.position.set(Math.cos(angle) * dist, Math.sin(angle * 1.5) * 0.35, Math.sin(angle) * dist)
      nodesGroup.add(mesh)
      nodeMeshes.push(mesh)
    }

    // ── INCOMING / OUTGOING STREAM PARTICLES ──
    const particleCount = 140
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const rad = 0.8 + Math.random() * 2.1
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI

      particlePositions[i * 3] = rad * Math.cos(theta) * Math.cos(phi)
      particlePositions[i * 3 + 1] = rad * Math.sin(phi)
      particlePositions[i * 3 + 2] = rad * Math.sin(theta) * Math.cos(phi)

      const colorHex = CHANNEL_COLORS[i % CHANNEL_COLORS.length]
      const color = new THREE.Color(colorHex)
      particleColors[i * 3] = color.r
      particleColors[i * 3 + 1] = color.g
      particleColors[i * 3 + 2] = color.b
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    })

    const particleSystem = new THREE.Points(particleGeo, particleMat)
    scene.add(particleSystem)

    // ── INTERSECTION OBSERVER & VISIBILITY ──
    let isVisible = true
    let isTabActive = true
    let animationFrameId: number

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting
        })
      },
      { threshold: 0.05 }
    )
    observer.observe(container)

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // ── RESIZE HANDLER ──
    const handleResize = () => {
      if (!container || !renderer) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      if (newWidth === 0 || newHeight === 0) return

      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)

    // ── RENDER LOOP ──
    let clock = new THREE.Clock()
    setIsLoaded(true)

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Only render if visible and active to preserve GPU
      if (!isVisible || !isTabActive || prefersReducedMotion) {
        return
      }

      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      // Central core breathing & rotations
      innerCore.rotation.y += delta * 0.4
      innerCore.rotation.x += delta * 0.15

      const pulse = 1 + Math.sin(elapsed * 2.2) * 0.045
      innerCore.scale.set(pulse, pulse, pulse)

      outerCage.rotation.y -= delta * 0.28
      outerCage.rotation.x -= delta * 0.2
      outerCage.rotation.z += delta * 0.12

      secondCage.rotation.y += delta * 0.18
      secondCage.rotation.z -= delta * 0.15

      // Orbital rings gentle sway
      ring1.rotation.z = Math.sin(elapsed * 0.6) * 0.2
      ring2.rotation.z = -Math.sin(elapsed * 0.5) * 0.25

      // Orbiting channel nodes
      for (let i = 0; i < nodeCount; i++) {
        const mesh = nodeMeshes[i]
        const speed = 0.35 + (i % 3) * 0.08
        const angle = nodeAngles[i] + elapsed * speed * (isRTL ? -1 : 1)
        const dist = nodeDistances[i]
        mesh.position.x = Math.cos(angle) * dist
        mesh.position.z = Math.sin(angle) * dist
        mesh.position.y = Math.sin(angle * 2.2 + elapsed) * 0.32
      }

      // Stream particles drifting inwards/outwards
      particleSystem.rotation.y += delta * 0.08 * (isRTL ? -1 : 1)
      particleSystem.rotation.x = Math.sin(elapsed * 0.3) * 0.06

      if (renderer) {
        renderer.render(scene, camera)
      }
    }

    animate()

    // ── CLEANUP ──
    return () => {
      cancelAnimationFrame(animationFrameId)
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', handleResize)

      // Dispose Geometries
      innerCoreGeo.dispose()
      outerCageGeo.dispose()
      secondCageGeo.dispose()
      nodeGeo.dispose()
      particleGeo.dispose()

      // Dispose Materials
      innerCoreMat.dispose()
      outerCageMat.dispose()
      secondCageMat.dispose()
      particleMat.dispose()
      nodeMeshes.forEach((mesh) => {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose())
        } else {
          mesh.material.dispose()
        }
      })

      // Dispose Renderer & Context
      if (renderer) {
        renderer.dispose()
        renderer.forceContextLoss()
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }
    }
  }, [isRTL])

  // Static Fallback for WebGL unavailable or reduced motion
  if (!webGLSupported) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-3xl border border-border bg-surface-elevated/40 p-8 backdrop-blur-xl ${className}`}
        style={{ minHeight: '440px' }}
      >
        <div className="absolute inset-0 bg-radial-gradient opacity-30" />
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full border border-brand/30 bg-brand/10 shadow-[0_0_50px_rgba(23,105,255,0.3)]">
            <div className="h-20 w-20 animate-pulse rounded-full border border-brand-cyan/40 bg-brand-cyan/20" />
            <div className="absolute h-8 w-8 rounded-full bg-brand" />
          </div>
          <span className="text-sm font-bold text-text-primary">Naz Autonomous AI Engine</span>
          <span className="mt-1 text-xs text-text-secondary">Connected Omnichannel Communication Hub</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center ${className}`}
      style={{ minHeight: '460px', width: '100%' }}
    >
      {/* Subtle ambient backglow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-[100px] transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(23, 105, 255, 0.18), rgba(0, 217, 255, 0.12), transparent 70%)',
          opacity: isLoaded ? 1 : 0,
        }}
        aria-hidden="true"
      />
    </div>
  )
}
