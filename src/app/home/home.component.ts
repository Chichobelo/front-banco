import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SideBardComponent } from '../side-bard/side-bard.component';
import { LedgerService, Cuenta, Movimiento } from '../service/ledger.service';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SideBardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  usuarioNombre: string = '';
  balanceTotal: number = 0;
  isSidebarCollapsed: boolean = false;
  mostrarSaldo: boolean = true;

  cuentas: Cuenta[] = [];

  movimientos: Movimiento[] = [];

  constructor(private ledger: LedgerService) {}

  ngOnInit() {
    this.usuarioNombre = localStorage.getItem('username') || 'Usuario';
    // Asegura cargar el ledger específico del usuario (si no existe crea uno con saldo inicial)
    this.ledger.reloadForCurrentUser();
    this.ledger.state$.subscribe(state => {
      this.cuentas = state.cuentas;
      this.movimientos = state.movimientos.slice(0, 20); // últimos 20
      this.balanceTotal = this.cuentas.reduce((acc, c) => acc + c.saldo, 0);
    });
  }

  toggleSaldo() {
    this.mostrarSaldo = !this.mostrarSaldo;
  }

  // Restablece saldo del usuario a 1,000,000 COP (solo Cuenta de Ahorros) y limpia historial
  restablecerSaldo() {
    this.ledger.resetToMillion();
  }

  // Recarga con selección de cuenta/tarjeta y validación amigable
  async recargarCuenta() {
    if (!this.cuentas.length) {
      await Swal.fire({ icon: 'error', title: 'Sin cuentas', text: 'No hay cuentas para recargar.' });
      return;
    }

    const options = this.cuentas
      .map((c, i) => `<option value="${c.tipo}">${c.tipo} · ${c.numero} · COP ${c.saldo.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</option>`) 
      .join('');

    const { value: formValues, isConfirmed } = await Swal.fire<{ tipo: string; monto: number; descripcion: string }>({
      title: 'Recargar cuenta o tarjeta',
      html: `
        <div class="text-start">
          <label class="form-label">Selecciona el destino</label>
          <select id="swal-cuenta" class="form-select mb-3">${options}</select>
          <label class="form-label">Monto (COP)</label>
          <input id="swal-monto" type="number" min="1000" step="1000" placeholder="Ej: 200000" class="form-control mb-3" />
          <label class="form-label">Descripción (opcional)</label>
          <input id="swal-desc" type="text" maxlength="80" placeholder="Ej: Recarga desde PayPal" class="form-control" />
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Recargar',
      confirmButtonColor: '#0b345d',
      preConfirm: () => {
        const tipo = (document.getElementById('swal-cuenta') as HTMLSelectElement)?.value;
        const monto = Number((document.getElementById('swal-monto') as HTMLInputElement)?.value);
        const descripcion = ((document.getElementById('swal-desc') as HTMLInputElement)?.value || '').trim();
        if (!tipo) {
          Swal.showValidationMessage('Selecciona una cuenta o tarjeta');
          return null as any;
        }
        if (!monto || isNaN(monto) || monto <= 0) {
          Swal.showValidationMessage('Ingresa un monto válido mayor a 0');
          return null as any;
        }
        return { tipo, monto, descripcion };
      }
    });

    if (!isConfirmed || !formValues) return;
    const { tipo, monto, descripcion } = formValues;
    const ref = 'DEP-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const desc = descripcion || `Recarga ${tipo}`;

    this.ledger.addMovimiento(desc, monto, {
      cuenta: tipo as any,
      documento: 'DEP',
      referencia: ref
    });

    await Swal.fire({
      icon: 'success',
      title: 'Recarga aplicada',
      html: `
        <div class="text-start">
          <div><strong>Destino:</strong> ${tipo}</div>
          <div><strong>Monto:</strong> COP ${monto.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</div>
          <div><strong>Referencia:</strong> ${ref}</div>
        </div>
      `,
      confirmButtonColor: '#0b345d'
    });
  }

  // Lee un Blob como DataURL
  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  // Obtiene dimensiones de una imagen a partir de un dataURL
  private getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
      img.onerror = () => reject(new Error('No se pudieron leer dimensiones de la imagen'));
      img.src = dataUrl;
    });
  }

  // Obtiene imagen remota/local como DataURL y devuelve formato compatible para jsPDF, con dimensiones
  private async fetchImageAsDataUrl(url: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG'; width: number; height: number }> {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('No se pudo cargar el recurso: ' + url);
    const blob = await res.blob();
    const type = (blob.type || '').toLowerCase();

    if (type === 'image/png') {
      const dataUrl = await this.blobToDataURL(blob);
      const { width, height } = await this.getImageDimensions(dataUrl);
      return { dataUrl, format: 'PNG', width, height };
    }
    if (type === 'image/jpeg' || type === 'image/jpg') {
      const dataUrl = await this.blobToDataURL(blob);
      const { width, height } = await this.getImageDimensions(dataUrl);
      return { dataUrl, format: 'JPEG', width, height };
    }

    // Convertir otros formatos (ej. WEBP, SVG) a PNG usando canvas
    try {
      const bmp = await (window as any).createImageBitmap?.(blob);
      if (bmp) {
        const canvas = document.createElement('canvas');
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context no disponible');
        ctx.drawImage(bmp, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        (bmp as ImageBitmap).close?.();
        return { dataUrl, format: 'PNG', width: canvas.width, height: canvas.height };
      }
    } catch { /* continuar con fallback */ }

    // Fallback usando HTMLImageElement
    const objUrl = URL.createObjectURL(blob);
    let imgWidth = 0, imgHeight = 0;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imgWidth = img.width;
        imgHeight = img.height;
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objUrl);
          reject(new Error('Canvas context no disponible'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
        URL.revokeObjectURL(objUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        reject(new Error('No se pudo convertir la imagen a PNG'));
      };
      img.src = objUrl;
    });
    return { dataUrl, format: 'PNG', width: imgWidth, height: imgHeight };
  }

  async generarExtracto() {
    const doc = new jsPDF();
    // Puedes usar una URL remota (se intentará cargar con CORS) o un asset local
    const logo = 'https://miro.medium.com/v2/resize:fit:640/format:webp/1*4oNWQCbibgtaD_0Z5RQtaA.png';

    // Encabezado con logo (si carga)
    try {
      const { dataUrl, format, width, height } = await this.fetchImageAsDataUrl(logo);
      // Escalar manteniendo proporción para que no se vea aplastado y un poco más grande
  // Aumentado un poco el tamaño máximo del logo
  const maxW = 50; // mm
  const maxH = 24; // mm
      const ratio = width / height || 1;
      let drawW = maxW;
      let drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }
      doc.addImage(dataUrl, format, 10, 10, drawW, drawH);
    } catch (e) {
      // Continuar sin logo si falla
      console.warn('Logo no disponible, se genera sin logo.');
    }
    doc.setFontSize(12);
    doc.text('Segure Bank - Extracto de Movimientos', 60, 20);
    doc.setFontSize(10);
    doc.text(`Usuario: ${this.usuarioNombre}`, 60, 26);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 60, 31);
    doc.line(10, 35, 200, 35);

    // Tabla de movimientos
    autoTable(doc, {
      startY: 40,
      head: [['Fecha', 'Descripción', 'Referencia', 'Documento', 'Valor']],
      body: this.movimientos.map(m => [
        m.fecha,
        m.descripcion,
        m.referencia,
        m.documento,
        m.valor < 0
          ? `-$${Math.abs(m.valor).toLocaleString()}`
          : `+$${m.valor.toLocaleString()}`
      ]),
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [0, 51, 102], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

  // Saldo final (suma de cuentas actuales)
  const total = this.cuentas.reduce((acc, c) => acc + c.saldo, 0);
  doc.setFontSize(11);
  // Posición segura tras la tabla
  const finalY = ((doc as any).lastAutoTable?.finalY ?? 40);
  doc.text(`Saldo Final: $${total.toLocaleString()}`, 14, finalY + 10);

    // Pie de página
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Documento generado automáticamente por Segure Bank © 2025', 14, 285);

    // Guardar PDF
    doc.save(`Extracto_${this.usuarioNombre}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Detecta cambios de tamaño de ventana
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if (window.innerWidth < 991) {
      this.isSidebarCollapsed = true;
    }
  }
}
