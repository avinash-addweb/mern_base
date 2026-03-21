# API Low Level Design (Revised)

> **College Discovery & Admission Guidance Platform**

| Property | Value |
|----------|-------|
| **Version** | 2.0 — Revised |
| **Backend Stack** | Node.js / NestJS \| REST APIs |
| **Database** | PostgreSQL (Primary) \| MongoDB (Events/Logs) \| Redis (Cache) |
| **Search** | Elasticsearch |
| **Auth** | JWT Bearer Tokens \| OTP via SMS/WhatsApp/Email |
| **Base URL** | `/api/v1` |

---

## Conventions

| Convention | Meaning |
|-----------|---------|
| `:param` | URL path parameter (e.g., `:id`, `:slug`) |
| `?param` | Query string parameter |
| `[optional]` | Field/parameter is optional |
| **Auth: Yes** | Requires JWT Bearer token in `Authorization` header |
| **Auth: No** | Public endpoint |
| **201** | Successful resource creation |
| **200** | Successful retrieval/update |
| **204** | Successful delete (no body) |
| **422** | Validation error with field-level details |

### Roles (6 Admin + 2 Public)

| Role | Code | Access |
|------|------|--------|
| Public | `public` | Unauthenticated visitors |
| User | `user` | Registered/logged-in public users |
| Super Admin | `super_admin` | Full platform control |
| Admin | `admin` | Content & lead management |
| Editor | `editor` | Review, approve/reject content |
| Content Writer | `writer` | Create/edit content (cannot approve) |
| College Representative | `college_rep` | Edit assigned colleges only |
| Viewer | `viewer` | Read-only admin panel access |

> **RBAC Note:** All admin endpoints check the `role_permissions` table dynamically — not hardcoded roles. The role lists below indicate the *default* permission assignments. Super Admin can reconfigure permissions via the permission matrix API.

### Standard Response Envelopes

**Success:**
```json
{
  "success": true,
  "data": { },
  "message": "optional",
  "pagination": { "page": 1, "limit": 20, "total": 450, "totalPages": 23 }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "mobile", "message": "Invalid format" }]
  }
}
```

### Rate Limiting

| Category | Limit | Window |
|----------|-------|--------|
| OTP endpoints | 3 req | 60s |
| Lead submission | 5 req | 60s |
| Search autocomplete | 30 req | 60s |
| Public APIs | 100 req | 60s |
| Admin APIs | 200 req | 60s |
| Bulk upload | 5 req | 300s |

---

## MODULE 01 — Authentication & User Management

### 1.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/auth/register` | Register with email or mobile | No | Public |
| POST | `/auth/verify-otp` | Verify OTP for registration/login | No | Public |
| POST | `/auth/resend-otp` | Resend OTP (rate limited) | No | Public |
| POST | `/auth/login` | Login with email+password or mobile+OTP | No | Public |
| POST | `/auth/forgot-password` | Request password reset OTP/link | No | Public |
| POST | `/auth/reset-password` | Reset password with token | No | Public |
| POST | `/auth/change-password` | Change password (logged in) | Yes | User, All Admin |
| POST | `/auth/logout` | Invalidate current session | Yes | User, All Admin |
| POST | `/auth/refresh-token` | Refresh JWT access token | No | Public |
| GET | `/users/me` | Get current user profile | Yes | User, All Admin |
| PUT | `/users/me` | Update current user profile | Yes | User |
| GET | `/users/me/preferences` | Get user interest preferences | Yes | User |
| PUT | `/users/me/preferences` | Update user preferences | Yes | User |

### 1.2 Key Endpoint Details

#### `POST /api/v1/auth/register`

| Field | Detail |
|-------|--------|
| **Request Body** | `{ "fullName": "string", "mobile": "string(10-15)" OR "email": "string(email)", "password": "string(min 8)" (required if email method), "method": "email \| mobile" }` |
| **Response (201)** | `{ "success": true, "message": "OTP sent", "data": { "userId": "uuid", "otpExpiry": "ISO timestamp" } }` |
| **Errors** | 400 — Missing fields \| 409 — Already exists \| 422 — Invalid format \| 429 — Rate limited |
| **Notes** | User created in `status: 'active'` with `mobile_verified: false` / `email_verified: false`. OTP stored in Redis with 5min TTL. Fallback: SMS → WhatsApp → Email. |

#### `POST /api/v1/auth/login`

| Field | Detail |
|-------|--------|
| **Request Body** | `{ "method": "password \| otp", "email": "string" (if password), "password": "string" (if password), "mobile": "string" (if otp), "otp": "string(6)" (if otp) }` |
| **Response (200)** | `{ "success": true, "data": { "accessToken": "JWT", "refreshToken": "JWT", "user": { "id": "uuid", "fullName": "string", "email": "string", "mobile": "string", "role": "string", "permissions": ["string"], "avatarUrl": "url" } } }` |
| **Errors** | 401 — Invalid credentials \| 403 — Account locked \| 404 — Not found |
| **Notes** | Access token TTL: configurable via `system_settings` (default 30min). Refresh token TTL: configurable (default 30 days). Lock after N failures (configurable, default 5). Session stored in Redis + `user_sessions` table. |

#### `POST /api/v1/auth/change-password`

| Field | Detail |
|-------|--------|
| **Request Body** | `{ "currentPassword": "string", "newPassword": "string(min 8)" }` |
| **Response (200)** | `{ "success": true, "message": "Password updated" }` |
| **Errors** | 400 — Current password incorrect \| 422 — Weak password |

---

## MODULE 02 — Navigation & Layout

