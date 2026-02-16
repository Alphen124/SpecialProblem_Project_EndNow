package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	database "noteletwebservice-development/config/database"
	"noteletwebservice-development/controllers"
	"noteletwebservice-development/routers"
	"noteletwebservice-development/services/oauth"
)

func main() {
	// เชื่อมต่อฐานข้อมูล
	db := database.ConnectNoteletDB()
	defer db.Close()

	fmt.Println("Successfully connected to database!")

	// ตั้งค่า Google OAuth
	// ในการใช้งานจริง ควรเก็บค่าเหล่านี้ใน environment variables
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")

	if clientID == "" {
		clientID = "your-google-client-id.apps.googleusercontent.com"
	}
	if clientSecret == "" {
		clientSecret = "your-google-client-secret"
	}
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/api/auth/google/callback"
	}

	oauth.InitGoogleOAuth(clientID, clientSecret, redirectURL)
	fmt.Println("✓ Google OAuth initialized")

	// สร้าง controllers
	authController := controllers.NewAuthController(db)
	oauthController := controllers.NewOAuthController(db)
	deviceController := controllers.NewDeviceController(db)

	// Create a new router
	mux := http.NewServeMux()

	// Setup API routes first
	apiMux := routers.SetupRoutes(authController, oauthController, deviceController)

	// Mount API routes
	mux.Handle("/api/", apiMux)

	// Serve static files from frontend (this catches everything else)
	fs := http.FileServer(http.Dir("../Notelet-Frontend/public"))
	mux.Handle("/", fs)

	// Apply CORS middleware
	handler := routers.ApplyCORS(mux)

	// กำหนด port
	port := ":8080"

	// Start server
	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
