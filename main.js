const {app, BrowserWindow} = require('electron');
const path = require('path')
const url = require('url')
var express = require('express');
var appExp = express();
var http = require('http').Server(appExp);
var io = require('socket.io')(http);
var fs = require('fs');
const SocketIOFile = require('socket.io-file');
io.path('/src')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

appExp.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
/*appExp.get('/src/jquery/jquery-3.3.1.min.js', function(req, res){
  res.sendFile(__dirname + '/src/jquery/jquery-3.3.1.min.js');
});*/

appExp.use(express.static("src"));  
appExp.get('/socket.io-file-client.js', (req, res, next) => {
  return res.sendFile(__dirname + '/node_modules/socket.io-file-client/socket.io-file-client.js');
});

io.on('connection', function(socket){
  console.log('a user connected');
  var uploader = new SocketIOFile(socket, {
    // uploadDir: {			// multiple directories
    // 	music: 'data/music',
    // 	document: 'data/document'
    // },
    uploadDir: 'data',							// simple directory
    accepts: ['audio/mpeg', 'audio/mp3'],		// chrome and some of browsers checking mp3 as 'audio/mp3', not 'audio/mpeg'						// 4 MB. default is undefined(no limit)
    chunkSize: 1310720,							// default is 10240(1KB)
    transmissionDelay: 0,						// delay of each transmission, higher value saves more cpu resources, lower upload speed. default is 0(no delay)
    overwrite: true 							// overwrite file if exists, default is true.
  });
  uploader.on('start', (fileInfo) => {
    console.log('Start uploading');
    console.log(fileInfo);
  });
  uploader.on('stream', (fileInfo) => {
    console.log(`${fileInfo.wrote} / ${fileInfo.size} byte(s)`);
  });
  uploader.on('complete', (fileInfo) => {
    console.log('Upload Complete.');  
    console.log(fileInfo.name);
    console.log(__dirname)
    //create a folder and rename it and move the file in the folder
    if (!fs.existsSync(__dirname + '/current/')) {
      fs.mkdirSync(__dirname + '/current/')
  }
    fs.rename(fileInfo.uploadDir, __dirname + '/current/' + fileInfo.data.name + "." +fileInfo.name.split(".").slice(-1).pop()); 
    
  });
  uploader.on('error', (err) => {
    console.log('Error!', err);
  });
  uploader.on('abort', (fileInfo) => {
    console.log('Aborted: ', fileInfo);
  });
});


function createWindow () {
  
  // Create the browser window.
  win = new BrowserWindow({width: 720, height: 720, icon: "src/img/synthesizer-512.png"})

  // and load the index.html of the app.
  win.loadURL("http://localhost:8080");

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

http.listen(8080, function(){
  console.log('listening on *:8080');
});