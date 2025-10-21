import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

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

  user = {
    name: 'Juan Pérez',
    role: 'Cliente Premium',
    initials: 'JD'
  };

  menuItems = [
    { label: 'Inicio', icon: 'fa-solid fa-house', link: '/inicio' },
    { label: 'Transferencias', icon: 'fa-solid fa-arrow-right-arrow-left', link: '/transferencias' },
    { label: 'Inversiones', icon: 'fa-solid fa-chart-line', link: '/inversiones' },
    { label: 'Tarjetas', icon: 'fa-solid fa-credit-card', link: '/tarjetas' }
  ];

  constructor() {
    this.checkScreenSize();
  }

  toggleCollapse() {
    if (!this.isMobile) this.isCollapsed = !this.isCollapsed;
  }

  toggleSidebar() {
    if (this.isMobile) this.isOpen = !this.isOpen;
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 992;
    if (this.isMobile) this.isCollapsed = false;
  }
}
