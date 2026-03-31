package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"apk-version-control/config"
	"apk-version-control/internal/audit"
	"apk-version-control/internal/auth"
	dbpkg "apk-version-control/internal/db"
	"apk-version-control/internal/project"
	"apk-version-control/internal/release"
	"apk-version-control/internal/share"
	"apk-version-control/internal/storage"
	"apk-version-control/internal/user"
)

func main() {
	cfg := config.Load()

	// ── Database ──────────────────────────────────────────────────────────────
	db, err := dbpkg.New(cfg)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}
	defer db.Close()

	if err := dbpkg.Migrate(db); err != nil {
		log.Fatalf("migrate db: %v", err)
	}

	// ── Storage ───────────────────────────────────────────────────────────────
	var store storage.Storage
	var localStorage *storage.LocalStorage

	if cfg.StorageType == "s3" {
		s3svc, err := storage.NewS3Service(cfg)
		if err != nil {
			log.Fatalf("init s3: %v", err)
		}
		store = s3svc
	} else {
		ls, err := storage.NewLocalStorage(cfg.UploadDir, cfg.AppURL, cfg.JWTSecret)
		if err != nil {
			log.Fatalf("init local storage: %v", err)
		}
		store = ls
		localStorage = ls
	}

	// ── Services ──────────────────────────────────────────────────────────────
	auditSvc := audit.NewService(db)
	authSvc := auth.NewService(db, cfg.JWTSecret, cfg.JWTExpirationHours)
	userSvc := user.NewService(db)
	projectSvc := project.NewService(db)
	releaseSvc := release.NewService(db, store)
	shareSvc := share.NewService(db, store)

	// ── Handlers ──────────────────────────────────────────────────────────────
	authHandler := auth.NewHandler(authSvc, auditSvc)
	userHandler := user.NewHandler(userSvc, auditSvc)
	projectHandler := project.NewHandler(projectSvc, auditSvc)
	releaseHandler := release.NewHandler(releaseSvc, auditSvc)
	shareHandler := share.NewHandler(shareSvc, auditSvc)
	auditHandler := audit.NewHandler(auditSvc)

	// ── Router ────────────────────────────────────────────────────────────────
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: false,
	}))

	api := r.Group("/api/v1")

	// Public routes
	api.POST("/auth/login", authHandler.Login)
	api.POST("/share/code/verify", shareHandler.VerifyCode)
	api.GET("/share/link/:token", shareHandler.VerifyLink)

	// Local storage routes (unauthenticated — tokens are self-validating)
	if localStorage != nil {
		api.PUT("/storage/upload", localStorage.UploadHandler)
		api.GET("/storage/files", localStorage.DownloadHandler)
	}

	// Authenticated routes
	protected := api.Group("/")
	protected.Use(auth.Middleware(authSvc))
	{
		// Projects
		protected.GET("/projects", projectHandler.List)
		protected.POST("/projects", projectHandler.Create)

		// Releases
		protected.GET("/projects/:id/releases", releaseHandler.List)
		protected.POST("/projects/:id/releases", releaseHandler.Create)
		protected.GET("/releases/:id/download", releaseHandler.Download)

		// Sharing
		protected.POST("/releases/:id/share/code", shareHandler.GenerateCode)
		protected.POST("/releases/:id/share/link", shareHandler.GenerateLink)

		// Admin-only routes
		admin := protected.Group("/")
		admin.Use(auth.RequireRole("admin"))
		{
			admin.GET("/users", userHandler.List)
			admin.POST("/users", userHandler.Create)
			admin.PUT("/users/:id/role", userHandler.UpdateRole)
			admin.DELETE("/users/:id", userHandler.Delete)
			admin.GET("/audit-logs", auditHandler.List)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	addr := ":" + cfg.ServerPort
	log.Printf("Server listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
