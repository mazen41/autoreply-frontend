'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface Dashboard3DVisualProps {
  isRTL?: boolean
  className?: string
}

// Actual Naz AutoReply channel brand colors
const CHANNEL_PALETTE = [
  { color: 0x25d366, name: 'WhatsApp' },
  { color: 0xe4405f, name: 'Instagram' },
  { color: 0x00d9ff, name: 'Salla' },
  { color: 0x95bf47, name: 'Shopify' },
  { color: 0x2aabee, name: 'Telegram' },
  { color: 0x713cff, name: 'AI Core' },
]

export default function Dashboard3DVisual({ isRTL = false, className = '' }: Dashboard3DVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webGLSupported, setWebGLSupported] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 1. WebGL Support Test
    const canvasTest = document.createElement('canvas')
    const gl = canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl')
    if (!gl) {
      setWebGLSupported(false)
      return
    }

    const container = containerRef.current
    if (!container) return

    // 2. Accessibility: Reduced Motion Check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setWebGLSupported(false)
      return
    }

    const width = container.clientWidth || 300
    const height = container.clientHeight || 220

    // 3. Scene & Camera Setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50)
    camera.position.set(0, 0.8, 4.4)

    // 4. Renderer with strictly capped DPR for 60fps performance
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
    container.appendChild(renderer.domElement)

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00d9ff, 2.5, 15)
    pointLight.position.set(2, 3, 3)
    scene.add(pointLight)

    const pointLightViolet = new THREE.PointLight(0x713cff, 2.5, 15)
    pointLightViolet.position.set(-2, -2, 2)
    scene.add(pointLightViolet)

    // 6. Central AI Core
    const coreGroup = new THREE.Group()
    scene.add(coreGroup)

    // Outer wireframe icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(1.0, 1)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x1769ff,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)
    coreGroup.add(coreMesh)

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(0.55, 16, 16)
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x00d9ff,
      emissive: 0x1769ff,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.6,
    })
    const innerMesh = new THREE.Mesh(innerGeo, innerMat)
    coreGroup.add(innerMesh)

    // 7. Orbital Rings
    const ringGeo1 = new THREE.TorusGeometry(1.6, 0.015, 12, 48)
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00d9ff, transparent: true, opacity: 0.4 })
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1)
    ring1.rotation.x = Math.PI / 3
    ring1.rotation.y = Math.PI / 6
    scene.add(ring1)

    const ringGeo2 = new THREE.TorusGeometry(1.9, 0.012, 12, 48)
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x713cff, transparent: true, opacity: 0.35 })
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2)
    ring2.rotation.x = -Math.PI / 4
    ring2.rotation.y = Math.PI / 4
    scene.add(ring2)

    // 8. Orbiting Channel Satellites
    const satellites: { mesh: THREE.Mesh; angle: number; speed: number; radius: number; yOffset: number }[] = []
    const satelliteGeo = new THREE.SphereGeometry(0.12, 12, 12)

    CHANNEL_PALETTE.forEach((ch, idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: ch.color,
        emissive: ch.color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      })
      const mesh = new THREE.Mesh(satelliteGeo, mat)
      scene.add(mesh)

      satellites.push({
        mesh,
        angle: (idx * (Math.PI * 2)) / CHANNEL_PALETTE.length,
        speed: 0.012 + (idx % 2) * 0.006,
        radius: 1.65 + (idx % 3) * 0.25,
        yOffset: Math.sin(idx) * 0.4,
      })
    })

    // 9. Floating Particle Field
    const particleCount = 40
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 4.5
      particlePositions[i + 1] = (Math.random() - 0.5) * 3.5
      particlePositions[i + 2] = (Math.random() - 0.5) * 3
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x00d9ff,
      transparent: true,
      opacity: 0.6,
    })
    const particleSystem = new THREE.Points(particleGeo, particleMat)
    scene.add(particleSystem)

    // 10. Mouse Interaction (Pointer tilt)
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseX = ((e.clientX - rect.left) / width - 0.5) * 2
      mouseY = -((e.clientY - rect.top) / height - 0.5) * 2
    }
    container.addEventListener('mousemove', handleMouseMove)

    // 11. Responsive Resize
    const handleResize = () => {
      if (!container || !renderer) return
      const w = container.clientWidth || 300
      const h = container.clientHeight || 220
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // 12. Viewport & Tab Visibility Pause
    let isVisible = true
    let isTabActive = true

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

    setIsLoaded(true)

    // 13. Animation Loop
    let animId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)

      // Only calculate & render when visible in viewport and tab is active
      if (!isVisible || !isTabActive || !renderer) return

      const elapsedTime = clock.getElapsedTime()

      // Smooth mouse follow
      targetX += (mouseX * 0.4 - targetX) * 0.05
      targetY += (mouseY * 0.4 - targetY) * 0.05
      camera.position.x = targetX * 1.2
      camera.position.y = 0.8 + targetY * 0.8
      camera.lookAt(0, 0, 0)

      // Core rotation
      coreGroup.rotation.y = elapsedTime * 0.35
      coreGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.2
      coreGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.06

      // Rings rotation
      ring1.rotation.z = elapsedTime * 0.15
      ring2.rotation.z = -elapsedTime * 0.18

      // Satellites orbiting
      satellites.forEach((sat) => {
        sat.angle += sat.speed
        sat.mesh.position.x = Math.cos(sat.angle) * sat.radius
        sat.mesh.position.z = Math.sin(sat.angle) * sat.radius
        sat.mesh.position.y = sat.yOffset + Math.sin(sat.angle * 2) * 0.15
      })

      // Particle subtle rotation
      particleSystem.rotation.y = elapsedTime * 0.04

      renderer.render(scene, camera)
    }

    animate()

    // 14. Full Memory Clean Up
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      observer.disconnect()

      coreGeo.dispose()
      coreMat.dispose()
      innerGeo.dispose()
      innerMat.dispose()
      ringGeo1.dispose()
      ringMat1.dispose()
      ringGeo2.dispose()
      ringMat2.dispose()
      satelliteGeo.dispose()
      particleGeo.dispose()
      particleMat.dispose()

      if (renderer) {
        renderer.dispose()
        if (renderer.domElement && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement)
        }
      }
    }
  }, [isRTL])

  // Fallback if WebGL unsupported or reduced motion preferred
  if (!webGLSupported) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/20 to-brand-violet/20 shadow-xl shadow-brand/10">
          <div className="absolute -inset-2 animate-pulse rounded-full border border-brand/20" />
          <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-brand to-brand-cyan opacity-80 blur-xs" />
          <span className="relative text-xs font-bold text-white uppercase tracking-wider">AI Core</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[220px] select-none pointer-events-auto overflow-hidden transition-opacity duration-500 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      aria-label="Naz AutoReply 3D Omnichannel Intelligence Telemetry"
    />
  )
}
