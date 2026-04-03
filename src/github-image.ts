import { App, MarkdownView, Notice, Modal, ItemView, WorkspaceLeaf, Menu, setIcon } from 'obsidian';
import type GitHubImageUploaderPlugin from './main';

/**
 * Image data interface
 */
export interface GalleryImage {
  name: string;
  size: number;
  url: string;
  date: Date;
}

/**
 * GitHub Image Hosting Module
 * Handles pasting images and uploading them to GitHub
 */
export class GitHubImageHosting {
  constructor(
    private plugin: GitHubImageUploaderPlugin,
    private app: App
  ) {}

  /**
   * Register paste event listener and file upload interceptor
   */
  register() {
    if (!this.plugin.settings.enableImageHosting) return;

    // Handle paste events
    this.registerPasteListener();
    
    // Handle file uploads (for mobile and desktop)
    this.registerUploadListener();
  }

  /**
   * Register paste event listener
   */
  private registerPasteListener() {
    // Use document-level paste event to intercept before Obsidian processes it
    this.plugin.registerDomEvent(document, 'paste', (evt: ClipboardEvent) => {
      // Check if there are image files in clipboard
      const files = evt.clipboardData?.files;
      if (!files) return;

      let hasImage = false;
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          hasImage = true;
          break;
        }
      }

      if (hasImage) {
        // Completely prevent default paste behavior
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
        
        // Handle image upload
        this.handleImagePaste(evt);
      }
    }, true); // Use capture phase to intercept early
  }

  /**
   * Register file upload listener for mobile and desktop
   */
  private registerUploadListener() {
    // Intercept file input changes (for mobile file uploads)
    this.plugin.registerDomEvent(document, 'change', (evt: Event) => {
      const target = evt.target as HTMLInputElement;
      
      // Check if it's a file input
      if (target.tagName === 'INPUT' && target.type === 'file' && target.files) {
        const files = target.files;
        
        // Check for image files
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            // Prevent default upload behavior
            evt.preventDefault();
            evt.stopPropagation();
            evt.stopImmediatePropagation();
            
            // Handle image upload
            this.handleFileUpload(file);
            
            // Reset file input
            target.value = '';
            break;
          }
        }
      }
    }, true);
  }

  /**
   * Handle image paste events
   */
  private async handleImagePaste(evt: ClipboardEvent) {
    const files = evt.clipboardData?.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
        
        // Validate file size before processing (limit to 10MB for safety)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        const isMobile = this.detectMobileDevice();
        const MAX_MOBILE_SIZE = 5 * 1024 * 1024; // 5MB for mobile
        const maxSize = isMobile ? MAX_MOBILE_SIZE : MAX_FILE_SIZE;
        
        if (file.size > maxSize) {
          new Notice(`文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，${isMobile ? '移动端' : ''}限制为 ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
          return;
        }
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = async (e) => {
          const previewUrl = e.target?.result as string;
          
          // Check if file needs compression option
          const compressionThresholdBytes = this.plugin.settings.compressionThreshold * 1024 * 1024;
          const showCompressOption = this.plugin.settings.enableImageCompression && file.size > compressionThresholdBytes;
          
          // Show confirmation modal and wait for user choice
          const action = await new Promise<'github' | 'local' | 'compress' | null>((resolve) => {
            const compressAndUpload = showCompressOption ? async () => {
              await this.compressAndUploadImage(file);
              resolve('compress');
            } : undefined;
            
            const modal = new ImageConfirmModal(this.app, file, previewUrl, resolve, isMobile, showCompressOption, compressAndUpload);
            modal.open();
          });
          
          // Execute based on user choice
          if (action === 'github') {
            await this.uploadAndInsertImage(file);
          } else if (action === 'local') {
            // Use Obsidian's default paste behavior
            await this.saveImageLocally(file);
          } else if (action === 'compress') {
            // Compress already handled in the callback
          }
        };
        reader.onerror = () => {
          new Notice('读取文件失败');
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }

  /**
   * Detect if running on mobile device
   */
  private detectMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Handle file upload from input (mobile and desktop)
   */
  private async handleFileUpload(file: File) {
    // Validate file size before processing (limit to 10MB for safety)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const isMobile = this.detectMobileDevice();
    const MAX_MOBILE_SIZE = 5 * 1024 * 1024; // 5MB for mobile
    const maxSize = isMobile ? MAX_MOBILE_SIZE : MAX_FILE_SIZE;
    
    if (file.size > maxSize) {
      new Notice(`文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，${isMobile ? '移动端' : ''}限制为 ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
      return;
    }
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const previewUrl = e.target?.result as string;
      
      // Check if file needs compression option
      const compressionThresholdBytes = this.plugin.settings.compressionThreshold * 1024 * 1024;
      const showCompressOption = this.plugin.settings.enableImageCompression && file.size > compressionThresholdBytes;
      
      // Show confirmation modal and wait for user choice
      const action = await new Promise<'github' | 'local' | 'compress' | null>((resolve) => {
        const compressAndUpload = showCompressOption ? async () => {
          await this.compressAndUploadImage(file);
          resolve('compress');
        } : undefined;
        
        const modal = new ImageConfirmModal(this.app, file, previewUrl, resolve, isMobile, showCompressOption, compressAndUpload);
        modal.open();
      });
      
      // Execute based on user choice
      if (action === 'github') {
        await this.uploadAndInsertImage(file);
      } else if (action === 'local') {
        // Use Obsidian's default paste behavior
        await this.saveImageLocally(file);
      } else if (action === 'compress') {
        // Compress already handled in the callback
      }
    };
    reader.onerror = () => {
      new Notice('读取文件失败');
    };
    reader.readAsDataURL(file);
  }

  /**
   * Save image to Obsidian's attachment folder
   */
  private async saveImageLocally(file: File) {
    try {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) return;

      const arrayBuffer = await file.arrayBuffer();
      const filename = file.name;
      
      // Save to Obsidian attachments folder
      const attachmentFolder = this.plugin.settings.localFolder;
      try {
        await this.app.vault.createBinary(attachmentFolder + '/' + filename, arrayBuffer);
      } catch (err) {
        // If folder doesn't exist, create it first
        try {
          await this.app.vault.createFolder(attachmentFolder);
          await this.app.vault.createBinary(attachmentFolder + '/' + filename, arrayBuffer);
        } catch (e) {
          // Fallback to root
          await this.app.vault.createBinary(filename, arrayBuffer);
        }
      }

      // Insert markdown link
      const cursor = view.editor.getCursor();
      const linkPath = attachmentFolder + '/' + filename;
      const markdownLink = this.generateMarkdownImageLink(linkPath) + '\n';
      view.editor.replaceRange(markdownLink, cursor);
      new Notice('图片已保存到本地');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      new Notice('保存失败: ' + msg);
    }
  }

  /**
   * Upload image to GitHub and insert markdown link
   */
  private async uploadAndInsertImage(file: File) {
    const { gitHubToken, gitHubOwner, gitHubRepo, imagePath, gitHubBranch } = this.plugin.settings;

    if (!gitHubToken || !gitHubOwner || !gitHubRepo) {
      new Notice('GitHub 配置不完整，请在插件设置中配置');
      return;
    }

    // Show upload progress modal
    let uploadSuccess = false;
    let uploadUrl = '';
    let uploadError = '';

    const progressModal = new UploadProgressModal(this.app);
    progressModal.open();

    try {
      const blob = new Blob([file], { type: file.type });
      const filename = this.generateImageFilename(file.type);
      
      // Update progress
      progressModal.updateStatus('正在上传到 GitHub...', 'uploading');

      // Attempt upload with timeout for mobile safety
      const uploadPromise = this.uploadImageToGitHub(blob, filename, {
        token: gitHubToken,
        owner: gitHubOwner,
        repo: gitHubRepo,
        branch: gitHubBranch,
        folder: imagePath,
      });

      // Set timeout to prevent hanging on mobile (30 seconds)
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('上传超时，请检查网络连接')), 30000)
      );

      uploadUrl = await Promise.race([uploadPromise, timeoutPromise]);
      uploadSuccess = true;

      // Update progress to complete
      progressModal.updateStatus('上传成功！', 'success');

      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 800));

      // Insert markdown image link
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (view) {
        const cursor = view.editor.getCursor();
        const markdownLink = this.generateMarkdownImageLink(uploadUrl) + '\n';
        view.editor.replaceRange(markdownLink, cursor);
      }

      // Close modal
      progressModal.close();
    } catch (error) {
      uploadError = error instanceof Error ? error.message : String(error);
      progressModal.updateStatus('上传失败: ' + uploadError, 'error');
      
      // Show error for 2 seconds then close
      await new Promise(resolve => setTimeout(resolve, 2000));
      progressModal.close();
    }
  }

  /**
   * Compress image and upload to GitHub
   */
  private async compressAndUploadImage(file: File) {
    // Show progress modal
    const progressModal = new UploadProgressModal(this.app);
    progressModal.open();
    progressModal.updateStatus('正在压缩图片...', 'uploading');

    try {
      // Compress image
      const compressedBlob = await this.compressImage(file);
      
      progressModal.updateStatus('正在上传压缩后的图片到 GitHub...', 'uploading');

      // Upload compressed image
      const { gitHubToken, gitHubOwner, gitHubRepo, imagePath, gitHubBranch } = this.plugin.settings;
      const filename = this.generateImageFilename(file.type);
      
      const uploadUrl = await this.uploadImageToGitHub(compressedBlob, filename, {
        token: gitHubToken,
        owner: gitHubOwner,
        repo: gitHubRepo,
        branch: gitHubBranch,
        folder: imagePath,
      });

      progressModal.updateStatus('上传成功！', 'success');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Insert markdown image link
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (view) {
        const cursor = view.editor.getCursor();
        const markdownLink = this.generateMarkdownImageLink(uploadUrl) + '\n';
        view.editor.replaceRange(markdownLink, cursor);
      }

      progressModal.close();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      progressModal.updateStatus('压缩或上传失败: ' + msg, 'error');
      await new Promise(resolve => setTimeout(resolve, 2000));
      progressModal.close();
    }
  }

  /**
   * Compress image to target size using canvas
   * 
   * Algorithm:
   * 1. Load image and create canvas
   * 2. Iteratively reduce JPEG quality until file size meets target
   * 3. Uses initial quality and quality step from plugin settings
   * 
   * Performance notes:
   * - Quality range: 0.1 (very compressed) to 1.0 (lossless)
   * - Each iteration calls canvas.toBlob() which can be slow on mobile
   * - Step size affects precision: smaller steps = more iterations but better size targeting
   */
  private async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建 Canvas 上下文'));
            return;
          }

          // Calculate dimensions with aspect ratio
          let width = img.width;
          let height = img.height;
          
          // Start with full resolution
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Iteratively reduce quality until target size is achieved
          const initialQuality = this.plugin.settings.compressionQuality;
          const qualityStep = this.plugin.settings.compressionQualityStep;
          const targetSize = this.plugin.settings.targetCompressedSize * 1024; // Convert KB to bytes
          const minQuality = 0.1; // Absolute minimum to prevent over-compression
          
          let quality = initialQuality;
          
          const compressWithQuality = (q: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('无法压缩图片'));
                  return;
                }

                // Stop if file is small enough or quality is too low
                if (blob.size <= targetSize || q <= minQuality) {
                  resolve(blob);
                } else {
                  // Reduce quality for next iteration
                  quality = Math.max(q - qualityStep, minQuality);
                  compressWithQuality(quality);
                }
              },
              file.type || 'image/jpeg',
              q
            );
          };

          compressWithQuality(quality);
        };
        img.onerror = () => {
          reject(new Error('无法加载图片'));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('无法读取文件'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate unique image filename with timestamp
   */
  private generateImageFilename(mimeType: string): string {
    const ext = mimeType.split('/')[1] || 'png';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.random().toString(36).slice(2, 7);
    return year + '-' + month + '-' + day + '_' + hours + '-' + minutes + '-' + seconds + '_' + random + '.' + ext;
  }

  /**
   * Upload image blob to GitHub REST API
   * Uses FileReader for safer conversion on mobile devices
   */
  private async uploadImageToGitHub(
    blob: Blob,
    filename: string,
    options: {
      token: string;
      owner: string;
      repo: string;
      branch: string;
      folder: string;
    }
  ): Promise<string> {
    // Use FileReader for safer base64 encoding (better for mobile)
    const base64Content = await this.blobToBase64(blob);
    
    const path = options.folder ? options.folder + '/' + filename : filename;
    const apiUrl = 'https://api.github.com/repos/' + options.owner + '/' + options.repo + '/contents/' + path;

    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': 'Bearer ' + options.token,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message: 'Add image: ' + filename,
          content: base64Content,
          branch: options.branch,
          committer: {
            name: 'GitHub Image Uploader Plugin',
            email: 'noreply@obsidian.local',
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error('GitHub API ' + response.status + ': ' + JSON.stringify(errData));
      }

      const data = await response.json();
      // Construct raw GitHub URL directly
      const rawUrl = 'https://raw.githubusercontent.com/' + 
        options.owner + '/' + 
        options.repo + '/' + 
        options.branch + '/' + 
        path;
      return rawUrl;
    } catch (error) {
      // Ensure memory is freed by clearing the base64 content
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Generate markdown image link with optional width parameter
   * Format: ![alt|width](url) for Obsidian syntax
   */
  private generateMarkdownImageLink(url: string, altText: string = 'image'): string {
    if (this.plugin.settings.enableImageWidth && this.plugin.settings.imageWidth > 0) {
      return '![' + altText + '|' + this.plugin.settings.imageWidth + '](' + url + ')';
    }
    return '![' + altText + '](' + url + ')';
  }

  /**
   * Convert Blob to base64 string safely using FileReader
   * This method is better for memory management, especially on mobile
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 part after the comma
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.onabort = () => {
        reject(new Error('File reading aborted'));
      };
      try {
        reader.readAsDataURL(blob);
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * Modal dialog for confirming image paste action
 */
class ImageConfirmModal extends Modal {
  action: 'github' | 'local' | 'compress' | null = null;

  constructor(
    app: App,
    private imageFile: File,
    private imageUrl: string,
    private onResolve: (action: 'github' | 'local' | 'compress' | null) => void,
    private isMobile: boolean = false,
    private showCompressOption: boolean = false,
    private compressAndUpload?: () => Promise<void>
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('image-confirm-modal');

    // Title
    const title = contentEl.createEl('h2', { text: '图片处理' });

    // Mobile warning
    if (this.isMobile) {
      const warning = contentEl.createEl('div', { cls: 'mobile-warning-header' });
      const warningIconEl = warning.createSpan({ cls: 'mobile-warning-icon' });
      setIcon(warningIconEl, 'alert-triangle');
      warning.appendText(' 移动设备上传提示');
      
      const warningContent = contentEl.createEl('div', { cls: 'mobile-warning-content' });
      warningContent.textContent = '请稍候，上传中勿离开此页面。如遇卡顿，请关闭此弹窗后重试。';
    }

    // Image preview
    const previewContainer = contentEl.createEl('div', { cls: 'image-preview-container' });
    const img = previewContainer.createEl('img');
    img.src = this.imageUrl;

    // File info
    const infoContainer = contentEl.createEl('div', { cls: 'image-info-container' });
    infoContainer.innerHTML = '<strong>文件名:</strong> ' + this.imageFile.name + '<br/>' +
      '<strong>文件大小:</strong> ' + (this.imageFile.size / 1024).toFixed(2) + ' KB';

    // Action description
    const desc = contentEl.createEl('p', { cls: 'image-action-description' });
    desc.textContent = '请选择处理方式：';

    // Button container
    const buttonContainer = contentEl.createEl('div', { cls: 'button-container' });

    // Local save button
    const localBtn = buttonContainer.createEl('button', { cls: 'image-confirm-btn image-confirm-btn-local' });
    setIcon(localBtn, 'hard-drive');
    localBtn.appendText(' 保存本地');
    localBtn.addEventListener('click', () => {
      this.action = 'local';
      this.close();
    });

    // GitHub upload button
    const githubBtn = buttonContainer.createEl('button', { cls: 'image-confirm-btn image-confirm-btn-github' });
    setIcon(githubBtn, 'upload');
    githubBtn.appendText(' 无损上传');
    githubBtn.addEventListener('click', () => {
      this.action = 'github';
      this.close();
    });

    // Compression button (if enabled and file is large)
    if (this.showCompressOption && this.compressAndUpload) {
      const compressBtn = buttonContainer.createEl('button', { cls: 'image-confirm-btn image-confirm-btn-compress' });
      setIcon(compressBtn, 'archive');
      compressBtn.appendText(' 压缩上传');
      const compressCallback = this.compressAndUpload;
      compressBtn.addEventListener('click', async () => {
        this.close();
        await compressCallback();
      });
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    // Trigger the callback with the user's choice
    this.onResolve(this.action);
  }
}

/**
 * Modal dialog for showing upload progress
 */
class UploadProgressModal extends Modal {
  private statusEl: HTMLElement | null = null;
  private progressBarEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private currentStatus: 'uploading' | 'success' | 'error' = 'uploading';

  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('upload-progress-modal');
    contentEl.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px;';

    // Title
    const title = contentEl.createEl('h2', { text: '上传图片' });
    title.style.marginTop = '0';
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';

    // Status container
    this.statusEl = contentEl.createEl('div');
    this.statusEl.style.cssText = 'text-align: center; margin-bottom: 20px; display: flex; flex-direction: column; align-items: center;';

    // Status icon and message
    const iconEl = this.statusEl.createEl('div', { cls: 'upload-status-icon' });
    iconEl.style.cssText = 'width: 48px; height: 48px; margin-bottom: 10px; color: var(--interactive-accent);';
    setIcon(iconEl, 'upload');

    this.messageEl = this.statusEl.createEl('p');
    this.messageEl.style.cssText = 'margin: 0; font-size: 1em; color: var(--text-normal); font-weight: 500;';
    this.messageEl.textContent = '正在上传到 GitHub...';

    // Progress bar container
    const progressContainer = contentEl.createEl('div');
    progressContainer.style.cssText = 'width: 100%; max-width: 300px; height: 8px; background: var(--background-secondary); border-radius: 4px; overflow: hidden; margin: 20px 0;';

    // Progress bar
    this.progressBarEl = progressContainer.createEl('div');
    this.progressBarEl.style.cssText = 'height: 100%; background: var(--interactive-accent); border-radius: 4px; transition: width 0.3s ease; width: 0%;';

    // Animate progress
    this.animateProgress();

    // Details text
    const detailsEl = contentEl.createEl('p');
    detailsEl.style.cssText = 'font-size: 0.85em; color: var(--text-muted); text-align: center; margin: 15px 0 0 0; max-width: 300px;';
    detailsEl.textContent = '这通常需要 5-30 秒，具体时间取决于网络连接';
  }

  updateStatus(message: string, status: 'uploading' | 'success' | 'error') {
    this.currentStatus = status;

    if (this.messageEl) {
      this.messageEl.textContent = message;
    }

    if (this.statusEl) {
      const iconEl = this.statusEl.querySelector('.upload-status-icon') as HTMLElement | null;
      if (iconEl) {
        iconEl.empty();
        if (status === 'uploading') {
          iconEl.style.color = 'var(--interactive-accent)';
          setIcon(iconEl, 'upload');
          iconEl.style.animation = 'none';
        } else if (status === 'success') {
          iconEl.style.color = 'var(--text-success)';
          setIcon(iconEl, 'check-circle');
          if (this.progressBarEl) {
            this.progressBarEl.style.width = '100%';
            this.progressBarEl.style.backgroundColor = 'var(--text-success)';
          }
        } else if (status === 'error') {
          iconEl.style.color = 'var(--text-error)';
          setIcon(iconEl, 'x-circle');
          if (this.progressBarEl) {
            this.progressBarEl.style.width = '100%';
            this.progressBarEl.style.backgroundColor = 'var(--text-error)';
          }
        }
      }
    }
  }

  private animateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      if (this.currentStatus === 'uploading') {
        progress += Math.random() * 30;
        if (progress > 90) {
          progress = 90;
        }
        if (this.progressBarEl) {
          this.progressBarEl.style.width = progress + '%';
        }
      } else {
        clearInterval(interval);
      }
    }, 500);
  }
}

