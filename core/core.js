const inku = {
  async fetchAndResolve(filePath) {
    const res = await fetch(filePath);
    let html = await res.text();

    const includeRegex = /{{\s*include\(["'](.+?)["']\)\s*}}/g;
    const matches = [...html.matchAll(includeRegex)];

    for (const match of matches) {
      const partialPath = match[1];
      const partialHTML = await this.fetchAndResolve(partialPath);
      html = html.replace(match[0], partialHTML);
    }

    return html;
  },

  async render(viewName = 'home') {
    const target = document.getElementById('app');
    const html = await this.fetchAndResolve(`compo/${viewName}.html`);
    target.innerHTML = html;
  },

  getCurrentRoute() {
    const hash = location.hash || '#/home';
    const route = hash.replace(/^#\//, '');
    return route;
  },

  async route() {
    const viewName = this.getCurrentRoute();
    await this.render(viewName);
  },

  init() {
    window.addEventListener('DOMContentLoaded', () => this.route());
    window.addEventListener('hashchange', () => this.route());
  }
};

inku.init();
