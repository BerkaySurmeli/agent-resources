# Development Capabilities

Claudia's technical skills and proven development experience.

## Frontend Development

### React & Next.js
- **App Router**: Modern Next.js 14+ patterns
- **Server Components**: Optimized rendering
- **Client Components**: Interactive UI
- **API Routes**: Backend-for-frontend

### Styling
- **Tailwind CSS**: Utility-first styling
- **CSS Modules**: Component-scoped styles
- **Styled Components**: When needed
- **Responsive Design**: Mobile-first approach

### State Management
- **React Context**: Simple state
- **Zustand**: Lightweight stores
- **TanStack Query**: Server state
- **Form handling**: React Hook Form

## Backend Development

### Python (FastAPI)
- **API Design**: RESTful endpoints
- **Authentication**: JWT, OAuth2
- **Database**: SQLModel integration
- **Background tasks**: Celery/ARQ

### Node.js
- **Express/Fastify**: API servers
- **WebSocket**: Real-time communication
- **Streaming**: Large data handling

### Database
- **PostgreSQL**: Primary database
- **SQLModel**: Python ORM
- **Migrations**: Alembic
- **Query optimization**: Indexing, analysis

## DevOps & Deployment

### Containerization
- **Docker**: Application containers
- **Docker Compose**: Multi-service setups
- **Multi-stage builds**: Optimized images

### Cloud Platforms
- **Railway**: Backend hosting
- **Vercel**: Frontend deployment
- **AWS**: S3, Lambda, RDS
- **Google Cloud**: When needed

### CI/CD
- **GitHub Actions**: Automated workflows
- **Testing**: Unit, integration, e2e
- **Deployment**: Staging → Production

## Proven Projects

### 1. Agent Resources Marketplace
**Stack**: Next.js + FastAPI + PostgreSQL + Stripe

**Features built**:
- Multi-tenant architecture
- Security scanning pipeline
- Listing approval workflow
- Admin dashboard
- Payment processing
- Email verification

**Complexity**: High  
**Timeline**: 3 weeks  
**Status**: Production

### 2. Trading Bot System
**Stack**: Python + PostgreSQL + Exchange APIs

**Features built**:
- Real-time market data
- Risk management
- Position tracking
- Automated execution
- Performance analytics

**Complexity**: High  
**Timeline**: 2 weeks  
**Status**: Running

### 3. Social Media Automation
**Stack**: Node.js + X API + Bluesky API

**Features built**:
- Cross-platform posting
- Content scheduling
- Engagement tracking
- Analytics dashboard

**Complexity**: Medium  
**Timeline**: 1 week  
**Status**: Production

## Development Workflow

### 1. Requirements
```
You: "Build a user authentication system"

Claudia: "Breaking this down:
- Registration with email verification
- Login with JWT tokens
- Password reset flow
- Session management
- Protected routes

Tech: NextAuth.js + PostgreSQL
Timeline: 2 days"
```

### 2. Architecture
- Database schema design
- API endpoint planning
- Component structure
- Security considerations

### 3. Implementation
- Database migrations
- Backend API
- Frontend components
- Integration testing

### 4. Deployment
- Staging environment
- Production deployment
- Monitoring setup
- Documentation

## Code Quality

### Standards
- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Conventional commits**: Git history

### Testing
- **Unit tests**: Jest/Vitest
- **Integration tests**: API testing
- **E2E tests**: Playwright/Cypress
- **Coverage**: 80%+ target

### Security
- **Input validation**: Zod schemas
- **SQL injection prevention**: Parameterized queries
- **XSS protection**: Output encoding
- **CSRF tokens**: Form protection

## Tools & Preferences

### IDE/Editor
- VS Code with extensions
- Vim for quick edits

### CLI Tools
- `gh` for GitHub
- `railway` for deployments
- `vercel` for frontend
- `psql` for database

### Debugging
- Chrome DevTools
- React DevTools
- PostgreSQL logs
- Application logs

## Common Patterns

### Database Pattern
```python
# SQLModel with relationships
class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True)
    posts: List["Post"] = Relationship(back_populates="author")

class Post(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    author_id: UUID = Field(foreign_key="user.id")
    author: User = Relationship(back_populates="posts")
```

### API Pattern
```python
# FastAPI with dependency injection
@router.post("/users", response_model=UserResponse)
async def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return user_service.create(db, data, current_user)
```

### Frontend Pattern
```typescript
// Next.js server component with data fetching
async function UserList() {
  const users = await fetchUsers();
  
  return (
    <ul>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </ul>
  );
}
```

## Performance Optimization

### Database
- Proper indexing
- Query optimization
- Connection pooling
- Caching strategies

### Frontend
- Code splitting
- Image optimization
- Lazy loading
- Bundle analysis

### Backend
- Async operations
- Rate limiting
- Request batching
- Response caching

## Error Handling

### Philosophy
- Fail fast, fail clearly
- Graceful degradation
- Comprehensive logging
- User-friendly messages

### Implementation
```python
try:
    result = risky_operation()
except SpecificError as e:
    logger.error(f"Specific error: {e}")
    raise HTTPException(status_code=400, detail="User-friendly message")
except Exception as e:
    logger.exception("Unexpected error")
    raise HTTPException(status_code=500, detail="Internal error")
```

---

*Development capabilities documentation*