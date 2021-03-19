# Steam 聊天记录导出
这是我写的一个 Tampermonkey 脚本。
可以在[steam官方的聊天记录存档页面](https://help.steampowered.com/zh-cn/accountdata/GetFriendMessagesLog)导出全部的数据（我指的是steam官方允许你能看见的那部分，也就是最近14天）。Steam官方只保留了14天，14天以前的steam就不提供了。    
Steam官方只保留了14天，14天以前的steam就不提供了。   
官方网页只能一页一页翻看聊天记录，不能导出。所以我就设计了这个。     

安装好之后，在steam官方的聊天记录存档页面这个页面时，网页左侧会有一个按钮，按了就会开始采集。采集完成后会提示你可以下载了，下载过来是csv或是json。   
如果你不懂编程：csv文件可以直接用Excel表格软件打开（Office或WPS）。如果你需要分享的话，用Excel表格软件另存为 .xlsx 也可以的。   
如果你逛普通的steam网站，在登录状态下，如果七天没有使用脚本备份数据的话，就会发提醒（超过七天之后是一天发一次）。    

安装请到： [greasy fork](https://greasyfork.org/scripts/420714-steam-chat-log-export)   
**注意：我的API使用是按照 Tampermonkey 来编写的，不保证支持其他的脚本扩展（比如 Greasemonkey）。**    

# 使用办法：
在[steam官方的聊天记录存档页面](https://help.steampowered.com/zh-cn/accountdata/GetFriendMessagesLog)这个页面的时候，网页左侧会有一个按钮，按了就会开始采集。采集完成后会提示你可以下载了，下载过来是csv或是json。    
如果你不懂编程：csv文件可以直接用Excel表格软件打开（Office或WPS）。如果你需要分享的话，用Excel表格软件另存为 .xlsx 也可以的。     

# 目前支持的翻译：
```javascript
// @description I can export your steam chat log into csv or json.

// @description:zh-CN Steam平台只为你保留14天的聊天记录。我将其打包成csv或json，供您下载，自己备份好哦，建议每个周末来这里保存一次。

// @description:zh-TW Steam平台只為你保留14天的聊天記錄。我將其打包成csv或json，供您下載，自己備份好哦，建議每個週末來這裡保存一次。 

// @description:ja Steamではチャットログを14日間だけ保持します。このスクリプトではチャットログをCSV形式またはJSON形式にしてダウンロードしてバックアップすることができます。是非、チャットログを大切にしますように、毎週バックアップしてください。
```

# 截图： 
![效果图1加载失败](https://s3.ax1x.com/2021/01/28/y9wj8x.png)   
![效果图2加载失败](https://s3.ax1x.com/2021/01/28/y9wAjU.png)   

# 技术说明
这些聊天记录，每一条记录都是一个类，或者说接口。
```typescript
interface SteamChatMessage {
    SenderID: string,   //发送者的steamid64
    Sender: string, //发送者的昵称
    RecipientID: string,    //接收者的steamid64
    Recipient: string,  //接收者的昵称
    Time: string,   //时间，你肉眼可读的一个文本，时区是你导出的时候的时区
    UTCTime: number,    //unix时间戳，UTC时间，单位是毫秒
    Message: string //发送的信息文本
}
```
Time文本在csv中的格式是：2021/01/28 13:13:59 ，这兼容了excel的时间格式      
Time文本在json中的格式是取决于你的时区的，也就是```.toLocaleString()```，比如中国一般是```1/14/2021, 8:51:19 PM```。      
因为steam官方提供的时间是只有小时和分钟，没有提供秒。而最新的信息会被排在前面。  
所以这里的策略是同一分钟下，第一条信息的秒是59，第二条是58，直到0秒。  
如果有多条数据占据同一个0秒，会修改这个时间的毫秒部分，从999开始一直减，直到0。   
所以，如果你需要排序的话，请尽量使用 UTCTime 进行排序，因为Time文本一般不包含毫秒。     
如果有更好的策略可以和我说。      
你的steam的网页可以设置为任何语言，但是我内部全都是访问zh-cn，因为zh-cn的时间字符串是这样的： “2021年1月28日下午1:13 CST”，固定的格式我好解析。      
在CSV的【普通人推荐】模式中，所有的纯数字字符串，比如utctime和steamid64，前面都加了一个'的符号，这是为了方便用Excel表格软件浏览。   
因为Excel表格软件经常会把一个比较大的数字变成一个```1.61E+12```这种写法。   
而如果是其他软件要读取csv，推荐使用【纯数字的值不转为字符串】模式。    
