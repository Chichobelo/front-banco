import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SideBardComponent } from '../side-bard/side-bard.component';
import { LedgerService } from '../service/ledger.service';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-recargar',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBardComponent],
  templateUrl: './recargar.component.html',
  styleUrls: ['./recargar.component.css']
})
export class RecargarComponent {
  step: 'form' | 'success' = 'form';
  operador = '';
  numero = '';
  monto: number | null = null;
  referencia = '';
  fechaHora: Date | null = null;

  operadores = ['Claro', 'Tigo', 'Movistar', 'WOM'];

  get isFormValid() {
    return !!this.operador && !!this.numero && this.numero.length >= 7 && !!this.monto && this.monto > 0;
  }

  constructor(private ledger: LedgerService) {}

  confirmarRecarga() {
    if (!this.isFormValid) return;
    this.referencia = 'RCG-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    this.fechaHora = new Date();
    // Registrar egreso en ledger desde Cuenta de Ahorros
    const montoNum = this.monto || 0;
    const ok = this.ledger.tryAddMovimiento(`Recarga ${this.operador} ${this.numero}`, -montoNum, {
      cuenta: 'Cuenta de Ahorros',
      referencia: this.referencia,
      documento: 'RCG'
    });
    if (!ok) {
      Swal.fire({
        title: 'Saldo insuficiente',
        text: 'No hay fondos suficientes para realizar la recarga.',
        icon: 'error',
        confirmButtonColor: '#0b345d'
      });
      return;
    }
    Swal.fire({
      title: 'Recarga exitosa',
      text: 'Tu recarga ha sido procesada correctamente.',
      icon: 'success',
      confirmButtonText: 'Ver comprobante',
      confirmButtonColor: '#0b345d',
      position: 'center'
    }).then(() => {
      this.step = 'success';
    });
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

  async descargarComprobante() {
    const doc = new jsPDF();
    try {
      const logo = 'assets/segure-bank-logo.png';
      const data = await this.toDataURL(logo);
      doc.addImage(data, 'PNG', 12, 10, 28, 14);
    } catch {}

    doc.setFontSize(14);
    doc.text('Comprobante de Recarga', 60, 18);
    doc.setFontSize(10);
    doc.text(`Fecha: ${this.fechaHora ? this.fechaHora.toLocaleString() : new Date().toLocaleString()}`, 60, 24);
    doc.text(`Referencia: ${this.referencia}`, 60, 29);
    doc.line(12, 34, 198, 34);

    const y0 = 44;
    doc.setFontSize(11);
    doc.text('Operador:', 16, y0);
    doc.text(`${this.operador}`, 120, y0, { align: 'left' });
    doc.text('Número:', 16, y0 + 8);
    doc.text(`${this.numero}`, 120, y0 + 8, { align: 'left' });
    doc.text('Monto:', 16, y0 + 16);
    doc.text(`$${(this.monto || 0).toLocaleString()}`, 120, y0 + 16, { align: 'left' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Documento generado electrónicamente por Segure Bank', 16, 285);

    const file = `Comprobante_${this.referencia || 'recarga'}.pdf`;
    doc.save(file);
  }
}
