// 单独包起来，避免和其他文件的变量重名
(() => {
  const phone = document.querySelector(".lock-screen");
  const app = document.getElementById("kakao-app");
  const title = document.getElementById("kakao-title");
  const content = document.getElementById("kakao-content");
  const tabs = document.querySelectorAll("[data-kakao-tab]");

  const pageTitles = {
    friends: "好友",
    chats: "聊天",
    calls: "通话",
    more: "更多"
  };

// 暂时用于测试界面的聊天资料，可以直接修改韩语
const chatList = [
    {
    id: "dream-player",
    name: "내 사랑🖤",
    story: "dream",
    avatar: "",
    preview: "",
    time: "",
    unread: 0,
    replyOptions: []
  },
  {
    id: "itzy-group",
    name: "있지 💕",
    type: "group",
    members: ["예지", "리아", "류진", "채령", "유나"],
    sender:"유나",
    preview: "언니들 뭐 해요?",
    time: "14:05",
    unread: 3,
    avatar: ""
  },

  {
    id: "lia",
    name: "리아",
    preview: "밥 먹었어?",
    time: "13:42",
    unread: 1
  },
  {
    id: "ryujin",
    name: "류진",
    preview: "언니 지금 어디야?",
    time: "13:30",
    unread: 2
  },
  {
    id: "chaeryeong",
    name: "채령",
    preview: "언니 이따 봐요",
    time: "12:18",
    unread: 0
  },
  {
    id: "yuna",
    name: "유나",
    preview: "사진 보내줘요 ㅎㅎ",
    time: "11:56",
    unread: 0
  },
  {
    id: "manager",
    name: "매니저님",
    preview: "내일 스케줄 확인 부탁해요.",
    time: "昨天",
    unread: 0
  },
  {
  id: "jiwon",
  name: "한지원",
  preview: "잘 지내?",
  time: "12:00",
  unread: 0,
  avatar: ""
},
{
  id: "lee-jiwon",
  name: "이지원",
  avatar: "",
  preview: "",
  time: "",
  unread: 0,
  initialMessages: [],
  replyOptions: []
},
{
  id: "kim-yomi",
  name: "김요미",
  avatar: "",
  preview: "",
  time: "",
  unread: 0,
  initialMessages: [],
  replyOptions: []
},
{
  id: "jeonju-princess",
  name: "전주 공주🩷",
  type: "group",
  members: ["예지", "한지원", "이지원", "김요미"],
  avatar: "",
  preview: "",
  time: "",
  unread: 0,
  initialMessages: [],
  replyOptions: []
},
{
  id: "twice-jeongyeon",
  name: "TWICE-정연",
  avatar: "",
  preview: "",
  time: "",
  unread: 0,
  initialMessages: [],
  replyOptions: []
},
{
  id: "twice-sana",
  name: "TWICE-SANA",
  avatar: "",
  preview: "",
  time: "",
  unread: 0,
  initialMessages: [],
  replyOptions: []
},
{
  id: "aespa-jimin",
  name: "aespa-지민",
  avatar: "",
  preview: "",
  time: "",
  unread: 0,
  initialMessages: [],
  replyOptions: []
},
{
  id: "dad",
  name: "아빠",
  avatar: "",
  preview: "",
  time: "",
  unread: 0,
  initialMessages: [],
  replyOptions: []
},
{
  id: "mom",
  name: "엄마",
  avatar: "",
  preview: "",
  time: "",
  unread: 0,
  initialMessages: [],
  replyOptions: []
},
{
  id: "older-sister",
  name: "황언니",
  avatar: "",
  preview: "",
  time: "",
  unread: 0,
  initialMessages: [],
  replyOptions: []
},
{
  id: "family-group",
  name: "우리 집🏠",
  type: "group",
  members: ["예지", "아빠", "엄마", "황언니"],
  avatar: "",
  preview: "",
  time: "",
  unread: 0,
  initialMessages: [],
  replyOptions: []
},
];

// 当前打开的聊天
let activeChatId = null;
const chatSearch = document.getElementById("kakao-chat-search");
const chatSearchInput =
  document.getElementById("kakao-chat-search-input");
const chatSearchResult =
  document.getElementById("kakao-search-result");

// 根据关键词筛选当前已经显示的消息
function filterChatMessages() {
  const keyword = chatSearchInput.value.trim().toLocaleLowerCase();
  let count = 0;

  content.querySelectorAll(".kakao-message-row").forEach((row) => {
    const text = row.querySelector(".kakao-message-bubble")
      .textContent.toLocaleLowerCase();

    const matches = !keyword || text.includes(keyword);

    row.hidden = !matches;

    if (matches) count += 1;
  });

  chatSearchResult.textContent = keyword
    ? `找到 ${count} 条消息`
    : "";
}

// 关闭搜索并恢复全部消息
function resetChatSearch() {
  chatSearch.hidden = true;
  chatSearchInput.value = "";
  chatSearchResult.textContent = "";

  content.querySelectorAll(".kakao-message-row").forEach((row) => {
    row.hidden = false;
  });
}

document.getElementById("kakao-conversation-search")
  .addEventListener("click", () => {
    if (activeChatId === null) return;

    chatSearch.hidden = false;
    chatSearchInput.focus();
  });

chatSearchInput.addEventListener("input", filterChatMessages);

// 按 Enter 不刷新网页
chatSearch.addEventListener("submit", (event) => {
  event.preventDefault();
  filterChatMessages();
});

document.getElementById("kakao-chat-search-close")
  .addEventListener("click", resetChatSearch);

// 测试聊天记录，刷新页面后会重置
const conversations = {};

// 返回当前设备的本地日期
function getMessageDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMessageDate(value) {
  if (!value) return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return value;

  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}
// 获取当前设备时间，用于新发送的消息
function getMessageTime() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}
function getConversation(chat) {
  if (!conversations[chat.id]) {
    let initialMessages = [];

    if (Array.isArray(chat.initialMessages)) {
      // 优先使用完整的预设聊天记录
      initialMessages = chat.initialMessages.map((message) => ({
        ...message
      }));
    } else if ((chat.preview || "").trim()) {
      // 兼容之前只填写 preview 的聊天
      initialMessages = [
        {
          mine: false,
          sender: chat.sender || chat.name,
          avatar: chat.senderAvatar || chat.avatar || "",
          text: chat.preview,
          time: chat.time || ""
        }
      ];
    }

    conversations[chat.id] = {
      messages: initialMessages,
      replied: false,
      pending: false
    };
  }

  return conversations[chat.id];
}


// 打开聊天详情
function openConversation(chatId) {
  const chat = chatList.find((item) => item.id === chatId);

  if (!chat || !isVisibleInCurrentStory(chat)) return; 
  // 从好友页再次打开时，恢复聊天列表入口
removedChats.delete(removedChatKey(chat.id));
  activeChatId = chatId;

  const conversation = getConversation(chat);

  // 打开后清除这个聊天的未读数量
  chat.unread = 0;
  // 顶部显示当前联系人或群聊名称
  document.getElementById("kakao-conversation-title").textContent =
  getChatDisplayName(chat);

  // 左侧显示其他聊天的未读消息总数
  const totalUnread = chatList
  .filter(isVisibleInCurrentStory)
  .filter((item) => !isChatRemoved(item))
  .reduce((total, item) => {
    return total + item.unread;
  }, 0);
  document.getElementById("kakao-total-unread").textContent =
    totalUnread > 99 ? "99+" : String(totalUnread);

  title.textContent = getChatDisplayName(chat);
  app.classList.add("in-conversation");

  content.innerHTML = `
    <div class="kakao-messages" id="kakao-messages"></div>

    <div class="kakao-reply-panel"
         id="kakao-reply-panel" hidden></div>

    <div class="kakao-composer">
      <button
       type="button"
       class="kakao-composer-plus"
       aria-label="添加聊天附件"
     >＋</button>

      <button type="button" id="kakao-choose-reply">
        选择回复…
      </button>

      <span class="kakao-composer-smile" aria-hidden="true">☺</span>
    </div>
  `;

  const messages = document.getElementById("kakao-messages");

  
  let previousMessageDate = null;

conversation.messages.forEach((message) => {
  const messageDate = message.date || getMessageDate();

  if (messageDate !== previousMessageDate) {
    const dateLabel = document.createElement("div");
    dateLabel.className = "kakao-message-date";
    dateLabel.textContent = formatMessageDate(messageDate);

    messages.append(dateLabel);
    previousMessageDate = messageDate;
  }
    const row = document.createElement("div");
    row.className = message.mine
      ? "kakao-message-row mine"
      : "kakao-message-row";

    if (!message.mine) {
      const avatar = document.createElement("img");
      avatar.className = "kakao-message-avatar";
      if (chat.type === "group") {
  // 群聊根据发言成员查找头像
  const senderFriend = friendList.find(
    (item) => item.name === message.sender
  );

  avatar.src =
    message.avatar ||
    senderFriend?.avatar ||
    "./assets/avatars/default-avatar.png";
} else {
  avatar.src = getChatAvatar(chat);
}
      avatar.draggable = false;
      avatar.addEventListener("click", () => {
        previewMedia({
          type: "image",
          src: avatar.src,
          caption: message.sender || getChatDisplayName(chat)
        });
     });
      row.append(avatar);
    }

    const group = document.createElement("div");
    group.className = "kakao-message-group";

    if (!message.mine) {
      const name = document.createElement("div");
      name.className = "kakao-message-name";
      // 群聊显示具体成员，私聊显示设置后的联系人名称
      name.textContent = chat.type === "group"
        ? (message.sender || chat.name)
        : getChatDisplayName(chat);
      group.append(name);
    }

    const bubble = document.createElement("div");
    bubble.className = "kakao-message-bubble";
    if (message.type === "image" && message.src) {
  bubble.classList.add("kakao-image-bubble");

  const imageButton = document.createElement("button");
  imageButton.type = "button";
  imageButton.className = "kakao-message-image-button";
  imageButton.setAttribute("aria-label", "放大查看图片");

  const image = document.createElement("img");
  image.src = message.src;
  image.alt = message.text || "聊天图片";
  image.className = "kakao-message-image";
  image.loading = "lazy";

  // 图片加载完成后，保持消息滚动到底部
  image.addEventListener("load", () => {
    if (messages.scrollHeight - messages.scrollTop -
        messages.clientHeight < image.offsetHeight + 80) {
      messages.scrollTop = messages.scrollHeight;
    }
  });

  imageButton.append(image);

  imageButton.addEventListener("click", () => {
    previewMedia({
      type: "image",
      src: message.src,
      caption: message.text || "聊天图片"
    });
  });

  bubble.append(imageButton);
} else if (message.type === "location") {
  bubble.classList.add("kakao-location-bubble");

  const card = document.createElement("a");
  card.className = "kakao-location-card";

  // 点击后在浏览器地图中搜索这个地点
  const query = message.address || message.name || "";

  card.href =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query);

  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const map = document.createElement("div");
  map.className = "kakao-location-map";

  map.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="
        M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12Z
      "/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  `;

  const info = document.createElement("div");
  info.className = "kakao-location-info";

  const name = document.createElement("strong");
  name.textContent = message.name || "位置";

  const address = document.createElement("span");
  address.textContent = message.address || "";

  info.append(name, address);
  card.append(map, info);
  bubble.appendChild(card);
} else {
  bubble.textContent = message.text || "";
}

    group.append(bubble);
    row.append(group);

    // 只显示格式为“小时:分钟”的消息时间
    if (/^\d{2}:\d{2}$/.test(message.time || "")) {
      const clock = document.createElement("span");
      clock.className = "kakao-message-clock";
      clock.textContent = message.time;

      if (message.mine) {
        row.prepend(clock);
      } else {
        row.append(clock);
      }
    }

    messages.append(row);
  });

  if (conversation.pending) {
    const notice = document.createElement("div");
    notice.className = "kakao-typing";
    notice.textContent = "对方正在输入…";
    messages.append(notice);
  }

  const replyButton = document.getElementById("kakao-choose-reply");

  if (chat.replyOptions?.length === 0) {
  replyButton.disabled = true;
  replyButton.textContent = "暂无回复选项";
} else if (conversation.replied) {
  replyButton.disabled = true;
  replyButton.textContent = conversation.pending
    ? "等待对方回复…"
    : "暂无新的回复选项";
}

  replyButton.addEventListener("click", () => {
    const panel = document.getElementById("kakao-reply-panel");

    // 再次点击收起选项
    if (!panel.hidden) {
      panel.hidden = true;
      return;
    }

    panel.replaceChildren();
    panel.hidden = false;

    // 测试选项：[自己的回复，对方的回应]
    const options = chat.replyOptions ?? [
  ["응, 알겠어 ㅎㅎ", "좋아, 이따 봐!"],
  ["조금 있다가 연락할게.", "응, 기다릴게."]
];

    options.forEach(([reply, response]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = reply;

      button.addEventListener("click", () => {
        if (conversation.replied) return;

        conversation.replied = true;
        conversation.pending = true;
        conversation.messages.push({
          mine: true,
          text: reply,
          date: getMessageDate(),
          time: getMessageTime()
       });
        chat.preview = reply;
        openConversation(chatId);

        setTimeout(() => {
          conversation.pending = false;
          conversation.messages.push({
            mine: false,
            sender: chat.sender || chat.name,
            avatar: chat.senderAvatar || "",
            text: response,
            time: getMessageTime()
        });

          chat.preview = response;

          // 如果还在这个聊天，就更新消息
          if (!app.hidden && activeChatId === chatId) {
            openConversation(chatId);
          } else {
            // 离开聊天后收到消息，增加未读数
            chat.unread += 1;

            // 正停留在聊天列表时，刷新当前筛选结果
            const selectedFilter = content.querySelector(
              "[data-chat-filter].is-active"
            );

            if (!app.hidden && selectedFilter) {
              renderChatList(selectedFilter.dataset.chatFilter);
            }
          }
        }, 900);
      });

      panel.append(button);
    });

    messages.scrollTop = messages.scrollHeight;
  });

  // 收到消息重新绘制时，保持搜索条件
if (!chatSearch.hidden) {
  filterChatMessages();
}

messages.scrollTop = messages.scrollHeight;
}
// 好友资料：chatId 对应聊天列表里的 id
const friendList = [
    {
    chatId: "dream-player",
    name: "내 사랑🖤",
    story: "dream",
    status: "",
    avatar: ""
  },
  {
    chatId: "lia",
    name: "리아",
    status: "",
    avatar: ""
  },
  {
    chatId: "ryujin",
    name: "류진",
    status: "",
    avatar: ""
  },
  {
    chatId: "chaeryeong",
    name: "채령",
    status: "",
    avatar: ""
  },
  {
    chatId: "yuna",
    name: "유나",
    status: "",
    avatar: ""
  },
  {
    chatId: "manager",
    name: "매니저님",
    status: "",
    avatar: ""
  },
  {
  chatId: "jiwon",
  name: "한지원",
  status: "",
  avatar: ""
},
{
  chatId: "lee-jiwon",
  name: "이지원",
  status: "",
  avatar: ""
},
{
  chatId: "kim-yomi",
  name: "김요미",
  status: "",
  avatar: ""
},
{
  chatId: "twice-jeongyeon",
  name: "TWICE-정연",
  status: "",
  avatar: ""
},
{
  chatId: "twice-sana",
  name: "TWICE-SANA",
  status: "",
  avatar: ""
},
{
  chatId: "aespa-jimin",
  name: "aespa-지민",
  status: "",
  avatar: ""
},
{
  chatId: "dad",
  name: "아빠",
  status: "",
  avatar: ""
},
{
  chatId: "mom",
  name: "엄마",
  status: "",
  avatar: ""
},
{
  chatId: "older-sister",
  name: "황언니",
  status: "",
  avatar: ""
},
];
// 没有指定 story 的资料，两条线都显示
// 指定 story 的资料，只在对应故事线显示
function isVisibleInCurrentStory(item) {
  return !item.story ||
    item.story === phone.dataset.story;
}

