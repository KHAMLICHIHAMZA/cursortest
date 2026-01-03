import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle();
  }
}

// Fonction pour obtenir le chemin de stockage des images
function getUploadPath(): string {
  // Option 1: Variable d'environnement personnalisée
  const customPath = process.env.UPLOAD_PATH;
  if (customPath) {
    return join(customPath, 'vehicles');
  }
  
  // Option 2: Chemin relatif au projet (par défaut)
  const defaultPath = join(process.cwd(), 'uploads', 'vehicles');
  return defaultPath;
}

export const vehicleImageStorage = diskStorage({
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
    cb(null, `vehicle-${uniqueSuffix}${ext}`);
  },
});

export const vehicleImageFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Accepter uniquement les images
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new BadRequestException('Seules les images sont autorisées'), false);
  }
  cb(null, true);
};


