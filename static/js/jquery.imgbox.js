/*
 * jQuery.imgBox
 * Yet another lightbox alternative.
 *
 * Initial release by jQueryGlobe.
 *
 * v2.x by Tsachi Shlidor (@shlidor).
 *
 * Version: 2.0.0-rc1 (09/02/2013).
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Copyright (c) 2009 jQueryGlobe
 */

;(function ($) {

  var elem, sib, that, opts, preloader, orig_pos, final_pos, busy = false,
    nr, zindex = 90,
    titleh = 0,
    margin = 40,
    fx = $.extend($('<div/>')[0], {
      prop: 0
    });

  $.fn.imgbox = function (settings) {
    return this.addClass('imgbox').unbind('click.pb').bind('click.pb', function () {
      $.imgbox($(this), settings);
      return false;
    });
  };

  $.imgbox = function (e, o) {
    if (busy) {
      return false;
    }

    elem = e;
    opts = $.extend({}, $.fn.imgbox.defaults, o);
    nr = $(elem).index();

    if ($('#imgbox-wrap-' + nr).length) {
      zoomOut();
      return false;
    }

    hideActivity();

    if (opts.overlayShow) {
      $('body').addClass('imgbox-with-overlay');
      if ($('#imgbox-overlay').length === 0){
        $('<div id="imgbox-overlay"></div>').appendTo('body');
      }
      $('#imgbox-overlay')
        .unbind().stop().hide()
        .css({
        'opacity': opts.overlayOpacity
      })
      .fadeIn('fast');
    } else {
      $('body').addClass('imgbox-no-overlay');
    }

    $('body').addClass('imgbox-' + opts.theme);

    preloader = new Image;
    preloader.src = getHref(elem); // $(elem).attr('href');

    if (preloader.complete === false) {
      showActivity();

      $(preloader).unbind().one('load', function () {
        zoomIn();
        hideActivity();
      });

    } else {
      zoomIn();
    }
  };

  $.fn.imgbox.defaults = {
    padding: 10,
    border: 2,
    alignment: 'center', // auto OR center
    allowMultiple: false,
    autoScale: true,
    speedIn: 500,
    speedOut: 500,
    easingIn: 'swing',
    easingOut: 'swing',
    zoomOpacity: false,
    overlayShow: true,
    overlayOpacity: 0.7,
    hideOnOverlayClick: true,
    hideOnContentClick: false,
    slideshow: true,
    theme: 'light'
  };

  function zoomIn() {
    busy = true;

    if (opts.allowMultiple === false) {
      $('.imgbox-wrap, .imgbox-bg-wrap').fadeOut('fast', function() {
        $(this).remove();
      });
    } else {
      zindex = zindex + 2;
    }

    final_pos = getZoomTo();

    var title = $(elem).attr('title') || '';

    $('<div id="imgbox-wrap-' + nr + '" class="imgbox-wrap"></div>')
      .css({
      'z-index': zindex,
      'padding': opts.padding
    })
    .append('<img class="imgbox-img" id="imgbox-img-' + nr + '" src="' + preloader.src + '" alt="' + title + '" />')
    .appendTo('body');

    $('<div id="imgbox-bg-' + nr + '" class="imgbox-bg-wrap"><div class="imgbox-bg-inner"></div></div>').appendTo('body');

    titleh = 0;

    if (title.length > 0) {
      $('#imgbox-wrap-' + nr)
        .append('<div class="imgbox-title">' + title + '</div>')
        .show();
    }

    if (opts.speedIn > 0) {
      var pos = getThumbPos(elem);

      orig_pos = {
        top: pos.top - opts.padding,
        left: pos.left - opts.padding,
        width: pos.width,
        height: pos.height
      };

      $('#imgbox-wrap-' + nr).css(orig_pos).show();
      $('#imgbox-bg-' + nr).css({
        'top': orig_pos.top,
        'left': orig_pos.left,
        'width': orig_pos.width + (opts.padding * 2),
        'height': orig_pos.height + (opts.padding * 2),
        'z-index': zindex - 1
      }).show().find('.imgbox-bg-inner').css({
        'margin': opts.padding - opts.border,
        'padding': opts.border
      });

      if (opts.zoomOpacity) {
        final_pos.opacity = 1;
      }

      fx.prop = 0;

      $(fx).animate({
        prop: 1
      }, {
        duration: opts.speedIn,
        easing: opts.easingIn,
        step: draw,
        complete: _finish
      });

    } else {
      $('#imgbox-img-' + nr).css('height', (final_pos.height) + 'px');
      $('#imgbox-wrap-' + nr).css(final_pos).fadeIn('normal', _finish);

      $('#imgbox-bg-' + nr).css({
        top: final_pos.top,
        left: final_pos.left,
        width: final_pos.width + (opts.padding * 2),
        height: final_pos.height + (opts.padding * 2),
        'z-index': zindex - 1
      }).fadeIn('normal');
    }

    if (opts.slideshow) {
      $('#imgbox-wrap-' + nr).append('<a href="#" class="imgbox-control imgbox-prev">‹</a><a href="#" class="imgbox-control imgbox-next">›</a>');
    }
  }

  function draw(pos) {
    var width = Math.round(orig_pos.width + (final_pos.width - orig_pos.width) * pos);
    var height = Math.round(orig_pos.height + (final_pos.height - orig_pos.height) * pos);

    var top = Math.round(orig_pos.top + (final_pos.top - orig_pos.top) * pos);
    var left = Math.round(orig_pos.left + (final_pos.left - orig_pos.left) * pos);

    $('#imgbox-wrap-' + nr).css({
      'width': width + 'px',
      'height': height + 'px',
      'top': top + 'px',
      'left': left + 'px'
    });

    $('#imgbox-bg-' + nr).css({
      'width': Math.round(width + opts.padding * 2) + 'px',
      'height': Math.round(height + opts.padding * 2) + 'px',
      'top': top + 'px',
      'left': left + 'px'
    });

    $('#imgbox-img-' + nr).css('height', Math.round(height - ((((height - Math.min(orig_pos.height, final_pos.height)) * 100) / (Math.max(orig_pos.height - final_pos.height, final_pos.height - orig_pos.height)) / 100))) + 'px');

    if (typeof final_pos.opacity !== 'undefined') {
      var opacity = pos < 0.3 ? 0.3 : pos;

      $('#imgbox-wrap-' + nr).css('opacity', opacity);
      $('#imgbox-bg-' + nr).css('opacity', opacity);
    }
  }

  function _finish() {
    if (opts.overlayShow && opts.hideOnOverlayClick) {
      $('#imgbox-overlay').bind('click', {
        elem: elem,
        nr: nr,
        opts: opts,
        titleh: titleh
      }, clickHandler);
    }

    $('#imgbox-wrap-' + nr)
      .css('filter', '')
      .bind('click', {
      elem: elem,
      nr: nr,
      opts: opts,
      titleh: titleh
    }, clickHandler);

    if ($('#imgbox-wrap-' + nr + ' .imgbox-close').length === 0) {
      $('#imgbox-wrap-' + nr)
        .append('<a href="#" class="imgbox-close">⊗</a>')
        .children('.imgbox-title')
        .show();
    }

    busy = false;
  }

  function clickHandler(e) {
    e.preventDefault();

    if (e.target.className == 'imgbox-close' || (e.data.opts.hideOnOverlayClick && e.target.id == 'imgbox-overlay') || (e.data.opts.hideOnContentClick && e.target.className == 'imgbox-img' && ($(this).css('z-index') == zindex || $('.imgbox-img').length == 1))) {
      elem = e.data.elem;
      nr = e.data.nr;
      opts = e.data.opts;
      titleh = e.data.titleh;
      zoomOut();

    } else if (e.target.className.indexOf('imgbox-control') !== -1) {
      // ToDo
      if (e.target.className.indexOf('imgbox-next') !== -1) {
        sib = $(elem).next().length === 0 ? $(elem).siblings(':visible:first') : $(elem).next();
      }
      if (e.target.className.indexOf('imgbox-prev') !== -1) {
        sib = $(elem).prev().length === 0 ? $(elem).siblings(':visible:last') : $(elem).prev();
      }
      preloader = new Image;
      preloader.src = getHref(sib); // $(sib).attr('href');
      that = $(this);
      if (preloader.complete === false) {
        showActivity();
        $(preloader).unbind().one('load', function () {
          replaceImage(that, sib);
          hideActivity();
        });
      } else {
        replaceImage(that, sib);
      }

    } else if ($(this).css('z-index') < zindex) {
      $(this).next('.imgbox-bg-wrap').css('z-index', ++zindex);
      $(this).css('z-index', ++zindex);
    }
  }

  function zoomOut() {
    if (busy) {
      return false;
    }

    busy = true;

    $('#imgbox-wrap-' + nr)
      .children('.imgbox-close, .imgbox-title')
      .remove();

    if (opts.speedOut > 0) {
      sib = sib || elem;
      var pos = getThumbPos(sib);

      orig_pos = {
        top: pos.top - opts.padding,
        left: pos.left - opts.padding,
        width: pos.width,
        height: pos.height
      };

      pos = $('#imgbox-wrap-' + nr).position();

      final_pos = {
        top: pos.top,
        left: pos.left,
        width: $('#imgbox-wrap-' + nr).width(),
        height: $('#imgbox-wrap-' + nr).height()
      };

      if (opts.zoomOpacity) {
        final_pos.opacity = 0;
      }

      setTimeout(function () {
        $('#imgbox-wrap-' + nr).css('z-index', 90);
        $('#imgbox-bg-' + nr).css('z-index', 90);
      }, opts.speedOut);

      fx.prop = 1;

      $(fx).animate({
        prop: 0
      }, {
        duration: opts.speedIn,
        easing: opts.easingIn,
        step: draw,
        complete: _clean_up
      });

    } else {

      if (opts.overlayShow) {
        _clean_up();

      } else {
        $('#imgbox-bg-' + nr).fadeOut('fast');
        $('#imgbox-wrap-' + nr).fadeOut('fast', _clean_up);
      }
    }
  }

  function replaceImage(that, sib) {
    if (busy) {
      return false;
    }

    busy = true;
    elem = sib;

    var pos = getZoomTo();

    orig_pos = {
      top: pos.top,
      left: pos.left,
      width: pos.width,
      height: pos.height
    };

    pos = $('#imgbox-wrap-' + nr).position();

    final_pos = {
      top: pos.top,
      left: pos.left,
      width: $('#imgbox-wrap-' + nr).width(),
      height: $('#imgbox-wrap-' + nr).height()
    };

    if (opts.zoomOpacity) {
      final_pos.opacity = 0;
    }

    $('#imgbox-wrap-' + nr + ' .imgbox-title').remove();

    var title = $(elem).attr('title') || '';

    titleh = 0;

    if (title.length > 0) {
      $('<div id="imgbox-tmp" class="imgbox-title" />').html(title).css('width', final_pos.width).appendTo('body');

      titleh = $('#imgbox-tmp').outerHeight();

      $('#imgbox-tmp').remove();
      $('<div class="imgbox-title">' + title + '</div>').appendTo('#imgbox-wrap-' + nr).show();
    }

    fx.prop = 1;

    $(fx).animate({
      prop: 0
    }, {
      duration: opts.speedIn,
      easing: opts.easingIn,
      step: draw,
      complete: _finish
    });

    that.find('.imgbox-img').fadeOut('fast', function() {
      $(this).attr('src', getHref(sib)).attr('title', title);
      $(this).fadeIn('fast');
    });
  }

  function _clean_up() {
    $('#imgbox-bg-' + nr).stop().remove();
    $('#imgbox-wrap-' + nr).remove();

    zindex = zindex > 90 ? zindex - 2 : 90;

    if (opts.overlayShow) {
      $('#imgbox-overlay').unbind().stop().fadeOut('fast');
    }

    // Remove 'imgbox*' classes.
    setTimeout(function () {
      var classes = $('body').attr("class").split(" ").map(function(item) {
          return item.indexOf("imgbox") === -1 ? item : "";
      });
      $('body').attr("class", classes.join(" "));
    }, opts.speedOut);

    busy = false;
  }

  function getZoomTo() {
    var wiew = getViewport();
    var to = {
      width: preloader.width,
      height: preloader.height
    };

    var horizontal_space = (opts.padding + margin) * 2;
    var vertical_space = (opts.padding + margin) * 2;

    if (opts.autoScale && (to.width > (wiew[0] - horizontal_space) || to.height > (wiew[1] - vertical_space))) {
      var ratio = Math.min(Math.min(wiew[0] - horizontal_space, to.width) / to.width, Math.min(wiew[1] - vertical_space, to.height) / to.height);

      to.width = Math.round(ratio * to.width);
      to.height = Math.round(ratio * to.height);
    }

    if (opts.alignment == 'center') {
      to.top = wiew[3] + ((wiew[1] - to.height - opts.padding * 2) * 0.5);
      to.left = wiew[2] + ((wiew[0] - to.width - opts.padding * 2) * 0.5);

    } else {
      var pos = getThumbPos(elem);

      to.top = pos.top - ((to.height - pos.height) * 0.5) - opts.padding;
      to.left = pos.left - ((to.width - pos.width) * 0.5) - opts.padding;

      to.top = to.top > wiew[3] + margin ? to.top : wiew[3] + margin;
      to.left = to.left > wiew[2] + margin ? to.left : wiew[2] + margin;

      to.top = to.top > wiew[1] + wiew[3] - (to.height + vertical_space) ? wiew[1] + wiew[3] - (to.height + (margin + opts.padding * 2)) : to.top;
      to.left = to.left > wiew[0] + wiew[2] - (to.width + horizontal_space) ? wiew[0] + wiew[2] - (to.width + (margin + opts.padding * 2)) : to.left;
    }

    if (opts.autoScale === false) {
      to.top = to.top > wiew[3] + margin ? to.top : wiew[3] + margin;
      to.left = to.left > wiew[2] + margin ? to.left : wiew[2] + margin;
    }

    to.top = parseInt(to.top, 10);
    to.left = parseInt(to.left, 10);

    return to;
  }

  function getViewport() {
    return [$(window).width(), $(window).height(), $(document).scrollLeft(), $(document).scrollTop()];
  }

  function getThumbPos(el) {
    var thumb = $(el).find('img').eq(0);
    var pos = thumb.offset();

    pos.top += parseFloat(thumb.css('paddingTop'));
    pos.left += parseFloat(thumb.css('paddingLeft'));

    pos.top += parseFloat(thumb.css('border-top-width'));
    pos.left += parseFloat(thumb.css('border-left-width'));

    pos.width = thumb.width();
    pos.height = thumb.height();

    return pos;
  }

  function showActivity() {
    if ($('.imgbox-img').length === 0) {
      elem.addClass('imgbox-loading');
    }
    else {
      $('.imgbox-wrap:last').addClass('imgbox-loading');
    }
  }

  function hideActivity() {
    $(preloader).unbind();
    $('.imgbox-loading').removeClass('imgbox-loading');
  }

  function cancelLoading() {
    hideActivity();

    if (opts.overlayShow) {
      $('#imgbox-overlay').unbind().stop().fadeOut(200);
    }
  }

  function getHref(e) {
    if ($(e).is('a')) {
      return $(e).attr('href');
    }
    else {
      return $(e).find('a').attr('href');
    }
  }

  function init() {
    $('.imgbox-loading').on('click', cancelLoading);
  }

  $(document).ready(function () {
    init();
  });

})(jQuery);
