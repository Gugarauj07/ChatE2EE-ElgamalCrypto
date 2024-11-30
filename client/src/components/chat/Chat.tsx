import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function Chat() {
  const [message, setMessage] = useState('')

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    // Implementar envio de mensagem
    setMessage('')
  }

  return (
    <div className="h-full flex">
      {/* Lista de contatos */}
      <aside className="w-80 border-r">
        <div className="p-4 border-b">
          <Input placeholder="Buscar contatos..." />
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {/* Lista de contatos será implementada aqui */}
        </ScrollArea>
      </aside>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {/* Mensagens serão exibidas aqui */}
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="submit">Enviar</Button>
        </form>
      </div>
    </div>
  )
}