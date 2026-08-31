
// ─── IndexedDB ─────────────────────────────────────────────────────────────
const _DB_NAME = 'scribouillart_db';
const _DB_VERSION = 1;
const _DB_STORE = 'articles';
let _db = null;

function _openDB() {
    return new Promise((resolve, reject) => {
        if (_db) { resolve(_db); return; }
        const req = indexedDB.open(_DB_NAME, _DB_VERSION);
        req.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains(_DB_STORE)) {
                database.createObjectStore(_DB_STORE, { keyPath: 'id' });
            }
        };
        req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
        req.onerror = () => reject(req.error);
    });
}

function _sortArticlesForDisplay(articles) {
    return [...articles].sort((a, b) => {
        const leftOrder = Number.isFinite(a.sortOrder) ? a.sortOrder : null;
        const rightOrder = Number.isFinite(b.sortOrder) ? b.sortOrder : null;

        if (leftOrder === null && rightOrder === null) {
            return b.id - a.id;
        }
        if (leftOrder === null) {
            return 1;
        }
        if (rightOrder === null) {
            return -1;
        }
        if (rightOrder !== leftOrder) {
            return rightOrder - leftOrder;
        }
        return b.id - a.id;
    });
}

async function _normalizeArticleOrder(articles) {
    const sortedArticles = _sortArticlesForDisplay(articles);
    const normalizedArticles = sortedArticles.map((article, index) => ({
        ...article,
        sortOrder: sortedArticles.length - index
    }));

    const needsNormalization = normalizedArticles.some((article, index) => {
        const original = sortedArticles[index];
        return original.sortOrder !== article.sortOrder;
    });

    if (!needsNormalization) {
        return sortedArticles;
    }

    await Promise.all(normalizedArticles.map(article => _dbPut(article)));
    return normalizedArticles;
}

