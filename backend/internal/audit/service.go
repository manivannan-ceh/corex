package audit

import (
	"database/sql"
	"log"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) Log(userID *int, action, resource string, resourceID *int, details, ip string) {
	go func() {
		_, err := s.db.Exec(
			`INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
			userID, action, resource, resourceID, details, ip,
		)
		if err != nil {
			log.Printf("audit log error: %v", err)
		}
	}()
}

func (s *Service) List(limit int) ([]Log, error) {
	rows, err := s.db.Query(
		`SELECT al.id, al.user_id, al.action, al.resource, al.resource_id,
		        COALESCE(al.details,''), COALESCE(al.ip_address,''), al.created_at,
		        COALESCE(u.name,'') as user_name, COALESCE(u.email,'') as user_email
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.user_id
         ORDER BY al.created_at DESC LIMIT $1`,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []Log
	for rows.Next() {
		var l Log
		if err := rows.Scan(
			&l.ID, &l.UserID, &l.Action, &l.Resource, &l.ResourceID,
			&l.Details, &l.IPAddress, &l.CreatedAt,
			&l.UserName, &l.UserEmail,
		); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, rows.Err()
}
