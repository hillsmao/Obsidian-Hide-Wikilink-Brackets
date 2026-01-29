const { Plugin } = require('obsidian');

module.exports = class HideWikilinkBracketsPlugin extends Plugin {
    async onload() {
        console.log('✓ Hide Wikilink Brackets 插件已加载');

        // 拦截"取消列表缩进"命令（在 Zoom 模式下限制回退到第一列）
        this.registerDomEvent(document, 'keydown', (evt) => {
            // 检测是否触发了"取消列表缩进"相关的操作
            // Obsidian 默认绑定：Shift+Tab 或 Cmd+[
            if ((evt.shiftKey && evt.key === 'Tab') ||
                ((evt.metaKey || evt.ctrlKey) && evt.key === '[')) {

                const zoomHeader = document.querySelector('.zoom-plugin-header');
                if (!zoomHeader) return; // 非 Zoom 模式，不限制

                // 获取当前光标所在行
                const activeElement = document.activeElement;
                if (!activeElement?.classList?.contains('cm-content')) return;

                const selection = window.getSelection();
                if (!selection.rangeCount) return;

                const range = selection.getRangeAt(0);
                let currentLine = range.startContainer;

                // 向上查找 .cm-line 元素
                while (currentLine && !currentLine.classList?.contains('cm-line')) {
                    currentLine = currentLine.parentElement;
                }

                if (!currentLine) return;

                // 检查当前行的层级
                const levelMatch = currentLine.className.match(/HyperMD-list-line-(\d+)/);
                if (!levelMatch) return;

                const currentLevel = parseInt(levelMatch[1]);
                const zoomLevel = this.getCurrentZoomLevel();

                // 如果当前层级等于聚焦层级+1（即相对第2层），阻止继续回退
                if (zoomLevel !== null && currentLevel === zoomLevel + 1) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    evt.stopImmediatePropagation(); // 阻止所有后续监听器
                    console.log('✗ Zoom 模式下不允许回退到第一列');
                }
            }
        }, { capture: true }); // 使用捕获阶段，确保最先拦截

        // 启动 MutationObserver
        this.startObserver();
    }

    // 获取当前 Zoom 聚焦层级
    getCurrentZoomLevel() {
        const zoomHeader = document.querySelector('.zoom-plugin-header');
        if (!zoomHeader) return null;

        const firstVisibleListLine = document.querySelector('.cm-content .cm-line.HyperMD-list-line');
        if (!firstVisibleListLine) return null;

        const levelMatch = firstVisibleListLine.className.match(/HyperMD-list-line-(\d+)/);
        return levelMatch ? parseInt(levelMatch[1]) : null;
    }

    onunload() {
        // 停止观察
        if (this.observer) {
            this.observer.disconnect();
        }
        console.log('Hide Wikilink Brackets 插件已卸载');
    }

    startObserver() {
        // 标志位：标记是否需要滚动（只在聚焦或面包屑点击时为 true）
        let shouldScrollToTop = false;
        // 标志位：标记是否是通过面包屑点击（需要移动光标）
        let isBreadcrumbClick = false;
        // 缓存 Zoom 聚焦的层级（避免滚动时重复检测导致层级跳变）
        let cachedZoomLevel = null;

        // 检测文本是否包含需要处理的格式符号
        const hasFormatting = (text) => {
            return text.includes('[[') ||   // wikilink
                   text.includes('**') ||   // 加粗
                   text.includes('__') ||   // 加粗
                   text.includes('==') ||   // 高亮
                   text.includes('~~') ||   // 删除线
                   text.includes('`') ||    // inline-code
                   text.includes('*') ||    // 斜体
                   text.includes('_') ||    // 斜体
                   text.includes('#');      // 标签
        };

        // 处理面包屑中的格式符号（wikilink、文本样式、标签等）
        const processFormatting = (text) => {
            // 1. 处理 wikilink
            // 处理 [[xxx|yyy]] 格式，只保留 yyy
            text = text.replace(/\[\[([^\|\]]+)\|([^\]]+)\]\]/g, '$2');
            // 处理 [[xxx]] 格式，只保留 xxx
            text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');
            // 处理 Zoom 面包屑中的待办标记 [ ] 和 [x]
            text = text.replace(/^\s*\[[\sx]\]\s*/g, '');

            // 2. 处理文本样式符号（保留内容，隐藏符号）
            // 先处理多字符符号，避免被单字符误匹配

            // 加粗（两种格式）
            text = text.replace(/\*\*([^*]+?)\*\*/g, '$1');  // **text**
            text = text.replace(/__([^_]+?)__/g, '$1');      // __text__

            // 高亮
            text = text.replace(/==([^=]+?)==/g, '$1');      // ==text==

            // 删除线
            text = text.replace(/~~([^~]+?)~~/g, '$1');      // ~~text~~

            // 再处理单字符符号

            // inline-code（需要在斜体之前处理，避免误匹配）
            text = text.replace(/`([^`]+?)`/g, '$1');        // `text`

            // 斜体（两种格式）
            // 使用非贪婪匹配，避免跨越多个斜体块
            text = text.replace(/\*([^*]+?)\*/g, '$1');      // *text*
            text = text.replace(/\b_([^_]+?)_\b/g, '$1');    // _text_（添加单词边界，避免匹配文件名中的下划线）

            // 3. 隐藏标签（完全移除）
            // 匹配 #tag、#notes/tasks/问题 等格式
            // 支持：字母、数字、下划线、横线、斜杠、中文字符
            text = text.replace(/#[\w/\-\u4e00-\u9fa5]+/g, '');

            // 清理可能产生的多余空格
            text = text.replace(/\s{2,}/g, ' ').trim();

            return text;
        };

        // 移动光标到指定行的末尾
        const moveCursorToLineEnd = (lineElement) => {
            if (!lineElement) return;

            // 使用 TreeWalker 找到行内最后一个文本节点
            const walker = document.createTreeWalker(
                lineElement,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let lastTextNode = null;
            while (walker.nextNode()) {
                const node = walker.currentNode;
                // 跳过空白文本节点
                if (node.textContent.trim().length > 0) {
                    lastTextNode = node;
                }
            }

            if (lastTextNode) {
                try {
                    const range = document.createRange();
                    range.setStart(lastTextNode, lastTextNode.length);
                    range.collapse(true);

                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);

                    // 确保编辑器容器获得焦点
                    const cmContent = document.querySelector('.cm-content');
                    if (cmContent) {
                        cmContent.focus();
                    }

                    console.log('✓ 光标已移动到第一行末尾');
                } catch (e) {
                    console.error('移动光标失败:', e);
                }
            }
        };

        // 应用 Zoom 缩进样式（隐藏占位符 + 强制覆盖缩进值）
        const applyZoomStyles = (zoomLevel) => {
            // 移除旧的动态样式
            const oldStyle = document.getElementById('zoom-dynamic-styles');
            if (oldStyle) oldStyle.remove();

            // 创建新的样式表
            const style = document.createElement('style');
            style.id = 'zoom-dynamic-styles';

            let css = '';

            // 1. 隐藏竖线占位符（隐藏前 N-1 个）
            const hideCount = zoomLevel - 1;
            if (hideCount > 0) {
                css += `