### 2.1 Public Endpoints

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/navigation/mega-menu` | Full mega menu data (lazy loaded) | No | Public |
| GET | `/navigation/footer` | Footer link groups | No | Public |
| GET | `/banners/active` | Current active announcement banner | No | Public |

#### `GET /api/v1/navigation/mega-menu`

| Field | Detail |
|-------|--------|
| **Response (200)** | `{ "streams": [{ "id": "uuid", "name": "string", "slug": "string", "icon": "url", "subStreams": [{ "id", "name", "slug" }] }], "quickLinks": { "topColleges": [{ "id", "name", "slug" }], "topCourses": [...], "topExams": [...], "popularCities": [...] } }` |
| **Notes** | Cached in Redis (`nav:mega_menu`). TTL: 30min. Invalidated on admin nav changes. |

---

## MODULE 03 — Global Search

### 3.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/search/autocomplete` | Real-time suggestions (≤300ms SLA) | No | Public |
| GET | `/search` | Full paginated search results | No | Public |
| GET | `/search/history` | User's recent search queries | Yes | User |
| DELETE | `/search/history` | Clear search history | Yes | User |
| GET | `/admin/search/analytics` | Top keywords, zero-result queries | Yes | Admin, Super Admin |

#### `GET /api/v1/search/autocomplete`

| Field | Detail |
|-------|--------|
| **Query** | `q=string(min 2)`, `limit=int(default 8, max 15)` |
| **Response (200)** | `{ "query": "engi", "results": { "streams": [{ "id", "name", "slug" }], "courses": [...], "colleges": [{ "id", "name", "slug", "city" }], "exams": [...], "locations": [{ "id", "name", "type": "city\|state" }] } }` |
| **Notes** | Powered by Elasticsearch. Cached in Redis (`search:suggest:{prefix}`). Logged to MongoDB `search_logs` asynchronously. Falls back to PostgreSQL full-text if ES unavailable. |

#### `GET /api/v1/search`

| Field | Detail |
|-------|--------|
| **Query** | `q=string` (required), `type=all\|college\|course\|exam\|stream\|university` (default: all), `stream=slug`, `courseLevel=ug\|pg`, `location=city-slug`, `collegeType=private\|government`, `page=int`, `limit=int(default 20)` |
| **Response (200)** | `{ "query": "string", "results": { "colleges": { "total": 210, "items": [...] }, "courses": { "total": 80, "items": [...] }, "exams": {...}, "streams": {...}, "universities": {...} }, "pagination": {...} }` |

---

## MODULE 04 — College Discovery & Listings

### 4.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/colleges` | Paginated college listing with filters | No | Public |
| GET | `/colleges/:slug` | College detail page | No | Public |
| GET | `/colleges/:slug/courses` | Courses offered by college | No | Public |
| GET | `/colleges/:slug/exams` | Accepted exams | No | Public |
| GET | `/colleges/:slug/faqs` | College FAQs | No | Public |
| GET | `/colleges/:slug/reviews` | Approved reviews | No | Public |
| POST | `/colleges/:slug/brochure/download` | Track & serve brochure download | No | Public |
| GET | `/colleges/compare` | Compare up to 4 colleges | No | Public |
| POST | `/users/me/saved-colleges` | Shortlist a college | Yes | User |
| DELETE | `/users/me/saved-colleges/:collegeId` | Remove shortlisted college | Yes | User |
| GET | `/users/me/saved-colleges` | List saved colleges | Yes | User |

#### `GET /api/v1/colleges`

| Field | Detail |
|-------|--------|
| **Query** | `stream=slug`, `subStream=slug`, `course=slug`, `location=city-slug\|state-slug`, `collegeType=private\|government\|deemed\|autonomous`, `courseLevel=ug\|pg\|diploma`, `affiliatedTo=string`, `approvalBody=string`, `deliveryMode=full-time\|part-time\|online\|hybrid`, `duration=string`, `sort=popularity\|name\|established` (default: popularity), `page=int`, `limit=int(default 20)` |
| **Response (200)** | `{ "data": [{ "id": "uuid", "name": "string", "slug": "string", "logo": "url", "type": "string", "city": "string", "state": "string", "accreditation": "string", "establishedYear": 1990, "courses": [{ "name": "string", "level": "UG", "fees": [{ "type": "Tuition", "amount": 120000, "currency": "INR", "frequency": "Annual" }] }], "enquiryCta": true }], "pagination": {...}, "filters": { "availableFilters": [...], "appliedFilters": {...} } }` |
| **Notes** | Cached filter facets in Redis. Results from Elasticsearch for relevance, PostgreSQL for strict filtering. |

#### `GET /api/v1/colleges/:slug`

| Field | Detail |
|-------|--------|
| **Response (200)** | `{ "id", "name", "slug", "logo", "coverImage", "gallery": [{ "url", "alt", "isCover" }], "type", "fundingType", "establishedYear", "universityAffiliation", "approvalBody", "accreditation", "overview": "rich-text", "admissionProcess": "rich-text", "placementInfo": "rich-text", "facilities": "rich-text", "contact": { "email", "phone", "address", "website", "pincode", "lat", "lng" }, "city": { "id", "name", "slug" }, "state": { "id", "name", "slug" }, "courses": [{ "id", "name", "slug", "level", "duration", "eligibility", "fees": [{ "type", "amount", "currency", "frequency" }] }], "exams": [{ "id", "name", "slug" }], "streams": [{ "id", "name", "slug" }], "faqs": [{ "question", "answer" }], "brochureUrl": "url \| null", "ranking": { "national": 45 }, "seo": { "metaTitle", "metaDescription", "schema": "JSON-LD" }, "isSaved": false }` |
| **Notes** | `isSaved` populated only for authenticated requests. Cached in Redis (`content:college:{slug}`). Cache invalidated on publish/update. |

#### `GET /api/v1/colleges/compare`

| Field | Detail |
|-------|--------|
| **Query** | `slugs=slug1,slug2,slug3,slug4` (min 2, max 4) |
| **Response (200)** | `{ "colleges": [{ "id", "name", "slug", "type", "city", "state", "establishedYear", "accreditation", "approvalBody", "ranking", "coursesCount", "topCourses": [...], "feeRange": { "min", "max", "currency" }, "facilities": "text" }] }` |

---

## MODULE 05 — Course & Exam Discovery

