package db

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"

	"apk-version-control/config"
)

func New(cfg *config.Config) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode,
	)

	database, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if err := database.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	database.SetMaxOpenConns(25)
	database.SetMaxIdleConns(5)

	log.Println("PostgreSQL connected")
	return database, nil
}
