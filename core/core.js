import { StyleManager } from './modules/StyleManager.js';
import { TemplateParser } from './modules/TemplateParser.js';
import { ScriptManager } from './modules/ScriptManager.js';
import { Router } from './modules/Router.js';

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
    if(this.prePage?.styleLinkRef) {
      this.#linkStyleList.delete(this.prePage?.styleLinkRef);
    }
    this.prePage?.remove();
  }

  /** 전체 스타일 링크 초기화 */
  clear() {
    Array.from(this.linksElem.children).forEach(elem => elem.remove());
  }
}

// InkuForParser: 중첩된 {{ for(...) }} ... {{ endfor }} 블록을 정확히 파싱하는 템플릿 파서
/* 일단 이건 나중에 */
class InkuForParser {
  constructor(context = {}) {
    this.context = context;
  }

  async parse(template, context = {}) {
    this.context = { ...this.context, ...context };  // context 병합
    return await this.#resolveBlocks(template, this.context);
  }

  async #resolveBlocks(template, context) {
    const tokens = this.#tokenize(template);
    const output = await this.#processTokens(tokens, context);
    return output;
  }

  #tokenize(template) {
    const regex = /{{\s*(for\((.*?)\)|endfor|!\s*\w+)\s*}}/g;
    const tokens = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        const text = template.slice(lastIndex, match.index);
        tokens.push({ type: 'text', value: text });
      }

      if (match[1].startsWith('for(')) {
        tokens.push({ type: 'for_open', value: match[2].trim() });
      } else if (match[1] === 'endfor') {
        tokens.push({ type: 'for_close' });
      } else if (match[1].startsWith('!')) {
        tokens.push({ type: 'variable', value: match[1].slice(1).trim() });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < template.length) {
      tokens.push({ type: 'text', value: template.slice(lastIndex) });
    }

    return tokens;
  }

  async #processTokens(tokens, context) {
    const stack = [];
    const output = [];
    let current = output;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'for_open') {
        const [varName, iterableExpr] = token.value.split(' in ').map(s => s.trim());
        const forBlock = { type: 'for', varName, iterableExpr, children: [] };
        current.push(forBlock);
        stack.push(current);
        current = forBlock.children;
      } else if (token.type === 'for_close') {
        current = stack.pop();
      } else {
        current.push(token);
      }
    }

    return await this.#renderTokens(output, context);
  }

  async #renderTokens(tokens, context) {
    let result = '';

    for (const token of tokens) {
      if (token.type === 'text') {
        result += token.value;
      } else if (token.type === 'variable') {
        const value = this.#evaluate(token.value, context);
        result += value ?? '';
      } else if (token.type === 'for') {
        const iterable = this.#evaluate(token.iterableExpr, context);

        if (Array.isArray(iterable)) {
          for (const item of iterable) {
            const loopCtx = { ...context, [token.varName]: item };
            result += await this.#renderTokens(token.children, loopCtx);
          }
        } else if (typeof iterable === 'number') {
          for (let i = 0; i < iterable; i++) {
            const loopCtx = { ...context, [token.varName]: i };
            result += await this.#renderTokens(token.children, loopCtx);
          }
        }
      }
    }

    return result;
  }

  #evaluate(expr, context) {
    try {
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `return (${expr})`);
      return fn(...values);
    } catch (e) {
      console.warn('❌ 표현식 평가 실패:', expr, e);
      return undefined;
    }
  }
}

// 사용 예시
// (async function() {
//   const parser = new InkuForParser({
//     items: ['🍎', '🍌', '🍇']
//   });
  
//   const html = await parser.parse(`
//     <ul>
//       {{ for(item in items) }}
//        {{ for(item in items) }}
//           <li>{{!item}}</li>
//         {{ endfor }}
//       {{ endfor }}
//     </ul>
//   `);
//   // console.log(html);
// })()


/**
 * HTML을 로드하고 스타일을 관리하며 렌더링을 처리하는 클래스
 */
class Inku {
  /**
   * @param {Object} [options={}] 설정 옵션
   * @param {string} [options.defaultRoute='home'] 기본 라우트
   * @param {string} [options.scriptClassName='inkuScript'] 스크립트 클래스 이름
   */
  constructor(options = {}) {
    const { defaultRoute = 'home', scriptClassName = 'inkuScript' } = options;
    
    // 모듈 초기화
    this.styleManager = new StyleManager();
    this.templateParser = new TemplateParser();
    this.scriptManager = new ScriptManager(scriptClassName);
    
    // 라우터 초기화 (렌더링 콜백 함수 전달)
    this.router = new Router(this.render.bind(this), defaultRoute);
    
    // 초기화
    this.router.init();
  }

  /**
   * 파일 경로에서 HTML 내용을 가져옵니다.
   * @param {string} filePath 파일 경로
   * @returns {Promise<string>} HTML 내용
   */
  async getContent(filePath) {
    return (await fetch(filePath)).text();
  }

