/*global -W024 */
var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var uid = require("uid");
var fs = require("fs");
var path = require("path");
var app = express();
var data = {};

//static root
app.use(express.static("uploads"));
// for parsing application/json
app.use(bodyParser.json());
// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// multipart upload
app.use("/upload", setUploadFolder);
app.use(multipart());
app.post("/upload", saveData);


// index file
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/form.html");
});

// get uploaded files
app.get("/uploads/", function (req, res) {
    res.send(data);
});

app.get("/uploads/:key", function (req, res) {
    res.send(data[req.params.key] || {});
});

// delete uploaded files
app.delete("/uploads/", function (req, res) {
    data = {};
    
    res.send(data);
});

// delete uploaded files
app.delete("/uploads/:key", function (req, res) {
    if (data[req.params.key]) {
        delete data[req.params.key];
    }

    res.send(data);
});


start();


function setUploadFolder(req, res, next) {
    if (req.query.vin) {
        req.uid = req.query.vin;
    } else {
        req.uid =  uid(10);
    }
    next();
}

function saveData(req, res) {
    fs.writeFile("data.json", JSON.stringify(data), function (err) {
        if (err) {
            res.send("couldn't save data.json");
        }
        res.redirect("back");
    });

}

function multipart() {
    return multer({
        dest: "./uploads",
        rename: function (fieldname, filename) {
            return filename.replace(/\W+/g, "-").toLowerCase() + Date.now();
        },
        changeDest: function(dest, req) {
            var changedDest = path.join(dest, req.uid);
            if (!fs.existsSync(changedDest)) {
                fs.mkdirSync(changedDest);
            };
            return changedDest;
        },
        onFileUploadComplete: function (file, req) {
            if (!data[req.uid]) {
                data[req.uid] = [];
            }
            data[req.uid].push(path.basename(file.path));
        }
    });
}

function start() {
    fs.readFile("data.json", function (err, filedata) {
        if (err) {
            console.log("couldn't read data.json", err);
        }

        try {
            data = JSON.parse(filedata);
            startServer();
        } catch (e) {
            console.log("couldn't parse data.json", e);
        }
    });
}

function startServer() {
    var server = app.listen(process.env.PORT || 5000, function () {
        var host = server.address().address;
        var port = server.address().port;

        console.log("App listening at http://%s:%s", host, port);
    });
}
