import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SideBardComponent } from '../side-bard/side-bard.component';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-transferencia',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBardComponent],
  templateUrl: './transferencia.component.html',
  styleUrls: ['./transferencia.component.css'],
})
export class TransferenciaComponent {
  cuentaOrigen = '';
  cuentaDestino = '';
  monto: number | null = null;
  descripcion = '';
  requireSms = true;
  cuentasOrigen = ['****4521 - Cuenta Corriente', '****8932 - Cuenta de Ahorros'];
  step: 'form' | 'review' | 'success' = 'form';
  balanceDisponible = 23456.9; // demo
  referencia = '';
  fechaHora: Date | null = null;

  get isFormValid() {
    return (
      !!this.cuentaOrigen &&
      !!this.cuentaDestino &&
      this.monto !== null &&
      this.monto > 0
    );
  }

  get saldoDespues() {
    const m = this.monto || 0;
    return Math.max(this.balanceDisponible - m, 0);
  }

  get fechaHoraMostrar(): Date {
    return this.fechaHora ?? new Date();
  }

  goToReview() {
    if (!this.isFormValid) return;
    this.step = 'review';
  }

  goBackToEdit() {
    this.step = 'form';
  }

  confirmarTransferencia() {
    // Aquí iría la verificación SMS/OTP y la llamada al servicio real
    // Para demo: generamos referencia y pasamos a pantalla de éxito
    this.referencia = 'TRX-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    this.fechaHora = new Date();
    // Mostrar alerta de éxito y luego mostrar la vista de comprobante
    Swal.fire({
      title: 'Transferencia exitosa',
      text: 'Su transferencia ha sido procesada correctamente.',
      icon: 'success',
      confirmButtonText: 'Ver comprobante',
      confirmButtonColor: '#0b345d'
    }).then(() => {
      this.step = 'success';
    });
  }

  // Utilidad: convierte asset/URL a dataURL para jsPDF
  private async toDataURL(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  async descargarComprobante() {
    const doc = new jsPDF();
    // Logo opcional desde assets si existe
    try {
      const logo = 'assets/segure-bank-logo.png';
      const data = await this.toDataURL(logo);
      doc.addImage(data, 'PNG', 12, 10, 28, 14);
    } catch {}

    doc.setFontSize(14);
    doc.text('Comprobante de Transferencia', 60, 18);
    doc.setFontSize(10);
    doc.text(`Fecha: ${this.fechaHora ? this.fechaHora.toLocaleString() : new Date().toLocaleString()}`, 60, 24);
    doc.text(`Referencia: ${this.referencia}`, 60, 29);
    doc.line(12, 34, 198, 34);

    const y0 = 44;
    doc.setFontSize(11);
    doc.text('Monto transferido:', 16, y0);
    doc.text(`$${(this.monto || 0).toLocaleString()}`, 120, y0, { align: 'left' });
    doc.text('Cuenta destino:', 16, y0 + 8);
    doc.text(`${this.cuentaDestino}`, 120, y0 + 8, { align: 'left' });
    doc.text('Descripción:', 16, y0 + 16);
    doc.text(`${this.descripcion || '-'}`, 120, y0 + 16, { align: 'left' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Documento generado electrónicamente por Segure Bank', 16, 285);

    const file = `Comprobante_${this.referencia || 'transferencia'}.pdf`;
    doc.save(file);
  }
}
