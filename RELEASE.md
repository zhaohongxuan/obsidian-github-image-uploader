# 发布指南

本文档说明如何正确地发布 GitHub Image Uploader 插件的新版本。

## 📋 发布检查清单

在发布前，请运行检查脚本确保所有条件都满足：

```bash
./release-check.sh
```

该脚本会检查：
- ✓ 必要的工具已安装
- ✓ 源代码文件完整
- ✓ 项目能成功构建
- ✓ 版本号一致性
- ✓ Git 状态干净
- ✓ 文档完整

## 🔄 完整的发布流程

### 1. 准备工作

确保你在 main/master 分支上，并且所有更改都已提交：

```bash
# 检查分支
git status

# 确保分支是最新的
git pull origin main
```

### 2. 运行检查脚本

```bash
./release-check.sh
```

如果所有检查都通过，继续到下一步。

### 3. 更新版本号

使用 npm 的版本管理：

```bash
# 补丁版本更新 (1.0.0 -> 1.0.1)
npm version patch

# 次要版本更新 (1.0.0 -> 1.1.0)
npm version minor

# 主要版本更新 (1.0.0 -> 2.0.0)
npm version major
```

这个命令会：
- 更新 `package.json` 中的版本号
- 运行 `version-bump.mjs` 脚本
- 自动更新 `manifest.json` 和 `versions.json`
- 创建带有版本标签的 Git 提交
- 创建 Git 标签

**注意**: 这个命令会创建一个提交和标签，但不会推送。

### 4. 验证版本更新

检查文件是否正确更新：

```bash
git log -1 --oneline
cat manifest.json | grep version
cat package.json | grep version
cat versions.json
```

### 5. 推送到远程仓库

```bash
# 推送提交
git push origin main

# 推送标签（触发 GitHub Actions Release 工作流）
git push origin --tags
```

## 🤖 自动化流程

### GitHub Actions

项目配置了两个 GitHub Actions 工作流：

#### build.yml - 自动构建
在以下情况触发：
- 推送到 main/master 分支
- 修改源代码或配置文件

检查项：
- ✓ 类型检查 (TypeScript)
- ✓ 构建 (esbuild)
- ✓ 生成构建产物

#### release.yml - 自动发布
在以下情况触发：
- 推送版本标签 (格式: `x.y.z`)

操作：
- ✓ 构建插件
- ✓ 创建 GitHub Release
- ✓ 上传构建产物 (main.js, manifest.json, styles.css)

## 📦 手动发布 (如果不使用 GitHub Actions)

如果需要手动创建 Release：

### 1. 构建项目

```bash
npm run build
```

### 2. 创建 Release

使用 GitHub CLI：

```bash
RELEASE_VERSION="1.0.1"
gh release create $RELEASE_VERSION \
  --title "Version $RELEASE_VERSION" \
  --notes "See CHANGELOG.md for details" \
  main.js manifest.json styles.css
```

或在 GitHub 网页上手动创建：
1. 访问 https://github.com/zhaohongxuan/obsidian-github-image-uploader/releases
2. 点击 "Draft a new release"
3. 选择标签（应该已经存在）
4. 填写发布说明
5. 上传三个文件：
   - `main.js`
   - `manifest.json`
   - `styles.css`
6. 点击 "Publish release"

## 📝 发布说明示例

```markdown
# Version 1.0.1

## New Features
- Add support for custom image path format
- Improve error messages

## Bug Fixes
- Fix GitHub API timeout issue
- Fix local file save permission error

## Changes
- Optimize image compression
- Update dependencies

## Download
Download the plugin files and extract to your Obsidian vault:
`~/.obsidian/plugins/github-image-uploader/`
```

## 🔗 社区插件库提交

### 首次提交

1. Fork https://github.com/obsidianmd/obsidian-releases
2. 修改 `community-plugins.json`，添加:

```json
{
  "id": "github-image-uploader",
  "name": "GitHub Image Uploader",
  "author": "Xuan",
  "description": "Upload images to GitHub when pasting in Obsidian",
  "repo": "zhaohongxuan/obsidian-github-image-uploader"
}
```

3. 提交 PR

### 后续更新

一旦插件被接受到社区插件库，新的发布会自动检测。
无需额外操作，只需遵循标准的版本发布流程。

## ⚠️ 常见问题

### Q: 意外推送了错误的版本，怎么办？

A: 删除本地和远程标签，然后重新开始：

```bash
# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin :refs/tags/v1.0.0

# 重新开始版本更新
npm version patch
git push origin main --tags
```

### Q: 如何撤销 npm version 操作？

A: 如果还未推送，可以重置：

```bash
# 重置到上一个提交
git reset --hard HEAD~1

# 删除标签
git tag -d <version>
```

### Q: GitHub Actions 构建失败了

A: 检查构建日志：
1. 进入 https://github.com/zhaohongxuan/obsidian-github-image-uploader/actions
2. 找到失败的工作流
3. 查看详细日志
4. 修复问题后，推送修复提交

### Q: Release 上传到了错误的位置

A: 删除并重新创建：
1. GitHub 上删除错误的 Release
2. 删除本地和远程标签
3. 重新推送正确的版本

## 🔐 安全建议

1. **不要推送敏感信息**
   - GitHub Token
   - 私钥
   - API 密钥

2. **使用代码签名**
   ```bash
   git config user.signingkey <your-key-id>
   git config commit.gpgSign true
   ```

3. **验证发布**
   - 检查 Release 的 main.js 大小和时间戳
   - 测试下载的插件在 Obsidian 中是否工作正常

## 📊 版本号规范

遵循 [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0) - 不兼容的 API 变更
- **MINOR** (0.x.0) - 向后兼容的功能添加
- **PATCH** (0.0.x) - 向后兼容的错误修复

示例：
- 1.0.0 - 初始发布
- 1.1.0 - 添加新功能
- 1.1.1 - 修复 bug
- 2.0.0 - 大版本更新

## 📞 支持

如有问题，请：
1. 查看 DEVELOPMENT.md
2. 检查 GitHub Issues
3. 提交新的 Issue

---

**最后检查清单**：
- [ ] 运行了 `release-check.sh`
- [ ] 更新了版本号
- [ ] 提交并标记了 Git
- [ ] 推送了更改和标签
- [ ] GitHub Actions 完成了构建
- [ ] 创建了 Release
- [ ] 测试了下载的插件
- [ ] 更新了文档

祝你发布顺利！🚀
