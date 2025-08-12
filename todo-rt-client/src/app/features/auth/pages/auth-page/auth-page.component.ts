import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { RegisterFormComponent } from '../../components/register-form/register-form.component';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, RegisterFormComponent],
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.scss']
})
export class AuthPageComponent {
  activeTab = signal<'login' | 'register'>('login');

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab.set(tab);
  }
}