/**
 * Image Gallery View - displays images in a side panel/window
 */
export const GALLERY_VIEW_TYPE = 'github-image-gallery-view';

export class GalleryView extends ItemView {
  private plugin: GitHubImageUploaderPlugin;
  private allImages: GalleryImage[] = [];
  private displayedImages: GalleryImage[] = [];
  private imagesPerPage = 10; // Changed from 30 to 10
  private currentPage = 0;
  private galleryGrid: HTMLElement | null = null;
  private loadMoreBtn: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: GitHubImageUploaderPlugin) {
    super(leaf);
    this.plugin = plugin;

    // 在 tab header 菜单中添加“刷新”按钮（兼容 Obsidian 1.4+，onHeaderMenu 只在 tab header ... 菜单中生效）
    this.onHeaderMenu = (menu: Menu) => {
      menu.addItem((item) => {
        item.setTitle('刷新')
          .setIcon('refresh-cw')
          .onClick(async () => {
            await this.refreshGallery();
            new Notice('已刷新');
          });
      });
    };

  }

  getViewType(): string {
    return GALLERY_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Github图片库';
  }

  getIcon(): string {
    return 'image';
  }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('gallery-view-container');

    const header = container.createEl('div', { cls: 'gallery-view-header' });
    const titleContainer = header.createEl('div', { cls: 'gallery-header-content' });
    titleContainer.createEl('h2', { text: 'Github图片库' });
    
    const refreshBtn = header.createEl('button', { cls: 'gallery-refresh-btn' });
    setIcon(refreshBtn, 'refresh-cw');
    refreshBtn.title = '刷新Github图片库';
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      try {
        await this.refreshGallery();
      } finally {
        refreshBtn.disabled = false;
      }
    });

    const loadingEl = container.createEl('div', { cls: 'gallery-loading', text: '加载中...' });

    try {
      this.allImages = await this.fetchImagesFromGitHub();
      loadingEl.remove();

      if (this.allImages.length === 0) {
        const emptyEl = container.createEl('div', { cls: 'gallery-empty' });
        const emptyIconEl = emptyEl.createSpan({ cls: 'gallery-empty-icon' });
        setIcon(emptyIconEl, 'inbox');
        emptyEl.appendText(' 还没有上传过图片');
        return;
      }

      const infoBar = container.createEl('div', { cls: 'gallery-info-bar' });
      infoBar.innerHTML = `<span>共 ${this.allImages.length} 张图片</span><span>总大小: ${this.formatBytes(this.getTotalSize())}</span>`;

      this.galleryGrid = container.createEl('div', { cls: 'gallery-grid' });
      this.loadMoreImages();

    } catch (error) {
      loadingEl.remove();
      const errorEl = container.createEl('div', { cls: 'gallery-error' });
      const msg = error instanceof Error ? error.message : String(error);
      errorEl.innerHTML = `<p>加载失败: ${msg}</p><p>请检查 GitHub 配置和网络连接</p>`;
    }
  }

  private async refreshGallery() {
    // Reset state and UI
    this.allImages = [];
    this.displayedImages = [];
    this.currentPage = 0;
    const container = this.containerEl.children[1] as HTMLElement;
    
    // Clear everything except header
    const header = container.querySelector('.gallery-view-header');
    container.empty();
    if (header) container.appendChild(header);

    const loadingEl = container.createEl('div', { cls: 'gallery-loading', text: '刷新中...' });

    try {
      this.allImages = await this.fetchImagesFromGitHub();
      loadingEl.remove();

      if (this.allImages.length === 0) {
        const emptyEl = container.createEl('div', { cls: 'gallery-empty' });
        const emptyIconEl = emptyEl.createSpan({ cls: 'gallery-empty-icon' });
        setIcon(emptyIconEl, 'inbox');
        emptyEl.appendText(' 还没有上传过图片');
        return;
      }

      const infoBar = container.createEl('div', { cls: 'gallery-info-bar' });
      infoBar.innerHTML = `<span>共 ${this.allImages.length} 张图片</span><span>总大小: ${this.formatBytes(this.getTotalSize())}</span>`;

      this.galleryGrid = container.createEl('div', { cls: 'gallery-grid' });
      this.loadMoreImages();
    } catch (error) {
      loadingEl.remove();
      const errorEl = container.createEl('div', { cls: 'gallery-error' });
      const msg = error instanceof Error ? error.message : String(error);
      errorEl.innerHTML = `<p>刷新失败: ${msg}</p>`;
    }
  }

  async onClose() {
    // Cleanup if needed
  }

  onHeaderMenu(menu: Menu) {
    menu.addItem((item) => {
      item
        .setTitle('刷新')
        .setIcon('refresh-cw')
        .onClick(async () => {
          await this.refreshGallery();
        });
    });

    menu.addItem((item) => {
      item
        .setTitle('强制刷新')
        .setIcon('zap')
        .onClick(async () => {
          const container = this.containerEl.children[1] as HTMLElement;
          container.empty();
          const loadingEl = container.createEl('div', { cls: 'gallery-loading' });
          loadingEl.textContent = '强制刷新中...';
          
          try {
            this.allImages = [];
            this.displayedImages = [];
            this.currentPage = 0;
            await this.onOpen();
            new Notice('强制刷新完成');
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            new Notice('强制刷新失败: ' + msg);
          }
        });
    });
  }

  private loadMoreImages() {
    if (!this.galleryGrid) return;

    // Remove existing button before adding new images
    if (this.loadMoreBtn) {
      this.loadMoreBtn.remove();
      this.loadMoreBtn = null;
    }

    const startIndex = this.currentPage * this.imagesPerPage;
    const endIndex = startIndex + this.imagesPerPage;
    const newImages = this.allImages.slice(startIndex, endIndex);

    this.displayedImages.push(...newImages);

    newImages.forEach(image => {
      this.createImageCard(image);
    });

    this.currentPage++;

    // If there are more images, create a new "Load More" button
    if (endIndex < this.allImages.length) {
      this.loadMoreBtn = this.galleryGrid.createEl('div', { cls: 'gallery-load-more-trigger' });
      const button = this.loadMoreBtn.createEl('button', { text: `加载更多 (${endIndex}/${this.allImages.length})`});
      button.addEventListener('click', () => {
        button.textContent = '加载中...';
        button.disabled = true;
        // Timeout to allow UI to update
        setTimeout(() => this.loadMoreImages(), 100);
      });
    }
  }
  
  private createImageCard(image: GalleryImage) {
      if (!this.galleryGrid) return;
      
      const card = this.galleryGrid!.createEl('div', { cls: 'gallery-card' });

      const imageContainer = card.createEl('div', { cls: 'gallery-image-container' });
      const img = imageContainer.createEl('img', { cls: 'gallery-image' });
      img.src = image.url;
      img.alt = image.name;
      img.addEventListener('click', () => this.openImageDetail(image));

      const infoSection = card.createEl('div', { cls: 'gallery-card-info' });
      const nameEl = infoSection.createEl('div', { cls: 'gallery-filename', text: image.name });
      nameEl.title = image.name;

      const detailsEl = infoSection.createEl('div', { cls: 'gallery-details' });
      detailsEl.innerHTML = `
        <div class="gallery-detail-row"><span class="detail-label">大小:</span><span class="detail-value">${this.formatBytes(image.size)}</span></div>
        <div class="gallery-detail-row"><span class="detail-label">上传:</span><span class="detail-value">${this.formatDate(image.date)}</span></div>
      `;

      const copyBtn = infoSection.createEl('button', { cls: 'gallery-copy-btn' });
      setIcon(copyBtn, 'clipboard');
      copyBtn.appendText(' 复制链接');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(image.url);
        new Notice('已复制到剪贴板');
      });
  }

  private async fetchImagesFromGitHub(): Promise<GalleryImage[]> {
    const { gitHubToken, gitHubOwner, gitHubRepo, imagePath, gitHubBranch } = this.plugin.settings;

    if (!gitHubToken || !gitHubOwner || !gitHubRepo) {
      throw new Error('GitHub 配置不完整');
    }

    const apiUrl = `https://api.github.com/repos/${gitHubOwner}/${gitHubRepo}/contents/${imagePath}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${gitHubToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        const errData = await response.json().catch(() => ({}));
        throw new Error(`GitHub API ${response.status}: ${JSON.stringify(errData)}`);
      }

      const data = await response.json();

      return Array.isArray(data)
        ? data
            .filter((file: any) => this.isImageFile(file.name))
            .map((file: any) => ({
              name: file.name,
              size: file.size,
              url: `https://raw.githubusercontent.com/${gitHubOwner}/${gitHubRepo}/${gitHubBranch}/${imagePath.replace(/\/$/, '')}/${file.name}`,
              date: new Date(file.created_at || file.updated_at || Date.now()),
            }))
            .sort((a, b) => b.date.getTime() - a.date.getTime())
        : [];
    } catch (error) {
      console.error("Error fetching images from GitHub:", error);
      throw error;
    }
  }

  private isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? imageExtensions.includes(ext) : false;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return date.toLocaleTimeString('zh-CN');
    if (diffDays < 365) return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    return date.toLocaleDateString('zh-CN');
  }

  private getTotalSize(): number {
    return this.allImages.reduce((sum, img) => sum + img.size, 0);
  }

  private openImageDetail(image: GalleryImage) {
    new ImageDetailModal(this.app, image, this.plugin, () => {
      // Refresh gallery after deletion
      this.refreshGallery();
    }).open();
  }
}

