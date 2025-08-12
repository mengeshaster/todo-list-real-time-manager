export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface AuthError {
  error: {
    message: string;
    code: string;
  }
}
