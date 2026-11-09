(() => {
  const phone = document.querySelector(".lock-screen");
  const desktop = document.getElementById("desktop");

  const icons = {
    home: `<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"/>`,
    search: `<circle cx="10" cy="10" r="7"/>
             <path d="m15 15 6 6"/>`,
    reels: `<rect x="3" y="3" width="18" height="18" rx="4"/>
            <path d="M3 9h18M8 3l4 6M15 3l4 6"/>
            <path d="m10 12 6 3-6 3Z"/>`,
    messages: `
  <path d="M21 3 3 10l7 3 3 8Z"/>
  <path d="m10 13 6-6"/>
`,
    profile: `<circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="9" r="3"/>
              <path d="M5 19a7 7 0 0 1 14 0"/>`
  };

  // 账号资料：之后在这里修改
  const accounts = [
    {
      id: "main",
      username: "yezyizhere",
      name: "YEJI",
      avatar: "./assets/avatars/yeji.jpg",
      bio: "ITZY",
      followers: 5730000,
      following: 5
    },
    {
      id: "private",
      username: "hhhwneii_26",
      name: "yeji",
      bio: "",
      followers: 0,
      following: 0
    }
  ];

  // 两条剧情线分别记住当前选择的账号
  const selectedAccounts = {};
  let activePage = "home";
  let desktopTrigger = null;

  const app = document.createElement("section");
  app.className = "ig-app";
  app.id = "instagram-app";
  app.hidden = true;
  app.setAttribute("aria-label", "Instagram");

  app.innerHTML = `
    <header class="ig-header">
      <span class="ig-brand">Instagram</span>
      <button type="button" class="ig-account-trigger"
              aria-label="切换账号" aria-expanded="false"></button>
    </header>

    <main class="ig-content"></main>
    <nav class="ig-nav" aria-label="Instagram 导航"></nav>

    <button type="button" class="ig-home"
            aria-label="返回桌面"></button>

    <div class="ig-account-overlay" hidden>
      <section class="ig-account-sheet"
               role="dialog" aria-label="切换账号">
        <div class="ig-account-handle" aria-hidden="true"></div>
        <h2>切换账号</h2>
        <div class="ig-account-list"></div>
        <button type="button" class="ig-account-cancel">取消</button>
      </section>
    </div>
  `;

  phone.appendChild(app);

  const content = app.querySelector(".ig-content");
  const nav = app.querySelector(".ig-nav");
  const accountTrigger = app.querySelector(".ig-account-trigger");
  const accountOverlay = app.querySelector(".ig-account-overlay");
  const accountList = app.querySelector(".ig-account-list");
  const home = app.querySelector(".ig-home");

  function storyKey() {
    return phone.dataset.story || "default";
  }

  function currentAccount() {
    return accounts.find(
      (account) => account.id === selectedAccounts[storyKey()]
    ) || accounts[0];
  }

  const pages = [
  ["home", "首页"],
  ["reels", "Reels"],
  ["messages", "私信"],
  ["search", "搜索"],
  ["profile", "个人主页"]
];

  pages.forEach(([id, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.igPage = id;
    button.setAttribute("aria-label", label);
    button.innerHTML = `<svg viewBox="0 0 24 24"
      aria-hidden="true">${icons[id]}</svg>`;

    button.addEventListener("click", () => renderPage(id));
    nav.appendChild(button);
  });

  function renderPage(page) {
    pauseInstagramVideos();
    closeOwnPostMenu();
    activePage = page;
    app.classList.toggle("ig-is-home", page === "home");
    app.classList.toggle("ig-is-profile", page === "profile");
    const account = currentAccount();

    accountTrigger.textContent = `${account.username} ⌄`;
    content.replaceChildren();
    content.scrollTop = 0;

    nav.querySelectorAll("button").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.igPage === page)
      );
    });

    if (page === "home") {
      renderInstagramHome();
      return;
    }
    if (page === "profile") {
  renderInstagramProfile();
  return;
}

    const empty = document.createElement("section");
    empty.className = "ig-empty";

    const title = document.createElement("h2");
    const description = document.createElement("p");

    const text = {
      home: ["首页", "尚未添加动态"],
      search: ["搜索", "搜索功能后续连接"],
      reels: ["Reels", "尚未添加视频"],
      messages: ["消息", "尚未添加私信"]
    };

    title.textContent = text[page][0];
    description.textContent = text[page][1];

    empty.append(title, description);
    content.appendChild(empty);
  }

  function closeAccounts() {
    accountOverlay.hidden = true;
    accountTrigger.setAttribute("aria-expanded", "false");
  }

  function openAccounts() {
    accountList.replaceChildren();

    accounts.forEach((account) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ig-account-row";
      button.setAttribute(
        "aria-pressed",
        String(account.id === currentAccount().id)
      );

      button.innerHTML = `
        <span class="ig-account-avatar">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            ${icons.profile}
          </svg>
        </span>
        <span class="ig-account-info">
          <strong></strong>
          <small></small>
        </span>
        <span class="ig-account-check" aria-hidden="true"></span>
      `;

      button.querySelector("strong").textContent = account.username;
      button.querySelector("small").textContent = account.label;
      button.querySelector(".ig-account-check").textContent =
        account.id === currentAccount().id ? "✓" : "";

      button.addEventListener("click", () => {
        selectedAccounts[storyKey()] = account.id;
        closeAccounts();
        renderPage(activePage);
        accountTrigger.focus();
      });

      accountList.appendChild(button);
    });

    accountOverlay.hidden = false;
    accountTrigger.setAttribute("aria-expanded", "true");
    accountList.querySelector('[aria-pressed="true"]')?.focus();
  }

  function openInstagram(button) {
    if (!phone.classList.contains("is-unlocked")) return;

    desktopTrigger = button;
    document.getElementById("folder-overlay").hidden = true;

    closeAccounts();
    renderPage("home");
    app.hidden = false;
    phone.classList.add("instagram-open");
    accountTrigger.focus();
  }

  function closeInstagram() {
    pauseInstagramVideos();
    closeOwnPostMenu();
    closeAccounts();
    app.hidden = true;
    phone.classList.remove("instagram-open");
    desktopTrigger?.focus();
  }

  desktop.addEventListener("click", (event) => {
    const button = event.target.closest('[data-app="instagram"]');
    if (button) openInstagram(button);
  });

  accountTrigger.addEventListener("click", openAccounts);

  app.querySelector(".ig-account-cancel").addEventListener("click", () => {
    closeAccounts();
    accountTrigger.focus();
  });

  accountOverlay.addEventListener("click", (event) => {
    if (event.target === accountOverlay) {
      closeAccounts();
      accountTrigger.focus();
    }
  });

  // 点击或上滑底部横条返回桌面
  home.addEventListener("click", closeInstagram);

  let homeStart = null;

  home.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    homeStart = { x: event.clientX, y: event.clientY };
    home.setPointerCapture(event.pointerId);
  });

  home.addEventListener("pointerup", (event) => {
    if (!homeStart) return;

    const dy = homeStart.y - event.clientY;
    const dx = Math.abs(homeStart.x - event.clientX);
    homeStart = null;

    if (dy > 30 && dy > dx) closeInstagram();
  });

  home.addEventListener("pointercancel", () => {
    homeStart = null;
  });

  // Instagram 打开时，由它处理 Esc 和焦点
  document.addEventListener("keydown", (event) => {
    if (app.hidden) return;

    if (event.key === "Escape") {
      if (!ownPostMenu.hidden) {
         event.preventDefault();
         event.stopImmediatePropagation();
         closeOwnPostMenu();
         return;
    }  
      event.preventDefault();
      event.stopImmediatePropagation();

      if (!accountOverlay.hidden) {
        closeAccounts();
        accountTrigger.focus();
      } else {
        closeInstagram();
      }

      return;
    }

    if (event.key === "Tab") {
      const scope = !ownPostMenu.hidden
        ? ownPostMenu
        : accountOverlay.hidden
          ? app
          : accountOverlay;
      const controls = [...scope.querySelectorAll("button")]
        .filter((button) => button.getClientRects().length > 0);

      const first = controls[0];
      const last = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }, true);

  // 返回锁屏时同时关闭 Instagram
  new MutationObserver(() => {
    if (!app.hidden && !phone.classList.contains("is-unlocked")) {
      closeInstagram();
    }
  }).observe(phone, {
    attributes: true,
    attributeFilter: ["class"]
  });
  // 首页帖子资料
const instagramPosts = window.INSTAGRAM_POSTS || [];

// 点赞、收藏按剧情线和登录账号分别记录
const instagramLikedPosts = new Set();
const instagramSavedPosts = new Set();

const instagramPostIcons = {
  like: `
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1
             a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6
             a5.5 5.5 0 0 0 0-7.8Z"/>
  `,
  comment: `
    <path d="M21 11.5a9 9 0 0 1-9 9
             10 10 0 0 1-4-.8L3 21l1.3-4.5
             A9 9 0 1 1 21 11.5Z"/>
  `,
  repost: `
    <path d="M4 10V7a2 2 0 0 1 2-2h12l-3-3
             M18 5l-3 3M20 14v3a2 2 0 0 1-2 2H6l3 3
             M6 19l3-3"/>
  `,
  share: icons.messages,
  save: `<path d="M5 3h14v19l-7-5-7 5Z"/>`
};

function instagramPostStateKey(post) {
  return `${storyKey()}:${currentAccount().id}:${post.id}`;
}

function renderInstagramHome() {
    renderInstagramStories();
  const posts = instagramPosts.filter((post) => {
    return (
      (!post.story || post.story === storyKey()) &&
      (!post.accountId || post.accountId === currentAccount().id)
    );
  });

  if (!posts.length) {
    const empty = document.createElement("section");
    empty.innerHTML = `
      <section class="ig-empty">
        <h2>暂无动态</h2>
        <p>之后在帖子资料中添加内容</p>
      </section>
    `;
    content.appendChild(empty);
    return;
  }

  posts.forEach((post) => {
    const key = instagramPostStateKey(post);
    const card = document.createElement("article");
    card.className = "ig-post";
    card.dataset.postId = post.id;

    const header = document.createElement("header");
    header.className = "ig-post-header";

    const avatar = document.createElement("img");
    avatar.src =
      post.avatar || "./assets/avatars/default-avatar.png";
    avatar.alt = "";

    const authorInfo = document.createElement("div");
authorInfo.className = "ig-post-author-info";

const authorLine = document.createElement("div");
authorLine.className = "ig-post-author-line";

const username = document.createElement("strong");
username.textContent = post.username;

authorLine.appendChild(username);

if (post.verified) {
  const badge = document.createElement("span");
  badge.className = "ig-verified-badge";
  badge.setAttribute("role", "img");
  badge.setAttribute("aria-label", "已认证");

  badge.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path class="ig-verified-shape" d="
        m12 1 2.5 2 3.2-.2 1 3.1 2.8 1.7-.8 3.1
        1.3 2.9-2.3 2.2-.3 3.2-3.2.5L13.8 23
        12 21.5 9.3 23l-1.6-2.8-3.2-.5-.3-3.2
        L2 14.3 3.3 11.4 2.5 8.3 5.3 6.6 6.3 3.5
        9.5 3.7Z
      "/>
      <path class="ig-verified-tick" d="m7.5 12 3 3 6-6"/>
    </svg>
  `;

  authorLine.appendChild(badge);
}

authorInfo.appendChild(authorLine);

const secondaryItems = [];

if (post.music) {
  secondaryItems.push({ icon: "♫", text: post.music });
}

if (post.location) {
  secondaryItems.push({ icon: "", text: post.location });
}

if (secondaryItems.length) {
  const subtitle = document.createElement("div");
  subtitle.className = "ig-post-subtitle";

  const symbol = document.createElement("span");
  symbol.className = "ig-post-music-note";
  symbol.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");

  subtitle.append(symbol, text);
  authorInfo.appendChild(subtitle);

  let secondaryIndex = 0;

  function updateSubtitle() {
    const item = secondaryItems[secondaryIndex];

    symbol.textContent = item.icon;
    symbol.hidden = !item.icon;
    text.textContent = item.text;
  }

  updateSubtitle();

  if (secondaryItems.length > 1) {
    const timer = window.setInterval(() => {
      if (
        !subtitle.isConnected ||
        app.hidden ||
        activePage !== "home"
      ) {
        window.clearInterval(timer);
        return;
      }

      // 切换账号面板打开时暂停轮换
      if (!accountOverlay.hidden || document.hidden) return;

      secondaryIndex =
        (secondaryIndex + 1) % secondaryItems.length;

      updateSubtitle();
    }, 3000);
  }
}

    const more = document.createElement("button");
    more.type = "button";
    more.className = "ig-post-more";
    more.innerHTML = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 8h16M4 15h11"/>
  </svg>
`;
    more.setAttribute("aria-label", "帖子更多选项");

    header.append(avatar, authorInfo, more);
    card.appendChild(header);

    card.appendChild(createInstagramPostGallery(post));

    const actions = document.createElement("div");
    actions.className = "ig-post-actions";
    const leftActions = document.createElement("div");
    leftActions.className = "ig-post-actions-left";
    actions.appendChild(leftActions);

    

    Object.entries(instagramPostIcons).forEach(([action, svg]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.postAction = action;

  const labels = {
    like: "点赞",
    comment: "评论",
    repost: "转发",
    share: "分享",
    save: "收藏"
  };

  button.setAttribute("aria-label", labels[action]);
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">${svg}</svg>
  `;

  const countFields = {
    like: "likes",
    comment: "comments",
    repost: "reposts",
    share: "shares"
  };

  let countLabel = null;

  if (countFields[action]) {
    countLabel = document.createElement("span");
    countLabel.className = "ig-post-action-count";
    button.appendChild(countLabel);
  }

  function updateCount() {
    if (!countLabel) return;

    const base = Math.max(
      0,
      Math.floor(Number(post[countFields[action]]) || 0)
    );

    const count = base + Number(
      action === "like" && instagramLikedPosts.has(key)
    );

    countLabel.textContent = ["like", "repost"].includes(action)
  ? formatInstagramCount(count)
  : count.toLocaleString("zh-CN");
    button.setAttribute(
      "aria-label",
      `${labels[action]}，${count.toLocaleString("zh-CN")}`
    );
  }

  updateCount();

  if (action === "like" || action === "save") {
    const state = action === "like"
      ? instagramLikedPosts
      : instagramSavedPosts;

    function updateButton() {
      button.setAttribute("aria-pressed", String(state.has(key)));
    }

    updateButton();

    button.addEventListener("click", () => {
      if (state.has(key)) {
        state.delete(key);
      } else {
        state.add(key);
      }

      updateButton();
      updateCount();
      status.textContent = "";
    });
  } else {
    button.addEventListener("click", () => {
      status.textContent = `${labels[action]}功能后续连接`;
    });
  }

  if (action === "save") {
  actions.appendChild(button);
} else {
  leftActions.appendChild(button);
}
});

    const caption = document.createElement("p");
    caption.className = "ig-post-caption";

    const author = document.createElement("strong");
    author.textContent = post.username;

   function updatePhotoCaption(index) {
  const specificCaption = Array.isArray(post.captions)
    ? post.captions[index]
    : undefined;

  // 没设置对应文案时使用默认文案；空字符串则隐藏
  const value = String(
    specificCaption ?? post.caption ?? ""
  );

  caption.replaceChildren();
  caption.hidden = !value.trim();

  if (!caption.hidden) {
    caption.append(
      author,
      document.createTextNode(` ${value}`)
    );
  }
}

// 初始显示第一张照片的文案
updatePhotoCaption(0);

card.addEventListener("ig-photo-change", (event) => {
  updatePhotoCaption(event.detail.index);
});

    const time = document.createElement("p");
    time.className = "ig-post-time";
    time.textContent = post.time || "";

    const status = document.createElement("p");
    status.className = "ig-post-status";
    status.setAttribute("role", "status");

    more.addEventListener("click", () => {
  if (post.username === currentAccount().username) {
    openOwnPostMenu(post, more, card);
  } else {
    status.textContent = "其他人的帖子菜单待连接";
  }
});
   card.append(actions, caption, time, status);
    content.appendChild(card);
  });
}
function formatInstagramCount(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}百万`;
  }

  if (value >= 10000) {
    return `${(value / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  }

  return value.toLocaleString("zh-CN");
}
function renderInstagramProfile() {
  const account = currentAccount();
  app.querySelector(".ig-profile-account-name").textContent =
  account.username;

  const posts = instagramPosts.filter((post) => {
    return (
      post.username === account.username &&
      (!post.story || post.story === storyKey()) &&
      (!post.accountId || post.accountId === account.id)
    );
  });

  const profile = document.createElement("section");
  profile.className = "ig-personal-profile";

  profile.innerHTML = `
    <div class="ig-personal-top">
      <img class="ig-personal-avatar" alt="个人头像">

      <div class="ig-personal-information">
        <strong class="ig-personal-name"></strong>

        <div class="ig-personal-stats">
          <div><strong data-profile-posts></strong><small>篇帖子</small></div>
          <div><strong data-profile-followers></strong><small>位粉丝</small></div>
          <div><strong data-profile-following></strong><small>关注</small></div>
        </div>
      </div>
    </div>

    <p class="ig-personal-bio"></p>

    <div class="ig-personal-buttons">
      <button type="button" disabled>编辑主页</button>
      <button type="button" disabled>分享主页</button>
    </div>

    <nav class="ig-personal-tabs" aria-label="个人主页内容">
  <button type="button" data-profile-tab="posts"
          aria-label="帖子" aria-pressed="true">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3h18v18H3ZM9 3v18M15 3v18M3 9h18M3 15h18"/>
    </svg>
  </button>

  <button type="button" data-profile-tab="reels"
          aria-label="Reels" aria-pressed="false">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5"/>
      <path d="m10 8 7 4-7 4Z"/>
    </svg>
  </button>

  <button type="button" data-profile-tab="tagged"
          aria-label="被标记的帖子" aria-pressed="false">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4 10 2h4l2 2h4v18H4V4Z"/>
      <circle cx="12" cy="10" r="3"/>
      <path d="M6 21a6 6 0 0 1 12 0"/>
    </svg>
  </button>
</nav>

    <div class="ig-personal-grid"></div>
  `;

  profile.querySelector(".ig-personal-avatar").src =
    account.avatar || "./assets/avatars/default-avatar.png";

  profile.querySelector(".ig-personal-name").textContent =
    account.name || account.username;

  profile.querySelector(".ig-personal-bio").textContent =
    account.bio || "";

  profile.querySelector("[data-profile-posts]").textContent =
    posts.length;

  profile.querySelector("[data-profile-followers]").textContent =
    formatInstagramFollowers(account.followers);

  profile.querySelector("[data-profile-following]").textContent =
    formatInstagramCount(Math.max(0, Number(account.following) || 0));

  const grid = profile.querySelector(".ig-personal-grid");

function renderProfileGrid(tab) {
  grid.replaceChildren();

  profile.querySelectorAll("[data-profile-tab]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.profileTab === tab)
    );
  });

  let displayedPosts;

  if (tab === "tagged") {
    displayedPosts = instagramPosts.filter((post) => {
      return (
        Array.isArray(post.taggedUsers) &&
        post.taggedUsers.includes(account.username) &&
        (!post.story || post.story === storyKey()) &&
        (!post.accountId || post.accountId === account.id)
      );
    });
  } else if (tab === "reels") {
    displayedPosts = posts.filter((post) => post.type === "reel");
  } else {
    displayedPosts = posts;
  }

  displayedPosts.forEach((post) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ig-personal-post";
    button.setAttribute("aria-label", post.caption || "查看帖子");

    const cover = getInstagramPostImages(post)[0];

    if (cover) {
      const image = document.createElement("img");
      image.src = cover;
      image.alt = post.caption || "帖子图片";
      image.loading = "lazy";
      button.appendChild(image);
    } else {
      button.appendChild(document.createTextNode("待添加封面"));
    }

    if (post.type === "reel") {
      const mark = document.createElement("span");
      mark.className = "ig-personal-reel-mark";
      mark.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          ${icons.reels}
        </svg>
      `;
      button.appendChild(mark);
    }

    button.addEventListener("click", () => {
      renderPage("home");

      const target = [...content.querySelectorAll(".ig-post")]
        .find((card) => card.dataset.postId === post.id);

      if (target) {
        content.scrollTop = 0;
        content.scrollTop =
          target.getBoundingClientRect().top -
          content.getBoundingClientRect().top;
      }
    });

    grid.appendChild(button);
  });

  if (!displayedPosts.length) {
    const empty = document.createElement("p");
    empty.className = "ig-personal-empty";

    const messages = {
      posts: "尚未添加帖子",
      reels: "尚未添加 Reels",
      tagged: "暂无被标记的帖子"
    };

    empty.textContent = messages[tab];
    grid.appendChild(empty);
  }
}

profile.querySelectorAll("[data-profile-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    renderProfileGrid(button.dataset.profileTab);
  });
});

