import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
} from 'obsidian';
import { GitHubImageHosting } from './github-image';

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
}

const DEFAULT_SETTINGS: GitHubImageUploaderSettings = {
  enableImageHosting: true,
  gitHubToken: '',
  gitHubOwner: '',
  gitHubRepo: '',
  imagePath: 'assets/images',
  gitHubBranch: 'main',
  localFolder: 'assets',
};

// ── Plugin ──────────────────────────────────────────────────────────────────

export default class GitHubImageUploaderPlugin extends Plugin {
  settings: GitHubImageUploaderSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new GitHubImageUploaderSettingTab(this.app, this));

    // Register GitHub image hosting
    const imageHosting = new GitHubImageHosting(this, this.app);
    imageHosting.register();

    console.log('GitHub Image Uploader plugin loaded');
  }

  onunload() {
    console.log('GitHub Image Uploader plugin unloaded');
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
    containerEl.createEl('h3', { text: '🖼️ 基本设置' });

    new Setting(containerEl)
      .setName('启用 GitHub 图床')
      .setDesc('粘贴图片时自动弹出上传选项')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.enableImageHosting)
          .onChange(async value => {
            this.plugin.settings.enableImageHosting = value;
            await this.plugin.saveSettings();
          }),
      );

    // ── GitHub Configuration ────────────────────────────────────────────────
    containerEl.createEl('h3', { text: '🔐 GitHub 配置' });

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

    // ── Local Storage ──────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: '💾 本地存储' });

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
    containerEl.createEl('h3', { text: '📖 使用说明' });

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
}
