# Inku
![Inku Logo](./static/img/inku.png)

[English 🇺🇸](./README.md) | [한국어 🇰🇷](./README.ko.md)

**Inku** is a lightweight and intuitive HTML templating system  
designed for building static websites without the need for build tools or frameworks.  
It supports a component-based structure and hash-based routing,  
making it highly maintainable and scalable.


## What the Inku??

The name **Inku** is inspired by the word `include`.  
It symbolizes a simple and natural way to "insert" reusable HTML snippets —  
as if speaking or composing them fluidly into a page.

- `Inku` = include + 口 (the Chinese character for "mouth" or "container")
- Short, memorable, and easy to use
- Pairs well with its syntax: `{{ include("...") }}`

> Inku aims to be lightweight yet structurally powerful for static web development.

---

## Features

- Use `{{ include("...") }}` syntax to insert HTML components
- Supports recursive template loading (nested includes)
- Hash-based routing (e.g., `#/home`, `#/intro`)
- Maintains the current view even on page refresh
- Works fully in static environments (HTML + JS + CSS only)

---

## Project Structure

```
inku/
├── index.html                  # Entry point
├── compo/
│   ├── home.html               # Home page template
│   └── intro.html              # Intro page template
├── parts/
│   ├── header.html             # Shared header
│   ├── main.html               # Main content section
│   └── footer.html             # Shared footer
├── core/
│   └── core.js                 # Inku template engine
├── static/
│   ├── css/style.css           # Stylesheet
│   ├── img/                    # Image assets
│   └── script/script.js        # Optional scripts
└── README.md
```

---

## Getting Started

### 1. Run a local server

```bash
python3 -m http.server 5000
```

Then open the following URL in your browser:  
→ `http://localhost:5000/index.html`

---

### 2. Example Template Usage

```html
<!-- compo/home.html -->
{{ include("parts/header.html") }}

<main>
  {{ include("parts/main.html") }}
</main>

{{ include("parts/footer.html") }}
```

---

### 3. Navigation (Routing)

```html
<!-- index.html -->
<a href="#/home">Home</a>
<a href="#/intro">Intro</a>
```

Routing is handled based on the URL hash (`location.hash`).  
The current view is preserved even after a page refresh.

---

## API Overview

### `inku.fetchAndResolve(path: string): Promise<string>`

Fetches and recursively parses all `include()` statements from the given HTML file.

### `inku.render(viewName: string)`

Loads and renders the specified template from the `compo/` directory.

### `inku.route()`

Parses the current hash (`location.hash`) and renders the appropriate template accordingly.

---

## License

This project is licensed under the MIT License.  
You are free to use, modify, and distribute it.

---

## Authors

- Planning & Structure: [namugach]
- Template Engine Development: [mypt]
- Objective: **A lightweight, intuitive, and maintainable native HTML templating system**
