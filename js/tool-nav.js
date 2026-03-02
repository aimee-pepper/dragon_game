// ============================================================
// Shared tool navigation bar — injected into every tool page
// ============================================================
// Usage: <script src="js/tool-nav.js"></script> (regular script, not module)
// Injects a fixed top-bar with links to all tool pages.

(function() {
  const PAGES = [
    { label: 'Game',             href: '/index.html' },
    { label: 'Dev Tools',        href: '/tools2.html' },
    { label: 'Sprite Placement', href: '/sprite-placement.html' },
    { label: 'Spine Placement',  href: '/spine-placement.html' },
    { label: 'Dragon Creator',   href: '/dragon-creator.html' },
    { label: 'Combat Sim',       href: '/combat-simulator.html' },
    { label: 'Breath Elements',  href: '/breath-elements.html' },
    { label: 'Finish Lab',       href: '/tools/finish-lab.html' },
    { label: 'Map Editor',       href: '/map-editor.html' },
  ];

  // Determine which page we're on
  const currentPath = window.location.pathname.replace(/\?.*$/, '');

  // Build nav bar
  const nav = document.createElement('nav');
  nav.id = 'tool-nav-bar';

  const style = document.createElement('style');
  style.textContent = `
    #tool-nav-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
      display: flex; align-items: center; gap: 2px;
      padding: 4px 10px; height: 32px;
      background: #18151280; backdrop-filter: blur(8px);
      border-bottom: 1px solid #3d3530;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow-x: auto; overflow-y: hidden;
    }
    #tool-nav-bar a {
      color: #8a7e72; text-decoration: none; font-size: 11px;
      padding: 3px 9px; border-radius: 4px; white-space: nowrap;
      transition: background 0.15s, color 0.15s;
    }
    #tool-nav-bar a:hover { background: #3d353080; color: #d4cdc4; }
    #tool-nav-bar a.active {
      background: #c4a26530; color: #c4a265; font-weight: 600;
    }
    /* Push page content down so it's not hidden behind the nav */
    body { padding-top: 36px !important; }
  `;

  for (const page of PAGES) {
    const a = document.createElement('a');
    a.href = page.href;
    a.textContent = page.label;
    if (currentPath === page.href || currentPath === page.href.replace('.html', '')) {
      a.classList.add('active');
    }
    nav.appendChild(a);
  }

  // Inject at very top of body
  document.head.appendChild(style);
  if (document.body.firstChild) {
    document.body.insertBefore(nav, document.body.firstChild);
  } else {
    document.body.appendChild(nav);
  }
})();
