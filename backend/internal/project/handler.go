package project

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"apk-version-control/internal/audit"
)

type Handler struct {
	service *Service
	audit   *audit.Service
}

func NewHandler(svc *Service, auditSvc *audit.Service) *Handler {
	return &Handler{service: svc, audit: auditSvc}
}

func (h *Handler) List(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("user_role")

	projects, err := h.service.List(userID.(int), role.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch projects"})
		return
	}
	if projects == nil {
		projects = []Project{}
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

type createProjectRequest struct {
	Name        string `json:"name"         binding:"required"`
	PackageName string `json:"package_name" binding:"required"`
	Description string `json:"description"`
}

func (h *Handler) Create(c *gin.Context) {
	var req createProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(int)

	p, err := h.service.Create(req.Name, req.PackageName, req.Description, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create project"})
		return
	}

	h.audit.Log(&uid, "create", "project", &p.ID, req.Name, c.ClientIP())
	c.JSON(http.StatusCreated, gin.H{"project": p})
}
