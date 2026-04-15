import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  credits: { type: Number, default: 50 },
  dailyCreditsUsed: { type: Number, default: 0 },
  lastCreditReset: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Reset daily credits if new day
userSchema.methods.resetDailyCreditsIfNeeded = function () {
  const now = new Date();
  const last = new Date(this.lastCreditReset);
  const isNewDay =
    now.getDate() !== last.getDate() ||
    now.getMonth() !== last.getMonth() ||
    now.getFullYear() !== last.getFullYear();

  if (isNewDay) {
    this.credits = 50;
    this.dailyCreditsUsed = 0;
    this.lastCreditReset = now;
  }
};

const User = mongoose.model('User', userSchema);
export default User;