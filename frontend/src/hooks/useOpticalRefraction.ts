// frontend/src/hooks/useOpticalRefraction.ts

import { useEffect, useRef, useCallback } from "react";

interface OpticalRefractionOptions {
  intensity?: number;
  enableChromaticAberration?: boolean;
  enableCaustics?: boolean;
}

export function useOpticalRefraction(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: OpticalRefractionOptions = {}
) {
  const {
    intensity = 0.3,
    enableChromaticAberration = true,
    enableCaustics = true,
  } = options;

  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const touchPointRef = useRef<[number, number]>([0.5, 0.5]);
  const pressureRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true });
    if (!gl) return;

    glRef.current = gl;

    // Vertex shader
    const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(
      vertShader,
      `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `
    );
    gl.compileShader(vertShader);

    // Fragment shader (sama dengan file chromaticAberration.frag)
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(
      fragShader,
      `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_intensity;
      uniform vec2 u_touchPoint;
      uniform float u_pressure;
      varying vec2 v_texCoord;

      void main() {
        vec2 uv = v_texCoord;
        vec2 touchUV = u_touchPoint;
        float dist = distance(uv, touchUV);
        float distortion = u_intensity * u_pressure * (1.0 - smoothstep(0.0, 0.4, dist));
        float r = texture2D(u_texture, uv + vec2(distortion * 0.02, 0.0)).r;
        float g = texture2D(u_texture, uv).g;
        float b = texture2D(u_texture, uv - vec2(distortion * 0.02, 0.0)).b;
        float highlight = 0.0;
        if (dist < 0.15) {
          highlight = (1.0 - smoothstep(0.0, 0.15, dist)) * 0.3 * u_pressure;
        }
        vec3 color = vec3(r, g, b) + vec3(highlight);
        float caustic = sin(uv.x * 20.0 + u_time) * cos(uv.y * 20.0 + u_time) * 0.05 * u_pressure;
        color += caustic;
        gl_FragColor = vec4(color, 1.0);
      }
    `
    );
    gl.compileShader(fragShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    programRef.current = program;

    // Setup quad
    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1,
    ]);
    const texCoords = new Float32Array([
      0, 1, 1, 1, 0, 0, 1, 0,
    ]);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const aTex = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);
  }, [canvasRef]);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    timeRef.current += 0.016;

    gl.uniform2f(
      gl.getUniformLocation(program, "u_resolution"),
      gl.canvas.width,
      gl.canvas.height
    );
    gl.uniform1f(gl.getUniformLocation(program, "u_time"), timeRef.current);
    gl.uniform1f(gl.getUniformLocation(program, "u_intensity"), intensity);
    gl.uniform2f(
      gl.getUniformLocation(program, "u_touchPoint"),
      touchPointRef.current[0],
      touchPointRef.current[1]
    );
    gl.uniform1f(gl.getUniformLocation(program, "u_pressure"), pressureRef.current);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animFrameRef.current = requestAnimationFrame(render);
  }, [intensity]);

  const startRender = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
  }, [render]);

  const stopRender = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const setTouchPoint = useCallback((x: number, y: number) => {
    touchPointRef.current = [x, y];
  }, []);

  const setPressure = useCallback((p: number) => {
    pressureRef.current = p;
  }, []);

  useEffect(() => {
    initWebGL();
    return () => stopRender();
  }, [initWebGL, stopRender]);

  return {
    startRender,
    stopRender,
    setTouchPoint,
    setPressure,
  };
}
