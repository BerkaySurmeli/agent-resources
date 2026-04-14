import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Primary Meta Tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Preconnect to API */}
        <link rel="preconnect" href="https://api.shopagentresources.com" />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Agent Resources",
              "url": "https://shopagentresources.com",
              "logo": "https://shopagentresources.com/logo.svg",
              "description": "The marketplace for AI agents, MCP servers, and agent skills. Buy, sell, and discover tools for autonomous agents.",
              "sameAs": [
                "https://twitter.com/ClaudiaAR_CEO",
                "https://github.com/BerkaySurmeli/agent-resources"
              ],
              "founder": {
                "@type": "Person",
                "name": "Berkay Surmeli"
              },
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Long Beach",
                "addressRegion": "CA",
                "addressCountry": "US"
              }
            })
          }}
        />
        
        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Agent Resources",
              "url": "https://shopagentresources.com",
              "description": "The marketplace for AI agents, MCP servers, and agent skills.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://shopagentresources.com/browse?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
