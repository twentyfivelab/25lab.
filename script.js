const revealElements = document.querySelectorAll(".reveal");

if (revealElements.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function isValidUrl(value) {
  try {
    const normalizedValue = value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

    new URL(normalizedValue);
    return true;
  } catch {
    return false;
  }
}

function getErrorMessage(field) {
  const value = field.value.trim();
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

function showFieldError(field, message) {
  field.setAttribute("aria-invalid", "true");
  const errorNode = field.parentElement.querySelector("small");
  if (errorNode) {
    errorNode.textContent = message;
  }
}

function clearFieldError(field) {
  field.setAttribute("aria-invalid", "false");
  const errorNode = field.parentElement.querySelector("small");
  if (errorNode) {
    errorNode.textContent = "";
  }
}

document.querySelectorAll("[data-form]").forEach((form) => {
  const fields = [
    ...form.querySelectorAll("[data-required], [data-optional-validate]")
  ];
  const successMessage = form.parentElement.querySelector(".success-message");
  const submitButton = form.querySelector("button[type='submit']");
  const initialLabel = submitButton ? submitButton.textContent : "";

  fields.forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    let hasError = false;

    fields.forEach((field) => {
      const message = getErrorMessage(field);

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

    await new Promise((resolve) => setTimeout(resolve, 1000));

    form.reset();
    fields.forEach((field) => clearFieldError(field));

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = initialLabel;
    }

    if (successMessage) {
      successMessage.classList.add("is-visible");
    }
  });
});
