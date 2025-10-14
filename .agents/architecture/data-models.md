# Data Models

## Project Model

**Purpose:** Represents a generated scientific application project

**Key Attributes:**
- projectId: string - Unique identifier for the project
- projectName: string - Name given to the project
- path: string - File system path to the project
- createdAt: Date - Timestamp when project was created
- tools: string[] - List of tools added to the project
- dataSources: object[] - Connected data sources with metadata

**Relationships:**
- One project can have multiple data sources
- One project can have multiple task flows
- One project is associated with one configuration

## DataSource Model

**Purpose:** Represents a connected scientific data source

**Key Attributes:**
- sourceId: string - Unique identifier for the data source
- projectId: string - Reference to the project
- type: enum - Format type (CSV, JSON, HDF5, NetCDF)
- path: string - Path to the data file or API endpoint
- schema: object - Inferred schema from the data
- connectionDetails: object - Additional connection parameters
- lastConnected: Date - Timestamp of last successful connection

**Relationships:**
- One data source belongs to one project
- One data source can be used by multiple components