// 创建好友列表
function renderFriendList() {
  const list = document.getElementById("kakao-friend-list");
  if (!list) return;

  list.replaceChildren();

  const visibleFriends = friendList.filter((friend) => {
    return (
      isVisibleInCurrentStory(friend) &&
      !isFriendHidden(friend)
    );
  });

  visibleFriends.forEach((friend) => {
    const wrapper = document.createElement("div");
    wrapper.className = "kakao-friend-edit-row";

    const row = document.createElement("button");
    row.type = "button";
    row.className = "kakao-friend-row";
    row.disabled = friendEditing;

    const avatar = document.createElement("img");
    avatar.className = "kakao-friend-avatar";
    avatar.src =
      friend.avatar || "./assets/avatars/default-avatar.png";
    avatar.alt = "";
    avatar.draggable = false;

    const info = document.createElement("div");
    info.className = "kakao-friend-info";

    const name = document.createElement("div");
    name.className = "kakao-friend-name";
    name.textContent = friend.name;
    info.appendChild(name);

    if (friend.status) {
      const status = document.createElement("div");
      status.className = "kakao-friend-status";
      status.textContent = friend.status;
      info.appendChild(status);
    }

    row.append(avatar, info);

    row.addEventListener("click", () => {
      if (!friendEditing) {
        openConversation(friend.chatId);
      }
    });

    wrapper.appendChild(row);

    if (friendEditing) {
      const hideButton = document.createElement("button");
      hideButton.type = "button";
      hideButton.className = "kakao-friend-hide-button";
      hideButton.textContent = "隐藏";
      hideButton.setAttribute("aria-label", `隐藏 ${friend.name}`);

      hideButton.addEventListener("click", () => {
        openHideFriendDialog(friend);
      });

      wrapper.appendChild(hideButton);
    }

    list.appendChild(wrapper);
  });
}
// 创建聊天列表
function renderChatList(filter = "all") {
  const list = document.getElementById("kakao-chat-list");
  list.replaceChildren();

  const visibleChats = chatList.filter((chat) => {
  return isVisibleInCurrentStory(chat) &&
    !isChatRemoved(chat) &&
    (filter === "all" || chat.unread > 0);
});
  // 收藏的聊天排在前面，其他聊天保持原来的顺序
const story = phone.dataset.story || "default";
const sortMode = getChatSortMode();

visibleChats.sort((a, b) => {
  const aFavorite = infoFavorites.has(`${story}:${a.id}`);
  const bFavorite = infoFavorites.has(`${story}:${b.id}`);

  // 保留之前设置的收藏置顶
  const favoriteDifference =
    Number(bFavorite) - Number(aFavorite);

  if (favoriteDifference !== 0) {
    return favoriteDifference;
  }

  // 按未读：在同一收藏分组里，未读聊天优先
  if (sortMode === "unread") {
    const unreadDifference =
      Number(Number(b.unread || 0) > 0) -
      Number(Number(a.unread || 0) > 0);

    if (unreadDifference !== 0) {
      return unreadDifference;
    }
  }

  // 三种排序均以最新消息时间作为后续排序依据
  return getChatSortTime(b) - getChatSortTime(a);
});

  visibleChats.forEach((chat) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "kakao-chat-row";
    row.dataset.chatId = chat.id;
    row.addEventListener("click", () => {
       openConversation(chat.id);
    });

    const avatar = document.createElement("img");
    avatar.className = "kakao-chat-avatar";
    avatar.src = getChatAvatar(chat);
    avatar.alt = "";
    avatar.draggable = false;

    const info = document.createElement("div");
    info.className = "kakao-chat-info";

    const name = document.createElement("div");
    name.className = "kakao-chat-name";
    name.textContent = getChatDisplayName(chat);
    // 已静音的聊天显示小铃铛标识
    const isMuted = mutedChats.has(
      `${phone.dataset.story || "default"}:${chat.id}`
    );

    if (isMuted) {
      const muteIcon = document.createElement("span");
      muteIcon.className = "kakao-chat-muted";
      muteIcon.setAttribute("aria-label", "此聊天已静音");

      muteIcon.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9a6 6 0 0 1 12 0v6l2 3H4l2-3Z"></path>
          <path d="M10 21h4M3 3l18 18"></path>
        </svg>
      `;

      name.append(muteIcon);
    }
    // 标记已收藏、置顶的聊天
    const isFavorite = infoFavorites.has(
      `${phone.dataset.story || "default"}:${chat.id}`
    );

    row.classList.toggle("is-pinned", isFavorite);

    if (isFavorite) {
      const star = document.createElement("span");
      star.className = "kakao-pinned-star";
      star.textContent = "★";
      star.setAttribute("aria-label", "已收藏并置顶");

      name.append(star);
    }

    const preview = document.createElement("div");
    preview.className = "kakao-chat-preview";
    const conversation = getConversation(chat);

const lastMessage = conversation.messages[
  conversation.messages.length - 1
];

preview.textContent = lastMessage?.type === "image"
  ? "[图片]"
  : (lastMessage?.text || "");

    info.append(name, preview);

    const meta = document.createElement("div");
    meta.className = "kakao-chat-meta";

    const time = document.createElement("span");
    time.className = "kakao-chat-time";
    time.textContent = lastMessage?.time || "";
    meta.append(time);

    if (chat.unread > 0) {
      const badge = document.createElement("span");
      badge.className = "kakao-unread";
      badge.textContent = chat.unread;
      meta.append(badge);
    }

    row.append(avatar, info, meta);
    list.append(row);
  });

  if (visibleChats.length === 0) {
    const empty = document.createElement("p");
    empty.className = "kakao-placeholder";
    empty.textContent = "暂无未读消息";
    list.append(empty);
  }
}
  // 个人资料：后面在这里连接头像图片
  function profileMarkup() {
    return `
      <div class="kakao-profile">
        <img
          class="kakao-profile-avatar"
          src="./assets/avatars/default-avatar.png"
          alt="默认头像"
          draggable="false"
        >

        <div>
          <div class="kakao-profile-name">황예지</div>
          <div class="kakao-profile-note">YEJI</div>
        </div>
      </div>
    `;
  }

  // 切换底部页面
  function showPage(page) {
    closeGeneralSettings();
    closeAttachments();
    closeOutgoingCall();
    closeCallPicker();
    closeChatSettingsMenu();
    closeOpenChatSheet();
    closeStartChat();
    closeFriendManage();
    stopFriendEditing();
    closeFriendSettingsMenu();
    closeAddFriend();
    closeChatInfo();
    resetChatSearch();
    closeMainSearch();
    activeChatId = null;
    app.classList.remove("in-conversation");

    title.textContent = pageTitles[page];
    updateKakaoHeader(page);

    tabs.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.kakaoTab === page)
      );
    });

    if (page === "chats") {
      content.innerHTML = `
        <div class="kakao-filters">
          <button type="button"
                  class="kakao-filter is-active"
                  data-chat-filter="all">
            全部
          </button>

          <button type="button"
                  class="kakao-filter"
                  data-chat-filter="unread">
            未读
          </button>
        </div>

        <div class="kakao-chat-list" id="kakao-chat-list"></div>
      `;renderChatList();
    }

    if (page === "friends") {
      content.innerHTML = `
        ${profileMarkup()}

        <div class="kakao-friend-section">
          <span>好友 ${friendList.filter(isVisibleInCurrentStory).length}</span>
         <span aria-hidden="true">⌃</span>
        </div>
        <div id="kakao-friend-list"></div>
      `;

      renderFriendList();
    }
    if (page === "calls") {
      renderCallsPage();
    }

    if (page === "more") {
      renderMorePage();
    }

    content.scrollTop = 0;
  }

  function openKakao() {
    // 仅允许解锁后打开
    if (!phone.classList.contains("is-unlocked")) return;

    document.getElementById("folder-overlay").hidden = true;
    app.hidden = false;
    phone.classList.add("kakao-open");
    showPage("chats");
  }


  function closeKakao() {
    closeGeneralSettings();
    closeAttachments();
    closeOutgoingCall();
    closeCallPicker();
    closeChatSettingsMenu();
    closeOpenChatSheet();
    closeStartChat();
    closeFriendManage();
    stopFriendEditing();
    closeFriendSettingsMenu();
    closeAddFriend();
    closeChatInfo();
    resetChatSearch();
    closeMainSearch();  
    resetChatSearch();

  activeChatId = null;
  app.classList.remove("in-conversation");
  app.hidden = true;
  phone.classList.remove("kakao-open");

  document.querySelector('[data-app="kakao"]')?.focus();
}

  // 点击桌面上的 KakaoTalk 图标
  document.getElementById("desktop")
    .addEventListener("click", (event) => {
      const button = event.target.closest("[data-app]");

      if (button?.dataset.app === "kakao") {
        openKakao();
      }
    });

   // 聊天详情左上角返回列表
    document.getElementById("kakao-conversation-back")
  .addEventListener("click", () => {
    resetChatSearch();
    showPage("chats");
  });
    // 底部导航
  tabs.forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.kakaoTab);
    });
  });

  // 全部／未读筛选
  content.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chat-filter]");
    if (!button) return;

    content.querySelectorAll("[data-chat-filter]")
      .forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });

    renderChatList(button.dataset.chatFilter);
  });

  // 主界面搜索面板
const mainSearchPanel = document.createElement("section");
mainSearchPanel.className = "kakao-main-search";
mainSearchPanel.hidden = true;

mainSearchPanel.innerHTML = `
  <form class="kakao-main-search-form">
    <input type="search"
           placeholder="搜索联系人或聊天记录"
           aria-label="搜索联系人或聊天记录"
           autocomplete="off">

    <button type="button" class="kakao-main-search-cancel">
      取消
    </button>
  </form>

  <div class="kakao-main-search-results"
       aria-live="polite"></div>
`;

app.append(mainSearchPanel);

const mainSearchInput = mainSearchPanel.querySelector("input");
const mainSearchResults = mainSearchPanel.querySelector(
  ".kakao-main-search-results"
);

function closeMainSearch() {
  mainSearchPanel.hidden = true;
  mainSearchInput.value = "";
  mainSearchResults.replaceChildren();
}

function searchAllChats() {
  const keyword = mainSearchInput.value.trim().toLocaleLowerCase();
  mainSearchResults.replaceChildren();

  if (!keyword) {
    mainSearchResults.textContent = "输入姓名或消息关键词";
    return;
  }

  let resultCount = 0;

  chatList.forEach((chat) => {
    if (
  !isVisibleInCurrentStory(chat) ||
  isChatRemoved(chat)
) return;
    const friend = friendList.find(
      (item) => item.chatId === chat.id
    );

    // 同时支持好友备注名和聊天名称
    const names = [
      chat.name,
      friend?.name || "",
      getChatDisplayName(chat)
    ];
    const nameMatches = names.some(
      (name) => name.toLocaleLowerCase().includes(keyword)
    );

    // 包括初始消息和本次游玩中产生的消息
    const conversation = getConversation(chat);

    const matchedMessages = conversation.messages.filter(
      (message) =>
        (message.text || "").toLocaleLowerCase().includes(keyword)
    );

    if (!nameMatches && matchedMessages.length === 0) return;

    resultCount += 1;

    const row = document.createElement("button");
    row.type = "button";
    row.className = "kakao-chat-row";

    const avatar = document.createElement("img");
    avatar.className = "kakao-chat-avatar";
    avatar.src =
      friend?.avatar ||
      chat.avatar ||
      "./assets/avatars/default-avatar.png";
    avatar.alt = "";

    const info = document.createElement("div");
    info.className = "kakao-chat-info";

    const name = document.createElement("div");
    name.className = "kakao-chat-name";
    name.textContent = getChatDisplayName(chat);

    const preview = document.createElement("div");
    preview.className = "kakao-search-preview";

    preview.textContent = matchedMessages.length > 0
      ? `找到 ${matchedMessages.length} 条消息：${matchedMessages[0].text}`
      : "联系人匹配";

    info.append(name, preview);
    row.append(avatar, info);

    row.addEventListener("click", () => {
      closeMainSearch();
      resetChatSearch();
      openConversation(chat.id);
    });

    mainSearchResults.append(row);
  });

  if (resultCount === 0) {
    mainSearchResults.textContent = "没有找到联系人或聊天记录";
  }
}

document.getElementById("kakao-search")
  .addEventListener("click", () => {
    resetChatSearch();
    mainSearchPanel.hidden = false;
    searchAllChats();
    mainSearchInput.focus();
  });

mainSearchInput.addEventListener("input", searchAllChats);

mainSearchPanel.querySelector("form")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    searchAllChats();
  });

mainSearchPanel.querySelector(".kakao-main-search-cancel")
  .addEventListener("click", closeMainSearch);

  // 返回桌面
  document.getElementById("kakao-exit")
   .addEventListener("click", () => {
     if (activeChatId !== null) {
       showPage("chats");
     } else {
       closeKakao();
     }
   });

  const homeBar = document.getElementById("kakao-home");
let homeStart = null;

homeBar.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;

  homeStart = {
    x: event.clientX,
    y: event.clientY
  };

  homeBar.setPointerCapture(event.pointerId);
});

homeBar.addEventListener("pointerup", (event) => {
  if (!homeStart) return;

  const distanceY = homeStart.y - event.clientY;
  const distanceX = Math.abs(event.clientX - homeStart.x);

  homeStart = null;

  // 向上滑动超过 30px，且主要是纵向滑动
  if (distanceY > 30 && distanceY > distanceX) {
    closeKakao();
  }
});

homeBar.addEventListener("pointercancel", () => {
  homeStart = null;
});

  // 电脑预览时，也可以按 Esc 返回桌面
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !app.hidden) {
      closeKakao();
    }
  });
// 创建聊天信息页
const infoScreen = document.createElement("section");
infoScreen.className = "kakao-info-screen";
infoScreen.hidden = true;
infoScreen.setAttribute("aria-label", "聊天信息");

infoScreen.innerHTML = `
  <button type="button"
          class="kakao-info-back"
          id="kakao-info-back"
          aria-label="返回聊天">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 4-8 8 8 8"></path>
    </svg>
  </button>

  <button type="button"
          class="kakao-info-notification"
          id="kakao-info-notification"
          aria-label="关闭聊天通知"
          aria-pressed="false">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9a6 6 0 0 1 12 0v6l2 3H4l2-3Z"></path>
      <path d="M10 21h4"></path>
      <path class="notification-slash" d="M3 3l18 18"></path>
    </svg>
  </button>
  <button type="button"
        class="kakao-info-favorite"
        id="kakao-info-favorite"
        aria-label="收藏聊天"
        aria-pressed="false">
     <svg viewBox="0 0 24 24" aria-hidden="true">
       <path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"></path>
     </svg>
  </button>

  <button type="button"
        class="kakao-info-settings"
        id="kakao-info-settings"
        aria-label="聊天设置">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 3-1
             2 3 3-1 1-3 3-1 2-3-2-2 1-3-3-2-3 1-2-3Z">
    </path>
    <circle cx="12" cy="11" r="3"></circle>
  </svg>
</button>
  <div class="kakao-info-profile">
    <img id="kakao-info-avatar"
         alt="" draggable="false">
    <h2 id="kakao-info-name"></h2>
  </div>

  <div id="kakao-info-details">
  <div class="kakao-info-card">
    <button type="button" id="kakao-open-media">
      <span class="info-green">▧</span>图片 / 视频
    </button>
    <button type="button" id="kakao-open-files">
      <span class="info-gray">▤</span>文件
    </button>
    <button type="button" id="kakao-open-links">
      <span class="info-blue">↗</span>链接
    </button>
    <button type="button" id="kakao-open-events">
      <span class="info-blue">▣</span>日程
    </button>
  </div>

  <div class="kakao-info-card kakao-info-grid">
    <button type="button" id="kakao-open-boards">
      <span class="info-gray">▤</span>Boards
    </button>
    <button type="button" id="kakao-open-announcements">
      <span class="info-blue">⚑</span>公告
    </button>
    <button type="button" id="kakao-open-polls">
      <span class="info-purple">☑</span>投票
    </button>
  </div>

  <div class="kakao-info-card">
    <button type="button" disabled>
      <span class="info-gray">♟</span>
      Chatbot <em>beta</em>
    </button>
  </div>

  <div class="kakao-info-card kakao-info-members-card">
    <h3 id="kakao-info-member-count">参与者</h3>

    <button type="button"
            class="kakao-info-invite"
            id="kakao-info-invite">
      <span>＋</span>邀请
    </button>

    <div id="kakao-info-members"></div>
  </div>

  <div class="kakao-info-card">
    <button type="button" id="kakao-create-secret">
      创建秘密聊天室
    </button>
    <button type="button"
            class="kakao-info-leave"
            id="kakao-leave-chat">
      离开聊天室
    </button>
  </div>
</div>
`;

app.append(infoScreen);

const infoMenuButton = document.getElementById("kakao-menu-button");

function openChatInfo() {
  const chat = chatList.find((item) => item.id === activeChatId);
  if (!chat) return;

  document.getElementById("kakao-info-name").textContent =
    chat.name;

  document.getElementById("kakao-info-avatar").src =
    getChatAvatar(chat);

  // 群聊显示成员名单；私聊显示礼志和联系人
const members = getInfoMembers(chat);
// 群聊和已经创建的秘密聊天，不再显示创建入口
document.getElementById("kakao-create-secret").hidden =
  chat.type === "group" || chat.isSecret === true;

// 邀请入口只在群聊显示
document.getElementById("kakao-info-invite").hidden =
  chat.type !== "group";

document.getElementById("kakao-info-member-count").textContent =
  `参与者 ${members.length}`;

const memberList = document.getElementById("kakao-info-members");
memberList.replaceChildren();

members.forEach((member) => {
  const friend = friendList.find((item) => item.name === member);

  const row = document.createElement("div");
  row.className = "kakao-info-member";

  const avatar = document.createElement("img");
  avatar.src =
    getChatAvatar(chat);
  avatar.alt = "";
  avatar.draggable = false;

  const name = document.createElement("span");
  name.textContent = member;

  row.append(avatar);

  if (member === "예지") {
    const tag = document.createElement("small");
    tag.textContent = "me";
    row.append(tag);
  }

  row.append(name);
  memberList.append(row);
});
  updateFavoriteButton();
  updateNotificationButton();
  updateInfoDisplayName();
  infoScreen.hidden = false;
  infoScreen.scrollTop = 0;
  phone.classList.add("kakao-info-open");
  infoMenuButton.setAttribute("aria-expanded", "true");

  document.getElementById("kakao-info-back").focus();
}

function closeChatInfo() {
    closeChatSettings();
    closeLinksPage();
    closeMediaPage();

  infoScreen.hidden = true;
  phone.classList.remove("kakao-info-open");
  infoMenuButton.setAttribute("aria-expanded", "false");
}

infoMenuButton.addEventListener("click", openChatInfo);

document.getElementById("kakao-info-back")
  .addEventListener("click", () => {
    closeChatInfo();
    infoMenuButton.focus();
  });

// Esc 优先返回聊天，不直接退出应用
document.addEventListener("keydown", (event) => {
 if (
  event.key === "Escape" &&
  !infoScreen.hidden &&
  mediaScreen.hidden &&
  mediaViewer.hidden &&
  linksScreen.hidden &&
  settingsScreen.hidden
) {
    event.preventDefault();
    event.stopImmediatePropagation();

    closeChatInfo();
    infoMenuButton.focus();
  }
}, true);  
// 各个聊天的图片、视频资料
// 键名与 chatList 中的 id 一致
const chatMedia = {
  "itzy-group": [],
  lia: [],
  ryujin: [],
  chaeryeong: [],
  yuna: [],
  manager: [],
  jiwon: []
};

// 媒体列表页面
const mediaScreen = document.createElement("section");
mediaScreen.className = "kakao-media-screen";
mediaScreen.hidden = true;

mediaScreen.innerHTML = `
  <header class="kakao-media-header">
    <button type="button" id="kakao-media-back"
            aria-label="返回聊天信息">‹</button>
    <strong>图片 / 视频</strong>
    <span></span>
  </header>

  <div class="kakao-media-grid" id="kakao-media-grid"></div>
`;

app.append(mediaScreen);

// 大图、视频查看层
const mediaViewer = document.createElement("section");
mediaViewer.className = "kakao-media-viewer";
mediaViewer.hidden = true;

mediaViewer.innerHTML = `
  <button type="button" id="kakao-viewer-close"
          aria-label="关闭预览">×</button>
  <div id="kakao-viewer-content"></div>
`;

app.append(mediaViewer);

function closeMediaViewer() {
  // 清空播放器，同时停止视频播放
  document.getElementById("kakao-viewer-content")
    .replaceChildren();

  mediaViewer.hidden = true;
}

function closeMediaPage() {
  closeMediaViewer();
  mediaScreen.hidden = true;
}

function previewMedia(item) {
  const container = document.getElementById("kakao-viewer-content");
  container.replaceChildren();

  let element;

  if (item.type === "video") {
    element = document.createElement("video");
    element.controls = true;
    element.playsInline = true;
    element.preload = "metadata";
  } else {
    element = document.createElement("img");
    element.alt = item.caption || "聊天图片";
  }

  element.src = item.src;
  container.append(element);
  mediaViewer.hidden = false;
}

function openMediaPage() {
  if (activeChatId === null) return;

  const grid = document.getElementById("kakao-media-grid");
  grid.replaceChildren();

  const items = chatMedia[activeChatId] || [];

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "kakao-media-empty";
    empty.textContent = "暂无图片或视频";
    grid.append(empty);
  }

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kakao-media-item";
    button.setAttribute(
      "aria-label",
      item.caption || (item.type === "video" ? "查看视频" : "查看图片")
    );

    if (item.type === "video") {
      const label = document.createElement("span");
      label.className = "kakao-media-video-label";
      label.textContent = "▶ 视频";
      button.append(label);

      // 有封面时显示封面；没有时显示文字
      if (item.poster) {
        const image = document.createElement("img");
        image.src = item.poster;
        image.alt = "";
        button.prepend(image);
      }
    } else {
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.caption || "";
      image.loading = "lazy";
      button.append(image);
    }

    button.addEventListener("click", () => previewMedia(item));
    grid.append(button);
  });

  mediaScreen.hidden = false;
  grid.scrollTop = 0;
}

document.getElementById("kakao-open-media")
  .addEventListener("click", openMediaPage);

document.getElementById("kakao-media-back")
  .addEventListener("click", closeMediaPage);

document.getElementById("kakao-viewer-close")
  .addEventListener("click", closeMediaViewer);

// Esc 按页面层级逐层返回
document.addEventListener("keydown", (event) => {
  if (mediaViewer.hidden && mediaScreen.hidden) return;
  if (event.key !== "Escape") return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (!mediaViewer.hidden) {
    closeMediaViewer();
  } else {
    closeMediaPage();
  }
}, true);
// 各个聊天分享的链接
// 键名与 chatList 中的 id 对应
const chatLinks = {
  "itzy-group": [],
  lia: [],
  ryujin: [],
  chaeryeong: [],
  yuna: [],
  manager: [],
  jiwon: []
};

// 链接资料页
const linksScreen = document.createElement("section");
linksScreen.className = "kakao-links-screen";
linksScreen.hidden = true;

linksScreen.innerHTML = `
  <header class="kakao-links-header">
    <button type="button" id="kakao-links-back"
            aria-label="返回聊天信息">‹</button>
    <strong>链接</strong>
    <span></span>
  </header>

  <div class="kakao-links-list" id="kakao-links-list"></div>
`;

app.append(linksScreen);

function closeLinksPage() {
  linksScreen.hidden = true;
}

function openLinksPage() {
  linksScreen.querySelector(
     ".kakao-links-header strong"
  ).textContent = "链接";
  if (activeChatId === null) return;

  const list = document.getElementById("kakao-links-list");
  list.replaceChildren();

  const items = chatLinks[activeChatId] || [];

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "kakao-links-empty";
    empty.textContent = "暂无分享的链接";
    list.append(empty);
  }

  items.forEach((item) => {
    // 只允许普通网页链接
    let url;

    try {
      url = new URL(item.url);
      if (!["http:", "https:"].includes(url.protocol)) return;
    } catch {
      return;
    }

    const card = document.createElement("a");
    card.className = "kakao-link-card";
    card.href = url.href;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    if (item.image) {
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = "";
      image.loading = "lazy";
      card.append(image);
    }

    const info = document.createElement("div");
    info.className = "kakao-link-info";

    const heading = document.createElement("strong");
    heading.textContent = item.title || url.hostname;

    const description = document.createElement("p");
    description.textContent = item.description || "";

    const domain = document.createElement("small");
    domain.textContent = url.hostname;

    info.append(heading, description, domain);
    card.append(info);
    list.append(card);
  });

  linksScreen.hidden = false;
  list.scrollTop = 0;
}

document.getElementById("kakao-open-links")
  .addEventListener("click", openLinksPage);

document.getElementById("kakao-links-back")
  .addEventListener("click", closeLinksPage);

// Esc 从链接页返回聊天信息页
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || linksScreen.hidden) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  closeLinksPage();
}, true);
// 聊天信息页的悬浮滚动条
const infoScrollIndicator = document.createElement("div");
infoScrollIndicator.className = "ki-scroll-indicator";
infoScrollIndicator.hidden = true;
infoScrollIndicator.setAttribute("aria-hidden", "true");

const infoScrollThumb = document.createElement("div");
infoScrollThumb.className = "ki-scroll-thumb";

infoScrollIndicator.append(infoScrollThumb);
app.append(infoScrollIndicator);

function updateInfoScrollbar() {
  const visibleHeight = infoScreen.clientHeight;
  const contentHeight = infoScreen.scrollHeight;
  const maxScroll = contentHeight - visibleHeight;

  infoScrollIndicator.hidden =
    infoScreen.hidden || maxScroll <= 1;

  if (infoScrollIndicator.hidden) return;

  const trackHeight = infoScrollIndicator.clientHeight;

  // 指示条长度限制在 20～40px，不再拉得很长
  const thumbHeight = Math.min(
    trackHeight,
    Math.max(20, Math.min(40, trackHeight * 0.07))
  );

  const progress = Math.max(
    0,
    Math.min(1, infoScreen.scrollTop / maxScroll)
  );

  infoScrollThumb.style.height = `${thumbHeight}px`;

  infoScrollThumb.style.transform =
    `translateY(${progress * (trackHeight - thumbHeight)}px)`;
}

infoScreen.addEventListener(
  "scroll",
  updateInfoScrollbar,
  { passive: true }
);

// 切换页面、增加内容或加载图片后更新长度
const infoScrollObserver = new MutationObserver(
  updateInfoScrollbar
);

infoScrollObserver.observe(infoScreen, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["hidden"]
});

infoScreen.addEventListener("load", updateInfoScrollbar, true);

const infoScrollResizeObserver = new ResizeObserver(
  updateInfoScrollbar
);

infoScrollResizeObserver.observe(infoScreen);
infoScrollResizeObserver.observe(app);
// 每个故事线、每个聊天分别记录收藏状态
// 从当前浏览器读取收藏记录
const favoritesStorageKey = "pickphone.kkt.favorites.v1";

let savedFavorites = [];

try {
  const saved = JSON.parse(
    localStorage.getItem(favoritesStorageKey) || "[]"
  );

  if (Array.isArray(saved)) {
    savedFavorites = saved.filter(
      (item) => typeof item === "string"
    );
  }
} catch {
  savedFavorites = [];
}

const infoFavorites = new Set(savedFavorites);

const favoriteButton =
  document.getElementById("kakao-info-favorite");

function favoriteKey() {
  return `${phone.dataset.story || "default"}:${activeChatId}`;
}

function updateFavoriteButton() {
  const selected = infoFavorites.has(favoriteKey());

  favoriteButton.classList.toggle("is-favorite", selected);

  favoriteButton.setAttribute(
    "aria-pressed",
    String(selected)
  );

  favoriteButton.setAttribute(
    "aria-label",
    selected ? "取消收藏" : "收藏聊天"
  );
}

favoriteButton.addEventListener("click", () => {
  if (activeChatId === null) return;

  const key = favoriteKey();

  if (infoFavorites.has(key)) {
    infoFavorites.delete(key);
  } else {
    infoFavorites.add(key);
  }

  // 保存收藏记录
  try {
    localStorage.setItem(
      favoritesStorageKey,
      JSON.stringify([...infoFavorites])
    );
  } catch {
    console.warn("收藏未能保存，当前页面内仍可使用。");
  }

  updateFavoriteButton();
});
// 静音状态：按故事线和聊天分别保存
const mutedStorageKey = "pickphone.kkt.muted.v1";

let savedMutedChats = [];

try {
  const saved = JSON.parse(
    localStorage.getItem(mutedStorageKey) || "[]"
  );

  if (Array.isArray(saved)) {
    savedMutedChats = saved.filter(
      (item) => typeof item === "string"
    );
  }
} catch {
  savedMutedChats = [];
}

const mutedChats = new Set(savedMutedChats);

const notificationButton =
  document.getElementById("kakao-info-notification");

function notificationKey() {
  return `${phone.dataset.story || "default"}:${activeChatId}`;
}

function updateNotificationButton() {
  const muted = mutedChats.has(notificationKey());

  notificationButton.classList.toggle("is-muted", muted);

  notificationButton.setAttribute(
    "aria-pressed",
    String(muted)
  );

  notificationButton.setAttribute(
    "aria-label",
    muted ? "开启聊天通知" : "关闭聊天通知"
  );

  notificationButton.title =
    muted ? "已静音，点击开启通知" : "通知已开启，点击静音";
}

notificationButton.addEventListener("click", () => {
  if (activeChatId === null) return;

  const key = notificationKey();

  if (mutedChats.has(key)) {
    mutedChats.delete(key);
  } else {
    mutedChats.add(key);
  }

  try {
    localStorage.setItem(
      mutedStorageKey,
      JSON.stringify([...mutedChats])
    );
  } catch {
    console.warn("静音状态未能保存，当前页面内仍可使用。");
  }

  updateNotificationButton();
});
// 聊天信息页显示名称
const infoNameStoragePrefix = "pickphone.kkt.info-name.v1.";

const settingsScreen = document.createElement("section");
settingsScreen.className = "kakao-chat-settings";
settingsScreen.hidden = true;

settingsScreen.innerHTML = `
  <header class="kakao-settings-header">
    <button type="button" id="kakao-settings-back"
            aria-label="返回聊天信息">‹</button>
    <strong>聊天设置</strong>
    <span></span>
  </header>

  <form id="kakao-settings-form">
    <label for="kakao-settings-name">信息页显示名称</label>

    <input id="kakao-settings-name"
           type="text"
           maxlength="40"
           autocomplete="off"
           required>

    <p>修改聊天显示名称，好友列表名称保持不变。</p>

    <button type="submit" class="kakao-settings-save">
      保存
    </button>

    <div id="kakao-settings-error" aria-live="polite"></div>
  </form>
`;

app.append(settingsScreen);

const settingsNameInput =
  document.getElementById("kakao-settings-name");

const settingsError =
  document.getElementById("kakao-settings-error");

function infoNameStorageKey() {
  return infoNameStoragePrefix +
    `${phone.dataset.story || "default"}:${activeChatId}`;
}

// 优先使用聊天头像，其次使用好友资料里的头像
function getChatAvatar(chat) {
  if (!chat) {
    return "./assets/avatars/default-avatar.png";
  }

  const friend = friendList.find(
    (item) => item.chatId === chat.id
  );

  return chat.avatar ||
    friend?.avatar ||
    "./assets/avatars/default-avatar.png";
}
// 读取任意聊天的显示名称
function getChatDisplayName(chat) {
  if (!chat) return "";

  const story = phone.dataset.story || "default";

  const key =
    infoNameStoragePrefix + `${story}:${chat.id}`;

  try {
    return localStorage.getItem(key) || chat.name;
  } catch {
    return chat.name;
  }
}

// 读取当前聊天的显示名称
function getInfoDisplayName() {
  const chat = chatList.find(
    (item) => item.id === activeChatId
  );

  return getChatDisplayName(chat);
}

function updateInfoDisplayName() {
  document.getElementById("kakao-info-name").textContent =
    getInfoDisplayName();
}

function closeChatSettings() {
  settingsScreen.hidden = true;
}

document.getElementById("kakao-info-settings")
  .addEventListener("click", () => {
    if (activeChatId === null) return;

    settingsNameInput.value = getInfoDisplayName();
    settingsError.textContent = "";
    settingsScreen.hidden = false;
    settingsNameInput.focus();
  });

document.getElementById("kakao-settings-back")
  .addEventListener("click", closeChatSettings);

document.getElementById("kakao-settings-form")
  .addEventListener("submit", (event) => {
    event.preventDefault();

    const name = settingsNameInput.value.trim();

    if (!name) {
      settingsError.textContent = "名称不能为空";
      return;
    }

    try {
      localStorage.setItem(infoNameStorageKey(), name);
    } catch {
      settingsError.textContent = "保存失败，请检查浏览器存储空间";
      return;
    }

    updateInfoDisplayName();

const chat = chatList.find(
  (item) => item.id === activeChatId
);

if (chat) {
  const displayName = getChatDisplayName(chat);

  title.textContent = displayName;

  document.getElementById(
    "kakao-conversation-title"
  ).textContent = displayName;
}

closeChatSettings();
  });

// 设置页按 Esc 返回信息页
settingsScreen.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeChatSettings();
  }
});
// 点击聊天信息页头像，放大查看
document.getElementById("kakao-info-avatar")
  .addEventListener("click", (event) => {
    previewMedia({
      type: "image",
      src: event.currentTarget.src,
      caption: getInfoDisplayName()
    });
  });
  // 每个聊天分享的文件
const chatFiles = {
  "dream-player": [],
  "itzy-group": [],
  lia: [],
  ryujin: [],
  chaeryeong: [],
  yuna: [],
  manager: [],
  jiwon: []
};

function openFilesPage() {
  if (activeChatId === null) return;

  // 复用原来的链接列表页面
  linksScreen.querySelector(
    ".kakao-links-header strong"
  ).textContent = "文件";

  const list = document.getElementById("kakao-links-list");
  list.replaceChildren();

  const files = chatFiles[activeChatId] || [];

  if (files.length === 0) {
    const empty = document.createElement("p");
    empty.className = "kakao-links-empty";
    empty.textContent = "暂无分享的文件";
    list.append(empty);
  }

  files.forEach((file) => {
    let url;

    try {
      url = new URL(file.url, location.href);

      if (!["http:", "https:", "file:"].includes(url.protocol)) {
        return;
      }
    } catch {
      return;
    }

    const card = document.createElement("a");
    card.className = "kakao-link-card";
    card.href = url.href;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.download = file.name || "";

    const info = document.createElement("div");
    info.className = "kakao-link-info";

    const name = document.createElement("strong");
    name.textContent = file.name || "未命名文件";

    const description = document.createElement("p");
    description.textContent = file.description || "";

    const hint = document.createElement("small");
    hint.textContent = "点击打开或下载";

    info.append(name, description, hint);
    card.append(info);
    list.append(card);
  });

  linksScreen.hidden = false;
  list.scrollTop = 0;
}

document.getElementById("kakao-open-files")
  .addEventListener("click", openFilesPage);
// 各个聊天的日程
const chatEvents = {
  "dream-player": [],
  "itzy-group": [],
  lia: [],
  ryujin: [],
  chaeryeong: [],
  yuna: [],
  manager: [],
  jiwon: []
};

function openEventsPage() {
  if (activeChatId === null) return;

  linksScreen.querySelector(
    ".kakao-links-header strong"
  ).textContent = "日程";

  const list = document.getElementById("kakao-links-list");
  list.replaceChildren();

  // 复制后排序，不改变原始资料
  const events = [...(chatEvents[activeChatId] || [])];

  events.sort((a, b) => {
    const aTime = `${a.date || ""} ${a.time || ""}`;
    const bTime = `${b.date || ""} ${b.time || ""}`;

    return aTime.localeCompare(bTime);
  });

  if (events.length === 0) {
    const empty = document.createElement("p");
    empty.className = "kakao-links-empty";
    empty.textContent = "暂无日程";
    list.append(empty);
  }

  events.forEach((event) => {
    const card = document.createElement("div");
    card.className = "kakao-link-card";

    const info = document.createElement("div");
    info.className = "kakao-link-info";

    const title = document.createElement("strong");
    title.textContent = event.title || "未命名日程";

    const date = document.createElement("p");
    date.textContent = [
      event.date,
      event.time || "全天"
    ].filter(Boolean).join(" · ");

    const place = document.createElement("p");
    place.textContent = event.place
      ? `地点：${event.place}`
      : "";

    const description = document.createElement("p");
    description.textContent = event.description || "";
    description.style.whiteSpace = "pre-wrap";

    info.append(title, date, place, description);
    card.append(info);
    list.append(card);
  });

  linksScreen.hidden = false;
  list.scrollTop = 0;
}

document.getElementById("kakao-open-events")
  .addEventListener("click", openEventsPage);
// 各个聊天的公告
const chatAnnouncements = {
  "dream-player": [],
  "itzy-group": [],
  lia: [],
  ryujin: [],
  chaeryeong: [],
  yuna: [],
  manager: [],
  jiwon: []
};

function openAnnouncementsPage() {
  if (activeChatId === null) return;

  linksScreen.querySelector(
    ".kakao-links-header strong"
  ).textContent = "公告";

  const list = document.getElementById("kakao-links-list");
  list.replaceChildren();

  const announcements =
    chatAnnouncements[activeChatId] || [];

  if (announcements.length === 0) {
    const empty = document.createElement("p");
    empty.className = "kakao-links-empty";
    empty.textContent = "暂无公告";
    list.append(empty);
  }

  announcements.forEach((announcement) => {
    const card = document.createElement("details");
    card.className = "kakao-link-card";

    const summary = document.createElement("summary");
    summary.className = "kakao-link-info";
    summary.style.cursor = "pointer";

    const title = document.createElement("strong");
    title.textContent = announcement.title || "未命名公告";

    const meta = document.createElement("small");
    meta.style.display = "block";
    meta.textContent = [
      announcement.author,
      announcement.date
    ].filter(Boolean).join(" · ");

    summary.append(title, meta);

    const body = document.createElement("div");
    body.className = "kakao-link-info";
    body.style.paddingTop = "0";

    const text = document.createElement("p");
    text.textContent = announcement.text || "";
    text.style.whiteSpace = "pre-wrap";

    body.append(text);
    card.append(summary, body);
    list.append(card);
  });

  linksScreen.hidden = false;
  list.scrollTop = 0;
}

document.getElementById("kakao-open-announcements")
  .addEventListener("click", openAnnouncementsPage);

// 各个聊天的投票
// 每个投票的 id 在同一聊天中不能重复
const chatPolls = {
  "dream-player": [],
  "itzy-group": [],
  lia: [],
  ryujin: [],
  chaeryeong: [],
  yuna: [],
  manager: [],
  jiwon: []
};

function openPollsPage() {
  if (activeChatId === null) return;

  linksScreen.querySelector(
    ".kakao-links-header strong"
  ).textContent = "投票";

  const list = document.getElementById("kakao-links-list");
  list.replaceChildren();

  const polls = chatPolls[activeChatId] || [];
  const story = phone.dataset.story || "default";
  const chatId = activeChatId;

  if (polls.length === 0) {
    const empty = document.createElement("p");
    empty.className = "kakao-links-empty";
    empty.textContent = "暂无投票";
    list.append(empty);
  }

  polls.forEach((poll) => {
    const storageKey =
      `pickphone.kkt.vote.v1.${story}.${chatId}.${poll.id}`;

    const options = poll.options || [];

    let selected = null;

    try {
      const saved = localStorage.getItem(storageKey);

      if (saved !== null) {
        const index = Number(saved);

        if (
          Number.isInteger(index) &&
          index >= 0 &&
          index < options.length
        ) {
          selected = index;
        }
      }
    } catch {
      selected = null;
    }

    const card = document.createElement("div");
    card.className = "kakao-link-card";

    const info = document.createElement("div");
    info.className = "kakao-link-info";

    const title = document.createElement("strong");
    title.textContent = poll.title || "未命名投票";

    const description = document.createElement("p");
    description.textContent =
      poll.description || "请选择一个选项";

    const choices = document.createElement("div");

    const status = document.createElement("small");
    status.setAttribute("aria-live", "polite");

    function updateChoices() {
      choices.replaceChildren();

      options.forEach((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "kakao-poll-choice";

        const checked = selected === index;

        button.classList.toggle("is-selected", checked);
        button.setAttribute("aria-pressed", String(checked));
        button.textContent = `${checked ? "✓ " : ""}${option}`;

        button.addEventListener("click", () => {
          try {
            localStorage.setItem(storageKey, String(index));
          } catch {
            status.textContent = "保存失败，请稍后再试";
            return;
          }

          selected = index;
          updateChoices();
        });

        choices.append(button);
      });

      status.textContent = selected === null
        ? "尚未选择"
        : "已记录你的选择，可以重新选择";
    }

    updateChoices();

    info.append(title, description, choices, status);
    card.append(info);
    list.append(card);
  });

  linksScreen.hidden = false;
  list.scrollTop = 0;
}

document.getElementById("kakao-open-polls")
  .addEventListener("click", openPollsPage);  
// 每个聊天的 Boards 内容
const chatBoards = {
  "dream-player": [],
  "itzy-group": [],
  lia: [],
  ryujin: [],
  chaeryeong: [],
  yuna: [],
  manager: [],
  jiwon: []
};

function openBoardsPage() {
  if (activeChatId === null) return;

  linksScreen.querySelector(
    ".kakao-links-header strong"
  ).textContent = "Boards";

  const list = document.getElementById("kakao-links-list");
  list.replaceChildren();

  const posts = chatBoards[activeChatId] || [];

  if (posts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "kakao-links-empty";
    empty.textContent = "暂无内容";
    list.append(empty);
  }

  posts.forEach((post) => {
    const card = document.createElement("details");
    card.className = "kakao-link-card";

    const summary = document.createElement("summary");
    summary.className = "kakao-link-info";
    summary.style.cursor = "pointer";

    const title = document.createElement("strong");
    title.textContent = post.title || "未命名内容";

    const meta = document.createElement("small");
    meta.style.display = "block";
    meta.textContent = [
      post.author,
      post.date
    ].filter(Boolean).join(" · ");

    summary.append(title, meta);

    const body = document.createElement("div");
    body.className = "kakao-link-info";
    body.style.paddingTop = "0";

    const text = document.createElement("p");
    text.textContent = post.text || "";
    text.style.whiteSpace = "pre-wrap";
    body.append(text);

    // 可选的配图，点击使用现有大图预览
    if (post.image) {
      const imageButton = document.createElement("button");
      imageButton.type = "button";
      imageButton.style.cssText = `
        display: block;
        width: 100%;
        padding: 0;
        border: none;
        background: transparent;
        cursor: zoom-in;
      `;
      imageButton.setAttribute("aria-label", "放大查看配图");

      const image = document.createElement("img");
      image.src = post.image;
      image.alt = post.imageCaption || "配图";
      image.loading = "lazy";
      image.style.cssText = `
        display: block;
        width: 100%;
        margin-top: 9px;
        border-radius: 8px;
      `;

      imageButton.append(image);

      imageButton.addEventListener("click", () => {
        previewMedia({
          type: "image",
          src: post.image,
          caption: post.imageCaption || post.title
        });
      });

      body.append(imageButton);
    }

    card.append(summary, body);
    list.append(card);
  });

  linksScreen.hidden = false;
  list.scrollTop = 0;
}

document.getElementById("kakao-open-boards")
  .addEventListener("click", openBoardsPage);
// 按故事线、群聊分别保存邀请名单
function invitedMembersKey() {
  const story = phone.dataset.story || "default";

  return `pickphone.kkt.invited.v1.${story}.${activeChatId}`;
}

function readInvitedMembers() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(invitedMembersKey()) || "[]"
    );

    return Array.isArray(saved)
      ? saved.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

// 获取原成员和后续邀请的成员
function getInfoMembers(chat) {
  if (chat.type !== "group") {
    return ["예지", chat.name];
  }

  const invitedIds = readInvitedMembers();

  const invitedNames = friendList
    .filter(isVisibleInCurrentStory)
    .filter((friend) => invitedIds.includes(friend.chatId))
    .map((friend) => friend.name);

  return [
    ...new Set([
      ...(chat.members || []),
      ...invitedNames
    ])
  ];
}

function openInvitePage() {
  const chat = chatList.find(
    (item) => item.id === activeChatId
  );

  if (!chat || chat.type !== "group") return;

  linksScreen.querySelector(
    ".kakao-links-header strong"
  ).textContent = "邀请成员";

  const list = document.getElementById("kakao-links-list");
  list.replaceChildren();

  const members = getInfoMembers(chat);

  const availableFriends = friendList
    .filter(isVisibleInCurrentStory)
    .filter((friend) => !members.includes(friend.name));

  const hint = document.createElement("p");
  hint.className = "kakao-links-empty";
  hint.style.marginTop = "12px";
  hint.textContent = availableFriends.length
    ? "点击好友即可加入群聊"
    : "所有好友都已在群聊中";

  list.append(hint);

  availableFriends.forEach((friend) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kakao-poll-choice";
    button.textContent = `＋ ${friend.name}`;

    button.addEventListener("click", () => {
      const invited = new Set(readInvitedMembers());
      invited.add(friend.chatId);

      try {
        localStorage.setItem(
          invitedMembersKey(),
          JSON.stringify([...invited])
        );
      } catch {
        hint.textContent = "保存失败，请稍后再试";
        return;
      }

      // 更新后方信息页中的成员名单
      openChatInfo();

      // 返回邀请列表，可以继续邀请其他好友
      openInvitePage();
    });

    list.append(button);
  });

  linksScreen.hidden = false;
  list.scrollTop = 0;
}

document.getElementById("kakao-info-invite")
  .addEventListener("click", openInvitePage);
function openCreateSecretPage() {
  const originalChat = chatList.find(
    (item) => item.id === activeChatId
  );

  if (!originalChat || originalChat.type === "group") return;

  linksScreen.querySelector(
    ".kakao-links-header strong"
  ).textContent = "创建秘密聊天室";

  const list = document.getElementById("kakao-links-list");
  list.replaceChildren();

  const description = document.createElement("p");
  description.className = "kakao-links-empty";
  description.style.marginTop = "20px";
  description.textContent =
    "创建一个独立的剧情聊天？原聊天保持不变。此功能不提供真实加密。";

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "kakao-poll-choice";
  confirmButton.textContent = "创建";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "kakao-poll-choice";
  cancelButton.textContent = "取消";

  confirmButton.addEventListener("click", () => {
    const story = phone.dataset.story;
    if (!story) return;

    // 同一故事线、同一联系人只创建一个秘密聊天
    const secretId = `secret-${story}-${originalChat.id}`;

    const existing = chatList.find(
      (item) => item.id === secretId
    );

    if (!existing) {
      chatList.push({
        id: secretId,
        name: `${getChatDisplayName(originalChat)} · 秘密聊天`,
        type: "private",
        story,
        isSecret: true,
        avatar: getChatAvatar(originalChat),
        preview: "",
        time: "",
        unread: 0,
        replyOptions: []
      });
    }

    closeChatInfo();
    openConversation(secretId);
  });

  cancelButton.addEventListener("click", closeLinksPage);

  list.append(description, confirmButton, cancelButton);

  linksScreen.hidden = false;
  list.scrollTop = 0;
}

document.getElementById("kakao-create-secret")
  .addEventListener("click", openCreateSecretPage);
// 当前故事线中被移除的聊天
const removedChats = new Set();

function removedChatKey(chatId) {
  return `${phone.dataset.story || "default"}:${chatId}`;
}

function isChatRemoved(chat) {
  return removedChats.has(removedChatKey(chat.id));
}

function openLeaveChatPage() {
  const chat = chatList.find(
    (item) => item.id === activeChatId
  );

  if (!chat) return;

  linksScreen.querySelector(
    ".kakao-links-header strong"
  ).textContent = "离开聊天室";

  const list = document.getElementById("kakao-links-list");
  list.replaceChildren();

  const description = document.createElement("p");
  description.className = "kakao-links-empty";
  description.style.marginTop = "20px";
  description.textContent =
    `将“${getChatDisplayName(chat)}”从当前故事线的聊天列表中移除？刷新网页可恢复。`;

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "kakao-poll-choice";
  confirmButton.textContent = "确认离开";
  confirmButton.style.color = "#ff7548";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "kakao-poll-choice";
  cancelButton.textContent = "取消";

  confirmButton.addEventListener("click", () => {
    removedChats.add(removedChatKey(chat.id));

    closeChatInfo();
    showPage("chats");
  });

  cancelButton.addEventListener("click", closeLinksPage);

  list.append(description, confirmButton, cancelButton);

  linksScreen.hidden = false;
  list.scrollTop = 0;
}

document.getElementById("kakao-leave-chat")
  .addEventListener("click", openLeaveChatPage);
// 剧情通话记录，按你希望显示的顺序填写
const callRecords = [];

/*
记录格式：

{
  id: "call-001",
  chatId: "ryujin",
  direction: "incoming",  // incoming 接入；outgoing 拨出
  missed: false,         // true 表示未接
  date: "2026-11-05",
  time: "18:30",
  duration: "02:15",      // 已接通的通话时长
  story: "dream"         // 不填写则两条线共有
}
*/

function renderCallsPage(filter = "all") {
  content.innerHTML = `
    <div class="kakao-call-filters">
      <button type="button"
              data-call-filter="all">
        全部
      </button>

      <button type="button"
              data-call-filter="missed">
        未接
      </button>
    </div>

    <div id="kakao-call-list"></div>
  `;

  const filterButtons = content.querySelectorAll(
    "[data-call-filter]"
  );

  filterButtons.forEach((button) => {
    const selected = button.dataset.callFilter === filter;

    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));

    button.addEventListener("click", () => {
      renderCallsPage(button.dataset.callFilter);
    });
  });

  const list = document.getElementById("kakao-call-list");

  const records = callRecords.filter((record) => {
    if (!isVisibleInCurrentStory(record)) return false;
    if (filter === "missed" && !record.missed) return false;

    const chat = chatList.find(
      (item) => item.id === record.chatId
    );

    return chat && isVisibleInCurrentStory(chat);
  });

  if (records.length === 0) {
    const empty = document.createElement("div");
    empty.className = "kakao-call-empty";

    empty.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 3 4 5-3 3a15 15 0 0 0 6 6l3-3
                 5 4-2 3C10 23 1 14 3 5Z"></path>
      </svg>
    `;

    const heading = document.createElement("strong");
    heading.textContent = filter === "missed"
      ? "暂无未接通话"
      : "免费给你的朋友打电话";

    const description = document.createElement("p");
    description.textContent = "通话记录将显示在这里";

    empty.append(heading, description);
    list.append(empty);
    return;
  }

  records.forEach((record) => {
    const chat = chatList.find(
      (item) => item.id === record.chatId
    );

    const row = document.createElement("div");
    row.className = "kakao-call-row";

    if (record.missed) {
      row.classList.add("is-missed");
    }

    const avatar = document.createElement("img");
    avatar.className = "kakao-call-avatar";
    avatar.src = getChatAvatar(chat);
    avatar.alt = "";

    const info = document.createElement("div");
    info.className = "kakao-call-info";

    const name = document.createElement("strong");
    name.textContent = getChatDisplayName(chat);

    const detail = document.createElement("span");
    detail.className = "kakao-call-description";

    const direction = record.direction === "outgoing"
      ? "↗ 拨出"
      : "↙ 接入";

    detail.textContent = record.missed
      ? "↙ 未接来电"
      : `${direction}${record.duration ? " · " + record.duration : ""}`;

    info.append(name, detail);

    const meta = document.createElement("div");
    meta.className = "kakao-call-meta";

    const date = document.createElement("span");
    date.textContent = record.date
      ? formatMessageDate(record.date)
      : "";

    const time = document.createElement("span");
    time.textContent = record.time || "";

    meta.append(date, time);
    row.append(avatar, info, meta);
    list.append(row);
  });
}  
function renderMorePage() {
  content.innerHTML = `
    <div class="kakao-more-profile">
      <button type="button"
              id="kakao-more-avatar"
              aria-label="查看自己的头像">
        <img src="./assets/avatars/default-avatar.png"
             alt="" draggable="false">
      </button>

      <div class="kakao-more-profile-info">
        <strong>황예지</strong>
        <small>YEJI</small>
      </div>
    </div>

    <div class="kakao-more-grid"
         id="kakao-more-grid"></div>

    <div class="kakao-more-account"
         id="kakao-more-account"></div>

    <div class="kakao-more-divider"></div>

    <h2 class="kakao-more-section-title">推荐 Apps</h2>

    <div class="kakao-more-recommend"
         id="kakao-more-recommend"></div>
  `;

  // SVG 统一使用描边图标
  const icons = {
    map: `
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    `,

    taxi: `
      <path d="m5 9 2-5h10l2 5"/>
      <rect x="3" y="9" width="18" height="10" rx="3"/>
      <path d="M6 19v2M18 19v2M8 14h8"/>
      <path d="M7 12h.01M17 12h.01"/>
    `,

    mail: `
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="m3 6 9 7 9-7"/>
    `,

    calendar: `
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M7 2v6M17 2v6M3 10h18m-11 6 2 2 4-4"/>
    `,

    cloud: `
      <path d="M7 19h11a4 4 0 0 0 0-8
               6 6 0 0 0-11-3 5.5 5.5 0 0 0 0 11Z"/>
    `,

    emoticons: `
      <circle cx="12" cy="12" r="9"/>
      <path d="M8 9h.01M16 9h.01M8 14a4 4 0 0 0 8 0"/>
    `,

    themes: `
      <path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4
               a4 4 0 0 1-8 0Z"/>
    `,

    openchat: `
      <path d="M21 10c0 5-4 8-9 8H9l-5 3 1-5
               a8 8 0 0 1-2-6c0-5 4-8 9-8s9 3 9 8Z"/>
      <path d="M7 10h10"/>
    `,

    account: `
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="9" r="3"/>
      <path d="M6 19a6 6 0 0 1 12 0"/>
    `,

    story: `
      <path d="M15 3H8l-2 9h5l-2 9 10-13h-6Z"/>
    `
  };

  function makeMoreItem(label, iconName) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "kakao-more-item";

    // 功能尚未连接，先显示入口外观
    item.disabled = true;

    const icon = document.createElement("span");
    icon.className = "kakao-more-icon";

    icon.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        ${icons[iconName]}
      </svg>
    `;

    const name = document.createElement("span");
    name.textContent = label;

    item.append(icon, name);
    return item;
  }

  const grid = document.getElementById("kakao-more-grid");

  [
    ["Map", "map"],
    ["Taxi", "taxi"],
    ["Mail", "mail"],
    ["Calendar", "calendar"],
    ["Talk Cloud", "cloud"],
    ["Emoticons", "emoticons"],
    ["Themes", "themes"],
    ["Openchat", "openchat"]
  ].forEach(([label, icon]) => {
    grid.append(makeMoreItem(label, icon));
  });

  document.getElementById("kakao-more-account")
    .append(makeMoreItem("Account", "account"));

  document.getElementById("kakao-more-recommend")
    .append(makeMoreItem("Kakao Story", "story"));

  // 点击自己的头像放大查看
  document.getElementById("kakao-more-avatar")
    .addEventListener("click", (event) => {
      const image = event.currentTarget.querySelector("img");

      previewMedia({
        type: "image",
        src: image.src,
        caption: "황예지"
      });
    });
}
// 四个主页面的上栏按钮
function updateKakaoHeader(page) {
  const container = document.getElementById("kakao-page-actions");
  container.replaceChildren();

  const icons = {
    addFriend: `
      <circle cx="9" cy="7" r="3"></circle>
      <path d="M3 20v-2a6 6 0 0 1 12 0v2"></path>
      <path d="M19 9v8M15 13h8"></path>
    `,

    newChat: `
      <path d="M19 14a9 9 0 0 1-8 5H8l-5 3 1-6
               a8 8 0 0 1-2-5c0-5 4-8 9-8
               a10 10 0 0 1 5 1"></path>
      <path d="M20 3v8M16 7h8"></path>
    `,

    openChat: `
      <path d="M15 14a8 8 0 0 1-7 4H6l-4 3 1-5
               a7 7 0 0 1-2-5c0-4 4-7 8-7s8 3 8 7"></path>
      <path d="M15 3c5 0 8 3 8 7
               a7 7 0 0 1-2 5l1 5-4-3h-2"></path>
    `,

    newCall: `
      <path d="m6 3 4 5-3 3a15 15 0 0 0 6 6l3-3
               5 4-2 3C10 23 1 14 3 5Z"></path>
      <path d="M19 2v7M15.5 5.5h7"></path>
    `,

    settings: `
  <path d="
    M9.5 3.5
    L10 2h4l.5 1.5
    1.6.9 1.6-.3 2 3.4-1.1 1.2
    v1.8l1.1 1.2-2 3.4-1.6-.3
    -1.6.9L14 18h-4l-.5-1.5
    -1.6-.9-1.6.3-2-3.4 1.1-1.2
    V9.5L4.3 8.3l2-3.4 1.6.3Z
  " transform="translate(0 2)"/>
  <circle cx="12" cy="12" r="3"/>
`
  };

  const pageButtons = {
    friends: [
      ["addFriend", "添加好友"],
      ["settings", "好友设置"]
    ],

    chats: [
      ["newChat", "新建聊天"],
      ["openChat", "Openchat"],
      ["settings", "聊天列表设置"]
    ],

    calls: [
      ["newCall", "新建通话"],
      ["settings", "通话设置"]
    ],

    more: [
      ["settings", "KakaoTalk 设置"]
    ]
  };

  (pageButtons[page] || []).forEach(([iconName, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "kakao-header-tool";
    button.dataset.headerAction = iconName;
    button.setAttribute("aria-label", label);
    button.title = label;

    // 这一轮先完成图标，后续连接具体功能
    // 先连接添加好友，其余上栏功能后续处理
  button.disabled = !(
     iconName === "addFriend" ||
     iconName === "newChat" ||
     iconName === "newCall" ||
     iconName === "settings"
  );
  if (
  iconName === "settings" &&
  ["calls", "more"].includes(page)
) {
  button.addEventListener("click", openGeneralSettings);
}
    if (iconName === "newCall") {
  button.addEventListener("click", openCallPicker);
}
    if (iconName === "settings" && page === "chats") {
      button.addEventListener("click", () => {
        openChatSettingsMenu(button);
      });
    }

    if (iconName === "addFriend") {
      button.addEventListener("click", openAddFriend);
    }
    if (iconName === "newChat") {
      button.addEventListener("click", openStartChat);
    }
    if (iconName === "settings" && page === "friends") {
       button.addEventListener("click", () => {
         openFriendSettingsMenu(button);
       });
    }

    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        ${icons[iconName]}
      </svg>
    `;

    container.append(button);
  });
}
// 自己的游戏资料，之后可以修改
const kakaoMyCard = {
  name: "황예지",
  id: "yeji_0526",
  qrImage: "./assets/kakao/my-qr.png"
};

