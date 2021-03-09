/// <reference path = "header.ts" />
/// <reference path = "translation.ts" />
/// <reference path = "helpers.ts" />

const logPage = "https://help.steampowered.com/accountdata/GetFriendMessagesLog"
const logPageZHCN = "https://help.steampowered.com/zh-cn/accountdata/GetFriendMessagesLog"

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
    let openPage = function () {
        GM_openInTab(logPage, { active: true, insert: true })
    }
    GM_registerMenuCommand(Texts.menubutton1, function () {
        openPage()
    })
    let nows = (new Date()).getTime()
    let vv: number = GM_getValue(nextnotice, 0)
    if (nows > vv) {
        GM_notification(Texts.longtimepass, Texts.notice, "", function () {
            openPage()
        })
        UpdateNoticeTime(1)
    }
    throw "这不是聊天记录导出页面，脚本退出"
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
outText.innerText = Texts.initText

let readyDownload = false
let stopNow = false

let lastAppend = ""
function SetProgressText(append: string | null = null): void {
    let s = Texts.finishedpages + passedPages.toFixed() + "\n" + Texts.oldestTime + oldestTime.toLocaleString() + "\n" + Texts.messageCount + outlist.length.toFixed() + "\n"
    if (append != null) {
        lastAppend = append
    }
    if (lastAppend.length > 0) { s += lastAppend }
    if (errlog.length > 0) {
        s += "\n" + Texts.anerror + "\n" + errlog
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

AddButton(Texts.startButton, function () {
    SetProgressText()
    setInterval(SetProgressText, 800)
    StartWork()
    AddButton(Texts.stopButton, function () {
        stopNow = true
        WaitToOver()
        this.remove()
    })
    this.remove()
})

//开始工作，首先访问zh-cn的第一页，然后会跳到loadnextpage
function StartWork(retry: number = 0) {
    if (retry > 3) {
        GetError("无法访问第一页，重试多次皆超时：")
        return
    }
    if (retry > 0) {
        console.error("重试获取第一页", retry)
    }
    GM_xmlhttpRequest({
        url: logPageZHCN,
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
                        WaitToOver()
                    }
                } else {
                    GetError("请求第一页请求：不含<tbody>，可能是登录掉了！")
                }
            } else {
                GetError("请求第一页请求：", this.statusText)
            }
        }
        , onerror: function () {
            GetError("请求第一页请求：出错！")
            StartWork(retry + 1)
        }
        , ontimeout: function () {
            GetError("请求第一页请求：超时！")
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
                LoadNextPage(v, retry += 1)
            }
        }
        , onerror: function () {
            GetError("HTTP 出错：页面：", v)
            LoadNextPage(v, retry += 1)
        }
        , ontimeout: function () {
            GetError("超时：页面：", v)
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
                    }
                }
                GetID64ByURL(url, retry + 1)
            }
            , onerror: function () {
                console.error("请求ID信息出错：", url)
                GetID64ByURL(url, retry + 1)
            }
            , ontimeout: function () {
                console.error("请求ID信息超时：", url)
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
            RemoveButton(Texts.stopButton)
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
                SetProgressText(Texts.noMessage)
                return
            }
            SetProgressText(Texts.readyDownload + "\n" + canceltext)
            GM_notification(Texts.readyDownloadNotice)
            let dt = new Date()
            let namestr = Texts.filename
            namestr += dt.getFullYear().toString() + "_" + (dt.getMonth() + 1).toString().padStart(2, "0") + "_" + (dt.getDate()).toString().padStart(2, "0")
            AddButton(Texts.csv1, function () {
                let csv = BuildCSV(outlist, true)
                let fn = namestr + ".csv"
                DownloadText(fn, csv, true)
                UpdateNoticeTime(7)
            })
            AddButton(Texts.csv2, function () {
                let csv = BuildCSV(outlist, false)
                let fn = namestr + ".csv"
                DownloadText(fn, csv, true)
                UpdateNoticeTime(7)
            })
            AddButton(Texts.json1, function () {
                let j = BuildJSON(outlist)
                let fn = namestr + ".json"
                DownloadText(fn, j, false)
                UpdateNoticeTime(7)
            })
        }
        else {
            let n = (new Date).getTime()
            let sec = (n - startWait) / 1000
            let max = 20
            if (sec > max) {
                let s = Texts.getid64Timeout
                readingSteamIDs.forEach(function (v) {
                    s += "\n" + v
                })
                canceltext = s
                while (readingSteamIDs.length > 0) {
                    readingSteamIDs.pop()
                }
            } else {
                SetProgressText(Texts.readingID64 + readingSteamIDs.length.toFixed() + "\n" + Texts.ifreadingID64Timeout + (max - sec).toFixed())
            }
        }
    }, 300)
}
