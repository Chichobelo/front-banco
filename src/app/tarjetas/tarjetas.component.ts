import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SideBardComponent } from '../side-bard/side-bard.component';
import Swal from 'sweetalert2';

interface Tarjeta {
  id: string;
  alias: string;
  numero: string; // puede ser enmascarado o completo, según 'masked'
  numeroFull?: string; // número completo seguro en localStorage (demo)
  titular: string;
  vence: string; // MM/YY
  bloqueada: boolean;
  limite: number; // limite total
  usado: number; // monto usado
  color: string; // para personalización
  tipo: 'Crédito' | 'Débito';
  masked?: boolean; // indica si 'numero' está enmascarado
}

@Component({
  selector: 'app-tarjetas',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBardComponent],
  templateUrl: './tarjetas.component.html',
  styleUrls: ['./tarjetas.component.css']
})
export class TarjetasComponent implements OnInit {
  tarjetas: Tarjeta[] = [];
  selected: Tarjeta | null = null;
  modalOpen = false;
  modalView: 'add' | 'detail' | null = null;
  usuarioNombre: string = '';

  // Form fields
  alias = '';
  numero = '';
  titular = '';
  vence = '';
  tipo: 'Crédito' | 'Débito' | '' = '';
  limite: number | null = null;
  color = '#0b345d';

  loading = signal(true);

  ngOnInit(): void {
    // Nombre de usuario desde el login
    this.usuarioNombre = localStorage.getItem('username') || 'Usuario';

    const saved = localStorage.getItem('tarjetas');
    if (saved) {
      this.tarjetas = JSON.parse(saved);
      // Migración: asegurar estructura numeroFull/masked
  let changedMigration = false;
  this.tarjetas = this.tarjetas.map(t => {
        const clone = { ...t } as Tarjeta;
        // Si ya tiene numeroFull, mantener; si no, generar a partir del sufijo existente (demo)
        if (!clone.numeroFull) {
          const last4 = (clone.numero.match(/(\d{4})$/)?.[1]) || '0000';
          // Genera 12 dígitos aleatorios + last4 (solo demo)
          const prefix = Array.from({length:12}, ()=> Math.floor(Math.random()*10)).join('');
          clone.numeroFull = `${prefix}${last4}`;
          changedMigration = true;
        }
        // Normaliza campo masked y numero mostrado
        if (clone.masked === undefined) {
          clone.masked = true;
          changedMigration = true;
        }
        clone.numero = clone.masked ? this.mask(clone.numeroFull) : this.formatFull(clone.numeroFull);
        return clone;
      });
      if (changedMigration) this.persist();
      // Migración suave: si hay tarjetas con titular por defecto, actualiza al usuario activo
      let changed = false;
      this.tarjetas = this.tarjetas.map(t => {
        const titularDefecto = !t.titular || t.titular.trim() === '' || t.titular === 'Juan Pérez';
        if ((titularDefecto || t.titular !== this.usuarioNombre) && this.usuarioNombre) {
          // Solo reasigna si venía vacío o de demo; o fuerza al usuario activo por requerimiento
          changed = true;
          return { ...t, titular: this.usuarioNombre };
        }
        return t;
      });
      if (changed) this.persist();
    } else {
      const titular = this.usuarioNombre;
  let changed = false; // reuse variable for initial creation path
  this.tarjetas = [
        this.demo('Mi Visa', this.randomFull('4521'), titular, '08/27', 'Crédito', 8000000, 2650000, '#0b345d'),
        this.demo('Ahorros', this.randomFull('8932'), titular, '03/29', 'Débito', 0, 0, '#6366f1'),
        this.demo('Gold', this.randomFull('3456'), titular, '12/26', 'Crédito', 12000000, 4500000, '#b45309')
      ];
      this.persist();
    }
    setTimeout(()=> this.loading.set(false), 400);
  }

  private demo(alias: string, numeroFull: string, titular: string, vence: string, tipo: 'Crédito'|'Débito', limite: number, usado: number, color: string): Tarjeta {
    return { id: crypto.randomUUID(), alias, numero: this.mask(numeroFull), numeroFull, masked: true, titular, vence, bloqueada: false, limite, usado, tipo, color };
  }

