// components/ParticlesBackground.js
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useMemo, useState } from "react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticlesBackground(props) {
  const [engineInitialized, setEngineInitialized] = useState(false);

  useEffect(() => {
    // Initialise tsParticles avec le module slim
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setEngineInitialized(true);
    });
  }, []);

  // Callback appelé lorsque le container des particules est chargé
  const particlesLoaded = (container) => {
    console.log("Particles container loaded", container);
  };

  // Configuration des options via useMemo pour éviter les recalculs inutiles
  const options = useMemo(
    () => ({
      background: {
        color: {
          value: "#111", // Fond noir
        },
      },
      fpsLimit: 60,
      interactivity: {
        detectsOn: "canvas",
        events: {
          resize: true,
        },
      },
      particles: {
        color: {
          value: "#0B3D91", // Bleu sombre
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: false,
          speed: 1,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 100, // Nombre de particules
        },
        opacity: {
          value: 0.5,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 10, max: 25 }, // Taille des particules
        },
      },
      detectRetina: true,
    }),
    []
  );

  return <Particles id={props.id} init={particlesLoaded} options={options} />;
}
