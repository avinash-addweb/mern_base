import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
