const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['generated', 'sent', 'paid'],
    default: 'generated'
  },
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  billingDetails: {
    timestamp: Date,
    paymentMethod: String
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema); 