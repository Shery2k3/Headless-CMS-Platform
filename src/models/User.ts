import { Document, Schema, model } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  name: {
    firstName: string;
    lastName: string;
  };
  email: string;
  password: string;
  admin?: boolean;
  superAdmin?: boolean;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema({
  name: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  },
  email: { type: String, required: true },
  admin: { type: Boolean, default: false },
  superAdmin: { type: Boolean, default: false },
  password: { type: String, required: true },
});

userSchema.pre("save", async function (next) {
  //? If password is not modified, skip this middleware (hashing)
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (password: string) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    return false;
  }
};

export const User = model<IUser>("User", userSchema);
