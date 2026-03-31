package project

import "time"

type Project struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	PackageName string    `json:"package_name"`
	Description string    `json:"description"`
	OwnerID     int       `json:"owner_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
