import { Document, Schema, model, Types } from "mongoose";

export interface IArticle extends Document {
  title: string;
  content: string;
  timeToRead: string;
  category: string;
  src?: string;
  author: Types.ObjectId;
  videoArticle?: boolean;
}

const articleSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  timeToRead: { type: String, required: true },
  category: { type: String, required: true },
  src: { type: String, },
  videoArticle: { type: Boolean, default: false },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export const Article = model<IArticle>("Article", articleSchema);
