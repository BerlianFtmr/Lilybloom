import { dbService } from './db/indexedDB.js';
import { LocalStorageService } from './db/localStorage.js';
import { calculateAverageCycleLength, calculateAveragePeriodDuration, getDaysDiff } from './core/algorithms/cycleCalculator.js';
import { getPhaseForDate, calculatePhases } from './core/algorithms/phaseEngine.js';
import { notificationService } from './core/services/notificationService.js';

import { CalendarComponent } from './components/Calendar.js';
import { JournalFormComponent } from './components/JournalForm.js';
import { DayDetailModalComponent } from './components/DayDetailModal.js';
import { CycleHistoryComponent } from './components/CycleHistory.js';
import { SettingsModalComponent } from './components/SettingsModal.js';

const PHASE_DETAILS = {
  menstrual: {
    name: 'Fase Menstruasi',
    color: 'from-rose-500 to-pink-600',
    desc: 'Pendarahan luruhnya lapisan rahim. Estrogen & progesteron berada di titik terendah. Disarankan cukup istirahat dan zat besi.'
  },
  follicular: {
    name: 'Fase Folikuler',
    color: 'from-emerald-500 to-teal-600',
    desc: 'Tingkat estrogen mulai meningkat. Energi, fokus, dan motivasi mental kamu memuncak. Waktu yang baik untuk produktivitas.'
  },
  ovulation: {
    name: 'Fase Ovulasi (Masa Subur)',
    color: 'from-amber-500 to-orange-600',
    desc: 'Pelepasan sel telur matang. Puncak rasa percaya diri, stamina fisik, dan dorongan sosial paling tinggi.'
  },
  luteal: {
    name: 'Fase Luteal',
    color: 'from-purple-500 to-indigo-600',
    desc: 'Peningkatan hormon progesteron. Energi perlahan menurun dan dapat memicu gejala PMS. Luangkan waktu untuk self-care.'
  },
  unrecorded: {
    name: 'Fase Tidak Tercatat / Siklus Panjang',
    color: 'from-[#f19fb9] to-[#e088a5]',
    desc: 'Siklus melebihi proyeksi rata-rata. Proyeksi akan diperbarui otomatis saat kamu mencatat tanggal haid terbaru.'
  }
};

class App {
  constructor() {
    this.calendar = null;
    this.journalForm = null;
    this.dayDetailModal = null;
    this.cycleHistory = null;
    this.settingsModal = null;
    this.editingCycleId = null;
  }

  async init() {
    try {
      await dbService.init();
      LocalStorageService.updateLastVisit();

      if (!LocalStorageService.isInstalled()) {
        LocalStorageService.setInstalled('1.2.0');
        await this.seedInitialMockData();
      }

      this.dayDetailModal = new DayDetailModalComponent(() => this.refreshAllViews());
      this.calendar = new CalendarComponent('calendar-days-grid', (dateStr) => {
        if (this.dayDetailModal) this.dayDetailModal.open(dateStr);
      });
      
      this.journalForm = new JournalFormComponent();
      if (this.journalForm && typeof this.journalForm.initQuickMoodWidget === 'function') {
        this.journalForm.initQuickMoodWidget(() => {
          this.showToast('Log harian kamu berhasil disimpan! 🌸');
          this.refreshAllViews();
        });
      }

      this.cycleHistory = new CycleHistoryComponent(
        'history-list-container',
        () => {
          this.refreshAllViews();
          this.showToast('Siklus telah dihapus.');
        },
        (cycleToEdit) => {
          this.openPeriodModal(cycleToEdit);
        }
      );

      this.settingsModal = new SettingsModalComponent();

      this.attachEventListeners();
      await this.refreshAllViews();

      const cycles = (await dbService.getCycles()) || [];
      const settings = await dbService.getSettings();
      if (cycles.length > 0 && notificationService) {
        const avgCycle = calculateAverageCycleLength(cycles);
        notificationService.checkAndTriggerPhaseWarnings(cycles[0], avgCycle, settings);
      }
    } catch (err) {
      console.error('Error saat inisialisasi aplikasi:', err);
    }
  }

  async seedInitialMockData() {}

  attachEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabKey = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabKey);
      });
    });

    const prevBtn = document.getElementById('btn-prev-month');
    const nextBtn = document.getElementById('btn-next-month');
    const currentBtn = document.getElementById('btn-current-month');

    if (prevBtn) prevBtn.addEventListener('click', () => { if (this.calendar) { this.calendar.prevMonth(); this.refreshCalendar(); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (this.calendar) { this.calendar.nextMonth(); this.refreshCalendar(); } });
    if (currentBtn) currentBtn.addEventListener('click', () => { if (this.calendar) { this.calendar.goToCurrentMonth(); this.refreshCalendar(); } });

    const openPeriodBtn = document.getElementById('btn-open-period-modal');
    const closePeriodBtn = document.getElementById('btn-close-period-modal');
    const periodForm = document.getElementById('period-form');

    if (openPeriodBtn) openPeriodBtn.addEventListener('click', () => this.openPeriodModal());
    if (closePeriodBtn) closePeriodBtn.addEventListener('click', () => this.closePeriodModal());
    if (periodForm) periodForm.addEventListener('submit', (e) => this.handlePeriodSubmit(e));

    const checkboxOngoing = document.getElementById('checkbox-ongoing');
    const endDateInput = document.getElementById('input-end-date');
    if (checkboxOngoing && endDateInput) {
      checkboxOngoing.addEventListener('change', (e) => {
        if (e.target.checked) {
          endDateInput.value = '';
          endDateInput.disabled = true;
          endDateInput.classList.add('bg-slate-100', 'cursor-not-allowed');
        } else {
          endDateInput.disabled = false;
          endDateInput.classList.remove('bg-slate-100', 'cursor-not-allowed');
          if (!endDateInput.value) {
            endDateInput.value = new Date().toISOString().split('T')[0];
          }
        }
      });
    }

    const openSettingsBtn = document.getElementById('btn-open-settings-modal');
    if (openSettingsBtn && this.settingsModal) {
      openSettingsBtn.addEventListener('click', () => this.settingsModal.open());
    }
  }

  switchTab(tabKey) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('bg-white', 'text-rose-600', 'shadow-sm', 'border', 'border-rose-100');
      btn.classList.add('text-slate-600');
    });

    const targetContent = document.getElementById(`tab-${tabKey}`);
    const targetBtn = document.getElementById(`tab-btn-${tabKey}`);

    if (targetContent) targetContent.classList.remove('hidden');
    if (targetBtn) {
      targetBtn.classList.add('bg-white', 'text-rose-600', 'shadow-sm', 'border', 'border-rose-100');
      targetBtn.classList.remove('text-slate-600');
    }

    if (tabKey === 'calendar') {
      this.refreshCalendar();
    } else if (tabKey === 'history' && this.cycleHistory) {
      this.cycleHistory.render();
    }
  }

  async refreshAllViews() {
    try { await this.renderDashboard(); } catch (err) { console.error('Error Dashboard:', err); }
    try { await this.refreshCalendar(); } catch (err) { console.error('Error Kalender:', err); }
    try { if (this.cycleHistory) await this.cycleHistory.render(); } catch (err) { console.error('Error Riwayat:', err); }
  }

  async refreshCalendar() {
    try {
      const cycles = (await dbService.getCycles()) || [];
      const moodEntries = (await dbService.getMoodEntries()) || [];
      const avgCycle = calculateAverageCycleLength ? calculateAverageCycleLength(cycles) : 28;
      if (this.calendar) {
        this.calendar.render(cycles, moodEntries, avgCycle);
      }
    } catch (err) {
      console.error('Gagal refresh kalender:', err);
    }
  }

  async renderDashboard() {
    const todayStr = new Date().toISOString().split('T')[0];
    const cycles = (await dbService.getCycles()) || [];
    const avgCycle = calculateAverageCycleLength ? calculateAverageCycleLength(cycles) : 28;
    const phaseInfo = getPhaseForDate ? getPhaseForDate(todayStr, cycles, avgCycle) : { phase: 'menstrual', dayInCycle: 1 };

    const phaseKey = phaseInfo.phase;
    const details = PHASE_DETAILS[phaseKey] || PHASE_DETAILS.unrecorded;

    const cardContainer = document.getElementById('phase-card-container');
    if (cardContainer) {
      if (phaseKey === 'unrecorded') {
        cardContainer.className = "relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl transition-all duration-500 bg-[#f19fb9]";
      } else {
        cardContainer.className = `relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl transition-all duration-500 bg-gradient-to-br ${details.color}`;
      }
    }

    const nameEl = document.getElementById('current-phase-name');
    const descEl = document.getElementById('current-phase-desc');
    const dayEl = document.getElementById('cycle-day-number');
    const estEl = document.getElementById('est-cycle-length');

    if (nameEl) nameEl.innerText = details.name;
    if (descEl) descEl.innerText = details.desc;
    if (dayEl) dayEl.innerText = phaseInfo.dayInCycle > 0 ? phaseInfo.dayInCycle : 1;
    if (estEl) estEl.innerText = `${avgCycle} Hari`;

    if (phaseInfo.phases) {
      const p = phaseInfo.phases;
      const setDateText = (id, range) => {
        const el = document.getElementById(id);
        if (el && range) el.innerText = `${range.start} s/d ${range.end}`;
      };
      setDateText('dates-menstruasi', p.menstrual);
      setDateText('dates-folikuler', p.follicular);
      setDateText('dates-ovulasi', p.ovulation);
      setDateText('dates-luteal', p.luteal);
    }

    const pcosBanner = document.getElementById('pcos-banner');
    if (pcosBanner) {
      if (phaseInfo.isDelayed) pcosBanner.classList.remove('hidden');
      else pcosBanner.classList.add('hidden');
    }
  }

  async openPeriodModal(cycleToEdit = null) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const startInput = document.getElementById('input-start-date');
      const endInput = document.getElementById('input-end-date');
      const checkboxOngoing = document.getElementById('checkbox-ongoing');
      const subtitle = document.getElementById('modal-period-subtitle');
      const submitBtn = document.getElementById('btn-submit-period');

      if (cycleToEdit) {
        this.editingCycleId = cycleToEdit.id;
        if (startInput) startInput.value = cycleToEdit.startDate;
        if (endInput) endInput.value = cycleToEdit.endDate || '';
        if (checkboxOngoing) checkboxOngoing.checked = !!cycleToEdit.isOngoing;

        if (endInput) {
          endInput.disabled = !!cycleToEdit.isOngoing;
          if (cycleToEdit.isOngoing) {
            endInput.classList.add('bg-slate-100', 'cursor-not-allowed');
          } else {
            endInput.classList.remove('bg-slate-100', 'cursor-not-allowed');
          }
        }
        if (subtitle) subtitle.innerText = 'Perbarui rentang tanggal haid ini.';
        if (submitBtn) submitBtn.innerText = 'Update Haid';
      } else {
        this.editingCycleId = null;
        const cycles = (await dbService.getCycles()) || [];
        const latestCycle = cycles.length > 0 ? cycles[0] : null;

        if (latestCycle && (latestCycle.isOngoing || !latestCycle.endDate)) {
          this.editingCycleId = latestCycle.id;
          if (startInput) startInput.value = latestCycle.startDate;
          if (endInput) endInput.value = todayStr;
          if (checkboxOngoing) checkboxOngoing.checked = false;
          if (endInput) {
            endInput.disabled = false;
            endInput.classList.remove('bg-slate-100', 'cursor-not-allowed');
          }
          if (subtitle) subtitle.innerText = 'Selesaikan haid aktif kamu dengan mengisi tanggal selesai.';
          if (submitBtn) submitBtn.innerText = 'Selesaikan Haid';
        } else {
          if (startInput) startInput.value = todayStr;
          if (endInput) endInput.value = '';
          if (checkboxOngoing) checkboxOngoing.checked = true;
          if (endInput) {
            endInput.disabled = true;
            endInput.classList.add('bg-slate-100', 'cursor-not-allowed');
          }
          if (subtitle) subtitle.innerText = 'Catat hari pertama haid baru atau isi langsung rentangnya.';
          if (submitBtn) submitBtn.innerText = 'Simpan Haid';
        }
      }
    } catch (err) {
      console.error('Error saat membuka modal:', err);
    }

    const modal = document.getElementById('modal-period');
    if (modal) modal.classList.remove('hidden');
  }

  closePeriodModal() {
    this.editingCycleId = null;
    const modal = document.getElementById('modal-period');
    if (modal) modal.classList.add('hidden');
  }

  async handlePeriodSubmit(e) {
    e.preventDefault();
    try {
      const startVal = document.getElementById('input-start-date').value;
      const endVal = document.getElementById('input-end-date').value;
      const isOngoing = document.getElementById('checkbox-ongoing')?.checked;

      if (!startVal) {
        this.showToast('Tanggal mulai wajib diisi!', true);
        return;
      }

      if (!isOngoing && endVal && new Date(endVal) < new Date(startVal)) {
        this.showToast('Tanggal selesai tidak boleh lebih awal dari tanggal mulai!', true);
        return;
      }

      const periodDuration = isOngoing || !endVal ? null : getDaysDiff(startVal, endVal) + 1;

      const cycleData = {
        id: this.editingCycleId ? this.editingCycleId : Date.now(),
        startDate: startVal,
        endDate: isOngoing ? null : endVal,
        periodDuration: periodDuration,
        isOngoing: isOngoing
      };

      await dbService.saveCycle(cycleData);
      this.editingCycleId = null;

      this.closePeriodModal();
      await this.refreshAllViews();
      this.showToast('Data haid berhasil diperbarui! 🌸');
    } catch (err) {
      console.error('Gagal menyimpan data haid:', err);
      this.showToast('Gagal menyimpan data haid. Silakan coba lagi.', true);
    }
  }

  showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMsg || !toastIcon) return;

    toastMsg.innerText = msg;
    toastIcon.innerHTML = isError 
      ? '<i class="fa-solid fa-triangle-exclamation text-amber-400"></i>' 
      : '<i class="fa-solid fa-circle-check text-emerald-400"></i>';

    toast.classList.remove('translate-y-[-150%]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-[-150%]', 'opacity-0');
    }, 3500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});