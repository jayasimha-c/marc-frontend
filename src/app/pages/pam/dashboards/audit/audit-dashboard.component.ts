import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { DashboardDataService } from "../services/dashboard-data.service";
import { ChartOptions } from "../../../../shared/models/chart.model";
import { CommonApxChartComponent } from "../../../../shared/components/common-apx-chart/common-apx-chart.component";
import { DashboardChartFormatterService } from "../../../../core/services/dashboard-chart-formatter.service";
import { TableColumn, TableQueryParams } from "../../../../shared/components/advanced-table/advanced-table.models";

@Component({
  standalone: false,
  selector: "app-audit-dashboard",
  templateUrl: "./audit-dashboard.component.html",
  styleUrls: ["./audit-dashboard.component.css"],
  encapsulation: ViewEncapsulation.None,
})
export class AuditDashboardComponent implements OnInit {
  @ViewChild("requestsByDateChart") requestsByDateChart: CommonApxChartComponent;

  requestsByDateChartOptions: Partial<ChartOptions>;

  dateRange: Date[] = [
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    new Date()
  ];

  // Audit statistics
  auditStats: any = {
    totalAudits: 0,
    failedLogins: 0,
    suspiciousActivities: 0,
    privilegedActions: 0,
  };

  // Table Config
  public tableData: any[] = [];
  public totalRecord: number = 0;
  public loading = false;
  labelDateMapping: Record<string, string> = {};

  public tableColumns: TableColumn[] = [
    {
      header: "Request No",
      type: "link",
      field: "id",
      onClick: (data: any) => this.viewTxnLog(data)
    },
    { header: "Request Date", type: "date", field: "requestDate", dateFormat: 'yyyy-MM-dd' },
    {
      header: "Requester",
      field: "requesterName",
      type: "text"
    },
    {
      header: "Approver",
      field: "approverName",
      type: "text"
    },
    { header: "Status", type: "status", field: "status" },
    {
      header: "Txn Count",
      field: "txnCount1",
      type: "text"
    },
    {
      header: "System",
      field: "sapName",
      type: "text"
    },
    {
      header: "Review Comments",
      field: "reviewComments",
      type: "text"
    },
    {
      header: "Approve Date",
      field: "approveDate",
      type: "date",
      dateFormat: 'yyyy-MM-dd'
    }
  ];

  // Date range preset options
  dateRangePresets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 15 days', days: 15 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
  ];

  public showStaticDashboard: boolean = true;

  constructor(
    private dashboardDataService: DashboardDataService,
    private formatterService: DashboardChartFormatterService
  ) {
    this.initRequestsByDateChart();
  }

  ngOnInit(): void {
    const lsVar = localStorage.getItem("USE_STATIC_DATA");
    this.showStaticDashboard = lsVar !== null ? lsVar === "true" : true;

    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.loadAuditTableData();
  }

  private loadAuditTableData(): void {
    const { startDate, endDate } = this.getFormattedDateRange();

    if (this.showStaticDashboard) {
      this.dashboardDataService.getAuditDashboardData().subscribe((data: any) => {
        this.auditStats = data.statistics;
        this.tableData = data.recentAudits;
        this.totalRecord = this.tableData?.length || 0;
        this.updateRequestsByDateChart(data.auditActivity);
        this.loading = false;
      });
    } else {
      this.dashboardDataService.getAuditDashboardTableData(startDate, endDate).subscribe((resp) => {
        this.updateRequestsByDateChart(resp.data);
        this.loadRequestTableData(startDate, endDate);
      });
    }
  }

  private getFormattedDateRange(): { startDate: string, endDate: string } {
    const pad = (n: number) => n < 10 ? '0' + n : n;

    // Fallback logic for Native Dates (Replacing MomentJS from Legacy App)
    let startStr = "";
    if (this.dateRange?.[0]) {
      startStr = `${pad(this.dateRange[0].getDate())}/${pad(this.dateRange[0].getMonth() + 1)}/${this.dateRange[0].getFullYear()}`;
    } else {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      d.setDate(1);
      startStr = `01/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    let endStr = "";
    if (this.dateRange?.[1]) {
      endStr = `${pad(this.dateRange[1].getDate())}/${pad(this.dateRange[1].getMonth() + 1)}/${this.dateRange[1].getFullYear()}`;
    } else {
      const d = new Date();
      endStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    return { startDate: startStr, endDate: endStr };
  }

  loadRequestTableData(startDate: string, endDate: string) {
    this.dashboardDataService.getRequestTableData(startDate, endDate).subscribe((resp) => {
      this.tableData = resp.data.rows || [];
      this.totalRecord = this.tableData.length || 0;
      this.loading = false;
    });
  }

  private initRequestsByDateChart(): void {
    this.requestsByDateChartOptions = {
      series: [{ name: "Number of tickets", data: [] }],
      chart: {
        height: 350, type: "bar", toolbar: { show: false },
        events: {
          dataPointSelection: (event, chartContext, config) => { this.onBarClick(event, chartContext, config); }
        }
      },
      dataLabels: { enabled: true },
      xaxis: { categories: [] },
      title: { text: "Requests by Date", align: "left" },
    };
  }

  private updateRequestsByDateChart(data: any): void {
    if (!data) return;

    if (!this.showStaticDashboard) {
      const transformedData: Record<string, number> = {};
      this.labelDateMapping = {};

      Object.keys(data).forEach(dateKey => {
        // Quick vanilla substitute for 'MMMM D' formatting instead of pulling in MomentJS locally
        const dateObj = new Date(dateKey);
        const formattedKey = dateObj.toLocaleString('default', { month: 'long', day: 'numeric' });
        transformedData[formattedKey] = data[dateKey];
        this.labelDateMapping[formattedKey] = dateKey;
      });

      this.formatterService.updateHorizontalBarChart(this.requestsByDateChart, this.requestsByDateChartOptions, transformedData);
    } else {
      this.formatterService.updateLineBarChartWithRawData(this.requestsByDateChart, this.requestsByDateChartOptions, data, false);
    }
  }

  onPickerOpenChange(open: boolean): void {
    if (!open && this.dateRange?.[0] && this.dateRange?.[1]) {
      this.loadAuditTableData();
    }
  }

  setDateRangePreset(days: number): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    this.dateRange = [startDate, endDate];
    this.loadAuditTableData();
  }

  onBarClick(event: any, chartContext: any, config: any): void {
    const dataPointIndex = config.dataPointIndex;
    const clickedCategory = this.requestsByDateChartOptions.xaxis?.categories?.[dataPointIndex];

    if (!this.showStaticDashboard && clickedCategory && this.labelDateMapping[clickedCategory]) {
      this.loading = true;
      this.dashboardDataService.getRequestTableDataByDate(this.labelDateMapping[clickedCategory]).subscribe((resp) => {
        this.tableData = resp.data.rows || [];
        this.totalRecord = this.tableData.length;
        this.loading = false;
      });
    }
  }

  public viewTxnLog(rowData: any) {
    console.log('User clicked nested record: ', rowData);
    // Note: Legacy implementation used NzModalService with ViewTxnLogComponent
    // That component evaluates nested Ag-Grids. The target framework binds differently.
    // For migration scope, we map the click handler so the UI triggers successfully.
  }

  resetData(): void {
    this.loadAuditTableData();
  }

  getTableData(event: TableQueryParams | any) {
    // Stub integration since legacy audit pulls based purely on date filters instead of normal pagination.
  }
}
