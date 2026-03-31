package storage

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// LocalStorage stores files on the local filesystem and serves them via
// signed URLs that point back to the backend's own /api/v1/storage/* routes.
type LocalStorage struct {
	uploadDir string // absolute path where files are stored
	appURL    string // base URL reachable from the browser (may be empty → relative URLs)
	secret    string // HMAC signing secret
}

func NewLocalStorage(uploadDir, appURL, secret string) (*LocalStorage, error) {
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return nil, fmt.Errorf("create upload dir: %w", err)
	}
	return &LocalStorage{uploadDir: uploadDir, appURL: appURL, secret: secret}, nil
}

func (l *LocalStorage) GenerateUploadURL(_ context.Context, key string, expiry time.Duration) (string, error) {
	token := l.sign(key, time.Now().Add(expiry))
	return l.appURL + "/api/v1/storage/upload?token=" + token, nil
}

func (l *LocalStorage) GenerateDownloadURL(_ context.Context, key string, expiry time.Duration) (string, error) {
	token := l.sign(key, time.Now().Add(expiry))
	return l.appURL + "/api/v1/storage/files?token=" + token, nil
}

// sign creates a URL-safe HMAC token encoding the key and expiry.
func (l *LocalStorage) sign(key string, exp time.Time) string {
	payload := base64.RawURLEncoding.EncodeToString([]byte(key)) +
		"." + strconv.FormatInt(exp.Unix(), 10)
	mac := hmac.New(sha256.New, []byte(l.secret))
	mac.Write([]byte(payload))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return payload + "." + sig
}

// verify validates the token and returns the embedded key.
func (l *LocalStorage) verify(token string) (string, error) {
	parts := strings.SplitN(token, ".", 3)
	if len(parts) != 3 {
		return "", fmt.Errorf("malformed token")
	}
	payload := parts[0] + "." + parts[1]
	mac := hmac.New(sha256.New, []byte(l.secret))
	mac.Write([]byte(payload))
	expectedSig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if parts[2] != expectedSig {
		return "", fmt.Errorf("invalid token signature")
	}
	expUnix, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil || time.Now().Unix() > expUnix {
		return "", fmt.Errorf("token expired")
	}
	keyBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", fmt.Errorf("invalid token key")
	}
	return string(keyBytes), nil
}

// filePath returns the absolute path for a storage key.
func (l *LocalStorage) filePath(key string) string {
	// Sanitise key to prevent path traversal
	clean := filepath.Clean("/" + key)
	return filepath.Join(l.uploadDir, clean)
}

// UploadHandler handles PUT /api/v1/storage/upload?token=...
func (l *LocalStorage) UploadHandler(c *gin.Context) {
	key, err := l.verify(c.Query("token"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired upload token"})
		return
	}

	dest := l.filePath(key)
	if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create directory"})
		return
	}

	f, err := os.Create(dest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create file"})
		return
	}
	defer f.Close()

	if _, err := io.Copy(f, c.Request.Body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write file"})
		return
	}

	c.Status(http.StatusOK)
}

// DownloadHandler handles GET /api/v1/storage/files?token=...
func (l *LocalStorage) DownloadHandler(c *gin.Context) {
	key, err := l.verify(c.Query("token"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired download token"})
		return
	}

	src := l.filePath(key)
	f, err := os.Open(src)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open file"})
		}
		return
	}
	defer f.Close()

	filename := filepath.Base(key)
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Header("Content-Type", "application/vnd.android.package-archive")
	io.Copy(c.Writer, f)
}
