import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  featuredArticle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article"
  },
  topPickArticles: [{
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article"
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  }]
});

export const Settings = mongoose.model("Settings", settingsSchema);