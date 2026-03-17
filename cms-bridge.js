/**
 * cms-bridge.js — CMS Content Loader + Live-Editor Bridge
 *
 * Zwei Aufgaben:
 *  1. IMMER: Beim Seitenload alle Inhalte aus Supabase laden
 *     und in den DOM schreiben (Texte + Bilder).
 *  2. NUR bei ?cms=true: Visuellen Editor aktivieren,
 *     damit Admin-Panel Elemente anklicken kann.
 */
(function () {
  'use strict';

  // ── Supabase Zugangsdaten ──────────────────────────────
  var SUPABASE_URL = 'https://zfyesnrezqupxolslbgx.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmeWVzbnJlenF1cHhvbHNsYmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTIxOTcsImV4cCI6MjA4ODg2ODE5N30.8BeDmPJjYV7_UfGEW3E3wniq1HBx1_W85c-oxQuNuck';

  var isCmsMode = new URLSearchParams(window.location.search).get('cms') === 'true';

  // Label-Map für Editor-Anzeige
  var LABELS = {
    hero_titel:          'Hero › Titel',
    hero_sub:            'Hero › Untertitel',
    hero_bg_1:           'Hero › Hintergrundbild 1',
    hero_bg_2:           'Hero › Hintergrundbild 2',
    hero_bg_3:           'Hero › Hintergrundbild 3',
    hero_bg_4:           'Hero › Hintergrundbild 4',
    hero_bg_5:           'Hero › Hintergrundbild 5',
    bild_marc:           'Über mich › Foto von Marc',
    bild_marc_arbeit_1:  'Über mich › Arbeitsfoto 1',
    bild_marc_arbeit_2:  'Über mich › Arbeitsfoto 2',
    bild_marc_arbeit_3:  'Über mich › Arbeitsfoto 3',
    ueber_titel:         'Über mich › Titel',
    ueber_text:          'Über mich › Text',
    kontakt_telefon:     'Kontakt › Telefon',
    kontakt_email:       'Kontakt › E-Mail',
    kontakt_adresse:     'Kontakt › Adresse',
    kontakt_zeiten:      'Kontakt › Öffnungszeiten',
    referenz_1:          'Referenzen › Vorher/Nachher',
    leistung_bild_1:     'Leistungen › Hintergrundbild 1',
    leistung_bild_2:     'Leistungen › Hintergrundbild 2',
    leistung_bild_3:     'Leistungen › Hintergrundbild 3',
    leistung_bild_4:     'Leistungen › Hintergrundbild 4',
    leistung_bild_5:     'Leistungen › Hintergrundbild 5',
    leistung_bild_6:     'Leistungen › Hintergrundbild 6',
  };

  // ── Supabase Client initialisieren ────────────────────
  var sb = null;
  function getSb() {
    if (!sb) {
      if (typeof supabase === 'undefined') {
        console.warn('CMS: Supabase SDK nicht geladen');
        return null;
      }
      sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return sb;
  }

  // ══════════════════════════════════════════════════════
  // 1. CONTENT LADEN & IN DOM SCHREIBEN
  // ══════════════════════════════════════════════════════

  async function loadAllContent() {
    var client = getSb();
    if (!client) return;

    var result = await client.from('content').select('key, value');
    if (result.error) {
      console.error('CMS: Fehler beim Laden:', result.error.message);
      return;
    }

    console.log('CMS: ' + (result.data ? result.data.length : 0) + ' Einträge geladen.');

    (result.data || []).forEach(function(row) {
      var key = row.key;
      var value = row.value;
      if (!value) return;

      console.log('CMS lade:', key, value.substring(0, 80) + (value.length > 80 ? '…' : ''));
      applyContentEntry(key, value);
    });
  }

  // Einen einzelnen Key/Value auf den DOM anwenden
  function applyContentEntry(key, value) {
    if (!value) return;

    // ── Text-Elemente [data-cms="key"] ──
    document.querySelectorAll('[data-cms="' + key + '"]').forEach(function(el) {
      if (el.tagName === 'IMG') {
        el.src = value;
        el.style.display = 'block';
      } else {
        // Spezial-Formatierung für Hero-Titel
        if (key === 'hero_titel') {
          var parts = value.split('.').map(function(s) { return s.trim(); }).filter(Boolean);
          if (parts.length >= 2) {
            el.innerHTML = parts.slice(0, -1).map(function(p) { return p + '.'; }).join('<br>') +
              '<br><span class="highlight">' + parts[parts.length - 1] + '.</span>';
          } else {
            el.textContent = value;
          }
        } else if (key === 'ueber_titel') {
          var words = value.trim().split(' ');
          if (words.length > 1) {
            el.innerHTML = words.slice(0, -1).join(' ') +
              ' <span style="color:var(--green)">' + words[words.length - 1] + '</span>';
          } else {
            el.textContent = value;
          }
        } else {
          el.textContent = value;
        }
      }
    });

    // ── <img data-key="key"> ──
    document.querySelectorAll('img[data-key="' + key + '"]').forEach(function(img) {
      img.src = value;
      img.style.display = 'block';
      console.log('CMS: <img> gesetzt für', key);
    });

    // Marc Portrait: Fallback ausblenden wenn Foto geladen
    if (key === 'bild_marc') {
      var fallback = document.getElementById('marc-fallback');
      if (fallback) fallback.style.display = 'none';
    }

    // ── Hero Slideshow Slides [data-key="hero_bg_N"] ──
    if (key.startsWith('hero_bg_')) {
      var slide = document.querySelector('.hero-slide[data-key="' + key + '"]');
      if (slide) {
        slide.style.backgroundImage = "url('" + value + "')";
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundPosition = 'center';
        console.log('CMS: Hero-Slide gesetzt:', key);
      }
    }

    // ── Leistungskarten [data-key="leistung_bild_N"] ──
    if (key.startsWith('leistung_bild_')) {
      var card = document.querySelector('.leistung-card[data-key="' + key + '"]');
      if (card) {
        var bgEl = card.querySelector('.leistung-card-bg');
        if (bgEl) {
          bgEl.style.backgroundImage = "url('" + value + "')";
          bgEl.style.backgroundSize = 'cover';
          bgEl.style.backgroundPosition = 'center';
          bgEl.classList.add('loaded');
          card.classList.add('has-bg');
          console.log('CMS: Leistungskarte gesetzt:', key);
        }
      }
    }

    // ── Galerie Kacheln [data-key="galerie_N"] ──
    if (key.startsWith('galerie_')) {
      var tile = document.querySelector('.masonry-tile[data-key="' + key + '"]');
      if (tile) {
        var placeholder = tile.querySelector('.tile-placeholder');
        if (placeholder) {
          placeholder.style.backgroundImage = "url('" + value + "')";
          placeholder.style.backgroundSize = 'cover';
          placeholder.style.backgroundPosition = 'center';
          var icon = placeholder.querySelector('svg');
          if (icon) icon.style.display = 'none';
          console.log('CMS: Galerie-Kachel gesetzt:', key);
        }
      }
    }

    // ── Filmstrip Frames [data-key="einblick_N"] ──
    if (key.startsWith('einblick_')) {
      document.querySelectorAll('.film-frame[data-key="' + key + '"]').forEach(function(frame) {
        frame.style.backgroundImage = "url('" + value + "')";
        frame.style.backgroundSize = 'cover';
        frame.style.backgroundPosition = 'center';
        var icon = frame.querySelector('svg');
        if (icon) icon.style.display = 'none';
      });
    }

    // ── Arbeitsfotos [data-key="bild_marc_arbeit_N"] ──
    if (key.startsWith('bild_marc_arbeit_')) {
      var workPhoto = document.querySelector('[data-key="' + key + '"]');
      if (workPhoto && workPhoto.tagName !== 'IMG') {
        workPhoto.style.backgroundImage = "url('" + value + "')";
        workPhoto.style.backgroundSize = 'cover';
        workPhoto.style.backgroundPosition = 'center';
        var wIcon = workPhoto.querySelector('svg, i');
        if (wIcon) wIcon.style.display = 'none';
      }
    }

    // ── Generisch: alle [data-bg-key="key"] ──
    document.querySelectorAll('[data-bg-key="' + key + '"]').forEach(function(el) {
      el.style.backgroundImage = "url('" + value + "')";
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    });
  }

  // ══════════════════════════════════════════════════════
  // 2. LIVE-UPDATES VOM ADMIN-PANEL EMPFANGEN
  // ══════════════════════════════════════════════════════

  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || typeof msg !== 'object' || !msg.action) return;

    switch (msg.action) {
      case 'highlight':
        clearHighlights();
        document.querySelectorAll('[data-key="' + msg.key + '"]').forEach(function(el) {
          el.classList.add('cms-highlighted');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        break;

      case 'update':
        console.log('CMS Live-Update:', msg.key, msg.value ? msg.value.substring(0, 60) : '(leer)');
        applyContentEntry(msg.key, msg.value);
        break;

      case 'clearHighlight':
        clearHighlights();
        break;
    }
  });

  function clearHighlights() {
    document.querySelectorAll('.cms-highlighted').forEach(function(el) {
      el.classList.remove('cms-highlighted');
    });
  }

  // ══════════════════════════════════════════════════════
  // 3. BEIM LADEN AUSFÜHREN (immer, nicht nur im Editor)
  // ══════════════════════════════════════════════════════

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllContent);
  } else {
    loadAllContent();
  }

  // ══════════════════════════════════════════════════════
  // 4. VISUELLER EDITOR (nur bei ?cms=true)
  // ══════════════════════════════════════════════════════

  if (!isCmsMode) return;

  function initEditorMode() {
    document.body.classList.add('cms-edit-mode');

    // Custom-Cursor + Cursor-Kreis deaktivieren im Editor
    var style = document.createElement('style');
    style.textContent = [
      'body.cms-edit-mode, body.cms-edit-mode * { cursor: auto !important; }',
      'body.cms-edit-mode #cursor-tri,',
      'body.cms-edit-mode #cursor-circle,',
      'body.cms-edit-mode .cursor-trail,',
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

    var floatLabel = document.createElement('div');
    floatLabel.id = 'cms-float-label';
    document.body.appendChild(floatLabel);

    document.querySelectorAll('[data-editable]').forEach(function(el) {
      var key = el.dataset.key;
      var type = el.dataset.editable;
      var labelText = LABELS[key] || key;

      el.addEventListener('mouseenter', function() {
        var rect = el.getBoundingClientRect();
        floatLabel.textContent = labelText;
        floatLabel.style.display = 'block';
        floatLabel.style.top = Math.max(4, rect.top - 28) + 'px';
        floatLabel.style.left = rect.left + 'px';
      });

      el.addEventListener('mouseleave', function() {
        floatLabel.style.display = 'none';
      });

      el.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var currentValue = '';
        if (type === 'image') {
          if (el.tagName === 'IMG') {
            currentValue = el.getAttribute('src') || '';
          } else {
            currentValue = (el.style.backgroundImage || '').replace(/url\(["']?|["']?\)/g, '');
            // Für Hero-Slides
            if (!currentValue && el.classList.contains('hero-slide')) {
              currentValue = (el.style.backgroundImage || '').replace(/url\(["']?|["']?\)/g, '');
            }
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
