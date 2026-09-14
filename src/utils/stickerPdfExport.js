/**
 * PDF Export Utility for Ashley Outlet Stickers
 * Uses html2pdf.js dynamically in the browser
 */
export async function exportStickersToPdf(element, filename = 'Ashley_Sticker.pdf') {
  if (!element) {
    throw new Error('No element provided for PDF generation');
  }

  // Dynamically load html2pdf in the browser
  const html2pdfModule = await import('html2pdf.js');
  const html2pdf = html2pdfModule.default || html2pdfModule;

  const opt = {
    margin: [2, 2, 2, 2],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2.5,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0
    },
    jsPDF: {
      unit: 'mm',
      format: [165, 115], // Perfect fit for standard 155mm x 100mm sticker
      orientation: 'landscape'
    },
    pagebreak: { mode: ['css', 'legacy', 'avoid-all'], after: '.sticker-label-card' }
  };

  return html2pdf().set(opt).from(element).save();
}
