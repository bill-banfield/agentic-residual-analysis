# Agentic Residual Analysis Platform

A comprehensive equipment residual value analysis platform built for Asset Management International (AMI). This project combines a modern React frontend with n8n workflow automation to deliver AI-powered equipment valuation and financial analysis.

## 📦 API Request & Response Examples

### Request Packet

The frontend sends equipment data to the n8n workflow via webhook:

```json
{
  "lesseeName": "WEB",
  "lesseeEmail": "banfield@4ami.com",
  "source": "Test",
  "itemName": "Bell B25 Articulating Dump",
  "make": "Bell",
  "model": "B25",
  "currentMeter": 0,
  "proposedMeter": 1500,
  "meterUnit": "HPY",
  "itemDescription": "Bell B25 Articulating Dump",
  "subjectPrice": 350000,
  "industry": "Construction",
  "assetType": "Construction Equipment",
  "status": "New",
  "application": "Construction, Rugged",
  "structure": "FMV",
  "termMonths": 24,
  "timestamp": 1755454546551
}
```

### Response Packet

The n8n workflow returns comprehensive analysis results:

```json
{
  "success": true,
  "timestamp": "2025-08-17T16:21:42.790Z",
  "equipment_analysis": {
    "equipment_name": "2025 Volvo A30G Articulating Dump Truck",
    "initial_cost": "507750",
    "analysis_date": "2025-08-17"
  },
  "data_sources": {
    "inflation_analysis": {
      "description": "Consumer Price Index and inflation impact analysis",
      "data": {
        "inflation_data": {
          "yearly": [
            {
              "year": 2004,
              "cpi_u": 0.911,
              "annual_rate": 2.7
            }
            // ... additional inflation data
          ]
        }
      }
    },
    "residual_analysis": {
      "term_months": [12, 24, 36, 48, 60, 72, 84, 96, 108, 120],
      "residual_percentages": [85.2, 73.8, 64.5, 57.1, 51.3, 46.7, 43.1, 40.2, 37.8, 35.9],
      "residual_values": [432113, 374415, 327608, 289813, 260321, 237073, 218745, 204015, 191865, 182103]
    },
    "depreciation_schedule": {
      "macrs_5_year": {
        "year_1": 20.0,
        "year_2": 32.0,
        "year_3": 19.2,
        "year_4": 11.52,
        "year_5": 11.52,
        "year_6": 5.76
      }
    },
    "market_comparisons": {
      "comparable_equipment": [
        {
          "make": "Volvo",
          "model": "A30G",
          "year": "2023",
          "price": "$485,000",
          "condition": "Excellent"
        }
        // ... additional market data
      ]
    },
    "utilization_analysis": {
      "optimal_hours_per_year": 875,
      "maintenance_schedule": "Every 250 hours",
      "efficiency_recommendations": [
        "Implement preventive maintenance program",
        "Monitor fuel consumption patterns",
        "Track utilization metrics"
      ]
    },
    "executive_summary": {
      "key_findings": [
        "Equipment shows strong residual value retention at 73.8% after 24 months",
        "MACRS depreciation provides significant tax benefits",
        "Market positioning is competitive with similar equipment"
      ],
      "recommendations": [
        "Implement MACRS 5-year depreciation schedule to maximize tax benefits",
        "Target 48-60 month lease terms to balance depreciation curve",
        "Maintain utilization between 600-1,150 hours annually"
      ],
      "next_steps": [
        "Calculate lease rates using 48-60 month terms with MACRS tax benefits",
        "Establish utilization monitoring system with monthly reporting",
        "Secure fixed-price maintenance agreements for initial 48-month period"
      ]
    }
  },
  "metadata": {
    "total_data_sources": 6,
    "processing_timestamp": "2025-08-17T16:21:42.790Z",
    "data_quality": {
      "inflation_data_available": true,
      "utilization_data_available": true,
      "depreciation_data_available": true,
      "oec_residual_data_available": true,
      "market_comps_data_available": true,
      "executive_summary_available": true
    }
  }
}
```

## 🏗️ Project Architecture

