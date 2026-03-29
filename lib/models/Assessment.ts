import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  indexVersionId: mongoose.Types.ObjectId;
  overallScore: number;
  pillarScores: Array<{
    pillarId: mongoose.Types.ObjectId;
    score: number;
  }>;
  dimensionScores: Array<{
    dimensionId: mongoose.Types.ObjectId;
    score: number;
  }>;
  status: 'completed' | 'in_progress' | 'abandoned';
  completedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    indexVersionId: { type: Schema.Types.ObjectId, ref: "IndexVersion", required: true },
    overallScore: { type: Number, default: 0, min: 0, max: 5 },
    pillarScores: [
      {
        pillarId: { type: Schema.Types.ObjectId, ref: "Pillar" },
        score: { type: Number, default: 0 },
      },
    ],
    dimensionScores: [
      {
        dimensionId: { type: Schema.Types.ObjectId, ref: "Dimension" },
        score: { type: Number, default: 0 },
      },
    ],
    status: { type: String, enum: ['completed', 'in_progress', 'abandoned'], default: 'in_progress' },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AssessmentSchema.index({ userId: 1, companyId: 1, indexVersionId: 1 });
AssessmentSchema.index({ companyId: 1, status: 1 });
AssessmentSchema.index({ completedAt: -1 });

const Assessment: Model<IAssessment> =
  mongoose.models.Assessment ||
  mongoose.model<IAssessment>("Assessment", AssessmentSchema);

export default Assessment;
