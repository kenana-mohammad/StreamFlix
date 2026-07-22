const mongoose = require("mongoose");

const castSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    image: {
      type: String,
      default: "",
    },

    biography: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// Cascade Delete Middleware
// ==========================================
castSchema.pre('findOneAndDelete', async function() {
    const castId = this.getQuery()['_id'];
    
    if (castId) {
        await mongoose.model('ContentCast').deleteMany({ castId: castId });
    }
});

module.exports = mongoose.model("Cast", castSchema);