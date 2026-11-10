(() => {
  const phone = document.querySelector(".lock-screen");
  const desktop = document.getElementById("desktop");

  if (!phone || !desktop) return;

  // 计算逻辑：不使用 eval

  function createCalculator() {
    let entry = "0";
    let held = null;
    let op = null;
    let fresh = true;
    let repeat = null;

    function result(a, b, operator) {
      const n =
        operator === "+" ? a + b :
        operator === "-" ? a - b :
        operator === "*" ? a * b :
        b === 0 ? NaN : a / b;

      return Number.isFinite(n)
        ? String(Number(n.toPrecision(12)))
        : "错误";
    }

    function reset() {
      entry = "0";
      held = null;
      op = null;
      fresh = true;
      repeat = null;
    }

    return {
      get entry() { return entry; },
      get op() { return op; },
      get waiting() { return fresh; },

      press(key) {
        let record = null;

        if (key === "AC") {
          reset();
          return null;
        }

        if (entry === "错误") {
          if (!/^[0-9.]$/.test(key)) return null;
          reset();
        }

        // 输入数字或小数点
        if (/^[0-9.]$/.test(key)) {
          if (fresh) {
            entry = "0";
            fresh = false;
            if (!op) repeat = null;
          }

          if (key === ".") {
            if (!entry.includes(".")) entry += ".";
          } else if (
            entry.replace(/[-.]/g, "").length < 12
          ) {
            entry =
              entry === "0" ? key :
              entry === "-0" ? "-" + key :
              entry + key;
          }

          return null;
        }

        // 删除最后一位
        if (key === "back") {
          if (fresh) return null;

          entry = entry.slice(0, -1);

          if (!entry || entry === "-") entry = "0";
          return null;
        }

        // 正负号与百分比
        if (key === "sign" || key === "%") {
          const n = Number(entry);

          if (key === "sign") {
            if (n !== 0) {
              entry = entry.startsWith("-")
                ? entry.slice(1)
                : "-" + entry;
            }
          } else {
            const value = op === "+" || op === "-"
              ? held * n / 100
              : n / 100;

            entry = String(Number(value.toPrecision(12)));
          }

          fresh = false;
          repeat = null;
          return null;
        }

        // 运算符
        if (["+", "-", "*", "/"].includes(key)) {
          if (op && !fresh) {
            const a = held;
            const b = Number(entry);

            entry = result(a, b, op);
            record = { a, b, op, result: entry };

            if (entry === "错误") {
              op = null;
              held = null;
              fresh = true;
              return record;
            }
          }

          held = Number(entry);
          op = key;
          fresh = true;
          repeat = null;
          return record;
        }

        // 等号，包括连续按等号
        if (key === "=") {
          if (op) {
            const a = held;
            const b = fresh ? held : Number(entry);
            const operator = op;

            entry = result(a, b, operator);

            record = {
              a,
              b,
              op: operator,
              result: entry
            };

            repeat = entry === "错误"
              ? null
              : { op: operator, b };

            op = null;
            held = null;
            fresh = true;
          } else if (repeat) {
            const a = Number(entry);

            entry = result(a, repeat.b, repeat.op);

            record = {
              a,
              b: repeat.b,
              op: repeat.op,
              result: entry
            };

            fresh = true;
            if (entry === "错误") repeat = null;
          }
        }

        return record;
      }
    };
  }

  const calculator = createCalculator();
  const history = [];
  const signs = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  let trigger = null;
  let expression = "";

  const app = document.createElement("section");
  app.id = "calculator-app";
  app.hidden = true;
  app.setAttribute("aria-label", "计算器");

  app.innerHTML = `
    <header class="calculator-top">
      <button type="button" data-calc-history
              aria-label="历史记录">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 6v6l-4 2"/>
        </svg>
      </button>

      <button type="button" data-calc-exit
              aria-label="返回桌面">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m14 5-7 7 7 7"/>
        </svg>
      </button>
    </header>

    <div class="calculator-display">
      <div class="calculator-expression"></div>
      <output class="calculator-result"
              aria-live="polite">0</output>
    </div>

    <div class="calculator-keys"></div>

    <button type="button" class="calculator-home"
            aria-label="返回桌面"></button>

    <section class="calculator-history" hidden
             aria-label="计算历史">
      <header class="calculator-history-header">
        <strong>历史记录</strong>
        <div>
          <button type="button" data-calc-clear-history>
            清空
          </button>
          <button type="button" data-calc-close-history>
            完成
          </button>
        </div>
      </header>
      <div class="calculator-history-list"></div>
    </section>
  `;

  phone.appendChild(app);

  const output = app.querySelector(".calculator-result");
  const expressionBox = app.querySelector(".calculator-expression");
  const keys = app.querySelector(".calculator-keys");
  const historyPanel = app.querySelector(".calculator-history");

  const buttons = [
    ["back", "⌫", "删除一位"],
    ["AC", "AC", "全部清除"],
    ["%", "%", "百分比"],
    ["/", "÷", "除"],
    ["7", "7"], ["8", "8"], ["9", "9"], ["*", "×", "乘"],
    ["4", "4"], ["5", "5"], ["6", "6"], ["-", "−", "减"],
    ["1", "1"], ["2", "2"], ["3", "3"], ["+", "+", "加"],
    ["sign", "⁺/₋", "切换正负"],
    ["0", "0"], [".", ".", "小数点"], ["=", "=", "等于"]
  ];

  buttons.forEach(([key, text, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.calcKey = key;
    button.textContent = text;
    button.setAttribute("aria-label", label || text);

    if (["back", "AC", "%"].includes(key)) {
      button.classList.add("is-function");
    }

    if (["+", "-", "*", "/", "="].includes(key)) {
      button.classList.add("is-operator");
    }

    if (key === "back") {
      button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 4h12v16H9L2 12Z"/>
          <path d="m12 9 6 6M18 9l-6 6"/>
        </svg>
      `;
    }

    button.addEventListener("click", () => press(key));
    keys.appendChild(button);
  });

  function render() {
    output.textContent = calculator.entry;
    output.classList.toggle(
      "is-long",
      calculator.entry.length > 8
    );

    expressionBox.textContent = expression;

    keys.querySelectorAll("[data-calc-key]").forEach(button => {
      button.classList.toggle(
        "is-selected",
        calculator.waiting &&
        calculator.op === button.dataset.calcKey
      );
    });
  }

  function press(key) {
    const record = calculator.press(key);

    if (record) {
      expression =
        `${record.a} ${signs[record.op]} ${record.b} =`;

      if (record.result !== "错误") {
        history.unshift({ ...record });
        if (history.length > 30) history.pop();
      }
    }

    if (key === "AC") {
      expression = "";
    } else if (calculator.op) {
      expression =
        `${calculator.waiting ? calculator.entry : ""} ${
          signs[calculator.op]
        }`;
    } else if (/^[0-9.]$/.test(key)) {
      expression = "";
    }

    render();
  }

  function showHistory() {
    const list = app.querySelector(".calculator-history-list");
    list.replaceChildren();

    if (!history.length) {
      const empty = document.createElement("p");
      empty.textContent = "暂无计算记录";
      list.appendChild(empty);
    }

    history.forEach(item => {
      const button = document.createElement("button");
      button.type = "button";

      const formula = document.createElement("small");
      formula.textContent =
        `${item.a} ${signs[item.op]} ${item.b} =`;

      const answer = document.createElement("strong");
      answer.textContent = item.result;

      button.append(formula, answer);

      // 点击历史结果，作为新数字继续计算
      button.addEventListener("click", () => {
        calculator.press("AC");

        // 科学计数法结果不通过逐位输入恢复
        const value = Number(item.result).toFixed(
          Math.abs(Number(item.result)) < 1e12 ? 12 : 0
        ).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");

        if (!/[eE]/.test(value)) {
          for (const digit of value.replace("-", "")) {
            calculator.press(digit);
          }

          if (value.startsWith("-")) calculator.press("sign");

          expression = "";
          render();
          historyPanel.hidden = true;
        }
      });

      list.appendChild(button);
    });

    historyPanel.hidden = false;
    list.scrollTop = 0;
    app.querySelector("[data-calc-close-history]").focus();
  }

  function closeHistory() {
    historyPanel.hidden = true;
    app.querySelector("[data-calc-history]").focus();
  }

  function closeCalculator() {
    historyPanel.hidden = true;
    app.hidden = true;
    phone.classList.remove("calculator-open");

    // 文件夹刚才已关闭，焦点回到桌面文件夹按钮
    desktop.querySelector(".folder-button")?.focus();
  }

  desktop.addEventListener("click", event => {
    const button = event.target.closest('[data-app="calculator"]');

    if (!button || !phone.classList.contains("is-unlocked")) return;

    trigger = button;
    document.getElementById("folder-overlay").hidden = true;

    app.hidden = false;
    phone.classList.add("calculator-open");
    render();
    app.querySelector('[data-calc-key="AC"]').focus();
  });

  app.querySelector("[data-calc-exit]")
    .addEventListener("click", closeCalculator);

  const home = app.querySelector(".calculator-home");
  home.addEventListener("click", closeCalculator);

  let start = null;

  home.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    start = { x: event.clientX, y: event.clientY };
    home.setPointerCapture(event.pointerId);
  });

  home.addEventListener("pointerup", event => {
    if (!start) return;

    const dy = start.y - event.clientY;
    const dx = Math.abs(start.x - event.clientX);
    start = null;

    if (dy > 30 && dy > dx) closeCalculator();
  });

  home.addEventListener("pointercancel", () => {
    start = null;
  });

  app.querySelector("[data-calc-history]")
    .addEventListener("click", showHistory);

  app.querySelector("[data-calc-close-history]")
    .addEventListener("click", closeHistory);

  app.querySelector("[data-calc-clear-history]")
    .addEventListener("click", () => {
      history.length = 0;
      showHistory();
    });

  document.addEventListener("keydown", event => {
    if (app.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (!historyPanel.hidden) closeHistory();
      else closeCalculator();

      return;
    }

    if (event.key === "Tab") {
      const scope = historyPanel.hidden ? app : historyPanel;
      const controls = [...scope.querySelectorAll("button")]
        .filter(button => button.getClientRects().length);

      const first = controls[0];
      const last = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }

      return;
    }

    if (!historyPanel.hidden || event.ctrlKey ||
        event.metaKey || event.altKey) return;

    const mapping = {
      Enter: "=",
      Backspace: "back",
      Delete: "AC",
      c: "AC",
      C: "AC"
    };

    const key = mapping[event.key] || event.key;

    if (/^[0-9.]$/.test(key) ||
        ["+", "-", "*", "/", "=", "%", "back", "AC"].includes(key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      press(key);
    }
  }, true);

  new MutationObserver(() => {
    if (!app.hidden && !phone.classList.contains("is-unlocked")) {
      closeCalculator();
    }
  }).observe(phone, {
    attributes: true,
    attributeFilter: ["class"]
  });

  render();
})();