 
const MAX_CHARS = 3000;

        function updateCount() {
            const v   = document.getElementById("dialogue-input").value;
            const len = v.length;
            const pct = Math.min((len / MAX_CHARS) * 100, 100);
            const fill  = document.getElementById("char-bar-fill");
            const label = document.getElementById("char-count-label");
            fill.style.width = pct + "%";
            const warn = len > MAX_CHARS * 0.9;
            fill.classList.toggle("warn", warn);
            label.textContent = len.toLocaleString() + " chars";
            label.classList.toggle("warn", warn);
        }

        function clearInput() {
            document.getElementById("dialogue-input").value = "";
            updateCount();
            showToast("✓ Cleared", "success");
        }

        async function pasteInput() {
            try {
                const t = await navigator.clipboard.readText();
                document.getElementById("dialogue-input").value = t;
                updateCount();
                showToast("✓ Pasted from clipboard", "success");
            } catch {
                showToast("⚠ Paste failed — use Ctrl+V", "error");
            }
        }

        function loadSample() {
            document.getElementById("dialogue-input").value =
                "Artificial intelligence (AI) is rapidly transforming industries across the globe. From healthcare to finance, AI-powered tools are helping professionals make faster and more accurate decisions. Machine learning models trained on large datasets can identify patterns that humans might miss, enabling early diagnosis of diseases, fraud detection in banking, and personalised recommendations in e-commerce. However, the rise of AI also brings challenges such as data privacy concerns, algorithmic bias, and the potential displacement of certain jobs. Experts argue that the key to a positive AI future lies in responsible development, transparent governance, and continuous education so that society can adapt to the changes AI brings.";
            updateCount();
            showToast("✓ Sample loaded", "success");
        }

        function setLoading(loading) {
            document.getElementById("btn-spinner").style.display = loading ? "block" : "none";
            document.getElementById("btn-label").textContent = loading ? "Summarizing…" : "✦ Summarize";
        }

        function countWords(str) {
            return str.trim().split(/\s+/).filter(Boolean).length;
        }

        function showSummary(text) {
            document.getElementById("placeholder").style.display = "none";
            const st = document.getElementById("summary-text");
            st.style.display = "block";
            st.innerText = text;
        }

        function showStats(origText, summaryText) {
            const origW = countWords(origText);
            const sumW  = countWords(summaryText);
            const ratio = origW > 0 ? Math.round((1 - sumW / origW) * 100) : 0;
            document.getElementById("ws-orig").textContent  = origW + " words";
            document.getElementById("ws-sum").textContent   = sumW  + " words";
            document.getElementById("ws-ratio").textContent = ratio + "% smaller";
            document.getElementById("word-strip").classList.add("show");
        }

        function copyText() {
            const t = document.getElementById("summary-text").innerText;
            if (!t || t === "Processing...") return;
            navigator.clipboard.writeText(t)
                .then(() => showToast("✓ Copied to clipboard", "success"))
                .catch(()  => showToast("⚠ Copy failed", "error"));
        }

        function downloadText() {
            const t = document.getElementById("summary-text").innerText;
            if (!t || t === "Processing...") return;
            const blob = new Blob([t], { type: "text/plain" });
            const url  = URL.createObjectURL(blob);
            const a    = Object.assign(document.createElement("a"), { href: url, download: "summary.txt" });
            a.click();
            URL.revokeObjectURL(url);
            showToast("✓ Saved as summary.txt", "success");
        }

        let toastTimer;
        function showToast(msg, type = "") {
            const el = document.getElementById("toast");
            el.textContent = msg;
            el.className = "toast show " + type;
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
        }

        document.getElementById("summarization-form").addEventListener("submit", async (e) => {
            e.preventDefault();

            const dialogueInput = document.getElementById("dialogue-input");
            const summaryText   = document.getElementById("summary-text");
            const submitButton  = e.target.querySelector("button[type='submit']");

            const dialogue = dialogueInput.value.trim();
            if (!dialogue) return;

            summaryText.innerText = "Processing...";
            showSummary("Processing...");
            submitButton.disabled = true;
            setLoading(true);

            try {
                const response = await fetch("/summarize/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dialogue }),
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                summaryText.innerText = data.summary || "No summary returned.";
                showSummary(data.summary || "No summary returned.");
                showStats(dialogue, data.summary || "");
            } catch (err) {

                summaryText.innerText = `Error: ${err.message}`;
                showSummary(`Error: ${err.message}`);
            } finally {

                submitButton.disabled = false;
                setLoading(false);
            }
        });
   

