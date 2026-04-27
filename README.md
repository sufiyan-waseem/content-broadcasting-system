# 📡 Content Broadcasting System API

A robust backend system that allows teachers to upload subject-based content, principals to review and approve it, and students to access live broadcasts via a public API.

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Sequelize |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| File Upload | Multer |
| Security | Helmet, CORS, Express Rate Limit |
| Logging | Morgan |

## 📁 Project Structure

```
src/
├── config/          → Database connection
├── controllers/     → Request handlers (auth, content, approval, broadcast)
├── middlewares/     → JWT auth, RBAC, file upload, error handling
├── models/          → Sequelize models (User, Content, ContentSlot, ContentSchedule)
├── routes/          → Express routers
├── services/        → Core business logic (scheduling engine)
└── utils/           → Helpers (JWT, response builders)

server.js            → Entry point
architecture-notes.txt → System design decisions
uploads/             → Local file storage
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js >= 16
- PostgreSQL >= 13

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd content-broadcasting-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and update the following:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=content_broadcasting
DB_USER=postgres
DB_PASSWORD=<your_postgres_password>
JWT_SECRET=<a_long_random_secret_string>
```

### 3. Create the Database

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE content_broadcasting;"
```

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server auto-syncs database tables on startup (no manual migrations needed).

### 5. Verify

```
GET http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Content Broadcasting System API is running."
}
```

---

## 🔑 API Reference

### Authentication

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Any | Register a new user |
| POST | `/api/auth/login` | Any | Login and get JWT token |
| GET | `/api/auth/me` | Any (auth) | Get current user profile |

**Register Body:**
```json
{
  "name": "John Doe",
  "email": "john@school.com",
  "password": "secret123",
  "role": "teacher"
}
```

**Login Body:**
```json
{
  "email": "john@school.com",
  "password": "secret123"
}
```

---

### Content (Teacher)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/content/upload` | Teacher | Upload content (multipart/form-data) |
| GET | `/api/content/my` | Teacher | View own uploaded content |

**Upload fields (form-data):**
- `file` (required) – JPG, PNG, or GIF, max 10MB
- `title` (required) – Content title
- `subject` (required) – e.g., maths, science
- `description` (optional) – Short description
- `start_time` (optional) – ISO 8601 datetime
- `end_time` (optional) – ISO 8601 datetime
- `rotation_duration` (optional) – Minutes per slot (default: 5)

---

### Approval (Principal)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/content/pending` | Principal | View pending content |
| GET | `/api/content/all` | Principal | View all content (filter: status, subject, teacher_id) |
| PATCH | `/api/approval/:id/approve` | Principal | Approve content |
| PATCH | `/api/approval/:id/reject` | Principal | Reject content with reason |

**Reject Body:**
```json
{
  "rejection_reason": "Image quality is too low."
}
```

---

### Public Broadcasting (Students – No Auth Required)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/content/live/:teacherId` | Current active content for a teacher |
| GET | `/content/live/:teacherId?subject=maths` | Filter by subject |
| GET | `/content/live/:teacherId/all` | All live content for a teacher |
| GET | `/content/live/subjects` | All subjects with live content |

**Example Response – Active Content:**
```json
{
  "success": true,
  "message": "Live content fetched.",
  "data": {
    "teacher": { "id": "uuid", "name": "Mr. Sharma" },
    "content": {
      "id": "uuid",
      "title": "Chapter 5 Notes",
      "subject": "maths",
      "file_url": "/uploads/abc123.png",
      "rotation_duration": 5,
      "start_time": "2026-04-26T08:00:00.000Z",
      "end_time": "2026-04-26T18:00:00.000Z"
    }
  }
}
```

**No Content Response:**
```json
{
  "success": true,
  "message": "No content available.",
  "data": { "teacher": {...}, "content": null }
}
```

---

## 🔄 Scheduling Logic

The system uses a **stateless, deterministic modulo-based rotation**:

```
totalCycle = SUM of all content durations (minutes)
position   = floor(Date.now() / 60000) % totalCycle
```

Content items are sorted by `rotation_order` and the active item is found by walking through the list until the position falls within an item's time slice. **No cron jobs or DB writes needed.**

---

## ⚡ Edge Cases Handled

| Case | Behavior |
|---|---|
| No approved content | `"No content available"` response |
| Approved but outside time window | `"No content available"` response |
| No start_time or end_time set | Content is NOT active |
| Invalid/unknown subject | Empty response (not an error) |
| Teacher not found | 404 response |
| Wrong file type | 400 with clear error message |
| File too large (>10MB) | 400 with size limit info |
| Missing rejection reason | 400 (mandatory field) |

---

## 🔒 Security

- JWT-based authentication on all private routes
- Role-based access control (RBAC) with strict role separation
- bcrypt password hashing (salt rounds: 12)
- File type validation (MIME + extension)
- Rate limiting on public API (100 requests/15min)
- Helmet.js security headers
- No sensitive data exposed in responses

---

## 📌 Assumptions

1. A content item cannot be re-approved after rejection — teacher must upload again.
2. Content without `start_time`/`end_time` is treated as inactive (per spec).
3. Subject names are normalized to lowercase for consistent matching.
4. The rotation cycle runs continuously from UNIX epoch, ensuring consistent behavior across server restarts.
5. Local file storage is used (S3 extension is noted in architecture-notes.txt).

---

## 📬 API Documentation

> Postman collection is included in the repository as `postman_collection.json`.

---

## 🎥 Demo Video

> Available in the submission form.

---

## 🚀 Deployment

> The API is ready to be deployed.

---

*Built for the Backend Developer Internship Technical Assignment – April 2026*



<!-- curl.exe -X PATCH http://localhost:3000/api/approval/695d4501-16e6-42f6-b89f-4a9931ca435d/approve -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE0MTEwODA1LTNlOGMtNGIwMS04NGQwLTAzMGQ1NmUxYzcxYSIsImVtYWlsIjoicHJpbmNpcGFsMUB0ZXN0MS5jb20iLCJyb2xlIjoicHJpbmNpcGFsIiwiaWF0IjoxNzc3MjczMjIzLCJleHAiOjE3Nzc4NzgwMjN9.N-0dFWr3eUElL6lClkWlOYAHkvKa8n9QEBsrUnryWLw" -H "Content-Type: application/json" -->
