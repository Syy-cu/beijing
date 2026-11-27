(() => {
    const STORAGE_KEY = "st_bg_filter_settings_v1";
    const STYLE_ID = "st-bg-filter-dynamic-style";
    const BOX_ID = "st-bg-filter-box";

    const defaultSettings = {
        enabled: true,
        brightness: 100, // 0 ~ 150 (%)，调低即变暗
        blur: 0          // 0 ~ 25 (px)
    };

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...defaultSettings };
            const parsed = JSON.parse(raw);
            return {
                enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : true,
                brightness: typeof parsed.brightness === "number" ? parsed.brightness : 100,
                blur: typeof parsed.blur === "number" ? parsed.blur : 0
            };
        } catch (e) {
            return { ...defaultSettings };
        }
    }

    function saveSettings(s) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        } catch (e) {}
    }

    let settings = loadSettings();

    /* =========================================
       实时应用亮度与模糊度到酒馆背景层
       ========================================= */
    function applyBackgroundFilter() {
        let styleEl = document.getElementById(STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = STYLE_ID;
            (document.head || document.documentElement).appendChild(styleEl);
        }

        if (!settings.enabled) {
            styleEl.textContent = "";
            return;
        }

        const b = Math.max(0, Math.min(150, Number(settings.brightness)));
        const blur = Math.max(0, Math.min(25, Number(settings.blur)));
        // 模糊时轻微放大背景，防止屏幕四周出现发白/黑边
        const scale = blur > 0 ? (1 + blur * 0.004).toFixed(3) : "1";

        styleEl.textContent = `
            #bg1, #bg_custom, #bg_layer {
                filter: brightness(${b}%) blur(${blur}px) !important;
                -webkit-filter: brightness(${b}%) blur(${blur}px) !important;
                transform: scale(${scale}) !important;
                transition: filter 0.12s ease, transform 0.12s ease !important;
            }
        `;
    }

    /* =========================================
       将控制面板注入到上方导航栏的 #Backgrounds 中
       ========================================= */
    function injectControlBox() {
        const bgPanel = document.querySelector("#Backgrounds");
        if (!bgPanel) return false;
        if (document.getElementById(BOX_ID)) return true;

        const box = document.createElement("div");
        box.id = BOX_ID;
        box.innerHTML = `
            <div class="st-bgf-header">
                <span class="st-bgf-title">背景图亮度与模糊</span>
                <div class="st-bgf-actions">
                    <button type="button" id="st-bgf-toggle" class="st-bgf-btn ${settings.enabled ? "st-bgf-on" : ""}">
                        ${settings.enabled ? "已开启" : "已关闭"}
                    </button>
                    <button type="button" id="st-bgf-reset" class="st-bgf-btn">重置</button>
                </div>
            </div>
            <div class="st-bgf-row">
                <div class="st-bgf-label-line">
                    <span>亮度（向左调暗）</span>
                    <span id="st-bgf-brightness-val" class="st-bgf-val">${settings.brightness}%</span>
                </div>
                <input type="range" id="st-bgf-brightness" class="st-bgf-slider" min="0" max="150" step="1" value="${settings.brightness}" />
            </div>
            <div class="st-bgf-row">
                <div class="st-bgf-label-line">
                    <span>模糊度</span>
                    <span id="st-bgf-blur-val" class="st-bgf-val">${settings.blur}px</span>
                </div>
                <input type="range" id="st-bgf-blur" class="st-bgf-slider" min="0" max="25" step="0.5" value="${settings.blur}" />
            </div>
        `;

        // 插入到 #Backgrounds 面板最顶部，打开背景菜单第一眼就能看到
        bgPanel.insertBefore(box, bgPanel.firstChild);

        const toggleBtn = document.getElementById("st-bgf-toggle");
        const resetBtn = document.getElementById("st-bgf-reset");
        const brightnessInput = document.getElementById("st-bgf-brightness");
        const brightnessVal = document.getElementById("st-bgf-brightness-val");
        const blurInput = document.getElementById("st-bgf-blur");
        const blurVal = document.getElementById("st-bgf-blur-val");

        function updateUI() {
            toggleBtn.textContent = settings.enabled ? "已开启" : "已关闭";
            toggleBtn.classList.toggle("st-bgf-on", settings.enabled);
            brightnessInput.value = settings.brightness;
            brightnessVal.textContent = `${settings.brightness}%`;
            blurInput.value = settings.blur;
            blurVal.textContent = `${settings.blur}px`;
        }

        toggleBtn.addEventListener("click", () => {
            settings.enabled = !settings.enabled;
            saveSettings(settings);
            applyBackgroundFilter();
            updateUI();
        });

        resetBtn.addEventListener("click", () => {
            settings = { ...defaultSettings };
            saveSettings(settings);
            applyBackgroundFilter();
            updateUI();
        });

        brightnessInput.addEventListener("input", (e) => {
            settings.brightness = Number(e.target.value);
            if (!settings.enabled) settings.enabled = true;
            saveSettings(settings);
            applyBackgroundFilter();
            updateUI();
        });

        blurInput.addEventListener("input", (e) => {
            settings.blur = Number(e.target.value);
            if (!settings.enabled) settings.enabled = true;
            saveSettings(settings);
            applyBackgroundFilter();
            updateUI();
        });

        return true;
    }

    function start() {
        applyBackgroundFilter();
        injectControlBox();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

    window.addEventListener("load", start);

    let retries = 0;
    const timer = setInterval(() => {
        retries++;
        applyBackgroundFilter();
        if (injectControlBox() || retries >= 15) {
            clearInterval(timer);
        }
    }, 600);
})();
