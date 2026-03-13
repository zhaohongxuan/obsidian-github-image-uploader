# GitHub Image Uploader - 插件提取总结

## 项目完成情况

✅ 已成功从 Journal Partner 插件中提取 GitHub 图片上传功能，创建为独立的 Obsidian 插件。

## 核心功能

### 主要特性
1. **图片粘贴拦截** - 自动检测粘贴事件中的图片文件
2. **双选择模式** - 用户可选择上传到 GitHub 或保存到本地
3. **GitHub 自动上传** - 使用 GitHub REST API 上传图片
4. **本地存储备选** - 支持保存到 Obsidian Vault 本地文件夹
5. **自动文件名生成** - 使用时间戳格式: `YYYY-MM-DD_HH-MM-SS_random.ext`
6. **图片预览确认** - 显示图片预览和文件信息的确认模态框

### 配置选项

#### GitHub 配置
- `gitHubToken` - GitHub Personal Access Token（需要 Contents 读写权限）
- `gitHubOwner` - 仓库所有者用户名
- `gitHubRepo` - 仓库名称
- `imagePath` - 仓库中的图片存储目录（如 `assets/images`）
- `gitHubBranch` - 目标分支（默认 `main`）

#### 本地存储配置
- `localFolder` - 本地保存图片的文件夹路径（默认 `assets`）

#### 功能开关
- `enableImageHosting` - 启用/禁用整个图片上传功能

## 代码结构

```
obsidian-github-image-uploader/
├── main.ts                    # 主插件文件（196行）
│   ├── 插件主类定义
│   ├── 设置接口定义
│   ├── 设置 Tab 定义
│   └── 配置管理
│
├── github-image.ts            # GitHub 图片托管模块（344行）
│   ├── GitHubImageHosting 类
│   ├── 事件监听器注册
│   ├── 图片粘贴处理
│   ├── 上传到 GitHub 逻辑
│   ├── 本地保存逻辑
│   ├── 自动文件名生成
│   ├── GitHub API 调用
│   └── ImageConfirmModal 模态框类
│
├── manifest.json              # 插件清单
├── package.json               # 依赖配置
├── tsconfig.json              # TypeScript 配置
├── esbuild.config.mjs         # 编译配置
├── styles.css                 # 样式表
├── README.md                  # 完整文档
└── versions.json              # 版本记录
```

## 主要改动

### 从 Journal Partner 的调整

1. **模块独立化**
   - 移除对 Journal Partner 其他功能的依赖
   - 修改 `GitHubImageHosting` 的类型参数从 `JournalPartnerPlugin` 改为 `GitHubImageUploaderPlugin`

2. **设置整合**
   - 删除与时间戳高亮相关的设置
   - 保留所有 GitHub 和图片存储相关的设置
   - 添加 `localFolder` 配置选项

3. **UI 优化**
   - 设置 Tab 重新组织为 3 个主要部分：基本设置、GitHub 配置、本地存储
   - 添加详细的使用说明信息框
   - 保留原始的模态框设计和样式

4. **文件名称**
   - 包名：`obsidian-github-image-uploader`
   - 插件 ID：`github-image-uploader`
   - 类名：`GitHubImageUploaderPlugin`
   - 设置类：`GitHubImageUploaderSettingTab`

## 技术栈

- **语言**: TypeScript 5.5.3
- **构建工具**: esbuild 0.21.5
- **目标**: Obsidian 1.4.0+
- **API 版本**: GitHub REST API 2022-11-28

## 使用流程

### 用户操作流程

1. **初始配置** (首次使用)
   - 打开 Obsidian 设置 → GitHub Image Uploader
   - 输入 GitHub Token、用户名、仓库名等信息
   - 保存设置

2. **粘贴图片**
   - 在笔记中按 Ctrl+V (或 Cmd+V) 粘贴图片
   - 自动触发 paste 事件监听器

3. **选择存储方式**
   - 弹出确认对话框，显示图片预览
   - 用户选择三个选项之一：
     - 📤 上传到 GitHub
     - 💾 保存到本地
     - ❌ 取消

4. **完成处理**
   - 根据选择，图片被上传或保存
   - 自动插入 Markdown 图片链接到编辑器
   - 显示成功或失败的提示

### 开发流程

```bash
# 安装依赖
npm install

# 开发模式（实时编译）
npm run dev

# 生产构建
npm run build
```

## API 调用细节

### GitHub 上传 API

```
PUT https://api.github.com/repos/{owner}/{repo}/contents/{path}
```

**请求头**:
- `Accept: application/vnd.github+json`
- `Authorization: Bearer {token}`
- `X-GitHub-Api-Version: 2022-11-28`

**请求体**:
- `message`: 提交信息
- `content`: Base64 编码的文件内容
- `branch`: 目标分支
- `committer`: 提交者信息

**返回值**:
- 图片的 raw GitHub URL

## 错误处理

### 已实现的错误处理

1. **配置检查** - 确保 Token、用户名、仓库名都已配置
2. **网络请求** - 捕获 GitHub API 响应错误
3. **文件操作** - 处理本地文件保存失败（自动创建文件夹或回退到根目录）
4. **用户反馈** - 通过 Notice 显示错误或成功信息

### 错误提示

- `❌ GitHub 配置不完整，请在插件设置中配置`
- `❌ 上传失败: [详细错误信息]`
- `❌ 保存失败: [详细错误信息]`

## 样式设计

- 现代化的模态框设计
- Obsidian 主题适配（使用 CSS 变量）
- 按钮悬停动画效果
- 深色/浅色模式自动适配

## 测试建议

1. ✅ 测试图片粘贴事件拦截
2. ✅ 测试 GitHub 上传功能（需要真实 Token）
3. ✅ 测试本地保存功能
4. ✅ 测试配置保存和加载
5. ✅ 测试错误处理流程
6. ✅ 测试不同格式的图片（PNG、JPG、WebP 等）

## 下一步优化方向

### 功能增强
- [ ] 支持图片压缩
- [ ] 支持 CDN 地址转换
- [ ] 添加图片组织模式（按日期、按标签等）
- [ ] 支持批量上传
- [ ] 支持其他图床服务（Imgur、阿里云 OSS 等）

### 用户体验
- [ ] 添加上传进度条
- [ ] 支持拖拽上传
- [ ] 图片链接自定义格式
- [ ] 上传历史记录

### 开发工具
- [ ] 添加单元测试
- [ ] 添加 ESLint
- [ ] GitHub Actions 自动构建
- [ ] 发布到 Obsidian 社区插件库

## 许可证

MIT

## 作者

Xuan

---

**插件创建时间**: 2026-03-13
**版本**: 1.0.0
**最小 Obsidian 版本**: 1.4.0