renderProfileGrid("posts");

  content.appendChild(profile);
}
// 同时兼容单图 image 和多图 images
function getInstagramPostImages(post) {
  if (Array.isArray(post.images) && post.images.length) {
    return post.images.filter((src) => typeof src === "string" && src);
  }

  return post.image ? [post.image] : [];
}

// 根据文件后缀判断是否为视频，兼容大写 MP4
function isInstagramVideo(src) {
  return /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(src);
}

// 暂停 Instagram 中正在播放的视频
function pauseInstagramVideos() {
  app.querySelectorAll("video").forEach(video => {
    video.pause();
  });
}
function createInstagramPostGallery(post) {
  const images = getInstagramPostImages(post);

  if (!images.length) {
    const placeholder = document.createElement("div");
    placeholder.className = "ig-post-image-placeholder";
    placeholder.textContent = "帖子图片";
    return placeholder;
  }

  const gallery = document.createElement("div");
  gallery.className = "ig-post-gallery";

  const track = document.createElement("div");
  track.className = "ig-post-gallery-track";
  track.setAttribute("aria-label", "帖子图片，可左右滑动");

  images.forEach((src, index) => {
  const slide = document.createElement("div");
  slide.className = "ig-post-gallery-slide";

  if (isInstagramVideo(src)) {
    const video = document.createElement("video");

    video.className = "ig-post-video";
    video.src = src;

    // 显示播放、进度和音量控制
    video.controls = false;
    video.muted = false;
    video.volume = 1;
    video.loop = true;

    // 自动播放被浏览器拦截时，可以点击播放
   
    // 手机中尽量在帖子内播放
    video.playsInline = true;

    // 不自动播放，只预先读取基本信息
    video.preload = "metadata";

    video.setAttribute(
      "aria-label",
      `第 ${index + 1} 项，视频`
    );

    // 播放这个视频时，暂停其他视频
    video.addEventListener("play", () => {
      app.querySelectorAll("video").forEach(other => {
        if (other !== video) other.pause();
      });
    });

    slide.appendChild(video);
  } else {
    const image = document.createElement("img");

    image.src = src;
    image.alt = `${post.caption || "帖子图片"}，第 ${
      index + 1
    } 项，共 ${images.length} 项`;

    image.loading = "lazy";
    image.draggable = false;

    slide.appendChild(image);
  }

  track.appendChild(slide);
});

// 只播放当前显示的视频
let activeVideoIndex = -1;

function updateGalleryVideo() {
  if (!track.clientWidth) return;

  const index = Math.round(
    track.scrollLeft / track.clientWidth
  );

  if (index === activeVideoIndex) return;
  activeVideoIndex = index;

  track.querySelectorAll("video").forEach(video => {
    const slide = video.closest(".ig-post-gallery-slide");

    if (slide === track.children[index]) {
      video.muted = false;
      video.play().catch(() => {
        // 浏览器限制有声自动播放时，点击视频即可播放
      });
    } else {
      video.pause();
    }
  });
}

track.addEventListener("scroll", updateGalleryVideo);

// 第一项就是视频时，也尝试播放
requestAnimationFrame(updateGalleryVideo);

  gallery.appendChild(track);
  // 电脑鼠标拖动切图
let mouseDrag = null;

track.addEventListener("pointerdown", (event) => {
    
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  if (!track.clientWidth) return;

  event.preventDefault();

  mouseDrag = {
    x: event.clientX,
    y: event.clientY,
    scrollLeft: track.scrollLeft,
    width: track.clientWidth,
    index: Math.round(track.scrollLeft / track.clientWidth)
  };

  track.classList.add("is-dragging");
  track.setPointerCapture(event.pointerId);
});

track.addEventListener("pointermove", (event) => {
  if (!mouseDrag) return;

  track.scrollLeft =
    mouseDrag.scrollLeft - (event.clientX - mouseDrag.x);
});

function finishGalleryDrag(event, cancelled = false) {
  if (!mouseDrag) return;

  const drag = mouseDrag;
  mouseDrag = null;

  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;

  let target = drag.index;
  const threshold = Math.min(45, drag.width * 0.15);

  if (!cancelled && Math.abs(dx) > threshold &&
      Math.abs(dx) > Math.abs(dy)) {
    target += dx < 0 ? 1 : -1;
  }

  target = Math.max(0, Math.min(images.length - 1, target));

  track.classList.remove("is-dragging");

  if (track.hasPointerCapture(event.pointerId)) {
    track.releasePointerCapture(event.pointerId);
  }

  track.scrollTo({
    left: target * track.clientWidth,
    behavior: "smooth"
  });
}

track.addEventListener("pointerup", (event) => {
  // 鼠标由容器捕获，所以在这里判断点击还是拖动
  const wasClick = mouseDrag &&
    Math.abs(event.clientX - mouseDrag.x) < 6 &&
    Math.abs(event.clientY - mouseDrag.y) < 6;

  finishGalleryDrag(event);

  if (!wasClick || !track.clientWidth) return;

  const index = Math.round(
    track.scrollLeft / track.clientWidth
  );

  const video = track.children[index]?.querySelector("video");

  if (!video) return;

  if (video.paused) {
    video.muted = false;

    video.play().catch(error => {
      console.error("视频播放失败：", video.currentSrc, error);

      if (error.name === "NotSupportedError") {
        alert("视频无法解码，请检查文件是否使用 H.264 编码。");
      } else if (error.name === "NotAllowedError") {
        alert("浏览器阻止了播放，请检查此网站的声音或自动播放权限。");
      }
    });
  } else {
    video.pause();
  }
});

track.addEventListener("pointercancel", (event) => {
  finishGalleryDrag(event, true);
});

track.addEventListener("lostpointercapture", () => {
  if (!mouseDrag) return;

  const target = mouseDrag.index;
  mouseDrag = null;
  track.classList.remove("is-dragging");

  track.scrollTo({
    left: target * track.clientWidth,
    behavior: "smooth"
  });
});

  if (images.length === 1) return gallery;

  const counter = document.createElement("span");
  counter.className = "ig-post-gallery-counter";
  counter.textContent = `1/${images.length}`;

  const dots = document.createElement("div");
  dots.className = "ig-post-gallery-dots";

  let currentIndex = 0;

  function goToImage(index) {
    const next = Math.max(0, Math.min(images.length - 1, index));

    track.scrollTo({
      left: next * track.clientWidth,
      behavior: "smooth"
    });
  }

  images.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `查看第 ${index + 1} 张图片`);
    dot.setAttribute("aria-pressed", String(index === 0));
    dot.addEventListener("click", () => goToImage(index));
    dots.appendChild(dot);
  });

  track.addEventListener("scroll", () => {
    if (!track.clientWidth) return;

    currentIndex = Math.max(
      0,
      Math.min(
        images.length - 1,
        Math.round(track.scrollLeft / track.clientWidth)
      )
    );

    counter.textContent = `${currentIndex + 1}/${images.length}`;
    gallery.dispatchEvent(new CustomEvent("ig-photo-change", {
       bubbles: true,
       detail: { index: currentIndex }
    }));

    [...dots.children].forEach((dot, index) => {
      dot.setAttribute(
        "aria-pressed",
        String(index === currentIndex)
      );
    });
  });

  // 电脑预览也能用左右按钮切换
  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "ig-post-gallery-arrow ig-gallery-previous";
  previous.textContent = "‹";
  previous.setAttribute("aria-label", "上一张图片");
  previous.addEventListener("click", () => goToImage(currentIndex - 1));

  const next = document.createElement("button");
  next.type = "button";
  next.className = "ig-post-gallery-arrow ig-gallery-next";
  next.textContent = "›";
  next.setAttribute("aria-label", "下一张图片");
  next.addEventListener("click", () => goToImage(currentIndex + 1));

  gallery.append(counter, previous, next, dots);
  return gallery;
}
// 首页顶部
const igHeader = app.querySelector(".ig-header");
const igBrand = app.querySelector(".ig-brand");

