package controllers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"noteletwebservice-development/middlewares"
	"noteletwebservice-development/models"
	"noteletwebservice-development/services/jwt"
	"noteletwebservice-development/types/requests"
	"noteletwebservice-development/types/responses"
	"noteletwebservice-development/utils"
)

type AuthController struct {
	DB *sql.DB
}

// NewAuthController สร้าง instance ของ AuthController
func NewAuthController(db *sql.DB) *AuthController {
	return &AuthController{DB: db}
}

// Register สำหรับลงทะเบียนผู้ใช้ใหม่
func (ac *AuthController) Register(w http.ResponseWriter, r *http.Request) {
	var req requests.RegisterRequest

	// Decode JSON request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", err.Error())
		return
	}

	// Debugging log to inspect the received payload
	log.Printf("Received registration request: %+v", req)
	log.Printf("FName: '%s', LName: '%s', Tel: '%s'", req.FName, req.LName, req.Tel)

	// Validate required fields
	if req.FName == "" || req.LName == "" || req.Tel == "" {
		respondWithError(w, http.StatusBadRequest, "All fields are required", "")
		return
	}

	// ตรวจสอบว่าเป็นอีเมล @kmitl.ac.th หรือไม่
	if !utils.IsKMITLEmail(req.Email) {
		respondWithError(w, http.StatusBadRequest, "Only @kmitl.ac.th email addresses are allowed", "")
		return
	}

	// ตรวจสอบว่าอีเมลมีอยู่ในระบบแล้วหรือไม่
	var existingUserId int
	err := ac.DB.QueryRow("SELECT userid FROM appuser WHERE email = $1", strings.ToLower(req.Email)).Scan(&existingUserId)
	if err != sql.ErrNoRows {
		respondWithError(w, http.StatusConflict, "Email already registered", "")
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to process password", err.Error())
		return
	}

	// เริ่ม transaction
	tx, err := ac.DB.Begin()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error", err.Error())
		return
	}
	defer tx.Rollback()

	// สร้างผู้ใช้ใน AppUser table (ไม่มี role แล้ว)
	var userId int
	err = tx.QueryRow(`
		INSERT INTO appuser (email, passwordhash, isactive, createdat)
		VALUES ($1, $2, $3, NOW())
		RETURNING userid
	`, strings.ToLower(req.Email), hashedPassword, true).Scan(&userId)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create user", err.Error())
		return
	}

	// สร้างทั้ง Owner และ Renter พร้อมกัน
	// สร้าง Owner
	var nextOwnerNo int
	err = tx.QueryRow(`SELECT COALESCE(MAX(ownerno), 0) + 1 FROM owner`).Scan(&nextOwnerNo)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate owner number", err.Error())
		return
	}

	_, err = tx.Exec(`
		INSERT INTO owner (ownerno, name, fname, lname, tel, rating, userid)
		VALUES ($1, $2, $3, $4, $5, 0, $6)
	`, nextOwnerNo, req.FName+" "+req.LName, req.FName, req.LName, req.Tel, userId)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create owner profile", err.Error())
		return
	}
	log.Printf("Created Owner: OwnerNo=%d, Name='%s', FName='%s', LName='%s', Tel='%s', UserId=%d",
		nextOwnerNo, req.FName+" "+req.LName, req.FName, req.LName, req.Tel, userId)

	// สร้าง Renter
	var nextRenterNo int
	err = tx.QueryRow(`SELECT COALESCE(MAX(renterno), 0) + 1 FROM renter`).Scan(&nextRenterNo)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate renter number", err.Error())
		return
	}

	_, err = tx.Exec(`
		INSERT INTO renter (renterno, name, fname, lname, tel, rating, userid)
		VALUES ($1, $2, $3, $4, $5, 0, $6)
	`, nextRenterNo, req.FName+" "+req.LName, req.FName, req.LName, req.Tel, userId)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create renter profile", err.Error())
		return
	}
	log.Printf("Created Renter: RenterNo=%d, Name='%s', FName='%s', LName='%s', Tel='%s', UserId=%d",
		nextRenterNo, req.FName+" "+req.LName, req.FName, req.LName, req.Tel, userId)

	// Commit transaction
	if err = tx.Commit(); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to complete registration", err.Error())
		return
	}

	// สร้าง JWT tokens (ไม่ต้องส่ง role)
	accessToken, refreshToken, err := jwt.GenerateTokenPair(userId, req.Email)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate tokens", err.Error())
		return
	}

	// ส่ง response
	respondWithSuccess(w, http.StatusCreated, "Registration successful", responses.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: responses.UserResponse{
			UserId:   userId,
			Email:    req.Email,
			IsActive: true,
			FName:    req.FName,
			LName:    req.LName,
			Tel:      req.Tel,
		},
	})
}

