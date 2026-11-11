/* Light password gate for the blog. Not real security (it all runs in the browser and the
   posts are public in the repo); it just keeps casual visitors from wandering in.
   Load it in <head> WITHOUT defer/async so the page stays hidden until it's unlocked.
   The password is a date; any format works (01/22/2003, 1-22-2003, 01222003...) because
   only the digits are compared, as a SHA-256 hash so the date isn't sitting in the source. */
(function () {
  var KEY = 'blogUnlocked';
  var HASHES = [
    'dbcb1a9aa45f2f7a8830cf0d0129329d40fbd70131da2e51385c65a18779322a',
    '368b55866bc139e4193f928bafeb1fce1fa0cf7f4d494e047f079fbcf587df04'
  ];
  var root = document.documentElement;
  try { if (localStorage.getItem(KEY) === '1') return; } catch (e) {}
  root.classList.add('blog-locked');

  var css = document.createElement('style');
  css.textContent =
    'html.blog-locked body>*:not(.lock-dialog){display:none!important}' +
    '.lock-dialog{max-width:340px;margin:12vh auto 0;background:#ECE9D8;border:1px solid #0055ea;border-radius:8px 8px 0 0;box-shadow:0 0 14px rgba(0,0,0,.4);overflow:hidden;font:12px Tahoma,Verdana,sans-serif;color:#000}' +
    '.lock-dialog .lock-title{padding:6px 10px;background:linear-gradient(to right,#2f8cff,#0050ef);color:#fff;font-weight:bold;font-size:13px}' +
    '.lock-dialog form{padding:16px 16px 14px}' +
    '.lock-dialog .lock-row{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}' +
    '.lock-dialog .lock-row img{width:32px;height:32px}' +
    '.lock-dialog label{display:block;margin-bottom:4px}' +
    '.lock-dialog input{width:100%;padding:3px 4px;border:1px solid #7f9db9;font:12px Tahoma,Verdana,sans-serif}' +
    '.lock-dialog .lock-err{color:#c00;min-height:16px;margin-top:6px}' +
    '.lock-dialog .lock-btns{display:flex;justify-content:flex-end;gap:6px}' +
    '.lock-dialog button,.lock-dialog .lock-btns a{min-width:72px;padding:3px 10px;font:12px Tahoma,Verdana,sans-serif;color:#000;text-decoration:none;text-align:center;background:linear-gradient(#fff,#ece9d8 85%,#d6d0bc);border:1px solid #003c74;border-radius:3px;cursor:pointer}';
  document.head.appendChild(css);

  // works from /blog/ and /blog/posts/
  var up = location.pathname.indexOf('/posts/') !== -1 ? '../../' : '../';

  function digest(text) {
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  function build() {
    var box = document.createElement('div');
    box.className = 'lock-dialog';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'lockTitle');
    box.innerHTML =
      '<div class="lock-title" id="lockTitle">Password Protected</div>' +
      '<form>' +
        '<div class="lock-row"><img src="' + up + 'images/icon-notepad.png" alt="">' +
        '<div style="flex:1"><label for="lockPw">This folder is password protected. Enter the password to open it.</label>' +
        '<input id="lockPw" type="password" autocomplete="off" autofocus>' +
        '<div class="lock-err" id="lockErr" aria-live="polite"></div></div></div>' +
        '<div class="lock-btns"><button type="submit">OK</button><a href="' + up + '">Cancel</a></div>' +
      '</form>';
    document.body.insertBefore(box, document.body.firstChild);
    var input = box.querySelector('input');
    var err = box.querySelector('#lockErr');
    input.focus();
    box.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      digest(input.value.replace(/\D/g, '')).then(function (h) {
        if (HASHES.indexOf(h) !== -1) {
          try { localStorage.setItem(KEY, '1'); } catch (x) {}
          box.remove();
          root.classList.remove('blog-locked');
        } else {
          err.textContent = 'The password is incorrect.';
          input.select();
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
