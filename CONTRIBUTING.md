# Contributing to Hide Wikilink Brackets

Thank you for your interest in contributing! This document provides guidelines for contributing to this plugin.

## Development Setup

1. Clone the repository to your local vault's plugins folder:
   ```bash
   cd /path/to/your/vault/.obsidian/plugins
   git clone https://github.com/YOUR_GITHUB_USERNAME/obsidian-hide-wikilink-brackets.git
   ```

2. Enable the plugin in Obsidian Settings → Community Plugins

3. Make your changes to the code

4. Test thoroughly:
   - Search with various wikilink patterns
   - Test "Show more context" functionality
   - Check backlinks pane
   - Verify Tasks plugin integration (if installed)

## Code Structure

- **main.js**: Core plugin logic with MutationObserver
- **manifest.json**: Plugin metadata
- **styles.css**: Optional CSS (currently minimal)

## Testing Guidelines

Before submitting a PR, please test:

1. **Search Results**:
   - Basic wikilinks: `[[page]]`
   - Alias format: `[[page|alias]]`
   - "Show more context" expansion

2. **Backlinks**:
   - Verify brackets are hidden
   - Links remain clickable

3. **Tasks Plugin** (if installed):
   - Task list wikilinks
   - Task backlinks

4. **Edge Cases**:
   - Nested wikilinks (if any)
   - Special characters in links
   - Performance with large search results

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Coding Standards

- Use clear variable names
- Add comments for complex logic
- Follow existing code style
- Keep functions focused and modular

## Reporting Bugs

When reporting bugs, please include:

- Obsidian version
- Plugin version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Feature Requests

Feel free to open an issue with:

- Clear description of the feature
- Use case / rationale
- Example mockups or behavior description

## Questions?

Open an issue with the "question" label.

---

Thank you for contributing! 🙏
