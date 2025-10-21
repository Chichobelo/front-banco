import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username = '';
  password = '';

  onSubmit() {
    console.log('Intento de login:', this.username, this.password);
  }

  forgotUsername() {
    alert('Funcionalidad: recuperar usuario');
  }

  forgotPassword() {
    alert('Funcionalidad: recuperar o desbloquear clave');
  }

  createUser() {
    alert('Funcionalidad: crear usuario');
  }
}
