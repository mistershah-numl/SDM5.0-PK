import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompany extends Document {
  name: string;
  industry: string;
  size: "micro" | "small" | "medium" | "large";
  region: string;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    industry: { type: String, required: true },
    size: {
      type: String,
      enum: ["micro", "small", "medium", "large"],
      required: true,
    },
    region: { type: String, required: true },
    contactEmail: { type: String, required: true, lowercase: true, index: true },
  },
  { timestamps: true }
);

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

export default Company;
