jQuery(function ($) {
  function isModalHash(hash) {
    return !!hash && $(hash).length && $(hash).is('.modal-window');
  }

  function openModal($modal, { setHash = false } = {}) {
    if (!$modal || !$modal.length) return;
    $('.modal-window.visible').removeClass('visible');
    $modal.addClass('visible');
    $('body').addClass('modal-open');
    if (setHash) {
      // nastav hash bez scrollu
      history.pushState(null, '', '#' + $modal.attr('id'));
    }
  }

  function closeModals({ clearHash = false } = {}) {
    $('.modal-window.visible').removeClass('visible');
    $('body').removeClass('modal-open');
    if (clearHash) {
      // smaž hash bez scrollu
      history.pushState(null, '', location.pathname + location.search);
    }
  }

  function openFromHash() {
    const hash = decodeURIComponent(window.location.hash || '');
    if (isModalHash(hash)) {
      openModal($(hash), { setHash: false });
      return true;
    }
    return false;
  }

  // 1) Otevři při načtení, pokud je v URL modal hash
  openFromHash();

  // 2) Reaguj na změnu hashe (back/forward, ruční úpravy)
  $(window).on('hashchange', function () {
    if (!openFromHash()) {
      // hash už neukazuje na modal → zavři
      closeModals({ clearHash: false });
    }
  });

  // 3) Otevření přes tlačítko s data-target
  $(document).on('click', '.btn[data-target]', function (e) {
    e.preventDefault();
    const sel = $(this).attr('data-target');
    const $modal = $(sel);
    if ($modal.length) openModal($modal, { setHash: true });
  });

  // 4) Otevření přes odkaz <a href="#modal-...">
  $(document).on('click', 'a[href^="#modal-"]', function (e) {
    const hash = this.getAttribute('href');
    if (isModalHash(hash)) {
      e.preventDefault();
      openModal($(hash), { setHash: true });
    }
  });

  // 5) Zavření – křížek
  $(document).on('click', '.modal-close', function (e) {
    e.preventDefault();
    // maž hash jen když ukazuje na právě otevřený modal
    const openedId = $('.modal-window.visible').attr('id');
    closeModals({ clearHash: location.hash === '#' + openedId });
  });

  // 6) Klik mimo obsah zavře
  $(document).on('click', function (event) {
    if (!$(event.target).closest('.modal-content, .btn[data-target], a[href^="#modal-"]').length) {
      const openedId = $('.modal-window.visible').attr('id');
      const clear = location.hash === '#' + openedId;
      closeModals({ clearHash: clear });
    }
  });

  // 7) ESC zavře
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      const openedId = $('.modal-window.visible').attr('id');
      const clear = location.hash === '#' + openedId;
      closeModals({ clearHash: clear });
    }
  });
});
