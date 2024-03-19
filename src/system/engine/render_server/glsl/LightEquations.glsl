// float ndf(l, n, v);
// BlinnPhong
float ndf(in vec3 l, in vec3 v, in vec3 n, in float power, in float gloss) {
    vec3 h = normalize(l + v);
    float distribution = pow(max(dot(n, h), 0.0), gloss) * power;
    distribution *= (2.0 + power) / TAU;
    return distribution;
}
// Phong
float ndf(in vec3 l, in vec3 v, in vec3 n, in float power, in float gloss) {
    vec3 r = reflect(-l, n);
    float distribution = pow(max(dot(r, v), 0.0), gloss) * power;
    distribution *= (2.0 + power) / TAU;
    return distribution;
}
// Beckmann
float ndf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
    float roughness_sqr = roughness * roughness;
    vec3 h = normalize(l + v);
    float ndoth = max(dot(n, h), 0.0);
    float ndoth_sqr = ndoth * ndoth;
    return max(EPSILON, (1.0 / (PI * roughness_sqr * ndoth_sqr * ndoth_sqr)) * exp((ndoth_sqr - 1.0) / (roughness_sqr * ndoth_sqr)));
}
// Gaussian
float ndf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
    float roughness_sqr = roughness * roughness;
    vec3 h = normalize(l + v);
    float ndoth = max(dot(n, h), 0.0);
    float thetah = acos(ndoth);
    return exp(-thetah * thetah / roughness_sqr);
}
// GGX
float ndf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
    float roughness_sqr = roughness * roughness;
    vec3 h = normalize(l + v);
    float ndoth = max(dot(n, h), 0.0);
    float ndoth_sqr = ndoth * ndoth;
    float tan_ndoth_sqr = (1.0 - ndoth_sqr) / ndoth_sqr;
    return (1.0 / PI) * pow(roughness / max(ndoth_sqr * (roughness_sqr + tan_ndoth_sqr), EPSILON), 2.0);
}
// TrowbridgeReitz
float ndf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
    float roughness_sqr = roughness * roughness;
    vec3 h = normalize(l + v);
    float ndoth = max(dot(n, h), 0.0);
    float distribution = ndoth * ndoth * (roughness_sqr - 1.0) + 1.0;
    return roughness_sqr / (PI * distribution * distribution);
}
// TrowbridgeReitzAnisotropic
float ndf(in vec3 l, in vec3 v, in vec3 n, in float smomthness, in float anisotropic, in vec3 tangent, in vec3 bitangent) {
    vec3 h = normalize(l + v);
    float ndoth = max(dot(n, h), 0.0);
    float aspect = sqrt(1.0 - anisotropic * 0.9);
    float x = max(0.001, pow(1.0 - smomthness, 2.0) / aspect) * 5;
    float y = max(0.001, pow(1.0 - smomthness, 2.0) * aspect) * 5;
    return 1.0 / (PI * x * y * pow(pow(dot(h, tangent) / x, 2.0) + pow(dot(h, bitangent) / y, 2.0) + ndoth * ndoth), 2.0);
}