### 5.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/courses` | Paginated course listing | No | Public |
| GET | `/courses/:slug` | Course detail page | No | Public |
| GET | `/courses/:slug/colleges` | Colleges offering this course | No | Public |
| GET | `/courses/:slug/exams` | Related entrance exams | No | Public |
| GET | `/courses/:slug/faqs` | Course FAQs | No | Public |
| GET | `/courses/:slug/reviews` | Course reviews | No | Public |
| GET | `/exams` | Paginated exam listing | No | Public |
| GET | `/exams/:slug` | Exam detail page | No | Public |
| GET | `/exams/:slug/colleges` | Colleges accepting this exam | No | Public |
| GET | `/exams/:slug/courses` | Courses for this exam | No | Public |
| GET | `/exams/:slug/faqs` | Exam FAQs | No | Public |
| GET | `/category-pages/:slug` | Dynamic category page data | No | Public |

#### `GET /api/v1/courses/:slug`

| Field | Detail |
|-------|--------|
| **Response (200)** | `{ "id", "name", "slug", "code", "level", "duration", "deliveryMode", "stream": { "id", "name", "slug" }, "subStream": { "id", "name" } \| null, "overview": "rich-text", "eligibility": "rich-text", "colleges": [{ "id", "name", "slug", "city", "state", "type", "fees": [{ "type", "amount", "currency", "frequency" }] }], "relatedCourses": [{ "id", "name", "slug", "level" }], "relatedExams": [{ "id", "name", "slug" }], "faqs": [...], "seo": { "metaTitle", "metaDescription" } }` |

#### `GET /api/v1/exams/:slug`

| Field | Detail |
|-------|--------|
| **Response (200)** | `{ "id", "name", "slug", "code", "examType": "Entrance\|Board\|Competitive\|Scholarship", "conductingBody", "mode", "frequency", "overview": "rich-text", "examPattern": "rich-text", "eligibility": "rich-text", "importantDates": [{ "dateType", "dateValue", "note" }], "applicationUrl", "acceptedCourses": [{ "id", "name", "slug", "level" }], "acceptedColleges": [{ "id", "name", "slug", "city", "type" }], "faqs": [...], "seo": {...} }` |

#### `GET /api/v1/category-pages/:slug`

| Field | Detail |
|-------|--------|
| **Query** | Standard college listing filters + `page`, `limit`, `sort` |
| **Response (200)** | `{ "pageTitle", "slug", "content": "rich-text SEO body", "stream": {...}\|null, "course": {...}\|null, "location": {...}\|null, "colleges": [listing cards], "pagination": {...}, "filters": {...}, "faqs": [...], "seo": {...} }` |

---

## MODULE 06 — Lead Generation & Enquiries

### 6.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/leads` | Submit enquiry (triggers OTP) | No | Public |
| POST | `/leads/verify-otp` | Verify OTP → finalize lead | No | Public |
| GET | `/users/me/enquiries` | User's submitted enquiries | Yes | User |
| GET | `/users/me/enquiries/:id` | Single enquiry detail | Yes | User |
| GET | `/admin/leads` | Paginated lead list (admin) | Yes | Admin, Super Admin |
| GET | `/admin/leads/:id` | Lead detail (admin) | Yes | Admin, Super Admin |
| PATCH | `/admin/leads/:id/status` | Update lead status | Yes | Admin, Super Admin |
| PATCH | `/admin/leads/:id/notes` | Add/update internal notes | Yes | Admin, Super Admin |
| POST | `/admin/leads/:id/crm-push` | Push/retry CRM sync | Yes | Admin, Super Admin |
| GET | `/admin/leads/export` | Export leads as CSV | Yes | Admin, Super Admin |
| GET | `/admin/leads/summary` | Lead summary stats | Yes | Admin, Super Admin |

#### `POST /api/v1/leads`

| Field | Detail |
|-------|--------|
| **Request Body** | `{ "fullName": "string*", "mobile": "string*(10-15)", "email": "string", "city": "string", "state": "string", "preferredCourse": "string", "context": { "sourceType": "category\|college\|course\|exam\|blog\|news\|study_abroad"*, "sourceUrl": "string*", "streamId": "uuid", "subStreamId": "uuid", "courseId": "uuid", "collegeId": "uuid", "examId": "uuid", "universityId": "uuid", "countryId": "uuid" }, "deviceType": "mobile\|desktop\|tablet" }` |
| **Response (200)** | `{ "success": true, "message": "OTP sent for verification", "data": { "leadToken": "temp-uuid", "otpExpiry": "ISO timestamp" } }` |
| **Errors** | 400 — Missing fields \| 422 — Invalid mobile \| 429 — Rate limited |
| **Notes** | Lead data stored temporarily in Redis until OTP verified. Not persisted to PostgreSQL until verification completes. `deviceType` auto-detected from User-Agent if not provided. |

#### `POST /api/v1/leads/verify-otp`

| Field | Detail |
|-------|--------|
| **Request Body** | `{ "leadToken": "temp-uuid", "otp": "string(6)" }` |
| **Response (201)** | `{ "success": true, "message": "Enquiry submitted successfully", "data": { "leadId": "uuid", "status": "new" } }` |
| **Notes** | On success: lead persisted to PostgreSQL, duplicate check runs (flags `is_duplicate`), confirmation notification sent, CRM push triggered if configured. Audit log created in MongoDB. |

#### `GET /api/v1/admin/leads`

| Field | Detail |
|-------|--------|
| **Query** | `page`, `limit(default 50)`, `status=new\|contacted\|in_progress\|converted\|closed\|invalid\|junk`, `sourceType=category\|college\|course\|exam\|blog\|study_abroad`, `collegeId=uuid`, `courseId=uuid`, `streamId=uuid`, `universityId=uuid`, `crmPushStatus=pending\|pushed\|failed`, `startDate=YYYY-MM-DD`, `endDate=YYYY-MM-DD`, `uniqueOnly=boolean`, `search=string(name/mobile/email)`, `sort=createdAt\|name(default: createdAt desc)` |
| **Response (200)** | `{ "data": [{ "id", "fullName", "mobile", "email", "city", "state", "status", "sourceType", "context": { "pageType", "entityName", "entitySlug" }, "isDuplicate", "crmPushStatus", "createdAt" }], "pagination": {...}, "summary": { "total", "new", "contacted", "inProgress", "converted", "closed", "invalid", "junk" } }` |

