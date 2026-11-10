(async () => {
  if (document.getElementById("instagram-app")) return;
  const igPlusCache = new Map();
  let igPlusDatabase = null;
  try {
    igPlusDatabase = await new Promise((resolve, reject) => {
      const req = indexedDB.open("pickphone-instagram", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("accounts");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      const req = igPlusDatabase.transaction("accounts").objectStore("accounts").openCursor();
      req.onsuccess = () => { const cur = req.result; if(cur){igPlusCache.set(cur.key,cur.value);cur.continue();}else resolve(); };
      req.onerror = () => reject(req.error);
    });
  } catch (error) { console.warn("IG local storage unavailable", error); }

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
  const base =
    accounts.find(account =>
      account.id === selectedAccounts[storyKey()]
    ) || accounts[0];

  const saved =
    igPlusCache.get(`${storyKey()}:${base.id}`)?.profile || {};

  const username = saved.username || base.username;

  const configured = (window.INSTAGRAM_USERS || []).find(user =>
    user.username === username &&
    (!user.story || user.story === storyKey()) &&
    (!user.accountId || user.accountId === base.id)
  ) || {};

  return {
    ...base,
    ...configured,
    ...saved,
    id: base.id,
    followers: configured.followers ?? saved.followers ?? base.followers,
    following: configured.following ?? saved.following ?? base.following,
    followingUsers: configured.followingUsers ?? base.followingUsers
  };
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
    closePlusProfile(true);
    if (!storyViewer.hidden) closeStoryViewer(false);
    closePlusModal(false);
    plusStopReels();
    syncPlusPosts();
    closeInstagramComments(false);
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
if (page === "messages") { renderStoryInbox(); return; }
if (page === "search") { renderPlusSearch(); return; }
if (page === "reels") { renderPlusReels(); return; }
if (page === "settings") { renderPlusSettings(); return; }
if (page === "activity") { renderPlusActivity(); return; }
if (page === "saved" || page === "archive" || page === "trash") { renderPlusCollection(page); return; }

    renderInstagramHome();
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
      button.querySelector("small").textContent = account.name || account.username;
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
    closePlusProfile(true);
    closePlusModal();
    plusStopReels();
    closeStoryComposer(false);
    closeStoryViewer(false);
    closeInstagramComments(false);
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
      if (!plusModal.hidden) {
        event.preventDefault(); event.stopImmediatePropagation(); closePlusModal(); return;
      }
      if (!plusProfileLayer.hidden && plusModal.hidden) {
        event.preventDefault(); event.stopImmediatePropagation(); closePlusProfile(); return;
      }
      if (!storyComposer.hidden) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!igcPanel.hidden) closeComposerPanel();
        else closeStoryComposer();
        return;
      }
      if (!storyViewer.hidden) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (!storyPanel.hidden) closeStoryPanel();
        else closeStoryViewer();

        return;
      }
      if (!commentOverlay.hidden) {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeInstagramComments();
            return;
          }
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
      const scope = !plusModal.hidden ? plusModal : !plusProfileLayer.hidden ? plusProfileLayer : !storyComposer.hidden
        ? (igcPanel.hidden ? storyComposer : igcPanel)
        : !storyViewer.hidden
        ? (storyPanel.hidden ? storyViewer : storyPanel)
        : !commentOverlay.hidden
        ? commentOverlay
        : !ownPostMenu.hidden
            ? ownPostMenu
            : accountOverlay.hidden
              ? app
              : accountOverlay;
      const controls = [...scope.querySelectorAll("button:not(:disabled), input, textarea, select")]
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
const instagramBasePosts = window.INSTAGRAM_POSTS || [];
let instagramPosts = [...instagramBasePosts];

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
  const posts = plusVisiblePosts();

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
    header.dataset.author = post.username;

    const avatar = document.createElement("img");
    avatar.src =
      resolveInstagramUserAvatar(post.username, post.avatar);
    avatar.alt = "";
    avatar.style.cursor = "pointer";
    avatar.addEventListener("click", () => openPlusProfile(post.username));

    const authorInfo = document.createElement("div");
authorInfo.className = "ig-post-author-info";

const authorLine = document.createElement("div");
authorLine.className = "ig-post-author-line";

