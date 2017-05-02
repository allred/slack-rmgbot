// purpose: POC for microsoft vision/describe 

const fs = require('fs')
const request = require('request')

function visionDescribe(path, callBack) {
  url_describe = 'https://eastus2.api.cognitive.microsoft.com/vision/v1.0/describe'
  url_describe = 'https://westus.api.cognitive.microsoft.com/vision/v1.0/describe'

  request.post({
    url: url_describe,
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': process.env.MS_COMPUTER_VISION_KEY,
    },
    form: {
    },
    multipart: [
      { body: fs.createReadStream(path) },
    ],
  }, function(error, response, body) {
    callBack(error, response, body)
  })
}

module.exports = {
  visionDescribe 
}
