import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn('⚠️ No auth token available for WebSocket connection');
      return;
    }

    this.socket = io(environment.webSocketUrl, {
      auth: {
        token: token
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error);

      // Check if the error is related to authentication
      if (error.message && (
        error.message.includes('Authentication failed') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('Invalid token')
      )) {
        console.log('🚫 WebSocket authentication failed, logging out user');
        this.handleAuthError();
      }
    });

    // Listen for authentication error events from server
    this.socket.on('auth_error', (error) => {
      console.error('🚫 WebSocket auth error:', error);
      this.handleAuthError();
    });

    // Listen for token expiration events from server
    this.socket.on('token_expired', () => {
      console.error('🚫 WebSocket token expired');
      this.handleAuthError();
    });
  }

  private handleAuthError(): void {
    console.log('🚫 Handling WebSocket authentication error');

    // Clear local auth data immediately (don't make HTTP logout request)
    this.authService.clearAuthData();
    this.router.navigate(['/auth']);
  }

  onTaskCreated(): Observable<Task> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('task:created', (task: Task) => {
        console.log('📨 Received task:created event:', task);
        observer.next(task);
      });
    });
  }

  onTaskUpdated(): Observable<Task> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('task:updated', (task: Task) => {
        console.log('📨 Received task:updated event:', task);
        observer.next(task);
      });
    });
  }

  onTaskDeleted(): Observable<string> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('task:deleted', (data: { id: string }) => {
        console.log('📨 Received task:deleted event:', data);
        observer.next(data.id);
      });
    });
  }

  onTaskLocked(): Observable<{ taskId: string; lockedBy?: string; userId?: string }> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('task:locked', (data: { taskId: string; lockedBy?: string; userId?: string }) => {
        console.log('🔒 Received task:locked event:', data);
        observer.next(data);
      });
    });
  }

  onTaskUnlocked(): Observable<{ taskId: string; userId: string }> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('task:unlocked', (data: { taskId: string; userId: string }) => {
        console.log('🔓 Received task:unlocked event:', data);
        observer.next(data);
      });
    });
  }

  onTaskLockResponse(): Observable<{ taskId: string; userId: string; lockedBy: string; success: boolean; message: string }> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('task:lock:response', (data: { taskId: string; userId: string; lockedBy: string; success: boolean; message: string }) => {
        console.log('🔒📨 Received task:lock:response:', data);
        observer.next(data);
      });
    });
  }

  onTaskUnlockResponse(): Observable<{ taskId: string; userId: string; success: boolean; message: string }> {
    return new Observable(observer => {
      if (!this.socket) return;
      this.socket.on('task:unlock:response', (data: { taskId: string; userId: string; success: boolean; message: string }) => {
        console.log('🔓📨 Received task:unlock:response:', data);
        observer.next(data);
      });
    });
  }

  createTask(task: any): void {
    if (!this.socket) return;
    this.socket.emit('task:created', task);
  }

  updateTask(task: any): void {
    if (!this.socket) return;
    this.socket.emit('task:updated', task);
  }

  deleteTask(taskId: string): void {
    if (!this.socket) return;
    this.socket.emit('task:deleted', taskId);
  }

  lockTask(taskId: string, lockedBy: string): void {
    if (!this.socket) return;
    console.log('🔒 Emitting task:lock:', { taskId, lockedBy });
    this.socket.emit('task:lock', { taskId, lockedBy });
  }

  unlockTask(taskId: string, userId: string): void {
    if (!this.socket) return;
    console.log('🔓 Emitting task:unlock:', { taskId, userId });
    this.socket.emit('task:unlock', { taskId, userId });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
