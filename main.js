const { Plugin } = require('obsidian');

module.exports = class HideWikilinkBracketsPlugin extends Plugin {
    async onload() {
        console.log('✓ Hide Wikilink Brackets 插件已加载');

        // 启动 MutationObserver
        this.startObserver();
    }

    onunload() {
        // 停止观察
        if (this.observer) {
            this.observer.disconnect();
        }
        console.log('Hide Wikilink Brackets 插件已卸载');
    }

    startObserver() {
        // 处理 wikilink 文本
        const processWikilinks = (text) => {
            // 处理 [[xxx|yyy]] 格式，只保留 yyy
            text = text.replace(/\[\[([^\|\]]+)\|([^\]]+)\]\]/g, '$2');
            // 处理 [[xxx]] 格式，只保留 xxx
            text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');
            return text;
        };

        // 处理所有搜索结果和反链面板元素
        const processSearchResults = () => {
            // 扩大选择范围：搜索结果 + 反链面板 + Tasks 插件
            const selectors = [
                '.search-result-file-matches span',
                '.backlink-pane .search-result-file-match span',
                '.block-language-tasks .tasks-backlink a',  // 只处理 a 标签，保留可点击性
                '.block-language-tasks .tasks-list-text'
            ];

            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);

                elements.forEach(el => {
                    // 只处理包含 [[ 的文本节点
                    if (el.textContent.includes('[[')) {
                        // 检查是否有子元素（除了文本节点）
                        const hasChildElements = Array.from(el.childNodes).some(
                            node => node.nodeType === Node.ELEMENT_NODE
                        );

                        // 如果有子元素，不直接处理，避免破坏 HTML 结构
                        if (hasChildElements) {
                            // 递归处理子元素
                            el.childNodes.forEach(node => {
                                if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('[[')) {
                                    node.textContent = processWikilinks(node.textContent);
                                }
                            });
                        } else {
                            // 叶子节点，直接处理
                            const originalText = el.textContent;
                            const processedText = processWikilinks(originalText);

                            if (processedText !== originalText) {
                                // 使用文本哈希值标记，避免重复处理相同内容
                                const textHash = this.simpleHash(originalText);
                                if (el.dataset.wikilinkHash === textHash) return;

                                el.textContent = processedText;
                                el.dataset.wikilinkHash = this.simpleHash(processedText);
                            }
                        }
                    }
                });
            });
        };

        // 使用 MutationObserver 监听 DOM 变化
        this.observer = new MutationObserver((mutations) => {
            // 检查是否有搜索结果、反链面板或 Tasks 相关的变化
            const hasRelevantChanges = mutations.some(mutation => {
                // 检查新增节点
                const hasAddedNodes = Array.from(mutation.addedNodes).some(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        return node.classList && (
                            node.classList.contains('search-result-file-matches') ||
                            node.classList.contains('backlink-pane') ||
                            node.classList.contains('block-language-tasks') ||
                            node.querySelector('.search-result-file-matches') ||
                            node.querySelector('.backlink-pane') ||
                            node.querySelector('.block-language-tasks')
                        );
                    }
                    return false;
                });

                // 检查内容变化（处理"显示更多上下文"和 Tasks 动态渲染的情况）
                const hasContentChange = mutation.type === 'childList' &&
                    mutation.target.classList && (
                        mutation.target.classList.contains('search-result-file-matches') ||
                        mutation.target.classList.contains('search-result-file-match') ||
                        mutation.target.classList.contains('block-language-tasks') ||
                        mutation.target.classList.contains('tasks-list-text')
                    );

                return hasAddedNodes || hasContentChange;
            });

            if (hasRelevantChanges) {
                // 延迟执行，确保 DOM 已完全渲染
                setTimeout(processSearchResults, 50);
            }
        });

        // 开始监听整个文档的变化
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 初始执行一次（处理已存在的搜索结果）
        setTimeout(processSearchResults, 100);
    }

    // 简单的字符串哈希函数
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }
};
