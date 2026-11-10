(() => {
  "use strict";

  function initClock() {
    const phone = document.querySelector(".lock-screen");
    const desktop = document.getElementById("desktop");

    if (!phone || !desktop || document.getElementById("clock-app")) return;

    const storageKey = "pickphone-clock-v1";

    const cities = [
      ["北京", "Asia/Shanghai"],
      ["首尔", "Asia/Seoul"],
      ["东京", "Asia/Tokyo"],
      ["香港", "Asia/Hong_Kong"],
      ["台北", "Asia/Taipei"],
      ["新加坡", "Asia/Singapore"],
      ["曼谷", "Asia/Bangkok"],
      ["迪拜", "Asia/Dubai"],
      ["伦敦", "Europe/London"],
      ["巴黎", "Europe/Paris"],
      ["柏林", "Europe/Berlin"],
      ["纽约", "America/New_York"],
      ["洛杉矶", "America/Los_Angeles"],
      ["悉尼", "Australia/Sydney"],
      ["奥克兰", "Pacific/Auckland"]
    ];

    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
    } catch {}

    let cityNames = Array.isArray(saved.cities)
      ? saved.cities.filter(name => cities.some(city => city[0] === name))
      : ["北京"];

    let alarms = Array.isArray(saved.alarms)
      ? saved.alarms.filter(a =>
          a && typeof a.id === "string" &&
          /^([01]\d|2[0-3]):[0-5]\d$/.test(a.time)
        ).map(a => ({
          id: a.id,
          time: a.time,
          label: String(a.label || "闹钟"),
          repeat: ["once", "daily", "weekdays", "weekends"].includes(a.repeat)
            ? a.repeat : "once",
          enabled: Boolean(a.enabled),
          lastFired: String(a.lastFired || "")
        }))
      : [
          {
            id: "alarm-9",
            time: "09:00",
            label: "闹钟",
            repeat: "once",
            enabled: false,
            lastFired: ""
          },
          {
            id: "alarm-11",
            time: "11:00",
            label: "闹钟",
            repeat: "once",
            enabled: false,
            lastFired: ""
          }
        ];

    function save() {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          cities: cityNames,
          alarms
        }));
      } catch {}
    }

    const icons = {
      world: `<circle cx="12" cy="12" r="10"/>
        <ellipse cx="12" cy="12" rx="4.5" ry="10"/>
        <path d="M2 12h20M4 6h16M4 18h16"/>`,
      alarm: `<circle cx="12" cy="13" r="8"/>
        <path d="M12 8v5H8M3 5l3-3M18 2l3 3M6 20l-2 2M18 20l2 2"/>`,
      stopwatch: `<circle cx="12" cy="14" r="8"/>
        <path d="M12 10v4M9 2h6M12 2v4M18 7l2-2"/>`,
      timer: `<path d="M12 3a9 9 0 1 1-8 5M12 3v5M3 3l5 5"/>
        <path d="m12 12-4-4"/>`
    };

    const app = document.createElement("section");
    app.id = "clock-app";
    app.hidden = true;
    app.setAttribute("aria-label", "时钟");

    app.innerHTML = `
      <header class="clock-toolbar">
        <button type="button" class="clock-pill" data-clock-edit>编辑</button>
        <button type="button" class="clock-pill clock-add"
          data-clock-add aria-label="添加">+</button>
      </header>

      <main class="clock-content"></main>

      <nav class="clock-nav" aria-label="时钟功能">
        ${[
          ["world", "世界时钟"],
          ["alarm", "闹钟"],
          ["stopwatch", "秒表"],
          ["timer", "计时器"]
        ].map(([id, label]) => `
          <button type="button" data-clock-tab="${id}"
            aria-selected="false">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              ${icons[id]}
            </svg>
            <span>${label}</span>
          </button>
        `).join("")}
      </nav>

      <button type="button" class="clock-home"
        aria-label="返回桌面"></button>

      <section class="clock-modal" role="dialog"
        aria-modal="true" aria-label="时钟设置" hidden></section>
    `;

    phone.appendChild(app);

    const content = app.querySelector(".clock-content");
    const modal = app.querySelector(".clock-modal");
    const editButton = app.querySelector("[data-clock-edit]");
    const addButton = app.querySelector("[data-clock-add]");

    let tab = "alarm";
    let editing = false;
    let opener = null;
    let modalReturnFocus = null;

    let audioContext = null;
    let ringInterval = null;
    let ringTimeout = null;
    let ringPanel = null;
    // 自定义铃声接口：把 src 改成自己的音频路径。
