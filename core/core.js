const inku = {
  async fetchAndResolve(filePath) {
    const res = await fetch(filePath);
    let html = await res.text();
  
    // 먼저 include 재귀 파싱
    const includeRegex = /{{\s*include\(["'](.+?)["']\)\s*}}/g;
    const matches = [...html.matchAll(includeRegex)];
  
    for (const match of matches) {
      const partialPath = match[1];
      const partialHTML = await this.fetchAndResolve(partialPath);
      html = html.replace(match[0], partialHTML);
    }
  
    // 🔥 <link rel="stylesheet" ...> 자동 추출
    const styleLinkRegex = /<link\s+rel=["']stylesheet["']\s+href=["'](.+?)["'].*?>/gi;
    const links = [...html.matchAll(styleLinkRegex)];
  
    for (const match of links) {
      const href = match[1];
  
      // 이미 추가된 스타일인지 검사 (중복 방지)
      if (!document.querySelector(`link[href="${href}"]`)) {
        const linkEl = document.createElement('link');
        linkEl.rel = 'stylesheet';
        linkEl.href = href;
        document.head.appendChild(linkEl);
      }
  
      // HTML 안에서는 제거 (스타일은 head로 올렸으니까)
      html = html.replace(match[0], '');
    }
  
    return html;
  },

  async render(viewName = 'home') {
    const target = document.getElementById('app');
  
    // 우선 숨겨둠
    target.style.visibility = 'hidden';
    target.style.opacity = '0';
  
    const html = await this.fetchAndResolve(`pages/${viewName}/index.html`);
    target.innerHTML = html;
  
    // 로딩 후 살짝 지연 후 보여주기
    requestAnimationFrame(() => {
      target.style.visibility = 'visible';
      target.style.opacity = '1';
    });
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
