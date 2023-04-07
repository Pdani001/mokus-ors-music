module.exports = {
  CurrentDate(msg = true){
    return (new Date()).toLocaleString("hu-HU")+(msg ? "> " : "");
  },
  Random(min, max) {
    if(min > max){
      min = max;
    }
    return Math.floor(
      Math.random() * (max - min) + min
    );
  }
};