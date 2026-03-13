# GitHub Image Uploader - 快速开始指南

## 📋 项目概览

这是一个从 **Journal Partner** 插件中提取的独立 Obsidian 插件，专门处理图片上传功能。

**功能**: 在 Obsidian 中粘贴图片时，自动选择上传到 GitHub 或保存到本地。

## 🚀 快速安装

### 方式 1: 本地开发

```bash
# 1. 进入项目目录
cd obsidian-github-image-uploader

# 2. 安装依赖
npm install

# 3. 启动开发模式（实时编译）
npm run dev

# 4. 构建生产版本
npm run build
```

### 方式 2: 手动安装到 Obsidian

```bash
# 在构建后，复制以下文件到 Obsidian vault
cp main.js styles.css manifest.json ~/.obsidian/plugins/github-image-uploader/
```

## ⚙️ 初始配置 (重要!)

### 第 1 步: 创建 GitHub Token

1. 访问 https://github.com/settings/personal-access-tokens/new
2. 创建新的 fine-grained token
3. 权限配置:
   - Repository → Contents → Read and write

### 第 2 步: 配置插件设置

1. 打开 Obsidian
2. Settings → Community plugins → GitHub Image Uploader
3. 填写以下信息:
   - **GitHub Token**: 粘贴刚刚生成的 token
   - **GitHub 用户名**: 你的 GitHub 用户名
   - **仓库名称**: 用于存储图片的仓库名
   - **图片存储目录**: 例如 `assets/images` (可选)
   - **目标分支**: 通常是 `main`

### 第 3 步: 准备 GitHub 仓库

确保目标仓库:
- [ ] 已存在
- [ ] 你有写入权限
- [ ] 目标分支存在

## 💡 使用方法

### 基本使用

1. **粘贴图片**
   ```
   在笔记中: Ctrl+V (Windows/Linux) 或 Cmd+V (Mac)
   ```

2. **选择存储方式**
   - 弹出对话框会显示图片预览
   - 点击按钮选择:
     - 📤 **上传到 GitHub**: 图片会上传到远程仓库
     - 💾 **保存到本地**: 图片会保存到本地 vault
     - ❌ **取消**: 什么都不做

3. **结果**
   - Markdown 图片链接自动插入到光标位置
   - 显示成功或失败的提示

### GitHub 上传结果

上传到 GitHub 的图片 URL 格式:
```
https://raw.githubusercontent.com/{username}/{repo}/{branch}/{imagePath}/{filename}
```

例如:
```
https://raw.githubusercontent.com/zhaohongxuan/my-blog/main/assets/images/2026-03-13_07-48-32_abc12.png
```

## 📁 项目结构

```
.
├── main.ts              # 插件主文件 - 设置和主逻辑
├── github-image.ts      # 图片处理核心模块
├── manifest.json        # 插件元数据
├── package.json         # 依赖和脚本
├── tsconfig.json        # TypeScript 配置
├── esbuild.config.mjs   # 打包配置
├── styles.css           # 样式
├── README.md            # 完整文档
├── PLUGIN_SUMMARY.md    # 详细总结
└── QUICKSTART.md        # 本文件
```

## 🔧 开发

### 编译命令

```bash
# 开发模式 - 实时编译和热重载
npm run dev

# 生产构建 - 优化和压缩
npm run build

# 类型检查
npx tsc -noEmit -skipLibCheck
```

### 关键文件说明

#### main.ts (196 行)
- `GitHubImageUploaderPlugin` 类 - 插件主类
- `GitHubImageUploaderSettings` 接口 - 设置结构
- `GitHubImageUploaderSettingTab` 类 - 设置界面

#### github-image.ts (344 行)
- `GitHubImageHosting` 类 - 核心上传逻辑
  - `register()` - 注册事件监听
  - `handleImagePaste()` - 处理粘贴事件
  - `uploadAndInsertImage()` - 上传逻辑
  - `saveImageLocally()` - 本地保存逻辑
  - `uploadImageToGitHub()` - GitHub API 调用
- `ImageConfirmModal` 类 - 选择对话框

## 🐛 常见问题

### Q: 上传失败，显示 401 错误
**A**: GitHub Token 无效或已过期
- 生成新的 token: https://github.com/settings/personal-access-tokens/new
- 确保有 Contents 权限

### Q: 上传失败，显示 404 错误
**A**: 仓库不存在或用户名错误
- 检查用户名和仓库名是否正确
- 确保仓库存在

### Q: 上传成功但图片无法显示
**A**: 可能原因
- 仓库是私有的（需要公开）
- 分支名称错误
- 图片路径错误

### Q: 本地保存时报错
**A**: 可能原因
- 本地文件夹权限不足
- Vault 已被其他程序占用
- 磁盘空间不足

## 📝 配置示例

### 最小配置 (本地存储)
```
启用: ✓
其他字段: 留空
本地文件夹: assets
```

### 完整配置 (GitHub + 本地)
```
启用: ✓
GitHub Token: ghp_xxxxxxxxxxxxx
GitHub 用户名: zhaohongxuan
仓库名称: my-blog
图片存储目录: assets/images
目标分支: main
本地文件夹: assets
```

## 🔗 相关资源

- Obsidian 插件 API 文档: https://docs.obsidian.md/
- GitHub REST API: https://docs.github.com/rest
- 原始插件 (Journal Partner): https://github.com/zhaohongxuan/Journal-partner

## 📦 发布到社区

当准备好发布时:

1. 更新 `manifest.json` 中的版本
2. 更新 `versions.json`
3. 创建 GitHub Release
4. 上传 `main.js`, `manifest.json`, `styles.css`
5. 提交到 Obsidian 社区插件库

## 📄 许可证

MIT

## 👤 作者

Xuan

---

**需要帮助?** 查看完整文档: README.md 或 PLUGIN_SUMMARY.md
