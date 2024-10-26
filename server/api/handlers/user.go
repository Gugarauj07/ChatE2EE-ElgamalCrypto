package handlers

import (
	"net/http"

	"server/db"
	"server/models"

	"github.com/gin-gonic/gin"
)

// GetUserHandler obtém os detalhes de um usuário específico
// @Summary Obter detalhes do usuário
// @Description Obtém os detalhes de um usuário específico
// @Tags Usuários
// @Accept json
// @Produce json
// @Param userId path string true "ID do usuário"
// @Success 200 {object} models.User
// @Failure 404 {object} map[string]string
// @Router /users/{userId} [get]
func GetUserHandler(c *gin.Context) {
	userId := c.Param("userId")

	var user models.User
	if err := db.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Retornar apenas informações relevantes
	c.JSON(http.StatusOK, gin.H{
		"userId":    user.UserId,
		"username":  user.Username,
		"publicKey": user.PublicKey,
	})
}

// UpdateUserHandler atualiza informações de um usuário
// @Summary Atualizar informações do usuário
// @Description Atualiza informações de um usuário específico
// @Tags Usuários
// @Accept json
// @Produce json
// @Param userId path string true "ID do usuário"
// @Param user body models.User true "Dados do usuário"
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users/{userId} [put]
func UpdateUserHandler(c *gin.Context) {
	userId := c.Param("userId")

	var user models.User
	if err := db.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	var req struct {
		Username string `json:"username"`
		// Adicione outros campos que deseja permitir atualizar
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	if req.Username != "" {
		user.Username = req.Username
	}

	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar usuário"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário atualizado com sucesso"})
}

// GetAllUsersHandler obtém a lista de todos os usuários, excluindo o usuário autenticado
// @Summary Obter lista de usuários
// @Description Obtém uma lista de todos os usuários cadastrados, excluindo o usuário autenticado
// @Tags Usuários
// @Accept json
// @Produce json
// @Param Authorization header string true "Bearer Token"
// @Success 200 {array} models.User
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /users [get]
func GetAllUsersHandler(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	var users []models.User
	if err := db.DB.Where("user_id != ?", userId.(string)).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuários"})
		return
	}

	// Filtrar informações relevantes
	type UserResponse struct {
		UserId    string       `json:"userId"`
		Username  string       `json:"username"`
		PublicKey models.PublicKey `json:"publicKey"`
	}

	var response []UserResponse
	for _, user := range users {
		response = append(response, UserResponse{
			UserId:    user.UserId,
			Username:  user.Username,
			PublicKey: user.PublicKey,
		})
	}

	c.JSON(http.StatusOK, response)
}
