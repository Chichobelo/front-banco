import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  step = 1;

  user = {
    tipoDoc: '',
    numeroDoc: '',
    nombreCompleto: '',
    username: '',
    password: ''
  };

  constructor(private router: Router) {}

  nextStep() {
    // Validación visual con SweetAlert2 antes de pasar al paso 2
    if (!this.user.tipoDoc || !this.user.numeroDoc || !this.user.nombreCompleto) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos antes de continuar.',
        confirmButtonColor: '#003e7d'
      });
      return;
    }

    this.step = 2;
  }

  cancel() {
    this.step = 1;
  }

  onSubmit() {
    if (this.step === 1) {
      this.nextStep();
    } else {
      // Validación en el paso 2
      if (!this.user.username || !this.user.password) {
        Swal.fire({
          icon: 'warning',
          title: 'Datos faltantes',
          text: 'Debes ingresar un usuario y una contraseña.',
          confirmButtonColor: '#003e7d'
        });
        return;
      }

      // Simular éxito en el registro
      Swal.fire({
        icon: 'success',
        title: '¡Usuario creado!',
        text: `El usuario ${this.user.username} ha sido registrado correctamente.`,
        confirmButtonColor: '#003e7d',
        timer: 2500,
        timerProgressBar: true
      }).then(() => {
        this.router.navigate(['/login']);
      });
    }
  }
}
