package controllers

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"net/http"
	"strings"

	"noteletwebservice-development/models"
	"noteletwebservice-development/services/jwt"
	"noteletwebservice-development/services/oauth"
	"noteletwebservice-development/types/responses"
	"noteletwebservice-development/utils"
)

type OAuthController struct {
	DB *sql.DB
}

// NewOAuthController สร้าง instance ของ OAuthController
func NewOAuthController(db *sql.DB) *OAuthController {
	return &OAuthController{DB: db}
}

// GoogleLogin เริ่มต้น Google OAuth flow
func (oc *OAuthController) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	// สร้าง state token เพื่อป้องกัน CSRF
	state := generateStateToken()

	// เก็บ state ใน session/cookie (ในตัวอย่างนี้ใช้ cookie)
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		MaxAge:   300, // 5 minutes
		HttpOnly: true,
		Secure:   false, // ควรเป็น true ใน production (HTTPS)
		SameSite: http.SameSiteLaxMode,
	})

	// สร้าง authorization URL
	authURL := oauth.GetAuthURL(state)

	// Redirect ไปยัง Google OAuth
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// GoogleCallback รับ callback จาก Google OAuth
func (oc *OAuthController) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	// ตรวจสอบ state token
	stateCookie, err := r.Cookie("oauth_state")
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "State cookie not found", "")
		return
	}

	stateQuery := r.URL.Query().Get("state")
	if stateQuery != stateCookie.Value {
		respondWithError(w, http.StatusBadRequest, "Invalid state token", "")
		return
	}

	// ลบ state cookie
	http.SetCookie(w, &http.Cookie{
		Name:   "oauth_state",
		Value:  "",
		MaxAge: -1,
	})

	// ตรวจสอบ error จาก Google
	if errorMsg := r.URL.Query().Get("error"); errorMsg != "" {
		respondWithError(w, http.StatusBadRequest, "OAuth error: "+errorMsg, "")
		return
	}

	// ดึง authorization code
	code := r.URL.Query().Get("code")
	if code == "" {
		respondWithError(w, http.StatusBadRequest, "Authorization code not found", "")
		return
	}

	// แลกเปลี่ยน code เป็น token
	token, err := oauth.ExchangeCodeForToken(code)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to exchange token", err.Error())
		return
	}

	// ดึงข้อมูลผู้ใช้จาก Google
	googleUser, err := oauth.GetGoogleUserInfo(token.AccessToken)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to get user info", err.Error())
		return
	}

	// ตรวจสอบว่าเป็นอีเมล @kmitl.ac.th
	if !utils.IsKMITLEmail(googleUser.Email) {
		respondWithError(w, http.StatusForbidden, "Only @kmitl.ac.th email addresses are allowed", "")
		return
	}

	// ตรวจสอบว่า email ได้รับการยืนยันหรือไม่
	if !googleUser.VerifiedEmail {
		respondWithError(w, http.StatusBadRequest, "Email not verified", "")
		return
	}

	// ตรวจสอบว่ามี user อยู่ในระบบแล้วหรือไม่
	var user models.AppUser
	err = oc.DB.QueryRow(`
		SELECT userid, email, isactive, createdat
		FROM appuser
		WHERE email = $1
	`, strings.ToLower(googleUser.Email)).Scan(
		&user.UserId, &user.Email,
		&user.IsActive, &user.CreatedAt,
	)

	if err == sql.ErrNoRows {
		// ไม่มี user ในระบบ -> สร้างบัญชีใหม่อัตโนมัติ
		user, err = oc.createUserFromGoogle(googleUser)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "Failed to create user account", err.Error())
			return
		}
	} else if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error", err.Error())
		return
	}

	// ตรวจสอบว่า account active หรือไม่
	if !user.IsActive {
		respondWithError(w, http.StatusForbidden, "Account is inactive", "")
		return
	}

	// ดึงข้อมูลทั้ง Owner และ Renter
	var ownerNo, renterNo sql.NullInt64
	var fname, lname, tel string
	var ownerRating, renterRating sql.NullInt64

	// ดึงข้อมูล Owner
	oc.DB.QueryRow(`
		SELECT ownerno, fname, lname, tel, rating FROM owner WHERE userid = $1
	`, user.UserId).Scan(&ownerNo, &fname, &lname, &tel, &ownerRating)

	// ดึงข้อมูล Renter
	oc.DB.QueryRow(`
		SELECT renterno, rating FROM renter WHERE userid = $1
	`, user.UserId).Scan(&renterNo, &renterRating)

	// สร้าง JWT tokens (ไม่ต้องส่ง role)
	accessToken, refreshToken, err := jwt.GenerateTokenPair(user.UserId, user.Email, false)
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
	respondWithSuccess(w, http.StatusOK, "Login successful via Google OAuth", responses.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         responseData,
	})
}

// createUserFromGoogle สร้างบัญชีผู้ใช้ใหม่จากข้อมูล Google
func (oc *OAuthController) createUserFromGoogle(googleUser *oauth.GoogleUserInfo) (models.AppUser, error) {
	tx, err := oc.DB.Begin()
	if err != nil {
		return models.AppUser{}, err
	}
	defer tx.Rollback()

	// สร้าง user ใน AppUser table (ไม่มี password เพราะใช้ OAuth, ไม่มี role)
	var userId int
	err = tx.QueryRow(`
		INSERT INTO appuser (email, passwordhash, isactive, createdat)
		VALUES ($1, NULL, $2, NOW())
		RETURNING userid
	`, strings.ToLower(googleUser.Email), true).Scan(&userId)

	if err != nil {
		return models.AppUser{}, err
	}

	// แยกชื่อจาก Google (GivenName = ชื่อต้น, FamilyName = นามสกุล)
	fname := googleUser.GivenName
	lname := googleUser.FamilyName
	if fname == "" {
		fname = googleUser.Name
	}

	// สร้างทั้ง Owner และ Renter พร้อมกัน
	// สร้าง Owner
	var nextOwnerNo int
	err = tx.QueryRow(`SELECT COALESCE(MAX(ownerno), 0) + 1 FROM owner`).Scan(&nextOwnerNo)
	if err != nil {
		return models.AppUser{}, err
	}

	_, err = tx.Exec(`
		INSERT INTO owner (ownerno, name, fname, lname, tel, rating, userid)
		VALUES ($1, $2, $3, $4, '', 0, $5)
	`, nextOwnerNo, googleUser.Name, fname, lname, userId)

	if err != nil {
		return models.AppUser{}, err
	}

	// สร้าง Renter
	var nextRenterNo int
	err = tx.QueryRow(`SELECT COALESCE(MAX(renterno), 0) + 1 FROM renter`).Scan(&nextRenterNo)
	if err != nil {
		return models.AppUser{}, err
	}

	_, err = tx.Exec(`
		INSERT INTO renter (renterno, name, fname, lname, tel, rating, userid)
		VALUES ($1, $2, $3, $4, '', 0, $5)
	`, nextRenterNo, googleUser.Name, fname, lname, userId)

	if err != nil {
		return models.AppUser{}, err
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return models.AppUser{}, err
	}

	// Return user object
	return models.AppUser{
		UserId:   userId,
		Email:    googleUser.Email,
		IsActive: true,
	}, nil
}

// generateStateToken สร้าง random state token
func generateStateToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
