# AMI Residuals Frontend

A professional equipment residual value analysis platform built for Asset Management International (AMI). This application provides comprehensive AI-driven analytics for equipment valuation, depreciation modeling, and financial analysis through an intuitive web interface.

## 📱 Frontend Application Screenshots

### ![Frontend Show 1](../images/frontend_show_1.png)
**Main Application Interface** - Professional equipment residual analysis form with AMI branding. Features the comprehensive 18+ field equipment lease information form with modern UI design, form validation, and intuitive user experience. Shows the main data input interface for equipment valuation analysis.

### ![Frontend Show 2](../images/frontend_show_2.png)
**Form Processing and Progress Tracking** - Real-time progress tracking during long-running AI analysis (6-8+ minutes). Displays the progress bar, processing stages, and status updates as the system communicates with n8n workflows for comprehensive residual value calculations. Shows the user experience during async processing.

### ![Frontend Show 3](../images/frontend_show_3.png)
**Interactive Dashboard and Results** - Complete analysis results dashboard with 6-section presentation including charts, data visualization, and comprehensive export capabilities. Features the executive summary, inflation analysis, depreciation modeling, utilization insights, market comparisons, and processing overview with Excel and PDF export options.

## Overview

The AMI Residuals Frontend is a sophisticated React-based application that integrates with n8n workflows to deliver advanced equipment residual value calculations. The platform handles complex financial analysis through an easy-to-use form interface and presents results in interactive dashboards with comprehensive export capabilities.

### 🌐 Live Application

