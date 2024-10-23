# Chat E2EE

## Visão Geral

O **Chat E2EE** é uma aplicação de chat de ponta a ponta criptografada (End-to-End Encrypted - E2EE) semelhante ao WhatsApp. O sistema é projetado para garantir a privacidade e a segurança das comunicações dos usuários, utilizando algoritmos criptográficos robustos para proteger as mensagens e as chaves de criptografia.

### Fluxograma de Criptografia e Mensagens

O fluxo de criptografia e transmissão de mensagens no Chat E2EE segue os seguintes passos:

1. **Geração de Chaves:**
   - **Chave ElGamal:** Cada usuário gera um par de chaves ElGamal (pública e privada) no cliente (frontend).
   - **Sender Keys:** Para otimizar a criptografia em grupos, cada usuário gera sender keys únicas para cada grupo ao qual pertence.

2. **Envio de Mensagens:**
   - **Criptografia da Mensagem:**
     - Antes de enviar, a mensagem é criptografada usando a chave pública ElGamal do destinatário (para comunicações individuais) ou utilizando o sender key do grupo (para mensagens em grupo).
   - **Transmissão:**
     - A mensagem criptografada é enviada ao servidor via WebSocket.

3. **Recebimento de Mensagens:**
   - **Descriptografia:**
     - O cliente destinatário utiliza sua chave privada ElGamal para descriptografar mensagens individuais ou a sender key compartilhada para descriptografar mensagens de grupo.
   - **Exibição:**
     - Após a descriptografia, a mensagem é exibida na interface do usuário.

### Sender Keys

**Sender Keys** são um mecanismo utilizado para otimizar a criptografia em ambientes de grupos. Em vez de criptografar cada mensagem com a chave pública de cada membro do grupo, o sender key permite que uma única chave seja compartilhada de forma segura entre membros do grupo. Isso reduz a sobrecarga computacional e melhora a eficiência na criptografia e descriptografia de mensagens em grupos.

**Funcionamento:**

1. **Geração da Sender Key:**
   - Quando um usuário cria um grupo, ele gera uma sender key única para aquele grupo.

2. **Distribuição da Sender Key:**
   - A sender key é criptografada com a chave pública ElGamal de cada membro do grupo e enviada a eles de forma segura.

3. **Uso da Sender Key:**
   - Ao enviar mensagens para o grupo, o usuário utiliza a sender key para criptografar a mensagem uma única vez, em vez de criptografar para cada membro individualmente.

4. **Atualização da Sender Key:**
   - Caso um novo membro seja adicionado ou um membro seja removido, a sender key é regenerada e redistribuída para garantir que apenas os membros atuais do grupo possam descriptografar as mensagens futuras.

### Autenticação e Login em Múltiplos Dispositivos

Para proporcionar uma experiência fluida aos usuários que desejam acessar o Chat E2EE em múltiplos dispositivos, o sistema implementa os seguintes processos:

1. **Registro Inicial:**
   - Ao criar uma conta, o usuário gera um par de chaves ElGamal no dispositivo inicial. A chave pública é enviada para o servidor, enquanto a chave privada é armazenada localmente e sincronizada de forma segura em dispositivos confiáveis.

2. **Login em um Novo Dispositivo:**
   - **Autenticação:** O usuário realiza o login utilizando suas credenciais.
   - **Sincronização de Chaves:**
     - O servidor autentica o dispositivo e fornece as chaves públicas necessárias para a comunicação.
     - Para acessar as mensagens anteriores, o usuário precisa fornecer uma senha mestra ou utilizar mecanismos de recuperação para descriptografar as chaves privadas armazenadas.
   - **Gerenciamento de Sessões:**
     - Cada dispositivo tem sua própria sessão autenticada via tokens JWT, garantindo que a segurança seja mantida mesmo com múltiplos acessos.

3. **Geração e Sincronização de Sender Keys:**
   - Ao adicionar um novo dispositivo, as sender keys para grupos existentes são redistribuídas de forma segura para incluir o novo dispositivo, mantendo a integridade e a segurança das comunicações de grupo.

