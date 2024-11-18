export interface AuthMessage {
  type: 'auth';
  payload: {
    token: string;
  };
}

export interface ChatMessage {
  type: 'message';
  payload: {
    conversationId: string;
    message: any;
  };
}

export type WSMessage = AuthMessage | ChatMessage;