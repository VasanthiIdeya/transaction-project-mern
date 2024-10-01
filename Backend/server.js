// server.js
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/transactions_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Mongoose schema and model
const transactionSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    dateOfSale: Date,
    category: String,
    sold: Boolean,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// API to initialize the database
app.get('/api/init', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        await Transaction.insertMany(response.data);
        res.json({ message: 'Database initialized with seed data' });
    } catch (error) {
        res.status(500).json({ message: 'Error initializing database', error });
    }
});

// API to list transactions with search and pagination
app.get('/api/transactions', async (req, res) => {
    const { month, search, page = 1, perPage = 10 } = req.query;
    const regex = new RegExp(search, 'i');
    const startOfMonth = new Date(`2023-${month}-01`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);

    try {
        const transactions = await Transaction.find({
            dateOfSale: { $gte: startOfMonth, $lt: endOfMonth },
            $or: [
                { title: regex },
                { description: regex },
                { price: regex }
            ]
        })
        .skip((page - 1) * perPage)
        .limit(parseInt(perPage));

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions', error });
    }
});

// API to get statistics
app.get('/api/statistics', async (req, res) => {
    const { month } = req.query;
    const startOfMonth = new Date(`2023-${month}-01`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);

    try {
        const totalSales = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $group: { _id: null, totalSaleAmount: { $sum: '$price' }, totalItems: { $sum: 1 }, totalSold: { $sum: { $cond: ['$sold', 1, 0] } } } }
        ]);

        const notSoldItems = await Transaction.countDocuments({
            dateOfSale: { $gte: startOfMonth, $lt: endOfMonth },
            sold: false
        });

        res.json({
            totalSaleAmount: totalSales[0]?.totalSaleAmount || 0,
            totalSoldItems: totalSales[0]?.totalSold || 0,
            totalNotSoldItems: notSoldItems,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching statistics', error });
    }
});

// API to get bar chart data (price ranges)
app.get('/api/barchart', async (req, res) => {
    const { month } = req.query;
    const startOfMonth = new Date(`2023-${month}-01`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);

    try {
        const priceRanges = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $bucket: {
                groupBy: '$price',
                boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
                default: '901-above',
                output: { count: { $sum: 1 } }
            } }
        ]);

        res.json(priceRanges);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bar chart data', error });
    }
});

// API to get pie chart data (categories)
app.get('/api/piechart', async (req, res) => {
    const { month } = req.query;
    const startOfMonth = new Date(`2023-${month}-01`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);

    try {
        const categoryData = await Transaction.aggregate([
            { $match: { dateOfSale: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.json(categoryData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pie chart data', error });
    }
});

// Combined API to fetch all data
app.get('/api/combined', async (req, res) => {
    try {
        const [transactions, statistics, barChartData, pieChartData] = await Promise.all([
            axios.get('/api/transactions'),
            axios.get('/api/statistics'),
            axios.get('/api/barchart'),
            axios.get('/api/piechart'),
        ]);

        res.json({ transactions, statistics, barChartData, pieChartData });
    } catch (error) {
        res.status(500).json({ message: 'Error combining data', error });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
