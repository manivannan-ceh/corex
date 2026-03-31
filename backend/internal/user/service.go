package user

import (
	"database/sql"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) List() ([]User, error) {
	rows, err := s.db.Query(
		`SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (s *Service) Create(email, password, name, role string) (*User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	u := &User{}
	err = s.db.QueryRow(
		`INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, role, created_at, updated_at`,
		email, string(hash), name, role,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	return u, err
}

func (s *Service) UpdateRole(id int, role string) (*User, error) {
	u := &User{}
	err := s.db.QueryRow(
		`UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2
         RETURNING id, email, name, role, created_at, updated_at`,
		role, id,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("user not found")
	}
	return u, err
}

func (s *Service) Delete(id int) error {
	res, err := s.db.Exec(`DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("user not found")
	}
	return nil
}
