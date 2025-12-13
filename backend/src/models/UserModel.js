import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avartarUrL: {
      type: String, //url hình ảnh cloud
    },
    avatarId: {
      type: String, // lưu id để xóa ảnh trên cloud
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
