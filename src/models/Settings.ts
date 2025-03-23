import { Document, Schema, model, Types } from 'mongoose';

export interface ISettings extends Document {
  featuredArticle: Types.ObjectId;
  topPickArticles: Types.ObjectId[];
}

const SettingsSchema = new Schema({
  featuredArticle: { type: Schema.Types.ObjectId, ref: 'Article' },
  topPickArticles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
});

export const Settings = model<ISettings>('Settings', SettingsSchema);