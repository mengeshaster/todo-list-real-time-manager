# Todo RT Server

Real-time Todo Server built with Node.js, TypeScript, Express, Socket.IO, and MongoDB.

## 🚀 Features

- **Real-time Updates**: Socket.IO integration for live task updates
- **Collaborative Editing**: Task locking mechanism to prevent conflicts
- **RESTful API**: Complete CRUD operations for tasks
- **TypeScript**: Full type safety and better developer experience
- **MongoDB**: Persistent storage with Mongoose ODM
- **Error Handling**: Comprehensive error handling and logging
- **Lock Management**: TTL-based lock system with automatic cleanup

## 📁 Project Structure

```
src/
├── index.ts                    # Bootstrap HTTP + Socket.IO
├── app.ts                      # Express app, routes, middlewares
├── config/env.ts               # Environment configuration
├── loaders/db.ts               # Mongoose connection (Singleton)
├── realtime/socket.ts          # Socket.IO gateway (namespaces/events)
├── api/
│   ├── routes/task.routes.ts   # Task route definitions
│   └── controllers/task.controller.ts  # Request handlers
├── core/
│   ├── services/task.service.ts     # Business logic (emit after commit)
│   ├── repositories/task.repo.ts   # Data access layer
│   ├── models/task.model.ts        # Mongoose schema
│   └── locks/lock.manager.ts       # Lock acquisition/release/TTL policy
├── middleware/error.ts         # Error handling middleware
└── types/global.d.ts          # TypeScript type definitions
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn

### Installation

1. **Clone and navigate to server directory**
   ```bash
   cd todo-rt-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/todo_rt
   CORS_ORIGIN=http://localhost:4200
   JWT_SECRET=your_secret_key
   LOCK_TTL_SECONDS=120
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongo mongo:latest
   
   # Or start your local MongoDB service
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## 📡 API Endpoints

### Tasks API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get all tasks |
| `GET` | `/api/tasks/:id` | Get single task |
| `POST` | `/api/tasks` | Create new task |
| `PUT` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `PATCH` | `/api/tasks/:id/toggle` | Toggle task status |
| `GET` | `/api/tasks/status/:status` | Get tasks by status (open/done) |
| `GET` | `/api/tasks/priority/:priority` | Get tasks by priority (low/med/high) |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/` | API information |

## 🔌 Socket.IO Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `task:lock` | `{ taskId, userId }` | Request task lock |
| `task:unlock` | `{ taskId, userId }` | Release task lock |
| `task:join` | `{ taskId }` | Join task-specific room |
| `task:leave` | `{ taskId }` | Leave task-specific room |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `task:created` | `Task` | New task created |
| `task:updated` | `Task` | Task updated |
| `task:deleted` | `{ id }` | Task deleted |
| `task:locked` | `{ taskId, userId }` | Task locked |
| `task:unlocked` | `{ taskId, userId }` | Task unlocked |
| `task:lock:response` | `{ taskId, userId, success, message }` | Lock response |
| `task:unlock:response` | `{ taskId, userId, success, message }` | Unlock response |

## 🏗️ Architecture

### Core Components

1. **Task Service**: Business logic layer handling all task operations
2. **Lock Manager**: Singleton service managing task locks with TTL
3. **Socket Gateway**: Real-time communication hub
4. **Repository Pattern**: Data access abstraction
5. **Error Middleware**: Centralized error handling

### Lock System

- **TTL-based**: Locks automatically expire after configured time
- **User-specific**: Users can only release their own locks
- **Cleanup Timer**: Automatic cleanup every 60 seconds
- **Conflict Prevention**: Prevents concurrent editing

### Real-time Features

- **Namespace isolation**: Tasks are in `/tasks` namespace
- **Room-based**: Task-specific rooms for targeted updates
- **Event broadcasting**: All connected clients receive updates
- **Connection management**: Automatic cleanup on disconnect

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/todo_rt` | MongoDB connection string |
| `CORS_ORIGIN` | `http://localhost:4200` | CORS allowed origin |
| `JWT_SECRET` | `dev_secret` | JWT signing secret |
| `LOCK_TTL_SECONDS` | `120` | Lock expiration time |

## 🧪 Testing

The server provides several endpoints for testing:

- **Health Check**: `GET /health`
- **API Info**: `GET /`
- **Socket.IO**: Connect to `ws://localhost:3000/tasks`

### Example Task Creation

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "priority": "high"
  }'
```

## 🚀 Deployment

### Docker (Recommended)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Environment Setup

1. Build the application: `npm run build`
2. Set production environment variables
3. Ensure MongoDB is accessible
4. Start the server: `npm start`

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify connection string in `.env`

2. **Port Already in Use**
   - Change `PORT` in `.env`
   - Kill process using the port

3. **Socket.IO Connection Issues**
   - Check CORS configuration
   - Verify client connection URL

## 📝 Development Notes

- **Hot Reload**: Enabled in development mode
- **Error Logging**: Comprehensive error tracking
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint configuration included

## 🔗 Integration with Frontend

The server is designed to work with the Angular frontend:

- **API Base URL**: `http://localhost:3000/api`
- **Socket.IO URL**: `http://localhost:3000`
- **Namespace**: `/tasks`

Ensure the frontend is configured to connect to these endpoints.
