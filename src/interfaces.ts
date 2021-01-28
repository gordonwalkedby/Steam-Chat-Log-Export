interface SteamChatMessage {
    SenderID: string,   //发送者的steamid64
    Sender: string, //发送者的昵称
    RecipientID: string,    //接收者的steamid64
    Recipient: string,  //接收者的昵称
    Time: string,   //时间，你肉眼可读的一个文本，时区是你导出的时候的时区
    UTCTime: number,    //unix时间戳，UTC时间，单位是毫秒
    Message: string //发送的信息文本
}

interface SteamChatLogDataJSON {
    html: string,
    continue: string | null
}
