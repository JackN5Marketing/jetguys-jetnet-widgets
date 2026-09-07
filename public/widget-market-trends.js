(function () {
  'use strict';

  var STYLE = '\
.jng-widget{font-family:"Urbanist",-apple-system,sans-serif;color:#141212;max-width:100%;box-sizing:border-box;background:#fff;border:1px solid rgba(0,0,0,.15);border-radius:14px;padding:24px 26px}\
.jng-widget *{box-sizing:border-box}\
.jng-eyebrow{display:inline-flex;align-items:center;gap:10px;border:.8px solid rgba(0,0,0,.15);border-radius:1000px;padding:6px 18px 6px 6px;margin:0 0 18px;font-size:13px;font-weight:400;color:#141212}\
.jng-eyebrow .dot{width:18px;height:18px;border-radius:50%;background:#b59e27;flex-shrink:0}\
.jng-search{position:relative;max-width:420px}\
.jng-search-input{width:100%;padding:12px 20px;font-size:15px;font-family:inherit;border:.8px solid rgba(0,0,0,.15);border-radius:1000px;outline:none;background:#fff;color:#141212}\
.jng-search-input:focus{border-color:#b59e27;box-shadow:0 0 0 3px rgba(181,158,39,.15)}\
.jng-suggestions{position:absolute;left:0;right:0;top:100%;margin-top:6px;background:#fff;border:.8px solid rgba(0,0,0,.15);border-radius:16px;max-height:280px;overflow-y:auto;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,.1);padding:6px}\
.jng-suggestion{padding:10px 14px;cursor:pointer;font-size:14px;border-radius:10px}\
.jng-suggestion:hover,.jng-suggestion.jng-active{background:rgba(181,158,39,.08)}\
.jng-suggestion small{display:block;color:rgba(20,18,18,.55);font-size:12px;margin-top:2px}\
.jng-selected{display:flex;align-items:center;gap:18px;margin:4px 0 20px;flex-wrap:wrap}\
.jng-selected[hidden]{display:none}\
.jng-selected-label{font-family:"Inter",sans-serif;font-size:20px;font-weight:300;letter-spacing:-.02em;color:#141212}\
.jng-clear{border:.8px solid rgba(0,0,0,.15);background:#fff;color:#141212;cursor:pointer;font-size:13px;font-family:inherit;padding:9px 20px;border-radius:1000px}\
.jng-clear:hover{border-color:#b59e27;color:#b59e27}\
.jng-market-summary{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:18px}\
.jng-stat{min-width:120px;flex:1 1 120px;border:.8px solid rgba(0,0,0,.15);border-top:3px solid #b59e27;border-radius:12px;padding:12px 14px;background:#fff}\
.jng-stat .v{font-family:"Inter",sans-serif;font-size:20px;font-weight:500;color:#141212}\
.jng-stat .l{font-size:12px;color:rgba(20,18,18,.55);margin-top:2px}\
.jng-table{width:100%;border-collapse:collapse;font-size:13px}\
.jng-table th{text-align:left;font-weight:600;color:#141212;padding:7px 8px;border-bottom:2px solid #b59e27;white-space:nowrap}\
.jng-table td{padding:7px 8px;border-bottom:1px solid rgba(0,0,0,.1);vertical-align:top;color:#141212}\
.jng-table tr:hover td{background:rgba(181,158,39,.05)}\
.jng-table-scroll{overflow-x:auto}\
.jng-status{margin-top:12px;font-size:13px;color:rgba(20,18,18,.55)}\
.jng-status.jng-error{color:#141212;font-weight:600}\
.jng-status.jng-error:before{content:"\\26A0  "}\
.jng-empty{color:rgba(20,18,18,.55);font-size:13px;padding:6px 0}\
';

  function injectStyle() {
    if (document.getElementById('jng-mt-style')) return;
    var s = document.createElement('style');
    s.id = 'jng-mt-style';
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

  function fmtMoney(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function monthName(m) {
    var names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[(m || 1) - 1] || m;
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

  function renderMarketPanel(container, trends) {
    container.innerHTML = '';
    if (!trends || !trends.length) {
      container.appendChild(el('div', { class: 'jng-empty', html: 'No market trend data available for this model.' }));
      return;
    }
    var latest = trends[trends.length - 1];

    var summary = el('div', { class: 'jng-market-summary' }, [
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: fmtMoney(latest.avg_asking_price) }),
        el('div', { class: 'l', html: 'Avg. asking price' }),
      ]),
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: String(latest.aircraft_for_sale_count != null ? latest.aircraft_for_sale_count : '—') }),
        el('div', { class: 'l', html: 'For sale now' }),
      ]),
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: String(latest.avg_daysonmarket != null ? latest.avg_daysonmarket : '—') }),
        el('div', { class: 'l', html: 'Avg. days on market' }),
      ]),
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: String(latest.in_operation_count != null ? latest.in_operation_count : '—') }),
        el('div', { class: 'l', html: 'In operation' }),
      ]),
    ]);
    container.appendChild(summary);

    var scroll = el('div', { class: 'jng-table-scroll' });
    var table = el('table', { class: 'jng-table' });
    var thead = el('thead', {}, [
      el('tr', {}, [
        el('th', { html: 'Month' }),
        el('th', { html: 'For sale' }),
        el('th', { html: 'Avg. asking price' }),
        el('th', { html: 'Avg. days on market' }),
      ]),
    ]);
    var tbody = el('tbody');
    trends
      .slice()
      .reverse()
      .forEach(function (t) {
        tbody.appendChild(
          el('tr', {}, [
            el('td', { html: monthName(t.trend_month) + ' ' + t.trend_year }),
            el('td', { html: String(t.aircraft_for_sale_count != null ? t.aircraft_for_sale_count : '—') }),
            el('td', { html: fmtMoney(t.avg_asking_price) }),
            el('td', { html: String(t.avg_daysonmarket != null ? t.avg_daysonmarket : '—') }),
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

    root.appendChild(
      el('div', { class: 'jng-eyebrow' }, [el('span', { class: 'dot' }), document.createTextNode('Market Trends')])
    );

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

      apiFetch(apiBase, '/market-trends', { modelid: model.modelid, months: 12 })
        .then(function (data) {
          renderMarketPanel(body, data.trends);
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
    var roots = document.querySelectorAll('[data-jng-market-trends]');
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
