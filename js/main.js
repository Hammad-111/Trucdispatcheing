const splash = document.getElementById("splash");

if (splash) {
  const finishSplash = () => {
    splash.remove();
    document.body.classList.remove("is-splash");
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finishSplash();
  } else {
    splash.addEventListener("animationend", (event) => {
      if (event.animationName === "splash-leave") finishSplash();
    });
    window.setTimeout(finishSplash, 2400);
  }
}

const email = document.body.dataset.email || "";
const phoneHref = document.body.dataset.phone || "";

const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open menu");
      syncNav();
    });
  });
}

const nav = document.querySelector(".nav");

function syncNav() {
  if (!nav || !document.body.classList.contains("home")) return;
  const open = navLinks && navLinks.classList.contains("open");
  nav.classList.toggle("is-solid", Boolean(open) || window.scrollY > 12);
  nav.classList.toggle("is-open", Boolean(open));
}

if (nav && document.body.classList.contains("home")) {
  syncNav();
  window.addEventListener("scroll", syncNav, { passive: true });
  if (menuBtn) menuBtn.addEventListener("click", () => requestAnimationFrame(syncNav));
}

const sections = [...document.querySelectorAll("main section[id]")];
const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];

if (sections.length && navAnchors.length) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navAnchors.forEach((link) => {
          const active = link.getAttribute("href") === `#${id}`;
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((section) => spy.observe(section));
}

document.querySelectorAll("[data-intent]").forEach((link) => {
  link.addEventListener("click", () => {
    const message = document.querySelector("#message");
    if (!message || message.value.trim()) return;
    if (link.dataset.intent === "pricing") {
      message.value = "I would like to discuss a dispatch arrangement and pricing for my operation.";
    }
  });
});

const form = document.querySelector("#dispatch-form");
const success = document.querySelector("#form-success");
const summary = document.querySelector("#request-summary");
const mailtoLink = document.querySelector("#mailto-link");
const copyBtn = document.querySelector("#copy-request");
const editBtn = document.querySelector("#edit-request");

function fieldError(field, message) {
  const error = field.querySelector(".error");
  const control = field.querySelector("input, select, textarea");
  if (message) {
    field.classList.add("is-invalid");
    if (error) error.textContent = message;
    if (control) control.setAttribute("aria-invalid", "true");
  } else {
    field.classList.remove("is-invalid");
    if (error) error.textContent = "";
    if (control) control.removeAttribute("aria-invalid");
  }
}

function validate(formEl) {
  let valid = true;
  const required = formEl.querySelectorAll("[required]");
  required.forEach((control) => {
    const field = control.closest(".field");
    const value = control.type === "checkbox" ? control.checked : control.value.trim();
    let message = "";
    if (control.type === "checkbox") {
      if (!control.checked) message = "Please confirm before submitting.";
    } else if (!value) message = "This field is required.";
    else if (control.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      message = "Enter a valid email address.";
    } else if (control.id === "phone" && value.replace(/\D/g, "").length < 7) {
      message = "Enter a phone number we can reach.";
    } else if (control.id === "trucks" && (Number(value) < 1 || Number.isNaN(Number(value)))) {
      message = "Enter at least 1 truck.";
    }
    fieldError(field, message);
    if (message) valid = false;
  });
  return valid;
}

function requestText(data) {
  return [
    "Dispatch setup request",
    "",
    `Full name: ${data.name}`,
    `Company name: ${data.company || "—"}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Number of trucks: ${data.trucks}`,
    `Equipment type: ${data.equipment}`,
    `Current truck location: ${data.location}`,
    `Preferred lanes: ${data.lanes || "—"}`,
    `Message: ${data.message || "—"}`,
  ].join("\n");
}

function mailtoHref(data, body) {
  const subject = `Dispatch setup request — ${data.name}`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

if (form && success && summary && mailtoLink) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.company_website && form.company_website.value) return;
    if (!validate(form)) {
      const first = form.querySelector(".is-invalid input, .is-invalid select, .is-invalid textarea");
      if (first) first.focus();
      return;
    }

    const data = {
      name: form.name.value.trim(),
      company: form.company.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      trucks: form.trucks.value.trim(),
      equipment: form.equipment.value.trim(),
      location: form.location.value.trim(),
      lanes: form.lanes.value.trim(),
      message: form.message.value.trim(),
    };
    const body = requestText(data);
    const href = mailtoHref(data, body);
    summary.textContent = body;
    mailtoLink.href = href;
    form.hidden = true;
    success.hidden = false;
    success.focus();
    window.location.href = href;
  });

  form.querySelectorAll("input, select, textarea").forEach((control) => {
    const clear = () => {
      const field = control.closest(".field");
      if (field && field.classList.contains("is-invalid")) fieldError(field, "");
    };
    control.addEventListener("input", clear);
    control.addEventListener("change", clear);
  });
}

if (copyBtn && summary) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(summary.textContent);
      copyBtn.textContent = "Copied";
    } catch {
      copyBtn.textContent = "Select the request and copy it";
    }
  });
}

if (editBtn && form && success) {
  editBtn.addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    if (copyBtn) copyBtn.textContent = "Copy request";
  });
}

if (phoneHref) {
  document.querySelectorAll("[data-phone-link]").forEach((link) => {
    link.href = `tel:${phoneHref}`;
  });
}

document.documentElement.classList.add("js");

const animated = document.querySelectorAll(
  ".card, .service-list li, .steps > li, .equip, .checks li, .req-list li, .faq details, .price-panel, .notice-grid li"
);
const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

animated.forEach((el) => el.classList.add("anim"));

if (!motionOk || !("IntersectionObserver" in window)) {
  animated.forEach((el) => el.classList.add("is-in"));
} else {
  const groups = new Map();
  animated.forEach((el) => {
    const list = groups.get(el.parentElement) || [];
    list.push(el);
    groups.set(el.parentElement, list);
  });
  groups.forEach((list) => {
    list.forEach((el, index) => {
      el.style.setProperty("--d", `${Math.min(index, 7) * 70}ms`);
    });
  });

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-in");
        reveal.unobserve(el);
        const clearDelay = (event) => {
          if (event.target !== el || event.propertyName !== "opacity") return;
          el.style.removeProperty("--d");
          el.removeEventListener("transitionend", clearDelay);
        };
        el.addEventListener("transitionend", clearDelay);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
  );

  animated.forEach((el) => reveal.observe(el));
}
