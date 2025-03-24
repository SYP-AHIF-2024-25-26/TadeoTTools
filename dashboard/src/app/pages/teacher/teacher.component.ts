import {Component, inject} from '@angular/core';
import {TeacherStore} from "../../store/teacher.store";

@Component({
  selector: 'app-teacher',
  imports: [],
  templateUrl: './teacher.component.html',
  styleUrl: './teacher.component.css'
})
export class TeacherComponent {
  teacherStore = inject(TeacherStore);
}
