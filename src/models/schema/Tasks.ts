
import mongoose, { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './auth/User';
import { IProject } from './project';

export type TaskStatus = 'Pending' | 'in_progress' | 'Approved' | 'rejected' | 'waiting_for_approve' | 'null';

export interface ITask extends Document {
  name: string;
  description?: string;
  projectId: Types.ObjectId | IProject;
  end_date?: Date;
  start_date?: Date;
  priority?: 'low' | 'medium' | 'high';
  recorde: string;
  file: string;
  status: TaskStatus;
  is_active: boolean;
  userId: Types.ObjectId | IUser;
  Depatment_id?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    name: { type: String, required: true },
    description: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    start_date: { type: Date },
    end_date: { type: Date },
    is_active: { type: Boolean, default: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ["Pending", 'in_progress', 'waiting_for_approve', 'Approved', 'rejected', 'null'],
      default: 'Pending',
    },
    recorde: { type: String, default: '' },
    file: { type: String, default: '' },
    Depatment_id: { type: Schema.Types.ObjectId, ref: 'Department' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  },
  {
    timestamps: true,
  }
);

export const TaskModel = model<ITask>('Task', taskSchema);
