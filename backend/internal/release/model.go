package release

import "time"

type RecentRelease struct {
	ID          int       `json:"id"`
	ProjectID   int       `json:"project_id"`
	ProjectName string    `json:"project_name"`
	VersionName string    `json:"version_name"`
	VersionCode int       `json:"version_code"`
	ReleaseType string    `json:"release_type"`
	Channel     string    `json:"channel"`
	FileSize    int64     `json:"file_size"`
	CreatedAt   time.Time `json:"created_at"`
}

type Release struct {
	ID          int       `json:"id"`
	ProjectID   int       `json:"project_id"`
	VersionName string    `json:"version_name"`
	VersionCode int       `json:"version_code"`
	ReleaseType string    `json:"release_type"`
	Channel     string    `json:"channel"`
	Changelog   string    `json:"changelog"`
	S3Key       string    `json:"s3_key,omitempty"`
	FileSize    int64     `json:"file_size"`
	MinSDK      int       `json:"min_sdk"`
	TargetSDK   int       `json:"target_sdk"`
	UploadedBy  int       `json:"uploaded_by"`
	UploadedAt  time.Time `json:"uploaded_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
