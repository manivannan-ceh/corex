package share

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"apk-version-control/internal/audit"
)

type Handler struct {
	service     *Service
	audit       *audit.Service
	rateLimiter *rateLimiter
}

func NewHandler(svc *Service, auditSvc *audit.Service) *Handler {
	return &Handler{
		service:     svc,
		audit:       auditSvc,
		rateLimiter: newRateLimiter(10, time.Minute),
	}
}

func (h *Handler) GenerateCode(c *gin.Context) {
	releaseID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid release id"})
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(int)

	code, err := h.service.GenerateCode(releaseID, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate share code"})
		return
	}

	h.audit.Log(&uid, "share_code_created", "release", &releaseID, code.Code, c.ClientIP())
	c.JSON(http.StatusCreated, gin.H{
		"code":        code.Code,
		"expiry_time": code.ExpiryTime,
		"release_id":  code.ReleaseID,
	})
}

func (h *Handler) VerifyCode(c *gin.Context) {
	ip := c.ClientIP()
	if !h.rateLimiter.allow(ip) {
		h.audit.Log(nil, "failed_code_attempt", "share_code", nil, "rate_limited", ip)
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "too many requests, please try again later"})
		return
	}

	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.VerifyCode(req.Code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify code"})
		return
	}

	if result.Valid {
		h.audit.Log(nil, "share_code_used", "share_code", nil, req.Code, ip)
	} else {
		h.audit.Log(nil, "failed_code_attempt", "share_code", nil, req.Code, ip)
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) GenerateLink(c *gin.Context) {
	releaseID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid release id"})
		return
	}

	var req struct {
		ExpiryHours int  `json:"expiry_hours"`
		SingleUse   bool `json:"single_use"`
	}
	c.ShouldBindJSON(&req)

	userID, _ := c.Get("user_id")
	uid := userID.(int)

	link, err := h.service.GenerateLink(releaseID, uid, req.ExpiryHours, req.SingleUse)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate share link"})
		return
	}

	h.audit.Log(&uid, "share_link_created", "release", &releaseID, link.Token, c.ClientIP())
	c.JSON(http.StatusCreated, gin.H{
		"token":       link.Token,
		"expiry_time": link.ExpiryTime,
		"single_use":  link.SingleUse,
		"release_id":  link.ReleaseID,
	})
}

func (h *Handler) VerifyLink(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token required"})
		return
	}

	result, err := h.service.VerifyLink(token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify link"})
		return
	}

	c.JSON(http.StatusOK, result)
}

type rateLimiter struct {
	mu       sync.Mutex
	requests map[string][]time.Time
	max      int
	window   time.Duration
}

func newRateLimiter(max int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		requests: make(map[string][]time.Time),
		max:      max,
		window:   window,
	}
}

func (rl *rateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	prev := rl.requests[key]
	valid := prev[:0]
	for _, t := range prev {
		if t.After(windowStart) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.max {
		rl.requests[key] = valid
		return false
	}

	rl.requests[key] = append(valid, now)
	return true
}
