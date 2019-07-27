<h1 align="center">RETICOOL</h1>

<p align="center">Chase the cursor with style</p>

<div align="center">

![Reticool Usage](https://raw.githubusercontent.com/shshaw/reticool/master/assets/reticool.gif)

</div>

**Demo:** https://shshaw.github.io/reticool/

## Installation

#### Using a CDN

Minified

```html
<script src="https://cdn.jsdelivr.net/gh/shshaw/reticool/reticool.min.js"></script>
```

Uncompiled (for development environments)

```html
<script src="https://cdn.jsdelivr.net/gh/shshaw/reticool/reticool.js"></script>
```

#### Using NPM
```
npm i reticool
```

```js
import RETICOOL from 'reticool';

new RETICOOL();
```

## Usage
Just drop this snippet in your JavaScript:

```js
new RETICOOL();
```

and your stylized cursor will lock on every `<a>`, `<button>`, and
elements with `data-lock` attribute.

You may also pass options into reticool.

```js
const config = {
  /** Replace document cursor. Not recommended to set to 'none' */
  cursor: 'crosshair',

  /** Size of your RETICOOL */
  radius: 80,

  /** Border width around your RETICOOL */
  borderWidth: 3,

  /** The default color of your RETICOOL */
  color: '#49D292',

  /** The default opacity of your RETICOOL */
  opacity: 0.85,

  /**
   * Easing of your RETICOOL.
   * The lower the number the slow the RETICOOL will move
   * Recommended to keep this below 0.6 to avoid visual glitches
   */
  ease: 0.2,

  /** Selectors to trigger RETICOOL locking automatically on specific elements */
  lockTriggers: '[data-lock], a, button',

  /** Your RETICOOL color when locked */
  lockColor: '#E8F79A',

  /** Your RETICOOL opacity when locked */
  lockOpacity: 0.99,

  /** A class added to your RETICOOL when locked */
  lockClass: null,

  /** Amount your RETICOOL will travel around the locked point */
  lockTravel: 0.15,

  /**
   * Expand your RETICOOL over the element it locks to.
   * Set to `false` to disable expansion,
   * Set to `0` to fit the element exactly
   * Set to any other number, including negative to expand by that many pixels around the element
   */
  lockExpand: 20,

  /** How fast your RETICOOL changes sizes */
  lockEase: 0.3,

  /**
   * What should appear inside your RETICOOL.
   * You can inject custom HTML for styling, an SVG or IMG, or set it to null for no center
   */
  content: '+',

  /** Use CSS Vars to power your RETICOOL, if supported */
  useCSSVars: true,
};

new RETICOOL(config);
```

You can rotate through multiple inner cursor content/symbol by hitting any key on the keyboard.
To disable this behavior, add a custom `content` property to the config of your RETICOOL instance.

## License

Reticool is released under [MIT License](./LICENSE)
