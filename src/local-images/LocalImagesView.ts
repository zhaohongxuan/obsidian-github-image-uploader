import { ItemView, Menu, Notice, setIcon, WorkspaceLeaf } from 'obsidian';
import type GitHubImageUploaderPlugin from '../main';
import type { LocalImage } from './index';
import { ImageSearch } from './ImageSearch';
import { LocalImageDetailModal } from './LocalImageDetailModal';

export const LOCAL_IMAGES_VIEW_TYPE = 'github-local-images-view';

/**
 * View for displaying and managing local vault images
 */
export class LocalImagesView extends ItemView {
  private plugin: GitHubImageUploaderPlugin;
  private allImages: LocalImage[] = [];
  private groupCounts = new Map<string, number>();
  private imageSearch: ImageSearch;

  constructor(leaf: WorkspaceLeaf, plugin: GitHubImageUploaderPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.imageSearch = new ImageSearch(this.app);
  }

  onHeaderMenu(menu: Menu): void {
    menu.addItem((item) => {
      item.setTitle('刷新')
        .setIcon('refresh-cw')
        .onClick(async () => {
          await this.refreshGallery();
          new Notice('已刷新');
        });
    });
  }

  getViewType(): string {
    return LOCAL_IMAGES_VIEW_TYPE;
  }

  getDisplayText(): string {
    return '本地图片库';
  }

  getIcon(): string {
    return 'image';
  }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('gallery-view-container');
    container.addClass('local-images-view-container');

    const header = container.createEl('div', { cls: 'gallery-view-header' });
    const titleContainer = header.createEl('div', { cls: 'gallery-header-content' });
    titleContainer.createEl('span', { text: '' });

    // Stats container
    const statsContainer = titleContainer.createEl('div', { cls: 'gallery-header-stats' });

    // Button container
    const buttonContainer = header.createEl('div', { cls: 'gallery-header-buttons' });

    const refreshBtn = buttonContainer.createEl('button', { cls: 'gallery-refresh-btn' });
    setIcon(refreshBtn, 'refresh-cw');
    refreshBtn.title = '刷新本地图片库';
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
      this.allImages = await this.discoverLocalImages();
      this.groupCounts = this.buildGroupCounts(this.allImages);
      loadingEl.remove();

      if (this.allImages.length === 0) {
        const emptyEl = container.createEl('div', { cls: 'gallery-empty' });
        const emptyIconEl = emptyEl.createSpan({ cls: 'gallery-empty-icon' });
        setIcon(emptyIconEl, 'inbox');
        emptyEl.appendText(' 还没有本地图片');
        return;
      }

      // Update stats
      statsContainer.innerHTML = '';
      statsContainer.createEl('span', { text: `共 ${this.allImages.length} 张图片` });

