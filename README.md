# Chat E2EE

## Visão Geral

O **Chat E2EE** é uma aplicação de mensagens com criptografia de ponta a ponta que prioriza a privacidade e segurança dos usuários. A aplicação utiliza criptografia ElGamal para garantir que apenas os usuários envolvidos nas conversas possam acessar o conteúdo das mensagens.

![asymmetric-encryption-infographic](asymmetric-encryption-infographic.avif)

![System overview](ChatE2E.mp4)

## Arquitetura

### Diagrama de Entidade Relacionamento
```mermaid
erDiagram
    USERS ||--o{ CONTACTS : has
    USERS ||--o{ CONVERSATION_PARTICIPANTS : participates
    CONVERSATIONS ||--o{ CONVERSATION_PARTICIPANTS : contains
    CONVERSATIONS ||--o{ MESSAGES : has
    MESSAGES ||--o{ MESSAGE_RECIPIENTS : encrypted_for
    GROUPS ||--|{ CONVERSATIONS : is_type
    DIRECT_CHATS ||--|{ CONVERSATIONS : is_type

    USERS {
        string id PK
        string username
        string password_hash
        string encrypted_private_key
        string public_key
        timestamp created_at
        timestamp last_seen
    }

    CONTACTS {
        string id PK
        string user_id FK
        string contact_id FK
        timestamp added_at
    }

    CONVERSATIONS {
        string id PK
        string type "GROUP|DIRECT"
        timestamp created_at
    }

    GROUPS {
        string conversation_id PK, FK
        string name
        string admin_id FK
    }

    DIRECT_CHATS {
        string conversation_id PK, FK
    }

    CONVERSATION_PARTICIPANTS {
        string id PK
        string conversation_id FK
        string user_id FK
        timestamp joined_at
    }

    MESSAGES {
        string id PK
        string conversation_id FK
        string sender_id FK
        timestamp created_at
    }

    MESSAGE_RECIPIENTS {
        string id PK
        string message_id FK
        string recipient_id FK
        jsonb encrypted_content
        enum status "SENT|RECEIVED|READ"
        timestamp status_updated_at
    }
```

