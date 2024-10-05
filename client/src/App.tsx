import React, { useState, useEffect, useCallback } from 'react';
import Setup from './pages/Setup';
import Chat from './pages/Chat';
import { KeyPair, PublicKey } from './types';
import { disconnectUser, connectToServer } from './services/api';
import './index.css';

export default function App() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [userId, setUserId] = useState('');
  const [keys, setKeys] = useState<KeyPair | null>(null);
  const [partnerUserId, setPartnerUserId] = useState('');
  const [partnerPublicKey, setPartnerPublicKey] = useState<PublicKey | null>(null);
  const [setEncryptionLog] = useState(() => () => {});

  const handleSetupComplete = (userId: string, keys: KeyPair, partnerUserId: string, partnerPublicKey: PublicKey) => {
    setUserId(userId);
    setKeys(keys);
    setPartnerUserId(partnerUserId);
    setPartnerPublicKey(partnerPublicKey);
    setIsSetupComplete(true);
    localStorage.setItem('chatUserId', userId);
    localStorage.setItem('chatKeys', JSON.stringify(keys));
  };

  const handleDisconnect = useCallback(async () => {
    if (userId) {
      try {
        await disconnectUser(userId);
        console.log('User disconnected successfully');
        localStorage.removeItem('chatUserId');
        localStorage.removeItem('chatKeys');
      } catch (error) {
        console.error('Error disconnecting user:', error);
      }
    }
  }, [userId]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('chatUserId');
    const storedKeys = localStorage.getItem('chatKeys');

    if (storedUserId && storedKeys) {
      const parsedKeys = JSON.parse(storedKeys);
      setUserId(storedUserId);
      setKeys(parsedKeys);
      connectToServer(storedUserId, parsedKeys.publicKey)
        .then(() => setIsSetupComplete(true))
        .catch(console.error);
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      handleDisconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleDisconnect]);

  return (
    <div className="container mx-auto p-4">
      {!isSetupComplete ? (
        <Setup
          onSetupComplete={handleSetupComplete}
          setEncryptionLog={setEncryptionLog}
        />
      ) : (
        keys && partnerPublicKey && (
          <Chat
            userId={userId}
            keys={keys}
            partnerUserId={partnerUserId}
            partnerPublicKey={partnerPublicKey}
          />
        )
      )}
    </div>
  );
}