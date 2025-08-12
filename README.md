# Todo-RT: Real-Time Task Management System

A full-stack real-time task management application built with Angular and Node.js, featuring collaborative editing with optimistic locking and WebSocket synchronization.

## 🏗️ System Architecture

### Overview

Todo-RT is a modern web application that enables multiple users to collaborate on task management in real-time. The system prevents conflicts through an optimistic locking mechanism and ensures data consistency across all connected clients.

### Tech Stack

- **Frontend**: Angular 17+ with RxJS, Angular Material
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: WebSocket communication via Socket.IO
- **Authentication**: JWT-based authentication
- **Development**: Docker Compose for local development

## 🎯 Core Features

### Task Management

- ✅ Create, read, update, and delete tasks
- ✅ Real-time synchronization across all clients
- ✅ Task status management (open/done)
- ✅ Priority levels (low/medium/high)
- ✅ Due date tracking

### Collaborative Editing

- 🔒 **Single-Editor Constraint**: Only one user can edit a task at a time
- ⏱️ **Automatic Lock Release**: Locks expire after timeout to prevent stale locks
- 🚫 **Conflict Prevention**: 409 Conflict responses when attempting to edit locked tasks
- 🔄 **Optimistic UI**: Immediate feedback for the editing user

### Real-time Features

- 📡 Live updates for task creation, modification, and deletion
- 🔓 Real-time lock/unlock notifications
- 📱 Cross-client synchronization
- 🎯 Event-driven architecture

## 📁 Project Structure

```text
todo-rt/
├── todo-rt-client/          # Angular frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/         # Core services, guards, models
│   │   │   │   ├── guards/   # Route guards (auth)
│   │   │   │   ├── interceptors/ # HTTP interceptors
│   │   │   │   ├── models/   # TypeScript models
│   │   │   │   ├── services/ # Core services (auth, socket, task)
│   │   │   │   └── store/    # RxJS-based state management
│   │   │   └── features/     # Feature modules
│   │   │       ├── auth/     # Authentication components
│   │   │       └── tasks/    # Task management components
│   │   └── environments/     # Environment configurations
├── todo-rt-server/          # Node.js backend application
│   ├── src/
│   │   ├── api/             # REST API routes and controllers
│   │   ├── core/            # Business logic and repositories
│   │   │   ├── models/      # MongoDB models
│   │   │   ├── repositories/ # Data access layer
│   │   │   ├── services/    # Business logic services
│   │   │   └── locks/       # Lock management system
│   │   ├── realtime/        # Socket.IO configuration
│   │   └── middleware/      # Express middleware
└── infra/
    └── docker-compose.yml   # Development environment setup
```

## 🔄 System Flows

### 1. Task Creation Flow

```text
User → Angular → POST /tasks → Express Controller → Task Service → Repository → MongoDB
                                     ↓
Socket.IO ← Express ← Task Service ← MongoDB (success)
    ↓
All Connected Clients (task:add event)
```

### 2. Edit Lock Acquisition

```text
User A clicks "Edit" → emit("task:lock", taskId) → Lock Manager → MongoDB
                                                        ↓
                                               Check if already locked
                                                        ↓
                                            Grant lock → emit("task:lock")
```

### 3. Real-time Synchronization

- **Source of Truth**: MongoDB database
- **Event Emission**: After successful database operations
- **State Convergence**: All clients receive the same events and update their local state

## 🗄️ Data Model

### Task Schema

```typescript
interface Task {
  _id: ObjectId;
  title: string;
  description: string;
  status: 'open' | 'done';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId; // User reference
  updatedBy: ObjectId; // User reference
  lock?: LockInfo;     // Embedded lock information
}
```

### Lock Schema

```typescript
interface LockInfo {
  isLocked: boolean;
  lockedBy: ObjectId;  // User reference
  lockedAt: Date;
  ttlSec?: number;     // Time-to-live in seconds
}
```

### User Schema

```typescript
interface User {
  _id: ObjectId;
  email: string;       // Unique, normalized to lowercase
  passwordHash: string; // bcrypt/argon2 hash
  name: string;
  createdAt: Date;
  lastLogin: Date;
}
```

## 🔌 Socket.IO Events

### Client → Server Events

- `task:lock` - Request to lock a task for editing
- `task:unlock` - Release lock on a task
- `subscribe` - Join task-specific rooms (future enhancement)

### Server → Client Events

- `task:add` - New task created
- `task:update` - Task modified
- `task:delete` - Task deleted
- `task:lock` - Task locked by a user
- `task:unlock` - Task unlocked
- `error` - Error occurred

## 🛡️ Security & Authentication

### JWT Authentication

- Bearer token authentication for API requests
- Token embedded with userId for lock management
- Protected routes with Angular guards
- HTTP interceptors for automatic token attachment

### Authorization

