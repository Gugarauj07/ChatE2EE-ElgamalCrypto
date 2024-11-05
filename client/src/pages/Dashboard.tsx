import React from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import ChatWindow from '@/components/Layout/ChatWindow';

const Dashboard = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <ChatWindow />
    </div>
  );
};

export default Dashboard;