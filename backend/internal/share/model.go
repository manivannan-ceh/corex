package share

import "time"

type ShareCode struct {
	ID         int        `json:"id"`
	Code       string     `json:"code"`
	ReleaseID  int        `json:"release_id"`
	CreatedBy  int        `json:"created_by"`
	ExpiryTime time.Time  `json:"expiry_time"`
	Used       bool       `json:"used"`
	UsedAt     *time.Time `json:"used_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type ShareLink struct {
	ID         int        `json:"id"`
	Token      string     `json:"token"`
	ReleaseID  int        `json:"release_id"`
	CreatedBy  int        `json:"created_by"`
	ExpiryTime time.Time  `json:"expiry_time"`
	SingleUse  bool       `json:"single_use"`
	Used       bool       `json:"used"`
	CreatedAt  time.Time  `json:"created_at"`
}

type ReleaseInfo struct {
	ID          int       `json:"id"`
	VersionName string    `json:"version_name"`
	VersionCode int       `json:"version_code"`
	Channel     string    `json:"channel"`
	ReleaseType string    `json:"release_type"`
	FileSize    int64     `json:"file_size"`
	UploadedAt  time.Time `json:"uploaded_at"`
}

type ProjectInfo struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type VerifyResult struct {
	Valid       bool         `json:"valid"`
	Release     *ReleaseInfo `json:"release,omitempty"`
	Project     *ProjectInfo `json:"project,omitempty"`
	DownloadURL string       `json:"download_url,omitempty"`
	Message     string       `json:"message,omitempty"`
}
