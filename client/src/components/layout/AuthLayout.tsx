import { Outlet } from 'react-router-dom'
import { useEffect, useMemo, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { type ISourceOptions } from "@tsparticles/engine"
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

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: "#000",
      },
      particles: {
        color: {
          value: "#ffffff",
        },
        links: {
          color: "#ffffff",
          distance: 150,
          enable: true,
          opacity: 0.4,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1.5,
          direction: "none",
          random: true,
          straight: false,
          outModes: "bounce",
          attract: {
            enable: true,
            rotateX: 600,
            rotateY: 1200,
          },
        },
        number: {
          value: 120,
          density: {
            enable: true,
            area: 900,
          },
        },
        opacity: {
          value: { min: 0.4, max: 0.7 },
          animation: {
            enable: true,
            speed: 0.5,
            minimumValue: 0.4,
          },
        },
        size: {
          value: { min: 1, max: 2 },
          animation: {
            enable: true,
            speed: 1,
            minimumValue: 1,
          },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: ["grab", "bubble"],
            parallax: {
              enable: true,
              force: 80,
              smooth: 10,
            },
          },
          onClick: {
            enable: true,
            mode: "push",
          },
        },
        modes: {
          grab: {
            distance: 250,
            links: {
              opacity: 0.7,
              color: "#4f46e5",
            },
          },
          bubble: {
            distance: 200,
            size: 7,
            duration: 2,
            opacity: 0.8,
          },
          push: {
            quantity: 6,
          },
          repulse: {
            distance: 200,
          },
        },
      },
      detectRetina: true,
    }),
    [],
  )

  if (!init) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Particles
        id="tsparticles"
        options={options}
        className="absolute inset-0"
      />
      <div className="container relative z-10 mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold text-center text-white mb-8 relative bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <span className="inline-flex items-center">
              <img src="chat-icon.svg" alt="Icon" className="w-8 h-8 mr-2" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
                Chat E2E
              </span>
            </span>
          </h1>
          <Outlet />
        </div>
      </div>
    </div>
  )
}