  get progreso(): number {
    if (!this.selected) return 0;
    if (this.selected.tipo === 'Débito') return 0; // no aplica barra de límite
    const pct = (this.selected.usado / this.selected.limite) * 100;
    return Math.min(Math.max(pct, 0), 100);
  }

  openAdd() {
    this.modalOpen = true;
    this.modalView = 'add';
    this.selected = null;
    this.alias = this.numero = this.vence = '';
    this.titular = this.usuarioNombre;
    this.tipo = '';
    this.limite = null;
    this.color = '#0b345d';
  }

  openDetail(t: Tarjeta) {
    this.selected = t;
    this.modalOpen = true;
    this.modalView = 'detail';
  }

  closeModal() {
    this.modalOpen = false;
    this.modalView = null;
  }

  get isFormValid(): boolean {
    return !!this.alias && !!this.numero && /\d{4}$/.test(this.numero) && !!this.titular && !!this.vence && !!this.tipo && (this.tipo === 'Débito' || (!!this.limite && this.limite > 0));
  }

  agregarTarjeta() {
    if (!this.isFormValid) return;
    const full = this.buildFullFromLast4(this.numero);
  const t: Tarjeta = {
      id: crypto.randomUUID(),
      alias: this.alias,
      numero: this.mask(full),
      numeroFull: full,
      masked: true,
      titular: this.titular,
      vence: this.vence,
      bloqueada: false,
      limite: this.tipo === 'Crédito' ? (this.limite || 0) : 0,
      usado: 0,
  tipo: (this.tipo as 'Crédito'|'Débito'),
      color: this.color
    };
    this.tarjetas.unshift(t);
    this.persist();
    this.closeModal();
    Swal.fire({
      title: 'Tarjeta agregada',
      text: 'La tarjeta se registró correctamente.',
      icon: 'success',
      confirmButtonColor: '#0b345d',
      position: 'center'
    });
  }

  private buildFullFromLast4(last4: string): string {
    const d = last4.replace(/[^0-9]/g, '').slice(-4).padStart(4,'0');
    const prefix = Array.from({length:12}, ()=> Math.floor(Math.random()*10)).join('');
    return prefix + d;
  }

  private randomFull(last4: string): string { return this.buildFullFromLast4(last4); }
  private mask(full: string): string { return '**** **** **** ' + full.slice(-4); }
  private formatFull(full: string): string { return full.replace(/(\d{4})(?=\d)/g, '$1 ').trim(); }

  toggleBloqueo(t: Tarjeta) {
    t.bloqueada = !t.bloqueada;
    this.persist();
  }

  toggleMostrarNumero(t: Tarjeta) {
    if (!t.numeroFull) return;
    t.masked = !t.masked;
    t.numero = t.masked ? this.mask(t.numeroFull) : this.formatFull(t.numeroFull);
    this.persist();
  }

  simularUso(t: Tarjeta) {
    if (t.tipo !== 'Crédito') return;
    // Simular un cargo aleatorio entre 1% y 6% del límite libre
    const restante = t.limite - t.usado;
    if (restante <= 0) return;
    const cargo = Math.min(restante, Math.max(restante * (Math.random()*0.05 + 0.01), 20000));
    t.usado += cargo;
    this.persist();
  }

  reducirUso(t: Tarjeta) {
    if (t.tipo !== 'Crédito') return;
    if (t.usado <= 0) return;
    // Simular pago de entre 5% y 20%
    const pago = Math.max(t.usado * (Math.random()*0.15 + 0.05), 50000);
    t.usado = Math.max(t.usado - pago, 0);
    this.persist();
  }

  eliminar(t: Tarjeta) {
    Swal.fire({
      title: 'Eliminar tarjeta',
      text: '¿Seguro? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      position: 'center'
    }).then(r => {
      if (r.isConfirmed) {
        this.tarjetas = this.tarjetas.filter(x => x.id !== t.id);
        if (this.selected?.id === t.id) this.selected = null;
        this.persist();
      }
    });
  }

  persist() {
    localStorage.setItem('tarjetas', JSON.stringify(this.tarjetas));
  }
}
