import { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './auth/User';

export interface IProject extends Document {
  name: string;
  description: string;
  createdBy: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const ProjectModel = model<IProject>('Project', projectSchema);
