/// <reference path = "header.ts" />
/// <reference path = "api.ts" />

const logPage = "https://help.steampowered.com/zh-cn/accountdata/GetFriendMessagesLog"

GM_registerMenuCommand("查看或导出Steam聊天记录", function () {
    if (location.href == logPage) {
        location.reload()
    } else {
        location.href = logPage
    }
})

let nowurl = location.href
let myid64 = GetUserID64()
let nextnotice = "nextnotice" + myid64
if (nowurl.indexOf("ountdata/GetFriendMessagesLog") < 2) {
    let nows = (new Date()).getTime()
    let vv: number = GM_getValue(nextnotice, 0)
    if (nows > vv) {
        GM_notification("您已经很久没有下载和备份steam聊天记录了！及时备份可以保护账号安全。", "注意！", "", function () {
            location.href = logPage
        })
        let dt = new Date()
        dt.setDate(dt.getDate() + 1)
        GM_setValue(nextnotice, dt.getTime())
    }
    throw "这不是聊天记录导出页面，嘻嘻"
}

let tbodys = document.getElementsByTagName("tbody")
if (tbodys.length < 1) {
    throw "没有tbody，可能你还没有登录！"
}

let passedPages: number = 0
let oldestTime: string = ""
let nextPage: string = ""
let outlist: Array<SteamChatMessage> = []

let button = document.createElement("button")
document.body.appendChild(button)
button.innerText = "按我开始导出\n最近14天的聊天记录"
button.style.position = "fixed"
button.style.left = "10px"
button.style.top = "100px"
button.style.width = "220px"

let outText = document.createElement("p")
document.body.appendChild(outText)
outText.style.position = "fixed"
outText.style.top = "140px"
outText.style.left = "10px"
outText.style.width = "220px"
outText.style.height = "300px"

let readyDownload = false
let errors = ""

function SetProgressText(append: string = ""): void {
    let s = "已完成：" + passedPages.toFixed() + "页\n目前最早的记录：" + oldestTime.toLocaleString() + "\n共有聊天信息" + outlist.length.toFixed() + "条\n"
    s += append
    if (errors.length > 0) {
        s += "\n出现以下错误，建议刷新本网页，重新开始：\n" + errors
    }
    outText.innerText = s
}

button.addEventListener("click", function () {
    if (!readyDownload) {
        this.style.display = "none"
        let tbody = tbodys[0]
        DealHTMLTable(tbody.innerHTML).forEach(function (v, ii, ar) {
            outlist.push(v)
        })
        passedPages = 1
        let ob = document.getElementsByClassName("AccountDataLoadMore")[0]
        nextPage = ob.getAttribute("data-continuevalue") || ""
        StartLoadLoop()
    } else {
        let csv = BuildCSV(outlist)
        let dt = new Date()
        let f = (dt.getTime() / 1000).toFixed() + ".csv"
        DownloadText(f, csv)
        dt.setDate(dt.getDate() + 7)
        GM_setValue(nextnotice, dt.getTime())
    }
})

// 移动到下一页
function StartLoadLoop() {
    let v = nextPage
    if (v.length < 5) {
        throw "continue值不对！" + v
    }
    GM_xmlhttpRequest({
        url: "https://help.steampowered.com/zh-cn/accountdata/AjaxLoadMoreData/?url=GetFriendMessagesLog&continue=" + v,
        method: "GET",
        timeout: 8000,
        onload: function () {
            if (this.status == 200) {
                let jj = this.responseText
                let data: SteamChatLogDataJSON = JSON.parse(jj)
                let l = DealHTMLTable(data.html)
                l.forEach(function (v, i, aa) {
                    outlist.push(v)
                    oldestTime = v.Time
                })
                passedPages += 1
                SetProgressText()
                if (data.continue == null) {
                    WaitToOver()
                } else {
                    nextPage = data.continue
                    setTimeout(function () {
                        StartLoadLoop()
                    }, 400)
                }
            } else {
                console.error("出错：", this.statusText)
                errors += "请求出错：" + this.statusText + "\n"
            }
        }
        , onerror: function () {
            console.error("出错：", this.error)
            errors += "请求出错：" + this.error + "\n"
            SetProgressText()
        }
    })
}

let SteamIDCache = new Map
let readingSteamIDs: Array<string> = []

//根据链接获取steamid64
function GetID64ByURL(url: string): string {
    if (SteamIDCache.has(url)) {
        return SteamIDCache.get(url) as string
    }
    if (readingSteamIDs.indexOf(url) > -1) {
        return url
    }
    let reg = new RegExp("/profiles/([0-9]{17})", "gim")
    let results = reg.exec(url)
    if (results != null) {
        let id64 = results[1]
        SteamIDCache.set(url, id64)
        return id64
    }
    if (url.indexOf("/id/") > 5) {
        readingSteamIDs.push(url)
        GM_xmlhttpRequest({
            url: url,
            method: "GET",
            timeout: 5000,
            onload: function () {
                let ay = readingSteamIDs.splice(readingSteamIDs.indexOf(url), 1)
                if (ay.length != 1 || ay[0] != url) {
                    console.error("不可思议的错误002")
                }
                if (this.status == 200) {
                    reg = new RegExp("g_rgProfileData.+?\"([0-9]{17})", "gim")
                    results = reg.exec(this.responseText)
                    if (results != null) {
                        let id64 = results[1]
                        SteamIDCache.set(url, id64)
                        console.log("成功获取：", url, id64)
                        return id64
                    } else {
                        console.error("steam用户主页不包含id64信息！ " + url)
                        errors += "steam用户主页不包含id64信息！" + url + "\n"
                    }
                } else {
                    console.error("无法访问steam用户主页： " + url)
                    errors += "无法访问steam用户主页：" + url + "\n"
                }
            }
            , onerror: function () {
                console.error("出错：", this.error)
                errors += "请求出错：" + this.error + "\n"
                SetProgressText()
            }
        })
        return url
    }
    console.error("无法获取steamid64： " + url)
    errors += "无法获取steamid64：" + url + "\n"
    return url
}

function WaitToOver() {
    setInterval(function () {
        if (readyDownload) { return }
        if (readingSteamIDs.length < 1) {
            outlist.forEach(function (k, index, aa) {
                if (k.SenderID.startsWith("http")) {
                    k.SenderID = GetID64ByURL(k.SenderID)
                }
                if (k.RecipientID.startsWith("http")) {
                    k.RecipientID = GetID64ByURL(k.RecipientID)
                }
            })
            readyDownload = true
            SetProgressText("获取完成，可以下载到本地了")
            button.innerText = "点我下载CSV"
            button.style.display = "inline-block"
            GM_notification("准备好您的steam聊天记录导出文件了，您可以来这里下载了。")
        }
        else {
            SetProgressText("正在读取一些玩家的ID64，保证数据可靠性，还剩：" + readingSteamIDs.length.toFixed())
        }
    }, 300)
}