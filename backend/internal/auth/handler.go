package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"apk-version-control/internal/audit"
)

type Handler struct {
	service *Service
	audit   *audit.Service
}

func NewHandler(service *Service, auditSvc *audit.Service) *Handler {
	return &Handler{service: service, audit: auditSvc}
}

type loginRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, token, err := h.service.Authenticate(req.Email, req.Password)
	if err != nil {
		h.audit.Log(nil, "login_failed", "user", nil, req.Email, c.ClientIP())
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	h.audit.Log(&user.ID, "login", "user", &user.ID, req.Email, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
			"role":  user.Role,
		},
	})
}
