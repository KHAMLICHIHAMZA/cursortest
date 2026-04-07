import * as fs from 'fs';
import * as path from 'path';

const B64_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export function onePixelPngPath(): string {
  return path.join(__dirname, '..', 'fixtures', 'one-pixel.png');
}

export function ensureOnePixelPng(): string {
  const filePath = onePixelPngPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, Buffer.from(B64_1PX, 'base64'));
  }
  return filePath;
}
