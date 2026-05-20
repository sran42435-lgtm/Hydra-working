// src/liquid-system/shaders/core/lighting.glsl

/*
 * Model pencahayaan untuk kaca.
 */

precision mediump float;

struct Light {
    vec2 position;    // posisi cahaya dalam UV space
    vec3 color;       // warna cahaya
    float intensity;  // intensitas (0-1)
};

// Specular highlight (Blinn-Phong)
float specular(vec3 normal, vec3 viewDir, vec3 lightDir, float shininess) {
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), shininess);
    return spec;
}

// Diffuse lighting
float diffuse(vec3 normal, vec3 lightDir) {
    return max(dot(normal, lightDir), 0.0);
}

// Rim lighting (edge glow)
float rimLight(vec3 normal, vec3 viewDir, float power, float intensity) {
    float rim = 1.0 - abs(dot(normal, viewDir));
    return pow(rim, power) * intensity;
}

// Dynamic caustics
float caustic(vec2 uv, float time, float intensity) {
    // Pola kaustik sederhana
    float caustic1 = sin(uv.x * 15.0 + time) * cos(uv.y * 15.0 + time * 0.7);
    float caustic2 = sin(uv.x * 25.0 - time * 0.5) * cos(uv.y * 25.0 + time * 0.3);
    float caustic = (caustic1 + caustic2) * 0.5;
    return caustic * intensity;
}

// Ambient occlusion sederhana
float ambientOcclusion(vec2 uv, float radius) {
    // Simulasi AO berdasarkan posisi UV (untuk rounded corners)
    float distToEdge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    return smoothstep(0.0, radius, distToEdge);
}

// Full lighting computation
vec3 computeLighting(vec2 uv, vec3 normal, vec3 viewDir, Light light, float shininess) {
    vec3 lightDir = normalize(vec3(light.position - uv, 0.5));
    
    float diff = diffuse(normal, lightDir);
    float spec = specular(normal, viewDir, lightDir, shininess);
    float rim = rimLight(normal, viewDir, 3.0, 0.4);
    
    vec3 ambient = light.color * 0.1;
    vec3 diffuseColor = light.color * diff * light.intensity;
    vec3 specularColor = light.color * spec * light.intensity * 0.8;
    vec3 rimColor = vec3(1.0) * rim * 0.3;
    
    return ambient + diffuseColor + specularColor + rimColor;
}
