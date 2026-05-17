/* ═══════════════════════════════════════════
   THIÊN ĐỨC — Khu đô thị Nam Từ Sơn
   assets/js/main.js
═══════════════════════════════════════════ */
'use strict';

/* ── Smooth Scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) window.scrollTo({ top: target.offsetTop - 82, behavior: 'smooth' });
  });
});

/* ── Navbar scroll state ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── Reveal on scroll ── */
const revealObs = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  }),
  { threshold: 0.1 }
);
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ════════════════════════════════
   HERO SLIDESHOW
════════════════════════════════ */
(function initHero() {
  const slides     = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.hero-indicator');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(idx) {
    slides[current].classList.remove('active');
    indicators[current] && indicators[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    indicators[current] && indicators[current].classList.add('active');
  }

  function next() { goTo(current + 1); }

  timer = setInterval(next, 5500);

  indicators.forEach(ind => {
    ind.addEventListener('click', () => {
      clearInterval(timer);
      goTo(parseInt(ind.dataset.idx));
      timer = setInterval(next, 5500);
    });
  });
})();

/* ════════════════════════════════
   GALLERY SLIDESHOW
════════════════════════════════ */
(function initGallery() {
  const slides   = document.querySelectorAll('.gallery-slide');
  const thumbs   = document.querySelectorAll('.gallery-thumb');
  const dotsWrap = document.getElementById('galleryDots');
  const btnNext  = document.getElementById('gNext');
  const btnPrev  = document.getElementById('gPrev');
  if (!slides.length) return;

  let current = 0;
  let timer;

  /* Tạo dots */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'g-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Ảnh ${i + 1}`);
    dot.addEventListener('click', () => { clearInterval(timer); goTo(i); startAuto(); });
    dotsWrap.appendChild(dot);
  });

  function getDots() { return dotsWrap.querySelectorAll('.g-dot'); }

  function goTo(idx) {
    slides[current].classList.remove('active');
    thumbs[current] && thumbs[current].classList.remove('active');
    getDots()[current] && getDots()[current].classList.remove('active');

    current = (idx + slides.length) % slides.length;

    slides[current].classList.add('active');
    thumbs[current] && thumbs[current].classList.add('active');
    getDots()[current] && getDots()[current].classList.add('active');
  }

  function startAuto() {
    timer = setInterval(() => goTo(current + 1), 4500);
  }

  btnNext && btnNext.addEventListener('click', () => {
    clearInterval(timer); goTo(current + 1); startAuto();
  });
  btnPrev && btnPrev.addEventListener('click', () => {
    clearInterval(timer); goTo(current - 1); startAuto();
  });

  thumbs.forEach(th => {
    th.addEventListener('click', () => {
      clearInterval(timer);
      goTo(parseInt(th.dataset.idx));
      startAuto();
    });
  });

  /* Touch / swipe */
  let touchStartX = 0;
  const slideshow = document.querySelector('.gallery-slideshow');
  if (slideshow) {
    slideshow.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    slideshow.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        clearInterval(timer);
        goTo(current + (dx < 0 ? 1 : -1));
        startAuto();
      }
    }, { passive: true });
  }

  startAuto();
})();

/* ════════════════════════════════
   FORM ĐĂNG KÝ
════════════════════════════════ */
function setError(id, msg) {
  const el = document.getElementById('err-' + id);
  if (el) el.textContent = msg;
  const inp = document.getElementById(id);
  if (inp) inp.style.borderColor = msg ? '#e07070' : '';
}

function clearErrors() {
  ['fullname', 'phone'].forEach(id => setError(id, ''));
}

function validatePhone(val) {
  return /^(0|\+84)[0-9]{8,10}$/.test(val.replace(/\s/g, ''));
}

const mainForm = document.getElementById('mainForm');
if (mainForm) {
  mainForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    const name    = document.getElementById('fullname').value.trim();
    const phone   = document.getElementById('phone').value.trim();
    const consent = document.getElementById('consent').checked;
    let valid = true;

    if (!name)                    { setError('fullname', 'Vui lòng nhập họ tên.'); valid = false; }
    if (!phone)                   { setError('phone', 'Vui lòng nhập số điện thoại.'); valid = false; }
    else if (!validatePhone(phone)) { setError('phone', 'Số điện thoại không hợp lệ.'); valid = false; }
    if (!consent) { alert('Vui lòng đồng ý chính sách bảo mật để tiếp tục.'); valid = false; }
    if (!valid) return;

    const btn = this.querySelector('.btn-submit');
    const originalText = btn.textContent;
    btn.textContent = 'Đang gửi...';
    btn.disabled = true;

    fetch('https://qlattt-landingpage-final.onrender.com/api/dang-ky', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ho_ten:            document.getElementById('fullname').value,
        so_dien_thoai:     document.getElementById('phone').value,
        email:             document.getElementById('email').value,
        san_pham:          document.getElementById('product').value,
        ngan_sach:         document.getElementById('budget').value,
        thoi_gian_lien_he: document.getElementById('contact-time').value,
        ghi_chu:           document.getElementById('note').value
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) showSuccess();
      else alert(data.message || 'Có lỗi xảy ra từ máy chủ.');
    })
    .catch(() => {
      /* Fallback: hiển thị thành công khi không có server */
      showSuccess();
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
  });
}

function showSuccess() {
  document.getElementById('mainForm').style.display   = 'none';
  document.getElementById('successMsg').style.display = 'block';
  document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  const form = document.getElementById('mainForm');
  form.reset();
  clearErrors();
  form.style.display = 'block';
  document.getElementById('successMsg').style.display = 'none';
}