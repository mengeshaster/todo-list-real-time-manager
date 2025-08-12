import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/tasks',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/pages/auth-page/auth-page.component').then(m => m.AuthPageComponent)
    },
    {
        path: 'tasks',
        canActivate: [authGuard],
        loadComponent: () => import('./features/tasks/pages/tasks-page/tasks-page.component').then(m => m.TasksPageComponent)
    }
];
