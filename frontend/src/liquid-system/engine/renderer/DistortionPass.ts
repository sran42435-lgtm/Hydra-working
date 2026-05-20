// src/liquid-system/engine/renderer/DistortionPass.ts

export class DistortionPass {
  private filterId: string;
  
  constructor(filterId: string = 'liquid-distortion') {
    this.filterId = filterId;
  }

  apply(element: HTMLElement, intensity: number) {
    element.style.filter = `url(#${this.filterId})`;
    // intensity akan diset oleh komponen melalui SVG feDisplacementMap scale
  }
}
