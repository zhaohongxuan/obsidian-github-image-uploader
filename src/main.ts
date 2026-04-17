import {
  App,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  setIcon,
} from 'obsidian';
import { GitHubImageHosting, ImageGalleryModal, GALLERY_VIEW_TYPE, GalleryView } from './github-image';
import { ReplacementLogModal } from './local-images';

// ── Types & defaults ────────────────────────────────────────────────────────

interface GitHubImageUploaderSettings {
  /** GitHub image hosting enabled */
  enableImageHosting: boolean;
  /** GitHub personal access token */
  gitHubToken: string;
  /** GitHub repository owner */
  gitHubOwner: string;
  /** GitHub repository name */
  gitHubRepo: string;
  /** Path in repo to store images */
  imagePath: string;
  /** GitHub branch to upload to */
  gitHubBranch: string;
  /** Local folder to save images when not uploading to GitHub */
  localFolder: string;
  /** Enable image compression */
  enableImageCompression: boolean;
  /** Image size threshold for compression (in MB) */
  compressionThreshold: number;
  /** Target compressed size (in KB) */
  targetCompressedSize: number;
  /** Initial JPEG quality (0.1 - 1.0) */
  compressionQuality: number;
  /** Compression quality step for iteration (0.01 - 0.1) */
  compressionQualityStep: number;
  /** Enable image width specification in markdown */
  enableImageWidth: boolean;
  /** Default image width in pixels (0 means auto/no width specified) */
  imageWidth: number;
  /** Enable replacement log to track local->remote image replacements */
  enableReplacementLog: boolean;
}

const DEFAULT_SETTINGS: GitHubImageUploaderSettings = {
  enableImageHosting: true,
  gitHubToken: '',
  gitHubOwner: '',
  gitHubRepo: '',
  imagePath: 'assets/images',
  gitHubBranch: 'main',
  localFolder: 'assets',
  enableImageCompression: false,
  compressionThreshold: 1,
  targetCompressedSize: 500,
  compressionQuality: 0.85,
  compressionQualityStep: 0.05,
  enableImageWidth: true,
  imageWidth: 300,
  enableReplacementLog: true,
};

// ── Plugin ──────────────────────────────────────────────────────────────────

export interface ReplacementLogEntry {
  localPath: string;
  remoteUrl: string;
  timestamp: Date;
  affectedNotes: Array<{
    path: string;
    basename: string;
  }>;
  success: boolean;
  error?: string;
}

export default class GitHubImageUploaderPlugin extends Plugin {
  settings!: GitHubImageUploaderSettings;
  replacementLogs: ReplacementLogEntry[] = [];

