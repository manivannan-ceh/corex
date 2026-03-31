package storage

import (
	"context"
	"time"
)

// Storage is the interface implemented by both S3Storage and LocalStorage.
type Storage interface {
	GenerateUploadURL(ctx context.Context, key string, expiry time.Duration) (string, error)
	GenerateDownloadURL(ctx context.Context, key string, expiry time.Duration) (string, error)
}