// 添加好友浮层
const addFriendScreen = document.createElement("section");
addFriendScreen.className = "kakao-add-friend";
addFriendScreen.hidden = true;
addFriendScreen.setAttribute("role", "dialog");
addFriendScreen.setAttribute("aria-modal", "true");
addFriendScreen.setAttribute("aria-labelledby", "kakao-add-title");

addFriendScreen.innerHTML = `
  <div class="kakao-add-panel">
    <header class="kakao-add-header">
      <button type="button"
              id="kakao-add-close"
              aria-label="关闭添加好友">×</button>

      <strong id="kakao-add-title">添加好友</strong>
      <span></span>
    </header>

    <div class="kakao-add-methods">
      <button type="button" class="is-selected"
              aria-label="我的二维码" aria-pressed="true">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M3 12h18"/>
        </svg>
        <span>QR码</span>
      </button>

      <button type="button" disabled>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 3h16v18H5ZM2 6h3M2 12h3M2 18h3"/>
          <circle cx="13" cy="9" r="3"/>
          <path d="M8 18a5 5 0 0 1 10 0"/>
        </svg>
        <span>通讯录</span>
      </button>

      <button type="button" disabled>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 8v8M12 8h2a4 4 0 0 1 0 8h-2Z"/>
        </svg>
        <span>KakaoTalk ID</span>
      </button>

      <button type="button" disabled>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16"/>
          <path d="m3 6 9 7 9-7"/>
        </svg>
        <span>邀请</span>
      </button>
    </div>
  </div>

  <div class="kakao-add-card-area">
    <div class="kakao-my-qr-card">
      <strong id="kakao-my-card-name"></strong>
      <small id="kakao-my-card-id"></small>

      <div class="kakao-my-qr-box">
        <img id="kakao-my-qr-image" alt="我的好友二维码">
        <p id="kakao-my-qr-empty" hidden>二维码图片待添加</p>
      </div>
    </div>
  </div>
`;

