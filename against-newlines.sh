#!/usr/bin/env bash
  # mj-lint-changed.sh — Lint only lines changed vs a 
  base branch                                           
  # Usage: ./mj-lint-changed.sh [base-branch] 
  [eslint-config]                                       
  #   base-branch defaults to "next"
  #   eslint-config defaults to ".eslintrc.mj.json"     
                                                        
  BASE="${1:-next}"
  CONFIG="${2:-.eslintrc.mj.json}"                      
                             
  # 1. Collect existing TS files changed in the diff    
  (excluding generated code)
  CHANGED_FILES=$(git diff "$BASE"...HEAD --name-only \ 
    | grep '\.ts$' \         
    | grep -v 'generated/' \
    | grep -v '^migrations/' \                          
    | grep -v '^metadata/' \
    | grep -v '\.changeset/' \                          
    | grep -v '^plans/' \                               
    | while read f; do [ -f "$f" ] && echo "$f"; done)
                                                        
  if [ -z "$CHANGED_FILES" ]; then                      
    echo "No changed TS files found."
    exit 0                                              
  fi                         

  # 2. Run ESLint, capture JSON; filter to MJ rules;    
  cross-reference with diff
  {                                                     
    echo "$CHANGED_FILES" | xargs npx eslint -c
  "$CONFIG" --format json 2>/dev/null                   
    echo "---DIFF---"
    git diff "$BASE"...HEAD --unified=0 -- '*.ts'       
  } | python3 -c "                                      
  import sys, re, json
                                                        
  raw = sys.stdin.read()     
  json_part, _, diff_part = 
  raw.partition('---DIFF---\n')                         
   
  # ── Parse diff to get file -> set of added/changed   
  line numbers ──            
  current_file = None                                   
  file_lines = {}            
  for line in diff_part.splitlines():
      m = re.match(r'^\+\+\+ b/(.*)', line)
      if m:                                             
          current_file = m.group(1)
          file_lines.setdefault(current_file, set())    
          continue           
      m = re.match(r'^@@ -\d+(?:,\d+)? 
  \+(\d+)(?:,(\d+))? @@', line)                         
      if m and current_file:
          start = int(m.group(1))                       
          count = int(m.group(2)) if m.group(2) else 1
          for i in range(start, start + count):         
              file_lines[current_file].add(i)
                                                        
  # ── Parse ESLint JSON and filter ──                  
  try:
      data = json.loads(json_part)                      
  except json.JSONDecodeError:
      print('ERROR: Failed to parse ESLint JSON output',
   file=sys.stderr)
      sys.exit(1)                                       
                             
  counts = {}
  total = 0
  for f in data:                                        
      # Normalize path to repo-relative
      path = f['filePath']                              
      for prefix in [p for p in file_lines]:
          if path.endswith(prefix):                     
              rel = prefix   
              break                                     
      else:                  
          # Try stripping cwd
          rel = re.sub(r'^.*?/(?=packages/|src/)', '',  
  path)                                                 
                                                        
      for msg in f['messages']:                         
          rule = msg.get('ruleId', '') or ''
          if not rule.startswith('memberjunction/'):    
              continue
          lineno = msg['line']                          
          if rel in file_lines and lineno in            
  file_lines[rel]:
              short_rule =                              
  rule.replace('memberjunction/', '')                   
              counts[short_rule] = 
  counts.get(short_rule, 0) + 1                         
              total += 1     
              print(f\"{rel}:{lineno}:{msg['column']} 
  [{rule}] {msg['message']}\")                          
   
  print()                                               
  print(f'Total: {total} warnings on changed lines')
  for rule, count in sorted(counts.items(), key=lambda  
  x: -x[1]):
      print(f'  {count:3d}  {rule}')                    
  "                                    