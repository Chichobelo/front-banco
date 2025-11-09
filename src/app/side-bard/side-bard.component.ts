import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-side-bard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, RouterModule],
  templateUrl: './side-bard.component.html',
  styleUrls: ['./side-bard.component.css']
})
export class SideBardComponent {
  isCollapsed = false;
  isOpen = false;
  isMobile = false;
  activeAccordion: string | null = null;
  usuarioNombre: string = '';


  ngOnInit() {
    this.usuarioNombre = localStorage.getItem('username') || 'Usuario';
    // Restaurar estado del acordeón si existe
    const storedAccordion = localStorage.getItem('sidebarActiveAccordion');
    this.activeAccordion = storedAccordion ? storedAccordion : null;

    // Si no hay estado guardado, abrir automáticamente el acordeón del menú
    // que contenga la ruta actual (por ejemplo, transferencia/recargar/pagar-facturas)
    if (!this.activeAccordion) {
      const current = this.router.url;
      for (const item of this.menuItems) {
        if (item.children?.some((c: any) => current.startsWith(c.link))) {
          this.activeAccordion = item.label;
          break;
        }
      }
    }
  }
  user = {
    name: 'Juan Pérez',
    role: 'Cliente Premium',
    initials: ''
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
      cancelButtonColor: '#888',
      position: 'center'
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
    // Alternar pero persistir estado para no cerrarse al navegar
    this.activeAccordion = this.activeAccordion === label ? null : label;
    if (this.activeAccordion) {
      localStorage.setItem('sidebarActiveAccordion', this.activeAccordion);
    } else {
      localStorage.removeItem('sidebarActiveAccordion');
    }
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 992;
    if (this.isMobile) this.isCollapsed = false;
  }
}
