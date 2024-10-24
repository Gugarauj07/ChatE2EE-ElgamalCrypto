    // server/middleware/authorization.go
    package middleware

    import (
    	"net/http"

    	"server/db"
    	"server/models"

    	"github.com/gin-gonic/gin"
    )

    func IsGroupMember() gin.HandlerFunc {
    	return func(c *gin.Context) {
    		groupId := c.Param("groupId")
    		userId, exists := c.Get("userId")
    		if !exists {
    			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
    			c.Abort()
    			return
    		}

    		// Verificar se o usuário é membro do grupo
    		var group models.Group
    		if err := db.DB.Where("group_id = ?", groupId).First(&group).Error; err != nil {
    			c.JSON(http.StatusNotFound, gin.H{"error": "Grupo não encontrado"})
    			c.Abort()
    			return
    		}

    		isMember := false
    		for _, member := range group.Members {
    			if member == userId.(string) {
    				isMember = true
    				break
    			}
    		}

    		if !isMember {
    			c.JSON(http.StatusForbidden, gin.H{"error": "Você não tem permissão para acessar este grupo"})
    			c.Abort()
    			return
    		}

    		c.Next()
    	}
    }