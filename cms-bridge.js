/**
 * cms-bridge.js — Visueller Live-Editor Bridge
 * Aktiviert sich automatisch wenn URL-Parameter ?cms=true gesetzt ist.
 * Kommuniziert per postMessage mit dem Admin-Panel (admin.html).
 */
(function () {
  'use strict';

  const isCmsMode = new URLSearchParams(window.location.search).get('cms') === 'true';

  // Lesbarer Name je Key für das Label im Editor
  const LABELS = {
    hero_titel:       'Hero › Titel',
    hero_sub:         'Hero › Untertitel',
    ueber_titel:      'Über mich › Titel',
    ueber_text:       'Über mich › Text',
    kontakt_telefon:  'Kontakt › Telefon',
    kontakt_email:    'Kontakt › E-Mail',
    kontakt_adresse:  'Kontakt › Adresse',
    kontakt_zeiten:   'Kontakt › Öffnungszeiten',
    bild_marc:        'Über mich › Foto von Marc',
    bild_hero_bg:     'Hero › Hintergrundbild',
    referenz_1:       'Referenzen › Vorher/Nachher',
  };

  // ── postMessage: Live-Updates vom Admin empfangen (auch ohne cms=true) ──
  window.addEventListener('message', function (e) {
    var msg = e.data;
    if (!msg || typeof msg !== 'object' || !msg.action) return;

    switch (msg.action) {
      case 'highlight':
        clearHighlights();
        document.querySelectorAll('[data-key="' + msg.key + '"]').forEach(function (el) {
          el.classList.add('cms-highlighted');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        break;

      case 'update':
        applyUpdate(msg.key, msg.value);
        break;

      case 'clearHighlight':
        clearHighlights();
        break;
    }
  });

  function applyUpdate(key, value) {
    document.querySelectorAll('[data-key="' + key + '"]').forEach(function (el) {
      var type = el.dataset.editable;
      if (type === 'image') {
        if (el.tagName === 'IMG') {
          el.src = value;
          el.style.display = value ? 'block' : 'none';
        } else {
          // background-image div (hero-bg)
          el.style.backgroundImage = value ? 'url(' + value + ')' : '';
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
        }
      } else if (type !== 'beforeafter') {
        el.textContent = value;
      }
    });
  }

  function clearHighlights() {
    document.querySelectorAll('.cms-highlighted').forEach(function (el) {
      el.classList.remove('cms-highlighted');
    });
  }

  // ── Nur im Editor-Modus weiter ──
  if (!isCmsMode) return;

  function initEditorMode() {
    document.body.classList.add('cms-edit-mode');

    // Custom-Cursor deaktivieren im Editor
    var style = document.createElement('style');
    style.textContent = [
      'body.cms-edit-mode, body.cms-edit-mode * { cursor: auto !important; }',
      'body.cms-edit-mode #cursor-tri,',
      'body.cms-edit-mode #cursor-tri-ring { display: none !important; }',
      '.cms-edit-mode [data-editable] {',
      '  outline: 2px dashed transparent;',
      '  outline-offset: 3px;',
      '  transition: outline-color 0.15s ease;',
      '}',
      '.cms-edit-mode [data-editable]:hover {',
      '  outline: 2px solid #2EBE6E !important;',
      '  outline-offset: 3px;',
      '  cursor: pointer !important;',
      '}',
      '.cms-highlighted {',
      '  outline: 2px solid #2EBE6E !important;',
      '  outline-offset: 3px;',
      '}',
      '#cms-float-label {',
      '  position: fixed;',
      '  background: #2EBE6E;',
      '  color: #000;',
      '  font-size: 10px;',
      '  font-family: Montserrat, sans-serif;',
      '  font-weight: 700;',
      '  letter-spacing: 0.06em;',
      '  text-transform: uppercase;',
      '  padding: 3px 8px;',
      '  border-radius: 3px;',
      '  z-index: 100000;',
      '  pointer-events: none;',
      '  white-space: nowrap;',
      '  display: none;',
      '  box-shadow: 0 2px 8px rgba(0,0,0,0.2);',
      '}',
    ].join('\n');
    document.head.appendChild(style);

    // Floating-Label-Element
    var floatLabel = document.createElement('div');
    floatLabel.id = 'cms-float-label';
    document.body.appendChild(floatLabel);

    // Alle editierbaren Elemente mit Hover + Click versehen
    document.querySelectorAll('[data-editable]').forEach(function (el) {
      var key = el.dataset.key;
      var type = el.dataset.editable;
      var labelText = LABELS[key] || key;

      el.addEventListener('mouseenter', function () {
        var rect = el.getBoundingClientRect();
        floatLabel.textContent = labelText;
        floatLabel.style.display = 'block';
        floatLabel.style.top = Math.max(4, rect.top - 28) + 'px';
        floatLabel.style.left = rect.left + 'px';
      });

      el.addEventListener('mouseleave', function () {
        floatLabel.style.display = 'none';
      });

      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var currentValue = '';
        if (type === 'image') {
          if (el.tagName === 'IMG') {
            currentValue = el.getAttribute('src') || '';
          } else {
            currentValue = el.style.backgroundImage.replace(/url\(["']?|["']?\)/g, '');
          }
        } else if (type === 'beforeafter') {
          currentValue = key;
        } else {
          currentValue = el.textContent.trim();
        }

        clearHighlights();
        el.classList.add('cms-highlighted');

        window.parent.postMessage({
          action: 'select',
          key: key,
          type: type,
          currentValue: currentValue,
          label: labelText,
        }, '*');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditorMode);
  } else {
    initEditorMode();
  }
})();
