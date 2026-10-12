export async function prepareReferenceFile(file) {
  if (!['image/png','image/jpeg','image/webp'].includes(file?.type)) throw new Error('Choose a PNG, JPEG or WebP reference.');
  if (file.size > 4 * 1024 * 1024) throw new Error('Choose a reference smaller than 4 MB.');
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('This image could not be opened. Choose a valid PNG, JPEG or WebP.'); });
  try {
    if (bitmap.width * bitmap.height > 20_000_000) throw new Error('Choose a reference smaller than 20 megapixels.');
    const ratio = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare the reference image.');
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    // Re-encoding strips photo metadata. No file is uploaded to a public store.
    const dataUrl = canvas.toDataURL('image/png');
    if (dataUrl.length > 5.6 * 1024 * 1024) throw new Error('The decoded reference is too large. Choose a smaller image.');
    return { dataUrl, description: 'Your supplied garment reference', kind: 'reference', resized: ratio < 1 };
  } finally { bitmap.close(); }
}
