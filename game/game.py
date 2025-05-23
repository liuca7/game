import random

# 玩家初始属性
wanjia_shuxing = {"deyu": 60, "zhili": 60, "tiyu": 60, "meiyu": 60, "laoyu": 60}
# 属性中文名
shuxing_mingcheng_zhongwen = {"deyu": "德育", "zhili": "智力", "tiyu": "体育", "meiyu": "美育", "laoyu": "劳育", "shejiao": "社交"}
# 属性变化理由
shuxing_bianhua_liyou = {
    "deyu": {"positive": ["Wow！品德值UP！", "乐于助人，赞！", "善良值max！", "品德+10086！", "诚信是金！"], "negative": ["哎呀，品德滑坡啦！", "这样做...不太nice哦！", "尊重他人是基本操作！", "不诚实？小心变成匹诺曹哦！", "坏习惯是小恶魔！"]},
    "zhili": {"positive": ["智力biu的一下提升！", "思考使你更强大！", "知识就是力量！", "智慧+Max！", "学海无涯苦作舟，但知识的浪花会奖励你！"], "negative": ["智力值告急！", "不动脑筋会生锈哦！", "学习要认真对待！", "偷懒一时爽，一直偷懒...就跟不上啦！", "知识积累就像盖房子，地基要打牢！"]},
    "tiyu": {"positive": ["体育精神爆发！", "生命在于运动！", "坚持锻炼，棒棒哒！", "拥有健康体魄！", "运动使人年轻！"], "negative": ["体力透支警告！", "要加强锻炼哦！", "懒癌晚期？动起来！", "健康是最大的财富！", "忽视体育锻炼？小心变成豆芽菜！"]},
    "meiyu": {"positive": ["艺术细胞觉醒！", "发现美的眼睛！", "艺术修养up！", "感受美的力量！", "艺术点亮生活！"], "negative": ["审美能力遭遇瓶颈？", "用心感受美！", "艺术修养不可或缺！", "生活需要仪式感，更需要美感！", "缺乏艺术情趣？生活会变得索然无味哦！"]},
    "laoyu": {"positive": ["劳动技能get！", "自己的事情自己做！", "热爱劳动是光荣的！", "动手能力max！", "劳动最光荣！"], "negative": ["劳动技能有待提高！", "不能偷懒哦！", "积极参与劳动！", "缺乏劳动能力？", "劳动最光荣！"]},
    "shejiao": {"positive": ["社交达人！", "乐于助人，人见人爱花见花开！", "团结友爱！", "友谊的小船扬帆起航！", "善于社交，快乐加倍！"], "negative": ["社交技能冷却中...需要充电啦！", "人际关系需要维护！", "多关心同学！", "孤僻是隐藏boss！", "良好人际关系是通关秘籍！"]}
}
# 随机事件列表
suiji_shijian_liebiao = [
    {"miaoshu": "语文课，老师点你回答问题！大脑空白...", "xuanxiang": [{"wenben": "A. 坦白从宽，下次努力背书！", "yingxiang": {"deyu": 5, "zhili": 0}}, {"wenben": "B.  支支吾吾，试图蒙混过关？", "yingxiang": {"deyu": -3, "zhili": 0}}]},
    {"miaoshu": "数学课，遇到拦路虎！一道难题...", "xuanxiang": [{"wenben": "A.  举手投降，请教老师大神！", "yingxiang": {"zhili": 5, "laoyu": 0}}, {"wenben": "B.  眼神求助同桌...想抄作业？", "yingxiang": {"zhili": -2, "deyu": -2}}]},
    {"miaoshu": "体育课自由奔跑！一不小心...脚下打滑！", "xuanxiang": [{"wenben": "A.  男子汉/女汉子！拍拍灰尘继续冲！", "yingxiang": {"tiyu": 5, "deyu": 3}}, {"wenben": "B.  哎呦喂，摔疼了！坐在地上求安慰？", "yingxiang": {"tiyu": -3, "deyu": -2}}]},
    {"miaoshu": "美术课挥洒颜料！一不留神...校服遭殃！", "xuanxiang": [{"wenben": "A.  亡羊补牢，赶紧抢救一下！", "yingxiang": {"meiyu": 3, "laoyu": 5}}, {"wenben": "B.  破罐破摔，算了，就这样吧！", "yingxiang": {"meiyu": -2, "laoyu": -3}}]},
    {"miaoshu": "劳动课扫地！用力过猛...垃圾桶翻车现场！", "xuanxiang": [{"wenben": "A.  勇于承担！道歉+收拾，一条龙服务！", "yingxiang": {"laoyu": 5, "deyu": 5}}, {"wenben": "B.  三十六计，走为上计！假装无事发生？", "yingxiang": {"laoyu": -5, "deyu": -5}}]},
    {"miaoshu": "课间十分钟，同学来借橡皮擦！你的橡皮...还好吗？", "xuanxiang": [{"wenben": "A.  慷慨解囊！好朋友，一起用！", "yingxiang": {"deyu": 3, "shejiao": 2}}, {"wenben": "B.  小气鬼模式开启！不行不行，我也要用！", "yingxiang": {"deyu": -2, "shejiao": -1}}]},
    {"miaoshu": "放学路上，偶遇流浪小猫！眼神可怜巴巴...", "xuanxiang": [{"wenben": "A.  爱心发射！喂点好吃的吧！", "yingxiang": {"deyu": 5, "meiyu": 2}}, {"wenben": "B.  事不关己，高高挂起？绕道走开！", "yingxiang": {"deyu": -2, "meiyu": 0}}]},
    {"miaoshu": "放学后的自由时光！你想...", "xuanxiang": [{"wenben": "A.  书山有路勤为径！刷题复习走起！", "yingxiang": {"zhili": 8}}, {"wenben": "B.  家务小能手！帮父母分担家务！", "yingxiang": {"laoyu": 8}}, {"wenben": "C.  艺术熏陶！看看书画画陶冶情操！", "yingxiang": {"meiyu": 8}}, {"wenben": "D.  生命在于运动！挥洒汗水锻炼身体！", "yingxiang": {"tiyu": 8}}, {"wenben": "E.  葛优躺模式！游戏追剧刷手机！", "yingxiang": {}}]},
    {"miaoshu": "语文课，老师点你回答问题！大脑空白...", "xuanxiang": [{"wenben": "A. 坦白从宽，下次努力背书！", "yingxiang": {"deyu": 5, "zhili": 0}}, {"wenben": "B.  支支吾吾，试图蒙混过关？", "yingxiang": {"deyu": -3, "zhili": 0}}]},
]

