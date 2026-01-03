import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Abstract file storage service
 * 
 * Currently implements local filesystem storage.
 * Designed to be easily replaceable with S3 or other cloud storage providers.
 * 
 * File lifecycle management:
 * - Files are stored in organized directories by type
 * - Orphan file detection available for cleanup
 * - Backup strategy: Use database backups + file system backups
 * 
 * Future scalability:
 * - Replace with S3StorageService implementing same interface
 * - Use dependency injection to swap implementations
 */
export interface IFileStorageService {
  saveFile(file: Express.Multer.File, directory: string, filename?: string): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
  getFileUrl(filePath: string): string;
  listOrphanFiles(directory: string, referencedPaths: string[]): Promise<string[]>;
}

@Injectable()
export class FileStorageService implements IFileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly basePath: string;

  constructor(private configService: ConfigService) {
    // Base path for file storage
    // Can be overridden with UPLOAD_PATH environment variable
    this.basePath =
      this.configService.get<string>('UPLOAD_PATH') ||
      join(process.cwd(), 'uploads');
  }

  /**
   * Save a file to storage
   * 
   * @param file - Multer file object
   * @param directory - Subdirectory (e.g., 'vehicles', 'licenses')
   * @param filename - Optional custom filename
   * @returns Relative path to the file
   */
  async saveFile(
    file: Express.Multer.File,
    directory: string,
    filename?: string,
  ): Promise<string> {
    const dirPath = join(this.basePath, directory);
    
    // Ensure directory exists
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }

    const finalFilename = filename || file.filename || `${Date.now()}-${file.originalname}`;
    const filePath = join(dirPath, finalFilename);

    // In a real implementation, you would write the file here
    // For now, assuming Multer has already saved it
    // This is a placeholder for future S3 migration

    return `/${directory}/${finalFilename}`;
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = join(this.basePath, filePath.replace(/^\//, ''));
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
        this.logger.debug(`Deleted file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getFileUrl(filePath: string): string {
    // For local storage, return relative path
    // For S3, this would return the S3 URL
    return filePath.startsWith('/') ? filePath : `/${filePath}`;
  }

  /**
   * Detect orphan files (files not referenced in database)
   * 
   * @param directory - Directory to scan
   * @param referencedPaths - Array of file paths that are referenced in database
   * @returns Array of orphan file paths
   */
  async listOrphanFiles(directory: string, referencedPaths: string[]): Promise<string[]> {
    const dirPath = join(this.basePath, directory);
    const orphanFiles: string[] = [];

    if (!existsSync(dirPath)) {
      return orphanFiles;
    }

    try {
      const files = readdirSync(dirPath);
      const referencedSet = new Set(
        referencedPaths.map((p) => p.replace(/^\//, '').split('/').pop() || ''),
      );

      for (const file of files) {
        const filePath = join(dirPath, file);
        const stats = statSync(filePath);

        if (stats.isFile() && !referencedSet.has(file)) {
          orphanFiles.push(join(directory, file));
        }
      }
    } catch (error) {
      this.logger.error(`Failed to scan directory for orphan files: ${directory}`, error);
    }

    return orphanFiles;
  }
}



