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

The application uses MongoDB as the primary database with Mongoose ODM for schema definition and validation. The data model consists of two main collections: Tasks and Users, with an embedded lock system for collaborative editing.

### Task Schema

```typescript
interface ILock {
    isLocked: boolean;
    lockedBy?: Types.ObjectId;
    lockedAt?: Date;
}

interface ITask extends Document {
    title: string;
    description?: string;
    status: "open" | "done";
    priority: "low" | "med" | "high";
    dueDate?: Date;
    lock: ILock;
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, trim: true, maxlength: 1000 },
        status: {
            type: String,
            enum: ["open", "done"],
            default: "open"
        },
        priority: {
            type: String,
            enum: ["low", "med", "high"],
            default: "med"
        },
        dueDate: { type: Date },
        lock: {
            type: LockSchema,
            default: () => ({ isLocked: false })
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
        toJSON: {
            transform: function (doc: any, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    }
);
```

### Lock Schema (Embedded)

```typescript
const LockSchema = new Schema<ILock>({
    isLocked: { type: Boolean, default: false },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lockedAt: { type: Date },
});
```

### User Schema

```typescript
interface IUser extends Document {
    _id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: Date;
    lastLogin?: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 255
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        passwordHash: {
            type: String,
            required: true
        },
        lastLogin: {
            type: Date
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc: any, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                delete ret.passwordHash; // Security: Never expose password hash
                return ret;
            }
        }
    }
);
```

### Database Indexes

For optimal query performance, the following indexes are implemented:

#### Task Collection Indexes

```typescript
TaskSchema.index({ status: 1 });                    // Filter by status
TaskSchema.index({ priority: 1 });                  // Filter by priority  
TaskSchema.index({ createdAt: -1 });                // Sort by creation date (newest first)
TaskSchema.index({ createdBy: 1 });                 // Filter by creator
TaskSchema.index({ "lock.isLocked": 1, "lock.lockedBy": 1 }); // Lock queries
```

#### User Collection Indexes

```typescript
UserSchema.index({ email: 1 }); // Unique email lookup for authentication
```

### Database Design Principles

#### 1. **Embedded vs Referenced Data**

- **Lock Information**: Embedded within tasks for atomic operations and consistency
- **User References**: Referenced by ObjectId to avoid data duplication and maintain referential integrity

#### 2. **Schema Validation**

- **String Limits**: Title (200 chars), description (1000 chars), name (100 chars), email (255 chars)
- **Enums**: Status (`open`, `done`) and priority (`low`, `med`, `high`) with controlled vocabularies
- **Required Fields**: Essential fields marked as required with appropriate defaults

#### 3. **Security Considerations**

- **Password Security**: Passwords are hashed (never stored in plain text)
- **Data Sanitization**: Email normalized to lowercase, strings trimmed
- **JSON Transform**: Password hash automatically excluded from API responses

#### 4. **Audit Trail**

- **Timestamps**: Automatic `createdAt` and `updatedAt` tracking
- **User Tracking**: `createdBy` and `updatedBy` for accountability
- **Last Login**: User activity tracking

#### 5. **Real-time Collaboration**

- **Lock System**: Embedded lock prevents concurrent editing conflicts
- **Lock Metadata**: Tracks who locked the task and when
- **Atomic Updates**: Lock state changes are atomic within task updates

### Query Patterns

#### Common Task Queries

```typescript
// Get user's tasks
Task.find({ createdBy: userId }).sort({ createdAt: -1 });

// Get locked tasks
Task.find({ "lock.isLocked": true });

// Get tasks by status and priority
Task.find({ status: "open", priority: "high" });

// Check if task is locked by specific user
Task.findOne({ _id: taskId, "lock.lockedBy": userId });
```

#### User Authentication Queries

```typescript
// Login lookup
User.findOne({ email: email.toLowerCase() });

// Update last login
User.updateOne({ _id: userId }, { lastLogin: new Date() });
```

### Data Consistency

#### 1. **Referential Integrity**

- User references in tasks are validated
- Orphaned tasks are handled gracefully when users are deleted

#### 2. **Lock Consistency**

- Lock state is managed atomically with task updates
- TTL (Time-To-Live) cleanup prevents stale locks
- Lock acquisition uses optimistic concurrency control

#### 3. **Transaction Support**

- Critical operations use MongoDB transactions when needed
- Lock acquisition and task updates are atomic
- Rollback capability for failed multi-step operations

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