---

## MODULE 07 — Blog, News & FAQ

### 7.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/blogs` | Paginated blog listing | No | Public |
| GET | `/blogs/categories` | Blog category list | No | Public |
| GET | `/blogs/:slug` | Blog detail page | No | Public |
| GET | `/blogs/:slug/related` | Related blog articles | No | Public |
| GET | `/news` | Paginated news listing | No | Public |
| GET | `/news/categories` | News category list | No | Public |
| GET | `/news/:slug` | News detail page | No | Public |
| GET | `/faqs` | FAQs filtered by module/entity/tags | No | Public |

#### `GET /api/v1/blogs/:slug`

| Field | Detail |
|-------|--------|
| **Response (200)** | `{ "id", "title", "slug", "category": { "id", "name", "slug" }, "author": { "id", "name", "bio", "avatarUrl" }, "featuredImage": { "url", "alt" }, "excerpt", "content": "rich-text", "tags": ["string"], "publishedAt": "ISO", "seo": { "metaTitle", "metaDescription" } }` |

#### `GET /api/v1/faqs`

| Field | Detail |
|-------|--------|
| **Query** | `module=college\|course\|exam\|stream\|blog\|category_page`, `entityId=uuid`, `tags=tag1,tag2` |
| **Response (200)** | `{ "data": [{ "id", "question", "answer", "displayOrder" }] }` |

---

## MODULE 08 — Study Abroad

### 8.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/study-abroad/countries` | Country listing | No | Public |
| GET | `/study-abroad/countries/:slug` | Country detail page | No | Public |
| GET | `/study-abroad/countries/:slug/universities` | Universities in a country | No | Public |
| GET | `/study-abroad/universities` | All universities listing | No | Public |
| GET | `/study-abroad/universities/:slug` | University detail page | No | Public |
| GET | `/study-abroad/universities/:slug/programs` | Programs at a university | No | Public |
| GET | `/study-abroad/programs/:slug` | Program detail page | No | Public |
| GET | `/study-abroad/scholarships` | Scholarship listing with filters | No | Public |
| GET | `/study-abroad/scholarships/:slug` | Scholarship detail page | No | Public |
| GET | `/study-abroad/category/:slug` | Study abroad category page | No | Public |
| POST | `/users/me/saved-universities` | Save a university | Yes | User |
| DELETE | `/users/me/saved-universities/:universityId` | Remove saved university | Yes | User |
| GET | `/users/me/saved-universities` | List saved universities | Yes | User |

#### `GET /api/v1/study-abroad/countries/:slug`

| Field | Detail |
|-------|--------|
| **Response (200)** | `{ "id", "name", "slug", "flagUrl", "description": "rich-text", "educationSystem": "rich-text", "visaInfo": "rich-text", "careerOpportunities": "rich-text", "highlights": { }, "universities": [{ "id", "name", "slug", "city", "isFeatured" }], "popularCourses": [{ "id", "name", "slug", "level" }], "seo": {...} }` |

#### `GET /api/v1/study-abroad/universities/:slug`

| Field | Detail |
|-------|--------|
| **Response (200)** | `{ "id", "name", "slug", "country": { "id", "name", "slug" }, "city", "description": "rich-text", "history": "rich-text", "academicStrengths": "rich-text", "facilities": "rich-text", "logo", "coverImage", "website", "isFeatured", "programs": [{ "id", "name", "slug", "level", "duration", "tuitionFee", "feeCurrency", "applicationDeadline", "intakePeriod", "testScores": { "IELTS": { "min": 6.5 }, "GRE": { "min": 310 } } }], "seo": {...}, "isSaved": false }` |

#### `GET /api/v1/study-abroad/scholarships`

| Field | Detail |
|-------|--------|
| **Query** | `country=slug`, `level=ug\|pg\|phd`, `fundingType=fully_funded\|partial`, `providerType=institution\|government\|private\|ngo`, `page`, `limit` |
| **Response (200)** | `{ "data": [{ "id", "title", "slug", "providerName", "amount", "fundingType", "applicationDeadline", "country": {...}, "level" }], "pagination": {...} }` |

---

## MODULE 09 — User Dashboard

### 9.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/users/me/dashboard` | Dashboard overview summary | Yes | User |
| GET | `/users/me/notifications` | Notification list (paginated) | Yes | User |
| PATCH | `/users/me/notifications/:id/read` | Mark notification read | Yes | User |
| PATCH | `/users/me/notifications/read-all` | Mark all read | Yes | User |
| GET | `/users/me/saved-colleges` | List saved colleges | Yes | User |
| GET | `/users/me/saved-courses` | List saved courses | Yes | User |
| POST | `/users/me/saved-courses` | Save a course | Yes | User |
| DELETE | `/users/me/saved-courses/:courseId` | Remove saved course | Yes | User |
| GET | `/users/me/enquiries` | User's enquiry history | Yes | User |

#### `GET /api/v1/users/me/dashboard`

| Field | Detail |
|-------|--------|
| **Response (200)** | `{ "user": { "fullName", "email", "mobile", "avatarUrl", "profileCompletion": 75 }, "stats": { "savedColleges": 5, "savedCourses": 3, "enquiriesSubmitted": 2 }, "recentActivity": [{ "type", "entityName", "date" }] }` |

---

## MODULE 10 — Reviews

### 10.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/reviews` | Submit a review | Yes | User |
| GET | `/users/me/reviews` | User's review history | Yes | User |
| PUT | `/users/me/reviews/:id` | Edit own review | Yes | User |
| DELETE | `/users/me/reviews/:id` | Delete own review | Yes | User |
| GET | `/admin/reviews` | Moderation queue | Yes | Admin, Super Admin |
| PATCH | `/admin/reviews/:id/status` | Approve/reject review | Yes | Admin, Super Admin |

