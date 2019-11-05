const request = require('request');

const HttpService = {
  post: (url, body) => {
    return new Promise((resolve, reject) => {
      if(typeof url !== 'string') {
        reject('Invalid url');
      }

      const obj = {
        url: url,
        method: 'POST',
        json: body
      };

      request.post(obj, (error, res, body) => {
        if(error) {
          reject(error);
        }

        resolve(body);
      })
    });
  }
}

module.exports = HttpService;
