const { ipcRenderer } = require('electron');
const { unwatchFile } = require('original-fs');
var remote = require('electron').remote;

var extbarstatus = 0; //0 -> hidden 1 -> setting 2 -> extenssion 3 -> user
var mplayer = undefined;
var playerlist = [];
var playerlistidx = 0;
var livetitle = "";
var danmusettings = { color: 16777215, mode: 1, selectedid: "-1", modename: '滚动', medal: -2, transmode: 0 };
var settings = { mainvideo: { playback: false, videofill: false, framechase: false, picinpic: true }, ddscreen: { mutestarting: false }, danmaku: { blockRedPacketMessage: true, showgifts: true, giftsfade: true, showenteringmsg: false }, notifications: { liveinform: true }, about: { version: "v0.1.2(内测版本)" } };
var emoji_senttime = 0;

ipcRenderer.on('message', (event, arg) => {
    console.log(arg);
    var player = document.getElementById('mainvideo');
    if (flvjs.isSupported()) {
        var flvPlayer = flvjs.createPlayer({
            type: 'flv',
            "isLive": true,
            url: arg
        });
        flvPlayer.attachMediaElement(player);
        flvPlayer.load();
        player.play();
    }
});

function getMousePos(event) {
    var e = event || window.event;
    return [e.clientX, e.clientY];
}

function renewsize() {
    var maincontent = document.getElementById("maincontent");
    var seccontent = document.getElementById("secondarycontent");

    seccontent.style.width = maincontent.parentNode.clientWidth - maincontent.clientWidth - 5 + 'px';
    if (maincontent.parentNode.clientWidth - maincontent.clientWidth <= 270) maincontent.style.width = maincontent.parentNode.clientWidth - 275 + 'px';
    //if (maincontent.clientWidth == 405) seccontent.style.width = maincontent.parentNode.clientWidth - 405 + 'px';

    var video_container = document.getElementById("video_container");
    var parent = video_container.parentNode;
    drag2.parentNode.style.height = parent.clientHeight - video_container.clientHeight - 5 + 'px';

    var volboxes = document.getElementsByClassName("volbox");
    for (var i = 0; i < volboxes.length; i++) {
        var x = volboxes[i];
        var vol = document.getElementsByClassName("videoitem")[i].childNodes[0].volume;
        x.style.left = (x.parentNode.offsetWidth - x.offsetWidth) * vol + 'px';
    }
}

function renewsize_volctl() {
    var volboxes = document.getElementsByClassName("volbox");
    for (var i = 0; i < volboxes.length; i++) {
        var x = volboxes[i];
        var vol = document.getElementsByClassName("videoitem")[i].childNodes[0].volume;
        x.style.left = (x.parentNode.offsetWidth - x.offsetWidth) * vol + 'px';
    }
}

function InitSettings() {
    for (var i in settings)
        for (var j in settings[i])
            if (typeof (settings[i][j]) == "boolean") {
                var domx = document.getElementById(j);
                domx.checked = settings[i][j];
                domx.onclick = function () {
                    settings[i][j] = this.checked;
                }
            }
}

window.onresize = function () {
    renewsize();
}

