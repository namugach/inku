/**
 * 스타일 링크를 동적으로 관리하는 클래스
 */
class InkuStyle {
  #linkStyleList = new Set();

  constructor() {
    this.linksElem = this.#createStyleLinks(); // 링크들을 담을 DOM 요소 생성
    this.head = document.head;

    /** @type {HTMLElement|null} 현재 페이지에 해당하는 스타일 링크 */
    this.page = null;
    /** @type {HTMLElement|null} 이전 페이지에 해당하는 스타일 링크 */
    this.prePage = null;

    this.#appendStyleLinks(); // head에 링크 DOM 추가
  }

  /** @returns {HTMLElement[]} 현재 등록된 스타일 링크 요소 목록 */
  get list() {
    return Array.from(this.linksElem.children);
  }

  /** 스타일 링크 요소를 담을 div 생성 */
  #createStyleLinks() {
    const div = document.createElement('div');
    div.id = 'inkuStyleLinks';
    return div;
  }

  /** 생성한 div를 head에 추가 */
  #appendStyleLinks() {
    this.head.appendChild(this.linksElem);
  }

  /**
   * 해당 요소가 페이지용 스타일인지 확인
   * @param {HTMLElement} elem 
   * @returns {boolean}
   */
  isPage(elem) {
    return elem.id.startsWith("pages/");
  }

  /**
   * 이미 추가된 스타일인지 확인
   * @param {string} string 
   * @returns {boolean}
   */
  hasStyleLink(string) {
    return this.#linkStyleList.has(string);
  }

  /**
   * 현재 페이지와 이전 페이지를 설정
   * @param {HTMLElement} elem 
   */
  #setPage(elem) {
    if (this.isPage(elem)) {
      this.prePage = this.page;
      this.page = elem;
    }
  }

  /**
   * 새로운 스타일 링크를 추가
   * @param {HTMLElement} elem 
   */
  append(elem) {
    this.#linkStyleList.add(elem.styleLinkRef);
    this.#setPage(elem);
    this.linksElem.appendChild(elem);
  }

  /**
   * 스타일 링크 요소 제거
   * @param {HTMLElement} elem 
   */
  remove(elem) {
    this.#linkStyleList.delete(elem.styleLinkRef);
    elem.remove();
  }

  /** 현재 페이지용 스타일 요소들을 가져옴 */
  getPage() {
    return this.list.filter(elem => this.isPage(elem));
  }

  /** 현재 페이지 스타일 제거 */
  removePage() {
    this.page?.remove();
  }

  /** 이전 페이지 스타일 제거 */
  removePrePage() {
    // console.log(this.prePag?.styleLinkRef)
    // this.#linkStyleList.delete(this.prePag?.styleLinkRef);
    if(this.prePag?.styleLinkRef) {
      this.#linkStyleList.delete(this.prePag?.styleLinkRef);
    }
    this.prePage?.remove();
  }

  /** 전체 스타일 링크 초기화 */
  clear() {
    Array.from(this.linksElem.children).forEach(elem => elem.remove());
  }
}


/**
 * HTML을 로드하고 스타일을 관리하며 렌더링을 처리하는 클래스
 */
class Inku {
  /**
   * @param {InkuStyle} inkuStyle - 스타일을 관리하는 인스턴스
   */
  constructor(inkuStyle) {
    this.styleLinks = inkuStyle;
    this.init(); // 라우팅 이벤트 등록
  }

  /**
   * 파일 경로에서 HTML 내용을 가져옴
   * @param {string} filePath 
   * @returns {Promise<string>}
   */
  async getContent(filePath) {
    return (await fetch(filePath)).text();
  }
  splitArgs(argsString) {
    console.log(argsString);
    const result = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
  
    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];
  
