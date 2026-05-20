// src/liquid-system/engine/renderer/GlassRenderer.ts

export interface GlassSurface {
  id: string;
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram | null;
  uniforms: Record<string, WebGLUniformLocation | null>;
  width: number;
  height: number;
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  isActive: boolean;
}

class GlassRendererEngine {
  private surfaces = new Map<string, GlassSurface>();

  register(id: string, canvas: HTMLCanvasElement): GlassSurface | null {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) {
      console.warn('WebGL not supported for', id);
      return null;
    }

    // ✅ AKTIFKAN EKSTENSI DERIVATIVE
    gl.getExtension('OES_standard_derivatives');

    const surface: GlassSurface = {
      id,
      canvas,
      gl,
      program: null,
      uniforms: {},
      width: canvas.width,
      height: canvas.height,
      texture: null,
      framebuffer: null,
      isActive: true,
    };

    this.surfaces.set(id, surface);
    return surface;
  }

  unregister(id: string) {
    const surface = this.surfaces.get(id);
    if (surface) {
      const gl = surface.gl;
      if (surface.program) gl.deleteProgram(surface.program);
      if (surface.texture) gl.deleteTexture(surface.texture);
      if (surface.framebuffer) gl.deleteFramebuffer(surface.framebuffer);
      this.surfaces.delete(id);
    }
  }

  getSurface(id: string): GlassSurface | undefined {
    return this.surfaces.get(id);
  }

  getAllSurfaces(): GlassSurface[] {
    return Array.from(this.surfaces.values());
  }
}

export const glassRenderer = new GlassRendererEngine();
