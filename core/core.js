class InkuStyle {
  constructor() {
    this.linksElem = this.#createStyleLinks();
    this.head = document.head;
    /**
     * @type {HTMLElement}
     */
    this.page = null;
    /**
     * @type {HTMLElement}
     */
    this.prePage = null;
    this.#appendStyleLinks();
  }
  get list() {
    return Array.from(this.linksElem.children);
  }

  #createStyleLinks() {
    const div = document.createElement('div');
    div.id = 'inkuStyleLinks';
    return div;
  }

  #appendStyleLinks() {
    this.head.appendChild(this.linksElem);
  }
  /**
   * 
   * @param {HTMLElement} elem 
   */
  #isPage(elem) {
    return elem.id.startsWith("pages/");
  }
  #setPage(elem) {
    if (this.#isPage(elem)) {
      this.prePage = this.page;
      this.page = elem;
    }
  }
  append(elem) {
    this.#setPage(elem);
    this.linksElem.appendChild(elem);
  }

  /**
   * @param {HTMLElement} elem 
   */
  remove(elem) {
    elem.remove()
  }
  getPage() {
    return this.list.filter(elem => this.#isPage(elem));
  }
  removePage() {
    this.page?.remove();
  }
  removePrePage() {
    this.prePage?.remove();
  }

  clear() {
    Array.from(this.linksElem.children).forEach(elem => elem.remove());
  }
}

class Inku {
  /**
   * @param {InkuStyle} inkuStyle 
   */
  constructor(inkuStyle) {
    this.styleLinks = inkuStyle;
    this.init();
  }


  async getContent(filePath) {
    return (await fetch(filePath)).text();
  }
  async extractStyles(html, filePath) {
    const styleLinkRegex = /<link\s+rel=["']stylesheet["']\s+href=["'](.+?)["'].*?>/gi;
    const links = [...html.matchAll(styleLinkRegex)];
    const style = document.getElementById(filePath);

    for (const match of links) {
      const href = match[1];

      if (!style) {
        const linkEl = document.createElement('link');
        linkEl.rel = 'stylesheet';
        linkEl.href = href;
        linkEl.id = filePath;

        this.styleLinks.append(linkEl); // 먼저 넣고
        // ✅ 스타일 로딩될 때까지 기다림
        await new Promise(resolve => {
          if (linkEl.sheet) return resolve();
          linkEl.onload = () => resolve();
        });
        console.log(this.styleLinks.getPage()[0] === linkEl);
        this.styleLinks.removePrePage(); // 그 다음에 제거
      }

      html = html.replace(match[0], '');
    }

    return html;
  }

  async resolveIncludes(html) {
    const includeRegex = /{{\s*include\(["'](.+?)["']\)\s*}}/g;
    const matches = [...html.matchAll(includeRegex)];

    for (const match of matches) {
      const partialPath = match[1];
      const partialHTML = await this.fetchAndResolve(partialPath);
      html = html.replace(match[0], partialHTML);
    }

    return html;
  }

  async fetchAndResolve(filePath) {
    let html = await this.getContent(filePath);
    html = await this.resolveIncludes(html);
    html = this.extractStyles(html, filePath);

    return html;
  }

  async render(viewName = 'home') {
    const target = document.getElementById('app');

    // HTML 먼저 가져오기
    const html = await this.fetchAndResolve(`pages/${viewName}/index.html`);

    // 스타일 모두 로딩될 때까지 기다리기
    await Promise.all(
      this.styleLinks.list
        .filter(link => link.tagName === 'LINK' && link.rel === 'stylesheet')
        .map(link => new Promise(resolve => {
          if (link.sheet) return resolve(); // 이미 로드됨
          link.onload = () => resolve();
        }))
    );

    // 렌더링 완료 후 한 번에 보여주기
    target.innerHTML = html;
    target.classList.add('visible');
  }



  getCurrentRoute() {
    const hash = location.hash || '#/home';
    return hash.replace(/^#\//, '');
  }

  async route() {
    const viewName = this.getCurrentRoute();
    await this.render(viewName);
  }

  init() {
    window.addEventListener('DOMContentLoaded', () => this.route());
    window.addEventListener('hashchange', () => this.route());
  }
}

// 인스턴스 생성
const inkuStyle = new InkuStyle();
const inku = new Inku(inkuStyle);