/**
 * Keep the old modal for backward compatibility, but it will show the view instead
 */
export class ImageGalleryModal extends Modal {
  action: 'github' | 'local' | 'compress' | null = null;

  constructor(
    app: App,
    private plugin: GitHubImageUploaderPlugin
  ) {
    super(app);
  }

  onOpen() {
    // This modal is deprecated - we now use GalleryView instead
    this.close();
    // Open gallery view in a new leaf
    this.plugin.app.workspace.getLeaf('split').setViewState({
      type: GALLERY_VIEW_TYPE,
      active: true,
    });
  }
}

/**
 * Detailed view modal for a single image
 */
class ImageDetailModal extends Modal {
  constructor(
    app: App,
    private image: GalleryImage,
    private plugin: GitHubImageUploaderPlugin,
    private onImageDeleted?: () => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    contentEl.addClass('image-detail-modal');
    modalEl.addClass('image-detail-overall-modal');

    // Directly set the modal width to override Obsidian's defaults
    modalEl.style.width = '800px';
    modalEl.style.maxWidth = '95vw';
    // Removed height adjustment. Modal height will now revert to Obsidian's default behavior.

    // Original custom close button removed. Rely on native Obsidian close button.

    // Image display (top section)
    const imageContainer = contentEl.createEl('div', { cls: 'image-detail-container' });
    const img = imageContainer.createEl('img', { cls: 'image-detail-img' });
    img.src = this.image.url;
    img.alt = this.image.name;

    // Info panel (bottom section)
    const infoPanel = contentEl.createEl('div', { cls: 'image-detail-info' });

    // Filename
    const nameEl = infoPanel.createEl('h3', { text: this.image.name });

    // Details
    const detailsList = infoPanel.createEl('div', { cls: 'image-detail-list' });

    const detailRow1 = detailsList.createEl('div', { cls: 'detail-row' });
    detailRow1.innerHTML = `<span class="detail-label">大小:</span><span class="detail-value">${this.formatBytes(this.image.size)}</span>`;

    const detailRow2 = detailsList.createEl('div', { cls: 'detail-row' });
    detailRow2.innerHTML = `<span class="detail-label">上传:</span><span class="detail-value">${this.image.date.toLocaleString('zh-CN')}</span>`;

    // Action buttons
    const buttonGroup = infoPanel.createEl('div', { cls: 'image-detail-actions' });

    const copyBtn = buttonGroup.createEl('button', { cls: 'action-btn copy-btn' });
    setIcon(copyBtn, 'clipboard');
    copyBtn.appendText(' 链接');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(this.image.url);
      copyBtn.empty();
      setIcon(copyBtn, 'check');
      copyBtn.appendText(' 已复制');
      setTimeout(() => {
        copyBtn.empty();
        setIcon(copyBtn, 'clipboard');
        copyBtn.appendText(' 链接');
      }, 2000);
    });

    const copyMarkdownBtn = buttonGroup.createEl('button', { cls: 'action-btn markdown-btn' });
    setIcon(copyMarkdownBtn, 'file-text');
    copyMarkdownBtn.appendText(' MD');
    copyMarkdownBtn.addEventListener('click', () => {
      const markdown = `![image](${this.image.url})`;
      navigator.clipboard.writeText(markdown);
      copyMarkdownBtn.empty();
      setIcon(copyMarkdownBtn, 'check');
      copyMarkdownBtn.appendText(' 已复制');
      setTimeout(() => {
        copyMarkdownBtn.empty();
        setIcon(copyMarkdownBtn, 'file-text');
        copyMarkdownBtn.appendText(' MD');
      }, 2000);
    });

    const openBtn = buttonGroup.createEl('button', { cls: 'action-btn open-btn' });
    setIcon(openBtn, 'external-link');
    openBtn.appendText(' 打开');
    openBtn.addEventListener('click', () => {
      window.open(this.image.url, '_blank');
    });

    const deleteBtn = buttonGroup.createEl('button', { cls: 'action-btn delete-btn' });
    setIcon(deleteBtn, 'trash-2');
    deleteBtn.appendText(' 删除');
    deleteBtn.addEventListener('click', async () => {
      const confirmMessage = '确定删除此图片？';
      if (confirm(confirmMessage)) {
        try {
          deleteBtn.disabled = true;
          deleteBtn.textContent = '删中...';
          await this.deleteImage();
          new Notice('删除成功');
          // Call the callback to update cache
          if (this.onImageDeleted) {
            this.onImageDeleted();
          }
          this.close();
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          new Notice('删除失败: ' + msg);
          deleteBtn.disabled = false;
          deleteBtn.empty();
          setIcon(deleteBtn, 'trash-2');
          deleteBtn.appendText(' 删除');
        }
      }
    });
  }

  private async deleteImage(): Promise<void> {
    const { gitHubToken, gitHubOwner, gitHubRepo, imagePath, gitHubBranch } = this.plugin.settings;

    if (!gitHubToken || !gitHubOwner || !gitHubRepo) {
      throw new Error('GitHub 配置不完整');
    }

    // Get current file SHA (needed for deletion)
    const apiUrl = `https://api.github.com/repos/${gitHubOwner}/${gitHubRepo}/contents/${imagePath}/${this.image.name}`;

    try {
      // First get the file info to get its SHA
      const getResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${gitHubToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!getResponse.ok) {
        throw new Error(`获取文件信息失败: ${getResponse.status}`);
      }

      const fileData = await getResponse.json();
      const sha = fileData.sha;

      // Now delete the file
      const deleteResponse = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${gitHubToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message: `Delete image: ${this.image.name}`,
          sha: sha,
          branch: gitHubBranch,
          committer: {
            name: 'GitHub Image Uploader Plugin',
            email: 'noreply@obsidian.local',
          },
        }),
      });

      if (!deleteResponse.ok) {
        const errData = await deleteResponse.json().catch(() => ({}));
        throw new Error(`GitHub API ${deleteResponse.status}: ${JSON.stringify(errData)}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

