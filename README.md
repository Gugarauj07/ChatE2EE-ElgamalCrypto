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
    USERS ||--o{ CONTACTS : has
    DEVICES ||--o{ SESSION_KEYS : uses
    DEVICES ||--o{ MESSAGES : sends
    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o{ SESSION_KEYS : uses
    GROUPS ||--o{ GROUP_MEMBERS : has
    GROUPS ||--o{ MESSAGES : contains

    USERS {
        string id PK
        string username
        string password_hash
        timestamp created_at
        timestamp last_seen
    }

    CONTACTS {
        string user_id FK
        string contact_id FK
        string nickname
        timestamp added_at
    }

    DEVICES {
        string id PK
        string user_id FK
        blob public_key
        timestamp last_seen
        boolean is_active
    }

    SESSION_KEYS {
        string id PK
        string conversation_id FK
        string device_id FK
        blob encrypted_key
        timestamp created_at
        timestamp last_rotation
    }

    CONVERSATIONS {
        string id PK
        string type
        timestamp created_at
        string group_id FK "null for direct"
    }

    MESSAGES {
        string id PK
        string conversation_id FK
        string sender_device_id FK
        blob encrypted_content
        timestamp created_at
        boolean is_delivered
    }

    GROUPS {
        string id PK
        string name
        blob sender_key
        string admin_id FK
        timestamp created_at
    }

    GROUP_MEMBERS {
        string group_id FK
        string user_id FK
        timestamp joined_at
    }
```

### Fluxo de Criptografia e Operações
```mermaid
graph TD
    %% Registro e Login Inicial
    A[Início] --> B[Registro de Usuário]
    B --> C[Gerar Par de Chaves no Dispositivo]
    C --> D[Enviar Chave Pública ao Servidor]
    D --> E[Armazenar Chave Privada Localmente]
    E --> F[Login Bem Sucedido]

    %% Gestão de Contatos
    F --> G1[Adicionar Contato]
    G1 --> H1[Buscar Usuário por Username]
    H1 --> I1[Adicionar à Lista de Contatos]
    I1 --> J1[Pode Iniciar Conversa]

    %% Criação de Grupo
    F --> G2[Criar Grupo]
    G2 --> H2[Definir Nome do Grupo]
    H2 --> I2[Selecionar Contatos]
    I2 --> J2[Gerar Sender Key]
    J2 --> K2[Criptografar Sender Key para Cada Membro]
    K2 --> L2[Criar Grupo no Servidor]

    %% Adicionar Membro ao Grupo
    F --> G3[Adicionar Membro ao Grupo]
    G3 --> H3{É Admin?}
    H3 -->|Sim| I3[Selecionar Contato]
    I3 --> J3[Criptografar Sender Key]
    J3 --> K3[Adicionar ao Grupo]
    H3 -->|Não| L3[Erro: Sem Permissão]

    %% Estabelecimento de Sessão
    J1 --> M[Iniciar Nova Conversa]
    M --> N[Gerar Chave de Sessão]
    N --> O[Obter Chaves Públicas dos Dispositivos]
    O --> P[Criptografar Chave de Sessão]
    P --> Q[Enviar ao Servidor]
    Q --> R[Armazenar no Banco de Dados]

    %% Fluxo de Mensagens
    F --> S{Tipo de Chat}
    S -->|Individual| T{Existe Sessão?}
    T -->|Não| M
    T -->|Sim| U[Criptografar com Chave de Sessão]
    S -->|Grupo| V[Usar Sender Key]
    U --> W[Enviar Mensagem Criptografada]
    V --> W

    %% Recebimento
    W --> X[Servidor Encaminha]
    X --> Y[Dispositivo Recebe]
    Y --> Z[Descriptografar]
    Z --> AA[Exibir Mensagem]

    %% Estilização
    classDef success fill:#99ff99
    classDef process fill:#9999ff
    classDef warning fill:#ffcc99
    class AA success
    class U,V,Z process
    class H3,L3 warning
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
