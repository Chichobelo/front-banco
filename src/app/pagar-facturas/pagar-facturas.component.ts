import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SideBardComponent } from '../side-bard/side-bard.component';
import { LedgerService } from '../service/ledger.service';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

type EstadoFactura = 'pendiente' | 'pagada';
interface Factura {
  id: string;
  servicio: string;
  empresa: string;
  referencia: string;
  monto: number;
  fechaLimite?: string;
  estado: EstadoFactura;
  comprobante?: { ref: string; fecha: string };
}

@Component({
  selector: 'app-pagar-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBardComponent],
  templateUrl: './pagar-facturas.component.html',
  styleUrls: ['./pagar-facturas.component.css']
})
export class PagarFacturasComponent implements OnInit {
  // UI state
  showForm = false; // legacy flag no longer used in UI rendering
  selected: Factura | null = null;
  modalOpen = false;
  modalView: 'add' | 'detail' | 'confirm' | 'success' | null = null;

  // Form fields
  servicio = '';
  referencia = '';
  empresa = '';
  monto: number | null = null;
  fechaLimite: string = '';

  // Catálogos
  servicios = ['Agua', 'Energía', 'Gas', 'Internet', 'Teléfono'];
  empresas = ['Empresa A', 'Empresa B', 'Proveedor X', 'Proveedor Y'];

  // Datos
  facturas: Factura[] = [];

  get pendientesCount(): number {
    return this.facturas.filter(f => f.estado === 'pendiente').length;
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('facturas');
    if (saved) {
      this.facturas = JSON.parse(saved);
    } else {
      // Semilla de ejemplo
      this.facturas = [
        { id: crypto.randomUUID(), servicio: 'Agua', empresa: 'Empresa A', referencia: 'AG-2025-00123', monto: 45000, estado: 'pendiente', fechaLimite: '' },
        { id: crypto.randomUUID(), servicio: 'Energía', empresa: 'Proveedor X', referencia: 'EN-88991', monto: 128000, estado: 'pendiente', fechaLimite: '' },
        { id: crypto.randomUUID(), servicio: 'Internet', empresa: 'Empresa B', referencia: 'INT-55667', monto: 95000, estado: 'pagada', comprobante: { ref: 'FAC-DEMO-1', fecha: new Date().toISOString() } }
      ];
      this.persist();
    }
  }

  get isFormValid() {
    return !!this.servicio && !!this.empresa && !!this.referencia && this.referencia.length >= 5 && !!this.monto && this.monto > 0;
  }

  toggleForm() {
    // legacy toggle kept for compatibility; now opens clean modal
    this.openAddModal();
  }

  openAddModal() {
    this.modalOpen = true;
    this.modalView = 'add';
    this.selected = null;
  }

  openDetailModal(f: Factura) {
    this.modalOpen = true;
    this.modalView = 'detail';
    this.selected = f;
  }

  closeModal() {
    this.modalOpen = false;
    this.modalView = null;
  }

  agregarFactura() {
    if (!this.isFormValid) return;
    const f: Factura = {
      id: crypto.randomUUID(),
      servicio: this.servicio,
      empresa: this.empresa,
      referencia: this.referencia,
      monto: this.monto || 0,
      fechaLimite: this.fechaLimite || undefined,
      estado: 'pendiente'
    };
    this.facturas.unshift(f);
    this.persist();
    // limpiar form y mostrar detalle
    this.servicio = this.empresa = this.referencia = '';
    this.monto = null;
    this.fechaLimite = '';
    this.selected = f;
    this.modalView = 'detail';
    this.modalOpen = true;
  }

  verFactura(f: Factura) {
    this.openDetailModal(f);
  }

  pagar(f: Factura) {
    if (f.estado === 'pagada') return;
    // Paso de confirmación: mostrar pantalla de confirmar pago dentro del modal
    this.selected = f;
    this.modalView = 'confirm';
    this.modalOpen = true;
  }

  constructor(private ledger: LedgerService) {}

  confirmarPago() {
    const f = this.selected;
    if (!f || f.estado === 'pagada') return;
    const ref = 'FAC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    f.estado = 'pagada';
    f.comprobante = { ref, fecha: new Date().toISOString() };
    this.persist();
    // Registrar egreso en ledger
    const ok = this.ledger.tryAddMovimiento(`Pago factura ${f.empresa}/${f.referencia}`, -f.monto, {
      cuenta: 'Cuenta de Ahorros',
      referencia: ref,
      documento: 'FAC'
    });
    if (!ok) {
      // Revertir estado si no se pudo aplicar por falta de saldo
      f.estado = 'pendiente';
      f.comprobante = undefined;
      this.persist();
      Swal.fire({
        title: 'Saldo insuficiente',
        text: 'No hay fondos suficientes para pagar esta factura.',
        icon: 'error',
        confirmButtonColor: '#0b345d'
      });
      return;
    }
    // Transicionar a éxito
    this.modalView = 'success';
    this.modalOpen = true;
  }

  private persist() {
    localStorage.setItem('facturas', JSON.stringify(this.facturas));
  }

  private async toDataURL(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  async descargarComprobante(f?: Factura) {
    const factura = f || this.selected;
    if (!factura) return;
    const doc = new jsPDF();
    try {
      const logo = 'assets/segure-bank-logo.png';
      const data = await this.toDataURL(logo);
      doc.addImage(data, 'PNG', 12, 10, 28, 14);
    } catch {}

    const fechaStr = factura.comprobante?.fecha
      ? new Date(factura.comprobante.fecha).toLocaleString()
      : new Date().toLocaleString();

    doc.setFontSize(14);
    doc.text('Comprobante de Pago de Factura', 60, 18);
    doc.setFontSize(10);
    doc.text(`Fecha: ${fechaStr}`, 60, 24);
    doc.text(`Comprobante: ${factura.comprobante?.ref || 'PENDIENTE'}`, 60, 29);
    doc.line(12, 34, 198, 34);

    const y0 = 44;
    doc.setFontSize(11);
    doc.text('Servicio:', 16, y0);
    doc.text(`${factura.servicio}`, 120, y0, { align: 'left' });
    doc.text('Empresa:', 16, y0 + 8);
    doc.text(`${factura.empresa}`, 120, y0 + 8, { align: 'left' });
    doc.text('Referencia:', 16, y0 + 16);
    doc.text(`${factura.referencia}`, 120, y0 + 16, { align: 'left' });
    doc.text('Monto:', 16, y0 + 24);
    doc.text(`$${(factura.monto || 0).toLocaleString()}`, 120, y0 + 24, { align: 'left' });
    if (factura.fechaLimite) {
      doc.text('Fecha límite:', 16, y0 + 32);
      doc.text(`${factura.fechaLimite}`, 120, y0 + 32, { align: 'left' });
    }

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Documento generado electrónicamente por Segure Bank', 16, 285);

    doc.save(`Pago_${factura.comprobante?.ref || factura.referencia}.pdf`);
  }
}
