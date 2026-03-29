import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "company" | "user";
  companyId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "company", "user"],
      default: "user",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
  },
  { timestamps: true }
);

// Remove duplicate index - unique already creates index
// UserSchema.index({ email: 1 });
UserSchema.index({ companyId: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
