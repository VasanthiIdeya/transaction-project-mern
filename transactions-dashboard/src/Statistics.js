import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Statistics = ({ month }) => {
    const [stats, setStats] = useState({});

    useEffect(() => {
        fetchStatistics();
    }, [month]);

    const fetchStatistics = async () => {
        const response = await axios.get(`http://localhost:5000/api/statistics?month=${month}`);
        setStats(response.data);
    };

    return (
        <div>
            <h2>Statistics</h2>
            <ul>
                <li>Total Sale Amount: ${stats.totalSaleAmount}</li>
                <li>Total Sold Items: {stats.totalSoldItems}</li>
                <li>Total Not Sold Items: {stats.totalNotSoldItems}</li>
            </ul>
        </div>
    );
};

export default Statistics;
