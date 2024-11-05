import React from 'react';

const Sidebar = () => {
  return (
    <div className="w-1/4 bg-gray-200 dark:bg-gray-800 p-4 overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Conversas</h2>
      {/* Lista de conversas irá aqui */}
      <div className="space-y-2">
        <div className="p-2 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
          <p className="font-medium">Maria</p>
          <p className="text-sm text-gray-500 dark:text-gray-300">Última mensagem...</p>
        </div>
        {/* Adicione mais conversas conforme necessário */}
      </div>
    </div>
  );
};

export default Sidebar; 