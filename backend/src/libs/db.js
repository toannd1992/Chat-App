import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION);
    console.log("Kết nối đến DB thành công");
  } catch (error) {
    console.error("Kết nối đến DB thất bại", error);
    process.exit(1);
  }
};
