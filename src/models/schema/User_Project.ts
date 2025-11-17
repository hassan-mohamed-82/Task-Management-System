import mongoose, { Schema, Document } from "mongoose";

export interface IUserProject extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  project_id: mongoose.Types.ObjectId;
  role?:'administrator' | 'Member' | 'viewer';
}

const UserProjectSchema = new Schema<IUserProject>(
  {
    email: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project_id: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    role: {
      type: String,
      enum: ["administrator", "Member", "viewer"],
      default: "Member",
    },
  },
  { timestamps: true }
);

export const UserProjectModel = mongoose.model<IUserProject>("User_Project", UserProjectSchema);
