// src/liquid-system/engine/compositor/SurfaceCompositor.ts

import { RefractionPass } from '../renderer/RefractionPass';
import { BlurPipeline } from '../renderer/BlurPipeline';
import { DistortionPass } from '../renderer/DistortionPass';

export class SurfaceCompositor {
  refraction = new RefractionPass();
  blur = new BlurPipeline();
  distortion = new DistortionPass();

  compose(surfaceId: string, element: HTMLElement) {
    // Render blur sebagai dasar
    this.blur.apply(element, 24);
    
    // Render distorsi jika shader tidak tersedia
    this.distortion.apply(element, 10);
    
    // Render optik
    this.refraction.render(surfaceId);
  }
}
