const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscriberSchema = mongoose.Schema(
  {
    userTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    userFrom: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true } //만든 날짜와 업데이트한 날짜가 표시가된다.
);

const Subscriber = mongoose.model("Subscriber", videoSchema);

module.exports = { Subscriber };
