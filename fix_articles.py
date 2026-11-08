with open('backend/src/articlesRouter.ts', 'r') as f:
    content = f.read()

# Remove bottom imports
bottom = '''\n// Import fetchFeed function for use in articles router
import { fetchFeed } from "./rss.js";
import { searchArticles, getRecentArticles, parseTags } from "./search.js";
import { type FeedRow } from "./db.js";'''
content = content.replace(bottom, '')

with open('backend/src/articlesRouter.ts', 'w') as f:
    f.write(content)
print('Fixed articlesRouter - removed bottom imports')
