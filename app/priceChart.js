import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend, LineElement, TimeScale } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Zoom from 'chartjs-plugin-zoom';
import 'chartjs-adapter-moment';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Zoom, TimeScale);

const PriceChart = ({ chartLabels, chartData }) => {
    return (
        <Line
            type="line"
            data={{
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Market Orders Price',
                        data: chartData,
                        fill: false,
                        borderColor: "grey",
                        backgroundColor: "grey",
                    }
                ]
            }}
            options={{
                scales: {
                    x: {
                        type: "time",
                        time: {
                            tooltipFormat: "YYYY-MM-DD HH:mm",
                        },
                        min: chartLabels[0],
                        max: chartLabels[chartLabels.length - 1]
                    }
                },
                responsive: true,
                plugins: {
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true,
                            },
                            mode: 'xy',
                        },
                        pan: {
                            enabled: true,
                            mode: 'xy',
                        },
                    },
                },
            }}
        />
    );
};

export default PriceChart;