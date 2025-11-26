import mongoose, { Schema } from "mongoose";

export interface RejectedReson extends Document {
    reason: string;
    createdBy: mongoose.Schema.Types.ObjectId;
    points: number;
}

const RejectdResonSchema = new Schema<RejectedReson> ({
    reason: { type: String, required: true },
    points: { type: Number, required: true },
     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export const RejectedReson = mongoose.model<RejectedReson>('RejectedReson', RejectdResonSchema);