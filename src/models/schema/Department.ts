import mongoose from "mongoose";

export interface DepartmentDocument extends mongoose.Document {
  name: string;
  createdBy: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new mongoose.Schema<DepartmentDocument>(
  {
    name: { type: String, required: true },   // << تم إزالة unique
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const DepartmentModel = mongoose.model<DepartmentDocument>(
  "Department",
  DepartmentSchema
);