4. **Sincronização de Mensagens:**
   - As mensagens são sincronizadas entre dispositivos através do backend, onde cada dispositivo descriptografa as mensagens recebidas utilizando suas chaves privadas armazenadas localmente.

5. **Segurança ao Mudar de Dispositivo:**
   - Caso um usuário decida remover um dispositivo, todas as sessões ativas desse dispositivo são encerradas, e as sender keys podem ser atualizadas para garantir que o dispositivo removido não tenha mais acesso às mensagens futuras.

## Arquitetura Geral do Sistema

### 1. Componentes Principais

#### 1.1 Frontend (Cliente Web)
**Tecnologias:** React.js, TypeScript  
**Responsabilidades:**
- **Interface do Usuário:** Proporciona uma experiência intuitiva e responsiva para os usuários.
- **Geração e Gerenciamento de Chaves ElGamal:** Responsável por gerar, armazenar e gerenciar as chaves públicas e privadas utilizadas na criptografia.
- **Criptografia/Descriptografia de Mensagens:** Assegura que todas as mensagens sejam criptografadas antes de serem enviadas e descriptografadas após serem recebidas.
- **Gerenciamento de Sender Keys para Grupos:** Implementa sender keys para otimizar a criptografia em mensagens de grupo.
- **Sincronização entre Dispositivos:** Garante que as mensagens e as chaves estejam sincronizadas entre múltiplos dispositivos do mesmo usuário.

#### 1.2 Backend
**Tecnologias:** Go, Gin  
**Responsabilidades:**
- **Autenticação de Usuários:** Gerencia o login e logout dos usuários, garantindo que apenas usuários autenticados tenham acesso ao sistema.
- **Gerenciamento de Sessões:** Mantém o controle das sessões dos usuários ativos.
- **Roteamento de Mensagens:** Direciona as mensagens enviadas para os destinatários apropriados, seja individualmente ou em grupos.
- **Armazenamento de Mensagens Criptografadas:** Armazena todas as mensagens de forma criptografada no banco de dados.
- **Gerenciamento de Grupos:** Permite a criação, edição e exclusão de grupos, bem como a adição e remoção de membros.
- **Registro e Autenticação de Dispositivos:** Garante que cada dispositivo esteja devidamente registrado e autenticado no sistema.

#### 1.3 Banco de Dados
**Tecnologia:** SQLite  
**Armazena:**
- **Informações de Usuários:** Detalhes dos usuários, incluindo IDs únicos, nomes de usuário e hashes de senhas.
- **Chaves Públicas dos Dispositivos:** Armazena as chaves públicas necessárias para a criptografia das mensagens.
- **Mensagens Criptografadas:** Guarda todas as mensagens enviadas e recebidas, garantindo que apenas os destinatários autorizados possam descriptografá-las.
- **Metadados de Grupos:** Informações sobre os grupos de chat, incluindo IDs de grupos e membros associados.

#### 1.4 Sistema de Comunicação em Tempo Real
**Tecnologia:** WebSockets  
**Responsabilidades:**
- **Entrega de Mensagens em Tempo Real:** Permite a comunicação instantânea entre os usuários, garantindo que as mensagens sejam entregues imediatamente.
- **Notificações de Status e Eventos:** Informa os usuários sobre eventos como mensagens recebidas, status de conexão e alterações em grupos.

## Requisitos do Sistema

### 2. Funcionalidades Principais

- **Registro e Autenticação de Usuários:** Permite que novos usuários se registrem e autentiquem utilizando credenciais seguras.
- **Login e Logout:** Gerencia o acesso dos usuários ao sistema, mantendo sessões seguras.
- **Envio e Recebimento de Mensagens Criptografadas:** Assegura que todas as mensagens sejam protegidas contra interceptações.
- **Gerenciamento de Grupos:** Facilita a criação de grupos de chat, adição e remoção de membros, e gerenciamento de sender keys para criptografia eficiente em grupos.
- **Sincronização de Mensagens entre Dispositivos:** Garante que as mensagens estejam disponíveis em todos os dispositivos conectados.
- **Comunicação em Tempo Real:** Utiliza WebSockets para proporcionar uma experiência de chat instantâneo.
- **Segurança e Privacidade:** Implementa melhores práticas de segurança, como hashing de senhas com bcrypt e proteção contra ataques como XSS e injeções de SQL.

