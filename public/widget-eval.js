(function () {
  'use strict';

  var STYLE = '\
.jng-widget{font-family:"Urbanist",-apple-system,sans-serif;color:#141212;max-width:100%;box-sizing:border-box;background:#fff;border:1px solid rgba(0,0,0,.15);border-radius:14px;padding:24px 26px}\
.jng-widget *{box-sizing:border-box;font-family:inherit;font-style:normal;line-height:1.5;text-decoration:none}\
.jng-eyebrow{display:inline-flex;align-items:center;gap:10px;border:.8px solid rgba(0,0,0,.15);border-radius:1000px;padding:6px 18px 6px 6px;margin:0 0 18px;font-size:13px;font-weight:400;color:#141212}\
.jng-eyebrow .jng-dot{width:18px;height:18px;border-radius:50%;background:#b59e27;flex-shrink:0}\
.jng-lookup-row{display:flex;gap:10px;max-width:420px;flex-wrap:wrap}\
.jng-lookup-row[hidden]{display:none}\
.jng-search-input{flex:1;min-width:200px;padding:12px 20px;font-size:15px;border:.8px solid rgba(0,0,0,.15);border-radius:1000px;outline:none;background:#fff;color:#141212;text-transform:uppercase}\
.jng-search-input:focus{border-color:#b59e27;box-shadow:0 0 0 3px rgba(181,158,39,.15)}\
.jng-lookup-btn{padding:12px 22px;font-size:14px;font-weight:400;border-radius:1000px;border:.8px solid #b59e27;background:#b59e27;color:#f5f5f4;cursor:pointer;white-space:nowrap}\
.jng-lookup-btn:hover{background:#a08c22;border-color:#a08c22}\
.jng-clear{border:.8px solid rgba(0,0,0,.15);background:#fff;color:#141212;cursor:pointer;font-size:13px;padding:9px 20px;border-radius:1000px}\
.jng-clear:hover{border-color:#b59e27;color:#b59e27}\
.jng-selected{display:flex;align-items:center;gap:18px;margin:4px 0 20px;flex-wrap:wrap}\
.jng-selected[hidden]{display:none}\
.jng-selected-label{font-family:"Inter",sans-serif;font-size:20px;font-weight:300;letter-spacing:-.02em;color:#141212}\
.jng-eval-range{border:.8px solid rgba(0,0,0,.15);border-top:4px solid #b59e27;border-radius:14px;padding:22px 24px;margin-bottom:18px;text-align:center;background:#fafafa}\
.jng-eval-range .jng-eval-label{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:rgba(20,18,18,.55);margin-bottom:8px}\
.jng-eval-range .jng-eval-value{font-family:"Inter",sans-serif;font-size:32px;font-weight:300;color:#141212}\
.jng-eval-range .jng-eval-sub{font-size:12px;color:rgba(20,18,18,.55);margin-top:6px}\
.jng-ac-summary{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:18px}\
.jng-stat{min-width:130px;flex:1 1 130px;border:.8px solid rgba(0,0,0,.15);border-top:3px solid #b59e27;border-radius:12px;padding:12px 14px;background:#fff}\
.jng-stat .jng-stat-v{font-family:"Inter",sans-serif;font-size:18px;font-weight:500;color:#141212}\
.jng-stat .jng-stat-l{font-size:12px;color:rgba(20,18,18,.55);margin-top:2px}\
.jng-eval-note{font-size:13px;color:#141212;background:rgba(181,158,39,.08);border-radius:10px;padding:14px 16px;margin-bottom:18px}\
.jng-eval-cta{-webkit-appearance:none;appearance:none;display:inline-flex;align-items:center;gap:10px;padding:14px 26px;border-radius:1000px;border:.8px solid #b59e27;background:#b59e27;color:#f5f5f4;font-size:14px;cursor:pointer;width:100%;justify-content:center}\
.jng-eval-cta:hover{background:#a08c22;border-color:#a08c22}\
.jng-eval-disclaimer{font-size:11px;color:rgba(20,18,18,.5);margin-top:12px;text-align:center}\
.jng-status{margin-top:12px;font-size:13px;color:rgba(20,18,18,.55)}\
.jng-status.jng-error{color:#141212;font-weight:600}\
.jng-status.jng-error:before{content:"\\26A0  "}\
';

  function injectStyle() {
    if (document.getElementById('jng-ev-eval-style')) return;
    var s = document.createElement('style');
    s.id = 'jng-ev-eval-style';
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

  function fmtMoney(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return '$' + Math.round(n).toLocaleString('en-US');
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

  function renderEval(container, aircraft, trend) {
    container.innerHTML = '';

    var idLine = [aircraft.yearmfr, aircraft.make, aircraft.model].filter(Boolean).join(' ');
    container.appendChild(
      el('div', { class: 'jng-ac-summary' }, [
        el('div', { class: 'jng-stat' }, [
          el('div', { class: 'jng-stat-v', html: idLine || '—' }),
          el('div', { class: 'jng-stat-l', html: 'Aircraft' }),
        ]),
        el('div', { class: 'jng-stat' }, [
          el('div', { class: 'jng-stat-v', html: aircraft.serialnbr || '—' }),
          el('div', { class: 'jng-stat-l', html: 'Serial #' }),
        ]),
        el('div', { class: 'jng-stat' }, [
          el('div', { class: 'jng-stat-v', html: aircraft.categorysize || aircraft.weightclass || '—' }),
          el('div', { class: 'jng-stat-l', html: 'Category' }),
        ]),
      ])
    );

    if (!trend) {
      container.appendChild(
        el('div', { class: 'jng-eval-note', html: 'No current market data for this model — try again later or request a certified appraisal below.' })
      );
    } else {
      container.appendChild(
        el('div', { class: 'jng-eval-range' }, [
          el('div', { class: 'jng-eval-label', html: 'Estimated Market Value Range' }),
          el('div', { class: 'jng-eval-value', html: fmtMoney(trend.low_asking_price) + ' – ' + fmtMoney(trend.high_asking_price) }),
          el('div', { class: 'jng-eval-sub', html: 'Based on current asking prices across the active ' + idLine + ' market' }),
        ])
      );

      container.appendChild(
        el('div', { class: 'jng-ac-summary' }, [
          el('div', { class: 'jng-stat' }, [
            el('div', { class: 'jng-stat-v', html: fmtMoney(trend.avg_asking_price) }),
            el('div', { class: 'jng-stat-l', html: 'Fleet avg. asking price' }),
          ]),
          el('div', { class: 'jng-stat' }, [
            el('div', { class: 'jng-stat-v', html: String(trend.aircraft_for_sale_count != null ? trend.aircraft_for_sale_count : '—') }),
            el('div', { class: 'jng-stat-l', html: 'For sale now' }),
          ]),
          el('div', { class: 'jng-stat' }, [
            el('div', { class: 'jng-stat-v', html: String(trend.avg_daysonmarket != null ? trend.avg_daysonmarket : '—') }),
            el('div', { class: 'jng-stat-l', html: 'Avg. days on market' }),
          ]),
        ])
      );

      if (aircraft.yearmfr && trend.avg_year) {
        var diff = aircraft.yearmfr - trend.avg_year;
        var note;
        if (diff >= 2) {
          note = 'Your aircraft (built ' + aircraft.yearmfr + ') is newer than the average ' + idLine + ' currently on the market (avg. year ' + trend.avg_year + '), which typically supports pricing toward the upper end of this range.';
        } else if (diff <= -2) {
          note = 'Your aircraft (built ' + aircraft.yearmfr + ') is older than the average ' + idLine + ' currently on the market (avg. year ' + trend.avg_year + '), which typically positions it toward the lower end of this range, depending on hours and upgrades.';
        } else {
          note = 'Your aircraft (built ' + aircraft.yearmfr + ') is close to the average age of ' + idLine + ' currently on the market (avg. year ' + trend.avg_year + ').';
        }
        container.appendChild(el('div', { class: 'jng-eval-note', html: note }));
      }
    }

    container.appendChild(
      el('button', { class: 'jng-eval-cta', type: 'button', 'data-jg-open': 'appraisal-modal' }, [
        document.createTextNode('Request a Certified Appraisal'),
      ])
    );
    container.appendChild(
      el('div', {
        class: 'jng-eval-disclaimer',
        html: 'Preliminary estimate based on current market listings, not a formal appraisal.',
      })
    );
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
      el('div', { class: 'jng-eyebrow' }, [el('span', { class: 'jng-dot' }), document.createTextNode('Aircraft eValuation')])
    );

    var input = el('input', {
      class: 'jng-search-input',
      type: 'text',
      placeholder: 'Enter your aircraft tail number (e.g. N29ZR)',
      autocomplete: 'off',
    });
    var lookupBtn = el('button', { class: 'jng-lookup-btn', type: 'button', html: 'Get My Estimate' });
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

    function doEval() {
      var reg = input.value.trim();
      if (!reg) {
        setStatus('Enter a tail number first.', true);
        return;
      }
      row.hidden = true;
      selected.hidden = false;
      selectedLabel.textContent = reg.toUpperCase();
      body.innerHTML = '';
      setStatus('Looking up your aircraft…');

      apiFetch(apiBase, '/aircraft', { reg: reg })
        .then(function (data) {
          var aircraft = data.aircraft;
          if (!aircraft) throw new Error('No aircraft data available.');
          setStatus('Pulling current market data for ' + [aircraft.make, aircraft.model].filter(Boolean).join(' ') + '…');
          return apiFetch(apiBase, '/market-trends', { modelid: aircraft.modelid, months: 1 }).then(function (trendData) {
            var trend = (trendData.trends || [])[trendData.trends.length - 1] || null;
            renderEval(body, aircraft, trend);
            setStatus('');
          });
        })
        .catch(function (err) {
          body.innerHTML = '';
          setStatus(err.message || 'Lookup failed.', true);
        });
    }

    lookupBtn.addEventListener('click', doEval);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doEval();
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
    var roots = document.querySelectorAll('[data-jng-eval]');
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
