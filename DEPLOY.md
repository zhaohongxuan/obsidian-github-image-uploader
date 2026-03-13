# 部署说明

本文档说明如何使用部署脚本快速部署插件到 Obsidian。

## 📋 快速开始

### 1. 查看帮助

```bash
./deploy.sh help
```

### 2. 构建项目

```bash
./deploy.sh build
# 或
npm run deploy:build
```

### 3. 同步到 Obsidian

```bash
./deploy.sh sync
# 或
npm run deploy:sync
```

### 4. 一键部署（构建 + 同步）

```bash
./deploy.sh both
# 或
npm run deploy
```

### 5. 开发模式（监视编译）

```bash
./deploy.sh dev
# 或
npm run deploy:dev
```

## 🔧 部署脚本详解

### deploy.sh 的功能

脚本提供以下功能：

| 命令 | 功能 | npm 快捷命令 |
|-----|------|----------|
| `build` | 只编译项目 | `npm run deploy:build` |
| `sync` | 只同步到 Obsidian | `npm run deploy:sync` |
| `both` | 编译并同步（默认） | `npm run deploy` |
| `dev` | 开发模式（监视编译） | `npm run deploy:dev` |
| `help` | 显示帮助信息 | - |

### 环境变量

`deploy.sh` 支持自定义 Vault 路径：

```bash
# 使用默认路径
./deploy.sh sync

# 使用自定义路径
VAULT_PATH="/path/to/vault" ./deploy.sh sync

# 持久化设置
export VAULT_PATH="/path/to/vault"
./deploy.sh sync
./deploy.sh sync  # 继续使用相同的路径
```

### 默认 Vault 路径

脚本默认使用以下路径（macOS iCloud）：

```
/Users/xuan/Library/Mobile Documents/iCloud~md~obsidian/Documents/xuan
```

如果你的 Vault 位置不同，需要设置 `VAULT_PATH` 环境变量。

## 🚀 实际使用示例

### 场景 1: 本地开发和实时测试

```bash
# 启动开发模式，实时编译
npm run deploy:dev

# 在另一个终端中，修改代码时会自动编译
# 在 Obsidian 中按 ⌘+P → Reload app without saving 重新加载
```

### 场景 2: 快速修复和部署

```bash
# 修改代码...

# 一键编译并同步到 Obsidian
npm run deploy

# 在 Obsidian 中重新加载插件
```

### 场景 3: 仅构建用于发布

```bash
# 构建用于发布的版本
npm run deploy:build

# 检查生成的文件
ls -lh main.js manifest.json styles.css

# 手动复制到发布位置或上传
```

### 场景 4: 多个 Vault

```bash
# 同步到 Vault 1
./deploy.sh sync

# 同步到 Vault 2
VAULT_PATH="/path/to/vault2" ./deploy.sh sync

# 同步到 Vault 3
VAULT_PATH="/path/to/vault3" ./deploy.sh sync
```

## 📁 文件结构

部署脚本会同步以下文件到 Obsidian:

```
~/.obsidian/plugins/github-image-uploader/
├── main.js ..................... 编译后的插件代码
├── manifest.json ............... 插件元数据
└── styles.css .................. 插件样式（如果存在）
```

## ✅ 部署检查

脚本会自动检查以下内容：

- ✓ Node.js 和 npm 已安装
- ✓ 项目在正确的目录
- ✓ package.json 存在
- ✓ 构建成功生成 main.js
- ✓ manifest.json 存在
- ✓ Vault 目录可访问
- ✓ 有文件写入权限

如果任何检查失败，脚本会显示错误信息并停止。

## 🐛 故障排查

### 问题 1: "未找到 VAULT_PATH"

**原因**: Vault 路径不存在或不可访问

**解决方案**:
```bash
# 检查默认路径
ls "/Users/xuan/Library/Mobile Documents/iCloud~md~obsidian/Documents/xuan"

# 或设置正确的路径
VAULT_PATH="/actual/path/to/vault" ./deploy.sh sync
```

### 问题 2: "权限不足"

**原因**: 没有写入权限到 Obsidian 插件目录

