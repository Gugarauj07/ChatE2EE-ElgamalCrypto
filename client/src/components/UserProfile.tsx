import { Avatar } from './Avatar';
import useAuth from '@/hooks/useAuth';

const UserProfile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-800">
      <Avatar username={user.username} size="lg" />
      <div>
        <h3 className="font-medium text-gray-200">{user.username}</h3>
        <p className="text-sm text-gray-400">Online</p>
      </div>
    </div>
  );
};

export default UserProfile;