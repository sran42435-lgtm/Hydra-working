// src/liquid-system/shaders/core/distortion.glsl

/*
 * Distorsi berbasis UV untuk efek kaca cair.
 */

precision mediump float;

// Distorsi sederhana dengan offset
vec2 distort(vec2 uv, float strength, vec2 direction) {
    return uv + direction * strength;
}

// Distorsi radial (dari titik sentuh)
vec2 radialDistort(vec2 uv, vec2 center, float strength, float radius) {
    vec2 delta = uv - center;
    float dist = length(delta);
    float factor = smoothstep(radius, 0.0, dist) * strength;
    return uv + normalize(delta) * factor;
}

// Distorsi gelombang (seperti ripple)
vec2 waveDistort(vec2 uv, float time, float amplitude, float frequency) {
    float wave = sin(uv.x * frequency + time) * cos(uv.y * frequency + time * 0.7);
    return uv + vec2(wave * amplitude, wave * amplitude * 0.5);
}

// Distorsi noise (organik)
vec2 noiseDistort(vec2 uv, float time, float strength, int octaves) {
    // Menggunakan noise dari noise.glsl (harus di-include)
    // float n = fbm(uv * 4.0 + time * 0.1, octaves, 2.0, 0.5);
    // return uv + vec2(n * strength, n * strength * 0.7);
    
    // Fallback jika noise tidak tersedia
    float n = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 + time * 0.7) * 0.5 + 0.5;
    return uv + vec2(n * strength, n * strength * 0.7);
}

// Chromatic aberration distortion
vec2 chromaticDistort(vec2 uv, float shift, int channel) {
    // channel: 0 = red, 1 = green, 2 = blue
    float direction = float(channel - 1); // -1, 0, 1
    return uv + vec2(shift * direction, 0.0);
}
