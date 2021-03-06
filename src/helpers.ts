/// <reference path = "header.ts" />
/// <reference path = "translation.ts" />

let errlog = ""
function GetError(...data: any[]): void {
    if (data.length > 0) {
        console.error(data)
        let line = Texts.errorHead
        data.forEach(function (v) {
            line += " "
            let s: string
            if (v == null) {
                s = "null"
            } else {
                s = v.toString()
            }
            line += s
        })
        errlog += line + "\n"
    }
}

// 获取当前steam用户id64
function GetUserID64(): string {
    let es = document.getElementsByClassName("mainmenu_contents")
    if (es.length < 1) {
        throw "cannot find mainmenu_contents"
    }
    let div = es.item(0) as HTMLDivElement
    es = div.getElementsByTagName("a")
    for (let i = 0; i < es.length; i++) {
        let ah = es.item(i) as HTMLAnchorElement
        let attr = ah.getAttributeNode("data-miniprofile")
        if (attr != null) {
            let s = attr.value
            if (s.length > 0) {
                return s
            }
        }
    }
    throw "cannot find data-miniprofile"
}

let usedSeconds = new Map
let usedMS = new Map

// 解析Chinese 字符串 2021年1月28日下午1:13 CST
function ParseChineseDateFormat(s: string): Date {
    let dt = new Date(1999, 0, 1)
    if (s.length < 10) {
        return dt
    }
    let r = new RegExp("([0-9]+)年([0-9]+)月([0-9]+)日([上下])午([0-9]+):([0-9]+)", "gim")
    let results = r.exec(s)
    if (results == null) {
        return dt
    }
    let yyyy = parseInt(results[1])
    let mm = parseInt(results[2]) - 1
    let dd = parseInt(results[3])
    let morning = results[4] == "上"
    let hour = parseInt(results[5])
    let min = parseInt(results[6])
    if (morning && hour == 12) {    //12:01AM就是 00:01
        hour = 0
    } else if (!morning && hour < 12) { //12:01 PM 就是 12:01 ，1:01 PM 就是 13:01
        hour += 12
    }
    dt = new Date(yyyy, mm, dd, hour, min, 0)
    let kk = dt.getTime().toFixed()
    // 由于steam返回的文本里面不包含秒数，为了让数据在排序的时候更加可靠，采用了秒数逐渐-1的策略，第一条数据会是这一分钟的59秒，然后是58，直到0秒
    // 缺点：可能会有多条消息都是0秒
    let v: number = 59
    let ms = 999
    if (usedSeconds.has(kk)) {
        v = usedSeconds.get(kk)
        if (v > 0) {
            v -= 1
        } else {
            if (usedMS.has(kk)) {
                ms = usedMS.get(kk)
                if (ms > 0) {
                    ms -= 1
                }
            }
            usedMS.set(kk, ms)
        }
    }
    usedSeconds.set(kk, v)
    dt.setSeconds(v, ms)
    return dt
}

