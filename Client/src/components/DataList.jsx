import React from 'react';
import './DataList.css';

const DataList = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="data-list-container">
            <h3>Data Points</h3>
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Open</th>
                            <th>High</th>
                            <th>Low</th>
                            <th>Close</th>
                            <th>Volume</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((point, index) => (
                            <tr key={index}>
                                <td>{new Date(point.date).toLocaleString()}</td>
                                <td>{point.open.toFixed(2)}</td>
                                <td>{point.high.toFixed(2)}</td>
                                <td>{point.low.toFixed(2)}</td>
                                <td>{point.close.toFixed(2)}</td>
                                <td>{point.volume.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataList;
