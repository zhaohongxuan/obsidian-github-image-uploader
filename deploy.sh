#!/bin/bash

# GitHub Image Uploader - Deploy Script
# 构建项目并部署到 Obsidian 插件目录

set -e  # Exit on error

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PLUGIN_NAME="github-image-uploader"
# 使用 iCloud Drive 路径，自动处理空格
VAULT_BASE="${VAULT_PATH:-$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/xuan}"
PLUGIN_DIR="$VAULT_BASE/.obsidian/plugins/$PLUGIN_NAME"

# 函数定义
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 显示帮助信息
show_help() {
    cat << EOF
GitHub Image Uploader - Deploy Script

用法: ./deploy.sh [选项]

选项:
  build              只构建项目
  sync               只同步文件到 Obsidian
  both               构建并同步（默认）
  dev                开发模式（监视编译）
  help               显示此帮助信息

环境变量:
  VAULT_PATH         Obsidian Vault 路径（默认: $VAULT_BASE）

示例:
  ./deploy.sh build              # 构建项目
  ./deploy.sh sync               # 同步到 Obsidian
  ./deploy.sh both               # 构建并同步
  VAULT_PATH=/custom/path ./deploy.sh sync  # 自定义 Vault 路径

EOF
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 构建项目
build_project() {
    log_info "构建 GitHub Image Uploader..."
    
    if [ ! -f "package.json" ]; then
        log_error "未找到 package.json，请确保在项目根目录"
        exit 1
    fi
    
    npm run build
    
    if [ ! -f "dist/main.js" ]; then
        log_error "构建失败，未生成 dist/main.js"
        exit 1
    fi
    
    log_success "构建完成"
}

# 同步文件
sync_files() {
    log_info "同步文件到 Obsidian..."
    
    # 创建插件目录
    mkdir -p "$PLUGIN_DIR"
    
    # 检查文件是否存在
    if [ ! -f "dist/main.js" ]; then
        log_error "dist/main.js 不存在，请先运行 build"
        exit 1
    fi
    
    if [ ! -f "manifest.json" ]; then
        log_error "manifest.json 不存在"
        exit 1
    fi
    
    if [ ! -f "styles.css" ]; then
        log_warning "styles.css 不存在"
    fi
    
    # 复制文件
    cp dist/main.js "$PLUGIN_DIR/"
    cp manifest.json "$PLUGIN_DIR/"
    [ -f "styles.css" ] && cp styles.css "$PLUGIN_DIR/"
    
    # 显示同步信息
    log_success "文件同步完成"
    echo ""
    log_info "已安装到: $PLUGIN_DIR"
    echo ""
    
    # 显示文件列表
    log_info "已同步的文件:"
    if [ -f "$PLUGIN_DIR/main.js" ]; then
        echo "  ✓ main.js"
    fi
    if [ -f "$PLUGIN_DIR/manifest.json" ]; then
        echo "  ✓ manifest.json"
    fi
    if [ -f "$PLUGIN_DIR/styles.css" ]; then
        echo "  ✓ styles.css"
    fi
}

# 开发模式
dev_mode() {
    log_info "启动开发模式..."
    echo ""
    npm run dev
}

# 主函数
main() {
    local mode="${1:-both}"
    
    case "$mode" in
        build)
            check_dependencies
            build_project
            ;;
        sync)
            sync_files
            ;;
        both)
            check_dependencies
            build_project
            echo ""
            sync_files
            ;;
        dev)
            check_dependencies
            dev_mode
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知的选项: $mode"
            show_help
            exit 1
            ;;
    esac
    
    # 显示完成信息
    if [ "$mode" != "dev" ] && [ "$mode" != "help" ]; then
        echo ""
        log_success "部署完成！"
        log_warning "提示: 在 Obsidian 中重新加载插件 (⌘+P → Reload app without saving)"
    fi
}

# 运行主函数
main "$@"
