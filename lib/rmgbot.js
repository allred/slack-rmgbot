// to run this bot:
// NODE_ENV=test TOKEN_RMGBOT=sometoken npm start

const aws = require('aws-sdk')
const botkit = require('botkit')
const exif_parser = require('exif-parser')
const fs = require('fs')
const ms = require('./microsoft')
const request = require('request')
const tmp = require('tmp')
const vision = require('@google-cloud/vision')({
  email: process.env.VISION_EMAIL,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.VISION_PROJECT_ID
})

aws.config.update({region: 'us-east-1'})
var rekog = new aws.Rekognition()

var controller = botkit.slackbot({
  //debug: false,
  //log: 7,
  json_file_store: '/var/tmp/slack-rmgbot',
  status_optout: true
})

rmgbot = controller.spawn({
  token: process.env.TOKEN_RMGBOT,
  incoming_webhook: {
    url: process.env.WEBHOOK_RMGBOT
  }
})
rmgbot.startRTM()

function webhook(bot, msg) {
  bot.sendWebhook({
    channel: '#general',
    text: JSON.stringify(msg)
  }, function(err, res) {
  })
}

function msVisonDescribe(bot, data) {
  url = "https://eastus2.api.cognitive.microsoft.com/vision/v1.0/describe"
  result = {}
  webhook(bot, result)
}

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

          var parser = exif_parser.create(fs.readFileSync(path))
          var result = parser.parse()
          console.log({exif: result})
          webhook(bot, {exif: result})

          // Google Vision

          var types = [
            'label'
          ]
          vision.detect(path, types, function(err, detections, apiResponse) {
            if (err) { console.log('err:', err) }
            console.log('gvision:', detections)
            //bot.replyPublic(message, 'detections:', JSON.stringify(detections))
            webhook(bot, {gvision: detections})
          })

          // Amazon Rekognition

          var params_dl = {
            Image: {
              Bytes: fs.readFileSync(path)
              //Bytes: fs.readFileSync(path).toString('base64')
            },
          }
          rekog.detectLabels(params_dl, function(err, data) {
            if (err) { console.log(err, err.stack) }
            else {
              var data_amz = {amz: data}
              console.log(data)
              webhook(bot, {amz: data})
            }
          })

          // Microsoft Vision

          ms.visionDescribe(path, function(err, resp, body) {
            console.log({ms: body})
            webhook(bot, {ms: JSON.parse(body) })
          })

          cleanupCallback()
        })
      })
    })
  }
}

controller.on('message_received', function(bot, message) {
  rmgCheck(bot, message)
})
