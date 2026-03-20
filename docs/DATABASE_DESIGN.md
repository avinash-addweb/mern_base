# Database Design — College Discovery & Admission Guidance Platform

> **Version:** 1.0 | **Architecture:** PostgreSQL + MongoDB + Redis  
> **Last Updated:** March 2026

---

## Architecture Overview

| Store | Role | Technology |
|-------|------|-----------|
| **PostgreSQL** | Primary DB — structured, relational, ACID-critical data | TypeORM via NestJS |
| **MongoDB** | Secondary DB — high-volume, append-heavy, semi-structured | Mongoose via NestJS |
| **Redis** | Cache layer — OTPs, sessions, content cache, rate limiting | ioredis via NestJS |
| **Elasticsearch** | Search engine — full-text search, fuzzy match, autocomplete | Dedicated service |

---

## Data Boundary Rules

- **PostgreSQL**: All entities with relational joins, workflow states, RBAC, transactional writes
- **MongoDB**: Audit logs, content versions, event streams, analytics, delivery logs
- **Redis**: Anything with TTL (OTPs, sessions, cache), rate limiting counters
- **Elasticsearch**: Read-only mirror of published PostgreSQL entities for search

---

# PART A: PostgreSQL Schema

> All tables use `UUID` primary keys via `gen_random_uuid()`.  
> All timestamps are `TIMESTAMPTZ` (UTC).  
> Enum values stored as `VARCHAR` with application-level validation.

---

## 1. Users & Authentication

### 1.1 `users`

Core user table for both public (frontend) and admin panel users.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `full_name` | VARCHAR(200) | NO | — | User display name |
| `email` | VARCHAR(255) | YES | NULL | Unique email (nullable for mobile-only registration) |
| `mobile` | VARCHAR(15) | YES | NULL | Mobile number with country code |
| `password_hash` | VARCHAR(255) | YES | NULL | Bcrypt hash (null for OTP-only users) |
| `user_type` | VARCHAR(20) | NO | `'public'` | Enum: `public`, `admin`, `super_admin` |
| `role_id` | UUID | YES | NULL | FK → `roles.id` (null for public users) |
| `avatar_url` | VARCHAR(500) | YES | NULL | Profile picture URL |
| `city` | VARCHAR(100) | YES | NULL | User city |
| `state` | VARCHAR(100) | YES | NULL | User state |
| `email_verified` | BOOLEAN | NO | `false` | Email verification status |
| `mobile_verified` | BOOLEAN | NO | `false` | Mobile OTP verification status |
| `status` | VARCHAR(20) | NO | `'active'` | Enum: `active`, `inactive`, `locked`, `deleted` |
| `last_login_at` | TIMESTAMPTZ | YES | NULL | Last successful login |
| `login_attempts` | INT | NO | `0` | Failed consecutive login attempts |
| `locked_until` | TIMESTAMPTZ | YES | NULL | Account lock expiry |
| `notification_prefs` | JSONB | NO | `'{}'` | Email/push notification preferences |
| `created_by` | UUID | YES | NULL | FK → `users.id` (for admin-created accounts) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(email)`, `UNIQUE(mobile)`, `INDEX(role_id)`, `INDEX(user_type, status)`, `INDEX(created_at)`

---

### 1.2 `roles`

Admin panel roles. Six default system roles + custom roles.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(100) | NO | — | Unique role name |
| `description` | TEXT | YES | NULL | Role description |
| `is_system` | BOOLEAN | NO | `false` | True for 6 default roles (cannot be deleted) |
| `status` | VARCHAR(20) | NO | `'active'` | Enum: `active`, `inactive` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(name)`

**Default system roles:** Super Admin, Admin, Editor, Content Writer, College Representative, Viewer

---

### 1.3 `permissions`

Master list of all permission codes grouped by module.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `module` | VARCHAR(50) | NO | — | Module: `College`, `Course`, `Exam`, `Blog`, `News`, `Lead`, `Ad`, `User`, `SEO`, `Navigation`, `Audit`, `Settings` |
| `code` | VARCHAR(100) | NO | — | Permission code: `college.create`, `college.publish`, etc. |
| `description` | VARCHAR(300) | YES | NULL | Human-readable description |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |

**Indexes:** `UNIQUE(code)`, `INDEX(module)`

---

### 1.4 `role_permissions`

RBAC permission matrix junction table.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `role_id` | UUID | NO | — | FK → `roles.id` |
| `permission_id` | UUID | NO | — | FK → `permissions.id` |
| `granted_at` | TIMESTAMPTZ | NO | `NOW()` | When permission was assigned |

**Primary Key:** `(role_id, permission_id)`  
**Indexes:** `INDEX(permission_id)`

---

### 1.5 `user_sessions`

Active JWT session tracking for forced invalidation.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | — | FK → `users.id` |
| `access_token_hash` | VARCHAR(255) | NO | — | SHA-256 hash of JWT access token |
| `refresh_token_hash` | VARCHAR(255) | NO | — | SHA-256 hash of refresh token |
| `ip_address` | INET | YES | NULL | Client IP address |
| `user_agent` | TEXT | YES | NULL | Browser/device user agent |
| `expires_at` | TIMESTAMPTZ | NO | — | Refresh token expiry |
| `is_revoked` | BOOLEAN | NO | `false` | Set true on logout or forced invalidation |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Session creation timestamp |

**Indexes:** `INDEX(user_id)`, `INDEX(refresh_token_hash)`, `INDEX(expires_at) WHERE is_revoked = false`

---

### 1.6 `password_resets`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | — | FK → `users.id` |
| `token_hash` | VARCHAR(255) | NO | — | SHA-256 hash of reset token |
| `expires_at` | TIMESTAMPTZ | NO | — | Token expiry (typically 1 hour) |
| `used_at` | TIMESTAMPTZ | YES | NULL | When token was consumed |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Token creation timestamp |

**Indexes:** `INDEX(token_hash)`, `INDEX(user_id)`

---

## 2. Taxonomy & Academic Hierarchy

> Core hierarchy: **Stream → Substream → Course**  
> Drives navigation, category pages, SEO slugs, and college discovery.

### 2.1 `streams`

Top-level academic categories (~20–22 streams).

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(100) | NO | — | Stream name (e.g., Engineering) |
| `slug` | VARCHAR(120) | NO | — | SEO-friendly URL slug |
| `icon_url` | VARCHAR(500) | YES | NULL | Stream icon image URL (max 100 KB) |
| `description` | TEXT | YES | NULL | Stream description for SEO |
| `display_order` | INT | NO | `0` | Ordering in navigation and listings |
| `is_active` | BOOLEAN | NO | `true` | Active/Inactive toggle |
| `meta_title` | VARCHAR(70) | YES | NULL | SEO meta title |
| `meta_description` | VARCHAR(160) | YES | NULL | SEO meta description |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `INDEX(is_active, display_order)`

