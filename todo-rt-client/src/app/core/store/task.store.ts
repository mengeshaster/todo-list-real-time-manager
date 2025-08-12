import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TaskStore {
  private readonly initialState: TaskState = {
    tasks: [],
    loading: false,
    error: null
  };

  private state$ = new BehaviorSubject<TaskState>(this.initialState);

  getTasks(): Observable<Task[]> {
    return new Observable(observer => {
      this.state$.subscribe(state => observer.next(state.tasks));
    });
  }

  getLoading(): Observable<boolean> {
    return new Observable(observer => {
      this.state$.subscribe(state => observer.next(state.loading));
    });
  }

  getError(): Observable<string | null> {
    return new Observable(observer => {
      this.state$.subscribe(state => observer.next(state.error));
    });
  }

  setTasks(tasks: Task[]): void {
    this.updateState({ tasks, error: null });
  }

  addTask(task: Task): void {
    const currentState = this.state$.value;

    const existingTaskIndex = currentState.tasks.findIndex(existingTask => existingTask.id === task.id);

    if (existingTaskIndex !== -1) {
      console.log('Task already exists, updating instead of adding:', task.id);
      this.updateTask(task);
      return;
    }

    console.log('Adding new task to store:', task.id);
    const updatedTasks = [...currentState.tasks, task];
    this.updateState({ tasks: updatedTasks, error: null });
  }

  updateTask(updatedTask: Task): void {
    console.log('TaskStore.updateTask called with:', updatedTask);

    const currentState = this.state$.value;
    console.log('Current tasks in store:', currentState.tasks);

    const updatedTasks = currentState.tasks.map(task => {
      console.log(`Comparing task.id: ${task.id} with updatedTask.id: ${updatedTask.id}`);

      const isMatch = task.id === updatedTask.id;

      console.log(`Match found: ${isMatch}`);
      return isMatch ? updatedTask : task;
    });
    console.log('Updated tasks array:', updatedTasks);

    this.updateState({ tasks: updatedTasks, error: null });
  }

  removeTask(taskId: string): void {
    console.log('TaskStore.removeTask called with ID:', taskId);

    const currentState = this.state$.value;

    console.log('Current tasks before removal:', currentState.tasks);

    const updatedTasks = currentState.tasks.filter(task => {
      const shouldKeep = task.id !== taskId;

      console.log(`Task ${task.id}: shouldKeep = ${shouldKeep}`);
      return shouldKeep;
    });
    console.log('Updated tasks after removal:', updatedTasks);

    this.updateState({ tasks: updatedTasks, error: null });
  }

  setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  setError(error: string): void {
    this.updateState({ error, loading: false });
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  setTaskLocked(taskId: string, lockedBy: string): void {
    console.log('TaskStore.setTaskLocked called with:', { taskId, lockedBy });

    const currentState = this.state$.value;
    const updatedTasks = currentState.tasks.map(task =>
      task.id === taskId
        ? {
          ...task,
          lock: {
            ...task.lock,
            isLocked: true,
            lockedBy: lockedBy,
            lockedAt: new Date().toISOString()
          }
        }
        : task
    );

    this.updateState({ tasks: updatedTasks });
  }

  setTaskUnlocked(taskId: string): void {
    console.log('TaskStore.setTaskUnlocked called with taskId:', taskId);

    const currentState = this.state$.value;
    const updatedTasks = currentState.tasks.map(task =>
      task.id === taskId
        ? {
          ...task,
          lock: {
            ...task.lock,
            isLocked: false,
            lockedBy: undefined,
            lockedAt: undefined
          }
        }
        : task
    );

    this.updateState({ tasks: updatedTasks });
  }

  private updateState(partialState: Partial<TaskState>): void {
    const currentState = this.state$.value;
    const newState = { ...currentState, ...partialState };
    this.state$.next(newState);
  }
}
