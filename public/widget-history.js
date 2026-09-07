(function () {
  'use strict';

  var STYLE = '\
.jng-widget{font-family:inherit;color:#111;max-width:100%;box-sizing:border-box;background:#fff;border:1px solid rgba(0,0,0,.15);border-radius:14px;padding:22px 24px}\
.jng-widget *{box-sizing:border-box}\
.jng-widget h3{margin:0 0 16px;font-size:15px;text-transform:uppercase;letter-spacing:.04em;color:#111;position:relative;padding-left:14px}\
.jng-widget h3:before{content:"";position:absolute;left:0;top:1px;bottom:1px;width:4px;background:#b59e27;border-radius:2px}\
.jng-search{position:relative;max-width:420px}\
.jng-search-input{width:100%;padding:10px 12px;font-size:15px;border:1px solid rgba(0,0,0,.15);border-radius:8px;outline:none;background:#fff;color:#111}\
.jng-search-input:focus{border-color:#b59e27;box-shadow:0 0 0 3px rgba(181,158,39,.15)}\
.jng-suggestions{position:absolute;left:0;right:0;top:100%;margin-top:4px;background:#fff;border:1px solid rgba(0,0,0,.15);border-radius:10px;max-height:280px;overflow-y:auto;z-index:20;box-shadow:0 8px 20px rgba(0,0,0,.12)}\
.jng-suggestion{padding:9px 12px;cursor:pointer;font-size:14px;border-bottom:1px solid rgba(0,0,0,.08)}\
.jng-suggestion:last-child{border-bottom:none}\
.jng-suggestion:hover,.jng-suggestion.jng-active{background:rgba(181,158,39,.08)}\
.jng-suggestion small{display:block;color:#666;font-size:12px;margin-top:2px}\
.jng-selected{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}\
.jng-selected-label{font-size:18px;font-weight:700;color:#111}\
.jng-clear{border:1px solid rgba(0,0,0,.15);background:#fff;color:#111;cursor:pointer;font-size:12px;padding:5px 10px;border-radius:20px}\
.jng-clear:hover{border-color:#b59e27;color:#b59e27}\
.jng-table{width:100%;border-collapse:collapse;font-size:13px}\
.jng-table th{text-align:left;font-weight:700;color:#111;padding:7px 8px;border-bottom:2px solid #b59e27;white-space:nowrap}\
.jng-table td{padding:7px 8px;border-bottom:1px solid rgba(0,0,0,.1);vertical-align:top;color:#111}\
.jng-table tr:hover td{background:rgba(181,158,39,.05)}\
.jng-table-scroll{overflow-x:auto}\
.jng-status{margin-top:12px;font-size:13px;color:#666}\
.jng-status.jng-error{color:#111;font-weight:600}\
.jng-status.jng-error:before{content:"\\26A0  "}\
.jng-empty{color:#666;font-size:13px;padding:6px 0}\
';

  function injectStyle() {
    if (document.getElementById('jng-hx-style')) return;
    var s = document.createElement('style');
    s.id = 'jng-hx-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) {
      if (c) node.appendChild(c);
    });
    return node;
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments,
        ctx = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function apiFetch(base, path, params) {
    var url = base.replace(/\/$/, '') + path;
    var qs = Object.keys(params || {})
      .map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      })
      .join('&');
    if (qs) url += '?' + qs;
    return fetch(url).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
        return data;
      });
    });
  }

  function renderHistoryPanel(container, transactions) {
    container.innerHTML = '';
    if (!transactions || !transactions.length) {
      container.appendChild(el('div', { class: 'jng-empty', html: 'No matching retail transactions in this period.' }));
      return;
    }
    var scroll = el('div', { class: 'jng-table-scroll' });
    var table = el('table', { class: 'jng-table' });
    var thead = el('thead', {}, [
      el('tr', {}, [
        el('th', { html: 'Date' }),
        el('th', { html: 'Type' }),
        el('th', { html: 'Reg #' }),
        el('th', { html: 'Serial #' }),
        el('th', { html: 'Details' }),
      ]),
    ]);
    var tbody = el('tbody');
    transactions.slice(0, 50).forEach(function (t) {
      tbody.appendChild(
        el('tr', {}, [
          el('td', { html: fmtDate(t.transdate) }),
          el('td', { html: t.transtype || '—' }),
          el('td', { html: t.regnbr || '—' }),
          el('td', { html: t.sernbr || '—' }),
          el('td', { html: t.description || '—' }),
        ])
      );
    });
    table.appendChild(thead);
    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);
  }

  function initWidget(root) {
    var apiBase = root.getAttribute('data-api-base');
    if (!apiBase) {
      root.innerHTML = '<div class="jng-status jng-error">Missing data-api-base on the widget container.</div>';
      return;
    }

    injectStyle();
    root.innerHTML = '';
    root.classList.add('jng-widget');

    root.appendChild(el('h3', { html: 'Retail Transactions' }));

    var input = el('input', {
      class: 'jng-search-input',
      type: 'text',
      placeholder: 'Search aircraft model (e.g. Citation Excel)',
      autocomplete: 'off',
    });
    var suggestions = el('div', { class: 'jng-suggestions' });
    suggestions.hidden = true;
    var search = el('div', { class: 'jng-search' }, [input, suggestions]);

    var selectedLabel = el('span', { class: 'jng-selected-label' });
    var clearBtn = el('button', { class: 'jng-clear', type: 'button', html: 'Change model' });
    var selected = el('div', { class: 'jng-selected' }, [selectedLabel, clearBtn]);
    selected.hidden = true;

    var body = el('div');
    var status = el('div', { class: 'jng-status' });

    root.appendChild(search);
    root.appendChild(selected);
    root.appendChild(body);
    root.appendChild(status);

    function setStatus(msg, isError) {
      status.textContent = msg || '';
      status.classList.toggle('jng-error', !!isError);
    }

    function loadModel(model) {
      selectedLabel.textContent = model.make + ' ' + model.model;
      selected.hidden = false;
      search.hidden = true;
      body.innerHTML = '';
      setStatus('Loading data…');

      apiFetch(apiBase, '/history', { modelid: model.modelid, months: 12 })
        .then(function (data) {
          renderHistoryPanel(body, data.transactions);
          setStatus('');
        })
        .catch(function (err) {
          setStatus(err.message || 'Failed to load data.', true);
        });
    }

    clearBtn.addEventListener('click', function () {
      selected.hidden = true;
      search.hidden = false;
      body.innerHTML = '';
      input.value = '';
      input.focus();
      setStatus('');
    });

    var activeIndex = -1;
    var currentResults = [];

    function renderSuggestions(models) {
      currentResults = models;
      activeIndex = -1;
      suggestions.innerHTML = '';
      if (!models.length) {
        suggestions.hidden = true;
        return;
      }
      models.forEach(function (m) {
        var item = el('div', { class: 'jng-suggestion' }, [
          el('span', { html: m.make + ' ' + m.model }),
          el('small', { html: [m.categorysize, m.weightclass].filter(Boolean).join(' · ') }),
        ]);
        item.addEventListener('click', function () {
          suggestions.hidden = true;
          loadModel(m);
        });
        suggestions.appendChild(item);
      });
      suggestions.hidden = false;
    }

    var doSearch = debounce(function (q) {
      if (!q) {
        suggestions.hidden = true;
        return;
      }
      apiFetch(apiBase, '/models', { q: q, limit: 15 })
        .then(function (data) {
          renderSuggestions(data.models || []);
        })
        .catch(function (err) {
          setStatus(err.message || 'Search failed.', true);
        });
    }, 250);

    input.addEventListener('input', function () {
      doSearch(input.value.trim());
    });

    input.addEventListener('keydown', function (e) {
      if (suggestions.hidden) return;
      var items = suggestions.querySelectorAll('.jng-suggestion');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && currentResults[activeIndex]) {
          e.preventDefault();
          suggestions.hidden = true;
          loadModel(currentResults[activeIndex]);
        }
        return;
      } else if (e.key === 'Escape') {
        suggestions.hidden = true;
        return;
      } else {
        return;
      }
      items.forEach(function (it, i) {
        it.classList.toggle('jng-active', i === activeIndex);
      });
    });

    document.addEventListener('click', function (e) {
      if (!search.contains(e.target)) suggestions.hidden = true;
    });
  }

  function init() {
    var roots = document.querySelectorAll('[data-jng-history]');
    roots.forEach(function (root) {
      if (root.getAttribute('data-jng-initialized')) return;
      root.setAttribute('data-jng-initialized', 'true');
      initWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
