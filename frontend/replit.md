# Asset Form Application

## Overview

This is a professional asset management form application built with React/TypeScript on the frontend and Express.js on the backend. The application features a comprehensive asset lease information form with AMI branding, modern UI components, form validation, and direct webhook integration to n8n. The architecture follows a monorepo structure with shared schemas and types between client and server.

## Recent Changes

- **January 17, 2025**: Created professional asset management form with AMI branding
- **January 17, 2025**: Added comprehensive form fields for equipment lease information
- **January 17, 2025**: Integrated n8n webhook submission with CORS handling
- **January 17, 2025**: Added default form values for quick preview functionality
- **January 17, 2025**: Updated webhook URL to production endpoint
- **January 17, 2025**: Implemented POST method for webhook with JSON payload
- **January 17, 2025**: Added 10-minute timeout for long-running agent workflows
- **January 17, 2025**: Added fallback CORS handling with no-cors mode for browser compatibility
- **January 17, 2025**: Implemented server proxy to eliminate CORS issues completely
- **January 17, 2025**: Discovered Cloudflare/n8n infrastructure timeout at ~100 seconds (status 524)
- **January 17, 2025**: Added async webhook pattern with callback and polling endpoints
- **January 17, 2025**: Extended server timeout to 15 minutes for 8+ minute agent workflows  
- **January 17, 2025**: Added real-time progress timer and enhanced waiting experience with progress bar
- **January 23, 2025**: Switched from POST to GET webhook requests for n8n compatibility
- **January 23, 2025**: Enhanced webhook proxy to handle "Respond to Webhook" node responses
- **January 23, 2025**: Added comprehensive debugging and error handling for workflow issues
- **January 23, 2025**: Implemented async mode trigger for incomplete workflow responses
- **January 23, 2025**: Reverted to POST requests to match updated n8n webhook configuration
- **January 23, 2025**: Fixed direct response handling from "Respond to Webhook" node with JSON parsing
- **January 23, 2025**: Enhanced frontend to properly detect and display immediate n8n responses
- **January 23, 2025**: Updated progress bar timing to 4 minutes with adjusted stage intervals
- **January 23, 2025**: Confirmed end-to-end system working perfectly with comprehensive residual analysis results
- **January 23, 2025**: Replaced JSON response display with interactive dashboard featuring inflation, depreciation, market data, and executive summary charts
- **January 23, 2025**: Enhanced dashboard with visible data points, utilization analysis tab, market data table format, and executive summary as first tab with residual value charts
- **January 23, 2025**: Added "Read JSON Response" button for debugging with pretty-printed JSON display and copy functionality
- **January 23, 2025**: Implemented Redis caching system with in-memory fallback to store responses by Item Description indefinitely
- **January 23, 2025**: Added cache checking in webhook proxy endpoints to avoid duplicate n8n requests for same equipment types
- **January 23, 2025**: Enhanced all callback endpoints to automatically cache successful responses for future requests
- **January 24, 2025**: Updated Residual Value Analysis table to use "Term Month" format with 12-month increments instead of Year/Age columns
- **January 24, 2025**: Created comprehensive README.md file for GitHub repository with full documentation of features, architecture, and deployment instructions
- **January 24, 2025**: Updated webhook endpoint from test to production URL (webhook-test → webhook) for live n8n workflow integration
- **January 24, 2025**: Reverted webhook endpoint back to test URL for continued development and testing
- **January 26, 2025**: Prepared repository for AWS Amplify deployment with amplify.yml, environment configuration, and deployment guide
- **January 26, 2025**: Fixed AWS Amplify deployment failures by updating amplify.yml configuration and adding troubleshooting documentation
- **January 26, 2025**: Verified local build process works correctly, generating dist/index.js (backend) and dist/public/ (frontend assets)
- **January 26, 2025**: Fixed AWS Amplify deployment failures by implementing build-safe environment configuration
- **January 26, 2025**: Added database schema exports, build environment detection, and skip Redis/DB during build process
- **January 26, 2025**: Updated amplify.yml with proper environment variables and build commands
- **January 26, 2025**: Verified build works with AWS environment variables (AWS_BUILD=true, NODE_ENV=production)
- **January 27, 2025**: Fixed "Response body already used" error in frontend webhook response handling
- **January 27, 2025**: Enhanced webhook error handling with structured 404 responses and troubleshooting guidance
- **January 27, 2025**: Added dedicated webhook test interface at /test-webhook for diagnostics and n8n activation guidance
- **January 27, 2025**: Improved HTTP error handling for all webhook response codes with clear status indicators
- **January 27, 2025**: Fixed Excel export residual values displaying proper percentages and currency amounts instead of 0% and $0
- **January 27, 2025**: Corrected term month display in Summary table to show proper 12-month increments (12, 24, 36... 120) instead of NaN values
- **January 27, 2025**: Updated processing time display from "Processing Time" to "Total Elapsed Time" in Overview section with actual elapsed duration
- **January 27, 2025**: Added comprehensive PDF export functionality with jsPDF generating formal multi-page reports including all 6 data sections, executive summary, analysis tables, market comparisons, and processing details
- **January 27, 2025**: Enhanced download buttons with separate Excel Data and PDF Report options for complete data export capabilities
- **January 27, 2025**: Fixed Total Duration display to show proper elapsed time with start time, end time, and duration in MM:SS format instead of N/A
- **January 27, 2025**: Updated Excel and PDF filenames to use actual equipment name from response data instead of hardcoded "Volvo A30G"
- **January 27, 2025**: Enhanced PDF export to screenshot all 6 dashboard tabs (Summary, Inflation, Depreciation, Utilization, Market Data, Overview) with complete visual content including all plots, tables, and text using html2canvas
- **January 27, 2025**: Updated default Item Description value to remove "2025" while keeping "Volvo A30G Articulating Dump"
- **January 27, 2025**: Updated webhook URL from test endpoint to production endpoint for live n8n workflow integration
- **January 27, 2025**: Changed Excel export filename format to BanfieldResidualCalcs_DATETIME for standardized naming convention
- **January 27, 2025**: Enhanced Summary section with additional content including market conditions, utilization analysis, optimization opportunities, recommendations, and next steps
- **January 27, 2025**: Improved PDF export timing with 2-3 seconds wait per tab to ensure interactive plots are fully rendered before screenshots
- **January 27, 2025**: Updated README.md with comprehensive documentation of all new features, recent enhancements, export capabilities, and deployment instructions
- **January 27, 2025**: Fixed production polling issue where server restarts caused stuck requests by adding cache fallback and manual completion endpoint
- **January 27, 2025**: Enhanced webhook result caching to store by both equipment type and request ID for better persistence across server restarts
- **January 27, 2025**: Extended frontend polling timeout from 5 minutes to 10 minutes to handle longer n8n workflows (6-8+ minutes)
- **January 27, 2025**: Updated progress bar timing and messaging to reflect realistic 6-8 minute processing expectations
- **January 27, 2025**: Fixed production webhook response matching by implementing smart request ID matching in backend polling endpoints
- **January 27, 2025**: Enhanced webhook-result endpoint to automatically find and update pending requests by timestamp when n8n posts results
- **January 27, 2025**: Completely removed AMI Average field from Financial Information section and updated form layout to single-column design
- **January 27, 2025**: Updated Zod schema validation to remove amiAverage field requirement from all form validation
- **January 27, 2025**: Created comprehensive README.md for ami-residuals-frontend repository with complete feature documentation and deployment instructions

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Hook Form for form state, TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Caching**: Redis with in-memory fallback for residual analysis responses
- **Session Management**: Built-in session handling with PostgreSQL session store
- **Development**: TSX for TypeScript execution

