#!/bin/bash

# Check if a directory was provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <directory_path>"
    exit 1
fi

DIRECTORY="$1"

# Check if directory exists
if [ ! -d "$DIRECTORY" ]; then
    echo "Error: '$DIRECTORY' is not a valid directory"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "Error: ImageMagick's magick command is not installed or not in PATH"
    exit 1
fi

echo "Starting conversion of all JPEG files in $DIRECTORY to progressive format..."

# Find all JPG and JPEG files and convert them to progressive
find "$DIRECTORY" -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0 |
while IFS= read -r -d $'\0' file; do
    echo "Converting $file to progressive JPEG..."
    # Convert to progressive JPEG using the magick command
    magick "$file" -interlace JPEG -quality 95 "$file"

    if [ $? -eq 0 ]; then
        echo "✓ Successfully converted: $file"
    else
        echo "✗ Error converting: $file"
    fi
done

echo "Conversion complete!"