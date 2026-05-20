precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;
uniform vec2 u_touchPoint;
uniform float u_pressure;

varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    vec2 touchUV = u_touchPoint;
    float dist = distance(uv, touchUV);
    float distortion = u_intensity * u_pressure * (1.0 - smoothstep(0.0, 0.4, dist));

    float r = texture2D(u_texture, uv + vec2(distortion * 0.02, 0.0)).r;
    float g = texture2D(u_texture, uv).g;
    float b = texture2D(u_texture, uv - vec2(distortion * 0.02, 0.0)).b;

    float highlight = 0.0;
    if (dist < 0.15) {
        highlight = (1.0 - smoothstep(0.0, 0.15, dist)) * 0.3 * u_pressure;
    }
    vec3 color = vec3(r, g, b) + vec3(highlight);

    float caustic = sin(uv.x * 20.0 + u_time) * cos(uv.y * 20.0 + u_time) * 0.05 * u_pressure;
    color += caustic;

    gl_FragColor = vec4(color, 1.0);
}
