# Tickets for CivicFeed RSS App Architectural Improvement

## Ticket 1: Refactor server.ts - Extract Route Handlers
**Description**: Extract route handlers from backend/src/server.ts into feature-specific modules to increase module depth.
**Tasks**:
- Create feedsRouter.ts with feed-related routes
- Create articlesRouter.ts with article-related routes  
- Create miscRouter.ts for remaining routes
- Update server.ts to use the new routers
- Ensure all existing functionality is preserved
**Dependencies**: None

## Ticket 2: Implement Repository Pattern for Feeds Data
**Description**: Move feed data to database storage and create repository interface to reduce coupling.
**Tasks**:
- Create feedsRepository.ts with CRUD operations
- Define focused interfaces (FeedSummary, FeedDetail, FeedConfig)
- Migrate feed data from constant array to database
- Update all consumers to use repository interface
- Preserve existing feeds.ts interface for backward compatibility during transition
**Dependencies**: Ticket 1 (helpful but not required)

## Ticket 3: Encapsulate Circuit Breaker State
**Description**: Refactor rss.ts to encapsulate circuit breaker state in an instantiable class.
**Tasks**:
- Create CircuitBreaker class to encapsulate state
- Remove global circuitBreakers map
- Allow dependency injection for testability
- Update rss.ts to use the CircuitBreaker class
- Ensure existing functionality is preserved
**Dependencies**: None

## Ticket 4: Create Service Layer for Article Fetching
**Description**: Extract article fetching logic to service layer with cache-aside pattern.
**Tasks**:
- Create articleService.ts with getArticlesForFeed function
- Implement cache-aside pattern (check cache, fetch if missing, update cache)
- Move logic from server.ts article endpoint to service
- Update server.ts to use articleService
- Preserve existing API behavior
**Dependencies**: Ticket 3 (helpful for circuit breaker usage)

## Ticket 5: Add Frontend API Service Layer
**Description**: Create API service layer to decouple frontend from backend contract.
**Tasks**:
- Create src/services/api.ts with typed API methods
- Refactor useRssFeed.ts and similar hooks to consume api.ts
- Hide API endpoint URLs and response shape details
- Ensure existing functionality is preserved
**Dependencies**: None (can work in parallel)

## Integration Testing Ticket
**Description**: Verify all changes work together and preserve existing functionality.
**Tasks**:
- Run all existing tests
- Verify linting passes
- Verify type checking passes
- Verify build succeeds
- Manual verification of key features
**Dependencies**: All previous tickets