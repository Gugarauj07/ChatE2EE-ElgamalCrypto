import React from 'react';

interface AvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ username, size = 'md' }) => {
  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  return (
    <div
      className={`${sizeClasses[size]} ${getRandomColor(username)} rounded-full flex items-center justify-center text-white font-semibold`}
    >
      {getInitials(username)}
    </div>
  );
};