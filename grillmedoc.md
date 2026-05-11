# chaipalaka.com project planning

## What was accomplished so far:

### Goal
Personal site hosted on Hetzner, domain managed via AWS Route 53. Main site
(`www.chaipalaka.com`) will be a portfolio/experimental frontend showcasing
WebGL, Three.js, and generative art. Additional subdomains side projects.

### Infrastructure
- Hetzner CX22 (Ubuntu 24.04) at `<HETZNER_IP>`
- Non-root user `chai` with sudo, SSH key auth, UFW firewall (ports 22, 80, 443)
- Caddy as reverse proxy with automatic TLS via Let's Encrypt
- `/var/www/chaipalaka` serves the main static site

### DNS (AWS Route 53 — chaipalaka.com)
| Name | Type | Value |
|------|------|-------|
| *(blank)* | A | `<HETZNER_IP>` |
| `www` | A | `<HETZNER_IP>` |
| `*` | A | `<HETZNER_IP>` |

> **Note**: Leave the name field blank for the root record in Route 53 — typing
> `@` appears to save but doesn't work correctly.

### Caddyfile (`/etc/caddy/Caddyfile`)
```caddy
www.chaipalaka.com, chaipalaka.com {
    root * /var/www/chaipalaka
    file_server
    encode gzip
}
```

## free form thoughts on my expectations and what i want

I want to create a personal website in an experimental style mainly using bleeding-edge front end tech such as three.js, pretext etc written in Typescript and React. The site will be home to something similar to a portfolio (i want to upload swfs of old stick figure animations and art, music etc that i create), a blog, a running 'lifelog' (which i will expand on with further questioning, but for now as example, the current books im reading, what music i'm listening to - pulling from last.fm, things like that), links to socials, to side projects etc. We can consider the specifics of side projects later but they will be hosted on the same server on subdomains of chaipalaka.com (project1.chaipalaka.com).
A main design theme that i want to explore for the site is to use a physics system for certain elements on the page. The foreground will have the content (with the physics system) and the background will be interchangeable generative art of various kinds. I want to explore if this is possible.

