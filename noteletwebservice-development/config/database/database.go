package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"sync"

	_ "github.com/lib/pq"
)

var (
	dbInstance *sql.DB
	dbOnce     sync.Once
)

func getEnvOrDefault(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

// ConnectNoteletDB เชื่อมต่อฐานข้อมูล NoteLet (PostgreSQL singleton)
func ConnectNoteletDB() *sql.DB {
	dbOnce.Do(func() {
		host := getEnvOrDefault("DB_HOST", "localhost")
		port := getEnvOrDefault("DB_PORT", "5432")
		user := getEnvOrDefault("DB_USER", "alphen")
		password := os.Getenv("DB_PASSWORD")
		if password == "" {
			log.Fatal("DB_PASSWORD environment variable is required")
		}
		dbname := getEnvOrDefault("DB_NAME", "notelet")

		psqlInfo := fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable client_encoding=UTF8",
			host, port, user, password, dbname,
		)

		var err error
		dbInstance, err = sql.Open("postgres", psqlInfo)
		if err != nil {
			panic(fmt.Sprintf("Error opening database connection: %v", err))
		}

		if err = dbInstance.Ping(); err != nil {
			panic(fmt.Sprintf("Error pinging database: %v", err))
		}
	})

	return dbInstance
}

// GetNoteletDB ใช้สำหรับดึง instance ของ database
func GetNoteletDB() *sql.DB {
	if dbInstance == nil {
		panic("Database connection is not initialized - this should not happen")
	}
	return dbInstance
}
