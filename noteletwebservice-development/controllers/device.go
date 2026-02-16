package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"noteletwebservice-development/middlewares"
	"noteletwebservice-development/types/requests"
)

// DeviceController handles device-related HTTP requests
type DeviceController struct {
	DB *sql.DB
}

// NewDeviceController creates a new device controller
func NewDeviceController(db *sql.DB) *DeviceController {
	return &DeviceController{DB: db}
}

// CreateDevice handles POST /api/devices - Create a new device
func (dc *DeviceController) CreateDevice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed", "")
		return
	}

	// Get user ID from context (set by auth middleware)
	userCtx, ok := r.Context().Value(middlewares.UserContextKey).(middlewares.UserContext)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized", "")
		return
	}
	userID := userCtx.UserId

	var req requests.CreateDeviceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", err.Error())
		return
	}

	// Validate required fields
	if req.Name == "" || req.Type == "" || req.Price <= 0 {
		respondWithError(w, http.StatusBadRequest, "Name, type, and price are required", "")
		return
	}

	// Get DeviceTypeNo based on type name
	var deviceTypeNo int
	err := dc.DB.QueryRow(
		"SELECT DeviceTypeNo FROM DeviceType WHERE DeviceTypeName = $1",
		req.Type,
	).Scan(&deviceTypeNo)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid device type", err.Error())
		return
	}

	// Insert device
	var deviceNo int
	query := `
		INSERT INTO Device (DeviceName, Description, RentPrice, DeviceTypeNo, UserId, Status, ImageUrl)
		VALUES ($1, $2, $3, $4, $5, 'available', $6)
		RETURNING DeviceNo
	`
	err = dc.DB.QueryRow(
		query,
		req.Name,
		req.Description,
		req.Price,
		deviceTypeNo,
		userID,
		req.ImageUrl,
	).Scan(&deviceNo)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create device", err.Error())
		return
	}

	respondWithSuccess(w, http.StatusCreated, "Device created successfully", map[string]interface{}{
		"deviceNo": deviceNo,
	})
}

// GetMyDevices handles GET /api/devices/my - Get all devices owned by the current user
func (dc *DeviceController) GetMyDevices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed", "")
		return
	}

	// Get user ID from context
	userCtx, ok := r.Context().Value(middlewares.UserContextKey).(middlewares.UserContext)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized", "")
		return
	}
	userID := userCtx.UserId

	query := `
		SELECT 
			d.DeviceNo, d.DeviceName, d.Description, d.RentPrice, 
			dt.DeviceTypeName, d.Rating, d.Status, d.ImageUrl, d.CreatedAt
		FROM Device d
		LEFT JOIN DeviceType dt ON d.DeviceTypeNo = dt.DeviceTypeNo
		WHERE d.UserId = $1
		ORDER BY d.CreatedAt DESC
	`

	rows, err := dc.DB.Query(query, userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch devices", err.Error())
		return
	}
	defer rows.Close()

	var devices []map[string]interface{}
	for rows.Next() {
		var deviceNo int
		var deviceName, description, status, imageUrl string
		var rentPrice, rating float64
		var deviceType sql.NullString
		var createdAt sql.NullTime

		err := rows.Scan(
			&deviceNo, &deviceName, &description, &rentPrice,
			&deviceType, &rating, &status, &imageUrl, &createdAt,
		)
		if err != nil {
			continue
		}

		device := map[string]interface{}{
			"deviceNo":    deviceNo,
			"name":        deviceName,
			"description": description,
			"price":       rentPrice,
			"rating":      rating,
			"status":      status,
			"imageUrl":    imageUrl,
		}

		if deviceType.Valid {
			device["type"] = deviceType.String
		}
		if createdAt.Valid {
			device["createdAt"] = createdAt.Time
		}

		devices = append(devices, device)
	}

	if devices == nil {
		devices = []map[string]interface{}{}
	}

	respondWithSuccess(w, http.StatusOK, "Devices retrieved successfully", map[string]interface{}{
		"data": devices,
	})
}

