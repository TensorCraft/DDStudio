const { dialog, app, Notification, BrowserWindow, Menu, ipcMain, ipcRenderer } = require("electron");
const fs = require("fs");
const fork = require("child_process").fork
const path = require("path")
const xlog = require("./lib/xlog");
const downloader = require("./Utils/Downloader");
var Biliapi = require(path.resolve(__dirname, "./lib/biliapi"));
var Live = require(path.resolve(__dirname, "./live"));
var server = null;

const MainWindow = async (cookies) => {
    var comments_server = null;
    var api = new Biliapi(cookies);
    var livelist = [];
    var tmplist = [];
    const mainwin = new BrowserWindow({
        width: 965,
        height: 600,
        minWidth: 965,
        minHeight: 600,
        titleBarStyle: 'hidden',
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    mainwin.setFullScreenable(false);
    mainwin.loadURL('http://127.0.0.1:11451/layouts/home.html');
    var uid = cookies.substring(cookies.indexOf("DedeUserID") + 11, cookies.indexOf(";"));
    api.getProfile(uid).then(data => {
        downloader.downloadFileAsync(data["face"], path.resolve(__dirname, "./layouts/icons/" + uid + ".jpg")).then(ret => {
            mainwin.webContents.send('setface', "./icons/" + uid + ".jpg");
        });
    });

    mainwin.openDevTools({
        mode: 'detach'
    });
    renewmedals();

    function additem(x) {
        downloader.downloadFileAsync(x["face"], path.resolve(__dirname, "./layouts/icons/" + x["uid"] + ".jpg")).then(ret => {
            mainwin.webContents.send('cmd', { cmd: "add_dditem", uid: x["uid"], uname: x["uname"], roomid: x["roomid"], title: x["title"] });
        });
    }

    function renewRoomInfo() {
        var newlist = [];
        api.getFollowlivelist().then(data => {
            for (var i = 0; i < data.length; i++) {
                var x = data[i];
                newlist[i] = { data: x, onlive: true }
                var flag = true;
                for (var j = 0; j < livelist.length; j++) {
                    if (livelist[j]["data"]["roomid"] == x["roomid"]) {
                        if (!livelist[j]["onlive"]) {
                            additem(x);
                            livelist[j]["onlive"] = true;
                        }
                        flag = false;
                        break;
                    }
                }
                if (flag) {
                    livelist[livelist.length] = { data: x, onlive: true };
                    additem(x);
                }
            }

            for (var i = 0; i < livelist.length; i++) {
                var flag = true;
                var x = livelist[i]["data"];
                for (var j = 0; j < newlist.length; j++) {
                    if (newlist[j]["data"]["roomid"] == x["roomid"]) {
                        flag = false;
                        break;
                    }
                }
                if (flag && livelist[i]["onlive"]) {
                    mainwin.webContents.send('cmd', { cmd: 'updatelist', id: x["uname"] + ':' + x["roomid"], action: 'del' });
                    livelist[i]["onlive"] = false;
                }
            }
        });
        setTimeout(function () {
            renewRoomInfo();
        }, 2000);
    }

    function checkTmpList(idx) {
        if (tmplist.length == 0) {
            setTimeout(() => {
                checkTmpList(0);
            }, 2000);
            return;
        }
        idx = idx % tmplist.length;
        if (tmplist[idx] != null) {
            var x = tmplist[idx];
            api.live_getRoominfo(tmplist[idx]["roomid"]).then(data => {
                if (data["onlive"] == 0) {
                    mainwin.webContents.send('cmd', { cmd: 'updatelist', id: x["uname"] + ':' + x["roomid"], action: 'del' });
                    tmplist[idx] = null;
                }
                setTimeout(() => {
                    checkTmpList(idx + 1);
                }, 2000);
            });
        }
        else {
            setTimeout(() => {
                checkTmpList(idx + 1);
            }, 2000);
        }
    }

    function renewfonts(roomid) {
        api.getDanmuStyles(roomid).then(data => {
            if (data == {}) {
                mainwin.webContents.send('cmd', { cmd: "toast", text: "获取弹幕样式列表失败", lasttime: 1000 });
                return;
            }
            mainwin.webContents.send('cmd', { cmd: "renewfonts", data: [data["data"]["group"], data["data"]["mode"]] });
        });
    }
    function renewmedals() {
        api.getMedalList().then(data => {
            if (data == []) {
                mainwin.webContents.send('cmd', { cmd: "toast", text: "获取粉丝牌列表失败", lasttime: 1000 });
                return;
            }
            mainwin.webContents.send('cmd', { cmd: "renewmedals", data: data });
        });
    }

    function renewEmojilist(roomid) {
        api.getEmojis(roomid).then(async data => {
            console.log(data);
            if (data == {}) {
                mainwin.webContents.send('cmd', { cmd: "toast", text: "获取表情包样式列表失败", lasttime: 1000 });
                return;
            }
            for (i in data["data"]) {
                var x = data["data"][i]["emoticons"];
                for (j in x) {
                    await downloader.downloadFileAsync(x[j]["url"], path.resolve(__dirname, "./layouts/emoticons/" + x[j]["emoticon_unique"] + ".png"));
                }
                mainwin.webContents.send('cmd', { cmd: "renewEmojis", data: data });
            }
        });
    }

    if (api.checkcookie(cookies) == false) {
        console.log("logging fail");
    }
    else {
        renewRoomInfo();
        checkTmpList(0);
    }

    ipcMain.on('command', (event, arg) => {
        switch (arg["cmd"]) {
            case "sendmsg":
                api.live_sendMsg(arg["text"], arg["roomid"], arg["style"]);
                break;
            case "checksize":
                //if (mainwin.getSize()[0] <= 1165) mainwin.setSize(1165, mainwin.getSize()[1]);
                break;
            case "play":
                api.getStreamURL(arg["roomid"]).then(data => {
                    api.live_getRoominfo(arg["roomid"]).then(res => {
                        event.sender.send('cmd', { cmd: "play", player: arg["player"], url: data, uid: arg["uid"], uname: arg["uname"], title: res["title"], roomid: arg["roomid"] });
                    })
                    if (arg["player"] === "main") {
                        renewEmojilist(arg["roomid"]);
                        renewfonts(arg["roomid"]);
                        renewmedals();
                        console.log("renewing", arg["roomid"]);
                        if (comments_server != null) comments_server.stop();
                        new Live(arg["roomid"]).then(mserver => {
                            mserver.on('WS_MESSAGE_DANMAKU', function (data) {
                                mainwin.webContents.send('cmd', { "cmd": "addmsg", uname: data["uname"], utext: data["text"], fans_medal: "" });
                            });
                            mserver.on('WS_MESSAGE_SEND_GIFT', (data) => {
                                mainwin.webContents.send("cmd", { cmd: "giftmsg", data: data });
                            });
                            mserver.on('WS_MESSAGE_WELCOME', (data) => console.log('welcome:', data));
                            comments_server = mserver;
                        });
                    }
                });
                break;
            case "renewEmojis":
                renewEmojilist(arg["roomid"]);
                break;
            case "addroom":
                for (var i = 0; i < livelist.length; i++)
                    if (arg["roomid"] == livelist[i]["data"]["roomid"]) {
                        flag = false;
                        if (!livelist[i]["onlive"]) {
                            mainwin.webContents.send('cmd', { cmd: "updatelist", action: "renew", id: arg["itemid"], type: "err", reason: "未开播" });
                            return;
                        }
                        else {
                            mainwin.webContents.send('cmd', { cmd: "updatelist", action: "renew", id: arg["itemid"], type: "err", reason: "已存在" });
                            return;
                        }
                    }
                api.live_getRoominfo(arg["roomid"]).then(data => {
                    if (data == null) {
                        mainwin.webContents.send('cmd', { cmd: "updatelist", action: "renew", id: arg["itemid"], type: "err", reason: "不存在" });
                        return;
                    }
                    if (data["onlive"] == 0) {
                        mainwin.webContents.send('cmd', { cmd: "updatelist", action: "renew", id: arg["itemid"], type: "err", reason: "未开播" });
                    }
                    else {
                        api.getProfile(data["uid"]).then(pf => {
                            additem({ uid: data["uid"], uname: pf["uname"], roomid: arg["roomid"], title: data["title"], face: pf["face"] });
                            tmplist[tmplist.length] = { uid: data["uid"], uname: pf["uname"], roomid: arg["roomid"], title: data["title"], face: pf["face"] };
                            mainwin.webContents.send('cmd', { cmd: 'updatelist', id: arg["itemid"], action: 'del' });
                        });
                    }
                });
                break;
            case "setmedal":
                if (arg["medal"] == -1) {
                    api.live_Medal_takeoff().then(data => {
                        if (data) mainwin.webContents.send("cmd", { cmd: "toast", text: "已取下所有勋章", lasttime: 1000 });
                        else mainwin.webContents.send("cmd", { cmd: "toast", text: "取下勋章失败", lasttime: 1000 });
                    });
                }
                else if (arg["medal"] == -2) {
                    api.getMedalList().then(data => {
                        for (i in data) {
                            var x = data[i];
                            if (x["roomid"] == arg["roomid"]) {
                                api.live_setMedal(x["mid"]).then(res => {
                                    if (res) mainwin.webContents.send("cmd", { cmd: "toast", text: "已成功匹配当前直播间勋章", lasttime: 1000 });
                                    else mainwin.webContents.send("cmd", { cmd: "toast", text: "佩戴失败", lasttime: 1000 });
                                });
                                return;
                            }

                        }
                        console.log("未匹配到当前房间的勋章");
                        api.live_Medal_takeoff().then(data => {
                            mainwin.webContents.send("cmd", { cmd: "toast", text: "未持有当前房间勋章,已取下所有勋章", lasttime: 2000 });
                        });
                    })
                }
                else {
                    api.live_setMedal(arg["medal"]).then(data => {
                        if (data) mainwin.webContents.send("cmd", { cmd: "toast", text: "佩戴成功", lasttime: 1000 });
                        else mainwin.webContents.send("cmd", { cmd: "toast", text: "佩戴失败", lasttime: 1000 });
                    });
                }
                break;
            case "sendemoji":
                api.live_sendEmoji(arg["emoji"], arg["roomid"], arg["style"]);
                break;
        }
    });
}

const LoginWindow = () => {
    xlog.info("Login in window start");
    const loginwin = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            contextIsolation: false,
        },
        resizable: false
    });
    loginwin.setFullScreenable(false);

    loginwin.loadURL('http://127.0.0.1:11451/layouts/login.html');
    /*loginwin.openDevTools({
        mode: 'detach'
    });*/

    ipcMain.on('login-message', async (event, cookie_info) => {
        if (cookie_info["method"] == "QR") {
            cookies = cookie_info["data"];
            console.log("coockies:" + cookies)
            const data = fs.readFileSync(path.join(__dirname, './cache/accounts.json'), 'utf8');
            var accountsinfo = JSON.parse(data);
            accountsinfo["logined"] = true;
            accountsinfo["accounts"]["data"][accountsinfo["accounts"]["num"]] = { "cookies": cookies, "timestamp": Date.now() }; // 这里存的账号登陆时间戳没有用获取时刻的，因为懒得从login.js传递过来，影响不大
            accountsinfo["accounts"]["num"] = accountsinfo["accounts"]["num"] + 1;
            try {
                const data = fs.writeFileSync('./cache/accounts.json', JSON.stringify(accountsinfo));
                //文件写入成功。
                LoginWindow();
                loginwin.destroy();
            } catch (err) {
                console.error("Failed to save the accounts info." + err);
            }
        }
        else {
            xlog.info("Logging in via cookie input.");
            apitest = new Biliapi(cookie_info["data"]);
            if (apitest.checkcookie == undefined) {
                dialog.showErrorBox('错误', 'Cookie检验失败，请重新登录');
                LoginWindow();
                loginwin.destroy();
            }
            if (await apitest.checkcookie()) {
                console.log("coockies:" + cookies)
                const data = fs.readFileSync(path.join(__dirname, './cache/accounts.json'), 'utf8');
                console.log(path.join(__dirname, "./"));
                var accountsinfo = JSON.parse(data);
                accountsinfo["logined"] = true;
                accountsinfo["accounts"]["data"][accountsinfo["accounts"]["num"]] = { "cookies": cookie_info["data"], "timestamp": Date.now() }; // 这里存的账号登陆时间戳没有用获取时刻的，因为懒得从login.js传递过来，影响不大
                accountsinfo["accounts"]["num"] = accountsinfo["accounts"]["num"] + 1;
                try {
                    const data = fs.writeFileSync('./cache/accounts.json', JSON.stringify(accountsinfo));
                    //文件写入成功。
                } catch (err) {
                    console.error("Failed to save the accounts info." + err);
                }
                loginwin.destroy();
            }
            else {
                dialog.showErrorBox('错误', 'Cookie检验失败，请重新登录');
                LoginWindow();
                loginwin.destroy();
            }
        }
    });
}