const igCreateButton = document.createElement("button");
igCreateButton.type = "button";
igCreateButton.className = "ig-header-create";
igCreateButton.setAttribute("aria-label", "创建");
igCreateButton.innerHTML = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v18M3 12h18"/>
  </svg>
`;

const igActivityButton = document.createElement("button");
igActivityButton.type = "button";
igActivityButton.className = "ig-header-activity";
igActivityButton.setAttribute("aria-label", "通知");
igActivityButton.innerHTML = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    ${instagramPostIcons.like}
  </svg>
`;

igHeader.prepend(igCreateButton);
igHeader.appendChild(igActivityButton);

const igHomeDropdown = document.createElement("button");
igHomeDropdown.type = "button";
igHomeDropdown.className = "ig-home-dropdown";
igHomeDropdown.setAttribute("aria-label", "切换账号");
igHomeDropdown.innerHTML = `
  <span>Instagram</span>
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="m4 6 4 4 4-4"/>
  </svg>
`;

igBrand.after(igHomeDropdown);

// 暂时沿用现有的大小号切换
igHomeDropdown.addEventListener("click", openAccounts);

igCreateButton.addEventListener("click", () => {
  igHomeNotice.textContent = "创建功能后续连接";
});

igActivityButton.addEventListener("click", () => {
  igHomeNotice.textContent = "通知页面后续连接";
});

