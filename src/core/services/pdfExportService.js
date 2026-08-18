import { calculateAverageCycleLength, calculateAveragePeriodDuration, getDaysDiff } from '../algorithms/cycleCalculator.js';
import { analyzeMoodByPhase } from '../algorithms/moodAnalyzer.js';

/**
 * Generasi Laporan PDF Medis
 * Sesuai FR-12 & Pseudocode 8.5 SRS v1.2
 */
export function generatePDFReport(cycles, moodEntries, settings = {}) {
  const avgCycle = calculateAverageCycleLength(cycles);
  const avgPeriod = calculateAveragePeriodDuration(cycles);
  const avgCycleLength = settings.avgCycleLength || avgCycle;
  
  const moodAnalysis = analyzeMoodByPhase(moodEntries, cycles, avgCycleLength);
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const sortedCycles = [...cycles].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  // Buat kontainer HTML dinamis untuk dirender sebagai PDF
  const container = document.createElement('div');
  container.style.padding = '24px';
  container.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
  container.style.color = '#2D1B2D'; // --text-primary

  container.innerHTML = `
    <!-- Header -->
    <div style="border-bottom: 2px solid #D0618C; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="color: #D0618C; font-size: 20px; margin: 0; font-weight: bold;">Laporan Siklus & Mood - Period & Mood Journal</h1>
        <p style="font-size: 11px; color: #5D4A5D; margin: 4px 0 0 0;">Laporan Rekapitulasi Medis & Jurnal Kesehatan Harian</p>
      </div>
      <div style="text-align: right; font-size: 10px; color: #8B7B8B;">
        <p style="margin: 0;">Tanggal Cetak:</p>
        <p style="margin: 2px 0 0 0; font-weight: bold; color: #2D1B2D;">${printDate}</p>
      </div>
    </div>

    <!-- Ringkasan Statistik -->
    <div style="background-color: #FCE6C6; border: 1px solid #F6B6C1; padding: 12px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-around; font-size: 11px;">
      <div>
        <span style="color: #5D4A5D; display: block;">Rata-rata Siklus:</span>
        <strong style="font-size: 14px; color: #8FA344;">${avgCycle} Hari</strong>
      </div>
      <div>
        <span style="color: #5D4A5D; display: block;">Rata-rata Durasi Haid:</span>
        <strong style="font-size: 14px; color: #D0618C;">${avgPeriod} Hari</strong>
      </div>
      <div>
        <span style="color: #5D4A5D; display: block;">Total Siklus Tercatat:</span>
        <strong style="font-size: 14px; color: #2D1B2D;">${cycles.length} Bulan</strong>
      </div>
    </div>

    <!-- Tabel Riwayat Siklus -->
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 12px; margin: 0 0 8px 0; color: #2D1B2D; font-weight: bold;">Riwayat Siklus Menstruasi</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
        <thead>
          <tr style="background-color: #F6B6C1; color: #2D1B2D;">
            <th style="padding: 6px; border: 1px solid #E8D0D0;">Tanggal Mulai</th>
            <th style="padding: 6px; border: 1px solid #E8D0D0;">Tanggal Selesai</th>
            <th style="padding: 6px; border: 1px solid #E8D0D0;">Durasi Haid</th>
            <th style="padding: 6px; border: 1px solid #E8D0D0;">Panjang Siklus</th>
          </tr>
        </thead>
        <tbody>
          ${sortedCycles.map((c, idx) => {
            const dur = getDaysDiff(c.startDate, c.endDate) + 1;
            const gap = idx < sortedCycles.length - 1 ? `${getDaysDiff(sortedCycles[idx + 1].startDate, c.startDate)} Hari` : '--';
            return `
              <tr>
                <td style="padding: 6px; border: 1px solid #E8D0D0;">${c.startDate}</td>
                <td style="padding: 6px; border: 1px solid #E8D0D0;">${c.endDate}</td>
                <td style="padding: 6px; border: 1px solid #E8D0D0;">${dur} Hari</td>
                <td style="padding: 6px; border: 1px solid #E8D0D0;">${gap}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Analisis Matriks Mood per Fase -->
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 12px; margin: 0 0 8px 0; color: #2D1B2D; font-weight: bold;">Analisis Distribusi Mood per Fase</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: center;">
        <thead>
          <tr style="background-color: #FAD6D5; color: #2D1B2D;">
            <th style="padding: 6px; border: 1px solid #E8D0D0; text-align: left;">Fase</th>
            <th style="padding: 6px; border: 1px solid #E8D0D0;">😊 Senang</th>
            <th style="padding: 6px; border: 1px solid #E8D0D0;">😐 Biasa</th>
            <th style="padding: 6px; border: 1px solid #E8D0D0;">😢 Sedih</th>
            <th style="padding: 6px; border: 1px solid #E8D0D0;">😠 Marah</th>
            <th style="padding: 6px; border: 1px solid #E8D0D0;">😴 Malas</th>
          </tr>
        </thead>
        <tbody>
          ${['menstrual', 'follicular', 'ovulation', 'luteal'].map(phase => `
            <tr>
              <td style="padding: 6px; border: 1px solid #E8D0D0; text-align: left; font-weight: bold; text-transform: capitalize;">${phase}</td>
              <td style="padding: 6px; border: 1px solid #E8D0D0;">${moodAnalysis.counts[phase]?.happy || 0}</td>
              <td style="padding: 6px; border: 1px solid #E8D0D0;">${moodAnalysis.counts[phase]?.neutral || 0}</td>
              <td style="padding: 6px; border: 1px solid #E8D0D0;">${moodAnalysis.counts[phase]?.sad || 0}</td>
              <td style="padding: 6px; border: 1px solid #E8D0D0;">${moodAnalysis.counts[phase]?.angry || 0}</td>
              <td style="padding: 6px; border: 1px solid #E8D0D0;">${moodAnalysis.counts[phase]?.lazy || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

// Di dalam src/core/services/pdfExportService.js
const opt = {
  margin: 0.4,
  filename: `lilybloom_laporan_medis_${new Date().toISOString().split('T')[0]}.pdf`,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2 },
  jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
};

  if (window.html2pdf) {
    window.html2pdf().set(opt).from(container).save();
  } else {
    console.error('Library html2pdf.js belum dimuat di HTML.');
  }
}