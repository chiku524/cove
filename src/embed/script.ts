export function buildEmbedScript(origin: string) {
  return `(function () {
  var current = document.currentScript;
  if (!current) return;
  var apiKey = current.getAttribute("data-api-key") || "";
  var baseUrl = (current.getAttribute("data-base-url") || ${JSON.stringify(origin)}).replace(/\\/$/, "");
  var position = current.getAttribute("data-position") === "left" ? "left" : "right";
  var titleOverride = current.getAttribute("data-title") || "";
  var accent = current.getAttribute("data-accent") || "#c9843a";
  if (!apiKey) {
    console.warn("[Cove] data-api-key is required on the embed script.");
    return;
  }

  var root = document.createElement("div");
  var shadow = root.attachShadow({ mode: "open" });
  document.body.appendChild(root);

  var style = document.createElement("style");
  style.textContent = [
    ":host { all: initial; }",
    "* { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }",
    ".wrap { display: flex; flex-direction: column; align-items: " + (position === "left" ? "flex-start" : "flex-end") + "; }",
    ".bubble { width: 56px; height: 56px; border: 0; border-radius: 999px; background: var(--cove-accent); color: #1c140c; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,.28); font-size: 13px; font-weight: 650; }",
    ".bubble:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }",
    ".panel { width: min(380px, calc(100vw - 32px)); height: min(560px, calc(100vh - 96px)); background: #1b1712; color: #f4ecdf; border: 1px solid rgba(255,255,255,.08); border-radius: 18px; display: none; flex-direction: column; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.4); margin-bottom: 12px; }",
    ".panel.open { display: flex; }",
    "header { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,.08); }",
    "header .meta { min-width: 0; }",
    "header .name { font: 600 14px/1.3 ui-sans-serif, system-ui; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    "header .sub { color: rgba(244,236,223,.62); font-size: 11px; margin-top: 2px; }",
    "header .actions { display: flex; gap: 6px; flex-shrink: 0; }",
    "header button { border: 0; background: transparent; color: rgba(244,236,223,.8); cursor: pointer; font-size: 12px; padding: 6px 8px; border-radius: 8px; }",
    "header button:hover { background: rgba(255,255,255,.06); }",
    ".msgs { flex: 1; overflow: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; -webkit-overflow-scrolling: touch; }",
    ".msg { max-width: 86%; padding: 9px 11px; border-radius: 12px; font-size: 13px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }",
    ".user { align-self: flex-end; background: var(--cove-accent); color: #1c140c; }",
    ".bot { align-self: flex-start; background: rgba(255,255,255,.06); }",
    ".bot.handoff { border: 1px solid rgba(232,180,180,.35); background: rgba(232,180,180,.08); }",
    ".cites { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }",
    ".cite { font-size: 10px; line-height: 1.2; padding: 3px 6px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); color: rgba(244,236,223,.78); }",
    ".chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 2px; }",
    ".chip { border: 1px solid rgba(255,255,255,.12); background: transparent; color: #f4ecdf; border-radius: 999px; padding: 6px 10px; font-size: 12px; cursor: pointer; text-align: left; }",
    ".chip:hover { background: rgba(255,255,255,.06); }",
    ".typing { align-self: flex-start; color: rgba(244,236,223,.62); font-size: 12px; display: flex; align-items: center; gap: 8px; padding: 0 2px; }",
    ".dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; animation: cove-pulse 1s infinite; }",
    ".dot:nth-child(2) { animation-delay: .15s; }",
    ".dot:nth-child(3) { animation-delay: .3s; }",
    "@keyframes cove-pulse { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }",
    ".err { color: #e8b4b4; font-size: 12px; padding: 0 14px 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }",
    ".err button { border: 1px solid rgba(232,180,180,.4); background: transparent; color: #e8b4b4; border-radius: 8px; padding: 4px 8px; cursor: pointer; }",
    "form { display: flex; gap: 8px; padding: 12px; padding-bottom: calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid rgba(255,255,255,.08); }",
    "input { flex: 1; min-width: 0; border: 1px solid rgba(255,255,255,.1); background: #12100c; color: #f4ecdf; border-radius: 10px; padding: 10px 12px; font-size: 16px; }",
    "input:disabled { opacity: .6; }",
    "button.send { border: 0; border-radius: 10px; background: var(--cove-accent); color: #1c140c; font-weight: 650; padding: 0 14px; min-height: 44px; cursor: pointer; }",
    "button.send:disabled { opacity: .5; cursor: default; }",
    "@media (max-width: 520px) {",
    "  .panel.open { width: auto; height: auto; position: fixed; inset: 12px; margin: 0; max-height: none; border-radius: 16px; }",
    "}",
    "@media (prefers-reduced-motion: reduce) { .dot { animation: none; opacity: .6; } }",
  ].join("\\n");
  shadow.appendChild(style);

  var wrap = document.createElement("div");
  wrap.className = "wrap";
  wrap.style.setProperty("--cove-accent", accent);

  var panel = document.createElement("div");
  panel.className = "panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Support chat");
  panel.innerHTML =
    '<header><div class="meta"><div class="name">Support</div><div class="sub">Answers from the docs</div></div><div class="actions"><button type="button" class="reset" hidden>New</button><button type="button" class="close" aria-label="Close chat">Close</button></div></header>' +
    '<div class="msgs" aria-live="polite"></div>' +
    '<div class="chips"></div>' +
    '<div class="err" hidden></div>' +
    '<form><input placeholder="Ask a question" aria-label="Message" autocomplete="off" /><button class="send" type="submit">Send</button></form>';

  var bubble = document.createElement("button");
  bubble.className = "bubble";
  bubble.type = "button";
  bubble.textContent = "Ask";
  bubble.setAttribute("aria-expanded", "false");
  bubble.setAttribute("aria-label", "Open support chat");

  wrap.append(panel, bubble);
  shadow.appendChild(wrap);

  var nameEl = panel.querySelector(".name");
  var resetBtn = panel.querySelector(".reset");
  var closeBtn = panel.querySelector(".close");
  var msgs = panel.querySelector(".msgs");
  var chips = panel.querySelector(".chips");
  var err = panel.querySelector(".err");
  var form = panel.querySelector("form");
  var input = panel.querySelector("input");
  var sendBtn = panel.querySelector(".send");

  var conversationId = "";
  var open = false;
  var pending = false;
  var lastFailed = "";
  var welcome = "How can I help?";
  var botName = titleOverride || "Support";
  var starterChips = [];

  function setName(value) {
    botName = value || botName;
    nameEl.textContent = botName;
    panel.setAttribute("aria-label", botName + " chat");
  }

  function placeRoot() {
    var mobile = window.matchMedia("(max-width: 520px)").matches;
    if (open && mobile) {
      root.style.cssText = "all:initial;position:fixed;z-index:2147483000;inset:0;";
    } else {
      root.style.cssText =
        "all:initial;position:fixed;z-index:2147483000;bottom:max(20px, env(safe-area-inset-bottom));" +
        (position === "left" ? "left:20px;" : "right:20px;");
    }
  }

  function add(role, text, extras) {
    extras = extras || {};
    var el = document.createElement("div");
    el.className = "msg " + (role === "user" ? "user" : extras.handoff ? "bot handoff" : "bot");
    el.textContent = text;
    if (extras.citations && extras.citations.length) {
      var row = document.createElement("div");
      row.className = "cites";
      extras.citations.forEach(function (citation) {
        var badge = document.createElement("span");
        badge.className = "cite";
        badge.textContent = citation.title;
        row.appendChild(badge);
      });
      el.appendChild(row);
    }
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showChips(items) {
    chips.innerHTML = "";
    if (!items || !items.length || pending) return;
    items.forEach(function (label) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = label;
      chip.addEventListener("click", function () {
        send(label);
      });
      chips.appendChild(chip);
    });
  }

  function setError(message) {
    err.hidden = !message;
    err.innerHTML = "";
    if (!message) return;
    var text = document.createElement("span");
    text.textContent = message;
    err.appendChild(text);
    if (lastFailed) {
      var retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "Retry";
      retry.addEventListener("click", function () {
        send(lastFailed);
      });
      err.appendChild(retry);
    }
  }

  function setPending(next) {
    pending = next;
    input.disabled = next;
    sendBtn.disabled = next || !input.value.trim();
    var existing = msgs.querySelector(".typing");
    if (existing) existing.remove();
    if (next) {
      var typing = document.createElement("div");
      typing.className = "typing";
      typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span>Searching the docs</span>';
      msgs.appendChild(typing);
      msgs.scrollTop = msgs.scrollHeight;
      chips.innerHTML = "";
    }
  }

  function resetChat() {
    conversationId = "";
    lastFailed = "";
    msgs.innerHTML = "";
    add("bot", welcome);
    showChips(starterChips);
    setError("");
    resetBtn.hidden = true;
    input.focus();
  }

  function setOpen(next) {
    open = next;
    panel.classList.toggle("open", open);
    bubble.setAttribute("aria-expanded", open ? "true" : "false");
    bubble.hidden = open && window.matchMedia("(max-width: 520px)").matches;
    placeRoot();
    if (open && msgs.childElementCount === 0) {
      add("bot", welcome);
      showChips(starterChips);
    }
    if (open) input.focus();
  }

  async function loadWidget() {
    try {
      var res = await fetch(baseUrl + "/api/v1/widget", {
        headers: { Authorization: "Bearer " + apiKey },
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.message || "Widget failed");
      if (data.bot && data.bot.welcomeMessage) welcome = data.bot.welcomeMessage;
      if (data.bot && data.bot.suggestions) starterChips = data.bot.suggestions;
      setName(titleOverride || (data.bot && data.bot.name) || botName);
      if (open && !conversationId && msgs.querySelectorAll(".user").length === 0) {
        msgs.innerHTML = "";
        add("bot", welcome);
        showChips(starterChips);
      }
    } catch (_error) {
      setName(titleOverride || botName);
    }
  }

  async function send(message) {
    message = (message || "").trim();
    if (!message || pending) return;
    lastFailed = message;
    input.value = "";
    sendBtn.disabled = true;
    add("user", message);
    setError("");
    resetBtn.hidden = false;
    setPending(true);
    try {
      var res = await fetch(baseUrl + "/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify({ message: message, conversationId: conversationId || undefined }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chat failed");
      conversationId = data.conversationId || conversationId;
      lastFailed = "";
      add("bot", data.reply, { citations: data.citations, handoff: data.handoff });
      showChips(data.suggestions || []);
    } catch (error) {
      setError((error && error.message) || "Could not reach Cove.");
    } finally {
      setPending(false);
      input.focus();
    }
  }

  bubble.addEventListener("click", function () {
    setOpen(!open);
  });
  closeBtn.addEventListener("click", function () {
    setOpen(false);
  });
  resetBtn.addEventListener("click", resetChat);
  input.addEventListener("input", function () {
    sendBtn.disabled = pending || !input.value.trim();
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    send(input.value);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && open) setOpen(false);
  });
  window.addEventListener("resize", function () {
    if (open) {
      bubble.hidden = window.matchMedia("(max-width: 520px)").matches;
      placeRoot();
    }
  });

  setName(botName);
  placeRoot();
  sendBtn.disabled = true;
  loadWidget();
})();`;
}
