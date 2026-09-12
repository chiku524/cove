export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const script = `(() => {
  const current = document.currentScript;
  const apiKey = current?.dataset.apiKey || "";
  const baseUrl = current?.dataset.baseUrl || ${JSON.stringify(origin)};
  const position = current?.dataset.position === "left" ? "left" : "right";
  if (!apiKey) {
    console.warn("[Cove] data-api-key is required on the embed script.");
    return;
  }

  const root = document.createElement("div");
  root.style.cssText = "all:initial;position:fixed;z-index:2147483000;bottom:20px;" + (position === "left" ? "left:20px;" : "right:20px;");
  const shadow = root.attachShadow({ mode: "open" });
  document.body.appendChild(root);

  const style = document.createElement("style");
  style.textContent = \`
    :host { all: initial; }
    * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, sans-serif; }
    .bubble { width: 56px; height: 56px; border: 0; border-radius: 999px; background: #c9843a; color: #1c140c; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,.28); font-size: 13px; font-weight: 650; }
    .panel { width: min(380px, calc(100vw - 32px)); height: 520px; background: #1b1712; color: #f4ecdf; border: 1px solid rgba(255,255,255,.08); border-radius: 18px; display: none; flex-direction: column; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.4); margin-bottom: 12px; }
    .panel.open { display: flex; }
    header { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.08); font: 600 14px/1.3 ui-sans-serif, system-ui; }
    .msgs { flex: 1; overflow: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .msg { max-width: 86%; padding: 9px 11px; border-radius: 12px; font-size: 13px; line-height: 1.45; white-space: pre-wrap; }
    .user { align-self: flex-end; background: #c9843a; color: #1c140c; }
    .bot { align-self: flex-start; background: rgba(255,255,255,.06); }
    form { display: flex; gap: 8px; padding: 12px; border-top: 1px solid rgba(255,255,255,.08); }
    input { flex: 1; border: 1px solid rgba(255,255,255,.1); background: #12100c; color: #f4ecdf; border-radius: 10px; padding: 10px 12px; font-size: 13px; }
    button.send { border: 0; border-radius: 10px; background: #c9843a; color: #1c140c; font-weight: 650; padding: 0 12px; cursor: pointer; }
    .err { color: #e8b4b4; font-size: 12px; padding: 0 14px 10px; }
  \`;
  shadow.appendChild(style);

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = '<header>Support</header><div class="msgs"></div><div class="err"></div><form><input placeholder="Ask a question" /><button class="send" type="submit">Send</button></form>';
  const bubble = document.createElement("button");
  bubble.className = "bubble";
  bubble.textContent = "Ask";
  shadow.append(panel, bubble);

  const msgs = panel.querySelector(".msgs");
  const err = panel.querySelector(".err");
  const form = panel.querySelector("form");
  const input = panel.querySelector("input");
  let conversationId = "";
  let open = false;

  function add(role, text) {
    const el = document.createElement("div");
    el.className = "msg " + (role === "user" ? "user" : "bot");
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  bubble.addEventListener("click", async () => {
    open = !open;
    panel.classList.toggle("open", open);
    if (open && msgs.childElementCount === 0) {
      try {
        const res = await fetch(baseUrl + "/api/v1/demo");
        const data = await res.json();
        add("bot", data.bot?.welcomeMessage || "How can I help?");
      } catch {
        add("bot", "How can I help?");
      }
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    add("user", message);
    err.textContent = "";
    try {
      const res = await fetch(baseUrl + "/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chat failed");
      conversationId = data.conversationId || conversationId;
      add("bot", data.reply);
    } catch (error) {
      err.textContent = error.message || "Could not reach Cove.";
    }
  });
})();`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
