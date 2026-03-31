package release

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
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	releases, err := h.service.ListByProject(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch releases"})
		return
	}
	if releases == nil {
		releases = []Release{}
	}
	c.JSON(http.StatusOK, gin.H{"releases": releases})
}

type createReleaseRequest struct {
	VersionName string `json:"version_name" binding:"required"`
	VersionCode int    `json:"version_code" binding:"required"`
	ReleaseType string `json:"release_type"`
	Channel     string `json:"channel"`
	Changelog   string `json:"changelog"`
	MinSDK      int    `json:"min_sdk"`
	TargetSDK   int    `json:"target_sdk"`
}

func (h *Handler) Create(c *gin.Context) {
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	var req createReleaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(int)

	r, uploadURL, err := h.service.Create(
		projectID, req.VersionName, req.VersionCode,
		req.ReleaseType, req.Channel, req.Changelog,
		req.MinSDK, req.TargetSDK, uid,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create release"})
		return
	}

	h.audit.Log(&uid, "upload_apk", "release", &r.ID, req.VersionName, c.ClientIP())
	c.JSON(http.StatusCreated, gin.H{
		"release":    r,
		"upload_url": uploadURL,
	})
}

func (h *Handler) Download(c *gin.Context) {
	releaseID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid release id"})
		return
	}

	url, err := h.service.GetDownloadURL(releaseID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid := userID.(int)
	h.audit.Log(&uid, "download_apk", "release", &releaseID, "", c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"download_url": url})
}