---

### 2.2 `substreams`

Specializations within a stream (e.g., Computer Science under Engineering).

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `stream_id` | UUID | NO | — | FK → `streams.id` |
| `name` | VARCHAR(150) | NO | — | Substream name |
| `slug` | VARCHAR(170) | NO | — | SEO-friendly URL slug |
| `description` | TEXT | YES | NULL | Substream description |
| `display_order` | INT | NO | `0` | Ordering within parent stream |
| `is_active` | BOOLEAN | NO | `true` | Active/Inactive toggle |
| `show_in_filter` | BOOLEAN | NO | `true` | Admin-configurable: show as filter on frontend |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `INDEX(stream_id, is_active, display_order)`

---

### 2.3 `courses`

Master course list (~21,000 courses).

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(200) | NO | — | Course name (must be unique) |
| `code` | VARCHAR(20) | YES | NULL | Course code (alphanumeric) |
| `slug` | VARCHAR(250) | NO | — | SEO-friendly URL slug |
| `level` | VARCHAR(30) | NO | — | Enum: `UG`, `PG`, `Diploma`, `Certificate`, `PhD` |
| `duration` | VARCHAR(50) | YES | NULL | E.g., '4 Years', '2 Semesters' |
| `delivery_mode` | VARCHAR(30) | YES | NULL | Enum: `Full-time`, `Part-time`, `Online`, `Hybrid` |
| `eligibility` | TEXT | YES | NULL | Rich text eligibility criteria |
| `description` | TEXT | YES | NULL | Rich text course description |
| `status` | VARCHAR(20) | NO | `'draft'` | Workflow: `draft`, `review`, `approved`, `published`, `archived` |
| `published_at` | TIMESTAMPTZ | YES | NULL | When last published |
| `meta_title` | VARCHAR(70) | YES | NULL | SEO meta title |
| `meta_description` | VARCHAR(160) | YES | NULL | SEO meta description |
| `meta_keywords` | TEXT[] | YES | NULL | Array of SEO keyword tags |
| `current_version` | INT | NO | `1` | Current version counter |
| `created_by` | UUID | YES | NULL | FK → `users.id` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `UNIQUE(name)`, `INDEX(level)`, `INDEX(status)`, `INDEX(created_at)`

---

### 2.4 `course_streams` (Junction)

| Column | Type | Description |
|--------|------|-------------|
| `course_id` | UUID | FK → `courses.id` |
| `stream_id` | UUID | FK → `streams.id` |

**Primary Key:** `(course_id, stream_id)`

---

### 2.5 `course_substreams` (Junction)

| Column | Type | Description |
|--------|------|-------------|
| `course_id` | UUID | FK → `courses.id` |
| `substream_id` | UUID | FK → `substreams.id` |

**Primary Key:** `(course_id, substream_id)`

---

## 3. Colleges (Domestic)

### 3.1 `colleges`

Core college profile — managed through 9-tab admin form with content workflow.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(300) | NO | — | Official college name |
| `slug` | VARCHAR(350) | NO | — | SEO-friendly URL slug (auto-generated, editable) |
| `college_type` | VARCHAR(30) | NO | — | Enum: `Private`, `Government`, `Deemed`, `Autonomous` |
| `funding_type` | VARCHAR(30) | YES | NULL | Enum: `Self-Financed`, `Aided`, `Government-Funded` |
| `established_year` | INT | YES | NULL | Year of establishment |
| `university_affiliation` | VARCHAR(300) | YES | NULL | Affiliated university name |
| `approval_body` | VARCHAR(200) | YES | NULL | Regulatory/accreditation authority |
| `accreditation` | VARCHAR(200) | YES | NULL | E.g., NAAC A++, NBA accredited |
| `description` | TEXT | YES | NULL | Rich text college overview |
| `admission_process` | TEXT | YES | NULL | Rich text admission process |
| `placement_info` | TEXT | YES | NULL | Rich text placement info |
| `facilities` | TEXT | YES | NULL | Rich text facilities description |
| `logo_url` | VARCHAR(500) | YES | NULL | College logo URL |
| `cover_image_url` | VARCHAR(500) | YES | NULL | Cover/thumbnail image URL |
| `brochure_url` | VARCHAR(500) | YES | NULL | PDF brochure download URL |
| `website_url` | VARCHAR(500) | YES | NULL | Official college website |
| `email` | VARCHAR(255) | YES | NULL | Contact email |
| `phone` | VARCHAR(20) | YES | NULL | Contact phone |
| `address` | TEXT | YES | NULL | Full street address |
| `city_id` | UUID | NO | — | FK → `cities.id` |
| `state_id` | UUID | NO | — | FK → `states.id` |
| `pincode` | VARCHAR(10) | YES | NULL | Postal/ZIP code |
| `latitude` | DECIMAL(10,7) | YES | NULL | GPS latitude |
| `longitude` | DECIMAL(10,7) | YES | NULL | GPS longitude |
| `ranking_national` | INT | YES | NULL | National ranking |
| `popularity_score` | INT | NO | `0` | Computed popularity for sorting |
| `is_featured` | BOOLEAN | NO | `false` | Featured college flag |
| `featured_priority` | INT | YES | NULL | Manual ordering for featured |
| `status` | VARCHAR(20) | NO | `'draft'` | Workflow: `draft`, `review`, `approved`, `published`, `rejected`, `archived` |
| `published_at` | TIMESTAMPTZ | YES | NULL | Last publish timestamp |
| `assigned_rep_id` | UUID | YES | NULL | FK → `users.id` (College Representative) |
| `current_version` | INT | NO | `1` | Current version counter |
| `meta_title` | VARCHAR(70) | YES | NULL | SEO meta title |
| `meta_description` | VARCHAR(160) | YES | NULL | SEO meta description |
| `meta_keywords` | TEXT[] | YES | NULL | SEO keyword tags |
| `schema_markup` | TEXT | YES | NULL | JSON-LD structured data |
| `created_by` | UUID | YES | NULL | FK → `users.id` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `INDEX(city_id)`, `INDEX(state_id)`, `INDEX(college_type)`, `INDEX(status)`, `INDEX(assigned_rep_id)`, `INDEX(is_featured, featured_priority)`, `INDEX(popularity_score DESC)`, `INDEX(created_at)`, `GIN(meta_keywords)`

---

### 3.2 `college_courses`

Maps colleges to courses they offer.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `college_id` | UUID | NO | — | FK → `colleges.id` ON DELETE CASCADE |
| `course_id` | UUID | NO | — | FK → `courses.id` |
| `eligibility_override` | TEXT | YES | NULL | College-specific eligibility |
| `intake_capacity` | INT | YES | NULL | Seats available |
| `duration_override` | VARCHAR(50) | YES | NULL | College-specific duration |
| `is_active` | BOOLEAN | NO | `true` | Whether mapping is active |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |

