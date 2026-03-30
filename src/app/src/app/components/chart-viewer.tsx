import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartViewerProps {
  data?: any[];
  chartType?: 'line' | 'bar' | 'area';
  title?: string;
  xAxisKey?: string;
  yAxisKeys?: { key: string; color: string; name: string }[];
  chartData?: {
    data: any[];
    chartType: 'line' | 'bar' | 'area';
    xAxisKey: string;
    yAxisKeys: { key: string; color: string; name: string }[];
    title?: string;
  };
}

export function ChartViewer({ data, chartType, title, xAxisKey, yAxisKeys, chartData }: ChartViewerProps) {
  // Support both direct props and chartData object
  const finalData = chartData?.data || data || [];
  const finalChartType = chartData?.chartType || chartType || 'line';
  const finalTitle = chartData?.title || title;
  const finalXAxisKey = chartData?.xAxisKey || xAxisKey || '';
  const finalYAxisKeys = chartData?.yAxisKeys || yAxisKeys || [];

  const renderChart = () => {
    switch (finalChartType) {
      case 'line':
        return (
          <LineChart data={finalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={finalXAxisKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px'
              }} 
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {finalYAxisKeys.map((yAxis) => (
              <Line 
                key={yAxis.key}
                type="monotone" 
                dataKey={yAxis.key} 
                stroke={yAxis.color} 
                name={yAxis.name}
                strokeWidth={2}
                dot={{ fill: yAxis.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={finalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={finalXAxisKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px'
              }} 
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {finalYAxisKeys.map((yAxis) => (
              <Bar 
                key={yAxis.key}
                dataKey={yAxis.key} 
                fill={yAxis.color} 
                name={yAxis.name}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={finalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={finalXAxisKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px'
              }} 
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {finalYAxisKeys.map((yAxis) => (
              <Area 
                key={yAxis.key}
                type="monotone" 
                dataKey={yAxis.key} 
                stroke={yAxis.color} 
                fill={yAxis.color}
                fillOpacity={0.6}
                name={yAxis.name}
              />
            ))}
          </AreaChart>
        );
    }
  };

  return (
    <div className="w-full h-full bg-white p-6 flex flex-col">
      {finalTitle && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{finalTitle}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}