#### `POST /api/v1/reviews`

| Field | Detail |
|-------|--------|
| **Request Body** | `{ "entityType": "college\|course", "entityId": "uuid", "rating": 1-5, "comment": "string" }` |
| **Response (201)** | `{ "success": true, "data": { "id": "uuid", "status": "pending" } }` |
| **Errors** | 409 — Already reviewed this entity \| 404 — Entity not found |

---

## MODULE 11 — Admin CMS: Colleges

### 11.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Default Roles |
|--------|----------|-------------|------|---------------|
| GET | `/admin/colleges` | Paginated list with filters | Yes | Admin, Editor, Writer, College Rep, Viewer, Super Admin |
| POST | `/admin/colleges` | Create new college | Yes | Admin, Writer, Super Admin |
| GET | `/admin/colleges/:id` | College detail for editing | Yes | Admin, Editor, Writer, College Rep (own), Viewer, Super Admin |
| PUT | `/admin/colleges/:id` | Update college | Yes | Admin, Writer, College Rep (own), Super Admin |
| PATCH | `/admin/colleges/:id/status` | Workflow transitions | Yes | See state table below |
| POST | `/admin/colleges/:id/gallery` | Upload gallery image | Yes | Admin, Writer, College Rep (own), Super Admin |
| DELETE | `/admin/colleges/:id/gallery/:imageId` | Remove gallery image | Yes | Admin, Writer, Super Admin |
| PATCH | `/admin/colleges/:id/gallery/reorder` | Reorder gallery | Yes | Admin, Writer, College Rep (own), Super Admin |
| GET | `/admin/colleges/:id/versions` | Version history (from MongoDB) | Yes | Admin, Editor, Super Admin |
| GET | `/admin/colleges/:id/versions/:ver` | Specific version snapshot | Yes | Admin, Editor, Super Admin |
| POST | `/admin/colleges/:id/versions/:ver/restore` | Restore version as new draft | Yes | Admin, Super Admin |
| POST | `/admin/colleges/:id/force-publish` | Bypass workflow (Super Admin) | Yes | Super Admin |
| POST | `/admin/colleges/:id/force-archive` | Immediate archive (Super Admin) | Yes | Super Admin |
| DELETE | `/admin/colleges/:id` | Hard delete (two-step) | Yes | Super Admin |
| POST | `/admin/colleges/bulk/approve` | Bulk approve | Yes | Super Admin |
| POST | `/admin/colleges/bulk/publish` | Bulk publish | Yes | Super Admin |
| POST | `/admin/colleges/bulk/archive` | Bulk archive | Yes | Super Admin |
| POST | `/admin/colleges/bulk/assign-rep` | Bulk assign rep | Yes | Super Admin |
| POST | `/admin/colleges/bulk/delete` | Bulk hard delete | Yes | Super Admin |

### 11.2 Workflow Transitions via `PATCH /admin/colleges/:id/status`

| Request Body | From | To | Who |
|-------------|------|-----|-----|
| `{ "action": "submit" }` | draft | review | Writer, College Rep, Admin |
| `{ "action": "approve" }` | review | approved | Editor, Admin, Super Admin |
| `{ "action": "reject", "comment": "string" }` | review | rejected | Editor, Admin, Super Admin |
| `{ "action": "publish" }` | approved | published | Admin, Super Admin |
| `{ "action": "schedule", "publishAt": "ISO" }` | approved | approved (sets `publish_scheduled_at`) | Admin, Super Admin |
| `{ "action": "archive" }` | published | archived | Admin, Super Admin |
| `{ "action": "restore" }` | archived | draft | Admin, Super Admin |
| `{ "action": "reset" }` | any | draft | Admin, Editor, Super Admin |

**Side effects on publish:** Invalidate Redis cache, update Elasticsearch index, create `content_versions` snapshot in MongoDB, send workflow notifications.

#### `POST /api/v1/admin/colleges/:id/force-publish`

| Field | Detail |
|-------|--------|
| **Request Body** | `{ "reason": "string(required, max 500)" }` |
| **Response (200)** | `{ "success": true, "message": "College force-published" }` |
| **Notes** | Bypasses draft→review→approved flow. Reason logged in audit trail. Email notification sent to author and editor. |

#### `POST /api/v1/admin/colleges/bulk/publish`

| Field | Detail |
|-------|--------|
| **Request Body** | `{ "collegeIds": ["uuid", "uuid", ...] }` |
| **Response (200)** | `{ "success": true, "data": { "total": 10, "published": 8, "skipped": 2, "errors": [{ "id", "reason" }] } }` |
| **Notes** | Only colleges in `approved` status are published. Others skipped with reason. Single audit log entry for batch. |

---

## MODULE 12 — Admin CMS: Courses, Exams, Streams, Attributes

### 12.1 Courses

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/courses` | Paginated list (filter by level, stream, status) | Yes | Admin, Editor, Writer, Viewer, Super Admin |
| POST | `/admin/courses` | Create course | Yes | Admin, Writer, Super Admin |
| GET | `/admin/courses/:id` | Course detail for editing | Yes | Admin, Editor, Writer, Viewer, Super Admin |
| PUT | `/admin/courses/:id` | Update course | Yes | Admin, Writer, Super Admin |
| PATCH | `/admin/courses/:id/status` | Workflow transitions (same as colleges) | Yes | Per workflow table |
| GET | `/admin/courses/:id/versions` | Version history | Yes | Admin, Editor, Super Admin |

### 12.2 Exams

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/exams` | Paginated list | Yes | Admin, Editor, Writer, Viewer, Super Admin |
| POST | `/admin/exams` | Create exam | Yes | Admin, Writer, Super Admin |
| GET | `/admin/exams/:id` | Exam detail | Yes | Admin, Editor, Writer, Viewer, Super Admin |
| PUT | `/admin/exams/:id` | Update exam (includes important dates) | Yes | Admin, Writer, Super Admin |
| PATCH | `/admin/exams/:id/status` | Workflow transitions | Yes | Per workflow table |