app.append(addFriendScreen);

const myQrImage = document.getElementById("kakao-my-qr-image");
const myQrEmpty = document.getElementById("kakao-my-qr-empty");

myQrImage.addEventListener("load", () => {
  myQrImage.hidden = false;
  myQrEmpty.hidden = true;
});

myQrImage.addEventListener("error", () => {
  myQrImage.hidden = true;
  myQrEmpty.hidden = false;
});

function openAddFriend() {
  document.getElementById("kakao-my-card-name").textContent =
    kakaoMyCard.name;

  document.getElementById("kakao-my-card-id").textContent =
    kakaoMyCard.id;

  myQrImage.hidden = true;
  myQrEmpty.hidden = false;
  myQrImage.src = kakaoMyCard.qrImage;

  addFriendScreen.hidden = false;
  phone.classList.add("kakao-add-friend-open");

  document.getElementById("kakao-add-close").focus();
}

function closeAddFriend() {
  friendInviteScreen.hidden = true;
  idAddScreen.hidden = true;
  contactAddScreen.hidden = true;
  addFriendScreen.hidden = true;
  phone.classList.remove("kakao-add-friend-open");
}

document.getElementById("kakao-add-close")
  .addEventListener("click", closeAddFriend);

// 点击浮层空白区域关闭
addFriendScreen.addEventListener("click", (event) => {
  if (
    event.target === addFriendScreen ||
    event.target.classList.contains("kakao-add-card-area")
  ) {
    closeAddFriend();
  }
});

// Esc 先关闭浮层，Tab 保持在浮层内
document.addEventListener("keydown", (event) => {
  if (
     addFriendScreen.hidden ||
     !contactAddScreen.hidden ||
     !idAddScreen.hidden ||
     !friendInviteScreen.hidden
  ) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeAddFriend();
  }

  if (event.key === "Tab") {
    const buttons = [
      ...addFriendScreen.querySelectorAll("button:not([disabled])")
    ];

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
}, true);
// 通过通讯录添加游戏联系人
const contactAddScreen = document.createElement("section");
contactAddScreen.className = "kakao-contact-add";
contactAddScreen.hidden = true;
contactAddScreen.setAttribute("aria-label", "通过通讯录添加");

contactAddScreen.innerHTML = `
  <form id="kakao-contact-add-form">
    <header class="kakao-contact-add-header">
      <button type="button"
              id="kakao-contact-add-close"
              aria-label="关闭">×</button>

      <strong>通过通讯录添加</strong>

      <button type="submit"
              id="kakao-contact-add-confirm"
              disabled>确定</button>
    </header>

    <div class="kakao-contact-add-fields">
      <select id="kakao-contact-country"
              aria-label="国家或地区">
        <option value="86">中国 +86</option>
        <option value="82">韩国 +82</option>
        <option value="81">日本 +81</option>
      </select>

      <input type="tel"
             id="kakao-contact-phone"
             placeholder="电话号码"
             aria-label="电话号码"
             inputmode="tel"
             autocomplete="off"
             maxlength="24"
             required>

      <input type="text"
             id="kakao-contact-nickname"
             placeholder="昵称"
             aria-label="昵称"
             autocomplete="off"
             maxlength="20"
             required>

      <div class="kakao-contact-counter"
           id="kakao-contact-counter">0/20</div>

      <p id="kakao-contact-add-status"
         aria-live="polite"></p>
    </div>
  </form>
`;

addFriendScreen.append(contactAddScreen);

const contactAddForm =
  document.getElementById("kakao-contact-add-form");

const contactCountry =
  document.getElementById("kakao-contact-country");

const contactPhone =
  document.getElementById("kakao-contact-phone");

const contactNickname =
  document.getElementById("kakao-contact-nickname");

const contactConfirm =
  document.getElementById("kakao-contact-add-confirm");

const contactStatus =
  document.getElementById("kakao-contact-add-status");

function contactPhoneDigits() {
  return contactPhone.value.replace(/[\s()-]/g, "");
}

function updateContactAddForm() {
  document.getElementById("kakao-contact-counter").textContent =
    `${contactNickname.value.length}/20`;

  // 这里只检查模拟号码的基本格式
  const phoneReady = /^\d{5,15}$/.test(contactPhoneDigits());
  const nameReady = contactNickname.value.trim().length > 0;

  contactConfirm.disabled = !phoneReady || !nameReady;
  contactStatus.textContent = "";
}

function openContactAdd() {
  contactAddForm.reset();
  countryPicker.hidden = true;
  updateCountryLabel();
  contactStatus.textContent = "";
  contactAddScreen.hidden = false;

  updateContactAddForm();
  contactPhone.focus();
}

function closeContactAdd() {
  countryPicker.hidden = true;
  contactAddScreen.hidden = true;

  const button = addFriendScreen.querySelectorAll(
    ".kakao-add-methods button"
  )[1];

  if (!addFriendScreen.hidden) {
    button?.focus();
  }
}

// 第二个入口是“通讯录”
const contactMethodButton = addFriendScreen.querySelectorAll(
  ".kakao-add-methods button"
)[1];

contactMethodButton.disabled = false;
contactMethodButton.addEventListener("click", openContactAdd);

contactPhone.addEventListener("input", updateContactAddForm);
contactNickname.addEventListener("input", updateContactAddForm);

document.getElementById("kakao-contact-add-close")
  .addEventListener("click", closeContactAdd);

contactAddForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateContactAddForm();

  if (contactConfirm.disabled) return;

  const story = phone.dataset.story;
  if (!story) return;

  const name = contactNickname.value.trim();

  const phoneKey =
    `${contactCountry.value}:${contactPhoneDigits()}`;

  const existing = friendList.find((friend) => {
    return friend.phoneKey === phoneKey &&
      isVisibleInCurrentStory(friend);
  });

  if (existing) {
    contactStatus.textContent = "该号码已经在好友列表中";
    return;
  }

  const id = `contact-${story}-${Date.now()}`;

  friendList.push({
    chatId: id,
    name,
    story,
    status: "",
    avatar: "",
    phoneKey
  });

  chatList.push({
    id,
    name,
    story,
    avatar: "",
    preview: "",
    time: "",
    unread: 0,
    initialMessages: [],
    replyOptions: []
  });

  closeContactAdd();
  closeAddFriend();
  showPage("friends");
});

// 子页面的键盘操作
document.addEventListener("keydown", (event) => {
  if (
    contactAddScreen.hidden ||
    !countryPicker.hidden
  ) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeContactAdd();
  }

  if (event.key === "Tab") {
    const controls = [
      ...contactAddScreen.querySelectorAll(
        "button:not([disabled]), input, select"
      )
    ];

    const first = controls[0];
    const last = controls[controls.length - 1];
    const outside =
      !contactAddScreen.contains(document.activeElement);

    if (
      event.shiftKey &&
      (document.activeElement === first || outside)
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || outside)
    ) {
      event.preventDefault();
      first.focus();
    }
  }
}, true);
// 国家／地区选择
const countryChoices = window.KAKAO_PHONE_COUNTRIES;

// 原 select 保留供表单读取，界面上隐藏
contactCountry.replaceChildren();

countryChoices.forEach((country) => {
  const option = document.createElement("option");

  option.value = country.digits;
  option.textContent = `${country.name} +${country.code}`;

  if (country.name === "中国大陆") {
    option.defaultSelected = true;
    option.selected = true;
  }

  contactCountry.append(option);
});

contactCountry.hidden = true;

// 代替系统下拉框的入口按钮
const countrySelectButton = document.createElement("button");
countrySelectButton.type = "button";
countrySelectButton.className = "kakao-country-select";

contactCountry.insertAdjacentElement(
  "afterend",
  countrySelectButton
);

function updateCountryLabel() {
  const country = countryChoices[contactCountry.selectedIndex];

  countrySelectButton.replaceChildren();

  const name = document.createElement("span");
  name.textContent = `${country.name} +${country.code}`;

  const arrow = document.createElement("span");
  arrow.textContent = "⌄";
  arrow.setAttribute("aria-hidden", "true");

  countrySelectButton.append(name, arrow);
}

updateCountryLabel();

// 国家／地区选择页
const countryPicker = document.createElement("section");
countryPicker.className = "kakao-country-picker";
countryPicker.hidden = true;
countryPicker.setAttribute("aria-label", "国家／地区");

countryPicker.innerHTML = `
  <header class="kakao-country-header">
    <button type="button"
            id="kakao-country-close"
            aria-label="关闭国家或地区选择">×</button>

    <strong>国家／地区</strong>
    <span></span>
  </header>

  <input type="search"
         id="kakao-country-search"
         placeholder="搜索"
         aria-label="搜索国家、地区或区号"
         autocomplete="off">

  <div class="kakao-country-list"
       id="kakao-country-list"></div>
`;

contactAddScreen.append(countryPicker);

const countrySearch =
  document.getElementById("kakao-country-search");

const countryList =
  document.getElementById("kakao-country-list");

