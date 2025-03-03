import { useEffect, useState } from 'react'

interface EncryptedLoadingProps {
  text?: string
}

export function EncryptedLoading({ text = "Processando" }: EncryptedLoadingProps) {
  const [encryptedText, setEncryptedText] = useState("")
  const characters = "!@#$%¨&*()_+1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

  useEffect(() => {
    let frame = 0
    const maxFrames = 10
    const interval = setInterval(() => {
      const encrypted = text.split('').map(() => {
        return characters.charAt(Math.floor(Math.random() * characters.length))
      }).join('')

      setEncryptedText(encrypted)
      frame++

      if (frame >= maxFrames) {
        frame = 0
      }
    }, 100)

    return () => clearInterval(interval)
  }, [text])

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 md:p-8">
      <div className="relative w-12 h-12 md:w-16 md:h-16">
        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin-reverse"></div>
      </div>
      <div className="text-center space-y-1 md:space-y-2">
        <p className="text-base md:text-lg font-mono text-blue-400 animate-pulse">
          {encryptedText}
        </p>
        <p className="text-xs md:text-sm text-gray-400">
          Criptografando dados...
        </p>
      </div>
    </div>
  )
}