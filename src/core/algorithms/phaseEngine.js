import { addDays, getDaysDiff } from './cycleCalculator.js';

/**
 * Menghitung tanggal rentang 4 fase hormonal untuk satu siklus
 * Sesuai Algorithm 1 SRS v1.2
 */
export function calculatePhases(cycleStartStr, cycleEndStr, avgCycleLength = 28) {
  const periodDuration = getDaysDiff(cycleStartStr, cycleEndStr) + 1;
  const nextPeriodStart = addDays(cycleStartStr, avgCycleLength);

  // 1. Fase Menstruasi
  const menstrual = {
    start: cycleStartStr,
    end: cycleEndStr,
    duration: periodDuration
  };

  // 2. Fase Ovulasi (Peak H-14 sebelum haid berikutnya, rentang window 3 hari)
  const ovulationPeak = addDays(nextPeriodStart, -14);
  const ovulationStart = addDays(ovulationPeak, -1);
  const ovulationEnd = addDays(ovulationPeak, 1);
  const ovulation = {
    start: ovulationStart,
    peak: ovulationPeak,
    end: ovulationEnd,
    duration: 3
  };

  // 3. Fase Folikuler (Setelah haid selesai s/d H-1 sebelum ovulasi)
  const follicularStart = addDays(cycleEndStr, 1);
  const follicularEnd = addDays(ovulationStart, -1);
  const follicular = {
    start: follicularStart,
    end: follicularEnd,
    duration: getDaysDiff(follicularStart, follicularEnd) + 1
  };

  // 4. Fase Luteal (Setelah ovulasi s/d H-1 sebelum haid berikutnya)
  const lutealStart = addDays(ovulationEnd, 1);
  const lutealEnd = addDays(nextPeriodStart, -1);
  const luteal = {
    start: lutealStart,
    end: lutealEnd,
    duration: getDaysDiff(lutealStart, lutealEnd) + 1
  };

  return { menstrual, follicular, ovulation, luteal };
}

/**
 * Menentukan fase apa yang berjalan pada tanggal tertentu (targetDate)
 * Sesuai FR-3, Algorithm 2 & Pseudocode 8.2 SRS v1.2 (Handling PCOS & Gap)
 */
export function getPhaseForDate(targetDateStr, cycles, avgCycleLength = 28) {
  if (!cycles || cycles.length === 0) {
    return { phase: 'unrecorded', dayInCycle: 1, phases: null };
  }

  // Urutkan siklus descending (terbaru di atas)
  const sortedCycles = [...cycles].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  
  // Cek apakah targetDate masuk ke dalam salah satu siklus historis
  for (const cycle of sortedCycles) {
    const phases = calculatePhases(cycle.startDate, cycle.endDate, avgCycleLength);
    
    if (targetDateStr >= phases.menstrual.start && targetDateStr <= phases.menstrual.end) {
      const dayInCycle = getDaysDiff(cycle.startDate, targetDateStr) + 1;
      return { phase: 'menstrual', dayInCycle, phases };
    }
    if (targetDateStr >= phases.follicular.start && targetDateStr <= phases.follicular.end) {
      const dayInCycle = getDaysDiff(cycle.startDate, targetDateStr) + 1;
      return { phase: 'follicular', dayInCycle, phases };
    }
    if (targetDateStr >= phases.ovulation.start && targetDateStr <= phases.ovulation.end) {
      const dayInCycle = getDaysDiff(cycle.startDate, targetDateStr) + 1;
      return { phase: 'ovulation', dayInCycle, phases };
    }
    if (targetDateStr >= phases.luteal.start && targetDateStr <= phases.luteal.end) {
      const dayInCycle = getDaysDiff(cycle.startDate, targetDateStr) + 1;
      return { phase: 'luteal', dayInCycle, phases };
    }
  }

  // Jika di luar siklus historis, gunakan proyeksi dari siklus terbaru
  const latestCycle = sortedCycles[0];
  const daysFromLatest = getDaysDiff(latestCycle.startDate, targetDateStr);
  
  // Jika keterlambatan melebihi batas wajar (misal > avgCycleLength + 14 hari), tandai unrecorded/PCOS
  if (daysFromLatest > avgCycleLength + 14) {
    return { phase: 'unrecorded', dayInCycle: daysFromLatest + 1, phases: null, isDelayed: true };
  }

  // Proyeksi fase mendatang
  const projectedPhases = calculatePhases(latestCycle.startDate, latestCycle.endDate, avgCycleLength);
  const dayInCycle = daysFromLatest + 1;

  if (targetDateStr <= projectedPhases.follicular.end) {
    return { phase: 'follicular', dayInCycle, phases: projectedPhases };
  } else if (targetDateStr <= projectedPhases.ovulation.end) {
    return { phase: 'ovulation', dayInCycle, phases: projectedPhases };
  } else if (targetDateStr <= projectedPhases.luteal.end) {
    return { phase: 'luteal', dayInCycle, phases: projectedPhases };
  }

  return { phase: 'unrecorded', dayInCycle, phases: null };
}