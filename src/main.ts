/// <reference path = "header.ts" />
/// <reference path = "helpers.ts" />

const logPage = "https://help.steampowered.com/zh-cn/accountdata/GetFriendMessagesLog"

let nowurl = location.href
let myid64 = GetUserID64()
let nextnotice = "nextnotice" + myid64
const timeout = 4000

function UpdateNoticeTime(adddays: number) {
    let dt = new Date()
    dt.setDate(dt.getDate() + adddays)
    GM_setValue(nextnotice, dt.getTime())
    console.log("已经设置下次提醒时间", nextnotice, dt)
}

if (nowurl.indexOf("ountdata/GetFriendMessagesLog") < 2) {
    GM_registerMenuCommand("查看或导出Steam聊天记录", function () {
        if (location.href == logPage) {
            location.reload()
        } else {
            location.href = logPage
        }
    })
    let nows = (new Date()).getTime()
    let vv: number = GM_getValue(nextnotice, 0)
    if (nows > vv) {
        GM_notification("您已经很久没有下载和备份steam聊天记录了！及时备份可以保护账号安全。", "注意！", "", function () {
            location.href = logPage
        })
        UpdateNoticeTime(1)
    }
    throw "这不是聊天记录导出页面，嘻嘻"
}

let tbodys = document.getElementsByTagName("tbody")
if (tbodys.length < 1) {
    throw "没有tbody，可能你还没有登录！"
}

let passedPages: number = 0
let oldestTime: string = ""
let outlist: Array<SteamChatMessage> = []

let outDIV = document.createElement("div")
document.body.appendChild(outDIV)
outDIV.style.position = "fixed"
outDIV.style.top = "140px"
outDIV.style.left = "10px"
outDIV.style.width = "220px"
outDIV.style.height = "300px"

let outText = document.createElement("p")
outDIV.appendChild(outText)

let readyDownload = false
let stopNow = false

let lastAppend = ""
function SetProgressText(append: string | null = null): void {
    let s = "已完成：" + passedPages.toFixed() + "页\n目前最早的记录：" + oldestTime.toLocaleString() + "\n共有聊天信息" + outlist.length.toFixed() + "条\n"
    if (append != null) {
        lastAppend = append
    }
    if (lastAppend.length > 0) { s += lastAppend }
    if (errlog.length > 0) {
        s += "\n出错！建议刷新本网页，重新开始：\n" + errlog
    }
    if (outText.innerText != s) {
        outText.innerText = s
    }
}

//新增一个按钮
function AddButton(text: string, onclick: (this: HTMLButtonElement) => void) {
    let button = document.createElement("button")
    outDIV.appendChild(button)
    button.innerText = text
    button.style.display = "block"
    button.style.padding = "5px"
    button.addEventListener("click", onclick)
}

// 移除按钮，会删除标题文字含有text的全部按钮，返回成功移除的数量
function RemoveButton(text: string): number {
    let array = outDIV.getElementsByTagName("button")
    let rm = 0
    for (let i = array.length - 1; i >= 0; i--) {
        let b = array[i]
        if (b.innerText.indexOf(text) >= 0) {
            b.remove()
            rm += 1
        }
    }
    return rm
}

AddButton("按我开始导出\n最近14天的聊天记录", function () {
    SetProgressText()
    setInterval(SetProgressText, 800)
    StartWork()
    AddButton("立刻终止！", function () {
        stopNow = true
        WaitToOver()
        this.remove()
    })
    this.remove()
})

//开始工作，首先访问zh-cn的第一页，然后会跳到loadnextpage
function StartWork(retry: number = 0) {
    if (retry > 3) {
        GetError("无法访问第一页1，重试多次皆超时：", logPage)
        return
    }
    if (retry > 0) {
        console.error("重试获取第一页111", retry)
    }
    GM_xmlhttpRequest({
        url: logPage,
        method: "GET",
        timeout: timeout,
        onload: function () {
            if (this.status == 200) {
                let jj = this.responseText
                if (jj.indexOf("<tbody>") > 10) {
                    passedPages += 1
                    let l = DealHTMLTable(jj)
                    l.forEach(function (v) {
                        outlist.push(v)
                        oldestTime = v.Time
                    })
                    let r = new RegExp("data-continuevalue=\"([0-9_]+)\"", "gim")
                    let results = r.exec(jj)
                    if (results != null) {
                        let ct = results[1]
                        LoadNextPage(ct)
                    } else {
                        GetError("请求第一页请求出错：不含 data-continuevalue ，意外！")
                    }
                } else {
                    GetError("请求第一页请求出错：不含<tbody>，可能是登录掉了！")
                }
            } else {
                GetError("请求第一页请求出错：", this.statusText)
            }
        }
        , onerror: function () {
            StartWork(retry + 1)
        }
    })
}

