/**
 * MEMORA — Client-side Image Compression & Photo Manager
 * Ensures uploaded photos stay under ~50-80KB each via HTML5 Canvas compression
 * preventing LocalStorage quotas from overflowing.
 */

export const CURATED_ANALOG_PRESETS = [
  {
    id: 'analog-1',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
    caption: 'Kitchen Window & Amber Stripes'
  },
  {
    id: 'analog-2',
    url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
    caption: 'Golden Apple Orchard'
  },
  {
    id: 'analog-3',
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80',
    caption: 'Cedar Cabin & Postcard'
  },
  {
    id: 'analog-4',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    caption: 'Coastal Cliff Fog'
  },
  {
    id: 'analog-5',
    url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1000&q=80',
    caption: 'Cassette Tape on Velvet'
  }
];

export class ImageCompressor {
  /**
   * Compresses a File object to lightweight Base64 JPEG data URL
   * @param {File} file
   * @param {number} maxDimension
   * @param {number} quality
   * @returns {Promise<string>}
   */
  static compressFile(file, maxDimension = 900, quality = 0.72) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('Selected file is not an image'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
