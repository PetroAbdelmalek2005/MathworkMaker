import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generatePDF(worksheetRef, answerKeyRef, filename) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;

  const worksheetCanvas = await html2canvas(worksheetRef, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const wsImgData = worksheetCanvas.toDataURL('image/png');
  const wsRatio = worksheetCanvas.height / worksheetCanvas.width;
  const wsImgHeight = pageWidth * wsRatio;

  if (wsImgHeight <= pageHeight) {
    pdf.addImage(wsImgData, 'PNG', 0, 0, pageWidth, wsImgHeight);
  } else {
    // Multi-page worksheet: slice into A4-height chunks
    let yOffset = 0;
    while (yOffset < worksheetCanvas.height) {
      const sliceHeight = Math.min(
        Math.round((pageHeight / pageWidth) * worksheetCanvas.width),
        worksheetCanvas.height - yOffset
      );
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = worksheetCanvas.width;
      sliceCanvas.height = sliceHeight;
      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(worksheetCanvas, 0, -yOffset);
      pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight);
      yOffset += sliceHeight;
      if (yOffset < worksheetCanvas.height) pdf.addPage();
    }
  }

  pdf.addPage();

  const answerCanvas = await html2canvas(answerKeyRef, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const akImgData = answerCanvas.toDataURL('image/png');
  const akRatio = answerCanvas.height / answerCanvas.width;
  const akImgHeight = pageWidth * akRatio;

  if (akImgHeight <= pageHeight) {
    pdf.addImage(akImgData, 'PNG', 0, 0, pageWidth, akImgHeight);
  } else {
    let yOffset = 0;
    const currentPage = pdf.getCurrentPageInfo().pageNumber;
    while (yOffset < answerCanvas.height) {
      const sliceHeight = Math.min(
        Math.round((pageHeight / pageWidth) * answerCanvas.width),
        answerCanvas.height - yOffset
      );
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = answerCanvas.width;
      sliceCanvas.height = sliceHeight;
      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(answerCanvas, 0, -yOffset);
      if (yOffset > 0) pdf.addPage();
      pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight);
      yOffset += sliceHeight;
    }
  }

  pdf.save(filename);
}