//处理html数据
function DealHTMLTable(html: string): SteamChatMessage[] {
    html = html.replace(/"/gim, "'")
    let reg = new RegExp("<tr><td><a target='_blank'.+?</td></tr>", "gim")
    let array = html.match(reg)
    let outs: Array<SteamChatMessage> = []
    if (array != null) {
        array.forEach(function (v, i, aa) {
            reg = new RegExp("<td><a target='_blank' href='(.+?)'>(.+?)</a></td><td><a target='_blank' href='(.+?)'>(.+?)</a></td><td>(.+?)</td><td>(.+?)</td>", "gim")
            let results = reg.exec(v)
            if (results != null) {
                let ss = HTMLDecode(results[5])
                let dt = ParseChineseDateFormat(ss)
                if (dt.getFullYear() < 2000) {
                    GetError("这个日期无法转换： " + ss)
                    return
                }
                let m: SteamChatMessage = {
                    SenderID: GetID64ByURL(results[1]),
                    Sender: HTMLDecode(results[2]),
                    RecipientID: GetID64ByURL(results[3]),
                    Recipient: HTMLDecode(results[4]),
                    Time: dt.toLocaleString(),
                    UTCTime: dt.getTime(),
                    Message: ChangeCRLF(HTMLDecode(results[6]), " ")
                }
                outs.push(m)
            } else {
                GetError("html 无法寻找对应值 " + v)
            }
        })
    } else {
        GetError("html无法符合记录！")
    }
    return outs
}

// html解码
function HTMLDecode(html: string): string {
    let m = document.createElement("div")
    m.innerHTML = html
    let s = m.innerText
    return s
}

// 标准化 CRLF
function ChangeCRLF(t: string, replaceto: string): string {
    t = t.replace(/\r\n/gim, "\n").replace(/\r/gim, "\n").replace(/\n/gim, replaceto)
    return t
}

// 把字符串引号引起来，如果字符串整个是一个数字，就在前面加一个'
function Quote(t: string, num2str: boolean): string {
    if (t.length > 0) {
        t = t.replace(/\"/gim, "\\\"")
        if (num2str) {
            let r = new RegExp("^[0-9\.]+$", "gim")
            if (r.test(t)) {
                t = "'" + t
            }
        }
    }
    t = "\"" + t + "\""
    return t
}

function ConvertSteamChatMessageToMap(v: SteamChatMessage): Map<string, string | number> {
    let mm = new Map<string, string | number>()
    mm.set("SenderID", v.SenderID)
    mm.set("Sender", v.Sender)
    mm.set("RecipientID", v.RecipientID)
    mm.set("Recipient", v.Recipient)
    mm.set("Time", v.Time)
    mm.set("UTCTime", v.UTCTime)
    mm.set("Message", v.Message)
    return mm
}

function GetMapKeys(m: Map<any, any>): string[] {
    let keys: string[] = []
    m.forEach(function (v, k, m) {
        if (k == null) {
            return
        }
        keys.push(k as string)
    })
    return keys
}

//构造steam聊天记录的CSV文件
function BuildCSV(msg: SteamChatMessage[], num2str: boolean): string {
    if (msg.length < 1) {
        return ""
    }
    let o = ""
    let first = msg[0]
    let map1 = ConvertSteamChatMessageToMap(first)
    let keys = GetMapKeys(map1)
    keys.forEach(function (kk) {
        if (o.length > 1) {
            o += ","
        }
        o += kk
    })
    msg.forEach(function (v) {
        o += "\n"
        let map2 = ConvertSteamChatMessageToMap(v)
        let str = ""
        let dt = new Date
        let z = "0"
        dt.setTime(map2.get("UTCTime") as number)
        str = dt.getFullYear().toString().padStart(4, z) + "/" + (dt.getMonth() + 1).toString().padStart(2, z) + "/"
        str += dt.getDate().toString().padStart(2, z) + " " + (dt.getHours()).toString().padStart(2, z) + ":"
        str += (dt.getMinutes()).toString().padStart(2, z) + ":" + (dt.getSeconds)().toString().padStart(2, z)
        map2.set("Time", str)
        let line = ""
        keys.forEach(function (kk) {
            if (line.length > 2) {
                line += ","
            }
            let v2 = map2.get(kk)
            if (v2 == null) {
                v2 = "null"
            }
            str = v2.toString()
            line += Quote(str, num2str)
        })
        o += line
    })
    return o
}

//构造steam聊天记录的JSON文件
function BuildJSON(msg: SteamChatMessage[]): string {
    let j = JSON.stringify(msg)
    return j
}

// 下载一个文本文件
function DownloadText(filename: string, content: string, bom: boolean) {
    var c = document.createElement('a')
    let s = 'data:text/plain;charset=utf-8,'
    if (bom) {
        s += "%ef%bb%bf"
    }
    s += encodeURIComponent(content)
    c.href = s
    c.download = filename
    c.style.display = 'none'
    document.body.appendChild(c)
    c.click()
    c.remove()
}
