import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIndexVersion extends Document {
  name: string;
  description: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const IndexVersionSchema = new Schema<IIndexVersion>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const IndexVersion: Model<IIndexVersion> =
  mongoose.models.IndexVersion ||
  mongoose.model<IIndexVersion>("IndexVersion", IndexVersionSchema);

export default IndexVersion;
