import { dbService } from '../db/indexedDB.js';
import { calculateAverageCycleLength, calculateAveragePeriodDuration } from '../core/algorithms/cycleCalculator.js';

export class CycleHistoryComponent {
  constructor(containerId, onRefresh, onEdit) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.onRefresh = onRefresh;
    this.onEdit = onEdit;
  }

  async render() {
    if (!this.container) {
      this.container = document.getElementById(this.containerId);
    }

    if (!this.container) {
      console.warn(`[CycleHistoryComponent] Elemen #${this.containerId} tidak ditemukan di DOM.`);
      return;
    }

    this.container.innerHTML = '';

    try {
      const cycles = (await dbService.getCycles()) || [];

      // Update Angka Statistik Kartu Atas
      const avgCycleEl = document.getElementById('stat-avg-cycle');
      const avgPeriodEl = document.getElementById('stat-avg-period');
      const totalCyclesEl = document.getElementById('stat-total-cycles');

      if (avgCycleEl) avgCycleEl.innerText = typeof calculateAverageCycleLength === 'function' ? calculateAverageCycleLength(cycles) : 28;
      if (avgPeriodEl) avgPeriodEl.innerText = typeof calculateAveragePeriodDuration === 'function' ? calculateAveragePeriodDuration(cycles) : 5;
      if (totalCyclesEl) totalCyclesEl.innerText = cycles.length;

      if (cycles.length === 0) {
        this.container.innerHTML = `
          <div class="text-center py-10 text-slate-400 text-xs font-semibold space-y-2">
            <i class="fa-solid fa-box-open text-3xl text-slate-300"></i>
            <p>Belum ada riwayat haid yang dicatat.</p>
          </div>
        `;
        return;
      }

      cycles.forEach((cycle, index) => {
        const item = document.createElement('div');
        item.className = 'flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-all gap-3';
        
        const startDate = cycle.startDate || '-';
        const endDate = cycle.isOngoing ? 'Masih Berlangsung' : (cycle.endDate || '-');
        const duration = cycle.periodDuration ? `${cycle.periodDuration} Hari` : (cycle.isOngoing ? 'Berlangsung' : '-');

        item.innerHTML = `
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-800">Siklus ${cycles.length - index}</span>
              ${cycle.isOngoing ? '<span class="text-[10px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full">Aktif</span>' : ''}
            </div>
            <p class="text-xs text-slate-500 font-medium">
              <i class="fa-regular fa-calendar-check text-rose-500 mr-1"></i>
              ${startDate} s/d ${endDate} <strong class="text-slate-700">(${duration})</strong>
            </p>
          </div>
          <div class="flex items-center gap-2 self-end sm:self-auto">
            <button data-id="${cycle.id}" class="btn-edit-cycle px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-amber-200 shadow-sm active:scale-95">
              <i class="fa-solid fa-pen-to-square text-xs"></i>
              <span>Edit</span>
            </button>
            <button data-id="${cycle.id}" class="btn-delete-cycle px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-200 shadow-sm active:scale-95">
              <i class="fa-solid fa-trash-can text-xs"></i>
              <span>Hapus</span>
            </button>
          </div>
        `;

        const editBtn = item.querySelector('.btn-edit-cycle');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            if (typeof this.onEdit === 'function') this.onEdit(cycle);
          });
        }

        const deleteBtn = item.querySelector('.btn-delete-cycle');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            if (confirm('Apakah kamu yakin ingin menghapus data haid ini?')) {
              await dbService.deleteCycle(cycle.id);
              if (typeof this.onRefresh === 'function') this.onRefresh();
            }
          });
        }

        this.container.appendChild(item);
      });
    } catch (err) {
      console.error('[CycleHistoryComponent] Error saat merender riwayat:', err);
    }
  }
}