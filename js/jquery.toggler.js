/*
 call the plugin with
 $('jquery-selector').toggler();

 either pass in { toggle_sel: 'jquery-selector' }
 or set data-toggle="jquery-selector" on the toggling element
*/
;(function ($, window, document, undefined) {
  var plugin_name = 'toggler',
      defaults = {
        group: 'def',
        on_class: 'on',
        toggle_on_click: true,
        show_on_mouseover: true,
        hide_on_mouseout: true,

        toggle_sel: null,

        delay: 50,         // how long should we wait before checking the hover count (in ms)
        hide_others: true, // hide other instances when this instance displays

        animate: false,    // set to 'slow', 'fast', 'normal' or an integer to to slide content

        after_init: null,  // callback
        on_show: null,     // callback
        on_hide: null      // callback
      },
      instances = {},      // grouped by settings.group
      $overlay = null;


  function hideAll(e) {
    e.preventDefault();
    var group, i, len;
    for (group in instances) {
      for (i=0, len=instances[group].length; i<len; i++) {
        instances[group][i]._hide();
      }
    }
    $overlay.hide();
  }


  function Plugin(el, opts) {
    this.settings = $.extend({}, defaults, opts);

    this.el = el;

    instances[this.settings.group] = instances[this.settings.group] || [];
    this.id = instances[this.settings.group].length; // unique identifier

    this._defaults = defaults;
    this._name = plugin_name;

    this.init();
  };


  Plugin.prototype = {
    is_locked: false,

    hover_count: 0,

    init: function() {
      this.$el = $(this.el);

      if (this.settings.toggle_sel === false) {
        // assume this is just defined as part of a group to hide others on
        // hover
        this.$all = this.$el;
        if (this.settings.show_on_mouseover) {
          this.$all.mouseenter($.proxy(this.over, this));
        }
        if (this.settings.hide_on_mouseout) {
          this.$all.mouseleave($.proxy(this.out, this));
        }
        return; // nothing more to do
      } else {
        if (this.settings.toggle_sel) {
          this.$toggled = this.$el.find(this.settings.toggle_sel);
        } else {
          this.$toggled = $(this.$el.data('toggle'));
        }
      }

      if (this.$toggled.length == 0) return; // nothing to do

      this.$all = this.$el.add(this.$toggled);

      if (this.settings.toggle_on_click) {
        this.$el.click($.proxy(this.toggle, this));
      }

      if (this.settings.show_on_mouseover) {
        this.$all.mouseenter($.proxy(this.over, this));
      }

      if (this.settings.hide_on_mouseout) {
        this.$all.mouseleave($.proxy(this.out, this));
      }

      if (typeof this.settings.after_init === 'function') {
        this.settings.after_init.call(this);
      }
    },

    toggle: function(e) {
      if (e) e.preventDefault();
      if (this.$el.hasClass(this.settings.on_class)) {
        this._hide(true);
        if (typeof this.settings.on_hide === 'function') {
          this.settings.on_hide.call(this);
        }
      } else {
        if (this.settings.hide_others) this.hideOthers();
        this._show(true);
      }
    },


    _hide: function(skip_check) {
      if (skip_check || this.$el.hasClass(this.settings.on_class)) {
        if (typeof this.settings.on_hide === 'function') {
          this.settings.on_hide.call(this);
        }
        if (this.settings.animate) {
          var that = this;
          this.$toggled.stop().slideUp(this.settings.animate, function() {
            that.$el.removeClass(that.settings.on_class);
          });
        } else {
          this.$all.removeClass(this.settings.on_class);
        }
        this.hover_count = 0; // probably not necessary
      }
    },

    _show: function(skip_check) {
      if (skip_check || !this.$el.hasClass(this.settings.on_class)) {
        if (this.settings.animate) {
          this.$el.addClass(this.settings.on_class);
          this.$toggled.stop().slideDown(this.settings.animate);
        } else {
          this.$all.addClass(this.settings.on_class);
        }
        if (typeof this.settings.on_show === 'function') {
          this.settings.on_show.call(this);
        }
      }
    },


    checkHoverCount: function() {
      if (this.hover_count <= 0) {
        this.hover_count = 0;
        this._hide();
      }
    },

    hideOthers: function() {
      var inst, i=0, len;
      for (len=instances[this.settings.group].length; i<len; i++) {
        inst = instances[this.settings.group][i];
        if (inst.id != this.id) {
          // immediately force hide others (no delay)
          inst.is_locked = false;
          inst._hide();
        }
      }
    },

    over: function(e) {
      if (this.settings.hide_others) this.hideOthers();
      if (this.is_locked) return;

      this.hover_count ++;

      this._show();
    },

    out: function(e) {
      if (this.is_locked) return;

      this.hover_count --;

      // check in X ms (allows mouse to go from one element to the other)
      setTimeout($.proxy(this.checkHoverCount, this), this.settings.delay);
    }

  };

  $.fn[plugin_name] = function(options) {
    var instance;
    return this.each(function() {
      if (!$.data(this, "plugin_" + plugin_name)) {
        instance = new Plugin(this, options);
        instances[instance.settings.group].push(instance);
        $.data(this, "plugin_" + plugin_name, instance);
      }
    });
  }

}(jQuery, window, document));
