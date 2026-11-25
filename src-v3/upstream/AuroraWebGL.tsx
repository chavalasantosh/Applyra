/**
 * Upstream Provenance:
 * - DavidHDev/react-bits (Priority_4_UI_Component_Libraries/DavidHDev__react-bits/src/ts-default/Backgrounds/Aurora/Aurora.tsx)
 *   WebGL2 #version 300 es GLSL Simplex Noise Aurora Shader
 */
import React, { useEffect, useRef } from 'react';

export interface AuroraWebGLProps {
  colorStops?: [string, string, string];
  amplitude?: number;
  speed?: number;
  paused?: boolean;
  className?: string;
}

const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uAmplitude;
out vec4 outColor;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec3 ramp = mix(uColor0, uColor1, smoothstep(0.0, 0.55, uv.x));
  ramp = mix(ramp, uColor2, smoothstep(0.45, 1.0, uv.x));
  float n = snoise(vec2(uv.x * 2.2 + uTime * 0.12, uTime * 0.22)) * 0.5 * uAmplitude;
  float h = exp(n) * 0.55;
  float band = smoothstep(0.12, 0.65, uv.y - h + 0.42);
  float glow = band * (1.0 - smoothstep(0.55, 1.0, uv.y));
  outColor = vec4(ramp * glow * 1.35, clamp(glow * 0.9, 0.0, 1.0));
}`;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const AuroraWebGL: React.FC<AuroraWebGLProps> = ({
  colorStops = ['#3b82f6', '#06b6d4', '#10b981'],
  amplitude = 1.0,
  speed = 1.0,
  paused = false,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fallback, setFallback] = React.useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) {
      setFallback(true);
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'aPosition');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uResolution');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uAmp = gl.getUniformLocation(prog, 'uAmplitude');
    const uC0 = gl.getUniformLocation(prog, 'uColor0');
    const uC1 = gl.getUniformLocation(prog, 'uColor1');
    const uC2 = gl.getUniformLocation(prog, 'uColor2');

    let raf = 0;
    const start = performance.now();

    const render = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, ((now - start) / 1000) * speed);
      gl.uniform1f(uAmp, amplitude);
      gl.uniform3fv(uC0, hexToRgb(colorStops[0]));
      gl.uniform3fv(uC1, hexToRgb(colorStops[1]));
      gl.uniform3fv(uC2, hexToRgb(colorStops[2]));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!paused) {
        raf = requestAnimationFrame(render);
      }
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [amplitude, colorStops, paused, speed]);

  if (fallback) {
    return (
      <div
        className={className}
        style={{
          background: `radial-gradient(circle at 30% 40%, ${colorStops[0]}44, transparent 60%), radial-gradient(circle at 70% 60%, ${colorStops[2]}44, transparent 60%)`
        }}
      />
    );
  }

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%', display: 'block' }} />;
};
