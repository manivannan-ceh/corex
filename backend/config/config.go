package config

import (
	"os"
	"strconv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	JWTSecret          string
	JWTExpirationHours int

	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	S3Bucket           string

	// Storage: "local" or "s3"
	StorageType string
	UploadDir   string
	AppURL      string

	ServerPort string
}

func Load() *Config {
	jwtExp, _ := strconv.Atoi(getEnv("JWT_EXPIRATION_HOURS", "24"))
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "apk_version_control"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		JWTSecret:          getEnv("JWT_SECRET", "change-this-secret-in-production"),
		JWTExpirationHours: jwtExp,

		AWSRegion:          getEnv("AWS_REGION", "us-east-1"),
		AWSAccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		S3Bucket:           getEnv("S3_BUCKET", "apk-version-control"),

		StorageType: getEnv("STORAGE_TYPE", "local"),
		UploadDir:   getEnv("UPLOAD_DIR", "/app/uploads"),
		AppURL:      getEnv("APP_URL", ""),

		ServerPort: getEnv("SERVER_PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
