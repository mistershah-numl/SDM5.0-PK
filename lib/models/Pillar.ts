import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPillar extends Document {
  indexVersionId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  weight: number;
  order: number;
}

const PillarSchema = new Schema<IPillar>(
  {
    indexVersionId: { type: Schema.Types.ObjectId, ref: "IndexVersion", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    weight: { type: Number, required: true, min: 0, max: 100, default: 1 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PillarSchema.index({ indexVersionId: 1, order: 1 });

const Pillar: Model<IPillar> =
  mongoose.models.Pillar || mongoose.model<IPillar>("Pillar", PillarSchema);

export default Pillar;
