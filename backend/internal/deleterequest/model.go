package deleterequest

import "time"

type DeleteRequest struct {
	ID          int        `json:"id"`
	Resource    string     `json:"resource"`
	ResourceID  int        `json:"resource_id"`
	Reason      string     `json:"reason"`
	RequestedBy int        `json:"requested_by"`
	RequesterName  string  `json:"requester_name"`
	RequesterEmail string  `json:"requester_email"`
	Status      string     `json:"status"` // pending | approved | rejected
	ReviewedBy  *int       `json:"reviewed_by,omitempty"`
	ReviewedAt  *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	// Populated for releases
	ResourceName string `json:"resource_name,omitempty"`
}
