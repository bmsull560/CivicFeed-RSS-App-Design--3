# CivicFeed RSS App Architectural Improvement Spec

## Problem Statement
The CivicFeed RSS App has several architectural friction points that reduce maintainability, testability, and clarity. Key issues include god modules, shallow data modules, global state leakage, persistence leakage, complex route handlers, and frontend-backend coupling.

## Goals
1. Increase module depth by hiding complex implementation behind simple interfaces
2. Reduce seam coupling through better encapsulation and dependency injection
3. Improve locality by keeping related state and behavior together
4. Enhance testability by reducing global state and direct dependencies
5. Focus module responsibilities following Single Responsibility Principle

## Recommended Improvement Path

### 1. Start with `server.ts` refactoring - extract route handlers to increase depth
- Extract route handlers from `backend/src/server.ts` into feature-specific modules
- Leave `server.ts` only for middleware and routing configuration
- Create `feedsRouter.ts`, `articlesRouter.ts`, and other focused router modules

### 2. Implement repository pattern for feeds data to reduce coupling
- Move feed data from `backend/src/feeds.ts` to database storage
- Create `feedsRepository.ts` with CRUD operations
- Define focused interfaces (FeedSummary, FeedDetail, FeedConfig) instead of monolithic Feed interface
- Hide data access complexity behind repository interface

### 3. Encapsulate circuit breaker state to improve locality and testability
- Refactor `backend/src/rss.ts` to encapsulate circuit breaker state in an instantiable class
- Allow dependency injection for testability
- Remove global `circuitBreakers` map
- Increase depth by hiding state management complexity

### 4. Create service layer for complex operations like article fetching
- Extract article fetching logic from `backend/src/server.ts` to `articleService.ts`
- Implement cache-aside pattern in service layer
- Define clear interface for data retrieval operations
- Increase depth by hiding data retrieval complexity

### 5. Add API service layer in frontend to decouple from backend contract
- Create `src/services/api.ts` to handle all backend communications
- Refactor frontend hooks (`src/hooks/useRssFeed.ts` and similar) to consume service layer
- Hide API transport details and endpoint URLs
- Increase leverage by making hooks reusable across different data sources

## Success Criteria
- All existing tests continue to pass
- Code quality checks pass (linting, type checking, building, testing)
- Architectural improvements are measurable through reduced coupling and increased module depth
- Changes follow the codebase-design vocabulary (module, interface, depth, seam, adapter, leverage, locality)