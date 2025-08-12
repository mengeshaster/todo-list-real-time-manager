export interface TaskLock {
  isLocked: boolean;
  _id: string;
  lockedAt?: string;
  lockedBy?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'done';
  priority: string;
  lock: TaskLock;
  createdAt: Date;
  updatedAt: Date;
  isLocked?: boolean;
  lockedBy?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  userId: string;
}

export interface UpdateTaskRequest {
  id: string;
  title?: string;
  description?: string;
  status?: 'open' | 'done';
}
