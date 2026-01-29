# Release Checklist

发布到 Obsidian 官方插件市场的完整清单

## ✅ 准备阶段（已完成）

- [x] 创建插件核心文件
  - [x] main.js
  - [x] manifest.json
  - [x] styles.css
- [x] 创建文档文件
  - [x] README.md
  - [x] LICENSE
  - [x] CONTRIBUTING.md
  - [x] versions.json
  - [x] .gitignore

## 📝 下一步：GitHub 发布

### 1. 创建 GitHub 仓库
- [ ] 登录 GitHub
- [ ] 创建新仓库，命名: `obsidian-hide-wikilink-brackets`
- [ ] 设置为 Public（公开）
- [ ] 不要勾选 "Initialize with README"（我们已经有了）

### 2. 上传代码到 GitHub

```bash
cd /Users/min/Downloads/Ming-Digital-Garden/15-OB-Plugin/01-hide-wikilink-brackets

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial release v1.0.0"

# 关联远程仓库（替换 YOUR_GITHUB_USERNAME）
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/obsidian-hide-wikilink-brackets.git

# 推送
git branch -M main
git push -u origin main
```

### 3. 创建 GitHub Release
- [ ] 在 GitHub 仓库页面，点击 "Releases" → "Create a new release"
- [ ] Tag version: `1.0.0`
- [ ] Release title: `v1.0.0 - Initial Release`
- [ ] 描述：复制粘贴下面的内容

```markdown
## 🎉 Initial Release

Hide Wikilink Brackets - A clean reading experience for Obsidian

### Features
- ✅ Hides `[[` and `]]` brackets in search results
- ✅ Shows only alias text for `[[page|alias]]` format
- ✅ Supports backlinks pane
- ✅ Works with Tasks plugin
- ✅ Preserves all link functionality

### Installation
Download `main.js`, `manifest.json`, and `styles.css` and place them in your vault's `.obsidian/plugins/hide-wikilink-brackets/` directory.

Or wait for official release in Community Plugins! 🚀
```

- [ ] 上传文件作为 release assets：
  - [ ] main.js
  - [ ] manifest.json
  - [ ] styles.css

### 4. 更新 README 中的链接
- [ ] 替换 README.md 中的 `YOUR_GITHUB_USERNAME` 为你的 GitHub 用户名
- [ ] 提交并推送更新

## 🚀 提交到 Obsidian 官方

### 5. Fork obsidian-releases 仓库
- [ ] 访问 https://github.com/obsidianmd/obsidian-releases
- [ ] 点击 "Fork" 按钮

### 6. 添加你的插件
- [ ] 在你 fork 的仓库中，编辑 `community-plugins.json`
- [ ] 在文件末尾（最后一个插件后面）添加：

```json
{
  "id": "hide-wikilink-brackets",
  "name": "Hide Wikilink Brackets",
  "author": "Ming",
  "description": "Hides wikilink brackets in search results, backlinks, and task lists for a cleaner reading experience",
  "repo": "YOUR_GITHUB_USERNAME/obsidian-hide-wikilink-brackets"
}
```

- [ ] 提交更改

### 7. 创建 Pull Request
- [ ] 在你 fork 的仓库中，点击 "Contribute" → "Open pull request"
- [ ] 标题: `Add Hide Wikilink Brackets plugin`
- [ ] 描述中说明插件功能
- [ ] 提交 PR

### 8. 等待审核
- [ ] Obsidian 团队会审核你的 PR（通常需要几天到几周）
- [ ] 可能会有反馈或修改要求
- [ ] 批准后，插件会出现在社区插件市场

## 🎯 审核通过后

- [ ] 在 README 中更新安装说明（移除 "wait for official release"）
- [ ] 庆祝！🎉

## 📌 注意事项

1. **GitHub 用户名**：记得把所有 `YOUR_GITHUB_USERNAME` 替换成你的实际用户名
2. **Buy Me a Coffee**：如果不需要打赏，可以删除 README 中的相关内容
3. **版本更新**：未来更新时，记得同步更新：
   - manifest.json 的 version
   - versions.json 添加新版本
   - 创建新的 GitHub Release

## 🆘 需要帮助？

如果遇到问题，随时问我！我可以帮你：
- 调试代码问题
- 优化文档内容
- 处理 GitHub 操作
- 回应审核反馈

---

**当前状态**: 准备阶段完成 ✅
**下一步**: 创建 GitHub 仓库并上传代码
