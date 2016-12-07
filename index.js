var AWS = require('aws-sdk');
var fs = require('fs');
var cv = require('opencv');
var http = require('http');
var request = require('request');

var download = function(uri, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream('/tmp/image.jpg')).on('finish', function() {
        fs.readFile('/tmp/image.jpg', function (err, data) {
          if (err) {
            callback(err);
            return;
          }
          var image = new Buffer(data, 'binary');
          cv.readImage(image, function(err, im){
            if (err) {
              callback(err);
              return;
            }
            if (im.width() < 1 || im.height() < 1) {
              callback('Image has no size');
              return;
            }

            im.detectObject('haarcascade_frontalcatface_extended.xml', {}, function(err, faces) {
              if (err) {
                callback(err.stack);
                return;
              }

              for (var i = 0; i < faces.length; i++){
                var face = faces[i];
                console.log('faces', JSON.stringify(face, null, 2));
                im.ellipse(face.x + face.width / 2, face.y + face.height / 2, face.width / 2, face.height / 2);
              }

              var imageData = im.toBuffer().toString('base64');
              callback(null, 'data:' + res.headers['content-type'] + ';base64,' + imageData);
            });
          });
        });
    });
  });
};

exports.handle = function(event, ctx, callback) {
  try {
    var url = event.imageUrl;
    download(url, callback)
  } catch (e) {
    callback(e.stack);
  }
};
