import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './service/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.authService.getAuthToken();

    if (token) {
      this.authService.getIsValidToken().subscribe({
        next: (productos) => {
          if(!productos){
            this.router.navigate(['/login']); // Redirigir al login si no hay token
            return false;
          }
          return true;
        },
        error: (error) => {
          console.error('Error al cargar productos', error);
          this.router.navigate(['/login']);
          return false;
        }
      });
      return true; // Permitir acceso si hay un token
    } else {
      this.router.navigate(['/login']); // Redirigir al login si no hay token
      return false;
    }
  }
}