This project consists of two main components:

- **Frontend**: React/TypeScript application with professional UI for equipment data input and analysis visualization
- **Backend**: n8n workflow automation for AI-powered residual value calculations and financial analysis

## 📁 Project Structure

```
agentic-residual-analysis/
├── frontend/                    # React/TypeScript frontend application
│   ├── client/                 # React application source
│   ├── server/                 # Express.js backend server
│   ├── shared/                 # Shared schemas and types
│   └── README.md              # Frontend documentation
├── backend/                    # n8n workflow configuration
│   └── Banfield_Agentic_Residual_Workflow_Backend.json
├── images/                     # Application screenshots and demos
└── README.md                  # This file
```

## 🚀 Frontend Setup (Replit)

The frontend is a sophisticated React application built with modern tooling and designed for deployment on Replit.

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Redis instance (optional - falls back to memory)
- n8n webhook endpoint configured

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd agentic-residual-analysis/frontend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Configure required variables:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   REDIS_URL=redis://host:port
   NODE_ENV=development
   ```

3. **Database Initialization**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```
   Application available at `http://localhost:5000`

### Key Features

- **Professional Equipment Forms**: 18+ field comprehensive asset lease information forms
- **AI-Powered Analysis**: Integration with n8n workflows for advanced residual value calculations
- **Real-Time Processing**: Live progress tracking for long-running analysis (6-8+ minutes)
- **Interactive Dashboards**: 6-section analysis presentation with charts and data visualization
- **Export Capabilities**: Excel and PDF report generation with complete data sets
- **AMI Corporate Branding**: Consistent brand identity throughout the application

### Technology Stack

- **React 18** with TypeScript for type safety
- **Shadcn/UI** component library built on Radix UI
- **Tailwind CSS** for modern, responsive styling
- **React Hook Form** with Zod validation schemas
- **TanStack Query** for server state management
- **Recharts** for interactive data visualization
- **Vite** for optimized development and builds

### Deployment

The frontend is configured for deployment on Replit with:
- Automatic environment detection
- Build-safe configuration
- AWS Amplify ready deployment
- Comprehensive error handling

## 🔧 Backend Setup (n8n)

The backend consists of an n8n workflow that provides AI-powered residual value analysis using Claude Sonnet 4.

### Workflow Overview

The `Banfield_Agentic_Residual_Workflow_Backend.json` contains a sophisticated n8n workflow that:

1. **Receives Equipment Data**: Accepts webhook requests with equipment information
2. **AI Analysis**: Uses Claude Sonnet 4 for comprehensive residual value calculations
3. **Market Research**: Scrapes and analyzes comparable equipment data
4. **Financial Modeling**: Generates depreciation schedules and projections
5. **Report Generation**: Creates detailed analysis reports with recommendations

### Key Components

- **Anthropic Chat Model**: Claude Sonnet 4 for AI analysis
- **Market Value Agent**: Specialized agent for equipment valuation
- **Web Scraping**: Firecrawl integration for market data collection
- **Financial Calculations**: Residual value and OEC calculations
- **Inflation Analysis**: Economic impact considerations
- **Response Generation**: Structured JSON responses for frontend consumption

### Setup Instructions

1. **Import Workflow**
   - Open n8n instance
   - Import `backend/Banfield_Agentic_Residual_Workflow_Backend.json`
   - Configure credentials for Anthropic API

2. **Configure Webhook**
   - Set up webhook endpoint for receiving equipment data
   - Configure response format for frontend integration
   - Test workflow with sample equipment data

