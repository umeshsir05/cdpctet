(function() {
    'use strict';

    // ── DOM refs ──
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('menuToggle');
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.content-section');
    const sectionTitle = document.getElementById('sectionTitle');
    const searchInput = document.getElementById('searchInput');
    const searchCount = document.getElementById('searchCount');
    const noResults = document.getElementById('noResults');
    const themeToggle = document.getElementById('themeToggle');

    let currentSection = 'development';
    let searchQuery = '';

    // ── Theme ──
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('ctet-theme');
    let isDark = storedTheme ? storedTheme === 'dark' : prefersDark;

    function setTheme(dark) {
        document.body.classList.toggle('dark-mode', dark);
        themeToggle.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('ctet-theme', dark ? 'dark' : 'light');
        isDark = dark;
    }

    themeToggle.addEventListener('click', () => setTheme(!isDark));
    setTheme(isDark);

    // ── Sidebar toggle ──
    function toggleSidebar(open) {
        sidebar.classList.toggle('open', open);
        overlay.classList.toggle('active', open);
        toggleBtn.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    }

    toggleBtn.addEventListener('click', () => toggleSidebar(!sidebar.classList.contains('open')));
    overlay.addEventListener('click', () => toggleSidebar(false));

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 820) toggleSidebar(false);
        });
    });

    // ── Navigation ──
    function navigateTo(sectionId) {
        if (!sectionId) return;
        currentSection = sectionId;

        navLinks.forEach(a => {
            a.classList.toggle('active', a.dataset.section === sectionId);
        });

        const activeLink = document.querySelector(`.sidebar-nav a[data-section="${sectionId}"]`);
        if (activeLink) {
            sectionTitle.textContent = activeLink.textContent.trim();
        } else {
            sectionTitle.textContent = sectionId.replace(/-/g, ' ');
        }

        sections.forEach(s => {
            s.classList.toggle('hidden', s.dataset.section !== sectionId);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (searchQuery.trim()) {
            performSearch(searchQuery);
        } else {
            clearHighlights();
            noResults.style.display = 'none';
            sections.forEach(s => s.style.display = '');
        }
    }

    // ── Search ──
    function clearHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });
    }

    function performSearch(query) {
        const q = query.trim().toLowerCase();
        searchQuery = q;
        clearHighlights();

        if (!q) {
            sections.forEach(s => s.style.display = '');
            noResults.style.display = 'none';
            searchCount.textContent = '';
            return;
        }

        let totalMatches = 0;

        sections.forEach(section => {
            const clone = section.cloneNode(true);
            const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null, false);
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }

            let sectionMatches = 0;
            textNodes.forEach(textNode => {
                if (textNode.textContent.toLowerCase().includes(q)) {
                    sectionMatches++;
                }
            });

            if (sectionMatches > 0) {
                section.style.display = '';
                totalMatches += sectionMatches;
                highlightInElement(section, q);
            } else {
                if (section.dataset.section === currentSection) {
                    section.style.display = '';
                } else {
                    section.style.display = 'none';
                }
            }
        });

        const currentEl = document.querySelector(`.content-section[data-section="${currentSection}"]`);
        if (currentEl) currentEl.style.display = '';

        noResults.style.display = totalMatches === 0 ? 'block' : 'none';
        searchCount.textContent = totalMatches > 0 ? `${totalMatches} results` : '';
    }

    function highlightInElement(element, query) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        const nodes = [];
        let node;
        while (node = walker.nextNode()) {
            nodes.push(node);
        }
        nodes.forEach(textNode => {
            const text = textNode.textContent;
            const lower = text.toLowerCase();
            const idx = lower.indexOf(query);
            if (idx !== -1) {
                const span = document.createElement('span');
                span.className = 'search-highlight';
                span.textContent = text.substring(idx, idx + query.length);
                const before = document.createTextNode(text.substring(0, idx));
                const after = document.createTextNode(text.substring(idx + query.length));
                const parent = textNode.parentNode;
                parent.insertBefore(before, textNode);
                parent.insertBefore(span, textNode);
                parent.insertBefore(after, textNode);
                parent.removeChild(textNode);
            }
        });
    }

    // ── Search input ──
    searchInput.addEventListener('input', function() {
        const q = this.value;
        if (!q.trim()) {
            searchQuery = '';
            clearHighlights();
            sections.forEach(s => s.style.display = '');
            noResults.style.display = 'none';
            searchCount.textContent = '';
            navigateTo(currentSection);
            return;
        }
        performSearch(q);
    });

    // ── Nav click ──
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (!section) return;
            searchInput.value = '';
            searchQuery = '';
            searchCount.textContent = '';
            clearHighlights();
            noResults.style.display = 'none';
            navigateTo(section);
        });
    });

    // ── Init ──
    navigateTo('development');

    // ── Keyboard shortcuts ──
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape') {
            searchInput.blur();
            searchInput.value = '';
            searchQuery = '';
            searchCount.textContent = '';
            clearHighlights();
            noResults.style.display = 'none';
            sections.forEach(s => s.style.display = '');
            navigateTo(currentSection);
        }
    });

})();