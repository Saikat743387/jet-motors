import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['open', 'replied', 'closed'], default: 'open', index: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

supportTicketSchema.index({ userId: 1, createdAt: -1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
