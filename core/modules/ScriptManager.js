/**
 * 스크립트 로딩 및 실행을 관리하는 클래스
 */
export class ScriptManager {
  /**
   * @param {string} [scriptClassName='inkuScript'] 스크립트 요소에 추가할 클래스 이름
   */
  constructor(scriptClassName = 'inkuScript') {
    this.scriptClassName = scriptClassName;
  }

  /**
   * 인라인 스크립트를 실행합니다.
   * @param {HTMLElement} container 스크립트가 포함된 컨테이너 요소
   * @param {string} pageInfo 페이지 정보
   */
  runInlineScripts(container, pageInfo) {
    const scripts = container.querySelectorAll('script');
    const className = `${this.scriptClassName}:${pageInfo}`;
    
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
   * 외부 스크립트를 로드하고 DOM에 삽입합니다.
   * @param {HTMLElement} container 스크립트가 포함된 컨테이너 요소
   * @param {string} pageInfo 페이지 정보
   * @returns {Promise<void>}
   */
  async extractScriptsAndReplaceInDOM(container, pageInfo) {
    const scripts = container.querySelectorAll('script[src]');
  
    for (const oldScript of scripts) {
      const src = oldScript.getAttribute('src');
      try {
        const response = await fetch(src);
        const scriptText = await response.text();
  
        const newScript = document.createElement('script');
        newScript.className = `${this.scriptClassName}:${pageInfo}`;
        newScript.textContent = `(() => {\n${scriptText}\n})();\n//# sourceURL=${src}`;
  
        // 기존 위치에 새 스크립트를 그대로 삽입
        oldScript.replaceWith(newScript);
  
      } catch (e) {
        console.warn(`❌ 스크립트 불러오기 실패: ${src}`, e);
      }
    }
  }
} 