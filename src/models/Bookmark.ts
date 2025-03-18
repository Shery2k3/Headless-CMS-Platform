import { Document, Schema, model, Types } from "mongoose";

export interface IBookmark extends Document {
  article: Types.ObjectId;
  user: Types.ObjectId;
}

const bookmarkSchema = new Schema(
  {
    article: { type: Schema.Types.ObjectId, ref: "Article", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Bookmark = model<IBookmark>("Bookmark", bookmarkSchema);