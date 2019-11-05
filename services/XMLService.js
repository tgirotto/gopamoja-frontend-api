const xml2js = require('xml2js');

const XMLService = {
  parse: (string) => {
    console.log(string);
    return new Promise((resolve, reject) => {
      // if(typeof string !== 'string') {
      //   reject('Invalid input');
      // }

      const parser = new xml2js.Parser();
      parser.parseString(string, function (err, result) {
          if(err) {
            reject(err);
          } else {
            resolve(result);
          }
      });
    });
  }
}

module.exports = XMLService;
