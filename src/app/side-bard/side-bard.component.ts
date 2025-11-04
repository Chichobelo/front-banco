import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-side-bard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bard.component.html',
  styleUrls: ['./side-bard.component.css']
})
export class SideBardComponent {
  isCollapsed = false;
  isOpen = false;
  isMobile = false;
  activeAccordion: string | null = null;

  user = {
    name: 'Juan Pérez',
    role: 'Cliente Premium',
    initials: 'JD'
  };

  menuItems = [
    { label: 'Inicio', icon: 'fa-solid fa-house', link: '/home' },
    {
      label: 'Transferencias',
      icon: 'fa-solid fa-arrow-right-arrow-left',
      // Parent acts as accordion; children are the actions
      children: [
  { label: 'Transferir', icon: 'bi bi-arrow-right-circle', link: '/transferencia' },
        { label: 'Recargar', icon: 'bi bi-phone', link: '/recargar' },
        { label: 'Pagar facturas', icon: 'bi bi-receipt', link: '/pagar-facturas' }
      ]
    },
    { label: 'Inversiones', icon: 'fa-solid fa-chart-line', link: '/inversiones' },
    { label: 'Tarjetas', icon: 'fa-solid fa-credit-card', link: '/tarjetas' }
  ];

  constructor(private router: Router) {
    this.checkScreenSize();
  }

  confirmLogout() {
    Swal.fire({
      title: '¿Seguro que quieres salir de la app?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#003e7d',
      cancelButtonColor: '#888'
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }

  toggleCollapse() {
    if (!this.isMobile) this.isCollapsed = !this.isCollapsed;
  }

  toggleSidebar() {
    if (this.isMobile) this.isOpen = !this.isOpen;
  }

  toggleAccordion(label: string) {
    this.activeAccordion = this.activeAccordion === label ? null : label;
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 992;
    if (this.isMobile) this.isCollapsed = false;
  }
}
