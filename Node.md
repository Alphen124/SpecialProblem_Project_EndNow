โปรเจคแบ่งเป็น 3 ส่วนหลัก:

1. Frontend — Notelet-Frontend_v1
หมวด	เทคโนโลยี
Language	TypeScript, Vanilla JS
Runtime	Node.js
Web Server / Proxy	Express.js v4
Proxy Middleware	http-proxy-middleware
UI	Vanilla HTML + CSS (Multi-page app, ไม่มี React/Vue)
Testing	Jest + ts-jest + supertest
Build Tool	TypeScript Compiler (tsc)
Type Definitions	@types/express, @types/node, @types/jest\
//------------------------------------------------------------
2. Backend — noteletwebservice-development
หมวด	เทคโนโลยี
Language	Go 1.24
HTTP Framework	Standard library net/http (ไม่ใช้ Gin/Echo/Fiber)
WebSocket (Chat)	gorilla/websocket v1.5
Authentication	golang-jwt/jwt v5 (JWT)
Social Login	golang.org/x/oauth2 + Google OAuth2
Password Hashing	golang.org/x/crypto (bcrypt)
Database Driver	lib/pq (PostgreSQL driver)
Env Config	joho/godotenv
File Upload	Custom upload controller
Email	Custom email utility
//------------------------------------------------------------
3. Database & Infrastructure
หมวด	เทคโนโลยี
Database	PostgreSQL 16
DB Admin UI	pgAdmin 4
Container	Docker + Docker Compose
Migrations	SQL files (9 migration files)
Architecture Overview
Multi-page app — แต่ละ feature มี HTML ไฟล์แยก (auth, devices, chat, management)
WebSocket — ใช้สำหรับ real-time chat
JWT + Google OAuth — ระบบ login สองแบบ
CORS Middleware — custom implementation ใน Go