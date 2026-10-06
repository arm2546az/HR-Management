import React, { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';

interface HighchartsComponentProps {
  options: Highcharts.Options;
  height?: string | number;
  className?: string;
}

export const HighchartsComponent: React.FC<HighchartsComponentProps> = ({
  options,
  height = 320,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Highcharts.Chart | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Default Highcharts styling options to match VN Group theme
      const mergedOptions: Highcharts.Options = {
        credits: { enabled: false },
        chart: {
          style: {
            fontFamily: "'Sarabun', sans-serif",
          },
          backgroundColor: 'transparent',
          ...options.chart,
        },
        colors: [
          '#064a8b', // VN blue
          '#022247', // VN navy
          '#c3a138', // VN gold
          '#10b981', // Emerald
          '#f59e0b', // Amber
          '#8b5cf6', // Violet
          '#06b6d4', // Cyan
        ],
        ...options,
      };

      chartRef.current = Highcharts.chart(containerRef.current, mergedOptions);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [options]);

  return (
    <div
      ref={containerRef}
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
      className={className}
    />
  );
};