// GetAllDevices handles GET /api/devices - Get all available devices (for browsing)
func (dc *DeviceController) GetAllDevices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed", "")
		return
	}

	// Get query parameters for filtering
	deviceType := r.URL.Query().Get("type")
	status := r.URL.Query().Get("status")

	query := `
		SELECT 
			d.DeviceNo, d.DeviceName, d.Description, d.RentPrice, 
			dt.DeviceTypeName, d.Rating, d.Status, d.ImageUrl, d.CreatedAt,
			au.Email as OwnerEmail
		FROM Device d
		LEFT JOIN DeviceType dt ON d.DeviceTypeNo = dt.DeviceTypeNo
		LEFT JOIN AppUser au ON d.UserId = au.UserId
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	if deviceType != "" && deviceType != "all" {
		query += " AND dt.DeviceTypeName = $" + strconv.Itoa(argCount)
		args = append(args, deviceType)
		argCount++
	}

	if status != "" {
		query += " AND d.Status = $" + strconv.Itoa(argCount)
		args = append(args, status)
		argCount++
	} else {
		// Default to showing only available devices
		query += " AND d.Status = 'available'"
	}

	query += " ORDER BY d.CreatedAt DESC"

	rows, err := dc.DB.Query(query, args...)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch devices", err.Error())
		return
	}
	defer rows.Close()

	var devices []map[string]interface{}
	for rows.Next() {
		var deviceNo int
		var deviceName, description, status, imageUrl, ownerEmail string
		var rentPrice, rating float64
		var deviceType sql.NullString
		var createdAt sql.NullTime

		err := rows.Scan(
			&deviceNo, &deviceName, &description, &rentPrice,
			&deviceType, &rating, &status, &imageUrl, &createdAt, &ownerEmail,
		)
		if err != nil {
			continue
		}

		device := map[string]interface{}{
			"deviceNo":    deviceNo,
			"name":        deviceName,
			"description": description,
			"price":       rentPrice,
			"rating":      rating,
			"status":      status,
			"imageUrl":    imageUrl,
			"ownerEmail":  ownerEmail,
		}

		if deviceType.Valid {
			device["type"] = deviceType.String
		}
		if createdAt.Valid {
			device["createdAt"] = createdAt.Time
		}

		devices = append(devices, device)
	}

	if devices == nil {
		devices = []map[string]interface{}{}
	}

	respondWithSuccess(w, http.StatusOK, "Devices retrieved successfully", map[string]interface{}{
		"data": devices,
	})
}

// GetDevice handles GET /api/devices/{id} - Get a specific device by ID
func (dc *DeviceController) GetDevice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed", "")
		return
	}

	// Extract device ID from URL path
	pathParts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/devices/"), "/")
	if len(pathParts) == 0 || pathParts[0] == "" {
		respondWithError(w, http.StatusBadRequest, "Device ID is required", "")
		return
	}

	deviceID, err := strconv.Atoi(pathParts[0])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid device ID", err.Error())
		return
	}

	query := `
		SELECT 
			d.DeviceNo, d.DeviceName, d.Description, d.RentPrice, 
			dt.DeviceTypeName, d.Rating, d.Status, d.ImageUrl, d.CreatedAt,
			au.Email as OwnerEmail
		FROM Device d
		LEFT JOIN DeviceType dt ON d.DeviceTypeNo = dt.DeviceTypeNo
		LEFT JOIN AppUser au ON d.UserId = au.UserId
		WHERE d.DeviceNo = $1
	`

	var deviceNo int
	var deviceName, description, status, imageUrl, ownerEmail string
	var rentPrice, rating float64
	var deviceType sql.NullString
	var createdAt sql.NullTime

	err = dc.DB.QueryRow(query, deviceID).Scan(
		&deviceNo, &deviceName, &description, &rentPrice,
		&deviceType, &rating, &status, &imageUrl, &createdAt, &ownerEmail,
	)

	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusNotFound, "Device not found", "")
		return
	} else if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch device", err.Error())
		return
	}

	device := map[string]interface{}{
		"deviceNo":    deviceNo,
		"name":        deviceName,
		"description": description,
		"price":       rentPrice,
		"rating":      rating,
		"status":      status,
		"imageUrl":    imageUrl,
		"ownerEmail":  ownerEmail,
	}

	if deviceType.Valid {
		device["type"] = deviceType.String
	}
	if createdAt.Valid {
		device["createdAt"] = createdAt.Time
	}

	respondWithSuccess(w, http.StatusOK, "Device retrieved successfully", device)
}

// DeleteDevice handles DELETE /api/devices/{id} - Delete a device
func (dc *DeviceController) DeleteDevice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		respondWithError(w, http.StatusMethodNotAllowed, "Method not allowed", "")
		return
	}

	// Get user ID from context
	userCtx, ok := r.Context().Value(middlewares.UserContextKey).(middlewares.UserContext)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized", "")
		return
	}
	userID := userCtx.UserId

	// Extract device ID from URL path
	pathParts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/devices/"), "/")
	if len(pathParts) == 0 || pathParts[0] == "" {
		respondWithError(w, http.StatusBadRequest, "Device ID is required", "")
		return
	}

	deviceID, err := strconv.Atoi(pathParts[0])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid device ID", err.Error())
		return
	}

	// Delete only if the device belongs to the user
	result, err := dc.DB.Exec(
		"DELETE FROM Device WHERE DeviceNo = $1 AND UserId = $2",
		deviceID, userID,
	)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to delete device", err.Error())
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		respondWithError(w, http.StatusNotFound, "Device not found or unauthorized", "")
		return
	}

	respondWithSuccess(w, http.StatusOK, "Device deleted successfully", nil)
}
