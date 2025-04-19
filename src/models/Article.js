"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Article = void 0;
var mongoose_1 = require("mongoose");
var articleSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    timeToRead: { type: String, required: true },
    category: { type: String, required: true },
    src: { type: String },
    videoArticle: { type: Boolean, default: false },
    postedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    author: { type: String, default: "Anonymous" },
    timesViewed: { type: Number, default: 0 },
}, { timestamps: true });
exports.Article = (0, mongoose_1.model)("Article", articleSchema);
