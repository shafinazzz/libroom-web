/* ============================================
   Report Generator
   Padanan terus dengan generateMonthlyReport() (Flutter)

   Guna library:
   - jsPDF          (padanan package:pdf)
   - jsPDF-AutoTable (padanan pw.Table)

   Kena ada dalam <head> HTML:
   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
   ============================================ */

const BULAN_MELAYU = [
  '',
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
];

/**
 * Padanan generateMonthlyReport(context, month, year).
 * @param {number} month - 1-12
 * @param {number} year
 */
async function generateMonthlyReport(month, year) {
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // hari terakhir bulan tu
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabaseClient
      .from('bookings')
      .select('*')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .order('booking_date');

    if (error) throw error;
    const bookings = data ?? [];

    let totalRevenue = 0;
    let approvedCount = 0;
    for (const b of bookings) {
      if (b.status === 'approved') {
        totalRevenue += Number(b.price ?? 0);
        approvedCount++;
      }
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let cursorY = 40;

    // ---- Header — padanan header: (ctx) => pw.Column(...) ----
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Libroom UPSI - Laporan Tempahan', marginX, cursorY);

    cursorY += 20;
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text(`${BULAN_MELAYU[month]} ${year}`, marginX, cursorY);

    cursorY += 16;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Dijana pada: ${new Date().toLocaleString('ms-MY')}`, marginX, cursorY);

    cursorY += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 25;

    // ---- Summary boxes — padanan _summaryBox() ----
    const boxWidth = (pageWidth - marginX * 2 - 20) / 3;
    const summaryData = [
      { label: 'Jumlah Tempahan', value: String(bookings.length) },
      { label: 'Diluluskan', value: String(approvedCount) },
      { label: 'Jumlah Hasil', value: `RM ${totalRevenue.toFixed(2)}` },
    ];

    summaryData.forEach((item, i) => {
      const x = marginX + i * (boxWidth + 10);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(x, cursorY, boxWidth, 50, 4, 4, 'F');

      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text(item.value, x + 10, cursorY + 22);

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(item.label, x + 10, cursorY + 38);
    });

    cursorY += 70;

    // ---- Table — padanan pw.Table(...) guna AutoTable ----
    const tableRows = bookings.map((b) => [
      `UPSI-${b.id}`,
      b.space_name ?? '-',
      b.contact_name ?? b.contact_email ?? '-',
      b.booking_date ?? '-',
      b.session ?? '-',
      `RM ${b.price ?? 0}`,
      String(b.status ?? '-').toUpperCase(),
    ]);

    doc.autoTable({
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['No. Rujukan', 'Bilik', 'Nama', 'Tarikh', 'Sesi', 'Jumlah', 'Status']],
      body: tableRows,
      styles: { fontSize: 8, cellPadding: 6, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: { fillColor: [55, 71, 92], textColor: 255, fontStyle: 'bold' }, // padanan PdfColors.blueGrey800
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        // ---- Footer — padanan footer: (ctx) => "Halaman X / Y" ----
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Halaman ${data.pageNumber} / ${pageCount}`,
          pageWidth - marginX,
          doc.internal.pageSize.getHeight() - 20,
          { align: 'right' }
        );
      },
    });

    if (bookings.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('Tiada rekod tempahan untuk bulan ini.', marginX, cursorY + 30);
    }

    // ---- Padanan Printing.sharePdf() — muat turun terus ----
    doc.save(`laporan_tempahan_${BULAN_MELAYU[month]}_${year}.pdf`);
  } catch (err) {
    showToast(`Ralat generate laporan: ${err.message}`, 6000);
    console.error(err);
  }
}