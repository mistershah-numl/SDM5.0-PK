import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISustainabilityIndex extends Document {
  indexVersionId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: 'environmental' | 'social' | 'economic';
  weight: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  order: number;
}

const SustainabilityIndexSchema = new Schema<ISustainabilityIndex>(
  {
    indexVersionId: { type: Schema.Types.ObjectId, ref: "IndexVersion", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { 
      type: String, 
      enum: ['environmental', 'social', 'economic'],
      required: true 
    },
    weight: { type: Number, required: true, min: 0, max: 100 },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, default: "%" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SustainabilityIndexSchema.index({ indexVersionId: 1, category: 1 });

const SustainabilityIndex: Model<ISustainabilityIndex> =
  mongoose.models.SustainabilityIndex ||
  mongoose.model<ISustainabilityIndex>("SustainabilityIndex", SustainabilityIndexSchema);

export default SustainabilityIndex;
