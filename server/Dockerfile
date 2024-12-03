FROM golang:1.21-alpine

# Instalar dependências para CGO e go-sqlite3
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Habilitar CGO durante a compilação
ENV CGO_ENABLED=1
ENV GOOS=linux
ENV GOARCH=amd64

RUN go build -o main .

CMD ["./main"]