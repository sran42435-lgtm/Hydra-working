/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.RuntimeShaderCache.kt
   Licensed under Apache License, Version 2.0
*/

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a compiled WebGL shader program ready for use.
 * Equivalent to Android's RuntimeShader.
 */
export interface WebGLRuntimeShader {
  /** Unique key for caching */
  readonly key: string;
  /** Original AGSL/GLSL source */
  readonly source: string;
  /** Compiled WebGL program */
  readonly program: WebGLProgram;
  /** Set float uniform value */
  setFloatUniform(name: string, value: number): void;
  /** Set float array uniform (vec2, vec3, vec4) */
  setFloatUniform(name: string, ...values: number[]): void;
  /** Set color uniform (converts RGBA to normalized floats) */
  setColorUniform(name: string, color: number): void;
  /** Get uniform location (for manual binding) */
  getUniformLocation(name: string): WebGLUniformLocation | null;
}

// ============================================================================
// RUNTIME SHADER CACHE INTERFACE
// ============================================================================

/**
 * Interface for caching compiled shader programs.
 * Port of RuntimeShaderCache sealed interface.
 */
export interface RuntimeShaderCache {
  /**
   * Obtain a compiled shader from cache, or compile and cache if not present.
   * 
   * @param key - Unique identifier for this shader
   * @param source - GLSL fragment shader source
   * @returns Compiled WebGLRuntimeShader
   */
  obtainRuntimeShader(key: string, source: string): WebGLRuntimeShader;
}

// ============================================================================
// RUNTIME SHADER CACHE IMPLEMENTATION
// ============================================================================

/**
 * Default implementation of RuntimeShaderCache.
 * Port of RuntimeShaderCacheImpl.
 * 
 * Uses Map for O(1) lookup and lazy compilation.
 */
export class RuntimeShaderCacheImpl implements RuntimeShaderCache {
  private runtimeShaders: Map<string, WebGLRuntimeShader> = new Map();
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  
  /**
   * Default vertex shader for full-screen quad rendering.
   * Used for all runtime shader effects.
   */
  private static readonly DEFAULT_VERTEX_SHADER = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl;
  }

  /**
   * Obtain or compile a runtime shader.
   * Port of RuntimeShaderCacheImpl.obtainRuntimeShader()
   */
  obtainRuntimeShader(key: string, source: string): WebGLRuntimeShader {
    const existing = this.runtimeShaders.get(key);
    if (existing) {
      return existing;
    }

    const shader = this.compileRuntimeShader(key, source);
    this.runtimeShaders.set(key, shader);
    return shader;
  }

  /**
   * Compile a single shader program.
   */
  private compileRuntimeShader(key: string, source: string): WebGLRuntimeShader {
    const gl = this.gl;

    // Compile vertex shader
    const vertexShader = this.compileShader(
      gl.VERTEX_SHADER,
      RuntimeShaderCacheImpl.DEFAULT_VERTEX_SHADER
    );

    // Compile fragment shader
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, source);

    // Link program
    const program = gl.createProgram();
    if (!program) {
      throw new Error(`Failed to create WebGL program for shader: ${key}`);
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error(`Failed to link shader program "${key}": ${log}`);
    }

    // Clean up individual shaders (no longer needed after linking)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // Create and return the runtime shader wrapper
    return this.createRuntimeShaderWrapper(key, source, program);
  }

  /**
   * Compile an individual shader stage.
   */
  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader object');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      const typeName = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
      gl.deleteShader(shader);
      throw new Error(`${typeName} shader compilation failed: ${log}`);
    }

    return shader;
  }

  /**
   * Create a runtime shader wrapper with uniform setters.
   */
  private createRuntimeShaderWrapper(
    key: string,
    source: string,
    program: WebGLProgram
  ): WebGLRuntimeShader {
    const gl = this.gl;
    const uniformCache: Map<string, WebGLUniformLocation> = new Map();

    const getUniform = (name: string): WebGLUniformLocation | null => {
      if (uniformCache.has(name)) {
        return uniformCache.get(name)!;
      }
      const location = gl.getUniformLocation(program, name);
      uniformCache.set(name, location!);
      return location;
    };

    return {
      key,
      source,
      program,

      setFloatUniform(name: string, ...values: number[]): void {
        const location = getUniform(name);
        if (!location) return;

        switch (values.length) {
          case 1:
            gl.uniform1f(location, values[0]);
            break;
          case 2:
            gl.uniform2f(location, values[0], values[1]);
            break;
          case 3:
            gl.uniform3f(location, values[0], values[1], values[2]);
            break;
          case 4:
            gl.uniform4f(location, values[0], values[1], values[2], values[3]);
            break;
          default:
            console.warn(`Unsupported uniform float count: ${values.length} for "${name}"`);
        }
      },

      setColorUniform(name: string, color: number): void {
        const location = getUniform(name);
        if (!location) return;

        // Android Color.toArgb() format: ARGB
        // Web expects: RGBA normalized
        const r = ((color >> 16) & 0xff) / 255;
        const g = ((color >> 8) & 0xff) / 255;
        const b = (color & 0xff) / 255;
        const a = ((color >> 24) & 0xff) / 255;
        gl.uniform4f(location, r, g, b, a);
      },

      getUniformLocation(name: string): WebGLUniformLocation | null {
        return getUniform(name);
      },
    };
  }

  /**
   * Clear all cached shaders.
   * Port of RuntimeShaderCacheImpl.clear()
   */
  clear(): void {
    const gl = this.gl;
    for (const shader of this.runtimeShaders.values()) {
      gl.deleteProgram(shader.program);
    }
    this.runtimeShaders.clear();
  }

  /**
   * Get the number of cached shaders.
   */
  get size(): number {
    return this.runtimeShaders.size;
  }

  /**
   * Check if a shader is cached.
   */
  has(key: string): boolean {
    return this.runtimeShaders.has(key);
  }

  /**
   * Remove a specific shader from cache.
   */
  remove(key: string): boolean {
    const shader = this.runtimeShaders.get(key);
    if (shader) {
      this.gl.deleteProgram(shader.program);
      return this.runtimeShaders.delete(key);
    }
    return false;
  }
}

// ============================================================================
// WEBGL 2 VARIANT (for advanced features)
// ============================================================================

/**
 * WebGL 2 implementation with additional features.
 * Use when WebGL 2 is available for better performance.
 */
export class RuntimeShaderCacheWebGL2 extends RuntimeShaderCacheImpl {
  constructor(gl: WebGL2RenderingContext) {
    super(gl);
  }

  /**
   * WebGL 2-specific: Use uniform blocks for better performance
   */
  setUniformBlock(shaderKey: string, blockName: string, bindingPoint: number): void {
    const shader = (this as any).runtimeShaders.get(shaderKey);
    if (!shader) return;

    const gl = (this as any).gl as WebGL2RenderingContext;
    const index = gl.getUniformBlockIndex(shader.program, blockName);
    if (index !== gl.INVALID_INDEX) {
      gl.uniformBlockBinding(shader.program, index, bindingPoint);
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create the appropriate cache based on WebGL version.
 */
export function createRuntimeShaderCache(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): RuntimeShaderCacheImpl {
  if (gl instanceof WebGL2RenderingContext) {
    return new RuntimeShaderCacheWebGL2(gl);
  }
  return new RuntimeShaderCacheImpl(gl);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RuntimeShaderCacheImpl;
