/**
 * 라우팅을 관리하는 클래스
 */
export class Router {
  /**
   * @param {Function} renderCallback 라우트 변경 시 호출할 렌더링 콜백 함수
   * @param {string} [defaultRoute='home'] 기본 라우트
   */
  constructor(renderCallback, defaultRoute = 'home') {
    this.renderCallback = renderCallback;
    this.defaultRoute = defaultRoute;
  }

  /**
   * 현재 URL 해시로부터 뷰 이름을 얻습니다.
   * @returns {string} 현재 라우트 이름
   */
  getCurrentRoute() {
    const hash = location.hash || `#/${this.defaultRoute}`;
    return hash.replace(/^#\//, '');
  }

  /**
   * 현재 라우트에 따라 페이지를 렌더링합니다.
   * @param {Event} [e] 이벤트 객체
   */
  async route(e) {
    const viewName = this.getCurrentRoute();
    await this.renderCallback(viewName);
  }

  /**
   * 라우팅 이벤트 리스너를 등록합니다.
   */
  init() {
    window.addEventListener('DOMContentLoaded', e => this.route(e));
    window.addEventListener('hashchange', e => this.route(e));
  }
} 