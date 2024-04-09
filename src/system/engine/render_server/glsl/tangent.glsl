layout(location = 0) out highp vec4 pc_fragColor;
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler3D;
precision highp sampler2DArray;
precision highp sampler2DShadow;
precision highp samplerCubeShadow;
precision highp sampler2DArrayShadow;
precision highp isampler2D;
precision highp isampler3D;
precision highp isamplerCube;
precision highp isampler2DArray;
precision highp usampler2D;
precision highp usampler3D;
precision highp usamplerCube;
precision highp usampler2DArray;

vec4 sRGBTransferOETF(in vec4 value) {
	return vec4(mix(pow(value.rgb, vec3(0.41666)) * 1.055 - vec3(0.055), value.rgb * 12.92, vec3(lessThanEqual(value.rgb, vec3(0.0031308)))), value.a);
}
vec4 linearToOutputTexel(vec4 value) {
	return (sRGBTransferOETF(value));
}

uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
in vec3 vViewPosition;

in vec2 vNormalMapUv;
in vec3 vNormal;
uniform sampler2D normalMap;
uniform vec2 normalScale;

mat3 getTangentFrame(vec3 eye_pos, vec3 surf_norm, vec2 uv) {
	vec3 q0 = dFdx(eye_pos.xyz);
	vec3 q1 = dFdy(eye_pos.xyz);
	vec2 st0 = dFdx(uv.st);
	vec2 st1 = dFdy(uv.st);
	vec3 N = surf_norm;
	vec3 q1perp = cross(q1, N);
	vec3 q0perp = cross(N, q0);
	vec3 T = q1perp * st0.x + q0perp * st1.x;
	vec3 B = q1perp * st0.y + q0perp * st1.y;
	float det = max(dot(T, T), dot(B, B));
	float scale = (det == 0.0) ? 0.0 : inversesqrt(det);
	return mat3(T * scale, B * scale, N);
}

void main() {
	vec4 diffuseColor = vec4(diffuse, opacity);
	float faceDirection = gl_FrontFacing ? 1.0 : -1.0;
	vec3 normal = normalize(vNormal);
	mat3 tbn = getTangentFrame(-vViewPosition, normal, vNormalMapUv);
	vec3 nonPerturbedNormal = normal;
	vec3 mapN = texture(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize(tbn * mapN);
	vec3 viewDir = normalize(vViewPosition);
	vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
	vec3 y = cross(viewDir, x);
	vec2 uv = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5;
	vec4 matcapColor = texture(matcap, uv);
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	diffuseColor.a = 1.0;
	pc_fragColor = vec4(outgoingLight, diffuseColor.a);
	pc_fragColor = linearToOutputTexel(pc_fragColor);
}