# CodeQuest

**CodeQuest** is a full-stack, gamified coding and assessment platform designed to help users practice programming through interactive challenges, assessments, real-time code execution, automated test-case validation, progress tracking, leaderboards, and AI-powered learning assistance.

The platform provides separate capabilities for **Users, SMEs, and Administrators**, while keeping the coding experience accessible and engaging.

---

## 🚀 Features

### 👤 User

* User registration and login
* Secure JWT-based authentication
* Interactive coding challenges
* Galaxy-based challenge navigation
* HTML, CSS, JavaScript, and React challenges
* Online code editor with live execution
* Challenge timer
* Automated test-case validation
* Challenge submissions
* Code of the Day
* Daily streak tracking
* Assessments
* Global leaderboard
* Performance tracking
* Progress analytics
* AI-powered coding guidance
* Step-by-step hints and pseudocode-based assistance
* Challenge completion tracking

---

### 🧑‍💻 SME

* Create coding challenges
* Edit existing challenges
* Clone challenges
* View challenge details
* Configure challenge difficulty and technology
* Add and manage test cases
* Generate test cases using AI
* Check test-case accuracy
* Configure starter code
* Manage challenge publication
* View challenge performance
* Analyze submissions and scores
* Access reports and analytics
* Test-case validation guide

---

### 🛠️ Admin

* User management
* View and search users
* Activate/deactivate users
* Assign and manage user roles
* Manage Admin, SME, and User accounts
* Platform-wide challenge management
* View platform analytics
* View reports
* Monitor challenge performance
* Monitor user performance
* Download reports in Excel format
* Application logging and monitoring

---

## 🧩 Challenge Types

CodeQuest supports multiple technology-based coding challenges:

* HTML
* HTML + CSS
* HTML + CSS + JavaScript
* JavaScript
* React

Each challenge can contain technology-specific test cases that validate the expected behavior of the submitted solution.

---

## 🧪 Test Case Validation

Challenges use automated test-case validation to evaluate user submissions.

The validation system supports:

* DOM validation
* Text validation
* Element validation
* JavaScript behavior validation
* User interaction validation
* React component behavior
* React props and state-based behavior
* Event handling
* Runtime validation

The execution system also includes timeout handling to prevent infinite loops or continuously running code from blocking the application.

---

## 🤖 AI Features

CodeQuest integrates organization-hosted AI services for learning assistance.

AI capabilities include:

### AI Coding Assistant

The assistant guides users by:

* Breaking problems into steps
* Providing hints
* Explaining concepts
* Providing pseudocode
* Helping users understand errors

The assistant is designed **not to provide complete solutions or direct copy-paste code**.

### AI Test Case Generation

SMEs can generate relevant test cases based on:

* Challenge description
* Challenge type
* Difficulty
* Expected behavior

### Test Case Accuracy Analysis

SMEs can analyze whether manually created or AI-generated test cases appropriately cover the challenge requirements.

---

## 🏆 Leaderboard

CodeQuest provides a global leaderboard to encourage healthy competition.

Ranking considers factors such as:

* Score
* XP
* Challenge completion
* Completion time

Faster successful completion can be used as a tie-breaker when users have equivalent scores.

---

## 🔥 Code of the Day Streak

The Code of the Day feature tracks consecutive successful daily completions.

Example:

```text
Day 1 → Completed → Streak: 1
Day 2 → Completed → Streak: 2
Day 3 → Completed → Streak: 3
```

If a day is missed:

```text
Day 1 → Completed → 1
Day 2 → Missed
Day 3 → Streak resets
```

The streak is updated immediately after successful completion.

---

## 📊 Reports & Analytics

The platform provides analytics for users, SMEs, and administrators.

Reports can include:

* Challenge completion
* Submission statistics
* Scores
* XP
* Success rate
* Completion rate
* Time taken
* User performance
* Challenge performance
* Technology-wise statistics
* Difficulty-wise statistics

Reports can be exported in **Excel format**.

---

## 🔐 Authentication & Authorization

CodeQuest uses a simple authentication architecture.

### Authentication

```text
Email + Password
       ↓
Spring Security
       ↓
BCrypt Password Verification
       ↓
JWT Generation
       ↓
Authenticated Session
```

### Roles

The platform supports three roles:

```text
ADMIN
SME
USER
```

Users cannot select their role during registration.

New registrations are automatically assigned:

```text
Role: USER
Status: ACTIVE
```

Only an administrator can change a user's role.

---

## 👨‍💼 Default Administrator

On the first application startup, the system checks whether an administrator exists.

If no administrator exists, a default administrator account is created automatically.

```text
Email: admin@codequest.com
Role: ADMIN
Status: ACTIVE
```

The password is stored using BCrypt.

The initialization is idempotent, so restarting the application does not create duplicate administrators.

> For production deployment, replace the initial administrator credentials through a secure configuration/initialization process before exposing the application publicly.

---

# 🏗️ Architecture

