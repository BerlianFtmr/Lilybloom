import { calculatePhases } from '../algorithms/phaseEngine.js';
import { addDays } from '../algorithms/cycleCalculator.js';

export const notificationService = {
  /**
   * Meminta izin pengiriman notifikasi dari pengguna
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Browser tidak mendukung Web Notification API.');
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  /**
   * Memeriksa apakah izin notifikasi sudah diberikan
   */
  hasPermission() {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  /**
   * Mengirim notifikasi lokal ke layar pengguna
   */
  sendLocalNotification(title, options = {}) {
    if (!this.hasPermission()) return null;

    const defaultOptions = {
      icon: '/public/icons/favicon.ico',
      badge: '/public/icons/favicon.ico',
      silent: false
    };

    return new Notification(title, { ...defaultOptions, ...options });
  },

  /**
   * Peringatan Transisi Fase (FR-11 & Algorithm 5 SRS v1.2)
   * Mengirim peringatan H-1 sebelum masuk fase Ovulasi atau Luteal
   */
  checkAndTriggerPhaseWarnings(latestCycle, avgCycleLength, settings) {
    if (!settings?.phaseTransitionWarning || !latestCycle) return;

    const today = new Date().toISOString().split('T')[0];
    const phases = calculatePhases(latestCycle.startDate, latestCycle.endDate, avgCycleLength);

    const ovulationWarningDate = addDays(phases.ovulation.start, -1);
    const lutealWarningDate = addDays(phases.luteal.start, -1);

    if (today === ovulationWarningDate) {
      this.sendLocalNotification('Ovulasi Sebentar Lagi! ✨', {
        body: 'Besok diprediksi masuk fase ovulasi. Energi kamu diprediksi akan berada di puncak!'
      });
    } else if (today === lutealWarningDate) {
      this.sendLocalNotification('PRA-PMS Warning 💜', {
        body: 'Besok diprediksi masuk fase luteal. Siapkan diri untuk perubahan mood dan luangkan waktu self-care.'
      });
    }
  }
};