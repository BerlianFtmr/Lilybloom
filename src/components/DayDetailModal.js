import { dbService } from '../db/indexedDB.js';
import { getPhaseForDate } from '../core/algorithms/phaseEngine.js';
import { calculateAverageCycleLength } from '../core/algorithms/cycleCalculator.js';

export class DayDetailModalComponent {
  constructor(onSaveCallback) {
    this.modal = document.getElementById('modal-day-detail');
    this.currentDateStr = null;
    this.selectedMood = null;
    this.onSave = onSaveCallback;

    this.initEventListeners();
  }

  async open(dateStr) {
    this.currentDateStr = dateStr;
    this.selectedMood = null;

    // 1. Tampilkan modal terlebih dahulu agar tidak tertahan jika ada error data
    if (this.modal) this.modal.classList.remove('hidden');

    // 2. Reset nilai form
    const notesInput = document.getElementById('modal-day-notes');
    if (notesInput) notesInput.value = '';
    this.resetMoodButtons();

    // 3. Set Judul Tanggal
    const titleEl = document.getElementById('modal-day-title');
    if (titleEl) titleEl.innerText = `Tanggal ${dateStr}`;

    try {
      // 4. Ambil Data Mood/Catatan yang ada
      const moodEntries = await dbService.getMoodEntries();
      const entry = Array.isArray(moodEntries) ? moodEntries.find(m => m.date === dateStr) : null;

      if (entry) {
        if (entry.mood) this.selectMood(entry.mood);
        if (notesInput && entry.notes) notesInput.value = entry.notes;
      }

      // 5. Update Badge Fase dengan Warna Dinamis
      const cycles = await dbService.getCycles();
      const avgCycle = calculateAverageCycleLength(cycles);
      const phaseInfo = getPhaseForDate(dateStr, cycles, avgCycle);

      const badgeEl = document.getElementById('modal-day-phase-badge');
      if (badgeEl) {
        const badgeStyles = {
          menstrual: { label: 'Fase Menstruasi', class: 'bg-rose-100 text-rose-700 border border-rose-200' },
          follicular: { label: 'Fase Folikuler', class: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
          ovulation: { label: 'Fase Ovulasi', class: 'bg-amber-100 text-amber-700 border border-amber-200' },
          luteal: { label: 'Fase Luteal', class: 'bg-purple-100 text-purple-700 border border-purple-200' },
          unrecorded: { label: 'Siklus Panjang', class: 'bg-slate-100 text-slate-700 border border-slate-200' }
        };

        const style = badgeStyles[phaseInfo.phase] || badgeStyles.unrecorded;
        badgeEl.innerText = style.label;
        badgeEl.className = `inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${style.class}`;
      }
    } catch (err) {
      console.error('Gagal memuat detail tanggal:', err);
    }
  }

  close() {
    if (this.modal) this.modal.classList.add('hidden');
  }

  resetMoodButtons() {
    document.querySelectorAll('.m-mood-btn').forEach(btn => {
      btn.classList.remove('ring-2', 'ring-rose-500', 'bg-rose-50');
    });
  }

  selectMood(mood) {
    this.selectedMood = mood;
    this.resetMoodButtons();
    const targetBtn = document.querySelector(`.m-mood-btn[data-mood="${mood}"]`);
    if (targetBtn) {
      targetBtn.classList.add('ring-2', 'ring-rose-500', 'bg-rose-50');
    }
  }

  initEventListeners() {
    const closeBtn = document.getElementById('btn-close-day-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    document.querySelectorAll('.m-mood-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mood = e.currentTarget.getAttribute('data-mood');
        this.selectMood(mood);
      });
    });

    const saveBtn = document.getElementById('btn-save-modal-day-log');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        if (!this.currentDateStr) return;
        const notesInput = document.getElementById('modal-day-notes');
        const notes = notesInput ? notesInput.value.trim() : '';

        await dbService.saveMoodEntry({
          date: this.currentDateStr,
          mood: this.selectedMood,
          notes: notes
        });

        this.close();
        if (this.onSave) this.onSave();
      });
    }
  }
}