```text
                     ┌─────────────────────┐
                     │       Users         │
                     │  Admin / SME / User │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │   React Frontend    │
                     │     Vite + CSS      │
                     └──────────┬──────────┘
                                │ REST API
                                ▼
                 ┌─────────────────────────────┐
                 │      Spring Boot API       │
                 ├─────────────────────────────┤
                 │ Controllers                 │
                 │ Services                    │
                 │ Repositories                │
                 │ Security                    │
                 │ Validation                  │
                 │ Reports                     │
                 │ AI Integration              │
                 └──────────────┬──────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
       ┌─────────────────┐             ┌─────────────────┐
       │    PostgreSQL   │             │ Organization AI │
       │    Database     │             │    Endpoint     │
       └─────────────────┘             └─────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* JavaScript
* Pure CSS
* HTML
* CSS
* React Router

## Backend

* Java 21
* Spring Boot
* Spring Web
* Spring Data JPA
* Spring Security
* JWT
* BCrypt
* Bean Validation
* Maven

## Database

* PostgreSQL
* Hibernate / JPA
* Flyway

## AI

* Organization-hosted AI endpoint
* Ollama-compatible inference API
* Environment-based model configuration

## Reporting

* Apache POI
* Excel export

## API Documentation

* OpenAPI
* Swagger

## Monitoring & Logging

* SLF4J
* Logback
* Spring Boot Actuator

---

# 📁 Project Structure

```text
CodeQuest/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── codequest/
│   │   │   │           ├── controller/
│   │   │   │           ├── service/
│   │   │   │           ├── repository/
│   │   │   │           ├── entity/
│   │   │   │           ├── dto/
│   │   │   │           ├── mapper/
│   │   │   │           ├── security/
│   │   │   │           ├── config/
│   │   │   │           ├── exception/
│   │   │   │           ├── validation/
│   │   │   │           └── ai/
│   │   │   │
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/
│   │   │           └── migration/
│   │   │
│   │   └── test/
│   │
│   └── pom.xml
│
└── README.md
```

---

# ⚙️ Prerequisites

Install the following:

* Java 21
* Maven 3.9+
* Node.js 18+
* npm
* PostgreSQL 14+

Verify:

```bash
java -version
mvn -version
node -version
npm -version
psql --version
```

---

# 🗄️ Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE codequest;
```

Configure the database connection through environment variables or the application's configuration.

Example:

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

Do not commit database credentials to Git.

---

# 🔐 Environment Configuration

Create the required environment configuration for your environment.

Typical configuration includes:

```text
DB_URL
DB_USERNAME
DB_PASSWORD

JWT_SECRET

AI_PROVIDER
AI_BASE_URL
AI_MODEL
AI_TIMEOUT

CORS_ALLOWED_ORIGINS
```

Never commit secrets, passwords, API keys, or private endpoints to the repository.

---

# 🚀 Running the Backend

Navigate to the backend:

```bash
cd backend
```

Run:

```bash
mvn spring-boot:run
```

Or build and run:

```bash
mvn clean package
java -jar target/codequest-*.jar
```

On first startup:

* Database migrations are applied.
* Required tables are created.
* Required initial data is initialized.
* Default administrator is created if no administrator exists.

---

# 💻 Running the Frontend

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will connect to the configured Spring Boot API.

---

# 🔄 Application Flow

### User Registration

```text
User
 ↓
Registration Page
 ↓
Spring Boot API
 ↓
Validation
 ↓
BCrypt Password Hashing
 ↓
PostgreSQL
 ↓
USER Account Created
```

### Login

```text
Email + Password
 ↓
Spring Security
 ↓
Database Verification
 ↓
JWT
 ↓
Dashboard
```

### Challenge Submission

```text
User
 ↓
Code Editor
 ↓
Execute Code
 ↓
Test Cases
 ↓
Validation Engine
 ↓
Pass / Fail
 ↓
Score + XP
 ↓
Leaderboard / Progress
```

---

# 🧑‍💻 Development Guidelines

Follow these principles when contributing:

* Use clean layered architecture.
* Keep controllers lightweight.
* Keep business logic inside services.
* Use DTOs for API communication.
* Use constructor-based dependency injection.
* Validate incoming requests.
* Avoid duplicated logic.
* Do not hardcode credentials or secrets.
* Do not expose sensitive information in logs.
* Use centralized exception handling.
* Use database transactions where required.
* Keep database migrations version controlled.
* Write meaningful logs for important operations.

---

# 🧪 Testing

Backend tests can be executed using:

```bash
mvn test
```

Frontend tests, if configured:

```bash
npm test
```

Before committing changes, verify:

* Authentication
* Registration
* Role authorization
* Challenge creation
* Challenge execution
* Test-case validation
* Submissions
* Leaderboards
* Assessments
* Code of the Day
* Reports
* AI features
* Admin functionality

---

# 📌 API Documentation

When enabled, API documentation is available through the application's Swagger/OpenAPI endpoint.

Use Swagger during development to inspect and test REST APIs.

---

# 🔒 Security Notes

The application follows basic security practices including:

* BCrypt password hashing
* JWT authentication
* Role-based authorization
* Backend validation
* Protected APIs
* Environment-based secrets
* Centralized exception handling
* Execution timeout protection

Never commit:

```text
.env
database passwords
JWT secrets
API keys
organization-only AI endpoints
```

to the repository.

---

# 🌱 Future Enhancements

Potential future improvements include:

* Additional programming languages
* Advanced coding sandboxes
* More assessment types
* Enhanced AI tutoring
* Personalized learning paths
* Social coding features
* Discussion forums
* Achievement badges
* Advanced anti-cheating mechanisms
* Cloud deployment
* Distributed code execution

---

# 📄 License

Add the appropriate project license here.

---

## CodeQuest

**Learn. Code. Solve. Compete.**

A gamified coding platform built to make programming practice more interactive, measurable, and engaging.