**Try the application live**: [AMI Residual Analysis Platform](https://ami-residual-agent.replit.app/)

Experience the complete equipment residual value analysis system with real-time AI-powered calculations and comprehensive reporting capabilities.

## Key Features

### 🎯 Core Functionality
- **Equipment Valuation Forms**: Comprehensive 18+ field forms for asset lease information
- **AI-Powered Analysis**: Integration with n8n workflows for advanced residual value calculations
- **Real-Time Processing**: Live progress tracking for long-running analysis (6-8+ minutes)
- **Interactive Dashboards**: 6-section analysis presentation with charts and data visualization
- **Export Capabilities**: Excel and PDF report generation with complete data sets

### 💼 Professional Features
- **AMI Corporate Branding**: Consistent brand identity throughout the application
- **Responsive Design**: Optimized for desktop and mobile devices
- **Form Validation**: Real-time validation with comprehensive error handling
- **Caching System**: Redis-based response caching for improved performance
- **Production Ready**: AWS deployment configuration with robust error handling

### 📊 Analysis Capabilities
- **Residual Value Analysis**: Detailed equipment depreciation and value projections
- **Market Comparisons**: Comparable equipment analysis with pricing data
- **Depreciation Modeling**: MACRS schedules and financial projections
- **Utilization Analysis**: Equipment usage patterns and optimization recommendations
- **Executive Summary**: High-level insights with actionable business recommendations

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Shadcn/UI** component library built on Radix UI
- **Tailwind CSS** for modern, responsive styling
- **React Hook Form** with Zod validation schemas
- **TanStack Query** for server state management
- **Recharts** for interactive data visualization
- **Vite** for optimized development and builds

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Neon serverless hosting
- **Drizzle ORM** for type-safe database operations
- **Redis** caching with in-memory fallback
- **Session management** with PostgreSQL store

### Integrations
- **n8n Workflow Automation**: AI agent integration for residual analysis
- **Webhook Processing**: Asynchronous request handling with status polling
- **Export Libraries**: jsPDF and html2canvas for comprehensive reports
- **File Processing**: Excel export with XLSX formatting

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Redis instance (optional - falls back to memory)
- n8n webhook endpoint configured

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ami-residuals-frontend
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

## Application Architecture

### Project Structure
```
├── client/src/
│   ├── components/ui/      # Shadcn UI components
│   ├── pages/             # Application routes
│   │   ├── asset-form.tsx # Main form interface
│   │   └── test-webhook.tsx # Diagnostic testing
│   ├── lib/               # Utilities and configurations
│   └── hooks/             # Custom React hooks
├── server/
│   ├── routes.ts          # API endpoints and webhook handlers
│   ├── storage.ts         # Database abstraction
│   └── index.ts           # Express server entry point
├── shared/
│   └── schema.ts          # Zod validation schemas
└── dist/                  # Production build artifacts
```

### Data Flow Architecture

1. **Form Submission** → User completes equipment information
2. **Client Validation** → Zod schema validation with real-time feedback
3. **API Processing** → Express backend receives and validates data
4. **Webhook Integration** → n8n workflow receives data for AI analysis
5. **Async Polling** → Frontend polls for completion status with progress tracking
6. **Result Processing** → Backend caches and serves analysis results
7. **Dashboard Display** → Interactive visualization of analysis results
8. **Export Generation** → Excel/PDF reports with complete data and charts

## Core Features

### Form Management
- **Comprehensive Input Fields**: Lessee information, equipment details, financial data, business context
- **Smart Default Values**: Pre-populated test data for quick evaluation
- **Real-Time Validation**: Immediate feedback with detailed error messages
- **Progress Indicators**: Visual tracking during long-running submissions

### Financial Information Section
- **Subject Price**: Primary equipment valuation input
- **Single-Column Layout**: Clean, focused interface design
- **Currency Formatting**: Professional $ symbol positioning
- **Validation Rules**: Positive number requirements with decimal precision

### Webhook Integration
- **n8n Connectivity**: Direct integration with AI analysis workflows
- **Timeout Management**: Handles Cloudflare 100-second limits with async patterns
- **Error Recovery**: Comprehensive error handling with user feedback
- **Status Polling**: Real-time updates during processing

### Interactive Dashboard
- **6 Analysis Sections**:
  - Summary: Key findings and recommendations
  - Inflation: Economic impact analysis
  - Depreciation: MACRS schedules and projections
  - Utilization: Usage patterns and optimization
  - Market Data: Comparable equipment analysis
  - Overview: Processing details and metadata

### Export System
- **Excel Reports**: Complete data export with "BanfieldResidualCalcs_DATETIME" naming
- **PDF Generation**: Multi-page reports with screenshot captures of all dashboard sections
- **Data Integrity**: Accurate preservation of all calculated values
- **Visual Elements**: Charts and tables included in PDF exports

### Caching & Performance
- **Redis Integration**: Primary caching for repeated equipment analyses
- **Memory Fallback**: Graceful degradation when Redis unavailable
- **Smart Cache Keys**: Equipment-based storage with timestamp matching
- **Performance Monitoring**: Cache statistics and hit rate tracking

## API Reference

### Primary Endpoints
```
POST /api/webhook-proxy        # Submit equipment data for analysis
GET  /api/webhook-status/:id   # Check processing status
POST /api/webhook-callback/:id # Receive n8n analysis results
POST /api/webhook-result/:id   # Manual result submission
GET  /api/cache-stats         # Performance metrics
```

### Response Schema
```json
{
  "status": "success",
  "data": {
    "equipment_name": "Volvo A30G Articulating Dump",
    "residual_analysis": {
      "term_months": [12, 24, 36, 48, 60, 72, 84, 96, 108, 120],
      "residual_percentages": [85.2, 73.8, 64.5, 57.1, 51.3, 46.7, 43.1, 40.2, 37.8, 35.9],
      "residual_values": [432113, 374415, 327608, 289813, 260321, 237073, 218745, 204015, 191865, 182103]
    },
    "depreciation_schedule": {...},
    "market_comparisons": {...},
    "utilization_analysis": {...}
  },
  "processing_time": "06:23",
  "timestamp": "2025-01-27T18:30:00Z"
}
```

## Deployment

### Development Environment
- **Hot Reloading**: Automatic frontend updates via Vite HMR
- **Live Restart**: Backend changes trigger automatic server restart
- **Memory Storage**: Optional in-memory database for quick setup
- **Debug Logging**: Comprehensive request and error tracking

### Production Deployment
- **AWS Amplify Ready**: Complete `amplify.yml` configuration
- **Environment Variables**: Secure configuration management
- **Static Asset Serving**: Optimized Express static file handling
- **Database Migrations**: Automated Drizzle schema updates
- **Health Monitoring**: Built-in status endpoints

### Build Process
```bash
npm run build          # Generate production artifacts
npm run db:generate    # Create database migrations
npm run db:push        # Apply schema changes
npm start             # Start production server
```

## Troubleshooting

### Common Issues
1. **Webhook Timeouts**: Verify n8n workflow is active and responding
2. **Database Connection**: Check DATABASE_URL format and accessibility
3. **Redis Connectivity**: Ensure Redis URL is correct or disable for memory fallback
4. **Form Submission Errors**: Review Zod validation requirements

### Debug Tools
- **Test Webhook Interface**: Access `/test-webhook` for diagnostic testing
- **Browser Console**: Detailed frontend error logging and request tracking
- **Server Logs**: Comprehensive backend request/response logging
- **Cache Statistics**: Monitor performance via `/api/cache-stats`

### Performance Optimization
- **Caching Strategy**: Redis for repeated equipment analyses
- **Database Indexing**: Optimized queries for status polling
- **Asset Optimization**: Vite build process for minimal bundle sizes
- **Memory Management**: Efficient cleanup of long-running requests

## Contributing

### Development Standards
- **TypeScript Strict Mode**: Complete type safety throughout
- **Zod Validation**: All API inputs/outputs must use schema validation
- **Error Handling**: Comprehensive try-catch with user-friendly messages
- **Code Documentation**: Clear comments for complex business logic

### Testing
- **Form Validation**: Test all input combinations and edge cases
- **Webhook Integration**: Verify n8n connectivity and response handling
- **Export Functions**: Validate Excel and PDF generation accuracy
- **Cache Behavior**: Test Redis connectivity and fallback scenarios

## License

Proprietary software developed for Asset Management International (AMI). All rights reserved.

## Support

For technical support, feature requests, or deployment assistance, contact the development team or submit issues through the project repository.