**Indexes:** `UNIQUE(college_id, course_id)`, `INDEX(course_id)`

---

### 3.3 `college_course_fees`

Flexible fee components per college-course combination.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `college_course_id` | UUID | NO | — | FK → `college_courses.id` ON DELETE CASCADE |
| `fee_type` | VARCHAR(50) | NO | — | E.g., `Tuition`, `Hostel`, `Lab`, `Library`, `Exam`, `Registration` |
| `amount` | DECIMAL(12,2) | NO | — | Fee amount |
| `currency` | VARCHAR(3) | NO | `'INR'` | Currency code: `INR`, `USD` |
| `frequency` | VARCHAR(30) | YES | `'Annual'` | Enum: `Annual`, `Semester`, `One-Time`, `Monthly` |
| `notes` | VARCHAR(300) | YES | NULL | Additional notes |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `INDEX(college_course_id)`, `INDEX(fee_type)`

---

### 3.4 `college_streams` (Junction)

| Column | Type | Description |
|--------|------|-------------|
| `college_id` | UUID | FK → `colleges.id` ON DELETE CASCADE |
| `stream_id` | UUID | FK → `streams.id` |

**Primary Key:** `(college_id, stream_id)`

---

### 3.5 `college_gallery`

Image gallery (max 20 images per college).

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `college_id` | UUID | NO | — | FK → `colleges.id` ON DELETE CASCADE |
| `image_url` | VARCHAR(500) | NO | — | CDN URL |
| `alt_text` | VARCHAR(150) | NO | — | Alt text for SEO/accessibility |
| `is_cover` | BOOLEAN | NO | `false` | Designated cover image |
| `display_order` | INT | NO | `0` | Drag-and-drop ordering |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Upload timestamp |

**Indexes:** `INDEX(college_id, display_order)`

---

## 4. Exams

### 4.1 `exams`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(200) | NO | — | Exam name (unique) |
| `code` | VARCHAR(30) | YES | NULL | Exam code |
| `slug` | VARCHAR(250) | NO | — | SEO-friendly URL slug |
| `exam_type` | VARCHAR(30) | NO | — | Enum: `Entrance`, `Board`, `Competitive`, `Scholarship` |
| `conducting_body` | VARCHAR(300) | YES | NULL | Conducting organization |
| `mode` | VARCHAR(20) | YES | NULL | Enum: `Online`, `Offline`, `Both` |
| `frequency` | VARCHAR(20) | YES | NULL | Enum: `Annual`, `Bi-Annual`, `Monthly`, `As Needed` |
| `eligibility` | TEXT | YES | NULL | Rich text eligibility |
| `description` | TEXT | YES | NULL | Rich text overview |
| `exam_pattern` | TEXT | YES | NULL | Rich text exam pattern |
| `status` | VARCHAR(20) | NO | `'draft'` | Workflow status |
| `published_at` | TIMESTAMPTZ | YES | NULL | Last publish timestamp |
| `current_version` | INT | NO | `1` | Version counter |
| `meta_title` | VARCHAR(70) | YES | NULL | SEO meta title |
| `meta_description` | VARCHAR(160) | YES | NULL | SEO meta description |
| `created_by` | UUID | YES | NULL | FK → `users.id` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `UNIQUE(name)`, `INDEX(exam_type)`, `INDEX(status)`

---

### 4.2 `exam_important_dates`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `exam_id` | UUID | NO | — | FK → `exams.id` ON DELETE CASCADE |
| `date_type` | VARCHAR(50) | NO | — | Enum: `Notification Release`, `Application Open`, `Application Close`, `Admit Card`, `Exam Date`, `Result Date` |
| `date_value` | DATE | NO | — | The actual date |
| `note` | VARCHAR(300) | YES | NULL | Optional note |
| `display_order` | INT | NO | `0` | Ordering |

**Indexes:** `INDEX(exam_id, display_order)`, `INDEX(date_value)`

---

### 4.3 `exam_courses` (Junction)

| Column | Type | Description |
|--------|------|-------------|
| `exam_id` | UUID | FK → `exams.id` |
| `course_id` | UUID | FK → `courses.id` |

**Primary Key:** `(exam_id, course_id)`

### 4.4 `exam_colleges` (Junction)

| Column | Type | Description |
|--------|------|-------------|
| `exam_id` | UUID | FK → `exams.id` |
| `college_id` | UUID | FK → `colleges.id` |

**Primary Key:** `(exam_id, college_id)`

### 4.5 `exam_streams` (Junction)

| Column | Type | Description |
|--------|------|-------------|
| `exam_id` | UUID | FK → `exams.id` |
| `stream_id` | UUID | FK → `streams.id` |

**Primary Key:** `(exam_id, stream_id)`

---

## 5. Study Abroad

> Separate entity hierarchy from domestic colleges.  
> Hierarchy: **Country → University → Program**

### 5.1 `countries`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(100) | NO | — | Country name |
| `slug` | VARCHAR(120) | NO | — | SEO-friendly URL slug |
| `flag_url` | VARCHAR(500) | YES | NULL | Country flag/icon URL |
| `description` | TEXT | YES | NULL | Rich text overview |
| `education_system` | TEXT | YES | NULL | Education system overview |
| `visa_info` | TEXT | YES | NULL | Student visa requirements |
| `career_opportunities` | TEXT | YES | NULL | Career opportunities |
| `highlights` | JSONB | YES | NULL | Key study highlights |
| `is_popular` | BOOLEAN | NO | `false` | Featured as popular destination |
| `display_order` | INT | NO | `0` | Ordering in listings |
| `status` | VARCHAR(20) | NO | `'draft'` | Workflow status |
| `meta_title` | VARCHAR(70) | YES | NULL | SEO meta title |
| `meta_description` | VARCHAR(160) | YES | NULL | SEO meta description |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `INDEX(is_popular, display_order)`, `INDEX(status)`

---

### 5.2 `universities`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(300) | NO | — | University name |
| `slug` | VARCHAR(350) | NO | — | SEO-friendly URL slug |
| `country_id` | UUID | NO | — | FK → `countries.id` |
| `city` | VARCHAR(100) | YES | NULL | City location |
| `description` | TEXT | YES | NULL | Rich text overview |
| `history` | TEXT | YES | NULL | University history |
| `academic_strengths` | TEXT | YES | NULL | Academic strengths |
| `facilities` | TEXT | YES | NULL | Campus facilities |
| `logo_url` | VARCHAR(500) | YES | NULL | University logo URL |
| `cover_image_url` | VARCHAR(500) | YES | NULL | Cover image URL |
| `website_url` | VARCHAR(500) | YES | NULL | Official website |
| `is_featured` | BOOLEAN | NO | `false` | Featured university flag |
| `status` | VARCHAR(20) | NO | `'draft'` | Workflow status |
| `meta_title` | VARCHAR(70) | YES | NULL | SEO meta title |
| `meta_description` | VARCHAR(160) | YES | NULL | SEO meta description |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `INDEX(country_id)`, `INDEX(status)`, `INDEX(is_featured)`

