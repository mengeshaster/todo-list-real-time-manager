import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskListComponent } from '../../components/task-list/task-list.component';
import { TaskFormComponent } from '../../components/task-form/task-form.component';

@Component({
    selector: 'app-tasks-page',
    standalone: true,
    imports: [CommonModule, TaskListComponent, TaskFormComponent],
    templateUrl: './tasks-page.component.html',
    styleUrl: './tasks-page.component.scss'
})
export class TasksPageComponent {

}
