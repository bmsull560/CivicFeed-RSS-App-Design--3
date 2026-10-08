with open('backend/src/articlesRouter.ts', 'r') as f:
    lines = f.read().split('\n')

# Find and remove the duplicate fetchFeed line (line with both RssEntry and fetchFeed)
new_lines = []
for line in lines:
    if 'import { type RssEntry, fetchFeed } from "./rss.js";' in line:
        continue  # Skip duplicate
    new_lines.append(line)

with open('backend/src/articlesRouter.ts', 'w') as f:
    f.write('\n'.join(new_lines))
print('Fixed duplicate import')
