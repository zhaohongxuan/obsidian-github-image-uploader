#!/bin/bash

# GitHub Image Uploader - Release Checklist Script
# 发布前的检查清单

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_check() {
    echo -e "${BLUE}□${NC} $1"
}

log_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "GitHub Image Uploader - 发布检查清单"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

passed=0
failed=0

# 检查环境
log_check "检查必要的命令行工具..."
if command -v node &> /dev/null && command -v npm &> /dev/null && command -v git &> /dev/null; then
    log_pass "所有工具已安装"
    ((passed++))
else
    log_fail "缺少必要的工具"
    ((failed++))
fi

# 检查文件
echo ""
log_check "检查源文件..."
files=("main.ts" "github-image.ts" "manifest.json" "package.json" "tsconfig.json" "esbuild.config.mjs" "styles.css" "README.md")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        log_pass "$file 存在"
        ((passed++))
    else
        log_fail "$file 缺失"
        ((failed++))
    fi
done

# 构建测试
echo ""
log_check "构建测试..."
if npm run build > /dev/null 2>&1; then
    log_pass "构建成功"
    ((passed++))
else
    log_fail "构建失败"
    ((failed++))
fi

# 检查构建输出
echo ""
log_check "检查构建输出..."
if [ -f "main.js" ]; then
    size=$(ls -lh main.js | awk '{print $5}')
    log_pass "main.js 已生成 ($size)"
    ((passed++))
else
    log_fail "main.js 未生成"
    ((failed++))
fi

# 获取版本号
echo ""
log_check "检查版本号..."
if [ -f "manifest.json" ] && [ -f "package.json" ]; then
    manifest_version=$(grep -o '"version"[^,}]*' manifest.json | cut -d'"' -f4)
    package_version=$(grep -o '"version"[^,}]*' package.json | cut -d'"' -f4 | head -1)
    
    if [ "$manifest_version" = "$package_version" ]; then
        log_pass "版本号一致: $manifest_version"
        ((passed++))
    else
        log_fail "版本号不一致 (manifest: $manifest_version, package: $package_version)"
        ((failed++))
    fi
fi

# 检查 Git 状态
echo ""
log_check "检查 Git 状态..."
if git status > /dev/null 2>&1; then
    if git diff-index --quiet HEAD --; then
        log_pass "Git 工作目录干净"
        ((passed++))
    else
        log_warning "Git 工作目录有未提交的更改"
        git status --short
    fi
else
    log_fail "Git 未初始化"
    ((failed++))
fi

# 检查 Git 标签
echo ""
log_check "检查 Git 标签..."
current_tag=$(git describe --tags --exact-match 2>/dev/null || echo "")
if [ -n "$current_tag" ]; then
    log_pass "当前标签: $current_tag"
    ((passed++))
else
    log_warning "当前分支未标记版本标签"
fi

# 检查文档
echo ""
log_check "检查文档..."
docs=("README.md" "QUICKSTART.md" "PLUGIN_SUMMARY.md" "DEVELOPMENT.md")
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        lines=$(wc -l < "$doc")
        log_pass "$doc 存在 ($lines 行)"
        ((passed++))
    else
        log_warning "$doc 缺失（可选）"
    fi
done

# 总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "检查结果: ${GREEN}$passed 项通过${NC}, ${RED}$failed 项失败${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查项都通过！${NC}"
    echo ""
    echo "可以开始发布流程："
    echo "1. npm version patch|minor|major"
    echo "2. git push origin --tags"
    echo "3. 在 GitHub 上创建 Release"
    exit 0
else
    echo -e "${RED}✗ 有检查项未通过，请修复后再发布${NC}"
    exit 1
fi
