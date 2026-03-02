import { Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, ElementRef, OnDestroy, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { ChartOptions } from '../../models/chart.model';

import ApexCharts from 'apexcharts';

export type ChartSize = 'sm' | 'md' | 'lg' | 'auto';

/** Default chart heights per size preset */
const CHART_HEIGHTS: Record<ChartSize, number | undefined> = {
  sm: 180,
  md: 270,
  lg: 370,
  auto: undefined,
};

@Component({
    standalone: false,
    selector: 'common-apx-chart',
    templateUrl: './common-apx-chart.component.html',
    styleUrls: ['./common-apx-chart.component.css']
})
export class CommonApxChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

    @ViewChild('apxChartElement', { static: false }) apxChartElement!: ElementRef;

    @Input() chartOptions!: Partial<ChartOptions>;
    @Input() loading: boolean = false;
    @Input() error: string = '';
    @Input() size: ChartSize = 'md';

    @Input() hasAction: boolean = false;
    @Input() actionLabel: string = 'View Details';
    @Input() actionIcon: string = 'right';
    @Input() customClass: string = '';

    @Output() cardClick = new EventEmitter<void>();
    @Output() actionClick = new EventEmitter<void>();

    theme: string = 'light';
    isMaximized = false;
    private originalChartHeight: any;
    private chartInstance: ApexCharts | null = null;

    ngOnInit(): void { }

    ngAfterViewInit(): void {
        if (!this.loading && !this.error) {
            setTimeout(() => this.initializeChart(), 100);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['chartOptions'] && !changes['chartOptions'].firstChange && !this.loading) {
            setTimeout(() => {
                if (this.chartInstance) {
                    this.updateChart();
                } else {
                    this.initializeChart();
                }
            }, 100);
        }
        if (changes['loading'] && !changes['loading'].currentValue && !this.error) {
            setTimeout(() => {
                if (!this.chartInstance) {
                    this.initializeChart();
                } else {
                    this.updateChart();
                }
            }, 100);
        }
    }

    ngOnDestroy(): void {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    }

    private initializeChart(): void {
        if (!this.apxChartElement?.nativeElement || !this.chartOptions) return;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const sizeHeight = CHART_HEIGHTS[this.size];
        const options: any = {
            ...this.chartOptions,
            chart: {
                ...this.chartOptions.chart,
                height: sizeHeight || this.chartOptions.chart?.height || 270,
                background: 'transparent',
                fontFamily: 'inherit',
                toolbar: { show: false },
            },
            // Hide built-in title — we use our own card header
            title: { text: undefined },
            subtitle: { text: undefined },
            theme: { mode: this.theme },
            grid: {
                borderColor: '#f0f0f0',
                strokeDashArray: 3,
                ...this.chartOptions.grid,
            },
        };

        if (!options.series || (Array.isArray(options.series) && options.series.length === 0)) {
            options.noData = {
                text: 'No data available',
                align: 'center',
                verticalAlign: 'middle',
                style: { color: '#bfbfbf', fontSize: '14px', fontFamily: 'inherit' },
            };
        }

        this.chartInstance = new ApexCharts(this.apxChartElement.nativeElement, options);
        this.chartInstance.render();
    }

    getAntIcon(chartType: string): string {
        if (!chartType) return 'line-chart';
        const map: Record<string, string> = {
            line: 'line-chart', bar: 'bar-chart', pie: 'pie-chart',
            donut: 'pie-chart', heatmap: 'heat-map', radialBar: 'dashboard',
            area: 'area-chart',
        };
        return map[chartType] || 'line-chart';
    }

    onActionClick(): void {
        this.actionClick.emit();
    }

    updateChart(): void {
        if (!this.chartInstance) {
            this.initializeChart();
            return;
        }

        const sizeHeight = CHART_HEIGHTS[this.size];
        setTimeout(() => {
            if (this.chartInstance && this.chartOptions) {
                this.chartInstance.updateOptions({
                    chart: {
                        height: sizeHeight || this.chartOptions.chart?.height || 270,
                    },
                    xaxis: { categories: this.chartOptions.xaxis?.categories || [] },
                    theme: { mode: this.theme },
                }, false, false);
                this.chartInstance.updateSeries(this.chartOptions.series || [], true);
            }
        }, 100);
    }

    toggleMaximize(): void {
        this.isMaximized = !this.isMaximized;
        if (!this.originalChartHeight) {
            this.originalChartHeight = CHART_HEIGHTS[this.size] || this.chartOptions?.chart?.height || 270;
        }
        const newHeight = this.isMaximized ? '100%' : this.originalChartHeight;
        if (this.chartInstance) {
            this.chartInstance.updateOptions({ chart: { height: newHeight } }, false, true);
        }
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }

    @HostListener('document:keydown.escape')
    onEscKey(): void {
        if (this.isMaximized) {
            this.toggleMaximize();
        }
    }
}
