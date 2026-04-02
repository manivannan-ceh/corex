package deleterequest

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

// POST /delete-requests  — any authenticated user
func (h *Handler) Create(c *gin.Context) {
	var req struct {
		Resource   string `json:"resource"    binding:"required"`
		ResourceID int    `json:"resource_id" binding:"required"`
		Reason     string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(int)

	dr, err := h.service.Create(req.Resource, req.ResourceID, req.Reason, uid)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.audit.Log(&uid, "delete_requested", req.Resource, &req.ResourceID, req.Reason, c.ClientIP())
	c.JSON(http.StatusCreated, gin.H{"delete_request": dr})
}

// GET /delete-requests?status=pending  — admin only
func (h *Handler) List(c *gin.Context) {
	status := c.Query("status")
	list, err := h.service.List(status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch delete requests"})
		return
	}
	if list == nil {
		list = []DeleteRequest{}
	}
	c.JSON(http.StatusOK, gin.H{"delete_requests": list})
}

// PUT /delete-requests/:id/review  — admin only
func (h *Handler) Review(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req struct {
		Approve bool `json:"approve"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(int)

	if err := h.service.Review(id, uid, req.Approve); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	action := "delete_rejected"
	if req.Approve {
		action = "delete_approved"
	}
	h.audit.Log(&uid, action, "delete_request", &id, "", c.ClientIP())
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
