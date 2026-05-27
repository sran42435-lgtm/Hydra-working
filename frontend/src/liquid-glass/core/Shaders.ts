/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.Shaders.kt
   Licensed under Apache License, Version 2.0
*/

// ============================================================================
// UTILITY SHADER FUNCTIONS (from RoundedRectSDF)
// ============================================================================

/**
 * Signed Distance Field functions for rounded rectangles
 * Translated from AGSL to GLSL 1:1
 */
export const RoundedRectSDF = `
float radiusAt(vec2 coord, vec4 radii) {
    if (coord.x >= 0.0) {
        if (coord.y <= 0.0) return radii.y;
        else return radii.z;
    } else {
        if (coord.y <= 0.0) return radii.x;
        else return radii.w;
    }
}

float sdRoundedRect(vec2 coord, vec2 halfSize, float radius) {
    vec2 cornerCoord = abs(coord) - (halfSize - vec2(radius));
    float outside = length(max(cornerCoord, 0.0)) - radius;
    float inside = min(max(cornerCoord.x, cornerCoord.y), 0.0);
    return outside + inside;
}

vec2 gradSdRoundedRect(vec2 coord, vec2 halfSize, float radius) {
    vec2 cornerCoord = abs(coord) - (halfSize - vec2(radius));
    if (cornerCoord.x >= 0.0 || cornerCoord.y >= 0.0) {
        return sign(coord) * normalize(max(cornerCoord, 0.0));
    } else {
        float gradX = step(cornerCoord.y, cornerCoord.x);
        return sign(coord) * vec2(gradX, 1.0 - gradX);
    }
}`;

// ============================================================================
// REFRACTION SHADERS
// ============================================================================

/**
 * Basic Rounded Rect Refraction Shader
 * AGSL → GLSL Translation with coordinate system adaptation
 * 
 * Key changes:
 * - content.eval(coord) → texture2D(content, uv)
 * - Coordinate normalization for WebGL UV system
 */
export const RoundedRectRefractionShaderString = `
precision mediump float;

uniform sampler2D content;

uniform vec2 size;
uniform vec2 offset;
uniform vec4 cornerRadii;
uniform float refractionHeight;
uniform float refractionAmount;
uniform float depthEffect;

${RoundedRectSDF}

float circleMap(float x) {
    return 1.0 - sqrt(1.0 - x * x);
}

void main() {
    // Convert UV coordinates to pixel coordinates (AGSL uses pixel coords)
    vec2 coord = gl_FragCoord.xy;
    
    vec2 halfSize = size * 0.5;
    vec2 centeredCoord = (coord + offset) - halfSize;
    float radius = radiusAt(coord, cornerRadii);
    
    float sd = sdRoundedRect(centeredCoord, halfSize, radius);
    if (-sd >= refractionHeight) {
        // Convert pixel coords to UV for texture sampling
        vec2 uv = coord / size;
        gl_FragColor = texture2D(content, uv);
        return;
    }
    sd = min(sd, 0.0);
    
    float d = circleMap(1.0 - -sd / refractionHeight) * refractionAmount;
    float gradRadius = min(radius * 1.5, min(halfSize.x, halfSize.y));
    vec2 grad = normalize(gradSdRoundedRect(centeredCoord, halfSize, gradRadius) + depthEffect * normalize(centeredCoord));
    
    vec2 refractedCoord = coord + d * grad;
    vec2 uv = refractedCoord / size;
    gl_FragColor = texture2D(content, uv);
}`;

/**
 * Rounded Rect Refraction with Chromatic Dispersion
 * Simulates light dispersion similar to prism effect
 * 
 * Performance note: 7 texture samples per pixel - consider optimization
 * for mobile web using lower resolution render targets
 */
