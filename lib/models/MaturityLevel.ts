import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMaturityLevel extends Document {
  indexVersionId: mongoose.Types.ObjectId;
  level: number;
  name: string;
  description: string;
  minScore: number;
  maxScore: number;
  color: string;
}

const MaturityLevelSchema = new Schema<IMaturityLevel>(
  {
    indexVersionId: { type: Schema.Types.ObjectId, ref: "IndexVersion", required: true },
    level: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    minScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    color: { type: String, default: "#6b7280" },
  },
  { timestamps: true }
);

MaturityLevelSchema.index({ indexVersionId: 1, level: 1 });

const MaturityLevel: Model<IMaturityLevel> =
  mongoose.models.MaturityLevel ||
  mongoose.model<IMaturityLevel>("MaturityLevel", MaturityLevelSchema);

export default MaturityLevel;