def xianshi_shuxing(): # 显示玩家属性
    print("\n--- 能力雷达扫描 ---")
    for shuxing, zhi in wanjia_shuxing.items():
        zhongwen_shuxing_ming = shuxing_mingcheng_zhongwen.get(shuxing, shuxing)
        print(f"{zhongwen_shuxing_ming}: {zhi}  点")

def xianshi_shijian(shijian): # 显示事件内容
    print("\n--- 奇遇事件  ---")
    print(shijian["miaoshu"])
    print("  * 你的抉择是？ *")
    for i, xuanxiang in enumerate(shijian["xuanxiang"]):
        print(f"{chr(ord('A') + i)}. {xuanxiang['wenben'][3:]}") # 直接切片，更简洁

def huoqu_xuanze(shijian): # 获取玩家选择
    while True:
        xuanze_str = input("请选择你的答案 (A/B/C...)：").upper()
        xuanze_index = ord(xuanze_str) - ord('A')
        if 0 <= xuanze_index < len(shijian["xuanxiang"]):
            return shijian["xuanxiang"][xuanze_index]
        else:
            print("无效指令！请重新输入正确的选项字母哦！")

def yingyong_yingxiang(xuanze): # 应用选项影响
    yingxiang = xuanze["yingxiang"]
    print("\n--- 命运齿轮转动... 属性变化播报 ---")
    for shuxing, zhi_bianhua in yingxiang.items():
        if shuxing in wanjia_shuxing:
            wanjia_shuxing[shuxing] += zhi_bianhua
            wanjia_shuxing[shuxing] = max(0, wanjia_shuxing[shuxing]) # 属性不低于0
            if zhi_bianhua != 0:
                bianhua_fuhao = "+" if zhi_bianhua > 0 else ""
                zhongwen_shuxing_ming = shuxing_mingcheng_zhongwen.get(shuxing, shuxing)
                liyou_leixing = "positive" if zhi_bianhua > 0 else "negative"
                liyou_xuanze = random.choice(shuxing_bianhua_liyou[shuxing][liyou_leixing]) if shuxing in shuxing_bianhua_liyou else "理由暂缺"
                print(f"{zhongwen_shuxing_ming}: {bianhua_fuhao}{zhi_bianhua}  点！ {liyou_xuanze}")
        # else:  # 删除此 else 分支，因为神秘属性不影响核心流程，且不报错即可
        #     print(f"注意：神秘力量 '{shuxing}' 悄然影响了你...但它似乎不在能力雷达的扫描范围内。")

