export const generateRoomCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const PHOTO_TOPICS = [
  "Something Blue",
  "Weirdest Shadow",
  "Shoe Selfie",
  "Reflection",
  "Your Best Angle",
  "Something Tiny",
  "Food Porn",
  "Worst Haircut",
  "Pet (or Random Animal)",
  "Ceiling Fan",
  "Most Boring Object",
  "Your Desk Right Now",
  "Something Red",
  "Closest Person",
  "Ugliest Thing in Your Room",
  "Your Favorite Mug",
  "Double Chin Challenge",
  "Something with Text",
  "Weird Pattern",
  "Your Shoes",
  "Something Green",
  "Looking Up",
  "Your Hand",
  "Something Soft",
  "Most Chaotic Corner"
];

export const getRandomTopic = (): string => {
  return PHOTO_TOPICS[Math.floor(Math.random() * PHOTO_TOPICS.length)];
};

export const compressImage = async (file: Blob, maxSizeKB: number = 500): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob && (blob.size / 1024 <= maxSizeKB || quality <= 0.1)) {
                resolve(blob);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress();
      };
    };
  });
};
