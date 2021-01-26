interface SteamChatMessage {
    SenderID: string, Sender: string,
    RecipientID: string, Recipient: string,
    Time: string,
    Message: string
}

interface SteamChatLogDataJSON {
    html: string,
    continue: string | null
}