body.zoom-level-${zoomLevel} .cm-hmd-list-indent .cm-indent:nth-child(-n+${hideCount}) {
    display: none !important;
}
`;
            }

            // 2. 强制覆盖所有层级的 text-indent 和 padding
            // 策略：根据列表类型（无序/有序/任务）使用不同的硬编码值

            // 定义四种列表类型的基础缩进值
            const listTypeStyles = {
                // 无序列表：基础 -23px, 增量 32px
                unordered: {
                    base: { textIndent: -23, padding: 23 },
                    unit: 32
                },
                // 任务列表：基础 -32px（相对无序列表 +9px，checkbox 比 bullet 宽）
                task: {
                    base: { textIndent: -32, padding: 32 },
                    unit: 32
                },
                // 有序列表（个位数）：基础 -30px, 增量 32px
                ordered1: {
                    base: { textIndent: -30, padding: 30 },
                    unit: 32
                },
                // 有序列表（两位数）：基础 -40px, 增量 32px
                ordered2: {
                    base: { textIndent: -40, padding: 40 },
                    unit: 32
                }
            };

            // 检测当前行的列表类型
            const getListType = (line) => {
                if (!line) return 'unordered';

                const classes = line.className;

                // 优先检查有序列表（如果既是有序又是 task，保持为有序）
                const listMarker = line.querySelector('.cm-formatting-list-ol');
                if (listMarker) {
                    // 检查序号位数（通过文本内容判断）
                    const markerText = listMarker.textContent;
                    const number = parseInt(markerText);
                    if (number >= 10) {
                        return 'ordered2'; // 两位数
                    }
                    return 'ordered1'; // 个位数
                }

                // 检查是否是 task list（仅当不是有序列表时）
                if (classes.includes('HyperMD-task-line') ||
                    classes.includes('task-list-item') ||
                    line.querySelector('.task-list-marker') ||
                    line.querySelector('.cm-formatting-task')) {
                    return 'task';
                }

                return 'unordered';
            };

            // 生成从聚焦层级到后续50层的样式覆盖规则
            for (let currentLevel = zoomLevel; currentLevel <= zoomLevel + 50; currentLevel++) {
                const targetLevel = currentLevel - zoomLevel + 1; // 映射到新层级

                // ⚠️ 关键修正：检测当前行的列表类型（保持自己的类型身份）
                // 例如：第9行有"99."应该检测为ordered2，使用-40px/40px基础值
                // 但缩进偏移量使用targetLevel计算
                const currentLine = document.querySelector(`.HyperMD-list-line-${currentLevel}`);
                const listType = getListType(currentLine);
                const styleConfig = listTypeStyles[listType];

                // 计算目标层级的缩进值
                const targetIndent = styleConfig.base.textIndent - (targetLevel - 1) * styleConfig.unit;
                const targetPadding = styleConfig.base.padding + (targetLevel - 1) * styleConfig.unit;

                css += `
