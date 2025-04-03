/**
 * 스타일 링크를 동적으로 관리하는 클래스
 */
export class StyleManager {
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