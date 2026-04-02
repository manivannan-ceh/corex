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

// List returns all projects with their release counts.
func (s *Service) List(ownerID int, role string) ([]Project, error) {
	rows, err := s.db.Query(
		`SELECT p.id, p.name, p.package_name, COALESCE(p.description,''), p.owner_id,
		        p.created_at, p.updated_at,
		        COUNT(r.id) AS release_count
		 FROM projects p
		 LEFT JOIN releases r ON r.project_id = p.id
		 GROUP BY p.id
		 ORDER BY p.created_at DESC`,
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
			&p.OwnerID, &p.CreatedAt, &p.UpdatedAt, &p.ReleaseCount,
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
