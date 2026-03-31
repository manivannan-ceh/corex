package share

import (
	"context"
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"math/big"
	"time"

	"apk-version-control/internal/storage"
)

const codeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const codeLength = 8

type Service struct {
	db      *sql.DB
	storage storage.Storage
}

func NewService(db *sql.DB, s storage.Storage) *Service {
	return &Service{db: db, storage: s}
}

func (s *Service) GenerateCode(releaseID, userID int) (*ShareCode, error) {
	code, err := generateRandomCode(codeLength)
	if err != nil {
		return nil, err
	}

	expiry := time.Now().Add(15 * time.Minute)
	sc := &ShareCode{}
	err = s.db.QueryRow(
		`INSERT INTO share_codes (code, release_id, created_by, expiry_time)
         VALUES ($1, $2, $3, $4)
         RETURNING id, code, release_id, created_by, expiry_time, used, created_at`,
		code, releaseID, userID, expiry,
	).Scan(&sc.ID, &sc.Code, &sc.ReleaseID, &sc.CreatedBy, &sc.ExpiryTime, &sc.Used, &sc.CreatedAt)
	return sc, err
}

func (s *Service) VerifyCode(code string) (*VerifyResult, error) {
	var (
		sc      ShareCode
		s3Key   string
		release ReleaseInfo
		project ProjectInfo
	)

	err := s.db.QueryRow(
		`SELECT sc.id, sc.code, sc.release_id, sc.expiry_time, sc.used,
		        r.id, r.version_name, r.version_code, r.channel,
		        COALESCE(r.release_type,'feature'), r.file_size, r.created_at,
		        COALESCE(r.s3_key,''),
		        p.id, p.name
         FROM share_codes sc
         JOIN releases r ON r.id = sc.release_id
         JOIN projects p ON p.id = r.project_id
         WHERE sc.code = $1`,
		code,
	).Scan(
		&sc.ID, &sc.Code, &sc.ReleaseID, &sc.ExpiryTime, &sc.Used,
		&release.ID, &release.VersionName, &release.VersionCode, &release.Channel,
		&release.ReleaseType, &release.FileSize, &release.UploadedAt,
		&s3Key,
		&project.ID, &project.Name,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &VerifyResult{Valid: false, Message: "Invalid or expired code"}, nil
		}
		return nil, err
	}

	if sc.Used || time.Now().After(sc.ExpiryTime) {
		return &VerifyResult{Valid: false, Message: "Code has expired or already been used"}, nil
	}

	now := time.Now()
	s.db.Exec(`UPDATE share_codes SET used = TRUE, used_at = $1 WHERE id = $2`, now, sc.ID)

	downloadURL := ""
	if s3Key != "" {
		downloadURL, err = s.storage.GenerateDownloadURL(context.Background(), s3Key, 30*time.Minute)
		if err != nil {
			return nil, err
		}
	}

	return &VerifyResult{
		Valid:       true,
		Release:     &release,
		Project:     &project,
		DownloadURL: downloadURL,
	}, nil
}

func (s *Service) GenerateLink(releaseID, userID, expiryHours int, singleUse bool) (*ShareLink, error) {
	token, err := generateRandomCode(32)
	if err != nil {
		return nil, err
	}
	if expiryHours <= 0 {
		expiryHours = 24
	}
	expiry := time.Now().Add(time.Duration(expiryHours) * time.Hour)

	sl := &ShareLink{}
	err = s.db.QueryRow(
		`INSERT INTO share_links (token, release_id, created_by, expiry_time, single_use)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, token, release_id, created_by, expiry_time, single_use, used, created_at`,
		token, releaseID, userID, expiry, singleUse,
	).Scan(&sl.ID, &sl.Token, &sl.ReleaseID, &sl.CreatedBy, &sl.ExpiryTime, &sl.SingleUse, &sl.Used, &sl.CreatedAt)
	return sl, err
}

func (s *Service) VerifyLink(token string) (*VerifyResult, error) {
	var (
		sl      ShareLink
		s3Key   string
		release ReleaseInfo
		project ProjectInfo
	)

	err := s.db.QueryRow(
		`SELECT sl.id, sl.token, sl.release_id, sl.expiry_time, sl.single_use, sl.used,
		        r.id, r.version_name, r.version_code, r.channel,
		        COALESCE(r.release_type,'feature'), r.file_size, r.created_at,
		        COALESCE(r.s3_key,''),
		        p.id, p.name
         FROM share_links sl
         JOIN releases r ON r.id = sl.release_id
         JOIN projects p ON p.id = r.project_id
         WHERE sl.token = $1`,
		token,
	).Scan(
		&sl.ID, &sl.Token, &sl.ReleaseID, &sl.ExpiryTime, &sl.SingleUse, &sl.Used,
		&release.ID, &release.VersionName, &release.VersionCode, &release.Channel,
		&release.ReleaseType, &release.FileSize, &release.UploadedAt,
		&s3Key,
		&project.ID, &project.Name,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &VerifyResult{Valid: false, Message: "Invalid or expired link"}, nil
		}
		return nil, err
	}

	if time.Now().After(sl.ExpiryTime) {
		return &VerifyResult{Valid: false, Message: "Link has expired"}, nil
	}
	if sl.SingleUse && sl.Used {
		return &VerifyResult{Valid: false, Message: "Link has already been used"}, nil
	}

	if sl.SingleUse {
		now := time.Now()
		s.db.Exec(`UPDATE share_links SET used = TRUE, used_at = $1 WHERE id = $2`, now, sl.ID)
	}

	downloadURL := ""
	if s3Key != "" {
		downloadURL, err = s.storage.GenerateDownloadURL(context.Background(), s3Key, 30*time.Minute)
		if err != nil {
			return nil, err
		}
	}

	return &VerifyResult{
		Valid:       true,
		Release:     &release,
		Project:     &project,
		DownloadURL: downloadURL,
	}, nil
}

func generateRandomCode(length int) (string, error) {
	result := make([]byte, length)
	charCount := big.NewInt(int64(len(codeChars)))
	for i := range result {
		n, err := rand.Int(rand.Reader, charCount)
		if err != nil {
			return "", fmt.Errorf("rand: %w", err)
		}
		result[i] = codeChars[n.Int64()]
	}
	return string(result), nil
}