async function _dbGetAll() {
    const db = await _openDB();
    const articles = await new Promise((resolve, reject) => {
        const req = db.transaction(_DB_STORE, 'readonly').objectStore(_DB_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    return _normalizeArticleOrder(articles);
}

function _dbPut(article) {
    return _openDB().then(db => new Promise((resolve, reject) => {
        const req = db.transaction(_DB_STORE, 'readwrite').objectStore(_DB_STORE).put(article);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    }));
}

function _dbDelete(id) {
    return _openDB().then(db => new Promise((resolve, reject) => {
        const req = db.transaction(_DB_STORE, 'readwrite').objectStore(_DB_STORE).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    }));
}

async function _migrateFromLocalStorage() {
    try {
        const stored = localStorage.getItem('scribouillart_articles');
        if (!stored) return;
        const articles = JSON.parse(stored);
        if (!articles || articles.length === 0) return;
        for (const article of articles) { await _dbPut(article); }
        localStorage.removeItem('scribouillart_articles');
        console.log(`Migration : ${articles.length} article(s) migré(s) vers IndexedDB`);
    } catch (e) {
        console.warn('Migration localStorage → IndexedDB échouée', e);
    }
}

// Initialiser l'éditeur
initEditor();

async function initEditor() {
    const editor = document.getElementById('editor');
    const articleSubject = document.getElementById('articleSubject');
    const linkBtn = document.getElementById('linkBtn');
    const unlinkBtn = document.getElementById('unlinkBtn');
    const imageBtn = document.getElementById('imageBtn');
    const sourceBtn = document.getElementById('sourceBtn');
    const organizeToolbarBtn = document.getElementById('organizeToolbarBtn');
    const saveBtn = document.getElementById('saveBtn');
    const saveAsBtn = document.getElementById('saveAsBtn');
    const addBtn = document.getElementById('addBtn');
    const loadBtn = document.getElementById('loadBtn');
    const newArticleBtn = document.getElementById('newArticleBtn');
    const articlesList = document.getElementById('articlesList');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const navModeSun = document.querySelector('.nav-mode-sun');
    const navModeMoon = document.querySelector('.nav-mode-moon');
    const cardSearchInput = document.getElementById('cardSearchInput');
    const bottomTabs = document.querySelectorAll('.bottom-tab');
    const formatSelect = document.getElementById('formatSelect');
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsList = document.getElementById('searchResultsList');
    const cardsScreenList = document.getElementById('cardsScreenList');
    const toolbarSearchInput = document.getElementById('toolbarSearchInput');
    const toolbarSearchBtn = document.getElementById('toolbarSearchBtn');
    const toolbarToggleBtn = document.getElementById('toolbarToggleBtn');
    const textColor = document.getElementById('textColor');
    const bgColor = document.getElementById('bgColor');
        const textColorBtn = document.getElementById('textColorBtn');
        const bgColorBtn = document.getElementById('bgColorBtn');
    const youtubeToggle = document.getElementById('youtubeToggle');

    let currentArticleId = null;
    let isSourceMode = false;
    let hasUnsavedChanges = false;
    let draggedArticleId = null;
        let savedEditorSelection = null;

    // Charger le contenu sauvegardé au démarrage
    loadFromLocalStorage();

    // Ouvrir IndexedDB et migrer les données existantes
    await _openDB();
    await _migrateFromLocalStorage();

    // Afficher la liste des articles
    await refreshArticlesList();

    // Charger la préférence du mode nuit
    loadDarkModePreference();

    function getToolbarOrder() {
        const toolbar = document.querySelector('.editor-toolbar');
        if (!toolbar) return [];

        return Array.from(toolbar.querySelectorAll('.toolbar-btn:not(#organizeToolbarBtn)'))
            .map(btn => btn.id || btn.dataset.command)
            .filter(Boolean);
    }

    function saveToolbarOrder() {
        localStorage.setItem('textToolbarOrder', JSON.stringify(getToolbarOrder()));
    }

    function applySavedToolbarOrder() {
        const toolbar = document.querySelector('.editor-toolbar');
        if (!toolbar) return;

        const savedOrder = JSON.parse(localStorage.getItem('textToolbarOrder') || '[]');
        if (!Array.isArray(savedOrder) || savedOrder.length === 0) return;

        const draggableButtons = Array.from(toolbar.querySelectorAll('.toolbar-btn:not(#organizeToolbarBtn)'));
        const keyMap = new Map(draggableButtons.map(btn => [(btn.id || btn.dataset.command), btn]));

        const orderedButtons = [];
        savedOrder.forEach(key => {
            const btn = keyMap.get(key);
            if (btn) {
                orderedButtons.push(btn);
            }
        });

        draggableButtons.forEach(btn => {
            if (!orderedButtons.includes(btn)) {
                orderedButtons.push(btn);
            }
        });

        const orderedNodes = [];
        let buttonIndex = 0;
        Array.from(toolbar.children).forEach(child => {
            if (child.classList && child.classList.contains('toolbar-btn') && child.id !== 'organizeToolbarBtn') {
                orderedNodes.push(orderedButtons[buttonIndex]);
                buttonIndex += 1;
            } else {
                orderedNodes.push(child);
            }
        });

        while (toolbar.firstChild) {
            toolbar.removeChild(toolbar.firstChild);
        }

        orderedNodes.forEach(node => toolbar.appendChild(node));
    }

    function setToolbarOrganizeMode(enabled) {
        const draggableButtons = document.querySelectorAll('.editor-toolbar .toolbar-btn:not(#organizeToolbarBtn)');
        draggableButtons.forEach(btn => {
            btn.draggable = enabled;
            btn.classList.toggle('toolbar-reorderable', enabled);
        });

        if (organizeToolbarBtn) {
            organizeToolbarBtn.classList.toggle('active', enabled);
            organizeToolbarBtn.setAttribute('aria-pressed', String(enabled));
        }
    }

    if (organizeToolbarBtn) {
        organizeToolbarBtn.addEventListener('click', () => {
            const isEnabled = organizeToolbarBtn.classList.contains('active');
            setToolbarOrganizeMode(!isEnabled);
        });

        organizeToolbarBtn.setAttribute('aria-pressed', 'false');
    }

    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
        let dragState = null;

        const isScrollbarInteraction = (event) => {
            const rect = toolbar.getBoundingClientRect();
            const nearBottomEdge = toolbar.scrollWidth > toolbar.clientWidth && event.clientY >= rect.bottom - 14;
            const nearRightEdge = toolbar.scrollHeight > toolbar.clientHeight && event.clientX >= rect.right - 14;
            return nearBottomEdge || nearRightEdge;
        };

        toolbar.addEventListener('pointerdown', (event) => {
            if (isScrollbarInteraction(event)) {
                return;
            }

            if (event.target.closest('.toolbar-btn, .toolbar-select, input, button, select')) {
                return;
            }

            if (toolbar.classList.contains('is-dragging')) {
                return;
            }

            const editorWrapper = toolbar.closest('.editor-wrapper');
            if (!editorWrapper) return;

            const rect = toolbar.getBoundingClientRect();
            const wrapperRect = editorWrapper.getBoundingClientRect();

            dragState = {
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
                wrapperRect,
                originLeft: rect.left - wrapperRect.left,
                originTop: rect.top - wrapperRect.top
            };

            toolbar.setPointerCapture?.(event.pointerId);
            toolbar.classList.add('is-dragging');
            toolbar.style.position = 'absolute';
            toolbar.style.left = `${dragState.originLeft}px`;
            toolbar.style.top = `${dragState.originTop}px`;
            toolbar.style.width = `${rect.width}px`;
        });

        toolbar.addEventListener('pointermove', (event) => {
            if (!dragState || !toolbar.classList.contains('is-dragging')) {
                return;
            }

            const editorWrapper = toolbar.closest('.editor-wrapper');
            if (!editorWrapper) return;

            const wrapperRect = editorWrapper.getBoundingClientRect();
            const clampedLeft = Math.min(
                Math.max(event.clientX - wrapperRect.left - dragState.offsetX, 0),
                wrapperRect.width - toolbar.offsetWidth
            );
            const clampedTop = Math.min(
                Math.max(event.clientY - wrapperRect.top - dragState.offsetY, 0),
                wrapperRect.height - toolbar.offsetHeight
            );

            toolbar.style.left = `${clampedLeft}px`;
            toolbar.style.top = `${clampedTop}px`;
        });

        toolbar.addEventListener('pointerup', () => {
            if (!dragState) return;
            toolbar.classList.remove('is-dragging');
            toolbar.style.position = '';
            toolbar.style.left = '';
            toolbar.style.top = '';
            toolbar.style.width = '';
            dragState = null;
        });

        toolbar.addEventListener('pointerleave', () => {
            if (dragState && toolbar.classList.contains('is-dragging')) {
                toolbar.classList.remove('is-dragging');
                toolbar.style.position = '';
                toolbar.style.left = '';
                toolbar.style.top = '';
                toolbar.style.width = '';
                dragState = null;
            }
        });
    }

    const toolbarReorderableButtons = document.querySelectorAll('.editor-toolbar .toolbar-btn:not(#organizeToolbarBtn)');
    toolbarReorderableButtons.forEach(btn => {
        btn.addEventListener('dragstart', (event) => {
            if (!organizeToolbarBtn || !organizeToolbarBtn.classList.contains('active')) {
                return;
            }

            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', btn.id || btn.dataset.command || '');
            }
            btn.classList.add('toolbar-dragging');
        });

        btn.addEventListener('dragover', (event) => {
            if (!organizeToolbarBtn || !organizeToolbarBtn.classList.contains('active')) {
                return;
            }
            event.preventDefault();
        });

        btn.addEventListener('drop', (event) => {
            if (!organizeToolbarBtn || !organizeToolbarBtn.classList.contains('active')) {
                return;
            }

            event.preventDefault();
            const draggedBtn = document.querySelector('.toolbar-dragging');
            if (!draggedBtn || draggedBtn === btn) {
                return;
            }

            const toolbar = btn.closest('.editor-toolbar');
            if (!toolbar) return;

            const targetRect = btn.getBoundingClientRect();
            const shouldInsertAfter = event.clientX > targetRect.left + (targetRect.width / 2);

            if (shouldInsertAfter) {
                toolbar.insertBefore(draggedBtn, btn.nextSibling);
            } else {
                toolbar.insertBefore(draggedBtn, btn);
            }

            draggedBtn.classList.remove('toolbar-dragging');
            saveToolbarOrder();
        });

        btn.addEventListener('dragend', () => {
            btn.classList.remove('toolbar-dragging');
        });
    });

    applySavedToolbarOrder();

    // ─── Utilitaires pour l'import de fichiers texte ──────────────────────
    function escapeHtml(text) {
        return (text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Convertir le XML d'un fichier .odt en HTML simple (paragraphes / titres)
    function convertOdtXmlToHtml(xmlString) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

            const officeNs = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0';
            const textNs   = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';

            const officeText = xmlDoc.getElementsByTagNameNS(officeNs, 'text')[0] || xmlDoc.documentElement;
            if (!officeText) return '<p>(Aucun contenu lisible dans ce fichier .odt)</p>';

            const parts = [];

            function handleElement(el) {
                const local = el.localName;
                const rawText = (el.textContent || '').trim();
                if (!rawText) return;
                const safeText = escapeHtml(rawText);

                if (local === 'h') {
                    const lvlAttr = el.getAttribute('text:outline-level') || el.getAttribute('outline-level') || '1';
                    let level = parseInt(lvlAttr, 10);
                    if (!level || level < 1) level = 1;
                    if (level > 6) level = 6;
                    parts.push(`<h${level}>${safeText}</h${level}>`);
                } else if (local === 'p') {
                    parts.push(`<p>${safeText}</p>`);
                }
            }

            officeText.childNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && (node.localName === 'p' || node.localName === 'h') &&
                    (node.namespaceURI === textNs || !node.namespaceURI)) {
                    handleElement(node);
                }
            });

            if (!parts.length) {
                return '<p>(Aucun contenu texte trouvé dans ce fichier .odt)</p>';
            }
            return parts.join('\n');
        } catch (e) {
            console.error('Erreur conversion XML .odt → HTML', e);
            return '<p>(Erreur lors de la lecture du contenu .odt)</p>';
        }
    }

        // Extraire le HTML d'un fichier MHT (afchunk.mht généré par html-docx-js)
        function extractHtmlFromMht(mhtString) {
            try {
                if (!mhtString) return '';

                const lower = mhtString.toLowerCase();
                const idxHtml = lower.indexOf('content-type: text/html');
                if (idxHtml === -1) return '';

                // Fin des en-têtes de la partie HTML : double saut de ligne
                const sepCRLF = mhtString.indexOf('\r\n\r\n', idxHtml);
                const sepLF = mhtString.indexOf('\n\n', idxHtml);
                let start;
                if (sepCRLF !== -1 && (sepLF === -1 || sepCRLF < sepLF)) {
                    start = sepCRLF + 4;
                } else if (sepLF !== -1) {
                    start = sepLF + 2;
                } else {
                    return '';
                }

                // Limite : prochaine ligne de séparation de partie MHT
                let end = mhtString.indexOf('\n------=', start);
                const altEnd = mhtString.indexOf('\r\n------=', start);
                if (end === -1 || (altEnd !== -1 && altEnd < end)) {
                    end = altEnd;
                }
                if (end === -1) {
                    end = mhtString.length;
                }

                let qp = mhtString.substring(start, end);

                // Décodage minimal quoted-printable utilisé par html-docx-js
                qp = qp.replace(/=\r\n/g, '').replace(/=\n/g, ''); // retours à la ligne doux
                qp = qp.replace(/=3D/g, '='); // '=' encodé

                return qp.trim();
            } catch (e) {
                console.error('Erreur extraction HTML depuis MHT', e);
                return '';
            }
        }

    // Compteur de mots et de signes
    function updateWordCounter() {
        const text = editor.innerText || '';
        const trimmed = text.trim();
        const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
        const chars = trimmed.replace(/\s/g, '').length;
        document.getElementById('statWords').textContent =
            words.toLocaleString('fr-FR') + (words <= 1 ? '\u00a0mot' : '\u00a0mots');
        document.getElementById('statChars').textContent =
            chars.toLocaleString('fr-FR') + (chars <= 1 ? '\u00a0signe' : '\u00a0signes');
    }
    updateWordCounter();

    // Détecter les modifications
    editor.addEventListener('input', () => {
        hasUnsavedChanges = true;
        markAsModified();
        updateWordCounter();
    });

    articleSubject.addEventListener('input', () => {
        hasUnsavedChanges = true;
        markAsModified();
    });

    // Bouton Mode Nuit
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            toggleDarkMode();
        });
    }

    function applyCardSearchFilter() {
        if (!cardSearchInput || !articlesList) return;

        const query = cardSearchInput.value.trim().toLowerCase();
        const cards = articlesList.querySelectorAll('.article-card-item');
        let visibleCount = 0;

        cards.forEach((card) => {
            const text = (card.textContent || '').toLowerCase();
            const matches = !query || text.includes(query);
            card.style.display = matches ? '' : 'none';
            if (matches) visibleCount += 1;
        });

        const emptyState = articlesList.querySelector('.no-articles');
        if (emptyState) {
            emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    if (cardSearchInput) {
        cardSearchInput.addEventListener('input', () => {
            applyCardSearchFilter();
        });
    }

    const appScreens = {
        editor: document.getElementById('screen-editor'),
        search: document.getElementById('screen-search'),
        theme: document.getElementById('screen-theme'),
        cards: document.getElementById('screen-cards'),
        music: document.getElementById('screen-music')
    };

    const settingsOverlay = document.getElementById('settingsOverlay');
    const settingsCloseBtn = document.getElementById('settingsCloseBtn');
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsContent = document.querySelector('.settings-content');

    const settingsState = {
        spellcheck: true,
        lineNumbers: false,
        wrap: true,
        autoSave: true,
        defaultFormat: '.txt',
        theme: 'dark',
        fontSize: '14px',
        fontFamily: 'System Sans-Serif',
        updateLabels: {
            theme: 'Sombre',
            fontSize: 'Moyenne (14px)',
            fontFamily: 'System Sans-Serif',
            defaultFormat: '.txt'
        }
    };

    function getSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('textplaystore_settings') || '{}');
            return { ...settingsState, ...saved };
        } catch (error) {
            return { ...settingsState };
        }
    }

    function saveSettings(nextState) {
        const merged = { ...getSettings(), ...nextState };
        localStorage.setItem('textplaystore_settings', JSON.stringify(merged));
        return merged;
    }

    function syncThemeLabel() {
        const themeBtn = document.querySelector('[data-setting="theme"]');
        if (!themeBtn) return;
        const state = getSettings();
        const themeName = state.theme === 'light' ? 'Clair' : 'Sombre';
        themeBtn.innerHTML = `${themeName} <span>›</span>`;
    }

    function syncFontSizeLabel() {
        const fontSizeBtn = document.querySelector('[data-setting="font-size"]');
        if (!fontSizeBtn) return;
        const state = getSettings();
        const value = state.fontSize || '14px';
        const label = value === '12px' ? 'Petite (12px)' : value === '16px' ? 'Grande (16px)' : 'Moyenne (14px)';
        fontSizeBtn.innerHTML = `${label} <span>›</span>`;
    }

    function syncFontFamilyLabel() {
        const fontFamilyBtn = document.querySelector('[data-setting="font-family"]');
        if (!fontFamilyBtn) return;
        const state = getSettings();
        const value = state.fontFamily || 'System Sans-Serif';
        fontFamilyBtn.innerHTML = `${value} <span>›</span>`;
    }

    function syncDefaultFormatLabel() {
        const formatBtn = document.querySelector('[data-setting="defaultFormat"]');
        if (!formatBtn) return;
        const state = getSettings();
        formatBtn.innerHTML = `${state.defaultFormat || '.txt'} <span>›</span>`;
    }

    function applySettingsState() {
        const state = getSettings();

        document.querySelectorAll('.switch[data-setting]').forEach((button) => {
            const name = button.dataset.setting;
            const on = !!state[name];
            button.classList.toggle('is-on', on);
            button.setAttribute('aria-pressed', String(on));
            button.setAttribute('aria-label', on ? `Désactiver ${button.dataset.setting}` : `Activer ${button.dataset.setting}`);
        });

        syncThemeLabel();
        syncFontSizeLabel();
        syncFontFamilyLabel();
        syncDefaultFormatLabel();

        document.body.classList.toggle('dark-mode', state.theme === 'dark');
        document.body.classList.toggle('light-mode', state.theme === 'light');
        localStorage.setItem('scribouillart_dark_mode', String(state.theme === 'dark'));

        const editor = document.getElementById('editor');
        if (editor) {
            editor.style.whiteSpace = state.wrap ? 'normal' : 'pre-wrap';
            editor.setAttribute('spellcheck', String(!!state.spellcheck));
        }

        if (state.lineNumbers) {
            document.body.classList.add('show-line-numbers');
        } else {
            document.body.classList.remove('show-line-numbers');
        }
    }

    function setSettingsOpen(isOpen) {
        if (!settingsOverlay) return;
        settingsOverlay.classList.toggle('hidden', !isOpen);
        settingsOverlay.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('settings-open', isOpen);

        if (isOpen && settingsContent) {
            requestAnimationFrame(() => {
                settingsContent.scrollTop = 0;
            });
        }
    }

    function bindSettingsControls() {
        document.querySelectorAll('.switch[data-setting]').forEach((button) => {
            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                const key = button.dataset.setting;
                const state = getSettings();
                const nextValue = !state[key];
                saveSettings({ [key]: nextValue });
                applySettingsState();
            };
        });

        document.querySelectorAll('[data-setting]').forEach((button) => {
            if (button.classList.contains('switch')) return;

            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                const key = button.dataset.setting;
                const state = getSettings();

                if (key === 'theme') {
                    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
                    saveSettings({ theme: nextTheme });
                    applySettingsState();
                    return;
                }

                if (key === 'font-size') {
                    const sizes = ['12px', '14px', '16px'];
                    const current = state.fontSize || '14px';
                    const next = sizes[(sizes.indexOf(current) + 1) % sizes.length];
                    saveSettings({ fontSize: next });
                    applySettingsState();
                    return;
                }

                if (key === 'font-family') {
                    const fonts = ['System Sans-Serif', 'Georgia', 'Courier New'];
                    const current = state.fontFamily || 'System Sans-Serif';
                    const next = fonts[(fonts.indexOf(current) + 1) % fonts.length];
                    saveSettings({ fontFamily: next });
                    applySettingsState();
                    return;
                }

                if (key === 'defaultFormat') {
                    const formats = ['.txt', '.md', '.html'];
                    const current = state.defaultFormat || '.txt';
                    const next = formats[(formats.indexOf(current) + 1) % formats.length];
                    saveSettings({ defaultFormat: next });
                    applySettingsState();
                    return;
                }

                const labels = {
                    licenses: 'Licences du logiciel',
                    updates: 'Aucune mise à jour disponible',
                    shortcuts: 'Ctrl+B : gras • Ctrl+I : italique • Ctrl+K : lien'
                };

                if (labels[key]) {
                    window.alert(labels[key]);
                }
            };
        });
    }

    bindSettingsControls();
    applySettingsState();

    settingsBtn?.addEventListener('click', () => {
        setSettingsOpen(true);
    });

    settingsCloseBtn?.addEventListener('click', () => {
        setSettingsOpen(false);
    });

    settingsOverlay?.addEventListener('click', (event) => {
        if (event.target === settingsOverlay) {
            setSettingsOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && settingsOverlay && !settingsOverlay.classList.contains('hidden')) {
            setSettingsOpen(false);
        }
    });

    function setRoute(route) {
        Object.entries(appScreens).forEach(([key, screen]) => {
            if (!screen) return;
            screen.classList.toggle('active', key === route);
        });

        bottomTabs.forEach((button) => {
            button.classList.toggle('active', button.dataset.route === route);
        });

        if (route === 'editor') {
            document.getElementById('editor')?.focus();
        }

        if (route === 'search') {
            globalSearchInput?.focus();
            renderSearchResults();
        }

        if (route === 'cards') {
            renderCardsScreen();
        }
    }

    function renderSearchResults() {
        if (!searchResultsList) return;
        const query = (globalSearchInput?.value || '').trim().toLowerCase();

        _dbGetAll().then((articles) => {
            const filtered = !query
                ? articles
                : articles.filter((article) => {
                    const haystack = `${article.subject || ''} ${article.preview || ''} ${article.content || ''}`.toLowerCase();
                    return haystack.includes(query);
                });

            if (!filtered.length) {
                searchResultsList.innerHTML = '<div class="screen-empty">Aucun résultat</div>';
                return;
            }

            searchResultsList.innerHTML = filtered.map((article) => `
                <button class="screen-item" type="button" data-article-id="${article.id}">
                    <span class="screen-item-title">${escapeHtml(article.subject || 'Sans titre')}</span>
                    <span class="screen-item-meta">${escapeHtml(article.date || '')}</span>
                </button>
            `).join('');

            searchResultsList.querySelectorAll('.screen-item').forEach((button) => {
                button.addEventListener('click', async () => {
                    const articleId = Number(button.dataset.articleId);
                    await loadArticleFromList(articleId);
                    setRoute('editor');
                });
            });
        });
    }

    function renderCardsScreen() {
        if (!cardsScreenList) return;

        _dbGetAll().then((articles) => {
            if (!articles.length) {
                cardsScreenList.innerHTML = '<div class="screen-empty">Aucune carte enregistrée</div>';
                return;
            }

            cardsScreenList.innerHTML = articles.map((article) => `
                <button class="screen-item card-item" type="button" data-article-id="${article.id}">
                    <span class="screen-item-title">${escapeHtml(article.subject || 'Sans titre')}</span>
                    <span class="screen-item-meta">${escapeHtml(article.preview || '')}</span>
                </button>
            `).join('');

            cardsScreenList.querySelectorAll('.screen-item').forEach((button) => {
                button.addEventListener('click', async () => {
                    const articleId = Number(button.dataset.articleId);
                    await loadArticleFromList(articleId);
                    setRoute('editor');
                });
            });
        });
    }

    bottomTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const route = tab.dataset.route;
            setRoute(route);
        });
    });

    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', renderSearchResults);
    }

    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('scribouillart_dark_mode', String(isDarkMode));
        updateDarkModeIcons();
        setRoute('theme');
        const toggleBtn = document.getElementById('themeToggleBtn');
        if (toggleBtn) {
            toggleBtn.classList.toggle('is-dark', isDarkMode);
        }
    });

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.classList.toggle('is-dark', document.body.classList.contains('dark-mode'));
    }

    function triggerToolbarSearch() {
        const query = (toolbarSearchInput?.value || '').trim();
        if (!query) {
            editor.focus();
            return;
        }

        const lowerQuery = query.toLowerCase();
        const selection = window.getSelection();
        let foundRange = null;

        const walkTextNodes = (node) => {
            if (node.nodeType !== Node.TEXT_NODE) return null;
            const text = node.nodeValue || '';
            const index = text.toLowerCase().indexOf(lowerQuery);
            if (index >= 0) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + query.length);
                return range;
            }
            return null;
        };

        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        let currentNode;
        while ((currentNode = walker.nextNode())) {
            const range = walkTextNodes(currentNode);
            if (range) {
                foundRange = range;
                break;
            }
        }

        if (foundRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(foundRange);
            foundRange.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            editor.focus();
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.textContent = `Recherche : "${query}"`;
                statusMessage.classList.remove('is-error');
            }
            return;
        }

        const fallbackFound = window.find(query, false, false, false, true, false, false);
        if (fallbackFound) {
            editor.focus();
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.textContent = `Recherche : "${query}"`;
                statusMessage.classList.remove('is-error');
            }
            return;
        }

        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = `Aucun résultat pour : "${query}"`;
            statusMessage.classList.add('is-error');
        }
        editor.focus();
    }

    if (toolbarSearchBtn) {
        toolbarSearchBtn.addEventListener('click', triggerToolbarSearch);
    }

    if (toolbarSearchInput) {
        toolbarSearchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                triggerToolbarSearch();
            }
        });
    }

    if (toolbarToggleBtn && toolbar) {
        toolbarToggleBtn.addEventListener('click', () => {
            const isCollapsed = toolbar.classList.toggle('collapsed');
            toolbarToggleBtn.setAttribute('title', isCollapsed ? 'Afficher la barre d’outils' : 'Masquer la barre d’outils');
            toolbarToggleBtn.setAttribute('aria-label', isCollapsed ? 'Afficher la barre d’outils' : 'Masquer la barre d’outils');
        });
    }

    // Sélecteur de format de paragraphe
    formatSelect.addEventListener('change', (e) => {
        const format = e.target.value;
        document.execCommand('formatBlock', false, format);
        editor.focus();
    });

    function saveEditorSelection() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) return;

        savedEditorSelection = range.cloneRange();
    }

    function restoreEditorSelection() {
        if (!savedEditorSelection) return false;

        const selection = window.getSelection();
        if (!selection) return false;

        selection.removeAllRanges();
        selection.addRange(savedEditorSelection);
        return true;
    }

    function openColorPicker(input) {
        if (!input) return;
        if (typeof input.showPicker === 'function') {
            input.showPicker();
            return;
        }
        input.click();
    }

    function bindColorButton(button, input) {
        if (!button || !input) return;

        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            saveEditorSelection();
        });

        button.addEventListener('click', (e) => {
            e.preventDefault();
            restoreEditorSelection();
            openColorPicker(input);
        });
    }

    bindColorButton(textColorBtn, textColor);
    bindColorButton(bgColorBtn, bgColor);

    // Couleur du texte
    if (textColor) {
        textColor.addEventListener('change', (e) => {
            restoreEditorSelection();
            editor.focus();
            document.execCommand('foreColor', false, e.target.value);
            const bar = document.getElementById('textColorBar');
            if (bar) bar.style.background = e.target.value;
            saveEditorSelection();
            editor.focus();
        });
    }

    // Couleur de fond
    if (bgColor) {
        bgColor.addEventListener('change', (e) => {
            restoreEditorSelection();
            editor.focus();
            document.execCommand('backColor', false, e.target.value);
            const bar = document.getElementById('bgColorBar');
            if (bar) bar.style.background = e.target.value;
            saveEditorSelection();
            editor.focus();
        });
    }

    // Police de caractères
    const fontFamilySelect = document.getElementById('fontFamilySelect');
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', (e) => {
            if (e.target.value) {
                document.execCommand('fontName', false, e.target.value);
            }
            editor.focus();
        });
    }

    // Taille de police
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', (e) => {
            document.execCommand('fontSize', false, e.target.value);
            editor.focus();
        });
    }

    function clearInlineFormattingFromSelection() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;
        const rootNode = commonAncestor.nodeType === Node.ELEMENT_NODE
            ? commonAncestor
            : commonAncestor.parentElement;

        if (!rootNode) return;

        const nodesToProcess = [rootNode, ...rootNode.querySelectorAll('*')];
        nodesToProcess.forEach(node => {
            if (!node || node.nodeType !== Node.ELEMENT_NODE) return;

            const tagName = node.tagName?.toLowerCase();
            if (tagName && ['b','strong','i','em','u','s','strike','font','span','a','sub','sup'].includes(tagName)) {
                const parent = node.parentNode;
                if (parent) {
                    while (node.firstChild) {
                        parent.insertBefore(node.firstChild, node);
                    }
                    parent.removeChild(node);
                }
            }

            ['style', 'class', 'face', 'size', 'color', 'bgcolor'].forEach(attr => {
                node.removeAttribute(attr);
            });
        });
    }

    // Gestion des boutons de la barre d'outils
    document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            const value = btn.dataset.value || null;

            if (command === 'removeFormat') {
                clearInlineFormattingFromSelection();
                document.execCommand('removeFormat', false, null);
                document.execCommand('unlink', false, null);
                editor.focus();
                updateToolbarState();
                return;
            }

            document.execCommand(command, false, value);
            updateToolbarState();
            editor.focus();
        });
    });

    // Bouton lien amélioré
    if (linkBtn) {
        linkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const selection = window.getSelection().toString();
            const url = prompt('Entrez l\'URL du lien :', selection ? '' : 'https://');
            const text = selection || prompt('Texte du lien :');
            
            if (url && text) {
                if (selection) {
                    document.execCommand('createLink', false, url);
                } else {
                    document.execCommand('insertHTML', false, `<a href="${url}">${text}</a>`);
                }
            }
            editor.focus();
        });
    }

    // Bouton supprimer le lien
    if (unlinkBtn) {
        unlinkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('unlink', false, null);
            editor.focus();
        });
    }

    // Bouton image — ouvre un sélecteur de fichier local
    if (imageBtn) {
        imageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';

            input.onchange = (ev) => {
                const file = ev.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = () => {
                    const img = document.createElement('img');
                    img.src = reader.result;
                    img.alt = file.name;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';

                    editor.focus();
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount) {
                        const range = sel.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(img);
                        range.setStartAfter(img);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else {
                        editor.appendChild(img);
                    }
                };
                reader.readAsDataURL(file);
            };

            input.click();
        });
    }

    // Bouton code source
    if (sourceBtn) {
        sourceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSourceMode();
        });
    }

    // Mettre à jour l'état de la barre d'outils
    editor.addEventListener('mouseup', updateToolbarState);
    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', saveEditorSelection);
    editor.addEventListener('keyup', saveEditorSelection);
    editor.addEventListener('focus', saveEditorSelection);

    // Bouton Enregistrer : enregistre dans la colonne "Mes articles" (mise à jour ou création)
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const subject = articleSubject.value.trim();
            if (!subject) {
                showStatus('\u26a0\ufe0f Veuillez saisir un objet pour l\'article', 'error');
                return;
            }
            await saveArticleToList(subject, editor.innerHTML);
            markAsSaved();
            showStatus('\u2713 Article enregistr\u00e9 dans "Mes articles"', 'success');
        });
    }

    // Bouton Enregistrer sous : export .txt / .docx sur le PC
    if (saveAsBtn) {
        saveAsBtn.addEventListener('click', () => {
            publishArticle();
        });
    }

    // Bouton Ajouter (crée TOUJOURS une nouvelle carte dans la colonne "Mes articles")
    addBtn.addEventListener('click', async () => {
        const subject = articleSubject.value.trim();
        if (!subject) {
            alert('Veuillez saisir un objet avant d\'ajouter l\'article.');
            return;
        }
        await saveArticleToList(subject, editor.innerHTML, { forceNew: true });
        markAsSaved();
    });

    // Bouton Nouvel Article
    newArticleBtn.addEventListener('click', async () => {
        await createNewArticle();
    });

    // Bouton Importer
    loadBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        // Formats proposés :
        // - .docx (Word moderne) via mammoth.js
        // - .odt  (OpenOffice/LibreOffice) via JSZip + parsing XML
        // - .html / .htm (exports HTML)
        // - .txt, .md (texte brut / Markdown)
        input.accept = '.html,.htm,.txt,.md,.docx,.odt';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const ext = file.name.split('.').pop().toLowerCase();

            // Nom du fichier comme sujet par défaut
            const defaultSubject = file.name.replace(/\.[^.]+$/, '');

            const applyContent = (html) => {
                editor.innerHTML = html || '<p></p>';
                updateWordCounter();
                if (!articleSubject.value.trim()) {
                    articleSubject.value = defaultSubject;
                }
                hasUnsavedChanges = true;
                markAsModified();
                saveToLocalStorage();
                editor.focus();
            };

            // Fichier Word .docx → priorité à mammoth.js, puis fallback JSZip
            if (ext === 'docx') {
                const reader = new FileReader();

                reader.onload = (event) => {
                    const arrayBuffer = event.target.result;

                    const tryJsZipFallback = () => {
                        if (typeof JSZip === 'undefined') {
                            return Promise.resolve(false);
                        }
                        return JSZip.loadAsync(arrayBuffer)
                            .then(zip => {
                                // Cas html-docx-js : HTML embarqué dans word/afchunk.mht
                                const afchunk = zip.file('word/afchunk.mht');
                                if (afchunk) {
                                    return afchunk.async('string').then(mht => {
                                        const html = extractHtmlFromMht(mht);
                                        if (html && html.trim()) {
                                            applyContent(html);
                                            return true;
                                        }
                                        return false;
                                    });
                                }

                                // Cas html-docx-js : HTML embarqué dans un fichier .html du dossier word/
                                const htmlEntries = zip.file(/word\/.*\.html$/i);
                                if (htmlEntries && htmlEntries.length > 0) {
                                    return htmlEntries[0].async('string').then(html => {
                                        applyContent(html);
                                        return true;
                                    });
                                }

                                // Fallback générique : on essaie de lire word/document.xml
                                const docFile = zip.file('word/document.xml');
                                if (!docFile) return false;
                                return docFile.async('string').then(xml => {
                                    // Extraction très simple du texte des balises <w:t>
                                    try {
                                        const matches = xml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
                                        const paragraphs = matches
                                            .map(m => m.replace(/<\/?w:t[^>]*>/g, ''))
                                            .map(t => t.replace(/\s+/g, ' ').trim())
                                            .filter(t => t.length > 0);

                                        if (!paragraphs.length) return false;

                                        const safe = paragraphs
                                            .map(p => p
                                                .replace(/&/g, '&amp;')
                                                .replace(/</g, '&lt;')
                                                .replace(/>/g, '&gt;'))
                                            .map(p => `<p>${p}</p>`)
                                            .join('\n');
                                        applyContent(safe);
                                        return true;
                                    } catch (e) {
                                        console.error('Erreur parsing XML .docx', e);
                                        return false;
                                    }
                                });
                            })
                            .catch(err => {
                                console.error('Erreur import .docx (JSZip)', err);
                                return false;
                            });
                    };

                    const finishWithError = () => {
                        alert('Impossible de lire ce fichier Word (.docx).');
                    };

                    if (typeof mammoth === 'undefined') {
                        // Pas de mammoth : on tente directement le fallback JSZip
                        tryJsZipFallback().then(ok => { if (!ok) finishWithError(); });
                        return;
                    }

                    // Tentative avec mammoth (cas des vrais .docx issus de Word)
                    mammoth.convertToHtml({ arrayBuffer })
                        .then(result => {
                            const html = (result && result.value) ? result.value.trim() : '';
                            if (html) {
                                applyContent(html);
                                return true;
                            }
                            return false;
                        })
                        .catch(err => {
                            console.error('Erreur import .docx (mammoth)', err);
                            return false;
                        })
                        .then(ok => ok ? true : tryJsZipFallback())
                        .then(okFinal => { if (!okFinal) finishWithError(); });
                };

                reader.readAsArrayBuffer(file);
                return;
            }

            // Fichier OpenDocument .odt → JSZip + parsing du XML content.xml
            if (ext === 'odt') {
                if (typeof JSZip === 'undefined') {
                    alert('Import OpenOffice/LibreOffice (.odt) indisponible : la librairie JSZip n\'est pas chargée.\nVérifiez que vous êtes connecté à Internet.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    JSZip.loadAsync(event.target.result)
                        .then(zip => zip.file('content.xml').async('string'))
                        .then(xmlString => {
                            const html = convertOdtXmlToHtml(xmlString);
                            applyContent(html);
                        })
                        .catch((err) => {
                            console.error('Erreur import .odt', err);
                            alert('Impossible de lire ce fichier .odt. Essayez de l\'enregistrer en .docx ou .txt.');
                        });
                };
                reader.readAsArrayBuffer(file);
                return;
            }

            // Tous les autres formats → lecture texte
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                let html = '';

                if (ext === 'html' || ext === 'htm') {
                    const subjectMatch = content.match(/<!-- Objet: (.+?) -->/);
                    if (subjectMatch) {
                        articleSubject.value = subjectMatch[1];
                        html = content.replace(/<!-- .+? -->\n*/g, '').trim();
                    } else {
                        html = content;
                    }
                } else if (ext === 'md') {
                    html = content
                        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                        .replace(/^- (.+)$/gm, '<li>$1</li>')
                        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
                        .replace(/\n{2,}/g, '</p><p>')
                        .replace(/^(?!<[hHuUpP])(.+)$/gm, '<p>$1</p>');
                } else {
                    const escaped = content
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    html = escaped
                        .split(/\n{2,}/)
                        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
                        .join('');
                }

                applyContent(html);
            };
            reader.readAsText(file);
        };

        input.click();
    });

    // Raccourcis clavier
    editor.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    document.execCommand('bold');
                    updateToolbarState();
                    break;
                case 'i':
                    e.preventDefault();
                    document.execCommand('italic');
                    updateToolbarState();
                    break;
                case 'u':
                    e.preventDefault();
                    document.execCommand('underline');
                    updateToolbarState();
                    break;
                case 'z':
                    e.preventDefault();
                    document.execCommand('undo');
                    break;
                case 'y':
                    e.preventDefault();
                    document.execCommand('redo');
                    break;
            }
        }
    });

    // Avertir avant de quitter si des modifications ne sont pas enregistrées
    window.addEventListener('beforeunload', (e) => {
        saveToLocalStorage(true);
        
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?';
            return e.returnValue;
        }
    });

    // Toggle YouTube player
    if (youtubeToggle) {
        const scPlayer = document.getElementById('scPlayer');
        youtubeToggle.addEventListener('click', () => {
            scPlayer.classList.toggle('minimized');
            youtubeToggle.textContent = scPlayer.classList.contains('minimized') ? '+' : '−';
        });
    }

    /**
     * Marque l'article comme modifié
     */
    function markAsModified() {
        // indicateur visuel désactivé
    }

    /**
     * Marque l'article comme sauvegardé
     */
    function markAsSaved() {
        hasUnsavedChanges = false;
        saveBtn.textContent = 'Enregistrer';
        saveBtn.title = 'Enregistrer l\'article';
    }

    function updateDarkModeIcons() {
        const isDarkMode = document.body.classList.contains('dark-mode');

        if (navModeSun) {
            navModeSun.style.display = isDarkMode ? 'none' : 'block';
        }
        if (navModeMoon) {
            navModeMoon.style.display = isDarkMode ? 'block' : 'none';
        }

        if (darkModeToggle) {
            const moonIcon = darkModeToggle.querySelector('.moon-icon');
            const sunIcon = darkModeToggle.querySelector('.sun-icon');
            if (moonIcon) moonIcon.style.display = isDarkMode ? 'none' : 'block';
            if (sunIcon) sunIcon.style.display = isDarkMode ? 'block' : 'none';
        }
    }

    /**
     * Bascule entre le mode clair et le mode nuit
     */
    function toggleDarkMode() {
        const body = document.body;
        const isDarkMode = body.classList.toggle('dark-mode');
        updateDarkModeIcons();
        localStorage.setItem('scribouillart_dark_mode', isDarkMode ? 'true' : 'false');
    }

    /**
     * Charge la préférence du mode nuit
     */
    function loadDarkModePreference() {
        const isDarkMode = localStorage.getItem('scribouillart_dark_mode') === 'true';

        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }

        updateDarkModeIcons();
    }

    /**
     * Met à jour l'état actif des boutons de la barre d'outils
     */
    function updateToolbarState() {
        document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
            const command = btn.dataset.command;
            if (document.queryCommandState(command)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const parentElement = window.getSelection().anchorNode?.parentElement;
        if (parentElement) {
            const tagName = parentElement.tagName?.toLowerCase();
            if (formatSelect.querySelector(`option[value="${tagName}"]`)) {
                formatSelect.value = tagName;
            }
        }
    }

    /**
     * Bascule entre le mode visuel et le mode code source
     */
    function toggleSourceMode() {
        isSourceMode = !isSourceMode;
        
        if (isSourceMode) {
            const html = editor.innerHTML;
            editor.contentEditable = 'false';
            editor.style.fontFamily = 'monospace';
            editor.style.whiteSpace = 'pre-wrap';
            editor.textContent = formatHTMLForDisplay(html);
            sourceBtn.classList.add('active');
        } else {
            const html = editor.textContent;
            editor.innerHTML = html;
            updateWordCounter();
            editor.contentEditable = 'true';
            editor.style.fontFamily = 'Georgia, "Times New Roman", serif';
            editor.style.whiteSpace = 'normal';
            sourceBtn.classList.remove('active');
        }
        editor.focus();
    }

    /**
     * Formate le HTML pour l'affichage dans le mode source
     */
    function formatHTMLForDisplay(html) {
        return html
            .replace(/></g, '>\n<')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .join('\n');
    }

    /**
     * Affiche un dialogue de choix de format puis lance le téléchargement
     */
    function publishArticle() {
        const subject = articleSubject.value.trim();
        const htmlContent = editor.innerHTML;
        const plainText = editor.innerText;

        if (!subject) {
            showStatus('\u26a0\ufe0f Veuillez saisir un objet pour l\'article', 'error');
            return;
        }

        // Création du dialogue de choix
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:#1e1e1e;border:1px solid #444;border-radius:10px;padding:28px 32px;min-width:280px;text-align:center;color:#f1f1f1;font-family:inherit';
        modal.innerHTML = `
          <p style="margin:0 0 6px;font-size:13px;color:#aaa;">Choisir le format d'export</p>
          <p style="margin:0 0 22px;font-size:16px;font-weight:600;">Enregistrer en :</p>
          <div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px">
            <button id="_dlTxt" style="padding:10px 22px;border-radius:6px;border:1px solid #555;background:#2a2a2a;color:#f1f1f1;cursor:pointer;font-size:14px;">Texte brut (.txt)</button>
            <button id="_dlDoc" style="padding:10px 22px;border-radius:6px;border:1px solid #555;background:#2a2a2a;color:#f1f1f1;cursor:pointer;font-size:14px;">Word (.docx)</button>
          </div>
          <button id="_dlCancel" style="background:none;border:none;color:#888;cursor:pointer;font-size:13px;">Annuler</button>`;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => document.body.removeChild(overlay);

        modal.querySelector('#_dlTxt').addEventListener('click', async () => {
            close();
            await downloadTextFile(subject, plainText);
        });
        modal.querySelector('#_dlDoc').addEventListener('click', async () => {
            close();
            await downloadWordFile(subject, htmlContent);
        });
        modal.querySelector('#_dlCancel').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    }

    /**
     * Télécharge le contenu en texte brut (.txt) — sans balises
     */
    async function downloadTextFile(subject, plainText) {
        const timestamp = new Date().toISOString().slice(0, 10);
        const cleanSubject = subject
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
        const filename = `${cleanSubject}-${timestamp}.txt`;
        const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });

        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{ description: 'Fichier texte', accept: { 'text/plain': ['.txt'] } }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                showStatus(`\u2713 Fichier "${filename}" enregistr\u00e9 avec succ\u00e8s !`, 'success');
            } catch (err) {
                if (err.name === 'AbortError') {
                    showStatus('Sauvegarde annul\u00e9e', 'error');
                } else {
                    showStatus(`\u274c Erreur : ${err.message}`, 'error');
                }
            }
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            showStatus(`\u2713 Fichier t\u00e9l\u00e9charg\u00e9 dans T\u00e9l\u00e9chargements`, 'success');
        }
    }

    /**
     * Télécharge le contenu en vrai fichier .docx — icône Word immédiate, zéro alerte
     */
    async function downloadWordFile(subject, htmlContent) {
        if (typeof htmlDocx === 'undefined') {
            showStatus('❌ Export Word indisponible hors connexion.', 'error');
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 10);
        const cleanSubject = subject
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
        const filename = `${cleanSubject}-${timestamp}.docx`;

        const fullHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>
  body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.6;}
  h1{font-size:22pt;font-weight:bold;margin-top:24pt;}
  h2{font-size:16pt;font-weight:bold;margin-top:18pt;}
  h3{font-size:13pt;font-weight:bold;margin-top:14pt;}
  p{margin:4pt 0 8pt;} blockquote{margin-left:30pt;padding-left:10pt;color:#555;}
  ul,ol{margin-left:18pt;} strong,b{font-weight:bold;} em,i{font-style:italic;}
  u{text-decoration:underline;} a{color:#0563C1;}
</style></head><body>${htmlContent}</body></html>`;

        const blob = htmlDocx.asBlob(fullHtml);

        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Document Word',
                        accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                showStatus(`✓ Fichier "${filename}" enregistré avec succès !`, 'success');
            } catch (err) {
                if (err.name === 'AbortError') {
                    showStatus('Sauvegarde annulée', 'error');
                } else {
                    showStatus(`❌ Erreur : ${err.message}`, 'error');
                }
            }
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            showStatus(`✓ Fichier téléchargé dans Téléchargements`, 'success');
        }
    }

    /**
     * Crée un nouvel article vierge
     */
    async function createNewArticle() {
        if (hasUnsavedChanges && !confirm('Voulez-vous créer un nouvel article ? Les modifications non enregistrées seront perdues.')) {
            return;
        }
        
        currentArticleId = null;
        articleSubject.value = '';
        editor.innerHTML = '<p>Hello !</p>';
        updateWordCounter();
        hasUnsavedChanges = false;
        markAsSaved();
        await refreshArticlesList();
        showStatus('✓ Nouvel article créé !', 'success');
    }

    /**
     * Sauvegarde l'article dans la liste (IndexedDB)
     */
    async function saveArticleToList(subject, content, options = {}) {
        const forceNew = options.forceNew === true;
        const id = (!forceNew && currentArticleId) ? currentArticleId : Date.now();
        const articles = await _dbGetAll();
        const existingArticle = articles.find(article => article.id === id);

        const article = {
            id: id,
            subject: subject,
            content: content,
            preview: getTextPreview(content),
            date: new Date().toLocaleString('fr-FR'),
            color: existingArticle?.color ?? '',
            sortOrder: existingArticle?.sortOrder ?? ((articles[0]?.sortOrder ?? 0) + 1)
        };
        await _dbPut(article);
        currentArticleId = article.id;
        await refreshArticlesList();
    }

    function hexToRgba(hex, alpha = 1) {
        const sanitized = (hex || '#2f8b8d').replace('#', '').trim();
        if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(sanitized)) {
            return `rgba(47, 139, 141, ${alpha})`;
        }

        const fullHex = sanitized.length === 3
            ? sanitized.split('').map(char => char + char).join('')
            : sanitized;

        const num = parseInt(fullHex, 16);
        const red = (num >> 16) & 255;
        const green = (num >> 8) & 255;
        const blue = num & 255;

        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    async function moveArticleToIndex(articleId, targetIndex) {
        const articles = await _dbGetAll();
        const currentIndex = articles.findIndex(article => article.id === articleId);

        if (currentIndex === -1) {
            return;
        }

        const reorderedArticles = [...articles];
        const [movedArticle] = reorderedArticles.splice(currentIndex, 1);
        const boundedIndex = Math.max(0, Math.min(targetIndex, reorderedArticles.length));
        reorderedArticles.splice(boundedIndex, 0, movedArticle);

        const persistedArticles = reorderedArticles.map((article, index) => ({
            ...article,
            sortOrder: reorderedArticles.length - index
        }));

        await Promise.all(persistedArticles.map(article => _dbPut(article)));
        await refreshArticlesList();
    }

    function setupArticleMoveButtons() {
        articlesList.querySelectorAll('.article-card-move-up, .article-card-move-down').forEach(btn => {
            btn.addEventListener('click', async (event) => {
                event.stopPropagation();
                const articleId = parseInt(btn.dataset.id, 10);
                const direction = btn.classList.contains('article-card-move-up') ? -1 : 1;
                const articles = await _dbGetAll();
                const currentIndex = articles.findIndex(article => article.id === articleId);
                if (currentIndex === -1) return;

                const targetIndex = currentIndex + direction;
                if (targetIndex < 0 || targetIndex >= articles.length) return;

                await moveArticleToIndex(articleId, targetIndex);
            });
        });
    }

    /**
     * Extrait un aperçu textuel
     */
    function getTextPreview(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const text = temp.textContent || temp.innerText || '';
        return text.substring(0, 100);
    }

    /**
     * Rafraîchit l'affichage de la liste (IndexedDB)
     */
    async function refreshArticlesList() {
        const articles = await _dbGetAll();
        
        if (articles.length === 0) {
            articlesList.innerHTML = '<div class="no-articles">Aucun article sauvegardé</div>';
            return;
        }

        articlesList.innerHTML = articles.map((article, index) => {
            const cardColor = article.color || '#2f8b8d';
            const cardStyle = article.color
                ? `--card-color: ${cardColor}; background: linear-gradient(90deg, ${hexToRgba(cardColor, 0.22)} 0%, var(--editor-bg-tertiary) 38%);`
                : `--card-color: transparent; background: var(--editor-bg-tertiary);`;

            const subject = escapeHtml(article.subject || 'Sans titre');
            const preview = escapeHtml(article.preview || 'Sans contenu');

            return `
                <div class="article-card-item ${article.id === currentArticleId ? 'active' : ''} ${article.color ? 'has-color' : ''}" data-id="${article.id}" style="${cardStyle}">
                    <div class="article-card-subject">${subject}</div>
                    <div class="article-card-preview">${preview}</div>
                    <div class="article-card-footer">
                        <span class="article-card-date">${article.date}</span>
                        <div class="article-card-actions">
                            <button class="article-card-color" data-id="${article.id}" onclick="event.stopPropagation()" title="Changer la couleur de la carte" aria-label="Changer la couleur de la carte">
                                <span class="article-card-color-dot" style="background:${cardColor};"></span>
                            </button>
                            <button class="article-card-move-up" data-id="${article.id}" data-index="${index}" onclick="event.stopPropagation()" title="Monter l'article" aria-label="Monter l'article" ${index === 0 ? 'disabled' : ''}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
                            </button>
                            <button class="article-card-move-down" data-id="${article.id}" data-index="${index}" onclick="event.stopPropagation()" title="Descendre l'article" aria-label="Descendre l'article" ${index === articles.length - 1 ? 'disabled' : ''}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                            </button>
                            <button class="article-card-delete" data-id="${article.id}" onclick="event.stopPropagation()" title="Supprimer l'article" aria-label="Supprimer l'article">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        articlesList.querySelectorAll('.article-card-item').forEach(card => {
            card.addEventListener('click', async () => {
                const id = parseInt(card.dataset.id);
                document.querySelector('.sidebar')?.classList.remove('open');
                await loadArticleFromList(id);
                document.querySelector('[data-nav="home"]')?.classList.add('active');
                document.querySelectorAll('.bottom-tab').forEach((btn) => {
                    if (btn.dataset.nav !== 'home') btn.classList.remove('active');
                });
            });
        });

        articlesList.querySelectorAll('.article-card-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                await deleteArticleFromList(id);
            });
        });

        applyCardSearchFilter();

        articlesList.querySelectorAll('.article-card-color').forEach(btn => {
            btn.addEventListener('click', async (event) => {
                event.stopPropagation();
                const articleId = parseInt(btn.dataset.id, 10);
                const articles = await _dbGetAll();
                const article = articles.find(item => item.id === articleId);
                if (!article) return;

                const picker = document.createElement('input');
                picker.type = 'color';
                picker.value = article.color || '#2f8b8d';
                picker.style.position = 'fixed';
                picker.style.opacity = '0';
                picker.style.pointerEvents = 'none';
                document.body.appendChild(picker);
                picker.click();

                picker.onchange = async () => {
                    const updatedArticles = await _dbGetAll();
                    const currentArticle = updatedArticles.find(item => item.id === articleId);
                    if (!currentArticle) return;

                    currentArticle.color = picker.value;
                    await _dbPut(currentArticle);
                    await refreshArticlesList();
                };

                picker.onblur = () => picker.remove();
            });
        });

        setupArticleMoveButtons();
    }

    /**
     * Charge un article depuis la liste (IndexedDB)
     */
    async function loadArticleFromList(id) {
        if (hasUnsavedChanges && !confirm('Charger cet article ? Les modifications non enregistrées seront perdues.')) {
            return;
        }
        
        const articles = await _dbGetAll();
        const article = articles.find(a => a.id === id);
        
        if (article) {
            articleSubject.value = article.subject;
            editor.innerHTML = article.content;
            updateWordCounter();
            currentArticleId = article.id;
            
            hasUnsavedChanges = false;
            markAsSaved();
            await refreshArticlesList();
            showStatus(`✓ Article "${article.subject}" chargé !`, 'success');
        }
    }

    /**
     * Supprime un article de la liste (IndexedDB)
     */
    async function deleteArticleFromList(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
            return;
        }
        
        await _dbDelete(id);
        
        if (currentArticleId === id) {
            currentArticleId = null;
        }
        
        await refreshArticlesList();
        showStatus('✓ Article supprimé !', 'success');
    }

    /**
     * Échappe le HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Sauvegarde dans le localStorage
     */
    function saveToLocalStorage() {
        const content = editor.innerHTML;
        const subject = articleSubject.value;
        const timestamp = new Date().toLocaleString('fr-FR');
        
        try {
            localStorage.setItem('scribouillart_editor_content', content);
            localStorage.setItem('scribouillart_editor_subject', subject);
            localStorage.setItem('scribouillart_editor_timestamp', timestamp);
        } catch (e) {
            console.error('Erreur sauvegarde automatique');
        }
    }

    /**
     * Charge depuis le localStorage
     */
    function loadFromLocalStorage() {
        const savedContent = localStorage.getItem('scribouillart_editor_content');
        const savedSubject = localStorage.getItem('scribouillart_editor_subject');
        
        if (savedContent) {
            editor.innerHTML = savedContent;
            updateWordCounter();
        }
        
        if (savedSubject) {
            articleSubject.value = savedSubject;
        }
    }

    /**
     * Affiche un message de statut (stub — notifications désactivées)
     */
    function showStatus(message, type) {
        // Notifications désactivées
    }
}

// ─── Sidebar toggle (mobile) ────────────────────────────────────────────────
(function () {
    var sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', function () {
            document.querySelector('.sidebar').classList.toggle('open');
        });
    }
})();


