const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

function getErrorMessage(field) {
  const value = field.value.trim();

  if (!value) {
    return "Ce champ est requis.";
  }

  if (field.type === "email") {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return "Indiquez une adresse email valide.";
    }
  }

  if (field.tagName === "TEXTAREA" && value.length < 16) {
    return "Merci de préciser un peu plus votre demande.";
  }

  return "";
}

function setFieldError(field, message) {
  field.setAttribute("aria-invalid", "true");
  const help = field.parentElement.querySelector("small");
  if (help) {
    help.textContent = message;
  }
}

function clearFieldError(field) {
  field.setAttribute("aria-invalid", "false");
  const help = field.parentElement.querySelector("small");
  if (help) {
    help.textContent = "";
  }
}

document.querySelectorAll("[data-form]").forEach((form) => {
  const requiredFields = [...form.querySelectorAll("[data-required]")];
  const submitButton = form.querySelector("button[type='submit']");
  const successMessage = form.parentElement.querySelector(".success-message");
  const initialLabel = submitButton ? submitButton.textContent : "";

  requiredFields.forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    let hasError = false;

    requiredFields.forEach((field) => {
      const message = getErrorMessage(field);

      if (message) {
        setFieldError(field, message);
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
    requiredFields.forEach((field) => clearFieldError(field));

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = initialLabel;
    }

    if (successMessage) {
      successMessage.classList.add("is-visible");
    }
  });
});
