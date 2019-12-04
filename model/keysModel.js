 class Key {
     constructor(date, id) {
         this.id = id;
         this.date = date;
     }
     get key() {
         return this.date + "_" + this.id;
     }
 }
 module.exports = Key;