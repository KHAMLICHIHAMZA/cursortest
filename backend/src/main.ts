import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Request, Response, NextFunction } from "express";
import { join } from "path";
import { AppModule } from "./app.module";
import { recordHttpMetric } from "./common/observability/http-metrics.store";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // GET /api/v1 : doit passer avant le routeur Nest (sinon 404). Pas fiable via @Get() seul avec globalPrefix.
  const apiV1RootPayload = {
    service: "MalocAuto API",
    version: "2.0.0",
    health: "/api/v1/health",
    ready: "/api/v1/ready",
    authLogin: "POST /api/v1/auth/login",
  };
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }
    const p = req.originalUrl?.split("?")[0] ?? "";
    if (p === "/api/v1" || p === "/api/v1/") {
      res.json(apiV1RootPayload);
      return;
    }
    next();
  });

  // GET / : l'API est sous /api/v1 — éviter un 404 confus quand on ouvre l'URL racine dans un navigateur.
  const expressApp = app.getHttpAdapter().getInstance() as {
    get: (path: string, handler: (req: Request, res: Response) => void) => void;
  };
  expressApp.get("/", (_req: Request, res: Response) => {
    res.json({
      service: "MalocAuto API",
      version: "2.0.0",
      apiBase: "/api/v1",
      health: "/api/v1/health",
      ready: "/api/v1/ready",
    });
  });

  // Lightweight request timing metrics for observability endpoints.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const path = req.path || req.originalUrl?.split("?")[0] || "/";
      recordHttpMetric(req.method, path, res.statusCode, durationMs);
    });
    next();
  });

  const nodeEnv = process.env.NODE_ENV || "development";
  const isDev = nodeEnv === "development";

  const frontendUrl =
    process.env.FRONTEND_URL || (isDev ? "http://localhost:3001" : undefined);
  const frontendAgencyUrl =
    process.env.FRONTEND_AGENCY_URL ||
    frontendUrl ||
    (isDev ? "http://localhost:8080" : undefined);
  const frontendAdminUrl =
    process.env.FRONTEND_ADMIN_URL ||
    frontendUrl ||
    (isDev ? "http://localhost:5173" : undefined);
  const mobileWebUrl =
    process.env.MOBILE_WEB_URL || (isDev ? "http://localhost:8081" : undefined);
  const allowedOrigins = [
    frontendUrl,
    frontendAgencyUrl,
    frontendAdminUrl,
    mobileWebUrl,
  ].filter((value): value is string => Boolean(value));

  const isOriginAllowed = (origin: string): boolean => {
    if (allowedOrigins.includes(origin)) return true;
    if (origin.endsWith(".vercel.app")) return true;
    return false;
  };

  if (!isDev) {
    const requiredEnv = [
      "JWT_SECRET",
      "JWT_REFRESH_SECRET",
      "DATABASE_URL",
      "FRONTEND_URL",
    ];
    const missingEnv = requiredEnv.filter((key) => !process.env[key]);
    if (missingEnv.length > 0) {
      throw new Error(
        `Variables d'environnement manquantes : ${missingEnv.join(", ")}. Vérifiez votre fichier .env.`,
      );
    }
  }

  // CORS global - DOIT être AVANT Helmet
  // Autoriser les deux frontends (web et agence) + mobile + Expo web
  // Middleware pour gérer les requêtes OPTIONS (preflight) AVANT enableCors
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    // Debug: log all incoming requests

    if (req.method === "OPTIONS") {
      if (isDev || (origin && isOriginAllowed(origin))) {
        // Répondre aux preflight requests
        res.header("Access-Control-Allow-Origin", origin || "*");
        res.header(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        );
        res.header(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, Accept, Accept-Language",
        );
        res.header("Access-Control-Allow-Credentials", "true");
        res.header("Access-Control-Max-Age", "86400"); // 24 heures

        return res.sendStatus(204);
      }

      return res.sendStatus(403);
    }

    // Pour toutes les autres requêtes, ajouter les headers CORS AVANT la réponse
    // IMPORTANT: Toujours ajouter les headers CORS en développement
    // Le middleware enableCors de NestJS devrait gérer ça, mais on force pour être sûr
    if (isDev) {
      // En développement, toujours autoriser
      const allowedOrigin = origin || "*";
      res.header("Access-Control-Allow-Origin", allowedOrigin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Accept, Accept-Language",
      );
      // Logger seulement en debug mode
      if (process.env.DEBUG_CORS === "true") {
        console.log(
          `[Backend] ✅ Headers CORS ajoutés (dev) pour ${req.method} ${req.path} depuis ${origin || "unknown"} -> ${allowedOrigin}`,
        );
      }
    } else if (origin && isOriginAllowed(origin)) {
      // En production, seulement si origin est présent
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Accept, Accept-Language",
      );
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
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Accept",
        "Accept-Language",
      ],
      exposedHeaders: ["Authorization"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  } else {
    // En production, autoriser les origines spécifiées + sous-domaines Vercel
    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Accept",
        "Accept-Language",
      ],
      exposedHeaders: ["Authorization"],
    });
  }

  // Middleware CORS spécifique pour /uploads - AVANT Helmet
  app.use("/uploads", (req: Request, res: Response, next: NextFunction) => {
    // Définir les en-têtes CORS - autoriser les deux frontends
    const origin = req.headers.origin;
    if (isDev || (origin && isOriginAllowed(origin))) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept",
    );
    res.header("Access-Control-Expose-Headers", "Content-Length, Content-Type");

    // Gérer les requêtes preflight OPTIONS
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  // Racine « uploads » (contient vehicles/, licenses/, fines/, etc.). UPLOAD_PATH = ce dossier en prod.
  const uploadsRoot = process.env.UPLOAD_PATH
    ? process.env.UPLOAD_PATH
    : join(__dirname, "..", "uploads");
  const staticLicensePath = join(uploadsRoot, "licenses");

  const setUploadCorsHeaders = (res: Response, filePath: string) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Type",
    );
    if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
      res.setHeader("Content-Type", "image/jpeg");
    } else if (filePath.endsWith(".png")) {
      res.setHeader("Content-Type", "image/png");
    } else if (filePath.endsWith(".gif")) {
      res.setHeader("Content-Type", "image/gif");
    } else if (filePath.endsWith(".webp")) {
      res.setHeader("Content-Type", "image/webp");
    }
  };

  // Fichiers statiques sous /uploads *avant* le globalPrefix api/v1 (sinon risque de 404).
  // Ne pas utiliser join(UPLOAD_PATH, "vehicles") comme racine : l’URL est déjà /uploads/vehicles/…
  app.useStaticAssets(staticLicensePath, {
    prefix: "/uploads/licenses/",
    setHeaders: (res: Response, filePath: string) =>
      setUploadCorsHeaders(res, filePath),
  });
  app.useStaticAssets(uploadsRoot, {
    prefix: "/uploads/",
    setHeaders: (res: Response, filePath: string) =>
      setUploadCorsHeaders(res, filePath),
  });

  // Security - Configurer Helmet pour ne pas bloquer les images CORS
  app.use(
    helmet({
      contentSecurityPolicy: false, // Désactiver CSP pour Swagger
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Permettre les images cross-origin
      crossOriginEmbedderPolicy: false, // Désactiver pour permettre les images
    }),
  );

  // Global prefix with versioning
  app.setGlobalPrefix("api/v1");

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
  if (nodeEnv !== "production") {
    const config = new DocumentBuilder()
      .setTitle("MalocAuto API")
      .setDescription("SaaS de location de véhicules - API Documentation")
      .setVersion("2.0.0")
      .addBearerAuth()
      .addServer("/api/v1", "API Version 1")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  await app.listen(port, "0.0.0.0");

  if (nodeEnv !== "production") {
  }
}

bootstrap();
