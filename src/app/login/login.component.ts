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
  password: string = '';
  isLoading = false;
  

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    // Validaciones básicas antes de llamar al backend
    this.mensajeError = '';
    const user = (this.usuario || '').trim();
    const pass = (this.password || '').trim();
    if (!user || !pass) {
      this.mensajeError = 'Por favor ingresa tu usuario y contraseña.';
      return;
    }

    this.isLoading = true;
    this.authService.login(user, pass).subscribe({
      next: (response) => {
        console.log('user logged', response);
        localStorage.setItem('username', user);
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Error login', error);
        // Mapea mensajes específicos según status o payload
        const status = error?.status;
        const backendMsg: string | undefined = error?.error?.message || error?.error?.error || error?.message;
        if (status === 401) {
          this.mensajeError = 'Contraseña incorrecta. Verifica e inténtalo de nuevo.';
        } else if (status === 404) {
          this.mensajeError = 'Usuario no registrado.';
        } else if (status === 400 && backendMsg?.toLowerCase().includes('user') && backendMsg?.toLowerCase().includes('not')) {
          this.mensajeError = 'Usuario no registrado.';
        } else {
          this.mensajeError = backendMsg || 'Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.';
        }
        this.isLoading = false; // detener spinner en error
      },
      complete: () => {
        this.isLoading = false;
      }
    });
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
