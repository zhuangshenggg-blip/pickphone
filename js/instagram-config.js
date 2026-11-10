/* 模拟 IG 的扩展资料。图片和音乐请使用项目内实际存在的路径。
 * 两条线共有：不填 story。限定剧情：story: "dream" 或 "cp"。
 * 限定当前账号：accountId: "main" 或 "private"。
 */
window.INSTAGRAM_USERS = [
  { username: "momo",
    name: "MOMO", 
    avatar: "./assets/instagram/avatars/momo.JPG", 
    bio: "TWICE", 
    verified: true,
    followers:15620000,
    following:0 },
  { username: "nayeonyny", 
    name: "NAYEON", 
    avatar: "./assets/instagram/avatars/nayeon.JPG", 
    bio: "TWICE", 
    verified: true,
    followers:12560000,
    following:0 },
  { username: "m.by__sana", 
    name: "SANA", 
    avatar: "./assets/instagram/avatars/sana.JPG", 
    bio: "TWICE", 
    verified: true,
    followers:12810000,
    following:0 },
    { username: "chaerrry0", 
    name: "CHAERYEONG", 
    avatar: "./assets/instagram/avatars/chaeryeong.JPG", 
    bio: "ITZY", 
    verified: true,
    followers:4990000,
    following:5 },
    { username: "lia_loves___", 
    name: "LIA", 
    avatar: "./assets/instagram/avatars/lia.JPG", 
    bio: "ITZY", 
    verified: true,
    followers:3480000,
    following:5 },
    { username: "iamfinethankyouandryu", 
    name: "RYUJIN", 
    avatar: "./assets/instagram/avatars/ryujin.JPG", 
    bio: "ITZY", 
    verified: true,
    followers:5440000,
    following:5 },
    { username: "igotyuandme", 
    name: "YUNA", 
    avatar: "./assets/instagram/avatars/yuna.JPG", 
    bio: "ITZY", 
    verified: true,
    followers:5010000,
    following:5 },
    {
    username: "yezyizhere",
    name: "YEJI",
    verified: true,
    followers: 5730000,
    following: 4,
    followingUsers: [
    "lia_loves___",
    "iamfinethankyouandryu",
    "chaerrry0",
    "igotyuandme"
    ]
  }
];
/* 剧情私信示例（去掉注释后生效）：
 * { id: "dm-01", to: "momo", mine: false, type: "text", text: "안녕!",
 *   createdAt: 1794272400000, storyLine: "dream", accountId: "main" }
 * mine:false 为对方发来；mine:true 为当前角色发出。
 * 不填 seen 就不会虚构已读状态。
 */
window.INSTAGRAM_MESSAGES = [];
/* 通知示例：{username:"momo",text:"momo 赞了你的帖子",postId:"main-post-01"} */
window.INSTAGRAM_ACTIVITY = [];
/* 音乐文件不存在时保持空数组，避免出现无法播放的假选项。
 * 添加示例：{id:"lover",title:"Lover",artist:"Taylor Swift",src:"./assets/audio/lover.mp3"}
 */
window.INSTAGRAM_STORY_MUSIC = [];