  /**
   * HTML 주석 내 보간식을 제거합니다.
   * @param {string} html HTML 문자열
   * @returns {string} 처리된 HTML
   */
  removeInterpolationComment(html) {
    return html.replace(/<!--\s*{{.+}}\s*-->/g, '');
  }

  /**
   * HTML에서 <link rel="stylesheet"> 요소를 추출하고 동적으로 스타일을 추가합니다.
   * @param {string} html HTML 문자열
   * @param {string} filePath 파일 경로
   * @returns {Promise<string>} 스타일 링크가 제거된 HTML
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
        if (!this.styleManager.hasStyleLink(href) || this.styleManager.prePage) {
          this.styleManager.append(linkEl); // 링크 추가
  
          // 링크가 로딩될 때까지 기다림
          await new Promise(resolve => {
            if (linkEl.sheet) return resolve();
            linkEl.onload = () => resolve();
          });
  
          // 이전 페이지 스타일 제거
          this.styleManager.removePrePage();
        }
      }
  
      html = html.replace(match[0], ''); // 원래 HTML에서 <link> 제거
    }
  
    return html;
  }

  /**
   * HTML 내 include 템플릿을 처리합니다.
   * @param {string} html HTML 문자열
   * @param {Object} context 컨텍스트 객체
   * @returns {Promise<string>} 처리된 HTML
   */
  async resolveIncludes(html, context = {}) {
    html = await this.#resolveControlStatements(html, context);
    const includeRegex = /{{\s*include\(((?:"[^"]*"|'[^']*'|[^)])*)\)\s*}}/g;
    const matches = [...html.matchAll(includeRegex)];

    for (const match of matches) {
      const { filePath, args } = this.templateParser.parseInclude(match[1]);
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
   * 제어문(if, for 등)을 처리합니다.
   * @private
   * @param {string} html HTML 문자열
   * @param {Object} context 컨텍스트 객체
   * @returns {Promise<string>} 처리된 HTML
   */
  async #resolveControlStatements(html, context = {}) {
    // if 문 처리
    html = this.templateParser.resolveIfStatements(html, context);

    // 중첩 for 문 처리를 위해 TemplateParser 사용
    html = await this.templateParser.parse(html, context);

    // 변수 보간 처리
    html = html.replace(/\{\{\s*!([^}]+)\}\}/g, (_, expr) => {
      try {
        const keys = Object.keys(context);
        const values = Object.values(context);
        const fn = new Function(...keys, `return (${expr});`);
        return fn(...values);
      } catch (e) {
        console.warn('❌ 변수 보간 실패:', e);
        return '';
      }
    });

    return html;
  }

  /**
   * 파일 내용을 가져오고 include와 스타일도 처리합니다.
   * @param {string} filePath 파일 경로
   * @param {Object} context 컨텍스트 객체
   * @returns {Promise<string>} 처리된 HTML
   */
  async fetchAndResolve(filePath, context = {}) {
    let html = await this.getContent(filePath);
    html = this.removeInterpolationComment(html);

    // 템플릿 내 변수 선언 먼저 파싱
    const declaredContext = this.templateParser.parseContextDeclarations(html);

    // context 우선순위: 넘겨준 값 > 템플릿 기본값
    const mergedContext = { ...declaredContext, ...context };

    // 변수 선언 라인 제거 (출력에서 보이지 않게)
    html = html.replace(/\{\{\s*\$\w+\s*=.*?\}\}/g, '');

    html = await this.resolveIncludes(html, mergedContext);
    html = await this.extractStyles(html, filePath);
    return html;
  }

  /**
   * HTML을 렌더링합니다.
   * @param {string} [viewName='home'] 뷰 이름
   */
  async render(viewName = 'home') {
    const pageInfo = `pages/${viewName}/index.html`;
    const target = document.getElementById('app');
    
    // HTML 먼저 가져오기
    const html = await this.fetchAndResolve(pageInfo);

    // 모든 스타일이 로드될 때까지 기다리기
    await Promise.all(
      this.styleManager.list
        .filter(link => link.tagName === 'LINK' && link.rel === 'stylesheet')
        .map(link => new Promise(resolve => {
          if (link.sheet) return resolve();
          link.onload = () => resolve();
        }))
    );

    // 렌더링 완료 후 화면에 표시
    target.innerHTML = html;
    target.classList.add('visible');
    
    // 스크립트 처리
    this.scriptManager.runInlineScripts(target, pageInfo);
    await this.scriptManager.extractScriptsAndReplaceInDOM(target, pageInfo);
  }
}

// 인스턴스 생성 및 초기화
const inku = new Inku();

// 전역 객체에 노출 (필요한 경우)
window.inku = inku;
