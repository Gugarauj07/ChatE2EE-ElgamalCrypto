FROM golang:1.21-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache gcc musl-dev

# Copiar go.mod e go.sum
COPY go.mod go.sum ./

# Baixar dependências
RUN go mod download

# Copiar código fonte
COPY . .

# Compilar a aplicação
RUN go build -o main .

# Expor porta
EXPOSE 8080

# Comando para executar
CMD ["./main"]