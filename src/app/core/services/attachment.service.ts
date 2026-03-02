import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';

// Assuming these existed in backend-api/models/attachment
export type AttachmentEntityType = 'PRIVILEGE_REQUEST' | 'TICKET' | string;

export interface AttachmentInfo {
    id: number;
    originalName: string;
    contentType: string;
    size: number;
    entityType: string;
    entityId: number;
    createdAt: string;
}

export interface AttachmentListResponse {
    success: boolean;
    data: AttachmentInfo[];
    message?: string;
}

export interface AttachmentUploadResponse {
    success: boolean;
    data: AttachmentInfo;
    message?: string;
}

/**
 * Service for managing file attachments stored in database.
 * Provides upload, download, delete, and list operations.
 */
@Injectable({
    providedIn: 'root'
})
export class AttachmentService {

    private readonly baseUrl = 'attachments';

    constructor(private http: HttpClient) { }

    /**
     * Upload a file attachment.
     *
     * @param file The file to upload
     * @param entityType The type of entity this attachment belongs to
     * @param entityId The ID of the entity
     * @returns Observable with upload response
     */
    upload(file: File, entityType: AttachmentEntityType, entityId: number): Observable<AttachmentUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId.toString());

        return this.http.post<AttachmentUploadResponse>(`${this.baseUrl}/upload`, formData);
    }

    /**
     * Upload a file with progress tracking.
     *
     * @param file The file to upload
     * @param entityType The type of entity
     * @param entityId The ID of the entity
     * @returns Observable with HttpEvent for progress tracking
     */
    uploadWithProgress(file: File, entityType: AttachmentEntityType, entityId: number): Observable<HttpEvent<AttachmentUploadResponse>> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId.toString());

        const request = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
            reportProgress: true
        });

        return this.http.request<AttachmentUploadResponse>(request);
    }

    /**
     * Download an attachment and save it to disk.
     *
     * @param attachmentId The attachment ID
     * @param fileName Optional filename to save as (uses original name if not provided)
     */
    download(attachmentId: number, fileName?: string): void {
        this.http.get(`${this.baseUrl}/download/${attachmentId}`, {
            responseType: 'blob',
            observe: 'response'
        }).subscribe({
            next: (response) => {
                const blob = response.body;
                if (blob) {
                    // Try to get filename from Content-Disposition header
                    let downloadName = fileName;
                    if (!downloadName) {
                        const contentDisposition = response.headers.get('Content-Disposition');
                        if (contentDisposition) {
                            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                            if (match && match[1]) {
                                downloadName = match[1].replace(/['"]/g, '');
                            }
                        }
                    }
                    this.saveFileLocally(blob, downloadName || 'attachment');
                }
            },
            error: (error) => {
                console.error('Download failed:', error);
            }
        });
    }

    /**
     * Helper to natively trigger a file download natively without third-party libraries.
     */
    private saveFileLocally(blob: Blob, fileName: string): void {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Download an attachment as Observable (for custom handling).
     *
     * @param attachmentId The attachment ID
     * @returns Observable with Blob data
     */
    downloadAsBlob(attachmentId: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/download/${attachmentId}`, {
            responseType: 'blob'
        });
    }

    /**
     * Get attachment info by ID (without content).
     *
     * @param attachmentId The attachment ID
     * @returns Observable with attachment info
     */
    getById(attachmentId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/${attachmentId}`);
    }

    /**
     * List all attachments for an entity.
     *
     * @param entityType The type of entity
     * @param entityId The entity ID
     * @returns Observable with list of attachments
     */
    listByEntity(entityType: AttachmentEntityType, entityId: number): Observable<AttachmentListResponse> {
        return this.http.get<AttachmentListResponse>(`${this.baseUrl}/list/${entityType}/${entityId}`);
    }

    /**
     * Delete an attachment.
     *
     * @param attachmentId The attachment ID
     * @returns Observable with delete response
     */
    delete(attachmentId: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.baseUrl}/${attachmentId}`);
    }

    /**
     * Delete all attachments for an entity.
     *
     * @param entityType The type of entity
     * @param entityId The entity ID
     * @returns Observable with delete response
     */
    deleteByEntity(entityType: AttachmentEntityType, entityId: number): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(`${this.baseUrl}/entity/${entityType}/${entityId}`);
    }

    /**
     * Count attachments for an entity.
     *
     * @param entityType The type of entity
     * @param entityId The entity ID
     * @returns Observable with count
     */
    countByEntity(entityType: AttachmentEntityType, entityId: number): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}/count/${entityType}/${entityId}`);
    }

    /**
     * Format file size to human readable string.
     *
     * @param bytes File size in bytes
     * @returns Formatted string (e.g., "1.5 MB")
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Get file icon class based on content type.
     *
     * @param contentType MIME type
     * @returns Icon class name
     */
    getFileIcon(contentType: string): string {
        if (!contentType) return 'file';

        if (contentType.includes('pdf')) return 'file-pdf';
        if (contentType.includes('image')) return 'file-image';
        if (contentType.includes('word') || contentType.includes('document')) return 'file-word';
        if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'file-excel';
        if (contentType.includes('powerpoint') || contentType.includes('presentation')) return 'file-ppt';
        if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('7z')) return 'file-zip';
        if (contentType.includes('text')) return 'file-text';

        return 'file';
    }
}
