const mongoose = require("mongoose");
const emailListSchema = new mongoose.Schema({
  email: String,
});
const EmailListModel = mongoose.model("emailList", emailListSchema);
module.exports = EmailListModel;
