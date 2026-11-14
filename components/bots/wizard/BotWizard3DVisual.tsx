'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import Image from 'next/image'
import { BotAvatarOption } from './types'

interface BotWizard3DVisualProps {
  avatar: BotAvatarOption
  step: number
  isRTL?: boolean
  className?: string
}

export default function BotWizard3DVisual({
  avatar,
  step,
  isRTL = false,
  className = '',
}: BotWizard3DVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webGLSupported, setWebGLSupported] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  // Track active avatar and step for dynamic lighting and particle colors
  const avatarRef = useRef(avatar)
  avatarRef.current = avatar
  const stepRef = useRef(step)
  stepRef.current = step

  useEffect(() => {
    // 1. Accessibility & WebGL support checks
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setWebGLSupported(false)
      return
    }

    const canvasTest = document.createElement('canvas')
    const gl = canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl')
    if (!gl) {
      setWebGLSupported(false)
      return
    }

    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 480
    const height = container.clientHeight || 560

    // 2. Scene & Camera Setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0, 4.6)

    // 3. Renderer with strict DPR capping for 60fps performance
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

    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.inset = '0'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.pointerEvents = 'none'

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambientLight)

    const primaryLight = new THREE.PointLight(new THREE.Color(avatar.themeColor), 3.2, 12)
    primaryLight.position.set(isRTL ? -2.2 : 2.2, 2.0, 2.5)
    scene.add(primaryLight)

    const rimLight = new THREE.PointLight(0x713cff, 2.0, 10)
    rimLight.position.set(isRTL ? 2.5 : -2.5, -1.8, 1.8)
    scene.add(rimLight)

    // 5. Ambient Glowing Particles
    const particleCount = 280
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    const particleScales = new Float32Array(particleCount)

    const baseColor = new THREE.Color(avatar.themeColor)
    const accentColor = new THREE.Color(0x8b5cf6)

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 8.0
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 7.0
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 5.0 - 0.5

      const mix = Math.random()
      const c = baseColor.clone().lerp(accentColor, mix)
      particleColors[i * 3] = c.r
      particleColors[i * 3 + 1] = c.g
      particleColors[i * 3 + 2] = c.b

      particleScales[i] = Math.random() * 0.04 + 0.015
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

    // 6. Floating Tech Shapes (Rings and Polyhedra)
    // Ring 1
    const ringGeo = new THREE.TorusGeometry(1.65, 0.012, 16, 80)
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(avatar.themeColor),
      wireframe: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.position.set(0, 0, -0.4)
    ringMesh.rotation.x = Math.PI / 3.2
    scene.add(ringMesh)

    // Ring 2 (Secondary counter-rotating)
    const ring2Geo = new THREE.TorusGeometry(2.05, 0.008, 16, 70)
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    })
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat)
    ring2Mesh.position.set(0, 0, -0.6)
    ring2Mesh.rotation.x = -Math.PI / 4
    scene.add(ring2Mesh)

    // Floating Octahedron Crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.18, 0)
    const crystalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatar.themeColor),
      metalness: 0.85,
      roughness: 0.15,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    })
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat)
    crystalMesh.position.set(isRTL ? -1.7 : 1.7, 1.2, 0.6)
    scene.add(crystalMesh)

    // Secondary Floating Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(0.14, 0)
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    })
    const icoMesh = new THREE.Mesh(icoGeo, icoMat)
    icoMesh.position.set(isRTL ? 1.6 : -1.6, -1.1, 0.4)
    scene.add(icoMesh)

    setIsLoaded(true)

    // 7. Mouse Parallax
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    // 8. Animation Loop with Pause Safeguards
    let animationFrameId: number
    let clock = new THREE.Clock()
    let isVisible = true

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (!isVisible || !renderer) return

      const elapsed = clock.getElapsedTime()

      // Smooth mouse follow
      targetX += (mouseX - targetX) * 0.05
      targetY += (mouseY - targetY) * 0.05

      camera.position.x = targetX * 0.4
      camera.position.y = targetY * 0.3
      camera.lookAt(0, 0, 0)

      // Rotate particles slowly
      particleSystem.rotation.y = elapsed * 0.04
      particleSystem.rotation.x = Math.sin(elapsed * 0.02) * 0.1

      // Rotate geometric rings
      ringMesh.rotation.z = elapsed * 0.12
      ringMesh.rotation.y = Math.sin(elapsed * 0.08) * 0.2
      ring2Mesh.rotation.z = -elapsed * 0.08

      // Rotate crystals
      crystalMesh.rotation.x = elapsed * 0.4
      crystalMesh.rotation.y = elapsed * 0.6
      crystalMesh.position.y = 1.2 + Math.sin(elapsed * 1.2) * 0.12

      icoMesh.rotation.x = -elapsed * 0.5
      icoMesh.rotation.z = elapsed * 0.3
      icoMesh.position.y = -1.1 + Math.cos(elapsed * 1.4) * 0.09

      // Dynamically update colors if avatar changes
      const currentAvatarColor = new THREE.Color(avatarRef.current.themeColor)
      primaryLight.color.lerp(currentAvatarColor, 0.08)
      ringMat.color.lerp(currentAvatarColor, 0.08)

      renderer.render(scene, camera)
    }
    animate()

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect
        if (newW > 0 && newH > 0 && renderer) {
          camera.aspect = newW / newH
          camera.updateProjectionMatrix()
          renderer.setSize(newW, newH)
        }
      }
    })
    resizeObserver.observe(container)

    // 10. Visibility & Off-screen pause
    const handleVisibility = () => {
      isVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          isVisible = e.isIntersecting && !document.hidden
        })
      },
      { threshold: 0.1 }
    )
    observer.observe(container)

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('visibilitychange', handleVisibility)
      observer.disconnect()
      resizeObserver.disconnect()

      if (renderer) {
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
        renderer.dispose()
      }

      particleGeo.dispose()
      particleMat.dispose()
      ringGeo.dispose()
      ringMat.dispose()
      ring2Geo.dispose()
      ring2Mat.dispose()
      crystalGeo.dispose()
      crystalMat.dispose()
      icoGeo.dispose()
      icoMat.dispose()
    }
  }, [avatar.themeColor, isRTL])

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* Fallback & Ambient Backdrop Glow */}
      <div
        className="pointer-events-none absolute -inset-10 rounded-full blur-3xl opacity-35 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at center, ${avatar.themeColor} 0%, rgba(113, 60, 255, 0.15) 50%, transparent 75%)`,
        }}
      />
    </div>
  )
}
