package user

import (
	"net/http"
	"strconv"

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
	users, err := h.service.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}
	if users == nil {
		users = []User{}
	}
	c.JSON(http.StatusOK, gin.H{"users": users})
}

type createUserRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name"     binding:"required"`
	Role     string `json:"role"     binding:"required,oneof=admin developer user"`
}

func (h *Handler) Create(c *gin.Context) {
	var req createUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u, err := h.service.Create(req.Email, req.Password, req.Name, req.Role)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already exists or invalid data"})
		return
	}

	callerID, _ := c.Get("user_id")
	uid := callerID.(int)
	h.audit.Log(&uid, "create_user", "user", &u.ID, u.Email, c.ClientIP())
	c.JSON(http.StatusCreated, gin.H{"user": u})
}

type updateRoleRequest struct {
	Role string `json:"role" binding:"required,oneof=admin developer user"`
}

func (h *Handler) UpdateRole(c *gin.Context) {
	targetID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var req updateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u, err := h.service.UpdateRole(targetID, req.Role)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	callerID, _ := c.Get("user_id")
	uid := callerID.(int)
	h.audit.Log(&uid, "update_role", "user", &targetID, req.Role, c.ClientIP())
	c.JSON(http.StatusOK, gin.H{"user": u})
}

func (h *Handler) Delete(c *gin.Context) {
	targetID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	// Prevent self-deletion
	callerID, _ := c.Get("user_id")
	uid := callerID.(int)
	if uid == targetID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete your own account"})
		return
	}

	if err := h.service.Delete(targetID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	h.audit.Log(&uid, "delete_user", "user", &targetID, "", c.ClientIP())
	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}
