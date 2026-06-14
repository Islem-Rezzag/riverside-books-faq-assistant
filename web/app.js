const form = document.querySelector("#askForm");
const input = document.querySelector("#questionInput");
const sendButton = document.querySelector("#sendButton");
const messageLog = document.querySelector("#messageLog");
const faqCardTitle = document.querySelector("#faqCardTitle");
const faqCardBody = document.querySelector("#faqCardBody");
const statusBadge = document.querySelector("#statusBadge");
const faqIdValue = document.querySelector("#faqIdValue");
const confidenceValue = document.querySelector("#confidenceValue");
const modelValue = document.querySelector("#modelValue");
const sourceValue = document.querySelector("#sourceValue");
const responseTimeValue = document.querySelector("#responseTimeValue");
const reasonText = document.querySelector("#reasonText");
const exampleButtons = document.querySelectorAll(".example-button");
const EMPTY_VALUE = "\u2014";

function appendMessage(role, text) {
  const message = document.createElement("div");
  message.className = `message ${role === "user" ? "user-message" : "assistant-message"}`;

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "You" : "Riverside Books";

  const body = document.createElement("p");
  body.textContent = role === "assistant" ? stripAssistantPrefix(text) : text;

  message.append(label, body);
  messageLog.append(message);
  messageLog.scrollTop = messageLog.scrollHeight;
}

function formatStatus(status) {
  if (status === "checking") {
    return "Checking official FAQs...";
  }

  if (status === "success") {
    return "Success";
  }

  if (status === "no_match") {
    return "No match";
  }

  if (status === "technical_error") {
    return "Technical issue";
  }

  return "Idle";
}

function setStatusBadge(status) {
  statusBadge.className = "status-badge";
  statusBadge.classList.add(
    status === "success"
      ? "status-success"
      : status === "no_match"
        ? "status-no-match"
        : status === "technical_error"
          ? "status-technical-error"
          : status === "checking"
            ? "status-checking"
            : "status-idle",
  );
  statusBadge.textContent = formatStatus(status);
}

function stripAssistantPrefix(text) {
  const prefix = "Riverside Books: ";
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
}

function renderDetails(data) {
  setStatusBadge(data.status);
  faqIdValue.textContent = data.faqId === null ? EMPTY_VALUE : `FAQ ${data.faqId}`;
  confidenceValue.textContent =
    typeof data.confidence === "number" ? data.confidence.toFixed(2) : EMPTY_VALUE;
  modelValue.textContent = data.model || EMPTY_VALUE;
  sourceValue.textContent = data.source && data.source !== "None" ? data.source : EMPTY_VALUE;
  responseTimeValue.textContent =
    typeof data.elapsedMs === "number" ? `${data.elapsedMs} ms` : EMPTY_VALUE;
  reasonText.textContent = data.reason || "No routing reason returned.";

  if (data.status === "success") {
    faqCardTitle.textContent = `FAQ ${data.faqId}: ${data.faqQuestion}`;
    faqCardBody.textContent = data.faqAnswer;
    return;
  }

  if (data.status === "no_match") {
    faqCardTitle.textContent = "No FAQ matched";
    faqCardBody.textContent =
      "The router did not find a confident official FAQ answer for this question.";
    return;
  }

  faqCardTitle.textContent = "Technical/setup issue";
  faqCardBody.textContent =
    "The server could not complete FAQ routing. Check local setup and try again.";
}

function setLoading(isLoading) {
  sendButton.disabled = isLoading;
  input.disabled = isLoading;
  sendButton.textContent = isLoading ? "Checking..." : "Send";

  if (isLoading) {
    setStatusBadge("checking");
    reasonText.textContent = "Checking official FAQs...";
    responseTimeValue.textContent = EMPTY_VALUE;
  }
}

function renderNetworkError() {
  const fallback = {
    status: "technical_error",
    answer:
      "Sorry, I'm having trouble checking the FAQs right now. Please try again in a moment or ask a member of staff.",
    faqId: null,
    faqQuestion: null,
    faqAnswer: null,
    confidence: null,
    reason: "network or server error",
    model: "",
    source: "None",
    elapsedMs: null,
  };

  appendMessage("assistant", fallback.answer);
  renderDetails(fallback);
}

async function askQuestion(question) {
  appendMessage("user", question);
  setLoading(true);

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const data = await response.json();
    appendMessage("assistant", data.answer);
    renderDetails(data);
  } catch {
    renderNetworkError();
  } finally {
    setLoading(false);
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = input.value.trim();

  if (!question) {
    input.focus();
    return;
  }

  input.value = "";
  void askQuestion(question);
});

exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.textContent.trim();
    input.focus();
  });
});
