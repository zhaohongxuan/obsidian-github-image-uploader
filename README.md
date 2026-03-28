# GitHub 图片上传器

为 Obsidian 打造的无障碍图片上传插件。写笔记时直接粘贴图片，一键上传到 GitHub，同时支持本地保存。

---

## 功能特点

### 🚀 图片上传
- 复制图片后直接粘贴，插件自动识别并处理
- 支持上传到 GitHub 或保存到本地
- 文件名自动生成（格式：`YYYY-MM-DD_HH-MM-SS_随机字符.扩展名`）

### 🔐 GitHub 图床
- 使用 GitHub REST API，安全可靠
- 可配置任意仓库、分支和存储目录
- 生成永久有效的原始文件链接
- 支持配置 CDN 或自定义域名加速访问

### 💾 本地存储
- 图片可保存到 Vault 本地文件夹
- 使用相对路径，跨设备同步无压力
- 完全离线可用

### 🖼️ 图库管理
- 提供独立的图库视图，集中管理所有上传图片
- 分页加载，首次只加载最新 10 张，速度更快
- 点击任意图片可查看详情：高清预览 + 操作按钮
- 支持复制链接、复制 Markdown、在浏览器打开或删除图片

---

## 安装

### 方式一：Obsidian 社区插件（推荐）

1. 打开 Obsidian 设置 → 社区插件
2. 搜索 "GitHub Image Uploader"
3. 安装并启用插件

### 方式二：手动安装

1. 下载[最新版本](https://github.com/zhaohongxuan/obsidian-github-image-uploader/releases)
2. 解压到 Vault：`.obsidian/plugins/github-image-uploader/`
3. 重启 Obsidian，启用插件

---

## 快速开始

### 第一步：创建 GitHub 令牌

1. 访问 [GitHub 令牌设置](https://github.com/settings/personal-access-tokens/new)
2. 创建精细化令牌，勾选 **仓库权限** → **内容（Contents）** → **读取和写入**
3. 生成并复制令牌（请妥善保管，无法再次查看）

> ⚠️ 安全提示：不要在网络上分享令牌，定期更换，发现泄露立即删除。

### 第二步：配置插件

1. 设置 → 插件选项 → GitHub Image Uploader
2. 填写配置：
   - **GitHub 令牌**：粘贴令牌
   - **GitHub 用户名**：你的 GitHub 用户名
   - **仓库名称**：如 `obsidian-images`
   - **存储目录**：如 `assets/images`
   - **分支**：如 `main`
   - **本地文件夹**：如 `assets`

### 第三步：开始使用

复制图片后粘贴（`Ctrl+V` 或 `Cmd+V`），弹出选择框：

- **📤 上传到 GitHub**：上传到仓库，获得公网链接
- **💾 保存到本地**：保存到本地文件夹
- **❌ 取消**：放弃操作

---

## 使用说明

### 粘贴图片

支持以下方式粘贴：
- 复制网页图片后直接粘贴
- 截图工具截图后粘贴

处理流程：检测粘贴 → 弹出确认框 → 选择存储位置 → 自动处理 → 插入 Markdown 链接

### 图片链接格式

**GitHub 图片**：
```
https://raw.githubusercontent.com/{用户名}/{仓库}/{分支}/{目录}/{文件名}
```

**本地图片**：
```
{本地文件夹}/{文件名}
```

---

## 设置选项

### GitHub 配置

| 选项 | 说明 | 示例 |
|------|------|------|
| GitHub 令牌 | 个人访问令牌 | `github_pat_xxx...` |
| 用户名 | GitHub 用户名 | `zhaohongxuan` |
| 仓库名称 | 存储图片的仓库 | `obsidian-images` |
| 存储目录 | 仓库中的文件夹 | `assets/images` |
| 分支 | 目标分支 | `main` |

### 本地配置

| 选项 | 说明 | 默认值 |
|------|------|--------|
| 本地文件夹 | Vault 本地存储路径 | `assets` |

---

## 开发

### 环境要求

- Node.js v16+
- npm 或 yarn

### 本地开发

```bash
# 克隆并进入目录
git clone https://github.com/zhaohongxuan/obsidian-github-image-uploader.git
cd obsidian-github-image-uploader

# 安装依赖
npm install

# 开发模式（自动重载）
npm run dev

# 生产构建
npm run build
```

### 项目结构

```
├── main.ts              # 插件主入口
├── github-image.ts      # GitHub 上传模块
├── src/                 # 源代码
├── styles.css           # 样式文件
└── manifest.json        # 插件配置
```

---

## 常见问题

### GitHub 上传失败

| 问题 | 解决方法 |
|------|----------|
| 权限错误 | 检查令牌是否有 Contents 读写权限 |
| 仓库不存在 | 确认用户名和仓库名正确 |
| 网络错误 | 检查网络连接 |

### 图片不显示

- **GitHub 图片**：检查链接是否正确，尝试用 jsDelivr CDN
- **本地图片**：检查文件路径是否相对于 Vault 根目录正确

---

## 反馈与贡献

- 🐛 问题报告：[GitHub Issues](https://github.com/zhaohongxuan/obsidian-github-image-uploader/issues)
- 💡 功能建议：[GitHub Discussions](https://github.com/zhaohongxuan/obsidian-github-image-uploader/discussions)

欢迎提交 PR！

---

## 许可证

MIT License

---

用 ❤️ 打造 by [Xuan](https://github.com/zhaohongxuan)
