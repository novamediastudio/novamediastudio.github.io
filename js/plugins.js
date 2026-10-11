/* ───────────────────────────────────────────────────────────────
   Nova Media — Plugin documentation loader
   Reads content/plugins/plugins.json (the index), renders the
   selected markdown page with marked.js, builds the sidebar +
   on-this-page table of contents, and routes with ?id=<slug>.

   The ?id= scheme matches each plugin's built-in Help button, which
   opens:  https://novamediastudio.co/plugins.html?id=<helpId>

   To add a plugin page: drop a new .md in content/plugins/ and add an
   entry to plugins.json — no code changes needed. Shared pages
   (Requirements, Installation, License) live once and are linked to.
   ─────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var MANIFEST_URL = 'content/plugins/plugins.json';
  var navEl, contentEl, tocEl, breadcrumbEl;
  var manifest = null;

  document.addEventListener('DOMContentLoaded', function () {
    navEl = document.getElementById('docs-nav');
    contentEl = document.getElementById('docs-content');
    tocEl = document.getElementById('docs-toc');
    breadcrumbEl = document.getElementById('docs-breadcrumb');

    if (window.marked && marked.setOptions) {
      marked.setOptions({ gfm: true, breaks: false });
    }

    fetch(MANIFEST_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        manifest = data;
        buildNav();
        route();
        window.addEventListener('popstate', route);
        // Intercept ?id= links anywhere on the page (sidebar + in-content
        // cross links) so navigation doesn't reload the whole document.
        document.addEventListener('click', onLinkClick);
      })
      .catch(function (err) {
        console.error('Plugins: failed to load manifest', err);
        contentEl.innerHTML = '<h1>Plugins</h1><p>Failed to load the documentation index.</p>';
      });
  });

  function allPages() {
    var pages = [];
    (manifest.sections || []).forEach(function (section) {
      (section.pages || []).forEach(function (p) { pages.push(p); });
    });
    return pages;
  }

  function currentSlug() {
    var slug = '';
    try { slug = (new URLSearchParams(location.search).get('id') || '').trim(); } catch (e) {}
    var pages = allPages();
    if (!slug && pages.length) return pages[0].slug;
    return slug;
  }

  function findPage(slug) {
    var matches = allPages().filter(function (p) { return p.slug === slug; });
    return matches[0] || null;
  }

  function slugFromHref(href) {
    if (!href) return null;
    var m = href.match(/[?&]id=([A-Za-z0-9._-]+)/);
    return m ? m[1] : null;
  }

  function onLinkClick(ev) {
    var a = ev.target.closest ? ev.target.closest('a') : null;
    if (!a) return;
    var slug = slugFromHref(a.getAttribute('href') || '');
    if (!slug || !findPage(slug)) return;      // not an in-app page link
    if (a.target === '_blank') return;
    ev.preventDefault();
    navigate(slug);
  }

  function navigate(slug) {
    try { history.pushState({}, '', '?id=' + slug); } catch (e) {}
    route();
  }

  function buildNav() {
    var html = '';
    (manifest.sections || []).forEach(function (section) {
      html += '<div class="docs-nav-section">';
      if (section.title) {
        html += '<div class="docs-nav-section-title">' + esc(section.title) + '</div>';
      }
      (section.pages || []).forEach(function (p) {
        html += '<a href="?id=' + esc(p.slug) + '" data-slug="' + esc(p.slug) + '">' +
                '<span>' + esc(p.title) + '</span>' +
                (p.tag ? '<span class="docs-nav-tag">' + esc(p.tag) + '</span>' : '') +
                '</a>';
      });
      html += '</div>';
    });
    navEl.innerHTML = html;
  }

  function route() {
    var slug = currentSlug();
    var page = findPage(slug);

    Array.prototype.forEach.call(navEl.querySelectorAll('a'), function (a) {
      a.classList.toggle('active', a.getAttribute('data-slug') === slug);
    });

    if (!page) {
      setBreadcrumb(null);
      contentEl.innerHTML = '<h1>Not found</h1><p>There is no page for &ldquo;' +
                            esc(slug) + '&rdquo;.</p>';
      if (tocEl) tocEl.innerHTML = '';
      return;
    }

    setBreadcrumb(page);
    contentEl.innerHTML = '<p style="color:var(--off-white)">Loading…</p>';

    fetch(page.file)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (md) {
        contentEl.innerHTML = window.marked ? marked.parse(md) : md;
        enhance();
        try { document.body.scrollTop = 0; window.scrollTo(0, 0); } catch (e) {}
      })
      .catch(function (err) {
        console.error('Plugins: failed to load page', page.file, err);
        contentEl.innerHTML = '<h1>' + esc(page.title) + '</h1><p>Failed to load this page.</p>';
      });
  }

  function setBreadcrumb(page) {
    if (!breadcrumbEl) return;
    breadcrumbEl.innerHTML =
      '<a href="index.html?splash=false">Nova Media</a> / ' +
      '<a href="plugins.html">Plugins</a>' +
      (page ? ' / ' + esc(page.title) : '');
  }

  function enhance() {
    addHeadingIds();
    buildToc();
    addCopyButtons();
    initScrollSpy();
  }

  function slugify(text) {
    return String(text).toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function addHeadingIds() {
    var used = {};
    Array.prototype.forEach.call(contentEl.querySelectorAll('h2, h3'), function (h) {
      var base = slugify(h.textContent || 'section') || 'section';
      var id = base, i = 2;
      while (used[id]) { id = base + '-' + i; i++; }
      used[id] = true;
      h.id = id;
    });
  }

  function buildToc() {
    if (!tocEl) return;
    var heads = contentEl.querySelectorAll('h2, h3');
    if (!heads.length) { tocEl.innerHTML = ''; return; }

    var html = '';
    Array.prototype.forEach.call(heads, function (h) {
      var cls = h.tagName.toLowerCase() === 'h3' ? 'toc-h3' : '';
      html += '<a href="#' + h.id + '" class="' + cls + '" data-target="' + h.id + '">' +
              esc(h.textContent) + '</a>';
    });
    tocEl.innerHTML = html;

    Array.prototype.forEach.call(tocEl.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var el = document.getElementById(a.getAttribute('data-target'));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function addCopyButtons() {
    Array.prototype.forEach.call(contentEl.querySelectorAll('pre'), function (pre) {
      var btn = document.createElement('button');
      btn.className = 'docs-copy-btn';
      btn.type = 'button';
      btn.textContent = 'Copy';
      btn.addEventListener('click', function () {
        var code = pre.querySelector('code');
        var text = code ? code.innerText : pre.innerText;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function () {
            btn.textContent = 'Copied';
            setTimeout(function () { btn.textContent = 'Copy'; }, 1400);
          });
        }
      });
      pre.appendChild(btn);
    });
  }

  function initScrollSpy() {
    if (!tocEl) return;
    var links = Array.prototype.slice.call(tocEl.querySelectorAll('a'));
    if (!links.length) return;
    var heads = links
      .map(function (a) { return document.getElementById(a.getAttribute('data-target')); })
      .filter(Boolean);

    function update() {
      var threshold = window.innerHeight * 0.28;
      var currentId = heads.length ? heads[0].id : null;
      heads.forEach(function (h) {
        if (h.getBoundingClientRect().top <= threshold) currentId = h.id;
      });
      links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('data-target') === currentId);
      });
    }

    document.body.addEventListener('scroll', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
