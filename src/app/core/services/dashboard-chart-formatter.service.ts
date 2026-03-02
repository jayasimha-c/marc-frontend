import { Injectable } from "@angular/core";
import { ChartOptions } from "../../shared/models/chart.model";
import { ApexAxisChartSeries } from "ng-apexcharts";
import { CommonApxChartComponent } from "../../shared/components/common-apx-chart/common-apx-chart.component";

@Injectable({ providedIn: 'root' })
export class DashboardChartFormatterService {

    constructor() { }

    public camelCaseToTitleCase(str: string): string {
        let value = str.replace(/([a-z])([A-Z])/g, '$1 $2');
        value = value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        return value;
    }

    public formatMMMYY(date: string): string {
        // Native vanilla JS date parsing to avoid moment.js dependency 
        // Assumes input date in 'YYYY-MM' format
        if (!date) return '';
        const parts = date.split('-');
        if (parts.length < 2) return date;
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
        return d.toLocaleString('default', { month: 'short' });
    }

    public updateDonutChart(chart: CommonApxChartComponent, chartOptions: Partial<ChartOptions>, data: any, isArrayObject?: boolean) {
        if (!data) {
            chartOptions.labels = [];
            chartOptions.series = [];
            chart.updateChart();
            return;
        }
        if (isArrayObject) {
            //data is an array of objects
            const categories = data.map((item: any) => this.camelCaseToTitleCase(item[0]));
            const values = data.map((item: any) => item[1]);
            chartOptions.labels = categories;
            chartOptions.series = values;
        } else {
            //data is a simple object
            const categories = Object.keys(data).map(key => this.camelCaseToTitleCase(key));
            const values = Object.values(data) as number[];
            chartOptions.labels = categories;
            chartOptions.series = values;
        }
        chart.updateChart();
    }

    public updatePieChartWithRawData(chart: CommonApxChartComponent, chartOptions: Partial<ChartOptions>, data: any) {
        if (!data || data.length === 0) {
            chartOptions.labels = [];
            chartOptions.series = [];
            chart.updateChart();
            return;
        }

        const categories: string[] = [];
        const values: number[] = [];

        data.forEach((item: any) => {
            categories.push(item.status || item.type || item.name || "Unknown");
            values.push(item.count || item.value || 0);
        });

        chartOptions.labels = categories;
        chartOptions.series = values;
        chart.updateChart();
    }

    public updateStackedBarChart(chart: CommonApxChartComponent, chartOptions: Partial<ChartOptions>, data: any, parseDate: boolean) {
        const apiData = data;
        let months = Object.keys(apiData);
        if (months.length === 0) return;
        const firstMonthKey = months[0];
        const requestTypes = Object.keys(apiData[firstMonthKey]);

        const series = requestTypes.map(type => {
            const mappedData = months.map(month => apiData[month][type] || 0);
            return { name: type, data: mappedData };
        });

        if (parseDate) {
            months = months.map(month => this.formatMMMYY(month));
        }

        chartOptions.series = series;
        if (!chartOptions.xaxis) chartOptions.xaxis = {};
        chartOptions.xaxis.categories = months;
        chart.updateChart();
    }

    public updateHorizontalBarChart(chart: CommonApxChartComponent, chartOptions: Partial<ChartOptions>, data: any) {
        const categories = Object.keys(data);
        const values = Object.values(data) as number[];
        if (!chartOptions.xaxis) chartOptions.xaxis = {};
        chartOptions.xaxis.categories = categories;

        if (chartOptions.series && chartOptions.series.length > 0) {
            const first = (chartOptions.series as ApexAxisChartSeries)[0];
            first.data = values;
        } else {
            chartOptions.series = [{ name: 'Data', data: values }];
        }
        chart.updateChart();
    }

    public updateLineBarChartWithRawData(chart: CommonApxChartComponent, chartOptions: Partial<ChartOptions>, data: any, parseDate: boolean) {
        if (!data || !Array.isArray(data)) {
            chartOptions.series = [];
            if (!chartOptions.xaxis) chartOptions.xaxis = {};
            chartOptions.xaxis.categories = [];
            chart.updateChart();
            return;
        }
        const seriesData: any[] = [];
        const xaxisCategories: any[] = [];

        data.forEach((item: any) => {
            xaxisCategories.push(parseDate ? this.formatMMMYY(item[0]) : item[0]);
            seriesData.push(item[1] || 0);
        });

        if (chartOptions.series && chartOptions.series.length > 0) {
            const first = (chartOptions.series as ApexAxisChartSeries)[0];
            first.data = seriesData;
        } else {
            chartOptions.series = [{ name: 'Data', data: seriesData }];
        }

        if (!chartOptions.xaxis) chartOptions.xaxis = {};
        chartOptions.xaxis.categories = xaxisCategories;
        chart.updateChart();
    }

    public updateLineBarChart(chart: CommonApxChartComponent, chartOptions: Partial<ChartOptions>, data: any, parseDate: boolean) {
        if (!data) {
            chartOptions.series = [];
            if (!chartOptions.xaxis) chartOptions.xaxis = {};
            chartOptions.xaxis.categories = [];
            chart.updateChart();
            return;
        }
        const seriesData: any[] = [];
        const xaxisCategories: any[] = [];

        Object.entries(data).forEach(([key, value]) => {
            xaxisCategories.push(parseDate ? this.formatMMMYY(key) : key);
            seriesData.push(value || 0);
        });

        if (!chartOptions.series || !Array.isArray(chartOptions.series) || chartOptions.series.length === 0) {
            chartOptions.series = [{ name: 'Data', data: seriesData }];
        } else {
            const first = (chartOptions.series as ApexAxisChartSeries)[0];
            first.data = seriesData;
        }

        if (!chartOptions.xaxis) {
            chartOptions.xaxis = {};
        }
        chartOptions.xaxis.categories = xaxisCategories;
        chart.updateChart();
    }

    public updateDoubleLineBarChart(chart: CommonApxChartComponent, chartOptions: Partial<ChartOptions>, data: any, parseDate: boolean) {
        const seriesFirstData: any[] = [];
        const seriesSecondData: any[] = [];
        const xaxisCategories: any[] = [];

        data?.forEach((item: any) => {
            xaxisCategories.push(parseDate ? this.formatMMMYY(item[0]) : item.month);
            seriesFirstData.push(item.newViolationsCount || 0);
            seriesSecondData.push(item.resolvedViolationsCount || 0);
        });

        if (chartOptions.series && chartOptions.series.length >= 2) {
            const first = (chartOptions.series as ApexAxisChartSeries)[0];
            first.data = seriesFirstData;
            const second = (chartOptions.series as ApexAxisChartSeries)[1];
            second.data = seriesSecondData;
        }

        if (!chartOptions.xaxis) chartOptions.xaxis = {};
        chartOptions.xaxis.categories = xaxisCategories;
        chart.updateChart();
    }

    // Add other bar formatters as needed (updateUserBasedDoubleLineBarChart, updateUSerBasedDepartmentBarChart)
}
