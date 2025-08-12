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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}
