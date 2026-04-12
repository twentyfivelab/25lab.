var revealElements = document.querySelectorAll(".reveal");

if (revealElements.length && "IntersectionObserver" in window) {
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach(function (element) {
    observer.observe(element);
  });
} else {
  revealElements.forEach(function (element) {
    element.classList.add("is-visible");
  });
}

function isValidUrl(value) {
  try {
    var normalizedValue = value;

    if (!value.match(/^https?:\/\//i)) {
      normalizedValue = "https://" + value;
    }

    new URL(normalizedValue);
    return true;
  } catch (error) {
    return false;
  }
}

function getErrorMessage(field) {
  var value = field.value.trim();
  var isRequired = field.hasAttribute("data-required");

  if (!value) {
    return isRequired ? "Ce champ est requis." : "";
  }

  if (field.type === "email") {
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function showFieldError(field, message) {
  var errorNode = field.parentElement.querySelector("small");

  field.setAttribute("aria-invalid", "true");

  if (errorNode) {
    errorNode.textContent = message;
  }
}

function clearFieldError(field) {
  var errorNode = field.parentElement.querySelector("small");

  field.setAttribute("aria-invalid", "false");

  if (errorNode) {
    errorNode.textContent = "";
  }
}

document.querySelectorAll("[data-form]").forEach(function (form) {
  var fields = Array.prototype.slice.call(
    form.querySelectorAll("[data-required], [data-optional-validate]")
  );
  var successMessage = form.parentElement.querySelector(".success-message");
  var submitButton = form.querySelector("button[type='submit']");
  var initialLabel = submitButton ? submitButton.textContent : "";

  fields.forEach(function (field) {
    field.addEventListener("input", function () {
      clearFieldError(field);
    });

    field.addEventListener("change", function () {
      clearFieldError(field);
    });
  });

  form.addEventListener("submit", function (event) {
    var hasError = false;

    event.preventDefault();

    fields.forEach(function (field) {
      var message = getErrorMessage(field);

      if (message) {
        showFieldError(field, message);
        hasError = true;
      } else {
        clearFieldError(field);
      }
    });

    if (hasError) {
      return;
    }

    if (successMessage) {
      successMessage.classList.remove("is-visible");
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Envoi en cours...";
    }

    window.setTimeout(function () {
      form.reset();
      fields.forEach(function (field) {
        clearFieldError(field);
      });

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = initialLabel;
      }

      if (successMessage) {
        successMessage.classList.add("is-visible");
      }
    }, 1000);
  });
});

function initComparisonShell(shell) {
  var scroller = shell.querySelector("[data-scrollable]");

  if (!scroller) {
    return;
  }

  var isPointerDown = false;
  var startX = 0;
  var startScrollLeft = 0;

  function updateScrollState() {
    var isScrollable = scroller.scrollWidth - scroller.clientWidth > 12;
    var isAtEnd =
      scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 8;

    shell.classList.toggle("is-scrollable", isScrollable);
    shell.classList.toggle("is-at-end", !isScrollable || isAtEnd);
  }

  function endDrag(event) {
    if (!isPointerDown) {
      return;
    }

    isPointerDown = false;
    scroller.classList.remove("is-dragging");

    if (
      event &&
      typeof event.pointerId !== "undefined" &&
      scroller.hasPointerCapture &&
      scroller.hasPointerCapture(event.pointerId)
    ) {
      scroller.releasePointerCapture(event.pointerId);
    }
  }

  scroller.addEventListener(
    "scroll",
    function () {
      if (scroller.scrollLeft > 12) {
        shell.classList.add("is-hint-dismissed");
      }

      updateScrollState();
    },
    { passive: true }
  );

  scroller.addEventListener("pointerdown", function (event) {
    if (scroller.scrollWidth - scroller.clientWidth <= 12) {
      return;
    }

    isPointerDown = true;
    startX = event.clientX;
    startScrollLeft = scroller.scrollLeft;
    scroller.classList.add("is-dragging");

    if (scroller.setPointerCapture) {
      scroller.setPointerCapture(event.pointerId);
    }
  });

  scroller.addEventListener("pointermove", function (event) {
    if (!isPointerDown) {
      return;
    }

    scroller.scrollLeft = startScrollLeft - (event.clientX - startX);
  });

  scroller.addEventListener("pointerup", endDrag);
  scroller.addEventListener("pointercancel", endDrag);
  scroller.addEventListener("mouseleave", endDrag);

  window.addEventListener("resize", updateScrollState);
  updateScrollState();
}

document.querySelectorAll("[data-comparison-shell]").forEach(initComparisonShell);
