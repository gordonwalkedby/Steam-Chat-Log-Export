/// <reference path = "header.ts" />

// 获取当前steam用户id64
function GetUserID64(): string {
    let s = document.cookie
    let r = new RegExp("steamRememberLogin=([0-9]{17})")
    let results = r.exec(s)
    if (results == null) {
        throw "没有登录steam！"
    }
    return results[1]
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
                let m: SteamChatMessage = {
                    SenderID: GetID64ByURL(results[1]),
                    Sender: HTMLDecode(results[2]),
                    RecipientID: GetID64ByURL(results[3]),
                    Recipient: HTMLDecode(results[4]),
                    Time: HTMLDecode(results[5]),
                    Message: ChangeCRLF(HTMLDecode(results[6]), " ")
                }
                outs.push(m)
            } else {
                console.error("html 无法寻找对应值 " + v)
            }
        })
    } else {
        console.error("html无法符合记录 " + html)
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
function Quote(t: string): string {
    if (t.length > 0) {
        t = t.replace(/\"/gim, "\\\"")
        let r = new RegExp("^[0-9\.]+$", "gim")
        if (r.test(t)) {
            t = "'" + t
        }
    }
    t = "\"" + t + "\""
    return t
}

//构造steam聊天记录的CSV文件
function BuildCSV(msg: SteamChatMessage[]): string {
    let o = "发送者ID,发送者,接收者ID,接收者,时间,信息\n"
    msg.forEach(function (v) {
        let array = [v.SenderID, v.Sender, v.RecipientID, v.Recipient, v.Time, v.Message]
        let line = ""
        array.forEach(function (v2) {
            if (line.length > 2) {
                line += ","
            }
            line += Quote(v2)
        })
        o += line + "\n"
    })
    return o
}

// 下载一个文本文件
function DownloadText(filename: string, content: string) {
    var c = document.createElement('a')
    c.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    c.download = filename
    c.style.display = 'none'
    document.body.appendChild(c)
    c.click()
    c.remove()
}