const igHomeNotice = document.createElement("p");
igHomeNotice.className = "ig-home-notice";
igHomeNotice.setAttribute("role", "status");
function renderInstagramStories() {
  const account = currentAccount();

  const strip = document.createElement("div");
  strip.className = "ig-stories";
  // 鼠标拖动快拍栏
let storyDrag = null;
let suppressStoryClick = false;

strip.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0) return;

  storyDrag = {
    x: event.clientX,
    scrollLeft: strip.scrollLeft,
    dragging: false
  };

  suppressStoryClick = false;
});

strip.addEventListener("pointermove", (event) => {
  if (!storyDrag) return;

  const distance = event.clientX - storyDrag.x;

  if (!storyDrag.dragging && Math.abs(distance) > 5) {
    storyDrag.dragging = true;
    suppressStoryClick = true;
    strip.setPointerCapture(event.pointerId);
    strip.classList.add("is-dragging");
  }

  if (storyDrag.dragging) {
    event.preventDefault();
    strip.scrollLeft = storyDrag.scrollLeft - distance;
  }
});

function finishStoryDrag(event) {
  storyDrag = null;
  strip.classList.remove("is-dragging");

  if (strip.hasPointerCapture(event.pointerId)) {
    strip.releasePointerCapture(event.pointerId);
  }
}

