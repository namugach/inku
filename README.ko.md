# Inku
![Inku Logo](./static/img/inku.png)


[English 🇺🇸](./README.md) | [한국어 🇰🇷](./README.ko.md)


**Inku**는 빌드 도구나 프레임워크 없이도 정적 웹사이트를 구성할 수 있도록 설계된,  
가볍고 직관적인 HTML 템플릿 시스템입니다.  
컴포넌트 기반으로 HTML을 분리하고, 라우팅까지 처리할 수 있어 유지보수성과 확장성이 뛰어납니다.

## 인쿠??

**Inku**는 `include`라는 단어에서 착안하여 만들어졌습니다.  
HTML 코드 조각을 "입으로 말하듯 자연스럽게 끼워 넣는다"는 개념에서  
한글 발음처럼 간단하고 부르기 쉬운 이름으로 구성되었습니다.

- `Inku` = include + 口(입 구, 조각을 받아들이는 느낌)
- 짧고 기억하기 쉬우며, 사용 방식과도 잘 어울립니다
- 직관적인 문법: `{{ include("...") }}`

> Inku는 작고 가볍지만, 구조적이고 확장 가능한 정적 웹 프로젝트를 지향합니다.


---

## 주요 기능

- `{{ include("...") }}` 문법으로 HTML 조각을 삽입
- 중첩 템플릿 로딩 지원 (재귀 처리)
- 해시 기반 라우팅 지원 (`#/home`, `#/intro` 등)
- 새로고침 시 현재 위치 유지
- 완전한 정적 사이트 구성 가능 (HTML + JS + CSS만으로 작동)

---

## 디렉토리 구조

```
inku/
├── index.html                  # 진입점
├── compo/
│   ├── home.html               # 홈 페이지 템플릿
│   └── intro.html              # 소개 페이지 템플릿
├── parts/
│   ├── header.html             # 공통 헤더
│   ├── main.html               # 메인 콘텐츠
│   └── footer.html             # 공통 푸터
├── core/
│   └── core.js                 # Inku 템플릿 엔진
├── static/
│   ├── css/style.css           # 스타일 파일
│   ├── img/                    # 이미지 파일
│   └── script/script.js        # 부가 스크립트
└── README.md
```

---

## 시작하기

### 1. 로컬 서버 실행

```bash
python3 -m http.server 5000
```

브라우저에서 아래 주소로 접속합니다:  
→ `http://localhost:5000/index.html`

---

### 2. 템플릿 작성 예시

```html
<!-- compo/home.html -->
{{ include("parts/header.html") }}

<main>
  {{ include("parts/main.html") }}
</main>

{{ include("parts/footer.html") }}
```

---

### 3. 페이지 이동 (라우팅)

```html
<!-- index.html -->
<a href="#/home">Home</a>
<a href="#/intro">Intro</a>
```

라우팅은 URL의 해시 값을 기준으로 처리되며,  
새로고침 시에도 현재 위치를 유지합니다.

---

## API 개요

### `inku.fetchAndResolve(path: string): Promise<string>`

지정된 HTML 파일 내의 모든 `include()` 구문을 재귀적으로 파싱하여 반환합니다.

### `inku.render(viewName: string)`

`compo/` 디렉토리 내에서 지정된 템플릿을 로드하여 렌더링합니다.

### `inku.route()`

현재 URL의 해시(`location.hash`)를 분석하여 해당하는 템플릿을 렌더링합니다.

---

## 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다.  
자유롭게 사용, 수정, 배포할 수 있습니다.

---

## 제작

- 기획 및 구조 설계: [namugach]
- 템플릿 엔진 개발: [mypt]
- 목표: **가볍고, 직관적이며, 유지보수가 쉬운 HTML 템플릿 시스템**