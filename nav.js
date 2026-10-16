const navigationLinks = [
  { label: 'About', href: 'about' },
];

class EttoNav extends HTMLElement {
  connectedCallback() {
    const isAboutPage = /\/about(?:\.html)?\/?$/.test(window.location.pathname);
    const links = navigationLinks.map(({ label, href }) => {
      const current = isAboutPage && href === 'about' ? ' aria-current="page"' : '';
      return `<li><a class="dot-action" href="${href}"${current}><span class="dot-action-label">${label}</span></a></li>`;
    }).join('');

    this.innerHTML = `
      <nav class="site-nav" aria-label="Main navigation">
        <a class="stamp" href="./#top" aria-label="ETTO home"><img src="assets/stamp-black.svg" alt="" width="26" height="17"></a>
        ${this.hasAttribute('wordmark') ? '<a class="wordmark" href="./#top" aria-label="ETTO home"><img src="assets/etto-red.svg" alt="" width="82" height="22"></a>' : ''}
        <ul class="nav-links">${links}</ul>
      </nav>`;
  }
}

customElements.define('etto-nav', EttoNav);
