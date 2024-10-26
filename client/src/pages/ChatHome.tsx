// client/src/pages/ChatHome.tsx
import React from 'react';
import UserList from '../components/UserList';
import GroupList from '../components/GroupList';
import { Link } from 'react-router-dom';

export default function ChatHome() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
        <h1 className="text-2xl">Chat E2EE</h1>
        <Link to="/groups/create" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Criar Grupo
        </Link>
      </header>
      <main className="flex-grow flex">
        <div className="w-1/2 border-r">
          <UserList />
        </div>
        <div className="w-1/2">
          <GroupList />
        </div>
      </main>
    </div>
  );
}