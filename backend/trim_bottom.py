with open('backend/src/articlesRouter.ts', 'r') as f:
    content = f.read()

lines = content.split('\n')
return_idx = None
for i, line in enumerate(lines):
    if 'return router;' in line:
        return_idx = i
        break

if return_idx is not None:
    # Find the closing brace line after return router
    # The function ends with }; after return router
    # Let's just truncate after the line that has the closing brace
    # Find the line with just "};" after return_idx
    for j in range(return_idx, len(lines)):
        if lines[j].strip() == '};':
            new_lines = lines[:j+1]
            content = '\n'.join(new_lines)
            break

with open('backend/src/articlesRouter.ts', 'w') as f:
    f.write(content)
print('Trimmed articlesRouter')
