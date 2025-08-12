import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../../core/models/task.model';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-item.component.html',
  styleUrl: './task-item.component.scss'
})
export class TaskItemComponent {
  @Input() task!: Task;
  @Output() toggle = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() edit = new EventEmitter<Task>();

  get isCompleted(): boolean {
    return this.task.status === 'done';
  }

  get isLocked(): boolean {
    return this.task.lock?.isLocked || false;
  }

  get lockedBy(): string | undefined {
    return this.task.lock?.lockedBy;
  }

  get lockedAt(): string | undefined {
    return this.task.lock?.lockedAt;
  }

  onToggleComplete(): void {
    if (this.isLocked) {
      console.log('Toggle blocked - task is locked by:', this.lockedBy);
      return;
    }

    console.log('Toggle clicked for task:', this.task);
    this.toggle.emit(this.task);
  }

  onEdit(): void {
    if (this.isLocked) {
      console.log('Edit blocked - task is locked by:', this.lockedBy);
      return;
    }

    this.edit.emit(this.task);
  }

  onDelete(): void {
    if (this.isLocked) {
      console.log('Delete blocked - task is locked by:', this.lockedBy);
      return;
    }

    if (confirm('Are you sure you want to delete this task?')) {
      this.delete.emit(this.task);
    }
  }

  get isOverdue(): boolean {
    if (!this.task.dueDate || this.isCompleted) {
      return false;
    }

    const today = new Date();
    const dueDate = new Date(this.task.dueDate);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  get priorityDisplay(): string {
    const priorityMap = {
      low: '🟢 Low',
      medium: '🟡 Medium',
      high: '🔴 High'
    };

    return priorityMap[this.task.priority] || this.task.priority;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatDueDate(date: Date): string {
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays === -1) {
      return 'Due yesterday';
    } else if (diffDays > 0) {
      return `Due in ${diffDays} days`;
    } else {
      return `Overdue by ${Math.abs(diffDays)} days`;
    }
  }
}
