#!/bin/bash

# Find all files and directories with " 2" in their names
find . -name "* 2*" -type f -o -name "* 2*" -type d | sort > duplicates.txt

echo "Found potential duplicates:"
cat duplicates.txt
echo ""
echo "Press Enter to continue and process these files, or Ctrl+C to abort"
read

# Process each duplicated file/directory
while read -r duplicate; do
  # Get the original name by removing " 2" from the name
  original=${duplicate//" 2"/}
  
  # Check if the original exists
  if [ -e "$original" ]; then
    echo "Both $duplicate and $original exist."
    
    # If both are directories, merge the contents
    if [ -d "$duplicate" ] && [ -d "$original" ]; then
      echo "  Merging directory contents from $duplicate to $original"
      cp -r "$duplicate"/* "$original"/ 2>/dev/null || echo "  No files to copy"
      echo "  Removing $duplicate"
      rm -rf "$duplicate"
    # If both are files and the duplicate is different
    elif [ -f "$duplicate" ] && [ -f "$original" ] && ! cmp -s "$duplicate" "$original"; then
      echo "  Files differ. Keeping both for now."
      echo "  Consider manually reviewing: $duplicate and $original"
    # If both are the same or we prefer the original
    else
      echo "  Removing duplicate $duplicate"
      rm -rf "$duplicate"
    fi
  else
    echo "Only $duplicate exists. Renaming to $original"
    mv "$duplicate" "$original"
  fi
done < duplicates.txt

echo "Process completed. Please review any remaining issues manually." 