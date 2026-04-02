package release

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"apk-version-control/internal/storage"
)

type Service struct {
	db      *sql.DB
	storage storage.Storage
}

func NewService(db *sql.DB, s storage.Storage) *Service {
	return &Service{db: db, storage: s}
}

func (s *Service) ListByProject(projectID int) ([]Release, error) {
	rows, err := s.db.Query(
		`SELECT id, project_id, version_name, version_code,
		        COALESCE(release_type,'feature'), channel,
		        COALESCE(changelog,''), COALESCE(s3_key,''), file_size,
		        COALESCE(min_sdk,21), COALESCE(target_sdk,34),
		        uploaded_by, created_at, created_at, updated_at
         FROM releases WHERE project_id = $1 ORDER BY version_code DESC`,
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var releases []Release
	for rows.Next() {
		var r Release
		if err := rows.Scan(
			&r.ID, &r.ProjectID, &r.VersionName, &r.VersionCode,
			&r.ReleaseType, &r.Channel, &r.Changelog, &r.S3Key, &r.FileSize,
			&r.MinSDK, &r.TargetSDK,
			&r.UploadedBy, &r.UploadedAt, &r.CreatedAt, &r.UpdatedAt,
		); err != nil {
			return nil, err
		}
		releases = append(releases, r)
	}
	return releases, rows.Err()
}

func (s *Service) Create(
	projectID int,
	versionName string,
	versionCode int,
	releaseType, channel, changelog string,
	minSDK, targetSDK int,
	uploadedBy int,
) (*Release, string, error) {
	s3Key := fmt.Sprintf(
		"projects/%d/releases/%s-%s.apk",
		projectID, versionName, uuid.NewString()[:8],
	)

	if releaseType == "" {
		releaseType = "feature"
	}
	if channel == "" {
		channel = "stable"
	}
	if minSDK == 0 {
		minSDK = 21
	}
	if targetSDK == 0 {
		targetSDK = 34
	}

	r := &Release{}
	err := s.db.QueryRow(
		`INSERT INTO releases
             (project_id, version_name, version_code, release_type, channel, changelog, s3_key, min_sdk, target_sdk, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, project_id, version_name, version_code,
                   COALESCE(release_type,'feature'), channel,
                   COALESCE(changelog,''), COALESCE(s3_key,''), file_size,
                   COALESCE(min_sdk,21), COALESCE(target_sdk,34),
                   uploaded_by, created_at, created_at, updated_at`,
		projectID, versionName, versionCode, releaseType, channel, changelog, s3Key, minSDK, targetSDK, uploadedBy,
	).Scan(
		&r.ID, &r.ProjectID, &r.VersionName, &r.VersionCode,
		&r.ReleaseType, &r.Channel, &r.Changelog, &r.S3Key, &r.FileSize,
		&r.MinSDK, &r.TargetSDK,
		&r.UploadedBy, &r.UploadedAt, &r.CreatedAt, &r.UpdatedAt,
	)
	if err != nil {
		return nil, "", err
	}

	uploadURL, err := s.storage.GenerateUploadURL(context.Background(), s3Key, 15*time.Minute)
	if err != nil {
		return nil, "", err
	}

	return r, uploadURL, nil
}

func (s *Service) GetDownloadURL(releaseID int) (string, error) {
	var s3Key string
	err := s.db.QueryRow(
		`SELECT COALESCE(s3_key,'') FROM releases WHERE id = $1`, releaseID,
	).Scan(&s3Key)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", errors.New("release not found")
		}
		return "", err
	}
	if s3Key == "" {
		return "", errors.New("no file uploaded for this release")
	}
	return s.storage.GenerateDownloadURL(context.Background(), s3Key, 60*time.Minute)
}

func (s *Service) Delete(id int) error {
	result, err := s.db.Exec(`DELETE FROM releases WHERE id = $1`, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return errors.New("release not found")
	}
	return nil
}

func (s *Service) GetByID(id int) (*Release, error) {
	r := &Release{}
	err := s.db.QueryRow(
		`SELECT id, project_id, version_name, version_code,
		        COALESCE(release_type,'feature'), channel,
		        COALESCE(changelog,''), COALESCE(s3_key,''), file_size,
		        COALESCE(min_sdk,21), COALESCE(target_sdk,34),
		        uploaded_by, created_at, created_at, updated_at
         FROM releases WHERE id = $1`, id,
	).Scan(
		&r.ID, &r.ProjectID, &r.VersionName, &r.VersionCode,
		&r.ReleaseType, &r.Channel, &r.Changelog, &r.S3Key, &r.FileSize,
		&r.MinSDK, &r.TargetSDK,
		&r.UploadedBy, &r.UploadedAt, &r.CreatedAt, &r.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return r, nil
}
