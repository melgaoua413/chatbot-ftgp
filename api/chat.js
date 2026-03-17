<!-- Start of HubSpot Embed Code -->
<script type="text/javascript" id="hs-script-loader" async defer src="//js-eu1.hs-scripts.com/139613055.js"></script>
<!-- End of HubSpot Embed Code -->
<!-- Chatbot French Tech Grand Paris -->
<script>
(function() {
  var VERCEL_URL = "https://chatbot-ftgp.vercel.app";

  var style = document.createElement("style");
  style.textContent = "#ftgp-chat-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#0045B3;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,69,179,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;}#ftgp-chat-box{position:fixed;bottom:90px;right:24px;width:370px;height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(22,11,71,0.18);z-index:9998;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}#ftgp-chat-header{background:#0045B3;color:#fff;padding:16px 18px;font-weight:700;font-size:15px;letter-spacing:0.01em;}#ftgp-chat-header span{display:block;font-size:11px;font-weight:400;opacity:0.8;margin-top:2px;}#ftgp-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f8f9fc;}.ftgp-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.6;word-break:break-word;}.ftgp-msg.bot{background:#fff;color:#160B47;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.08);}.ftgp-msg.user{background:#0045B3;color:#fff;align-self:flex-end;border-bottom-right-radius:4px;}.ftgp-msg a{color:#0045B3;text-decoration:underline;font-weight:600;}.ftgp-msg.user a{color:#fff;}.ftgp-msg b,.ftgp-msg strong{font-weight:700;}.ftgp-msg i,.ftgp-msg em{font-style:italic;}.ftgp-msg ul{margin:6px 0 6px 16px;padding:0;}.ftgp-msg li{margin-bottom:3px;}#ftgp-chat-input{display:flex;padding:12px;border-top:1px solid #e8eaf0;gap:8px;background:#fff;}#ftgp-chat-input input{flex:1;border:1px solid #ddd;border-radius:10px;padding:9px 13px;font-size:14px;outline:none;background:#f8f9fc;}#ftgp-chat-input input:focus{border-color:#0045B3;background:#fff;}#ftgp-chat-input button{background:#0045B3;color:#fff;border:none;border-radius:10px;padding:9px 16px;cursor:pointer;font-size:14px;font-weight:600;transition:background 0.2s;}#ftgp-chat-input button:hover{background:#003494;}.ftgp-typing{display:flex;gap:4px;align-items:center;padding:10px 14px;}.ftgp-typing span{width:7px;height:7px;background:#0045B3;border-radius:50%;animation:ftgp-bounce 1.2s infinite;opacity:0.6;}.ftgp-typing span:nth-child(2){animation-delay:0.2s;}.ftgp-typing span:nth-child(3){animation-delay:0.4s;}@keyframes ftgp-bounce{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-6px);}}";
  document.head.appendChild(style);

  var html = '<button id="ftgp-chat-btn" title="Assistant FTGP"><svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button><div id="ftgp-chat-box"><div id="ftgp-chat-header">Assistant French Tech Grand Paris<span>Posez vos questions sur nos programmes</span></div><div id="ftgp-chat-messages"><div class="ftgp-msg bot">👋 Bonjour ! Je suis l\'assistant de la <strong>French Tech Grand Paris</strong>.<br>Comment puis-je t\'aider ?</div></div><div id="ftgp-chat-input"><input type="text" id="ftgp-input" placeholder="Pose ta question..." /><button id="ftgp-send">Envoyer</button></div></div>';
  document.body.insertAdjacentHTML("beforeend", html);

  var btn = document.getElementById("ftgp-chat-btn");
  var box = document.getElementById("ftgp-chat-box");
  var input = document.getElementById("ftgp-input");
  var send = document.getElementById("ftgp-send");
  var messages = document.getElementById("ftgp-chat-messages");
  var history = [];
  var sessionId = "session-" + Date.now();

  btn.onclick = function() {
    box.style.display = box.style.display === "flex" ? "none" : "flex";
    if (box.style.display === "flex") input.focus();
  };

  // Parser Markdown → HTML (gras, italique, liens cliquables, listes)
  function parseMarkdown(text) {
    return text
      // Liens gras+italique : ***[texte](url)***
      .replace(/\*\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\*/g, '<a href="$2" target="_blank" rel="noopener"><strong><em>$1</em></strong></a>')
      // Liens gras : **[texte](url)**
      .replace(/\*\*\[([^\]]+)\]\(([^)]+)\)\*\*/g, '<a href="$2" target="_blank" rel="noopener"><strong>$1</strong></a>')
      // Liens simples : [texte](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Gras+italique : ***texte***
      .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
      // Gras : **texte**
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // Italique : *texte*
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      // Listes à puces : • ou -
      .replace(/^[•\-]\s+(.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      // Sauts de ligne
      .replace(/\n/g, "<br>");
  }

  function addMsg(text, role) {
    var div = document.createElement("div");
    div.className = "ftgp-msg " + role;
    if (role === "bot") {
      div.innerHTML = parseMarkdown(text);
    } else {
      div.textContent = text;
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function addTyping() {
    var div = document.createElement("div");
    div.className = "ftgp-msg bot ftgp-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    div.id = "ftgp-typing";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    var t = document.getElementById("ftgp-typing");
    if (t) t.remove();
  }

  function sendMsg() {
    var msg = input.value.trim();
    if (!msg) return;
    input.value = "";
    addMsg(msg, "user");
    history.push({ role: "user", content: msg });
    addTyping();
    send.disabled = true;

    fetch(VERCEL_URL + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, session_id: sessionId, history: history })
    }).then(function(res) {
      return res.json();
    }).then(function(data) {
      removeTyping();
      addMsg(data.reply, "bot");
      history.push({ role: "assistant", content: data.reply });
      send.disabled = false;
    }).catch(function() {
      removeTyping();
      addMsg("Oups, problème de connexion. Réessaie ou contacte-nous : contact@frenchtechgrandparis.com", "bot");
      send.disabled = false;
    });
  }

  send.onclick = sendMsg;
  input.addEventListener("keydown", function(e) { if (e.key === "Enter") sendMsg(); });
})();
</script>