### 12.3 Streams & Substreams

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/streams` | List all streams with substreams | Yes | Admin, Super Admin |
| POST | `/admin/streams` | Create stream | Yes | Admin, Super Admin |
| PUT | `/admin/streams/:id` | Update stream | Yes | Admin, Super Admin |
| DELETE | `/admin/streams/:id` | Delete (blocked if mappings exist) | Yes | Super Admin |
| POST | `/admin/streams/:id/substreams` | Create substream | Yes | Admin, Super Admin |
| PUT | `/admin/substreams/:id` | Update substream | Yes | Admin, Super Admin |
| DELETE | `/admin/substreams/:id` | Delete substream | Yes | Super Admin |

### 12.4 Dynamic Attributes

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/attributes/groups` | List attribute groups | Yes | Admin, Super Admin |
| POST | `/admin/attributes/groups` | Create attribute group | Yes | Admin, Super Admin |
| PUT | `/admin/attributes/groups/:id` | Update group | Yes | Admin, Super Admin |
| DELETE | `/admin/attributes/groups/:id` | Delete group | Yes | Super Admin |
| GET | `/admin/attributes/groups/:id/values` | List values in group | Yes | Admin, Super Admin |
| POST | `/admin/attributes/groups/:id/values` | Add value | Yes | Admin, Super Admin |
| PUT | `/admin/attributes/values/:id` | Update value | Yes | Admin, Super Admin |
| DELETE | `/admin/attributes/values/:id` | Delete value | Yes | Super Admin |

---

## MODULE 13 — Admin CMS: Blogs, News, Scholarships, FAQs, Pages

### 13.1 Blogs

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/blogs` | Paginated list | Yes | Admin, Editor, Writer, Viewer, Super Admin |
| POST | `/admin/blogs` | Create blog | Yes | Admin, Writer, Super Admin |
| GET | `/admin/blogs/:id` | Blog detail for editing | Yes | Admin, Editor, Writer, Viewer, Super Admin |
| PUT | `/admin/blogs/:id` | Update blog | Yes | Admin, Writer, Super Admin |
| PATCH | `/admin/blogs/:id/status` | Workflow transitions | Yes | Per workflow table |
| GET | `/admin/blog-categories` | List categories | Yes | Admin, Writer, Super Admin |
| POST | `/admin/blog-categories` | Create category | Yes | Admin, Super Admin |
| PUT | `/admin/blog-categories/:id` | Update category | Yes | Admin, Super Admin |
| DELETE | `/admin/blog-categories/:id` | Delete category | Yes | Super Admin |

### 13.2 News (same pattern as Blogs)

Identical CRUD pattern. Additional field `expiresAt` in create/update body.  
News uses `/admin/news` and `/admin/news-categories` endpoints.

### 13.3 Scholarships

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/scholarships` | List scholarships | Yes | Admin, Super Admin |
| POST | `/admin/scholarships` | Create scholarship | Yes | Admin, Super Admin |
| PUT | `/admin/scholarships/:id` | Update scholarship | Yes | Admin, Super Admin |
| DELETE | `/admin/scholarships/:id` | Delete scholarship | Yes | Super Admin |

### 13.4 FAQs

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/faqs` | List FAQs (filter by module, entity) | Yes | Admin, Writer, Super Admin |
| POST | `/admin/faqs` | Create FAQ | Yes | Admin, Writer, Super Admin |
| PUT | `/admin/faqs/:id` | Update FAQ | Yes | Admin, Writer, Super Admin |
| DELETE | `/admin/faqs/:id` | Delete FAQ | Yes | Admin, Super Admin |
| PATCH | `/admin/faqs/reorder` | Reorder FAQs within entity | Yes | Admin, Writer, Super Admin |

### 13.5 Static Pages

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/pages` | List static pages | Yes | Admin, Writer, Super Admin |
| POST | `/admin/pages` | Create page | Yes | Admin, Writer, Super Admin |
| PUT | `/admin/pages/:id` | Update page | Yes | Admin, Writer, Super Admin |
| PATCH | `/admin/pages/:id/status` | Workflow transitions | Yes | Per workflow table |

### 13.6 Category Pages (SEO)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/category-pages` | List all SEO category pages | Yes | Admin, Super Admin |
| POST | `/admin/category-pages` | Create category page | Yes | Admin, Super Admin |
| PUT | `/admin/category-pages/:id` | Update content & SEO | Yes | Admin, Super Admin |
| PATCH | `/admin/category-pages/:id/status` | Workflow transitions | Yes | Per workflow table |

---

## MODULE 14 — Admin: User, Role & Permission Management

### 14.1 User Management

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/users` | Paginated admin user list | Yes | Admin, Super Admin |
| POST | `/admin/users` | Create admin user (any role) | Yes | Admin (excl. Super Admin), Super Admin (all) |
| GET | `/admin/users/:id` | User detail | Yes | Admin, Super Admin |
| PUT | `/admin/users/:id` | Update user (name, role, status) | Yes | Admin, Super Admin |
| PATCH | `/admin/users/:id/deactivate` | Deactivate (invalidate sessions) | Yes | Admin, Super Admin |
| PATCH | `/admin/users/:id/reactivate` | Reactivate | Yes | Admin, Super Admin |
| DELETE | `/admin/users/:id` | Hard delete (two-step, Super Admin) | Yes | Super Admin |
| POST | `/admin/users/:id/reset-password` | Trigger password reset email | Yes | Admin, Super Admin |

#### `POST /api/v1/admin/users`

| Field | Detail |
|-------|--------|
| **Request Body** | `{ "fullName": "string*", "email": "string(email)*", "roleId": "uuid*", "status": "active\|inactive", "assignedCollegeIds": ["uuid"] (if College Rep role) }` |
| **Response (201)** | `{ "success": true, "data": { "id": "uuid", "fullName", "email", "role" } }` |
| **Notes** | Welcome email with 48hr password-set link sent. Admin cannot create Super Admin accounts. Super Admin can create any role. Audit logged. |

### 14.2 Role Management

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/roles` | List roles with user counts | Yes | Super Admin |
| POST | `/admin/roles` | Create custom role | Yes | Super Admin |
| PUT | `/admin/roles/:id` | Update role | Yes | Super Admin |
| DELETE | `/admin/roles/:id` | Delete role (blocked if users assigned) | Yes | Super Admin |

