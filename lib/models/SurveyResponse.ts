import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISurveyResponse extends Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  indexVersionId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  score: number;
  completedAt: Date;
}

const SurveyResponseSchema = new Schema<ISurveyResponse>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    indexVersionId: { type: Schema.Types.ObjectId, ref: "IndexVersion", required: true },
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    score: { type: Number, required: true, min: 0, max: 5 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SurveyResponseSchema.index({ userId: 1, companyId: 1, indexVersionId: 1 });
SurveyResponseSchema.index({ companyId: 1 });
SurveyResponseSchema.index({ completedAt: 1 });

const SurveyResponse: Model<ISurveyResponse> =
  mongoose.models.SurveyResponse ||
  mongoose.model<ISurveyResponse>("SurveyResponse", SurveyResponseSchema);

export default SurveyResponse;
