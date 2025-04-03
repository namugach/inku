import { StyleManager } from './modules/StyleManager.js';
import { TemplateParser } from './modules/TemplateParser.js';
import { ScriptManager } from './modules/ScriptManager.js';
import { Router } from './modules/Router.js';

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
