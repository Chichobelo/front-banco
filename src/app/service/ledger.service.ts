import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Movimiento {
  fecha: string; // ISO
  descripcion: string;
  referencia: string;
  documento: string;
  valor: number; // negativo para egreso, positivo para ingreso
}

export interface Cuenta {
  tipo: 'Cuenta Corriente' | 'Cuenta de Ahorros' | 'Tarjeta de Crédito' | string;
  numero: string; // ****4521
  saldo: number;
  icono?: string;
}

export interface LedgerState {
  cuentas: Cuenta[];
  movimientos: Movimiento[];
}

const STORAGE_PREFIX = 'ledgerState:';

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private subject: BehaviorSubject<LedgerState>;

  constructor() {
    const state = this.load() || this.defaultState();
    this.subject = new BehaviorSubject<LedgerState>(state);
  }

  get state$() { return this.subject.asObservable(); }
  get snapshot(): LedgerState { return this.subject.getValue(); }

  private getStorageKey(): string {
    const user = (localStorage.getItem('username') || 'anon').trim().toLowerCase();
    return `${STORAGE_PREFIX}${user}`;
  }

  private defaultState(): LedgerState {
    return {
      cuentas: [
        { tipo: 'Cuenta Corriente', numero: '****4521', saldo: 0, icono: 'bi bi-wallet2' },
        { tipo: 'Cuenta de Ahorros', numero: '****8932', saldo: 1000000.0, icono: 'bi bi-piggy-bank' },
        { tipo: 'Tarjeta de Crédito', numero: '****3456', saldo: 0, icono: 'bi bi-credit-card-2-front' },
      ],
      movimientos: [
        { fecha: new Date().toISOString(), descripcion: 'Saldo inicial', referencia: 'INIT', documento: 'INIT', valor: 0 }
      ]
    };
  }

  private load(): LedgerState | null {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      return raw ? JSON.parse(raw) as LedgerState : null;
    } catch { return null; }
  }

  private save(state: LedgerState) {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
    // Notificar (además del BehaviorSubject) por si otros listeners usan eventos
    window.dispatchEvent(new CustomEvent('app:ledger-updated'));
  }

  resetToDefaults() {
    const st = this.defaultState();
    this.subject.next(st);
    this.save(st);
  }

  // Fuerza a recargar el estado para el usuario actual (nuevo login)
  reloadForCurrentUser() {
    const st = this.load() || this.defaultState();
    this.subject.next(st);
    this.save(st);
  }

  // Restablece saldos como demo: Ahorros = 1,000,000; otras en 0; historial básico
  resetToMillion() {
    const st: LedgerState = {
      cuentas: [
        { tipo: 'Cuenta Corriente', numero: '****4521', saldo: 0, icono: 'bi bi-wallet2' },
        { tipo: 'Cuenta de Ahorros', numero: '****8932', saldo: 1000000.0, icono: 'bi bi-piggy-bank' },
        { tipo: 'Tarjeta de Crédito', numero: '****3456', saldo: 0, icono: 'bi bi-credit-card-2-front' },
      ],
      movimientos: [
        { fecha: new Date().toISOString(), descripcion: 'Saldo inicial', referencia: 'INIT', documento: 'INIT', valor: 0 }
      ]
    };
    this.subject.next(st);
    this.save(st);
  }

  // Verifica si se puede debitar un monto de una cuenta específica
  canDebit(monto: number, cuentaTipo: Cuenta['tipo'] = 'Cuenta de Ahorros'): boolean {
    const c = this.snapshot.cuentas.find(x => x.tipo === cuentaTipo);
    if (!c) return false;
    return c.saldo >= monto;
  }

  // Intenta agregar un movimiento; si es egreso y no hay saldo, no aplica y retorna false
  tryAddMovimiento(descripcion: string, amount: number, opts?: { cuenta?: Cuenta['tipo']; referencia?: string; documento?: string; fecha?: Date }): boolean {
    const cuentaTipo = opts?.cuenta || 'Cuenta de Ahorros';
    if (amount < 0) {
      const necesario = Math.abs(amount);
      if (!this.canDebit(necesario, cuentaTipo)) {
        return false;
      }
    }
    this.addMovimiento(descripcion, amount, opts);
    return true;
  }

  // amount negativo para egresos
  addMovimiento(descripcion: string, amount: number, opts?: { cuenta?: Cuenta['tipo']; referencia?: string; documento?: string; fecha?: Date }) {
    const st = { ...this.snapshot, cuentas: [...this.snapshot.cuentas], movimientos: [...this.snapshot.movimientos] };

    const cuentaTipo = opts?.cuenta || 'Cuenta de Ahorros';
  const cuenta = st.cuentas.find(c => c.tipo === cuentaTipo);
  if (cuenta) cuenta.saldo = cuenta.saldo + amount; // la validación de negativo se hace en tryAddMovimiento/canDebit

    const fechaIso = (opts?.fecha || new Date()).toISOString();
    const ref = opts?.referencia || this.genRef('MOV');
    const doc = opts?.documento || this.genRef('DOC');

    st.movimientos.unshift({ fecha: fechaIso, descripcion, referencia: ref, documento: doc, valor: amount });

    this.subject.next(st);
    this.save(st);
  }

  private genRef(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).substring(2,10).toUpperCase()}`;
  }
}
