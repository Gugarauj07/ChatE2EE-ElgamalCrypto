import React from 'react';

const ChatWindow = () => {
  return (
    <div className="w-3/4 bg-white dark:bg-gray-900 flex flex-col">
      <header className="p-4 border-b border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Chat com Maria</h2>
      </header>
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Lista de mensagens irá aqui */}
        <div className="space-y-4">
          <div className="flex justify-start">
            <div className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 rounded-lg">
              Olá! Como você está?
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              Estou bem, obrigado! E você?
            </div>
          </div>
          {/* Adicione mais mensagens conforme necessário */}
        </div>
      </div>
      <footer className="p-4 border-t border-gray-300 dark:border-gray-700">
        <form className="flex space-x-2">
          <input
            type="text"
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWindow; 