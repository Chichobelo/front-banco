import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { SideBardComponent } from '../side-bard/side-bard.component';

interface PortfolioPosition {
  asset: string;
  type: 'Acción' | 'Bono' | 'ETF' | 'Cripto';
  amount: number; // unidades
  price: number; // precio unitario
  changePct: number; // variación % diaria
}

@Component({
  selector: 'app-inversiones',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, SideBardComponent],
  templateUrl: './inversiones.component.html',
  styleUrls: ['./inversiones.component.css']
})
export class InversionesComponent implements OnInit {
  loading = signal(true);
  lastUpdate = signal<Date | null>(null);

  posiciones: PortfolioPosition[] = [
    { asset: 'AAPL', type: 'Acción', amount: 12, price: 188.24, changePct: 1.25 },
    { asset: 'MSFT', type: 'Acción', amount: 5, price: 412.37, changePct: -0.42 },
    { asset: 'TESLA', type: 'Acción', amount: 3, price: 232.11, changePct: 2.05 },
    { asset: 'ETH', type: 'Cripto', amount: 0.8, price: 3421.55, changePct: 4.2 },
    { asset: 'BonoCorp2028', type: 'Bono', amount: 10, price: 98.4, changePct: 0.05 },
    { asset: 'SPY', type: 'ETF', amount: 2, price: 553.17, changePct: -0.11 }
  ];

  get portfolioValue(): number {
    return this.posiciones.reduce((acc, p) => acc + p.amount * p.price, 0);
  }
  get dailyChange(): number {
    return this.posiciones.reduce((acc, p) => acc + (p.amount * p.price) * (p.changePct / 100), 0);
  }
  get dailyChangePct(): number {
    const base = this.portfolioValue - this.dailyChange;
    return base === 0 ? 0 : (this.dailyChange / base) * 100;
  }

  ngOnInit() {
    // Simular carga de datos
    setTimeout(() => {
      this.loading.set(false);
      this.lastUpdate.set(new Date());
      this.generateSparkData();
      this.generateAllocationData();
    }, 600);
  }

  // Datos para mini gráficas (sparklines) y distribución
  sparkSeries: number[] = [];
  allocation: { label: string; value: number; color: string }[] = [];

  generateSparkData() {
    // Generar pseudo serie de evolución en 20 puntos
    const base = this.portfolioValue * 0.9;
    let value = base;
    this.sparkSeries = Array.from({ length: 24 }, () => {
      value += (Math.random() - 0.45) * (this.portfolioValue * 0.005);
      return Math.max(value, 0);
    });
    this.computeSparkShapes();
  }

  generateAllocationData() {
    const byType: Record<string, number> = {};
    this.posiciones.forEach(p => {
      const val = p.amount * p.price;
      byType[p.type] = (byType[p.type] || 0) + val;
    });
    const raw = Object.entries(byType).map(([label, value], i) => ({
      label,
      value,
      color: ['#0b345d', '#134f92', '#2563eb', '#7c3aed', '#059669'][i % 5]
    }));
    const total = raw.reduce((s, x) => s + x.value, 0) || 1;
    const C = 2 * Math.PI * 90; // circunferencia para r=90 (coincide con SVG)
    let acc = 0;
    this.allocationView = raw.map(x => {
      const fraction = x.value / total;
      const dash = fraction * C;
      const view = {
        ...x,
        percent: fraction * 100,
        dasharray: `${dash} ${C}`,
        dashoffset: acc
      };
      acc += dash;
      return view;
    });
  }

  // ==== SPARKLINE COMPUTATION ====
  readonly SPARK_W = 400;
  readonly SPARK_H = 120;
  sparkPolyline = '';
  sparkPolygon = '';

  private computeSparkShapes() {
    if (!this.sparkSeries.length) {
      this.sparkPolyline = '';
      this.sparkPolygon = '';
      return;
    }
    const min = Math.min(...this.sparkSeries);
    const max = Math.max(...this.sparkSeries);
    const span = max - min || 1;
    const n = this.sparkSeries.length;
    const points: string[] = [];
    for (let i = 0; i < n; i++) {
      const x = (i * (this.SPARK_W / (n - 1)));
      const norm = (this.sparkSeries[i] - min) / span;
      const y = this.SPARK_H - norm * (this.SPARK_H - 10);
      points.push(`${x},${y}`);
    }
    this.sparkPolyline = points.join(' ');
    this.sparkPolygon = this.sparkPolyline + ` ${this.SPARK_W},${this.SPARK_H} 0,${this.SPARK_H}`;
  }

  // ==== PIE DATA FOR VIEW ====
  allocationView: Array<{ label: string; value: number; color: string; percent: number; dasharray: string; dashoffset: number }> = [];

  formatMoney(v: number): string {
    return '$' + v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