---

### 5.3 `university_programs`

International programs with test score requirements.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `university_id` | UUID | NO | — | FK → `universities.id` ON DELETE CASCADE |
| `name` | VARCHAR(200) | NO | — | Program name |
| `slug` | VARCHAR(250) | NO | — | URL slug |
| `level` | VARCHAR(30) | NO | — | Enum: `UG`, `PG`, `PhD`, `Diploma` |
| `stream_id` | UUID | YES | NULL | FK → `streams.id` (for stream-based discovery) |
| `duration` | VARCHAR(50) | YES | NULL | Program duration |
| `description` | TEXT | YES | NULL | Program description |
| `eligibility` | TEXT | YES | NULL | Academic eligibility |
| `test_scores` | JSONB | YES | NULL | E.g., `{"IELTS": {"min": 6.5}, "GRE": {"min": 310}}` |
| `tuition_fee` | DECIMAL(12,2) | YES | NULL | Annual tuition |
| `fee_currency` | VARCHAR(3) | YES | `'USD'` | Currency code |
| `application_deadline` | DATE | YES | NULL | Application deadline |
| `intake_period` | VARCHAR(30) | YES | NULL | Enum: `Fall`, `Spring`, `Summer`, `Rolling` |
| `status` | VARCHAR(20) | NO | `'draft'` | Workflow status |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `INDEX(university_id)`, `INDEX(stream_id)`, `INDEX(level)`, `INDEX(application_deadline)`

---

### 5.4 `scholarships`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `title` | VARCHAR(200) | NO | — | Scholarship name |
| `slug` | VARCHAR(250) | NO | — | URL slug |
| `description` | TEXT | YES | NULL | Rich text description |
| `eligibility` | TEXT | YES | NULL | Eligibility requirements |
| `amount` | VARCHAR(100) | YES | NULL | E.g., 'Full Tuition' or '₹50,000' |
| `provider_name` | VARCHAR(200) | YES | NULL | Offering organization |
| `provider_type` | VARCHAR(30) | YES | NULL | Enum: `Institution`, `Government`, `Private`, `NGO` |
| `funding_type` | VARCHAR(30) | YES | NULL | Enum: `Fully Funded`, `Partial` |
| `application_deadline` | DATE | YES | NULL | Application deadline |
| `application_url` | VARCHAR(500) | YES | NULL | External application URL |
| `country_id` | UUID | YES | NULL | FK → `countries.id` |
| `level` | VARCHAR(30) | YES | NULL | Enum: `UG`, `PG`, `PhD` |
| `field_of_study` | VARCHAR(200) | YES | NULL | Applicable field(s) |
| `status` | VARCHAR(20) | NO | `'active'` | Enum: `active`, `inactive` |
| `meta_title` | VARCHAR(70) | YES | NULL | SEO meta title |
| `meta_description` | VARCHAR(160) | YES | NULL | SEO meta description |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `INDEX(country_id)`, `INDEX(provider_type)`, `INDEX(status)`, `INDEX(application_deadline)`

---

### 5.5 Scholarship Junction Tables

**`scholarship_colleges`**: `(scholarship_id UUID, college_id UUID)` — PK: composite  
**`scholarship_courses`**: `(scholarship_id UUID, course_id UUID)` — PK: composite  
**`scholarship_universities`**: `(scholarship_id UUID, university_id UUID)` — PK: composite

---

## 6. Dynamic Attributes (EAV Layer)

> Admin-configurable attribute groups for colleges and courses.  
> Fixed columns handle known attributes (type, level, approval_body, etc.).  
> EAV handles admin-defined dynamic attributes.

### 6.1 `attribute_groups`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `entity_type` | VARCHAR(20) | NO | — | Enum: `college`, `course` |
| `name` | VARCHAR(100) | NO | — | Group name (e.g., Facilities, Accreditation Type) |
| `description` | VARCHAR(300) | YES | NULL | Human-readable description |
| `attribute_type` | VARCHAR(20) | NO | — | Enum: `single_select`, `multi_select`, `boolean` |
| `is_filterable` | BOOLEAN | NO | `false` | Exposed as public filter |
| `display_order` | INT | NO | `0` | Ordering |
| `is_active` | BOOLEAN | NO | `true` | Active/Inactive |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `INDEX(entity_type, is_active, display_order)`, `INDEX(is_filterable)`

---

### 6.2 `attribute_values`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `group_id` | UUID | NO | — | FK → `attribute_groups.id` ON DELETE CASCADE |
| `label` | VARCHAR(100) | NO | — | Display label |
| `code` | VARCHAR(100) | NO | — | URL-safe slug code |
| `display_order` | INT | NO | `0` | Ordering within group |
| `is_active` | BOOLEAN | NO | `true` | Active/Inactive |

**Indexes:** `UNIQUE(group_id, code)`, `INDEX(group_id, is_active, display_order)`

---

### 6.3 `entity_attributes`

Assignments of attribute values to colleges or courses.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `entity_type` | VARCHAR(20) | NO | — | Enum: `college`, `course` |
| `entity_id` | UUID | NO | — | FK → `colleges.id` or `courses.id` |
| `attribute_group_id` | UUID | NO | — | FK → `attribute_groups.id` |
| `attribute_value_id` | UUID | NO | — | FK → `attribute_values.id` |

**Indexes:** `UNIQUE(entity_type, entity_id, attribute_value_id)`, `INDEX(attribute_group_id, attribute_value_id)` — critical for filter queries

---

## 7. Lead Generation & Enquiries

