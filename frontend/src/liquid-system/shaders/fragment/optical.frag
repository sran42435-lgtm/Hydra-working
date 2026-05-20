precision mediump float;

// Uniform dari engine
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;

// Uniform dari interaksi
uniform vec2 u_touchPoint;
uniform float u_pressure;
uniform float u_distortionStrength;
uniform float u_chromaticShift;
uniform float u_glowIntensity;
uniform vec3 u_glowColor;
uniform float u_noiseScale;
uniform int u_noiseOctaves;

varying vec2 v_texCoord;

// ---- Masukkan pustaka optik ----
// (isi dari noise.glsl)
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int octaves, float persistence) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float maxValue = 0.0;
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * noise(p * frequency);
        maxValue += amplitude;
        frequency *= 2.0;
        amplitude *= persistence;
    }
    return value / maxValue;
}

// (isi dari distortion.glsl)
vec2 touchDistortion(vec2 uv, vec2 touchPoint, float pressure, float radius, float strength) {
    vec2 direction = uv - touchPoint;
    float distance = length(direction);
    float distortionFactor = exp(-distance * distance / (radius * radius));
    distortionFactor *= pressure * strength;
    return uv + direction * distortionFactor;
}

// (isi dari fresnel.glsl)
float fresnel(vec3 normal, vec3 viewDir, float power) {
    float fresnelFactor = abs(dot(normal, viewDir));
    fresnelFactor = pow(1.0 - fresnelFactor, power);
    return clamp(fresnelFactor, 0.0, 1.0);
}

// (isi dari lighting.glsl)
vec3 specular(vec2 uv, vec2 lightPos, vec3 lightColor, float intensity, float shininess) {
    vec2 direction = lightPos - uv;
    float highlight = exp(-length(direction) * shininess);
    return lightColor * highlight * intensity;
}

vec3 rimLight(vec2 uv, vec2 center, vec3 color, float radius, float falloff) {
    float distance = length(uv - center);
    float rim = smoothstep(radius, radius - falloff, distance);
    return color * rim;
}

void main() {
    vec2 uv = v_texCoord;

    // 1. Distorsi sentuhan
    float radius = 0.25;
    vec2 distortedUV = touchDistortion(uv, u_touchPoint, u_pressure, radius, u_distortionStrength * 0.1);

    // 2. Chromatic aberration
    float shift = u_chromaticShift * u_pressure * 0.01;
    float r = texture2D(u_texture, distortedUV + vec2(shift, 0.0)).r;
    float g = texture2D(u_texture, distortedUV).g;
    float b = texture2D(u_texture, distortedUV - vec2(shift, 0.0)).b;
    vec3 baseColor = vec3(r, g, b);

    // 3. Mikro‑tekstur kaca (noise)
    float microDetail = fbm(uv * u_noiseScale, u_noiseOctaves, 0.5);
    baseColor += microDetail * 0.02;

    // 4. Specular highlight
    vec3 spec = specular(uv, u_touchPoint, u_glowColor, u_glowIntensity * u_pressure, 8.0);
    baseColor += spec;

    // 5. Rim light (efek volumetrik)
    vec3 rim = rimLight(uv, vec2(0.5), u_glowColor * 0.5, 0.6, 0.3) * u_pressure;
    baseColor += rim;

    // 6. Fresnel edge glow
    float fresnelFactor = fresnel(vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, -1.0), 3.0);
    baseColor += u_glowColor * fresnelFactor * 0.15;

    gl_FragColor = vec4(baseColor, 1.0);
}