  async onload() {
    await this.loadSettings();
    await this.loadReplacementLogs();
    this.addSettingTab(new GitHubImageUploaderSettingTab(this.app, this));

    // Register gallery view
    this.registerView(GALLERY_VIEW_TYPE, (leaf) => new GalleryView(leaf, this));

    // Register GitHub image hosting
    const imageHosting = new GitHubImageHosting(this, this.app);
    imageHosting.register();

    // Add ribbon icon to open image gallery
    this.addRibbonIcon('image', '打开图片库', () => {
      this.app.workspace.getLeaf('split').setViewState({
        type: GALLERY_VIEW_TYPE,
        active: true,
      });
    });

    // Add command to open image gallery
    this.addCommand({
      id: 'github-image-uploader-gallery',
      name: '打开图片库',
      callback: () => {
        this.app.workspace.getLeaf('split').setViewState({
          type: GALLERY_VIEW_TYPE,
          active: true,
        });
      },
    });

    // Add command to view replacement logs
    this.addCommand({
      id: 'github-image-uploader-replacement-log',
      name: '查看替换日志',
      callback: () => {
        const logModal = new ReplacementLogModal(this.app, this.replacementLogs);
        logModal.open();
      },
    });

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu) => {
        menu.addItem((item) => {
          item
            .setTitle('刷新')
            .setIcon('refresh-cw')
            .onClick(async () => {
                const leaf = this.app.workspace.activeLeaf;
                if (leaf) {
                    const currentViewState = leaf.getViewState();
                    await leaf.setViewState(currentViewState, false);
                    new Notice('已刷新');
                }
            });
        });
      })
    );

    console.log('GitHub Image Uploader plugin loaded');
  }

  onunload() {
    console.log('GitHub Image Uploader plugin unloaded');
  }

  async loadReplacementLogs() {
    const data = await this.loadData();
    if (data?.replacementLogs) {
      this.replacementLogs = data.replacementLogs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    }
  }

  async saveReplacementLogs() {
    const data = await this.loadData();
    await this.saveData({
      ...data,
      replacementLogs: this.replacementLogs,
    });
  }

  addReplacementLog(log: ReplacementLogEntry) {
    this.replacementLogs.unshift(log);
    // Keep only last 100 entries
    if (this.replacementLogs.length > 100) {
      this.replacementLogs = this.replacementLogs.slice(0, 100);
    }
    void this.saveReplacementLogs();
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData(),
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// ── Settings tab ────────────────────────────────────────────────────────────

class GitHubImageUploaderSettingTab extends PluginSettingTab {
  plugin: GitHubImageUploaderPlugin;

  constructor(app: App, plugin: GitHubImageUploaderPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'GitHub Image Uploader' });

    // ── Main Toggle ────────────────────────────────────────────────────────
    const basicSettingsH3 = containerEl.createEl('h3');
    setIcon(basicSettingsH3, 'image');
    basicSettingsH3.appendText(' 基本设置');

    new Setting(containerEl)
      .setName('启用 GitHub 图床')
      .setDesc('粘贴图片时自动弹出上传选项')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.enableImageHosting)
          .onChange(async value => {
            this.plugin.settings.enableImageHosting = value;
            await this.plugin.saveSettings();
            this.display(); // 重新渲染设置页面
          }),
      );

    // 只有启用 GitHub 图床时才显示以下选项
    if (this.plugin.settings.enableImageHosting) {
      // ── GitHub Configuration ────────────────────────────────────────────────
      const githubConfigH3 = containerEl.createEl('h3');
      setIcon(githubConfigH3, 'lock');
      githubConfigH3.appendText(' GitHub 配置');

      new Setting(containerEl)
        .setName('GitHub Token')
        .setDesc((() => {
          const frag = document.createDocumentFragment();
          frag.appendText('Personal Access Token（需要 Contents 的 Read & Write 权限）。');
          frag.appendChild(document.createElement('br'));
          const link = document.createElement('a');
          link.href = 'https://github.com/settings/personal-access-tokens/new';
          link.textContent = '→ 点击这里生成 Fine-grained Token';
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          frag.appendChild(link);
          return frag;
        })())
        .addText(text => {
          text
            .setPlaceholder('ghp_xxxxxxxxxxxxx')
            .setValue(this.plugin.settings.gitHubToken)
            .onChange(async value => {
              this.plugin.settings.gitHubToken = value;
              await this.plugin.saveSettings();
            });
          text.inputEl.type = 'password';
        });

      new Setting(containerEl)
        .setName('GitHub 用户名')
        .setDesc('仓库所有者的 GitHub 用户名')
        .addText(text =>
          text
            .setPlaceholder('username')
            .setValue(this.plugin.settings.gitHubOwner)
            .onChange(async value => {
              this.plugin.settings.gitHubOwner = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName('仓库名称')
        .setDesc('用于存储图片的 GitHub 仓库名')
        .addText(text =>
          text
            .setPlaceholder('my-repo')
            .setValue(this.plugin.settings.gitHubRepo)
            .onChange(async value => {
              this.plugin.settings.gitHubRepo = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName('图片存储目录')
        .setDesc('仓库中存储图片的目录路径（相对于仓库根目录）')
        .addText(text =>
          text
            .setPlaceholder('assets/images')
            .setValue(this.plugin.settings.imagePath)
            .onChange(async value => {
              this.plugin.settings.imagePath = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName('目标分支')
        .setDesc('上传到的 GitHub 分支')
        .addText(text =>
          text
            .setPlaceholder('main')
            .setValue(this.plugin.settings.gitHubBranch)
            .onChange(async value => {
              this.plugin.settings.gitHubBranch = value;
              await this.plugin.saveSettings();
            }),
        );

      // ── Image Display ──────────────────────────────────────────────────────
      const imageDisplayH3 = containerEl.createEl('h3');
      setIcon(imageDisplayH3, 'image');
      imageDisplayH3.appendText(' 图片显示');

      new Setting(containerEl)
        .setName('启用图片宽度设置')
        .setDesc('插入图片时自动指定宽度，使用 Obsidian 的图片缩放语法（![image|宽度](url)）')
        .addToggle(toggle =>
          toggle
            .setValue(this.plugin.settings.enableImageWidth)
            .onChange(async value => {
              this.plugin.settings.enableImageWidth = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName('默认图片宽度（像素）')
        .setDesc('插入图片时的默认宽度。设置为 0 则不指定宽度')
        .addSlider(slider =>
          slider
            .setLimits(0, 800, 50)
            .setValue(this.plugin.settings.imageWidth)
            .setDynamicTooltip()
            .onChange(async value => {
              this.plugin.settings.imageWidth = value;
              await this.plugin.saveSettings();
            }),
        );

      // Info box for Obsidian image syntax
      const imageWidthInfo = containerEl.createDiv();
      imageWidthInfo.style.cssText = 'background: var(--background-secondary); padding: 12px; border-radius: 6px; margin: 10px 0; font-size: 0.9em;';
      imageWidthInfo.innerHTML = '<strong>Obsidian 图片语法：</strong><br/>' +
        '• <code>![image|300](url)</code> - 指定宽度 300px<br/>' +
        '• <code>![image|300x200](url)</code> - 指定宽度 300px 和高度 200px<br/>' +
        '• <code>![image](url)</code> - 不指定尺寸，使用原始大小<br/>' +
        '<br/><strong>建议：</strong>通常只需指定宽度，高度会按比例自动调整';

      // ── Replacement Log ────────────────────────────────────────────────────
      const replacementLogH3 = containerEl.createEl('h3');
      setIcon(replacementLogH3, 'clipboard-list');
      replacementLogH3.appendText(' 替换日志');

      new Setting(containerEl)
        .setName('启用替换日志')
        .setDesc('上传本地图片到 GitHub 并替换笔记链接时，记录替换日志')
        .addToggle(toggle =>
          toggle
            .setValue(this.plugin.settings.enableReplacementLog)
            .onChange(async value => {
              this.plugin.settings.enableReplacementLog = value;
              await this.plugin.saveSettings();
            }),
        );

      // Recent replacement logs (show last 10)
      const recentLogsContainer = containerEl.createDiv();
      recentLogsContainer.style.cssText = 'margin-top: 12px;';

      const recentLogsHeader = recentLogsContainer.createEl('div', {
        cls: 'recent-logs-header',
        text: '最近替换记录',
      });
      recentLogsHeader.style.cssText = 'font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--text-muted);';

      const recentLogsList = recentLogsContainer.createEl('div', { cls: 'recent-logs-list' });
      recentLogsList.style.cssText = 'background: var(--background-secondary); border-radius: 6px; padding: 8px; max-height: 300px; overflow-y: auto;';

      const logs = this.plugin.replacementLogs.slice(0, 10);

      if (logs.length === 0) {
        recentLogsList.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 12px;">暂无替换记录</div>';
      } else {
        for (const log of logs) {
          const logItem = recentLogsList.createEl('div', { cls: 'recent-log-item' });
          logItem.style.cssText = 'padding: 8px 0; border-bottom: 1px solid var(--background-modifier-border);';
          logItem.style.borderBottom = '1px solid var(--background-modifier-border)';

          const logHeader = logItem.createEl('div', { cls: 'recent-log-header' });
          logHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';

          const logStatus = logHeader.createEl('span', {
            cls: 'recent-log-status',
            text: log.success ? '✓ 成功' : '✗ 失败',
          });
          logStatus.style.cssText = `font-size: 12px; color: ${log.success ? 'var(--text-success)' : 'var(--text-error)'};`;

          const logTime = logHeader.createEl('span', {
            cls: 'recent-log-time',
            text: log.timestamp.toLocaleString('zh-CN'),
          });
          logTime.style.cssText = 'font-size: 11px; color: var(--text-muted);';

          const logPaths = logItem.createEl('div', { cls: 'recent-log-paths' });
          logPaths.style.cssText = 'font-size: 12px; word-break: break-all;';
          logPaths.innerHTML = `<span style="color: var(--text-muted);">${this.escapeHtml(log.localPath)}</span> <span style="color: var(--text-muted);">→</span> <span style="color: var(--interactive-accent);">${log.remoteUrl ? this.escapeHtml(log.remoteUrl.substring(log.remoteUrl.lastIndexOf('/') + 1)) : '-'}</span>`;

          if (log.affectedNotes.length > 0) {
            const logNotes = logItem.createEl('div', { cls: 'recent-log-notes' });
            logNotes.style.cssText = 'font-size: 11px; color: var(--text-muted); margin-top: 4px;';
            logNotes.textContent = `影响 ${log.affectedNotes.length} 篇笔记: ${log.affectedNotes.map(n => n.basename).join(', ')}`;
          }
        }
      }
    }

    // ── Image Compression (always visible when enabled) ───────────────────
    if (this.plugin.settings.enableImageCompression) {
      const compressionH3 = containerEl.createEl('h3');
      setIcon(compressionH3, 'archive');
      compressionH3.appendText(' 图片压缩');

      new Setting(containerEl)
        .setName('压缩阈值（MB）')
        .setDesc('超过此大小的图片会在对话框中显示压缩选项')
        .addSlider(slider =>
          slider
            .setLimits(0.1, 10, 0.1)
            .setValue(this.plugin.settings.compressionThreshold)
            .setDynamicTooltip()
            .onChange(async value => {
              this.plugin.settings.compressionThreshold = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName('初始压缩质量')
        .setDesc('压缩时的初始 JPEG 质量系数（0.1-1.0）。较高值保持更好画质但文件更大')
        .addSlider(slider =>
          slider
            .setLimits(0.1, 1, 0.05)
            .setValue(this.plugin.settings.compressionQuality)
            .setDynamicTooltip()
            .onChange(async value => {
              this.plugin.settings.compressionQuality = value;
              await this.plugin.saveSettings();
            }),
        );

      // Compression preset recommendations
      const presetContainer = containerEl.createDiv();
      presetContainer.style.cssText = 'background: var(--background-secondary); padding: 12px; border-radius: 6px; margin: 10px 0; font-size: 0.9em;';
      presetContainer.innerHTML = '<strong>快速预设：</strong><br/>' +
        '• <strong>高质量（0.90）</strong> - 文档、艺术作品，目标 800KB<br/>' +
        '• <strong>平衡（0.85）</strong> - 日常笔记、博客，目标 500KB<br/>' +
        '• <strong>紧凑（0.75）</strong> - 移动网络、大量图片，目标 300KB<br/>' +
        '• <strong>极限（0.60）</strong> - 受限网络、快速分享，目标 150KB';

      new Setting(containerEl)
        .setName('压缩质量步长')
        .setDesc('每次迭代降低的质量幅度（0.01-0.10）。较小值压缩更精细但速度更慢')
        .addSlider(slider =>
          slider
            .setLimits(0.01, 0.1, 0.01)
            .setValue(this.plugin.settings.compressionQualityStep)
            .setDynamicTooltip()
            .onChange(async value => {
              this.plugin.settings.compressionQualityStep = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName('目标压缩大小（KB）')
        .setDesc('压缩后图片的目标大小，保证不超过此值')
        .addSlider(slider =>
          slider
            .setLimits(100, 1000, 50)
            .setValue(this.plugin.settings.targetCompressedSize)
            .setDynamicTooltip()
            .onChange(async value => {
              this.plugin.settings.targetCompressedSize = value;
              await this.plugin.saveSettings();
            }),
        );
    }

    // ── Local Storage ──────────────────────────────────────────────────────
    const localStorageH3 = containerEl.createEl('h3');
    setIcon(localStorageH3, 'hard-drive');
    localStorageH3.appendText(' 本地存储');

    new Setting(containerEl)
      .setName('本地图片文件夹')
      .setDesc('选择"保存到本地"时，图片保存的文件夹路径')
      .addText(text =>
        text
          .setPlaceholder('assets')
          .setValue(this.plugin.settings.localFolder)
          .onChange(async value => {
            this.plugin.settings.localFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    // ── Info Section ───────────────────────────────────────────────────────
    const infoH3 = containerEl.createEl('h3');
    setIcon(infoH3, 'book-open');
    infoH3.appendText(' 使用说明');

    const infoEl = containerEl.createDiv();
    infoEl.style.cssText = 'background: var(--background-secondary); padding: 16px; border-radius: 8px; margin-top: 12px; font-size: 0.95em; line-height: 1.6;';
    infoEl.innerHTML = '<strong>功能说明：</strong><br/>' +
      '• 在编辑器中粘贴图片时，会弹出对话框<br/>' +
      '• 选择"上传到 GitHub"：图片将上传到配置的 GitHub 仓库，并插入网络链接<br/>' +
      '• 选择"保存到本地"：图片将保存到本地 Vault，并插入相对路径<br/>' +
      '<br/><strong>配置要求：</strong><br/>' +
      '• GitHub Token：需要有 Contents 仓库权限（读写）<br/>' +
      '• 用户名和仓库名：必须正确配置才能上传<br/>' +
      '• 分支名：通常为 main 或 master';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
