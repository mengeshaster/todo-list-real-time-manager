import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, LoginRequest, RegisterRequest, LoginResponse, RegisterResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.checkAuthState();
  }

  private checkAuthState(): void {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        this.currentUserSubject.next(parsedUser);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearAuthData();
      }
    }
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, request);
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(
        tap((response) => {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));

          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => {
          this.clearAuthData();
        })
      );
  }

  clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
