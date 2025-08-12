import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) { }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(task: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(task: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${task.id}`, task);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleTaskCompletion(toggleRequest: any): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${toggleRequest.id}/toggle`, {
      userId: toggleRequest.userId
    });
  }
}