### Key Components

1. **Asset Form System**
   - Comprehensive form with 18+ fields including lessee information, asset details, pricing, and terms
   - Zod schema validation for type safety and runtime validation
   - Form submission handling with loading states and toast notifications

2. **Database Layer**
   - Drizzle ORM configured for PostgreSQL
   - Schema definitions in shared directory for type consistency
   - Memory storage implementation for development/testing

3. **Caching System**
   - Redis cache for storing residual analysis responses by Item Description
   - In-memory fallback when Redis is unavailable
   - Automatic caching of all successful webhook responses
   - Cache statistics endpoint for monitoring performance

4. **UI Component Library**
   - Complete Shadcn/ui component suite including forms, dialogs, tables, charts
   - Custom theming with light/dark mode support
   - Responsive design with mobile-first approach

5. **Type Safety**
   - Shared TypeScript types between client and server
   - Zod schemas for runtime validation
   - Strong typing throughout the application stack

## Data Flow

1. **Form Submission**: User fills out asset form with validation feedback
2. **Client Validation**: Zod schema validates form data before submission
3. **API Request**: Form data sent to backend via fetch API
4. **Server Processing**: Express routes handle form data and database operations
5. **Database Operations**: Drizzle ORM manages PostgreSQL interactions
6. **Response Handling**: Success/error feedback via toast notifications

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives, Shadcn/ui components
- **Form Handling**: React Hook Form, Hookform Resolvers
- **Data Fetching**: TanStack React Query
- **Styling**: Tailwind CSS, Class Variance Authority
- **Icons**: Lucide React
- **Utilities**: Date-fns, CLSX

### Backend Dependencies
- **Database**: Neon Database (serverless PostgreSQL)
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Session**: Connect-pg-simple for PostgreSQL session storage
- **Validation**: Zod for schema validation
- **Development**: TSX for TypeScript execution

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: TSX with nodemon-like functionality
- **Database**: Environment variable-based connection to Neon Database

### Production
- **Frontend**: Vite build generates static assets
- **Backend**: ESBuild bundles server code for Node.js execution
- **Database**: PostgreSQL connection via DATABASE_URL environment variable
- **Static Assets**: Served directly by Express in production

### Build Process
1. Frontend assets built with Vite to `dist/public`
2. Backend code bundled with ESBuild to `dist/index.js`
3. Database migrations applied via Drizzle Kit
4. Single Node.js process serves both API and static assets

The application is designed for easy deployment on platforms like Replit, with automatic environment detection and appropriate middleware configuration for development vs production environments.