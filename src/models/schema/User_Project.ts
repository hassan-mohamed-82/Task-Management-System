import mongoose, { Schema, Document } from "mongoose";

export interface IUserProject extends Document {
  user_id: mongoose.Types.ObjectId;
  email: string;
  project_id: mongoose.Types.ObjectId;
  role?:'Membercanapprove' | 'Member' | 'teamlead';
}

const UserProjectSchema = new Schema<IUserProject>(
  {
    email: {
      type: String,
      required: true,
    },
    user_id: {
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
      enum: ["teamlead", "Member", "Membercanapprove","admin"],
      default: "Member",
    },
  },
  { timestamps: true }
);

export const UserProjectModel = mongoose.model<IUserProject>("User_Project", UserProjectSchema);
