import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIReport extends Document {
  surveyResponseId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  executiveSummary: string;
  strengthsAnalysis: string;
  weaknessesAnalysis: string;
  roadmapRecommendations: string;
  nextBestActions: string[];
  generatedAt: Date;
  model: string;
}

const AIReportSchema = new Schema<IAIReport>(
  {
    surveyResponseId: { type: Schema.Types.ObjectId, ref: "SurveyResponse", required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    executiveSummary: { type: String, default: "" },
    strengthsAnalysis: { type: String, default: "" },
    weaknessesAnalysis: { type: String, default: "" },
    roadmapRecommendations: { type: String, default: "" },
    nextBestActions: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
    model: { type: String, default: "" },
  },
  { timestamps: true }
);

AIReportSchema.index({ surveyResponseId: 1 });
AIReportSchema.index({ companyId: 1 });

const AIReport: Model<IAIReport> =
  mongoose.models.AIReport || mongoose.model<IAIReport>("AIReport", AIReportSchema);

export default AIReport;
