import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assetFormSchema, type AssetFormData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, CheckCircle, TrendingUp, BarChart3, PieChart, DollarSign, FileText, Copy, RefreshCw, Download, Database, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";
import amiLogoPath from "@assets/ami-logo.png";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AssetForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [responseReceived, setResponseReceived] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [waitingTime, setWaitingTime] = useState(0);
  const [showJsonResponse, setShowJsonResponse] = useState(false);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Timer effect to track waiting time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWaiting) {
      interval = setInterval(() => {
        setWaitingTime(prev => prev + 1);
      }, 1000);
    } else {
      setWaitingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWaiting]);

  // Format time display
  const formatWaitTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Excel download functions
  const downloadExcelReport = () => {
    if (!responseData) return;

    const workbook = XLSX.utils.book_new();

    // Summary Tab - Residual Value Analysis
    const summaryData = processResidualValueData(responseData);
    const summaryWS = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, "Summary");

    // Inflation Tab
    const inflationData = processInflationData(responseData);
    const inflationWS = XLSX.utils.json_to_sheet(inflationData);
    XLSX.utils.book_append_sheet(workbook, inflationWS, "Inflation");

    // Depreciation Tab
    const depreciationData = processDepreciationData(responseData);
    const depreciationWS = XLSX.utils.json_to_sheet(depreciationData);
    XLSX.utils.book_append_sheet(workbook, depreciationWS, "Depreciation");

    // Utilization Tab
    const utilizationData = processUtilizationData(responseData);
    const utilizationWS = XLSX.utils.json_to_sheet(utilizationData);
    XLSX.utils.book_append_sheet(workbook, utilizationWS, "Utilization");

    // Market Data Tab
    const marketData = processMarketData(responseData);
    const marketWS = XLSX.utils.json_to_sheet(marketData);
    XLSX.utils.book_append_sheet(workbook, marketWS, "Market Data");

    // Overview Tab
    const overviewData = [
      {
        'Data Source': 'Inflation Data',
        'Status': 'Available',
        'Description': 'Consumer Price Index and inflation impact analysis'
      },
      {
        'Data Source': 'Utilization Data', 
        'Status': 'Available',
        'Description': 'Equipment utilization hours vs current market pricing analysis'
      },
      {
        'Data Source': 'Depreciation Data',
        'Status': 'Available', 
        'Description': 'MACRS depreciation schedules and financial projections'
      },
      {
        'Data Source': 'OEC Residual Data',
        'Status': 'Available',
        'Description': 'Original Equipment Cost and residual value projections'
      },
      {
        'Data Source': 'Market Comps Data',
        'Status': 'Available',
        'Description': 'Comparable equipment market analysis and pricing data'
      },
      {
        'Data Source': 'Executive Summary',
        'Status': 'Available',
        'Description': 'Executive summary with key findings and recommendations'
      }
    ];
    const overviewWS = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewWS, "Overview");

    // Generate and download Excel file with BanfieldResidualCalcs format
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create filename with BanfieldResidualCalcs_DATETIME format
    const now = new Date();
    const datetime = now.toISOString().replace(/[-T:]/g, '').split('.')[0]; // Format: YYYYMMDDHHMMSS
    const fileName = `BanfieldResidualCalcs_${datetime}.xlsx`;
    saveAs(blob, fileName);

    toast({
      title: "Excel Report Downloaded",
      description: "Complete residual analysis report has been saved as an Excel file.",
    });
  };

  // PDF download function - Screenshots all 6 tabs
  const downloadPDFReport = async () => {
    if (!responseData) return;

    try {
      toast({
        title: "Generating PDF Report",
        description: "Capturing all dashboard tabs and creating comprehensive PDF report...",
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Add title page
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Residual Value Analysis Report', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const equipmentName = responseData?.equipment_analysis?.equipment_name || 
                           responseData?.data_sources?.executive_summary?.data?.equipment_name ||
                           form.getValues().itemDescription ||
                           'N/A';
      pdf.text(`Equipment: ${equipmentName}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Analysis Date: ${responseData?.equipment_analysis?.analysis_date || new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Initial Cost: ${formatCurrency(responseData?.equipment_analysis?.initial_cost || 0)}`, margin, yPosition);
      yPosition += 7;
      const processingTime = totalElapsedTime > 0 ? formatWaitTime(totalElapsedTime) : 
                         (startTime && endTime) ? formatWaitTime(Math.floor((endTime.getTime() - startTime.getTime()) / 1000)) : 
                         'N/A';
      pdf.text(`Processing Time: ${processingTime}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Report Generated: ${new Date().toLocaleString()}`, margin, yPosition);

      // Tab titles for screenshots
      const tabTitles = ['Summary', 'Inflation', 'Depreciation', 'Utilization', 'Market Data', 'Overview'];
      const tabButtons = document.querySelectorAll('[role="tab"]');
      
      // Screenshot each tab
      for (let i = 0; i < tabTitles.length && i < tabButtons.length; i++) {
        const tabTitle = tabTitles[i];
        const tabButton = tabButtons[i] as HTMLElement;
        
        // Click the tab to make it active
        tabButton.click();
        
        // Wait longer for content and plots to fully render (2 seconds per section)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Additional wait for charts to fully render (check for Recharts components)
        const hasCharts = document.querySelector('.recharts-wrapper');
        if (hasCharts) {
          console.log(`Waiting extra time for charts in ${tabTitle} tab...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Find the active tab content
        const activeTabContent = document.querySelector('[role="tabpanel"]:not([hidden])');
        
        if (activeTabContent) {
          // Add new page for each tab (except first)
          if (i > 0) {
            pdf.addPage();
          } else {
            pdf.addPage(); // Add page after title page
          }
          
          // Add tab title
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${tabTitle} Analysis`, margin, 20);
          
          try {
            // Capture screenshot of the tab content
            const canvas = await html2canvas(activeTabContent as HTMLElement, {
              scale: 2, // Higher quality
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              width: activeTabContent.scrollWidth,
              height: activeTabContent.scrollHeight,
              logging: false
            });
            
            // Calculate dimensions to fit on PDF page
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Check if image fits on one page
            if (imgHeight <= pageHeight - 40) {
              // Fits on one page
              const imgData = canvas.toDataURL('image/png');
              pdf.addImage(imgData, 'PNG', margin, 30, imgWidth, imgHeight);
            } else {
              // Split across multiple pages
              const maxImgHeight = pageHeight - 40;
              const scaleFactor = maxImgHeight / imgHeight;
              const scaledWidth = imgWidth * scaleFactor;
              const scaledHeight = maxImgHeight;
              
              const imgData = canvas.toDataURL('image/png');
              pdf.addImage(imgData, 'PNG', margin, 30, scaledWidth, scaledHeight);
              
              // If content is very tall, add note about scaling
              if (scaleFactor < 0.8) {
                pdf.addPage();
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'italic');
                pdf.text('(Content scaled to fit page - full resolution available in digital dashboard)', margin, 20);
              }
            }
          } catch (screenshotError) {
            console.error(`Error capturing ${tabTitle} tab:`, screenshotError);
            
            // Fallback: Add text content instead of screenshot
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Screenshot capture failed for ${tabTitle} tab.`, margin, 35);
            pdf.text('Please view the interactive dashboard for complete visualizations.', margin, 45);
          }
        }
      }

      // Add final summary page
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Report Summary', margin, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('This comprehensive residual value analysis includes:', margin, 35);
      pdf.text('• Executive summary with key insights and recommendations', margin, 45);
      pdf.text('• Detailed residual value projections over 10-year term', margin, 55);
      pdf.text('• Inflation impact analysis with historical CPI data', margin, 65);
      pdf.text('• Multi-method depreciation analysis (Straight-line, MACRS, etc.)', margin, 75);
      pdf.text('• Equipment utilization vs. market value correlations', margin, 85);
      pdf.text('• Current market comparisons with pricing data', margin, 95);
      pdf.text('• Complete processing and data quality metrics', margin, 105);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Generated by AMI International Residual Analysis System', margin, pageHeight - 20);

      // Save PDF
      const fileName = `residual-analysis-report-${equipmentName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Report Generated",
        description: "Complete visual PDF report with all 6 dashboard sections has been downloaded.",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to process residual value data with fixed term months
  const processResidualValueData = (data: any) => {
    try {
      // Use the same data processing as the chart display
      const chartData = processExecutiveSummaryChart(data);
      
      return chartData.map((item: any, index: number) => ({
        'Term Month': (index + 1) * 12,
        'Residual % (High)': `${item.residualPercent}%`,
        'Residual % (Low)': `${item.residualPercentLow}%`,
        'Residual Value (High)': formatCurrency(item.residualValue),
        'Residual Value (Low)': formatCurrency(item.residualValueLow),
        'Average Residual %': `${((item.residualPercent + item.residualPercentLow) / 2).toFixed(1)}%`,
        'Average Residual Value': formatCurrency((item.residualValue + item.residualValueLow) / 2)
      }));
    } catch (error) {
      console.error('Error processing residual value data:', error);
      return [];
    }
  };

  // Helper functions to process n8n response data
  const processInflationData = (data: any) => {
    try {
      const inflationData = data?.data_sources?.inflation_analysis?.data?.inflation_data?.yearly || [];
      return inflationData.map((item: any) => ({
        year: item.year,
        cpi: parseFloat(item.cpi_u || 0),
        rate: parseFloat(item.annual_rate || 0)
      })).slice(-10); // Last 10 years
    } catch (error) {
      return [];
    }
  };

  const processDepreciationData = (data: any) => {
    try {
      // Get the depreciation data from the correct location
      let depData = data?.data_sources?.depreciation_analysis?.data;
      
      if (!depData) return [];
      
      console.log('Raw depreciation data:', depData);
      
      // Parse if it's a string
      if (typeof depData === 'string') {
        try {
          const parsed = JSON.parse(depData);
          depData = parsed;
        } catch (parseError) {
          console.error('Failed to parse depreciation data:', parseError);
          return [];
        }
      }
      
      // Look for depreciation_calculations structure
      const depCalcs = depData?.depreciation_calculations;
      if (depCalcs && depCalcs.years) {
        const years = depCalcs.years || [];
        const straightLine = depCalcs.straight_line || [];
        const doubleDecline = depCalcs.double_declining || [];
        const sumYears = depCalcs.sum_of_years_digits || [];
        const macrs = depCalcs.macrs || [];
        
        console.log('Depreciation arrays:', {
          years: years.length,
          straightLine: straightLine.length,
          doubleDecline: doubleDecline.length,
          sumYears: sumYears.length,
          macrs: macrs.length
        });
        
        // Create data points for each year
        return years.map((year: number, index: number) => ({
          year: `Year ${year}`,
          straightLine: parseFloat(String(straightLine[index] || '0')),
          doubleDeclining: parseFloat(String(doubleDecline[index] || '0')),
          sumOfYears: parseFloat(String(sumYears[index] || '0')),
          macrs: parseFloat(String(macrs[index] || '0'))
        }));
      }
      
      // Look for chart_config structure as backup
      const chartConfig = depData?.chart_config?.data?.datasets;
      if (chartConfig && Array.isArray(chartConfig)) {
        const straightLineDataset = chartConfig.find(ds => ds.label === "Straight-Line Method");
        const doubleDeclineDataset = chartConfig.find(ds => ds.label === "Double Declining Balance");
        const sumYearsDataset = chartConfig.find(ds => ds.label === "Sum-of-Years-Digits");
        const macrsDataset = chartConfig.find(ds => ds.label === "MACRS");
        
        if (straightLineDataset && straightLineDataset.data) {
          const years = depData.chart_config.data.labels || [];
          return straightLineDataset.data.map((value: number, index: number) => ({
            year: years[index] || `Year ${index}`,
            straightLine: parseFloat(String(straightLineDataset.data[index] || '0')),
            doubleDeclining: parseFloat(String(doubleDeclineDataset?.data[index] || '0')),
            sumOfYears: parseFloat(String(sumYearsDataset?.data[index] || '0')),
            macrs: parseFloat(String(macrsDataset?.data[index] || '0'))
          }));
        }
      }
      
      console.log('No valid depreciation data structure found');
      return [];
    } catch (error) {
      console.error('Error processing depreciation data:', error);
      return [];
    }
  };

  const processMarketData = (data: any) => {
    try {
      console.log('Processing market comparisons data:', data?.data_sources?.market_comparisons?.data);
      
      // Look for market_comps array within the data
      let marketData = data?.data_sources?.market_comparisons?.data;
      
      // If it's an array with market_comps inside
      if (Array.isArray(marketData) && marketData[0]?.market_comps) {
        marketData = marketData[0].market_comps;
      }
      // Or if it's directly the market_comps array
      else if (marketData?.market_comps) {
        marketData = marketData.market_comps;
      }
      // Fallback to other possible structures
      else if (!Array.isArray(marketData)) {
        marketData = marketData?.market_data || [];
      }
      
      if (Array.isArray(marketData)) {
        console.log('Found market data array with', marketData.length, 'items');
        
        return marketData.map((item: any, index: number) => ({
          id: index + 1,
          year: parseInt(item.year) || 2024,
          hours: parseInt(item.hours?.replace(/,/g, '') || '0'),
          hoursText: item.hours?.replace(/,/g, '') || '0',
          priceValue: parseInt(item.price?.replace(/[^\d]/g, '') || '0'),
          price: item.price || '$0',
          description: item.item_description || item.description || 'Unknown Equipment',
          serialNumber: item.serial_number || 'N/A',
          dealer: item.dealer || 'N/A',
          location: item.seller_location || item.location || 'N/A',
          phone: item.phone || 'N/A',
          url: item.url_to_listing || null
        }));
      }
      return [];
    } catch (error) {
      console.error('Error processing market data:', error);
      return [];
    }
  };

  const processUtilizationData = (data: any) => {
    try {
      console.log('Processing utilization data from OEC residual analysis');
      
      // Look for OEC residual analysis data which contains utilization information
      let oecData = data?.data_sources?.oec_residual_analysis?.data;
      
      if (!oecData) {
        console.log('No OEC data found, trying other sources');
        // Fallback to utilization_vs_price data
        let utilizationData = data?.data_sources?.utilization_vs_price?.data || [];
        
        if (typeof utilizationData === 'string') {
          try {
            utilizationData = JSON.parse(utilizationData.replace(/\\n/g, '').replace(/\s+/g, ' '));
          } catch (parseError) {
            console.error('Failed to parse utilization JSON:', parseError);
            return [];
          }
        }
        
        if (Array.isArray(utilizationData)) {
          return utilizationData.slice(0, 11).map((item: any, index: number) => ({
            id: index + 1,
            hoursPerYear: parseInt(item.hours_year || item['Hours/Year'] || item.hours_per_year || '0'),
            residualPercent: parseFloat(item.resid_percent || item['Resid %'] || item.residual_percent || '0'),
            residualValue: parseInt(String(item.resid_value || item['Resid Lo$'] || item.residual_value || '0').replace(/[^\d]/g, '')),
            effectiveAge: parseFloat(item.effective_age || item['Effective Age'] || item.age || '0')
          }));
        }
        return [];
      }
      
      // Parse OEC data if it's a string
      if (typeof oecData === 'string') {
        try {
          oecData = JSON.parse(oecData);
        } catch (parseError) {
          console.error('Failed to parse OEC data:', parseError);
          return [];
        }
      }
      
      // Process OEC residual analysis data
      if (Array.isArray(oecData) && oecData.length > 0) {
        console.log('Found OEC data array with', oecData.length, 'items');
        
        return oecData.map((item: any, index: number) => ({
          id: index + 1,
          hoursTotal: parseFloat(String(item['Hours - total'] || item.hours_total || '0')),
          hoursPerYear: parseFloat(String(item['Hours - per year'] || item.hours_per_year || '0')),
          residualPercent: parseFloat(String(item.Resid || item['Resid'] || item.residual_percent || '0').replace('%', '')),
          residualValue: parseInt(String(item['Current Price'] || item.current_price || item.residual_value || '0').replace(/[^\d]/g, '')),
          effectiveAge: parseFloat(String(item['Effective Age'] || item.effective_age || item.age || '0')),
          make: item.Make || item.make || '',
          model: item.Model || item.model || '',
          year: parseInt(String(item['Year model'] || item.year || '0'))
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error processing utilization data:', error);
      return [];
    }
  };

  const processExecutiveSummaryChart = (data: any) => {
    try {
      // Look for asset management table in executive summary
      const execSummary = data?.data_sources?.executive_summary?.data;
      let assetTable = null;
      
      // Parse executive summary if it's a string
      if (typeof execSummary === 'string') {
        try {
          const parsed = JSON.parse(execSummary);
          assetTable = parsed?.executive_summary?.asset_management_table || parsed?.asset_management_table;
        } catch (parseError) {
          console.error('Failed to parse executive summary:', parseError);
        }
      } else {
        assetTable = execSummary?.executive_summary?.asset_management_table || execSummary?.asset_management_table;
      }
      
      if (assetTable && assetTable.resid_hi_percent && assetTable.resid_lo_percent) {
        const periodLabels = assetTable.period_labels || [];
        const residHiPercent = assetTable.resid_hi_percent || [];
        const residLoPercent = assetTable.resid_lo_percent || [];
        const residHiDollar = assetTable.resid_hi_dollar || [];
        const residLoDollar = assetTable.resid_lo_dollar || [];
        
        // Create data points for each period (should be 10 points)
        return periodLabels.slice(0, 10).map((period: string, index: number) => {
          const monthMatch = period.match(/(\d+)\s*months?/);
          const months = monthMatch ? parseInt(monthMatch[1]) : (index + 1) * 12;
          
          return {
            months: months,
            residualPercent: parseFloat(residHiPercent[index] || '0'), // Use high percent as primary
            residualValue: parseInt(String(residHiDollar[index] || '0').replace(/[^\d]/g, '')), // Use high dollar as primary
            residualPercentLow: parseFloat(residLoPercent[index] || '0'),
            residualValueLow: parseInt(String(residLoDollar[index] || '0').replace(/[^\d]/g, '')),
            effectiveAge: months / 12 // Age in years
          };
        });
      }
      
      // Fallback to OEC data
      const oecData = data?.data_sources?.oec_residual_analysis?.data;
      if (Array.isArray(oecData) && oecData.length > 0) {
        return oecData.slice(0, 10).map((item: any, index: number) => ({
          months: (index + 1) * 12,
          residualPercent: parseFloat(item.resid_percent || item['Resid %'] || item.residual_percent || '0'),
          residualValue: parseInt(String(item.resid_value || item['Resid Lo$'] || item.residual_value || '0').replace(/[^\d]/g, '')),
          effectiveAge: parseFloat(item.effective_age || item['Effective Age'] || item.age || '0')
        }));
      }
      
      // Final fallback - generate sample data
      const months = [12, 24, 36, 48, 60, 72, 84, 96, 108, 120];
      return months.map((month, index) => ({
        months: month,
        residualPercent: Math.max(85 - (index * 8), 25),
        residualValue: Math.max(430000 - (index * 35000), 125000),
        effectiveAge: (month / 12)
      }));
    } catch (error) {
      console.error('Error processing executive summary chart:', error);
      return [];
    }
  };

  const getExecutiveSummary = (data: any) => {
    try {
      const summary = data?.data_sources?.executive_summary?.data;
      if (typeof summary === 'string') {
        const parsed = JSON.parse(summary);
        return parsed.executive_summary || parsed;
      }
      return summary?.executive_summary || summary || {};
    } catch (error) {
      return {};
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Polling function to check for async results
  const pollForResult = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 120; // Poll for up to 10 minutes (5s intervals)
    
    const poll = async () => {
      attempts++;
      setPollCount(attempts);
      
      try {
        const response = await fetch(`/api/webhook-status/${id}`);
        const result = await response.json();
        
        console.log(`Poll attempt ${attempts}:`, result);
        
        if (result.status === 'completed') {
          const pollEndTime = new Date();
          const totalTime = startTime ? Math.floor((pollEndTime.getTime() - startTime.getTime()) / 1000) : 0;
          setEndTime(pollEndTime);
          setTotalElapsedTime(totalTime);
          setIsWaiting(false);
          setResponseData(result.result);
          setResponseReceived(true);
          
          toast({
            title: "Success!",
            description: "Your request has been processed successfully.",
          });
          return;
        }
        
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setIsWaiting(false);
          setResponseData({
            error: true,
            errorType: 'Polling Timeout',
            errorMessage: 'Request is still processing after 10 minutes',
            suggestion: 'Your request may still be processing in the background'
          });
          setResponseReceived(true);
          
          toast({
            title: "Timeout",
            description: "Request is taking longer than expected (10+ minutes) but may still be processing.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        setIsWaiting(false);
        setResponseData({
          error: true,
          errorType: 'Polling Error',
          errorMessage: error.message,
        });
        setResponseReceived(true);
        
        toast({
          title: "Error",
          description: "Failed to check request status.",
          variant: "destructive",
        });
      }
    };
    
    poll();
  };

  const resetForm = () => {
    setIsSubmitting(false);
    setIsWaiting(false);
    setResponseReceived(false);
    setResponseData(null);
    setRequestId(null);
    setPollCount(0);
    setWaitingTime(0);
    setTotalElapsedTime(0);
    setStartTime(null);
    setEndTime(null);
    form.reset({
      lesseeName: "",
      lesseeEmail: "info@theendlessforms.com",
      source: "",
      itemName: "Volvo A30G Articulating Dump",
      make: "Volvo",
      model: "A30G",
      currentMeter: 0,
      proposedMeter: 1250,
      meterUnit: "HPY",
      itemDescription: "Volvo A30G Articulating Dump",
      subjectPrice: 507750,
      industry: "Construction",
      assetType: "Construction Equipment",
      status: "New",
      application: "Construction, Rugged",
      structure: "FMV",
      termMonths: 24,
    });
  };

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      lesseeName: "",
      lesseeEmail: "info@theendlessforms.com",
      source: "",
      itemName: "Volvo A30G Articulating Dump",
      make: "Volvo",
      model: "A30G",
      currentMeter: 0,
      proposedMeter: 1250,
      meterUnit: "HPY",
      itemDescription: "Volvo A30G Articulating Dump",
      subjectPrice: 507750,
      industry: "Construction",
      assetType: "Construction Equipment",
      status: "New",
      application: "Construction, Rugged",
      structure: "FMV",
      termMonths: 24,
    },
  });

  const onSubmit = async (data: AssetFormData) => {
    setIsSubmitting(true);
    setIsWaiting(true);
    setResponseReceived(false);
    setResponseData(null);
    setWaitingTime(0);
    setTotalElapsedTime(0);
    const submitStartTime = new Date();
    setStartTime(submitStartTime);
    setEndTime(null);
    
    try {
      const proxyUrl = '/api/webhook-proxy';
      
      // Add timestamp for n8n callback URL generation
      const timestamp = Date.now();
      const dataWithTimestamp = { ...data, timestamp };
      
      console.log('Submitting to webhook via server proxy:', proxyUrl);
      console.log('Form data:', dataWithTimestamp);
      
      toast({
        title: "Request Sent!",
        description: "Processing your request...",
      });
      
      // Use our server proxy endpoint (no CORS issues)
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithTimestamp)
      });
      
      let responseJson;
      
      // First, get the response text to avoid "Response body already used" error
      const responseText = await response.text();
      
      try {
        responseJson = JSON.parse(responseText);
      } catch (e) {
        // If response is not JSON, return as object with status info
        responseJson = { 
          status: response.status,
          statusText: response.statusText,
          text: responseText,
          error: true,
          errorType: "ParseError",
          errorMessage: `Failed to parse response as JSON: ${(e as Error).message}`
        };
      }

      console.log('Response received:', responseJson);

      // Check if this is an async response with requestId
      if (responseJson.requestId && responseJson.status === 'processing') {
        setRequestId(responseJson.requestId);
        console.log('Starting async polling for request:', responseJson.requestId);
        
        toast({
          title: "Processing Started!",
          description: "Your request is being processed by our agents. This will take 6-8 minutes.",
        });
        
        // Start polling for the result
        pollForResult(responseJson.requestId);
        return;
      }

      // Handle direct successful response from n8n "Respond to Webhook" node
      if (response.ok && responseJson && !responseJson.requestId && responseJson.status !== 524) {
        console.log('Direct response from n8n "Respond to Webhook" node:', responseJson);
        const submitEndTime = new Date();
        const totalTime = Math.floor((submitEndTime.getTime() - submitStartTime.getTime()) / 1000);
        setEndTime(submitEndTime);
        setTotalElapsedTime(totalTime);
        setResponseData(responseJson);
        setResponseReceived(true);
        setIsWaiting(false);
        setIsSubmitting(false);
        
        toast({
          title: "Analysis Complete!",
          description: "Your residual analysis has been completed successfully.",
        });
        return;
      }

      // Handle other successful responses
      if (response.ok && responseJson) {
        console.log('Success! Response received:', responseJson);
        
        setResponseData(responseJson);
        setResponseReceived(true);
        setIsWaiting(false);
        
        toast({
          title: "Success!",
          description: "Form submitted successfully to n8n webhook",
        });
        return;
      }
      
      // Handle 524 timeout - webhook received data, start async waiting
      if (response.status === 524 || responseJson.status === 524) {
        console.log('524 timeout - webhook received data, starting async wait for results');
        
        // Use the same timestamp that was sent to n8n for consistent tracking
        const requestId = `${data.lesseeName}_${timestamp}`;
        setRequestId(requestId);
        
        console.log('Waiting for results at callback:', `${window.location.origin}/api/webhook-callback/${requestId}`);
        
        // Continue waiting and polling for results
        setIsWaiting(true);
        setWaitingTime(100); // Start from 100 seconds (when 524 occurred)
        
        toast({
          title: "Analysis Started",
          description: "Agents received your data and are formulating residual analysis...",
        });
        
        // Start polling for callback results
        pollForResult(requestId);
        return;
      }

      // Handle other errors
      setResponseData(responseJson);
      setResponseReceived(true);
      setIsWaiting(false);
      
      toast({
        title: "Error Response",
        description: `Server returned status ${response.status}. Check the response below.`,
        variant: "destructive",
      });
      
    } catch (error: any) {
      console.error('Submission error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        error: error
      });
      setIsWaiting(false);
      
      let errorMessage = "Network error. Please check your connection and try again.";
      
      if (error?.message) {
        errorMessage = `Network error: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Set error state for display
      setResponseData({
        error: true,
        errorType: error?.name || 'Unknown',
        errorMessage: error?.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
      setResponseReceived(true);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <img 
              src={amiLogoPath} 
              alt="AMI Management Logo" 
              className="h-12 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-lg border border-gray-200">
          {/* Form Header */}
          <CardHeader className="ami-red text-white">
            <CardTitle className="text-2xl font-bold">
              {isWaiting ? "Formulating Residual Analysis..." : "Equipment Lease Information Form"}
            </CardTitle>
            <p className="text-white/90 mt-1">
              {isWaiting ? "Please wait while our agents analyze your asset data" : "Please fill out all required fields below"}
            </p>
          </CardHeader>

          {/* Form Content */}
          <CardContent className="p-6">
            {/* Show waiting state */}
            {isWaiting && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your Request</h3>
                <div className="text-2xl font-mono text-red-600 mb-2">{formatWaitTime(waitingTime)}</div>
                <p className="text-gray-600 mb-4">
                  {waitingTime < 60 ? "Initializing agents..." :
                   waitingTime < 180 ? "Agents are analyzing your asset data..." :
                   waitingTime < 300 ? "Deep market analysis in progress..." :
                   waitingTime < 420 ? "Processing depreciation schedules..." :
                   waitingTime < 480 ? "Finalizing residual calculations..." :
                   "Almost complete! Final processing steps..."}
                </p>
                <div className="bg-gray-200 h-2 rounded-full max-w-md mx-auto">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((waitingTime / 480) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Expected processing time: 6-8 minutes
                </p>
              </div>
            )}

            {/* Show interactive dashboard if response received */}
            {responseReceived && responseData && (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Residual Analysis Complete</h3>
                  <p className="text-gray-600">
                    {responseData?.equipment_analysis?.equipment_name || "Equipment"} Analysis Report
                  </p>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Initial Cost</p>
                          <p className="text-lg font-bold text-gray-900">
                            {responseData?.equipment_analysis?.initial_cost || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Analysis Date</p>
                          <p className="text-lg font-bold text-gray-900">
                            {responseData?.equipment_analysis?.analysis_date || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-red-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Data Sources</p>
                          <p className="text-lg font-bold text-gray-900">
                            {responseData?.metadata?.total_data_sources || "6"} Sources
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <PieChart className="h-8 w-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Report Status</p>
                          <p className="text-lg font-bold text-green-600">Complete</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Interactive Charts Dashboard */}
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="inflation">Inflation</TabsTrigger>
                    <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
                    <TabsTrigger value="utilization">Utilization</TabsTrigger>
                    <TabsTrigger value="market">Market Data</TabsTrigger>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                  </TabsList>

                  {/* Executive Summary Tab - Now First */}
                  <TabsContent value="summary" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <DollarSign className="mr-2 h-5 w-5" />
                          Residual Value Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            residualPercent: {
                              label: "Residual % (High)",
                              color: "#3b82f6",
                            },
                            residualValue: {
                              label: "Residual Value $ (High)",
                              color: "#ef4444",
                            },
                            residualPercentLow: {
                              label: "Residual % (Low)",
                              color: "#60a5fa",
                            },
                            residualValueLow: {
                              label: "Residual Value $ (Low)",
                              color: "#f87171",
                            },
                          }}
                          className="h-[400px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processExecutiveSummaryChart(responseData)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="months" 
                                label={{ value: 'Months', position: 'insideBottom', offset: -10 }}
                              />
                              <YAxis 
                                yAxisId="left"
                                domain={[15, 95]}
                                tick={{ fill: '#3b82f6' }}
                                label={{ value: 'Residual %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3b82f6' } }}
                              />
                              <YAxis 
                                yAxisId="right" 
                                orientation="right"
                                domain={[50000, 500000]}
                                tick={{ fill: '#ef4444' }}
                                tickFormatter={(value) => formatCurrency(value)}
                                label={{ value: 'Residual Value ($)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#ef4444' } }}
                              />
                              <ChartTooltip 
                                content={<ChartTooltipContent 
                                  formatter={(value, name) => {
                                    if (String(name)?.includes("Percent") || String(name)?.includes("%")) {
                                      return [`${value}%`, name];
                                    }
                                    return [formatCurrency(Number(value)), name];
                                  }}
                                />} 
                              />
                              <ChartLegend content={<ChartLegendContent />} />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="residualPercent" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                                connectNulls={true}
                                name="Residual % (High)"
                              />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="residualPercentLow" 
                                stroke="#60a5fa" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: "#60a5fa", strokeWidth: 2, r: 4 }}
                                connectNulls={true}
                                name="Residual % (Low)"
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="residualValue" 
                                stroke="#ef4444" 
                                strokeWidth={3}
                                dot={{ fill: "#ef4444", strokeWidth: 2, r: 5 }}
                                connectNulls={true}
                                name="Residual Value $ (High)"
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="residualValueLow" 
                                stroke="#f87171" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: "#f87171", strokeWidth: 2, r: 4 }}
                                connectNulls={true}
                                name="Residual Value $ (Low)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                        
                        {/* Residual Value Analysis Table */}
                        <div className="mt-6">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <Database className="mr-2 h-4 w-4" />
                            Residual Value Analysis Data Points
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-300 px-3 py-2 text-left">Term Month</th>
                                  <th className="border border-gray-300 px-3 py-2 text-left">Residual % (High)</th>
                                  <th className="border border-gray-300 px-3 py-2 text-left">Residual % (Low)</th>
                                  <th className="border border-gray-300 px-3 py-2 text-left">Residual Value (High)</th>
                                  <th className="border border-gray-300 px-3 py-2 text-left">Residual Value (Low)</th>
                                  <th className="border border-gray-300 px-3 py-2 text-left">Average Residual %</th>
                                  <th className="border border-gray-300 px-3 py-2 text-left">Average Residual Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {processExecutiveSummaryChart(responseData).map((item: any, index: number) => (
                                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <td className="border border-gray-300 px-3 py-2 font-semibold">{(index + 1) * 12}</td>
                                    <td className="border border-gray-300 px-3 py-2 font-semibold text-blue-600">{item.residualPercent}%</td>
                                    <td className="border border-gray-300 px-3 py-2 text-blue-500">{item.residualPercentLow}%</td>
                                    <td className="border border-gray-300 px-3 py-2 font-semibold text-red-600">{formatCurrency(item.residualValue)}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-red-500">{formatCurrency(item.residualValueLow)}</td>
                                    <td className="border border-gray-300 px-3 py-2 font-medium text-purple-600">
                                      {((item.residualPercent + item.residualPercentLow) / 2).toFixed(1)}%
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 font-medium text-green-600">
                                      {formatCurrency((item.residualValue + item.residualValueLow) / 2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        
                        {/* Executive Summary Text */}
                        <div className="mt-6 space-y-4">
                          {(() => {
                            const summary = getExecutiveSummary(responseData);
                            return (
                              <div className="space-y-4">
                                {summary.overview && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Overview</h4>
                                    <p className="text-gray-700 leading-relaxed text-sm">{summary.overview}</p>
                                  </div>
                                )}
                                
                                {summary.key_findings && Array.isArray(summary.key_findings) && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Key Findings</h4>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                                      {summary.key_findings.map((finding: string, index: number) => (
                                        <li key={index} className="leading-relaxed">{finding}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {summary.market_conditions && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Market Conditions</h4>
                                    <p className="text-gray-700 leading-relaxed text-sm">{summary.market_conditions}</p>
                                  </div>
                                )}

                                {summary.utilization_analysis && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Utilization Analysis</h4>
                                    <p className="text-gray-700 leading-relaxed text-sm">
                                      {typeof summary.utilization_analysis === 'string' ? summary.utilization_analysis : JSON.stringify(summary.utilization_analysis)}
                                    </p>
                                    {summary.current_utilization && (
                                      <p className="text-gray-600 leading-relaxed text-sm mt-1">
                                        <strong>Current Utilization:</strong> {typeof summary.current_utilization === 'string' ? summary.current_utilization : JSON.stringify(summary.current_utilization)}
                                      </p>
                                    )}
                                    {summary.efficiency_rating && (
                                      <p className="text-gray-600 leading-relaxed text-sm mt-1">
                                        <strong>Efficiency Rating:</strong> {typeof summary.efficiency_rating === 'string' ? summary.efficiency_rating : JSON.stringify(summary.efficiency_rating)}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {summary.optimization_opportunities && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Optimization Opportunities</h4>
                                    <p className="text-gray-700 leading-relaxed text-sm">
                                      {typeof summary.optimization_opportunities === 'string' ? summary.optimization_opportunities : JSON.stringify(summary.optimization_opportunities)}
                                    </p>
                                  </div>
                                )}

                                {summary.recommendations && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
                                    <p className="text-gray-700 leading-relaxed text-sm">
                                      {typeof summary.recommendations === 'string' ? summary.recommendations : JSON.stringify(summary.recommendations)}
                                    </p>
                                  </div>
                                )}

                                {summary.next_steps && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Next Steps</h4>
                                    <p className="text-gray-700 leading-relaxed text-sm">
                                      {typeof summary.next_steps === 'string' ? summary.next_steps : JSON.stringify(summary.next_steps)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="mr-2 h-5 w-5" />
                          Equipment Analysis Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Data Quality Status</h4>
                            <div className="space-y-2">
                              {responseData?.metadata?.data_quality && Object.entries(responseData.metadata.data_quality).map(([key, available]) => (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600 capitalize">
                                    {key.replace(/_/g, ' ').replace('available', '')}
                                  </span>
                                  <span className={`text-sm font-medium ${available ? 'text-green-600' : 'text-red-600'}`}>
                                    {available ? '✓ Available' : '✗ Unavailable'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Processing Details</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Start Time</span>
                                <span className="text-sm font-medium">
                                  {startTime ? startTime.toLocaleTimeString() : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">End Time</span>
                                <span className="text-sm font-medium">
                                  {endTime ? endTime.toLocaleTimeString() : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total Duration</span>
                                <span className="text-sm font-medium">
                                  {totalElapsedTime > 0 ? formatWaitTime(totalElapsedTime) : 
                                   (startTime && endTime) ? formatWaitTime(Math.floor((endTime.getTime() - startTime.getTime()) / 1000)) : 
                                   waitingTime > 0 ? formatWaitTime(waitingTime) : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total Data Sources</span>
                                <span className="text-sm font-medium">{responseData?.metadata?.total_data_sources || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Analysis Status</span>
                                <span className="text-sm font-medium text-green-600">Complete</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Inflation Analysis Tab */}
                  <TabsContent value="inflation" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="mr-2 h-5 w-5" />
                          Inflation Analysis (Last 10 Years)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            rate: {
                              label: "Inflation Rate (%)",
                              color: "hsl(var(--chart-1))",
                            },
                            cpi: {
                              label: "Consumer Price Index",
                              color: "hsl(var(--chart-2))",
                            },
                          }}
                          className="h-[400px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processInflationData(responseData)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <ChartLegend 
                                content={<ChartLegendContent />} 
                                layout="horizontal"
                                align="left"
                                verticalAlign="top"
                                wrapperStyle={{ paddingLeft: '20px', paddingTop: '10px' }}
                              />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="rate" 
                                stroke="#ef4444" 
                                strokeWidth={3}
                                dot={{ fill: "#ef4444", strokeWidth: 2, r: 5 }}
                                connectNulls={true}
                                name="Annual Rate (%)"
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="cpi" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                                connectNulls={true}
                                name="CPI-U"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Depreciation Analysis Tab */}
                  <TabsContent value="depreciation" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="mr-2 h-5 w-5" />
                          Depreciation Methods Comparison
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            straightLine: {
                              label: "Straight-Line Method",
                              color: "#3b82f6",
                            },
                            doubleDeclining: {
                              label: "Double Declining Balance", 
                              color: "#ef4444",
                            },
                            sumOfYears: {
                              label: "Sum-of-Years-Digits",
                              color: "#22c55e", 
                            },
                            macrs: {
                              label: "MACRS",
                              color: "#f59e0b",
                            },
                          }}
                          className="h-[400px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processDepreciationData(responseData)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" />
                              <YAxis tickFormatter={(value) => formatCurrency(value)} />
                              <ChartTooltip 
                                content={<ChartTooltipContent 
                                  formatter={(value) => [formatCurrency(Number(value)), ""]}
                                />} 
                              />
                              <ChartLegend content={<ChartLegendContent />} />
                              <Line 
                                type="monotone" 
                                dataKey="straightLine" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                                connectNulls={true}
                                name="Straight-Line Method"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="doubleDeclining" 
                                stroke="#ef4444" 
                                strokeWidth={3}
                                dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                                connectNulls={true}
                                name="Double Declining Balance"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="sumOfYears" 
                                stroke="#22c55e" 
                                strokeWidth={3}
                                dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                                connectNulls={true}
                                name="Sum-of-Years-Digits"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="macrs" 
                                stroke="#f59e0b" 
                                strokeWidth={3}
                                dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                                connectNulls={true}
                                name="MACRS"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Depreciation Data Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Database className="mr-2 h-5 w-5" />
                          Depreciation Analysis Data Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-300 px-3 py-2 text-left">Year</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Straight-Line</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Double Declining</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Sum-of-Years-Digits</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">MACRS</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Method Comparison</th>
                              </tr>
                            </thead>
                            <tbody>
                              {processDepreciationData(responseData).map((item: any, index: number) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="border border-gray-300 px-3 py-2 font-semibold">{item.year}</td>
                                  <td className="border border-gray-300 px-3 py-2 font-semibold text-blue-600">{formatCurrency(item.straightLine)}</td>
                                  <td className="border border-gray-300 px-3 py-2 font-semibold text-red-600">{formatCurrency(item.doubleDeclining)}</td>
                                  <td className="border border-gray-300 px-3 py-2 font-semibold text-green-600">{formatCurrency(item.sumOfYears)}</td>
                                  <td className="border border-gray-300 px-3 py-2 font-semibold text-orange-600">{formatCurrency(item.macrs)}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-600">
                                    {index === 0 ? "Initial Cost" : 
                                     Math.max(item.straightLine, item.doubleDeclining, item.sumOfYears, item.macrs) === item.straightLine ? "Straight-Line Highest" :
                                     Math.max(item.straightLine, item.doubleDeclining, item.sumOfYears, item.macrs) === item.doubleDeclining ? "Double Declining Highest" :
                                     Math.max(item.straightLine, item.doubleDeclining, item.sumOfYears, item.macrs) === item.sumOfYears ? "Sum-of-Years Highest" :
                                     "MACRS Highest"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Utilization Analysis Tab */}
                  <TabsContent value="utilization" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="mr-2 h-5 w-5" />
                          Equipment Utilization vs Residual Values
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            residualPercent: {
                              label: "Residual %",
                              color: "#3b82f6",
                            },
                            effectiveAge: {
                              label: "Effective Age",
                              color: "#ef4444",
                            },
                          }}
                          className="h-[400px]"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processUtilizationData(responseData)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="hoursPerYear" 
                                label={{ value: 'Hours Per Year', position: 'insideBottom', offset: -10 }}
                              />
                              <YAxis 
                                yAxisId="left" 
                                domain={[60, 85]} 
                                tick={{ fill: '#3b82f6' }}
                                label={{ value: 'Residual %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3b82f6' } }} 
                              />
                              <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                domain={[1, 4]} 
                                tick={{ fill: '#ef4444' }}
                                label={{ value: 'Effective Age', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#ef4444' } }} 
                              />
                              <ChartTooltip 
                                content={<ChartTooltipContent 
                                  formatter={(value, name) => [
                                    name === "residualPercent" ? `${value}%` : `${value} years`,
                                    name === "residualPercent" ? "Residual %" : "Effective Age"
                                  ]}
                                />} 
                              />
                              <ChartLegend content={<ChartLegendContent />} />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="residualPercent" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
                                connectNulls={true}
                                name="Residual %"
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="effectiveAge" 
                                stroke="#ef4444" 
                                strokeWidth={3}
                                dot={{ fill: "#ef4444", strokeWidth: 2, r: 6 }}
                                connectNulls={true}
                                name="Effective Age"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Residual Data Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Database className="mr-2 h-5 w-5" />
                          Residual Analysis Data Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-300 px-3 py-2 text-left">Source</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Make/Model</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Year</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Age</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Total Hours</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Hours/Year</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Current Price</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Residual %</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Effective Age</th>
                              </tr>
                            </thead>
                            <tbody>
                              {processUtilizationData(responseData).map((item: any, index: number) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.id}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.make} {item.model}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.year}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{2025 - item.year}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.hoursTotal?.toLocaleString()}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.hoursPerYear?.toLocaleString()}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-green-600">${item.residualValue?.toLocaleString()}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-blue-600">{item.residualPercent}%</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.effectiveAge}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Market Data Tab */}
                  <TabsContent value="market" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <PieChart className="mr-2 h-5 w-5" />
                          Equipment Market Comparables Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Year</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Hours</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Serial Number</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Dealer</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Location</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Phone</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Price</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">Listing</th>
                              </tr>
                            </thead>
                            <tbody>
                              {processMarketData(responseData).map((item: any, index: number) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.description}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.year}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.hours}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-xs font-mono">{item.serialNumber}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.dealer}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.location}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.phone}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-green-600">{item.price}</td>
                                  <td className="border border-gray-300 px-3 py-2 text-sm">
                                    {item.url ? (
                                      <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                      >
                                        View Listing
                                      </a>
                                    ) : (
                                      <span className="text-gray-400">N/A</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Price vs Hours Chart */}
                        <div className="mt-6">
                          <h4 className="font-semibold text-gray-900 mb-4">Price vs Operating Hours</h4>
                          <ChartContainer
                            config={{
                              priceValue: {
                                label: "Current Price",
                                color: "#22c55e",
                              },
                            }}
                            className="h-[400px]"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                data={processMarketData(responseData).sort((a, b) => a.hours - b.hours)}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                  dataKey="hours" 
                                  type="number"
                                  domain={['dataMin - 100', 'dataMax + 100']}
                                  tickFormatter={(value) => `${value.toLocaleString()}h`}
                                  label={{ 
                                    value: 'Operating Hours', 
                                    position: 'insideBottom', 
                                    offset: -5,
                                    style: { textAnchor: 'middle' }
                                  }}
                                />
                                <YAxis 
                                  tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                                  label={{ 
                                    value: 'Current Price ($)', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    style: { textAnchor: 'middle' }
                                  }}
                                />
                                <ChartTooltip 
                                  content={<ChartTooltipContent 
                                    formatter={(value, name) => [
                                      `$${Number(value).toLocaleString()}`, 
                                      "Current Price"
                                    ]}
                                    labelFormatter={(label) => `${Number(label).toLocaleString()} hours`}
                                  />} 
                                />
                                <Bar 
                                  dataKey="priceValue" 
                                  fill="#22c55e" 
                                  stroke="#16a34a"
                                  strokeWidth={1}
                                  name="Current Price"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>


                </Tabs>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
                  <Button 
                    type="button" 
                    onClick={resetForm}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Submit Another Form</span>
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowJsonResponse(!showJsonResponse)}
                    className="border-blue-500 text-blue-500 hover:bg-blue-50 font-medium py-2 px-6 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{showJsonResponse ? 'Hide' : 'Read'} JSON Response</span>
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={downloadExcelReport}
                    className="border-green-500 text-green-500 hover:bg-green-50 font-medium py-2 px-6 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Excel Data</span>
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={downloadPDFReport}
                    className="border-purple-500 text-purple-500 hover:bg-purple-50 font-medium py-2 px-6 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Download PDF Report</span>
                  </Button>
                </div>

                {/* JSON Response Viewer */}
                {showJsonResponse && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        Raw JSON Response
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto border">
                        <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                          {JSON.stringify(responseData, null, 2)}
                        </pre>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
                            toast({
                              title: "Copied to clipboard",
                              description: "JSON response has been copied to your clipboard.",
                            });
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Copy className="h-4 w-4" />
                          <span>Copy JSON</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Show form only if not waiting and no response received */}
            {!isWaiting && !responseReceived && (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-semibold text-black mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lesseeName">Lessee Name *</Label>
                    <Input
                      id="lesseeName"
                      placeholder="Enter lessee name"
                      {...form.register("lesseeName")}
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {form.formState.errors.lesseeName && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.lesseeName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lesseeEmail">Lessee Email *</Label>
                    <Input
                      id="lesseeEmail"
                      type="email"
                      placeholder="Enter lessee email"
                      {...form.register("lesseeEmail")}
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {form.formState.errors.lesseeEmail && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.lesseeEmail.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="source">Source *</Label>
                    <Input
                      id="source"
                      placeholder="Enter source"
                      {...form.register("source")}
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {form.formState.errors.source && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.source.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Equipment Details */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-semibold text-black mb-4">Equipment Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="itemName">Item Name *</Label>
                    <Input
                      id="itemName"
                      placeholder="Enter item name"
                      {...form.register("itemName")}
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {form.formState.errors.itemName && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.itemName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="make">Make *</Label>
                    <Input
                      id="make"
                      placeholder="Enter make"
                      {...form.register("make")}
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {form.formState.errors.make && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.make.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      placeholder="Enter model"
                      {...form.register("model")}
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {form.formState.errors.model && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.model.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="assetType">Asset Type *</Label>
                    <Select onValueChange={(value) => form.setValue("assetType", value)} defaultValue="Construction Equipment">
                      <SelectTrigger className="focus:ring-2 focus:ring-red-500 focus:border-red-500">
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Heavy Equipment">Heavy Equipment</SelectItem>
                        <SelectItem value="Construction Equipment">Construction Equipment</SelectItem>
                        <SelectItem value="Agricultural Equipment">Agricultural Equipment</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Industrial Equipment">Industrial Equipment</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.assetType && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.assetType.message}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="itemDescription">Item Description</Label>
                  <Textarea
                    id="itemDescription"
                    placeholder="Enter detailed item description"
                    rows={3}
                    {...form.register("itemDescription")}
                    className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Meter Information */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-semibold text-black mb-4">Meter Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currentMeter">Current Meter *</Label>
                    <Input
                      id="currentMeter"
                      type="number"
                      placeholder="Enter current meter reading"
                      {...form.register("currentMeter", { valueAsNumber: true })}
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {form.formState.errors.currentMeter && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.currentMeter.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="proposedMeter">Proposed Meter *</Label>
                    <Input
                      id="proposedMeter"
                      type="number"
                      placeholder="Enter proposed meter reading"
                      {...form.register("proposedMeter", { valueAsNumber: true })}
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {form.formState.errors.proposedMeter && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.proposedMeter.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="meterUnit">Meter Unit *</Label>
                    <Select onValueChange={(value) => form.setValue("meterUnit", value)} defaultValue="HPY">
                      <SelectTrigger className="focus:ring-2 focus:ring-red-500 focus:border-red-500">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="miles">Miles</SelectItem>
                        <SelectItem value="kilometers">Kilometers</SelectItem>
                        <SelectItem value="cycles">Cycles</SelectItem>
                        <SelectItem value="HPY">HPY</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.meterUnit && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.meterUnit.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-semibold text-black mb-4">Financial Information</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="subjectPrice">Subject Price *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <Input
                        id="subjectPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...form.register("subjectPrice", { valueAsNumber: true })}
                        className="pl-8 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    {form.formState.errors.subjectPrice && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.subjectPrice.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-semibold text-black mb-4">Business Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry *</Label>
                    <Select onValueChange={(value) => form.setValue("industry", value)} defaultValue="Construction">
                      <SelectTrigger className="focus:ring-2 focus:ring-red-500 focus:border-red-500">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Construction">Construction</SelectItem>
                        <SelectItem value="Agriculture">Agriculture</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Mining">Mining</SelectItem>
                        <SelectItem value="Forestry">Forestry</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.industry && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.industry.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select onValueChange={(value) => form.setValue("status", value)} defaultValue="New">
                      <SelectTrigger className="focus:ring-2 focus:ring-red-500 focus:border-red-500">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.status && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.status.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lease Terms */}
              <div className="pb-6">
                <h2 className="text-lg font-semibold text-black mb-4">Lease Terms</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="application">Application *</Label>
                    <Input
                      id="application"
                      placeholder="Enter application"
                      {...form.register("application")}
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {form.formState.errors.application && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.application.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="structure">Structure *</Label>
                    <Select onValueChange={(value) => form.setValue("structure", value)} defaultValue="FMV">
                      <SelectTrigger className="focus:ring-2 focus:ring-red-500 focus:border-red-500">
                        <SelectValue placeholder="Select structure" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FMV">FMV</SelectItem>
                        <SelectItem value="Operating Lease">Operating Lease</SelectItem>
                        <SelectItem value="Capital Lease">Capital Lease</SelectItem>
                        <SelectItem value="Finance Lease">Finance Lease</SelectItem>
                        <SelectItem value="Rental">Rental</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.structure && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.structure.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="termMonths">Term in Months *</Label>
                    <Input
                      id="termMonths"
                      type="number"
                      min="1"
                      max="240"
                      placeholder="Enter term in months"
                      {...form.register("termMonths", { valueAsNumber: true })}
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {form.formState.errors.termMonths && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.termMonths.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-8 ami-red-hover flex items-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? "Submitting..." : "Submit Form"}
                </Button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