**解决方案**:
```bash
# 检查权限
ls -ld ~/.obsidian/plugins/

# 修复权限
chmod 755 ~/.obsidian/plugins/

# 或创建目录
mkdir -p ~/.obsidian/plugins/github-image-uploader
chmod 755 ~/.obsidian/plugins/github-image-uploader
```

### 问题 3: "构建失败"

**原因**: 源代码有问题或依赖缺失

**解决方案**:
```bash
# 重新安装依赖
npm install

# 检查 TypeScript 错误
npx tsc -noEmit -skipLibCheck

# 手动构建并查看详细错误
npm run build
```

### 问题 4: "Obsidian 没有重新加载插件"

**原因**: 文件同步成功但 Obsidian 未检测到变化

**解决方案**:
- 手动重新加载: ⌘+P (Mac) 或 Ctrl+P (Windows) → Reload app without saving
- 或禁用后重新启用插件
- 或安装 [Hot Reload](https://github.com/pjeby/hot-reload) 插件

## 🔄 与开发工作流集成

### 与 Git 集成

```bash
# 修改代码后
git add main.ts github-image.ts
git commit -m "feat: add new feature"

# 同步到本地 Obsidian
npm run deploy

# 测试成功后推送
git push origin feature-branch
```

### 与 CI/CD 集成

部署脚本可以集成到 CI/CD 流程中：

```yaml
# GitHub Actions 示例
- name: Deploy to Obsidian
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: |
    npm run deploy:build
    # 上传到 S3、服务器等
```

## 📊 性能优化

### 快速迭代

1. 使用开发模式减少构建时间：
   ```bash
   npm run deploy:dev
   ```

2. 修改代码后自动编译，不需要手动构建

3. 在 Obsidian 中快速重新加载

### 减少同步时间

只同步必要的文件：

```bash
# 如果样式没有变化
cp main.js ~/.obsidian/plugins/github-image-uploader/
```

## 💡 高级用法

### 自定义 Vault 路径脚本

创建 `.env` 文件：

```bash
# .env
export VAULT_PATH="/path/to/my/vault"
```

然后在部署前加载：

```bash
source .env
npm run deploy
```

### 多 Vault 部署脚本

创建 `deploy-all.sh`:

```bash
#!/bin/bash
VAULTS=("/vault1" "/vault2" "/vault3")
for vault in "${VAULTS[@]}"; do
  VAULT_PATH="$vault" ./deploy.sh sync
done
```

### 后部署钩子

在部署后运行自定义脚本：

```bash
npm run deploy && ./post-deploy.sh
```

## 📝 常见命令参考

```bash
# 开发工作流
npm run dev                    # 启动监视模式
npm run deploy:build           # 构建
npm run deploy                 # 构建 + 同步
npm run deploy:dev             # 开发模式（监视 + 编译）

# 测试和验证
npm test                       # 运行测试
npx tsc -noEmit -skipLibCheck # 类型检查

# 版本管理
npm version patch              # 升级补丁版本
npm version minor              # 升级次要版本
npm version major              # 升级主要版本

# 发布
npm run deploy:build           # 最终构建
./release-check.sh             # 发布前检查
git push origin --tags         # 推送标签触发自动发布
```

## 🔐 安全建议

1. **不要提交 `.env` 文件**（如果包含敏感路径）
   ```bash
   echo ".env" >> .gitignore
   ```

2. **验证 Vault 路径**
   ```bash
   # 在部署前检查
   test -d "$VAULT_PATH" && echo "✓ Vault 路径有效"
   ```

3. **备份前重要文件**
   ```bash
   cp -r ~/.obsidian/plugins/github-image-uploader ~/backup/
   ```

## 📞 获取帮助

```bash
# 查看脚本帮助
./deploy.sh help

# 查看详细文档
cat README.md
cat QUICKSTART.md
cat DEVELOPMENT.md
```

---

**下一步**: 
- 查看 [RELEASE.md](./RELEASE.md) 了解如何发布新版本
- 查看 [DEVELOPMENT.md](./DEVELOPMENT.md) 了解开发细节
- 查看 [QUICKSTART.md](./QUICKSTART.md) 了解快速开始

祝你部署顺利！ 🚀