function renderCountryList() {
  // 支持搜索 +82、82、1-242、1242 等写法
  const keyword = countrySearch.value.trim().toLocaleLowerCase();
  const numberKeyword = keyword.replace(/[\s+-]/g, "");

  const searchingNumber =
    /^[+\d\s-]+$/.test(keyword) && /\d/.test(keyword);

  countryList.replaceChildren();

  countryChoices.forEach((country, index) => {
    const matches = !keyword ||
      country.name.toLocaleLowerCase().includes(keyword) ||
      (
        searchingNumber &&
        country.digits.includes(numberKeyword)
      );

    if (!matches) return;

    const selected = index === contactCountry.selectedIndex;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "kakao-country-row";
    button.setAttribute("aria-pressed", String(selected));

    const text = document.createElement("span");

    const name = document.createElement("span");
    name.textContent = country.name;

    const code = document.createElement("span");
    code.className = "kakao-country-code";
    code.textContent = ` +${country.code}`;

    text.append(name, code);

    if (country.note) {
      const note = document.createElement("small");
      note.className = "kakao-country-note";
      note.textContent = country.note;
      text.append(note);
    }

    button.append(text);

    if (selected) {
      const check = document.createElement("span");
      check.className = "kakao-country-check";
      check.textContent = "✓";
      check.setAttribute("aria-hidden", "true");
      button.append(check);
    }

    button.addEventListener("click", () => {
      // 使用索引区分相同区号的不同国家／地区
      contactCountry.selectedIndex = index;

      updateCountryLabel();
      updateContactAddForm();
      closeCountryPicker();
    });

    countryList.append(button);
  });

  if (!countryList.children.length) {
    const empty = document.createElement("p");
    empty.className = "kakao-country-empty";
    empty.textContent = "没有找到匹配的国家或地区";
    countryList.append(empty);
  }
}

function openCountryPicker() {
  countrySearch.value = "";
  countryPicker.hidden = false;

  renderCountryList();
  countryList.scrollTop = 0;

  document.getElementById("kakao-country-close").focus();
}

function closeCountryPicker() {
  countryPicker.hidden = true;
  countrySelectButton.focus();
}

countrySelectButton.addEventListener(
  "click",
  openCountryPicker
);

countrySearch.addEventListener("input", () => {
  renderCountryList();
  countryList.scrollTop = 0;
});

document.getElementById("kakao-country-close")
  .addEventListener("click", closeCountryPicker);

// Esc 逐层返回，Tab 保持在选择页内
document.addEventListener("keydown", (event) => {
  if (countryPicker.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeCountryPicker();
  }

  if (event.key === "Tab") {
    const controls = [
      ...countryPicker.querySelectorAll("button, input")
    ];

    const first = controls[0];
    const last = controls[controls.length - 1];
    const outside =
      !countryPicker.contains(document.activeElement);

    if (
      event.shiftKey &&
      (document.activeElement === first || outside)
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || outside)
    ) {
      event.preventDefault();
      first.focus();
    }
  }
}, true);
// KakaoTalk ID 添加页面
const idAddScreen = document.createElement("section");
idAddScreen.className = "kakao-id-add";
idAddScreen.hidden = true;
idAddScreen.setAttribute("role", "dialog");
idAddScreen.setAttribute("aria-modal", "true");
idAddScreen.setAttribute("aria-labelledby", "kakao-id-add-title");

idAddScreen.innerHTML = `
  <header class="kakao-id-add-header">
    <button
      type="button"
      class="kakao-id-add-close"
      aria-label="关闭"
    >×</button>

    <h2 id="kakao-id-add-title">使用 KakaoTalk ID 添加</h2>

    <span aria-hidden="true"></span>
  </header>

  <div class="kakao-id-add-body">
    <label class="kakao-id-input-label">
      <span class="kakao-id-sr-only">KakaoTalk ID</span>
      <input
        class="kakao-id-input"
        type="text"
        placeholder="KakaoTalk ID"
        maxlength="20"
        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"
      >
    </label>

    <div class="kakao-id-counter">0/20</div>

    <div class="kakao-my-id-card">
      <span>我的 ID</span>
      <span class="kakao-my-id-value"></span>
    </div>
  </div>
`;

addFriendScreen.appendChild(idAddScreen);

const idAddInput = idAddScreen.querySelector(".kakao-id-input");
const idAddCounter = idAddScreen.querySelector(".kakao-id-counter");
const idAddClose = idAddScreen.querySelector(".kakao-id-add-close");
const myIdValue = idAddScreen.querySelector(".kakao-my-id-value");

function openIdAdd() {
  idAddInput.value = "";
  idAddCounter.textContent = "0/20";
  myIdValue.textContent = kakaoMyCard.id || "暂未设置";
  idAddScreen.hidden = false;
  idAddInput.focus();
}

function closeIdAdd() {
  idAddScreen.hidden = true;

  addFriendScreen
    .querySelectorAll(".kakao-add-methods button")[2]
    ?.focus();
}

idAddInput.addEventListener("input", () => {
  idAddCounter.textContent = `${idAddInput.value.length}/20`;
});

idAddClose.addEventListener("click", closeIdAdd);

// 接通“ID 添加”入口
const idAddEntry = addFriendScreen
  .querySelectorAll(".kakao-add-methods button")[2];

if (idAddEntry) {
  idAddEntry.disabled = false;
  idAddEntry.addEventListener("click", openIdAdd);
}

// 键盘操作
document.addEventListener("keydown", (event) => {
  if (idAddScreen.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeIdAdd();
    return;
  }

  if (event.key === "Tab") {
    const first = idAddClose;
    const last = idAddInput;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}, true);
// 邀请朋友
// 网站发布后，把正式网址填在这里
const kakaoInviteUrl = "";

const friendInviteScreen = document.createElement("section");
friendInviteScreen.className = "kakao-friend-invite";
friendInviteScreen.hidden = true;
friendInviteScreen.setAttribute("role", "dialog");
friendInviteScreen.setAttribute("aria-modal", "true");
friendInviteScreen.setAttribute(
  "aria-labelledby",
  "kakao-friend-invite-title"
);

friendInviteScreen.innerHTML = `
  <header class="kakao-friend-invite-header">
    <button
      type="button"
      class="kakao-friend-invite-close"
      aria-label="关闭"
    >×</button>

    <h2 id="kakao-friend-invite-title">邀请朋友</h2>

    <span aria-hidden="true"></span>
  </header>

  <div class="kakao-friend-invite-body">
    <p class="kakao-friend-invite-description">
      通过以下方式邀请朋友:
    </p>

    <div class="kakao-friend-invite-options">
      <button type="button" data-invite-method="sms">
        短信
      </button>

      <button type="button" data-invite-method="apps">
        其他应用程序
      </button>

      <button type="button" data-invite-method="copy">
        复制邀请链接
      </button>
    </div>

    <p
      class="kakao-friend-invite-status"
      role="status"
      aria-live="polite"
    ></p>
  </div>
`;

addFriendScreen.appendChild(friendInviteScreen);

const friendInviteClose = friendInviteScreen.querySelector(
  ".kakao-friend-invite-close"
);

const friendInviteStatus = friendInviteScreen.querySelector(
  ".kakao-friend-invite-status"
);

const friendInviteEntry = addFriendScreen.querySelectorAll(
  ".kakao-add-methods button"
)[3];

function openFriendInvite() {
  friendInviteStatus.textContent = "";
  friendInviteScreen.hidden = false;
  friendInviteClose.focus();
}

function closeFriendInvite() {
  inviteShareOverlay.hidden = true;
  smsInviteScreen.hidden = true;
  inviteCopyOverlay.hidden = true;
  friendInviteScreen.hidden = true;
  friendInviteEntry?.focus();
}

if (friendInviteEntry) {
  friendInviteEntry.disabled = false;
  friendInviteEntry.addEventListener("click", openFriendInvite);
}

friendInviteClose.addEventListener("click", closeFriendInvite);

friendInviteScreen
  .querySelector(".kakao-friend-invite-options")
  .addEventListener("click", async (event) => {
    const button = event.target.closest("[data-invite-method]");
    if (!button) return;
    if (button.dataset.friendSetting === "edit") {
       startFriendEditing();
       return;
    }
    if (button.dataset.friendSetting === "manage") {
       openFriendManage();
       return;
    }

    const method = button.dataset.inviteMethod;

    if (method === "sms") {
       openSmsInvite();
       return;
    }

    if (method === "apps") {
      openInviteShare();
      return;
    }

    if (!kakaoInviteUrl.trim()) {
      friendInviteStatus.textContent = "暂未设置邀请链接。";
      return;
    }

    if (method === "copy") {
      try {
        await navigator.clipboard.writeText(kakaoInviteUrl);
        friendInviteStatus.textContent = "";
        showInviteCopyDialog();
      } catch {
        friendInviteStatus.textContent =
          `请手动复制邀请链接：${kakaoInviteUrl}`;
      }
      return;
    }

    

      
  });

// Esc 关闭；Tab 保持在页面内
document.addEventListener("keydown", (event) => {
 if (
    friendInviteScreen.hidden ||
    !smsInviteScreen.hidden ||
    !inviteShareOverlay.hidden
  ) return;
  if (!inviteCopyOverlay.hidden) {
  if (event.key === "Escape" || event.key === "Tab") {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (event.key === "Escape") {
      hideInviteCopyDialog();
    } else {
      inviteCopyConfirm.focus();
    }
  }

  return;
}

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeFriendInvite();
    return;
  }

  if (event.key === "Tab") {
    const buttons = [
      ...friendInviteScreen.querySelectorAll("button:not(:disabled)")
    ];

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
}, true);
// 复制邀请链接后的提示弹窗
const inviteCopyOverlay = document.createElement("div");
inviteCopyOverlay.className = "kakao-invite-copy-overlay";
inviteCopyOverlay.hidden = true;

inviteCopyOverlay.innerHTML = `
  <section
    class="kakao-invite-copy-dialog"
    role="dialog"
    aria-labelledby="kakao-invite-copy-message"
  >
    <p id="kakao-invite-copy-message">
      邀请链接已复制。<br>
      与他人分享你的链接。
    </p>

    <button type="button">确认</button>
  </section>
`;

friendInviteScreen.appendChild(inviteCopyOverlay);

const inviteCopyConfirm = inviteCopyOverlay.querySelector("button");

let inviteCopyPreviousFocus = null;

function showInviteCopyDialog() {
  inviteCopyPreviousFocus = document.activeElement;
  inviteCopyOverlay.hidden = false;
  inviteCopyConfirm.focus();
}

function hideInviteCopyDialog() {
  inviteCopyOverlay.hidden = true;
  inviteCopyPreviousFocus?.focus();
}

inviteCopyConfirm.addEventListener("click", hideInviteCopyDialog);

inviteCopyOverlay.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    inviteCopyConfirm.focus();
  }
});
// 短信邀请使用的虚构通讯录
const smsInviteContacts = [
  // 之后按照这个格式添加：
  // { id: "contact-1", name: "联系人名字", phone: "+82..." }
];

const smsInviteScreen = document.createElement("section");
smsInviteScreen.className = "kakao-sms-invite";
smsInviteScreen.hidden = true;
smsInviteScreen.setAttribute("role", "dialog");
smsInviteScreen.setAttribute("aria-labelledby", "kakao-sms-title");

smsInviteScreen.innerHTML = `
  <header class="kakao-sms-header">
    <button
      type="button"
      class="kakao-sms-back"
      aria-label="返回"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 4 7 12l8 8"/>
      </svg>
    </button>

    <h2 id="kakao-sms-title">通过短信邀请</h2>

    <button type="button" class="kakao-sms-confirm" disabled>
      确认
    </button>
  </header>

  <input
    class="kakao-sms-search"
    type="search"
    placeholder="昵称 / 电话号码搜索"
    aria-label="搜索联系人"
    autocomplete="off"
  >

  <div class="kakao-sms-list"></div>

  <p class="kakao-sms-status" role="status"></p>
`;

friendInviteScreen.appendChild(smsInviteScreen);

const smsInviteSearch = smsInviteScreen.querySelector(
  ".kakao-sms-search"
);
const smsInviteList = smsInviteScreen.querySelector(
  ".kakao-sms-list"
);
const smsInviteConfirm = smsInviteScreen.querySelector(
  ".kakao-sms-confirm"
);
const smsInviteBack = smsInviteScreen.querySelector(
  ".kakao-sms-back"
);
const smsInviteStatus = smsInviteScreen.querySelector(
  ".kakao-sms-status"
);

const selectedSmsContacts = new Set();

function renderSmsInviteContacts() {
  const keyword = smsInviteSearch.value.trim().toLocaleLowerCase();
  const phoneKeyword = keyword.replace(/[\s()+-]/g, "");

  const contacts = smsInviteContacts.filter((person) => {
    return (
      person.name.toLocaleLowerCase().includes(keyword) ||
      (
        phoneKeyword &&
        person.phone.replace(/[\s()+-]/g, "").includes(phoneKeyword)
      )
    );
  });

  smsInviteList.replaceChildren();

  if (!contacts.length) {
    const empty = document.createElement("p");
    empty.className = "kakao-sms-empty";
    empty.textContent = keyword ? "没有找到联系人" : "暂无联系人";
    smsInviteList.appendChild(empty);
  }

  contacts.forEach((person) => {
    const row = document.createElement("label");
    row.className = "kakao-sms-person";

    const details = document.createElement("span");
    details.className = "kakao-sms-person-details";

    const name = document.createElement("strong");
    name.textContent = person.name;

    const number = document.createElement("small");
    number.textContent = person.phone;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedSmsContacts.has(person.id);
    checkbox.setAttribute("aria-label", `选择 ${person.name}`);

    checkbox.addEventListener("change", () => {
  if (checkbox.checked) {
    if (chatPickerMode === "secret") {
      chatPickerSelected.clear();
    }

    chatPickerSelected.add(friend.chatId);
  } else {
    chatPickerSelected.delete(friend.chatId);
  }

  chatPickerStatus.textContent = "";
  updateChatPickerConfirm();

  // 秘密聊天重新显示选中状态，保证只有一人被选中
  if (chatPickerMode === "secret") {
    const scrollTop = chatPickerList.scrollTop;

    renderChatPicker();
    chatPickerList.scrollTop = scrollTop;

    const selectedCheckbox = [
      ...chatPickerList.querySelectorAll('input[type="checkbox"]')
    ].find((input) => input.checked);

    selectedCheckbox?.focus();
  }
});

    details.append(name, number);
    row.append(details, checkbox);
    smsInviteList.appendChild(row);
  });

  updateSmsInviteConfirm();
}

function updateSmsInviteConfirm() {
  const count = selectedSmsContacts.size;

  smsInviteConfirm.disabled = count === 0;
  smsInviteConfirm.textContent = count ? `确认(${count})` : "确认";
}

function openSmsInvite() {
  selectedSmsContacts.clear();
  smsInviteSearch.value = "";
  smsInviteStatus.textContent = "";

  renderSmsInviteContacts();
  smsInviteScreen.hidden = false;
  smsInviteBack.focus();
}

function closeSmsInvite() {
  smsInviteScreen.hidden = true;

  friendInviteScreen
    .querySelector('[data-invite-method="sms"]')
    ?.focus();
}

smsInviteBack.addEventListener("click", closeSmsInvite);
smsInviteSearch.addEventListener("input", renderSmsInviteContacts);

smsInviteConfirm.addEventListener("click", () => {
  if (!selectedSmsContacts.size) return;

  // 后续在这里连接虚拟手机的“信息”应用
  smsInviteStatus.textContent =
    `已选择 ${selectedSmsContacts.size} 位联系人，等待连接信息应用。`;
});

