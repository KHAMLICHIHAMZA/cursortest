import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, unlinkSync, existsSync } from "fs";

/**
 * Upload optionnel vers stockage S3-compatible (AWS S3, Cloudflare R2, MinIO).
 * Si S3_* n'est pas complet, les uploads véhicules restent sur disque (comportement historique).
 */
@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);

  constructor(private readonly configService: ConfigService) {}

  /** Prêt seulement si bucket + clés + URL publique des assets sont définis. */
  isVehicleUploadToObjectStorageEnabled(): boolean {
    return (
      !!this.getRequired("S3_BUCKET") &&
      !!this.getRequired("S3_ACCESS_KEY") &&
      !!this.getRequired("S3_SECRET_KEY") &&
      !!this.getRequired("S3_PUBLIC_BASE_URL")
    );
  }

  private getRequired(key: string): string | undefined {
    const v = this.configService.get<string>(key);
    return v?.trim() || undefined;
  }

  private getClient(): S3Client {
    const endpoint = this.getRequired("S3_ENDPOINT");
    const region = this.getRequired("S3_REGION") || "auto";
    const forcePathStyle =
      this.configService.get<string>("S3_FORCE_PATH_STYLE") === "true" ||
      (!!endpoint && endpoint.length > 0);
    return new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId: this.getRequired("S3_ACCESS_KEY")!,
        secretAccessKey: this.getRequired("S3_SECRET_KEY")!,
      },
      forcePathStyle,
    });
  }

  /**
   * Lit le fichier sur disque (multer), l'envoie sur le bucket, supprime le fichier local.
   * @returns URL HTTPS utilisable telle quelle en base / pour &lt;img src&gt;
   */
  async pushVehicleFileAndReturnPublicUrl(
    file: Express.Multer.File,
  ): Promise<string> {
    const bucket = this.getRequired("S3_BUCKET")!;
    const publicBase = this.getRequired("S3_PUBLIC_BASE_URL")!.replace(
      /\/$/,
      "",
    );
    if (!file.path || !existsSync(file.path)) {
      throw new Error("Fichier local introuvable après upload multer");
    }

    const key = `vehicles/${file.filename}`;
    const body = readFileSync(file.path);
    const contentType = file.mimetype || "application/octet-stream";

    const client = this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    try {
      unlinkSync(file.path);
    } catch (e) {
      this.logger.warn(
        `Impossible de supprimer le fichier temporaire ${file.path}: ${e}`,
      );
    }

    const publicUrl = `${publicBase}/${key}`;
    this.logger.log(`vehicle image uploaded to object storage: ${publicUrl}`);
    return publicUrl;
  }
}
