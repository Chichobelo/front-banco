import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interface/user.model';
import { AuthResponse } from '../interface/AuthResponse.model';
import { environment } from '../enviroment/enviromen';
import { LoginRequest } from '../interface/loginRequest.model';
import { RegisterRequest } from '../interface/registerRequest.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl+'/auth'; // URL base del backend
  
  constructor(private http: HttpClient) {}

  /**
   * Inicia sesión del usuario.
   * @param username Nombre de usuario
   * @param password Contraseña
   * @returns Observable con la respuesta de autenticación
   * 
   */
  login(username: string, password: string): Observable<AuthResponse> {
    const login: LoginRequest = { username: username, password: password };
  
    return new Observable(observer => {
      this.http.post<AuthResponse>(`http://localhost:9090/auth/login`, login).subscribe({
        next: (response) => {
          if (response && response.token) {
            localStorage.setItem('authToken', response.token); // Guarda el token
            localStorage.setItem('role', response.role); // Guarda el token

            localStorage.setItem('username', username); // Guarda el nombre de usuario
          }
          observer.next(response); // Envía la respuesta al suscriptor
          observer.complete();
        },
        error: (err) => {
          observer.error(err); // Propaga el error al suscriptor
        }
      });
    });
  }
  
  

  /**
   * Registra un nuevo usuario.
   * @param user Datos del usuario a registrar
   * @returns Observable con la respuesta de autenticación
   */
  register(user: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`http://localhost:9090/auth/register`, user);
  }

  /**
   * Obtiene todos los usuarios.
   * @returns Observable con la lista de usuarios
   */
  getAllUsers(): Observable<RegisterRequest[]> {
    return this.http.get<RegisterRequest[]>(`http://localhost:9090/auth`);
  }
  getIsValidToken(): Observable<boolean> {
    const token=localStorage.getItem("authToken");
    return this.http.get<boolean>(`http://localhost:9090/auth/validateToken/${token}`);
  }
  /**
   * Obtiene un usuario por su ID.
   * @param id ID del usuario
   * @returns Observable con los datos del usuario
   */
  getUserById(id: number): Observable<RegisterRequest> {
    return this.http.get<RegisterRequest>(`${this.baseUrl}/${id}`);
  }

  /**
   * Actualiza un usuario existente.
   * @param id ID del usuario a actualizar
   * @param user Nuevos datos del usuario
   * @returns Observable con los datos del usuario actualizado
   */
  updateUser(id: number, user: RegisterRequest): Observable<RegisterRequest> {
    return this.http.put<RegisterRequest>(`http://localhost:9090/auth/${id}`, user);
  }

  /**
   * Elimina un usuario por su ID.
   * @param id ID del usuario a eliminar
   * @returns Observable vacío si la eliminación es exitosa
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:9090/auth/${id}`);
  }

  /**
   * Obtiene el token de autenticación almacenado en localStorage.
   * @returns El token de autenticación almacenado, o null si no existe.
   */
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Elimina el token de autenticación de localStorage.
   */
  logout(): void {
    localStorage.removeItem('authToken'); // Elimina el token
    localStorage.removeItem('username'); // Elimina el nombre de usuario
  }
  
  /**
 * Verifica si el usuario está autenticado.
 * @returns True si el usuario tiene un token, false de lo contrario.
 */
isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken'); // Devuelve true si hay un token
}


}
