package audit

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{service: svc}
}

func (h *Handler) List(c *gin.Context) {
	logs, err := h.service.List(100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch audit logs"})
		return
	}
	if logs == nil {
		logs = []Log{}
	}
	c.JSON(http.StatusOK, gin.H{"logs": logs})
}
