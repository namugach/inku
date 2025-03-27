# Inku

![Inku Logo](./static/img/inku.png)

[English 🇺🇸](./README.md) | [한국어 🇰🇷](./README.ko.md)

---

**Inku** is a super-lightweight template system designed to build static websites in a component-based way.  
Without any build tools or frameworks, you can implement dynamic routing, reusable UI composition, and seamless page transitions using pure HTML/CSS/JS.

---

## ✨ Features

- Component-based HTML structure using `{{ include("filepath") }}` syntax
- Hash-based routing system based on files in the `pages/` directory
- Page-specific CSS is automatically extracted and injected into `<head>` (no duplicates, seamless transition)
- Flicker-free page transitions
- Pure JavaScript, works anywhere without installation

---

## 📁 Project Structure

```
inku/
├── index.html                # Entry point
├── core/
│   ├── core.js               # Core engine logic
│   └── init.css              # Reset / base styles
├── pages/                    # Pages used in routing
│   ├── home/index.html
│   └── intro/index.html
├── parts/                    # Reusable HTML components
│   ├── header.html
│   ├── main.html
│   └── footer.html
├── static/
│   ├── css/style.css         # Global CSS
│   ├── img/inku.png          # Logo image
│   └── script/script.js      # Optional JS scripts
├── README.md
└── README.ko.md
```

---

## 🚀 Getting Started

### 1. Run Local Server

```bash
python3 -m http.server 5000
```

Visit:
```
http://localhost:5000/
```

### 2. Routing Example

- `#/home` → loads `pages/home/index.html`
- `#/intro` → loads `pages/intro/index.html`

All content is rendered into the `#app` section inside `index.html`.

---

## 🪩 Example: Page Template

```html
<!-- pages/home/index.html -->
{{ include("parts/header.html") }}
{{ include("parts/main.html") }}
{{ include("parts/footer.html") }}
<link rel="stylesheet" href="pages/home/style.css">
```

CSS is automatically moved to the `<head>`, and applied only after the file is fully loaded.

---

## 🔤 Waht the Inku?!

**Inku** is inspired by the word `include`.  
It means to "speak and insert HTML naturally" as if it's flowing.

- `Inku` = include + 口 (Chinese character for "mouth" / receptacle)
- Short, memorable, and intuitive to use
- Syntax example: `{{ include("...") }}`

> Inku is small and simple, but designed with scalable and structured architecture in mind.

---

## 📄 License

MIT License. Free to use, modify, and distribute.

---

## 👨‍🔧 Authors
- by **namugach** & **P.Ty**


