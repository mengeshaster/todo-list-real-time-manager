import { Component, OnInit, OnDestroy } from '@angular/core';
import { Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { Task } from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SocketService } from '../../../../core/services/socket.service';
import { TaskStore } from '../../../../core/store/task.store';
import { TaskItemComponent } from '../task-item/task-item.component';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskItemComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit, OnDestroy {
  @Input() taskFormComponent: any;
  tasks$: Observable<Task[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  private currentUserId: User | null = null;

  private subscriptions = new Subscription();

  onTaskEdit(task: Task): void {
    console.log('Edit clicked for task:', task);
    console.log('TaskFormComponent reference:', this.taskFormComponent);

    if (this.taskFormComponent && typeof this.taskFormComponent.startEdit === 'function') {
      console.log('Calling startEdit on form component');

      this.taskFormComponent.startEdit(task);
    } else {
      console.error('TaskFormComponent not found or startEdit method not available');
    }
  }

  constructor(
    private taskService: TaskService,
    private socketService: SocketService,
    private taskStore: TaskStore,
    private authService: AuthService
  ) {
    this.tasks$ = this.taskStore.getTasks();
    this.loading$ = this.taskStore.getLoading();
    this.error$ = this.taskStore.getError();
    this.currentUserId = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadTasks();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadTasks(): void {
    this.taskStore.setLoading(true);

    const tasksSub = this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.taskStore.setTasks(tasks);
        this.taskStore.setLoading(false);
      },
      error: (error) => {
        this.taskStore.setError('Failed to load tasks');
        this.taskStore.setLoading(false);
      }
    });

    this.subscriptions.add(tasksSub);
  }

  private setupSocketListeners(): void {
    console.log('🔌 Setting up socket listeners...');

    const createdSub = this.socketService.onTaskCreated().subscribe(task => {
      console.log('➕ Task created via WebSocket:', task);
      this.taskStore.addTask(task);
    });

    const updatedSub = this.socketService.onTaskUpdated().subscribe(task => {
      console.log('✏️ Task updated via WebSocket:', task);
      this.taskStore.updateTask(task);
    });

    const deletedSub = this.socketService.onTaskDeleted().subscribe(taskId => {
      console.log('🗑️ Task deleted via WebSocket:', taskId);
      this.taskStore.removeTask(taskId);
    });

    const lockedSub = this.socketService.onTaskLocked().subscribe(data => {
      console.log('🔒 Task locked from socket event:', data);

      const lockedByValue = data.lockedBy || (data as any).userId;
      console.log('🔒 Using lockedBy value:', lockedByValue);

      this.taskStore.setTaskLocked(data.taskId, lockedByValue);
    });

    const unlockedSub = this.socketService.onTaskUnlocked().subscribe(data => {
      console.log('🔓 Task unlocked from socket event:', data);
      this.taskStore.setTaskUnlocked(data.taskId);
    });

    const lockResponseSub = this.socketService.onTaskLockResponse().subscribe(response => {
      console.log('🔒📨 Lock response:', response);

      if (response.success) {
        console.log('✅ Lock acquired successfully');
      } else {
        console.error('❌ Lock failed:', response.message);
        this.taskStore.setError(response.message);
      }
    });

    const unlockResponseSub = this.socketService.onTaskUnlockResponse().subscribe(response => {
      console.log('🔓📨 Unlock response:', response);

      if (response.success) {
        console.log('✅ Unlock successful');
      } else {
        console.error('❌ Unlock failed:', response.message);
        this.taskStore.setError(response.message);
      }
    });

    this.subscriptions.add(createdSub);
    this.subscriptions.add(updatedSub);
    this.subscriptions.add(deletedSub);
    this.subscriptions.add(lockedSub);
    this.subscriptions.add(unlockedSub);
    this.subscriptions.add(lockResponseSub);
    this.subscriptions.add(unlockResponseSub);
    console.log('✅ Socket listeners setup complete');
  }

  onTaskToggle(task: Task): void {
    console.log('Task toggle called for:', task);

    const toggleRequest = {
      id: task.id,
      userId: this.currentUserId?.id || ''
    };

    const toggleSub = this.taskService.toggleTaskCompletion(toggleRequest).subscribe({
      next: (updated) => {
        console.log('Toggle response from server:', updated);

        this.taskStore.updateTask(updated);
      },
      error: (error) => {
        console.error('Toggle error:', error);
        this.taskStore.setError('Failed to update task');
      }
    });

    this.subscriptions.add(toggleSub);
  }

  onTaskDelete(task: Task): void {
    const deleteSub = this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.taskStore.removeTask(task.id);
      },
      error: (error) => {
        this.taskStore.setError('Failed to delete task');
      }
    });

    this.subscriptions.add(deleteSub);
  }
}
