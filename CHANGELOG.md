# Changelog

所有对 GitHub Image Uploader 的重大更改都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)，
遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

## [Unreleased]

### Added
- 新功能描述

### Changed
- 变更描述

### Deprecated
- 废弃功能描述

### Removed
- 移除功能描述

### Fixed
- 修复的 bug 描述

### Security
- 安全性改进描述

## [1.0.0] - 2026-03-13

### Added
- 初始版本发布
- GitHub 图片上传功能
  - 自动检测粘贴事件
  - Base64 编码和 GitHub REST API 上传
  - 自动生成唯一的文件名
  - GitHub raw URL 自动生成
- 本地文件保存功能
  - 自动创建存储文件夹
  - 相对路径支持
- 图片预览确认对话框
  - 显示图片预览
  - 显示文件信息（名称、大小）
  - 三选项按钮（GitHub、本地、取消）
- 设置界面
  - GitHub Token 配置
  - 仓库信息配置
  - 分支选择
  - 图片存储目录配置
  - 本地存储文件夹配置
- 错误处理和用户反馈
  - 配置验证
  - API 错误捕获
  - 文件操作异常处理
  - 用户友好的错误消息
- 样式和主题
  - Obsidian 主题适配
  - 深色/浅色模式支持
  - 现代化的 UI 设计
- 完整文档
  - 用户指南
  - 快速开始指南
  - 开发文档
  - 技术总结

### Technical Details
- TypeScript + Obsidian Plugin API
- esbuild 构建系统
- GitHub Actions 自动化工作流

---

## 更新日志格式说明

### Added
新增的功能

### Changed
现有功能的更改

### Deprecated
即将删除的功能（保留兼容性）

### Removed
已删除的功能

### Fixed
已修复的 bug

### Security
安全性相关的修复和改进

---

## 如何更新此文件

1. 在 "Unreleased" 部分记录所有更改
2. 发布新版本时，将 "Unreleased" 重命名为版本号和日期
3. 创建新的 "Unreleased" 部分用于后续更改

### 示例

```markdown
## [1.1.0] - 2026-04-15

### Added
- Support for custom image size
- Batch upload feature

### Fixed
- Fix timeout issue with large images
```

---

## 发布检查清单

每次发布前：
- [ ] 更新 CHANGELOG.md
- [ ] 更新版本号 (package.json, manifest.json)
- [ ] 运行测试
- [ ] 更新 README（如果有 API 变更）
- [ ] 创建 Git 标签
- [ ] 创建 GitHub Release

---

**最后更新**: 2026-03-13
**版本**: 1.0.0