// 移动到下一页
function LoadNextPage(v: string, retry: number = 0) {
    if (stopNow) {
        return
    }
    if (retry > 3) {
        GetError("无法访问下一页，重试多次皆超时：", v)
        return
    }
    if (retry > 0) {
        console.error("重试获取下一页", retry, v)
    }
    GM_xmlhttpRequest({
        url: "https://help.steampowered.com/zh-cn/accountdata/AjaxLoadMoreData/?url=GetFriendMessagesLog&continue=" + v,
        method: "GET",
        timeout: timeout,
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
                if (data.continue == null) {
                    WaitToOver()
                } else {
                    v = data.continue
                    setTimeout(function () {
                        LoadNextPage(v)
                    }, 400)
                }
            } else {
                GetError("请求下一页请求出错：", v, this.statusText)
            }
        }
        , onerror: function () {
            LoadNextPage(v, retry += 1)
        }
    })
}

let SteamIDCache = new Map
let readingSteamIDs: Array<string> = []

//从待处理url数组里删除这个url
function CancelIDGet(url: string) {
    let index = readingSteamIDs.indexOf(url)
    if (index >= 0) {
        let ay = readingSteamIDs.splice(index, 1)
        if (ay.length != 1 || ay[0] != url) {
            GetError("不可思议的数组错误", url)
        }
        CancelIDGet(url)
    }
}

//根据链接获取steamid64
function GetID64ByURL(url: string, retry: number = 0): string {
    if (retry > 3) {
        CancelIDGet(url)
        GetError("无法访问steam用户主页，重试多次皆超时或出错：", url)
        return url
    }
    if (retry > 0) {
        console.error("重试", retry, url)
    }
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
        if (readingSteamIDs.indexOf(url) < 0) {
            readingSteamIDs.push(url)
        }
        GM_xmlhttpRequest({
            url: url,
            method: "GET",
            timeout: timeout,
            onload: function () {
                if (this.status == 200) {
                    reg = new RegExp("g_rgProfileData.+?\"([0-9]{17})", "gim")
                    results = reg.exec(this.responseText)
                    if (results != null) {
                        let id64 = results[1]
                        SteamIDCache.set(url, id64)
                        console.log("成功获取：", url, id64)
                        CancelIDGet(url)
                        return id64
                    } else {
                        console.error("不可思议，这个主页没有steamid64", url)
                        GetID64ByURL(url, retry + 1)
                    }
                } else {
                    GetError("无法访问steam用户主页：", url, this.statusText)
                }
            }
            , onerror: function () {
                GetID64ByURL(url, retry + 1)
            }
        })
        return url
    }
    GetError("无法获取steamid64，可能格式有误：", url)
    return url
}

function WaitToOver() {
    let startWait = (new Date).getTime()
    let canceltext = ""
    setInterval(function () {
        if (readyDownload) { return }
        if (readingSteamIDs.length < 1) {
            RemoveButton("立刻终止")
            outlist.forEach(function (k, index, aa) {
                if (k.SenderID.startsWith("http")) {
                    k.SenderID = GetID64ByURL(k.SenderID)
                }
                if (k.RecipientID.startsWith("http")) {
                    k.RecipientID = GetID64ByURL(k.RecipientID)
                }
            })
            readyDownload = true
            if (outlist.length < 1) {
                SetProgressText("一个消息都没有，无法导出！")
                return
            }
            SetProgressText("获取完成，可以下载到本地了\n" + canceltext)
            GM_notification("准备好您的steam聊天记录导出文件了，您可以来这里下载了。")
            let dt = new Date()
            let namestr = "steam聊天导出_"
            namestr += dt.getFullYear().toString() + "年" + (dt.getMonth() + 1).toString().padStart(2, "0") + "月" + (dt.getDate()).toString().padStart(2, "0") + "日"
            AddButton("点我下载CSV（普通人推荐）", function () {
                let csv = BuildCSV(outlist, true)
                let fn = namestr + ".csv"
                DownloadText(fn, csv)
                UpdateNoticeTime(7)
            })
            AddButton("点我下载CSV（纯数字的值不转为字符串）", function () {
                let csv = BuildCSV(outlist, false)
                let fn = namestr + ".csv"
                DownloadText(fn, csv)
                UpdateNoticeTime(7)
            })
            AddButton("点我下载JSON", function () {
                let j = BuildJSON(outlist)
                let fn = namestr + ".json"
                DownloadText(fn, j)
                UpdateNoticeTime(7)
            })
        }
        else {
            let n = (new Date).getTime()
            let sec = (n - startWait) / 1000
            let max = 20
            if (sec > max) {
                let s = "有一些玩家的id64怎么都获取不到，超时取消："
                readingSteamIDs.forEach(function (v) {
                    s += "\n" + v
                })
                canceltext = s
                while (readingSteamIDs.length > 0) {
                    readingSteamIDs.pop()
                }
            } else {
                SetProgressText("正在读取一些玩家的ID64，保证数据可靠性，还剩：" + readingSteamIDs.length.toFixed() + "个id，请稍等，如果还有" + (max - sec).toFixed() + "秒没有获取完成会直接跳过。")
            }
        }
    }, 300)
}