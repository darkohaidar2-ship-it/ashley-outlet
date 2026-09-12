import JSZip from 'jszip';

/**
 * Sanitize filename to be valid across Windows, macOS, and Linux
 */
export function sanitizeFileName(name) {
  if (!name) return 'model';
  return name
    .toString()
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ');
}

/**
 * Fetches an image URL and returns a Blob with a fallback to Canvas
 */
export async function fetchImageBlob(imageUrl) {
  if (!imageUrl) throw new Error('No image URL provided');

  // Direct fetch attempt
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 0) return blob;
    }
  } catch (err) {
    // Continue to canvas fallback
  }

  // Fallback: load into Image element and extract via HTML5 canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob returned null'));
          },
          'image/jpeg',
          0.92
        );
      } catch (canvasErr) {
        reject(canvasErr);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image in canvas fallback'));
    img.src = imageUrl;
  });
}

/**
 * Triggers a browser file download
 */
export function triggerFileDownload(blobOrUrl, filename) {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (typeof blobOrUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

/**
 * Download a single model's image named after the model
 */
export async function downloadModelImage(model) {
  if (!model || !model.image) return false;
  const rawName = model.name ? `${model.name}${model.sku ? ' - ' + model.sku : ''}` : `Model_${model.id}`;
  const filename = `${sanitizeFileName(rawName)}.jpg`;

  try {
    const blob = await fetchImageBlob(model.image);
    triggerFileDownload(blob, filename);
    return true;
  } catch (err) {
    console.warn('Blob download failed, using direct anchor fallback:', err);
    triggerFileDownload(model.image, filename);
    return true;
  }
}

/**
 * Download all models' images in a single ZIP file, each named after the model
 */
export async function downloadAllImagesAsZip(models, onProgress) {
  const validModels = (models || []).filter(
    (m) => m.image && typeof m.image === 'string' && m.image.trim() !== ''
  );

  if (validModels.length === 0) {
    throw new Error('هیچ وێنەیەک نەدۆزرایەوە بۆ داگرتن');
  }

  const zip = new JSZip();
  const folder = zip.folder('Ashley_Outlet_Furniture');
  const usedNames = new Set();
  let successCount = 0;

  for (let i = 0; i < validModels.length; i++) {
    const model = validModels[i];
    const rawName = model.name ? `${model.name}${model.sku ? ' - ' + model.sku : ''}` : `Model_${model.id}`;
    const baseSafeName = sanitizeFileName(rawName);

    // Ensure unique filenames within ZIP
    let finalName = `${baseSafeName}.jpg`;
    let counter = 1;
    while (usedNames.has(finalName.toLowerCase())) {
      finalName = `${baseSafeName}_${counter}.jpg`;
      counter++;
    }
    usedNames.add(finalName.toLowerCase());

    if (onProgress) {
      onProgress(i + 1, validModels.length, model.name || `Model ${i + 1}`);
    }

    try {
      const blob = await fetchImageBlob(model.image);
      folder.file(finalName, blob);
      successCount++;
    } catch (err) {
      console.warn(`Failed to fetch image for [${model.name}]:`, err);
    }
  }

  if (successCount === 0) {
    throw new Error('نەتوانرا هیچ وێنەیەک داببەزێنرێت، تکایە دڵنیابەرەوە لە بەستەری وێنەکان');
  }

  if (onProgress) {
    onProgress(validModels.length, validModels.length, 'دروستکردنی فایلی ZIP...');
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 5 }
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  triggerFileDownload(zipBlob, `Ashley_Outlet_Images_${timestamp}.zip`);
  return successCount;
}
