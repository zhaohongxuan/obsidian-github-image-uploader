import { App, Modal, Notice, setIcon, TFile } from 'obsidian';
import type GitHubImageUploaderPlugin from '../main';
import type { LocalImage, ImageSearch } from './index';
import type { ReferenceMatch, ReplaceResult } from './index';

/**
 * Modal for viewing local image details with actions:
 * - View file info
 * - Find referencing notes
 * - Delete from vault
 * - Upload to GitHub and replace references
 */
export class LocalImageDetailModal extends Modal {
  constructor(
    app: App,
    private image: LocalImage,
    private plugin: GitHubImageUploaderPlugin,
    private imageSearch: ImageSearch,
    private onImageDeleted?: () => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    contentEl.addClass('local-image-detail-modal');
    modalEl.addClass('local-image-detail-overall-modal');

    modalEl.style.width = '800px';
    modalEl.style.maxWidth = '95vw';

    // Image display
    const imageContainer = contentEl.createEl('div', { cls: 'local-image-detail-container' });
    const img = imageContainer.createEl('img', { cls: 'local-image-detail-img' });
    img.src = this.app.vault.getResourcePath(this.image.file);
    img.alt = this.image.name;

    // Info panel
    const infoPanel = contentEl.createEl('div', { cls: 'local-image-detail-info' });
    const infoBody = infoPanel.createEl('div', { cls: 'local-image-detail-body' });

    // Filename
    infoBody.createEl('h3', { text: this.image.name });

    // Details
    const detailsList = infoBody.createEl('div', { cls: 'local-image-detail-list' });

    const detailRow1 = detailsList.createEl('div', { cls: 'detail-row' });
    detailRow1.innerHTML = `<span class="detail-label">大小:</span><span class="detail-value">${this.formatBytes(this.image.size)}</span>`;

    const detailRow2 = detailsList.createEl('div', { cls: 'detail-row' });
    detailRow2.innerHTML = `<span class="detail-label">路径:</span><span class="detail-value">${this.image.path}</span>`;

    const detailRow3 = detailsList.createEl('div', { cls: 'detail-row' });
    detailRow3.innerHTML = `<span class="detail-label">修改:</span><span class="detail-value">${this.image.mtime.toLocaleString('zh-CN')}</span>`;

    // Reference notes section
    this.renderReferenceNotesSection(infoBody);

    // Action buttons
    const buttonGroup = infoPanel.createEl('div', { cls: 'local-image-detail-actions' });

    // Copy path button
    const copyPathBtn = buttonGroup.createEl('button', { cls: 'action-btn local-image-detail-copy-path-btn' });
    setIcon(copyPathBtn, 'clipboard');
    copyPathBtn.appendText(' 复制路径');
    copyPathBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(this.image.path);
      copyPathBtn.empty();
      setIcon(copyPathBtn, 'check');
      copyPathBtn.appendText(' 已复制');
      setTimeout(() => {
        copyPathBtn.empty();
        setIcon(copyPathBtn, 'clipboard');
        copyPathBtn.appendText(' 复制路径');
      }, 2000);
    });

    // Delete button
    const deleteBtn = buttonGroup.createEl('button', { cls: 'action-btn local-image-detail-delete-btn' });
    setIcon(deleteBtn, 'trash');
    deleteBtn.appendText(' 删除');
    deleteBtn.addEventListener('click', async () => {
      if (confirm('确定要删除这张图片吗？此操作不可恢复。')) {
        try {
          await this.app.vault.delete(this.image.file);
          new Notice('图片已删除');
          this.close();
          this.onImageDeleted?.();
        } catch (error) {
          new Notice('删除失败: ' + (error instanceof Error ? error.message : String(error)));
        }
      }
    });

    // Upload to GitHub button
    const uploadBtn = buttonGroup.createEl('button', { cls: 'action-btn local-image-detail-upload-btn' });
    setIcon(uploadBtn, 'upload');
    uploadBtn.appendText(' 上传到 GitHub');
    uploadBtn.addEventListener('click', async () => {
      await this.handleUploadAndReplace();
    });
  }

  private renderReferenceNotesSection(container: HTMLElement) {
    const section = container.createEl('div', { cls: 'local-image-reference-section' });
    const header = section.createEl('div', { cls: 'local-image-reference-header' });
    header.createEl('div', { cls: 'local-image-reference-title', text: '引用此图片的笔记' });

    const countEl = header.createEl('div', {
      cls: 'local-image-reference-count',
      text: '搜索中...',
    });

    const listEl = section.createEl('div', { cls: 'local-image-reference-list' });
    listEl.createEl('div', {
      cls: 'local-image-reference-loading',
      text: '正在查找引用此图片的笔记...',
    });

    void this.populateReferenceNotes(listEl, countEl);
  }

  private async populateReferenceNotes(listEl: HTMLElement, countEl: HTMLElement) {
    try {
      const references = await this.imageSearch.findReferencingNotes(this.image.path);
      listEl.empty();

      if (references.length === 0) {
        countEl.textContent = '0 篇';
        listEl.createEl('div', {
          cls: 'local-image-reference-empty',
          text: '还没有笔记引用这张图片',
        });
        return;
      }

      countEl.textContent = `${references.length} 篇`;

      references.forEach((reference) => {
        const item = listEl.createEl('button', { cls: 'local-image-reference-item' });
        item.type = 'button';

        const itemHeader = item.createEl('div', { cls: 'local-image-reference-item-header' });
        const iconEl = itemHeader.createSpan({ cls: 'local-image-reference-item-icon' });
        setIcon(iconEl, 'file-text');
        itemHeader.createEl('span', {
          cls: 'local-image-reference-name',
          text: reference.file.basename,
        });

        item.createEl('div', {
          cls: 'local-image-reference-path',
          text: reference.file.path,
        });

        item.createEl('div', {
          cls: 'local-image-reference-meta',
          text: `引用 ${reference.matchCount} 次`,
        });

        item.addEventListener('click', async () => {
          const leaf = this.app.workspace.getLeaf(false);
          await leaf.openFile(reference.file);
          this.close();
        });
      });
    } catch (error) {
      listEl.empty();
      countEl.textContent = '读取失败';
      const msg = error instanceof Error ? error.message : String(error);
      listEl.createEl('div', {
        cls: 'local-image-reference-error',
        text: '引用笔记读取失败: ' + msg,
      });
    }
  }

  private async handleUploadAndReplace() {
    const { gitHubToken, gitHubOwner, gitHubRepo, imagePath, gitHubBranch } = this.plugin.settings;

    if (!gitHubToken || !gitHubOwner || !gitHubRepo) {
      new Notice('GitHub 配置不完整，请先在设置中配置');
      return;
    }

    // Find referencing notes first
    const references = await this.imageSearch.findReferencingNotes(this.image.path);

    const confirmMsg = references.length > 0
      ? `将上传图片到 GitHub 并替换 ${references.length} 篇笔记中的引用链接。是否继续？`
      : '将上传图片到 GitHub。是否继续？';

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      // Read local file binary
      const binary = await this.app.vault.readBinary(this.image.file);
      const mimeType = this.getMimeType(this.image.name);
      const blob = new Blob([binary], { type: mimeType });

      // Generate filename with date/time prefix
      const filename = this.generateImageFilename(mimeType);

      // Upload to GitHub
      const githubUrl = await this.uploadToGitHub(blob, filename);

      // Replace references in notes with markdown format
      if (references.length > 0) {
        const result = await this.replaceReferencesWithMarkdown(
          this.image.path,
          githubUrl,
          references.map(r => r.file)
        );

        let message = `上传成功！`;
        if (result.success > 0) {
          message += ` 已替换 ${result.success} 篇笔记`;
        }
        if (result.failed > 0) {
          message += `，替换失败 ${result.failed} 篇`;
        }
        new Notice(message);
      } else {
        new Notice('上传成功！');
      }

      // Copy the markdown link
      const markdownLink = this.generateMarkdownImageLink(githubUrl);
      navigator.clipboard.writeText(markdownLink);
      new Notice('Markdown 链接已复制到剪贴板');
      new Notice('GitHub URL 已复制到剪贴板');

      this.close();

      // Optionally delete local file after successful upload and replace
      if (references.length > 0 && confirm('是否删除本地图片文件？')) {
        await this.app.vault.delete(this.image.file);
        this.onImageDeleted?.();
      }

    } catch (error) {
      new Notice('上传失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  private async uploadToGitHub(blob: Blob, filename: string): Promise<string> {
    const { gitHubToken, gitHubOwner, gitHubRepo, imagePath, gitHubBranch } = this.plugin.settings;

    // Convert blob to base64
    const base64Content = await this.blobToBase64(blob);

    const folder = imagePath.replace(/^\/+|\/+$/g, '');
    const path = folder ? folder + '/' + filename : filename;
    const apiUrl = 'https://api.github.com/repos/' + gitHubOwner + '/' + gitHubRepo + '/contents/' + path;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + gitHubToken,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: 'Add image: ' + filename,
        content: base64Content,
        branch: gitHubBranch,
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

    // Construct raw GitHub URL
    return 'https://raw.githubusercontent.com/' + gitHubOwner + '/' + gitHubRepo + '/' + gitHubBranch + '/' + path;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
    };
    return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
  }

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

  private generateMarkdownImageLink(url: string, altText: string = 'image'): string {
    if (this.plugin.settings.enableImageWidth && this.plugin.settings.imageWidth > 0) {
      return `![${altText}|${this.plugin.settings.imageWidth}](${url})`;
    }
    return `![${altText}](${url})`;
  }

  private async replaceReferencesWithMarkdown(
    localPath: string,
    githubUrl: string,
    files: TFile[]
  ): Promise<{ success: number; failed: number; failedFiles: Array<{ file: TFile; error: string }> }> {
    const result = { success: 0, failed: 0, failedFiles: [] as Array<{ file: TFile; error: string }> };
    const targets = this.generateSearchTargets(localPath);
    const markdownLink = this.generateMarkdownImageLink(githubUrl);

    for (const file of files) {
      try {
        let content = await this.app.vault.read(file);
        let modified = false;

        for (const target of targets) {
          if (!target) continue;

          // Try exact match
          if (content.includes(target)) {
            // Replace local image path with markdown link
            content = content.split(target).join(markdownLink);
            modified = true;
            continue;
          }

          // Try case-insensitive match
          const lowerContent = content.toLowerCase();
          const lowerTarget = target.toLowerCase();
          if (lowerContent.includes(lowerTarget)) {
            const regex = new RegExp(this.escapeRegExp(target), 'gi');
            content = content.replace(regex, markdownLink);
            modified = true;
          }
        }

        if (modified) {
          await this.app.vault.modify(file, content);
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.failedFiles.push({
          file,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  private generateSearchTargets(localPath: string): string[] {
    const targets = new Set<string>();

    // Direct path
    targets.add(localPath);

    // With ./ prefix
    if (!localPath.startsWith('./')) {
      targets.add('./' + localPath);
    }

    // URL encoded variants
    targets.add(encodeURI(localPath));
    targets.add(encodeURIComponent(localPath));

    // With ./ prefix and URL encoded
    if (!localPath.startsWith('./')) {
      targets.add('./' + encodeURI(localPath));
      targets.add('./' + encodeURIComponent(localPath));
    }

    // Also search by just the filename
    const filename = localPath.split('/').pop() || localPath;
    targets.add(filename);

    return Array.from(targets).filter(Boolean);
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