### 14.3 Permission Management

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/permissions` | All permission codes by module | Yes | Super Admin |
| GET | `/admin/roles/:id/permissions` | Permissions for a role | Yes | Super Admin |
| PUT | `/admin/roles/:id/permissions` | Update permission matrix | Yes | Super Admin |

#### `PUT /api/v1/admin/roles/:id/permissions`

| Field | Detail |
|-------|--------|
| **Request Body** | `{ "permissionIds": ["uuid", "uuid", ...] }` |
| **Response (200)** | `{ "success": true, "data": { "roleId", "permissionsCount": 24 } }` |
| **Notes** | Replaces all permissions for the role. Takes effect on next API request. Cannot reduce Super Admin permissions. Audit logged with old/new diff. |

### 14.4 College Rep Assignment

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/college-reps` | List reps with assigned colleges | Yes | Admin, Super Admin |
| PUT | `/admin/college-reps/:userId` | Assign/update colleges for rep | Yes | Admin, Super Admin |

---

## MODULE 15 — Admin: Navigation & Banners

### 15.1 Navigation Management

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/navigation/:section` | Items for section (mega_menu_left/right, footer) | Yes | Admin, Super Admin |
| POST | `/admin/navigation/:section` | Add item | Yes | Admin, Super Admin |
| PUT | `/admin/navigation/:section/:id` | Update item | Yes | Admin, Super Admin |
| DELETE | `/admin/navigation/:section/:id` | Delete item | Yes | Admin, Super Admin |
| PATCH | `/admin/navigation/:section/reorder` | Reorder items | Yes | Admin, Super Admin |
| POST | `/admin/navigation/cache/flush` | Flush nav cache | Yes | Super Admin |
| PATCH | `/admin/navigation/:section/lock` | Lock/unlock section | Yes | Super Admin |

### 15.2 Announcement Banners

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/banners` | List all banners | Yes | Admin, Super Admin |
| POST | `/admin/banners` | Create banner | Yes | Admin, Super Admin |
| PUT | `/admin/banners/:id` | Update banner | Yes | Admin, Super Admin |
| DELETE | `/admin/banners/:id` | Delete banner | Yes | Admin, Super Admin |

---

## MODULE 16 — Smart Global Upload

### 16.1 Endpoint Summary

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/uploads/templates` | Download CSV/XLSX templates | Yes | Admin, Super Admin |
| POST | `/admin/uploads/colleges` | Upload college bulk import | Yes | Admin, Super Admin |
| POST | `/admin/uploads/courses` | Upload course bulk import | Yes | Admin, Super Admin |
| POST | `/admin/uploads/exams` | Upload exam bulk import | Yes | Admin, Super Admin |
| POST | `/admin/uploads/streams` | Upload stream/substream mapping | Yes | Admin, Super Admin |
| POST | `/admin/uploads/locations` | Upload city/state data | Yes | Super Admin |
| GET | `/admin/uploads/jobs` | List upload job history | Yes | Admin, Super Admin |
| GET | `/admin/uploads/jobs/:jobId` | Job detail + error report | Yes | Admin, Super Admin |

#### `POST /api/v1/admin/uploads/colleges`

| Field | Detail |
|-------|--------|
| **Request** | `Content-Type: multipart/form-data` — `file: binary(CSV/XLSX, max 10MB)`, `mode: "insert\|upsert"`, `draftOnImport: boolean(default true)` |
| **Response (200)** | `{ "success": true, "data": { "jobId": "uuid", "status": "queued", "totalRows": 450, "statusUrl": "/api/v1/admin/uploads/jobs/{jobId}" } }` |
| **Errors** | 400 — Invalid format \| 413 — Too large \| 422 — Template mismatch |
| **Notes** | Async processing via background job. Job stored in `upload_jobs` table. Poll status via jobs endpoint. |

---

## MODULE 17 — SEO & Advertisement Management

### 17.1 SEO

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/seo/pages` | List SEO-configured pages | Yes | Admin, Super Admin |
| GET | `/admin/seo/pages/:id` | SEO config for a page | Yes | Admin, Super Admin |
| PUT | `/admin/seo/pages/:id` | Update meta title, desc, schema, slug | Yes | Admin, Super Admin |
| POST | `/admin/seo/sitemap/regenerate` | Regenerate XML sitemap | Yes | Super Admin |

### 17.2 Advertisers & Campaigns

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/advertisers` | List advertisers | Yes | Admin, Super Admin |
| POST | `/admin/advertisers` | Create advertiser | Yes | Admin, Super Admin |
| PUT | `/admin/advertisers/:id` | Update advertiser | Yes | Admin, Super Admin |
| GET | `/admin/ad-campaigns` | List campaigns with filters | Yes | Admin, Super Admin |
| POST | `/admin/ad-campaigns` | Create campaign | Yes | Admin, Super Admin |
| PUT | `/admin/ad-campaigns/:id` | Update campaign | Yes | Admin, Super Admin |
| PATCH | `/admin/ad-campaigns/:id/status` | Activate/pause/complete | Yes | Admin, Super Admin |
| GET | `/admin/ads/active` | Active ads for a page/slot | Yes | Admin, Super Admin |

### 17.3 Ad Serving (Public)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/ads` | Get active ads for page template | No | Public |
| POST | `/ads/events` | Track impression/click | No | Public |

#### `GET /api/v1/ads`

