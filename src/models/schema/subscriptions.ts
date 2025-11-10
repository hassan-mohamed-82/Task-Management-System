import  mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    PaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    websites_created_count : { type: Number, default: 0 }, 
    websites_remaining_count: { type: Number, default: 0 }, 
    status: { type: String, enum: ["active", "expired"], default: "active" }

}, { timestamps: true });

export const SubscriptionModel = mongoose.model('Subscription', SubscriptionSchema);