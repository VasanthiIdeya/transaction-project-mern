import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TransactionTable = () => {
    const [transactions, setTransactions] = useState([]);
    const [search, setSearch] = useState('');
    const [month, setMonth] = useState('3'); // Default March
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchTransactions();
    }, [search, month, page]);

    const fetchTransactions = async () => {
        const response = await axios.get(`http://localhost:5000/api/transactions?month=${month}&page=${page}&search=${search}`);
        setTransactions(response.data);
    };

    return (
        <div>
            <h2>Transactions</h2>
            <select onChange={(e) => setMonth(e.target.value)}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                ))}
            </select>
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
            />
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Date of Sale</th>
                        <th>Category</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(transaction => (
                        <tr key={transaction._id}>
                            <td>{transaction.title}</td>
                            <td>{transaction.description}</td>
                            <td>{transaction.price}</td>
                            <td>{new Date(transaction.dateOfSale).toLocaleDateString()}</td>
                            <td>{transaction.category}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
            <button onClick={() => setPage(page + 1)}>Next</button>
        </div>
    );
};

export default TransactionTable;
