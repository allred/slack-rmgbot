// to run this bot:
// NODE_ENV=test TOKEN_RMGBOT=sometoken npm start

const botkit = require('botkit')
const fs = require('fs')
const request = require('request')
const tmp = require('tmp')
const vision = require('@google-cloud/vision')({
  email: process.env.VISION_EMAIL,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.VISION_PROJECT_ID
})

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
  token: process.env.TOKEN_RMGBOT,
  incoming_webhook: {
    url: process.env.WEBHOOK_RMGBOT
  }
})
rmgbot.startRTM()

function rmgCheck(bot, message) {
  console.log(message)
  if (message.type == 'file_public' && message.ts) {
    bot.api.files.info({"file": message.file_id}, function(err, response) {
      //console.log(response)
      var url_download = response.file.url_private_download
      var path_vision = ''
      tmp.file({postfix: '.jpg'}, function _tempFileCreated(err, path, fd, cleanupCallback) {
        if (err) { throw err }
        var file = fs.createWriteStream(path)

        // download the image

        var stream = request({
          followAllRedirects: true,
          headers: {
            Authorization: 'Bearer ' + process.env.TOKEN_RMGBOT
          },
          uri: url_download
        }, function (error, response, body) {
          //console.log('status: ', response && response.statusCode)
        }).pipe(file)

        // vision api

        stream.on('finish', function() {
          var types = [
            'label'
          ]
          vision.detect(path, types, function(err, detections, apiResponse) {
            console.log('err:', err)
            console.log('detections:', detections)
            //bot.replyPublic(message, 'detections:', JSON.stringify(detections))
            bot.sendWebhook({
              channel: '#general',
              text: JSON.stringify(detections)
            }, function(err, res) {
            })
          })
          cleanupCallback();
        })
      })


    })
  }
}

controller.on('message_received', function(bot, message) {
  rmgCheck(bot, message)
})
