# Infrastructure and Deployment

## Infrastructure as Code

- **Tool:** N/A (Simple deployment)
- **Location:** N/A
- **Approach:** Standard Node.js deployment

## Deployment Strategy

- **Strategy:** Single command deployment with zero configuration
- **CI/CD Platform:** N/A (Developer machine deployment)
- **Pipeline Configuration:** N/A

## Environments

- **Development:** Local development environment - Used for building and testing tools
- **Production:** End user machines - Where researchers run the server to generate applications

## Environment Promotion Flow

```
Development -> User Installation
```

## Rollback Strategy

- **Primary Method:** Version pinning in package.json
- **Trigger Conditions:** Failed tool execution, CLI errors
- **Recovery Time Objective:** Immediate (restart server)
