import { getPhaseForDate } from '../core/algorithms/phaseEngine.js';

const PHASE_STYLES = {
  menstrual: {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    text: 'text-rose-700'
  },
  follicular: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700'
  },
  ovulation: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700'
  },
  luteal: {
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    text: 'text-purple-700'
  }
};

export class CalendarComponent {
  constructor(containerId, onDateClick) {
    this.containerId = containerId;
    this.onDateClick = onDateClick;
    this.currentDate = new Date();
  }

  goToCurrentMonth() {
    this.currentDate = new Date();
  }

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
  }

  render(cycles = [], moodEntries = [], avgCycle = 28) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const monthYearEl = document.getElementById('calendar-month-year');
    if (monthYearEl) {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      monthYearEl.innerText = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    container.innerHTML = '';
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    // Petak Kosong Awal Bulan
    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'h-12 sm:h-16 rounded-2xl bg-slate-100/40';
      container.appendChild(emptyCell);
    }

    // Perulangan Hari Bulan Ini
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Hitung fase untuk tanggal ini
      let phaseKey = null;
      if (cycles && cycles.length > 0 && typeof getPhaseForDate === 'function') {
        const phaseInfo = getPhaseForDate(dateStr, cycles, avgCycle);
        if (phaseInfo && phaseInfo.phase && phaseInfo.phase !== 'unrecorded') {
          phaseKey = phaseInfo.phase;
        }
      }

      const style = phaseKey ? PHASE_STYLES[phaseKey] : null;
      const cell = document.createElement('div');
      
      let baseClasses = 'h-12 sm:h-16 rounded-2xl p-1.5 sm:p-2 border transition-all cursor-pointer flex flex-col justify-between shadow-sm';

      if (style) {
        baseClasses += ` ${style.badge}`;
      } else {
        baseClasses += ' border-slate-100 bg-white hover:border-rose-300';
      }

      if (dateStr === todayStr) {
        baseClasses += ' ring-2 ring-rose-500';
      }

      cell.className = baseClasses;

      cell.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold ${dateStr === todayStr ? 'text-rose-600' : (style ? style.text : 'text-slate-700')}">${day}</span>
          ${style ? `<span class="w-2.5 h-2.5 rounded-full ${style.dot} shadow-sm"></span>` : ''}
        </div>
        <div class="flex items-center gap-1 justify-end"></div>
      `;

      cell.addEventListener('click', () => {
        if (typeof this.onDateClick === 'function') {
          this.onDateClick(dateStr);
        }
      });

      container.appendChild(cell);
    }
  }
}