strip.addEventListener("pointerup", finishStoryDrag);
strip.addEventListener("pointercancel", finishStoryDrag);

strip.addEventListener("pointerleave", () => {
  if (!storyDrag?.dragging) storyDrag = null;
});

strip.addEventListener("lostpointercapture", () => {
  storyDrag = null;
  strip.classList.remove("is-dragging");
});

// 拖动结束时，不误触打开快拍
strip.addEventListener("click", (event) => {
  if (!suppressStoryClick) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  suppressStoryClick = false;
}, true);

  const stories = [
    {
      username: "你的快拍",
      avatar: account.avatar || "",
      mine: true
    },
    ...(window.INSTAGRAM_STORIES || []).filter((story) => {
      return (
        (!story.story || story.story === storyKey()) &&
        (!story.accountId || story.accountId === account.id)
      );
    })
  ];

  stories.forEach((story) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ig-story${story.mine ? " is-mine" : ""}`;

    const ring = document.createElement("span");
    ring.className = "ig-story-ring";

    const avatar = document.createElement("img");
    avatar.src =
      story.avatar || "./assets/avatars/default-avatar.png";
    avatar.alt = "";

    ring.appendChild(avatar);

    if (story.mine) {
      const plus = document.createElement("span");
      plus.className = "ig-story-plus";
      plus.textContent = "+";
      ring.appendChild(plus);
    }

    const name = document.createElement("span");
    name.className = "ig-story-name";
    name.textContent = story.username;

    button.append(ring, name);

    button.addEventListener("click", () => {
      igHomeNotice.textContent = story.mine
        ? "发布快拍功能后续连接"
        : `${story.username} 的快拍内容后续连接`;
    });

    strip.appendChild(button);
  });

  igHomeNotice.textContent = "";
  content.append(strip, igHomeNotice);
}
// 自己的帖子菜单
const ownPostMenu = document.createElement("div");
ownPostMenu.className = "ig-own-menu-overlay";
ownPostMenu.hidden = true;

ownPostMenu.innerHTML = `
  <section
    class="ig-own-menu-sheet"
    role="dialog"
    aria-modal="true"
    aria-label="帖子选项"
  >
    <div class="ig-own-menu-handle"></div>
    <div class="ig-own-menu-list"></div>
    <p class="ig-own-menu-notice" role="status"></p>
  </section>
`;

app.appendChild(ownPostMenu);

let ownPostMenuTrigger = null;

const ownMenuPaths = {
  save: "M6 3h12v18l-6-4-6 4Z",
  remix: `
  M9 4H5a2 2 0 0 0-2 2v5
  M3 15v3a2 2 0 0 0 2 2h6
  M15 20h4a2 2 0 0 0 2-2v-5
  M21 9V6a2 2 0 0 0-2-2h-6
  M7 8h10
  m-3-3 3 3-3 3
  M17 16H7
  m3-3-3 3 3 3
`,
  scissors: `
  M8.5 16.5
  a3 3 0 1 1-6 0
  a3 3 0 1 1 6 0
  M21.5 16.5
  a3 3 0 1 1-6 0
  a3 3 0 1 1 6 0
  M7.3 14.1 17.5 3
  M16.7 14.1 6.5 3
  M12 10.3v.1
`,
  facebook: `
  M21.5 12
  a9.5 9.5 0 1 1-19 0
  a9.5 9.5 0 1 1 19 0
  M13.5 21V12h3l.5-3h-3.5V7.5
  c0-1.1.5-1.5 1.5-1.5h2V3.5
  M10 21V12H8V9h2V7.5
  c0-2.8 1.7-4.2 4.5-4.2
  H17
`,
  chart: "M3 12h5v9H3ZM10 3h5v18h-5ZM17 8h4v13h-4Z",
  reuse: "m8 8 8 8M16 8l-8 8",
  archive: "M4 8a9 9 0 1 1-1 8M4 3v5h5M12 7v6l-3 2",
  heart: "M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 2 11 8 15 6-4 13-10 8-15ZM3 3l18 18",
  share: "m3 10 18-7-7 18-4-8-7-3ZM10 13l6-6M3 3l18 18",
  comment: "M20 15a9 9 0 1 0-5 5l6 1-1-6M3 3l18 18",
  edit: "m4 16 12-12 4 4L8 20H4ZM14 6l4 4",
  crop: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5",
  pin: "m14 3 7 7-5 1-4 5-1 5-3-8-5-3 5-1Z",
  qr: "M3 3h6v6H3ZM15 3h6v6h-6ZM3 15h6v6H3ZM15 15h2v2h-2ZM19 15h2v6h-6v-2",
  trash: "M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"
};

const ownPostMenuGroups = [
  [
    ["save", "收藏"],
    ["remix", "合拍"]
  ],
  [
    ["scissors", "创建抠图贴图"]
  ],
  [
    ["facebook", "分享到 Facebook"],
    ["chart", "成效分析"],
    ["reuse", "关闭再利用"],
    ["archive", "收入私密文件夹"],
    ["heart", "隐藏获赞数"],
    ["share", "隐藏分享次数"],
    ["comment", "关闭评论功能"],
    ["edit", "编辑"],
    ["crop", "调整预览"],
    ["pin", "在主网格中置顶"],
    ["qr", "二维码"],
    ["trash", "删除"]
  ]
];

function closeOwnPostMenu() {
  if (ownPostMenu.hidden) return;

  ownPostMenu.hidden = true;

  if (ownPostMenuTrigger?.isConnected) {
    ownPostMenuTrigger.focus();
  }
}

function openOwnPostMenu(post, trigger, card) {
  ownPostMenuTrigger = trigger;

  const list = ownPostMenu.querySelector(".ig-own-menu-list");
  const notice = ownPostMenu.querySelector(".ig-own-menu-notice");

  list.replaceChildren();
  notice.textContent = "";

  ownPostMenuGroups.forEach(items => {
    const group = document.createElement("div");
    group.className = "ig-own-menu-group";

    items.forEach(([action, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ig-own-menu-row";

      if (action === "trash") {
        button.classList.add("is-danger");
      }

      const saved = instagramSavedPosts.has(
        instagramPostStateKey(post)
      );

      const displayedLabel =
        action === "save" && saved ? "取消收藏" : label;

      button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="${ownMenuPaths[action]}"></path>
        </svg>
        <span>${displayedLabel}</span>
        ${
          action === "facebook"
            ? '<span class="ig-own-menu-chevron">›</span>'
            : ""
        }
      `;

      button.addEventListener("click", () => {
        if (action === "save") {
          card.querySelector('[data-post-action="save"]')?.click();
          closeOwnPostMenu();
          return;
        }

        notice.textContent = `“${label}”功能待连接`;
      });

      group.appendChild(button);
    });

    list.appendChild(group);
  });

  ownPostMenu.hidden = false;
  list.scrollTop = 0;
  list.querySelector("button")?.focus();
}

