'use client';

/**
 * PROFESSIONAL TEAL PLANET VISUALIZER - 2025 OPTIMIZED
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * • 60fps smooth rendering
 * • Simplified GPU operations
 * • Efficient geometry (64x64 resolution)
 * • Fast shader compilation
 * • Low memory usage
 * 
 * VISUAL FEATURES:
 * • Clean teal brand colors
 * • Smooth audio reactivity
 * • Professional appearance
 * • Modern 2025 aesthetic
 * • Life-like response patterns
 * 
 * � NATURAL DYNAMICS:
 * • Organic heartbeat & breathing patterns
 * • Atmospheric weather simulation
 * • Natural surface weathering & erosion
 * • Rotational physics & planetary forces
 * • Life-like energy distribution
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useVoiceAssistant } from '@livekit/components-react';

interface SpaceStarVisualizer3DProps {
  className?: string;
  isVisible?: boolean;
}

// Professional Teal Planet - Optimized Vertex Shader
const starVertexShader = `
  precision mediump float;
  
  uniform float u_time;
  uniform float u_intensity;
  uniform float u_energy;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  // Simple noise for fast rendering
  float noise(vec3 p) {
    return sin(p.x * 2.0) * sin(p.y * 2.0) * sin(p.z * 2.0) * 0.5 + 0.5;
  }
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normal;
    
    // Audio-reactive morphing - Less sensitive with idle breathing
    float time = u_time * 0.5;
    
    // Idle breathing morphing - very subtle
    float idleMorphing = sin(time * 0.6) * 0.008 + sin(time * 1.2) * 0.004; // Gentle breathing pattern
    
    // Bass-driven core pulsing - Reduced
    float bassPulse = sin(time * 2.0) * u_energy * 0.06;
    
    // Mid-frequency breathing pattern - Reduced
    float midBreath = sin(time * 0.8) * u_intensity * 0.04;
    
    // High-frequency surface detail - Minimal
    float surfaceDetail = noise(position * 3.0 + time * 0.5) * u_energy * 0.02;
    
    // Combine all audio-reactive effects with idle breathing
    vec3 morphedPosition = position + normal * max(bassPulse + midBreath + surfaceDetail, idleMorphing);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.0);
  }
`;

// Professional Teal Planet Fragment Shader - Optimized
const starFragmentShader = `
  precision mediump float;
  
  uniform float u_time;
  uniform float u_intensity;
  uniform float u_energy;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  void main() {
    vec2 st = vUv;
    vec3 normal = normalize(vNormal);
    
    // Professional Teal Colors - Website Brand Color (#0891b2)
    vec3 tealDark = vec3(0.032, 0.569, 0.698);   // #0891b2 - Main website color
    vec3 tealBright = vec3(0.08, 0.64, 0.76);    // Slightly brighter teal
    vec3 tealCore = vec3(0.15, 0.72, 0.82);      // Subtle core glow
    
    // Audio-reactive breathing and energy - Less sensitive with idle breathing
    float idleBreathing = sin(u_time * 0.6) * 0.03 + 0.97; // Gentle idle breathing
    float bassPulse = sin(u_time * 2.0) * u_energy * 0.08 + 0.92;  // Reduced sensitivity
    float midBreath = sin(u_time * 0.8) * u_intensity * 0.06 + 0.94; // Reduced sensitivity  
    float energy = max(u_energy * bassPulse * midBreath * 0.6, idleBreathing * 0.5); // Ensure minimum breathing
    
    // Distance from center
    vec2 center = st - vec2(0.5);
    float dist = length(center);
    
    // Audio-reactive gradient layers
    vec3 color = tealDark;
    
    // Bass-reactive core glow - Less intense with idle glow
    float coreGlow = 1.0 - smoothstep(0.0, 0.25 + u_energy * 0.04, dist);
    float idleGlow = sin(u_time * 0.7) * 0.02 + 0.98; // Gentle idle glow
    color = mix(color, tealBright, coreGlow * max(0.4 + u_energy * 0.15, 0.2 * idleGlow));
    
    // Intensity-driven center brightness - Reduced with minimum brightness
    float centerGlow = 1.0 - smoothstep(0.0, 0.08 + u_intensity * 0.02, dist);
    float minBrightness = sin(u_time * 0.5) * 0.015 + 0.985; // Very subtle idle center breathing
    color = mix(color, tealCore, centerGlow * max(energy * (0.6 + u_intensity * 0.3), 0.15 * minBrightness));
    
    // Audio-reactive rim lighting - Subtle with idle rim
    float rimLight = pow(1.0 - dot(normal, vec3(0.0, 0.0, 1.0)), 1.2 + u_energy * 0.3);
    float idleRim = sin(u_time * 0.4) * 0.01 + 0.99; // Very gentle idle rim breathing
    color += tealBright * rimLight * max(0.08 + u_energy * 0.2, 0.03 * idleRim) * max(midBreath, idleBreathing);
    
    // Simple glow intensity - Reduced
    color *= (1.0 + energy * 0.2);
    
    // Clean alpha
    float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Removed particle shaders - focusing only on the blue star

// ChatGPT-Style Teal Planet with Internal Cloud Structures
export function SpaceStarVisualizer3D({ 
  className = '', 
  isVisible = true 
}: SpaceStarVisualizer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId?: number;
    clock: THREE.Clock;
    starMesh: THREE.Mesh;
    starUniforms: any;
    layers: Array<{ mesh: THREE.Mesh; material: THREE.ShaderMaterial }>;
  } | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const { state: agentState, audioTrack: agentAudioTrack } = useVoiceAssistant();
  const agentStateRef = useRef(agentState);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioLevelRef = useRef({
    overall: 0,
    bass: 0,
    mid: 0,
    high: 0,
    peak: 0
  });

  // Update the ref whenever agentState changes
  useEffect(() => {
    agentStateRef.current = agentState;
  }, [agentState]);

  // Setup audio analysis (similar to original but optimized for star animation)
  useEffect(() => {
    const setupAudioAnalysis = async () => {
      try {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        }

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256; // Optimized for performance 
        analyzerRef.current.smoothingTimeConstant = 0.6; // Faster response to audio
        
        const bufferLength = analyzerRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        if (agentAudioTrack?.publication.track?.mediaStreamTrack) {
          try {
            const mediaStreamTrack = agentAudioTrack.publication.track.mediaStreamTrack;
            
            if (mediaStreamTrack.readyState === 'live' && !mediaStreamTrack.muted) {
              const clonedTrack = mediaStreamTrack.clone();
              const mediaStream = new MediaStream([clonedTrack]);
              
              if (mediaStream.active && audioContextRef.current) {
                const agentSource = audioContextRef.current.createMediaStreamSource(mediaStream);
                agentSource.connect(analyzerRef.current);
                console.log('✅ Star visualizer audio analysis connected');
              }
            }
          } catch (streamError) {
            if (streamError instanceof DOMException && streamError.name === 'AbortError') {
              console.debug('🔄 Audio track is being recreated (expected)');
            } else {
              console.warn('⚠️ Could not connect to agent audio stream:', streamError);
            }
          }
        }

      } catch (error) {
        console.error('❌ Star visualizer audio analysis setup failed:', error);
      }
    };

    if (isVisible && isInitialized && agentAudioTrack) {
      const timer = setTimeout(() => {
        setupAudioAnalysis();
      }, 100);
      
      return () => clearTimeout(timer);
    }

    return () => {
      const cleanup = async () => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try {
            await audioContextRef.current.close();
          } catch (error) {
            console.warn('Audio context cleanup warning:', error);
          }
          audioContextRef.current = null;
        }
        analyzerRef.current = null;
        dataArrayRef.current = null;
      };
      
      cleanup();
    };
  }, [isVisible, isInitialized, agentAudioTrack?.publication.track?.sid]);

  // Enhanced audio analysis for real-time star animation
  useEffect(() => {
    if (!analyzerRef.current || !dataArrayRef.current) return;

    const analyzeAudio = () => {
      if (!analyzerRef.current || !dataArrayRef.current) return;

      const dataArray = dataArrayRef.current;
      (analyzerRef.current as any).getByteFrequencyData(dataArray);
      
      // Enhanced audio reactivity for immersive experience
      const bassStart = Math.floor(dataArray.length * 0.0);
      const bassEnd = Math.floor(dataArray.length * 0.2);
      const midStart = Math.floor(dataArray.length * 0.2);
      const midEnd = Math.floor(dataArray.length * 0.6);
      const highStart = Math.floor(dataArray.length * 0.6);
      const highEnd = Math.floor(dataArray.length * 1.0);
      
      let bassSum = 0, midSum = 0, highSum = 0;
      
      // Calculate frequency band averages with better resolution
      for (let i = bassStart; i < bassEnd; i++) bassSum += dataArray[i];
      for (let i = midStart; i < midEnd; i++) midSum += dataArray[i];
      for (let i = highStart; i < highEnd; i++) highSum += dataArray[i];
      
      const bassAvg = bassSum / (bassEnd - bassStart);
      const midAvg = midSum / (midEnd - midStart);
      const highAvg = highSum / (highEnd - highStart);
      
      // Less sensitive audio mapping
      const bassLevel = Math.pow(bassAvg / 255, 0.9) * 1.5;  // Reduced bass sensitivity
      const midLevel = Math.pow(midAvg / 255, 1.0) * 1.2;    // Reduced mid sensitivity  
      const highLevel = Math.pow(highAvg / 255, 1.1) * 1.0;  // Reduced high sensitivity
      
      // Dynamic energy calculation with voice detection - Less reactive
      const voiceActivity = agentStateRef.current === 'speaking' ? 1.2 : 0.4;
      const overallEnergy = ((bassLevel * 0.5) + (midLevel * 0.4) + (highLevel * 0.3)) * voiceActivity * 0.6;
      
      // Faster response times for better audio sync
      audioLevelRef.current = {
        overall: audioLevelRef.current?.overall ? (audioLevelRef.current.overall * 0.4 + overallEnergy * 0.6) : overallEnergy,
        bass: audioLevelRef.current?.bass ? (audioLevelRef.current.bass * 0.5 + bassLevel * 0.5) : bassLevel,
        mid: audioLevelRef.current?.mid ? (audioLevelRef.current.mid * 0.6 + midLevel * 0.4) : midLevel,
        high: audioLevelRef.current?.high ? (audioLevelRef.current.high * 0.7 + highLevel * 0.3) : highLevel,
        peak: Math.max(bassLevel, midLevel, highLevel) * voiceActivity
      };
      
      requestAnimationFrame(analyzeAudio);
    };

    analyzeAudio();
  }, [analyzerRef.current, dataArrayRef.current]);

  // Initialize Three.js scene
  const initializeScene = () => {
    if (!mountRef.current) return;

    try {
      const width = mountRef.current.clientWidth || window.innerWidth;
      const height = mountRef.current.clientHeight || window.innerHeight;

      // ⚡ 2025 PERFORMANCE-OPTIMIZED SCENE - Best Practices
      const scene = new THREE.Scene();
      
      // Optimized camera for modern viewing
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100); // Reduced far plane for performance
      
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance", // GPU acceleration
        precision: "highp", // Sharp rendering
        stencil: false, // Disable unused features for performance
        depth: true,
        premultipliedAlpha: false, // Better alpha blending
        preserveDrawingBuffer: false // Better performance when not needed
      });
      
      // 🚀 2025 Rendering Optimizations
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0.0);
      
      // Smart pixel ratio - 4K sharp but performance-aware
      const basePixelRatio = window.devicePixelRatio;
      const pixelRatio = Math.min(basePixelRatio * 1.5, 3); // Max 3x for best balance
      renderer.setPixelRatio(pixelRatio);
      
      // Modern rendering optimizations
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2; // Slightly brighter for modern look
      
      // Performance settings
      renderer.shadowMap.enabled = false; // Disable shadows for performance
      
      // Enable advanced rendering features for 4K quality
      renderer.shadowMap.enabled = false; // Disable shadows for performance but keep quality
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      
      // Style the canvas
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.pointerEvents = 'none';
      
      mountRef.current.appendChild(renderer.domElement);

      // PROFESSIONAL OPTIMIZED GEOMETRY - Fast Performance
      const starGeometry = new THREE.SphereGeometry(4.0, 64, 64); // Optimized for fast rendering
      
      const starUniforms = {
        u_time: { value: 0.0 },
        u_intensity: { value: 0.4 }, // Reduced base intensity
        u_energy: { value: 0.3 },    // Reduced base energy
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) }
      };

      // ⚡ 2025 GPU-OPTIMIZED MATERIAL
      const starMaterial = new THREE.ShaderMaterial({
        uniforms: starUniforms,
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide, // Single-sided for performance
        depthWrite: false,
        depthTest: true, // Enable depth testing for proper rendering
        alphaTest: 0.001, // Discard transparent pixels for performance
        precision: 'highp' // High precision for sharp visuals
      });
      
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      scene.add(starMesh);

      // Modern Multi-Layer Glow System (ChatGPT style)
      const layers = [];
      
      // 🌟 PERFORMANCE-OPTIMIZED GLOW LAYERS
      const innerGlow = new THREE.SphereGeometry(4.8, 32, 32); // Fast resolution
      const innerGlowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          u_time: { value: 0.0 },
          u_intensity: { value: 0.2 } // Reduced intensity for inner glow
        },
        vertexShader: `
          #ifdef GL_ES
            precision highp float;
          #endif
          uniform float u_time;
          varying vec3 vNormal;
          varying vec2 vUv;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          #ifdef GL_ES
            precision highp float;
          #endif
          uniform float u_time;
          uniform float u_intensity;
          varying vec3 vNormal;
          varying vec2 vUv;
          void main() {
            float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
            float pulse = sin(u_time * 1.8) * 0.25 + 0.75;
            float subPulse = sin(u_time * 3.5) * 0.15 + 0.85;
            float idlePulse = sin(u_time * 0.6) * 0.08 + 0.92; // Gentle idle breathing
            vec3 tealGlow = vec3(0.032, 0.569, 0.698); // Website teal color #0891b2
            float intensity = fresnel * max(pulse * subPulse, idlePulse) * u_intensity;
            gl_FragColor = vec4(tealGlow, max(intensity * 0.25, 0.08)); // Reduced opacity with idle minimum
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        alphaTest: 0.001, // Performance optimization
        precision: 'highp'
      });
      
      // OPTIMIZED ATMOSPHERIC GLOW
      const outerGlow = new THREE.SphereGeometry(6.0, 24, 24); // Maximum performance
      const outerGlowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          u_time: { value: 0.0 },
          u_intensity: { value: 0.1 } // Reduced intensity for outer glow
        },
        vertexShader: `
          #ifdef GL_ES
            precision highp float;
          #endif
          uniform float u_time;
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          #ifdef GL_ES
            precision highp float;
          #endif
          uniform float u_time;
          uniform float u_intensity;
          varying vec3 vNormal;
          void main() {
            float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5);
            float breath = sin(u_time * 1.0) * 0.35 + 0.65;
            float subBreath = sin(u_time * 2.2) * 0.2 + 0.8;
            float idleBreath = sin(u_time * 0.4) * 0.05 + 0.95; // Very gentle idle breathing
            vec3 tealAura = vec3(0.025, 0.45, 0.58); // Darker teal for outer glow
            float intensity = fresnel * max(breath * subBreath, idleBreath) * u_intensity;
            gl_FragColor = vec4(tealAura, max(intensity * 0.1, 0.04)); // Reduced opacity with idle minimum
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      });
      
      const innerGlowMesh = new THREE.Mesh(innerGlow, innerGlowMaterial);
      const outerGlowMesh = new THREE.Mesh(outerGlow, outerGlowMaterial);
      
      scene.add(innerGlowMesh);
      scene.add(outerGlowMesh);
      
      layers.push({ mesh: innerGlowMesh, material: innerGlowMaterial });
      layers.push({ mesh: outerGlowMesh, material: outerGlowMaterial });

      // No particle system - focus only on the blue star

      // Modern 2025 camera positioning - perfect for premium UI
      camera.position.set(0, 0, 18);
      camera.lookAt(0, 0, 0);

      const clock = new THREE.Clock();
      
      sceneRef.current = {
        scene,
        camera,
        renderer,
        clock,
        starMesh,
        starUniforms,
        layers
      };

      setIsInitialized(true);
      console.log('✅ Space star visualizer initialized (Envato reference style)');
      
    } catch (error) {
      console.error('❌ Space star visualizer setup failed:', error);
    }
  };

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current || !isVisible || isInitialized) return;

    const timer = setTimeout(() => {
      initializeScene();
    }, 100);

    return () => clearTimeout(timer);
  }, [isVisible, isInitialized]);

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current || !isInitialized) return;

    // ⚡ 2025 PERFORMANCE-OPTIMIZED ANIMATION LOOP
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime: number = 0) => {
      if (!sceneRef.current) return;
      
      // Frame rate limiting for consistent performance
      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameInterval) {
        sceneRef.current.animationId = requestAnimationFrame(animate);
        return;
      }
      lastTime = currentTime;

      const { 
        scene, 
        camera, 
        renderer, 
        clock, 
        starMesh, 
        starUniforms,
        layers
      } = sceneRef.current;

      const time = clock.getElapsedTime();
      const audioLevels = audioLevelRef.current;
      const currentAgentState = agentStateRef.current;

      // Efficient uniform updates - batch them for performance
      starUniforms.u_time.value = time;

      // Enhanced audio-reactive system for immersive experience
      const stateMultipliers = {
        speaking: { base: 0.6, energy: 3.5, intensity: 2.0 },
        listening: { base: 0.4, energy: 2.0, intensity: 1.2 },
        thinking: { base: 0.3, energy: 1.5, intensity: 0.8 },
        idle: { base: 0.2, energy: 1.0, intensity: 0.5 },
        disconnected: { base: 0.1, energy: 0.5, intensity: 0.3 }
      } as const;
      
      const currentState = stateMultipliers[currentAgentState as keyof typeof stateMultipliers] || stateMultipliers.idle;
      
      // Get real-time audio levels
      const bassLevel = audioLevels.bass || 0;
      const midLevel = audioLevels.mid || 0;
      const highLevel = audioLevels.high || 0;
      const overallLevel = audioLevels.overall || 0;
      const peakLevel = audioLevels.peak || 0;
      
      // Reduced audio responsiveness with idle breathing
      const energyBoost = currentState.energy * 0.5; // Reduce overall boost
      const bassEnergy = Math.min(bassLevel * energyBoost * 0.8, 1.0);     // Reduced bass response
      const midIntensity = Math.min(midLevel * currentState.intensity * 0.8, 0.8); // Reduced mid response
      const overallEnergy = Math.min(overallLevel * energyBoost * 0.6, 1.0);     // Reduced overall response
      const peakBoost = Math.min(peakLevel * energyBoost * 1.0, 1.2);     // Reduced peak response
      
      // Idle breathing patterns for silent states
      const idleBreathing = Math.sin(time * 0.6) * 0.08 + 0.92; // Gentle breathing
      const idleVariation = Math.sin(time * 0.4) * 0.03 + Math.cos(time * 0.9) * 0.02; // Natural variation
      
      // Dynamic responsiveness based on voice activity - More subtle
      const voiceBoost = currentAgentState === 'speaking' ? 1.3 : 0.7;
      const microFluctuation = (Math.random() - 0.5) * 0.01; // Smaller fluctuations
      const naturalVariation = Math.sin(time * 0.7) * 0.02 + Math.cos(time * 1.1) * 0.015; // Smaller variations
      
      // Audio-reactive final calculations with idle minimums - Less intense
      const minIdleIntensity = 0.15 + idleBreathing * 0.1; // Minimum breathing intensity
      const minIdleEnergy = 0.1 + idleVariation * 0.05; // Minimum breathing energy
      
      const finalIntensity = Math.max(
        Math.min(currentState.base + midIntensity + peakBoost * 0.2 + naturalVariation, 1.5) * voiceBoost,
        minIdleIntensity
      );
      const finalEnergy = Math.max(
        Math.min(bassEnergy + overallEnergy * 0.5 + microFluctuation, 1.2) * voiceBoost,
        minIdleEnergy
      );
      
      // Update main star uniforms with enhanced audio response
      starUniforms.u_intensity.value = finalIntensity;
      starUniforms.u_energy.value = finalEnergy;

      // Multi-frequency responsive glow layers
      layers.forEach((layer, index) => {
        layer.material.uniforms.u_time.value = time;
        
        // Different layers respond to different frequencies - Less intense with idle breathing
        const layerIdleBreathing = Math.sin(time * (0.5 + index * 0.1)) * 0.05 + 0.95; // Slightly different breathing per layer
        let layerIntensity;
        if (index === 0) {
          // Inner glow: Bass + Mid frequencies - Reduced with idle minimum
          const innerIdleMin = 0.12 + layerIdleBreathing * 0.03;
          layerIntensity = Math.max(
            Math.min(currentState.base + bassEnergy * 0.5 + midIntensity * 0.4, 1.2) * voiceBoost,
            innerIdleMin
          );
        } else {
          // Outer glow: Mid + High frequencies - Reduced with idle minimum
          const outerIdleMin = 0.08 + layerIdleBreathing * 0.02;
          layerIntensity = Math.max(
            Math.min(currentState.base * 0.6 + midIntensity * 0.7 + overallEnergy * 0.3, 1.0) * voiceBoost,
            outerIdleMin
          );
        }
        
        layer.material.uniforms.u_intensity.value = layerIntensity;
        
        // Audio-reactive rotation - gentler with audio activity
        const rotationSpeed = 0.0005 + (audioLevels.overall * 0.0015); // Reduced rotation speed
        layer.mesh.rotation.y += rotationSpeed * (index + 1);
        layer.mesh.rotation.x += (rotationSpeed * 0.3) * (index + 1); // Reduced X rotation
      });

      // Audio-reactive star rotation - gentler with energy and idle rotation
      const idleRotationSpeed = 0.0003; // Very slow idle rotation
      const starRotationSpeed = Math.max(
        0.001 + (audioLevels.overall * 0.003) + (audioLevels.peak * 0.004),
        idleRotationSpeed
      ); // Reduced speeds with idle minimum
      starMesh.rotation.y += starRotationSpeed;
      starMesh.rotation.x += starRotationSpeed * 0.3; // Reduced X rotation

      // Audio-reactive camera movement - More subtle with idle breathing
      const idleCameraBreathing = Math.sin(time * 0.5) * 0.05; // Gentle idle camera breathing
      const breathingMotion = Math.max(
        Math.sin(time * 0.8) * (0.1 + audioLevels.overall * 0.2),
        idleCameraBreathing
      ); // Reduced breathing with idle minimum
      const bassZoom = audioLevels.bass * 0.8; // Reduced bass zoom effect
      camera.position.z = 18 + breathingMotion - bassZoom;
      
      // Audio-reactive camera sway - More subtle
      const audioSway = audioLevels.mid * 0.15; // Reduced sway
      camera.position.x = Math.sin(time * 0.3) * (0.04 + audioSway); // Reduced movement
      camera.position.y = Math.cos(time * 0.2) * (0.015 + audioSway * 0.3); // Reduced movement
      
      // Add subtle shake on audio peaks - Less intense
      if (audioLevels.peak > 0.8) { // Higher threshold
        camera.position.x += (Math.random() - 0.5) * audioLevels.peak * 0.02; // Reduced shake
        camera.position.y += (Math.random() - 0.5) * audioLevels.peak * 0.015; // Reduced shake
      }
      
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
    };
  }, [isInitialized]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!sceneRef.current || !mountRef.current) return;

      const { camera, renderer } = sceneRef.current;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sceneRef.current) {
        if (sceneRef.current.animationId) {
          cancelAnimationFrame(sceneRef.current.animationId);
        }
        if (sceneRef.current.renderer) {
          sceneRef.current.renderer.dispose();
        }
        // Clean up materials and geometries
        if (sceneRef.current.starMesh.material instanceof THREE.Material) {
          sceneRef.current.starMesh.material.dispose();
        }
        sceneRef.current.starMesh.geometry.dispose();
        
        // Clean up all layers
        sceneRef.current.layers.forEach(layer => {
          if (layer.material instanceof THREE.Material) {
            layer.material.dispose();
          }
          if (layer.mesh.geometry) {
            layer.mesh.geometry.dispose();
          }
        });
        
        if (mountRef.current && sceneRef.current.renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current = null;
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      ref={mountRef} 
      className={`relative w-full h-full ${className}`}
      style={{ 
        width: '100%',
        height: '100%'
      }}
    />
  );
}