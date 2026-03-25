const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, sparse: true, lowercase: true, trim: true },
    phone: { type: String, sparse: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['consumer', 'vendor', 'rider', 'admin'], default: 'consumer' },
    state: { type: String, enum: ['plateau', 'bauchi', 'kaduna', ''], default: '' },
    lga: { type: String, default: '' },
    address: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspendedReason: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
