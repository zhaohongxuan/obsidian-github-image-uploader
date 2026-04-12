import { App, Modal, setIcon } from 'obsidian';
import type { ReferenceMatch } from './ImageSearch';

/**
 * Modal for confirming upload to GitHub with replacement info
 */
export class UploadConfirmModal extends Modal {
  private imageName: string;
  private imageSize: number;
  private imageSizeBytes: number;
  private compressionThreshold: number;
  private enableCompression: boolean;
  private references: ReferenceMatch[];
  private resolve: ((result: { compress: boolean }) => void) | null = null;

  constructor(
    app: App,
    imageName: string,
    imageSizeBytes: number,
    compressionThreshold: number,
    enableCompression: boolean,
    references: ReferenceMatch[]
  ) {
    super(app);
    this.imageName = imageName;
    this.imageSizeBytes = imageSizeBytes;
    this.imageSize = imageSizeBytes / (1024 * 1024); // MB
    this.compressionThreshold = compressionThreshold;
    this.enableCompression = enableCompression;
    this.references = references;
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    modalEl.addClass('upload-confirm-modal');

    modalEl.style.width = '500px';
    modalEl.style.maxWidth = '90vw';

    // Header
    const header = contentEl.createEl('div', { cls: 'upload-confirm-header' });
    header.createEl('h2', { text: '上传到 GitHub' });

    // Body
    const body = contentEl.createEl('div', { cls: 'upload-confirm-body' });

    // Image info
    const infoSection = body.createEl('div', { cls: 'upload-confirm-info' });
    infoSection.createEl('div', { cls: 'upload-confirm-filename', text: this.imageName });
    infoSection.createEl('div', { cls: 'upload-confirm-size', text: this.formatBytes(this.imageSizeBytes) });

    // Compression option (if size > threshold)
    const shouldCompress = this.imageSize > this.compressionThreshold;
    let compressCheckbox: HTMLInputElement | null = null;

    if (shouldCompress && this.enableCompression) {
      const compressSection = body.createEl('div', { cls: 'upload-confirm-compress' });
      compressCheckbox = compressSection.createEl('input', { type: 'checkbox' }) as HTMLInputElement;
      compressCheckbox.id = 'compress-checkbox';
      compressCheckbox.checked = true;
      const label = compressSection.createEl('label');
      label.htmlFor = 'compress-checkbox';
      label.textContent = `压缩图片（大小超过 ${this.compressionThreshold}MB 阈值）`;
    }

    // Affected notes section
    if (this.references.length > 0) {
      const notesSection = body.createEl('div', { cls: 'upload-confirm-notes' });
      notesSection.createEl('div', {
        cls: 'upload-confirm-notes-header',
        text: `将修改以下 ${this.references.length} 篇笔记中的链接：`
      });

      const notesList = notesSection.createEl('div', { cls: 'upload-confirm-notes-list' });
      for (const ref of this.references) {
        const noteItem = notesList.createEl('div', { cls: 'upload-confirm-note-item' });
        const icon = noteItem.createSpan({ cls: 'upload-confirm-note-icon' });
        setIcon(icon, 'file-text');
        noteItem.createEl('span', { cls: 'upload-confirm-note-name', text: ref.file.basename });
      }
    } else {
      const noNotesSection = body.createEl('div', { cls: 'upload-confirm-no-notes' });
      noNotesSection.textContent = '此图片未被任何笔记引用';
    }

    // Footer / buttons
    const footer = contentEl.createEl('div', { cls: 'upload-confirm-footer' });

    const cancelBtn = footer.createEl('button', { cls: 'upload-confirm-cancel-btn' });
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => {
      this.close();
      // Pass null to signal cancellation
      this.resolve?.(null);
    });

    const confirmBtn = footer.createEl('button', { cls: 'upload-confirm-confirm-btn' });
    setIcon(confirmBtn, 'upload');
    confirmBtn.appendText(' 上传并替换');
    confirmBtn.addEventListener('click', () => {
      this.close();
      this.resolve?.({ compress: compressCheckbox?.checked ?? false });
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  async getResult(): Promise<{ compress: boolean } | null> {
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
}