window.onload = function () {

    InitSettings();

    document.getElementById("fontbar").innerHTML = '<div class="loading"><span></span><span></span><span></span><span></span><span></span></div>';
    var additem = document.getElementById("additem");
    additem.onclick = function () {
        if (additem.className == "dditem") {
            additem.className = "idcontainer";
            additem.innerHTML = '<input class="roomidedit" id="roomidedit" onkeydown="checkRoomid(event)" placeholder="请输入房间号，并回车..." rows="1"></input>'
            document.getElementById('roomidedit').focus()
            document.getElementById('roomidedit').onblur = function () {
                if (additem.className != "dditem") {
                    additem.className = "dditem";
                    additem.innerHTML = "+";
                }
            }
        }
    }


    var drag1 = document.getElementById("drag1");
    drag1.onmousedown = function (ev) {
        var seccontent = document.getElementById("secondarycontent");
        var maincontent = document.getElementById("maincontent");
        var mainvideo = document.getElementById("mainvideo");
        document.getElementById("movingbar").style.display = "none";
        window.onmousemove = function (ev) {
            if (drag1.parentNode.clientWidth - (ev.clientX - 68) > 275 && ev.clientX > 468) {
                maincontent.style.width = ev.clientX - 69.5 + 'px';
                seccontent.style.width = drag1.parentNode.clientWidth - maincontent.clientWidth - 3 + 'px';
                if (mainvideo.parentNode.clientWidth / mainvideo.parentNode.clientHeight > 1.77)
                    mainvideo.width = mainvideo.clientHeight * 1.77 + 'px';
                else
                    mainvideo.height = mainvideo.clientWidth / 1.77 + 'px';
            }
        }
        window.onclick = function () {
            window.onmousemove = false;
            //return false;
        }
        window.onmouseup = function () {
            window.onmousemove = false;
            document.getElementById("movingbar").style.display = "block";
            //return false;
        }
        return false;
    };

    var drag2 = document.getElementById("drag2");
    drag2.onmousedown = function (ev) {
        var video_container = document.getElementById("video_container");
        var parent = video_container.parentNode;
        window.onmouseup = function () {
            console.log("mouse up");
            window.onmousemove = false;
            return false;
        }
        window.onclick = function () {
            window.onmousemove = false;
            return false;
        }
        window.onmousemove = function (ev) {
            if (parent.clientHeight - ev.clientY > 280) {
                video_container.style.height = ev.clientY + 'px';
                drag2.parentNode.style.height = parent.clientHeight - video_container.clientHeight - 5 + 'px';
            }
        }
        return false;
    };

    document.getElementById("giftbtn").onclick = function () {
        maketoast("暂不开放", 1000);
    }

    var transbtn = document.getElementById("transbtn");
    var fontbtn = document.getElementById("fontbtn");
    var fontbar = document.getElementById("fontbar");
    transbtn.onclick = function () {
        if (this.className == "textsettingbtn_on") {
            this.className = "textsettingbtn";
            maketoast("同传模式已关闭", 1000);
            danmusettings["transmode"] = 0;
        }
        else {
            this.className = "textsettingbtn_on";
            maketoast("同传模式已开启", 1000);
            danmusettings["transmode"] = 1;
        }
    };

    fontbtn.onclick = function () {
        if (this.className == "textsettingbtn_on") {
            this.className = "textsettingbtn";
            fontbar.style.display = "none";
        }
        else {
            this.className = "textsettingbtn_on";
            fontbar.style.display = "block";
            fontbar.focus();
            fontbar.onblur = function () {
                fontbar.style.display = "none";
                fontbtn.className = "textsettingbtn";
            }
        }
    }

    var emojibar = document.getElementById("emojibar");
    var emojibtn = document.getElementById("emojibtn");
    emojibtn.onclick = function () {
        if (this.className == "emojibtn_on") {
            this.className = "emojibtn";
            emojibar.style.display = "none";
        }
        else {
            this.className = "emojibtn_on";
            emojibar.style.display = "block";
            emojibar.focus();
            emojibar.onblur = function () {
                emojibar.style.display = "none";
                emojibtn.className = "emojibtn";
            }
        }
    }

    ipcRenderer.send('async-msg', 'ping');
    var settingbutton = document.getElementById("setting");
    var extenssionbutton = document.getElementById("extenssion");
    var userbutton = document.getElementById("user");
    var ddlist_ctl = document.getElementById("ddlist_Ctrl");
    settingbutton.onclick = function () {
        set_extbar(1);
    };
    extenssionbutton.onclick = function () {
        set_extbar(2);
    };
    userbutton.onclick = function () {
        set_extbar(3);
    };


    ddlist_ctl.onclick = function () {
        var ddlist = document.getElementById("ddlist_container");
        var ddscreen = document.getElementById("ddscreen");
        if (ddlist_ctl.className == "ddlist_Ctrl_on") {
            ddlist_ctl.className = "ddlist_Ctrl";
            ddlist.className = "ddlist_container";
            ddscreen.className = "ddscreen";
        }
        else {
            ddlist_ctl.className = "ddlist_Ctrl_on";
            ddlist.className = "ddlist_container_on";
            ddscreen.className = "ddscreen_on";
        }
    }
}

function getPosition(node) {
    var left = node.offsetLeft;
    var top = node.offsetTop;
    current = node.offsetParent;

    while (current != null) {
        left += current.offsetLeft;
        top += current.offsetTop;
        current = current.offsetParent;
    }
    return [left, top];
}

