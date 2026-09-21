/* ============================================================
 * 《我的奇葩一学期》网页版 · 事件库
 * 每个事件：scene 场景 emoji、desc 描述、choices 选项
 * 每个选项：text 文案、effects 属性影响（五育）、reason 变化理由
 * ============================================================ */

const EVENTS = [
  {
    scene: "📖",
    desc: "语文课，老师点你回答问题！大脑一片空白……",
    choices: [
      { text: "坦白从宽，老实承认没背熟，下次努力", effects: { deyu: 5 }, reason: "诚实是金，老师悄悄给你点了个赞" },
      { text: "支支吾吾，试图蒙混过关", effects: { deyu: -3 }, reason: "混过一时，混不过自己的良心" },
    ],
  },
  {
    scene: "🧮",
    desc: "数学课遇到拦路虎！一道压轴难题横在眼前……",
    choices: [
      { text: "举手请教老师，把思路彻底弄懂", effects: { zhili: 5 }, reason: "不耻下问，思路瞬间通了！" },
      { text: "眼神求助同桌……想抄答案？", effects: { zhili: -2, deyu: -2 }, reason: "抄来的答案，终究不是自己的" },
    ],
  },
  {
    scene: "🏃",
    desc: "体育课自由奔跑！一不小心脚下打滑，摔了个结实……",
    choices: [
      { text: "拍拍灰尘，站起来继续冲！", effects: { tiyu: 5, deyu: 3 }, reason: "越挫越勇，体育精神爆发！" },
      { text: "哎呦喂，坐在地上求安慰", effects: { tiyu: -3, deyu: -2 }, reason: "摔倒了不可怕，赖着不起来才可怕" },
    ],
  },
  {
    scene: "🎨",
    desc: "美术课挥洒颜料！一不留神，校服遭殃了……",
    choices: [
      { text: "亡羊补牢，赶紧抢救一下", effects: { meiyu: 3, laoyu: 5 }, reason: "动手能力 max，校服焕然一新" },
      { text: "破罐破摔，算了就这样吧", effects: { meiyu: -2, laoyu: -3 }, reason: "爱惜物品也是一种美德哦" },
    ],
  },
  {
    scene: "🧹",
    desc: "劳动课扫地！用力过猛，垃圾桶翻车现场……",
    choices: [
      { text: "勇于承担！道歉 + 收拾，一条龙服务", effects: { laoyu: 5, deyu: 5 }, reason: "责任担当，全班为你鼓掌！" },
      { text: "三十六计走为上，假装无事发生", effects: { laoyu: -5, deyu: -5 }, reason: "跑得了今天，跑不了良心的追问" },
    ],
  },
  {
    scene: "🧽",
    desc: "课间十分钟，同学来借橡皮擦！你的橡皮还好吗？",
    choices: [
      { text: "慷慨解囊：好朋友，一起用！", effects: { deyu: 3 }, reason: "友谊的小船加满了油" },
      { text: "小气鬼模式：不行不行，我也要用！", effects: { deyu: -2 }, reason: "分享快乐，快乐才会加倍" },
    ],
  },
  {
    scene: "🐱",
    desc: "放学路上偶遇流浪小猫！眼神可怜巴巴地望着你……",
    choices: [
      { text: "爱心发射！喂点好吃的给它", effects: { deyu: 5, meiyu: 2 }, reason: "善良值 max，小猫喵喵道谢" },
      { text: "事不关己，绕道走开", effects: { deyu: -2 }, reason: "小小善意，也能温暖一个生命" },
    ],
  },
  {
    scene: "🌇",
    desc: "放学后的自由时光！你想怎么安排？",
    choices: [
      { text: "书山有路勤为径！刷题复习走起", effects: { zhili: 8 }, reason: "今天的努力是明天的底气" },
      { text: "家务小能手！帮父母分担家务", effects: { laoyu: 8 }, reason: "父母的笑容是最好的奖状" },
      { text: "艺术熏陶！看看书画画陶冶情操", effects: { meiyu: 8 }, reason: "眼里有美，生活就有光" },
      { text: "生命在于运动！挥洒汗水锻炼身体", effects: { tiyu: 8 }, reason: "跑起来，风都是甜的！" },
      { text: "葛优躺模式！游戏追剧刷手机", effects: { zhili: -2, tiyu: -2 }, reason: "一时躺平一时爽，一直躺平跟不上" },
    ],
  },
  {
    scene: "✍️",
    desc: "考试时，同桌悄悄把答案往你这边推……还使了个眼色！",
    choices: [
      { text: "轻轻推开：你自己好好想！", effects: { deyu: 5, zhili: 2 }, reason: "帮人作弊是害人，坚持原则是帮人" },
      { text: "假装没看见，心里默念与我无关", effects: { deyu: -1 }, reason: "沉默有时也是一种纵容" },
      { text: "也把自己的答案递了过去……", effects: { deyu: -6 }, reason: "诚信考试，这条底线不能破" },
    ],
  },
  {
    scene: "🧤",
    desc: "班级大扫除，老师让大家自由认领任务……",
    choices: [
      { text: "主动认领最脏的厕所和楼道", effects: { laoyu: 6, deyu: 3 }, reason: "最脏的活，最亮的担当" },
      { text: "挑个轻松的擦黑板", effects: { laoyu: 2 }, reason: "有做总比没做强" },
      { text: "趁乱溜去操场玩", effects: { laoyu: -4, deyu: -2 }, reason: "集体的活，人人有份" },
    ],
  },
  {
    scene: "🏅",
    desc: "运动会开始报名了！广播里喊着各项目还缺人……",
    choices: [
      { text: "报名 800 米，挑战自己！", effects: { tiyu: 6, deyu: 2 }, reason: "敢报就是英雄，输赢都是成长" },
      { text: "参加趣味项目，重在参与", effects: { tiyu: 3 }, reason: "快乐运动，健康第一" },
      { text: "当啦啦队，在旁边喊加油", effects: { deyu: 2, tiyu: -1 }, reason: "参与感也要一点点积累哦" },
    ],
  },
  {
    scene: "🎤",
    desc: "音乐课唱歌，你跑调跑出了新高度，同学们笑成一片……",
    choices: [
      { text: "自嘲一句“我的调调独特”，继续大方唱", effects: { meiyu: 4, deyu: 2 }, reason: "自信是最美的音色！" },
      { text: "红着脸低下头，再也不开口", effects: { meiyu: -2 }, reason: "大胆开口，才能越唱越好" },
      { text: "瞪了笑你的同学一眼", effects: { deyu: -3 }, reason: "宽容大度，才是真风度" },
    ],
  },
  {
    scene: "🔬",
    desc: "科学课做小实验！试管里的液体咕嘟咕嘟冒泡……",
    choices: [
      { text: "认真记录每一步，追问老师原理", effects: { zhili: 6, laoyu: 2 }, reason: "小小科学家，未来发明家！" },
      { text: "趁老师不注意偷偷加料", effects: { zhili: -2, laoyu: -3 }, reason: "实验安全第一条，规矩不能破" },
    ],
  },
  {
    scene: "😤",
    desc: "两个同学吵得面红耳赤，眼看就要动手！你正好在场……",
    choices: [
      { text: "上前劝架，把两人拉开讲道理", effects: { deyu: 5 }, reason: "冷静的劝架人，班级的和平鸽" },
      { text: "跑去找老师来帮忙", effects: { deyu: 3, zhili: 1 }, reason: "懂得求助，也是智慧" },
      { text: "掏出瓜子看热闹", effects: { deyu: -4 }, reason: "看热闹不嫌事大，可不行哦" },
    ],
  },
  {
    scene: "📚",
    desc: "图书馆来了一批新书！管理员老师刚摆上书架……",
    choices: [
      { text: "借一本科幻小说，看得津津有味", effects: { zhili: 5, meiyu: 2 }, reason: "书里的世界比游戏还精彩" },
      { text: "借本画画书，学点新技法", effects: { meiyu: 5 }, reason: "灵感来自每一页翻过的书" },
      { text: "路过看了一眼，还是去打游戏吧", effects: { zhili: -2 }, reason: "书山有路，别让游戏挡了路" },
    ],
  },
  {
    scene: "🍚",
    desc: "食堂排队打饭，突然有人插到你前面！",
    choices: [
      { text: "礼貌提醒：同学请排到后面哦", effects: { deyu: 4 }, reason: "勇敢说“不”，文明小卫士" },
      { text: "默默忍了，心里很不舒服", effects: { deyu: -1 }, reason: "规则需要每个人守护" },
      { text: "也学着插到别人前面", effects: { deyu: -4 }, reason: "插队是坏习惯的传染源" },
    ],
  },
  {
    scene: "☔",
    desc: "放学突然下起大雨！你看见没带伞的同学在门口发呆……",
    choices: [
      { text: "主动走过去：一起撑伞回家吧！", effects: { deyu: 5 }, reason: "一把伞撑起两个人的晴天" },
      { text: "自己撑伞快步离开", effects: { deyu: -2 }, reason: "举手之劳，温暖常在" },
    ],
  },
  {
    scene: "🔤",
    desc: "英语课默写单词！昨晚你根本没背……",
    choices: [
      { text: "默写前抓紧看两眼，能记几个是几个", effects: { zhili: 3 }, reason: "临阵磨枪，不快也光" },
      { text: "硬着头皮写，错一片也没办法", effects: { zhili: -3 }, reason: "单词要靠日积月累，不能临时抱佛脚" },
      { text: "昨晚背得很熟，默写行云流水！", effects: { zhili: 6 }, reason: "努力不会骗人，全对！" },
    ],
  },
  {
    scene: "🖼️",
    desc: "美术角的墙上，你的画被贴在最角落，还皱巴巴的……",
    choices: [
      { text: "不气馁，回家认真练，下幅画一定更好", effects: { meiyu: 5, zhili: 1 }, reason: "把失落变成进步的燃料" },
      { text: "生气地想把画撕下来", effects: { meiyu: -3, deyu: -2 }, reason: "尊重每一份作品，包括自己的" },
    ],
  },
  {
    scene: "📋",
    desc: "老师点你当小助手，帮忙收发全班作业！",
    choices: [
      { text: "认真清点，一本不落送到办公室", effects: { laoyu: 4, deyu: 3 }, reason: "靠谱的小助手，老师很放心" },
      { text: "随手一抱，路上掉了几本也没发现", effects: { laoyu: -2 }, reason: "小事见态度，细节见用心" },
    ],
  },
  {
    scene: "🪑",
    desc: "班里来了转学生，老师安排他坐你旁边。他有点紧张……",
    choices: [
      { text: "主动打招呼，带他熟悉校园", effects: { deyu: 5 }, reason: "新朋友的第一份温暖来自你" },
      { text: "点点头，各坐各的", effects: { deyu: -1 }, reason: "一个微笑，能融化很多陌生" },
    ],
  },
  {
    scene: "🏁",
    desc: "接力赛最后一棒！你握着接力棒，对面同学正飞奔而来……",
    choices: [
      { text: "稳住呼吸，稳稳接棒全力冲刺！", effects: { tiyu: 6, deyu: 2 }, reason: "拼尽全力的样子最帅！" },
      { text: "太紧张了，手一抖掉了棒……", effects: { tiyu: -3 }, reason: "别灰心，多练几次会更好" },
    ],
  },
  {
    scene: "📝",
    desc: "周末作业堆积如山：语数英三座大山……",
    choices: [
      { text: "列个计划表，一项一项消灭它们", effects: { zhili: 5, laoyu: 3 }, reason: "有计划的人，作业都怕你" },
      { text: "先玩个痛快，周日晚上疯狂赶工", effects: { zhili: -3 }, reason: "拖延一时爽，赶工火葬场" },
    ],
  },
  {
    scene: "🤝",
    desc: "同学数学没听懂，腼腆地请你帮忙讲题……",
    choices: [
      { text: "耐心讲解，讲到他真正弄懂", effects: { zhili: 4, deyu: 4 }, reason: "教别人的时候，自己也变强了" },
      { text: "把作业丢给他：自己抄吧", effects: { zhili: -2, deyu: -5 }, reason: "授人以鱼不如授人以渔" },
    ],
  },
  {
    scene: "🗳️",
    desc: "班会课竞选班干部！台下有人起哄让你上台……",
    choices: [
      { text: "大方上台，说出自己的想法", effects: { deyu: 4, zhili: 2 }, reason: "勇气是竞选最好的演讲稿" },
      { text: "摇头摆手，坚决不上台", effects: { deyu: -1 }, reason: "试试看，说不定有惊喜" },
    ],
  },
  {
    scene: "🍬",
    desc: "春游！大家把零食倒在野餐垫上分享……",
    choices: [
      { text: "把自己的零食全拿出来分给大家", effects: { deyu: 5 }, reason: "分享的快乐是双倍的快乐" },
      { text: "把零食藏好，偷偷一个人吃", effects: { deyu: -2 }, reason: "独乐乐不如众乐乐" },
    ],
  },
  {
    scene: "🖌️",
    desc: "书法课写毛笔字，墨汁弄了一手，字也歪歪扭扭……",
    choices: [
      { text: "静下心来，一笔一画慢慢练", effects: { meiyu: 5, laoyu: 2 }, reason: "字如其人，练字练心" },
      { text: "把毛笔一扔：太难了不写了", effects: { meiyu: -3 }, reason: "台上一分钟，台下十年功" },
    ],
  },
  {
    scene: "✈️",
    desc: "手工课折纸飞机！老师让大家比谁的飞得远……",
    choices: [
      { text: "研究折法，反复调试飞机造型", effects: { laoyu: 5, zhili: 2 }, reason: "动脑又动手，小小工程师" },
      { text: "随便折两下，扔出去不管了", effects: { laoyu: -2 }, reason: "认真做每件小事，都会发光" },
    ],
  },
  {
    scene: "💰",
    desc: "课间在走廊捡到十块钱！四周没有同学注意到……",
    choices: [
      { text: "交给老师，说明捡到的地方", effects: { deyu: 6 }, reason: "拾金不昧，品德满分！" },
      { text: "装进口袋，买瓶饮料压压惊", effects: { deyu: -5 }, reason: "不属于自己的东西，拿了心会不安" },
    ],
  },
  {
    scene: "🏆",
    desc: "老师当众表扬了隔壁班的同学，还让大家向他学习……",
    choices: [
      { text: "认真听讲，暗暗学习他的优点", effects: { zhili: 4, deyu: 2 }, reason: "见贤思齐，优秀会传染" },
      { text: "心里不服气：有什么了不起", effects: { deyu: -2 }, reason: "嫉妒是成长路上的绊脚石" },
    ],
  },
  {
    scene: "⚡",
    desc: "数学竞赛选拔赛，全班成绩都下来了……你的分数不高不低",
    choices: [
      { text: "主动找老师要卷子，分析错题", effects: { zhili: 6 }, reason: "错题是最好的老师" },
      { text: "把卷子塞进书包，不愿再看", effects: { zhili: -3 }, reason: "逃避解决不了任何难题" },
    ],
  },
  {
    scene: "🚶",
    desc: "放学路上，一位老爷爷拎着菜篮子想过马路，车来车往……",
    choices: [
      { text: "上前搀扶，陪他慢慢走过马路", effects: { deyu: 6 }, reason: "尊老爱幼，中华美德在你身上闪光" },
      { text: "低头假装没看见，快步走开", effects: { deyu: -2 }, reason: "小小的善举，是这个世界的光" },
    ],
  },
];

/* 休学期间的“反思提升”选项（对应原版隐藏彩蛋：休学不是白白浪费） */
const REFLECTION_CHOICES = [
  { text: "静心读几本好书，补补智力", effects: { zhili: 6 }, reason: "休学不停学，知识在积累" },
  { text: "每天坚持锻炼，把身体练壮", effects: { tiyu: 6 }, reason: "身体是革命的本钱" },
  { text: "帮家里做家务，劳动最光荣", effects: { laoyu: 6 }, reason: "动手能力突飞猛进" },
  { text: "练字画画，培养审美", effects: { meiyu: 6 }, reason: "艺术修养悄悄提升" },
  { text: "读美德故事，反省自己的言行", effects: { deyu: 6 }, reason: "知错能改，善莫大焉" },
];