def jiesuan_chengji(): # 结算学期成绩
    zong_pingfen = sum(wanjia_shuxing.values())
    print("\n--- 学期成绩单 ---")
    xianshi_shuxing()
    print(f"\n学期总评：{zong_pingfen} 点")
    if zong_pingfen >= 450:
        print("评语： 🌟🌟🌟🌟🌟 完美学霸！五星好评！毕业证直接保送！")
    elif zong_pingfen >= 400:
        print("评语： 🌟🌟🌟🌟  优秀！各科均衡发展，前途无量！")
    elif zong_pingfen >= 350:
        print("评语： 🌟🌟🌟  良好！稳扎稳打，继续努力更上一层楼！")
    elif zong_pingfen >= 200:
        print("评语： 🌟🌟🌟  良好！稳扎稳打，继续努力更上一层楼！")
    else:
        print("评语： 🌟🌟  革命尚未成功，同志仍需努力！加油冲鸭！")

# --- 游戏开始 ---
print(" 🚀 欢迎勇闯【我的奇葩一学期】！🚀 ")
print(" 准备好了吗？你的学期冒险之旅即将开始！ ")

dangqian_zhou = 1 # 当前周
dangqian_xingqi = 1 # 当前星期
xiuxue_cishu = 0 # 休学次数
shifou_xiuxue_zhong = False # 是否休学中
xiuxue_剩余天数 = 0 # 休学剩余天数
meizhou_tianshu = 5 # 每周上课天数
xueqi_zhou = 18 # 学期总周数

for tian_shu in range(1, xueqi_zhou * meizhou_tianshu + 1): # 主循环：天
    if shifou_xiuxue_zhong: # 休学中
        xiuxue_剩余天数 -= 1
        if xiuxue_剩余天数 <= 0:
            shifou_xiuxue_zhong = False
            print("\n休学结束！重返校园，继续你的学期冒险吧！")
        else:
            print(f"\n=====  第 {dangqian_zhou} 周 星期{dangqian_xingqi}  [休学反省中...]  ======")
            dangqian_xingqi += 1
            if dangqian_xingqi > meizhou_tianshu:
                dangqian_zhou += 1
                dangqian_xingqi = 1
            if dangqian_zhou > xueqi_zhou:
                break
            continue # 跳过事件

    else: # 正常上课日
        print(f"\n=====  [Day {tian_shu}]  第 {dangqian_zhou} 周 星期{dangqian_xingqi}  今日运势：未知  ======")
        shijian = random.choice(suiji_shijian_liebiao)
        xianshi_shijian(shijian)
        xuanze = huoqu_xuanze(shijian)
        yingyong_yingxiang(xuanze)
        xianshi_shuxing()

        # 检查属性，触发休学
        for shuxing, zhi in wanjia_shuxing.items():
            if zhi < 30:
                xiuxue_cishu += 1
                shifou_xiuxue_zhong = True
                xiuxue_剩余天数 = 5
                print(f"\n---  🚨 红色警报！ 🚨 ---")
                print(f"你的【{shuxing_mingcheng_zhongwen[shuxing]}】属性亮起红灯（{zhi}点）！")
                print(f"  * 紧急通知：*  已被【叫家长+勒令休学】一周！")
                print(f"  [累计休学 {xiuxue_cishu} 次]")
                if xiuxue_cishu >= 3:
                    print("\n---  💥  终极警告！ 开除倒计时开始！ 💥  ---")
                    print("  [累计休学已达三次！]  恭喜你达成【光荣开除】成就！🎉")
                    jiesuan_chengji()
                    print("\n 💔  Game Over！你的学期冒险提前结束！感谢参与！ 💔 ")
                    exit()
                break # 触发休学后跳出

        dangqian_xingqi += 1 # 统一在这里更新日期，更清晰
        if dangqian_xingqi > meizhou_tianshu:
            dangqian_zhou += 1
            dangqian_xingqi = 1
        if dangqian_zhou > xueqi_zhou:
            break

if not shifou_xiuxue_zhong: # 正常学期结束结算
    jiesuan_chengji()
    print("\n 🎊  恭喜你！【我的奇葩一学期】冒险之旅圆满落幕！ 🎊 ")
    print(" 感谢你的体验！期待下个学期再见！ 😉 ")
