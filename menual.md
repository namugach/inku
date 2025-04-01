## 🧩 Inku 템플릿 시스템 매뉴얼

Inku는 정적 HTML 기반의 SPA 렌더링 프레임워크로, 컴포넌트 기반의 동적 페이지 조립과 스타일링, 라우팅, 컨트롤 흐름(`if`, `for`) 처리를 지원한다.

---

### 1. 기본 개념

- **Inku**: 페이지 HTML을 비동기로 로드하고 렌더링한다.
- **InkuStyle**: 페이지 전환 시 필요한 스타일 `<link>`를 동적으로 로드/제거한다.
- **템플릿 문법**: `{{!변수}}`, `{{ include(...) }}`, `{{ for(...) }}`, `{{ if(...) }}` 등.
- **페이지 구조**: `pages/뷰이름/index.html` 파일이 기본 엔트리로 동작한다.

---

### 2. 디렉토리 구조 예시

```
pages/
├── home/
│   └── index.html
├── about/
│   └── index.html
parts/
├── header.html
├── footer.html
core/
├── common.css
├── util.js
```

---

### 3. 문법 설명

#### 3.1 변수 보간

```html
{{!title}}
```
- context로 전달된 값에 따라 치환됨.

#### 3.2 include 문법

```html
{{ include("parts/header.html", title="홈", isLogin=true) }}
```
- 지정한 파일을 로드 후 내부 변수 보간을 적용.
- context 병합 우선순위: 직접 전달된 값 > 템플릿 내부 선언.

#### 3.3 템플릿 내 context 선언

```html
{{ $title = "About" }}
{{ $count = 5 }}
```

#### 3.4 조건문

```html
{{ if(isLogin) }}
  <p>환영합니다!</p>
{{ endif }}
```

#### 3.5 반복문

```html
{{ for(item in items) }}
  <li>{{!item}}</li>
{{ endfor }}
```

- 숫자도 iterable 가능 (`for(i in 5)` → 0~4 순회)
- 문자열 배열 등도 자동 파싱됨.

---

### 4. 스타일 처리

```html
<link rel="stylesheet" href="core/common.css">
```

- 각 페이지의 `<link rel="stylesheet">`는 자동 추출됨.
- `pages/...` 형태는 한 페이지 단위로 관리됨 (기존 스타일 제거됨).
- 공유 스타일은 `core/`, `parts/` 등에서 유지됨.

---

### 5. 스크립트 처리

- `<script src="...">`: fetch 후 `eval()`로 실행됨.
- `<script>` (inline): 즉시 실행함수로 래핑되어 동작.

```html
<script>
  console.log('hello!');
</script>
```

---

### 6. 라우팅

- `#/home`, `#/about` 등으로 해시 라우팅 동작.
- 기본 라우트는 `#/home`이며, 변경 시 자동 렌더링됨.

---

### 7. 초기화 코드

```js
const inkuStyle = new InkuStyle();
const inku = new Inku(inkuStyle);
```

- 이 코드는 페이지 진입 시 한 번만 실행되면 됨.

