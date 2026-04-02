package deleterequest

import (
	"database/sql"
	"errors"
	"time"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) Create(resource string, resourceID int, reason string, requestedBy int) (*DeleteRequest, error) {
	// Prevent duplicate pending requests for the same resource
	var count int
	err := s.db.QueryRow(
		`SELECT COUNT(*) FROM delete_requests WHERE resource=$1 AND resource_id=$2 AND status='pending'`,
		resource, resourceID,
	).Scan(&count)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("a pending delete request already exists for this resource")
	}

	dr := &DeleteRequest{}
	err = s.db.QueryRow(
		`INSERT INTO delete_requests (resource, resource_id, reason, requested_by)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, resource, resource_id, COALESCE(reason,''), requested_by, status, created_at`,
		resource, resourceID, reason, requestedBy,
	).Scan(&dr.ID, &dr.Resource, &dr.ResourceID, &dr.Reason, &dr.RequestedBy, &dr.Status, &dr.CreatedAt)
	return dr, err
}

func (s *Service) List(statusFilter string) ([]DeleteRequest, error) {
	query := `
		SELECT dr.id, dr.resource, dr.resource_id, COALESCE(dr.reason,''),
		       dr.requested_by, COALESCE(u.name,''), COALESCE(u.email,''),
		       dr.status, dr.reviewed_by, dr.reviewed_at, dr.created_at,
		       COALESCE(r.version_name, '') as resource_name
		FROM delete_requests dr
		LEFT JOIN users u ON u.id = dr.requested_by
		LEFT JOIN releases r ON dr.resource = 'release' AND r.id = dr.resource_id
		WHERE ($1 = '' OR dr.status = $1)
		ORDER BY dr.created_at DESC`

	rows, err := s.db.Query(query, statusFilter)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []DeleteRequest
	for rows.Next() {
		var dr DeleteRequest
		if err := rows.Scan(
			&dr.ID, &dr.Resource, &dr.ResourceID, &dr.Reason,
			&dr.RequestedBy, &dr.RequesterName, &dr.RequesterEmail,
			&dr.Status, &dr.ReviewedBy, &dr.ReviewedAt, &dr.CreatedAt,
			&dr.ResourceName,
		); err != nil {
			return nil, err
		}
		list = append(list, dr)
	}
	return list, rows.Err()
}

func (s *Service) Review(id int, adminID int, approve bool) error {
	status := "rejected"
	if approve {
		status = "approved"
	}
	now := time.Now()
	result, err := s.db.Exec(
		`UPDATE delete_requests SET status=$1, reviewed_by=$2, reviewed_at=$3
		 WHERE id=$4 AND status='pending'`,
		status, adminID, now, id,
	)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return errors.New("request not found or already reviewed")
	}

	if approve {
		// Read resource info and hard-delete it
		var resource string
		var resourceID int
		err = s.db.QueryRow(
			`SELECT resource, resource_id FROM delete_requests WHERE id=$1`, id,
		).Scan(&resource, &resourceID)
		if err != nil {
			return err
		}
		if resource == "release" {
			_, err = s.db.Exec(`DELETE FROM releases WHERE id=$1`, resourceID)
			return err
		}
		if resource == "project" {
			_, err = s.db.Exec(`DELETE FROM projects WHERE id=$1`, resourceID)
			return err
		}
	}
	return nil
}
