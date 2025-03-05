import mongoose from "mongoose";
import 'dotenv/config';
import colors from "colors";

const MONGODB_URI = process.env.MONGODB_URI as string;

export const connectDB = async () => {
  try {
    const connection = await mongoose.connect(MONGODB_URI);
    // give more info about the connection
    console.log(`Connected to ${connection.connection.name} at ${connection.connection.host}`.yellow.bold);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}