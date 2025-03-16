import { Document, Schema, model, Types } from "mongoose";

export interface IComment extends Document {
  content: string;
  article: Types.ObjectId;
  author: Types.ObjectId;
  parentComment?: Types.ObjectId; // For nested comments/replies
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema(
  {
    content: { type: String, required: true },
    article: { type: Schema.Types.ObjectId, ref: "Article", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment" }, // Optional, for nested comments
  }, 
  { timestamps: true }
);

export const Comment = model<IComment>("Comment", commentSchema);