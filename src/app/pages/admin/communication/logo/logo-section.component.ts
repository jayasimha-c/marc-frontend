import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NotificationService } from '../../../../core/services/notification.service';
import { CommunicationService } from '../communication.service';

@Component({
  standalone: false,
  selector: 'app-logo-section',
  templateUrl: './logo-section.component.html',
  styleUrls: ['./logo-section.component.scss'],
})
export class LogoSectionComponent implements OnInit {
  imageData: SafeUrl | null = null;
  imageId: number | null = null;
  uploading = false;
  saving = false;

  constructor(
    private communicationService: CommunicationService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadLogo();
  }

  loadLogo(): void {
    this.communicationService.getLogo().subscribe((resp: any) => {
      if (resp.data) {
        this.loadLogoContent(resp.data);
      }
    });
  }

  loadLogoContent(attachmentId: number): void {
    this.communicationService.getLogoContent(attachmentId).subscribe((blob: Blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.imageData = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.communicationService.uploadLogo(file).subscribe({
      next: (resp: any) => {
        if (resp.success) {
          this.imageId = resp.data?.id;
          if (this.imageId) {
            this.loadLogoContent(this.imageId);
          }
          this.notificationService.success('Logo uploaded. Click Save to apply.');
        }
        this.uploading = false;
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Error uploading logo');
        this.uploading = false;
      },
    });
    input.value = '';
  }

  saveFile(): void {
    if (!this.imageId) {
      this.notificationService.error('Upload a logo first!');
      return;
    }

    this.saving = true;
    this.communicationService.saveLogo(this.imageId).subscribe({
      next: (resp: any) => {
        if (resp.success) {
          this.notificationService.success('Logo saved successfully.');
        }
        this.saving = false;
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Error saving logo');
        this.saving = false;
      },
    });
  }
}
