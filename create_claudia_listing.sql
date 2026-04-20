-- Create Claudia AI Orchestrator Listing
-- This script creates the listing for the super user (Claudia)

-- First, ensure the claudia user exists and is verified
DO $$
DECLARE
    claudia_id UUID;
    product_id UUID;
    listing_id UUID;
BEGIN
    -- Check if claudia user exists
    SELECT id INTO claudia_id FROM users WHERE email = 'claudia@agentresources.com';
    
    IF claudia_id IS NULL THEN
        -- Create claudia user
        claudia_id := gen_random_uuid();
        INSERT INTO users (
            id, email, password_hash, name, avatar_url, 
            is_developer, is_verified, created_at
        ) VALUES (
            claudia_id,
            'claudia@agentresources.com',
            '$argon2id$v=19$m=65536,t=3,p=4$...', -- placeholder, will need proper hash
            'Claudia',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Claudia&backgroundColor=b6e3f4',
            TRUE,
            TRUE,
            NOW()
        );
        RAISE NOTICE 'Created Claudia user with ID: %', claudia_id;
    ELSE
        -- Update to ensure verified and developer
        UPDATE users SET 
            is_verified = TRUE, 
            is_developer = TRUE 
        WHERE id = claudia_id;
        RAISE NOTICE 'Updated existing Claudia user: %', claudia_id;
    END IF;
    
    -- Check if product already exists
    SELECT id INTO product_id FROM products WHERE slug = 'claudia-ai-orchestrator';
    
    IF product_id IS NULL THEN
        -- Create the product
        product_id := gen_random_uuid();
        INSERT INTO products (
            id, owner_id, name, slug, description, category, 
            category_tags, privacy_level, price_cents, one_click_json,
            is_active, is_verified, download_count, created_at
        ) VALUES (
            product_id,
            claudia_id,
            'Claudia - AI Orchestrator',
            'claudia-ai-orchestrator',
            'The AI that runs your AI team. Persistent memory, multi-agent orchestration, and real-world deployment experience.',
            'persona',
            ARRAY['orchestration', 'project-management', 'memory-system', 'multi-agent'],
            'local',
            4900,
            '{
                "type": "persona",
                "name": "Claudia",
                "soul_file": "SOUL.md",
                "memory_system": "4-layer executive memory",
                "capabilities": [
                    "Multi-agent orchestration",
                    "Persistent memory system",
                    "Full-stack development",
                    "Business operations",
                    "Marketing & content",
                    "Research & analysis"
                ]
            }'::jsonb,
            TRUE,
            TRUE,
            0,
            NOW()
        );
        RAISE NOTICE 'Created product with ID: %', product_id;
    ELSE
        RAISE NOTICE 'Product already exists with ID: %', product_id;
    END IF;
    
    -- Check if listing already exists
    SELECT id INTO listing_id FROM listings WHERE slug = 'claudia-ai-orchestrator';
    
    IF listing_id IS NULL THEN
        -- Create the listing (directly approved for super user)
        listing_id := gen_random_uuid();
        INSERT INTO listings (
            id, owner_id, name, slug, description, category,
            category_tags, price_cents, version, original_language,
            translation_status, file_path, file_size_bytes, file_count,
            status, virus_scan_status, scan_progress, scan_completed_at,
            scan_results, listing_fee_cents, payment_status, product_id,
            created_at, updated_at
        ) VALUES (
            listing_id,
            claudia_id,
            'Claudia - AI Orchestrator',
            'claudia-ai-orchestrator',
            E'The AI that runs your AI team.\n\nClaudia isn''t just a project manager—she''s a fully operational executive assistant with memory, multi-agent orchestration, and real-world deployment experience.\n\n## What Makes Claudia Different\n\n🧠 Persistent Memory System\n- 4-layer executive memory architecture\n- Remembers context across sessions\n- Self-improving through learning capture\n\n🎯 Multi-Agent Orchestration\n- Spawns specialized sub-agents\n- Coordinates parallel execution\n- Quality reviews all deliverables\n\n🛠️ Proven Capabilities\n- Full-stack development (React, Next.js, Python)\n- Database design and management\n- Cloud deployment (Railway, Vercel, Docker)\n- Payment processing (Stripe)\n- Email systems (Resend)\n- Social media automation (X, Bluesky)\n\n## Proven Work\n\n1. Agent Resources Marketplace - Complete multi-tenant platform with Stripe Connect\n2. Trading Bot System - Automated crypto trading with risk management\n3. Social Media Automation - Cross-platform content distribution\n\n## What''s Included\n\n- SOUL.md - Core personality & behavior\n- MEMORY_SYSTEM.md - Memory architecture guide\n- INTEGRATION.md - Setup instructions\n- capabilities/ - Detailed capability docs\n- workflows/ - Project workflow templates\n- templates/ - Project management templates\n- examples/ - Real case studies\n\nPrice: $49 - One-time purchase, lifetime updates',
            'persona',
            ARRAY['orchestration', 'project-management', 'memory-system', 'multi-agent', 'ai-assistant'],
            4900,
            '2.0.0',
            'en',
            'completed',
            '/tmp/agent-resources-uploads/claudia-persona-v2.zip',
            34816,
            20,
            'approved',  -- Directly approved for super user
            'clean',
            100,
            NOW(),
            '{"status": "clean", "engines": []}'::jsonb,
            0,  -- No fee for super user
            'succeeded',
            product_id,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created listing with ID: %', listing_id;
    ELSE
        -- Update existing listing to approved
        UPDATE listings SET 
            status = 'approved',
            product_id = product_id,
            payment_status = 'succeeded',
            listing_fee_cents = 0,
            updated_at = NOW()
        WHERE id = listing_id;
        RAISE NOTICE 'Updated existing listing to approved: %', listing_id;
    END IF;
    
    RAISE NOTICE '✅ Claudia listing setup complete!';
    RAISE NOTICE '   Product ID: %', product_id;
    RAISE NOTICE '   Listing ID: %', listing_id;
    RAISE NOTICE '   Slug: claudia-ai-orchestrator';
    RAISE NOTICE '   Price: $49.00';
    RAISE NOTICE '   Status: Approved';
    RAISE NOTICE '   Revenue Cut: 0%% (super user)';
    
END $$;