ownPostMenu.addEventListener("click", event => {
  if (event.target === ownPostMenu) {
    closeOwnPostMenu();
  }
});
// 个人主页顶部栏
const profileHeader = document.createElement("div");
profileHeader.className = "ig-profile-header";

profileHeader.innerHTML = `
  <button
    type="button"
    class="ig-profile-create"
    aria-label="创建"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v16M4 12h16"/>
    </svg>
  </button>

  <button
    type="button"
    class="ig-profile-account"
    aria-label="切换账号"
  >
    <span class="ig-profile-account-name"></span>
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 6 4 4 4-4"/>
    </svg>
  </button>

  

  <button
    type="button"
    class="ig-profile-menu"
    aria-label="个人主页菜单"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  </button>
`;

app.querySelector(".ig-header").appendChild(profileHeader);

profileHeader.querySelector(".ig-profile-account")
  .addEventListener("click", openAccounts);

// 这三个入口先显示提示，后续逐个连接
profileHeader.querySelector(".ig-profile-create")
  .addEventListener("click", () => {
    showProfileHeaderNotice("创建功能待连接");
  });


profileHeader.querySelector(".ig-profile-menu")
  .addEventListener("click", () => {
    showProfileHeaderNotice("个人主页菜单待连接");
  });

function showProfileHeaderNotice(text) {
  let notice = content.querySelector(".ig-profile-header-notice");

  if (!notice) {
    notice = document.createElement("p");
    notice.className = "ig-profile-header-notice";
    notice.setAttribute("role", "status");
    content.prepend(notice);
  }

  notice.textContent = text;
}
// 主页粉丝数统一使用“万”
function formatInstagramFollowers(value) {
  const count = Math.max(0, Math.floor(Number(value) || 0));

  if (count >= 10000) {
    return (count / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  }

  return count.toLocaleString("zh-CN");
}
// 评论面板
const commentOverlay = document.createElement("div");
commentOverlay.className = "ig-comments-overlay";
commentOverlay.hidden = true;

commentOverlay.innerHTML = `
  <section class="ig-comments-sheet"
           role="dialog"
           aria-modal="true"
           aria-label="评论">
    <div class="ig-comments-handle"></div>

    <header class="ig-comments-header">
      <strong>评论</strong>
      <button type="button"
              class="ig-comments-close"
              aria-label="关闭评论">×</button>
    </header>

    <div class="ig-comments-list"></div>
  </section>
`;

app.appendChild(commentOverlay);

const likedComments = new Set();
let commentTrigger = null;

function closeInstagramComments(restoreFocus = true) {
  if (commentOverlay.hidden) return;

  commentOverlay.hidden = true;

  if (restoreFocus && commentTrigger?.isConnected) {
    commentTrigger.focus();
  }
}

function openInstagramComments(post, trigger) {
  pauseInstagramVideos();
  closeOwnPostMenu();
  closeAccounts();

  commentTrigger = trigger;

  const list = commentOverlay.querySelector(".ig-comments-list");
  list.replaceChildren();

  const comments = Array.isArray(post.commentList)
    ? post.commentList
    : [];

  function createComment(item, path, isReply = false) {
    const row = document.createElement("div");
    row.className = "ig-comment-row";

    if (isReply) row.classList.add("is-reply");

    const avatar = document.createElement("img");
    avatar.src =
      item.avatar || "./assets/avatars/default-avatar.png";
    avatar.alt = "";
    avatar.draggable = false;

    const body = document.createElement("div");
    body.className = "ig-comment-body";

    const heading = document.createElement("div");
    heading.className = "ig-comment-heading";

    const username = document.createElement("strong");
    username.textContent = item.username || "";

    const time = document.createElement("span");
    time.textContent = item.time || "";

    heading.append(username, time);

    const text = document.createElement("p");
    text.textContent = item.text || "";

    body.append(heading, text);

    const like = document.createElement("button");
    like.type = "button";
    like.className = "ig-comment-like";

    const key = `${instagramPostStateKey(post)}:comment:${path}`;
    const base = Math.max(0, Math.floor(Number(item.likes) || 0));

    function updateLike() {
      const selected = likedComments.has(key);

      like.setAttribute("aria-pressed", String(selected));
      like.setAttribute(
        "aria-label",
        selected ? "取消评论点赞" : "点赞评论"
      );

      like.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          ${instagramPostIcons.like}
        </svg>
        <span>${formatInstagramCount(base + Number(selected))}</span>
      `;
    }

    updateLike();

    like.addEventListener("click", () => {
      if (likedComments.has(key)) {
        likedComments.delete(key);
      } else {
        likedComments.add(key);
      }

      updateLike();
    });

    row.append(avatar, body, like);

    const wrapper = document.createElement("div");
    wrapper.appendChild(row);

    const replies = Array.isArray(item.replies)
      ? item.replies
      : [];

    if (replies.length && !isReply) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "ig-comment-replies-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = `查看 ${replies.length} 条回复`;

      const repliesBox = document.createElement("div");
      repliesBox.className = "ig-comment-replies";
      repliesBox.hidden = true;

      replies.forEach((reply, index) => {
        repliesBox.appendChild(
          createComment(reply, `${path}/reply-${index}`, true)
        );
      });

      toggle.addEventListener("click", () => {
        repliesBox.hidden = !repliesBox.hidden;

        toggle.setAttribute(
          "aria-expanded",
          String(!repliesBox.hidden)
        );

        toggle.textContent = repliesBox.hidden
          ? `查看 ${replies.length} 条回复`
          : "收起回复";
      });

      wrapper.append(toggle, repliesBox);
    }

    return wrapper;
  }

  comments.forEach((item, index) => {
    list.appendChild(createComment(item, String(index)));
  });

  if (!comments.length) {
    const empty = document.createElement("p");
    empty.className = "ig-comments-empty";
    empty.textContent = "暂无评论";
    list.appendChild(empty);
  }

  commentOverlay.hidden = false;
  list.scrollTop = 0;

  commentOverlay.querySelector(".ig-comments-close").focus();
}

commentOverlay.querySelector(".ig-comments-close")
  .addEventListener("click", () => closeInstagramComments());

commentOverlay.addEventListener("click", event => {
  if (event.target === commentOverlay) {
    closeInstagramComments();
  }
});
})();