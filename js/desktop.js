// 桌面文件夹资料、生成和交互
// 应用资料：[应用标识、显示名称、占位文字、颜色]
const folderData = [
  {
    name: "社交",
    apps: [
      ["instagram", "Instagram", "IG", "#bd528e"],
      ["x", "X", "X", "#202020"]
    ]
  },
  {
    name: "MIDZY",
    apps: [
      ["fans", "FANS", "F", "#242424"],
      ["bubble", "JYP bubble", "B", "#9295e8"]
    ]
  },
  {
    name: "工具",
    apps: [
      ["calculator", "计算器", "＋", "#65686d"],
      ["clock", "时钟", "◷", "#252525"],
      ["settings", "设置", "⚙", "#8b919b"]
    ]
  },
  {
    name: "服务",
    apps: [
      ["naver", "NAVER", "N", "#27bc65"],
      ["browser", "Safari浏览器", "↗", "#499fe7"],
      ["appstore", "App Store", "A", "#368de7"],
      ["chatgpt", "ChatGPT", "AI", "#348976"]
    ]
  },
  {
    name: "娱乐",
    apps: [
      ["youtube", "YouTube", "▶", "#e84b48"],
      ["tiktok", "TikTok", "♪", "#25252b"],
      ["melon", "Melon", "M", "#41be67"]
    ]
  },
  {
    name: "日常",
    apps: [
      ["calendar", "日历", "日", "#df6969"],
      ["maps", "地图", "↗", "#68b581"],
      ["files", "文件", "▰", "#4b9ce5"],
      ["notes", "备忘录", "≡", "#d3ae46"],
      ["weather", "天气", "☁", "#59a7dc"],
      ["mail", "邮件", "✉", "#418de2"]
    ]
  },
  {
    name: "影像",
    apps: [
      ["camera", "相机", "◎", "#828894"],
      ["photos", "照片", "✿", "#dc8bab"]
    ]
  }
];

const folderGrid = document.getElementById("folder-grid");
const folderOverlay = document.getElementById("folder-overlay");
const folderApps = document.getElementById("folder-apps");
let activeFolderButton = null;

// 创建桌面上的六个文件夹
folderData.forEach((folder) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "folder-button";
  button.setAttribute("aria-label", `打开${folder.name}文件夹`);

  const preview = document.createElement("span");
  preview.className = "folder-preview";
  preview.setAttribute("aria-hidden", "true");

  folder.apps.forEach((app) => {
  const mini = document.createElement("img");
  mini.className = "mini-icon";
  mini.src = `./assets/icons/${app[0]}.png`;
  mini.alt = "";
  mini.draggable = false;
  preview.appendChild(mini);
});

  const label = document.createElement("span");
  label.textContent = folder.name;

  button.append(preview, label);

  button.addEventListener("click", () => {
    activeFolderButton = button;
    openFolder(folder);
  });

  folderGrid.appendChild(button);
});

// 展开文件夹
function openFolder(folder) {
  document.getElementById("folder-title").textContent = folder.name;
  folderApps.replaceChildren();

  folder.apps.forEach(([id, name, symbol, color]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app";
    button.dataset.app = id;

    const icon = document.createElement("img");
icon.className = "app-icon app-image";
icon.src = `./assets/icons/${id}.png`;
icon.alt = "";
icon.draggable = false;

    const label = document.createElement("span");
    label.textContent = name;

    button.append(icon, label);
    folderApps.appendChild(button);
  });

  folderOverlay.hidden = false;
  document.getElementById("folder-close").focus();
}

// 关闭文件夹
function closeFolder() {
  folderOverlay.hidden = true;
  activeFolderButton?.focus();
}

document.getElementById("folder-close")
  .addEventListener("click", closeFolder);

// 点击文件夹外部关闭
folderOverlay.addEventListener("click", (event) => {
  if (event.target === folderOverlay) closeFolder();
});

// Esc 关闭；Tab 焦点保持在文件夹内
folderOverlay.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeFolder();
  }

  if (event.key === "Tab") {
    const buttons = [...folderOverlay.querySelectorAll("button")];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
