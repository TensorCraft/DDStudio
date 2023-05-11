const fs = require("fs");
const https = require("https");
const http = require("http");

class downloader {
    constructor() { };
    downloadFile(uri, dest) {
        return new Promise((resolve, reject) => {
            // 确保dest路径存在
            const file = fs.createWriteStream(dest);

            if (uri.startsWith("https")) {
                https.get(uri, (res) => {
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
            }
            else {
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
            }
        });
    }

    downloadFileAsync(uri, dest) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);

            if (uri.startsWith("https")) {
                https.get(uri, (res) => {
                    if (res.statusCode !== 200) {
                        reject(response.statusCode);
                        return;
                    }

                    res.on('end', () => {
                    });

                    file.on('finish', () => {
                        file.close(resolve);
                    }).on('error', (err) => {
                        fs.unlink(dest);
                        reject(err.message);
                    })

                    res.pipe(file);
                });
            }
            else {
                http.get(uri, (res) => {
                    if (res.statusCode !== 200) {
                        reject(response.statusCode);
                        return;
                    }

                    res.on('end', () => {
                    });

                    file.on('finish', () => {
                        file.close(resolve);
                    }).on('error', (err) => {
                        fs.unlink(dest);
                        reject(err.message);
                    })

                    res.pipe(file);
                });
            }
        });
    }
}
module.exports = new downloader();