function set_extbar(idx) {
    var settingbutton = document.getElementById("setting");
    var extenssionbutton = document.getElementById("extenssion");
    var userbutton = document.getElementById("user");
    var extbar_setting = document.getElementById("extbar_setting");
    var extbar_extenssion = document.getElementById("extbar_extenssion");
    var extbar_user = document.getElementById("extbar_user");
    var maincontainer = document.getElementById("maincontainer");
    if (extbarstatus == 0) {
        ipcRenderer.send('command', { cmd: "checksize" });
        maincontainer.className = "right_on";
        switch (idx) {
            case 1:
                extbar_setting.style.display = "block";
                break;
            case 2:
                extbar_extenssion.style.display = "block";
                break;
            case 3:
                extbar_user.style.display = "block";
                break;
        }
        //renewsize();
    }
    switch (idx) {
        case 1:
            if (extbarstatus == idx) {
                settingbutton.className = "navtab";
                extbarstatus = 0;
                extbar_user.style.display = "none";
                extbar_setting.style.display = "none";
                extbar_extenssion.style.display = "none";
                maincontainer.className = "right";
            }
            else {
                settingbutton.className = "active";
                userbutton.className = "navtab";
                extenssionbutton.className = "navtab";
                extbar_user.style.display = "none";
                extbar_setting.style.display = "block";
                extbar_extenssion.style.display = "none";
                extbarstatus = idx;
            }
            break;
        case 2:
            if (extbarstatus == idx) {
                extbarstatus = 0;
                extenssionbutton.className = "navtab";
                extbar_user.style.display = "none";
                extbar_setting.style.display = "none";
                extbar_extenssion.style.display = "none";
                maincontainer.className = "right";
            }
            else {
                extenssionbutton.className = "active";
                settingbutton.className = "navtab";
                userbutton.className = "navtab";
                extbar_user.style.display = "none";
                extbar_setting.style.display = "none";
                extbar_extenssion.style.display = "block";
                extbarstatus = idx;
            }
            break;
        case 3:
            if (extbarstatus == idx) {
                extbarstatus = 0;
                userbutton.className = "navtab";
                extbar_user.style.display = "none";
                extbar_setting.style.display = "none";
                extbar_extenssion.style.display = "none";
                maincontainer.className = "right";
            }
            else {
                settingbutton.className = "navtab";
                extenssionbutton.className = "navtab";
                userbutton.className = "active";
                extbar_user.style.display = "block";
                extbar_setting.style.display = "none";
                extbar_extenssion.style.display = "none";
                extbarstatus = idx;
            }
            break;
    }
    renewsize();
}

ipcRenderer.on('setface', (event, url) => {
    setTimeout("renewface('" + url + "')", 0);
});

function renewface(url) {
    var face = document.getElementById("faceframe");
    face.innerHTML = '<img class="profile_img" src="' + url + '" id="face" ></img>';
    face.onclick = "renewface('" + url + "')";
}

function renewtitle(timestamp) {
    info_text = document.getElementById("info_text");
    if (parseInt(info_text.getAttribute("name")) > timestamp) return;
    info_text.innerHTML = livetitle;
}

