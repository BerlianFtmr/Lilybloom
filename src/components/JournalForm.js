import { dbService } from '../db/indexedDB.js';
import { getPhaseForDate } from '../core/algorithms/phaseEngine.js';

export class JournalFormComponent {
  constructor() {
    this.selectedMood = null;
  }

  initQuickMoodWidget(onSavedCallback) {
    const moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        this.selectedMood = target.getAttribute('data-mood');
        
        moodBtns.forEach(b => b.classList.remove('active', 'bg-white/40', 'ring-2', 'ring-white'));
        target.classList.add('active', 'bg-white/40', 'ring-2', 'ring-white');
      });
    });

    const saveBtn = document.getElementById('btn-save-today-log');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const noteInput = document.getElementById('today-note-input');
        const notes = noteInput ? noteInput.value.trim() : '';

        const cycles = await dbService.getCycles();
        const settings = await dbService.getSettings();
        const phaseInfo = getPhaseForDate(todayStr, cycles, settings.dailyReminderTime);

        const payload = {
          date: todayStr,
          mood: this.selectedMood || 'neutral',
          notes: notes,
          phase: phaseInfo.phase
        };

        await dbService.saveMoodEntry(payload);
        if (onSavedCallback) onSavedCallback(payload);
      });
    }
  }
}