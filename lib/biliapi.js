/**
 * @file: biliapi.js
 * @description: biliapi.js
 * @package: biliapi
 * @author: Blockers (Blockers.xyz@gmail.com)
 * -----
 * @last-modified: 2022-09-11
 * -----
 */

const axios = require('axios');
const Config = require('../config');
const xlog = require('./xlog');

function Biliapi(cookie) {

    var cookies = cookie;
    if(cookie.indexOf(";") == -1)
        return null;
    var uid = cookies.substring(11, cookies.indexOf(";"));
    var header = {
        'Content-Type': 'application/json',
        'Accept': 'application / json, text / javascript, * / *; q = 0.01',
        'Accept-Language': 'zh - CN, zh;q = 0.8, zh - TW;q = 0.7, zh - HK;q = 0.5, en - US;q = 0.3, en;q = 0.2',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Cookie': cookies,
        'Host': 'api.bilibili.com',
        'Origin': 'https://space.bilibili.com',
        'Referer': 'https://space.bilibili.com/',
        'TE': 'Trailers',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0'
    };
    var liveheader = {
        'Content-Type': 'application/json',
        'Accept': 'application / json, text / javascript, * / *; q = 0.01',
        'Accept-Language': 'zh - CN, zh;q = 0.8, zh - TW;q = 0.7, zh - HK;q = 0.5, en - US;q = 0.3, en;q = 0.2',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': cookies,
        'Host': 'api.live.bilibili.com',
        'Origin': 'https://live.bilibili.com',
        'Referer': 'https://live.bilibili.com/',
        'TE': 'Trailers',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0'
    };

    this.getFollowlivelist = async function () {
        var ret = null;
        // https://api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/FeedList?page=1&pagesize=100
        await axios({
            method: 'get',
            url: 'https://api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/FeedList',
            params: {
                page: 1,
                pagesize: 100
            },
            headers: liveheader
        })
            .then(res => {
                if(res.data["code"] == 0)
                    ret = res.data["data"]["list"];
                //return;
            })
            .catch(error => {
                return;
            })
        return ret;
    };

    this.getFollowlist = async function () {
        full_list = [];
        var options = {
            hostname: 'api.bilibili.com',
            path: '/x/relation/stat?jsonp=jsonp&vmid=' + uid,
            method: 'GET',
            headers: header
        };

        await axios({
            method: 'get',
            url: "https://api.bilibili.com/x/relation/stat?jsonp=jsonp&vmid=" + uid,
            headers: header
        })
            .then(async res => {
                var num = Math.ceil(res.data["data"]["following"]/50);
                var idx = 0;
                var mlist = [];
                for(var i = 1;i <= num;i ++) {
                    await axios({
                        method: 'get',
                        url: "https://api.bilibili.com/x/relation/followings?ps=50&vmid=383944094&pn=" + i.toString(),
                        headers: header
                    })
                        .then(res => {
                            var x = res.data["data"]["list"];
                            for(let j = 0; j< x.length; j++) {
                                mlist[idx++] = {"uid":x[j]["mid"], "uname":x[j]["uname"],"sign":x[j]["sign"],"face":x[j]["face"]};
                            }
                            return;
                        })
                        .catch(error => {
                            return;
                        });
                }
                full_list = list;
                return;
            })
            .catch(error => {
                return;
            });
        
        if(full_list == []) return null;
        return full_list;
    };

    this.live_sendMsg = async function (text, roomid, style) {
        roomid = await getFullRoomid(roomid);
        var ret = null;
        await axios({
            method: 'post',
            url: 'https://api.live.bilibili.com/msg/send',
            params: {
                color: style["color"],
                fontsize: '25',
                mode: style["mode"],
                msg: text,
                rnd: '1597750331',
                roomid: roomid,
                bubble: '0',
                csrf_token: cookies.substring(cookies.indexOf("bili_jct") + 9),
                csrf: cookies.substring(cookies.indexOf("bili_jct") + 9)
            },
            headers: liveheader
        })
            .then(res => {
                ret = res.data;
                return;
            })
            .catch(error => {
                return;
            })
        return ret;
    };

    this.live_sendEmoji = async function (emoji, roomid, style) {
        roomid = await getFullRoomid(roomid);
        var ret = null;
        await axios({
            method: 'post',
            url: 'https://api.live.bilibili.com/msg/send',
            params: {
                color: 16777215,
                fontsize: '25',
                mode: style["mode"],
                msg: emoji,
                rnd: '1663510109',
                roomid: roomid,
                bubble: '0',
                dm_type: 1,
                csrf_token: cookies.substring(cookies.indexOf("bili_jct") + 9),
                csrf: cookies.substring(cookies.indexOf("bili_jct") + 9)
            },
            headers: liveheader
        })
            .then(res => {
                ret = res.data;
                return;
            })
            .catch(error => {
                return;
            })
        return ret;
    };

    this.live_enterRoom = async function (roomid) {
        roomid = getFullRoomid(roomid);
        var ret = null;
        await axios({
            method: 'post',
            url: 'https://api.live.bilibili.com/xlive/web-room/v1/index/roomEntryAction',
            params: {
                room_id: roomid,
                platform: "pc",
                visit_id: "",
                csrf_token: cookies.substring(cookies.indexOf("bili_jct") + 9),
                csrf: cookies.substring(cookies.indexOf("bili_jct") + 9)
            },
            headers: liveheader
        })
            .then(res => {
                if (res.data["code"] == 0) ret = 0;
                return;
            })
            .catch(error => {
                return;
            });
        return ret;
    };

    this.getStreamURL = async function (roomid) {
        roomid = await getFullRoomid(roomid);
        var ret = null;
        await axios({
            method: 'get',
            url: "https://api.live.bilibili.com/room/v1/Room/playUrl",
            params: {
                cid: roomid,
                qn: 0,
                platform: "web"
            },
            headers: liveheader
        })
            .then(res => {
                if (res.data["code"] == 0) ret = res.data["data"]["durl"][0]["url"];;
                return;
            })
            .catch(error => {
                return;
            });
        return ret;
    };

    this.live_setMedal = async function (medalid) {
        var ret = false;
        await axios({
            method: 'post',
            url: 'https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear',
            params: {
                medal_id: medalid,
                csrf_token: cookies.substring(cookies.indexOf("bili_jct") + 9),
                csrf: cookies.substring(cookies.indexOf("bili_jct") + 9)
            },
            headers: liveheader
        })
            .then(res => {
                if(res.data["code"] == 0)
                    ret = true;
                return;
            })
            .catch(err => {
                return;
            });
        return ret;
    };

    this.live_Medal_takeoff = async function () {
        var ret = false;
        await axios({
            method: 'post',
            url: 'https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/take_off',
            params: {
                csrf_token: cookies.substring(cookies.indexOf("bili_jct") + 9),
                csrf: cookies.substring(cookies.indexOf("bili_jct") + 9)
            },
            headers: liveheader
        })
            .then(res => {
                if(res.data["code"] == 0)
                    ret = true;
                return;
            })
            .catch(err => {
                return;
            });
        return ret;
    };

    this.live_getRoominfo = async function (roomid) {
        var ret = null;
        roomid = await getFullRoomid(roomid);
        if(roomid == null) return null;
        await axios({
            method: 'get',
            url: 'https://api.live.bilibili.com/room/v1/Room/get_info',
            params: {
                room_id: roomid
            },
            headers: liveheader
        })
            .then(res => {
                if(res.data["code"] == 0) {
                    ret = {
                        title: res.data["data"]["title"],
                        cover: res.data["data"]["user_cover"],
                        start_time: res.data["data"]["live_time"],
                        keyframe: res.data["data"]["keyframe"],
                        livetag: res.data["data"]["parent_area_name"],
                        liveclass: res.data["data"]["area_name"],
                        onlive: res.data["data"]["live_status"],
                        uid: res.data["data"]["uid"]
                    }
                }
                return;
            })
            .catch(err => {
                return;
            });
        return ret;
    };

    this.getProfile = async function (uid) {
        var ret = null;
        await axios({
            method: 'get',
            url: 'https://api.bilibili.com/x/web-interface/card',
            params: {
                photo: true,
                mid: uid
            },
            headers: header
        })
            .then(res => {
                if(res.data["code"] == 0) {
                    ret = {
                        uname: res.data["data"]["card"]["name"],
                        face: res.data["data"]["card"]["face"],
                        sign: res.data["data"]["card"]["sign"]
                    };
                }
                return;
            })
            .catch(err => {
                return;
            });
        return ret;
    };

    this.getMedalList = async function () {
        var ret = [];
        var num = 10;
        var idx = 0;
        for(var i = 1;i <= (num + 9)/10;i ++) {
            await axios({
                method: 'get',
                url: 'https://api.live.bilibili.com/xlive/app-ucenter/v1/user/GetMyMedals',
                params: {
                    page_size: 10,
                    page: i
                },
                headers: liveheader
            })
                .then(res => {
                    if(res.data["code"] == 0) {
                        num = res.data["data"]["count"];
                        for(j in res.data["data"]["items"]) {
                            var x = res.data["data"]["items"][j];
                            ret[idx++] = {mid: x["medal_id"], mname: x["medal_name"], level: x["level"], lighted: x["is_lighted"], roomid:x["roomid"], uname: x["uname"], uid:x["target_id"]};
                        }
                    }
                    return;
                })
                .catch(err => {
                    return;
                });
        }
        if(ret == []) return null;
        return ret;
    }

    this.checkcookie = async function() {
        var ret = false;
        await axios({
            method: 'get',
            url: 'https://api.vc.bilibili.com/session_svr/v1/session_svr/single_unread',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application / json, text / javascript, * / *; q = 0.01',
                'Accept-Language': 'zh - CN, zh;q = 0.8, zh - TW;q = 0.7, zh - HK;q = 0.5, en - US;q = 0.3, en;q = 0.2',
                'Connection': 'keep-alive',
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                'Cookie': cookies,
                'Host': 'api.vc.bilibili.com',
                'Origin': 'https://space.bilibili.com',
                'Referer': 'https://space.bilibili.com/',
                'TE': 'Trailers',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0'
            }
        })
            .then(res => {
                if(res.data["code"] == 0) ret = true;
                return;
            })
            .catch(err => {
                return;
            });
        return ret;
    }

    this.getEmojis = async function(roomid) {
        //https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id=
        roomid = await getFullRoomid(roomid);
        console.log(roomid);
        var ret = {};
        await axios({
            method: 'get',
            url: 'https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons',
            params: {
                room_id: roomid,
                platform: "pc"
            },
            headers: liveheader
        })
            .then(res => {
                if(res.data["code"] == 0)
                    ret = res.data["data"];
                return;
            })
            .catch(err => {
                return; 
            });
        return ret;
    }

    this.getDanmuStyles = async function(roomid) {
        //https://api.live.bilibili.com/xlive/web-room/v1/dM/GetDMConfigByGroup?room_id=
        var ret = {};
        await axios({
            method: 'get',
            url: 'https://api.live.bilibili.com/xlive/web-room/v1/dM/GetDMConfigByGroup',
            params: {
                room_id: roomid
            },
            headers: liveheader
        })
            .then(res => {
                if(res.data["code"] == 0)
                    ret = res.data;
                return;
            })
            .catch(err => {
                return; 
            });
        return ret;
    }

    async function getFullRoomid (roomid) {
        var ret = null;
        await axios({
            method: 'get',
            url: 'https://api.live.bilibili.com/room/v1/Room/get_info',
            params: {
                room_id: roomid
            }
        })
            .then(res => {
                if(res.data["code"] == 0)
                    ret = res.data["data"]["room_id"];
                return;
            })
            .catch(err => {
                return;
            });
        return ret;
    }
};
module.exports = Biliapi;