### 7.1 `leads`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `full_name` | VARCHAR(200) | NO | — | Student name |
| `mobile` | VARCHAR(15) | NO | — | Verified mobile number |
| `email` | VARCHAR(255) | YES | NULL | Email address |
| `city` | VARCHAR(100) | YES | NULL | Student city |
| `state` | VARCHAR(100) | YES | NULL | Student state |
| `user_id` | UUID | YES | NULL | FK → `users.id` (if logged in) |
| `source_page_url` | VARCHAR(500) | NO | — | Page URL where lead was submitted |
| `source_type` | VARCHAR(30) | NO | — | Enum: `category`, `college`, `course`, `exam`, `blog`, `news`, `study_abroad` |
| `stream_id` | UUID | YES | NULL | FK → `streams.id` |
| `course_id` | UUID | YES | NULL | FK → `courses.id` |
| `substream_id` | UUID | YES | NULL | FK → `substreams.id` |
| `college_id` | UUID | YES | NULL | FK → `colleges.id` |
| `exam_id` | UUID | YES | NULL | FK → `exams.id` |
| `university_id` | UUID | YES | NULL | FK → `universities.id` |
| `country_id` | UUID | YES | NULL | FK → `countries.id` |
| `preferred_course` | VARCHAR(200) | YES | NULL | User-entered preferred course text |
| `device_type` | VARCHAR(20) | YES | NULL | Enum: `mobile`, `desktop`, `tablet` |
| `status` | VARCHAR(20) | NO | `'new'` | Enum: `new`, `contacted`, `in_progress`, `converted`, `closed`, `invalid`, `junk` |
| `crm_push_status` | VARCHAR(20) | YES | NULL | Enum: `pending`, `pushed`, `failed` |
| `crm_push_at` | TIMESTAMPTZ | YES | NULL | When pushed to CRM |
| `crm_reference_id` | VARCHAR(100) | YES | NULL | External CRM record ID |
| `is_duplicate` | BOOLEAN | NO | `false` | Duplicate detection flag |
| `notes` | TEXT | YES | NULL | Internal notes |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Submission timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last status update |

**Indexes:** `INDEX(mobile)`, `INDEX(status)`, `INDEX(source_type)`, `INDEX(college_id)`, `INDEX(created_at DESC)`, `INDEX(crm_push_status)`, `INDEX(user_id)`

---

## 8. CMS Content

### 8.1 `blog_categories`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(100) | NO | — | Category name |
| `slug` | VARCHAR(120) | NO | — | URL slug |
| `description` | TEXT | YES | NULL | Category description |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |

**Indexes:** `UNIQUE(slug)`

---

### 8.2 `blogs`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `title` | VARCHAR(200) | NO | — | Blog title |
| `slug` | VARCHAR(250) | NO | — | SEO-friendly URL slug |
| `category_id` | UUID | YES | NULL | FK → `blog_categories.id` |
| `author_id` | UUID | NO | — | FK → `users.id` |
| `featured_image_url` | VARCHAR(500) | YES | NULL | Featured image URL |
| `featured_image_alt` | VARCHAR(150) | YES | NULL | Image alt text |
| `excerpt` | VARCHAR(300) | YES | NULL | Short summary |
| `content` | TEXT | NO | — | Rich text content |
| `tags` | TEXT[] | YES | NULL | Array of tags |
| `status` | VARCHAR(20) | NO | `'draft'` | Workflow status |
| `published_at` | TIMESTAMPTZ | YES | NULL | Publication timestamp |
| `publish_scheduled_at` | TIMESTAMPTZ | YES | NULL | Scheduled publish datetime |
| `current_version` | INT | NO | `1` | Version counter |
| `meta_title` | VARCHAR(70) | YES | NULL | SEO meta title |
| `meta_description` | VARCHAR(160) | YES | NULL | SEO meta description |
| `meta_keywords` | TEXT[] | YES | NULL | SEO keywords |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `INDEX(category_id)`, `INDEX(author_id)`, `INDEX(status)`, `INDEX(published_at DESC)`, `INDEX(publish_scheduled_at) WHERE status = 'approved'`

---

### 8.3 `news_categories` / `news`

Structurally identical to `blog_categories` / `blogs` with additions:
- Separate `news_categories` taxonomy
- Additional field: `expires_at TIMESTAMPTZ` for auto-archival

---

### 8.4 `faqs`

Centralized FAQ management with tag-based distribution.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `question` | VARCHAR(300) | NO | — | FAQ question |
| `answer` | TEXT | NO | — | Rich text answer |
| `module` | VARCHAR(30) | NO | — | Enum: `college`, `course`, `exam`, `stream`, `blog`, `category_page` |
| `entity_id` | UUID | YES | NULL | FK → specific entity (nullable for global FAQs) |
| `tags` | TEXT[] | YES | NULL | Tags for cross-page distribution |
| `display_order` | INT | NO | `0` | Ordering within entity |
| `is_active` | BOOLEAN | NO | `true` | Active/Inactive |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `INDEX(module, entity_id, display_order)`, `GIN(tags)`, `INDEX(is_active)`

---

### 8.5 `static_pages`

Custom pages: About Us, Privacy Policy, Terms & Conditions, Contact, etc.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `title` | VARCHAR(200) | NO | — | Page title |
| `slug` | VARCHAR(250) | NO | — | URL slug (unique) |
| `content` | TEXT | NO | — | Rich text content |
| `status` | VARCHAR(20) | NO | `'draft'` | Workflow status |
| `meta_title` | VARCHAR(70) | YES | NULL | SEO meta title |
| `meta_description` | VARCHAR(160) | YES | NULL | SEO meta description |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`

---

### 8.6 `author_profiles`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | — | FK → `users.id` (UNIQUE) |
| `bio` | TEXT | YES | NULL | Short author biography |
| `avatar_url` | VARCHAR(500) | YES | NULL | Author picture |
| `social_links` | JSONB | YES | NULL | Social media links |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(user_id)`

---

## 9. Locations (Master Data)

### 9.1 `states`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(100) | NO | — | State name |
| `slug` | VARCHAR(120) | NO | — | URL slug |
| `code` | VARCHAR(10) | YES | NULL | State code (e.g., MH, DL, KA) |
| `is_active` | BOOLEAN | NO | `true` | Active flag |

**Indexes:** `UNIQUE(slug)`, `UNIQUE(code)`

---

### 9.2 `cities`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `state_id` | UUID | NO | — | FK → `states.id` |
| `name` | VARCHAR(100) | NO | — | City name |
| `slug` | VARCHAR(120) | NO | — | URL slug |
| `is_popular` | BOOLEAN | NO | `false` | Popular city flag for navigation |
| `is_active` | BOOLEAN | NO | `true` | Active flag |

**Indexes:** `UNIQUE(slug)`, `INDEX(state_id)`, `INDEX(is_popular)`

---

## 10. Category Pages & SEO

### 10.1 `category_pages`

