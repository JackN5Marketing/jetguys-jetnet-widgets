(function () {
  'use strict';

  var STYLE = '\
.jng-widget{font-family:inherit;color:#111;max-width:100%;box-sizing:border-box;background:#fff;border:1px solid rgba(0,0,0,.15);border-radius:14px;padding:22px 24px}\
.jng-widget *{box-sizing:border-box}\
.jng-widget h3{margin:0 0 16px;font-size:15px;text-transform:uppercase;letter-spacing:.04em;color:#111;position:relative;padding-left:14px}\
.jng-widget h3:before{content:"";position:absolute;left:0;top:1px;bottom:1px;width:4px;background:#b59e27;border-radius:2px}\
.jng-lookup-row{display:flex;gap:8px;max-width:420px}\
.jng-search-input{flex:1;padding:10px 12px;font-size:15px;border:1px solid rgba(0,0,0,.15);border-radius:8px;outline:none;background:#fff;color:#111;text-transform:uppercase}\
.jng-search-input:focus{border-color:#b59e27;box-shadow:0 0 0 3px rgba(181,158,39,.15)}\
.jng-lookup-btn{padding:10px 18px;font-size:14px;font-weight:700;border-radius:8px;border:1px solid #b59e27;background:#b59e27;color:#111;cursor:pointer;white-space:nowrap}\
.jng-lookup-btn:hover{background:#a08c22;border-color:#a08c22}\
.jng-clear{border:1px solid rgba(0,0,0,.15);background:#fff;color:#111;cursor:pointer;font-size:12px;padding:5px 10px;border-radius:20px}\
.jng-clear:hover{border-color:#b59e27;color:#b59e27}\
.jng-selected{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}\
.jng-selected-label{font-size:18px;font-weight:700;color:#111}\
.jng-ac-summary{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:18px}\
.jng-stat{min-width:130px;flex:1 1 130px;border:1px solid rgba(0,0,0,.15);border-top:3px solid #b59e27;border-radius:8px;padding:10px 12px;background:#fff}\
.jng-stat .v{font-size:17px;font-weight:700;color:#111}\
.jng-stat .l{font-size:12px;color:#666;margin-top:2px}\
.jng-companies{list-style:none;margin:0;padding:0}\
.jng-companies li{padding:10px 0;border-bottom:1px solid rgba(0,0,0,.1);font-size:13px;border-left:3px solid #b59e27;padding-left:10px}\
.jng-companies li:last-child{border-bottom:none}\
.jng-companies .role{font-weight:700;color:#111;text-transform:uppercase;font-size:11px;letter-spacing:.03em;color:#b59e27}\
.jng-companies .name{font-weight:700;color:#111;margin-top:2px}\
.jng-companies .meta{color:#666;font-size:12px;margin-top:2px}\
.jng-status{margin-top:12px;font-size:13px;color:#666}\
.jng-status.jng-error{color:#111;font-weight:600}\
.jng-status.jng-error:before{content:"\\26A0  "}\
.jng-empty{color:#666;font-size:13px;padding:6px 0}\
.jng-subhead{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#666;margin:18px 0 8px}\
';

  function injectStyle() {
    if (document.getElementById('jng-tl-style')) return;
    var s = document.createElement('style');
    s.id = 'jng-tl-style';
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

  function renderAircraft(container, ac) {
    container.innerHTML = '';
    if (!ac) {
      container.appendChild(el('div', { class: 'jng-empty', html: 'No aircraft data available.' }));
      return;
    }

    var summary = el('div', { class: 'jng-ac-summary' }, [
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: [ac.yearmfr, ac.make, ac.model].filter(Boolean).join(' ') || '—' }),
        el('div', { class: 'l', html: 'Aircraft' }),
      ]),
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: ac.serialnbr || '—' }),
        el('div', { class: 'l', html: 'Serial #' }),
      ]),
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: ac.categorysize || ac.weightclass || '—' }),
        el('div', { class: 'l', html: 'Category' }),
      ]),
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: ac.baseairport || ac.baseicao || '—' }),
        el('div', { class: 'l', html: 'Base airport' }),
      ]),
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: ac.ownership || '—' }),
        el('div', { class: 'l', html: 'Ownership' }),
      ]),
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: ac.usage || '—' }),
        el('div', { class: 'l', html: 'Usage' }),
      ]),
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: ac.maintained || '—' }),
        el('div', { class: 'l', html: 'Maintained' }),
      ]),
      el('div', { class: 'jng-stat' }, [
        el('div', { class: 'v', html: ac.icaotype || '—' }),
        el('div', { class: 'l', html: 'ICAO type' }),
      ]),
    ]);
    container.appendChild(summary);

    var rels = ac.companyrelationships || [];
    if (rels.length) {
      container.appendChild(el('div', { class: 'jng-subhead', html: 'Owner / Operator' }));
      var list = el('ul', { class: 'jng-companies' });
      rels.forEach(function (r) {
        var contact = [r.contactsirname, r.contactfirstname, r.contactlastname].filter(Boolean).join(' ');
        var metaParts = [];
        if (r.companycity || r.companystateabbr) metaParts.push([r.companycity, r.companystateabbr].filter(Boolean).join(', '));
        if (contact) metaParts.push(contact + (r.contacttitle ? ' (' + r.contacttitle + ')' : ''));
        list.appendChild(
          el('li', {}, [
            el('div', { class: 'role', html: r.companyrelation || 'Related company' }),
            el('div', { class: 'name', html: r.companyname || '—' }),
            metaParts.length ? el('div', { class: 'meta', html: metaParts.join(' · ') }) : null,
          ])
        );
      });
      container.appendChild(list);
    }
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

    root.appendChild(el('h3', { html: 'Tail Number Lookup' }));

    var input = el('input', {
      class: 'jng-search-input',
      type: 'text',
      placeholder: 'Enter tail number (e.g. N29ZR)',
      autocomplete: 'off',
    });
    var lookupBtn = el('button', { class: 'jng-lookup-btn', type: 'button', html: 'Look up' });
    var row = el('div', { class: 'jng-lookup-row' }, [input, lookupBtn]);

    var selectedLabel = el('span', { class: 'jng-selected-label' });
    var clearBtn = el('button', { class: 'jng-clear', type: 'button', html: 'New search' });
    var selected = el('div', { class: 'jng-selected' }, [selectedLabel, clearBtn]);
    selected.hidden = true;

    var body = el('div');
    var status = el('div', { class: 'jng-status' });

    root.appendChild(row);
    root.appendChild(selected);
    root.appendChild(body);
    root.appendChild(status);

    function setStatus(msg, isError) {
      status.textContent = msg || '';
      status.classList.toggle('jng-error', !!isError);
    }

    function doLookup() {
      var reg = input.value.trim();
      if (!reg) {
        setStatus('Enter a tail number first.', true);
        return;
      }
      row.hidden = true;
      selected.hidden = false;
      selectedLabel.textContent = reg.toUpperCase();
      body.innerHTML = '';
      setStatus('Looking up…');

      apiFetch(apiBase, '/aircraft', { reg: reg })
        .then(function (data) {
          renderAircraft(body, data.aircraft);
          setStatus('');
        })
        .catch(function (err) {
          body.innerHTML = '';
          setStatus(err.message || 'Lookup failed.', true);
        });
    }

    lookupBtn.addEventListener('click', doLookup);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doLookup();
      }
    });

    clearBtn.addEventListener('click', function () {
      selected.hidden = true;
      row.hidden = false;
      body.innerHTML = '';
      input.value = '';
      input.focus();
      setStatus('');
    });
  }

  function init() {
    var roots = document.querySelectorAll('[data-jng-tail-lookup]');
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
