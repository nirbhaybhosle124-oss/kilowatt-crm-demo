const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

let customersDB = [
  { id: 1, name: "Sarah Jenkins", email: "sarah@example.com", clientStore: "Coffee Co. Store", totalSpent: 420.00, orderCount: 4, lastOrder: "#KW-9082", status: "VIP" },
  { id: 2, name: "Alex Rivera", email: "alex@example.com", clientStore: "Luxury Lifestyle", totalSpent: 115.50, orderCount: 1, lastOrder: "#KW-9081", status: "Active" },
  { id: 3, name: "Maria Garcia", email: "maria@example.com", clientStore: "Coffee Co. Store", totalSpent: 280.00, orderCount: 3, lastOrder: "#KW-9075", status: "VIP" }
];

let activityLogs = [
  { id: 1, type: "KILOWOTT_CORE", message: "Kilowott Automation Engine initialized. Syncing WooCommerce webhooks.", timestamp: new Date().toLocaleTimeString() }
];

function calculateStatus(total) {
  if (total >= 400) return "Platinum";
  if (total >= 200) return "VIP";
  if (total >= 50) return "Active";
  return "New";
}

app.get('/api/customers', (req, res) => {
  const storeFilter = req.query.store;
  let filteredCustomers = customersDB;
  
  if (storeFilter && storeFilter !== 'ALL') {
    filteredCustomers = customersDB.filter(c => c.clientStore === storeFilter);
  }

  const totalRevenue = filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrders = filteredCustomers.reduce((sum, c) => sum + c.orderCount, 0);
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  res.json({
    success: true,
    customers: filteredCustomers,
    metrics: {
      totalRevenue,
      totalOrders,
      customerCount: filteredCustomers.length,
      avgOrderValue
    }
  });
});

app.get('/api/logs', (req, res) => {
  res.json({ success: true, logs: activityLogs });
});

app.post('/api/woocommerce/webhook/order-created', (req, res) => {
  const { name, email, amount, store } = req.body;
  const orderTotal = parseFloat(amount || (Math.floor(Math.random() * 150) + 50));
  const clientStore = store || "Coffee Co. Store";
  const customerName = name || "Daniel Boss";
  const customerEmail = email || "danielboss22@gmail.com";
  const orderId = `#KW-${Math.floor(1000 + Math.random() * 9000)}`;

  let customer = customersDB.find(c => c.email.toLowerCase() === customerEmail.toLowerCase() && c.clientStore === clientStore);
  
  if (customer) {
    customer.totalSpent += orderTotal;
    customer.orderCount += 1;
    customer.lastOrder = orderId;
    customer.status = calculateStatus(customer.totalSpent);
  } else {
    customer = {
      id: customersDB.length + 1,
      name: customerName,
      email: customerEmail,
      clientStore: clientStore,
      totalSpent: orderTotal,
      orderCount: 1,
      lastOrder: orderId,
      status: calculateStatus(orderTotal)
    };
    customersDB.unshift(customer);
  }

  activityLogs.unshift({
    id: activityLogs.length + 1,
    type: "WOO_WEBHOOK",
    message: `[${clientStore}] Order ${orderId} received from ${customerName} ($${orderTotal.toFixed(2)}). Status: '${customer.status}'.`,
    timestamp: new Date().toLocaleTimeString()
  });

  res.status(200).json({ success: true, message: "Kilowott CRM Order processed." });
});

app.post('/api/action/send-promo', (req, res) => {
  const { email } = req.body;
  activityLogs.unshift({
    id: activityLogs.length + 1,
    type: "MARKETING_AI",
    message: `Kilowott automated re-engagement campaign triggered for ${email}.`,
    timestamp: new Date().toLocaleTimeString()
  });
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kilowott CRM live at http://localhost:${PORT}`);
});