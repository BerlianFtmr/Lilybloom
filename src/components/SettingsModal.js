import { dbService } from '../db/indexedDB.js';
import { notificationService } from '../core/services/notificationService.js';
import { generatePDFReport } from '../core/services/pdfExportService.js';

export class SettingsModalComponent {
  constructor() {
    this.modalEl = document.getElementById('modal-settings');
    this.initEvents();
  }

  initEvents() {
    const closeBtn = document.getElementById('btn-close-settings');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const notifBtn = document.getElementById('btn-notification-toggle');
    if (notifBtn) {
      notifBtn.addEventListener('click', async () => {
        const granted = await notificationService.requestPermission();
        if (granted) {
          notifBtn.innerText = 'Aktif ✓';
          notifBtn.className = 'px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold';
        }
      });
    }

    const exportPdfBtn = document.getElementById('btn-trigger-pdf-export');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', async () => {
        const cycles = await dbService.getCycles();
        const moodEntries = await dbService.getMoodEntries();
        const settings = await dbService.getSettings();
        generatePDFReport(cycles, moodEntries, settings);
      });
    }
  }

  open() {
    if (this.modalEl) this.modalEl.classList.remove('hidden');
  }

  close() {
    if (this.modalEl) this.modalEl.classList.add('hidden');
  }
}