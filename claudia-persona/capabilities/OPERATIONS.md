# Operations Capabilities

Claudia's business operations, automation, and systems management skills.

## Payment Processing

### Stripe Integration
- **Connect**: Marketplace payments
- **Checkout**: Direct payments
- **Subscriptions**: Recurring billing
- **Webhooks**: Event handling

### Implementation
```python
# Create payment intent
import stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

intent = stripe.PaymentIntent.create(
    amount=4900,  # $49.00
    currency="usd",
    automatic_payment_methods={"enabled": True}
)
```

### Connect (Marketplace)
- Onboard sellers
- Split payments
- Handle transfers
- Manage payouts

## Email Operations

### Transactional Email
- **Platform**: Resend
- **Types**: Welcome, receipts, notifications
- **Templates**: HTML + text
- **Deliverability**: SPF, DKIM, DMARC

### Campaigns
- **Broadcasts**: One-time sends
- **Segmentation**: Targeted lists
- **Automation**: Triggered sequences
- **Analytics**: Open rates, clicks

### Email Types
- Welcome sequences
- Password resets
- Payment confirmations
- Product updates
- Marketing campaigns

## Database Administration

### PostgreSQL
- **Schema design**: Tables, relationships
- **Migrations**: Version control
- **Backups**: Automated dumps
- **Performance**: Indexing, query optimization

### Common Operations
```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup_file.sql

# Connect to database
psql $DATABASE_URL
```

### Migration Management
```python
# Alembic migration
alembic revision --autogenerate -m "Add users table"
alembic upgrade head
```

## Security & Compliance

### Security Scanning
- **VirusTotal**: File scanning
- **Dependency checks**: Vulnerability scanning
- **Code review**: Security patterns
- **Access control**: Authentication, authorization

### Compliance
- **GDPR**: Data protection
- **CCPA**: Privacy rights
- **SOC 2**: Security controls
- **PCI DSS**: Payment security

### Best Practices
- Never commit secrets
- Use environment variables
- Rotate API keys regularly
- Enable 2FA everywhere

## Automation & Workflows

### Cron Jobs
- **Scheduled tasks**: Daily, weekly
- **Backups**: Automated dumps
- **Reports**: Regular generation
- **Maintenance**: Cleanup tasks

### Webhook Handling
```python
@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    event = stripe.Webhook.construct_event(
        payload, sig_header, webhook_secret
    )
    
    if event["type"] == "payment_intent.succeeded":
        await handle_payment_success(event["data"]["object"])
    
    return {"status": "ok"}
```

### Workflow Automation
- User onboarding flows
- Listing approval process
- Payment reconciliation
- Notification triggers

## Infrastructure

### Docker
```dockerfile
# Multi-stage build
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
CMD ["python", "main.py"]
```

### Railway
- **Deployment**: Git-based
- **Databases**: Managed PostgreSQL
- **Environment**: Variables, secrets
- **Scaling**: Auto-scale

### Vercel
- **Frontend**: Next.js deployment
- **Serverless**: API routes
- **Edge**: Global CDN
- **Preview**: Branch deployments

## Monitoring & Logging

### Application Logs
- **Structured logging**: JSON format
- **Log levels**: DEBUG, INFO, WARN, ERROR
- **Aggregation**: Centralized logs
- **Alerting**: Error notifications

### Health Checks
```python
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": await check_database(),
        "timestamp": datetime.utcnow()
    }
```

### Metrics
- **Performance**: Response times
- **Usage**: Active users
- **Errors**: Error rates
- **Business**: Revenue, conversions

## Business Operations

### User Management
- **Onboarding**: Welcome flows
- **Support**: Ticket handling
- **Retention**: Churn prevention
- **Feedback**: Collection, analysis

### Financial Operations
- **Reconciliation**: Payment matching
- **Reporting**: Revenue reports
- **Taxes**: 1099s, VAT
- **Payouts**: Seller payments

### Vendor Management
- **API providers**: Stripe, Resend
- **Hosting**: Railway, Vercel
- **Tools**: Monitoring, analytics
- **Contracts**: Terms, renewals

## Documentation

### Technical Docs
- API documentation
- Architecture diagrams
- Runbooks
- Troubleshooting guides

### User Docs
- Getting started guides
- Feature documentation
- FAQs
- Video tutorials

### Process Docs
- Standard operating procedures
- Onboarding checklists
- Security policies
- Incident response

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups
- **Files**: S3 versioning
- **Code**: Git repository
- **Config**: Infrastructure as code

### Recovery Procedures
```bash
# Database recovery
1. Identify backup file
2. Stop application
3. Restore from backup
4. Verify data integrity
5. Restart application
6. Monitor for issues
```

### Incident Response
1. **Detect**: Monitoring alerts
2. **Assess**: Impact analysis
3. **Contain**: Stop the bleeding
4. **Resolve**: Fix the issue
5. **Review**: Post-mortem

## Cost Optimization

### Cloud Costs
- **Right-sizing**: Appropriate resources
- **Reserved instances**: Long-term discounts
- **Spot instances**: Non-critical workloads
- **Cleanup**: Remove unused resources

### Monitoring
- Monthly cost reviews
- Budget alerts
- Usage analysis
- Optimization opportunities

---

*Operations capabilities documentation*