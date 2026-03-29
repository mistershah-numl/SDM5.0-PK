import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFormula extends Document {
  indexVersionId: mongoose.Types.ObjectId;
  formulaName: string;
  description: string;
  formulaExpression: string;
  pillarWeights: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const FormulaSchema = new Schema<IFormula>(
  {
    indexVersionId: { type: Schema.Types.ObjectId, ref: "IndexVersion", required: true },
    formulaName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    formulaExpression: { type: String, required: true },
    pillarWeights: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

FormulaSchema.index({ indexVersionId: 1 });

const Formula: Model<IFormula> =
  mongoose.models.Formula || mongoose.model<IFormula>("Formula", FormulaSchema);

export default Formula;
