package routers

import (
	"net/http"

	"noteletwebservice-development/controllers"
	"noteletwebservice-development/middlewares"
)

// SetupRoutes กำหนด routes สำหรับ API
func SetupRoutes(authController *controllers.AuthController, oauthController *controllers.OAuthController, deviceController *controllers.DeviceController) *http.ServeMux {
	mux := http.NewServeMux()

	// Public routes (ไม่ต้องการ authentication)
	mux.HandleFunc("/api/auth/register", authController.Register)
	mux.HandleFunc("/api/auth/login", authController.Login)
	mux.HandleFunc("/api/auth/refresh", authController.RefreshToken)

	// OAuth routes
	mux.HandleFunc("/api/auth/google", oauthController.GoogleLogin)
	mux.HandleFunc("/api/auth/google/callback", oauthController.GoogleCallback)

	// Public device routes (can browse without login)
	mux.HandleFunc("/api/devices/browse", deviceController.GetAllDevices)

	// Protected routes (ต้องการ authentication)
	// Profile
	protectedMux := http.NewServeMux()
	protectedMux.HandleFunc("/api/auth/profile", authController.GetProfile)

	mux.Handle("/api/auth/profile",
		middlewares.CORSMiddleware(
			middlewares.AuthMiddleware(
				middlewares.KMITLEmailMiddleware(protectedMux),
			),
		),
	)

	// Device management routes (protected)
	deviceMux := http.NewServeMux()
	deviceMux.HandleFunc("/api/devices", deviceController.CreateDevice)
	deviceMux.HandleFunc("/api/devices/my", deviceController.GetMyDevices)
	deviceMux.HandleFunc("/api/devices/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			deviceController.GetDevice(w, r)
		} else if r.Method == http.MethodDelete {
			deviceController.DeleteDevice(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.Handle("/api/devices", middlewares.CORSMiddleware(middlewares.AuthMiddleware(deviceMux)))
	mux.Handle("/api/devices/my", middlewares.CORSMiddleware(middlewares.AuthMiddleware(deviceMux)))
	mux.Handle("/api/devices/", middlewares.CORSMiddleware(middlewares.AuthMiddleware(deviceMux)))

	// Health check endpoint
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","message":"NoteLet Web Service is running"}`))
	})

	return mux
}

// ApplyCORS wrapper สำหรับใช้ CORS middleware กับ mux ทั้งหมด
func ApplyCORS(mux *http.ServeMux) http.Handler {
	return middlewares.CORSMiddleware(mux)
}