// float gsf(l, n, v);
// Implicit
float gsf(in vec3 l, in vec3 v, in vec3 n) {
    float ndotl = max(dot(n, l), 0.0);
    float ndotv = max(dot(n, v), 0.0);
    return ndotl * ndotv;
}
// AshikhminShirley
float gsf(in vec3 l, in vec3 v, in vec3 n) {
    float ndotl = max(dot(n, l), 0.0);
    float ndotv = max(dot(n, v), 0.0);
    vec3 h = normalize(l + v);
    float ldoth = max(dot(l, h), 0.0);
    return ndotl * ndotv / (ldoth * max(ndotl, ndotv));
}
// AshikhminPremoze
float gsf(in vec3 l, in vec3 v, in vec3 n) {
    float ndotl = max(dot(n, l), 0.0);
    float ndotv = max(dot(n, v), 0.0);
    float ndotl_ndotv = ndotl * ndotv;
    return ndotl_ndotv / (ndotl + ndotv - ndotl_ndotv);
}
// Duer
float gsf(in vec3 l, in vec3 v, in vec3 n) {
    vec3 lpv = l + v;
    return dot(lpv, lpv) * pow(dot(lpv, n), -4.0);
}
// Neumann
float gsf(in vec3 l, in vec3 v, in vec3 n) {
    float ndotl = max(dot(n, l), 0.0);
    float ndotv = max(dot(n, v), 0.0);
    return (ndotl * ndotv) / max(ndotl, ndotv);
}
// Kelemen
float gsf(in vec3 l, in vec3 v, in vec3 n) {
    float ndotl = max(dot(n, l), 0.0);
    float ndotv = max(dot(n, v), 0.0);
    vec3 h = normalize(l + v);
    float vdoth = max(dot(v, h), 0.0);
    return (ndotl * ndotv) / (vdoth * vdoth);
}
// CookTorrance
float gsf(in vec3 l, in vec3 v, in vec3 n) {
    float ndotl = max(dot(n, l), 0.0);
    float ndotv = max(dot(n, v), 0.0);
    vec3 h = normalize(l + v);
    float ndoth = max(dot(n, h), 0.0);
    float vdoth = max(dot(v, h), 0.0);
    return min(1.0, min(2.0 * ndoth * ndotv / vdoth, 2.0 * ndoth * ndotl / vdoth));
}
// Ward
float gsf(in vec3 l, in vec3 v, in vec3 n) {
    float ndotl = max(dot(n, l), 0.0);
    float ndotv = max(dot(n, v), 0.0);
    return pow(ndotl * ndotv, 0.5);
}
// Walter
float gsf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
    float ndotl = max(dot(n, l), 0.0);
    float ndotv = max(dot(n, v), 0.0);
    float roughness_sqr = roughness * roughness;
    float ndotl_sqr = ndotl * ndotl;
    float ndotv_sqr = ndotv * ndotv;
    float smith_l = 2.0 / (1.0 + sqrt(1.0 + roughness_sqr * (1.0 - ndotl_sqr) / (ndotl_sqr)));
    float smith_v = 2.0 / (1.0 + sqrt(1.0 + roughness_sqr * (1.0 - ndotv_sqr) / (ndotv_sqr)));
    return smith_l * smith_v;
}
// SmithBeckmann
float gsf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
    float ndotl = max(dot(n, l), 0.0);
    float ndotv = max(dot(n, v), 0.0);
    float roughness_sqr = roughness * roughness;
    float ndotl_sqr = ndotl * ndotl;
    float ndotv_sqr = ndotv * ndotv;
    float calulation_l = ndotl / (roughness_sqr * sqrt(1.0 - ndotl_sqr));
    float calulation_v = ndotv / (roughness_sqr * sqrt(1.0 - ndotv_sqr));

// ))) float smith_l = calulation_l < 1.6 ? (((3.535 * calulation_l) + (2.181 * calulation_l * calulation_l)) / (1.0 + (2.276 * calulation_l) + (2.577 * calulation_l * calulation_l: 1.0;

// ))) float smith_v = calulation_v < 1.6 ? (((3.535 * calulation_v) + (2.181 * calulation_v * calulation_v)) / (1.0 + (2.276 * calulation_v) + (2.577 * calulation_v * calulation_v
    .0;
    return smith_l * smith_v;
}
// GGX
float gsf(in vec3 l, in vec3 v, in vec3 n, in float roughness) {
    float ndotl = max(dot(n, l), 0.0);
    float ndotv = max(dot(n, v), 0.0);
    float roughness_sqr = roughness * roughness;
    float ndotl_sqr = ndotl * ndotl;
    float ndotv_sqr = ndotv * ndotv;
    float smith_l = (2.0 * ndotl) / (ndotl + sqrt(roughness_sqr + (1.0 - roughness_sqr) * ndotl_sqr));
    float smith_v = (2.0 * ndotv) / (ndotv + sqrt(roughness_sqr + (1.0 - roughness_sqr) * ndotv_sqr));
    return smith_l * smith_v;
}

// vec3 fnl(l, n, v, ior);
// Schlick
vec3 fnl(in vec3 l, in vec3 v, in vec3 n, in vec3 ior) {
    vec3 h = normalize(l + v);
    float ldoth = max(dot(l, h), 0.0);
    vec3 f0 = vec3(pow(ior.r - 1.0, 2.0) / pow(ior.r + 1.0, 2.0), pow(ior.g - 1.0, 2.0) / pow(ior.g + 1.0, 2.0), pow(ior.b - 1.0, 2.0) / pow(ior.b + 1.0, 2.0));

// SchlickFresnel
    float x = clamp(1.0 - ldoth, 0.0, 1.0);
    float x2 = x * x;
    return f0 + (1.0 - f0) * x2 * x2 * x;
}