      // Create grid and display all images
      const grid = container.createEl('div', { cls: 'gallery-grid' });
      this.renderImages(grid);

    } catch (error) {
      loadingEl.remove();
      const errorEl = container.createEl('div', { cls: 'gallery-error' });
      errorEl.textContent = '加载失败: ' + (error instanceof Error ? error.message : String(error));
    }
  }

  async refreshGallery() {
    this.allImages = await this.discoverLocalImages();
    this.groupCounts = this.buildGroupCounts(this.allImages);

    const container = this.containerEl.children[1] as HTMLElement;
    const existingGrid = container.querySelector('.gallery-grid');
    if (existingGrid) {
      existingGrid.remove();
    }

    const statsContainer = container.querySelector('.gallery-header-stats');
    if (statsContainer) {
      statsContainer.innerHTML = '';
      statsContainer.createEl('span', { text: `共 ${this.allImages.length} 张图片` });
    }

    if (this.allImages.length === 0) {
      const existingEmpty = container.querySelector('.gallery-empty');
      if (!existingEmpty) {
        const emptyEl = container.createEl('div', { cls: 'gallery-empty' });
        const emptyIconEl = emptyEl.createSpan({ cls: 'gallery-empty-icon' });
        setIcon(emptyIconEl, 'inbox');
        emptyEl.appendText(' 还没有本地图片');
      }
      return;
    }

    const grid = container.createEl('div', { cls: 'gallery-grid' });
    this.renderImages(grid);
  }

  private renderImages(grid: HTMLElement) {
    let currentGroup = '';
    const firstImage = this.allImages[0];
    if (firstImage) {
      currentGroup = this.getTimeGroupLabel(firstImage.mtime);
      this.createGroupHeader(grid, currentGroup);
    }

    for (const image of this.allImages) {
      const group = this.getTimeGroupLabel(image.mtime);
      if (group !== currentGroup) {
        currentGroup = group;
        this.createGroupHeader(grid, currentGroup);
      }
      this.createImageCard(grid, image);
    }
  }

  private async discoverLocalImages(): Promise<LocalImage[]> {
    const { localFolder } = this.plugin.settings;
    const files = this.app.vault.getFiles();

    const localImages: LocalImage[] = [];

    for (const file of files) {
      if (this.isLocalImage(file, localFolder)) {
        localImages.push({
          name: file.name,
          path: file.path,
          size: file.stat.size,
          mtime: new Date(file.stat.mtime),
          file,
        });
      }
    }

    // Sort by modification time, newest first
    return localImages.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  }

  private isLocalImage(file: { name: string; path: string }, localFolder: string): boolean {
    // Case-insensitive comparison for local folder matching
    const normalizedPath = file.path.toLowerCase();
    const normalizedFolder = localFolder.toLowerCase();

    // Check if file is in the local folder (handles subdirectories)
    if (!normalizedPath.startsWith(normalizedFolder + '/')) {
      return false;
    }

    // Check if it's an image file
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? imageExtensions.includes(ext) : false;
  }

  private createImageCard(grid: HTMLElement, image: LocalImage) {
    const card = grid.createEl('div', { cls: 'gallery-card' });

    const imageContainer = card.createEl('div', { cls: 'gallery-image-container' });
    const img = imageContainer.createEl('img', { cls: 'gallery-image' });

    // Use Obsidian's resource path for local file preview
    img.src = this.app.vault.getResourcePath(image.file);
    img.alt = image.name;
    img.title = image.name;
    img.addEventListener('click', () => this.openImageDetail(image));
  }

  private createGroupHeader(grid: HTMLElement, groupLabel: string) {
    const header = grid.createEl('div', { cls: 'gallery-group-header' });
    header.createEl('span', { cls: 'gallery-group-title', text: groupLabel });
    header.createEl('span', {
      cls: 'gallery-group-meta',
      text: `${this.groupCounts.get(groupLabel) ?? 0} 张`,
    });
  }

  private getTimeGroupLabel(date: Date): string {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfSevenDays = new Date(startOfToday);
    startOfSevenDays.setDate(startOfSevenDays.getDate() - 7);
    const startOfThirtyDays = new Date(startOfToday);
    startOfThirtyDays.setDate(startOfThirtyDays.getDate() - 30);

    if (date >= startOfToday) return '今天';
    if (date >= startOfSevenDays) return '近7天';
    if (date >= startOfThirtyDays) return '近30天';
    return '更早';
  }

  private buildGroupCounts(images: LocalImage[]): Map<string, number> {
    return images.reduce((groups, image) => {
      const groupLabel = this.getTimeGroupLabel(image.mtime);
      groups.set(groupLabel, (groups.get(groupLabel) ?? 0) + 1);
      return groups;
    }, new Map<string, number>());
  }

  private openImageDetail(image: LocalImage) {
    new LocalImageDetailModal(this.app, image, this.plugin, this.imageSearch, () => {
      // Refresh after deletion
      this.refreshGallery();
    }).open();
  }
}
