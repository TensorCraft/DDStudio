const https = require("https");

var url = "https://api.live.bilibili.com/room/v1/Room/playUrl?cid=13682068&qn=0&platform=web";
https.get(url, (response) => {
    let data = '';

    response.on('data', (chunk) => {
        data += chunk;
    });

    response.on('end', () => {
        json = JSON.parse(data);
        console.log(json["data"]["durl"][0]["url"]);
        return;
    });

}).on("error", (error) => {
    console.log("Err:" + error.message);
});