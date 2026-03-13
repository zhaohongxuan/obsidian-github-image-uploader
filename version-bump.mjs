#!/usr/bin/env node

/**
 * Version Bump Script
 * 自动更新版本号到 manifest.json 和 versions.json
 * 
 * 用法: npm version patch|minor|major
 * 或: node version-bump.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const targetVersion = process.env.npm_package_version;

if (!targetVersion) {
  console.error("❌ 错误: npm_package_version 环境变量未设置");
  process.exit(1);
}

try {
  // 读取并更新 manifest.json
  console.log("📝 更新 manifest.json...");
  let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
  const { minAppVersion } = manifest;
  manifest.version = targetVersion;
  writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
  console.log(`✅ manifest.json: ${manifest.version}`);

  // 读取并更新 versions.json
  console.log("📝 更新 versions.json...");
  let versions = JSON.parse(readFileSync("versions.json", "utf8"));
  versions[targetVersion] = minAppVersion;
  writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
  console.log(`✅ versions.json: 添加版本 ${targetVersion} (min: ${minAppVersion})`);

  // 显示成功信息
  console.log("\n✨ 版本更新完成！");
  console.log(`📦 新版本: ${targetVersion}`);
  console.log(`🔧 最小 Obsidian 版本: ${minAppVersion}`);
} catch (error) {
  console.error("❌ 版本更新失败:", error.message);
  process.exit(1);
}