Admin-managed SEO content for URL combinations (e.g., `/engineering-colleges-in-delhi`).

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `stream_id` | UUID | YES | NULL | FK → `streams.id` |
| `substream_id` | UUID | YES | NULL | FK → `substreams.id` |
| `course_id` | UUID | YES | NULL | FK → `courses.id` |
| `state_id` | UUID | YES | NULL | FK → `states.id` |
| `city_id` | UUID | YES | NULL | FK → `cities.id` |
| `page_title` | VARCHAR(200) | NO | — | Page heading |
| `slug` | VARCHAR(300) | NO | — | Auto-generated URL path |
| `content` | TEXT | YES | NULL | SEO content body |
| `status` | VARCHAR(20) | NO | `'draft'` | Workflow status |
| `meta_title` | VARCHAR(70) | YES | NULL | SEO meta title |
| `meta_description` | VARCHAR(160) | YES | NULL | SEO meta description |
| `meta_keywords` | TEXT[] | YES | NULL | SEO keywords |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(slug)`, `UNIQUE(stream_id, substream_id, course_id, state_id, city_id)`

---

## 11. Advertisements

### 11.1 `advertisers`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(200) | NO | — | Advertiser name |
| `contact_email` | VARCHAR(255) | YES | NULL | Contact email |
| `contact_phone` | VARCHAR(20) | YES | NULL | Contact phone |
| `status` | VARCHAR(20) | NO | `'active'` | Enum: `active`, `inactive` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |

---

### 11.2 `ad_campaigns`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `advertiser_id` | UUID | NO | — | FK → `advertisers.id` |
| `name` | VARCHAR(200) | NO | — | Campaign name |
| `ad_type` | VARCHAR(30) | NO | — | Enum: `banner`, `featured_college`, `sponsored_listing` |
| `creative_url` | VARCHAR(500) | YES | NULL | Image or HTML banner URL |
| `target_url` | VARCHAR(500) | YES | NULL | Click-through URL |
| `page_template` | VARCHAR(50) | NO | — | Enum: `homepage`, `category`, `college_listing`, `blog`, `search_results` |
| `slot_position` | VARCHAR(50) | YES | NULL | Ad slot identifier |
| `target_streams` | UUID[] | YES | NULL | Stream IDs for targeting |
| `target_courses` | UUID[] | YES | NULL | Course IDs for targeting |
| `priority` | INT | NO | `0` | Display priority |
| `agreed_revenue` | DECIMAL(12,2) | YES | NULL | Agreed campaign revenue |
| `start_date` | DATE | NO | — | Campaign start |
| `end_date` | DATE | NO | — | Campaign end |
| `status` | VARCHAR(20) | NO | `'draft'` | Enum: `draft`, `active`, `paused`, `completed`, `archived` |
| `created_by` | UUID | NO | — | FK → `users.id` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `INDEX(advertiser_id)`, `INDEX(status, start_date, end_date)`, `INDEX(page_template, slot_position)`

---

## 12. Navigation Management

### 12.1 `navigation_items`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `section` | VARCHAR(30) | NO | — | Enum: `mega_menu_left`, `mega_menu_right`, `footer`, `banner` |
| `parent_id` | UUID | YES | NULL | FK → `navigation_items.id` (self-referencing) |
| `label` | VARCHAR(100) | NO | — | Display label |
| `url` | VARCHAR(500) | YES | NULL | Navigation target URL |
| `entity_type` | VARCHAR(30) | YES | NULL | Linked entity type |
| `entity_id` | UUID | YES | NULL | FK → linked entity |
| `display_order` | INT | NO | `0` | Ordering |
| `is_active` | BOOLEAN | NO | `true` | Active/Inactive |
| `is_locked` | BOOLEAN | NO | `false` | Super Admin lock flag |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `INDEX(section, parent_id, display_order)`, `INDEX(is_active)`

---

### 12.2 `announcement_banners`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `message` | VARCHAR(200) | NO | — | Banner text |
| `link_url` | VARCHAR(500) | YES | NULL | Optional click URL |
| `bg_color` | VARCHAR(7) | NO | `'#1B4F72'` | Background hex color |
| `text_color` | VARCHAR(7) | NO | `'#FFFFFF'` | Text hex color |
| `priority` | INT | NO | `0` | Highest priority wins |
| `show_dismiss` | BOOLEAN | NO | `true` | Show dismiss button |
| `start_date` | TIMESTAMPTZ | NO | — | Visibility start |
| `end_date` | TIMESTAMPTZ | NO | — | Visibility end |
| `is_active` | BOOLEAN | NO | `true` | Active flag |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Record creation timestamp |

**Indexes:** `INDEX(is_active, start_date, end_date, priority DESC)`

---

## 13. User Dashboard & Interactions

### 13.1 `saved_colleges`

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | FK → `users.id` ON DELETE CASCADE |
| `college_id` | UUID | FK → `colleges.id` ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | When shortlisted |

**Primary Key:** `(user_id, college_id)`

### 13.2 `saved_courses`

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | FK → `users.id` ON DELETE CASCADE |
| `course_id` | UUID | FK → `courses.id` ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | When saved |

**Primary Key:** `(user_id, course_id)`

---

### 13.3 `reviews`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | — | FK → `users.id` |
| `entity_type` | VARCHAR(20) | NO | — | Enum: `college`, `course` |
| `entity_id` | UUID | NO | — | FK → target entity |
| `rating` | SMALLINT | NO | — | Rating 1-5 |
| `comment` | TEXT | YES | NULL | Review text |
| `status` | VARCHAR(20) | NO | `'pending'` | Enum: `pending`, `approved`, `rejected` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Submission timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update |

**Indexes:** `UNIQUE(user_id, entity_type, entity_id)`, `INDEX(entity_type, entity_id, status)`, `INDEX(rating)`

---

### 13.4 `notifications`

In-app notifications (bell icon).

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | — | FK → `users.id` ON DELETE CASCADE |
| `title` | VARCHAR(200) | NO | — | Notification title |
| `message` | TEXT | NO | — | Notification body |
| `type` | VARCHAR(30) | YES | NULL | Enum: `enquiry_confirm`, `college_update`, `system_alert`, `workflow` |
| `link_url` | VARCHAR(500) | YES | NULL | Deep link URL |
| `is_read` | BOOLEAN | NO | `false` | Read/unread status |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Creation timestamp |

**Indexes:** `INDEX(user_id, is_read, created_at DESC)`

---

## 14. System Settings

### 14.1 `system_settings`

Key-value store for all platform configuration.

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `group_name` | VARCHAR(30) | NO | — | Enum: `general`, `email`, `integration`, `security`, `maintenance` |
| `key` | VARCHAR(100) | NO | — | Setting key (e.g., `platform_name`, `smtp_host`, `session_timeout`) |
| `value` | TEXT | NO | — | Setting value (text, parsed by application) |
| `is_sensitive` | BOOLEAN | NO | `false` | If true, value encrypted at rest |
| `updated_by` | UUID | YES | NULL | FK → `users.id` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update timestamp |

**Indexes:** `UNIQUE(group_name, key)`

---

### 14.2 `ip_blocklist`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `ip_address` | INET | NO | — | Blocked IP or CIDR range |
| `reason` | VARCHAR(300) | YES | NULL | Reason for blocking |
| `blocked_by` | UUID | NO | — | FK → `users.id` (Super Admin) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Block timestamp |

**Indexes:** `UNIQUE(ip_address)`

---

## 15. Bug & Incident Tracking

### 15.1 `issues`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `title` | VARCHAR(300) | NO | — | Issue title |
| `description` | TEXT | NO | — | Issue description |
| `severity` | VARCHAR(20) | NO | — | Enum: `critical`, `high`, `medium`, `low` |
| `module_affected` | VARCHAR(50) | YES | NULL | Module name |
| `status` | VARCHAR(20) | NO | `'open'` | Enum: `open`, `in_progress`, `in_qa`, `resolved`, `closed` |
| `reported_by` | UUID | NO | — | FK → `users.id` |
| `assigned_to` | UUID | YES | NULL | FK → `users.id` |
| `resolution_notes` | TEXT | YES | NULL | Resolution details |
| `resolved_at` | TIMESTAMPTZ | YES | NULL | Resolution timestamp |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update |

**Indexes:** `INDEX(severity, status)`, `INDEX(assigned_to)`, `INDEX(created_at)`

---

### 15.2 `change_requests`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `title` | VARCHAR(300) | NO | — | Change request title |
| `description` | TEXT | NO | — | Change details |
| `requested_by` | UUID | NO | — | FK → `users.id` |
| `impact_scope` | TEXT | YES | NULL | Scope impact assessment |
| `impact_timeline` | TEXT | YES | NULL | Timeline impact |
| `impact_cost` | TEXT | YES | NULL | Cost impact |
| `approval_status` | VARCHAR(20) | NO | `'pending'` | Enum: `pending`, `approved`, `rejected` |
| `approved_by` | UUID | YES | NULL | FK → `users.id` (Super Admin) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last update |

---

### 15.3 `brochure_downloads`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `college_id` | UUID | NO | — | FK → `colleges.id` |
| `user_id` | UUID | YES | NULL | FK → `users.id` (if logged in) |
| `ip_address` | INET | YES | NULL | Client IP |
| `user_agent` | TEXT | YES | NULL | Browser info |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Download timestamp |

**Indexes:** `INDEX(college_id)`, `INDEX(created_at)`

---

### 15.4 `dashboard_widget_layouts`

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | — | FK → `users.id` (UNIQUE) |
| `layout` | JSONB | NO | — | Widget positions, visibility, sizes |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Last layout change |

**Indexes:** `UNIQUE(user_id)`

---

# PART B: MongoDB Collections

> All collections use ObjectId as `_id`.  
> UUID references to PostgreSQL entities stored as strings.  
> All timestamps are ISODate (UTC).

---

## 1. `audit_logs`

Immutable record of every state-changing action. Cannot be edited/deleted by any role.

```json
{
  "_id": "ObjectId",
  "user_id": "UUID string",
  "user_name": "String — snapshot at time of action",
  "user_role": "String — role at time of action",
  "action": "String — create | update | delete | submit | approve | reject | publish | archive | login | logout | export | password_reset",
  "entity_type": "String — College | Course | Exam | Blog | News | Lead | Ad | User | SEO | Navigation | Setting",
  "entity_id": "String — PK of affected record",
  "entity_name": "String — snapshot of entity name",
  "old_value": "Object | null — state before change",
  "new_value": "Object | null — state after change",
  "ip_address": "String",
  "metadata": "Object — extra context (force_publish_reason, bulk_operation_ids, etc.)",
  "created_at": "ISODate"
}
```

**Indexes:**
- `{ created_at: -1 }`
- `{ user_id: 1, created_at: -1 }`
- `{ entity_type: 1, entity_id: 1 }`
- `{ action: 1 }`
- TTL index on `created_at` (default 730 days)

---

## 2. `content_versions`

Full JSON snapshot on each save. Supports version history, comparison, and rollback.

```json
{
  "_id": "ObjectId",
  "entity_type": "String — college | course | exam | blog | news | scholarship | category_page | static_page",
  "entity_id": "UUID string — FK to PostgreSQL entity",
  "version_number": "Number — sequential within entity",
  "status": "String — status at time of snapshot",
  "content_snapshot": "Object — complete entity state as JSON",
  "author_id": "UUID string",
  "author_name": "String — snapshot",
  "change_summary": "String | null — optional summary",
  "created_at": "ISODate"
}
```

**Indexes:**
- `{ entity_type: 1, entity_id: 1, version_number: -1 }` (unique compound)
- `{ entity_id: 1, created_at: -1 }`

**Retention:** Max 20 versions per entity. Application-level cleanup archives older versions.

---

## 3. `search_logs`

Every search query for analytics, trending keywords, and autocomplete optimization.

```json
{
  "_id": "ObjectId",
  "query": "String — raw search text",
  "normalized_query": "String — lowercased, trimmed",
  "result_count": "Number",
  "result_types": ["String — entity types in results"],
  "selected_result": {
    "entity_type": "String",
    "entity_id": "String",
    "position": "Number — position in results"
  },
  "user_id": "String | null",
  "session_id": "String",
  "device_type": "String — mobile | desktop | tablet",
  "ip_address": "String",
  "created_at": "ISODate"
}
```

**Indexes:**
- `{ created_at: -1 }`
- `{ normalized_query: 1, created_at: -1 }`
- `{ user_id: 1 }` (sparse)

---

## 4. `ad_events`

High-volume ad impression and click tracking.

```json
{
  "_id": "ObjectId",
  "campaign_id": "UUID string — FK to ad_campaigns",
  "event_type": "String — impression | click",
  "page_url": "String",
  "page_template": "String — homepage | category | college_listing | etc.",
  "slot_position": "String",
  "user_id": "String | null",
  "session_id": "String",
  "ip_address": "String",
  "user_agent": "String",
  "referrer": "String | null",
  "created_at": "ISODate"
}
```

**Indexes:**
- `{ campaign_id: 1, event_type: 1, created_at: -1 }`
- `{ created_at: -1 }`
- `{ page_template: 1, event_type: 1 }`

---

## 5. `user_activity`

Behavioral tracking for analytics and personalization.

```json
{
  "_id": "ObjectId",
  "user_id": "String | null",
  "session_id": "String",
  "action": "String — page_view | college_view | course_view | exam_view | enquiry_submit | shortlist_add | shortlist_remove | brochure_download | search | filter_apply",
  "entity_type": "String | null",
  "entity_id": "String | null",
  "page_url": "String",
  "referrer": "String | null",
  "device_type": "String",
  "ip_address": "String",
  "metadata": "Object — { filters_applied: {...}, scroll_depth: 75, time_on_page: 45 }",
  "created_at": "ISODate"
}
```

**Indexes:**
- `{ user_id: 1, created_at: -1 }` (sparse)
- `{ action: 1, created_at: -1 }`
- `{ entity_type: 1, entity_id: 1 }`
- `{ session_id: 1 }`

---

## 6. `security_events`

Authentication, access events, and OTP audit trail.

```json
{
  "_id": "ObjectId",
  "event_type": "String — login_success | login_failure | account_lockout | password_reset | otp_request | otp_verify_success | otp_verify_failure | permission_change | role_change | hard_delete | two_fa_bypass",
  "user_id": "String | null",
  "actor_id": "String | null — who performed the action",
  "ip_address": "String",
  "user_agent": "String",
  "metadata": "Object — { mobile: '+91...', otp_channel: 'sms', failure_reason: 'invalid_otp', attempt_count: 3 }",
  "created_at": "ISODate"
}
```

**Indexes:**
- `{ event_type: 1, created_at: -1 }`
- `{ ip_address: 1, event_type: 1, created_at: -1 }` (brute-force detection)
- `{ user_id: 1, created_at: -1 }` (sparse)

---

## 7. `email_delivery_logs`

All outbound email/SMS/WhatsApp notifications with delivery status.

```json
{
  "_id": "ObjectId",
  "channel": "String — email | sms | whatsapp",
  "template_name": "String — workflow_submit | lead_confirmation | password_reset | etc.",
  "recipient_id": "String | null — FK to users",
  "recipient_address": "String — email or phone",
  "subject": "String | null — null for SMS",
  "body_preview": "String — first 200 chars",
  "status": "String — queued | sent | delivered | failed | bounced",
  "provider_response": "Object | null — raw gateway response",
  "error_message": "String | null",
  "sent_at": "ISODate | null",
  "delivered_at": "ISODate | null",
  "created_at": "ISODate"
}
```

**Indexes:**
- `{ recipient_id: 1, created_at: -1 }` (sparse)
- `{ template_name: 1, status: 1 }`
- `{ status: 1, created_at: -1 }`
- `{ channel: 1, created_at: -1 }`

---

## 8. `analytics_mirror`

Cached GA4 data for dashboard widgets.

```json
{
  "_id": "ObjectId",
  "report_type": "String — daily_traffic | page_performance | device_breakdown | geo_breakdown",
  "date": "ISODate",
  "dimensions": "Object — { page_url: '/...', device: 'mobile', country: 'IN', state: 'MH' }",
  "metrics": "Object — { sessions: 1500, pageviews: 3200, bounce_rate: 0.42, avg_session_duration: 125 }",
  "synced_at": "ISODate"
}
```

**Indexes:**
- `{ report_type: 1, date: -1 }`
- `{ date: -1 }`

---

# PART C: Redis Cache Strategy

## 1. OTP Verification

| Property | Value |
|----------|-------|
| **Key** | `otp:{mobile_or_email}:{purpose}` |
| **Value** | `{ code: '123456', attempts: 0, created_at: timestamp }` |
| **TTL** | 300 seconds (5 minutes) |
| **Purpose** | `registration`, `login`, `lead_verify`, `password_reset` |
| **Rate Limit** | `otp_rate:{mobile_or_email}` — TTL 60s, max 3/min |

## 2. Session Cache

| Property | Value |
|----------|-------|
| **Key** | `session:{user_id}:{session_id}` |
| **Value** | `{ role, permissions[], ip_address, created_at }` |
| **TTL** | Matches JWT access token TTL (default 30 min) |

## 3. Published Content Cache

| Property | Value |
|----------|-------|
| **Key** | `content:{entity_type}:{slug}` |
| **Value** | Full JSON response for detail page |
| **TTL** | 30 minutes (configurable) |
| **Invalidation** | On publish, update, or archive events |

## 4. Navigation Data Cache

| Property | Value |
|----------|-------|
| **Key** | `nav:{section}` |
| **Value** | Compiled mega menu / footer JSON |
| **TTL** | 30 minutes (Super Admin configurable) |
| **Invalidation** | On navigation changes or manual flush |

## 5. Filter Facet Cache

| Property | Value |
|----------|-------|
| **Key** | `filters:{entity_type}:{category_params_hash}` |
| **Value** | Aggregated filter facet counts |
| **TTL** | 15 minutes |
| **Invalidation** | On college/course publish or attribute changes |

## 6. Search Autocomplete Cache

| Property | Value |
|----------|-------|
| **Key** | `search:suggest:{prefix}` |
| **Value** | Top 10 suggestions |
| **TTL** | 10 minutes |

## 7. Rate Limiting

| Property | Value |
|----------|-------|
| **Key** | `rate:{endpoint}:{ip_or_user_id}` |
| **Value** | Request count |
| **TTL** | Window duration (e.g., 60 seconds) |
| **Used for** | API rate limiting, OTP throttling, login attempts |

---

# PART D: Cross-Cutting Concerns

## Content Publishing Workflow (All Content Types)

All publishable entities follow this state machine:

```
Draft → Review → Approved → Published
                ↘ Rejected → Draft
