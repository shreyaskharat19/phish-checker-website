document.addEventListener("DOMContentLoaded", () => {
  const inputScreen = document.getElementById("inputScreen");
  const resultScreen = document.getElementById("resultScreen");
  const checkBtn = document.getElementById("checkBtn");
  const backBtn = document.getElementById("backBtn");
  const urlInput = document.getElementById("urlInput");
  const resultTitle = document.getElementById("resultTitle");
  const resultText = document.getElementById("resultText");
  const confidenceBar = document.getElementById("confidenceBar");
  const confidenceWrapper = document.getElementById("confidenceWrapper");
  const padlock = document.getElementById("padlock");
  const spinner = document.getElementById("spinner");
  const loader = document.getElementById("loader");
  const beepAudio = document.getElementById("alertSound");

  const switchToScreen = (from, to) => {
    from.classList.remove("active");
    from.classList.add("hidden-left");
    to.classList.remove("hidden-left");
    to.classList.add("active");
  };

  const simulateTyping = (element, text) => {
    element.textContent = "";
    let i = 0;
    const interval = setInterval(() => {
      element.textContent += text[i++];
      if (i >= text.length) clearInterval(interval);
    }, 10);
  };

  const playBeep = (times = 1) => {
    let count = 0;
    const interval = setInterval(() => {
      beepAudio.currentTime = 0;
      beepAudio.play();
      count++;
      if (count >= times) clearInterval(interval);
    }, 500);
  };

  checkBtn.addEventListener("click", async () => {
    const input = urlInput.value.trim();
    if (!input) return alert("❌ Please enter a URL!");

    // Reset UI
    resultText.textContent = "";
    resultTitle.textContent = "🧠 Analyzing...";
    loader.style.display = "block";
    confidenceWrapper.style.display = "none";
    confidenceBar.style.width = "0%";
    padlock.style.display = "none";

    switchToScreen(inputScreen, resultScreen);

    const prompt = `Please check if the following content includes an official website link or description, and determine whether it belongs to a well-known company's main or subdomain. If not, indicate whether it poses any phishing or advertising risks.\n\nContent: ${input}`;

    try {
      const response = await fetch("http://localhost:5005/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const raw = await response.text();
      let reply = raw;

      try {
        const json = JSON.parse(raw);
        reply = json.error || json.choices?.[0]?.message?.content || "No response content.";
      } catch (e) {
        reply = raw;
      }

      loader.style.display = "none";
      resultTitle.textContent = "📊 Scan Result";
      simulateTyping(resultText, reply);

      const confidence = reply.includes("official") || reply.includes("legit") ? 90 :
                         reply.includes("phishing") ? 30 : 60;

      confidenceBar.style.width = `${confidence}%`;
      confidenceWrapper.style.display = "block";

      if (confidence >= 80 && reply.toLowerCase().includes("safe")) {
        padlock.style.display = "block";
        padlock.textContent = "🔒 Site is safe";
      } else {
        padlock.style.display = "block";
        padlock.textContent = "⚠️ Possibly suspicious";
        playBeep(1); // 🔊 Beep 5 times if phishing detected
      }

    } catch (err) {
      console.error("❌ Request failed:", err);
      loader.style.display = "none";
      resultText.textContent = "❌ Detection failed. Check backend.";
    }
  });

  backBtn.addEventListener("click", () => {
    resultScreen.classList.remove("active");
    resultScreen.classList.remove("hidden-left");
    inputScreen.classList.remove("hidden-left");
    inputScreen.classList.add("active");
  });

  // 🎤 Microphone Input
  const micBtn = document.createElement('button');
  micBtn.textContent = '🎤';
  micBtn.className = 'mic-btn';
  document.getElementById('inputScreen').insertBefore(micBtn, urlInput);

  micBtn.addEventListener('click', () => {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = e => {
      urlInput.value = e.results[0][0].transcript;
    };
    recognition.start();
  });

  // Autofill current tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0]?.url || "";
    if (currentUrl.startsWith("http")) urlInput.value = currentUrl;
  });
});
