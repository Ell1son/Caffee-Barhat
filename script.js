(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /*Настройки кофейни */
  var CAFE = {
    timeZone: "Europe/Tallinn",
    email: "hello@barkhat.cafe",
    address: "ул. Кофейная, 7, Таллинн, 10123",
    // часы по дням недели: 0 — воскресенье, 1 — понедельник ...
    hours: {
      0: [9, 19],
      1: [8, 20],
      2: [8, 20],
      3: [8, 20],
      4: [8, 20],
      5: [8, 22],
      6: [9, 22],
    },
  };

  /* ---------- Шапка: фон при прокрутке ---------- */
  var header = document.getElementById("header");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Боковое меню ---------- */
  var drawer = document.getElementById("drawer");
  var overlay = document.getElementById("overlay");
  var openBtn = document.getElementById("menuOpen");
  var closeBtn = document.getElementById("menuClose");
  var closeTimer = null;

  function openDrawer() {
    clearTimeout(closeTimer);
    overlay.hidden = false;
    requestAnimationFrame(function () {
      overlay.classList.add("is-visible");
    });
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    openBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
    setTimeout(function () {
      closeBtn.focus();
    }, 300);
  }

  function closeDrawer(returnFocus) {
    if (!drawer.classList.contains("is-open")) return;
    overlay.classList.remove("is-visible");
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    openBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
    closeTimer = setTimeout(function () {
      overlay.hidden = true;
    }, 400);
    if (returnFocus) openBtn.focus();
  }

  openBtn.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", function () {
    closeDrawer(true);
  });
  overlay.addEventListener("click", function () {
    closeDrawer(true);
  });
  drawer.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeDrawer(false);
  });

  document.addEventListener("keydown", function (e) {
    if (!drawer.classList.contains("is-open")) return;
    if (e.key === "Escape") closeDrawer(true);
    // держим фокус внутри открытого меню
    if (e.key === "Tab") {
      var focusable = drawer.querySelectorAll("a, button");
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------- Вкладки меню ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  function activateTab(active) {
    tabs.forEach(function (tab) {
      var isActive = tab === active;
      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
    });
  }
  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activateTab(tab);
    });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
      if (e.key === "ArrowLeft")
        next = tabs[(index - 1 + tabs.length) % tabs.length];
      if (next) {
        next.focus();
        activateTab(next);
      }
    });
  });

  /* ---------- Открыто ли сейчас + сегодняшний день ---------- */
  function nowInCafeZone() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: CAFE.timeZone,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) {
        map[p.type] = p.value;
      });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return {
        day: days[map.weekday],
        minutes: parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10),
      };
    } catch (err) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function hh(h) {
    return (h < 10 ? "0" : "") + h + ":00";
  }

  function updateStatus() {
    var now = nowInCafeZone();
    var today = CAFE.hours[now.day];
    var isOpen = now.minutes >= today[0] * 60 && now.minutes < today[1] * 60;
    var label;

    if (isOpen) {
      label = "Сейчас открыто · до " + hh(today[1]);
    } else if (now.minutes < today[0] * 60) {
      label = "Сейчас закрыто · откроемся в " + hh(today[0]);
    } else {
      label =
        "Сейчас закрыто · завтра с " + hh(CAFE.hours[(now.day + 1) % 7][0]);
    }

    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", isOpen);
      el.querySelector("[data-status-text]").textContent = label;
    });
    document.querySelectorAll("#hours li").forEach(function (row) {
      row.classList.toggle("is-today", Number(row.dataset.day) === now.day);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Копирование адреса ---------- */
  var copyBtn = document.getElementById("copyAddress");
  copyBtn.addEventListener("click", function () {
    var original = "Скопировать адрес";
    function done(label) {
      copyBtn.textContent = label;
      setTimeout(function () {
        copyBtn.textContent = original;
      }, 2200);
    }
    function selectText() {
      var range = document.createRange();
      range.selectNodeContents(document.getElementById("address"));
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      done("Адрес выделен");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(CAFE.address).then(function () {
        done("Адрес скопирован");
      }, selectText);
    } else {
      selectText();
    }
  });

  /* ---------- Бронирование: письмо с готовым текстом ----------
     Сайт без сервера не может отправить заявку сам, поэтому форма
     открывает почтовую программу гостя. Для прямой отправки
     подключите сервис бронирования или свой бэкенд. */
  var form = document.getElementById("booking");
  var dateInput = document.getElementById("b-date");
  var error = document.getElementById("bookingError");

  var d = new Date();
  var iso =
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0");
  dateInput.min = iso;
  dateInput.value = iso;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var name = String(data.get("name") || "").trim();
    var phone = String(data.get("phone") || "").trim();
    var date = data.get("date");
    var time = data.get("time");

    if (!name || !phone || !date || !time) {
      error.hidden = false;
      return;
    }
    error.hidden = true;

    var subject = "Бронь столика — " + date + " " + time;
    var body =
      "Здравствуйте!\n\nХочу забронировать столик.\n\n" +
      "Имя: " +
      name +
      "\n" +
      "Дата: " +
      date +
      "\n" +
      "Время: " +
      time +
      "\n" +
      "Гостей: " +
      data.get("guests") +
      "\n" +
      "Телефон: " +
      phone +
      "\n";

    window.location.href =
      "mailto:" +
      CAFE.email +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);
  });

  /* ---------- Появление блоков при прокрутке ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 90 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Год в подвале ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
