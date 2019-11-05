const TransactionService = {
  generateReferenceNumber : (n) => {
    var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

    if(n > max) {
      return this.generateReferenceNumber(max) + this.generateReferenceNumber(n - max);
    }

    max = Math.pow(10, n+add);
    var min = max/10;
    var number = Math.floor( Math.random() * (max - min + 1) ) + min;
    return ("" + number).substring(add);
  },
  calculateServiceCharge: (amount) => {
    if(typeof amount !== 'number') {
      throw "Given figure is not a number";
    }

    if(amount >= 0 && amount <= 19999) {
      return amount * 0.08;
    } else if(amount >= 20000 && amount <= 29999) {
      return amount * 0.06;
    } else if(amount >= 30000 && amount <= 59999) {
      return amount * 0.05;
    } else {
      return amount * 0.04;
    }
  }
}

module.exports = TransactionService;
