// 时间、锁屏、密码和故事线切换
function updateTime() {
  const now = new Date();
  // 桌面日历组件和日历图标
  const weekNames = [
    "星期日", "星期一", "星期二", "星期三",
    "星期四", "星期五", "星期六"
  ];

  document.getElementById("widget-week").textContent =
    weekNames[now.getDay()];

  document.getElementById("widget-day").textContent =
    now.getDate();

  const calendarIconDay =
  document.getElementById("calendar-icon-day");

if (calendarIconDay) {
  calendarIconDay.textContent = now.getDate();
}

  // 实时时间
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  document.getElementById("time").innerHTML =
  `${hours}<span class="colon"></span>${minutes}`;

  // 公历日期
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  const solar =
    `${now.getMonth() + 1}月${now.getDate()}日${weekdays[now.getDay()]}`;

// 读取农历；中文负责年月，英文格式负责数字日数
let lunarText = "";

try {
  const chineseParts = new Intl.DateTimeFormat(
    "zh-CN-u-ca-chinese",
    { year: "numeric", month: "long", day: "numeric" }
  ).formatToParts(now);

  const numericParts = new Intl.DateTimeFormat(
    "en-US-u-ca-chinese-nu-latn",
    { day: "numeric" }
  ).formatToParts(now);

  const year = chineseParts.find(
    part => part.type === "yearName"
  )?.value || "";

  const month = chineseParts.find(
    part => part.type === "month"
  )?.value || "";

  const day = Number(
    numericParts.find(part => part.type === "day")?.value
  );

  const numbers = [
    "", "一", "二", "三", "四",
    "五", "六", "七", "八", "九"
  ];

  function lunarDay(n) {
    if (!Number.isInteger(n) || n < 1 || n > 30) return "";
    if (n === 10) return "初十";
    if (n === 20) return "二十";
    if (n === 30) return "三十";
    if (n < 10) return "初" + numbers[n];
    if (n < 20) return "十" + numbers[n - 10];
    return "廿" + numbers[n - 20];
  }

  const dayText = lunarDay(day);

  if (month && dayText) {
    lunarText = `${year ? year + "年" : ""}${month}${dayText}`;
  }
} catch (error) {
  console.warn("农历日期读取失败", error);
}

document.getElementById("date").textContent =
  lunarText ? `${solar} · ${lunarText}` : solar;
}

updateTime();
setInterval(updateTime, 1000);
const lockScreen = document.querySelector(".lock-screen");
const passcodeScreen = document.getElementById("passcode-screen");
const passcodeDots = document.querySelectorAll("#passcode-dots span");
const passcodeError = document.getElementById("passcode-error");

// 在这里修改解锁密码，保留引号
// 不同密码对应不同故事线
const storyPasswords = {
  "000526": "dream",
  "060526": "cp"
};

// 当前进入的故事线
let currentStory = null;

let enteredPassword = "";
let unlocked = false;

function updateDots() {
  passcodeDots.forEach((dot, index) => {
    dot.classList.toggle("filled", index < enteredPassword.length);
  });
}

function openPasscode() {
  if (unlocked || !passcodeScreen.hidden) return;

  enteredPassword = "";
  passcodeError.textContent = "";
  updateDots();
  passcodeScreen.hidden = false;
}

function closePasscode() {
  passcodeScreen.hidden = true;
  enteredPassword = "";
  updateDots();
}

function addDigit(digit) {
  if (passcodeScreen.hidden || unlocked ||
      enteredPassword.length >= 6) return;

  passcodeError.textContent = "";
  enteredPassword += digit;
  updateDots();

  if (enteredPassword.length === 6) {
    const story = storyPasswords[enteredPassword];

    if (story) {
      enterDesktop(story);
    } else {
      passcodeError.textContent = "密码错误，请重新输入";
      enteredPassword = "";
      updateDots();
    }
  }
}

// 点击数字
document.getElementById("keypad").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-digit]");
  if (button) addDigit(button.dataset.digit);
});

// 删除一位
function deleteDigit() {
  enteredPassword = enteredPassword.slice(0, -1);
  passcodeError.textContent = "";
  updateDots();
}

document.getElementById("delete-digit")
  .addEventListener("click", deleteDigit);

document.getElementById("cancel-passcode")
  .addEventListener("click", closePasscode);

// 点击底部区域也能进入
document.querySelector(".bottom")
  .addEventListener("click", openPasscode);

// 鼠标或手指向上拖动解锁
let startY = null;

lockScreen.addEventListener("pointerdown", (event) => {
  if (unlocked || !passcodeScreen.hidden) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;

  startY = event.clientY;
  lockScreen.setPointerCapture(event.pointerId);
});

lockScreen.addEventListener("pointerup", (event) => {
  if (startY === null) return;

  const distance = startY - event.clientY;
  startY = null;

  if (distance > 50) openPasscode();
});

lockScreen.addEventListener("pointercancel", () => {
  startY = null;
});

// 电脑键盘也可以输入
document.addEventListener("keydown", (event) => {
  if (passcodeScreen.hidden || unlocked) return;

  if (/^[0-9]$/.test(event.key)) {
    event.preventDefault();
    addDigit(event.key);
  } else if (event.key === "Backspace") {
    event.preventDefault();
    deleteDigit();
  } else if (event.key === "Escape") {
    closePasscode();
  }
});
function enterDesktop(story) {
  currentStory = story;
  unlocked = true;

  // 关闭密码页并清空输入
  closePasscode();
  passcodeError.textContent = "";

  // 标记主线，后续应用根据这个加载对应内容
  lockScreen.dataset.story = story;
  lockScreen.classList.add("is-unlocked");

  document.getElementById("story-name").textContent =
    story === "dream" ? "梦女线" : "礼志 × 彩领";

  document.getElementById("desktop").hidden = false;
}

function returnToLockScreen() {
  document.getElementById("desktop").hidden = true;
  lockScreen.classList.remove("is-unlocked");
  delete lockScreen.dataset.story;

  currentStory = null;
  unlocked = false;
  startY = null;

  closePasscode();
  passcodeError.textContent = "";
}

document.getElementById("lock-button")
  .addEventListener("click", returnToLockScreen);
// 状态栏：锁屏显示 KT，解锁后显示实时时间
(() => {
  const phone = document.querySelector(".lock-screen");
  const statusBar = phone?.querySelector(".status-bar");

  if (!phone || !statusBar) return;

  // 找到状态栏中原来显示 KT 的元素
  const carrier = [...statusBar.querySelectorAll("*")].find(
    element =>
      element.children.length === 0 &&
      element.textContent.trim() === "KT"
  );

  if (!carrier) return;

  function updateStatusBarTime() {
    if (!phone.classList.contains("is-unlocked")) {
      carrier.textContent = "KT";
      return;
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    carrier.textContent = `${hours}:${minutes}`;
  }

  // 解锁、返回锁屏时立即切换
  new MutationObserver(updateStatusBarTime).observe(phone, {
    attributes: true,
    attributeFilter: ["class"]
  });

  // 定时检查时间
  setInterval(updateStatusBarTime, 1000);

  updateStatusBarTime();
})();