/// <reference path = "header.ts" />

let Texts = {
    menubutton1: "查看或导出Steam聊天记录",
    longtimepass: "您已经很久没有下载和备份steam聊天记录了！及时备份可以保护账号安全。",
    notice: "注意！",
    finishedpages: "已完成页数：",
    oldestTime: "目前最早的记录：",
    messageCount: "共有聊天信息条数：",
    anerror: "出错！建议刷新本网页，重新开始：",
    startButton: "按我开始导出\n最近14天的聊天记录",
    errorHead: "出错！",
    stopButton: "点我停止继续！",
    noMessage: "一个消息都没有，无法导出！",
    readyDownload: "获取完成，可以下载到本地了",
    readyDownloadNotice: "已经准备好您的steam聊天记录导出文件了，您可以来这里下载了。",
    filename: "steam聊天导出_",
    csv1: "点我下载CSV（普通人推荐）",
    csv2: "点我下载CSV（纯数字的值不转为字符串）",
    json1: "点我下载JSON",
    getid64Timeout: "有一些玩家的id64怎么都获取不到，超时取消：",
    readingID64: "正在读取一些玩家的ID64，个数：",
    ifreadingID64Timeout: "直接跳过倒计时（秒）："
}

let htmlroot = document.children[0] as HTMLHtmlElement
let lang = htmlroot.lang
switch (lang) {
    case "zh-cn":
        break;
    case "zh-tw":
        //我先不管繁体中文了
        break;
    default:
        // 不识别的语言就当成英文好了
        Texts.menubutton1 = "View or export your chat history"
        Texts.longtimepass = "You have not backup your steam chat log for a long time. You should do it now."
        Texts.notice = "Warning!"
        Texts.finishedpages = "Completed pages:"
        Texts.oldestTime = "Oldest chat message time:"
        Texts.messageCount = "Messages count:"
        Texts.anerror = "Error happens.\nYou should refresh this page and restart."
        Texts.startButton = "Click me to start export.\nOnly 14 days from now."
        Texts.errorHead = "Error:"
        Texts.stopButton = "Click me to stop now."
        Texts.noMessage = "No message found. Can't download."
        Texts.readyDownload = "It is ready to download."
        Texts.readyDownloadNotice = "It is ready to download your steam chat log!"
        Texts.filename = "steam_chat_export_"
        Texts.csv1 = "Download CSV (for normal people)"
        Texts.csv2 = "Download CSV (keep original numbers)"
        Texts.json1 = "Download JSON"
        Texts.getid64Timeout = "These steamid64 can't be fetched and canceled:"
        Texts.readingID64 = "Reading some steamid64 to complete,count:"
        Texts.ifreadingID64Timeout = "or auto cancel after(seconds):"
        break;
}