- Users can only edit tasks they have locked
- Lock ownership validation on all update operations
- CORS configuration for cross-origin requests

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker and Docker Compose (for local development)
- MongoDB (or use Docker Compose)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <[repository-url](https://github.com/mengeshaster/todo-list-real-time-manager.git)>
   cd todo-rt
   ```

2. **Start with Docker Compose**

   ```bash
   cd infra
   docker-compose up -d
   ```

   This starts:
   - Angular dev server on port 4200
   - Node.js/Express API on port 3000
   - MongoDB on port 27017

3. **Manual Setup (Alternative)**

   **Backend Setup:**

   ```bash
   cd todo-rt-server
   npm install
   cp .env.example .env  # Configure environment variables
   npm run dev
   ```

   **Frontend Setup:**

   ```bash
   cd todo-rt-client
   npm install
   npm start
   ```

### Environment Variables

#### Server (.env)

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/todo-rt
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

#### Client (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  socketUrl: 'http://localhost:3000'
};
```

## 🏛️ Architecture Patterns

### Frontend Patterns

- **Service Pattern**: Centralized data access through Angular services
- **RxJS Store**: Lightweight state management using BehaviorSubjects
- **Component Architecture**: Smart/dumb component separation
- **Reactive Forms**: Form handling with validation

### Backend Patterns

- **Layered Architecture**: Controller → Service → Repository → Database
- **Repository Pattern**: Abstracted data access layer
- **Singleton Pattern**: Database connection management
- **Strategy Pattern**: Lock management with different policies

### Design Principles

- **Single Source of Truth**: Database as the authoritative data source
- **Event Sourcing**: Socket events emitted after successful database operations
- **Optimistic UI**: Immediate feedback for initiating clients
- **Eventual Consistency**: All clients converge on the same state

## 🔧 Key Implementation Details

### Lock Management

- **TTL Policy**: Locks automatically expire after configurable timeout
- **Conflict Resolution**: 409 HTTP status for lock conflicts
- **Cleanup Strategy**: Periodic sweep or lazy cleanup on lock attempts
- **Recovery**: Handles browser crashes and network interruptions

### Error Handling

- **Structured Errors**: Consistent error format with codes and messages
- **Graceful Degradation**: Fallback behaviors for connection issues
- **Validation**: Input validation at both client and server levels
- **Idempotency**: Handles duplicate events and requests

### Performance Considerations

- **Database Indexes**: Optimized queries for status, due dates, and locks
- **Connection Pooling**: Efficient MongoDB connection management
- **Event Throttling**: Prevents excessive socket event emissions
- **Lazy Loading**: On-demand component and data loading

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd todo-rt-client
npm run build

# The dist/ folder contains static files for serving
```

### Deployment Architecture

- **Frontend**: Static files served by Nginx or CDN
- **Backend**: Node.js behind reverse proxy (Nginx/Apache)
- **Database**: MongoDB Atlas or managed MongoDB service
- **WebSockets**: Sticky sessions for Socket.IO clustering

### Environment Setup

- **HTTPS**: Required for production WebSocket connections
- **Process Management**: PM2 or container orchestration
- **Monitoring**: Application and infrastructure monitoring
- **Backup**: Automated database backups

## 🧪 Testing Strategy

### Unit Tests

- Angular components with TestBed
- Node.js services with Jest
- Repository layer with MongoDB Memory Server

### Integration Tests

- API endpoints with supertest
- Socket.IO events with socket.io-client
- Database operations with test containers

### E2E Tests

- Cypress for full user workflows
- Multi-user collaboration scenarios
- Lock acquisition and release flows

## 📈 Future Enhancements

### Planned Features

- [ ] **Multi-tenancy**: Support for multiple organizations
- [ ] **Task Categories**: Organize tasks into categories/projects
- [ ] **User Permissions**: Role-based access control
- [ ] **File Attachments**: Upload and attach files to tasks
- [ ] **Comments**: Task-level discussion threads
- [ ] **Notifications**: Email and push notifications
- [ ] **Offline Support**: PWA with offline capabilities
- [ ] **Advanced Search**: Full-text search and filtering
- [ ] **Audit Trail**: Track all changes and user actions
- [ ] **API Rate Limiting**: Prevent abuse and ensure stability

### Technical Improvements

- [ ] **Microservices**: Split into smaller, focused services
- [ ] **Event Sourcing**: Complete event-driven architecture
- [ ] **CQRS**: Separate read/write models for better performance
- [ ] **GraphQL**: More efficient data fetching
- [ ] **Redis**: Caching and session management
- [ ] **Message Queue**: Asynchronous processing with Bull/Agenda

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the [documentation](docs/) for detailed guides
- Review the [API documentation](docs/api.md) for backend endpoints

---

Built with ❤️ using Angular, Node.js, and MongoDB
