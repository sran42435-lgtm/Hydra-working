// src/liquid-system/engine/renderer/RefractionPass.ts

import { glassRenderer, GlassSurface } from './GlassRenderer';

const VERT_SRC = `
attribute vec4 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = a_position;
  v_texCoord = a_texCoord;
}
`;

const FRAG_SRC = `
#extension GL_OES_standard_derivatives : enable
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_touchPoint;
uniform float u_pressure;
uniform float u_strength;
uniform float u_chromaticShift;
uniform float u_glowIntensity;
uniform vec3 u_glowColor;
varying vec2 v_texCoord;

// Curved Lens Refraction
vec2 lensRefraction(vec2 uv, vec2 center, float radius, float strength, float pressure) {
    vec2 delta = uv - center;
    float dist = length(delta);
    
    // Curvature power – nonlinear
    float falloff = smoothstep(radius, 0.0, dist);
    float curve = pow(falloff, 2.0);
    
    // Magnification lens
    float magnify = 1.0 + curve * strength * pressure * 1.8;
    
    // Refracted UV dengan lens magnification
    vec2 refractedUV = center + delta / magnify;
    
    // Edge compression (lens curvature)
    refractedUV += normalize(delta) * curve * 0.06 * pressure;
    
    return refractedUV;
}

// Pseudo surface normal dari curvature (SEKARANG BEKERJA)
vec3 surfaceNormal(vec2 uv, vec2 center, float radius, float strength, float pressure) {
    vec2 delta = uv - center;
    float dist = length(delta);
    float falloff = smoothstep(radius, 0.0, dist);
    float curve = pow(falloff, 2.0) * strength * pressure;
    
    // Gradien curvature
    float dx = dFdx(curve);
    float dy = dFdy(curve);
    
    return normalize(vec3(-dx, -dy, 1.0));
}

// Anisotropic specular berdasarkan normal field
vec3 anisotropicSpecular(vec2 uv, vec2 center, vec3 normal, vec3 lightDir, vec3 lightColor, float intensity) {
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVec = normalize(lightDir + viewDir);
    
    float NdotH = max(dot(normal, halfVec), 0.0);
    float spec = pow(NdotH, 120.0);
    
    vec2 delta = uv - center;
    float dist = length(delta);
    float anisotropic = exp(-dist * 6.0);
    
    return lightColor * spec * intensity * (0.3 + 0.7 * anisotropic);
}

void main() {
    vec2 uv = v_texCoord;
    
    // 1. LENS REFRACTION dengan curvature
    float radius = 0.4;
    vec2 refractedUV = lensRefraction(uv, u_touchPoint, radius, u_strength, u_pressure);
    
    // 2. Chromatic aberration sangat subtle
    float shift = u_chromaticShift * u_pressure * 0.002;
    float r = texture2D(u_texture, refractedUV + vec2(shift, 0.0)).r;
    float g = texture2D(u_texture, refractedUV).g;
    float b = texture2D(u_texture, refractedUV - vec2(shift, 0.0)).b;
    vec3 color = vec3(r, g, b);
    
    // 3. Surface normal & anisotropic specular
    vec3 normal = surfaceNormal(uv, u_touchPoint, radius, u_strength, u_pressure);
    vec3 lightDir = normalize(vec3(u_touchPoint.x - 0.5, u_touchPoint.y - 0.5, 0.8));
    vec3 spec = anisotropicSpecular(uv, u_touchPoint, normal, lightDir, u_glowColor, u_glowIntensity * u_pressure);
    color += spec;
    
    // 4. Edge compression visual
    float edgeDist = length(uv - vec2(0.5));
    float edge = smoothstep(0.45, 0.5, edgeDist);
    color *= 1.0 - edge * 0.15 * u_pressure;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

export class RefractionPass {
  private program: WebGLProgram | null = null;
  private backgroundTexture: WebGLTexture | null = null;

  async captureBackground(surfaceId: string, backgroundElement: HTMLElement) {
    const surface = glassRenderer.getSurface(surfaceId);
    if (!surface) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const capture = await html2canvas(backgroundElement, {
        backgroundColor: null,
        scale: 1,
        useCORS: true,
        logging: false,
      });
      this.updateTextureFromImage(surface, capture);
    } catch {
      this.updateTextureFromFallback(surface, backgroundElement);
    }
  }

  private updateTextureFromImage(surface: GlassSurface, image: HTMLCanvasElement) {
    const gl = surface.gl;
    if (!this.backgroundTexture) {
      this.backgroundTexture = gl.createTexture();
    }
    gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    surface.texture = this.backgroundTexture;
  }

  private updateTextureFromFallback(surface: GlassSurface, element: HTMLElement) {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = surface.width;
    bgCanvas.height = surface.height;
    const ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    const bgColor = window.getComputedStyle(element).backgroundColor || '#fdf6f0';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    this.updateTextureFromImage(surface, bgCanvas);
  }

  apply(surfaceId: string, params: {
    strength: number;
    chromaticShift: number;
    glowIntensity: number;
    glowColor: [number, number, number];
    noiseScale: number;
    noiseOctaves: number;
  }) {
    const surface = glassRenderer.getSurface(surfaceId);
    if (!surface) return;

    const gl = surface.gl;
    if (!this.program) {
      const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
      const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
      const prog = gl.createProgram()!;
      gl.attachShader(prog, vert);
      gl.attachShader(prog, frag);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(prog));
        return;
      }
      this.program = prog;
    }

    surface.program = this.program;
    const p = this.program;
    gl.useProgram(p);
    surface.uniforms = {
      u_texture: gl.getUniformLocation(p, 'u_texture'),
      u_resolution: gl.getUniformLocation(p, 'u_resolution'),
      u_time: gl.getUniformLocation(p, 'u_time'),
      u_touchPoint: gl.getUniformLocation(p, 'u_touchPoint'),
      u_pressure: gl.getUniformLocation(p, 'u_pressure'),
      u_strength: gl.getUniformLocation(p, 'u_strength'),
      u_chromaticShift: gl.getUniformLocation(p, 'u_chromaticShift'),
      u_glowIntensity: gl.getUniformLocation(p, 'u_glowIntensity'),
      u_glowColor: gl.getUniformLocation(p, 'u_glowColor'),
    };

    gl.uniform1f(surface.uniforms.u_strength, params.strength);
    gl.uniform1f(surface.uniforms.u_chromaticShift, params.chromaticShift);
    gl.uniform1f(surface.uniforms.u_glowIntensity, params.glowIntensity);
    gl.uniform3f(surface.uniforms.u_glowColor, ...params.glowColor);
  }

  render(surfaceId: string) {
    const surface = glassRenderer.getSurface(surfaceId);
    if (!surface || !surface.program || !surface.texture) return;

    const gl = surface.gl;
    gl.useProgram(surface.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, surface.texture);
    gl.uniform1i(surface.uniforms.u_texture, 0);

    gl.uniform2f(surface.uniforms.u_resolution, surface.width, surface.height);
    gl.uniform1f(surface.uniforms.u_time, performance.now() / 1000);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('Shader compile failed');
  }
  return shader;
}
