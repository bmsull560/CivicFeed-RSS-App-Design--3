with open('backend/src/feedsRouter.ts', 'r') as f:
    content = f.read()

# Add express import at top
old = 'import { type Request, type Response, type Router } from "express";'
new = 'import express from "express";\nimport { type Request, type Response, type Router } from "express";'
content = content.replace(old, new)

with open('backend/src/feedsRouter.ts', 'w') as f:
    f.write(content)
print('Fixed feedsRouter express import')
