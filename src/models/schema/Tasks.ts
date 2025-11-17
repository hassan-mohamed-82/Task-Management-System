import { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './auth/User';
import { IProject } from './project';

export type TaskStatus = 'Pending' | 'in_progress' | 'done' | 'Approved' | 'rejected';

export interface ITask extends Document {
  name: string;
  description?: string;
  projectId: Types.ObjectId | IProject;
  end_date?: Date;
  priority?: 'low' | 'medium' | 'high';
  recorde:String;
  file:String;
  status: TaskStatus;
  userId: Types.ObjectId | IUser;
  Depatment_id?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    name: { type: String, required: true },
    description: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    end_date: { type: Date },
    priority: { type:String, enum: ['low', 'medium', 'high'] },
    status: {
      type: String,
      enum: ['Pending', 'in_progress', 'done','Approved' ,'rejected'],
      default: 'Pending',
    },
    recorde:{ type: String },
    file:{ type: String },
    Depatment_id:{ type: Schema.Types.ObjectId, ref: 'Department' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  },
  { timestamps: true }
);

export const TaskModel = model<ITask>('Task', taskSchema);