ipcRenderer.on('cmd', (event, arg) => {
    if (arg["cmd"] == "addmsg") {
        var comments = document.getElementById("comments");
        var comment = document.createElement("div");
        comment.setAttribute("class", "comment");
        comment.innerHTML = `<p style=" word-wrap:break-word;word-break:break-all;width: calc(100% - 20px);padding-top: 5px;"><span style="color: #ffeeaa;">` + arg["uname"] + `:</span><span style="color: #ffffff;">` + arg["utext"] + `</span></p>`;
        if (arg["utext"].startsWith("【")) {
            if (arg["utext"].endsWith("】")) arg["utext"] = arg["utext"].substring(0, arg["utext"].length - 1);
            document.getElementById("info_text").innerHTML = "同传:" + arg["utext"].replace("【", "");
            var timestamp = new Date().getTime().toString();
            document.getElementById("info_text").setAttribute('name', timestamp);
            setTimeout("renewtitle(" + timestamp + ");", arg["utext"].replace("【", "").length / 5 * 2000);
        }
        if (comments.innerHTML != "") {
            var commentslist = document.getElementsByClassName("comment");
            var lastcomment = commentslist[commentslist.length - 1];
            if (comments.scrollHeight - comments.scrollTop === comments.clientHeight) {
                comments.appendChild(comment);
                comments.scrollTop = comments.scrollHeight;
            }
            else comments.appendChild(comment);
        }
        else comments.appendChild(comment);
    }
    else if (arg["cmd"] == "giftmsg") {
        var comments = document.getElementById("comments");
        var comment = document.createElement("div");
        comment.setAttribute("class", "comment");
        comment.innerHTML = `<p style=" word-wrap:break-word;word-break:break-all;width: calc(100% - 20px);padding-top: 5px;"><span style="color: #ffffff;">` + arg["data"]["uname"] + arg["data"]["action"] + "了" + `:</span><span style="color: #ffeeaa;">` + arg["data"]["giftName"] + `</span>x` + arg["data"]["num"] + `</p>`;
        if (comments.innerHTML != "") {
            var commentslist = document.getElementsByClassName("comment");
            var lastcomment = commentslist[commentslist.length - 1];
            if (comments.scrollHeight - comments.scrollTop === comments.clientHeight) {
                comments.appendChild(comment);
                comments.scrollTop = comments.scrollHeight;
            }
            else comments.appendChild(comment);
        }
        else comments.appendChild(comment);
        setTimeout(function () {
            comment.remove();
        }, 2000)
    }
    else if (arg["cmd"] == "play") {
        if (arg["player"] == "main") {
            livetitle = arg["title"];
            var player = document.getElementById('mainvideo');
            if (mplayer != undefined) mplayer.destroy();
            player.setAttribute("name", arg["roomid"]);
            if (flvjs.isSupported()) {
                var flvPlayer = flvjs.createPlayer({
                    type: 'flv',
                    "isLive": true,
                    url: arg["url"],
                    enableWorker: true, // 启用分离的线程进行转换
                    enableStashBuffer: false, // 关闭IO隐藏缓冲区
                    stashInitialSize: 128 // 减少首帧显示等待时长
                }, {
                    autoCleanupSourceBuffer: false
                });
                flvPlayer.attachMediaElement(player);
                flvPlayer.load();
                flvPlayer.on(flvjs.Events.ERROR, (errorType, errorDetail, errorInfo) => {
                    console.log("reconnecting...");
                    //视频出错后销毁重新创建
                    if (flvPlayer) {
                        flvPlayer.pause();
                        flvPlayer.unload();
                        flvPlayer.detachMediaElement();
                        flvPlayer.destroy();
                        flvPlayer = null;
                        this.createflvPlayer(player, this.url);
                    }
                });
                player.play();
                player.addEventListener("progress", () => {
                    let end = player.buffered.end(0); //获取当前buffered值(缓冲区末尾)
                    let delta = end - player.currentTime; //获取buffered与当前播放位置的差值

                    // 延迟过大，通过跳帧的方式更新视频
                    if (delta > 3 || delta < 0) {
                        player.currentTime = player.buffered.end(0) - 1;
                        return;
                    }
                });
                mplayer = flvPlayer;
            }
            var info_text = document.getElementById("info_text");
            var info_uname = document.getElementById("info_uname");
            var info_face = document.getElementById("info_face");
            info_face.src = "./icons/" + arg["uid"] + ".jpg";
            info_uname.innerHTML = arg["uname"];
            info_text.innerHTML = arg["title"];
        }
        else {
            var ddscreen = document.getElementById("ddscreencontainer");
            var newvideo = document.createElement("div");
            newvideo.className = "videoitem";
            newvideo.id = "video" + arg["roomid"];
            newvideo.innerHTML = `<video style="width: calc(100% - 4px);padding: 2px;max-height:293px;" autoplay id="` + arg["uname"] + ':' + arg["roomid"] + `"></video>
            <div class="videoctl">
              <div style="width: 50%;height:100%;text-align: center;float: left;position: relative;border-radius: 20px;"
                class="videoctl_btn">
                <img
                  style="width: 50px;-webkit-user-drag: none;position: absolute;top: calc((100% - 50px) / 2);left: calc((100% - 50px) / 2);"
                  src="./img/left-circle-fill.png" />
              </div>
              <div style="width: 50%;height:100%;float:left;">
                <div style="width: 100%;height:50%;position: relative;border-radius: 10px;" class="videoctl_btn"
                  id="volctl">
                  <img style="width: 30px;-webkit-user-drag: none;position: absolute;top: calc((100% - 30px) / 2);"
                    src="./img/notice.png" id="volbtn"/>
                  <div class="volbar">
                    <div class="volbox">
                    </div>
                  </div>
                </div>
                <div style="width: 100%;height:50%;text-align: center;position: relative;border-radius: 10px;"
                  class="videoctl_btn">
                  <img
                    style="width: 50px;-webkit-user-drag: none;position: absolute;top: calc((100% - 50px) / 2);left: calc((100% - 50px) / 2);"
                    src="./img/round_close_fill.png" />
                </div>
              </div>
            </div>`
            var videoitemflag = document.getElementById("videoitemflag");
            ddscreen.insertBefore(newvideo, videoitemflag);
            var newplayer = document.getElementById(arg["uname"] + ':' + arg["roomid"]);
            ddscreen.scrollTop = ddscreen.scrollHeight;
            if (flvjs.isSupported()) {
                var flvPlayer = flvjs.createPlayer({
                    type: 'flv',
                    "isLive": true,
                    url: arg["url"]
                });
                flvPlayer.attachMediaElement(newplayer);
                flvPlayer.load();
                newplayer.play();
            }
            newvideo.childNodes[2].childNodes[3].childNodes[3].onclick = function () {
                flvPlayer.destroy();
                newvideo.remove();
                try {
                    document.getElementsByName(arg["uname"] + ':' + arg["roomid"])[0].parentNode.style.display = "block";
                }
                catch (err) {
                }
            }
            newvideo.childNodes[2].childNodes[1].onclick = function () {
                var nameid = newplayer.id;
                if (nameid.substring(nameid.indexOf(":") + 1) != document.getElementById('mainvideo').getAttribute("name")) {
                    document.getElementById("comments").innerHTML = "";
                    ipcRenderer.send('command', { cmd: "play", player: "main", uname: nameid.substring(0, nameid.indexOf(":")), roomid: nameid.substring(nameid.indexOf(":") + 1), uid: arg["uid"] });
                }
                else {
                    maketoast("已在播放...", 1000);
                }
                try {
                    document.getElementsByName(nameid.substring(0, nameid.indexOf(":")) + ':' + nameid.substring(nameid.indexOf(":") + 1))[0].parentNode.style.display = "block";
                }
                catch (err) {
                }
                flvPlayer.destroy();
                newvideo.remove();
            }
            console.log(newvideo.childNodes[2].childNodes[3].childNodes[1].childNodes);
            var box = newvideo.childNodes[2].childNodes[3].childNodes[1].childNodes[3].childNodes[1];
            var bar = newvideo.childNodes[2].childNodes[3].childNodes[1].childNodes[3];
            var volbtn = newvideo.childNodes[2].childNodes[3].childNodes[1].childNodes[1];
            box.style.left = bar.offsetWidth - box.offsetWidth + 'px';
            box.onmousedown = function (ev) {
                let boxL = box.offsetLeft;
                let e = ev;
                let mouseX = e.clientX;
                var cha = bar.offsetWidth - box.offsetWidth;
                window.onmousemove = function (ev) {
                    let e = ev;
                    let moveL = e.clientX - mouseX;
                    let newL = boxL + moveL;
                    if (newL < 0) {
                        newL = 0;
                    }
                    if (newL >= cha) {
                        newL = cha;
                    }
                    box.style.left = newL + 'px';
                    newplayer.volume = newL / cha;
                    if (box.style.left == '0px') {
                        volbtn.src = "./img/mute.png";
                    }
                    else volbtn.src = "./img/notice.png";
                    return false;
                }
                window.onmouseup = function () {
                    window.onmousemove = false;
                    return false;
                }
                return false;
            };
            renewsize_volctl();
        }
    }
    else if (arg["cmd"] == "add_dditem") {
        console.log(arg);
        var additem = document.getElementById("additem");
        var ddlist = document.getElementById("ddlist");
        var newitem = document.createElement("div");
        var newface = document.createElement("img");
        newitem.className = "dditem";
        newface.className = "ddicon"
        newface.setAttribute("name", arg["uname"] + ":" + arg["roomid"]);
        newface.addEventListener('dragend', function (e) {
            var mousepos = [];
            mousepos = getMousePos();
            mainplayer = document.getElementById("video_container");
            threshold_main_top = getPosition(mainplayer);
            threshold_main_bottom = [threshold_main_top[0] + mainplayer.clientWidth, threshold_main_top[1] + mainplayer.clientHeight];
            if (mousepos[0] > threshold_main_top[0] && mousepos[1] > threshold_main_top[1] && mousepos[0] < threshold_main_bottom[0] && mousepos[1] < threshold_main_bottom[1]) {
                if (this.getAttribute("name").substring(this.getAttribute("name").indexOf(":") + 1) != document.getElementById('mainvideo').getAttribute("name")) {
                    danmusettings["transmode"] = 0;
                    document.getElementById("transbtn").className = "textsettingbtn";
                    console.log("play in mainplayer");
                    var srcurl = this.src;
                    nameid = this.getAttribute("name");
                    document.getElementById("comments").innerHTML = "";
                    document.getElementById("fontbar").innerHTML = '<div class="loading"><span></span><span></span><span></span><span></span><span></span></div>';
                    ipcRenderer.send('command', { cmd: "play", player: "main", uname: nameid.substring(0, nameid.indexOf(":")), roomid: nameid.substring(nameid.indexOf(":") + 1), uid: srcurl.match(/icons\/(\S*).jpg/)[1] });
                }
                else {
                    maketoast("已在播放中...", 1000);
                }
            }
            ddscreen = document.getElementById("ddscreen");
            threshold_main_top = getPosition(ddscreen)
            threshold_main_bottom = [threshold_main_top[0] + ddscreen.clientWidth, threshold_main_top[1] + ddscreen.clientHeight];
            if (mousepos[0] > threshold_main_top[0] && mousepos[1] > threshold_main_top[1] && mousepos[0] < threshold_main_bottom[0] && mousepos[1] < threshold_main_bottom[1]) {
                console.log("play in ddscreen");
                this.parentNode.style.display = "none";
                var srcurl = this.src;
                nameid = this.getAttribute("name");
                ipcRenderer.send('command', { cmd: "play", player: "ddscreen", uname: nameid.substring(0, nameid.indexOf(":")), roomid: nameid.substring(nameid.indexOf(":") + 1), uid: srcurl.match(/icons\/(\S*).jpg/)[1] });
            }
        }, false);
        newface.src = "./icons/" + arg["uid"] + ".jpg";
        newitem.appendChild(newface);
        ddlist.insertBefore(newitem, additem);
    }
    else if (arg["cmd"] == "updatelist") {
        if (arg["action"] == "del") {
            if (arg["id"].indexOf(":") != -1)
                document.getElementsByName(arg["id"])[0].parentNode.remove();
            else
                document.getElementById(arg["id"]).remove();
        }
        else if (arg["action"] == "renew") {
            document.getElementById(arg["id"]).innerHTML = '<p style="color:red;">' + arg["reason"] + '</p>';
            setTimeout(() => {
                document.getElementById(arg["id"]).remove();
            }, 2000);
        }
    }
    else if (arg["cmd"] == "toast") {
        maketoast(arg["text"], arg["lasttime"]);
    }
    else if (arg["cmd"] == "renewfonts") {
        var fontsbar = document.getElementById("fontbar");
        fontsbar.innerHTML = "";
        danmusettings["selectedid"] = "-1";
        danmusettings["color"] = 16777215;
        for (i in arg["data"][0]) {
            var x = arg["data"][0][i];
            var newtag = document.createElement("p");
            newtag.innerHTML = x["name"];
            fontsbar.appendChild(newtag);
            for (j in x["color"]) {
                var k = x["color"][j];
                var newbox = document.createElement("div");
                newbox.id = i.toString() + j.toString();
                newbox.style.backgroundColor = '#' + k["color_hex"];
                newbox.setAttribute('name', k["color"]);
                if (k["status"] == 1) {
                    newbox.className = "colorbox";
                    newbox.onclick = function () {
                        if (this.className == "colorbox") {
                            this.className = "colorbox_on";
                            danmusettings["color"] = parseInt(this.getAttribute('name'));
                            if (danmusettings["selectedid"] != "-1")
                                document.getElementById(danmusettings["selectedid"]).className = "colorbox";
                            danmusettings["selectedid"] = this.id;
                        }
                    }
                }
                else {
                    newbox.className = "colorbox_off";
                    newbox.onclick = function () {
                        maketoast("权限不足", 1000);
                    }
                }
                fontsbar.appendChild(newbox);
            }

        }
        danmusettings["modename"] = "滚动";
        danmusettings["mode"] = 0;
        var modebar = document.createElement("div");
        modebar.className = "modebar";
        modebar.innerHTML = '<div class="modebtn_on" name="滚动">滚动</div><div class="modebtn" name="底部">底部</div><div class="modebtn" name="顶部">顶部</div>'
        fontsbar.appendChild(modebar);
        var modes = arg["data"][1];
        for (i in modes) {
            var x = document.getElementsByName(modes[i]["name"])[0];
            x.id = i.toString();
            if (modes[i]["status"] == 1) {
                x.onclick = function () {
                    if (this.className == "modebtn") {
                        var m = document.getElementsByName(danmusettings["modename"])[0];
                        m.className == "modebtn";
                        danmusettings["mode"] = parseInt(this.id);
                        danmusettings["modename"] = this.innerHTML;
                    }
                }
            }
            else {
                x.onclick = function () {
                    maketoast("权限不足", 1000);
                }
            }
        }
        /*<div class="modebar">
          <div class="modebtn">滚动</div>
          <div class="modebtn">底部</div>
          <div class="modebtn">顶部</div>
        </div>*/
    }
    else if (arg["cmd"] == "renewmedals") {
        var medallist = document.getElementById("medalselect");
        console.log(arg["data"]);
        medallist.innerHTML = '<option value="none">不佩戴</option><option value="auto">自动</option>'
        for (i in arg["data"]) {
            //<optgroup label="3"></optgroup> 
            var x = arg["data"][i];
            if (x["lighted"] == 0) {
                medallist.innerHTML += '<option value="' + x["mid"].toString() + '" disabled=true>' + x["mname"] + '</option>';
            }
            else {
                medallist.innerHTML += '<option value="' + x["mid"].toString() + '" >' + x["mname"] + '</option>';
            }
        }

        medallist.onchange = function (data) {
            danmusettings["medal"] = this.value;
            if (this.value == "auto") {
                if (document.getElementById("mainvideo").getAttribute("name") != null) ipcRenderer.send("command", { cmd: "setmedal", medal: -2, roomid: document.getElementById("mainvideo").getAttribute('name') });
                danmusettings["medal"] = -2;
            }
            else if (this.value == "none") {
                if (document.getElementById("mainvideo").getAttribute("name") != null) ipcRenderer.send("command", { cmd: "setmedal", medal: -1 });
                danmusettings["medal"] = -1;
            }
            else {
                if (document.getElementById("mainvideo").getAttribute("name") != null) ipcRenderer.send("command", { cmd: "setmedal", medal: parseInt(this.value) });
                danmusettings["medal"] = parseInt(this.value);
            }
        };

        if (danmusettings["medal"] == -2) {
            if (document.getElementById("mainvideo").getAttribute("name") != null) ipcRenderer.send("command", { cmd: "setmedal", medal: -2, roomid: document.getElementById("mainvideo").getAttribute('name') });
            medallist.value = "auto";
        }
        else if (danmusettings["medal"] == -1) {
            if (document.getElementById("mainvideo").getAttribute("name") != null) ipcRenderer.send("command", { cmd: "setmedal", medal: -1 });
            medallist.value = "none";
        }
        else {
            if (document.getElementById("mainvideo").getAttribute("name") != null) ipcRenderer.send("command", { cmd: "setmedal", medal: danmusettings["medal"] });
            medallist.value = danmusettings["medal"];
        }
    }
    else if (arg["cmd"] == "renewEmojis") {
        var emojibar = document.getElementById("emojibar");
        emojibar.innerHTML = '<select class="emojiselect" id="emojiselect"><option value="none" disabled="true">加载中...</option></select>';
        var emojidata = arg["data"];
        var emojiselect = document.getElementById("emojiselect");
        for (i in emojidata["data"]) {
            var x = emojidata["data"][i]["emoticons"];
            var newlist = document.createElement("div");
            if (i > 0) newlist.style.display = "none";
            newlist.className = "emojilist";
            newlist.id = "emojilist" + i.toString();
            for (j in x) {
                console.log(x[j]["emoticon_unique"]);
                var newitem = document.createElement("div");
                if (x[j]["perm"] == 0) {
                    newitem.className = "emojibox_off";
                    newitem.onclick = function () {
                        maketoast("权限不足", 1000);
                    };
                }
                else {
                    newitem.className = "emojibox";
                    newitem.id = x[j]["emoticon_unique"];
                    newitem.onclick = function () {
                        if (new Date().getTime() - emoji_senttime > 1000) {
                            ipcRenderer.send("command", { cmd: "sendemoji", emoji: this.id, roomid: document.getElementById("mainvideo").getAttribute("name"), style: danmusettings });
                            emoji_senttime = new Date().getTime();
                        }
                        else {
                            maketoast("操作过于频繁", 1000);
                        }
                    }
                }
                newitem.innerHTML = '<img src="./emoticons/' + x[j]["emoticon_unique"] + '.png" style="width: auto;height: auto;max-height:100%;max-width:100%;left: 50%;top: 50%; position: absolute;transform: translate3d(-50%,-50%,0);-webkit-transform: translate3d(-50%,-50%,0);" />';
                newlist.appendChild(newitem);
            }
            emojibar.appendChild(newlist);
            if (i > 0) emojiselect.innerHTML += '<option value="' + i.toString() + '">' + emojidata["data"][i]["pkg_name"] + '</option></select>';
            else emojiselect.innerHTML = '<option value="' + i.toString() + '">' + emojidata["data"][i]["pkg_name"] + '</option></select>';
        }
        emojiselect.onchange = function () {
            var emojilists = document.getElementsByClassName("emojilist");
            for (i in emojilists) {
                try {
                    if (this.value == emojilists[i].id.replace("emojilist", "")) emojilists[i].style.display = "block";
                    else emojilists[i].style.display = "none";
                }
                catch (e) {
                }
            }
        }
    }
});


