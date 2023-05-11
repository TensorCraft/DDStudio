var http = require('http');
var fs = require('fs');//引入文件读取模块 
const path = require("path");
const xlog = require('./lib/xlog');


var server = http.createServer(function (req, res) {
    var url = req.url;
    var file = "." + url;
    //console.log("Get:" + url);
    fs.readFile(path.resolve(__dirname, file), function (err, data) {
        if (err) {
            res.writeHeader(404, {
                'content-type': 'text/html;charset="utf-8"'
            });
            res.write('<h1>404错误</h1><p>你要找的页面不存在</p>');
            res.end();
        } else {
            if(url.endsWith(".html")) {
                res.writeHeader(200, {
                    'content-type': 'text/html;charset="utf-8"'
                });
            }
            else if(url.endsWith(".js")) {
                res.writeHeader(200, {
                    'content-type': 'application/x-javascript;charset="utf-8"'
                });
            }
            else if(url.endsWith(".css")) {
                res.writeHeader(200, {
                    'content-type': 'text/css;charset="utf-8"'
                });
            }
            else if(url.endsWith(".jpg")) {
                res.writeHeader(200, {
                    'content-type': 'image/jpeg'
                });
            }
            else {
                res.writeHeader(200, {
                    'content-type': 'text/html;charset="utf-8"'
                });
            }
            res.write(data);
            xlog.info("GET " + url.toString());
            res.end();
        }
    });
}).listen(11451);

process.on('message', function(msg) {
    if(msg == "stop") {
        server.close();
        console.log("server stopped");
    }
});

while(!server.listening) ;
xlog.info('Listening on port 11451:');