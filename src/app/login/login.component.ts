import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  mensajeError: string = '';
  usuario = '';
  contraseña = '';
  password: any;
  

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.mensajeError = ''; // Limpia cualquier mensaje previo
    this.authService.login(this.usuario, this.password).subscribe(
      (response) => {
        console.log('user logged', response);
         localStorage.setItem('username', this.usuario);
        this.router.navigate(['/home']); // Navega a la página de inicio después del login exitoso
      },
      (error) => {
        console.error('Error login', error);
        // Muestra un mensaje de error al usuario
        this.mensajeError = 'Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.';
      }
    );
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
