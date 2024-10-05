import React, { useState } from 'react';
import Setup from './pages/Setup';
import Chat from './pages/Chat';
import { KeyPair, PublicKey } from './types';
import './index.css';

export default function App() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [userId, setUserId] = useState('');
  const [keys, setKeys] = useState<KeyPair | null>(null);
  const [partnerUserId, setPartnerUserId] = useState('');
  const [partnerPublicKey, setPartnerPublicKey] = useState<PublicKey | null>(null);
  const [setEncryptionLog] = useState(() => () => {}); // Assuming this is the correct way to define setEncryptionLog

  const handleSetupComplete = (userId: string, keys: KeyPair, partnerUserId: string, partnerPublicKey: PublicKey) => {
    setUserId(userId);
    setKeys(keys);
    setPartnerUserId(partnerUserId);
    setPartnerPublicKey(partnerPublicKey);
    setIsSetupComplete(true);
  };

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