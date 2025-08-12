import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthError } from '../../../../core/models/user.model';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.scss']
})
export class RegisterFormComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    if (confirmPassword?.errors?.['mismatch']) {
      delete confirmPassword.errors['mismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const { name, email, password } = this.registerForm.value;

      this.authService.register({ name, email, password }).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.successMessage.set('Registration successful! You can now sign in.');
          this.registerForm.reset();
        },
        error: (authException: AuthError) => {
          console.error('Registration failed:', authException);
          this.errorMessage.set(`Registration failed: ${authException.error?.message} Please try again.`);
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  getFieldError(fieldName: string): string | null {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['mismatch']) {
        return 'Passwords do not match';
      }
    }
    return null;
  }
}
