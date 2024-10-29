# Chat E2EE

## Visão Geral

O **Chat E2EE** é uma aplicação de mensagens com criptografia de ponta a ponta que prioriza a privacidade e segurança dos usuários.

## Arquitetura

### Diagrama de Entidade Relacionamento
```mermaid
erDiagram
    USERS ||--o{ DEVICES : has
    USERS ||--o{ CONVERSATIONS : participates
    USERS ||--o{ GROUP_MEMBERS : belongs
    DEVICES ||--o{ SESSION_KEYS : uses
    DEVICES ||--o{ MESSAGES : sends
    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o{ SESSION_KEYS : uses
    GROUPS ||--o{ GROUP_MEMBERS : has
    GROUPS ||--o{ MESSAGES : contains

    USERS {
        int id PK
        string username
        string password_hash
        timestamp created_at
        timestamp last_seen
    }

    DEVICES {
        int id PK
        id user_id FK
        blob public_key
        timestamp last_seen
        boolean is_active
    }

    SESSION_KEYS {
        int id PK
        id conversation_id FK
        id device_id FK
        blob encrypted_key
        timestamp created_at
        timestamp last_rotation
    }

    CONVERSATIONS {
        int id PK
        string type
        timestamp created_at
        string group_id FK "null for direct"
    }

    MESSAGES {
        int id PK
        int conversation_id FK
        int sender_device_id FK
        blob encrypted_content
        timestamp created_at
        boolean is_delivered
    }

    GROUPS {
        int id PK
        string name
        blob sender_key
        id admin_id FK
        timestamp created_at
    }

    GROUP_MEMBERS {
        int group_id FK
        int user_id FK
        timestamp joined_at
    }
```

### Fluxo de Criptografia
```mermaid
graph TD
    %% Registro e Login Inicial
    A[Início] --> B[Registro de Usuário]
    B --> C[Gerar Par de Chaves no Dispositivo]
    C --> D[Enviar Chave Pública ao Servidor]
    D --> E[Armazenar Chave Privada Localmente]
    E --> F[Login Bem Sucedido]

    %% Estabelecimento de Sessão
    F --> G[Iniciar Nova Conversa]
    G --> H[Gerar Chave de Sessão]
    H --> I[Obter Chaves Públicas dos Dispositivos]
    I --> J[Criptografar Chave de Sessão]
    J --> K[Enviar ao Servidor]
    K --> L[Armazenar no Banco de Dados]

    %% Fluxo de Mensagens
    F --> M{Tipo de Chat}
    M -->|Individual| N{Existe Sessão?}
    N -->|Não| G
    N -->|Sim| O[Criptografar com Chave de Sessão]
    M -->|Grupo| P[Usar Chave do Grupo]
    O --> Q[Enviar Mensagem Criptografada]
    P --> Q

    %% Novo Dispositivo
    F --> R[Login Novo Dispositivo]
    R --> S[Gerar Novas Chaves]
    S --> T[Enviar Chave Pública]
    T --> U[Receber Chaves de Sessão Criptografadas]
    U --> V[Descriptografar com Chave Privada]
    V --> F

    %% Rotação de Chaves
    L --> W[Tempo para Rotação]
    W --> X[Gerar Nova Chave de Sessão]
    X --> I

    %% Recebimento
    Q --> Y[Servidor Encaminha]
    Y --> Z[Dispositivo Recebe]
    Z --> AA[Descriptografar com Chave de Sessão]
    AA --> AB[Exibir Mensagem]
```

### Componentes Principais

#### Frontend (React + TypeScript)
- Interface do usuário
- Gerenciamento de chaves e criptografia
- Comunicação via WebSocket

#### Backend (Go + Gin)
- Roteamento de mensagens criptografadas
- Gerenciamento de sessões e dispositivos
- Autenticação de usuários

#### Banco de Dados (SQLite)
- Armazenamento de mensagens criptografadas
- Chaves públicas dos dispositivos
- Chaves de sessão criptografadas
- Metadados de conversas e grupos

### Segurança

1. **Chaves e Sessões**
   - Chaves privadas permanecem apenas nos dispositivos
   - Chaves de sessão criptografadas para cada dispositivo
   - Sender keys para grupos
   - Chaves de sessão armazenadas de forma segura no banco

2. **Rotação de Chaves**
   - Iniciada pelo cliente
   - Nova chave distribuída para todos os dispositivos
   - Histórico de rotações mantido para auditoria

3. **Múltiplos Dispositivos**
   - Cada dispositivo tem seu próprio par de chaves
   - Chaves de sessão específicas por dispositivo
   - Gerenciamento independente de sessões

### Estrutura do Banco

1. **Users e Devices**
   - Usuários podem ter múltiplos dispositivos
   - Cada dispositivo tem sua chave pública
   - Rastreamento de status online/offline

2. **Conversas e Mensagens**
   - Suporte a conversas individuais e grupos
   - Mensagens sempre criptografadas
   - Status de entrega rastreado

3. **Chaves de Sessão**
   - Armazenadas criptografadas por dispositivo
   - Vinculadas a conversas específicas
   - Sistema de rotação automática

## Instalação

### Pré-requisitos
- Go 1.16+
- Node.js e npm
- SQLite

### Backend
```bash
git clone https://github.com/seu-usuario/chat-e2ee.git
cd chat-e2ee/server
go mod tidy
go run main.go
```

### Frontend
```bash
cd ../frontend
npm install
npm start
```

## Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.
