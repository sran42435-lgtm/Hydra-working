// src/liquid-system/engine/renderer/BlurPipeline.ts

export class BlurPipeline {
  apply(element: HTMLElement, radius: number) {
    element.style.backdropFilter = `blur(${radius}px)`;
    element.style.webkitBackdropFilter = `blur(${radius}px)`;
  }
}
