import mongoose from "mongoose";

const sesstionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// tự động xóa refreshToken khi hết hạn

sesstionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Sesstion = mongoose.model("Sesstion", sesstionSchema);

export default Sesstion;
