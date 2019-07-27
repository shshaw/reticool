;(function (root, factory) {
  if (typeof define === 'function' && define.amd) { define([], factory); }
  else if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { (root || window).RETICOOL = factory(); }
}(this, function () {

  // Styles injected into the <head> when a RETICOOL is created.
  var styles = '<style>.RETICOOL{position:fixed;top: 0;left:0;pointer-events:none;will-change:transform;transition: color 0.3s linear,opacity 0.3s linear;font-size: 20px;line-height:1;white-space:nowrap;z-index:9999999} .RETICOOL__inner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);} .RETICOOL__circle{border-style:solid;}</style>';


  // Rule out Firefox, even though it technically supports CSSvars.
  var cssVarSupport = CSS && CSS.supports && CSS.supports('transform', 'rotate(calc(1*1rad))');


  function RETICOOL(opts) {
    if (!(this instanceof RETICOOL)) { return new RETICOOL(opts); }

    const defaultConfig = {
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

    this.config = Object.assign({}, defaultConfig, opts);
    this.opts = opts;

    this.x = this.lx = this._x = this.x || window.innerWidth/ 2;
    this.y = this.ly = this._y = this.y || window.innerHeight/ 2;

    this.init();
  }



  /* ////////////////////////////////////////////////////////////////////////// */
  // Helper functions


  function ease(current,target,ease){ return current + (target - current) * ease; }

  var ep = Element.prototype;
  var matchFn =
        ep.matches ||
        ep.matchesSelector ||
        ep.msMatchesSelector ||
        ep.webkitMatchesSelector;

  function matches(el, match){ return matchFn && matchFn.call(el, match); }

  function throttle(func, delay) {
    var timer = null;

    return function () {
      var context = this, args = arguments;

      if (timer === null) {
        timer = setTimeout(function () {
          func.apply(context, args);
          timer = null;
        }, delay);
      }
    };
  }


  /* ////////////////////////////////////////////////////////////////////////// */


  RETICOOL.prototype = {

    constructor: RETICOOL,

    /** Private vars from here on out */
    width: 0,
    height: 0,
    dx: 0,
    dy: 0,
    timestamp: null,

    init(){
      if ( styles ) {
        document.head.insertAdjacentHTML('afterbegin',styles);
        styles = null;
      }

      if ( this.config.cursor ) { document.documentElement.style.cursor = this.config.cursor; }

      /* Element Creation */
      this.$ = this.$ || document.createElement('div');
      this.$.className = 'RETICOOL';
      this.setColor(this.config.color, this.config.opacity);

      this.$c = document.createElement('div');
      this.$c.className = 'RETICOOL__circle';
      this.$c.style.width = `${this.config.radius}px`;
      this.$c.style.height = `${this.config.radius}px`;
      this.$c.style.borderRadius = `${this.config.radius}px`;
      this.$c.style.borderWidth = `${this.config.borderWidth}px`;

      this.$i = document.createElement('div');
      this.$i.className = 'RETICOOL__inner';
      this.$i.innerHTML = this.config.content;

      this.$c.appendChild(this.$i);
      this.$.appendChild(this.$c);

      this.onUpdate = this.onUpdate || this.updateStyle;

      if ( this.config.useCSSVars && cssVarSupport ) { this.activateCSSVars(); }

      this.timestamp = Date.now();

      /* Bind all methods to instance */
      for (var key in this) {
        if ( this[key] && this[key].bind ) { this[key] = this[key].bind(this); }
      }

      /* Throttle expensive events */
      this.scrollUnlock = throttle(this.unlock, 100);
      this.onHover = throttle(this.onHover, 100);

      this.attach();
      this.update();
    },

    events(remove){

      const action = `${remove ? 'remove' : 'add'}EventListener`;

      /* Event Listeners */
      document[action]('mousemove',this.onMove);
      document[action]('touchstart',this.onMove);
      document[action]('touchmove',this.onMove);
      document[action]('touchend',this.onMove);
      if(!this.opts.content) {
        document[action]('keydown', this.changeSymbol);
      }

      document.documentElement[action]('mousedown',this.onDown);
      document.documentElement[action]('touchstart',this.onDown);
      document.documentElement[action]('mouseup',this.onUp);
      document.documentElement[action]('touchend',this.onUp);

      window[action]('scroll', this.scrollUnlock);
    },

    attach(){
      this.events();
      document.body.appendChild(this.$);
    },

    destroy(){
      this.events(true);
      this.$.parentNode.removeChild(this.$);
    },

    setColor(color, opacity){
      this.$.style.color = color;
      this.$.style.opacity = opacity;
    },

    onDown: function(){ this.down = true; },
    onUp: function(){ this.down = false; },

    onMove: function(e){
      e = e.touches ? e.touches[0] : e;
      this._x = e.clientX;
      this._y = e.clientY;
      this.onHover(e);
    },

    onHover: function(e){
      if ( this.config.lockTriggers ) {
        var t = e.target;
        if ( t !== this.lockTarget ) {

          while ( t !== document.documentElement && t.parentNode ) {
            if ( matches(t, this.config.lockTriggers) ) {
              this.lock(t);
              return;
            }
            t = t.parentNode;
          }

          if ( this.lockTarget ) { this.unlock(); }
          this.lockTarget = null;
        }
      }
    },

    update: function(){
      requestAnimationFrame(this.update);

      var tx = this._x,
          ty = this._y,
          w, h, now, dt, dx, dy;

      if ( this.locked && this.lockx && this.locky ) {
        tx = (this.lockx) - ( this.lockx - tx ) * this.config.lockTravel;
        ty = (this.locky) - ( this.locky - ty ) * this.config.lockTravel;
      }

      this.x = ease(this.x, tx, this.config.ease);
      this.y = ease(this.y, ty, this.config.ease);

      if ( this.locked ) {
        this.rotation = 0;
        dx = 0;
        dy = 0;
      } else {
        dx = (this.x - this.lx);
        dy = (this.y - this.ly);
      }

      this.dx = Math.floor( ease(this.dx, dx, this.config.ease) * 100 ) / 100;
      this.dy = Math.floor( ease(this.dy, dy, this.config.ease) * 100 ) / 100;

      // Calculate Velocity
      now = Date.now();
      dt = now - this.timestamp;
      this.timestamp = now;
      this.vx = Math.min( Math.abs(this.dx) / dt, 2 );
      this.vy = Math.min( Math.abs(this.dy) / dt, 2 );

      this.rotation = ( this.locked ? 0 : Math.atan2(this.dy, this.dx) );

      w = this.lockWidth ? this.lockWidth : this.config.radius;
      h = this.lockHeight ? this.lockHeight : this.config.radius;
      if ( this.down ) { w -= 10; h -= 10; }

      this.width = Math.round( ease( this.width, w, this.config.lockEase ) * 10 ) / 10;
      this.height = Math.round( ease( this.height, h, this.config.lockEase ) * 10 ) / 10;

      this.lx = this.x;
      this.ly = this.y;

      this.onUpdate(this);
    },

    activateCSSVars(){

      this.$.style.transform =
        'translate( calc( var(--dx) * -1px ), calc( var(--dy) * -1px ) )' +
        ' translate3d( calc( var(--x) * 1px ), calc( var(--y) * 1px ), 0px )';

      this.$c.style.transform =
        "translate3d( -50%, -50%, 0px )"
        + " translate( calc( var(--vx) * -4% ), calc( var(--vy) * -4% ) )"
        + " rotate( calc( var(--rotation) * 1rad) )"
        + " scaleX( calc( var(--vx)/2 + var(--vy)/2 + 1 ) )";

      this.$c.style.width = 'calc( var(--width) * 1px )';
      this.$c.style.height = 'calc( var(--height) * 1px )';

      this.$i.style.transform = 'translate(-50%, -50%) rotate(calc( var(--rotation) * -1rad) ';

      this.onUpdate = this.updateCSSVars;
    },

    updateCSSVars: function(){
      this.$.style.setProperty('--width', this.width );
      this.$.style.setProperty('--height', this.height );
      this.$.style.setProperty('--x', this.x );
      this.$.style.setProperty('--y', this.y );
      this.$.style.setProperty('--vx', this.vx );
      this.$.style.setProperty('--vy', this.vy );
      this.$.style.setProperty('--dx', this.dx );
      this.$.style.setProperty('--dy', this.dy );
      this.$.style.setProperty('--rotation', this.rotation );
    },

    updateStyle: function(){

      this.$.style.transform = 'translate3d('
        + ( this.x + ( this.dx * -1 ) ) + 'px,'
        + ( this.y + ( this.dy * -1 ) ) + 'px, 0px)';

      this.$c.style.transform =
        'translate3d(' + (-50 - (this.vx*4)) + '%, ' + (-50 - (this.vy*4)) + '%, 0px)'
        + ' rotate(' + this.rotation + 'rad)'
        + ' scaleX(' + ( this.vx/2 + this.vy/2 + 1) + ')';

      this.$i.style.transform = `translate(-50%, -50%) rotate(${-this.rotation}rad)`;

      this.$c.style.width = `${this.width}px`;
      this.$c.style.height = `${this.height}px`;

    },

    changeSymbol: function(e) {
      const getRandomInt = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };
      const symbols = ['+','[ &nbsp; &nbsp; ]','❪ &nbsp; ❫','❮ &nbsp; ❯','⎔','▿','•','△','▽','✕','◇','⏚','⏛'];

      this.innerHTML = symbols[getRandomInt(0, symbols.length - 1)];
    },

    lock(x, y, w, h){
      if ( x !== undefined ) {
        this.locked = true;
        this.setColor(this.config.lockColor, this.config.lockOpacity);
        if ( this.config.lockClass ) { this.$.classList.add(this.config.lockClass); }

        if ( y == undefined && x.getBoundingClientRect() ) {

          this.lockTarget = x;

          var rect = x.getBoundingClientRect();
          w = Math.round( rect.right - rect.left);
          h = Math.round( rect.bottom - rect.top);

          x = rect.left + ( w / 2 );
          y = rect.top + ( h / 2 );

          this.down = false;
        }

        this.lockx = x;
        this.locky = y;

        if ( this.config.lockExpand !== false ) {
          this.lockWidth = w + this.config.lockExpand;
          this.lockHeight = h + this.config.lockExpand;
        }

        return;
      }
      this.unlock();
    },

    unlock(){
      if ( this.locked ) {
        if ( this.config.lockClass ) { this.$.classList.remove(this.config.lockClass); }
        this.lx = this.x;
        this.ly = this.y;
        this.setColor(this.config.color, this.config.opacity);
      }
      this.lockWidth = 0;
      this.lockHeight = 0;
      this.lockx = 0;
      this.locky = 0;
      this.rotation = 0;
      this.locked = false;
    }

  }

  Object.defineProperties(
    RETICOOL.prototype,
    {
      innerHTML: {
        get: function(){
          return this.config.content;
        },
        set: function(val){
          this.config.content = val;
          if ( this.$i ) { this.$i.innerHTML = val; }
          return val;
        }
      }
    });

  return RETICOOL;

}));
