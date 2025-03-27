# Inku

![Inku Logo](./static/img/inku.png)

[English 🇺🇸](./README.md) | [한국어 🇰🇷](./README.ko.md)

---

**Inku**는 정적 웹사이트를 컴포넌트 단위로 구성할 수 있도록 도와주는 초경량 템플릿 시스템입니다.  
빌드 도구나 프레임워크 없이, 순수 HTML/CSS/JS만으로 동적인 라우팅, 재사용 가능한 UI 구성, 페이지 전환 등을 구현할 수 있습니다.


---

## 인쿠??

**Inku**는 `include`라는 단어에서 착안하여 만들어졌습니다.  
HTML 코드 조각을 "입으로 말하듯 자연스럽게 끼워 넣는다"는 개념에서  
한글 발음처럼 간단하고 부르기 쉬운 이름으로 구성되었습니다.

- `Inku` = include + 口(입 구, 조각을 받아들이는 느낌)
- 짧고 기억하기 쉬우며, 사용 방식과도 잘 어울립니다
- 직관적인 문법: `{{ include("...") }}`

> Inku는 작고 가볍지만, 구조적이고 확장 가능한 정적 웹 프로젝트를 지향합니다.

---

## ✨ 특징

- `{{ include("파일경로") }}` 문법으로 HTML 컴포넌트 분리 및 재사용
- `pages/` 내부의 HTML 파일을 기반으로 해시 라우팅 지원
- 페이지 전용 스타일을 자동 추출하여 `<head>`에 삽입 (중복 방지 및 전환 안정성)
- 깜빡임 없는 페이지 전환 처리
- 순수 JS로 구현되어 어디서든 쉽게 사용 가능

---

## 📁 프로젝트 구조

```
inku/
├── index.html                # 진입점 HTML
├── core/
│   ├── core.js               # 핵심 템플릿 엔진 로직
│   └── init.css              # 초기화용 CSS
├── pages/                    # 라우팅 대상 페이지들
│   ├── home/index.html
│   └── intro/index.html
├── parts/                    # 공통으로 사용되는 조각들
│   ├── header.html
│   ├── main.html
│   └── footer.html
├── static/
│   ├── css/style.css         # 공통 스타일
│   ├── img/inku.png          # 로고 이미지 등
│   └── script/script.js      # 부가 스크립트
├── README.md
└── README.ko.md
```

---

## 🚀 시작하기

### 1. 로컬 서버 실행

```bash
python3 -m http.server 5000
```

접속 주소:
```
http://localhost:5000/
```

### 2. 라우팅 구조

- `#/home` → `pages/home/index.html` 로드
- `#/intro` → `pages/intro/index.html` 로드

`index.html` 내부의 `#app` 영역에 템플릿이 렌더링됩니다.

---

## 🧩 예시: 페이지 템플릿

```html
<!-- pages/home/index.html -->
{{ include("parts/header.html") }}
{{ include("parts/main.html") }}
{{ include("parts/footer.html") }}
<link rel="stylesheet" href="pages/home/style.css">
```

해당 CSS는 자동 추출되어 `<head>`로 이동되며, 로딩이 완료된 후 기존 스타일과 교체됩니다.



---

## 📄 라이선스

MIT License. 자유롭게 사용, 수정, 배포 가능합니다.

---

## 👨‍🔧 Authors
- by **namugach** & **P.Ty**
