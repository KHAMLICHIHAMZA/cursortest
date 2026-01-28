import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDev = nodeEnv === 'development';

  const frontendUrl = process.env.FRONTEND_URL || (isDev ? 'http://localhost:3001' : undefined);
  const frontendAgencyUrl = process.env.FRONTEND_AGENCY_URL || (isDev ? 'http://localhost:8080' : undefined);
  const frontendAdminUrl = process.env.FRONTEND_ADMIN_URL || (isDev ? 'http://localhost:5173' : undefined);
  const mobileWebUrl = process.env.MOBILE_WEB_URL || (isDev ? 'http://localhost:8081' : undefined);
  const allowedOrigins = [frontendUrl, frontendAgencyUrl, frontendAdminUrl, mobileWebUrl].filter(
    (value): value is string => Boolean(value),
  );

  if (!isDev) {
    const requiredEnv = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL', 'FRONTEND_URL', 'FRONTEND_AGENCY_URL'];
    const missingEnv = requiredEnv.filter((key) => !process.env[key]);
    if (missingEnv.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
    }
  }

  // CORS global - DOIT être AVANT Helmet
  // Autoriser les deux frontends (web et agence) + mobile + Expo web
  // Middleware pour gérer les requêtes OPTIONS (preflight) AVANT enableCors
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    // Debug: log all incoming requests

    if (req.method === 'OPTIONS') {
      if (isDev || (origin && allowedOrigins.includes(origin))) {
        // Répondre aux preflight requests
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Accept-Language');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400'); // 24 heures

        return res.sendStatus(204);
      }

      return res.sendStatus(403);
    }
    
    // Pour toutes les autres requêtes, ajouter les headers CORS AVANT la réponse
    // IMPORTANT: Toujours ajouter les headers CORS en développement
    // Le middleware enableCors de NestJS devrait gérer ça, mais on force pour être sûr
    if (isDev) {
      // En développement, toujours autoriser
      const allowedOrigin = origin || '*';
      res.header('Access-Control-Allow-Origin', allowedOrigin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Accept-Language');
      // Logger seulement en debug mode
      if (process.env.DEBUG_CORS === 'true') {
        console.log(`[Backend] ✅ Headers CORS ajoutés (dev) pour ${req.method} ${req.path} depuis ${origin || 'unknown'} -> ${allowedOrigin}`);
      }
    } else if (origin && allowedOrigins.includes(origin)) {
      // En production, seulement si origin est présent
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Accept-Language');
      // Pas de log en production pour les performances
    }
    next();
  });
  
  // Configuration CORS simplifiée et permissive en développement
  if (isDev) {
    // En développement, autoriser TOUTES les origines
    app.enableCors({
      origin: true, // Plus simple et plus fiable que la fonction callback
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
      exposedHeaders: ['Authorization'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  } else {
    // En production, autoriser uniquement les origines spécifiées
    app.enableCors({
      origin: allowedOrigins.length ? allowedOrigins : false,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
      exposedHeaders: ['Authorization'],
    });
  }

  // Middleware CORS spécifique pour /uploads - AVANT Helmet
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    // Définir les en-têtes CORS - autoriser les deux frontends
    const origin = req.headers.origin;
    if (isDev || (origin && allowedOrigins.includes(origin))) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
    
    // Gérer les requêtes preflight OPTIONS
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });
  
  // Configuration du chemin de stockage des images de permis
  const staticLicensePath = process.env.UPLOAD_PATH 
    ? join(process.env.UPLOAD_PATH, 'licenses')
    : join(__dirname, '..', 'uploads', 'licenses');
  
  // Serve static files pour les permis avec setHeaders pour forcer les en-têtes CORS
  app.useStaticAssets(staticLicensePath, {
    prefix: '/uploads/licenses/',
    setHeaders: (res: Response, filePath: string) => {
      // Forcer les en-têtes CORS sur chaque fichier servi
      // Le CORS global gère déjà les origines autorisées
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
      // Définir le type de contenu approprié pour les images
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      } else if (filePath.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      }
    },
  });

  // Security - Configurer Helmet pour ne pas bloquer les images CORS
  app.use(
    helmet({
      contentSecurityPolicy: false, // Désactiver CSP pour Swagger
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permettre les images cross-origin
      crossOriginEmbedderPolicy: false, // Désactiver pour permettre les images
    }),
  );

  // Global prefix with versioning
  app.setGlobalPrefix('api/v1');

  // Configuration du chemin de stockage des images
  const staticUploadPath = process.env.UPLOAD_PATH 
    ? join(process.env.UPLOAD_PATH, 'vehicles')
    : join(__dirname, '..', 'uploads');
  
  // Serve static files avec setHeaders pour forcer les en-têtes CORS
  app.useStaticAssets(staticUploadPath, {
    prefix: '/uploads/',
    setHeaders: (res: Response, filePath: string) => {
      // Forcer les en-têtes CORS sur chaque fichier servi
      // Le CORS global gère déjà les origines autorisées
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
      // Définir le type de contenu approprié pour les images
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      } else if (filePath.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      }
    },
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Permettre les propriétés supplémentaires pour éviter les erreurs avec 'note'
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MalocAuto API')
      .setDescription('SaaS de location de véhicules - API Documentation')
      .setVersion('2.0.0')
      .addBearerAuth()
      .addServer('/api/v1', 'API Version 1')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port, '0.0.0.0');
  
  if (nodeEnv !== 'production') {
    
  }
}

bootstrap();