### 3. Requisitos Técnicos

- **Linguagem de Programação:** Go
- **Framework:** Gin
- **Banco de Dados:** SQLite
- **Frontend:** React.js com TypeScript
- **Criptografia:** Algoritmo ElGamal para criptografar mensagens e gerenciamento de sender keys para grupos
- **Comunicação:** WebSockets para tempo real
- **Documentação da API:** Swagger para documentação interativa

## Instalação

### 4. Pré-requisitos

- **Go:** Versão 1.16 ou superior
- **Node.js e npm:** Para o frontend (se aplicável)
- **SQLite:** Instalação do SQLite no sistema (opcional, pois o Go gerencia o banco de dados localmente)

### 5. Passos para Instalação

1. **Clone o Repositório:**

    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio/server
    ```

2. **Instale as Dependências do Backend:**

    ```bash
    go mod tidy
    ```

3. **Configure o Banco de Dados:**

    O banco de dados SQLite será criado automaticamente na primeira execução do backend.

4. **Gere a Documentação Swagger:**

    Certifique-se de que o `swag` está instalado:

    ```bash
    go get -u github.com/swaggo/swag/cmd/swag
    ```

    Em seguida, gere a documentação:

    ```bash
    swag init
    ```

5. **Execute o Backend:**

    ```bash
    go run main.go
    ```

6. **Configure o Frontend (Opcional):**

    Se você estiver desenvolvendo o frontend, navegue até o diretório correspondente e instale as dependências:

    ```bash
    cd frontend
    npm install
    npm start
    ```

7. **Acesse a Documentação Swagger:**

    Abra o navegador e visite [http://localhost:3000/swagger/index.html](http://localhost:3000/swagger/index.html) para visualizar e interagir com a documentação da API.

## Uso

### 6. Endpoints Disponíveis

#### 6.1 Autenticação

- **POST /login**
  
  **Descrição:** Autentica um usuário usando `username` e `password`.  
  **Parâmetros:**
  
  - **Body:**  
    ```json
    {
      "username": "string",
      "password": "string"
    }
    ```
  
  **Respostas:**
  
  - **200 OK:**  
    ```json
    {
      "message": "Login realizado com sucesso",
      "userId": "string"
    }
    ```
  
  - **400 Bad Request:**  
    ```json
    {
      "error": "Dados inválidos"
    }
    ```
  
  - **401 Unauthorized:**  
    ```json
    {
      "error": "Credenciais inválidas"
    }
    ```

- **POST /logout**

  **Descrição:** Encerra a sessão de um usuário.  
  **Parâmetros:**
  
  - **Body:**  
    ```json
    {
      "userId": "string"
    }
    ```
  
  **Respostas:**
  
  - **200 OK:**  
    ```json
    {
      "message": "Logout realizado com sucesso"
    }
    ```
  
  - **400 Bad Request:**  
    ```json
    {
      "error": "Dados inválidos"
    }
    ```

#### 6.2 Usuários

- **GET /users**

  **Descrição:** Lista todos os usuários conectados.  
  **Respostas:**
  
  - **200 OK:**  
    ```json
    [
      "userId1",
      "userId2",
      "..."
    ]
    ```

- **GET /public-key/{userId}**

  **Descrição:** Obtém a chave pública de um usuário específico.  
  **Parâmetros:**
  
  - **Path:** `userId` (string)
  
  **Respostas:**
  
  - **200 OK:**  
    ```json
    {
      "publicKey": {
        "p": "string",
        "g": "string",
        "y": "string"
      }
    }
    ```
  
  - **404 Not Found:**  
    ```json
    {
      "error": "Usuário não encontrado"
    }
    ```

#### 6.3 Mensagens

- **POST /send-message**

  **Descrição:** Envia uma mensagem criptografada para um usuário específico.  
  **Parâmetros:**
  
  - **Body:**  
    ```json
    {
      "encryptedMessage": {
        "a": "string",
        "b": "string"
      },
      "senderId": "string",
      "receiverId": "string"
    }
    ```
  
  **Respostas:**
  
  - **200 OK:**  
    ```json
    {
      "message": "Mensagem enviada com sucesso"
    }
    ```
  
  - **400 Bad Request:**  
    ```json
    {
      "error": "Dados inválidos"
    }
    ```

- **POST /receive-messages**

  **Descrição:** Recebe todas as mensagens entre dois usuários.  
  **Parâmetros:**
  
  - **Body:**  
    ```json
    {
      "userId": "string",
      "otherUserId": "string"
    }
    ```
  
  **Respostas:**
  
  - **200 OK:**  
    ```json
    [
      {
        "senderId": "string",
        "encryptedContent": {
          "a": "string",
          "b": "string"
        },
        "timestamp": "2023-10-10T10:00:00Z"
      }
    ]
    ```
  
  - **400 Bad Request:**  
    ```json
    {
      "error": "Dados inválidos"
    }
    ```

#### 6.4 Grupos

- **POST /create-group**

  **Descrição:** Cria um novo grupo com membros especificados.  
  **Parâmetros:**
  
  - **Body:**  
    ```json
    {
      "groupId": "string",
      "members": ["string1", "string2"],
      "senderKey": "string"
    }
    ```
  
  **Respostas:**
  
  - **200 OK:**  
    ```json
    {
      "message": "Grupo criado com sucesso",
      "groupId": "string"
    }
    ```
  
  - **400 Bad Request:**  
    ```json
    {
      "error": "Dados inválidos"
    }
    ```
  
  - **409 Conflict:**  
    ```json
    {
      "error": "Grupo já existe"
    }
    ```

#### 6.5 WebSocket

- **GET /ws/{userId}**

  **Descrição:** Inicia uma conexão WebSocket para um usuário.  
  **Parâmetros:**
  
  - **Path:** `userId` (string)
  
  **Uso:**
  
  Após estabelecer a conexão, o WebSocket permite o envio e recebimento de mensagens em tempo real.

## Comunicação em Tempo Real

### 7.1 WebSockets

O sistema utiliza WebSockets para permitir a comunicação em tempo real entre os usuários. Isso garante que as mensagens sejam entregues instantaneamente e que os usuários recebam notificações de eventos como novas mensagens, status de leitura e alterações em grupos.

**Principais Funcionalidades:**
- **Entrega Imediata de Mensagens:** As mensagens são enviadas e recebidas em tempo real sem a necessidade de recarregar a página.
- **Notificações de Evento:** Usuários são informados sobre eventos como novos membros em grupos, mensagens recebidas e status de conexão.
- **Gerenciamento de Conexões:** O servidor gerencia múltiplas conexões WebSocket, garantindo que cada usuário receba apenas as mensagens destinadas a ele.

## Segurança

### 8.1 Criptografia

- **End-to-End Encryption (E2EE):** Todas as mensagens são criptografadas no cliente antes de serem enviadas e somente o destinatário possui a chave para descriptografá-las.
- **Algoritmo ElGamal:** Utilizado para a criptografia das mensagens, garantindo robustez e segurança.
- **Sender Keys para Grupos:** Implementação de sender keys para otimizar a criptografia em mensagens de grupo, reduzindo a sobrecarga computacional.

### 8.2 Proteção de Dados

- **Hashing de Senhas:** Utilização de bcrypt para armazenar hashes seguros das senhas dos usuários.
- **Validação e Sanitização de Entradas:** Todas as entradas dos usuários são validadas e sanitizadas para prevenir ataques como injeção de SQL e XSS.
- **HTTPS:** Recomenda-se a utilização de HTTPS para todas as comunicações entre o frontend e o backend, assegurando a proteção dos dados em trânsito.
- **Autenticação JWT (Futura Implementação):** Considerar a implementação de JSON Web Tokens para uma autenticação mais robusta e segura.

### 8.3 Boas Práticas de Segurança

- **Gestão de Sessões Seguras:** Implementação de tokens de sessão com expiração adequada e armazenamento seguro.
- **Monitoramento e Logging:** Registro seguro de logs para auditorias e monitoramento de atividades suspeitas.
- **Atualizações Regulares:** Manutenção e atualização contínua das dependências para mitigar vulnerabilidades conhecidas.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests para melhorar este projeto.

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
