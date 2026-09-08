(function () {
  'use strict';

  var STYLE = '\
.jng-hero-widget{font-family:"Urbanist",-apple-system,sans-serif;color:#f5f5f4;max-width:100%;box-sizing:border-box}\
.jng-hero-widget *{box-sizing:border-box;font-family:inherit;font-style:normal;line-height:1.5;text-decoration:none}\
.jng-hero-row{display:flex;gap:12px;flex-wrap:wrap;max-width:620px}\
.jng-hero-row[hidden]{display:none}\
.jng-hero-input{flex:1;min-width:260px;padding:16px 22px;font-size:16px;border:.8px solid rgba(255,255,255,.16);border-radius:999px;outline:none;background:rgba(255,255,255,.06);color:#f5f5f4;text-transform:uppercase}\
.jng-hero-input::placeholder{color:rgba(245,245,244,.55);text-transform:none}\
.jng-hero-input:focus{border-color:#b59e27;background:rgba(255,255,255,.1)}\
.jng-hero-btn{display:inline-flex;align-items:center;gap:10px;padding:16px 22px 16px 26px;font-size:14px;font-weight:400;border-radius:999px;border:.8px solid #b59e27;background:#b59e27;color:#f5f5f4;cursor:pointer;white-space:nowrap}\
.jng-hero-btn:hover{background:#a08c22;border-color:#a08c22}\
.jng-hero-btn .jng-hero-arrow{width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.18);flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\' fill=\'none\' stroke=\'%23f5f5f4\' stroke-width=\'1.7\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M6 4l4 4-4 4\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center;background-size:10px}\
.jng-hero-selected{display:flex;align-items:center;gap:16px;margin-bottom:20px;flex-wrap:wrap}\
.jng-hero-selected[hidden]{display:none}\
.jng-hero-selected-label{font-family:"Inter",sans-serif;font-size:22px;font-weight:300;letter-spacing:-.02em;color:#f5f5f4}\
.jng-hero-clear{border:.8px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#f5f5f4;cursor:pointer;font-size:13px;padding:8px 18px;border-radius:999px}\
.jng-hero-clear:hover{border-color:#b59e27;color:#b59e27}\
.jng-hero-results{margin-top:24px;max-width:620px;background:rgba(20,18,18,.55);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:.8px solid rgba(255,255,255,.16);border-radius:20px;padding:28px 30px}\
.jng-hero-results[hidden]{display:none}\
.jng-hero-summary{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:18px}\
.jng-hero-stat{min-width:120px;flex:1 1 120px;border:.8px solid rgba(255,255,255,.16);border-top:3px solid #b59e27;border-radius:12px;padding:12px 14px;background:rgba(255,255,255,.04)}\
.jng-hero-stat .v{font-family:"Inter",sans-serif;font-size:17px;font-weight:500;color:#f5f5f4}\
.jng-hero-stat .l{font-size:12px;color:rgba(245,245,244,.6);margin-top:2px}\
.jng-hero-range{border:.8px solid rgba(181,158,39,.4);border-top:4px solid #b59e27;border-radius:14px;padding:22px 24px;margin-bottom:18px;text-align:center;background:rgba(181,158,39,.08)}\
.jng-hero-range .label{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:rgba(245,245,244,.65);margin-bottom:8px}\
.jng-hero-range .value{font-family:"Inter",sans-serif;font-size:30px;font-weight:300;color:#f5f5f4}\
.jng-hero-range .sub{font-size:12px;color:rgba(245,245,244,.6);margin-top:6px}\
.jng-hero-note{font-size:13px;color:#f5f5f4;background:rgba(255,255,255,.06);border-radius:10px;padding:14px 16px;margin-bottom:18px}\
.jng-hero-cta{-webkit-appearance:none;appearance:none;display:flex;align-items:center;justify-content:center;gap:10px;padding:14px 26px;border-radius:999px;border:.8px solid #b59e27;background:#b59e27;color:#f5f5f4;font-size:14px;cursor:pointer;width:100%}\
.jng-hero-cta:hover{background:#a08c22;border-color:#a08c22}\
.jng-hero-disclaimer{font-size:11px;color:rgba(245,245,244,.5);margin-top:12px;text-align:center}\
.jng-hero-status{margin-top:12px;font-size:13px;color:rgba(245,245,244,.65)}\
.jng-hero-status.jng-error{color:#f5f5f4;font-weight:600}\
.jng-hero-status.jng-error:before{content:"\\26A0  "}\
';

  function injectStyle() {
    if (document.getElementById('jng-eval-hero-style')) return;
    var s = document.createElement('style');
    s.id = 'jng-eval-hero-style';
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
      el('div', { class: 'jng-hero-summary' }, [
        el('div', { class: 'jng-hero-stat' }, [
          el('div', { class: 'v', html: idLine || '—' }),
          el('div', { class: 'l', html: 'Aircraft' }),
        ]),
        el('div', { class: 'jng-hero-stat' }, [
          el('div', { class: 'v', html: aircraft.serialnbr || '—' }),
          el('div', { class: 'l', html: 'Serial #' }),
        ]),
        el('div', { class: 'jng-hero-stat' }, [
          el('div', { class: 'v', html: aircraft.categorysize || aircraft.weightclass || '—' }),
          el('div', { class: 'l', html: 'Category' }),
        ]),
      ])
    );

    if (!trend) {
      container.appendChild(
        el('div', { class: 'jng-hero-note', html: 'No current market data for this model — request a certified appraisal below.' })
      );
    } else {
      container.appendChild(
        el('div', { class: 'jng-hero-range' }, [
          el('div', { class: 'label', html: 'Estimated Market Value Range' }),
          el('div', { class: 'value', html: fmtMoney(trend.low_asking_price) + ' – ' + fmtMoney(trend.high_asking_price) }),
          el('div', { class: 'sub', html: 'Based on current asking prices across the active ' + idLine + ' market' }),
        ])
      );
      container.appendChild(
        el('div', { class: 'jng-hero-summary' }, [
          el('div', { class: 'jng-hero-stat' }, [
            el('div', { class: 'v', html: fmtMoney(trend.avg_asking_price) }),
            el('div', { class: 'l', html: 'Fleet avg. asking price' }),
          ]),
          el('div', { class: 'jng-hero-stat' }, [
            el('div', { class: 'v', html: String(trend.aircraft_for_sale_count != null ? trend.aircraft_for_sale_count : '—') }),
            el('div', { class: 'l', html: 'For sale now' }),
          ]),
          el('div', { class: 'jng-hero-stat' }, [
            el('div', { class: 'v', html: String(trend.avg_daysonmarket != null ? trend.avg_daysonmarket : '—') }),
            el('div', { class: 'l', html: 'Avg. days on market' }),
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
        container.appendChild(el('div', { class: 'jng-hero-note', html: note }));
      }
    }

    container.appendChild(
      el('button', { class: 'jng-hero-cta', type: 'button', 'data-jg-open': 'appraisal-modal' }, [document.createTextNode('Request a Certified Appraisal')])
    );
    container.appendChild(
      el('div', { class: 'jng-hero-disclaimer', html: 'Preliminary estimate based on current market listings, not a formal appraisal.' })
    );
  }

  function initWidget(root) {
    var apiBase = root.getAttribute('data-api-base');
    if (!apiBase) {
      root.innerHTML = '<div class="jng-hero-status jng-error">Missing data-api-base on the widget container.</div>';
      return;
    }

    injectStyle();
    root.innerHTML = '';
    root.classList.add('jng-hero-widget');

    var input = el('input', {
      class: 'jng-hero-input',
      type: 'text',
      placeholder: 'Enter your aircraft tail number',
      autocomplete: 'off',
    });
    var btn = el('button', { class: 'jng-hero-btn', type: 'button' }, [
      document.createTextNode('GET YOUR APPRAISAL'),
      el('span', { class: 'jng-hero-arrow' }),
    ]);
    var row = el('div', { class: 'jng-hero-row' }, [input, btn]);

    var selectedLabel = el('span', { class: 'jng-hero-selected-label' });
    var clearBtn = el('button', { class: 'jng-hero-clear', type: 'button', html: 'New search' });
    var selected = el('div', { class: 'jng-hero-selected' }, [selectedLabel, clearBtn]);
    selected.hidden = true;

    var results = el('div', { class: 'jng-hero-results' });
    results.hidden = true;
    var status = el('div', { class: 'jng-hero-status' });

    root.appendChild(row);
    root.appendChild(selected);
    root.appendChild(results);
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
      results.hidden = false;
      selectedLabel.textContent = reg.toUpperCase();
      results.innerHTML = '';
      setStatus('Looking up your aircraft…');

      apiFetch(apiBase, '/aircraft', { reg: reg })
        .then(function (data) {
          var aircraft = data.aircraft;
          if (!aircraft) throw new Error('No aircraft data available.');
          setStatus('Pulling current market data for ' + [aircraft.make, aircraft.model].filter(Boolean).join(' ') + '…');
          return apiFetch(apiBase, '/market-trends', { modelid: aircraft.modelid, months: 1 }).then(function (trendData) {
            var trend = (trendData.trends || [])[trendData.trends.length - 1] || null;
            renderEval(results, aircraft, trend);
            setStatus('');
          });
        })
        .catch(function (err) {
          results.hidden = true;
          setStatus(err.message || 'Lookup failed.', true);
        });
    }

    btn.addEventListener('click', doEval);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doEval();
      }
    });

    clearBtn.addEventListener('click', function () {
      selected.hidden = true;
      results.hidden = true;
      row.hidden = false;
      input.value = '';
      input.focus();
      setStatus('');
    });
  }

  function init() {
    var roots = document.querySelectorAll('[data-jng-eval-hero]');
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