body.zoom-level-${zoomLevel} .HyperMD-list-line-${currentLevel} {
    text-indent: ${targetIndent}px !important;
    padding-inline-start: ${targetPadding}px !important;
}
`;
            }

            style.textContent = css;
            document.head.appendChild(style);

            console.log(`✓ Zoom 样式已应用：层级 ${zoomLevel}，隐藏 ${hideCount} 个占位符`);
        };

        // 检测 Zoom 视图的第一个可见列表项层级
        const detectZoomLevel = (forceUpdate = false) => {
            const zoomHeader = document.querySelector('.zoom-plugin-header');

            if (!zoomHeader) {
                // 没有 Zoom 视图，清除缓存和所有 zoom-level-* 类
                cachedZoomLevel = null;
                document.body.classList.forEach(cls => {
                    if (cls.startsWith('zoom-level-')) {
                        document.body.classList.remove(cls);
                    }
                });
                // 移除动态样式
                const dynamicStyle = document.getElementById('zoom-dynamic-styles');
                if (dynamicStyle) dynamicStyle.remove();
                return;
            }

            // 如果已有缓存且不是强制更新，直接使用缓存（避免滚动时重新检测）
            if (cachedZoomLevel !== null && !forceUpdate) {
                console.log(`✓ 使用缓存层级: ${cachedZoomLevel}`);
                return;
            }

            // 查找第一个真正可见的列表项（排除隐藏元素）
            const allListLines = document.querySelectorAll('.cm-content .cm-line.HyperMD-list-line');
            let firstVisibleListLine = null;

            for (const line of allListLines) {
                // 检查元素是否可见（offsetParent 为 null 表示元素或其父元素被隐藏）
                if (line.offsetParent !== null) {
                    firstVisibleListLine = line;
                    break;
                }
            }

            if (!firstVisibleListLine) return;

            // 从 class 中提取层级数（HyperMD-list-line-3 → 3）
            const levelMatch = firstVisibleListLine.className.match(/HyperMD-list-line-(\d+)/);

            if (levelMatch) {
                const level = parseInt(levelMatch[1]);

                // 缓存层级
                cachedZoomLevel = level;

                // 移除旧的 zoom-level-* 类
                document.body.classList.forEach(cls => {
                    if (cls.startsWith('zoom-level-')) {
                        document.body.classList.remove(cls);
                    }
                });

                // 添加新的层级类
                document.body.classList.add(`zoom-level-${level}`);

                // 应用动态样式（隐藏占位符）
                applyZoomStyles(level);

                console.log(`✓ Zoom 聚焦层级: ${level}${forceUpdate ? ' (强制更新)' : ''}`);

                // 只在需要滚动时才执行（避免普通编辑时误触发）
                if (shouldScrollToTop) {
                    // 修正滚动位置：滚动到第一个可见列表项（而不是光标所在的行尾）
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            firstVisibleListLine.scrollIntoView({
                                behavior: 'auto',  // 立即跳转，无动画
                                block: 'start'     // 对齐到视口顶部
                            });

                            // 如果是面包屑点击，移动光标到第一行末尾
                            if (isBreadcrumbClick) {
                                setTimeout(() => {
                                    moveCursorToLineEnd(firstVisibleListLine);
                                    // 重置标志位
                                    isBreadcrumbClick = false;
                                }, 50);
                            }

                            // 滚动完成后重置标志位
                            shouldScrollToTop = false;
                        });
                    });
                }
            }
        };

        // 处理所有搜索结果和反链面板元素
        const processSearchResults = () => {
            // 扩大选择范围：搜索结果 + 反链面板 + Tasks 插件 + Zoom 插件
            const selectors = [
                '.search-result-file-matches span',
                '.backlink-pane .search-result-file-match span',
                '.block-language-tasks .tasks-backlink a',  // 只处理 a 标签，保留可点击性
                '.block-language-tasks .tasks-list-text',
                '.zoom-plugin-title'  // Zoom 插件面包屑导航
            ];

            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);

                elements.forEach(el => {
                    // Zoom 面包屑需要特殊处理（总是处理，因为可能包含各种格式符号）
                    const isZoomTitle = el.classList.contains('zoom-plugin-title');

                    // 只处理包含格式符号的文本节点，或者是 Zoom 标题
                    if (hasFormatting(el.textContent) || isZoomTitle) {
                        // 检查是否有子元素（除了文本节点）
                        const hasChildElements = Array.from(el.childNodes).some(
                            node => node.nodeType === Node.ELEMENT_NODE
                        );

                        // 如果有子元素，不直接处理，避免破坏 HTML 结构
                        if (hasChildElements) {
                            // 递归处理子元素
                            el.childNodes.forEach(node => {
                                if (node.nodeType === Node.TEXT_NODE && (hasFormatting(node.textContent) || isZoomTitle)) {
                                    node.textContent = processFormatting(node.textContent);
                                }
                            });
                        } else {
                            // 叶子节点，直接处理
                            const originalText = el.textContent;
                            const processedText = processFormatting(originalText);

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

        // 监听 bullet 和面包屑点击事件
        const setupClickHandlers = () => {
            document.addEventListener('click', (e) => {
                // 检查是否点击了 bullet（触发 Zoom 聚焦）
                if (e.target && e.target.classList &&
                    (e.target.classList.contains('list-bullet') ||
                     e.target.classList.contains('cm-formatting-list'))) {
                    // 标记需要滚动
                    shouldScrollToTop = true;
                    // 清除缓存，强制重新检测层级
                    cachedZoomLevel = null;
                }

                // 检查是否点击了面包屑
                if (e.target && e.target.classList && e.target.classList.contains('zoom-plugin-title')) {
                    // 标记需要滚动
                    shouldScrollToTop = true;
                    // 标记是面包屑点击（需要移动光标）
                    isBreadcrumbClick = true;
                    // 清除缓存，强制重新检测层级
                    cachedZoomLevel = null;
                }
            }, true);  // 使用捕获阶段，确保能捕获到事件
        };

        // 监听快捷键：Cmd+. 和 Cmd+Shift+.
        const setupZoomShortcuts = () => {
            document.addEventListener('keydown', (e) => {
                // Cmd+. (Mac) 或 Ctrl+. (Windows/Linux) - zoom in（聚焦）
                if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === '.') {
                    // 检查是否在 Zoom 模式下
                    const zoomHeader = document.querySelector('.zoom-plugin-header');
                    if (zoomHeader) {
                        // 标记需要滚动（Zoom 插件会处理实际的 zoom in 操作）
                        shouldScrollToTop = true;
                        // 清除缓存，强制重新检测层级
                        cachedZoomLevel = null;
                        console.log('✓ 快捷键 zoom in，准备滚动');
                    }
                }

                // Cmd+Shift+. (Mac) 或 Ctrl+Shift+. (Windows/Linux) - zoom out（层层向上）
                if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '.') {
                    e.preventDefault();  // 阻止默认行为

                    // 查找面包屑容器
                    const breadcrumbs = document.querySelectorAll('.zoom-plugin-title');

                    if (breadcrumbs.length >= 2) {
                        // 点击倒数第二个面包屑（上一级）
                        const parentLevel = breadcrumbs[breadcrumbs.length - 2];

                        // 标记需要滚动
                        shouldScrollToTop = true;
                        // 清除缓存，强制重新检测层级
                        cachedZoomLevel = null;

                        // 模拟点击
                        parentLevel.click();

                        console.log('✓ 快捷键 zoom out');
                    } else {
                        console.log('✗ 已经在顶层，无法继续向上');
                    }
                }
            }, true);
        };

        // 启动 bullet 和面包屑点击监听
        setupClickHandlers();

        // 启动快捷键监听
        setupZoomShortcuts();

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
                            node.classList.contains('zoom-plugin-header') ||
                            node.querySelector('.search-result-file-matches') ||
                            node.querySelector('.backlink-pane') ||
                            node.querySelector('.block-language-tasks') ||
                            node.querySelector('.zoom-plugin-header')
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
                        mutation.target.classList.contains('tasks-list-text') ||
                        mutation.target.classList.contains('zoom-plugin-header')
                    );

                return hasAddedNodes || hasContentChange;
            });

            // 检查是否有 .cm-line 的 class 变化（列表类型切换，如 - item → 1. item → - [ ] item）
            const hasListTypeChange = mutations.some(mutation => {
                if (mutation.type === 'attributes' &&
                    mutation.target.classList?.contains('cm-line') &&
                    mutation.attributeName === 'class') {
                    // 检查是否在 Zoom 模式下
                    return document.querySelector('.zoom-plugin-header') !== null;
                }
                return false;
            });

            // 检查是否有编辑器内容变化（滚动、折叠等）
            const hasEditorScrollChange = mutations.some(mutation => {
                if (mutation.type === 'childList' && mutation.target.classList) {
                    if (mutation.target.classList.contains('cm-content') ||
                        mutation.target.classList.contains('cm-contentContainer')) {
                        return true;
                    }
                }
                return false;
            });

            if (hasRelevantChanges) {
                // 延迟执行，确保 DOM 已完全渲染
                setTimeout(processSearchResults, 50);

                // 检测 Zoom 层级变化（首次检测或强制更新）
                setTimeout(() => detectZoomLevel(true), 100);
            }

            // 列表类型切换时，强制重新生成样式（不使用缓存层级）
            if (hasListTypeChange) {
                const zoomHeader = document.querySelector('.zoom-plugin-header');
                if (zoomHeader) {
                    // 提取当前层级
                    const bodyClasses = Array.from(document.body.classList);
                    const zoomLevelClass = bodyClasses.find(cls => cls.startsWith('zoom-level-'));
                    if (zoomLevelClass) {
                        const level = parseInt(zoomLevelClass.replace('zoom-level-', ''));
                        // 直接重新应用样式（跳过层级检测，避免滚动）
                        setTimeout(() => applyZoomStyles(level), 50);
                        console.log(`✓ 列表类型切换，重新应用样式：层级 ${level}`);
                    }
                }
            }

            // 编辑器滚动时，使用缓存层级（不重新检测，避免层级跳变）
            if (hasEditorScrollChange && !hasListTypeChange) {
                setTimeout(() => detectZoomLevel(false), 50);
            }
        });

        // 开始监听整个文档的变化
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,  // 监听属性变化（如 class 变化）
            attributeFilter: ['class']  // 只监听 class 属性
        });

        // 初始执行一次（处理已存在的搜索结果）
        setTimeout(processSearchResults, 100);

        // 初始检测 Zoom 层级
        setTimeout(detectZoomLevel, 150);
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