| Field | Detail |
|-------|--------|
| **Query** | `pageTemplate=homepage\|category\|college_listing\|blog\|search_results`, `slot=string`, `streamId=uuid`, `courseId=uuid` |
| **Response (200)** | `{ "ads": [{ "campaignId", "adType", "creativeUrl", "targetUrl", "slot" }] }` |

---

## MODULE 18 — Analytics, Audit & System Settings

### 18.1 Analytics & Reports

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/analytics/dashboard` | KPI summary widgets | Yes | Admin, Super Admin |
| GET | `/admin/analytics/traffic` | GA4 traffic data (from MongoDB mirror) | Yes | Admin, Super Admin |
| GET | `/admin/analytics/colleges` | College performance report | Yes | Admin, Super Admin |
| GET | `/admin/analytics/leads` | Lead conversion report | Yes | Admin, Super Admin |
| GET | `/admin/analytics/ads` | Ad performance report | Yes | Super Admin |
| GET | `/admin/analytics/content-velocity` | Content creation/publish speed | Yes | Super Admin |
| GET | `/admin/analytics/user-activity` | Admin user activity report | Yes | Super Admin |

#### `GET /api/v1/admin/analytics/dashboard`

| Field | Detail |
|-------|--------|
| **Response (200)** | `{ "leads": { "today": 45, "thisWeek": 280, "thisMonth": 1200, "deltaVsPrior": "+12%" }, "content": { "draft": 15, "review": 8, "approved": 5, "scheduled": 3 }, "activeAds": 12, "traffic": { "last7Days": { "sessions": 15000, "pageviews": 42000 } } }` |

### 18.2 Audit Logs

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/audit-logs` | Paginated audit log | Yes | Admin (own module), Super Admin (all) |
| GET | `/admin/audit-logs/export` | Export filtered logs as CSV | Yes | Super Admin |

#### `GET /api/v1/admin/audit-logs`

| Field | Detail |
|-------|--------|
| **Query** | `page`, `limit(default 100)`, `userId=uuid`, `action=create\|update\|delete\|submit\|approve\|reject\|publish\|archive`, `entityType=College\|Course\|Exam\|Blog\|Lead\|User\|Setting`, `startDate`, `endDate`, `sort=createdAt desc` |
| **Response (200)** | `{ "data": [{ "id", "userName", "userRole", "action", "entityType", "entityName", "ipAddress", "createdAt", "hasChanges": true }], "pagination": {...} }` |
| **Notes** | Expand individual entry via click to see `oldValue`/`newValue` JSON diff. Data from MongoDB `audit_logs` collection. |

### 18.3 Security

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/security/events` | Security event log | Yes | Super Admin |
| GET | `/admin/security/ip-blocklist` | List blocked IPs | Yes | Super Admin |
| POST | `/admin/security/ip-blocklist` | Block an IP | Yes | Super Admin |
| DELETE | `/admin/security/ip-blocklist/:id` | Unblock an IP | Yes | Super Admin |

### 18.4 System Settings

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/settings` | Get all settings (grouped) | Yes | Super Admin |
| PUT | `/admin/settings/general` | Update general settings | Yes | Super Admin |
| PUT | `/admin/settings/email` | Update SMTP config | Yes | Super Admin |
| PUT | `/admin/settings/integrations` | Update CRM, GA4, CDN | Yes | Super Admin |
| PUT | `/admin/settings/security` | Update security policies | Yes | Super Admin |
| PUT | `/admin/settings/maintenance` | Toggle maintenance mode | Yes | Super Admin |
| POST | `/admin/settings/email/test` | Send test email | Yes | Super Admin |

### 18.5 Cache & Search Index

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/admin/cache/flush` | Flush all Redis cache | Yes | Super Admin |
| POST | `/admin/cache/flush/:entityType` | Flush by entity type | Yes | Super Admin |
| GET | `/admin/cache/status` | Redis memory/key count | Yes | Super Admin |
| POST | `/admin/search/reindex` | Full ES reindex | Yes | Super Admin |
| POST | `/admin/search/reindex/:entityType` | Partial reindex | Yes | Super Admin |
| GET | `/admin/search/index-status` | ES document counts | Yes | Super Admin |

### 18.6 Dashboard Layout

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/dashboard/layout` | Get widget layout | Yes | Super Admin |
| PUT | `/admin/dashboard/layout` | Save widget layout | Yes | Super Admin |

### 18.7 Bug & Incident Tracking

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/admin/issues` | List issues | Yes | Admin, Super Admin |
| POST | `/admin/issues` | Create issue | Yes | Admin, Super Admin |
| GET | `/admin/issues/:id` | Issue detail | Yes | Admin, Super Admin |
| PUT | `/admin/issues/:id` | Update issue | Yes | Admin, Super Admin |
| GET | `/admin/change-requests` | List change requests | Yes | Admin, Super Admin |
| POST | `/admin/change-requests` | Create change request | Yes | Admin, Super Admin |
| PATCH | `/admin/change-requests/:id` | Approve/reject (Super Admin) | Yes | Super Admin |

---

## Endpoint Count Summary

| Module | Count |
|--------|:-----:|
| 01 Auth & Users | 13 |
| 02 Navigation & Layout | 3 |
| 03 Global Search | 5 |
| 04 College Discovery | 11 |
| 05 Course & Exam | 12 |
| 06 Lead Generation | 11 |
| 07 Blog, News & FAQ | 8 |
| 08 Study Abroad | 13 |
| 09 User Dashboard | 9 |
| 10 Reviews | 6 |
| 11 Admin CMS: Colleges | 19 |
| 12 Admin CMS: Courses/Exams/Streams/Attributes | 20 |
| 13 Admin CMS: Blogs/News/Scholarships/FAQs/Pages | 25 |
| 14 Admin: Users/Roles/Permissions | 15 |
| 15 Admin: Navigation & Banners | 11 |
| 16 Smart Global Upload | 8 |
| 17 SEO & Ads | 12 |
| 18 Analytics/Audit/Settings/System | 24 |
| **Total** | **~225** |