      if ((char === '"' || char === "'") && !inQuote) {
        inQuote = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuote) {
        inQuote = false;
        current += char;
      } else if (char === ',' && !inQuote) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current) result.push(current.trim());
    return result;
  }
  
  /**
   * include("path", key="value") 형식을 파싱해서 path와 파라미터 객체로 분리
   * @param {string} argsString
   * @returns {{filePath: string, args: Object}}
   */
  parseInclude(argsString) {
    const tokens = this.splitArgs(argsString);
    const filePath = tokens[0].replace(/^['"]|['"]$/g, '');
    const args = {};
  
    for (let i = 1; i < tokens.length; i++) {
      const [key, valRaw] = tokens[i].split('=');
      if (key && valRaw !== undefined) {
        args[key.trim()] = valRaw.trim().replace(/^['"]|['"]$/g, '');
      }
    }
  
    return { filePath, args };
  }
  
  /**
   * HTML에서 <link rel="stylesheet"> 요소를 추출하고 동적으로 스타일 추가
   * @param {string} html 
   * @param {string} filePath 
   * @returns {Promise<string>} 스타일 링크 제거된 HTML 반환
   */
  async extractStyles(html, filePath) {
    // HTML 주석 제거 (주석 안에 있는 link 태그 무시되게 처리)
    html = html.replace(/<!--[\s\S]*?-->/g, '');
  
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
        linkEl.styleLinkRef = href;
  
        // 동일한 href의 스타일이 이미 추가되어 있는지 확인 (중복 방지)
        if (!this.styleLinks.hasStyleLink(href) || this.styleLinks.prePage) {
          this.styleLinks.append(linkEl); // 링크 추가
  
          // 링크가 로딩될 때까지 기다림
          await new Promise(resolve => {
            if (linkEl.sheet) return resolve();
            linkEl.onload = () => resolve();
          });
  
          // 이전 페이지 스타일 제거
          this.styleLinks.removePrePage();
        }
      }
  
      html = html.replace(match[0], ''); // 원래 HTML에서 <link> 제거
    }
  
    return html;
  }
  

  /**
   * HTML 내 include 템플릿 처리 및 {{!변수}} 보간 처리
   * @param {string} html 
   * @param {Object} context
   * @returns {Promise<string>}
   */
  async resolveIncludes(html, context = {}) {
    const includeRegex = /{{\s*include\(((?:"[^"]*"|'[^']*'|[^)])*)\)\s*}}/g;
    const matches = [...html.matchAll(includeRegex)];
    console.log(matches);

    for (const match of matches) {
      const { filePath, args } = this.parseInclude(match[1]);
      const subContext = { ...context, ...args };
      let partialHTML = await this.fetchAndResolve(filePath, subContext);

      for (const [key, val] of Object.entries(subContext)) {
        partialHTML = partialHTML.replace(new RegExp(`{{!${key}}}`, 'g'), val);
      }

      html = html.replace(match[0], partialHTML);
    }

    return html;
  }

  /**
   * 파일 내용을 가져오고 include와 스타일도 처리
   * @param {string} filePath 
   * @param {Object} context
   * @returns {Promise<string>}
   */
  async fetchAndResolve(filePath, context = {}) {
    let html = await this.getContent(filePath);
    html = await this.resolveIncludes(html, context);
    html = await this.extractStyles(html, filePath);
    return html;
  }

  /**
   * 실제로 HTML을 렌더링함
   * @param {string} [viewName='home'] 
   */
  async render(viewName = 'home') {
    const target = document.getElementById('app');

    // HTML 먼저 가져오기
    const html = await this.fetchAndResolve(`pages/${viewName}/index.html`);

    // 모든 스타일이 로드될 때까지 기다리기
    await Promise.all(
      this.styleLinks.list
        .filter(link => link.tagName === 'LINK' && link.rel === 'stylesheet')
        .map(link => new Promise(resolve => {
          if (link.sheet) return resolve();
          link.onload = () => resolve();
        }))
    );

    // 렌더링 완료 후 화면에 표시
    target.innerHTML = html;
    target.classList.add('visible');
  }

  /** 현재 URL 해시로부터 뷰 이름을 얻음 */
  getCurrentRoute() {
    const hash = location.hash || '#/home';
    return hash.replace(/^#\//, '');
  }

  /** 현재 라우트에 따라 페이지 렌더링 */
  async route() {
    const viewName = this.getCurrentRoute();
    await this.render(viewName);
  }

  /** 라우팅 이벤트 리스너 등록 */
  init() {
    window.addEventListener('DOMContentLoaded', () => this.route());
    window.addEventListener('hashchange', () => this.route());
  }
}

// 인스턴스 생성 및 초기화
const inkuStyle = new InkuStyle();
const inku = new Inku(inkuStyle);
