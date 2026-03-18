module noteletwebservice-development

go 1.24.0

toolchain go1.24.11

require (
	github.com/golang-jwt/jwt/v5 v5.3.0
	github.com/gorilla/websocket v1.5.3
	github.com/joho/godotenv v1.5.1
	github.com/lib/pq v1.10.9
	golang.org/x/crypto v0.47.0
	golang.org/x/oauth2 v0.34.0
)

require cloud.google.com/go/compute/metadata v0.3.0 // indirect