function checkMsg(e) {
    if (e.keyCode == 13) {
        var edittext = document.getElementById("textedit");
        if (edittext.value == "") {
            e.returnValue = false;
            return;
        }
        console.log("sendMessage:" + edittext.value);
        roomid = document.getElementById("mainvideo").getAttribute("name");
        console.log(document.getElementById("mainvideo").getAttribute("name"));
        edittext.setAttribute("readonly", true);
        var msg = edittext.value;
        if (document.getElementById("mainvideo").getAttribute("name") != null) {
            if (danmusettings["transmode"] == 0) {
                var ax = 0;
                while (msg.length > 20) {
                    var mmsg = msg.substring(0, 20);
                    msg = msg.substring(20, msg.length);
                    setTimeout('ipcRenderer.send("command", { cmd: "sendmsg", text: "' + mmsg.replaceAll('\\', '\\\\') + '", roomid: roomid, style: danmusettings });document.getElementById("textedit").value="' + msg + '";', ax * 1000);
                    ax++;
                }
                setTimeout('ipcRenderer.send("command", { cmd: "sendmsg", text: "' + msg.replaceAll('\\', '\\\\') + '", roomid: roomid, style: danmusettings });document.getElementById("textedit").value="";document.getElementById("textedit").removeAttribute("readonly");', ax * 1000);

            }
            else {
                var ax = 0;
                while (msg.length > 18) {
                    var mmsg = msg.substring(0, 18);
                    msg = msg.substring(18, msg.length);
                    setTimeout('ipcRenderer.send("command", { cmd: "sendmsg", text: "【' + mmsg.replaceAll('\\', '\\\\') + '】", roomid: roomid, style: danmusettings });document.getElementById("textedit").value="' + msg + '";', ax * 1000);
                    ax++;
                }
                setTimeout('ipcRenderer.send("command", { cmd: "sendmsg", text: "【' + msg.replaceAll('\\', '\\\\') + '】", roomid: roomid, style: danmusettings });document.getElementById("textedit").value="";document.getElementById("textedit").removeAttribute("readonly")', ax * 1000);

            }
        }
        else {
            maketoast("未选择房间，无法发送弹幕", 1000);
            edittext.value = "";
            edittext.removeAttribute('readonly');
        }
        e.returnValue = false;
    }
}

function checkRoomid(e) {
    if (e.keyCode == 13) {
        var additem = document.getElementById("additem");
        roomid = document.getElementById("roomidedit").value;
        console.log(roomid);
        additem.className = "dditem";
        additem.innerHTML = "+";
        e.returnValue = false;
        var additem = document.getElementById("additem");
        var ddlist = document.getElementById("ddlist");
        var newitem = document.createElement("div");
        newitem.className = "dditem";
        newitem.id = new Date().getTime().toString();
        newitem.innerHTML = '<div class="loading"><span></span><span></span><span></span><span></span><span></span></div>';
        ddlist.insertBefore(newitem, additem);
        ipcRenderer.send('command', { cmd: "addroom", roomid: roomid, itemid: newitem.id });
    }
}

function maketoast(text, lasttime) {
    var toast = document.createElement("p");
    toast.innerHTML = text;
    toast.className = "toast";
    var timestamp = new Date().getTime().toString();
    toast.setAttribute('id', timestamp);
    toast.style.width = (text.length * 20).toString() + 'px';
    setTimeout("document.getElementById(" + timestamp + ").remove();", lasttime);
    document.body.appendChild(toast)
}