// Login สำหรับเข้าสู่ระบบ
func (ac *AuthController) Login(w http.ResponseWriter, r *http.Request) {
	var req requests.LoginRequest

	// Decode JSON request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", err.Error())
		return
	}

	// ตรวจสอบว่าเป็นอีเมล @kmitl.ac.th หรือไม่
	if !utils.IsKMITLEmail(req.Email) {
		respondWithError(w, http.StatusUnauthorized, "Only @kmitl.ac.th email addresses are allowed", "")
		return
	}

	// ดึงข้อมูลผู้ใช้จากฐานข้อมูล
	var user models.AppUser
	err := ac.DB.QueryRow(`
		SELECT userid, email, passwordhash, isactive, createdat
		FROM appuser
		WHERE email = $1
	`, strings.ToLower(req.Email)).Scan(
		&user.UserId, &user.Email, &user.PasswordHash,
		&user.IsActive, &user.CreatedAt,
	)

	if err == sql.ErrNoRows {
		respondWithError(w, http.StatusUnauthorized, "Invalid email or password", "")
		return
	}

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error", err.Error())
		return
	}

	// ตรวจสอบว่า account active หรือไม่
	if !user.IsActive {
		respondWithError(w, http.StatusUnauthorized, "Account is inactive", "")
		return
	}

	// ตรวจสอบ password
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		respondWithError(w, http.StatusUnauthorized, "Invalid email or password", "")
		return
	}

	// ดึงข้อมูลทั้ง Owner และ Renter
	var ownerNo, renterNo sql.NullInt64
	var fname, lname, tel string
	var ownerRating, renterRating sql.NullInt64

	// ดึงข้อมูล Owner
	ac.DB.QueryRow(`
		SELECT ownerno, fname, lname, tel, rating FROM owner WHERE userid = $1
	`, user.UserId).Scan(&ownerNo, &fname, &lname, &tel, &ownerRating)

	// ดึงข้อมูล Renter
	ac.DB.QueryRow(`
		SELECT renterno, rating FROM renter WHERE userid = $1
	`, user.UserId).Scan(&renterNo, &renterRating)

	// สร้าง JWT tokens (ไม่ต้องส่ง role)
	accessToken, refreshToken, err := jwt.GenerateTokenPair(user.UserId, user.Email)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate tokens", err.Error())
		return
	}

	// ส่ง response พร้อมข้อมูลทั้ง Owner และ Renter
	responseData := responses.DualRoleUserResponse{
		UserId:   user.UserId,
		Email:    user.Email,
		IsActive: user.IsActive,
		FName:    fname,
		LName:    lname,
		Tel:      tel,
	}

	if ownerNo.Valid {
		responseData.OwnerNo = int(ownerNo.Int64)
		if ownerRating.Valid {
			responseData.OwnerRating = int(ownerRating.Int64)
		}
	}

	if renterNo.Valid {
		responseData.RenterNo = int(renterNo.Int64)
		if renterRating.Valid {
			responseData.RenterRating = int(renterRating.Int64)
		}
	}

	// ส่ง response
	respondWithSuccess(w, http.StatusOK, "Login successful", responses.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         responseData,
	})
}

// RefreshToken สำหรับขอ access token ใหม่
func (ac *AuthController) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req requests.RefreshTokenRequest

	// Decode JSON request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", err.Error())
		return
	}

	// Validate refresh token
	claims, err := jwt.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid or expired refresh token", err.Error())
		return
	}

	// ตรวจสอบว่าผู้ใช้ยังคง active อยู่หรือไม่
	var isActive bool
	err = ac.DB.QueryRow(`
		SELECT isactive FROM appuser WHERE userid = $1
	`, claims.UserId).Scan(&isActive)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error", err.Error())
		return
	}

	if !isActive {
		respondWithError(w, http.StatusUnauthorized, "Account is inactive", "")
		return
	}

	// สร้าง access token ใหม่ (ไม่ต้องส่ง role)
	accessToken, err := jwt.GenerateAccessToken(claims.UserId, claims.Email)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate access token", err.Error())
		return
	}

	// ส่ง response
	respondWithSuccess(w, http.StatusOK, "Token refreshed successfully", map[string]string{
		"access_token": accessToken,
	})
}

// GetProfile ดึงข้อมูลโปรไฟล์ของผู้ใช้ (ต้องใช้ร่วมกับ AuthMiddleware)
func (ac *AuthController) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Import middlewares package
	userCtx, ok := middlewares.GetUserFromContext(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User context not found", "")
		return
	}

	// ดึงข้อมูลผู้ใช้จากฐานข้อมูล
	var user models.AppUser
	err := ac.DB.QueryRow(`
		SELECT userid, email, isactive, createdat
		FROM appuser
		WHERE userid = $1
	`, userCtx.UserId).Scan(
		&user.UserId, &user.Email,
		&user.IsActive, &user.CreatedAt,
	)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error", err.Error())
		return
	}

	// ดึงข้อมูลทั้ง Owner และ Renter
	var ownerNo, renterNo sql.NullInt64
	var fname, lname, tel string
	var ownerRating, renterRating sql.NullInt64

	// ดึงข้อมูล Owner
	ac.DB.QueryRow(`
		SELECT ownerno, fname, lname, tel, rating FROM owner WHERE userid = $1
	`, user.UserId).Scan(&ownerNo, &fname, &lname, &tel, &ownerRating)

	// ดึงข้อมูล Renter
	ac.DB.QueryRow(`
		SELECT renterno, rating FROM renter WHERE userid = $1
	`, user.UserId).Scan(&renterNo, &renterRating)

	// ส่ง response พร้อมข้อมูลทั้ง Owner และ Renter
	responseData := responses.DualRoleUserResponse{
		UserId:   user.UserId,
		Email:    user.Email,
		IsActive: user.IsActive,
		FName:    fname,
		LName:    lname,
		Tel:      tel,
	}

	if ownerNo.Valid {
		responseData.OwnerNo = int(ownerNo.Int64)
		if ownerRating.Valid {
			responseData.OwnerRating = int(ownerRating.Int64)
		}
	}

	if renterNo.Valid {
		responseData.RenterNo = int(renterNo.Int64)
		if renterRating.Valid {
			responseData.RenterRating = int(renterRating.Int64)
		}
	}

	// ส่ง response
	respondWithSuccess(w, http.StatusOK, "Profile retrieved successfully", responseData)
}

// Helper functions
func respondWithError(w http.ResponseWriter, code int, message, error string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(responses.ErrorResponse{
		Success: false,
		Message: message,
		Error:   error,
	})
}

func respondWithSuccess(w http.ResponseWriter, code int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(responses.SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}
