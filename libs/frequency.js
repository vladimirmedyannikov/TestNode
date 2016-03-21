console.log("LOLO");
var _ = require("lodash");
module.exports = {
  count : function(){
    console.log("test fuction count");
  },
  getCount:function(str) {
    str = str.replace('\n',' ');
    var regularExpr = /[^$A-Za-zА-Яа-я0-9ёЁ]+/ig;
    var mas = {};
    var letters = str.split(regularExpr)
    .forEach(function(letter){
      mas[letter] = (mas[letter] || 0) + 1;
    })
    var arrayResult = [];
    /*for (var i = 0; i < letters.length; i++) {
      var letter = letters[i];
      var count = mas[letter];
      if (!count){
        count = 0;
      }
      count += 1;
      mas[letter] = count;
    }*/


    /*for (var i = 0; i < mas.length; i++) {
      var letter = mas[i];
      var count = mas[letter];
      mas2.push({
        count:count,
        word:letter
      });
    }*/

    _.forEach(mas, function(count, letter){
      arrayResult.push({
        count:count,
        word:letter
      });

      arrayResult = _.filter(arrayResult, function(letter){
        return letter.word.length > 3;
      });

      //arrayResult = _.orderBy(arrayResult, "count");
      //arrayResult = arrayResult.reverse();
      arrayResult.sort(function(a, b){
        if (a.count > b.count){
          return -1;
        }
        if (a.count < b.count){
            return 1;
        } else return 0;
      });

      arrayResult = arrayResult.slice(0,10);

    });
    return arrayResult;
  }
}