const username = document.createElement("strong");
username.textContent = post.username;
username.style.cursor = "pointer";
username.addEventListener("click", () => openPlusProfile(post.username));

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
    ) + (action === "repost" ? Number(plusState().reposts.includes(post.id)) : 0)
      + (action === "comment" ? plusCommentCount(post) : 0);

    countLabel.textContent = ["like", "repost"].includes(action)
  ? formatInstagramCount(count)
  : count.toLocaleString("zh-CN");
    button.setAttribute(
      "aria-label",
      `${labels[action]}，${count.toLocaleString("zh-CN")}`
    );
  }

  updateCount();
  if(action === "repost") button.setAttribute("aria-pressed", String(plusState().reposts.includes(post.id)));
  if((action === "like" && post.hideLikes) || (action === "share" && post.hideShares)) { if(countLabel) countLabel.hidden = true; }

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

      plusSaveInteractions();
      updateButton();
      updateCount();
      status.textContent = "";
    });
  } else if (action === "comment") {
  button.addEventListener("click", () => {
    openInstagramComments(post, button);
  });
} else {
  button.addEventListener("click", () => {
    if (action === "share") openPlusShare(post);
    else if (action === "repost") {
      const state = plusState();
      state.reposts = state.reposts.includes(post.id) ? state.reposts.filter(id => id !== post.id) : [...state.reposts, post.id];
      plusCommit();
      button.setAttribute("aria-pressed", String(state.reposts.includes(post.id)));
      updateCount();
      status.textContent = state.reposts.includes(post.id) ? "已转发，可在主页菜单中查看" : "已取消转发";
    }
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
    openPlusPostMenu(post);
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

  const posts = plusVisiblePosts().filter(post => post.username === account.username);

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
      <button type="button" data-plus-edit-profile>编辑主页</button>
      <button type="button" data-plus-share-profile>分享主页</button>
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
    formatInstagramCount(instagramFollowingNames(account).length);

  profile.querySelector("[data-plus-edit-profile]").onclick = openPlusEditProfile;
  profile.querySelector("[data-plus-share-profile]").onclick = () => openPlusProfileShare(account);
  profile.querySelector("[data-profile-following]").parentElement.onclick = () => openPlusFollowing();
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
      const image = document.createElement(isInstagramVideo(cover) ? "video" : "img");
      if(image.tagName === "VIDEO"){image.muted=true;image.playsInline=true;image.preload="metadata";}
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

    button.addEventListener("click", () => openPlusPost(post));

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
  return /^data:video\//i.test(src) || /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(src);
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
  openPlusCreate();
});

igActivityButton.addEventListener("click", () => {
  renderPage("activity");
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
    (!story.accountId || story.accountId === account.id) &&
    !hasSeenAllStories(story)
  );
})
  ];

  stories.forEach((story) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ig-story${story.mine ? " is-mine" : ""}`;
    if(story.mine)button.classList.toggle("has-own-story", readPublishedStories().length > 0);
    if (!story.mine) {
  button.dataset.storyUser = story.username;
  button.classList.toggle("is-seen", hasSeenAllStories(story));
}

    const ring = document.createElement("span");
    ring.className = "ig-story-ring";

    const avatar = document.createElement("img");
    avatar.src =
      resolveInstagramUserAvatar(story.mine ? account.username : story.username, story.avatar);
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
  if (story.mine) {
    openOwnStoryMenu(button);
    return;
  }

  openStoryViewer(story.username, button);
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
  [["save", "收藏"], ["facebook", "分享帖子"]],
  [["chart", "帖子数据"], ["archive", "收入私密文件夹"], ["heart", "显示 / 隐藏获赞数"],
   ["share", "显示 / 隐藏分享次数"], ["comment", "开启 / 关闭评论"], ["edit", "编辑帖子"],
   ["pin", "置顶 / 取消置顶"], ["trash", "删除"]]
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

        closeOwnPostMenu();
        handlePlusPostAction(action, post);
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
    openPlusCreate();
  });


profileHeader.querySelector(".ig-profile-menu")
  .addEventListener("click", () => {
    openPlusProfileMenu();
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

commentOverlay.querySelector(".ig-comments-close")
  .addEventListener("click", () => closeInstagramComments());

commentOverlay.addEventListener("click", event => {
  if (event.target === commentOverlay) {
    closeInstagramComments();
  }
});
/* ===== Instagram 快拍与本地私信 ===== */

const storyViewer = document.createElement("section");
storyViewer.className = "igs-viewer";
storyViewer.hidden = true;
storyViewer.setAttribute("role", "dialog");
storyViewer.setAttribute("aria-modal", "true");
storyViewer.setAttribute("aria-label", "快拍");

storyViewer.innerHTML = `
  <div class="igs-stage"></div>

  <div class="igs-reactions" hidden>
    ${["😂", "😮", "😍", "😢", "👏", "🔥"].map(emoji => `
      <button type="button" data-story-reaction="${emoji}"
        aria-label="留下${emoji}心情">${emoji}</button>
    `).join("")}
  </div>

  <form class="igs-footer">
    <input class="igs-input" placeholder="发消息..."
      aria-label="回复快拍" maxlength="1000" autocomplete="off">

    <button type="submit" class="igs-action igs-send" hidden>发送</button>

    <button type="button" class="igs-action" data-story-like
      aria-label="点赞快拍" aria-pressed="false"></button>

    <button type="button" class="igs-action" data-story-comment
      aria-label="回复快拍"></button>

    <button type="button" class="igs-action" data-story-share
      aria-label="分享快拍"></button>
  </form>

  <div class="igs-toast" role="status" hidden></div>
`;

app.appendChild(storyViewer);

const storyPanel = document.createElement("div");
storyPanel.className = "igs-panel";
storyPanel.hidden = true;
storyViewer.appendChild(storyPanel);

const storyStage = storyViewer.querySelector(".igs-stage");
const storyInput = storyViewer.querySelector(".igs-input");
const storyReactions = storyViewer.querySelector(".igs-reactions");
const storySend = storyViewer.querySelector(".igs-send");
const storyLike = storyViewer.querySelector("[data-story-like]");
const storyToast = storyViewer.querySelector(".igs-toast");

const storyPaths = {
  heart: `<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>`,
  comment: `<path d="M21 11.5a9 9 0 1 1-4-7.5 9 9 0 0 1 4 7.5Z"/>
    <path d="m17 19 4 2-1-5"/>`,
  share: `<path d="m22 2-7 20-4-9-9-4Z"/>
    <path d="m22 2-11 11"/>`,
  close: `<path d="m5 5 14 14M19 5 5 19"/>`
};

function storySVG(path) {
  return `<svg class="igs-icon" viewBox="0 0 24 24"
    aria-hidden="true">${path}</svg>`;
}

storyLike.innerHTML = storySVG(storyPaths.heart);
storyViewer.querySelector("[data-story-comment]").innerHTML =
  storySVG(storyPaths.comment);
storyViewer.querySelector("[data-story-share]").innerHTML =
  storySVG(storyPaths.share);

function storyEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

// 所有头像由用户资料统一解析，不修改快拍本身的内容资料。
function resolveInstagramUserAvatar(username, fallback = "") {
  const defaultAvatar = "./assets/avatars/default-avatar.png";
  const current = currentAccount();
  if (username === current.username) return current.avatar || defaultAvatar;

  const visible = user =>
    (!user.story || user.story === storyKey()) &&
    (!user.accountId || user.accountId === current.id);
  const configured = (window.INSTAGRAM_USERS || []).find(user =>
    user.username === username && visible(user)
  );
  if (configured && Object.prototype.hasOwnProperty.call(configured, "avatar")) {
    return configured.avatar || defaultAvatar;
  }

  for (const account of accounts) {
    const profile = igPlusCache.get(`${storyKey()}:${account.id}`)?.profile || {};
    if ((profile.username || account.username) === username) {
      return profile.avatar ?? account.avatar ?? defaultAvatar;
    }
  }

  const contact = (window.INSTAGRAM_CONTACTS || []).find(user =>
    user.username === username && visible(user)
  );
  if (contact?.avatar) return contact.avatar;
  const storyUser = (window.INSTAGRAM_STORIES || []).find(user =>
    user.username === username && visible(user)
  );
  return fallback || storyUser?.avatar || defaultAvatar;
}

function storyImage(src) {
  return src || "./assets/avatars/default-avatar.png";
}

function isStoryVideo(item) {
  return item.type === "video" || /^data:video\//i.test(item.src || "") || /\.(mp4|webm|mov)(?:[?#]|$)/i.test(item.src || "");
}

function availableStoryUsers() {
  const account = currentAccount();
  const ownItems = readPublishedStories();

  const others = (window.INSTAGRAM_STORIES || []).filter(user =>
    (!user.story || user.story === storyKey()) &&
    (!user.accountId || user.accountId === account.id) &&
    Array.isArray(user.items) &&
    user.items.some(item => item && item.src) &&
    user.username !== account.username
  );

  return [
    ...(ownItems.length ? [{
      username: account.username,
      name: account.name,
      avatar: account.avatar,
      mine: true,
      items: ownItems
    }] : []),
    ...others
  ].map(user => ({ ...user, avatar: resolveInstagramUserAvatar(user.username, user.avatar) }));
}

function storyItems(user) {
  return (user?.items || []).filter(item => item && item.src);
}

/* 已看快拍记录：按剧情线和当前账号分别保存 */
function storySeenKey() {
  return `pickphone-ig-seen:${storyKey()}:${currentAccount().id}`;
}

function readSeenStories() {
  try {
    const value = JSON.parse(localStorage.getItem(storySeenKey()) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

function seenStoryId(user, item) {
  return `${user.username}:${item.id || item.src}`;
}

function hasSeenAllStories(user) {
  const items = storyItems(user);
  const seen = readSeenStories();

  return items.length > 0 &&
    items.every(item => seen.has(seenStoryId(user, item)));
}

function markCurrentStorySeen() {
  const user = currentStoryUser();
  const item = currentStoryItem();
  if (!user || !item) return;

  const seen = readSeenStories();
  seen.add(seenStoryId(user, item));

  try {
    localStorage.setItem(storySeenKey(), JSON.stringify([...seen]));
  } catch {
    return;
  }

  const users = availableStoryUsers();

  app.querySelectorAll(".ig-story:not(.is-mine)").forEach(button => {
    const username =
      button.dataset.storyUser ||
      button.querySelector(".ig-story-name")?.textContent.trim();

    const owner = users.find(candidate => candidate.username === username);
    if (!owner) return;

    const viewed = hasSeenAllStories(owner);

    button.dataset.storyUser = username;
    button.classList.toggle("is-seen", viewed);
    button.setAttribute(
      "aria-label",
      `${username}，${viewed ? "已看完" : "有未读快拍"}`
    );

    const ring = button.querySelector(".ig-story-ring");

    if (ring && viewed) {
      ring.style.setProperty("background", "#b8b8b8", "important");
      ring.style.setProperty("border-color", "#b8b8b8", "important");
      ring.style.setProperty("box-shadow", "none", "important");
    }
  });
}

function storyStorageKey() {
  return `pickphone-ig-stories-v1:${storyKey()}:${currentAccount().id}`;
}

function readStoryState() {
  const state = plusState();
  if (!state.storyMigrated) {
    try {
      const old = JSON.parse(localStorage.getItem(storyStorageKey()) || "{}");
      state.storyLikes = Array.isArray(old.likes) ? old.likes : [];
      state.messages = Array.isArray(old.messages) ? old.messages : state.messages;
    } catch {}
    state.storyMigrated = true;
  }
  return { likes: state.storyLikes, messages: state.messages };
}
function writeStoryState(value) {
  const state = plusState();
  state.storyLikes = value.likes;
  state.messages = value.messages;
  plusCommit();
  return true;
}

let storyUsers = [];
let storyUserIndex = 0;
let storyItemIndex = 0;
let storyTrigger = null;
let storyFrame = 0;
let storyLastFrame = 0;
let storyElapsed = 0;
let storyReady = false;
let storyPaused = false;
let storyHolding = false;
let storyToken = 0;
let storyToastTimer = null;
let storyGesture = null;

function currentStoryUser() {
  return storyUsers[storyUserIndex];
}

function currentStoryItem() {
  return storyItems(currentStoryUser())[storyItemIndex];
}

function currentStoryIdentity() {
  const user = currentStoryUser();
  const item = currentStoryItem();
  return `${user?.username}:${item?.id || item?.src}`;
}

function showStoryToast(text) {
  clearTimeout(storyToastTimer);
  storyToast.textContent = text;
  storyToast.hidden = false;

  storyToastTimer = setTimeout(() => {
    storyToast.hidden = true;
  }, 1700);
}

function storyIsPaused() {
  return !plusModal.hidden || !plusProfileLayer.hidden || storyPaused ||
    storyHolding ||
    !storyPanel.hidden ||
    document.activeElement === storyInput ||
    !storyReactions.hidden ||
    document.hidden;
}

function syncStoryVideo() {
  const video = storyStage.querySelector("video");
  if (!video) return;

  if (storyIsPaused() || storyViewer.hidden) {
    video.pause();
  } else {
    video.play().catch(() => {
      // 部分浏览器禁止带声音自动播放，保留静音播放。
      video.muted = true;
      video.play().catch(() => {});
    });
  }
}

function openStoryViewer(username, trigger) {
  storyUsers = availableStoryUsers();
  const index = storyUsers.findIndex(user => user.username === username);

  if (index < 0) {
    igHomeNotice.textContent = "这位用户还没有添加快拍图片";
    return;
  }

  pauseInstagramVideos();
  storyTrigger = trigger || document.activeElement;
  storyUserIndex = index;
  storyItemIndex = 0;
  storyViewer.hidden = false;
  storyPaused = false;

  renderStoryItem();

  storyViewer.querySelector("[data-story-close]")?.focus();

  cancelAnimationFrame(storyFrame);
  storyLastFrame = performance.now();
  storyFrame = requestAnimationFrame(animateStory);
}

function closeStoryViewer(restoreFocus = true) {
  stopOwnStoryAudio();
  cancelAnimationFrame(storyFrame);
  storyToken++;
  storyStage.querySelector("video")?.pause();
  storyViewer.hidden = true;
  storyInput.blur();
  storyInput.value = "";
  storyReactions.hidden = true;
  storyPanel.hidden = true;
  storyPanel.replaceChildren();
  storyHolding = false;
  storyGesture = null;
  storyViewer.classList.remove("is-composing");

  if (restoreFocus && storyTrigger?.isConnected) {
    storyTrigger.focus();
  }
}

function moveStory(direction) {
  if (storyViewer.hidden) return;

  const items = storyItems(currentStoryUser());

  if (direction > 0) {
    storyItemIndex++;

    if (storyItemIndex >= items.length) {
      storyUserIndex++;
      storyItemIndex = 0;
    }

    if (storyUserIndex >= storyUsers.length) {
      closeStoryViewer();
      return;
    }
  } else {
    storyItemIndex--;

    if (storyItemIndex < 0) {
      if (storyUserIndex === 0) {
        storyItemIndex = 0;
      } else {
        storyUserIndex--;
        storyItemIndex = storyItems(currentStoryUser()).length - 1;
      }
    }
  }

  renderStoryItem();
}

function renderStoryItem() {
  storyStage.querySelector("video")?.pause();

  const user = currentStoryUser();
  const items = storyItems(user);
  const item = items[storyItemIndex];
  if (!item) return closeStoryViewer();

  const token = ++storyToken;
  storyElapsed = 0;
  storyReady = false;
  storyPaused = false;
  storyHolding = false;
  storyInput.value = "";
  storySend.hidden = true;
  storyReactions.hidden = true;
  storyInput.blur();
  storyViewer.classList.remove("is-composing");

  const source = item.repost;

  storyStage.innerHTML = `
    <div class="igs-progress">
      ${items.map((_, index) => `
        <span><i style="transform:scaleX(${index < storyItemIndex ? 1 : 0})"></i></span>
      `).join("")}
    </div>

    <header class="igs-heading">
      <button type="button" class="igp-story-avatar-link" data-story-avatar aria-label="查看${storyEscape(user.username)}主页">
        <img class="igs-avatar" src="${storyEscape(resolveInstagramUserAvatar(user.username, user.avatar))}" alt="">
      </button>

      <div class="igs-heading-info">
        <div class="igs-heading-line">
          <button type="button" class="igs-author" data-story-author>
            ${storyEscape(user.username)}${user.verified ? " ✓" : ""}
          </button>
          <span class="igs-time">${storyEscape(item.time || "")}</span>
        </div>

        ${source ? `
          <button type="button" class="igs-repost" data-story-source>
            <span>↻</span>
            <img src="${storyEscape(resolveInstagramUserAvatar(source.username, source.avatar))}" alt="">
            <strong>${storyEscape(source.username)}</strong>
          </button>
        ` : ""}
      </div>

      <button type="button" class="igs-pause"
        data-story-pause aria-label="暂停快拍">Ⅱ</button>

      <button type="button" class="igs-close"
        data-story-close aria-label="关闭快拍">
        ${storySVG(storyPaths.close)}
      </button>
    </header>
  `;

  const media = document.createElement(isStoryVideo(item) ? "video" : "img");
  media.className = "igs-media";

  function ready() {
  if (token !== storyToken) return;

  storyReady = true;
  storyLastFrame = performance.now();

  markCurrentStorySeen();
  syncStoryVideo();
}

  function failed() {
    if (token !== storyToken) return;

    const error = document.createElement("p");
    error.className = "igs-media-error";
    error.textContent = "快拍加载失败，请检查图片或视频路径";
    storyStage.appendChild(error);

    storyReady = true;
  }

  if (isStoryVideo(item)) {
    media.playsInline = true;
    media.controls = false;
    media.preload = "auto";
    media.muted = false;

    media.addEventListener("loadeddata", ready, { once: true });

    media.addEventListener("ended", () => {
      if (token === storyToken && !storyIsPaused()) moveStory(1);
    });
  } else {
    media.alt = "";
    media.draggable = false;
    media.addEventListener("load", ready, { once: true });
  }

  media.addEventListener("error", failed, { once: true });

  storyStage.prepend(media);
  media.src = item.src;

  storyStage.querySelector("[data-story-close]")
    .addEventListener("click", () => closeStoryViewer());

  storyStage.querySelector("[data-story-pause]")
    .addEventListener("click", event => {
      storyPaused = !storyPaused;
      event.currentTarget.textContent = storyPaused ? "▶" : "Ⅱ";
      event.currentTarget.setAttribute(
        "aria-label", storyPaused ? "继续快拍" : "暂停快拍"
      );
      syncStoryVideo();
    });

  storyStage.querySelector("[data-story-author]")
    .addEventListener("click", () => openStoryProfile(user));
  storyStage.querySelector("[data-story-avatar]")
    ?.addEventListener("click", () => openPlusProfile(user.username));

  storyStage.querySelector("[data-story-source]")
    ?.addEventListener("click", () => openStoryProfile(source));

  updateStoryLike();
  decoratePublishedStory();
}

function animateStory(now) {
  if (storyViewer.hidden) return;

  const delta = Math.min(100, Math.max(0, now - storyLastFrame));
  storyLastFrame = now;

  if (storyReady && !storyIsPaused()) {
    const item = currentStoryItem();
    const video = storyStage.querySelector("video");

    let ratio;

    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      ratio = video.currentTime / video.duration;
    } else {
      storyElapsed += delta;
      const duration = Math.max(1, Number(item?.duration) || 5) * 1000;
      ratio = storyElapsed / duration;
    }

    const bar = storyStage.querySelectorAll(".igs-progress i")[storyItemIndex];
    if (bar) bar.style.transform = `scaleX(${Math.min(1, ratio)})`;

    if (ratio >= 1) {
      moveStory(1);
      if (storyViewer.hidden) return;
    }
  }

  storyFrame = requestAnimationFrame(animateStory);
}

/* 照片左右点击；长按暂停；下滑关闭 */
storyStage.addEventListener("pointerdown", event => {
  if (event.target.closest("button") || !event.isPrimary) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;

  storyGesture = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    started: performance.now()
  };

  storyHolding = true;
  storyStage.setPointerCapture(event.pointerId);
  syncStoryVideo();
});

storyStage.addEventListener("pointerup", event => {
  if (!storyGesture || storyGesture.id !== event.pointerId) return;

  const gesture = storyGesture;
  storyGesture = null;
  storyHolding = false;

  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;

  if (dy > 65 && dy > Math.abs(dx)) {
    closeStoryViewer();
    return;
  }

  if (
    performance.now() - gesture.started < 350 &&
    Math.abs(dx) < 20 &&
    Math.abs(dy) < 20
  ) {
    if (document.activeElement === storyInput || !storyReactions.hidden) {
      storyInput.blur();
      storyReactions.hidden = true;
    } else {
      const rect = storyStage.getBoundingClientRect();
      moveStory(event.clientX - rect.left < rect.width * .35 ? -1 : 1);
    }
  }

  syncStoryVideo();
});

function cancelStoryGesture() {
  storyGesture = null;
  storyHolding = false;
  syncStoryVideo();
}

storyStage.addEventListener("pointercancel", cancelStoryGesture);
storyStage.addEventListener("lostpointercapture", cancelStoryGesture);

function updateStoryLike() {
  const liked = readStoryState().likes.includes(currentStoryIdentity());
  storyLike.classList.toggle("is-liked", liked);
  storyLike.setAttribute("aria-pressed", String(liked));
}

storyLike.addEventListener("click", () => {
  const state = readStoryState();
  const id = currentStoryIdentity();

  state.likes = state.likes.includes(id)
    ? state.likes.filter(value => value !== id)
    : [...state.likes, id];

  writeStoryState(state);
  updateStoryLike();
});

/* 回复输入和 emoji 心情 */
storyInput.addEventListener("focus", () => {
  storyReactions.hidden = false;
  storyViewer.classList.add("is-composing");
  syncStoryVideo();
});

storyInput.addEventListener("blur", () => {
  storyViewer.classList.remove("is-composing");
  syncStoryVideo();
});

storyInput.addEventListener("input", () => {
  const hasText = Boolean(storyInput.value.trim());
  storySend.hidden = !hasText;
  storyReactions.hidden = hasText;
  syncStoryVideo();
});

storyViewer.querySelector("[data-story-comment]")
  .addEventListener("click", () => storyInput.focus());

function storySnapshot() {
  const user = currentStoryUser();
  const item = currentStoryItem();

  return {
    owner: user.username,
    ownerAvatar: resolveInstagramUserAvatar(user.username, user.avatar),
    id: item.id || item.src,
    src: item.src,
    type: isStoryVideo(item) ? "video" : "image"
  };
}

function appendStoryMessage(to, type, text, snapshot) {
  const state = readStoryState();

  state.messages.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    to,
    type,
    text,
    story: snapshot || null,
    createdAt: Date.now()
  });

  return writeStoryState(state);
}

storyViewer.querySelector(".igs-footer").addEventListener("submit", event => {
  event.preventDefault();
  const text = storyInput.value.trim();
  if (!text) return;

  const sent = appendStoryMessage(
    currentStoryUser().username,
    "reply",
    text,
    storySnapshot()
  );

  if (!sent) return;

  storyInput.value = "";
  storyInput.blur();
  storySend.hidden = true;
  storyReactions.hidden = true;
  syncStoryVideo();
  showStoryToast("已回复快拍");
});

storyReactions.addEventListener("click", event => {
  const button = event.target.closest("[data-story-reaction]");
  if (!button) return;

  const sent = appendStoryMessage(
    currentStoryUser().username,
    "reaction",
    button.dataset.storyReaction,
    storySnapshot()
  );

  if (!sent) return;

  storyInput.blur();
  storyReactions.hidden = true;
  syncStoryVideo();
  showStoryToast("已留下心情");
});

/* 分享、来源主页 */
function closeStoryPanel() {
  storyPanel.hidden = true;
  storyPanel.replaceChildren();
  syncStoryVideo();
}

function showStoryPanel(title) {
  storyInput.blur();
  storyReactions.hidden = true;
  storyPanel.hidden = false;

  storyPanel.innerHTML = `
    <section class="igs-sheet" role="dialog"
      aria-modal="true" aria-label="${storyEscape(title)}">
      <div class="igs-handle"></div>
      <header class="igs-sheet-header">
        <strong>${storyEscape(title)}</strong>
        <button type="button" data-story-panel-close>关闭</button>
      </header>
      <div class="igs-sheet-body"></div>
    </section>
  `;

  storyPanel.querySelector("[data-story-panel-close]")
    .addEventListener("click", closeStoryPanel);

  storyPanel.querySelector("[data-story-panel-close]").focus();
  syncStoryVideo();

  return storyPanel.querySelector(".igs-sheet-body");
}

storyPanel.addEventListener("click", event => {
  if (event.target === storyPanel) closeStoryPanel();
});

function storyContacts() {
  const contacts = new Map();

  [
    ...(window.INSTAGRAM_STORIES || []),
    ...(window.INSTAGRAM_CONTACTS || []),
    ...(window.INSTAGRAM_USERS || [])
  ].forEach(user => {
    if (
      user.username &&
      user.username !== currentAccount().username &&
      (!user.story || user.story === storyKey()) &&
      (!user.accountId || user.accountId === currentAccount().id)
    ) {
      contacts.set(user.username, user);
    }
  });

  return [...contacts.values()].map(user => ({ ...user, avatar: resolveInstagramUserAvatar(user.username, user.avatar) }));
}

function openStoryShare() {
  const snapshot = storySnapshot();
  const recipients = storyContacts();
  const selected = new Set();
  const body = showStoryPanel("分享快拍");

  body.innerHTML = `
    <input class="igs-search" type="search"
      placeholder="搜索" aria-label="搜索分享联系人">

    <div class="igs-recipients"></div>

    <button type="button" class="igs-share-send" disabled>
      发送
    </button>

    <div class="igs-share-tools">
      <button type="button" data-story-copy>复制链接</button>
      <button type="button" data-story-system-share>分享到…</button>
    </div>

    <p class="igs-share-status" role="status"
      style="font-size:12px;color:#777"></p>
  `;

  const list = body.querySelector(".igs-recipients");
  const send = body.querySelector(".igs-share-send");
  const search = body.querySelector("input");
  const status = body.querySelector(".igs-share-status");

  function renderRecipients() {
    list.replaceChildren();

    recipients.filter(user =>
      `${user.username} ${user.name || ""}`
        .toLowerCase().includes(search.value.trim().toLowerCase())
    ).forEach(user => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "igs-recipient";
      button.classList.toggle("is-selected", selected.has(user.username));
      button.setAttribute("aria-pressed", String(selected.has(user.username)));

      button.innerHTML = `
        <img src="${storyEscape(resolveInstagramUserAvatar(user.username, user.avatar))}" alt="">
        <span>${storyEscape(user.name || user.username)}</span>
      `;

      button.addEventListener("click", () => {
        if (selected.has(user.username)) selected.delete(user.username);
        else selected.add(user.username);

        send.disabled = selected.size === 0;
        send.textContent = selected.size ? `发送（${selected.size}）` : "发送";
        renderRecipients();
      });

      list.appendChild(button);
    });

    if (!list.childElementCount) list.textContent = "没有匹配的联系人";
  }

  search.addEventListener("input", renderRecipients);
  renderRecipients();

  send.addEventListener("click", () => {
    const state = readStoryState();

    selected.forEach(username => {
      state.messages.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        to: username,
        type: "share",
        text: "",
        story: snapshot,
        createdAt: Date.now()
      });
    });

    if (!writeStoryState(state)) return;

    closeStoryPanel();
    showStoryToast("已分享到私信");
  });

  const url = new URL(location.href);
  url.searchParams.set("igStoryUser", snapshot.owner);
  url.searchParams.set("igStoryId", snapshot.id);

  body.querySelector("[data-story-copy]").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = "链接已复制";
    } catch {
      status.textContent = "浏览器不允许自动复制，请手动复制：";

      const input = document.createElement("input");
      input.className = "igs-search";
      input.readOnly = true;
      input.value = url.href;
      status.appendChild(input);
      input.select();
    }
  });

  body.querySelector("[data-story-system-share]")
    .addEventListener("click", async () => {
      if (!navigator.share) {
        status.textContent = "当前浏览器不支持系统分享，可以使用复制链接";
        return;
      }

      try {
        await navigator.share({
          title: `${snapshot.owner} 的快拍`,
          url: url.href
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          status.textContent = "分享失败，请使用复制链接";
        }
      }
    });
}

storyViewer.querySelector("[data-story-share]")
  .addEventListener("click", openStoryShare);

/* 私信列表：按当前账号和剧情线分别读取 */
/* 防止切后台时视频继续播放 */
document.addEventListener("visibilitychange", () => {
  if (!storyViewer.hidden) syncStoryVideo();
});

/* 支持键盘左右切换；焦点限制在快拍弹层 */
storyViewer.addEventListener("keydown", event => {
  if (event.key === "Tab") {
    const scope = storyPanel.hidden ? storyViewer : storyPanel;

    const controls = [...scope.querySelectorAll(
      "button:not(:disabled), input"
    )].filter(node => node.getClientRects().length);

    const first = controls[0];
    const last = controls.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }

    event.stopPropagation();
    return;
  }

  if (event.target.matches("input") || !storyPanel.hidden) return;

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveStory(1);
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveStory(-1);
  }
});

/* 分享链接：用户解锁并打开 IG 后再定位快拍 */
let pendingStoryLink = new URL(location.href).searchParams.get("igStoryUser");
const pendingStoryId = new URL(location.href).searchParams.get("igStoryId");

new MutationObserver(() => {
  if (app.hidden) {
    if (!storyViewer.hidden) closeStoryViewer(false);
    return;
  }

  if (!pendingStoryLink) return;

  const username = pendingStoryLink;
  pendingStoryLink = null;

  const user = availableStoryUsers().find(u => u.username === username);
  if (!user) return;

  openStoryViewer(username, app.querySelector(".ig-account-trigger"));

  const index = storyItems(user).findIndex(item =>
    (item.id || item.src) === pendingStoryId
  );

  if (index >= 0) {
    storyItemIndex = index;
    renderStoryItem();
  }
}).observe(app, {
  attributes: true,
  attributeFilter: ["hidden"]
});
/* ===== IG 首页下拉刷新 ===== */
const igRefreshIndicator = document.createElement("div");
igRefreshIndicator.className = "ig-refresh-indicator";
igRefreshIndicator.setAttribute("role", "status");
igRefreshIndicator.hidden = true;
app.appendChild(igRefreshIndicator);

let igPullStart = null;
let igPullDistance = 0;
let igRefreshing = false;

function canPullInstagram() {
  return (
    !app.hidden &&
    activePage === "home" &&
    content.scrollTop <= 0 &&
    storyViewer.hidden &&
    accountOverlay.hidden &&
    commentOverlay.hidden &&
    ownPostMenu.hidden
  );
}

function resetInstagramPull() {
  igPullStart = null;
  igPullDistance = 0;

  if (!igRefreshing) {
    igRefreshIndicator.hidden = true;
  }
}

function refreshInstagramHome() {
  if (igRefreshing || app.hidden || activePage !== "home") return;

  igRefreshing = true;
  igRefreshIndicator.hidden = false;
  igRefreshIndicator.textContent = "刷新中…";

  /* 重新生成首页：已看完的快拍会被过滤 */
  renderPage("home");

  setTimeout(() => {
    igRefreshIndicator.textContent = "已刷新";

    setTimeout(() => {
      igRefreshing = false;
      resetInstagramPull();
    }, 450);
  }, 250);
}

/* 手机触摸下拉 */
content.addEventListener("touchstart", event => {
  if (
    event.touches.length !== 1 ||
    igRefreshing ||
    !canPullInstagram()
  ) {
    igPullStart = null;
    return;
  }

  /* 从首页上方开始，避免影响帖子中的图片滑动 */
  const rect = content.getBoundingClientRect();
  const touch = event.touches[0];

  if (touch.clientY - rect.top > 180) {
    igPullStart = null;
    return;
  }

  igPullStart = {
    x: touch.clientX,
    y: touch.clientY
  };

  igPullDistance = 0;
}, { passive: true });

content.addEventListener("touchmove", event => {
  if (!igPullStart || event.touches.length !== 1) return;

  const touch = event.touches[0];
  const dx = touch.clientX - igPullStart.x;
  const dy = touch.clientY - igPullStart.y;

  /* 横向滑动继续交给快拍栏和多图帖子 */
  if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy)) {
    resetInstagramPull();
    return;
  }

  if (content.scrollTop > 0 || dy < 0) {
    resetInstagramPull();
    return;
  }

  if (dy > 12 && dy > Math.abs(dx)) {
    if (event.cancelable) event.preventDefault();

    igPullDistance = dy;
    igRefreshIndicator.hidden = false;
    igRefreshIndicator.textContent =
      dy >= 75 ? "松开刷新" : "下拉刷新";
  }
}, { passive: false });

content.addEventListener("touchend", () => {
  const shouldRefresh = igPullStart && igPullDistance >= 75;
  resetInstagramPull();

  if (shouldRefresh) refreshInstagramHome();
}, { passive: true });

content.addEventListener("touchcancel", resetInstagramPull, {
  passive: true
});

/* 电脑端：在首页顶部继续向上滚动鼠标滚轮 */
let igWheelPull = 0;
let igWheelResetTimer = null;

content.addEventListener("wheel", event => {
  if (
    igRefreshing ||
    !canPullInstagram() ||
    event.deltaY >= 0 ||
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
  ) {
    igWheelPull = 0;
    return;
  }

  igWheelPull += Math.abs(event.deltaY);

  clearTimeout(igWheelResetTimer);
  igWheelResetTimer = setTimeout(() => {
    igWheelPull = 0;
  }, 300);

  if (igWheelPull >= 120) {
    igWheelPull = 0;
    refreshInstagramHome();
  }
}, { passive: true });
/* ===== 发布快拍（本地模拟 IG） ===== */
const publishStoryMusic = window.INSTAGRAM_STORY_MUSIC || [
  { id: 'lover', title: 'Lover', artist: 'Taylor Swift', src: './assets/audio/lover.mp3' },
  { id: 'surf', title: 'Surf', artist: 'Mac Miller', src: './assets/audio/surf.mp3' }
];
function publishedStoryKey() {
  return `pickphone-ig-published:${storyKey()}:${currentAccount().id}`;
}
function readPublishedStories() {
  const state = plusState();
  if (!state.publishedMigrated) {
    try { const old = JSON.parse(localStorage.getItem(publishedStoryKey()) || "[]"); if(Array.isArray(old))state.stories=old; } catch {}
    state.publishedMigrated = true;
  }
  return state.stories.filter(item => item && item.src && Date.now()-item.createdAt < 86400000);
}

const composerStyle = document.createElement('style');
composerStyle.textContent = `
#instagram-app .igc-editor{position:absolute;inset:0;z-index:220;display:flex;flex-direction:column;overflow:hidden;padding:8px 8px 20px;background:#000;color:#fff;font-family:Arial,sans-serif}
#instagram-app .igc-editor[hidden],#instagram-app .igc-editor [hidden]{display:none!important}
#instagram-app .igc-editor *{box-sizing:border-box}
#instagram-app .igc-editor button{cursor:pointer;font:inherit;color:inherit;touch-action:manipulation}
#instagram-app .igc-top{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;flex:none}
#instagram-app .igc-close{width:35px;height:35px;border:0;border-radius:50%;background:#333b;color:#fff;font-size:27px!important}
#instagram-app .igc-photo-button{padding:9px 15px;border:0;border-radius:22px;background:#303030;color:white;font-size:12px!important}
#instagram-app .igc-stage{position:relative;flex:1;min-height:0;overflow:hidden;border-radius:18px;background:#151515}
#instagram-app .igc-canvas{display:block;width:100%;height:100%;object-fit:contain;touch-action:none}
#instagram-app .igc-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;height:100%;padding:20px;text-align:center}
#instagram-app .igc-tools{position:absolute;right:10px;top:12px;display:flex;flex-direction:column;gap:8px}
#instagram-app .igc-tools button{width:37px;height:37px;border:0;border-radius:50%;background:#444c;color:white;font-size:20px;backdrop-filter:blur(8px)}
#instagram-app .igc-caption{position:absolute;bottom:12px;left:12px;width:calc(100% - 24px);padding:8px;border:0;border-radius:10px;background:#0005;color:#fff;font-size:16px}
#instagram-app .igc-caption::placeholder{color:#eee}
#instagram-app .igc-music-tag{position:absolute;left:10px;top:12px;max-width:calc(100% - 70px);padding:8px 12px;border:0;border-radius:18px;background:#333c;color:white;font-size:11px}
#instagram-app .igc-bottom{display:grid;grid-template-columns:1fr 1fr 42px;gap:7px;flex:none;padding-top:12px}
#instagram-app .igc-bottom button{min-height:40px;padding:8px;border:0;border-radius:25px;background:#292929;color:#fff;font-size:12px;font-weight:600}
#instagram-app .igc-bottom .igc-close-friends{color:#6fe37f}
#instagram-app .igc-bottom .igc-next{background:#5160ff;font-size:23px}
#instagram-app .igc-panel{position:absolute;inset:0;z-index:5;display:flex;align-items:flex-end;background:#0008}
#instagram-app .igc-sheet{width:100%;max-height:85%;padding:17px;overflow:auto;border-radius:22px 22px 0 0;background:#222}
#instagram-app .igc-sheet-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
#instagram-app .igc-sheet-header button{border:0;background:transparent;color:#a9b6ff}
#instagram-app .igc-field{display:grid;gap:8px;margin:13px 0;font-size:13px}
#instagram-app .igc-field input,#instagram-app .igc-field textarea,#instagram-app .igc-field select{width:100%;min-height:38px;padding:9px;border:1px solid #555;border-radius:9px;background:#333;color:#fff;font:inherit;font-size:16px;color-scheme:dark}
#instagram-app .igc-field input[type=color]{padding:3px}
#instagram-app .igc-field input[type=range]{padding:0}
#instagram-app .igc-save{width:100%;margin-top:12px;padding:11px;border:0;border-radius:12px;background:#5661ff;color:#fff}
#instagram-app .igc-option{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #444;font-size:13px}
#instagram-app .igc-status{flex:none;min-height:16px;margin:5px 0 0;color:#bbb;text-align:center;font-size:11px}
#instagram-app .igc-own-badge{position:absolute;z-index:4;bottom:12px;left:12px;max-width:85%;padding:6px 10px;border:0;border-radius:15px;background:#0009;color:#fff;font-size:11px}
#instagram-app .igc-view-mentions{position:absolute;z-index:4;bottom:48px;left:12px;display:flex;flex-wrap:wrap;gap:6px}
#instagram-app .igc-view-mentions button{padding:5px 8px;border:0;border-radius:12px;background:#fff;color:#111;font-size:11px}
`;
app.appendChild(composerStyle);
const storyComposer = document.createElement('section');
storyComposer.className = 'igc-editor';
storyComposer.hidden = true;
storyComposer.setAttribute('role', 'dialog');
storyComposer.setAttribute('aria-modal', 'true');
storyComposer.setAttribute('aria-label', '发布快拍');
storyComposer.innerHTML = `
<header class="igc-top"><button type="button" class="igc-close" data-igc-close aria-label="关闭">×</button><strong>发布快拍</strong><button type="button" class="igc-photo-button" data-igc-photo>照片</button></header>
<div class="igc-stage"><canvas class="igc-canvas" width="720" height="1280" hidden></canvas>
<div class="igc-empty"><strong>选择一张照片</strong><span style="font-size:12px;color:#aaa">添加文字、表情、音乐和提及</span><button type="button" class="igc-photo-button" data-igc-photo>从设备选择</button></div>
<button type="button" class="igc-music-tag" hidden></button>
<div class="igc-tools" hidden><button type="button" data-igc-text aria-label="添加文字">Aa</button><button type="button" data-igc-emoji aria-label="添加表情">☺</button><button type="button" data-igc-mention aria-label="提及其他人">@</button><button type="button" data-igc-music aria-label="选择音乐">♫</button></div>
<input class="igc-caption" placeholder="添加配文…" maxlength="100" aria-label="快拍配文" hidden></div>
<div class="igc-bottom" hidden><button type="button" data-igc-publish="followers">你的快拍</button><button type="button" class="igc-close-friends" data-igc-publish="close">★ 密友</button><button type="button" class="igc-next" data-igc-audience aria-label="选择可见范围">➜</button></div>
<p class="igc-status" role="status"></p><div class="igc-panel" hidden></div><input type="file" accept="image/*" data-igc-file hidden>`;
app.appendChild(storyComposer);
const igcCanvas = storyComposer.querySelector('canvas');
const igcContext = igcCanvas.getContext('2d');
const igcPanel = storyComposer.querySelector('.igc-panel');
const igcFile = storyComposer.querySelector('[data-igc-file]');
const igcStatus = storyComposer.querySelector('.igc-status');
const igcCaption = storyComposer.querySelector('.igc-caption');
let igcPhoto = null, igcLayers = [], igcMusic = null, igcAudio = null;
let igcBusy = false, igcTrigger = null, igcLoadToken = 0, igcDrag = null;
let igcOwnerKey = '';
function stopComposerMusic() { if (igcAudio) { igcAudio.pause(); igcAudio = null; } }
function closeComposerPanel() { igcPanel.hidden = true; stopComposerMusic(); }
function closeStoryComposer(restoreFocus = true) {
  igcLoadToken++; stopComposerMusic(); storyComposer.hidden = true;
  igcPanel.hidden = true; igcPanel.replaceChildren(); igcPhoto = null; igcLayers = []; igcDrag = null;
  if (restoreFocus && igcTrigger?.isConnected) igcTrigger.focus();
}
function openStoryComposer(trigger) {
  igcTrigger = trigger || document.activeElement;
  pauseInstagramVideos(); closeAccounts(); closeOwnPostMenu(); closeInstagramComments(false);
  if (!storyViewer.hidden) closeStoryViewer(false);
  stopComposerMusic(); igcOwnerKey = publishedStoryKey();
  igcPhoto = null; igcLayers = []; igcMusic = null; igcBusy = false;
  igcCaption.value = ''; igcStatus.textContent = ''; storyComposer.hidden = false;
  igcPanel.hidden = true; igcCanvas.hidden = true;
  storyComposer.querySelector('.igc-empty').hidden = false;
  ['.igc-tools', '.igc-bottom', '.igc-music-tag', '.igc-caption'].forEach(s => storyComposer.querySelector(s).hidden = true);
  storyComposer.querySelector('[data-igc-close]').focus();
}
function openOwnStoryMenu(trigger) {
  const own = readPublishedStories();
  if (!own.length) return openStoryComposer(trigger);
  openStoryViewer(currentAccount().username, trigger);
  const body = showStoryPanel('你的快拍');
  body.innerHTML = `<button type="button" class="igs-share-send" data-own-view>查看已发布快拍（${own.length}）</button><button type="button" class="igs-share-send" data-own-add style="margin-top:12px">添加新快拍</button><button type="button" class="igs-share-send" data-own-delete style="margin-top:12px;background:#923c3c">删除当前快拍</button>`;
  body.querySelector('[data-own-view]').onclick = closeStoryPanel;
  body.querySelector('[data-own-add]').onclick = () => { closeStoryViewer(false); openStoryComposer(trigger); };
  body.querySelector('[data-own-delete]').onclick = () => {
    const id = currentStoryItem()?.id;
    try { plusState().stories = readPublishedStories().filter(x => x.id !== id); plusCommit(); }
    catch { showStoryToast('删除失败'); return; }
    closeStoryViewer(false); renderPage('home');
  };
}
function drawStoryDraft(includeCaption = false) {
  if (!igcPhoto) return;
  const c = igcContext, w = 720, h = 1280;
  c.fillStyle = '#151515'; c.fillRect(0, 0, w, h);
  const scale = Math.min(w / igcPhoto.naturalWidth, h / igcPhoto.naturalHeight);
  const iw = igcPhoto.naturalWidth * scale, ih = igcPhoto.naturalHeight * scale;
  c.drawImage(igcPhoto, (w-iw)/2, (h-ih)/2, iw, ih);
  igcLayers.forEach(layer => {
    c.save(); c.font = `600 ${layer.size}px Arial,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = layer.color; c.shadowColor = '#0009'; c.shadowBlur = 5;
    layer.text.split('\n').forEach((line,i) => c.fillText(line,layer.x*w,layer.y*h+i*layer.size*1.25,w-30));
    c.restore();
  });
  if (includeCaption && igcCaption.value.trim()) {
    c.save(); c.font = '600 28px Arial,sans-serif'; c.fillStyle = '#fff'; c.shadowColor = '#000'; c.shadowBlur = 6;
    c.fillText(igcCaption.value.trim(),25,1225,670); c.restore();
  }
}
storyComposer.querySelectorAll('[data-igc-photo]').forEach(b => b.onclick = () => { if(!igcBusy) igcFile.click(); });
igcFile.addEventListener('change', () => {
  const file = igcFile.files?.[0]; igcFile.value = ''; if (!file) return;
  if (!file.type.startsWith('image/')) { igcStatus.textContent = '请选择图片文件'; return; }
  const token = ++igcLoadToken, url = URL.createObjectURL(file), image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url); if(token !== igcLoadToken || storyComposer.hidden) return;
    igcPhoto = image; igcStatus.textContent = ''; igcCanvas.hidden = false;
    storyComposer.querySelector('.igc-empty').hidden = true;
    ['.igc-tools','.igc-bottom','.igc-caption'].forEach(s => storyComposer.querySelector(s).hidden = false);
    drawStoryDraft();
  };
  image.onerror = () => { URL.revokeObjectURL(url); if(token === igcLoadToken) igcStatus.textContent = '图片无法读取，请尝试 JPG 或 PNG'; };
  image.src = url;
});
function openComposerPanel(title, html) {
  igcPanel.hidden = false;
  igcPanel.innerHTML = `<section class="igc-sheet" role="dialog" aria-modal="true" aria-label="${storyEscape(title)}"><header class="igc-sheet-header"><strong>${storyEscape(title)}</strong><button type="button" data-igc-done>完成</button></header>${html}</section>`;
  igcPanel.querySelector('[data-igc-done]').onclick = closeComposerPanel;
  igcPanel.querySelector('input,textarea,select,button')?.focus();
}
function editStoryLayer(index = -1, preset = '') {
  const old = igcLayers[index];
  openComposerPanel(old ? '编辑文字或表情' : '添加文字或表情', `<form><label class="igc-field">内容<textarea name="text" rows="3" maxlength="180" required>${storyEscape(old?.text || preset)}</textarea></label><label class="igc-field">大小<input name="size" type="range" min="22" max="110" value="${old?.size || 40}"></label><label class="igc-field">颜色<input name="color" type="color" value="${old?.color || '#ffffff'}"></label><button class="igc-save" type="submit">保存</button>${old ? '<button class="igc-save" type="button" data-remove style="background:#943b3b">删除这项</button>' : ''}</form>`);
  igcPanel.querySelector('form').onsubmit = e => {
    e.preventDefault(); const d = new FormData(e.currentTarget), text = String(d.get('text')).trim(); if(!text)return;
    const layer = {...(old || {x:.5,y:.45}),text,size:Number(d.get('size')),color:String(d.get('color'))};
    if (old) { delete layer.mention; const match=text.match(/^@([A-Za-z0-9._]{1,50})$/); if(match)layer.mention=match[1]; igcLayers[index]=layer; } else igcLayers.push(layer);
    closeComposerPanel(); drawStoryDraft();
  };
  igcPanel.querySelector('[data-remove]')?.addEventListener('click', () => { igcLayers.splice(index,1); closeComposerPanel(); drawStoryDraft(); });
}
storyComposer.querySelector('[data-igc-text]').onclick = () => editStoryLayer();
storyComposer.querySelector('[data-igc-emoji]').onclick = () => {
  openComposerPanel('添加表情', `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">${['🖤','🤍','🩷','🌼','🌊','✨','🥰','😂','😭','🔥','🎀','🫶','⭐','💐','🐈'].map(x=>`<button type="button" data-emoji="${x}" style="border:0;background:transparent;font-size:30px;padding:8px">${x}</button>`).join('')}</div>`);
  igcPanel.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>{igcLayers.push({text:b.dataset.emoji,size:85,color:'#ffffff',x:.5,y:.5});closeComposerPanel();drawStoryDraft();});
};
storyComposer.querySelector('[data-igc-mention]').onclick = () => {
  openComposerPanel('提及其他人', `<form><label class="igc-field">Instagram 用户名<input name="username" placeholder="不需要输入 @" list="igc-users" maxlength="50" required></label><datalist id="igc-users">${storyContacts().map(u=>`<option value="${storyEscape(u.username)}"></option>`).join('')}</datalist><button class="igc-save" type="submit">添加提及</button></form>`);
  const input=igcPanel.querySelector('input'); input.oninput=()=>input.setCustomValidity('');
  igcPanel.querySelector('form').onsubmit=e=>{
    e.preventDefault(); const username=input.value.trim().replace(/^@+/,'');
    if(!/^[A-Za-z0-9._]{1,50}$/.test(username)){input.setCustomValidity('只能包含字母、数字、点和下划线');input.reportValidity();return;}
    igcLayers.push({text:'@'+username,mention:username,size:37,color:'#ffffff',x:.5,y:.6});closeComposerPanel();drawStoryDraft();
  };
};
function openComposerMusic() {
  stopComposerMusic();
  openComposerPanel('选择音乐', `<label class="igc-field">音乐<select data-track><option value="">不添加音乐</option>${publishStoryMusic.map(t=>`<option value="${storyEscape(t.id)}" ${igcMusic?.id===t.id?'selected':''}>${storyEscape(t.artist)} · ${storyEscape(t.title)}</option>`).join('')}</select></label><label class="igc-field">开始位置（秒）<input data-start type="number" min="0" step="1" value="${igcMusic?.start||0}"></label><button class="igc-save" type="button" data-play>▶ 播放所选音乐</button><button class="igc-save" type="button" data-use>使用这首音乐</button><p data-note style="color:#bbb;font-size:12px"></p>`);
  const select=igcPanel.querySelector('[data-track]'),start=igcPanel.querySelector('[data-start]'),note=igcPanel.querySelector('[data-note]');
  select.onchange=stopComposerMusic;
  igcPanel.querySelector('[data-play]').onclick=()=>{
    stopComposerMusic();const track=publishStoryMusic.find(t=>t.id===select.value);if(!track)return;
    const audio=new Audio(track.src);igcAudio=audio;
    audio.addEventListener('loadedmetadata',()=>{if(igcAudio===audio && Number.isFinite(audio.duration))audio.currentTime=Math.min(Math.max(0,Number(start.value)||0),Math.max(0,audio.duration-.1));},{once:true});
    audio.play().then(()=>{if(igcAudio===audio)note.textContent='正在播放';}).catch(()=>{if(igcAudio===audio)note.textContent='无法播放，请检查音乐路径';});
  };
  igcPanel.querySelector('[data-use]').onclick=()=>{
    const track=publishStoryMusic.find(t=>t.id===select.value);igcMusic=track?{...track,start:Math.max(0,Number(start.value)||0)}:null;
    const tag=storyComposer.querySelector('.igc-music-tag');tag.hidden=!igcMusic;tag.textContent=igcMusic?`♫ ${igcMusic.artist} · ${igcMusic.title}`:'';closeComposerPanel();
  };
}
storyComposer.querySelector('[data-igc-music]').onclick=openComposerMusic;
storyComposer.querySelector('.igc-music-tag').onclick=openComposerMusic;
function composerPoint(e){
  const r=igcCanvas.getBoundingClientRect(),s=Math.min(r.width/720,r.height/1280),w=720*s,h=1280*s;
  return{x:(e.clientX-r.left-(r.width-w)/2)/w,y:(e.clientY-r.top-(r.height-h)/2)/h};
}
igcCanvas.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||!igcPhoto||igcBusy||(e.pointerType==='mouse'&&e.button!==0))return;
  const p=composerPoint(e);
  for(let i=igcLayers.length-1;i>=0;i--){const l=igcLayers[i];igcContext.font=`600 ${l.size}px Arial,sans-serif`;const lines=l.text.split('\n'),half=Math.max(25,Math.min(690,Math.max(...lines.map(t=>igcContext.measureText(t).width)))/2)/720;
    if(Math.abs(p.x-l.x)<=half&&p.y>=l.y-l.size/1280&&p.y<=l.y+lines.length*l.size*1.25/1280){igcDrag={id:e.pointerId,index:i,p,x:l.x,y:l.y,moved:false};igcCanvas.setPointerCapture(e.pointerId);break;}}
});
igcCanvas.addEventListener('pointermove',e=>{
  if(!igcDrag||igcDrag.id!==e.pointerId)return;const p=composerPoint(e),dx=p.x-igcDrag.p.x,dy=p.y-igcDrag.p.y;
  if(Math.abs(dx)+Math.abs(dy)>.012)igcDrag.moved=true;if(!igcDrag.moved)return;
  const l=igcLayers[igcDrag.index];l.x=Math.max(.05,Math.min(.95,igcDrag.x+dx));l.y=Math.max(.05,Math.min(.92,igcDrag.y+dy));drawStoryDraft();
});
igcCanvas.addEventListener('pointerup',e=>{if(!igcDrag||igcDrag.id!==e.pointerId)return;const d=igcDrag;igcDrag=null;if(!d.moved)editStoryLayer(d.index);});
igcCanvas.addEventListener('pointercancel',()=>igcDrag=null);
igcCanvas.addEventListener('lostpointercapture',()=>igcDrag=null);
function chooseStoryAudience(initial){
  openComposerPanel('可见范围', `<form><label class="igc-field">分享给<select name="audience"><option value="followers">你的快拍 · 关注者可见</option><option value="close" ${initial==='close'?'selected':''}>密友 · 下方选择</option><option value="custom" ${initial==='custom'?'selected':''}>指定好友 · 下方选择</option></select></label><div data-people>${storyContacts().map(u=>`<label class="igc-option"><input type="checkbox" name="person" value="${storyEscape(u.username)}"><span>${storyEscape(u.name||u.username)}</span></label>`).join('')||'<p>尚未添加联系人</p>'}</div><p data-note role="status"></p><button class="igc-save" type="submit">分享</button></form>`);
  const form=igcPanel.querySelector('form'),select=form.querySelector('select');
  const update=()=>form.querySelector('[data-people]').hidden=select.value==='followers';select.onchange=update;update();
  form.onsubmit=e=>{e.preventDefault();const d=new FormData(form),audience=String(d.get('audience')),people=d.getAll('person').map(String);if(audience!=='followers'&&!people.length){form.querySelector('[data-note]').textContent='请至少选择一位好友';return;}publishOwnStory(audience,people);};
}
function publishOwnStory(audience,people){
  if(!igcPhoto||igcBusy)return;
  if(igcOwnerKey!==publishedStoryKey()){igcStatus.textContent='账号已变化，请重新打开发布界面';return;}
  igcBusy=true;igcStatus.textContent='正在发布…';
  try{
    drawStoryDraft(true);
    const item={id:`own-${Date.now()}-${Math.random().toString(36).slice(2)}`,src:igcCanvas.toDataURL('image/jpeg',.76),time:'刚刚',duration:8,createdAt:Date.now(),audience,visibleTo:[...people],music:igcMusic?{...igcMusic}:null,mentions:[...new Set(igcLayers.filter(l=>l.mention).map(l=>l.mention))]};
    plusState().stories = [...readPublishedStories(),item]; plusCommit();
    closeStoryComposer(false);renderPage('home');igHomeNotice.textContent='快拍已发布';
  }catch{igcBusy=false;igcStatus.textContent='发布失败，可能是浏览器存储空间不足';const note=igcPanel.querySelector('[data-note]');if(note)note.textContent=igcStatus.textContent;drawStoryDraft();}
}
storyComposer.querySelector('[data-igc-audience]').onclick=()=>chooseStoryAudience('custom');
storyComposer.querySelectorAll('[data-igc-publish]').forEach(b=>b.onclick=()=>b.dataset.igcPublish==='close'?chooseStoryAudience('close'):publishOwnStory('followers',[]));
storyComposer.querySelector('[data-igc-close]').onclick=()=>closeStoryComposer();
igcPanel.onclick=e=>{if(e.target===igcPanel)closeComposerPanel();};
let ownStoryAudio=null,ownMusicManualPaused=false,ownMusicBlocked=false,ownMusicPending=false;
function stopOwnStoryAudio(){if(ownStoryAudio){ownStoryAudio.pause();ownStoryAudio=null;}ownMusicManualPaused=false;ownMusicBlocked=false;ownMusicPending=false;}
function resumeOwnStoryAudio(){
  if(!ownStoryAudio||ownMusicPending||!ownStoryAudio.paused)return;
  const audio=ownStoryAudio;ownMusicPending=true;
  audio.play().catch(()=>{if(ownStoryAudio===audio)ownMusicBlocked=true;}).finally(()=>{if(ownStoryAudio===audio)ownMusicPending=false;});
}
function decoratePublishedStory(){
  stopOwnStoryAudio();if(storyViewer.hidden)return;
  const item=currentStoryItem(),user=currentStoryUser();if(!item||!user)return;
  storyViewer.querySelector('.igs-footer').hidden=Boolean(user.mine);
  if(user.mine){const badge=document.createElement('div');badge.className='igc-own-badge';badge.textContent=({followers:'你的快拍 · 关注者可见',close:'★ 密友可见',custom:'指定好友可见'})[item.audience]||'你的快拍';badge.title=(item.visibleTo||[]).join('、');storyStage.appendChild(badge);}
  if(item.mentions?.length){const row=document.createElement('div');row.className='igc-view-mentions';item.mentions.forEach(username=>{const b=document.createElement('button');b.type='button';b.textContent='@'+username;b.onclick=()=>openStoryProfile(storyContacts().find(u=>u.username===username)||{username});row.appendChild(b);});storyStage.appendChild(row);}
  if(item.music?.src){
    const button=document.createElement('button');button.type='button';button.className='igc-own-badge';button.style.bottom='82px';button.textContent=`♫ ${item.music.artist} · ${item.music.title}`;button.setAttribute('aria-label','播放或暂停快拍音乐');
    const audio=new Audio(item.music.src);ownStoryAudio=audio;
    audio.addEventListener('loadedmetadata',()=>{if(ownStoryAudio===audio&&Number.isFinite(audio.duration))audio.currentTime=Math.min(Math.max(0,item.music.start||0),Math.max(0,audio.duration-.1));},{once:true});
    button.onclick=()=>{if(audio.paused){ownMusicManualPaused=false;ownMusicBlocked=false;resumeOwnStoryAudio();}else{ownMusicManualPaused=true;audio.pause();}};
    storyStage.appendChild(button);resumeOwnStoryAudio();
  }
}
setInterval(()=>{
  if(!ownStoryAudio)return;
  if(storyViewer.hidden||app.hidden){stopOwnStoryAudio();return;}
  if(!storyReady||storyIsPaused()||ownMusicManualPaused){ownStoryAudio.pause();return;}
  if(!ownMusicBlocked&&!ownStoryAudio.ended)resumeOwnStoryAudio();
},150);
document.addEventListener('visibilitychange',()=>{if(document.hidden){ownStoryAudio?.pause();stopComposerMusic();}});

