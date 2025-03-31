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

// InkuForParser: 중첩된 {{ for(...) }} ... {{ endfor }} 블록을 정확히 파싱하는 템플릿 파서
/* 일단 이건 나중에 */
class InkuForParser {
  constructor(context = {}) {
    this.context = context;
  }

  async parse(template) {
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
        const trimmed = token.value.replace(/^[ \n]+/gm, '');
        console.log(1, token);
        result += trimmed;
      } else if (token.type === 'variable') {
        result += context[token.value] ?? '';
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
    console.log(result);

    return result;
  }

  #evaluate(expr, context) {
    try {
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `return (${expr})`);
      return fn(...values);
    } catch {
      return [];
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
   * @param {InkuStyle} inkuStyle - 스타일을 관리하는 인스턴스
   */
  constructor(inkuStyle) {
    this.styleLinks = inkuStyle;
    // this.forParser = new InkuForParser();
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
        const rawVal = valRaw.trim();
  
        try {
          // 진짜로 평가해서 배열/숫자/객체로 바꿈
          const parsed = new Function(`return (${rawVal})`)();
          args[key.trim()] = parsed;
        } catch {
          // 평가 실패하면 그냥 문자열로
          args[key.trim()] = rawVal.replace(/^['"]|['"]$/g, '');
        }
      }
    }
  
    return { filePath, args };
  }
  removeInterpolationComment(html) {
    return html.replace(/<!--\s*{{.+}}\s*-->/g, '');
  }
  parseContextDeclarations(html) {
    const context = {};
    const regex = /\{\{\s*\$(\w+)\s*=\s*(.*?)\s*\}\}/g;
    let match;
  
    while ((match = regex.exec(html)) !== null) {
      const [, key, rawValue] = match;
  
      try {
        const value = new Function(`return (${rawValue})`)();
        context[key] = value;
      } catch {
        context[key] = rawValue.replace(/^['"]|['"]$/g, '');
      }
    }
  
    return context;
  }
  
  
  runInlineScripts(container, pageInfo) {
    const scripts = container.querySelectorAll('script');
  
    const className = `inKuScript:${pageInfo}`;
    
    for (const oldScript of scripts) {
      // src 있는 건 무시 (extractScriptsAndReplaceInDOM에서 처리함)
      if (oldScript.src) continue;
  
      const newScript = document.createElement('script');
      newScript.className = className;
  
      newScript.textContent = `(() => {\n${oldScript.textContent}\n})();`;
  
      oldScript.replaceWith(newScript);
    }
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
  
  async extractScriptsAndReplaceInDOM(container, pageInfo) {
    const scripts = container.querySelectorAll('script[src]');
  
    for (const oldScript of scripts) {
      const src = oldScript.getAttribute('src');
      try {
        const response = await fetch(src);
        const scriptText = await response.text();
  
        const newScript = document.createElement('script');
        newScript.className = `inkuScript:${pageInfo}`;
        newScript.textContent = `(() => {\n${scriptText}\n})();\n//# sourceURL=${src}`;
  
        // 기존 위치에 새 스크립트를 그대로 삽입
        oldScript.replaceWith(newScript);
  
      } catch (e) {
        console.warn(`❌ 스크립트 불러오기 실패: ${src}`, e);
      }
    }
  }
 
  #resolveIfStatements(html, context) {
    const result = html.replace(/{{\s*if\s*\((.*?)\)\s*}}([\s\S]*?){{\s*endif\s*}}/g, (_, condition, content) => {
      try {
        const fn = new Function(...Object.keys(context), `return (${condition});`);
        const result = fn(...Object.values(context));
        return result ? content : '';
      } catch (e) {
        console.warn('❌ if 처리 실패:', e);
        return '';
      }
    });
    return result;
  }
  
  #resolveForStatements(html, context) {
    const forPattern = /{{\s*for\s*\((\w+)\s+in\s+(.*?)\)\s*}}([\s\S]*?){{\s*endfor\s*}}/g;
  
    return html.replace(forPattern, (match, loopVarName, iterableExpr, loopContent) => {
      try {
        // 1. context로 표현식 평가
        const keys = Object.keys(context);
        const values = Object.values(context);
        const fn = new Function(...keys, `return (${iterableExpr})`);
        let result = fn(...values);
  
        // 🔥 2. 만약 문자열인데 배열처럼 생겼으면 강제로 파싱
        if (typeof result === 'string' && /^\[.*\]$/.test(result.trim())) {
          try {
            result = new Function(`return (${result})`)();
          } catch {
            console.warn('❌ 문자열 평가 실패:', result);
          }
        }
  
        // 3. 반복 가능한 배열로 전환
        let iterable = [];
  
        if (Array.isArray(result)) {
          iterable = result;
        } else if (typeof result === 'number') {
          iterable = Array.from({ length: result }, (_, i) => i);
        } else {
          console.warn('❌ for: 반복 불가능한 값입니다.', result);
          return '';
        }
  
        // 4. 보간 처리
        const output = [];
  
        for (const val of iterable) {
          const replaced = loopContent.replace(
            new RegExp(`{{\\s*!\\s*${loopVarName}\\s*}}`, 'g'),
            val
          );
          output.push(replaced);
        }
  
        return output.join('');
      } catch (err) {
        console.warn('❌ for 처리 중 오류:', err);
        return '';
      }
    });
  }
  
  
  

  async #resolveControlStatements(html, context = {}) {
    html = await this.#resolveIfStatements(html, context);
    html = await this.#resolveForStatements(html, context);
    return html;
  }
  
  /**
   * HTML 내 include 템플릿 처리 및 {{!변수}} 보간 처리
   * @param {string} html 
   * @param {Object} context
   * @returns {Promise<string>}
   */
  async resolveIncludes(html, context = {}) {
    html = await this.#resolveControlStatements(html, context);
    const includeRegex = /{{\s*include\(((?:"[^"]*"|'[^']*'|[^)])*)\)\s*}}/g;
    const matches = [...html.matchAll(includeRegex)];

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
    html = this.removeInterpolationComment(html);

    // 템플릿 내 변수 선언 먼저 파싱
    const declaredContext = this.parseContextDeclarations(html);

    // context 우선순위: 넘겨준 값 > 템플릿 기본값
    const mergedContext = { ...declaredContext, ...context };

    // 변수 선언 라인 제거 (출력에서 보이지 않게)
    html = html.replace(/\{\{\s*\$\w+\s*=.*?\}\}/g, '');

    html = await this.resolveIncludes(html, mergedContext);
    html = await this.extractStyles(html, filePath);
    return html;
  }


  /**
   * 실제로 HTML을 렌더링함
   * @param {string} [viewName='home'] 
   */
  async render(viewName = 'home') {
    const pageInfo = `pages/${viewName}/index.html`;
    const target = document.getElementById('app');
    // HTML 먼저 가져오기
    const html = await this.fetchAndResolve(pageInfo);

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
    this.runInlineScripts(target, pageInfo);
    await this.extractScriptsAndReplaceInDOM(target, pageInfo);
  }

  /** 현재 URL 해시로부터 뷰 이름을 얻음 */
  getCurrentRoute() {
    const hash = location.hash || '#/home';
    return hash.replace(/^#\//, '');
  }

  /** 현재 라우트에 따라 페이지 렌더링 */
  async route(e) {
    const viewName = this.getCurrentRoute();
    await this.render(viewName);
  }

  /** 라우팅 이벤트 리스너 등록 */
  init() {
    window.addEventListener('DOMContentLoaded', e => this.route(e));
    window.addEventListener('hashchange', e => this.route(e));
  }
}

// 인스턴스 생성 및 초기화
const inkuStyle = new InkuStyle();
const inku = new Inku(inkuStyle);
