with open('backend/src/articlesRouter.ts', 'r') as f:
    content = f.read()

# Fix top imports
old_top = 'import { type Request, type Response, type Router } from "express";'
new_top = 'import express from "express";\nimport { type Request, type Response, type Router } from "express";'
content = content.replace(old_top, new_top)

# Fix parseTags import
old_parse = 'import { parseTags } from "./search.js";'
new_parse = 'import { parseTags, getRecentArticles, searchArticles } from "./search.js";\nimport { fetchFeed } from "./rss.js";\nimport { type FeedRow } from "./db.js";'
content = content.replace(old_parse, new_parse)

# Remove bottom duplicate imports
bottom = '\n// Import fetchFeed function for use in articles router\nimport { fetchFeed } from "./rss.js";\nimport { getRecentArticles, searchArticles } from "./search.js";\nimport { type FeedRow } from "./db.js";'
content = content.replace(bottom, '')

with open('backend/src/articlesRouter.ts', 'w') as f:
    f.write(content)
print('Fixed articlesRouter.ts')