export const RoundedRectRefractionWithDispersionShaderString = `
precision mediump float;

uniform sampler2D content;

uniform vec2 size;
uniform vec2 offset;
uniform vec4 cornerRadii;
uniform float refractionHeight;
uniform float refractionAmount;
uniform float depthEffect;
uniform float chromaticAberration;

${RoundedRectSDF}

float circleMap(float x) {
    return 1.0 - sqrt(1.0 - x * x);
}

void main() {
    vec2 coord = gl_FragCoord.xy;
    
    vec2 halfSize = size * 0.5;
    vec2 centeredCoord = (coord + offset) - halfSize;
    float radius = radiusAt(coord, cornerRadii);
    
    float sd = sdRoundedRect(centeredCoord, halfSize, radius);
    if (-sd >= refractionHeight) {
        vec2 uv = coord / size;
        gl_FragColor = texture2D(content, uv);
        return;
    }
    sd = min(sd, 0.0);
    
    float d = circleMap(1.0 - -sd / refractionHeight) * refractionAmount;
    float gradRadius = min(radius * 1.5, min(halfSize.x, halfSize.y));
    vec2 grad = normalize(gradSdRoundedRect(centeredCoord, halfSize, gradRadius) + depthEffect * normalize(centeredCoord));
    
    vec2 refractedCoord = coord + d * grad;
    float dispersionIntensity = chromaticAberration * ((centeredCoord.x * centeredCoord.y) / (halfSize.x * halfSize.y));
    vec2 dispersedCoord = d * grad * dispersionIntensity;
    
    vec4 color = vec4(0.0);
    
    // Red sample
    vec4 red = texture2D(content, (refractedCoord + dispersedCoord) / size);
    color.r += red.r / 3.5;
    color.a += red.a / 7.0;
    
    // Orange sample
    vec4 orange = texture2D(content, (refractedCoord + dispersedCoord * (2.0 / 3.0)) / size);
    color.r += orange.r / 3.5;
    color.g += orange.g / 7.0;
    color.a += orange.a / 7.0;
    
    // Yellow sample
    vec4 yellow = texture2D(content, (refractedCoord + dispersedCoord * (1.0 / 3.0)) / size);
    color.r += yellow.r / 3.5;
    color.g += yellow.g / 3.5;
    color.a += yellow.a / 7.0;
    
    // Green sample (center)
    vec4 green = texture2D(content, refractedCoord / size);
    color.g += green.g / 3.5;
    color.a += green.a / 7.0;
    
    // Cyan sample
    vec4 cyan = texture2D(content, (refractedCoord - dispersedCoord * (1.0 / 3.0)) / size);
    color.g += cyan.g / 3.5;
    color.b += cyan.b / 3.0;
    color.a += cyan.a / 7.0;
    
    // Blue sample
    vec4 blue = texture2D(content, (refractedCoord - dispersedCoord * (2.0 / 3.0)) / size);
    color.b += blue.b / 3.0;
    color.a += blue.a / 7.0;
    
    // Purple sample
    vec4 purple = texture2D(content, (refractedCoord - dispersedCoord) / size);
    color.r += purple.r / 7.0;
    color.b += purple.b / 3.0;
    color.a += purple.a / 7.0;
    
    gl_FragColor = color;
}`;

// ============================================================================
// HIGHLIGHT SHADERS
// ============================================================================

/**
 * Default Highlight Shader
 * Creates specular highlight effect based on surface gradient
 * 
 * AGSL layout(color) uniform half4 color → uniform vec4 color
 */
export const DefaultHighlightShaderString = `
precision mediump float;

uniform vec2 size;
uniform vec4 cornerRadii;
uniform vec4 color;
uniform float angle;
uniform float falloff;

${RoundedRectSDF}

void main() {
    vec2 coord = gl_FragCoord.xy;
    
    vec2 halfSize = size * 0.5;
    vec2 centeredCoord = coord - halfSize;
    float radius = radiusAt(coord, cornerRadii);
    
    float gradRadius = min(radius * 1.5, min(halfSize.x, halfSize.y));
    vec2 grad = gradSdRoundedRect(centeredCoord, halfSize, gradRadius);
    vec2 normal = vec2(cos(angle), sin(angle));
    float d = dot(grad, normal);
    float intensity = pow(abs(d), falloff);
    gl_FragColor = color * intensity;
}`;

