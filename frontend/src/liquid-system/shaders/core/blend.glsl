// src/liquid-system/shaders/core/blend.glsl

/*
 * Fungsi blending untuk komposisi glass.
 */

precision mediump float;

// Overlay blending (seperti Photoshop Overlay)
float blendOverlay(float base, float blend) {
    return base < 0.5 
        ? 2.0 * base * blend 
        : 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
}

// Soft light blending
float blendSoftLight(float base, float blend) {
    return blend < 0.5
        ? base - (1.0 - 2.0 * blend) * base * (1.0 - base)
        : base + (2.0 * blend - 1.0) * (sqrt(base) - base);
}

// Screen blending (untuk highlight)
float blendScreen(float base, float blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

// Multiply blending (untuk shadow)
float blendMultiply(float base, float blend) {
    return base * blend;
}

// Linear interpolation dengan alpha
vec4 blendWithAlpha(vec4 base, vec4 overlay, float alpha) {
    return mix(base, overlay, alpha);
}

// Glass compositing
vec4 compositeGlass(vec4 background, vec4 glass, float distortion, float blur) {
    // Glass layer dengan blur dan distorsi
    vec4 blurred = glass; // blur akan dilakukan di pass terpisah
    vec4 composited = mix(background, blurred, glass.a * 0.3);
    return composited;
}
