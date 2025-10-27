# Hide Wikilink Brackets

A simple yet powerful Obsidian plugin that hides wikilink brackets in search results, backlinks, and task lists, providing a cleaner reading experience while preserving full functionality.

## Features

- **Clean Search Results**: Automatically removes `[[` and `]]` brackets from search results
- **Smart Alias Handling**: For `[[page|alias]]` format, displays only the alias text
- **Backlinks Support**: Works in the backlinks pane
- **Tasks Plugin Integration**: Seamlessly handles wikilinks in Tasks plugin results
- **Preserves Functionality**: All links remain clickable and functional
- **Real-time Processing**: Automatically processes dynamically loaded content (e.g., "Show more context" in search)

## Examples

### Before
```
- [[2025-10-26|yesterday]] chatted with [[John|husband]] about a topic, [[acceptance]]
```

### After
```
- yesterday chatted with husband about a topic, acceptance
```

The brackets are hidden, but all links remain fully functional and clickable.

## Use Cases

Perfect for users who:
- Find brackets visually distracting in search results
- Want a cleaner reading experience in backlinks
- Use aliases extensively and prefer to see only the display text
- Work with the Tasks plugin and want cleaner task views

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Settings in Obsidian
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Hide Wikilink Brackets"
4. Click Install, then Enable

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/YOUR_GITHUB_USERNAME/obsidian-hide-wikilink-brackets/releases)
2. Extract the files to your vault's `.obsidian/plugins/hide-wikilink-brackets/` directory
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

## How It Works

The plugin uses a MutationObserver to monitor DOM changes and intelligently processes text nodes containing wikilink syntax. It:

1. Detects wikilink patterns: `[[link]]` and `[[link|alias]]`
2. Removes brackets while preserving link functionality
3. For alias format, displays only the alias text
4. Maintains all HTML structure and interactive elements

The processing is efficient and only affects display - your actual note content remains unchanged.

## Supported Areas

- ✅ Search results panel
- ✅ "Show more context" expanded content
- ✅ Backlinks pane
- ✅ Tasks plugin task lists
- ✅ Tasks plugin backlinks

## Technical Details

- **Lightweight**: Minimal performance impact
- **Non-invasive**: Doesn't modify your actual note files
- **Smart Processing**: Only processes elements containing wikilinks
- **Deduplication**: Prevents redundant processing of already-handled elements

## Compatibility

- Minimum Obsidian version: 0.15.0
- Works with both desktop and mobile versions
- Compatible with popular plugins like Tasks, Dataview, etc.

## Support

If you encounter any issues or have suggestions:

- [Report a bug](https://github.com/YOUR_GITHUB_USERNAME/obsidian-hide-wikilink-brackets/issues)
- [Request a feature](https://github.com/YOUR_GITHUB_USERNAME/obsidian-hide-wikilink-brackets/issues)

## Development

Want to contribute? Check out the [development guide](https://github.com/YOUR_GITHUB_USERNAME/obsidian-hide-wikilink-brackets/blob/main/CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Created by Ming

---

If you find this plugin helpful, consider:
- ⭐ Starring the repository on GitHub
- 📢 Sharing it with other Obsidian users
- ☕ [Buy me a coffee](https://www.buymeacoffee.com/YOUR_USERNAME) (optional)
