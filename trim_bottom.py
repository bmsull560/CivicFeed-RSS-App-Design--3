with open('backend/src/articlesRouter.ts', 'r') as f:
    content = f.read()

# Find the last "return router;" and remove everything after it that is import statements
lines = content.split('\n')
# Find the line with "return router;"
return_idx = None
for i, line in enumerate(lines):
    if 'return router;' in line:
        return_idx = i
        break

if return_idx is not None:
    # Keep everything up to and including "return router;" plus the closing brace
    # Find the closing brace after return router
    new_lines = lines[:return_idx + 1]
    # Add the closing brace for the function
    new_lines.append('};')
    content = '\n'.join(new_lines)

with open('backend/src/articlesRouter.ts', 'w') as f:
    f.write(content)
print('Removed bottom imports from articlesRouter')
