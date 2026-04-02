package project

import (
	"database/sql"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// List returns all projects for all roles.
func (s *Service) List(ownerID int, role string) ([]Project, error) {
	rows, err := s.db.Query(
		`SELECT id, name, package_name, COALESCE(description,''), owner_id, created_at, updated_at
         FROM projects ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(
			&p.ID, &p.Name, &p.PackageName, &p.Description,
			&p.OwnerID, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, rows.Err()
}

// Create inserts a new project and returns it.
func (s *Service) Create(name, packageName, description string, ownerID int) (*Project, error) {
	p := &Project{}
	err := s.db.QueryRow(
		`INSERT INTO projects (name, package_name, description, owner_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, package_name, COALESCE(description,''), owner_id, created_at, updated_at`,
		name, packageName, description, ownerID,
	).Scan(&p.ID, &p.Name, &p.PackageName, &p.Description, &p.OwnerID, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}