document.addEventListener("keydown", (event) => {
  if (smsInviteScreen.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeSmsInvite();
    return;
  }

  if (event.key === "Tab") {
    const controls = [
      ...smsInviteScreen.querySelectorAll(
        "button:not(:disabled), input"
      )
    ];

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
// 虚拟手机内的分享面板
const inviteShareOverlay = document.createElement("div");
inviteShareOverlay.className = "kakao-invite-share-overlay";
inviteShareOverlay.hidden = true;

inviteShareOverlay.innerHTML = `
  <section
    class="kakao-invite-share-sheet"
    role="dialog"
    aria-labelledby="kakao-share-title"
  >
    <div class="kakao-share-handle" aria-hidden="true"></div>

    <header class="kakao-share-preview">
      <span class="kakao-share-preview-icon">TALK</span>

      <div>
        <strong id="kakao-share-title">KakaoTalk</strong>
        <small>邀请朋友</small>
      </div>
    </header>

    <div class="kakao-share-apps">
      <button type="button" data-share-app="messages">
        <span class="kakao-share-app-icon share-messages">✉</span>
        <span>信息</span>
      </button>

      <button type="button" data-share-app="mail">
        <span class="kakao-share-app-icon share-mail">✉</span>
        <span>邮件</span>
      </button>

      <button type="button" data-share-app="notes">
        <span class="kakao-share-app-icon share-notes">≡</span>
        <span>备忘录</span>
      </button>

      <button type="button" data-share-app="files">
        <span class="kakao-share-app-icon share-files">▱</span>
        <span>文件</span>
      </button>
    </div>

    <button type="button" class="kakao-share-copy">
      <span>拷贝邀请链接</span>
      <span aria-hidden="true">▢</span>
    </button>

    <p class="kakao-share-status" role="status"></p>

    <button type="button" class="kakao-share-cancel">
      取消
    </button>
  </section>
`;

friendInviteScreen.appendChild(inviteShareOverlay);

const inviteShareCancel = inviteShareOverlay.querySelector(
  ".kakao-share-cancel"
);
const inviteShareStatus = inviteShareOverlay.querySelector(
  ".kakao-share-status"
);

function openInviteShare() {
  inviteShareStatus.textContent = "";
  inviteShareOverlay.hidden = false;

  inviteShareOverlay.querySelector("button").focus();
}

function closeInviteShare() {
  inviteShareOverlay.hidden = true;

  friendInviteScreen
    .querySelector('[data-invite-method="apps"]')
    ?.focus();
}

inviteShareCancel.addEventListener("click", closeInviteShare);

inviteShareOverlay.addEventListener("click", (event) => {
  if (event.target === inviteShareOverlay) {
    closeInviteShare();
  }
});

// 四个应用入口：之后连接虚拟手机里的对应应用
inviteShareOverlay
  .querySelector(".kakao-share-apps")
  .addEventListener("click", (event) => {
    const button = event.target.closest("[data-share-app]");
    if (!button) return;

    const appNames = {
      messages: "信息",
      mail: "邮件",
      notes: "备忘录",
      files: "文件"
    };

    inviteShareStatus.textContent =
      `“${appNames[button.dataset.shareApp]}”入口已预留，稍后连接。`;
  });

// 使用现有的复制功能和复制成功弹窗
inviteShareOverlay
  .querySelector(".kakao-share-copy")
  .addEventListener("click", () => {
    closeInviteShare();

    friendInviteScreen
      .querySelector('[data-invite-method="copy"]')
      .click();
  });

document.addEventListener("keydown", (event) => {
  if (inviteShareOverlay.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeInviteShare();
    return;
  }

  if (event.key === "Tab") {
    const buttons = [
      ...inviteShareOverlay.querySelectorAll("button:not(:disabled)")
    ];

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
}, true);
// 好友页：右上角设置菜单
const friendSettingsOverlay = document.createElement("div");
friendSettingsOverlay.className = "kakao-friend-settings-overlay";
friendSettingsOverlay.hidden = true;

friendSettingsOverlay.innerHTML = `
  <div
    class="kakao-friend-settings-menu"
    role="dialog"
    aria-label="好友设置"
  >
    <button type="button" data-friend-setting="edit">
      编辑好友列表
    </button>

    <button type="button" data-friend-setting="manage">
      管理朋友
    </button>

    <button type="button" data-friend-setting="general">
      一般设置
    </button>

    <p class="kakao-friend-settings-status" role="status"></p>
  </div>
`;

app.appendChild(friendSettingsOverlay);

let friendSettingsTrigger = null;

function openFriendSettingsMenu(button) {
  friendSettingsTrigger = button;
  button.setAttribute("aria-expanded", "true");

  friendSettingsOverlay.querySelector(
    ".kakao-friend-settings-status"
  ).textContent = "";

  friendSettingsOverlay.hidden = false;
  friendSettingsOverlay.querySelector("button").focus();
}

function closeFriendSettingsMenu() {
  friendSettingsOverlay.hidden = true;

  if (friendSettingsTrigger?.isConnected) {
    friendSettingsTrigger.setAttribute("aria-expanded", "false");
    friendSettingsTrigger.focus();
  }
}

friendSettingsOverlay.addEventListener("click", (event) => {
  if (event.target === friendSettingsOverlay) {
    closeFriendSettingsMenu();
    return;
  }

  const button = event.target.closest("[data-friend-setting]");
  if (!button) return;
  if (button.dataset.friendSetting === "general") {
  openGeneralSettings();
  return;
}

  if (button.dataset.friendSetting === "edit") {
    startFriendEditing();
    return;
  }

  if (button.dataset.friendSetting === "manage") {
    openFriendManage();
    return;
  }

  friendSettingsOverlay.querySelector(
    ".kakao-friend-settings-status"
  ).textContent = `“${button.textContent.trim()}”页面待连接`;
});

document.addEventListener("keydown", (event) => {
  if (friendSettingsOverlay.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeFriendSettingsMenu();
    return;
  }

  if (event.key === "Tab") {
    const buttons = [
      ...friendSettingsOverlay.querySelectorAll("button")
    ];

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
}, true);
// 好友隐藏记录：按剧情线分别保存
const hiddenFriendStorageKey = "pickphone.kkt.hidden-friends.v1";

let hiddenFriendKeys = new Set();

try {
  const saved = JSON.parse(
    localStorage.getItem(hiddenFriendStorageKey) || "[]"
  );

  if (Array.isArray(saved)) {
    hiddenFriendKeys = new Set(saved);
  }
} catch {
  hiddenFriendKeys = new Set();
}

function getHiddenFriendKey(friend) {
  return `${phone.dataset.story || "default"}:${friend.chatId}`;
}

function isFriendHidden(friend) {
  return hiddenFriendKeys.has(getHiddenFriendKey(friend));
}

function saveHiddenFriends() {
  try {
    localStorage.setItem(
      hiddenFriendStorageKey,
      JSON.stringify([...hiddenFriendKeys])
    );
  } catch {
    // 本次预览仍然保留隐藏状态
  }
}

// 好友列表编辑状态
let friendEditing = false;

const friendEditHeader = document.createElement("header");
friendEditHeader.className = "kakao-friend-edit-header";
friendEditHeader.hidden = true;

friendEditHeader.innerHTML = `
  <button type="button">完成</button>
  <h2>编辑</h2>
  <span aria-hidden="true"></span>
`;

app.appendChild(friendEditHeader);

function startFriendEditing() {
  closeFriendSettingsMenu();

  friendEditing = true;
  app.classList.add("is-editing-friends");
  friendEditHeader.hidden = false;

  renderFriendList();
  friendEditHeader.querySelector("button").focus();
}

function stopFriendEditing() {
  closeHideFriendDialog(false);
  friendEditing = false;
  app.classList.remove("is-editing-friends");
  friendEditHeader.hidden = true;
}

friendEditHeader.querySelector("button").addEventListener("click", () => {
  stopFriendEditing();
  showPage("friends");
});

document.addEventListener("keydown", (event) => {
  if (!friendEditing || event.key !== "Escape") return;

  event.preventDefault();
  event.stopImmediatePropagation();

  stopFriendEditing();
  showPage("friends");
});
// 管理朋友页面
const friendManageGroups = [
  {
    title: "添加朋友",
    items: [
      {
        key: "autoAdd",
        name: "自动添加",
        description: "通讯录中的 KakaoTalk 用户将自动同步到你的朋友列表。",
        defaultValue: true
      },
      {
        action: "refresh",
        name: "刷新",
        description: "更新朋友个人资料等变更信息。"
      }
    ]
  },
  {
    title: "显示好友姓名",
    items: [
      {
        key: "importNames",
        name: "导入通讯录姓名",
        description: "好友列表显示的姓名与通讯录保存的姓名一致。",
        defaultValue: true
      },
      {
        key: "syncNames",
        name: "同步好友名称",
        description: "从通讯录导入的好友姓名同样适用于其他设备或 Kakao 游戏等。",
        defaultValue: false
      }
    ]
  },
  {
    title: "管理添加好友",
    items: [
      {
        key: "allowPhone",
        name: "允许他人添加我通过电话号码",
        description: "允许他人通过你的电话号码加你为好友。",
        defaultValue: true
      },
      {
        key: "recommend",
        name: "推荐好友",
        description: "允许把我推荐给其他好友。",
        defaultValue: true
      }
    ]
  },
  {
    title: "好友管理",
    items: [
      { action: "hidden", name: "隐藏的好友" },
      { action: "blocked", name: "管理已屏蔽对象" }
    ]
  },
  {
    title: "显示好友设置",
    items: [
      {
        key: "birthdays",
        name: "显示过生日的好友",
        description: "在“好友”标签中显示过生日的好友列表。",
        defaultValue: true
      },
      {
        key: "updates",
        name: "显示更新的个人资料",
        description: "在“好友”标签中显示更新了个人资料的好友。",
        defaultValue: true
      },
      {
        key: "remembered",
        name: "Show Remembered Friends",
        description:
          "Show friends with memorial profiles in the Friends tab.",
        defaultValue: true
      }
    ]
  }
];

const friendManageScreen = document.createElement("section");
friendManageScreen.className = "kakao-friend-manage";
friendManageScreen.hidden = true;
friendManageScreen.setAttribute("role", "dialog");
friendManageScreen.setAttribute(
  "aria-labelledby",
  "kakao-friend-manage-title"
);

friendManageScreen.innerHTML = `
  <header class="kakao-friend-manage-header">
    <button type="button" aria-label="返回">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 4 7 12l8 8"/>
      </svg>
    </button>

    <h2 id="kakao-friend-manage-title">好友</h2>

    <span aria-hidden="true"></span>
  </header>

  <div class="kakao-friend-manage-body"></div>

  <p class="kakao-friend-manage-status" role="status"></p>
`;

app.appendChild(friendManageScreen);

const friendManageBody = friendManageScreen.querySelector(
  ".kakao-friend-manage-body"
);
const friendManageStatus = friendManageScreen.querySelector(
  ".kakao-friend-manage-status"
);
const friendManageBack = friendManageScreen.querySelector(
  ".kakao-friend-manage-header button"
);

function friendManageStorageKey() {
  return `pickphone.kkt.friend-settings.v1.${
    phone.dataset.story || "default"
  }`;
}

function readFriendManageSettings() {
  try {
    const value = JSON.parse(
      localStorage.getItem(friendManageStorageKey()) || "{}"
    );

    return value && typeof value === "object" &&
      !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function renderFriendManageSettings() {
  const saved = readFriendManageSettings();
  friendManageBody.replaceChildren();

  friendManageGroups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "kakao-manage-group";

    const heading = document.createElement("h3");
    heading.textContent = group.title;
    section.appendChild(heading);

    group.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "kakao-manage-item";

      const top = document.createElement("div");
      top.className = "kakao-manage-item-top";

      if (item.key) {
        const label = document.createElement("span");
        label.textContent = item.name;

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "kakao-manage-switch";
        toggle.setAttribute("role", "switch");
        toggle.setAttribute("aria-label", item.name);

        let enabled = typeof saved[item.key] === "boolean"
          ? saved[item.key]
          : item.defaultValue;

        function updateToggle() {
          toggle.setAttribute("aria-checked", String(enabled));
          toggle.textContent = enabled ? "✓" : "−";
        }

        updateToggle();

        toggle.addEventListener("click", () => {
          const next = !enabled;
          const settings = readFriendManageSettings();
          settings[item.key] = next;

          try {
            localStorage.setItem(
              friendManageStorageKey(),
              JSON.stringify(settings)
            );

            enabled = next;
            updateToggle();
            friendManageStatus.textContent = "";
          } catch {
            friendManageStatus.textContent = "设置未能保存，请重试。";
          }
        });

        top.append(label, toggle);
      } else {
        const action = document.createElement("button");
        action.type = "button";
        action.className = "kakao-manage-action";
        action.dataset.manageAction = item.action;

        const label = document.createElement("span");
        label.textContent = item.name;

        const icon = document.createElement("span");
        icon.textContent = item.action === "refresh" ? "⟳" : "›";
        icon.setAttribute("aria-hidden", "true");

        action.append(label, icon);

       action.addEventListener("click", () => {
         if (item.action === "hidden" || item.action === "blocked") {
            openFriendManageDetail(item.action);
            return;
         }

         friendManageStatus.textContent =
             "当前使用剧情内的本地资料，尚未连接通讯录同步。";
        });

        top.appendChild(action);
      }

      row.appendChild(top);

      if (item.description) {
        const description = document.createElement("p");
        description.textContent = item.description;
        row.appendChild(description);
      }

      section.appendChild(row);
    });

    friendManageBody.appendChild(section);
  });
}

function openFriendManage() {
  closeFriendSettingsMenu();
  friendManageStatus.textContent = "";
  renderFriendManageSettings();

  friendManageScreen.hidden = false;
  friendManageBody.scrollTop = 0;
  friendManageBack.focus();
}

function closeFriendManage() {
  closeFriendManageDetail();
  friendManageScreen.hidden = true;
}

friendManageBack.addEventListener("click", () => {
  closeFriendManage();

  document.querySelector(
    '#kakao-page-actions [data-header-action="settings"]'
  )?.focus();
});

document.addEventListener("keydown", (event) => {
  if (
      friendManageScreen.hidden ||
      !friendManageDetail.hidden
  ) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    friendManageBack.click();
    return;
  }

  if (event.key === "Tab") {
    const buttons = [
      ...friendManageScreen.querySelectorAll("button:not(:disabled)")
    ];

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
}, true);
// 隐藏好友确认弹窗
const hideFriendOverlay = document.createElement("div");
hideFriendOverlay.className = "kakao-hide-friend-overlay";
hideFriendOverlay.hidden = true;

hideFriendOverlay.innerHTML = `
  <section
    class="kakao-hide-friend-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="kakao-hide-friend-title"
    aria-describedby="kakao-hide-friend-description"
  >
    <h2 id="kakao-hide-friend-title">隐藏好友</h2>

    <p id="kakao-hide-friend-description">
      该好友将从好友列表中隐藏，已有聊天记录会保留。
      之后可在“管理朋友 → 隐藏的好友”中恢复。
    </p>

    <div class="kakao-hide-friend-actions">
      <button type="button" data-hide-choice="cancel">取消</button>
      <button type="button" data-hide-choice="confirm">确认</button>
    </div>
  </section>
`;

app.appendChild(hideFriendOverlay);

const hideFriendCancel = hideFriendOverlay.querySelector(
  '[data-hide-choice="cancel"]'
);
const hideFriendConfirm = hideFriendOverlay.querySelector(
  '[data-hide-choice="confirm"]'
);

let pendingHideFriend = null;
let hideFriendPreviousFocus = null;

function openHideFriendDialog(friend) {
  pendingHideFriend = friend;
  hideFriendPreviousFocus = document.activeElement;

  hideFriendOverlay.hidden = false;
  hideFriendCancel.focus();
}

function closeHideFriendDialog(restoreFocus = true) {
  hideFriendOverlay.hidden = true;
  pendingHideFriend = null;

  if (restoreFocus && hideFriendPreviousFocus?.isConnected) {
    hideFriendPreviousFocus.focus();
  }
}

hideFriendCancel.addEventListener("click", () => {
  closeHideFriendDialog();
});

hideFriendConfirm.addEventListener("click", () => {
  if (!pendingHideFriend) return;

  hiddenFriendKeys.add(getHiddenFriendKey(pendingHideFriend));
  saveHiddenFriends();

  closeHideFriendDialog(false);
  renderFriendList();

  const nextButton = document.querySelector(
    "#kakao-friend-list .kakao-friend-hide-button"
  );

  (nextButton || friendEditHeader.querySelector("button")).focus();
});

hideFriendOverlay.addEventListener("click", (event) => {
  if (event.target === hideFriendOverlay) {
    closeHideFriendDialog();
  }
});

// 在捕获阶段处理，避免 Esc 同时退出编辑
document.addEventListener("keydown", (event) => {
  if (hideFriendOverlay.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeHideFriendDialog();
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (document.activeElement === hideFriendCancel) {
      hideFriendConfirm.focus();
    } else {
      hideFriendCancel.focus();
    }
  }
}, true);
// 好友管理的子页面
const friendManageDetail = document.createElement("section");
friendManageDetail.className = "kakao-friend-manage-detail";
friendManageDetail.hidden = true;

friendManageDetail.innerHTML = `
  <header class="kakao-friend-manage-header">
    <button type="button" aria-label="返回">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 4 7 12l8 8"/>
      </svg>
    </button>

    <h2 class="kakao-manage-detail-title"></h2>

    <span aria-hidden="true"></span>
  </header>

  <div class="kakao-manage-detail-list"></div>
`;

friendManageScreen.appendChild(friendManageDetail);

const friendManageDetailTitle = friendManageDetail.querySelector(
  ".kakao-manage-detail-title"
);
const friendManageDetailList = friendManageDetail.querySelector(
  ".kakao-manage-detail-list"
);
const friendManageDetailBack = friendManageDetail.querySelector(
  "button"
);

let friendManageDetailType = "hidden";

function renderFriendManageDetail() {
  friendManageDetailList.replaceChildren();

  // 屏蔽功能尚未连接，暂时显示空白状态
  const people = friendManageDetailType === "hidden"
    ? friendList.filter((friend) => {
        return isVisibleInCurrentStory(friend) &&
          isFriendHidden(friend);
      })
    : [];

  friendManageDetailList.classList.toggle(
    "is-empty",
    people.length === 0
  );

  if (!people.length) {
    const empty = document.createElement("p");
    empty.className = "kakao-manage-detail-empty";
    empty.textContent = friendManageDetailType === "hidden"
      ? "您没有隐藏的朋友"
      : "您没有屏蔽的朋友";

    friendManageDetailList.appendChild(empty);
    return;
  }

  people.forEach((friend) => {
    const row = document.createElement("div");
    row.className = "kakao-hidden-friend-row";

    const avatar = document.createElement("img");
    avatar.src =
      friend.avatar || "./assets/avatars/default-avatar.png";
    avatar.alt = "";

    const name = document.createElement("span");
    name.textContent = friend.name;

    const restore = document.createElement("button");
    restore.type = "button";
    restore.textContent = "解除隐藏";
    restore.setAttribute("aria-label", `解除隐藏 ${friend.name}`);

    restore.addEventListener("click", () => {
      hiddenFriendKeys.delete(getHiddenFriendKey(friend));
      saveHiddenFriends();

      // 同步更新背后的好友列表
      renderFriendList();
      renderFriendManageDetail();

      const nextButton = friendManageDetailList.querySelector("button");
      (nextButton || friendManageDetailBack).focus();
    });

    row.append(avatar, name, restore);
    friendManageDetailList.appendChild(row);
  });
}

function openFriendManageDetail(type) {
  friendManageDetailType = type;

  friendManageDetailTitle.textContent =
    type === "hidden" ? "隐藏的好友" : "管理已屏蔽对象";

  renderFriendManageDetail();

  friendManageDetail.hidden = false;
  friendManageDetailList.scrollTop = 0;
  friendManageDetailBack.focus();
}

function closeFriendManageDetail() {
  friendManageDetail.hidden = true;
}

friendManageDetailBack.addEventListener("click", () => {
  closeFriendManageDetail();

  friendManageBody.querySelector(
    `[data-manage-action="${friendManageDetailType}"]`
  )?.focus();
});

document.addEventListener("keydown", (event) => {
  if (friendManageDetail.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    friendManageDetailBack.click();
    return;
  }

  if (event.key === "Tab") {
    const buttons = [
      ...friendManageDetail.querySelectorAll("button")
    ];

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
}, true);
// 开始聊天页面
const startChatScreen = document.createElement("section");
startChatScreen.className = "kakao-start-chat";
startChatScreen.hidden = true;
startChatScreen.setAttribute("role", "dialog");
startChatScreen.setAttribute(
  "aria-labelledby",
  "kakao-start-chat-title"
);

startChatScreen.innerHTML = `
  <header class="kakao-start-chat-header">
    <button type="button" class="kakao-start-chat-close"
            aria-label="关闭">×</button>

    <h2 id="kakao-start-chat-title">开始聊天</h2>

    <span aria-hidden="true"></span>
  </header>

  <div class="kakao-start-chat-body">
    <div class="kakao-start-chat-types">
      <button type="button" data-start-chat="normal">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M27 14c0 7-7 12-15 10l-6 4 1-7
                   C0 15 4 5 15 4c7-1 12 4 12 10Z"/>
        </svg>
        <span>普通聊天</span>
      </button>

      <button type="button" data-start-chat="team">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M6 28V5c7-5 12 5 21 0v16
                   c-9 5-14-5-21 0"/>
        </svg>
        <span>团队聊天</span>
      </button>

      <button type="button" data-start-chat="secret">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect x="6" y="13" width="20" height="16" rx="1"/>
          <path d="M10 13V9a6 6 0 0 1 12 0v4M16 20v4"/>
        </svg>
        <span>秘密聊天</span>
      </button>

      <button type="button" data-start-chat="open">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M12 8c3-7 17-5 17 5
                   0 4-2 7-5 9l1 6-7-4"/>
          <path d="M23 17c0 6-6 9-12 7l-5 4 1-6
                   C0 17 4 9 12 9c6 0 11 3 11 8Z"/>
        </svg>
        <span>开放聊天</span>
      </button>
    </div>

    <section class="kakao-nearby-chat">
      <div class="kakao-nearby-description">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="17" r="5"/>
          <path d="M10 33c0-11 20-11 20 0Z"/>
          <path d="M10 23a13 13 0 1 1 20 0
                   M5 27a19 19 0 1 1 30 0"/>
        </svg>

        <div>
          <h3>与附近朋友聊天</h3>
          <p>可以与附近朋友聊天，即使该朋友不是 KakaoTalk 好友。</p>
        </div>
      </div>

      <div class="kakao-nearby-actions">
        <button type="button" data-start-chat="nearby-create">
          创建 / 邀请聊天
        </button>
        <button type="button" data-start-chat="nearby-code">
          以入场码参与
        </button>
      </div>
    </section>

    <p class="kakao-start-chat-status" role="status"></p>
  </div>
`;

app.appendChild(startChatScreen);

const startChatClose = startChatScreen.querySelector(
  ".kakao-start-chat-close"
);
const startChatStatus = startChatScreen.querySelector(
  ".kakao-start-chat-status"
);

function openStartChat() {
  startChatStatus.textContent = "";
  startChatScreen.hidden = false;
  startChatClose.focus();
}

function closeStartChat() {
  closeChatPicker();
  startChatScreen.hidden = true;
}

startChatClose.addEventListener("click", () => {
  closeStartChat();

  document.querySelector(
    '#kakao-page-actions [data-header-action="newChat"]'
  )?.focus();
});

startChatScreen.addEventListener("click", (event) => {
  const button = event.target.closest("[data-start-chat]");
  if (!button) return;

  const type = button.dataset.startChat;

  if (["normal", "team", "secret"].includes(type)) {
    openChatPicker(type);
    return;
  }

  if (type === "open") {
    openOpenChatSheet();
    return;
  }

  startChatStatus.textContent =
    `“${button.textContent.trim()}”功能待连接`;
});

document.addEventListener("keydown", (event) => {
  if (startChatScreen.hidden || !chatPicker.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    startChatClose.click();
    return;
  }

  if (event.key === "Tab") {
    const buttons = [...startChatScreen.querySelectorAll("button")];
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
}, true);
// 开始聊天：选择好友
const chatPicker = document.createElement("section");
chatPicker.className = "kakao-chat-picker";
chatPicker.hidden = true;

chatPicker.innerHTML = `
  <header class="kakao-chat-picker-header">
    <button type="button" class="kakao-chat-picker-close"
            aria-label="关闭">×</button>
    <h2>选择好友</h2>
    <button type="button" class="kakao-chat-picker-confirm" disabled>
      确定
    </button>
  </header>

  <input
    class="kakao-chat-picker-search"
    type="search"
    placeholder="昵称 / 电话号码搜索"
    aria-label="搜索好友"
    autocomplete="off"
  >

  <h3>好友</h3>
  <div class="kakao-chat-picker-list"></div>
  <p class="kakao-chat-picker-status" role="status"></p>
`;

startChatScreen.appendChild(chatPicker);

const chatPickerClose = chatPicker.querySelector(
  ".kakao-chat-picker-close"
);
const chatPickerConfirm = chatPicker.querySelector(
  ".kakao-chat-picker-confirm"
);
const chatPickerSearch = chatPicker.querySelector(
  ".kakao-chat-picker-search"
);
const chatPickerList = chatPicker.querySelector(
  ".kakao-chat-picker-list"
);
const chatPickerStatus = chatPicker.querySelector(
  ".kakao-chat-picker-status"
);

let chatPickerMode = "normal";
const chatPickerSelected = new Set();

function updateChatPickerConfirm() {
  chatPickerConfirm.disabled = chatPickerSelected.size === 0;
  chatPickerConfirm.textContent =
    chatPickerMode === "team" ? "下一步" : "确定";
}

function renderChatPicker() {
  const keyword = chatPickerSearch.value.trim().toLocaleLowerCase();
  const phoneKeyword = keyword.replace(/\D/g, "");

  const people = friendList.filter((friend) => {
    return (
      isVisibleInCurrentStory(friend) &&
      !isFriendHidden(friend) &&
      (
        !keyword ||
        friend.name.toLocaleLowerCase().includes(keyword) ||
        (
          phoneKeyword &&
          /^[+\d\s()-]+$/.test(keyword) &&
          String(friend.phone || "")
            .replace(/\D/g, "")
            .includes(phoneKeyword)
        )
      )
    );
  });

  chatPickerList.replaceChildren();

  people.forEach((friend) => {
    const row = document.createElement("label");
    row.className = "kakao-chat-picker-person";

    const avatar = document.createElement("img");
    avatar.src =
      friend.avatar || "./assets/avatars/default-avatar.png";
    avatar.alt = "";

    const name = document.createElement("span");
    name.textContent = friend.name;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = chatPickerSelected.has(friend.chatId);
    checkbox.setAttribute("aria-label", `选择 ${friend.name}`);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        chatPickerSelected.add(friend.chatId);
      } else {
        chatPickerSelected.delete(friend.chatId);
      }

      chatPickerStatus.textContent = "";
      updateChatPickerConfirm();
    });

    row.append(avatar, name, checkbox);
    chatPickerList.appendChild(row);
  });

  if (!people.length) {
    const empty = document.createElement("p");
    empty.className = "kakao-chat-picker-empty";
    empty.textContent = keyword ? "没有找到好友" : "暂无好友";
    chatPickerList.appendChild(empty);
  }
}

function openChatPicker(mode) {
  chatPickerMode = mode;
  chatPickerSelected.clear();
  chatPickerSearch.value = "";
  chatPickerStatus.textContent = "";

  chatPicker.querySelector("h2").textContent =
    mode === "team" ? "邀请成员" : "选择好友";

  updateChatPickerConfirm();
  renderChatPicker();

  chatPicker.hidden = false;
  chatPickerClose.focus();
}

function closeChatPicker() {
  closeTeamSetup();
  chatPicker.hidden = true;
}

chatPickerClose.addEventListener("click", () => {
  closeChatPicker();

  startChatScreen.querySelector(
    `[data-start-chat="${chatPickerMode}"]`
  )?.focus();
});

chatPickerSearch.addEventListener("input", renderChatPicker);

chatPickerConfirm.addEventListener("click", () => {
  const selectedFriends = friendList.filter((friend) => {
    return (
      chatPickerSelected.has(friend.chatId) &&
      isVisibleInCurrentStory(friend) &&
      !isFriendHidden(friend)
    );
  });

  if (!selectedFriends.length) return;

  // 团队聊天的下一步稍后连接
  if (chatPickerMode === "team") {
     openTeamSetup();
     return;
   }
  const story = phone.dataset.story || "default";
  let targetChatId;

  // 普通聊天：选一个人，打开已有聊天
  if (chatPickerMode === "normal" && selectedFriends.length === 1) {
    const friend = selectedFriends[0];

    const existingChat = chatList.find((chat) => {
      return chat.id === friend.chatId &&
        isVisibleInCurrentStory(chat);
    });

    if (!existingChat) {
      chatPickerStatus.textContent = "没有找到该好友对应的聊天资料。";
      return;
    }

    targetChatId = existingChat.id;
  } else if (chatPickerMode === "secret") {
    // 秘密聊天：限一位好友
    if (selectedFriends.length !== 1) {
      chatPickerStatus.textContent = "秘密聊天请选择一位好友。";
      return;
    }

    const friend = selectedFriends[0];
    const secretId = `secret-${story}-${friend.chatId}`;

    let secretChat = chatList.find((chat) => {
      return chat.id === secretId;
    });

    if (!secretChat) {
      secretChat = {
        id: secretId,
        name: `${friend.name} · 秘密聊天`,
        avatar: friend.avatar || "",
        story,
        isSecret: true,
        preview: "",
        time: "",
        unread: 0,
        initialMessages: [],
        replyOptions: []
      };

      chatList.push(secretChat);
    }

    targetChatId = secretChat.id;
  } else {
    // 普通聊天：选多人，创建群聊
    const groupId = `group-${story}-${
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }`;

    const groupChat = {
      id: groupId,
      name: selectedFriends.map((friend) => friend.name).join(", "),
      type: "group",
      story,
      avatar: "",
      members: [
        "예지",
        ...selectedFriends.map((friend) => friend.name)
      ],
      preview: "",
      time: "",
      unread: 0,
      initialMessages: [],
      replyOptions: []
    };

    chatList.push(groupChat);
    targetChatId = groupId;
  }

  closeStartChat();
  showPage("chats");
  openConversation(targetChatId);
});

document.addEventListener("keydown", (event) => {
  if (chatPicker.hidden || !teamSetupScreen.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    chatPickerClose.click();
    return;
  }

  if (event.key === "Tab") {
    const controls = [
      ...chatPicker.querySelectorAll("button:not(:disabled), input")
    ];

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
// 团队聊天：设置名称
const teamSetupScreen = document.createElement("section");
teamSetupScreen.className = "kakao-team-setup";
teamSetupScreen.hidden = true;

teamSetupScreen.innerHTML = `
  <header class="kakao-chat-picker-header">
    <button type="button" class="kakao-team-back"
            aria-label="返回选择成员">‹</button>

    <h2>团队聊天</h2>

    <button type="button" class="kakao-team-create" disabled>
      创建
    </button>
  </header>

  <form class="kakao-team-form">
    <label for="kakao-team-name">团队名称</label>

    <input
      id="kakao-team-name"
      type="text"
      placeholder="请输入团队名称"
      maxlength="30"
      autocomplete="off"
    >

    <p class="kakao-team-counter">0/30</p>

    <h3>已选择的成员</h3>
    <div class="kakao-team-members"></div>

    <p class="kakao-team-status" role="status"></p>
  </form>
`;

chatPicker.appendChild(teamSetupScreen);

const teamNameInput = teamSetupScreen.querySelector("#kakao-team-name");
const teamCreateButton = teamSetupScreen.querySelector(".kakao-team-create");
const teamBackButton = teamSetupScreen.querySelector(".kakao-team-back");
const teamMembersBox = teamSetupScreen.querySelector(".kakao-team-members");
const teamStatus = teamSetupScreen.querySelector(".kakao-team-status");

let pendingTeamMemberIds = [];

function openTeamSetup() {
  const people = friendList.filter((friend) => {
    return (
      chatPickerSelected.has(friend.chatId) &&
      isVisibleInCurrentStory(friend) &&
      !isFriendHidden(friend)
    );
  });

  if (!people.length) return;

  pendingTeamMemberIds = people.map((friend) => friend.chatId);

  teamNameInput.value = "";
  teamCreateButton.disabled = true;
  teamStatus.textContent = "";
  teamSetupScreen.querySelector(".kakao-team-counter").textContent = "0/30";
  teamMembersBox.replaceChildren();

  people.forEach((friend) => {
    const member = document.createElement("div");
    member.className = "kakao-team-member";

    const avatar = document.createElement("img");
    avatar.src =
      friend.avatar || "./assets/avatars/default-avatar.png";
    avatar.alt = "";

    const name = document.createElement("span");
    name.textContent = friend.name;

    member.append(avatar, name);
    teamMembersBox.appendChild(member);
  });

  teamSetupScreen.hidden = false;
  teamNameInput.focus();
}

function closeTeamSetup() {
  teamSetupScreen.hidden = true;
}

teamBackButton.addEventListener("click", () => {
  closeTeamSetup();
  chatPickerConfirm.focus();
});

teamNameInput.addEventListener("input", () => {
  teamCreateButton.disabled = !teamNameInput.value.trim();

  teamSetupScreen.querySelector(".kakao-team-counter").textContent =
    `${teamNameInput.value.length}/30`;

  teamStatus.textContent = "";
});

function createTeamChat() {
  const name = teamNameInput.value.trim();
  if (!name) return;

  const people = friendList.filter((friend) => {
    return (
      pendingTeamMemberIds.includes(friend.chatId) &&
      isVisibleInCurrentStory(friend) &&
      !isFriendHidden(friend)
    );
  });

  if (!people.length) {
    teamStatus.textContent = "请选择至少一位成员。";
    return;
  }

  teamCreateButton.disabled = true;

  const story = phone.dataset.story || "default";
  const teamId = `team-${story}-${
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }`;

  chatList.push({
    id: teamId,
    name,
    type: "group",
    isTeam: true,
    story,
    avatar: "",
    members: ["예지", ...people.map((friend) => friend.name)],
    preview: "",
    time: "",
    unread: 0,
    initialMessages: [],
    replyOptions: []
  });

  closeTeamSetup();
  closeStartChat();
  showPage("chats");
  openConversation(teamId);
}

teamCreateButton.addEventListener("click", createTeamChat);

teamSetupScreen.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  createTeamChat();
});

document.addEventListener("keydown", (event) => {
  if (teamSetupScreen.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    teamBackButton.click();
    return;
  }

  if (event.key === "Tab") {
    const controls = [
      ...teamSetupScreen.querySelectorAll("button:not(:disabled), input")
    ];

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
// 创建开放聊天：底部面板
const openChatOverlay = document.createElement("div");
openChatOverlay.className = "kakao-open-chat-overlay";
openChatOverlay.hidden = true;

openChatOverlay.innerHTML = `
  <section
    class="kakao-open-chat-sheet"
    role="dialog"
    aria-labelledby="kakao-open-chat-title"
  >
    <div class="kakao-open-chat-handle" aria-hidden="true"></div>

    <h2 id="kakao-open-chat-title">创建开放聊天</h2>

    <div class="kakao-open-chat-options">
      <button type="button" data-open-chat="group">
        <span class="kakao-open-chat-icon" aria-hidden="true">💬</span>
        <span>
          <strong>群聊</strong>
          <small>仅限成员聊天的聊天室</small>
        </span>
      </button>

      <button type="button" data-open-chat="community">
        <span class="kakao-open-chat-icon" aria-hidden="true">👥</span>
        <span>
          <strong>社群 <em>Open to all</em></strong>
          <small>对所有人开放的聊天室</small>
        </span>
      </button>

      <button type="button" data-open-chat="private">
        <span class="kakao-open-chat-icon" aria-hidden="true">🗨️</span>
        <span>
          <strong>一对一聊天</strong>
          <small>可以和非好友聊天</small>
        </span>
      </button>

      <button type="button" data-open-chat="profile">
        <span class="kakao-open-chat-icon" aria-hidden="true">🙂</span>
        <span>
          <strong>打开个人资料</strong>
          <small>创建开放聊天个性化资料</small>
        </span>
      </button>
    </div>

    <p class="kakao-open-chat-status" role="status"></p>

    <button type="button" class="kakao-open-chat-cancel">
      取消
    </button>
  </section>
`;

app.appendChild(openChatOverlay);

const openChatCancel = openChatOverlay.querySelector(
  ".kakao-open-chat-cancel"
);
const openChatStatus = openChatOverlay.querySelector(
  ".kakao-open-chat-status"
);

function openOpenChatSheet() {
  // 参考图中的面板显示在聊天列表上方
  closeStartChat();
  showPage("chats");

  openChatStatus.textContent = "";
  openChatOverlay.hidden = false;
  openChatOverlay.querySelector("[data-open-chat]").focus();
}

function closeOpenChatSheet() {
  openChatOverlay.hidden = true;
}

function dismissOpenChatSheet() {
  closeOpenChatSheet();

  document.querySelector(
    '#kakao-page-actions [data-header-action="newChat"]'
  )?.focus();
}

openChatCancel.addEventListener("click", dismissOpenChatSheet);

openChatOverlay.addEventListener("click", (event) => {
  if (event.target === openChatOverlay) {
    dismissOpenChatSheet();
    return;
  }

  const button = event.target.closest("[data-open-chat]");
  if (!button) return;

  const names = {
    group: "群聊",
    community: "社群",
    private: "一对一聊天",
    profile: "个人资料"
  };

  openChatStatus.textContent =
    `“${names[button.dataset.openChat]}”设置页面待连接`;
});

document.addEventListener("keydown", (event) => {
  if (openChatOverlay.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    dismissOpenChatSheet();
    return;
  }

  if (event.key === "Tab") {
    const buttons = [
      ...openChatOverlay.querySelectorAll("button:not(:disabled)")
    ];

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
}, true);
// 聊天列表：设置菜单
const chatSettingsOverlay = document.createElement("div");
chatSettingsOverlay.className = "kakao-chat-settings-overlay";
chatSettingsOverlay.hidden = true;

chatSettingsOverlay.innerHTML = `
  <section
    class="kakao-chat-settings-menu"
    role="dialog"
    aria-label="聊天列表设置"
  >
    <h3>排序聊天室</h3>

    <button type="button" data-chat-sort="time">
      <span class="kakao-sort-check" aria-hidden="true"></span>
      <span>按时间</span>
    </button>

    <button type="button" data-chat-sort="unread">
      <span class="kakao-sort-check" aria-hidden="true"></span>
      <span>按未读聊天</span>
    </button>

    <button type="button" data-chat-sort="favorite">
      <span class="kakao-sort-check" aria-hidden="true"></span>
      <span>按收藏</span>
    </button>

    <div class="kakao-chat-settings-divider"></div>

    <button type="button" data-chat-setting="manage">
      <span aria-hidden="true"></span>
      <span>管理聊天室</span>
    </button>

    <button type="button" data-chat-setting="folders">
      <span aria-hidden="true"></span>
      <span>管理聊天室文件夹</span>
    </button>

    <button type="button" data-chat-setting="general">
      <span aria-hidden="true"></span>
      <span>一般设置</span>
    </button>

    <p class="kakao-chat-settings-status" role="status"></p>
  </section>
`;

app.appendChild(chatSettingsOverlay);

let chatSettingsTrigger = null;

function chatSortStorageKey() {
  return `pickphone.kkt.chat-sort.v1.${
    phone.dataset.story || "default"
  }`;
}

function getChatSortMode() {
  try {
    const saved = localStorage.getItem(chatSortStorageKey());

    return ["time", "unread", "favorite"].includes(saved)
      ? saved
      : "time";
  } catch {
    return "time";
  }
}

function updateChatSortChecks() {
  const mode = getChatSortMode();

  chatSettingsOverlay.querySelectorAll("[data-chat-sort]")
    .forEach((button) => {
      const selected = button.dataset.chatSort === mode;

      button.setAttribute("aria-pressed", String(selected));
      button.querySelector(".kakao-sort-check").textContent =
        selected ? "✓" : "";
    });
}

function openChatSettingsMenu(button) {
  chatSettingsTrigger = button;
  button.setAttribute("aria-expanded", "true");

  chatSettingsOverlay.querySelector(
    ".kakao-chat-settings-status"
  ).textContent = "";

  updateChatSortChecks();
  chatSettingsOverlay.hidden = false;

  chatSettingsOverlay.querySelector(
    '[aria-pressed="true"]'
  )?.focus();
}

function closeChatSettingsMenu(restoreFocus = false) {
  chatSettingsOverlay.hidden = true;

  if (chatSettingsTrigger?.isConnected) {
    chatSettingsTrigger.setAttribute("aria-expanded", "false");

    if (restoreFocus) {
      chatSettingsTrigger.focus();
    }
  }
}

chatSettingsOverlay.addEventListener("click", (event) => {
  if (event.target === chatSettingsOverlay) {
    closeChatSettingsMenu(true);
    return;
  }

  const sortButton = event.target.closest("[data-chat-sort]");

  if (sortButton) {
  try {
    localStorage.setItem(
      chatSortStorageKey(),
      sortButton.dataset.chatSort
    );
  } catch {
    chatSettingsOverlay.querySelector(
      ".kakao-chat-settings-status"
    ).textContent = "设置未能保存，请重试。";
    return;
  }

  updateChatSortChecks();

  // 保留当前的“全部 / 未读”筛选
  const activeFilter = content.querySelector(
    "[data-chat-filter].is-active"
  )?.dataset.chatFilter || "all";

  renderChatList(activeFilter);
  closeChatSettingsMenu(true);
  return;
}

  const action = event.target.closest("[data-chat-setting]");
  if (!action) return;
  if (action.dataset.chatSetting === "general") {
  openGeneralSettings();
  return;
}

  chatSettingsOverlay.querySelector(
    ".kakao-chat-settings-status"
  ).textContent =
    `“${action.textContent.trim()}”页面待连接`;
});

document.addEventListener("keydown", (event) => {
  if (chatSettingsOverlay.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeChatSettingsMenu(true);
    return;
  }

  if (event.key === "Tab") {
    const buttons = [
      ...chatSettingsOverlay.querySelectorAll("button")
    ];

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
}, true);
// 取得最后一条消息的时间，用于排序
function getChatSortTime(chat) {
  const messages = getConversation(chat).messages;
  const last = messages[messages.length - 1];

  if (!last) return 0;

  const time = String(last.time || chat.time || "");
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return 0;

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  if (hours > 23 || minutes > 59) return 0;

  // 没写日期的消息，沿用现有界面的“今天”规则
  const dateText = last.date || getMessageDate();
  const dateMatch = String(dateText).match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!dateMatch) return 0;

  const value = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    hours,
    minutes
  ).getTime();

  return Number.isFinite(value) ? value : 0;
}
// 新建通话：好友 / 聊天
const callPicker = document.createElement("section");
callPicker.className = "kakao-chat-picker kakao-call-picker";
callPicker.hidden = true;

callPicker.innerHTML = `
  <header class="kakao-chat-picker-header">
    <button type="button" class="kakao-chat-picker-close"
            aria-label="关闭">×</button>

    <h2>选择通话对象</h2>

    <button type="button" class="kakao-chat-picker-confirm" disabled>
      确认
    </button>
  </header>

  <div class="kakao-call-picker-tabs">
    <button type="button" data-call-picker-tab="friends"
            aria-pressed="true">好友</button>
    <button type="button" data-call-picker-tab="chats"
            aria-pressed="false">聊天</button>
  </div>

  <input
    class="kakao-chat-picker-search"
    type="search"
    placeholder="昵称 / 电话号码搜索"
    aria-label="搜索通话对象"
    autocomplete="off"
  >

  <h3 class="kakao-call-picker-heading">好友</h3>
  <div class="kakao-chat-picker-list"></div>
  <p class="kakao-chat-picker-status" role="status"></p>
`;

app.appendChild(callPicker);

const callPickerClose = callPicker.querySelector(
  ".kakao-chat-picker-close"
);
const callPickerConfirm = callPicker.querySelector(
  ".kakao-chat-picker-confirm"
);
const callPickerSearch = callPicker.querySelector(
  ".kakao-chat-picker-search"
);
const callPickerList = callPicker.querySelector(
  ".kakao-chat-picker-list"
);
const callPickerStatus = callPicker.querySelector(
  ".kakao-chat-picker-status"
);

let callPickerTab = "friends";
const callPickerSelected = new Set();

function getCallPickerItems() {
  if (callPickerTab === "friends") {
    return friendList
      .filter((friend) => {
        return isVisibleInCurrentStory(friend) &&
          !isFriendHidden(friend);
      })
      .map((friend) => ({
        id: friend.chatId,
        name: friend.name,
        avatar: friend.avatar,
        phone: friend.phone || "",
        description: "",
        searchText: `${friend.name} ${friend.phone || ""}`
      }));
  }

  return chatList
    .filter((chat) => {
      return isVisibleInCurrentStory(chat) &&
        !isChatRemoved(chat);
    })
    .map((chat) => ({
      id: chat.id,
      name: getChatDisplayName(chat),
      avatar: getChatAvatar(chat),
      phone: "",
      description: chat.preview || "",
      searchText: [
        getChatDisplayName(chat),
        chat.name,
        ...(chat.members || [])
      ].join(" ")
    }));
}

function updateCallPickerConfirm() {
  const count = callPickerSelected.size;
  callPickerConfirm.disabled = count === 0;
  callPickerConfirm.textContent = count ? `确认(${count})` : "确认";
}

function renderCallPicker() {
  const keyword = callPickerSearch.value.trim().toLocaleLowerCase();
  const phoneKeyword = keyword.replace(/\D/g, "");

  const items = getCallPickerItems().filter((item) => {
    return (
      !keyword ||
      item.searchText.toLocaleLowerCase().includes(keyword) ||
      (
        callPickerTab === "friends" &&
        phoneKeyword &&
        /^[+\d\s()-]+$/.test(keyword) &&
        item.phone.replace(/\D/g, "").includes(phoneKeyword)
      )
    );
  });

  callPickerList.replaceChildren();

  items.forEach((item) => {
    const row = document.createElement("label");
    row.className = "kakao-chat-picker-person";

    const avatar = document.createElement("img");
    avatar.src =
      item.avatar || "./assets/avatars/default-avatar.png";
    avatar.alt = "";

    const details = document.createElement("span");
    details.className = "kakao-call-picker-details";

    const name = document.createElement("strong");
    name.textContent = item.name;
    details.appendChild(name);

    if (item.description) {
      const preview = document.createElement("small");
      preview.textContent = item.description;
      details.appendChild(preview);
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = callPickerSelected.has(item.id);
    checkbox.setAttribute("aria-label", `选择 ${item.name}`);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        callPickerSelected.add(item.id);
      } else {
        callPickerSelected.delete(item.id);
      }

      callPickerStatus.textContent = "";
      updateCallPickerConfirm();
    });

    row.append(avatar, details, checkbox);
    callPickerList.appendChild(row);
  });

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "kakao-chat-picker-empty";
    empty.textContent = keyword ? "没有找到匹配结果" : "暂无可选对象";
    callPickerList.appendChild(empty);
  }

  updateCallPickerConfirm();
}

function setCallPickerTab(tab) {
  callPickerTab = tab;
  callPickerSelected.clear();
  callPickerSearch.value = "";
  callPickerStatus.textContent = "";

  callPickerSearch.placeholder = tab === "friends"
    ? "昵称 / 电话号码搜索"
    : "搜索聊天室、参与者";

  callPicker.querySelector(".kakao-call-picker-heading").textContent =
    tab === "friends" ? "好友" : "聊天";

  callPicker.querySelectorAll("[data-call-picker-tab]")
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.callPickerTab === tab)
      );
    });

  renderCallPicker();
  callPickerList.scrollTop = 0;
}

