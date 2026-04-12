(() => {
  "use strict";

  const doc = document;
  const win = window;
  const prefersReducedMotion =
    win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onReady(callback) {
    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function initRevealAnimations() {
    const elements = Array.from(doc.querySelectorAll(".reveal"));

    if (!elements.length) {
      return;
    }

    if (prefersReducedMotion || !("IntersectionObserver" in win)) {
      elements.forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -6% 0px"
      }
    );

    elements.forEach((element) => {
      observer.observe(element);
    });
  }

  function normalizeUrl(value) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "";
    }

    if (/^https?:\/\//i.test(trimmedValue)) {
      return trimmedValue;
    }

    return `https://${trimmedValue}`;
  }

  function isValidUrl(value) {
    try {
      const normalizedValue = normalizeUrl(value);

      if (!normalizedValue) {
        return false;
      }

      const parsedUrl = new URL(normalizedValue);

      return Boolean(parsedUrl.hostname && parsedUrl.hostname.includes("."));
    } catch (error) {
      return false;
    }
  }

  function getFieldWrapper(field) {
    return field.closest(".field") || field.parentElement;
  }

  function getFieldHelp(field) {
    const wrapper = getFieldWrapper(field);

    if (!wrapper) {
      return null;
    }

    return wrapper.querySelector("small");
  }

  function getFieldValue(field) {
    return typeof field.value === "string" ? field.value.trim() : "";
  }

  function getErrorMessage(field) {
    const value = getFieldValue(field);
    const isRequired = field.hasAttribute("data-required");

    if (!value) {
      return isRequired ? "Ce champ est requis." : "";
    }

    if (field.type === "email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(value)) {
        return "Indiquez une adresse email valide.";
      }
    }

    if (field.type === "url" && !isValidUrl(value)) {
      return "Indiquez une URL valide.";
    }

    if (field.tagName === "TEXTAREA" && value.length < 24) {
      return "Merci de détailler un peu plus votre demande.";
    }

    return "";
  }

  function setFieldError(field, message) {
    const helpNode = getFieldHelp(field);

    field.setAttribute("aria-invalid", "true");

    if (helpNode) {
      helpNode.textContent = message;
    }
  }

  function clearFieldError(field) {
    const helpNode = getFieldHelp(field);

    field.setAttribute("aria-invalid", "false");

    if (helpNode) {
      helpNode.textContent = "";
    }
  }

  function validateField(field, forceDisplay) {
    const message = getErrorMessage(field);
    const shouldDisplayMessage =
      forceDisplay || field.dataset.touched === "true" || field.getAttribute("aria-invalid") === "true";

    if (!message) {
      clearFieldError(field);
      return true;
    }

    if (shouldDisplayMessage) {
      setFieldError(field, message);
    }

    return false;
  }

  function findSuccessMessage(form) {
    let sibling = form.nextElementSibling;

    while (sibling) {
      if (sibling.classList && sibling.classList.contains("success-message")) {
        return sibling;
      }

      sibling = sibling.nextElementSibling;
    }

    const wrapper = form.closest(".form-panel, .side-panel, article, section");

    if (!wrapper) {
      return null;
    }

    return wrapper.querySelector(".success-message");
  }

  function focusFirstInvalidField(fields) {
    const invalidField = fields.find((field) => field.getAttribute("aria-invalid") === "true");

    if (!invalidField) {
      return;
    }

    invalidField.focus({ preventScroll: false });
  }

  function resetFormState(form, fields, successMessage, submitButton, initialLabel) {
    form.reset();

    fields.forEach((field) => {
      delete field.dataset.touched;
      clearFieldError(field);
    });

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = initialLabel;
      submitButton.removeAttribute("aria-busy");
    }

    if (successMessage) {
      successMessage.classList.add("is-visible");
    }
  }

  function initForms() {
    const forms = Array.from(doc.querySelectorAll("[data-form]"));

    if (!forms.length) {
      return;
    }

    forms.forEach((form) => {
      const fields = Array.from(
        form.querySelectorAll("[data-required], [data-optional-validate]")
      );
      const successMessage = findSuccessMessage(form);
      const submitButton = form.querySelector("button[type='submit']");
      const initialLabel = submitButton ? submitButton.textContent : "";

      fields.forEach((field) => {
        clearFieldError(field);

        field.addEventListener("input", () => {
          field.dataset.touched = "true";
          validateField(field, false);
        });

        field.addEventListener("change", () => {
          field.dataset.touched = "true";
          validateField(field, true);
        });

        field.addEventListener("blur", () => {
          field.dataset.touched = "true";
          validateField(field, true);
        });
      });

      form.addEventListener("submit", (event) => {
        let hasError = false;

        event.preventDefault();

        if (successMessage) {
          successMessage.classList.remove("is-visible");
        }

        fields.forEach((field) => {
          field.dataset.touched = "true";

          if (!validateField(field, true)) {
            hasError = true;
          }
        });

        if (hasError) {
          focusFirstInvalidField(fields);
          return;
        }

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Envoi en cours...";
          submitButton.setAttribute("aria-busy", "true");
        }

        win.setTimeout(() => {
          resetFormState(form, fields, successMessage, submitButton, initialLabel);
        }, 700);
      });
    });
  }

  function initMouseDrag(scroller, shell) {
    let pointerIsDown = false;
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    function releasePointer(event) {
      if (
        event &&
        typeof event.pointerId !== "undefined" &&
        scroller.hasPointerCapture &&
        scroller.hasPointerCapture(event.pointerId)
      ) {
        scroller.releasePointerCapture(event.pointerId);
      }
    }

    function endDrag(event) {
      if (!pointerIsDown) {
        return;
      }

      pointerIsDown = false;
      isDragging = false;
      scroller.classList.remove("is-dragging");
      releasePointer(event);
    }

    scroller.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch" || event.button !== 0) {
        return;
      }

      pointerIsDown = true;
      isDragging = false;
      startX = event.clientX;
      startScrollLeft = scroller.scrollLeft;

      if (scroller.setPointerCapture) {
        scroller.setPointerCapture(event.pointerId);
      }
    });

    scroller.addEventListener("pointermove", (event) => {
      if (!pointerIsDown) {
        return;
      }

      const deltaX = event.clientX - startX;

      if (!isDragging && Math.abs(deltaX) < 6) {
        return;
      }

      isDragging = true;
      scroller.classList.add("is-dragging");
      shell.classList.add("is-hint-dismissed");
      scroller.scrollLeft = startScrollLeft - deltaX;
      event.preventDefault();
    });

    scroller.addEventListener("pointerup", endDrag);
    scroller.addEventListener("pointercancel", endDrag);
    scroller.addEventListener("lostpointercapture", endDrag);
  }

  function initComparisonShell(shell) {
    const scroller = shell.querySelector("[data-scrollable]");

    if (!scroller) {
      return;
    }

    if (!scroller.hasAttribute("tabindex")) {
      scroller.setAttribute("tabindex", "0");
    }

    if (!scroller.hasAttribute("aria-label")) {
      scroller.setAttribute("aria-label", "Tableau comparatif défilant horizontalement");
    }

    function updateScrollState() {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const isScrollable = maxScrollLeft > 12;
      const isAtEnd = scroller.scrollLeft >= maxScrollLeft - 8;

      shell.classList.toggle("is-scrollable", isScrollable);
      shell.classList.toggle("is-at-end", !isScrollable || isAtEnd);
    }

    scroller.addEventListener(
      "scroll",
      () => {
        if (scroller.scrollLeft > 12) {
          shell.classList.add("is-hint-dismissed");
        }

        updateScrollState();
      },
      { passive: true }
    );

    scroller.addEventListener("keydown", (event) => {
      const step = Math.max(160, Math.round(scroller.clientWidth * 0.5));

      if (event.key === "ArrowRight") {
        event.preventDefault();
        scroller.scrollBy({ left: step, behavior: "smooth" });
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scroller.scrollBy({ left: -step, behavior: "smooth" });
      }
    });

    if (win.matchMedia && win.matchMedia("(pointer: fine)").matches) {
      initMouseDrag(scroller, shell);
    }

    win.addEventListener("resize", updateScrollState, { passive: true });
    updateScrollState();
  }

  function initComparisonShells() {
    const shells = Array.from(doc.querySelectorAll("[data-comparison-shell]"));

    shells.forEach((shell) => {
      initComparisonShell(shell);
    });
  }

  onReady(() => {
    initRevealAnimations();
    initForms();
    initComparisonShells();
  });
})();