3. **Environment Variables**
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   ```

### Workflow Features

- **Multi-Agent Architecture**: Specialized agents for different analysis types
- **Error Handling**: Comprehensive retry logic and error recovery
- **Data Validation**: Input validation and sanitization
- **Performance Optimization**: Efficient processing for 6-8 minute workflows
- **Scalable Design**: Handles multiple concurrent requests

## 📸 Application Screenshots

### Response Summary Images

#### ![Summary 1](images/frontend_response_summary_1.png)
**Executive Summary Dashboard** - High-level overview of residual analysis results showing key findings, market conditions, and actionable business recommendations. Features interactive charts displaying residual value projections over time with comprehensive executive insights.

#### ![Summary 2](images/frontend_response_summary_2.png)
**Detailed Summary Analysis** - Expanded view of the executive summary section showing residual value trends, market positioning, and strategic recommendations. Includes detailed breakdowns of equipment valuation factors and optimization opportunities.

#### ![Summary 3](images/frontend_response_summary_3.png)
**Summary Data Tables** - Tabular presentation of residual analysis data with term months, residual percentages, and calculated values. Shows comprehensive financial projections in an easy-to-read format for stakeholders.

### Inflation Analysis

#### ![Inflation Analysis](images/frontend_response_inflation.png)
**Economic Impact Analysis** - Detailed inflation considerations and their impact on equipment residual values. Features charts showing inflation trends, economic factors, and their influence on long-term equipment valuation projections.

### Depreciation Analysis

#### ![Depreciation 1](images/frontend_response_success_depreciation_1.png)
**MACRS Depreciation Schedule** - Comprehensive depreciation analysis showing MACRS schedules and financial projections. Displays detailed depreciation curves and tax implications for equipment over various time periods.

#### ![Depreciation 2](images/frontend_response_success_depreciation_2.png)
**Depreciation Calculations** - Advanced depreciation modeling with detailed breakdowns of asset value over time. Shows both straight-line and accelerated depreciation methods with comparative analysis.

### Utilization Analysis

#### ![Utilization 1](images/frontend_response_success_utilization_1.png)
**Equipment Usage Patterns** - Analysis of equipment utilization patterns and optimization recommendations. Features charts showing usage efficiency, maintenance schedules, and operational optimization opportunities.

#### ![Utilization 2](images/frontend_response_success_utilization_2.png)
**Utilization Optimization** - Detailed utilization analysis with recommendations for improving equipment efficiency and operational performance. Includes cost-benefit analysis of utilization improvements.

### Market Comparisons

#### ![Market Comps 1](images/frontend_response_success_marketcomps_1.png)
**Comparable Equipment Analysis** - Market comparison data showing similar equipment pricing and market positioning. Features comprehensive market data tables with comparable equipment specifications and pricing.

#### ![Market Comps 2](images/frontend_response_success_marketcomps_2.png)
**Market Data Visualization** - Interactive charts and tables displaying market comparison results. Shows equipment positioning relative to market standards and competitive analysis.

### Overview Dashboard

#### ![Overview](images/frontend_response_success_overview.png)
**Processing Overview** - Complete system overview showing processing details, metadata, and analysis timestamps. Displays total elapsed time, processing stages, and system performance metrics for transparency and debugging.

## 🔗 Integration

The frontend and backend work together through:

1. **Webhook Communication**: Frontend sends equipment data to n8n workflow
2. **Async Processing**: Long-running AI analysis with progress tracking
3. **Result Caching**: Redis-based caching for improved performance
4. **Data Visualization**: Interactive dashboards displaying analysis results
5. **Export Generation**: Excel and PDF reports with complete analysis data

## 🚀 Getting Started

1. **Set up n8n Backend**:
   - Import the workflow JSON file
   - Configure API credentials
   - Test webhook endpoints

2. **Deploy Frontend**:
   - Follow frontend setup instructions
   - Configure environment variables
   - Connect to n8n webhook endpoints

3. **Test Integration**:
   - Submit test equipment data
   - Verify analysis completion
   - Check export functionality

## 📚 Documentation

- **Frontend Documentation**: See `frontend/README.md` for detailed frontend setup and features
- **Replit Guide**: See `frontend/replit.md` for Replit-specific deployment information
- **API Reference**: Comprehensive API documentation in frontend README
- **Troubleshooting**: Deployment and integration guides available

## 🤝 Contributing

This is proprietary software developed for Asset Management International (AMI). For technical support, feature requests, or deployment assistance, contact the development team.

## 📄 License

Proprietary software developed for Asset Management International (AMI). All rights reserved.