app.on('live-notification', (event, notification) => {
    // TODO notify the notification from service.js

});

app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    const data = fs.readFileSync(path.join(__dirname, './cache/accounts.json'), 'utf8');
    const accountsinfo = JSON.parse(data);

    server = fork(path.resolve(path.join(__dirname, "./server.js")), [], { stdio: "inherit" });
    server.on("message", msg => {
        console.log("[live-notification]");
        if (msg["cmd"] == "notification") {
            var notification = msg["data"];
            console.log(notification);
            new Notification(notification).show();
        }
    });

    if (!accountsinfo["logined"]) {
        LoginWindow();
    } else {
        /*const service = fork(path.resolve("service.js"), [], { stdio: "inherit" });
        service.on("message", msg => {
            console.log("[live-notification]");
            if(msg["cmd"] == "notification") {
                var notification = msg["data"];
                console.log(notification);
                new Notification(notification).show();
            }
        });*/

        apitest = new Biliapi(accountsinfo["accounts"]["data"][0]["cookies"]);
        if (apitest.checkcookie == undefined || await !apitest.checkcookie(accountsinfo["accounts"]["data"][0]["cookies"])) {
            dialog.showErrorBox('错误', 'Cookie检验失败，请重新登录');
            LoginWindow();
        } else {
            MainWindow(accountsinfo["accounts"]["data"][0]["cookies"]);
        }
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('window-all-closed', (e) => {
    e.preventDefault();
    server.send('stop');
    app.quit();
});