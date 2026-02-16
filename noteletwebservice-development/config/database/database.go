package database

import (
	"database/sql"
	"fmt"
	"sync"

	_ "github.com/lib/pq"
)

var (
	dbInstance *sql.DB
	dbOnce     sync.Once
)

// ConnectNoteletDB เชื่อมต่อฐานข้อมูล NoteLet (PostgreSQL singleton)
func ConnectNoteletDB() *sql.DB {
	dbOnce.Do(func() {
		host := "localhost"
		port := 5432
		user := "alphen"
		password := "goldfutionz.124"
		dbname := "notelet"

		psqlInfo := fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable client_encoding=UTF8",
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
