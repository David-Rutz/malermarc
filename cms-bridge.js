/**
 * cms-bridge.js — Universelles Media-System
 *
 * Lädt Inhalte aus Supabase und wendet sie auf .media-slot[data-key]
 * und [data-cms="key"] Elemente an.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://zfyesnrezqupxolslbgx.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmeWVzbnJlenF1cHhvbHNsYmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTIxOTcsImV4cCI6MjA4ODg2ODE5N30.8BeDmPJjYV7_UfGEW3E3wniq1HBx1_W85c-oxQuNuck';

  if (typeof window.supabase === 'undefined') {
    console.warn('CMS: Supabase SDK nicht geladen');
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ══════════════════════════════════════════════════════
  // MEDIA ANWENDEN — alle .media-slot[data-key="key"]
  // Nutzt querySelectorAll → unterstützt Filmstrip-Duplikate
  // ══════════════════════════════════════════════════════
  function applyMedia(key, value) {
    document.querySelectorAll('.media-slot[data-key="' + key + '"]').forEach(function (slot) {
      var img         = slot.querySelector('.media-img');
      var video       = slot.querySelector('.media-video');
      var placeholder = slot.querySelector('.media-placeholder');

      if (!value) {
        if (img)         { img.src = '';   img.style.display   = 'none'; }
        if (video)       { video.src = ''; video.style.display = 'none'; }
        if (placeholder)   placeholder.style.display = 'flex';
        return;
      }

      var isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(value);

      if (isVideo) {
        if (img)         img.style.display         = 'none';
        if (placeholder) placeholder.style.display = 'none';
        if (video) {
          video.src           = value;
          video.style.display = 'block';
          video.play().catch(function () {});
        }
      } else {
        if (video)       video.style.display       = 'none';
        if (placeholder) placeholder.style.display = 'none';
        if (img) {
          img.src           = value;
          img.style.display = 'block';
        }
      }
    });
  }

  // ══════════════════════════════════════════════════════
  // TEXT ANWENDEN — alle [data-cms="key"]
  // ══════════════════════════════════════════════════════
  function applyText(key, value) {
    if (!value) return;
    document.querySelectorAll('[data-cms="' + key + '"]').forEach(function (el) {
      if (el.tagName === 'IMG') {
        el.src = value; el.style.display = 'block';
        return;
      }
      if (key === 'hero_titel') {
        var parts = value.split('.').map(function (s) { return s.trim(); }).filter(Boolean);
        if (parts.length >= 2) {
          el.innerHTML = parts.slice(0, -1).map(function (p) { return p + '.'; }).join('<br>') +
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
    });
  }

  // ══════════════════════════════════════════════════════
  // ALLE INHALTE LADEN
  // ══════════════════════════════════════════════════════
  async function loadAllContent() {
    var result = await sb.from('content').select('key, value');
    if (result.error) { console.error('CMS:', result.error); return; }

    console.log('CMS: ' + (result.data ? result.data.length : 0) + ' Einträge geladen');
    (result.data || []).forEach(function (row) {
      applyText(row.key, row.value);
      applyMedia(row.key, row.value);
    });
  }

  // ══════════════════════════════════════════════════════
  // LIVE-UPDATES VOM ADMIN-PANEL
  // ══════════════════════════════════════════════════════
  window.addEventListener('message', function (e) {
    var msg = e.data;
    if (!msg || !msg.action) return;

    if (msg.action === 'update_media') {
      applyMedia(msg.key, msg.value);
    } else if (msg.action === 'update_text') {
      applyText(msg.key, msg.value);
    } else if (msg.action === 'update') {
      // Rückwärtskompatibilität
      if (msg.type === 'image') {
        applyMedia(msg.key, msg.value);
      } else {
        applyText(msg.key, msg.value);
      }
    } else if (msg.action === 'highlight') {
      document.querySelectorAll('.cms-highlighted').forEach(function (el) {
        el.classList.remove('cms-highlighted');
      });
      document.querySelectorAll('[data-key="' + msg.key + '"]').forEach(function (el) {
        el.classList.add('cms-highlighted');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } else if (msg.action === 'clearHighlight') {
      document.querySelectorAll('.cms-highlighted').forEach(function (el) {
        el.classList.remove('cms-highlighted');
      });
    }
  });

  // ══════════════════════════════════════════════════════
  // START
  // ══════════════════════════════════════════════════════
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllContent);
  } else {
    loadAllContent();
  }

})();
