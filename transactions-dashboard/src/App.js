import React, { useState } from 'react';
import TransactionTable from './TransactionTable';
import Statistics from './Statistics';

const App = () => {
    const [month, setMonth] = useState(3); // Default March

    return (
        <div>
            <h1>Transactions Dashboard</h1>
            <TransactionTable month={month} />
            <Statistics month={month} />
        </div>
    );
};

export default App;
