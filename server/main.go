package main

import (
	"fmt"
	"os"
	"time"

	"server/api"
	"server/db"
	_ "server/docs"
	"server/ws"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/joho/godotenv"
)

// @title Chat API
// @version 1.0
// @description Esta é uma API de servidor de chat simples.
// @host localhost:3000
// @BasePath /api
// @schemes http
func main() {
	// Configurar Logger
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetOutput(os.Stdout)
	logger.SetLevel(logrus.InfoLevel)

	// Carregar variáveis de ambiente
	err := godotenv.Load()
	if err != nil {
		logger.Warn("Nenhum arquivo .env encontrado. Usando variáveis de ambiente existentes.")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		logger.Fatal("Variável de ambiente JWT_SECRET não definida")
	}

	router := gin.Default()

	// Middleware de Logging
	router.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// Customizar o formato do log
		return fmt.Sprintf(`{"time":"%s", "status":%d, "method":"%s", "path":"%s", "ip":"%s", "user-agent":"%s", "latency":"%s"}%s`,
			param.TimeStamp.Format(time.RFC3339),
			param.StatusCode,
			param.Method,
			param.Path,
			param.ClientIP,
			param.Request.UserAgent(),
			param.Latency,
			"\n",
		)
	}))
	router.Use(gin.Recovery())

	// Configurar CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"}

	config.AllowHeaders = []string{
		"Authorization",
		"Content-Type",
		"Origin",
		"Accept",
		"X-Requested-With",
		"Content-Length",
		"Accept-Encoding",
		"Accept-Language",
		"Connection",
		"Dnt",
		"Host",
		"Referer",
		"User-Agent",
		"If-Modified-Since",
	}

	router.Use(cors.New(config))

	// Rota do Swagger
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Inicializa o banco de dados
	db.Init()

	// Inicializa as rotas da API
	api.SetupRoutes(router)

	// Inicializa o WebSocket
	ws.WSRoutes(router)

	// Inicia o servidor
	logger.Info("Servidor iniciado na porta 3000")
	if err := router.Run(":3000"); err != nil {
		logger.Fatal("Erro ao iniciar o servidor: ", err)
	}
}
