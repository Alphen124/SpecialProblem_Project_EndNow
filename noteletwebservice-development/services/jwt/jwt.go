package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// ตัวแปร secret key สำหรับ JWT (ควรเก็บใน environment variable ในการใช้งานจริง)
	AccessTokenSecret  = []byte("your-access-token-secret-key-change-this-in-production")
	RefreshTokenSecret = []byte("your-refresh-token-secret-key-change-this-in-production")

	// กำหนดอายุของ token
	AccessTokenExpiry  = time.Hour * 24     // 24 ชั่วโมง
	RefreshTokenExpiry = time.Hour * 24 * 7 // 7 วัน
)

// Claims โครงสร้างสำหรับ JWT claims
type Claims struct {
	UserId int    `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// GenerateAccessToken สร้าง access token
func GenerateAccessToken(userId int, email string) (string, error) {
	claims := Claims{
		UserId: userId,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(AccessTokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(AccessTokenSecret)
}

// GenerateRefreshToken สร้าง refresh token
func GenerateRefreshToken(userId int, email string) (string, error) {
	claims := Claims{
		UserId: userId,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(RefreshTokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(RefreshTokenSecret)
}

// ValidateAccessToken ตรวจสอบ access token
func ValidateAccessToken(tokenString string) (*Claims, error) {
	return validateToken(tokenString, AccessTokenSecret)
}

// ValidateRefreshToken ตรวจสอบ refresh token
func ValidateRefreshToken(tokenString string) (*Claims, error) {
	return validateToken(tokenString, RefreshTokenSecret)
}

// validateToken ฟังก์ชันช่วยในการ validate token
func validateToken(tokenString string, secret []byte) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// ตรวจสอบว่าใช้ signing method ที่ถูกต้อง
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return secret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// GenerateTokenPair สร้าง access token และ refresh token พร้อมกัน
func GenerateTokenPair(userId int, email string) (accessToken, refreshToken string, err error) {
	accessToken, err = GenerateAccessToken(userId, email)
	if err != nil {
		return "", "", err
	}

	refreshToken, err = GenerateRefreshToken(userId, email)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}
