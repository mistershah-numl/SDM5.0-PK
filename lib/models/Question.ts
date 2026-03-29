import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion extends Document {
  dimensionId: mongoose.Types.ObjectId;
  pillarId: mongoose.Types.ObjectId;
  indexVersionId: mongoose.Types.ObjectId;
  text: string;
  helpText: string;
  weight: number;
  scaleMin: number;
  scaleMax: number;
  order: number;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    dimensionId: { type: Schema.Types.ObjectId, ref: "Dimension", required: true },
    pillarId: { type: Schema.Types.ObjectId, ref: "Pillar", required: true },
    indexVersionId: { type: Schema.Types.ObjectId, ref: "IndexVersion", required: true },
    text: { type: String, required: true },
    helpText: { type: String, default: "" },
    weight: { type: Number, required: true, min: 0, default: 1 },
    scaleMin: { type: Number, default: 0 },
    scaleMax: { type: Number, default: 5 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

QuestionSchema.index({ dimensionId: 1, order: 1 });
QuestionSchema.index({ pillarId: 1 });
QuestionSchema.index({ indexVersionId: 1 });

const Question: Model<IQuestion> =
  mongoose.models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;
