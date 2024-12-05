import { Outlet } from 'react-router-dom'
import { useEffect, useMemo, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import {
  type Container,
  type ISourceOptions,
  MoveDirection,
  OutMode,
} from "@tsparticles/engine"
import { loadSlim } from "@tsparticles/slim"

export default function AuthLayout() {
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log(container)
  }

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "#0a0a0a",
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: true,
            mode: "bubble",
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
          bubble: {
            distance: 200,
            duration: 2,
            size: 10,
            opacity: 0.8,
          },
          repulse: {
            distance: 100,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: "#ffffff",
        },
        links: {
          color: "#ffffff",
          distance: 150,
          enable: true,
          opacity: 0.5,
          width: 1,
        },
        move: {
          direction: MoveDirection.none,
          enable: true,
          outModes: {
            default: OutMode.bounce,
          },
          random: false,
          speed: 2,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 80,
        },
        opacity: {
          value: 0.5,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 5 },
        },
      },
      detectRetina: true,
    }),
    [],
  )

  if (init) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          options={options}
          className="absolute top-0 left-0 w-full h-full z-0"
        />
        <div className="relative z-10 w-full max-w-md bg-white bg-opacity-10 backdrop-filter backdrop-blur-md rounded-lg shadow-lg p-6">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Chat E2E</h1>
            <p className="text-white/80">Mensagens seguras com criptografia ElGamal</p>
          </div>
          <Outlet />
        </div>
      </div>
    )
  }

  return <></>
}