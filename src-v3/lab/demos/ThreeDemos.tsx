import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const ThreeConstellationDemo: React.FC = () => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const width = host.clientWidth || 320;
    const height = 190;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.2;

    const coreGeo = new THREE.IcosahedronGeometry(1.05, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const count = 140;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 1.65 + (i % 5) * 0.12;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const ptsGeo = new THREE.BufferGeometry();
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const ptsMat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 0.06, transparent: true, opacity: 0.9 });
    const points = new THREE.Points(ptsGeo, ptsMat);
    scene.add(points);

    let targetRotX = 0;
    let targetRotY = 0;
    const onMove = (ev: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetRotY = ((ev.clientX - rect.left) / rect.width - 0.5) * 1.4;
      targetRotX = ((ev.clientY - rect.top) / rect.height - 0.5) * 1.0;
    };
    host.addEventListener('pointermove', onMove);

    let raf = 0;
    const tick = () => {
      if (!pausedRef.current) {
        core.rotation.y += 0.006;
        core.rotation.x += 0.003;
        points.rotation.y += (targetRotY - points.rotation.y) * 0.04 + 0.0025;
        points.rotation.x += (targetRotX - points.rotation.x) * 0.04;
      }
      renderer?.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', onMove);
      coreGeo.dispose();
      coreMat.dispose();
      ptsGeo.dispose();
      ptsMat.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <div className="ap-lab-demo-inner">
      <div ref={hostRef} className="ap-lab-canvas-box" />
      <div className="ap-lab-controls">
        <button type="button" className="ap-lab-btn" onClick={() => setPaused((p) => !p)}>
          {paused ? 'Resume 3D Orbit' : 'Pause 3D Orbit'}
        </button>
        <span className="ap-lab-hint">Move pointer over canvas to tilt constellation</span>
      </div>
    </div>
  );
};

export const GlslShaderWaveDemo: React.FC = () => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [freq, setFreq] = useState(3.2);
  const freqRef = useRef(freq);
  freqRef.current = freq;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const width = host.clientWidth || 320;
    const height = 190;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uFreq: { value: freqRef.current }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uFreq;
        void main() {
          float wave1 = sin(vUv.x * uFreq * 3.14159 + uTime * 1.4) * 0.16;
          float wave2 = cos(vUv.x * (uFreq * 1.5) * 3.14159 - uTime * 1.1) * 0.11;
          float dist1 = abs(vUv.y - (0.5 + wave1));
          float dist2 = abs(vUv.y - (0.5 + wave2));
          float glow1 = 0.018 / (dist1 + 0.012);
          float glow2 = 0.014 / (dist2 + 0.014);
          vec3 col = vec3(0.22, 0.55, 0.98) * glow1 + vec3(0.06, 0.82, 0.65) * glow2;
          float grid = step(0.96, fract(vUv.x * 12.0)) * 0.08 + step(0.96, fract(vUv.y * 6.0)) * 0.08;
          gl_FragColor = vec4(col + vec3(0.18, 0.28, 0.45) * grid, 0.95);
        }
      `
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      uniforms.uTime.value = (now - start) / 1000;
      uniforms.uFreq.value = freqRef.current;
      renderer?.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      quad.geometry.dispose();
      material.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <div className="ap-lab-demo-inner">
      <div ref={hostRef} className="ap-lab-canvas-box" />
      <div className="ap-lab-controls">
        <label className="ap-lab-slider-label">
          <span>Wave Frequency ({freq.toFixed(1)})</span>
          <input
            type="range"
            min="1.5"
            max="6.0"
            step="0.5"
            value={freq}
            onChange={(e) => setFreq(parseFloat(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
};
