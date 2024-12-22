const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'clothing', 'accessories'],
    set: v => v.toLowerCase()
  },
  image: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add text index for search functionality
productSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to ensure category is lowercase
productSchema.pre('save', function(next) {
  if (this.category) {
    this.category = this.category.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema); 