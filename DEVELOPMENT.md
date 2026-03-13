# 开发指南

本文档为开发者提供详细的开发、测试和发布步骤。

## 本地开发环境设置

### 1. 克隆项目

```bash
cd obsidian-github-image-uploader
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式运行

```bash
npm run dev
```

这会启动 esbuild 的监视模式，自动编译 TypeScript 到 main.js。

## 构建

### 开发构建

```bash
npm run dev
```

输出文件：
- `main.js` - 编译后的 JavaScript（带 source map）
- 自动编译监视

### 生产构建

```bash
npm run build
```

输出文件：
- `main.js` - 压缩优化的 JavaScript
- 无 source map

## 文件修改时自动重新加载

1. 在 Obsidian 中启用"社区插件"
2. 启用本插件
3. 在代码编辑器中修改文件
4. `npm run dev` 会自动编译
5. 在 Obsidian 中按 Ctrl+Shift+I (或 Cmd+Option+I on Mac) 打开开发者工具重新加载

或者使用 [Hot Reload 插件](https://github.com/pjeby/hot-reload)：
```bash
npm install --save-dev pjeby/hot-reload
```

## 代码结构详解

### main.ts (212 行)

主插件文件，包含三个主要部分：

#### 1. 类型定义

```typescript
interface GitHubImageUploaderSettings {
  enableImageHosting: boolean;
  gitHubToken: string;
  gitHubOwner: string;
  gitHubRepo: string;
  imagePath: string;
  gitHubBranch: string;
  localFolder: string;
}
```

#### 2. 插件类

```typescript
export default class GitHubImageUploaderPlugin extends Plugin {
  async onload() {
    // 插件加载时执行
    // 加载设置、注册事件处理器
  }
  
  onunload() {
    // 插件卸载时执行
  }
}
```

#### 3. 设置 Tab 类

```typescript
class GitHubImageUploaderSettingTab extends PluginSettingTab {
  display() {
    // 构建设置界面
  }
}
```

### github-image.ts (344 行)

处理图片上传的核心模块。

#### GitHubImageHosting 类

主要方法：

- `register()` - 注册 paste 事件监听器
- `handleImagePaste(evt)` - 处理粘贴事件
- `uploadAndInsertImage(file)` - 上传到 GitHub
- `saveImageLocally(file)` - 保存到本地
- `uploadImageToGitHub(blob, filename, options)` - GitHub API 调用
- `generateImageFilename(mimeType)` - 生成文件名

#### ImageConfirmModal 类

模态框类，用于显示图片预览和让用户选择保存方式。

## 关键技术点

### 1. 事件监听

```typescript
this.plugin.registerDomEvent(document, 'paste', (evt: ClipboardEvent) => {
  // 使用捕获阶段以拦截早期事件
  const files = evt.clipboardData?.files;
  // ...
}, true); // capture phase
```

### 2. 异步文件操作

```typescript
const arrayBuffer = await file.arrayBuffer();
// 转换为 Base64
const base64Content = btoa(binary);
```

### 3. GitHub API 调用

```typescript
const response = await fetch(apiUrl, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + options.token,
  },
  body: JSON.stringify({...}),
});
```

### 4. 设置持久化

```typescript
async loadSettings() {
  this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings() {
  await this.saveData(this.settings);
}
```

## 测试清单

### 功能测试

- [ ] 粘贴图片时弹出确认对话框
- [ ] 图片预览正确显示
- [ ] 文件信息（名称、大小）显示正确
- [ ] 上传到 GitHub 按钮工作正常
- [ ] 保存到本地按钮工作正常
- [ ] 取消按钮关闭对话框
- [ ] 上传成功后自动插入链接
- [ ] 上传失败显示错误消息

### 配置测试

- [ ] 设置可以正确保存
- [ ] 设置可以从 Obsidian 加载
- [ ] Token 字段为密码类型
- [ ] GitHub 配置验证
- [ ] 本地文件夹配置验证

### 错误处理测试

- [ ] 配置不完整时显示错误
- [ ] GitHub Token 无效时显示 401 错误
- [ ] 仓库不存在时显示 404 错误
- [ ] 网络错误正确处理
- [ ] 本地保存权限问题处理

### 跨浏览器测试

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### 主题测试

- [ ] 浅色主题下的样式
- [ ] 深色主题下的样式
- [ ] 自定义主题兼容性

## 调试技巧

### 启用控制台输出

在 `github-image.ts` 中添加日志：

```typescript
console.log('Image paste event:', evt);
console.log('Files:', files);
console.log('Uploading to GitHub...', options);
```

在 Obsidian 中按 Ctrl+Shift+I 打开开发者工具查看。

### 网络调试

在 GitHub API 调用前添加日志：

```typescript
console.log('GitHub API URL:', apiUrl);
console.log('Request body:', JSON.stringify({...}));
const response = await fetch(apiUrl, {...});
console.log('Response status:', response.status);
const data = await response.json();
console.log('Response data:', data);
```

### 设置调试

```typescript
console.log('Current settings:', this.plugin.settings);
```

## 发布流程

### 1. 准备发布

```bash
# 确保代码编译无误
npm run build

# 运行类型检查
npx tsc -noEmit -skipLibCheck
```

### 2. 更新版本

编辑 `manifest.json`:
```json
{
  "version": "1.1.0"
}
```

编辑 `versions.json`:
```json
{
  "1.1.0": "1.4.0"
}
```

### 3. 创建 Git 提交

```bash
git add manifest.json versions.json
git commit -m "Bump version to 1.1.0"
git tag 1.1.0
git push origin master --tags
```

### 4. 创建 GitHub Release

```bash
# 需要安装 GitHub CLI
gh release create 1.1.0 main.js manifest.json styles.css \
  --title "Version 1.1.0" \
  --notes "Release notes here"
```

### 5. 提交到社区插件库

在 https://github.com/obsidianmd/obsidian-releases 提交 PR:

1. Fork 仓库
2. 修改 `community-plugins.json`
3. 添加插件信息
4. 提交 PR

## 依赖管理

### 查看当前依赖

```bash
npm list
```

### 更新依赖

```bash
npm update

# 更新特定包
npm update obsidian@latest
```

### 安装新依赖

```bash
npm install --save-dev @types/node@latest
```

## 常见问题

### Q: 修改代码后 Obsidian 没有更新？

A: 需要重新加载插件：
- 禁用插件后再启用
- 或使用 Hot Reload 插件

### Q: 编译错误 "Cannot find module"?

A: 运行 `npm install` 安装依赖

### Q: GitHub API 返回 422 错误？

A: 可能原因：
- 分支不存在
- 路径格式错误
- Token 权限不足

### Q: 本地保存时出错？

A: 检查文件夹权限和磁盘空间

## 性能优化建议

1. **图片压缩** - 上传前压缩图片
2. **缓存** - 缓存最近上传的 URL
3. **并发上传** - 支持批量上传
4. **CDN** - 使用 CDN 加速 GitHub 图片访问

## 安全性考虑

1. **Token 保护**
   - 使用密码类型输入框隐藏 Token
   - 不在日志中输出 Token
   - 不在客户端持久化 Token 明文

2. **HTTPS 强制**
   - 所有 API 调用使用 HTTPS
   - 验证 SSL 证书

3. **权限最小化**
   - 只授予必要的 GitHub 权限
   - 使用 Fine-grained tokens

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 许可证

MIT

---

如有问题，欢迎提交 Issue 或 PR。
