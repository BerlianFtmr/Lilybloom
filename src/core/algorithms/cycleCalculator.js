/**
 * Format Date ke YYYY-MM-DD sesuai waktu lokal (bebas bug timezone UTC)
 */
export function formatDateLocal(dateInput) {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Menghitung selisih hari antara dua tanggal (format ISO: YYYY-MM-DD)
 */
export function getDaysDiff(d1Str, d2Str) {
  const d1 = new Date(d1Str);
  const d2 = new Date(d2Str);
  const diffTime = Math.abs(d2 - d1);
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Menambah jumlah hari ke suatu tanggal
 */
export function addDays(dateInput, days) {
  const result = new Date(dateInput);
  result.setDate(result.getDate() + days);
  return formatDateLocal(result);
}

/**
 * Menghitung rata-rata panjang siklus dari riwayat haid
 * Sesuai FR-9 & Pseudocode 8.2 SRS v1.2
 */
export function calculateAverageCycleLength(cycles) {
  if (!cycles || cycles.length < 2) {
    return 28; // Default value jika data kurang dari 2
  }

  // Pastikan terurut ascending berdasarkan startDate
  const sorted = [...cycles].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  let totalCycleDays = 0;
  let gapsCount = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = getDaysDiff(sorted[i].startDate, sorted[i + 1].startDate);
    totalCycleDays += gap;
    gapsCount++;
  }

  return gapsCount > 0 ? Math.round(totalCycleDays / gapsCount) : 28;
}

/**
 * Menghitung rata-rata durasi lama pendarahan haid
 */
export function calculateAveragePeriodDuration(cycles) {
  if (!cycles || cycles.length === 0) {
    return 5; // Default 5 hari
  }

  const totalDuration = cycles.reduce((acc, cycle) => {
    const duration = getDaysDiff(cycle.startDate, cycle.endDate) + 1;
    return acc + duration;
  }, 0);

  return Math.round(totalDuration / cycles.length);
}

/**
 * Menghitung estimasi tanggal mulai haid berikutnya
 */
export function projectNextPeriodStart(latestCycleStartDate, avgCycleLength = 28) {
  if (!latestCycleStartDate) return null;
  return addDays(latestCycleStartDate, avgCycleLength);
}