Published → Archived → Draft (restore)
```

**State transitions:**
- `Draft → Review`: Writer/College Rep submits
- `Review → Approved`: Editor approves
- `Review → Rejected`: Editor rejects (comment mandatory)
- `Approved → Published`: Admin publishes (or schedules)
- `Published → Archived`: Admin archives
- `Archived → Draft`: Admin restores
- `Any → Draft`: Admin/Editor force-reset

## Soft Delete Strategy

- Entities with workflow use `status = 'archived'` (no physical delete)
- Hard delete: Super Admin only, two-step confirmation, full audit log with JSON snapshot
- User deactivation retains all data; only hard delete removes permanently

## Elasticsearch Index Mappings

Mirror published PostgreSQL data for search. Index mappings:
- **colleges**: name, slug, city, state, streams, courses, college_type, description
- **courses**: name, slug, level, stream, substream, description
- **exams**: name, slug, exam_type, conducting_body
- **locations**: city name, state name

Reindex triggers: publish, update, archive events. Full/partial reindex via Super Admin.

## Naming Conventions

- PostgreSQL tables/columns: `snake_case`
- MongoDB collections: `snake_case`
- Primary keys: UUID via `gen_random_uuid()`
- Timestamps: `TIMESTAMPTZ` (PostgreSQL), `ISODate` (MongoDB), always UTC
- Booleans: prefix `is_` or `has_`
- Junction tables: `entity1_entity2`
- Enums: `VARCHAR` with app-level validation

## Migration & Seeding Order

1. Seed `states` and `cities` (master data)
2. Seed `streams` and `substreams` (taxonomy)
3. Seed `roles` and `permissions` (6 default roles)
4. Create Super Admin user
5. Import courses via Smart Global Upload
6. Import colleges via Smart Global Upload (as Draft, assigned to Super Admin)
7. Configure system settings
