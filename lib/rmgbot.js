// to run this bot:
// NODE_ENV=test TOKEN_RMGBOT=sometoken npm start

const botkit = require('botkit')
const fs = require('fs')
const request = require('request')
const tmp = require('tmp')

var controller = botkit.slackbot({
  //debug: false,
  //log: 7,
  json_file_store: '/var/tmp/slack-rmgbot',
  status_optout: true
})

var channels_valid = [
  'C3S6NK3EF', // general g1
]

rmgbot = controller.spawn({
  token: process.env.TOKEN_RMGBOT
})
rmgbot.startRTM()

function rmgCheck(bot, message) {
  console.log(message)
  if (message.type == 'file_public' && message.ts) {
    bot.api.files.info({"file": message.file_id}, function(err, response) {
      console.log(response)
      var url_download = response.file.url_private_download
      tmp.file({postfix: '.jpg'}, function _tempFileCreated(err, path, fd, cleanupCallback) {
        if (err) { throw err }
        console.log("File: ", path)
        console.log("fd: ", fd)
        console.log(url_download)
        var file = fs.createWriteStream(path)

        request({
          followAllRedirects: true,
          headers: {
            Authorization: 'Bearer ' + process.env.TOKEN_RMGBOT
          },
          uri: url_download
        }, function (error, response, body) {
          console.log('err: ', error)
          console.log('status: ', response && response.statusCode)
          //console.log(body)
        }).pipe(file)

        //cleanupCallback();
      })
    })
  }
}

controller.on('message_received', function(bot, message) {
  rmgCheck(bot, message)
})