/* ===== IG 本地完整交互层：数据按剧情线、账号隔离 ===== */
function plusKey(){return `${storyKey()}:${currentAccount().id}`;}
function plusState(){
  const key=plusKey();
  if(!igPlusCache.has(key))igPlusCache.set(key,{});
  const s=igPlusCache.get(key);
  const defaults={posts:[],stories:[],messages:[],storyLikes:[],likes:[],saved:[],reposts:[],following:[],hiddenUsers:[],deleted:[],archived:[],overrides:{},comments:{},commentLikes:[],profile:{},settings:{},activity:[],searches:[]};
  Object.entries(defaults).forEach(([k,v])=>{if(s[k]===undefined)s[k]=v;});
  return s;
}
let plusSaveQueue=Promise.resolve();
function plusCommit(){
  const key=plusKey(),state=structuredClone(plusState());
  if(!igPlusDatabase){plusToast('浏览器未开放持久存储，本次修改仅在当前页面保留');return Promise.resolve(false);}
  const task=()=>new Promise(resolve=>{
    try{const tx=igPlusDatabase.transaction('accounts','readwrite');tx.objectStore('accounts').put(state,key);tx.oncomplete=()=>resolve(true);tx.onerror=()=>{plusToast('保存失败：存储空间不足，请导出备份');resolve(false);};tx.onabort=()=>resolve(false);}
    catch{plusToast('保存失败，请导出备份');resolve(false);}
  });
  plusSaveQueue=plusSaveQueue.then(task,task);return plusSaveQueue;
}
function syncPlusPosts(){
  const s=plusState();
  instagramPosts=[...s.posts,...instagramBasePosts].filter(p=>!s.deleted.includes(p.id)).map(p=>{
    const merged={...p,...s.overrides[p.id]};
    if((s.authorAliases||[]).includes(merged.username)){merged.username=currentAccount().username;merged.avatar=currentAccount().avatar;}
    return merged;
  });
  instagramPosts.sort((a,b)=>Number(Boolean(b.pinned))-Number(Boolean(a.pinned)));
  instagramLikedPosts.clear();s.likes.forEach(k=>instagramLikedPosts.add(k));
  instagramSavedPosts.clear();s.saved.forEach(k=>instagramSavedPosts.add(k));
}
function plusSaveInteractions(){const s=plusState();s.likes=[...instagramLikedPosts];s.saved=[...instagramSavedPosts];plusCommit();}
function plusVisiblePosts(includeArchived=false){const s=plusState();return instagramPosts.filter(p=>(!p.story||p.story===storyKey())&&(!p.accountId||p.accountId===currentAccount().id)&&(includeArchived||!s.archived.includes(p.id))&&!s.hiddenUsers.includes(p.username));}
function plusCommentCount(post){return (plusState().comments[post.id]||[]).reduce((n,c)=>n+1+(c.replies||[]).length,0);}
function plusID(){return `${Date.now()}-${Math.random().toString(36).slice(2)}`;}
function plusEsc(x){return storyEscape(x);}
function plusAvatar(x){return storyImage(x);}
function plusUser(username) {
  const current = currentAccount();
  if (username === current.username) return current;

  const own = accounts.find(account => account.username === username);

  const configured = (window.INSTAGRAM_USERS || []).find(user =>
    user.username === username &&
    (!user.story || user.story === storyKey()) &&
    (!user.accountId || user.accountId === current.id)
  ) || {};

  const contact = storyContacts().find(user =>
    user.username === username
  ) || {};

  const post = instagramPosts.find(post =>
    post.username === username
  );

  return {
    ...(post ? { avatar: post.avatar, verified: post.verified } : {}),
    ...own,
    ...contact,
    ...configured,
    username,
    name: configured.name || contact.name || own?.name || username,
    avatar: resolveInstagramUserAvatar(
      username,
      configured.avatar || contact.avatar || own?.avatar || post?.avatar
    )
  };
}
function plusUsers(){const m=new Map();[...accounts,...storyContacts(),...(window.INSTAGRAM_USERS||[]).filter(u=>(!u.story||u.story===storyKey())&&(!u.accountId||u.accountId===currentAccount().id)),...plusVisiblePosts().map(p=>({username:p.username}))].forEach(u=>{if(u.username)m.set(u.username,plusUser(u.username));});return [...m.values()];}
const plusModal=document.createElement('div');plusModal.className='igp-modal';plusModal.hidden=true;app.appendChild(plusModal);
let plusReturnFocus=null,plusModalCleanup=null,plusReelObserver=null,plusReplyTo=null;
const plusToastNode=document.createElement('div');plusToastNode.className='igp-toast';plusToastNode.hidden=true;plusToastNode.setAttribute('role','status');app.appendChild(plusToastNode);let plusToastTimer;
function plusToast(text){plusToastNode.textContent=text;plusToastNode.hidden=false;clearTimeout(plusToastTimer);plusToastTimer=setTimeout(()=>plusToastNode.hidden=true,2600);}
function closePlusModal(restore=true){if(plusModalCleanup){plusModalCleanup();plusModalCleanup=null;}plusModal.hidden=true;plusModal.replaceChildren();if(!storyViewer.hidden)syncStoryVideo();if(restore&&plusReturnFocus?.isConnected&&!app.hidden)plusReturnFocus.focus();}
function plusSheet(title,html,full=false){
  plusReturnFocus=document.activeElement;closePlusModal(false);pauseInstagramVideos();
  plusModal.hidden=false;plusModal.innerHTML=`<section class="igp-sheet ${full?'igp-full':''}" role="dialog" aria-modal="true" aria-label="${plusEsc(title)}"><header class="igp-bar"><strong>${plusEsc(title)}</strong><button type="button" data-close aria-label="关闭">×</button></header><div class="igp-body">${html}</div></section>`;
  plusModal.querySelector('[data-close]').onclick=()=>closePlusModal();plusModal.querySelector('[data-close]').focus();if(!storyViewer.hidden)syncStoryVideo();return plusModal.querySelector('.igp-body');
}
plusModal.onclick=e=>{if(e.target===plusModal)closePlusModal();};
function plusEmpty(text){return `<p class="igp-empty">${plusEsc(text)}</p>`;}
function plusCardButton(label,fn,parent){const b=document.createElement('button');b.type='button';b.className='igp-row';b.textContent=label;b.onclick=fn;parent.appendChild(b);return b;}
function plusTime(value){return new Date(value).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});}
function plusMedia(src,cls=''){const el=document.createElement(isInstagramVideo(src)?'video':'img');el.className=cls;el.src=src;el.setAttribute('aria-label','媒体');if(el.tagName==='VIDEO'){el.muted=true;el.playsInline=true;el.preload='metadata';}else{el.alt='';el.loading='lazy';}return el;}
async function plusReadFile(file){
  if(file.type.startsWith('image/'))return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);const c=document.createElement('canvas'),s=Math.min(1,1440/Math.max(img.naturalWidth,img.naturalHeight));c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.85));};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('无法读取图片，请使用 JPG 或 PNG'));};img.src=url;});
  if(file.type.startsWith('video/')){if(file.size>40*1024*1024)throw new Error('请选择小于 40 MB 的视频');return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('无法读取视频'));r.readAsDataURL(file);});}
  throw new Error('请选择图片或视频');
}
function openPlusCreate(){const body=plusSheet('创建','');plusCardButton('发布帖子',()=>openPlusPostEditor(),body);plusCardButton('发布快拍',()=>{closePlusModal(false);openStoryComposer(igCreateButton);},body);plusCardButton('发布 Reels',()=>openPlusPostEditor(null,true),body);}
function openPlusPostEditor(existing=null,reel=false){
  const key=plusKey(),account=currentAccount();let media=existing?getInstagramPostImages(existing).slice():[],busy=false;
  const body=plusSheet(existing?'编辑帖子':reel?'发布 Reels':'发布帖子',`<form class="igp-form"><label>照片或视频<input type="file" data-files accept="${reel?'video/*':'image/*,video/*'}" ${reel?'':'multiple'}></label><div class="igp-previews"></div><p class="igp-hint">${reel?'选择一段视频':'最多 10 项，可调整顺序或移除；编辑时上传会追加。'}</p><label>文案<textarea name="caption" maxlength="2200" rows="3">${plusEsc(existing?.caption||'')}</textarea></label><label>地点<input name="location" maxlength="100" value="${plusEsc(existing?.location||'')}"></label><label>标记用户（用逗号分隔）<input name="tags" value="${plusEsc((existing?.taggedUsers||[]).join(', '))}"></label><label>可见范围<select name="audience"><option value="followers">关注者</option><option value="close">密友</option><option value="private">仅自己</option></select></label><label class="igp-inline"><input name="comments" type="checkbox" ${existing?.commentsDisabled?'':'checked'}>允许评论</label><p class="igp-hint" data-status role="status"></p><button class="igp-primary" type="submit">${existing?'保存修改':'发布'}</button></form>`,true);
  const form=body.querySelector('form'),previews=body.querySelector('.igp-previews'),status=body.querySelector('[data-status]');form.elements.audience.value=existing?.audience||'followers';
  function draw(){previews.replaceChildren();media.forEach((src,i)=>{const tile=document.createElement('div');tile.appendChild(plusMedia(src));const controls=document.createElement('div');const left=document.createElement('button');left.type='button';left.textContent='←';left.disabled=i===0;left.onclick=()=>{[media[i-1],media[i]]=[media[i],media[i-1]];draw();};const del=document.createElement('button');del.type='button';del.textContent='移除';del.onclick=()=>{media.splice(i,1);draw();};controls.append(left,del);tile.appendChild(controls);previews.appendChild(tile);});}draw();
  body.querySelector('[data-files]').onchange=async e=>{if(busy)return;busy=true;form.querySelector('[type=submit]').disabled=true;status.textContent='正在读取文件…';try{const files=[...e.target.files];if(files.length+media.length>(reel?1:10))throw new Error(reel?'Reels 只能选择一个视频':'最多选择 10 项');for(const file of files){const src=await plusReadFile(file);if(reel&&!isInstagramVideo(src))throw new Error('Reels 请选择视频');media.push(src);}draw();status.textContent='';}catch(error){status.textContent=error.message;}finally{busy=false;form.querySelector('[type=submit]').disabled=false;e.target.value='';}};
  form.onsubmit=async e=>{e.preventDefault();if(busy)return;if(!media.length){status.textContent='请先选择照片或视频';return;}if(key!==plusKey()){status.textContent='账号发生变化，请重新打开';return;}
    busy=true;form.querySelector('[type=submit]').disabled=true;status.textContent='正在保存…';const d=new FormData(form);const fields={images:media.slice(),caption:String(d.get('caption')).trim(),captions:[],location:String(d.get('location')).trim(),taggedUsers:String(d.get('tags')).split(/[,，]/).map(x=>x.trim().replace(/^@/,'')).filter(Boolean),audience:d.get('audience'),commentsDisabled:!d.has('comments')};const state=plusState(),previous=structuredClone(state);
    if(existing)state.overrides[existing.id]={...state.overrides[existing.id],...fields};else state.posts.unshift({id:'local-'+plusID(),username:account.username,avatar:account.avatar,name:account.name,accountId:account.id,story:storyKey(),createdAt:Date.now(),time:new Date().toLocaleDateString('zh-CN'),type:reel?'reel':'post',likes:0,comments:0,reposts:0,shares:0,...fields});
    if(!await plusCommit()){igPlusCache.set(key,previous);status.textContent='保存失败，请释放空间后重试';busy=false;form.querySelector('[type=submit]').disabled=false;return;}
    closePlusModal(false);renderPage('profile');plusToast(existing?'帖子已更新':'已发布');
  };
}
function openPlusEditProfile(){const account=currentAccount();const key=plusKey();const body=plusSheet('编辑主页',`<form class="igp-form"><label>头像<input name="avatar" type="file" accept="image/*"></label><label>姓名<input name="name" maxlength="60" value="${plusEsc(account.name||'')}"></label><label>用户名<input name="username" pattern="[A-Za-z0-9._]{1,30}" maxlength="30" required value="${plusEsc(account.username)}"></label><label>简介<textarea name="bio" maxlength="150">${plusEsc(account.bio||'')}</textarea></label><button class="igp-primary" type="submit">保存</button><p data-status role="status"></p></form>`);body.querySelector('form').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,d=new FormData(form),status=body.querySelector('[data-status]');form.querySelector('button[type=submit]').disabled=true;try{let avatar=account.avatar;const file=form.elements.avatar.files[0];if(file)avatar=await plusReadFile(file);if(key!==plusKey())return;const username=String(d.get('username'));if(accounts.some(a=>a.id!==account.id&&a.username===username))throw new Error('用户名与其他账号重复');const s=plusState();s.profile={...s.profile,name:String(d.get('name')),username,bio:String(d.get('bio')),avatar};s.posts.forEach(p=>{if(p.accountId===account.id){p.username=username;p.avatar=avatar;}});s.authorAliases=[...new Set([...(s.authorAliases||[]),account.username])];if(!await plusCommit())throw new Error('保存失败');closePlusModal(false);renderPage('profile');}catch(error){status.textContent=error.message;form.querySelector('button[type=submit]').disabled=false;}};}
function openPlusProfileShare(account){const body=plusSheet('分享主页',`<p>@${plusEsc(account.username)}</p><input class="igp-input" readonly value="${plusEsc(new URL('?igUser='+encodeURIComponent(account.username),location.href).href)}"><button class="igp-primary" type="button">复制链接</button><p class="igp-hint">打开链接后，在模拟 IG 中查看该用户主页。</p>`);body.querySelector('button').onclick=()=>plusCopy(body.querySelector('input').value);}
async function plusCopy(text){try{await navigator.clipboard.writeText(text);plusToast('已复制');}catch{const body=plusSheet('复制链接',`<input class="igp-input" readonly value="${plusEsc(text)}"><p class="igp-hint">请选中并复制</p>`);body.querySelector('input').select();}}
function openPlusProfileMenu(){const body=plusSheet('个人主页菜单','');[['收藏',()=>renderPage('saved')],['我的转发',()=>renderPlusReposts()],['私密文件夹',()=>renderPage('archive')],['最近删除',()=>renderPage('trash')],['关注列表',openPlusFollowing],['设置',()=>renderPage('settings')],['发布内容',openPlusCreate]].forEach(([label,fn])=>plusCardButton(label,()=>{closePlusModal(false);fn();},body));}
function plusGrid(posts,parent){const grid=document.createElement('div');grid.className='igp-grid';posts.forEach(post=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','查看 '+(post.caption||'帖子'));const src=post.thumbnail||getInstagramPostImages(post)[0];if(src)button.appendChild(plusMedia(src));if(getInstagramPostImages(post).length>1){const badge=document.createElement('span');badge.textContent='▣';button.appendChild(badge);}button.onclick=()=>openPlusPost(post);grid.appendChild(button);});parent.appendChild(grid);if(!posts.length)parent.insertAdjacentHTML('beforeend',plusEmpty('暂无内容'));}
function renderPlusSearch(){content.innerHTML=`<section class="igp-page"><input class="igp-input" type="search" placeholder="搜索用户、文案或地点" aria-label="搜索"><div class="igp-search-tabs"><button data-kind="all" aria-pressed="true">全部</button><button data-kind="users">用户</button><button data-kind="posts">帖子</button></div><div class="igp-results"></div></section>`;const input=content.querySelector('input'),results=content.querySelector('.igp-results');let kind='all';function update(){const q=input.value.trim().toLowerCase();results.replaceChildren();if(!q){if(plusState().searches.length){const recent=document.createElement('div');recent.className='igp-recent';recent.innerHTML='<strong>最近搜索</strong>';plusState().searches.slice(-6).reverse().forEach(value=>plusCardButton(value,()=>{input.value=value;update();},recent));plusCardButton('清除搜索记录',()=>{plusState().searches=[];plusCommit();update();},recent);results.appendChild(recent);}plusGrid(plusVisiblePosts(),results);return;}
  if(kind!=='posts'){const users=plusUsers().filter(u=>`${u.username} ${u.name}`.toLowerCase().includes(q));users.forEach(user=>{const b=document.createElement('button');b.className='igs-dm-user';b.type='button';b.innerHTML=`<img src="${plusEsc(plusAvatar(user.avatar))}" alt=""><span><strong>${plusEsc(user.username)}</strong><small>${plusEsc(user.name||'')}</small></span>`;b.onclick=()=>{plusRememberSearch(input.value);openPlusProfile(user.username);};results.appendChild(b);});}
  if(kind!=='users')plusGrid(plusVisiblePosts().filter(p=>`${p.username} ${p.caption||''} ${p.location||''}`.toLowerCase().includes(q)),results);
  if(!results.childElementCount)results.innerHTML=plusEmpty('没有匹配结果');
}input.oninput=update;input.addEventListener('change',()=>plusRememberSearch(input.value));content.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;content.querySelectorAll('[data-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));update();});update();}
function plusRememberSearch(q){q=q.trim();if(!q)return;const s=plusState();s.searches=[...s.searches.filter(x=>x!==q),q].slice(-15);plusCommit();}

function openStoryProfile(source){openPlusProfile(source.username);}
function instagramFollowingNames(user = currentAccount()) {
  const initial = (user.followingUsers || [])
    .map(item => typeof item === "string" ? item : item.username)
    .filter(Boolean);

  if (user.username !== currentAccount().username) {
    return [...new Set(initial)];
  }

  const state = plusState();
  return [...new Set([...initial, ...state.following])]
    .filter(username => !(state.unfollowed || []).includes(username));
}

function isInstagramFollowing(username) {
  return instagramFollowingNames().includes(username);
}
function openPlusFollowing() {
  const account = currentAccount();
  const body = plusSheet("关注列表", "", true);
  const sheet = body.closest(".igp-sheet");
  sheet.classList.add("igp-following-sheet");

  const bar = sheet.querySelector(".igp-bar");
  bar.innerHTML = `
    <button type="button" data-following-back aria-label="返回">
      <svg viewBox="0 0 24 24">
        <path d="m15 4-8 8 8 8"/>
      </svg>
    </button>
    <strong>${plusEsc(account.username)}</strong>
    <button type="button" data-find-users aria-label="发现用户">
      <svg viewBox="0 0 24 24">
        <circle cx="14" cy="7" r="3"/>
        <path d="M8 20v-2a6 6 0 0 1 12 0v2ZM4 7v6M1 10h6"/>
      </svg>
    </button>
  `;

  bar.querySelector("[data-following-back]").onclick =
    () => closePlusModal();

  bar.querySelector("[data-find-users]").onclick = () => {
    closePlusModal(false);
    renderPage("search");
  };

  let sortMode = "default";

  function drawFollowing() {
    let rows = instagramFollowingNames();

    if (sortMode === "name") {
      rows = [...rows].sort((a, b) => a.localeCompare(b));
    }

    body.innerHTML = `
      <nav class="igf-tabs" aria-label="联系人分类">
        <span>${plusEsc(formatInstagramFollowers(account.followers))} 粉丝</span>
        <strong>${rows.length} 关注</strong>
        <span>订阅</span>
        <span>已标记</span>
      </nav>

      <div class="igf-scroll">
        <button type="button" class="igf-sort">
          <span>排序方式 <b>${
            sortMode === "default" ? "默认" : "用户名"
          }</b></span>
          <svg viewBox="0 0 24 24">
            <path d="M7 3v18m-4-4 4 4 4-4M17 21V3m-4 4 4-4 4 4"/>
          </svg>
        </button>
        <div class="igf-people"></div>
      </div>
    `;

    body.querySelector(".igf-sort").onclick = () => {
      sortMode = sortMode === "default" ? "name" : "default";
      drawFollowing();
    };

    const list = body.querySelector(".igf-people");

    if (!rows.length) {
      list.innerHTML = plusEmpty("暂无关注");
      return;
    }

    rows.forEach(username => {
      const user = plusUser(username);
      const row = document.createElement("div");
      row.className = "igf-person";

      row.innerHTML = `
        <button type="button" class="igf-avatar" aria-label="查看主页">
          <img
            src="${plusEsc(resolveInstagramUserAvatar(username, user.avatar))}"
            alt="">
        </button>

        <button type="button" class="igf-identity" aria-label="查看主页">
          <span class="igf-username">
            <b>${plusEsc(username)}</b>
            ${user.verified ? `
              <svg class="igf-verified" viewBox="0 0 24 24"
                role="img" aria-label="已认证">
                <path fill="#0095f6"
                  d="m12 1 3 2 3.5.5 1 3.5 2.5 2.5-1 3.5.5 3.5-3 2-2 3-3.5-.5L10 23l-2.5-2.5-3.5-1-.5-3.5L1 13l2-3 .5-3.5 3.5-1L9.5 2Z"/>
                <path d="m7 12 3 3 7-7" fill="none"
                  stroke="#fff" stroke-width="2.2"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            ` : ""}
          </span>
          <span class="igf-name">${plusEsc(user.name || username)}</span>
        </button>

        <button type="button" class="igf-message">发消息</button>
        <button type="button" class="igf-more"
          aria-label="更多选项">•••</button>
      `;

      const openProfile = () => openPlusProfile(username);
      row.querySelector(".igf-avatar").onclick = openProfile;
      row.querySelector(".igf-identity").onclick = openProfile;

      row.querySelector("img").onerror = function () {
        this.onerror = null;
        this.src = "./assets/avatars/default-avatar.png";
      };

      row.querySelector(".igf-message").onclick = () => {
        closePlusModal(false);
        closePlusProfile(true);
        renderPage("messages");
        renderStoryThread(username);
      };

      row.querySelector(".igf-more").onclick = () => {
        const menu = plusSheet(user.username, "");

        plusCardButton("查看主页", openProfile, menu);

        plusCardButton("取消关注", () => {
          const state = plusState();

          state.following = state.following.filter(
            id => id !== username
          );

          state.unfollowed = [
            ...new Set([...(state.unfollowed || []), username])
          ];

          plusCommit();
          openPlusFollowing();
        }, menu);

        plusCardButton("返回关注列表", openPlusFollowing, menu);
      };

      list.appendChild(row);
    });
  }

  drawFollowing();
}
function renderPlusCollection(kind){
  const title={saved:'收藏',archive:'私密文件夹',trash:'最近删除'}[kind];
  content.innerHTML=`<section class="igp-page"><header class="igp-bar"><button data-back>‹ 返回</button><h2>${title}</h2></header><div data-grid></div></section>`;
  content.querySelector('[data-back]').onclick=()=>renderPage('profile');const s=plusState(),grid=content.querySelector('[data-grid]');
  if(kind==='trash'){
    const rows=[...s.posts,...instagramBasePosts].filter(p=>s.deleted.includes(p.id)&&(!p.story||p.story===storyKey())&&(!p.accountId||p.accountId===currentAccount().id));
    if(!rows.length)grid.innerHTML=plusEmpty('没有已删除的帖子');
    rows.forEach(post=>plusCardButton((post.caption||post.id)+' · 恢复',()=>{s.deleted=s.deleted.filter(id=>id!==post.id);plusCommit();renderPage('trash');},grid));return;
  }
  plusGrid(plusVisiblePosts(true).filter(p=>kind==='saved'?s.saved.includes(instagramPostStateKey(p)):s.archived.includes(p.id)),grid);
}
function renderPlusReposts(){renderPage('saved');content.querySelector('h2').textContent='我的转发';const grid=content.querySelector('[data-grid]');grid.replaceChildren();plusGrid(plusVisiblePosts().filter(p=>plusState().reposts.includes(p.id)),grid);}
function openPlusPost(post){const body=plusSheet('帖子',`<header class="igp-bar"><button data-user>@${plusEsc(post.username)}</button><button data-more aria-label="帖子菜单">⋯</button></header><div data-gallery></div><p>${plusEsc(post.caption||'')}</p><small>${plusEsc(post.time||'')}</small><div class="igp-post-actions"><button data-like aria-pressed="${instagramLikedPosts.has(instagramPostStateKey(post))}">♡ 点赞</button><button data-comment>评论</button><button data-share>分享</button><button data-save>收藏</button></div>`,true);const gallery=createInstagramPostGallery(post);body.querySelector('[data-gallery]').appendChild(gallery);body.querySelector('[data-user]').onclick=()=>openPlusProfile(post.username);body.querySelector('[data-more]').onclick=()=>{closePlusModal(false);openPlusPostMenu(post);};body.querySelector('[data-like]').onclick=e=>{const k=instagramPostStateKey(post);if(instagramLikedPosts.has(k))instagramLikedPosts.delete(k);else instagramLikedPosts.add(k);plusSaveInteractions();e.currentTarget.setAttribute('aria-pressed',String(instagramLikedPosts.has(k)));e.currentTarget.textContent=instagramLikedPosts.has(k)?'♥ 已点赞':'♡ 点赞';};body.querySelector('[data-save]').onclick=e=>{const k=instagramPostStateKey(post);if(instagramSavedPosts.has(k))instagramSavedPosts.delete(k);else instagramSavedPosts.add(k);plusSaveInteractions();e.currentTarget.textContent=instagramSavedPosts.has(k)?'已收藏':'收藏';};body.querySelector('[data-comment]').onclick=()=>{closePlusModal(false);openInstagramComments(post,null);};body.querySelector('[data-share]').onclick=()=>openPlusShare(post);plusModalCleanup=()=>body.querySelectorAll('video').forEach(v=>v.pause());}
function openPlusPostMenu(post){const body=plusSheet('帖子选项','');if(post.username===currentAccount().username){[['edit','编辑'],['archive',plusState().archived.includes(post.id)?'移出私密文件夹':'收入私密文件夹'],['pin','置顶 / 取消置顶'],['heart','显示 / 隐藏获赞数'],['comment','开启 / 关闭评论'],['trash','删除']].forEach(([a,l])=>plusCardButton(l,()=>handlePlusPostAction(a,post),body));}else{plusCardButton('查看主页',()=>openPlusProfile(post.username),body);plusCardButton('隐藏该用户的帖子',()=>{plusState().hiddenUsers.push(post.username);plusCommit();closePlusModal(false);renderPage('home');},body);}plusCardButton('分享',()=>openPlusShare(post),body);}
function handlePlusPostAction(action,post){const s=plusState();if(action==='facebook'||action==='share-link')return openPlusShare(post);if(action==='chart'){plusSheet('帖子数据',`<p>点赞：${formatInstagramCount((Number(post.likes)||0)+Number(instagramLikedPosts.has(instagramPostStateKey(post))))}</p><p>评论：${(Number(post.comments)||0)+plusCommentCount(post)}</p><p>转发：${(Number(post.reposts)||0)+Number(s.reposts.includes(post.id))}</p><p>分享：${Number(post.shares)||0}</p><p class="igp-hint">基础数据来自帖子资料，新增互动来自当前模拟账号。</p>`);return;}if(action==='edit')return openPlusPostEditor(post,post.type==='reel');if(action==='trash'){const body=plusSheet('删除帖子',`<p>从当前模拟账号中删除此帖子？</p><button class="igp-primary" data-confirm>删除</button>`);body.querySelector('[data-confirm]').onclick=()=>{s.deleted.push(post.id);plusCommit();closePlusModal(false);renderPage('profile');};return;}if(action==='archive'){s.archived=s.archived.includes(post.id)?s.archived.filter(id=>id!==post.id):[...s.archived,post.id];}else{const field={pin:'pinned',heart:'hideLikes',share:'hideShares',comment:'commentsDisabled'}[action];if(!field)return;s.overrides[post.id]={...s.overrides[post.id],[field]:!post[field]};}plusCommit();closePlusModal(false);renderPage('profile');plusToast('已更新');}
function openPlusShare(post){const selected=new Set(),body=plusSheet('分享帖子',`<input class="igp-input" type="search" placeholder="搜索联系人" aria-label="搜索联系人"><div class="igs-recipients"></div><button class="igp-primary" data-send disabled>发送</button><button class="igp-row" data-copy>复制链接</button><p data-note role="status"></p>`);const list=body.querySelector('.igs-recipients'),send=body.querySelector('[data-send]'),input=body.querySelector('input');function update(){list.replaceChildren();plusUsers().filter(u=>u.username!==currentAccount().username&&`${u.username} ${u.name}`.toLowerCase().includes(input.value.toLowerCase())).forEach(u=>{const b=document.createElement('button');b.className='igs-recipient';b.type='button';b.classList.toggle('is-selected',selected.has(u.username));b.setAttribute('aria-pressed',String(selected.has(u.username)));b.innerHTML=`<img src="${plusEsc(plusAvatar(u.avatar))}" alt=""><span>${plusEsc(u.name||u.username)}</span>`;b.onclick=()=>{if(selected.has(u.username))selected.delete(u.username);else selected.add(u.username);update();};list.appendChild(b);});send.disabled=!selected.size;send.textContent=selected.size?`发送（${selected.size}）`:'发送';}input.oninput=update;update();send.onclick=async()=>{send.disabled=true;const s=plusState();selected.forEach(to=>s.messages.push({id:plusID(),to,type:'post',text:'',post:{id:post.id,username:post.username,src:getInstagramPostImages(post)[0],caption:post.caption||''},createdAt:Date.now()}));if(await plusCommit()){closePlusModal(false);plusToast('已分享到私信');}};body.querySelector('[data-copy]').onclick=()=>plusCopy(new URL('?igPost='+encodeURIComponent(post.id),location.href).href);}
function plusStopReels(){plusReelObserver?.disconnect();plusReelObserver=null;content.querySelectorAll('.igp-reels video').forEach(v=>v.pause());}
function renderPlusReels(){
  const rows=[];plusVisiblePosts().forEach(post=>getInstagramPostImages(post).filter(isInstagramVideo).forEach(src=>rows.push({post,src})));
  content.innerHTML='<div class="igp-reels" aria-label="Reels 视频列表"></div>';const list=content.querySelector('.igp-reels');
  if(!rows.length){list.innerHTML=plusEmpty('暂无视频。点击创建 → 发布 Reels 添加视频。');return;}
  plusReelObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{const video=entry.target.querySelector('video');if(entry.isIntersecting&&entry.intersectionRatio>=.6&&!app.hidden&&activePage==='reels'){video.play().catch(()=>{});}else video.pause();});},{root:list,threshold:[0,.6]});
  rows.forEach(({post,src})=>{const section=document.createElement('section');section.className='igp-reel';section.setAttribute('aria-label',post.caption||'Reel');const video=document.createElement('video');video.src=src;video.loop=true;video.playsInline=true;video.muted=true;video.preload='metadata';section.appendChild(video);section.insertAdjacentHTML('beforeend',`<div class="igp-reel-top"><strong>Reels</strong><button data-sound aria-label="开启声音">静音</button></div><div class="igp-reel-controls"><button data-like aria-pressed="${instagramLikedPosts.has(instagramPostStateKey(post))}" aria-label="点赞视频">${storySVG(instagramPostIcons.like)}<small>${formatInstagramCount(Number(post.likes)||0)}</small></button><button data-comment aria-label="评论视频">${storySVG(instagramPostIcons.comment)}<small>评论</small></button><button data-share aria-label="分享视频">${storySVG(instagramPostIcons.share)}<small>分享</small></button><button data-save aria-label="收藏视频">${storySVG(instagramPostIcons.save)}<small>收藏</small></button><button data-play aria-label="播放或暂停视频">Ⅱ</button></div><div class="igp-reel-caption"><button data-user>@${plusEsc(post.username)}</button><p>${plusEsc(post.caption||'')}</p></div><p class="igp-video-error" hidden>视频无法播放，请检查格式或文件路径</p>`);
    const toggle=()=>{if(video.paused){video.play().catch(()=>plusToast('视频暂时无法播放'));section.querySelector('[data-play]').textContent='Ⅱ';}else{video.pause();section.querySelector('[data-play]').textContent='▶';}};video.onclick=toggle;section.querySelector('[data-play]').onclick=toggle;
    video.onerror=()=>section.querySelector('.igp-video-error').hidden=false;
    section.querySelector('[data-sound]').onclick=e=>{video.muted=!video.muted;e.currentTarget.textContent=video.muted?'静音':'有声';};section.querySelector('[data-like]').onclick=e=>{const key=instagramPostStateKey(post);if(instagramLikedPosts.has(key))instagramLikedPosts.delete(key);else instagramLikedPosts.add(key);plusSaveInteractions();const liked=instagramLikedPosts.has(key);e.currentTarget.setAttribute('aria-pressed',String(liked));e.currentTarget.innerHTML=`${storySVG(instagramPostIcons.like)}<small>${formatInstagramCount((Number(post.likes)||0)+Number(liked))}</small>`;};section.querySelector('[data-save]').onclick=e=>{const key=instagramPostStateKey(post);if(instagramSavedPosts.has(key))instagramSavedPosts.delete(key);else instagramSavedPosts.add(key);plusSaveInteractions();e.currentTarget.setAttribute('aria-pressed',String(instagramSavedPosts.has(key)));e.currentTarget.querySelector('small').textContent=instagramSavedPosts.has(key)?'已收藏':'收藏';};section.querySelector('[data-comment]').onclick=()=>openInstagramComments(post,section.querySelector('[data-comment]'));section.querySelector('[data-share]').onclick=()=>openPlusShare(post);section.querySelector('[data-user]').onclick=()=>openPlusProfile(post.username);list.appendChild(section);plusReelObserver.observe(section);
  });
  list.onkeydown=e=>{if(e.target.closest('button'))return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();list.scrollBy({top:list.clientHeight*(e.key==='ArrowDown'?1:-1),behavior:'smooth'});}};list.tabIndex=0;
}
/* 评论：本地新增、回复、点赞和删除自己的评论 */
function openInstagramComments(post,trigger){
  pauseInstagramVideos();closeOwnPostMenu();closeAccounts();commentTrigger=trigger;plusReplyTo=null;
  const list=commentOverlay.querySelector('.ig-comments-list');
  commentOverlay.querySelector('.igp-comment-compose')?.remove();
  const form=document.createElement('form');form.className='igp-comment-compose';form.innerHTML=`<div class="igp-reply-label" hidden><span></span><button type="button" aria-label="取消回复">×</button></div><div class="igp-compose-row"><input placeholder="${post.commentsDisabled?'评论已关闭':'添加评论…'}" aria-label="评论内容" maxlength="1000" ${post.commentsDisabled?'disabled':''}><button type="submit" ${post.commentsDisabled?'disabled':''}>发布</button></div><p data-error role="status"></p>`;
  commentOverlay.querySelector('.ig-comments-sheet').appendChild(form);
  const local=()=>plusState().comments[post.id]||[];
  function render(){list.replaceChildren();const base=(post.commentList||[]).map((item,i)=>({...item,cid:'base-'+(item.id||i)})),top=[...base,...local().filter(c=>!c.parentId).map(c=>({...c,cid:c.id,local:true}))];
    function row(item,reply=false){const wrap=document.createElement('div'),el=document.createElement('div');el.className='ig-comment-row'+(reply?' is-reply':'');const liked=plusState().commentLikes.includes(post.id+':'+item.cid);el.innerHTML=`<img src="${plusEsc(plusAvatar(item.avatar))}" alt=""><div class="ig-comment-body"><div class="ig-comment-heading"><button type="button" class="igp-author">${plusEsc(item.username)}</button><span>${plusEsc(item.time||'刚刚')}</span></div><p>${plusEsc(item.text)}</p><div class="igp-comment-tools"><button type="button" data-reply>回复</button>${item.local?'<button type="button" data-delete>删除</button>':''}</div></div><button type="button" class="ig-comment-like" data-like aria-label="点赞评论" aria-pressed="${liked}"><span>${liked?'♥':'♡'}</span><small>${formatInstagramCount((Number(item.likes)||0)+Number(liked))}</small></button>`;
      el.querySelector('.igp-author').onclick=()=>{closeInstagramComments(false);openPlusProfile(item.username);};el.querySelector('img').style.cursor='pointer';el.querySelector('img').onclick=()=>{closeInstagramComments(false);openPlusProfile(item.username);};el.querySelector('[data-like]').onclick=e=>{const s=plusState(),id=post.id+':'+item.cid;s.commentLikes=s.commentLikes.includes(id)?s.commentLikes.filter(x=>x!==id):[...s.commentLikes,id];plusCommit();const selected=s.commentLikes.includes(id);e.currentTarget.setAttribute('aria-pressed',String(selected));e.currentTarget.innerHTML=`<span>${selected?'♥':'♡'}</span><small>${formatInstagramCount((Number(item.likes)||0)+Number(selected))}</small>`;};el.querySelector('[data-reply]').onclick=()=>{if(post.commentsDisabled)return;plusReplyTo={id:item.parentId||item.cid,username:item.username};form.querySelector('.igp-reply-label').hidden=false;form.querySelector('.igp-reply-label span').textContent='回复 @'+item.username;form.querySelector('input').focus();};el.querySelector('[data-delete]')?.addEventListener('click',()=>{plusState().comments[post.id]=local().filter(c=>c.id!==item.id&&c.parentId!==item.id);plusCommit();render();});wrap.appendChild(el);return wrap;}
    top.forEach(item=>{const wrap=row(item);const replies=[...(item.replies||[]).map((r,i)=>({...r,cid:item.cid+'-r-'+i})),...local().filter(c=>c.parentId===item.cid).map(c=>({...c,cid:c.id,local:true}))];if(replies.length){const b=document.createElement('button');b.className='ig-comment-replies-toggle';b.type='button';b.textContent=`查看 ${replies.length} 条回复`;const box=document.createElement('div');box.hidden=true;replies.forEach(r=>box.appendChild(row(r,true)));b.onclick=()=>{box.hidden=!box.hidden;b.textContent=box.hidden?`查看 ${replies.length} 条回复`:'收起回复';};wrap.append(b,box);}list.appendChild(wrap);});if(!top.length)list.innerHTML=plusEmpty(post.commentsDisabled?'评论已关闭':'暂无评论，留下第一条评论吧');
  }
  form.querySelector('.igp-reply-label button').onclick=()=>{plusReplyTo=null;form.querySelector('.igp-reply-label').hidden=true;};
  form.onsubmit=async e=>{e.preventDefault();if(post.commentsDisabled)return;const input=form.querySelector('input'),text=input.value.trim();if(!text)return;const a=currentAccount(),s=plusState();s.comments[post.id]||=[];s.comments[post.id].push({id:plusID(),username:a.username,avatar:a.avatar,text,time:'刚刚',createdAt:Date.now(),parentId:plusReplyTo?.id||null});await plusCommit();input.value='';plusReplyTo=null;form.querySelector('.igp-reply-label').hidden=true;render();list.scrollTop=list.scrollHeight;};
  render();commentOverlay.hidden=false;commentOverlay.querySelector('.ig-comments-close').focus();
}
/* 私信：只显示用户提供的剧情及实际发送的消息，不生成虚假的回复 */
function plusMessages(){const local=readStoryState().messages;const fixtures=(window.INSTAGRAM_MESSAGES||[]).filter(m=>(!m.storyLine||m.storyLine===storyKey())&&(!m.accountId||m.accountId===currentAccount().id));return [...fixtures,...local].sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));}
function plusMessageLabel(m){return m.type==='reaction'?'留下了心情 '+m.text:m.type==='share'?'分享了一条快拍':m.type==='post'?'分享了一篇帖子':m.type==='image'?'照片':m.text||'快拍回复';}
function renderStoryInbox(){const messages=plusMessages(),usernames=[...new Set(messages.map(m=>m.to))];usernames.sort((a,b)=>(messages.filter(m=>m.to===b).at(-1)?.createdAt||0)-(messages.filter(m=>m.to===a).at(-1)?.createdAt||0));content.innerHTML='<section class="igp-page"><header class="igp-bar"><h2>消息</h2><button data-new>新消息 ＋</button></header><input class="igp-input" type="search" placeholder="搜索私信" aria-label="搜索私信"><div data-threads></div></section>';const input=content.querySelector('input'),list=content.querySelector('[data-threads]');function update(){list.replaceChildren();usernames.filter(u=>u.toLowerCase().includes(input.value.toLowerCase())).forEach(username=>{const u=plusUser(username),last=messages.filter(m=>m.to===username).at(-1),b=document.createElement('button');b.type='button';b.className='igs-dm-user';b.innerHTML=`<img src="${plusEsc(plusAvatar(u.avatar))}" alt=""><span><strong>${plusEsc(username)}</strong><small>${plusEsc(plusMessageLabel(last))}</small></span>`;b.onclick=()=>renderStoryThread(username);list.appendChild(b);});if(!list.childElementCount)list.innerHTML=plusEmpty('暂无会话，点击右上角新消息');}input.oninput=update;content.querySelector('[data-new]').onclick=()=>{const body=plusSheet('新消息','<input class="igp-input" placeholder="搜索用户" aria-label="搜索用户"><div data-users></div>');const field=body.querySelector('input'),users=body.querySelector('[data-users]');const draw=()=>{users.replaceChildren();plusUsers().filter(u=>u.username!==currentAccount().username&&u.username.toLowerCase().includes(field.value.toLowerCase())).forEach(u=>plusCardButton('@'+u.username,()=>{closePlusModal(false);renderStoryThread(u.username);},users));};field.oninput=draw;draw();};update();}
function renderStoryThread(username){
  const messages=plusMessages().filter(m=>m.to===username);let reply=null;
  content.innerHTML=`<section class="igp-thread"><header class="igp-bar"><button data-back aria-label="返回私信">‹</button><button data-profile>${plusEsc(username)}</button><button data-thread-menu aria-label="会话选项">⋯</button></header><div class="igp-thread-records"></div><div class="igp-thread-reply" hidden></div><form class="igs-dm-form"><button type="button" data-emoji aria-label="添加表情">☺</button><input placeholder="发消息…" aria-label="私信内容" maxlength="1000" autocomplete="off"><button type="button" data-photo aria-label="发送照片">▧</button><button type="submit">发送</button><input type="file" data-file accept="image/*" hidden></form><p class="igp-hint" data-dm-status role="status"></p></section>`;
  const records=content.querySelector('.igp-thread-records'),form=content.querySelector('form'),replyLabel=content.querySelector('.igp-thread-reply');content.querySelector('[data-back]').onclick=renderStoryInbox;content.querySelector('[data-profile]').onclick=()=>openPlusProfile(username);content.querySelector('[data-thread-menu]').onclick=()=>{const body=plusSheet('会话选项','');plusCardButton('查看主页',()=>openPlusProfile(username),body);plusCardButton('删除本地会话',()=>{const confirm=plusSheet('删除会话','<p>删除当前浏览器中你与该用户的本地消息？剧情资料中的消息保留。</p><button class="igp-primary">删除</button>');confirm.querySelector('button').onclick=()=>{plusState().messages=plusState().messages.filter(m=>m.to!==username);plusCommit();closePlusModal(false);renderStoryInbox();};},body);};
  messages.forEach(m=>{const mine=m.mine!==false,record=document.createElement('article');record.className='igs-dm-record'+(mine?'':' is-incoming');record.innerHTML=`<small>${plusEsc(plusTime(m.createdAt||Date.now()))}</small>`;if(m.replyTo){const quote=document.createElement('div');quote.className='igp-dm-quote';quote.textContent='回复：'+m.replyTo;record.appendChild(quote);}
    if(m.story){const label=document.createElement('small');label.textContent=m.type==='reaction'?'你给 TA 的快拍留下了心情':m.type==='share'?`分享了 ${m.story.owner} 的快拍`:'回复了对方的快拍';record.appendChild(label);const preview=document.createElement('button');preview.type='button';preview.className='igs-dm-preview';preview.appendChild(plusMedia(m.story.src));if(m.type==='reaction'){const emoji=document.createElement('span');emoji.className='igs-dm-emoji';emoji.textContent=m.text;preview.appendChild(emoji);}preview.onclick=()=>{const u=availableStoryUsers().find(u=>u.username===m.story.owner),i=storyItems(u).findIndex(x=>(x.id||x.src)===m.story.id);if(i<0){plusToast('该快拍已过期或不可用');return;}openStoryViewer(m.story.owner,preview);storyItemIndex=i;renderStoryItem();};record.appendChild(preview);}
    if(m.post){const preview=document.createElement('button');preview.type='button';preview.className='igp-dm-post';preview.appendChild(plusMedia(m.post.src));const text=document.createElement('span');text.textContent='@'+m.post.username+' '+(m.post.caption||'');preview.appendChild(text);preview.onclick=()=>{const post=instagramPosts.find(p=>p.id===m.post.id);if(post)openPlusPost(post);else plusToast('原帖已删除或不可见');};record.appendChild(preview);}
    if(m.type==='image'&&m.src){const b=document.createElement('button');b.type='button';b.className='igp-dm-image';b.appendChild(plusMedia(m.src));b.onclick=()=>{const body=plusSheet('照片','',true);const image=plusMedia(m.src);image.style.cssText='width:100%;height:100%;object-fit:contain';body.appendChild(image);};record.appendChild(b);}
    if(m.text&&m.type!=='reaction'){const bubble=document.createElement('div');bubble.className='igs-dm-text';bubble.textContent=m.text;record.appendChild(bubble);}
    const tools=document.createElement('div');tools.className='igp-dm-tools';const rb=document.createElement('button');rb.type='button';rb.textContent='回复';rb.onclick=()=>{reply={id:m.id,text:plusMessageLabel(m)};replyLabel.hidden=false;replyLabel.replaceChildren();const text=document.createElement('span');text.textContent='回复：'+reply.text;const cancel=document.createElement('button');cancel.type='button';cancel.textContent='×';cancel.onclick=()=>{reply=null;replyLabel.hidden=true;};replyLabel.append(text,cancel);form.querySelector('input:not([type=file])').focus();};tools.appendChild(rb);
    if(mine&&plusState().messages.some(x=>x.id===m.id)){const del=document.createElement('button');del.type='button';del.textContent='撤回';del.onclick=()=>{plusState().messages=plusState().messages.filter(x=>x.id!==m.id);plusCommit();renderStoryThread(username);};tools.appendChild(del);}record.appendChild(tools);if(mine&&m.seen){const seen=document.createElement('small');seen.textContent='已读';record.appendChild(seen);}records.appendChild(record);
  });
  const input=form.querySelector('input:not([type=file])');form.onsubmit=async e=>{e.preventDefault();const text=input.value.trim();if(!text)return;const s=plusState();s.messages.push({id:plusID(),to:username,type:'text',text,replyTo:reply?.text||'',createdAt:Date.now(),mine:true});await plusCommit();renderStoryThread(username);content.querySelector('input:not([type=file])')?.focus();};form.querySelector('[data-emoji]').onclick=()=>{const body=plusSheet('表情','');['🖤','🤍','🩷','😂','🥰','😭','🫶','🌼','🌊','✨','👏','🔥'].forEach(emoji=>{const b=document.createElement('button');b.className='igp-emoji';b.type='button';b.textContent=emoji;b.onclick=()=>{input.value+=emoji;closePlusModal(false);input.focus();};body.appendChild(b);});};form.querySelector('[data-photo]').onclick=()=>form.querySelector('[data-file]').click();form.querySelector('[data-file]').onchange=async e=>{const file=e.target.files[0];if(!file)return;const key=plusKey();try{const src=await plusReadFile(file);if(key!==plusKey())return;plusState().messages.push({id:plusID(),to:username,type:'image',src,createdAt:Date.now(),mine:true});if(await plusCommit())renderStoryThread(username);}catch(error){plusToast(error.message);}};
  requestAnimationFrame(()=>{records.scrollTop=records.scrollHeight;content.scrollTop=content.scrollHeight;});
}
function renderPlusActivity(){const configured=(window.INSTAGRAM_ACTIVITY||[]).filter(x=>(!x.story||x.story===storyKey())&&(!x.accountId||x.accountId===currentAccount().id));content.innerHTML='<section class="igp-page"><header class="igp-bar"><button data-back>‹ 返回</button><h2>通知</h2></header><div data-list></div></section>';content.querySelector('[data-back]').onclick=()=>renderPage('home');const list=content.querySelector('[data-list]');[...configured,...plusState().activity].forEach(item=>{const b=document.createElement('button');b.type='button';b.className='igp-row';b.textContent=item.text||`${item.username||''}与你有了新互动`;b.onclick=()=>item.postId?openPlusPost(instagramPosts.find(p=>p.id===item.postId)||{id:'missing',username:item.username,images:[],caption:'原帖不可用'}):openPlusProfile(item.username||currentAccount().username);list.appendChild(b);});if(!list.childElementCount)list.innerHTML=plusEmpty('暂无新通知');}
function renderPlusSettings(){const s=plusState();content.innerHTML=`<section class="igp-page"><header class="igp-bar"><button data-back>‹ 返回</button><h2>设置</h2></header><div class="igp-settings"><label>私密账号<input type="checkbox" data-private ${s.settings.private?'checked':''}></label><p class="igp-hint">作为当前模拟账号的可见范围设置保存。</p><button data-edit>编辑主页</button><button data-hidden>管理隐藏的用户</button><button data-export>导出当前账号备份</button><button data-import>导入账号备份</button><input type="file" data-file accept="application/json,.json" hidden><button data-help>功能与数据说明</button><p data-status role="status"></p></div></section>`;content.querySelector('[data-back]').onclick=()=>renderPage('profile');content.querySelector('[data-private]').onchange=e=>{s.settings.private=e.target.checked;plusCommit();};content.querySelector('[data-edit]').onclick=openPlusEditProfile;content.querySelector('[data-hidden]').onclick=()=>{const body=plusSheet('隐藏的用户','');if(!s.hiddenUsers.length)body.innerHTML=plusEmpty('没有隐藏的用户');s.hiddenUsers.forEach(u=>plusCardButton('@'+u+' · 恢复显示',()=>{s.hiddenUsers=s.hiddenUsers.filter(x=>x!==u);plusCommit();closePlusModal();plusToast('已恢复显示');},body));};content.querySelector('[data-export]').onclick=()=>{const blob=new Blob([JSON.stringify({format:'pickphone-ig-v1',account:currentAccount().id,story:storyKey(),data:s},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`instagram-${currentAccount().id}-backup.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};content.querySelector('[data-import]').onclick=()=>content.querySelector('[data-file]').click();content.querySelector('[data-file]').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>150*1024*1024)throw new Error('备份文件过大');const value=JSON.parse(await file.text());if(value.format!=='pickphone-ig-v1'||!value.data||!Array.isArray(value.data.posts)||!Array.isArray(value.data.messages))throw new Error('不是有效的 IG 备份');if(value.account!==currentAccount().id||value.story!==storyKey())throw new Error('请切换到备份对应的账号和剧情线后导入');const body=plusSheet('导入备份','<p>导入会替换当前模拟账号的本地 IG 数据。</p><button class="igp-primary">确认导入</button>');body.querySelector('button').onclick=async()=>{igPlusCache.set(plusKey(),value.data);await plusCommit();closePlusModal(false);renderPage('profile');};}catch(error){plusToast(error.message);}};content.querySelector('[data-help]').onclick=()=>plusSheet('功能与数据说明','<p>这是捡手机项目内的模拟 Instagram。</p><p>照片、视频、消息和互动保存在当前浏览器的 IndexedDB，按剧情线和账号隔离。清除网站数据会删除本地内容，请定期导出备份。</p><p>发布和私信不会发送到真实 Instagram；没有后台账号服务，也不会生成虚假的好友回复或已读状态。</p><p>通知、他人资料、剧情私信和音乐可在 js/instagram-config.js 中设置。</p>');}
/* Restore persistent interaction state after initialization. */
syncPlusPosts();
const igPlusLink=new URL(location.href).searchParams;
let igPlusLinkPending=true;
new MutationObserver(()=>{
  if(app.hidden){closePlusModal(false);plusStopReels();return;}
  if(!igPlusLinkPending)return;igPlusLinkPending=false;
  if(igPlusLink.has('igUser'))openPlusProfile(igPlusLink.get('igUser'));
  if(igPlusLink.has('igPost')){const post=plusVisiblePosts().find(p=>p.id===igPlusLink.get('igPost'));if(post)openPlusPost(post);else plusToast('帖子不可见或已删除');}
}).observe(app,{attributes:true,attributeFilter:['hidden']});

/* ===== 他人个人主页：与主导航分开，返回保留原浏览位置 ===== */
const plusProfileLayer=document.createElement('section');
plusProfileLayer.className='igp-user-profile';plusProfileLayer.hidden=true;
plusProfileLayer.setAttribute('role','dialog');plusProfileLayer.setAttribute('aria-modal','true');plusProfileLayer.setAttribute('aria-label','用户个人主页');app.appendChild(plusProfileLayer);
let plusProfileUsername='',plusProfileHistory=[],plusProfileTrigger=null;
function closePlusProfile(force=false){
  if(!force&&plusProfileHistory.length){const previous=plusProfileHistory.pop();renderPlusUserProfile(previous);return;}
  plusProfileLayer.hidden=true;plusProfileLayer.replaceChildren();plusProfileHistory=[];plusProfileUsername='';
  if(!force&&plusProfileTrigger?.isConnected&&!app.hidden)plusProfileTrigger.focus();
  if(!storyViewer.hidden)syncStoryVideo();
}
function openPlusProfile(username){
  if(!username)return;
  if(username===currentAccount().username){closePlusProfile(true);closePlusModal(false);renderPage('profile');return;}
  if(plusProfileLayer.hidden){plusProfileTrigger=document.activeElement;plusProfileHistory=[];}
  else if(plusProfileUsername&&plusProfileUsername!==username)plusProfileHistory.push(plusProfileUsername);
  closePlusModal(false);pauseInstagramVideos();plusStopReels();renderPlusUserProfile(username);
}
function plusProfileCount(value){
  if(typeof value==='string'&&value.trim()&&!Number.isFinite(Number(value)))return value;
  const count=Math.max(0,Math.floor(Number(value)||0));
  return count>=10000?Number((count/10000).toFixed(1)).toLocaleString('zh-CN')+'万':count.toLocaleString('zh-CN');
}
function renderPlusUserProfile(username){
  const user=plusUser(username),posts=plusVisiblePosts().filter(p=>p.username===username);
  plusProfileUsername=username;plusProfileLayer.hidden=false;
  const badge = user.verified ? `
  <span class="igp-user-verified" role="img" aria-label="已认证">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path class="igp-badge-bg"
        d="M12 2 15 3.5 18.4 3.6 19.9 6.6 22 9.2 21.3 12.5 21.6 15.8 18.8 17.8 17 20.6 13.6 20.9 10.5 22 7.8 20 4.6 18.9 4 15.6 2 12.9 3.1 9.7 3.4 6.4 6.4 4.9 8.9 2.7Z"/>
      <path class="igp-badge-check" d="m7.5 12 3 3 6-6"/>
    </svg>
  </span>` : "";
  const following = isInstagramFollowing(username);
  const mutuals=(user.mutualFollowers||[]).map(x=>typeof x==='string'?plusUser(x):x).filter(x=>x&&x.username);
  const mutualTotal=Math.max(mutuals.length,Number(user.mutualCount)||0);
  plusProfileLayer.innerHTML=`
    <header class="igp-user-header">
      <button type="button" data-user-back aria-label="返回"><svg viewBox="0 0 24 24"><path d="m15 4-8 8 8 8"/></svg></button>
      <div class="igp-user-id"><strong>${plusEsc(username)}</strong>${badge}</div>
      <button type="button" data-user-notify aria-label="用户通知设置"><svg viewBox="0 0 24 24"><path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4ZM10 21h4M12 2v2"/></svg></button>
      <button type="button" data-user-menu aria-label="用户选项"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg></button>
    </header>
    <div class="igp-user-scroll">
      <div class="igp-user-summary">
        <img class="igp-user-avatar" src="${plusEsc(resolveInstagramUserAvatar(username,user.avatar))}" alt="${plusEsc(username)}头像">
        <div class="igp-user-info"><strong class="igp-user-name">${plusEsc(user.name||username)}</strong>
          <div class="igp-user-stats">
            <div><strong>${plusProfileCount(user.postsCount??posts.length)}</strong><small>篇帖子</small></div>
            <div><strong>${plusProfileCount(user.followers??0)}</strong><small>位粉丝</small></div>
            <div><strong>${plusProfileCount(Array.isArray(user.followingUsers)?instagramFollowingNames(user).length:(user.following??0))}</strong><small>关注</small></div>
          </div>
        </div>
      </div>
      ${user.bio?`<p class="igp-user-bio">${plusEsc(user.bio)}</p>`:''}
      ${mutuals.length?`<button type="button" class="igp-user-mutual" data-user-mutual>
        <span class="igp-mutual-avatars">${mutuals.slice(0,3).map(u=>`<img src="${plusEsc(resolveInstagramUserAvatar(u.username,u.avatar))}" alt="">`).join('')}</span>
        <span>${plusEsc(mutuals.slice(0,2).map(u=>u.username).join('、'))}${mutualTotal>2?` 和其他 ${Math.max(0,mutualTotal-2)} 位用户`:''}关注了</span>
      </button>`:''}
      <div class="igp-user-actions">
        <button type="button" data-follow aria-pressed="${following}" class="${following?'is-following':''}">${following?'已关注 ⌄':'关注'}</button>
        <button type="button" data-message>发消息</button>
        <button type="button" data-user-suggest aria-label="推荐用户" aria-expanded="false"><svg viewBox="0 0 24 24"><circle cx="10" cy="8" r="3"/><path d="M3 20v-2a7 7 0 0 1 14 0v2M19 5v6M16 8h6"/></svg></button>
      </div>
      <div class="igp-user-suggestions" hidden></div>
      <nav class="igp-user-tabs" aria-label="用户主页内容">
        <button type="button" data-user-tab="posts" aria-label="帖子" aria-pressed="true"><svg viewBox="0 0 24 24"><path d="M3 3h18v18H3ZM9 3v18M15 3v18M3 9h18M3 15h18"/></svg></button>
        <button type="button" data-user-tab="reels" aria-label="Reels" aria-pressed="false"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="m10 8 7 4-7 4Z"/></svg></button>
        <button type="button" data-user-tab="tagged" aria-label="被标记的帖子" aria-pressed="false"><svg viewBox="0 0 24 24"><path d="M8 4 10 2h4l2 2h4v18H4V4Z"/><circle cx="12" cy="10" r="3"/><path d="M6 21a6 6 0 0 1 12 0"/></svg></button>
      </nav>
      <div class="igp-user-posts"></div>
    </div>`;
  plusProfileLayer.querySelector('[data-user-back]').onclick=()=>closePlusProfile();
  function setFollowing(selected) {
    const state = plusState();
    state.unfollowed ||= [];
    if (selected) {
      state.following = [...new Set([...state.following, username])];
      state.unfollowed = state.unfollowed.filter(id => id !== username);
    } else {
      state.following = state.following.filter(id => id !== username);
      state.unfollowed = [...new Set([...state.unfollowed, username])];
    }
    plusCommit();
    const button = plusProfileLayer.querySelector('[data-follow]');
    button.classList.toggle('is-following', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.textContent = selected ? '已关注 ⌄' : '关注';
  }
  plusProfileLayer.querySelector('[data-follow]').onclick=()=>{
    if (!isInstagramFollowing(username)) {
  setFollowing(true);
  return;
}
    const body=plusSheet('关注设置','');plusCardButton('取消关注',()=>{setFollowing(false);closePlusModal();},body);plusCardButton('通知设置',()=>openPlusUserNotifications(username),body);
  };
  plusProfileLayer.querySelector('[data-message]').onclick=()=>{closePlusProfile(true);renderPage('messages');renderStoryThread(username);};
  plusProfileLayer.querySelector('[data-user-notify]').onclick=()=>openPlusUserNotifications(username);
  plusProfileLayer.querySelector('[data-user-menu]').onclick=()=>{
    const body=plusSheet('用户选项','');
    plusCardButton('分享主页',()=>openPlusProfileShare(user),body);
    plusCardButton('隐藏该用户的帖子',()=>{plusState().hiddenUsers=[...new Set([...plusState().hiddenUsers,username])];plusCommit();closePlusModal(false);closePlusProfile(true);renderPage('home');plusToast('已隐藏，可在设置中恢复');},body);
    plusCardButton('发消息',()=>{closePlusModal(false);closePlusProfile(true);renderPage('messages');renderStoryThread(username);},body);
  };
  plusProfileLayer.querySelector('[data-user-mutual]')?.addEventListener('click',()=>{const body=plusSheet('共同关注','');mutuals.forEach(u=>plusCardButton('@'+u.username,()=>openPlusProfile(u.username),body));});
  plusProfileLayer.querySelector('[data-user-suggest]').onclick=e=>{
    const box=plusProfileLayer.querySelector('.igp-user-suggestions');box.hidden=!box.hidden;e.currentTarget.setAttribute('aria-expanded',String(!box.hidden));box.replaceChildren();
    if(!box.hidden){const users=plusUsers().filter(u=>u.username!==username&&u.username!==currentAccount().username&&!plusState().following.includes(u.username));if(!users.length)box.innerHTML=plusEmpty('暂无更多推荐');users.slice(0,8).forEach(u=>{const b=document.createElement('button');b.type='button';b.innerHTML=`<img src="${plusEsc(resolveInstagramUserAvatar(u.username,u.avatar))}" alt=""><span>${plusEsc(u.name||u.username)}</span>`;b.onclick=()=>openPlusProfile(u.username);box.appendChild(b);});}
  };
  function drawTab(tab){
    const container=plusProfileLayer.querySelector('.igp-user-posts');container.replaceChildren();
    plusProfileLayer.querySelectorAll('[data-user-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.userTab===tab)));
    let rows=tab==='tagged'?plusVisiblePosts().filter(p=>(p.taggedUsers||[]).includes(username)):tab==='reels'?posts.filter(p=>p.type==='reel'||getInstagramPostImages(p).some(isInstagramVideo)):posts;
    rows=[...rows].sort((a,b)=>Number(Boolean(b.pinned))-Number(Boolean(a.pinned)));
    const grid=document.createElement('div');grid.className='igp-user-grid';
    rows.forEach(post=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',post.caption||'查看帖子');let src=post.thumbnail||getInstagramPostImages(post)[0];if(src)b.appendChild(plusMedia(src));if(post.pinned)b.insertAdjacentHTML('beforeend','<span class="igp-grid-pin" aria-label="已置顶">◆</span>');if(getInstagramPostImages(post).length>1)b.insertAdjacentHTML('beforeend','<span class="igp-grid-type" aria-label="多图">▣</span>');else if(isInstagramVideo(src||''))b.insertAdjacentHTML('beforeend','<span class="igp-grid-type" aria-label="视频">▶</span>');b.onclick=()=>openPlusPost(post);grid.appendChild(b);});container.appendChild(grid);
    if(!rows.length)container.insertAdjacentHTML('beforeend',plusEmpty({posts:'尚未添加帖子',reels:'尚未添加 Reels',tagged:'暂无被标记的帖子'}[tab]));
  }
  plusProfileLayer.querySelectorAll('[data-user-tab]').forEach(b=>b.onclick=()=>drawTab(b.dataset.userTab));drawTab('posts');
  plusProfileLayer.querySelector('[data-user-back]').focus();if(!storyViewer.hidden)syncStoryVideo();
}
function openPlusUserNotifications(username){
  const state=plusState();state.settings.userNotifications||={};const value=state.settings.userNotifications[username]||{};
  const body=plusSheet('通知设置',`<p class="igp-hint">保存此模拟账号对 @${plusEsc(username)} 的通知偏好。</p>${[['posts','帖子'],['stories','快拍'],['reels','Reels']].map(([key,label])=>`<label class="igp-notification-option"><span>${label}</span><input type="checkbox" data-notification="${key}" ${value[key]?'checked':''}></label>`).join('')}`);
  body.querySelectorAll('[data-notification]').forEach(input=>input.onchange=()=>{state.settings.userNotifications[username]={...state.settings.userNotifications[username],[input.dataset.notification]:input.checked};plusCommit();});
}

})();