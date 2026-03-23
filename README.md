# GitHub 图片上传器 (GitHub Image Uploader)

一款为 Obsidian 设计的插件，让你在记笔记时直接粘贴图片并一键上传到 GitHub。同时支持本地保存，灵活选择存储方式，打造高效的笔记和图片管理工作流。

## ✨ 核心功能

### 🚀 智能图片上传
- **直接粘贴上传** - 在笔记中粘贴图片，自动识别并处理
- **灵活选择存储** - 一键选择上传到 GitHub 或本地保存
- **自动文件命名** - 使用时间戳自动生成唯一文件名 (格式: `YYYY-MM-DD_HH-MM-SS_random.ext`)

### 🔐 GitHub 图床托管
- **安全的 API 调用** - 使用 GitHub REST API，支持精细化访问令牌
- **灵活的仓库配置** - 支持自定义仓库、分支和存储目录
- **云端网址分享** - 生成直接的 GitHub 原始文件链接，方便分享和网页查看
- **支持自定义域名** - 可配置 CDN 加速或自定义域名访问

### 💾 本地存储选项
- **离线保存支持** - 将图片保存到 Vault 本地文件夹
- **路径自动管理** - 使用相对路径，保持 Vault 的可移植性
- **集中管理** - 所有本地图片存放在指定文件夹，便于备份和管理

### ⚙️ 个性化配置
- **傻瓜式设置** - 通过图形化设置面板快速配置
- **多仓库支持** - 可切换不同 GitHub 仓库
- **自定义存储路径** - GitHub 和本地存储路径独立配置

### 🖼️ 强大的图片管理
- **图库视图** - 提供专属的图库视图，集中浏览和管理所有上传到 GitHub 的图片。
  - **快速加载** - 采用分页加载技术，初始只加载最新的10张图片，打开速度更快。
  - **手动加载更多** - 通过底部的“加载更多”按钮分批次浏览，避免一次性加载大量图片造成的卡顿。
  - **一键刷新** - 图库内置刷新按钮，随时与 GitHub 仓库保持同步。
- **现代化的图片详情** - 点击图库中的任意图片，即可打开全新的详情弹窗。
  - **双栏布局** - 左侧为高清图片预览，右侧为详细信息和操作按钮，一目了然。
  - **快捷操作** - 支持一键“复制链接”、“复制Markdown”、“在浏览器中打开”以及“从仓库删除”图片。

## 📦 安装方式

### 方式一：通过 Obsidian 社区插件（推荐）

1. 打开 Obsidian 设置 → 社区插件
2. 搜索 "GitHub Image Uploader"
3. 点击"安装"按钮
4. 在插件列表中启用该插件

### 方式二：手动安装

