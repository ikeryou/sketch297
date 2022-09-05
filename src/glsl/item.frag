precision highp float;

uniform mat4 viewMatrix;
uniform vec3 diffuse;
uniform vec3 emissive;

uniform float rate;
uniform float test;
uniform vec3 color;
uniform vec3 light;

varying vec2 vUv;
varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec3 vPos;

#include <common>
#include <bsdfs>
#include <lights_pars_begin>


void main(void) {

  // float a = mix(step(0.5, vPos.x), 1.0 - step(0.5, vPos.x), test);
  float testX = (vPos.x + 0.5);
  float a = mix(step(0.5, testX), 1.0 - step(0.5, testX), test);
  if(a <= 0.0) {
    discard;
  }

  vec3 mvPosition = vViewPosition;
  vec3 transformedNormal = vNormal;

  GeometricContext geometry;
  geometry.position = mvPosition.xyz;
  geometry.normal = normalize(transformedNormal);
  geometry.viewDir = (normalize(-mvPosition.xyz));
  vec3 lightFront = vec3(0.0);
  vec3 indirectFront = vec3(0.0);
  IncidentLight directLight;
  float dotNL;
  vec3 directLightColor_Diffuse;

  #if NUM_POINT_LIGHTS > 0
  #pragma unroll_loop_start
  for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
    getPointLightInfo(pointLights[ i ], geometry, directLight);
    dotNL = dot(geometry.normal, directLight.direction);
    directLightColor_Diffuse = PI * directLight.color;
    lightFront += saturate(dotNL) * directLightColor_Diffuse;
  }
  #pragma unroll_loop_end
  #endif

  vec4 diffuseColor = vec4(light, 1.0);
  ReflectedLight reflectedLight = ReflectedLight(vec3(0.0),vec3(0.0),vec3(0.0),vec3(0.0));
  vec3 totalEmissiveRadiance = color;
  reflectedLight.indirectDiffuse = getAmbientLightIrradiance(ambientLightColor);
  reflectedLight.indirectDiffuse += indirectFront;
  reflectedLight.indirectDiffuse *= BRDF_Lambert(diffuseColor.rgb);
  // reflectedLight.indirectDiffuse *= 0.0;
  reflectedLight.directDiffuse = lightFront;
  reflectedLight.directDiffuse *= BRDF_Lambert(diffuseColor.rgb);
  reflectedLight.directDiffuse *= 0.5;

  vec3 dest = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

  gl_FragColor = vec4(dest, 1.0);
}