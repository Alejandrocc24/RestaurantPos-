import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Servicio para manejar subidas a Google Drive usando cuenta de servicio
export class GoogleDriveService {
    private drive;

    constructor() {
        // Asume que el archivo service-account.json está en la raíz de backend
        const keyFilePath = path.join(process.cwd(), 'service-account.json');

        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        this.drive = google.drive({ version: 'v3', auth });
    }

    /**
     * Sube un archivo a Google Drive y devuelve la URL para compartir
     * @param filePath Ruta del archivo a subir
     * @param folderId Opcional. ID de la carpeta en Google Drive donde guardar
     */
    async uploadFile(filePath: string, folderId?: string): Promise<string> {
        try {
            const fileName = path.basename(filePath);

            const fileMetadata: any = {
                name: fileName,
            };

            if (folderId) {
                fileMetadata.parents = [folderId];
            }

            const media = {
                mimeType: 'application/json', // o application/zip si lo comprimes...
                body: fs.createReadStream(filePath),
            };

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, webViewLink, webContentLink',
            });

            const fileId = response.data.id;

            // Hacer que el archivo sea público si quieres compartir el enlace para descargas directas
            // o puedes mantenerlo privado (comentar esto) para mayor seguridad.
            // await this.drive.permissions.create({
            //     fileId: fileId!,
            //     requestBody: { role: 'reader', type: 'anyone' },
            // });

            return response.data.webViewLink || '';
        } catch (error: any) {
            // Es posible que el archivo service-account.json no exista o tenga permisos incorrectos
            console.error('Error al subir a Google Drive:', error.message);
            throw new Error('No se pudo subir a Google Drive: ' + error.message);
        }
    }
}
