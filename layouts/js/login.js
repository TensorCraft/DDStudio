/* 
Reference:
哔哩哔哩登陆api及流程:
* https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/login/login_action/QR.md#%E7%94%B3%E8%AF%B7%E4%BA%8C%E7%BB%B4%E7%A0%81URL%E5%8F%8A%E6%89%AB%E7%A0%81%E5%AF%86%E9%92%A5%EF%BC%88web%E7%AB%AF%EF%BC%89
QRcode.js api:
* https://www.runoob.com/w3cnote/javascript-qrcodejs-library.html
*/
const {ipcRenderer} = require('electron')


function saveAccount(tokens) {
    cookies = tokens.replace("&gourl=http%3A%2F%2Fwww.bilibili.com","").replaceAll("&","; ").substring(0,tokens.length-2); // 将http请求格式的数据转化为cookies格式（“a=b&b=c” ==> "a=b; c=d"）
    ipcRenderer.sendSync('login-message', {method : "QR", data: cookies});
}

function checkLogin(authtoken) {
    var Loginstatus = new XMLHttpRequest();
    Loginstatus.open("POST", "http://passport.bilibili.com/qrcode/getLoginInfo", true);
    Loginstatus.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    Loginstatus.send("oauthKey=" + authtoken);
    Loginstatus.onreadystatechange = () => {
        if (Loginstatus.readyState == 4 && Loginstatus.status == 200) {
            var data = JSON.parse(Loginstatus.responseText);
            var Logininfo = JSON.parse(Loginstatus.responseText);
            if((typeof Logininfo["data"]) == "number") {
                if (Logininfo["data"] == -5) { // -5表示已经扫描二维码，但是未确认
                    console.log("uesr scanned");
                    statushint = document.getElementById("sthint");
                    statushint.innerHTML = "已扫描，请确认";
                    statushint.style.color = "#00ff00";
                }
                setTimeout(function () {
                    checkLogin(authtoken);
                }, 300);
            }
            else {
                if (Logininfo["data"]["url"].startsWith("https://passport.biligame.com/crossDomain?")) {
                    // 这里可以不用判断的，因为data中不是数字只有这一种情况，但是预防万一，这里再判断下
                    console.log("Login success!");
                    tokens = Logininfo["data"]["url"].replace("https://passport.biligame.com/crossDomain?", "");
                    Logined = true;
                    statushint = document.getElementById("sthint");
                    statushint.innerHTML = "登陆成功";
                    statushint.style.color = "#00ff00";
                    saveAccount(tokens);
                }
                else {
                    setTimeout(function () {
                        checkLogin(authtoken);
                    }, 300);
                }
            }
            
        }
    }
}

function makeCode() {
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', "https://passport.bilibili.com/qrcode/getLoginUrl", true);
    httpRequest.send();
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4) {
            if (httpRequest.status == 200) {
                var TokenJson = JSON.parse(httpRequest.responseText);
                var qrcode = new QRCode(document.getElementById("qrcode"), {
                    width: 180,
                    height: 180,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                });
                // 180s二维码token失效，刷新页面重新获取
                setTimeout(function () {
                    location.reload();
                }, 180000);
                qrcode.makeCode(TokenJson["data"]["url"]);
                authtoken = TokenJson["data"]["oauthKey"];
                console.log("waiting for logining");
                checkLogin(authtoken); // 本来想通过while循环检测登陆状态，但是由于js单线程队列原因，二维码会显示不出来QwQ
            }
            else {
                var qrcode = new QRCode(document.getElementById("qrcode"), {
                    width: 180,
                    height: 180,
                    colorDark: "#ff0000",
                    colorLight: "#ffffff",
                });
                qrcode.makeCode("broken"); // TODO:将内容为broken的无效二维码替换为一个裂开的二维码图标表示加载二维码失败
                alert("加载二维码失败！");
            }
        }
    };

}

window.onload = function () {
    makeCode();
}
function showModal() {
    var modal = document.getElementById("modal");
    modal.style.display = "block";
    document.getElementById("modal").onclick = function () {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function submitText() {
    var text = document.getElementById("cookie_input");
    ipcRenderer.sendSync('login-message', {method : "cookie", data: text.value});
    showLoading();
    var modal = document.getElementById("modal");
    modal.style.display = "none";
}

function showLoading() {
    document.getElementById('loading-overlay').style.display = 'block';
}