### Fluxo de Criptografia e Operações
```mermaid
graph TD
%% Registro e Login
A[Início] --> B[Registro de Usuário]
B --> C[Gerar Par de Chaves - ElGamal]
C --> D[Criptografar Chave Privada com Senha]
D --> E[Enviar Chave Pública e Chave Privada Criptografada ao Servidor]
E --> F[Login Bem Sucedido]

%% Gestão de Contatos
F --> H1[Adicionar Contato]
H1 --> I1[Buscar Usuário por Username]
I1 --> J1[Adicionar à Lista de Contatos]

%% Criação de Conversa
F --> H2[Iniciar Conversa]
H2 --> I2{Tipo de Conversa}
I2 -->|Grupo| J2[Definir Nome e Admin]
I2 -->|Direct| K2[Selecionar Contato]
J2 --> L2[Selecionar Participantes]
K2 --> M2[Criar Conversa no Servidor]
L2 --> M2

%% Gestão de Grupo
F --> N1[Gerenciar Grupo]
N1 --> N2{É Admin?}
N2 -->|Sim| N3[Adicionar/Remover Participantes]
N2 -->|Não| N4[Erro: Sem Permissão]
N3 --> N5[Atualizar Grupo no Servidor]

%% Envio de Mensagens
F --> P1[Enviar Mensagem]
P1 --> P2[Obter Lista de Participantes da Conversa]
P2 --> P3[Para Cada Participante]
P3 --> P4[Criptografar Mensagem com Chave Pública do Participante]
P4 --> P5[Criar MESSAGE_RECIPIENT com Status SENT]
P5 --> P6[Enviar ao Servidor]

%% Recebimento de Mensagens
P6 --> R1[Servidor Distribui Mensagens]
R1 --> R2[Cliente Recebe Mensagem]
R2 --> R3[Buscar Conteúdo Criptografado Específico]
R3 --> R4[Descriptografar com Chave Privada]
R4 --> R5[Atualizar Status para RECEIVED]
R5 --> R6[Exibir Mensagem]
R6 --> R7[Atualizar Status para READ]

%% Sincronização Multi-dispositivo
F --> S1[Acessar Novo Dispositivo]
S1 --> S2[Login com Credenciais]
S2 --> S3[Baixar Chave Privada Criptografada]
S3 --> S4[Descriptografar Chave Privada]
S4 --> S5[Sincronizar Mensagens]
S5 --> S6[Descriptografar Conteúdo Específico do Usuário]
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
- Armazenamento de mensagens e conteúdos criptografados
- Chaves públicas dos usuários
- Chaves privadas criptografadas
- Metadados de conversas e grupos

### Segurança

1. **Chaves e Autenticação**
   - **Chaves Privadas:** Armazenadas no servidor de forma criptografada, protegidas pela senha do usuário
   - **Chaves Públicas:** Disponíveis no servidor para facilitar a criptografia das mensagens
   - **Autenticação:** Baseada em tokens JWT com expiração configurável

2. **Criptografia de Mensagens**
   - **Processo de Criptografia:**
     1. Para cada mensagem enviada, o sistema identifica todos os participantes da conversa
     2. O conteúdo é criptografado individualmente com a chave pública de cada participante
     3. Cada versão criptografada é armazenada como um MESSAGE_RECIPIENT separado
   - **Algoritmo:** ElGamal para criptografia assimétrica
   - **Integridade:** Assinatura digital do remetente em cada mensagem

3. **Gestão de Conversas**
   - **Chats Diretos:**
     - Conversas entre dois participantes
     - Mensagens criptografadas individualmente para cada participante
   - **Grupos:**
     - Suporte a múltiplos participantes
     - Gerenciamento de permissões através de admin
     - Mesmo processo de criptografia dos chats diretos, escalando para todos os membros

4. **Status de Mensagens**
   - **SENT:** Mensagem criptografada e armazenada no servidor
   - **RECEIVED:** Destinatário recebeu e descriptografou a mensagem
   - **READ:** Destinatário visualizou a mensagem
   - Status rastreado individualmente para cada destinatário

5. **Multi-dispositivo**
   - **Login:** Autenticação com credenciais em novo dispositivo
   - **Recuperação de Chaves:** Descriptografia da chave privada usando senha do usuário
   - **Sincronização:** Acesso a todas as mensagens criptografadas específicas para o usuário
   - **Consistência:** Atualização de status sincronizada entre dispositivos

6. **Proteção Contra Ataques**
   - **Man-in-the-Middle:** Criptografia individual previne interceptação de mensagens
   - **Replay:** Timestamps e identificadores únicos previnem reenvio de mensagens
   - **Força Bruta:** Chaves ElGamal de alta segurança
   - **Comprometimento de Servidor:** Conteúdo sempre criptografado, servidor não tem acesso às mensagens

7. **Backup e Recuperação**
   - **Chaves:** Backup seguro da chave privada criptografada
   - **Mensagens:** Preservação do histórico criptografado
   - **Recuperação:** Possível em novos dispositivos após autenticação

8. **Privacidade**
   - **Metadados Mínimos:** Apenas informações essenciais armazenadas
   - **Criptografia Individual:** Garante que apenas destinatários específicos acessem o conteúdo
   - **Controle de Acesso:** Gerenciamento granular de participantes em grupos

9. **Escalabilidade**
   - **Grupos:** Suporte eficiente para grandes números de participantes
   - **Armazenamento:** Otimização do espaço através de limpeza periódica de mensagens antigas
   - **Performance:** Criptografia assíncrona para melhor desempenho
   
## Instalação

### Pré-requisitos
- Go 1.16+
- Node.js e npm
- SQLite

### Backend
```bash
git clone https://github.com/gugarauj07/chat-e2ee.git
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
