import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDimension extends Document {
  pillarId: mongoose.Types.ObjectId;
  indexVersionId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  weight: number;
  order: number;
}

const DimensionSchema = new Schema<IDimension>(
  {
    pillarId: { type: Schema.Types.ObjectId, ref: "Pillar", required: true },
    indexVersionId: { type: Schema.Types.ObjectId, ref: "IndexVersion", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    weight: { type: Number, required: true, min: 0, max: 100 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DimensionSchema.index({ pillarId: 1, order: 1 });
DimensionSchema.index({ indexVersionId: 1 });

const Dimension: Model<IDimension> =
  mongoose.models.Dimension || mongoose.model<IDimension>("Dimension", DimensionSchema);

export default Dimension;