function openCallPicker() {
  setCallPickerTab("friends");
  callPicker.hidden = false;
  callPickerClose.focus();
}

function closeCallPicker() {
  callPicker.hidden = true;
}

callPickerClose.addEventListener("click", () => {
  closeCallPicker();

  document.querySelector(
    '#kakao-page-actions [data-header-action="newCall"]'
  )?.focus();
});

callPicker.querySelectorAll("[data-call-picker-tab]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      setCallPickerTab(button.dataset.callPickerTab);
    });
  });

callPickerSearch.addEventListener("input", renderCallPicker);

callPickerConfirm.addEventListener("click", () => {
  if (!callPickerSelected.size) return;
  openOutgoingCall();
});

document.addEventListener("keydown", (event) => {
  if (callPicker.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    callPickerClose.click();
    return;
  }

  if (event.key === "Tab") {
    const controls = [
      ...callPicker.querySelectorAll("button:not(:disabled), input")
    ];

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
// 虚拟呼叫界面
const outgoingCallScreen = document.createElement("section");
outgoingCallScreen.className = "kakao-outgoing-call";
outgoingCallScreen.hidden = true;

outgoingCallScreen.innerHTML = `
  <div class="kakao-outgoing-call-profile">
    <img class="kakao-outgoing-call-avatar" alt="">
    <h2 class="kakao-outgoing-call-name"></h2>
    <p role="status">正在呼叫<span class="kakao-call-dots">…</span></p>
  </div>

  <div class="kakao-outgoing-call-controls">
    <button type="button" class="kakao-call-hangup">
      <span class="kakao-call-hangup-icon">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M5 20v-5c6-6 16-6 22 0v5
                   h-7v-5a14 14 0 0 0-8 0v5Z"/>
        </svg>
      </span>
      <span>挂断</span>
    </button>
  </div>
`;

app.appendChild(outgoingCallScreen);

const outgoingCallAvatar = outgoingCallScreen.querySelector(
  ".kakao-outgoing-call-avatar"
);
const outgoingCallName = outgoingCallScreen.querySelector(
  ".kakao-outgoing-call-name"
);
const callHangupButton = outgoingCallScreen.querySelector(
  ".kakao-call-hangup"
);

function openOutgoingCall() {
  const targets = getCallPickerItems().filter((item) => {
    return callPickerSelected.has(item.id);
  });

  if (!targets.length) return;

  outgoingCallName.textContent = targets
    .map((item) => item.name)
    .join("、");

  outgoingCallAvatar.src = targets.length === 1
    ? targets[0].avatar || "./assets/avatars/default-avatar.png"
    : "./assets/avatars/default-avatar.png";

  closeCallPicker();
  outgoingCallScreen.hidden = false;
  callHangupButton.focus();
}

function closeOutgoingCall() {
  outgoingCallScreen.hidden = true;
}

function finishOutgoingCall() {
  closeOutgoingCall();

  // 从聊天内呼叫：保留原聊天界面
  if (activeChatId && app.classList.contains("in-conversation")) {
    content.querySelector(".kakao-composer-plus")?.focus();
    return;
  }

  // 从通话页呼叫：返回通话列表
  showPage("calls");

  document.querySelector(
    '#kakao-page-actions [data-header-action="newCall"]'
  )?.focus();
}

callHangupButton.addEventListener("click", finishOutgoingCall);

document.addEventListener("keydown", (event) => {
  if (outgoingCallScreen.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    finishOutgoingCall();
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    event.stopImmediatePropagation();
    callHangupButton.focus();
  }
}, true);
// 聊天输入栏：附件面板
const attachmentOverlay = document.createElement("div");
attachmentOverlay.className = "kakao-attachment-overlay";
attachmentOverlay.hidden = true;

attachmentOverlay.innerHTML = `
  <section
    class="kakao-attachment-sheet"
    role="dialog"
    aria-label="聊天附件"
  >
    <button type="button" class="kakao-attachment-handle"
            aria-label="展开附件面板" aria-expanded="false">
      <span></span>
    </button>

    <header class="kakao-attachment-header">
      <h2>最新照片</h2>
      <button type="button" disabled>发送</button>
    </header>

    <div class="kakao-attachment-recent">
      <button type="button" class="kakao-attachment-camera"
              data-attachment="camera" aria-label="相机">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M5 9h6l2-4h6l2 4h6v17H5Z"/>
          <circle cx="16" cy="17" r="6"/>
        </svg>
      </button>

      <span class="kakao-attachment-photo-empty">暂无照片</span>
    </div>

    <div class="kakao-attachment-options"></div>

    <div class="kakao-attachment-tools">
      <strong>从拼写校对、翻译到聊天机器人！</strong>
      <small>试用工具栏 ›</small>
    </div>

    <p class="kakao-attachment-status" role="status"></p>

    <button type="button" class="kakao-attachment-close">关闭</button>
  </section>
`;

app.appendChild(attachmentOverlay);

const attachmentSheet = attachmentOverlay.querySelector(
  ".kakao-attachment-sheet"
);
const attachmentHandle = attachmentOverlay.querySelector(
  ".kakao-attachment-handle"
);
const attachmentStatus = attachmentOverlay.querySelector(
  ".kakao-attachment-status"
);

const attachmentItems = [
  ["photos", "照片", "▧", "green"],
  ["call", "通话", "☎", "green"],
  ["location", "位置", "●", "blue"],
  ["file", "文件", "▤", "gray"],
  ["contact", "联系人", "▣", "green"],
  ["voice", "语音备忘录", "≋", "red"],
  ["scheduled", "定时消息", "◷", "purple"],
  ["capture", "截图", "▣", "gray"],
  ["event", "事件", "✓", "blue"]
];

const attachmentOptions = attachmentOverlay.querySelector(
  ".kakao-attachment-options"
);

attachmentItems.forEach(([id, name, symbol, color]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.attachment = id;

  const icon = document.createElement("span");
  icon.className = `kakao-attachment-icon attachment-${color}`;
  icon.textContent = symbol;
  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.textContent = name;

  button.append(icon, label);
  attachmentOptions.appendChild(button);
});

function setAttachmentExpanded(expanded) {
  attachmentSheet.classList.toggle("is-expanded", expanded);
  attachmentHandle.setAttribute("aria-expanded", String(expanded));
  attachmentHandle.setAttribute(
    "aria-label",
    expanded ? "收起附件面板" : "展开附件面板"
  );
}

function openAttachments() {
  if (!activeChatId) return;
  selectedAttachmentPhotos.clear();
  renderAttachmentPhotos();

  attachmentStatus.textContent = "";
  setAttachmentExpanded(false);

  attachmentOverlay.hidden = false;
  attachmentSheet.scrollTop = 0;
  attachmentHandle.focus();
}

function closeAttachments(restoreFocus = false) {
  attachmentOverlay.hidden = true;

  if (restoreFocus) {
    content.querySelector(".kakao-composer-plus")?.focus();
  }
}

// 输入栏由 openConversation 动态创建，所以使用事件委托
content.addEventListener("click", (event) => {
  if (event.target.closest(".kakao-composer-plus")) {
    openAttachments();
  }
});

attachmentHandle.addEventListener("click", () => {
  setAttachmentExpanded(
    !attachmentSheet.classList.contains("is-expanded")
  );
});

// 拖动顶部横条：向上展开，向下收起
let attachmentDragY = null;

attachmentHandle.addEventListener("pointerdown", (event) => {
  attachmentDragY = event.clientY;
  attachmentHandle.setPointerCapture(event.pointerId);
});

attachmentHandle.addEventListener("pointerup", (event) => {
  if (attachmentDragY === null) return;

  const distance = event.clientY - attachmentDragY;
  attachmentDragY = null;

  if (Math.abs(distance) > 25) {
    setAttachmentExpanded(distance < 0);

    // 防止拖动结束后的 click 再次切换
    attachmentHandle.addEventListener("click", (clickEvent) => {
      clickEvent.stopImmediatePropagation();
    }, { once: true, capture: true });
  }
});

attachmentHandle.addEventListener("pointercancel", () => {
  attachmentDragY = null;
});

attachmentOverlay.addEventListener("click", (event) => {
  if (event.target === attachmentOverlay) {
    closeAttachments(true);
    return;
  }

  const button = event.target.closest("[data-attachment]");
  if (!button) return;
  if (button.dataset.attachment === "photos") {
  chooseAttachmentPhotos();
  return;
}
  if (button.dataset.attachment === "call") {
    callCurrentConversation();
    return;
  }

  const item = attachmentItems.find(
    ([id]) => id === button.dataset.attachment
  );

  attachmentStatus.textContent =
    `“${item?.[1] || "相机"}”功能下一步连接。`;
});

attachmentOverlay.querySelector(".kakao-attachment-close")
  .addEventListener("click", () => closeAttachments(true));

document.addEventListener("keydown", (event) => {
  if (attachmentOverlay.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeAttachments(true);
    return;
  }

  if (event.key === "Tab") {
    const buttons = [
      ...attachmentOverlay.querySelectorAll("button:not(:disabled)")
    ];

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
}, true);
// 聊天附件：照片选择与发送
const attachmentPhotoInput = document.createElement("input");
attachmentPhotoInput.type = "file";
attachmentPhotoInput.accept = "image/jpeg,image/png,image/webp,image/gif";
attachmentPhotoInput.multiple = true;
attachmentPhotoInput.hidden = true;
app.appendChild(attachmentPhotoInput);

const attachmentSendButton = attachmentOverlay.querySelector(
  ".kakao-attachment-header button"
);
const attachmentRecent = attachmentOverlay.querySelector(
  ".kakao-attachment-recent"
);

const attachmentPhotos = [];
const selectedAttachmentPhotos = new Set();

let attachmentPhotosLoading = false;
let attachmentPhotoSequence = 0;

function updateAttachmentSendButton() {
  const count = selectedAttachmentPhotos.size;

  attachmentSendButton.disabled =
    count === 0 || attachmentPhotosLoading;

  attachmentSendButton.textContent = count
    ? `发送(${count})`
    : "发送";
}

function renderAttachmentPhotos() {
  // 保留原来的相机格子
  attachmentRecent.querySelectorAll(
    ".kakao-attachment-photo, .kakao-attachment-photo-empty"
  ).forEach((element) => element.remove());

  if (!attachmentPhotos.length) {
    const empty = document.createElement("span");
    empty.className = "kakao-attachment-photo-empty";
    empty.textContent = "点击“照片”选择图片";
    attachmentRecent.appendChild(empty);
  }

  attachmentPhotos.forEach((photo) => {
    const label = document.createElement("label");
    label.className = "kakao-attachment-photo";

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.name;
    image.draggable = false;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedAttachmentPhotos.has(photo.id);
    checkbox.setAttribute("aria-label", `选择 ${photo.name}`);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedAttachmentPhotos.add(photo.id);
      } else {
        selectedAttachmentPhotos.delete(photo.id);
      }

      updateAttachmentSendButton();
    });

    label.append(image, checkbox);
    attachmentRecent.appendChild(label);
  });

  updateAttachmentSendButton();
}

function chooseAttachmentPhotos() {
  if (attachmentPhotosLoading) return;

  attachmentPhotoInput.value = "";
  attachmentPhotoInput.click();
}

function readAttachmentPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve({
      id: `attachment-photo-${++attachmentPhotoSequence}`,
      name: file.name,
      src: reader.result
    });

    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

attachmentPhotoInput.addEventListener("change", async () => {
  const files = [...attachmentPhotoInput.files];
  if (!files.length) return;

  const allowedTypes = [
    "image/jpeg", "image/png", "image/webp", "image/gif"
  ];

  const validFiles = files.filter((file) => {
    return allowedTypes.includes(file.type) &&
      file.size <= 10 * 1024 * 1024;
  });

  if (!validFiles.length) {
    attachmentStatus.textContent =
      "请选择 JPG、PNG、WebP 或 GIF 图片，每张不超过 10MB。";
    return;
  }

  attachmentPhotosLoading = true;
  updateAttachmentSendButton();
  attachmentStatus.textContent = "正在读取图片…";

  const results = await Promise.allSettled(
    validFiles.map(readAttachmentPhoto)
  );

  let added = 0;

  results.forEach((result) => {
    if (result.status !== "fulfilled") return;

    attachmentPhotos.unshift(result.value);
    selectedAttachmentPhotos.add(result.value.id);
    added++;
  });

  attachmentPhotosLoading = false;
  renderAttachmentPhotos();

  attachmentStatus.textContent =
    added === files.length
      ? ""
      : `已加入 ${added} 张图片，部分图片格式不支持、过大或读取失败。`;
});

attachmentSendButton.addEventListener("click", () => {
  if (attachmentPhotosLoading) return;

  const chat = chatList.find((item) => {
    return item.id === activeChatId &&
      isVisibleInCurrentStory(item);
  });

  if (!chat) return;

  const photos = attachmentPhotos.filter((photo) => {
    return selectedAttachmentPhotos.has(photo.id);
  });

  if (!photos.length) return;

  const conversation = getConversation(chat);
  const time = getMessageTime();
  const date = getMessageDate();

  photos.forEach((photo) => {
    conversation.messages.push({
      mine: true,
      type: "image",
      src: photo.src,
      text: photo.name,
      time,
      date
    });
  });

  chat.preview = "[图片]";
  chat.time = time;

  selectedAttachmentPhotos.clear();
  renderAttachmentPhotos();

  closeAttachments();
  openConversation(chat.id);

  const messages = document.getElementById("kakao-messages");
  if (messages) {
    messages.scrollTop = messages.scrollHeight;
  }
});
// 从当前聊天发起虚拟通话
function callCurrentConversation() {
  const chat = chatList.find((item) => {
    return item.id === activeChatId &&
      isVisibleInCurrentStory(item);
  });

  if (!chat) return;

  outgoingCallName.textContent = getChatDisplayName(chat);
  outgoingCallAvatar.src = getChatAvatar(chat);

  closeAttachments();
  closeCallPicker();

  outgoingCallScreen.hidden = false;
  callHangupButton.focus();
}
// 一般设置顶部资料：之后在这里修改
const kakaoSettingsProfile = {
  name: "황예지",
  avatar: "./assets/avatars/default-avatar.png",
  phone: "",
  email: ""
};

const generalSettingsItems = [
  ["account", "帐户", "person"],
  ["family", "家庭帐户", "person"],
  ["privacy", "隐私", "lock"],
  ["friends", "好友", "person"],
  ["notifications", "通知", "bell"],
  ["chats", "聊天", "chat"],
  ["backup", "备份", "box"],
  ["storage", "数据及存储空间", "box"],
  ["display", "显示", "sun"],
  ["theme", "主题", "box", "灯光模式"],
  ["emoticons", "Emoticons", "smile"],
  ["calls", "呼叫", "phone"],
  ["lab", "Kakao 实验室", "box", "", true],
  ["advanced", "高级功能", "more"],
  ["announcements", "通知", "bell", "", true],
  ["safety", "KakaoTalk Safety Guide", "smile"],
  ["help", "客户服务 / 运营政策", "help"],
  ["app", "应用管理", "help", "更新", true]
];

const generalSettingsIcons = {
  person: `<circle cx="12" cy="7" r="4"/>
           <path d="M4 22v-2a8 8 0 0 1 16 0v2"/>`,
  lock: `<rect x="5" y="10" width="14" height="12" rx="2"/>
         <path d="M8 10V6a4 4 0 0 1 8 0v4M12 15v3"/>`,
  bell: `<path d="M5 17h14l-2-3V9A5 5 0 0 0 7 9v5Z"/>
         <path d="M10 20a2 2 0 0 0 4 0"/>`,
  chat: `<path d="M21 11c0 5-5 8-10 8l-6 3 1-6
                  C0 10 5 3 12 3c5 0 9 3 9 8Z"/>`,
  box: `<rect x="4" y="3" width="16" height="7" rx="2"/>
        <rect x="4" y="14" width="16" height="7" rx="2"/>
        <path d="M8 6v1M8 17v1"/>`,
  sun: `<circle cx="12" cy="12" r="5"/>
        <path d="M12 1v3M12 20v3M1 12h3M20 12h3
                 M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>`,
  smile: `<circle cx="12" cy="12" r="9"/>
          <path d="M8 14q4 5 8 0M8 8v1M16 8v1"/>`,
  phone: `<path d="m5 3 4 5-2 3a16 16 0 0 0 6 6l3-2
                   5 4-2 3C10 23 1 14 3 5Z"/>`,
  more: `<circle cx="5" cy="12" r="1.5"/>
         <circle cx="12" cy="12" r="1.5"/>
         <circle cx="19" cy="12" r="1.5"/>`,
  help: `<circle cx="12" cy="12" r="10"/>
         <path d="M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17v1"/>`
};

const generalSettingsScreen = document.createElement("section");
generalSettingsScreen.className = "kakao-general-settings";
generalSettingsScreen.hidden = true;

generalSettingsScreen.innerHTML = `
  <header class="kakao-general-header">
    <button type="button" data-general-back aria-label="返回">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 4 7 12l8 8"/>
      </svg>
    </button>

    <h2>设置</h2>

    <button type="button" data-general-search aria-label="搜索设置">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10" cy="10" r="7"/>
        <path d="m15 15 6 6"/>
      </svg>
    </button>
  </header>

  <input class="kakao-general-search" type="search"
         placeholder="搜索设置" aria-label="搜索设置" hidden>

  <div class="kakao-general-body">
    <div class="kakao-general-profile">
      <img alt="">
      <div>
        <strong></strong>
        <small></small>
      </div>
      <button type="button" data-general-profile>管理</button>
    </div>

    <div class="kakao-general-list"></div>
  </div>

  <p class="kakao-general-status" role="status"></p>
`;

app.appendChild(generalSettingsScreen);

const generalSettingsList = generalSettingsScreen.querySelector(
  ".kakao-general-list"
);
const generalSettingsSearch = generalSettingsScreen.querySelector(
  ".kakao-general-search"
);
const generalSettingsStatus = generalSettingsScreen.querySelector(
  ".kakao-general-status"
);

let generalSettingsPreviousFocus = null;

function renderGeneralSettings() {
  const keyword = generalSettingsSearch.value.trim().toLowerCase();
  generalSettingsList.replaceChildren();

  generalSettingsItems
    .filter((item) => item[1].toLowerCase().includes(keyword))
    .forEach(([id, name, icon, value, isNew]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "kakao-general-row";
      button.dataset.generalSetting = id;

      if (id === "announcements") {
        button.classList.add("starts-new-group");
      }

      button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          ${generalSettingsIcons[icon]}
        </svg>
        <span class="kakao-general-row-name"></span>
        <span class="kakao-general-row-value"></span>
      `;

      const label = button.querySelector(".kakao-general-row-name");
      label.textContent = name;

      if (isNew) {
        const badge = document.createElement("em");
        badge.textContent = "N";
        label.appendChild(badge);
      }

      button.querySelector(".kakao-general-row-value").textContent =
        id === "account" ? kakaoSettingsProfile.email : value || "";

      generalSettingsList.appendChild(button);
    });

  if (!generalSettingsList.children.length) {
    const empty = document.createElement("p");
    empty.className = "kakao-general-empty";
    empty.textContent = "没有找到相关设置";
    generalSettingsList.appendChild(empty);
  }
}

function openGeneralSettings() {
  generalSettingsPreviousFocus = document.activeElement;

  closeFriendSettingsMenu();
  closeChatSettingsMenu();

  const profile = generalSettingsScreen.querySelector(
    ".kakao-general-profile"
  );

  profile.querySelector("img").src = kakaoSettingsProfile.avatar;
  profile.querySelector("strong").textContent = kakaoSettingsProfile.name;
  profile.querySelector("small").textContent = kakaoSettingsProfile.phone;

  generalSettingsSearch.value = "";
  generalSettingsSearch.hidden = true;
  generalSettingsStatus.textContent = "";

  renderGeneralSettings();
  generalSettingsScreen.hidden = false;
  generalSettingsScreen.querySelector(".kakao-general-body").scrollTop = 0;
  generalSettingsScreen.querySelector("[data-general-back]").focus();
}

function closeGeneralSettings(restoreFocus = false) {
  generalSettingsScreen.hidden = true;

  if (restoreFocus && generalSettingsPreviousFocus?.isConnected) {
    generalSettingsPreviousFocus.focus();
  }
}

generalSettingsScreen.querySelector("[data-general-back]")
  .addEventListener("click", () => closeGeneralSettings(true));

generalSettingsScreen.querySelector("[data-general-search]")
  .addEventListener("click", () => {
    generalSettingsSearch.hidden = !generalSettingsSearch.hidden;

    if (!generalSettingsSearch.hidden) {
      generalSettingsSearch.focus();
    } else {
      generalSettingsSearch.value = "";
      renderGeneralSettings();
    }
  });

generalSettingsSearch.addEventListener("input", renderGeneralSettings);

generalSettingsScreen.addEventListener("click", (event) => {
  const button = event.target.closest(
    "[data-general-setting], [data-general-profile]"
  );
  if (!button) return;

  const name = button.hasAttribute("data-general-profile")
    ? "个人资料管理"
    : generalSettingsItems.find(
        (item) => item[0] === button.dataset.generalSetting
      )?.[1];

  generalSettingsStatus.textContent = `“${name}”页面待连接`;
});

document.addEventListener("keydown", (event) => {
  if (generalSettingsScreen.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeGeneralSettings(true);
    return;
  }

  if (event.key === "Tab") {
    const controls = [
      ...generalSettingsScreen.querySelectorAll(
        "button:not(:disabled), input"
      )
    ].filter((element) => !element.hidden);

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
// 清空原来的测试对话，保留联系人和群聊
chatList.forEach(chat => {
  chat.preview = "";
  chat.time = "";
  chat.unread = 0;
  chat.initialMessages = [];
  chat.replyOptions = [];
});
// 把独立剧情资料连接到现有聊天
Object.entries(window.KAKAO_STORY_DATA || {}).forEach(
  ([chatId, data]) => {
    const chat = chatList.find(item => item.id === chatId);

    if (!chat) return;

    chat.initialMessages = (data.initialMessages || []).map(
      message => ({ ...message })
    );

    chat.replyOptions = (data.replyOptions || []).map(
      option => [...option]
    );

    // 聊天列表显示最后一条预设消息
    const lastMessage =
      chat.initialMessages[chat.initialMessages.length - 1];

    if (lastMessage) {
      chat.preview = lastMessage.text || "";
      chat.time = lastMessage.time || "";
    }
  }
);
})();

