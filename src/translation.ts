/// <reference path = "header.ts" />

let Texts = {
    initText: "Made by Gordon Walkedby",
    menubutton1: "View or export your chat history",
    longtimepass: "You have not backup your steam chat log for a long time. You should do it now.",
    notice: "Warning!",
    finishedpages: "Completed pages:",
    oldestTime: "Oldest chat message time:",
    messageCount: "Messages count:",
    anerror: "Error happens.\nYou should refresh this page and restart.",
    startButton: "Click me to start export.\nOnly 14 days from now.",
    errorHead: "Error:",
    stopButton: "Click me to stop now.",
    noMessage: "No message found. Can't download.",
    readyDownload: "It is ready to download.",
    readyDownloadNotice: "It is ready to download your steam chat log!",
    filename: "steam_chat_export_",
    csv1: "Download CSV (for normal people, with UTF8BOM)",
    csv2: "Download CSV (keep original numbers,no BOM)",
    json1: "Download JSON",
    getid64Timeout: "These steamid64 can't be fetched and canceled:",
    readingID64: "Reading some steamid64 to complete,count:",
    ifreadingID64Timeout: "or auto cancel after(seconds):"
}

let htmlroot = document.children[0] as HTMLHtmlElement
let lang = htmlroot.lang
switch (lang) {
    case "zh-cn":
        Texts.initText = "作者：戈登走過去"
        Texts.menubutton1 = "查看或导出Steam聊天记录"
        Texts.longtimepass = "您已经很久没有下载和备份steam聊天记录了！及时备份可以保护账号安全。"
        Texts.notice = "注意！"
        Texts.finishedpages = "已完成页数："
        Texts.oldestTime = "目前最早的记录："
        Texts.messageCount = "共有聊天信息条数："
        Texts.anerror = "出错！建议刷新本网页，重新开始："
        Texts.startButton = "按我开始导出\n最近14天的聊天记录"
        Texts.errorHead = "出错！"
        Texts.stopButton = "点我停止！"
        Texts.noMessage = "一个消息都没有，无法导出！"
        Texts.readyDownload = "获取完成，可以下载到本地了"
        Texts.readyDownloadNotice = "已经准备好您的steam聊天记录导出文件了，您可以来这里下载了。"
        Texts.filename = "steam聊天导出_"
        Texts.csv1 = "点我下载CSV（普通人推荐，有UTF8BOM）"
        Texts.csv2 = "点我下载CSV（保留原始数字，无BOM）"
        Texts.json1 = "点我下载JSON"
        Texts.getid64Timeout = "有一些玩家的id64怎么都获取不到，超时取消："
        Texts.readingID64 = "正在读取一些玩家的ID64，个数："
        Texts.ifreadingID64Timeout = "直接跳过倒计时（秒）："
        break;
    case "ja":
        //日语提供： 0xAA55
        Texts.initText = "翻訳：0xAA55"
        Texts.menubutton1 = "チャットログを表示、書き出します"
        Texts.longtimepass = "アカウントのセキュリティーを保障するため、チャットログをバックアップするのはお勧めです。"
        Texts.notice = "ご注意"
        Texts.finishedpages = "完成されたページ数："
        Texts.oldestTime = "最古のメッセージ："
        Texts.messageCount = "メッセージ数："
        Texts.anerror = "エラーが発生しました。このページをリフレッシュするのは必要です。"
        Texts.startButton = "過去14日間のチャットログを書き出します"
        Texts.errorHead = "エラー"
        Texts.stopButton = "中止する"
        Texts.noMessage = "メッセージがないため書き出せません"
        Texts.readyDownload = "チャットログをダウンロードできます。"
        Texts.readyDownloadNotice = "チャットログをダウンロードできます。"
        Texts.filename = "Steamチャットログ書出_"
        Texts.csv1 = "CSV形式ファイルをダウンロードします（Excelと互換性があります）"
        Texts.csv2 = "CSV形式ファイルをダウンロードします（Excel以外と互換性があります）"
        Texts.json1 = "JSONファイルをダウンロードします"
        Texts.getid64Timeout = "タイムアウトで以下のプレイヤーのID64を取得できません："
        Texts.readingID64 = "プレイヤーのID64を読み込み中、読み込めた数量は："
        Texts.ifreadingID64Timeout = "タイムアウト秒数："
        break
    case "zh-tw":
        //正體中文校對： 頹廢ㄊㄨˋㄒㄧㄝˇㄇㄠ
        Texts.initText = "正體中文校對： 頹廢ㄊㄨˋㄒㄧㄝˇㄇㄠ"
        Texts.menubutton1 = "查看或導出Steam聊天記錄"
        Texts.longtimepass = "您已經很久沒有下載和備份steam聊天記錄了！及時備份可以保護賬號安全。"
        Texts.notice = "注意！"
        Texts.finishedpages = "已完成頁數："
        Texts.oldestTime = "目前最早的記錄："
        Texts.messageCount = "共有聊天信息條數："
        Texts.anerror = "出錯！建議刷新本網頁，重新開始："
        Texts.startButton = "按我開始導出\n最近14天的聊天記錄"
        Texts.errorHead = "出錯！"
        Texts.stopButton = "點我停止！"
        Texts.noMessage = "一個消息都沒有，無法導出！"
        Texts.readyDownload = "獲取完成，可以下載到電腦了"
        Texts.readyDownloadNotice = "已經準備好您的steam聊天記錄導出文档了，您可以來這裡下載了。"
        Texts.filename = "steam聊天導出_"
        Texts.csv1 = "點我下載CSV（普通人推薦，有UTF8BOM）"
        Texts.csv2 = "點我下載CSV（保留原始數字，无BOM ）"
        Texts.json1 = "點我下載JSON"
        Texts.getid64Timeout = "有一些玩家的id64怎麼都獲取不到，超時取消："
        Texts.readingID64 = "正在讀取一些玩家的ID64，個數："
        Texts.ifreadingID64Timeout = "直接跳過倒計時（秒）："
        break;
    default:
        // 不识别的语言就当成英文好了
        break;
}
