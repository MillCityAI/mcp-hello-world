# MCP Hello World

A minimal MCP (Model Context Protocol) server that responds with "Hello, World" via Streamable HTTP. This project serves as a reference implementation and integration testing baseline for MCP client development.

## Features

- **Streamable HTTP MCP endpoint** at `/mcp` that returns "Hello, World"
- **Health check endpoint** at `/healthz` for monitoring
- **Prometheus metrics** at `/metrics` for observability
- **Production-ready** with proper error handling, logging, and security
- **TypeScript** codebase with comprehensive test coverage
- **Docker support** for containerized deployment
- **Cloud Run ready** for serverless deployment

## Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Test the endpoints**
   ```bash
   # Health check
   curl http://localhost:8080/healthz

   # Metrics
   curl http://localhost:8080/metrics

   # MCP endpoint (POST request)
   curl -X POST http://localhost:8080/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
   ```

## Using with MCP Inspector

The primary use case is connecting via [MCP Inspector](https://mcp-inspector.com/) for integration testing:

1. **Deploy or run locally** (see deployment options below)

2. **Open MCP Inspector** in your browser

3. **Connect to your MCP server**
   - **Local development**: `http://localhost:8080/mcp`  
   - **Cloud Run**: `https://your-service-url.run.app/mcp`

4. **Verify connection**
   - You should see "Hello, World" message
   - Connection status should show as **connected**
   - Response time should be < 300ms (excluding cold starts)

## API Endpoints

### `POST /mcp` - MCP Streamable HTTP

Main MCP endpoint that implements the Streamable HTTP protocol.

**Request:**
```json
{
  "jsonrpc": "2.0", 
  "method": "initialize",
  "id": 1
}
```

**Response:** Server-Sent Events stream
```
data: {"jsonrpc":"2.0","id":1,"result":{"message":"Hello, World","timestamp":"2025-08-28T...","server":"mcp-hello-world","version":"0.1.0"}}
```

**Headers:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-store`
- `Access-Control-Allow-Origin: *`

### `GET /healthz` - Health Check

Returns server health status and uptime.

**Response:**
```json
{
  "status": "ok",
  "uptime_s": 120,
  "timestamp": "2025-08-28T...",
  "version": "0.1.0"
}
```

### `GET /metrics` - Prometheus Metrics  

Returns metrics in Prometheus text exposition format.

**Key Metrics:**
- `mcp_hello_world_http_requests_total` - HTTP request counter
- `mcp_hello_world_handshake_total` - MCP handshake counter  
- `mcp_hello_world_handshake_duration_seconds` - MCP handshake latency
- `mcp_hello_world_uptime_seconds` - Server uptime
- `mcp_hello_world_cold_start_total` - Cold start counter (Cloud Run)

## Development

### Scripts

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Type check
npm run typecheck

# Docker build
npm run docker:build

# Docker run
npm run docker:run
```

### Testing

The project has comprehensive test coverage with 38 tests covering:

- **Core MCP functionality** - handshake, response format, error handling
- **HTTP endpoints** - health checks, metrics, CORS
- **Error scenarios** - malformed requests, method validation
- **Metrics collection** - counters, histograms, gauges
- **Logging** - structured logs, request IDs

Run tests with coverage:
```bash
npm test
```

### Code Quality

- **ESLint** for code linting with TypeScript rules
- **Prettier** for code formatting
- **TypeScript** with strict configuration
- **Vitest** for testing with coverage reporting
- **Conventional Commits** for commit messages

## Deployment

### Docker

1. **Build the image**
   ```bash
   docker build -t mcp-hello-world .
   ```

2. **Run the container**  
   ```bash
   docker run -p 8080:8080 mcp-hello-world
   ```

### Google Cloud Platform (Automated)

This project uses GCP Cloud Build for automated CI/CD. Every push to the main branch triggers:

1. **Automated Build Pipeline** (via `cloudbuild.yaml`):
   - Code quality checks (TypeScript, ESLint)
   - Test execution with coverage
   - Docker image build and push to Artifact Registry
   - SBOM generation and security scanning
   - Automatic deployment to Cloud Run
   - Health checks and endpoint testing

2. **Setup GCP Cloud Build Trigger**:
   ```bash
   # Enable required APIs
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   
   # Create Artifact Registry repository
   gcloud artifacts repositories create mcp-servers \
     --repository-format=docker \
     --location=us-central1
   
   # Set up Cloud Build trigger (via Console or CLI)
   gcloud alpha builds triggers create github \
     --repo-name=mcp-hello-world \
     --repo-owner=MillCityAI \
     --branch-pattern=^main$ \
     --build-config=cloudbuild.yaml
   ```

3. **Manual Deployment** (if needed):
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

4. **Get the service URL**:
   ```bash
   gcloud run services describe mcp-hello-world \
     --platform managed \
     --region us-central1 \
     --format 'value(status.url)'
   ```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 8080 | Server port |
| `NODE_ENV` | No | development | Environment (development/production) |
| `LOG_LEVEL` | No | info/debug | Logging level |
| `REGION` | No | unknown | Deployment region |
| `BUILD_SHA` | No | dev | Build/commit SHA |
| `INSTANCE_ID` | No | local | Instance identifier |

## Architecture

### Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify (high performance HTTP server)
- **Language**: TypeScript with strict configuration
- **Logging**: Pino (structured JSON logging)
- **Metrics**: prom-client (Prometheus metrics)
- **Testing**: Vitest + @vitest/coverage-v8
- **Container**: Multi-stage Docker build with Alpine Linux

### Security

- **OWASP ASVS Level 1** compliance
- **CORS** properly configured for MCP Inspector
- **Rate limiting** (100 requests/minute)
- **Security headers** via Helmet
- **Input validation** and request size limits
- **Secrets management** via environment variables
- **Non-root container** execution
- **Log sanitization** (redacts auth headers)

### Performance

- **Target latency**: p95 < 300ms (excluding cold starts)
- **Cold start tracking** for Cloud Run deployments  
- **Connection pooling** and keep-alive
- **Efficient JSON parsing** and SSE streaming
- **Graceful shutdown** handling

## Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with tests
4. **Run the test suite** (`npm test`)
5. **Run linting** (`npm run lint`)
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to the branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

## License

Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [Model Context Protocol](https://github.com/modelcontextprotocol/protocol) - The MCP specification
- [MCP Inspector](https://mcp-inspector.com/) - MCP client testing tool  
- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework

## Support

- **Documentation**: See the `/Documentation` folder for detailed specs
- **Issues**: Report bugs via [GitHub Issues](https://github.com/MillCityAI/mcp-hello-world/issues)  
- **Community**: Join the MCP community discussions

---

🤖 Generated with [Claude Code](https://claude.ai/code)