/**
 * Ambient Highlight Shader
 * Creates ambient occlusion-style highlight mask
 * Used for generating highlight masks that can be multiplied with content
 */
export const AmbientHighlightShaderString = `
precision mediump float;

uniform vec2 size;
uniform vec4 cornerRadii;
uniform float angle;
uniform float falloff;

${RoundedRectSDF}

void main() {
    vec2 coord = gl_FragCoord.xy;
    
    vec2 halfSize = size * 0.5;
    vec2 centeredCoord = coord - halfSize;
    float radius = radiusAt(coord, cornerRadii);
    
    float gradRadius = min(radius * 1.5, min(halfSize.x, halfSize.y));
    vec2 grad = gradSdRoundedRect(centeredCoord, halfSize, gradRadius);
    vec2 normal = vec2(cos(angle), sin(angle));
    float d = dot(grad, normal);
    float intensity = pow(abs(d), falloff);
    float t = step(0.0, d);
    gl_FragColor = vec4(t, t, t, 1.0) * intensity;
}`;

// ============================================================================
// COLOR ADJUSTMENT SHADERS
// ============================================================================

/**
 * Gamma Adjustment Shader
 * Simple gamma correction applied to texture content
 */
export const GammaAdjustmentShaderString = `
precision mediump float;

uniform sampler2D content;
uniform float power;

void main() {
    vec2 uv = gl_FragCoord.xy / vec2(textureSize(content, 0));
    vec4 color = texture2D(content, uv);
    color.r = pow(color.r, power);
    color.g = pow(color.g, power);
    color.b = pow(color.b, power);
    gl_FragColor = color;
}`;

// ============================================================================
// TYPESCRIPT INTERFACES FOR TYPE SAFETY
// ============================================================================

export interface RefractionUniforms {
  content: WebGLTexture;
  size: [number, number];
  offset: [number, number];
  cornerRadii: [number, number, number, number];
  refractionHeight: number;
  refractionAmount: number;
  depthEffect: number;
}

export interface DispersionUniforms extends RefractionUniforms {
  chromaticAberration: number;
}

export interface HighlightUniforms {
  size: [number, number];
  cornerRadii: [number, number, number, number];
  color: [number, number, number, number];
  angle: number;
  falloff: number;
}

export interface AmbientHighlightUniforms {
  size: [number, number];
  cornerRadii: [number, number, number, number];
  angle: number;
  falloff: number;
}

export interface GammaUniforms {
  content: WebGLTexture;
  power: number;
}

// ============================================================================
// SHADER COMPILATION HELPERS
// ============================================================================

export class ShaderCompiler {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  
  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl;
  }
  
  /**
   * Compile shader from source
   */
  compileShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${info}`);
    }
    
    return shader;
  }
  
  /**
   * Create program from vertex and fragment shaders
   */
  createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
    
    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Program linking failed: ${info}`);
    }
    
    return program;
  }
}

// ============================================================================
// DEFAULT VERTEX SHADER (Shared across all fragment shaders)
// ============================================================================

export const DefaultVertexShader = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}`;

// ============================================================================
// EXPORT MAP FOR EASY ACCESS
// ============================================================================

export const Shaders = {
  // Utility
  RoundedRectSDF,
  
  // Refraction
  RoundedRectRefraction: RoundedRectRefractionShaderString,
  RoundedRectRefractionWithDispersion: RoundedRectRefractionWithDispersionShaderString,
  
  // Highlights
  DefaultHighlight: DefaultHighlightShaderString,
  AmbientHighlight: AmbientHighlightShaderString,
  
  // Color adjustments
  GammaAdjustment: GammaAdjustmentShaderString,
  
  // Vertex
  DefaultVertex: DefaultVertexShader,
} as const;

export type ShaderName = keyof typeof Shaders;
