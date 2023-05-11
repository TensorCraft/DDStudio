const https = require('https');
const http = require('http');
const path = require("path")
const fs = require("fs");

const followlist = JSON.parse(fs.readFileSync('./cache/list.json', 'utf8'));
// type: 0 标准模式：提醒直播 1 特别关心模式：提醒直播和动态 3 不提醒

var n = followlist.length - 1;
run(0);

function run(it) {
    it = it%n;
    query(followlist[it]["uid"], it);
    setTimeout(() => {
        run(it + 1);
    }, 1000);
}

function downloadFileAsync(uri, dest) {
    return new Promise((resolve, reject) => {
        // 确保dest路径存在
        const file = fs.createWriteStream(dest);

        http.get(uri, (res) => {
            if (res.statusCode !== 200) {
                reject(response.statusCode);
                return;
            }

            file.on('finish', () => {
                file.close(resolve);
            }).on('error', (err) => {
                fs.unlink(dest);
                reject(err.message);
            })

            res.pipe(file);
        });
    });
}

function query(uid, idx) {
    var url = "https://api.bilibili.com/x/space/acc/info?mid=" + uid.toString();
    https.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            json = JSON.parse(data);
            if (json["data"]["live_room"]["liveStatus"] == 1) {
                if(followlist[idx]["status"] == 0) {
                    downloadFileAsync(json["data"]["face"],"./cache/icons/" + uid.toString() + ".jpg");
                    process.send({ "cmd": "notification", "data": { title: json["data"]["name"] + "正在直播:", body: json["data"]["live_room"]["title"],icon: path.join(__dirname,"./cache/icons/" + uid.toString() + ".jpg")} });
                    followlist[idx]["status"] = 1;
                    console.log(followlist[idx]["status"]);
                }
            }
            else {
                //console.log("changed");
                //console.log(json["data"]["live_room"]);
                followlist[idx]["status"] = 0;
            }
            return;
        });

    }).on("error", (error) => {
        console.log("Err:" + error.message);
    });
}