# GitHub Image Uploader

An Obsidian plugin that allows you to upload images directly to GitHub when pasting them in your notes. You can choose to upload to GitHub for cloud-based hosting or save them locally in your vault.

## Features

✨ **Smart Image Upload**
- Paste images directly into your Obsidian notes
- Choose between uploading to GitHub or saving locally with one click
- Automatic filename generation with timestamps

🔐 **GitHub Integration**
- Uses GitHub's REST API for secure uploads
- Supports fine-grained personal access tokens
- Customizable repository, branch, and directory path
- Direct image URLs for sharing and web viewing

💾 **Local Storage Option**
- Save images locally to your vault
- Configurable storage folder
- Relative path references for offline access

⚙️ **Flexible Configuration**
- Easy setup through settings panel
- Support for multiple repositories
- Customizable storage paths for both GitHub and local storage

## Installation

### Via Obsidian Community Plugins

1. Open Obsidian Settings → Community plugins
2. Search for "GitHub Image Uploader"
3. Click Install
4. Enable the plugin

### Manual Installation

1. Download the latest release
2. Extract to your vault's `.obsidian/plugins/github-image-uploader/` folder
3. Reload Obsidian
4. Enable the plugin in settings

## Setup Guide

### Step 1: Create a GitHub Token

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/personal-access-tokens/new)
2. Create a new fine-grained token with these permissions:
   - Repository permissions → Contents → Read and write access
3. Copy the token

### Step 2: Configure the Plugin

1. Open Obsidian Settings → GitHub Image Uploader
2. Paste your GitHub token in the "GitHub Token" field
3. Enter your GitHub username in "GitHub 用户名"
4. Enter the repository name in "仓库名称"
5. (Optional) Configure custom image storage path and branch

### Step 3: Start Uploading!

Simply paste an image into your note. A dialog will appear asking where to save the image:
- **上传到 GitHub**: Upload to your GitHub repository
- **保存到本地**: Save to your local vault
- **取消**: Cancel

## Usage

### Pasting Images

When you paste an image:

1. A confirmation dialog appears with a preview
2. Select your preferred storage option
3. The image is automatically inserted with a markdown link

### For GitHub Upload

- Images are uploaded to: `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{imagePath}/{filename}`
- Filenames are auto-generated with timestamp: `YYYY-MM-DD_HH-MM-SS_random.ext`

### For Local Storage

- Images are saved to your configured local folder
- Relative paths are used for vault portability

## Settings

### Basic

- **启用 GitHub 图床** - Toggle the image upload feature on/off

### GitHub Configuration

- **GitHub Token** - Your personal access token
- **GitHub 用户名** - Repository owner's username
- **仓库名称** - Repository name
- **图片存储目录** - Path in repository (e.g., `assets/images`)
- **目标分支** - Target branch (usually `main` or `master`)

### Local Storage

- **本地图片文件夹** - Local folder for saving images (e.g., `assets`)

## Development

### Prerequisites

- Node.js v16+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development with hot reload
npm run dev

# Build for production
npm run build
```

### Project Structure

```
.
├── main.ts                 # Plugin main file
├── github-image.ts         # GitHub upload module
├── manifest.json           # Plugin metadata
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── esbuild.config.mjs      # Build config
└── styles.css              # Plugin styles
```

## Troubleshooting

### GitHub Upload Fails

- Verify your GitHub token has correct permissions (Contents: read & write)
- Check that username and repository name are correct
- Ensure the target branch exists in your repository
- Verify network connectivity

### Images Not Showing

- For GitHub uploads: Check the image URL in the markdown link
- For local storage: Ensure the file path is correct relative to your vault

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

MIT

## Support

If you encounter any issues or have suggestions, please open an issue on the [GitHub repository](https://github.com/zhaohongxuan/obsidian-github-image-uploader).

---

Made with ❤️ by Xuan
