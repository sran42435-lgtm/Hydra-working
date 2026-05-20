// src/liquid-system/shaders/core/fresnel.glsl

/*
 * Efek Fresnel — tepi objek lebih terang dari tengah.
 * Memberikan ilusi volume pada kaca.
 */

precision mediump float;

// Fresnel sederhana dengan falloff yang bisa diatur
float fresnel(vec3 normal, vec3 viewDir, float power) {
    float fresnelFactor = 1.0 - abs(dot(normal, viewDir));
    return pow(fresnelFactor, power);
}

// Fresnel dengan edge softness
float fresnelSoft(vec3 normal, vec3 viewDir, float power, float edgeSoftness) {
    float fresnelFactor = 1.0 - abs(dot(normal, viewDir));
    float fresnel = pow(fresnelFactor, power);
    return mix(fresnel, 0.0, smoothstep(edgeSoftness, 1.0, fresnelFactor));
}

// Fresnel untuk surface melengkung
float curvedFresnel(vec2 uv, float curvature, float power) {
    // Simulasi normal dari UV
    vec3 normal = normalize(vec3((uv - 0.5) * curvature, 1.0));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float fresnelFactor = 1.0 - abs(dot(normal, viewDir));
    return pow(fresnelFactor, power);
}
