import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

function getUploadPath(): string {
  // Utiliser une variable d'environnement ou un chemin par défaut
  const customPath = process.env.UPLOAD_PATH;
  if (customPath) {
    return join(customPath, 'fines');
  }
  
  // Chemin relatif au projet (par défaut)
  const defaultPath = join(process.cwd(), 'uploads', 'fines');
  return defaultPath;
}

export const fineAttachmentStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getUploadPath();
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique : timestamp + extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `fine-${uniqueSuffix}${ext}`);
  },
});

export const fineAttachmentFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Accepter les images et les PDFs
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|pdf)$/)) {
    return cb(new BadRequestException('Seules les images et les PDF sont autorisés'), false);
  }
  cb(null, true);
};

