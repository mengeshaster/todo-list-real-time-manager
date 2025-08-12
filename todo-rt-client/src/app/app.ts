import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('todo-rt-client');
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;
  isAuthenticated$ = this.authService.isAuthenticated$;

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
        this.router.navigate(['/auth']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.router.navigate(['/auth']);
      }
    });
  }
}