1. 下载[最新版本](https://github.com/zhaohongxuan/obsidian-github-image-uploader/releases)
2. 解压到 Vault 文件夹：`.obsidian/plugins/github-image-uploader/`
3. 重启 Obsidian
4. 在设置中启用插件

## 🔧 快速开始指南

### 第一步：创建 GitHub 个人访问令牌

1. 访问 [GitHub 个人访问令牌设置](https://github.com/settings/personal-access-tokens/new)
2. 创建新的精细化令牌，配置以下权限：
   - **仓库权限** → **内容（Contents）** → 勾选 **读取和写入**
   - 选择令牌有效期（建议选择较长期限）
3. 生成令牌并复制（此后无法重新查看，请妥善保存）

**⚠️ 安全提示**：
- 不要在网络上分享你的令牌
- 定期更新令牌，及时删除过期的令牌
- 如令牌泄露，立即在 GitHub 删除该令牌

### 第二步：配置插件

1. 打开 Obsidian 设置 → 插件选项 → GitHub Image Uploader
2. 在各字段填入以下信息：
   - **GitHub 令牌**：粘贴上一步生成的令牌
   - **GitHub 用户名**：你的 GitHub 用户名（仓库所有者）
   - **仓库名称**：存储图片的仓库名（如 `obsidian-images`）
   - **图片存储目录**：仓库中的文件夹路径（如 `assets/images`，无需开头斜杠）
   - **目标分支**：目标分支名（通常为 `main` 或 `master`）
   - **本地图片文件夹**：保存本地图片的文件夹（如 `assets`）

3. 点击"保存"保存配置

### 第三步：开始使用！

在笔记中粘贴图片，会弹出选择对话框：
- **📤 上传到 GitHub**：上传到你的 GitHub 仓库，获得公网链接
- **💾 保存到本地**：保存到 Vault 本地文件夹
- **❌ 取消**：放弃操作

## 📖 使用方法

### 粘贴图片

将图片粘贴到你的 Obsidian 笔记中，以下任何方式都可以：
- 从浏览器或应用程序复制图片后直接粘贴（`Ctrl+V` 或 `Cmd+V`）
- 从截图工具（如 macOS 的截图工具）粘贴

**图片处理流程**：
1. 检测到图片粘贴事件
2. 弹出确认对话框，显示图片预览和文件信息
3. 选择存储位置
4. 自动生成文件名并处理图片
5. 在笔记中插入 Markdown 图片链接

### GitHub 上传的图片地址

- **格式**：`https://raw.githubusercontent.com/{用户名}/{仓库名}/{分支}/{存储目录}/{文件名}`
- **示例**：`https://raw.githubusercontent.com/zhaohongxuan/obsidian-images/main/assets/2024-03-13_14-30-45_abc123.png`
- **优点**：
  - 可在任何网站引用该链接
  - 支持 CDN 加速（如使用 jsDelivr）
  - 自动备份到 GitHub

### 本地保存的图片

- **存储位置**：`{本地文件夹}/{文件名}`
- **相对路径**：使用相对路径，便于 Vault 跨设备同步
- **优点**：
  - 完全离线可用
  - 隐私性更好
  - 无需网络连接

## ⚙️ 设置选项详解

### 基本设置

- **启用 GitHub 图床** - 开启/关闭整个图片上传功能开关

### GitHub 配置

| 选项 | 说明 | 示例 |
|------|------|------|
| **GitHub 令牌** | 你的个人访问令牌（需要 Contents 读写权限） | `github_pat_xxx...` |
| **GitHub 用户名** | 仓库所有者的 GitHub 用户名 | `zhaohongxuan` |
| **仓库名称** | 存储图片的仓库名称 | `obsidian-images` |
| **图片存储目录** | 仓库中的存储文件夹路径 | `assets/images` |
| **目标分支** | 上传的目标分支（通常为 `main` 或 `master`） | `main` |

### 本地存储配置

| 选项 | 说明 | 默认值 |
|------|------|--------|
| **本地图片文件夹** | 本地保存图片的文件夹路径 | `assets` |

## 💻 开发指南

### 系统要求

- Node.js v16 或更高版本
- npm 或 yarn 包管理工具
- 熟悉 TypeScript 和 Obsidian 插件开发

### 本地开发设置

```bash
# 1. 克隆仓库
git clone https://github.com/zhaohongxuan/obsidian-github-image-uploader.git
cd obsidian-github-image-uploader

# 2. 安装依赖
npm install

# 3. 开发模式（自动重新加载）
npm run dev

# 4. 生产构建
npm run build
```

### 项目结构

```
obsidian-github-image-uploader/
├── main.ts                    # 插件主文件
│   ├── 插件类定义
│   ├── 设置面板
│   └── 配置管理
│
├── github-image.ts            # GitHub 图片上传模块
│   ├── GitHubImageHosting 类
│   ├── 事件监听
│   ├── 图片上传逻辑
│   ├── 本地保存逻辑
│   └── 确认对话框
│
├── manifest.json              # 插件元数据
├── package.json               # 依赖配置
├── tsconfig.json              # TypeScript 配置
├── esbuild.config.mjs         # 构建配置
└── styles.css                 # 插件样式
```

### 代码贡献

欢迎提交 Pull Request！请确保：
- 代码遵循项目风格
- 新功能有相应的测试
- 提交信息清晰明了

## 🔧 常见问题排查

### GitHub 上传失败

| 问题 | 解决方案 |
|------|--------|
| **权限错误** | 检查 GitHub 令牌是否有 Contents 读写权限 |
| **仓库不存在** | 验证用户名和仓库名是否正确 |
| **分支不存在** | 确保目标分支在仓库中存在（如 `main`、`master`） |
| **网络错误** | 检查网络连接，尝试切换网络 |
| **文件已存在** | 文件名冲突时会生成新文件名，无需手动处理 |

### 图片无法显示

**GitHub 上传的图片**：
- 检查 Markdown 链接是否正确
- 访问直链确认图片是否真的存在
- 尝试使用 jsDelivr CDN 加速链接

**本地保存的图片**：
- 确保文件路径相对于 Vault 根目录是正确的
- 检查本地图片文件夹是否存在
- 验证 Markdown 路径分隔符使用正确

### 其他常见问题

**Q: 我的 GitHub 令牌过期了怎么办？**
> 访问 GitHub 设置生成新令牌，然后在插件设置中更新。

**Q: 支持上传其他格式的文件吗？**
> 目前仅支持图片格式（PNG、JPG、GIF 等）。

**Q: 可以批量上传多张图片吗？**
> 可以逐张粘贴上传，每张独立处理。后续版本可能支持批量操作。

**Q: 上传到 GitHub 的文件可以删除吗？**
> 可以直接在 GitHub 仓库中管理（删除、编辑等），不需要通过插件。

## 🤝 贡献指南

欢迎各种形式的贡献！无论是 Bug 报告、功能建议还是代码提交，都非常感谢。

### 如何提交问题或建议

1. 访问 [GitHub Issues 页面](https://github.com/zhaohongxuan/obsidian-github-image-uploader/issues)
2. 点击"New Issue"创建新问题
3. 详细描述问题或建议，包括：
   - 问题的具体症状
   - 重现步骤
   - 期望的行为
   - 你的 Obsidian 版本和操作系统

### 如何提交代码

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 💬 反馈和支持

- 📧 **问题报告**：[GitHub Issues](https://github.com/zhaohongxuan/obsidian-github-image-uploader/issues)
- 💡 **功能建议**：[GitHub Discussions](https://github.com/zhaohongxuan/obsidian-github-image-uploader/discussions)
- 🌟 **喜欢这个项目？** 请给我一个 Star ⭐

---

<div align="center">

**用 ❤️ 创作**

Made by [Xuan](https://github.com/zhaohongxuan)

[GitHub](https://github.com/zhaohongxuan) | [Obsidian 论坛](https://forum.obsidian.md/)

</div>
