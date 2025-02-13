import { useRef, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const vertexShader = `
// ... (ton code du vertex shader inchangé)
uniform float u_time;
uniform float u_frequency;
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
float pnoise(vec3 P, vec3 rep) {
  // ... (code du bruit de Perlin)
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}
void main() {
  float noise = 1.5 * pnoise(position + u_time, vec3(10.0));
  float displacement = (u_frequency / 30.0) * (noise / 5.0);
  vec3 newPosition = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const fragmentShader = `
uniform float u_red;
uniform float u_green;
uniform float u_blue;
void main() {
  gl_FragColor = vec4(u_red, u_green, u_blue, 1.0);
}
`;

interface AudioVisualizerProps {
  uploadedFile?: File | null;
}

function AudioSphere({ uploadedFile }: AudioVisualizerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Pour pouvoir arrêter la source audio précédente
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioData, setAudioData] = useState(new Array(128).fill(0));
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Uniformes pour le shader
  const uniforms = useRef({
    u_time: { value: 0.0 },
    u_frequency: { value: 0.0 },
    u_red: { value: 0.267 },
    u_green: { value: 0.533 },
    u_blue: { value: 1.0 }
  }).current;

  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const loadAudioBuffer = (arrayBuffer: ArrayBuffer) => {
      audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
        // Si une source est déjà en lecture, l'arrêter avant de lancer la nouvelle
        if (sourceRef.current) {
          sourceRef.current.stop();
          sourceRef.current.disconnect();
        }
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        source.start(0);
        sourceRef.current = source;
        setAudioLoaded(true);
      });
    };

    if (uploadedFile) {
      // Utiliser le fichier uploadé
      const reader = new FileReader();
      reader.readAsArrayBuffer(uploadedFile);
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        loadAudioBuffer(arrayBuffer);
      };
    } else {
      // Utiliser le fichier par défaut Music.mp3
      fetch("/Music.mp3")
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => loadAudioBuffer(arrayBuffer));
    }
  }, [uploadedFile]);

  useFrame((state, delta) => {
    // Si l'audio n'est pas encore chargé, on ne fait rien et on quitte la fonction.
    if (!audioLoaded) return;
  
    // On incrémente l'uniforme "u_time" avec le delta (le temps écoulé depuis la dernière frame).
    // Cela permet d'animer le shader (par exemple, pour faire évoluer le bruit dans le vertex shader).
    uniforms.u_time.value += delta;
  
    // Si l'analyseur audio (AnalyserNode) est disponible, on récupère les données de fréquence.
    if (analyserRef.current) {
      // On crée un tableau d'octets dont la taille correspond au nombre de bins de l'analyseur.
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
  
      // Remplit dataArray avec les données de fréquence actuelles.
      analyserRef.current.getByteFrequencyData(dataArray);
  
      // Met à jour l'état "audioData" (pour un éventuel usage ou débogage) avec ces données.
      setAudioData(Array.from(dataArray));
  
      // Calcule la fréquence moyenne en additionnant toutes les valeurs du tableau et en divisant par le nombre d'éléments.
      const averageFrequency = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  
      // On met à jour l'uniforme "u_frequency" avec la valeur moyenne calculée.
      // Cet uniforme est utilisé dans le vertex shader pour influencer la déformation de la géométrie en fonction du son.
      uniforms.u_frequency.value = averageFrequency;
    }
  
    // Ensuite, on fait tourner la sphère sur l'axe Y pour ajouter un effet de rotation.
    if (meshRef.current) {
      // On incrémente la rotation autour de l'axe Y proportionnellement au delta (temps écoulé) et à un facteur (ici 0.5).
      // Cela permet d'obtenir une rotation fluide et indépendante du framerate.
      meshRef.current.rotation.y += delta * 0.5;
    }
  });
  

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.5, 100,100]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        wireframe={true}
      />
    </mesh>
  );
}

export default function AudioVisualizer({ uploadedFile }: AudioVisualizerProps) {
  return (
    <Canvas camera={{ position: [0, 5, 0], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <AudioSphere uploadedFile={uploadedFile} />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
