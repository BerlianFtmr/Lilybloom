import { getPhaseForDate } from './phaseEngine.js';

/**
 * Menganalisis distribusi mood per fase siklus
 * Sesuai Algorithm 4 SRS v1.2
 */
export function analyzeMoodByPhase(moodEntries, cycles, avgCycleLength = 28) {
  const phases = ['menstrual', 'follicular', 'ovulation', 'luteal', 'unrecorded'];
  const moods = ['lazy', 'angry', 'sad', 'happy', 'neutral'];

  // Inisialisasi matriks hitungan
  const counts = {};
  phases.forEach(phase => {
    counts[phase] = {};
    moods.forEach(m => { counts[phase][m] = 0; });
  });

  // Kategorisasi setiap entri mood
  moodEntries.forEach(entry => {
    const phaseInfo = getPhaseForDate(entry.date, cycles, avgCycleLength);
    const targetPhase = counts[phaseInfo.phase] ? phaseInfo.phase : 'unrecorded';
    if (counts[targetPhase][entry.mood] !== undefined) {
      counts[targetPhase][entry.mood]++;
    }
  });

  // Hitung persentase
  const percentages = {};
  phases.forEach(phase => {
    const totalInPhase = Object.values(counts[phase]).reduce((a, b) => a + b, 0);
    percentages[phase] = {};
    moods.forEach(mood => {
      percentages[phase][mood] = totalInPhase > 0 
        ? Math.round((counts[phase][mood] / totalInPhase) * 100) 
        : 0;
    });
  });

  return { counts, percentages };
}