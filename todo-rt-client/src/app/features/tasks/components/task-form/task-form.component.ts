import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SocketService } from '../../../../core/services/socket.service';
import { TaskStore } from '../../../../core/store/task.store';
import { CreateTaskRequest } from '../../../../core/models/task.model';
import { Task } from '../../../../core/models/task.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnDestroy {
  taskForm: FormGroup;
  isSubmitting = false;
  private subscriptions = new Subscription();
  editingTaskId: string | null = null;
  private currentUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private socketService: SocketService,
    private taskStore: TaskStore,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();

    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      priority: ['medium', [Validators.required]],
      dueDate: ['']
    });
  }

  ngOnDestroy(): void {
    if (this.editingTaskId) {
      this.socketService.unlockTask(this.editingTaskId, this.currentUser?.id || '');
    }

    this.subscriptions.unsubscribe();
  }

  onSubmit(): void {
    console.log('Form submitted. Edit mode:', !!this.editingTaskId, 'Task ID:', this.editingTaskId);

    if (this.taskForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const title = this.taskForm.value.title.trim();
      const description = this.taskForm.value.description?.trim() || undefined;

      if (this.editingTaskId) {
        console.log('Updating task with ID:', this.editingTaskId);

        const updateData = {
          id: this.editingTaskId,
          title,
          description,
          priority: this.taskForm.value.priority,
          dueDate: this.taskForm.value.dueDate ? new Date(this.taskForm.value.dueDate) : undefined
        };

        const updateSub = this.taskService.updateTask(updateData).subscribe({
          next: (task) => {
            console.log('Task updated successfully:', task);

            this.taskStore.updateTask(task);

            if (this.editingTaskId) {
              this.taskStore.setTaskUnlocked(this.editingTaskId);
            }

            this.taskForm.reset();
            this.editingTaskId = null;
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error updating task:', error);
            this.taskStore.setError('Failed to update task');

            if (this.editingTaskId) {
              this.socketService.unlockTask(this.editingTaskId, this.currentUser?.id || '');
            }

            this.isSubmitting = false;
          }
        });

        this.subscriptions.add(updateSub);
      } else {
        console.log('Creating new task');

        const taskData: CreateTaskRequest = {
          title,
          description,
          priority: this.taskForm.value.priority,
          dueDate: this.taskForm.value.dueDate ? new Date(this.taskForm.value.dueDate) : undefined,
          userId: this.currentUser?.id || ''
        };

        const createSub = this.taskService.createTask(taskData).subscribe({
          next: (task) => {
            console.log('Task created successfully:', task);

            this.taskStore.addTask(task);
            this.taskForm.reset();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error creating task:', error);
            this.taskStore.setError('Failed to create task');
            this.isSubmitting = false;
          }
        });

        this.subscriptions.add(createSub);
      }
    }
  }

  onCancel(): void {
    console.log('Edit cancelled');

    if (this.editingTaskId) {
      this.socketService.unlockTask(this.editingTaskId, this.currentUser?.id || '');
    }

    this.taskForm.reset();
    this.editingTaskId = null;
  }

  get titleControl() {
    return this.taskForm.get('title');
  }

  get descriptionControl() {
    return this.taskForm.get('description');
  }

  get priorityControl() {
    return this.taskForm.get('priority');
  }

  get dueDateControl() {
    return this.taskForm.get('dueDate');
  }

  getTitleError(): string {
    const control = this.titleControl;

    if (control?.errors && control.touched) {

      if (control.errors['required']) {
        return 'Title is required';
      }

      if (control.errors['minlength']) {
        return 'Title must be at least 1 character';
      }

      if (control.errors['maxlength']) {
        return 'Title must be less than 100 characters';
      }
    }
    return '';
  }

  getDescriptionError(): string {
    const control = this.descriptionControl;

    if (control?.errors && control.touched) {
      if (control.errors['maxlength']) {
        return 'Description must be less than 500 characters';
      }
    }

    return '';
  }

  startEdit(task: Task): void {
    console.log('Starting edit for task:', task);

    this.editingTaskId = task.id;

    const dueDateValue = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';

    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      dueDate: dueDateValue
    });

    this.socketService.lockTask(task.id, this.currentUser?.name || '');

    console.log('Edit mode set, editingTaskId:', this.editingTaskId);
  }
}