// 支持继续添加多个铃声。
const clockSounds = [
  {
    id: "beep",
    name: "默认提示音",
    src: ""
  },
  {
    id: "custom",
    name: "自定义铃声",
    src: "./assets/audio/clock-alarm.mp3"
  }
];

let selectedSound = "beep";
let ringtoneAudio = null;
let previewTimeout = null;

function soundOptions() {
  return clockSounds.map(sound => `
    <option value="${escapeHTML(sound.id)}"
      ${selectedSound === sound.id ? "selected" : ""}>
      ${escapeHTML(sound.name)}
    </option>
  `).join("");
}

function stopCustomSound() {
  clearTimeout(previewTimeout);

  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
    ringtoneAudio = null;
  }
}

function playCustomSound(preview = false) {
  stopCustomSound();

  const sound = clockSounds.find(item => item.id === selectedSound);
  if (!sound?.src) return false;

  const audio = new Audio(sound.src);
  ringtoneAudio = audio;
  audio.loop = !preview;
  audio.volume = 1;

  audio.play().catch(() => {
    // 音频不存在、格式不支持或播放被阻止时，回退提示音。
    if (ringtoneAudio !== audio) return;

    stopCustomSound();

    if (preview) {
      beep();
    } else if (ringPanel) {
      beep();

      if (!ringInterval) {
        ringInterval = setInterval(beep, 900);
      }
    }
  });

  if (preview) {
    previewTimeout = setTimeout(stopCustomSound, 5000);
  }

  return true;
}

    // 秒表使用单调时钟，避免系统时间变化影响计时。
    const stopwatch = {
      running: false,
      accumulated: 0,
      started: 0,
      laps: []
    };

    // 计时器使用结束时间，避免后台定时回调变慢造成累计误差。
    const timer = {
      running: false,
      end: 0,
      remaining: 0,
      duration: 0,
      label: "计时器"
    };

    const timerDraft = { hours: 0, minutes: 5, seconds: 0, label: "" };
    let recentTimers = [300, 600];

    const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

    const pad = value => String(value).padStart(2, "0");

    function unlockAudio() {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        audioContext ||= new Audio();
        audioContext.resume().catch(() => {});
      } catch {}
    }

    function beep() {
      if (!audioContext || audioContext.state !== "running") return;
      try {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;

        oscillator.type = "sine";
        oscillator.frequency.value = 880;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(.16, now + .02);
        gain.gain.exponentialRampToValueAtTime(.001, now + .45);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + .5);
      } catch {}
    }

    function stopRinging() {
      stopCustomSound();
      clearInterval(ringInterval);
      clearTimeout(ringTimeout);
      ringInterval = null;
      ringTimeout = null;
      ringPanel?.remove();
      ringPanel = null;
    }

    function ring(label) {
      stopRinging();

      ringPanel = document.createElement("section");
      ringPanel.className = "clock-ring";
      ringPanel.setAttribute("role", "alertdialog");
      ringPanel.setAttribute("aria-modal", "true");
      ringPanel.setAttribute("aria-label", label);

      const title = document.createElement("strong");
      title.textContent = label;

      const description = document.createElement("span");
      description.textContent = "时间到了";

      const stop = document.createElement("button");
      stop.type = "button";
      stop.textContent = "停止";
      stop.addEventListener("click", stopRinging);

      ringPanel.append(title, description, stop);
      phone.appendChild(ringPanel);
      stop.focus();

      if (!playCustomSound()) {
         beep();
         ringInterval = setInterval(beep, 900);
      }

      // 自动停止声音，提示界面保留到手动关闭。
     ringTimeout = setTimeout(() => {
       clearInterval(ringInterval);
       ringInterval = null;
       stopCustomSound();
     }, 60000);
    }

    function formatDuration(seconds) {
      const total = Math.max(0, Math.ceil(seconds));
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor(total / 60) % 60;
      const secs = total % 60;

      return hours
        ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
        : `${pad(minutes)}:${pad(secs)}`;
    }

    function elapsed() {
      return stopwatch.accumulated +
        (stopwatch.running ? performance.now() - stopwatch.started : 0);
    }

    function formatStopwatch(milliseconds) {
      const hundredths = Math.floor(milliseconds / 10);
      const minutes = Math.floor(hundredths / 6000);
      const seconds = Math.floor(hundredths / 100) % 60;
      return `${pad(minutes)}:${pad(seconds)}.${pad(hundredths % 100)}`;
    }

    function remaining() {
      return timer.running
        ? Math.max(0, timer.end - Date.now())
        : timer.remaining;
    }

    function closeModal() {
      modal.hidden = true;
      modal.replaceChildren();
      if (modalReturnFocus?.isConnected && !app.hidden) {
        modalReturnFocus.focus();
      }
    }

    function showModal(title, body) {
      modalReturnFocus = document.activeElement;

      modal.innerHTML = `
        <header class="clock-modal-header">
          <button type="button" data-modal-cancel>取消</button>
          <h2>${escapeHTML(title)}</h2>
          <span></span>
        </header>
        ${body}
      `;

      modal.hidden = false;
      modal.querySelector("[data-modal-cancel]")
        .addEventListener("click", closeModal);

      modal.querySelector("input, select, button")?.focus();
    }

    function render() {
      editButton.hidden = !["world", "alarm"].includes(tab);
      addButton.hidden = !["world", "alarm"].includes(tab);
      editButton.textContent = editing ? "完成" : "编辑";

      app.querySelectorAll("[data-clock-tab]").forEach(button => {
        button.setAttribute(
          "aria-selected",
          String(button.dataset.clockTab === tab)
        );
      });

      if (tab === "world") renderWorld();
      if (tab === "alarm") renderAlarms();
      if (tab === "stopwatch") renderStopwatch();
      if (tab === "timer") renderTimer();
    }

    function renderWorld() {
      content.innerHTML = `
        <h1>世界时钟</h1>
        <div>
          ${cityNames.map(name => `
            <div class="clock-row">
              ${editing ? `
                <button type="button" class="clock-delete"
                  data-delete-city="${escapeHTML(name)}"
                  aria-label="删除${escapeHTML(name)}">−</button>
              ` : ""}
              <div style="flex:1">
                <div class="clock-muted" data-city-difference="${escapeHTML(name)}"></div>
                <div class="clock-city-name">${escapeHTML(name)}</div>
              </div>
              <time class="clock-city-time"
                data-city-time="${escapeHTML(name)}"></time>
            </div>
          `).join("")}
        </div>
      `;

      updateWorld();
    }

    function updateWorld() {
      if (app.hidden || tab !== "world") return;

      const now = new Date();
      const localOffset = -now.getTimezoneOffset();

      for (const name of cityNames) {
        const zone = cities.find(city => city[0] === name)?.[1];
        if (!zone) continue;

        const timeNode = content.querySelector(`[data-city-time="${name}"]`);
        const differenceNode =
          content.querySelector(`[data-city-difference="${name}"]`);

        if (!timeNode || !differenceNode) continue;

        timeNode.textContent = new Intl.DateTimeFormat("en-GB", {
          timeZone: zone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23"
        }).format(now);

        const parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: zone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23"
        }).formatToParts(now);

        const get = type => Number(parts.find(p => p.type === type)?.value);
        const remoteUTC = Date.UTC(
          get("year"), get("month") - 1, get("day"),
          get("hour"), get("minute"), get("second")
        );

        const remoteOffset =
          Math.round((remoteUTC - Math.floor(now.getTime() / 1000) * 1000) / 60000);

        const difference = (remoteOffset - localOffset) / 60;

        const remoteDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit"
        }).format(now);

        const localDate = new Intl.DateTimeFormat("en-CA", {
          year: "numeric", month: "2-digit", day: "2-digit"
        }).format(now);

        const dayLabel = remoteDate === localDate
          ? "今天"
          : remoteUTC > Date.UTC(
              now.getFullYear(), now.getMonth(), now.getDate(),
              now.getHours(), now.getMinutes(), now.getSeconds()
            ) ? "明天" : "昨天";

        differenceNode.textContent =
          `${dayLabel} ${difference >= 0 ? "+" : ""}${difference}小时`;
      }
    }

    function addCity() {
      showModal("添加城市", `
        <input class="clock-search" type="search"
          placeholder="搜索城市" aria-label="搜索城市">
        <div class="clock-city-options"></div>
      `);

      const search = modal.querySelector("input");
      const list = modal.querySelector(".clock-city-options");

      function update() {
        list.replaceChildren();

        cities.filter(([name]) =>
          name.includes(search.value.trim()) && !cityNames.includes(name)
        ).forEach(([name]) => {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = name;
          button.addEventListener("click", () => {
            cityNames.push(name);
            save();
            closeModal();
            render();
          });
          list.appendChild(button);
        });

        if (!list.childElementCount) {
          list.textContent = "没有可添加的城市";
        }
      }

      search.addEventListener("input", update);
      update();
      search.focus();
    }

    const repeatLabels = {
      once: "仅一次",
      daily: "每天",
      weekdays: "工作日",
      weekends: "周末"
    };

    function renderAlarms() {
      const sorted = [...alarms].sort((a, b) => a.time.localeCompare(b.time));

      content.innerHTML = `
        <h1>闹钟</h1>

        <section class="clock-sleep">
          <h2 class="clock-section-title">
            <svg class="clock-bed-icon" viewBox="0 0 28 24" aria-hidden="true">
              <path d="M4 10V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5"/>
              <rect x="6" y="6" width="7" height="5" rx="1.5"/>
              <rect x="15" y="6" width="7" height="5" rx="1.5"/>
              <path d="M3 11h22a1 1 0 0 1 1 1v7H2v-7a1 1 0 0 1 1-1Z"/>
              <path d="M2 16h24M3 19v3M25 19v3"/>
            </svg>
            <span>睡眠 | 起床闹钟</span>
          </h2>
          <div class="clock-row">
            <strong>无闹钟</strong>
            <button type="button" class="clock-pill clock-orange"
              data-sleep-add>设置</button>
          </div>
        </section>

        <h2 class="clock-section-title">其他</h2>

        <div>
          ${sorted.map(alarm => `
            <div class="clock-row ${alarm.enabled ? "clock-alarm-enabled" : ""}">
              ${editing ? `
                <button type="button" class="clock-delete"
                  data-delete-alarm="${escapeHTML(alarm.id)}"
                  aria-label="删除闹钟">−</button>
              ` : ""}
              <button type="button" class="clock-alarm-info"
                data-alarm-edit="${escapeHTML(alarm.id)}"
                aria-label="编辑${alarm.time}闹钟">
                <span class="clock-alarm-time">${alarm.time}</span>
                <small>${escapeHTML(alarm.label)}${
                  alarm.repeat === "once" ? "" : `，${repeatLabels[alarm.repeat]}`
                }</small>
              </button>
              <button type="button" class="clock-switch"
                role="switch" aria-label="${alarm.time}闹钟"
                aria-checked="${alarm.enabled}"
                data-alarm-toggle="${escapeHTML(alarm.id)}"></button>
            </div>
          `).join("") || '<p class="clock-muted">暂无闹钟，点右上角添加。</p>'}
        </div>
      `;
    }

    function editAlarm(id = null, sleep = false) {
      const existing = alarms.find(a => a.id === id);
      const alarm = existing || {
        time: "07:00",
        label: sleep ? "起床闹钟" : "闹钟",
        repeat: sleep ? "daily" : "once"
      };

      showModal(existing ? "编辑闹钟" : "添加闹钟", `
        <form class="clock-form">
          <label>时间
            <input name="time" type="time"
              value="${alarm.time}" required>
          </label>

          <label>标签
            <input name="label" maxlength="40"
              value="${escapeHTML(alarm.label)}">
          </label>

          <label>重复
            <select name="repeat">
              ${Object.entries(repeatLabels).map(([value, label]) => `
                <option value="${value}"
                  ${alarm.repeat === value ? "selected" : ""}>
                  ${label}
                </option>
              `).join("")}
            </select>
          </label>

          <button class="clock-pill clock-orange" type="submit">保存</button>

          ${existing ? `
            <button class="clock-pill clock-red" type="button"
              data-form-delete>删除闹钟</button>
          ` : ""}
        </form>
      `);

      modal.querySelector("form").addEventListener("submit", event => {
        event.preventDefault();
        unlockAudio();

        const data = new FormData(event.currentTarget);
        const time = String(data.get("time"));

        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return;

        const updated = {
          id: existing?.id ||
            `alarm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          time,
          label: String(data.get("label") || "闹钟").trim() || "闹钟",
          repeat: String(data.get("repeat")),
          enabled: true,
          lastFired: ""
        };

        if (existing) {
          alarms = alarms.map(a => a.id === existing.id ? updated : a);
        } else {
          alarms.push(updated);
        }

        save();
        closeModal();
        render();
      });

      modal.querySelector("[data-form-delete]")?.addEventListener("click", () => {
        alarms = alarms.filter(a => a.id !== id);
        save();
        closeModal();
        render();
      });
    }

    function renderStopwatch() {
      content.innerHTML = `
        <div class="clock-stopwatch-display" data-stopwatch-display>
          ${formatStopwatch(elapsed())}
        </div>

        <div class="clock-round-actions">
          <button type="button" class="clock-round" data-stopwatch-left
            ${!stopwatch.running && !stopwatch.accumulated ? "disabled" : ""}>
            ${stopwatch.running ? "分段" : "复位"}
          </button>

          <button type="button"
            class="clock-round ${stopwatch.running ? "clock-red" : "clock-green"}"
            data-stopwatch-toggle>
            ${stopwatch.running ? "停止" : "启动"}
          </button>
        </div>

        <div data-stopwatch-laps>
          ${[...stopwatch.laps].reverse().map((lap, index) => `
            <div class="clock-lap">
              <span>第 ${stopwatch.laps.length - index} 段</span>
              <span>${formatStopwatch(lap.duration)}</span>
            </div>
          `).join("")}
        </div>
      `;
    }

    function setupTimerWheels() {
  const rowHeight = 35;

  content.querySelectorAll("[data-clock-wheel]").forEach(wheel => {
    const key = wheel.dataset.clockWheel;
    const max = key === "hours" ? 99 : 59;

    wheel.innerHTML = `
      <div class="clock-wheel-spacer" aria-hidden="true"></div>
      ${Array.from({ length: max + 1 }, (_, value) => `
        <button type="button"
          class="clock-wheel-option"
          data-wheel-value="${value}"
          aria-label="${value}${key === "hours" ? "小时" : key === "minutes" ? "分钟" : "秒"}"
          aria-selected="${value === timerDraft[key]}"
          tabindex="${value === timerDraft[key] ? "0" : "-1"}">
          ${value}
        </button>
      `).join("")}
      <div class="clock-wheel-spacer" aria-hidden="true"></div>
    `;

    function selectValue(value, scroll = false) {
      value = Math.max(0, Math.min(max, value));
      timerDraft[key] = value;

      wheel.querySelectorAll("[data-wheel-value]").forEach(option => {
        const selected = Number(option.dataset.wheelValue) === value;
        option.setAttribute("aria-selected", String(selected));
        option.tabIndex = selected ? 0 : -1;
      });

      if (scroll) {
        wheel.scrollTo({
          top: value * rowHeight,
          behavior: "smooth"
        });
      }
    }

    wheel.scrollTop = timerDraft[key] * rowHeight;

    wheel.addEventListener("scroll", () => {
      selectValue(Math.round(wheel.scrollTop / rowHeight));
    }, { passive: true });

    wheel.addEventListener("click", event => {
      const option = event.target.closest("[data-wheel-value]");
      if (!option) return;
      selectValue(Number(option.dataset.wheelValue), true);
    });

    wheel.addEventListener("keydown", event => {
      let value = timerDraft[key];

      if (event.key === "ArrowUp") value--;
      else if (event.key === "ArrowDown") value++;
      else if (event.key === "Home") value = 0;
      else if (event.key === "End") value = max;
      else return;

      event.preventDefault();
      selectValue(value, true);

      wheel.querySelector(
        `[data-wheel-value="${Math.max(0, Math.min(max, value))}"]`
      )?.focus({ preventScroll: true });
    });
  });
}

function renderTimer() {
  const active = timer.duration > 0;

  content.innerHTML = `
    <h1>计时器</h1>

    ${active ? `
      <div class="clock-timer-display" data-timer-display>
        ${formatDuration(remaining() / 1000)}
      </div>
      <p class="clock-muted" style="text-align:center">
        ${escapeHTML(timer.label)}
      </p>
    ` : `
      <div class="clock-timer-picker">
        <div class="clock-wheel-group">
          <div class="clock-wheel" data-clock-wheel="hours"
            role="group" aria-label="小时滚轮"></div>
          <span class="clock-wheel-unit">小时</span>
        </div>

        <div class="clock-wheel-group">
          <div class="clock-wheel" data-clock-wheel="minutes"
            role="group" aria-label="分钟滚轮"></div>
          <span class="clock-wheel-unit">分钟</span>
        </div>

        <div class="clock-wheel-group">
          <div class="clock-wheel" data-clock-wheel="seconds"
            role="group" aria-label="秒滚轮"></div>
          <span class="clock-wheel-unit">秒</span>
        </div>
      </div>
    `}

    <div class="clock-round-actions">
      <button type="button" class="clock-round"
        data-timer-cancel ${active ? "" : "disabled"}>取消</button>

      <button type="button"
        class="clock-round ${timer.running ? "" : "clock-green"}"
        data-timer-toggle>
        ${timer.running ? "暂停" : active ? "继续" : "启动"}
      </button>
    </div>

    ${!active ? `
      <div class="clock-settings">
        <label>
          标签
          <input data-timer-label maxlength="40"
            placeholder="计时器"
            value="${escapeHTML(timerDraft.label)}">
        </label>

        <div class="clock-sound-row">
  <span>铃声</span>

  <div class="clock-sound-controls">
    <select class="clock-sound-select" data-clock-sound
      aria-label="选择铃声">
      ${soundOptions()}
    </select>

    <button type="button"
      class="clock-sound-play"
      data-preview-sound
      aria-label="播放所选铃声">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5v14l11-7Z"/>
      </svg>
    </button>
  </div>
</div>
      </div>

      <h2 class="clock-section-title">最近使用</h2>

      ${recentTimers.map(seconds => `
        <div class="clock-row">
          <div class="clock-alarm-time">
            ${formatDuration(seconds)}
          </div>
          <button type="button" class="clock-round clock-green"
            data-timer-recent="${seconds}"
            aria-label="启动${seconds}秒计时">▶</button>
        </div>
      `).join("")}
    ` : ""}
  `;

  if (!active) setupTimerWheels();
}

    function startTimer(seconds) {
      if (!Number.isFinite(seconds) || seconds <= 0) return;

      unlockAudio();

      timer.duration = seconds * 1000;
      timer.remaining = timer.duration;
      timer.end = Date.now() + timer.remaining;
      timer.running = true;
      timer.label = timerDraft.label.trim() || "计时器";

      recentTimers = [
        seconds,
        ...recentTimers.filter(value => value !== seconds)
      ].slice(0, 5);

      renderTimer();
    }

    function openClock(trigger) {
      opener = trigger;
      document.getElementById("folder-overlay")?.setAttribute("hidden", "");
      app.hidden = false;
      phone.classList.add("clock-open");
      unlockAudio();
      render();
      app.querySelector(`[data-clock-tab="${tab}"]`)?.focus();
    }

    function closeClock() {
      closeModal();
      app.hidden = true;
      phone.classList.remove("clock-open");

      // 文件夹已隐藏，焦点返回“工具”文件夹。
      desktop.querySelector('[aria-label="打开工具文件夹"]')?.focus();
    }

    desktop.addEventListener("click", event => {
      const target = event.target.closest('[data-app="clock"]');
      if (!target || !phone.classList.contains("is-unlocked")) return;
      openClock(target);
    });

    editButton.addEventListener("click", () => {
      editing = !editing;
      render();
    });

    addButton.addEventListener("click", () => {
      unlockAudio();
      if (tab === "world") addCity();
      if (tab === "alarm") editAlarm();
    });

    app.querySelectorAll("[data-clock-tab]").forEach(button => {
      button.addEventListener("click", () => {
        closeModal();
        tab = button.dataset.clockTab;
        editing = false;
        render();
        content.scrollTop = 0;
      });
    });

    app.querySelector(".clock-home").addEventListener("click", closeClock);
    content.addEventListener("change", event => {
  if (!event.target.matches("[data-clock-sound]")) return;

  stopCustomSound();
  selectedSound = event.target.value;
});

content.addEventListener("click", event => {
  if (!event.target.closest("[data-preview-sound]")) return;

  unlockAudio();

  if (!playCustomSound(true)) {
    beep();
  }
});

/* 从白色横条区域上滑，退出时钟 */
const clockHome = app.querySelector(".clock-home");
let clockSwipe = null;

clockHome.addEventListener("pointerdown", event => {
  if (!event.isPrimary || event.button !== 0) return;

  clockSwipe = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY
  };

  clockHome.setPointerCapture(event.pointerId);
});

clockHome.addEventListener("pointerup", event => {
  if (!clockSwipe || clockSwipe.id !== event.pointerId) return;

  const dx = event.clientX - clockSwipe.x;
  const dy = clockSwipe.y - event.clientY;

  clockSwipe = null;

  if (dy > 28 && dy > Math.abs(dx)) {
    closeClock();
  }
});

clockHome.addEventListener("pointercancel", () => {
  clockSwipe = null;
});

clockHome.addEventListener("lostpointercapture", () => {
  clockSwipe = null;
});

    content.addEventListener("input", event => {
      const input = event.target;

      if (input.matches("[data-timer-input]")) {
        const max = input.dataset.timerInput === "hours" ? 99 : 59;
        const value = Math.min(max, Math.max(0, Math.trunc(Number(input.value) || 0)));
        timerDraft[input.dataset.timerInput] = value;
      }

      if (input.matches("[data-timer-label]")) {
        timerDraft.label = input.value;
      }
    });

    content.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;

      unlockAudio();

      if (button.hasAttribute("data-delete-city")) {
        cityNames = cityNames.filter(name => name !== button.dataset.deleteCity);
        save();
        renderWorld();
      }

      if (button.hasAttribute("data-sleep-add")) {
        editAlarm(null, true);
      }

      if (button.hasAttribute("data-alarm-edit")) {
        editAlarm(button.dataset.alarmEdit);
      }

      if (button.hasAttribute("data-delete-alarm")) {
        alarms = alarms.filter(a => a.id !== button.dataset.deleteAlarm);
        save();
        renderAlarms();
      }

      if (button.hasAttribute("data-alarm-toggle")) {
        const alarm = alarms.find(a => a.id === button.dataset.alarmToggle);
        if (alarm) {
          alarm.enabled = !alarm.enabled;
          alarm.lastFired = "";
          save();
          renderAlarms();
        }
      }

      if (button.hasAttribute("data-stopwatch-toggle")) {
        if (stopwatch.running) {
          stopwatch.accumulated = elapsed();
          stopwatch.running = false;
        } else {
          stopwatch.started = performance.now();
          stopwatch.running = true;
        }
        renderStopwatch();
      }

      if (button.hasAttribute("data-stopwatch-left")) {
        if (stopwatch.running) {
          const total = elapsed();
          const previous = stopwatch.laps.at(-1)?.total || 0;
          stopwatch.laps.push({ total, duration: total - previous });
        } else {
          stopwatch.accumulated = 0;
          stopwatch.laps = [];
        }
        renderStopwatch();
      }

      if (button.hasAttribute("data-timer-cancel")) {
        timer.running = false;
        timer.remaining = 0;
        timer.duration = 0;
        renderTimer();
      }

      if (button.hasAttribute("data-timer-toggle")) {
        if (!timer.duration) {
          startTimer(
            timerDraft.hours * 3600 +
            timerDraft.minutes * 60 +
            timerDraft.seconds
          );
        } else if (timer.running) {
          timer.remaining = remaining();
          timer.running = false;
          renderTimer();
        } else {
          timer.end = Date.now() + timer.remaining;
          timer.running = true;
          renderTimer();
        }
      }

      if (button.hasAttribute("data-timer-recent")) {
        startTimer(Number(button.dataset.timerRecent));
      }
    });

    // 从上一次检查至今寻找最近一次应响的闹钟。
    let previousCheck = Date.now();

    function checkAlarms(now) {
      const current = now.getTime();

      if (current < previousCheck) {
        previousCheck = current;
        return;
      }

      const due = [];
      let changed = false;

      for (const alarm of alarms) {
        if (!alarm.enabled) continue;

        const [hours, minutes] = alarm.time.split(":").map(Number);
        const candidate = new Date(now);
        candidate.setHours(hours, minutes, 0, 0);

        if (candidate.getTime() > current) {
          candidate.setDate(candidate.getDate() - 1);
        }

        const stamp = `${candidate.getFullYear()}-${candidate.getMonth() + 1}-${candidate.getDate()}`;
        const day = candidate.getDay();

        const allowed =
          alarm.repeat === "once" ||
          alarm.repeat === "daily" ||
          (alarm.repeat === "weekdays" && day >= 1 && day <= 5) ||
          (alarm.repeat === "weekends" && (day === 0 || day === 6));

        if (
          allowed &&
          candidate.getTime() > previousCheck &&
          candidate.getTime() <= current &&
          alarm.lastFired !== stamp
        ) {
          alarm.lastFired = stamp;
          if (alarm.repeat === "once") alarm.enabled = false;
          due.push(alarm.label);
          changed = true;
        }
      }

      previousCheck = current;

      if (changed) {
        save();
        if (!app.hidden && tab === "alarm") renderAlarms();
      }

      if (due.length) ring(due.join(" / "));
    }

    function tick() {
      const now = new Date();
      checkAlarms(now);

      if (timer.running && remaining() <= 0) {
        timer.running = false;
        timer.remaining = 0;
        timer.duration = 0;
        ring(timer.label);
        if (!app.hidden && tab === "timer") renderTimer();
      }

      if (app.hidden) return;

      if (tab === "world") updateWorld();

      if (tab === "stopwatch") {
        const display = content.querySelector("[data-stopwatch-display]");
        if (display) display.textContent = formatStopwatch(elapsed());
      }

      if (tab === "timer" && timer.duration) {
        const display = content.querySelector("[data-timer-display]");
        if (display) display.textContent = formatDuration(remaining() / 1000);
      }
    }

    setInterval(tick, 50);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tick();
    });

    document.addEventListener("keydown", event => {
      const scope = ringPanel || (!app.hidden ? (!modal.hidden ? modal : app) : null);
      if (!scope) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (ringPanel) stopRinging();
        else if (!modal.hidden) closeModal();
        else closeClock();

        return;
      }

      if (event.key === "Tab") {
        const buttons = [...scope.querySelectorAll(
          'button:not(:disabled), input, select'
        )].filter(node => node.getClientRects().length);

        const first = buttons[0];
        const last = buttons.at(-1);

        if (!first) return;

        if (event.shiftKey &&
            (document.activeElement === first || !scope.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey &&
            (document.activeElement === last || !scope.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    }, true);

    new MutationObserver(() => {
      if (!phone.classList.contains("is-unlocked") && !app.hidden) {
        closeClock();
      }
    }).observe(phone, {
      attributes: true,
      attributeFilter: ["class"]
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClock, { once: true });
  } else {
    initClock();
  }
})();