package audit

import "time"

type Log struct {
	ID         int       `json:"id"`
	UserID     *int      `json:"user_id"`
	UserName   string    `json:"user_name,omitempty"`
	UserEmail  string    `json:"user_email,omitempty"`
	Action     string    `json:"action"`
	Resource   string    `json:"resource"`
	ResourceID *int      `json:"resource_id"`
	Details    string    `json:"details"`
	IPAddress  string    `json:"ip_address"`
	CreatedAt  time.Time `json:"created_at"`
}
