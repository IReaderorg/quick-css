# IReader DevTools

Tools to help developers create IReader sources by finding CSS selectors on novel websites.

## 📦 What's Included

### 1. Chrome Extension - Selector Helper (v4.0)
A simple, noob-friendly tool to find CSS selectors by drag-selecting areas on any webpage.

### 2. Python Scripts
- `create_source_interactive.py` - Generate Kotlin source code using Gemini AI
- `launcher.py` - Interactive launcher for the workflow
- `validate_config.py` - Validate exported configurations

## 🚀 Quick Start

### Install the Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `scripts/devtools/extension` folder
5. The IReader icon appears in your toolbar

### Using the Extension

1. **Go to any novel website**
2. **Click the IReader extension icon** in your toolbar
3. **Drag to select** an area containing elements you want selectors for
   - Or just **click** on a specific element
4. **Browse the results panel:**
   - ✓ Green = unique selector (best!)
   - ~ Yellow = few matches
   - • Gray = many matches
5. **Use the tools:**
   - 👁 Preview - see what content the selector extracts
   - 🎯 Highlight - highlight matching elements on page
   - 📋 Copy - copy selector to clipboard
6. **Filter results:**
   - Use the search box
   - Click field hints (Title, Author, Cover, etc.)
7. **Export** all selectors as JSON if needed

### Generate Kotlin Source (Optional)

```bash
# Set your Gemini API key
set GEMINI_API_KEY=your-key-here

# Run the generator
python scripts/devtools/create_source_interactive.py your_config.json
```

Use the **IReader Selector Helper** Chrome extension to easily find CSS selectors on any website:

1. Install the extension from `scripts/devtools/extension/`
2. Click the extension icon on any novel website
3. Drag to select an area → get all CSS selectors
4. Copy the ones you need for your source

📖 **[Quick Start Guide](./SELECTOR_HELPER_QUICKSTART.md)** (5 minutes)  
📚 **[Full Documentation](./SELECTOR_HELPER_GUIDE.md)**

## 🎯 Extension Features

### Smart Selection
- **Drag to select** - Select an area to analyze all elements within
- **Click to select** - Click on a single element to analyze it and its children
- **ESC to cancel** - Press Escape anytime to exit

### Results Panel
- **Quick Copy** - Top recommended selectors with one-click copy
- **Search** - Filter selectors by name or content
- **Field Hints** - Quick filters for Title, Author, Cover, Chapter, etc.
- **Preview** - See what text/content each selector extracts
- **Highlight** - Visually highlight matching elements on the page
- **Select Again** - Make another selection without closing
- **Export** - Download all selectors as JSON

### Selector Scoring
The extension scores selectors based on:
- Uniqueness (single match = best)
- Selector type (ID > class > tag)
- Semantic naming (contains "title", "author", etc.)
- Selector length (shorter = better)

## 💡 Tips for Finding Selectors

### For IReader Sources, You Need:

**Explore/List Page:**
- Novel card container
- Title within card
- Cover image
- Link to novel page

**Detail Page:**
- Novel title
- Author
- Description
- Cover image
- Status
- Genres

**Chapter List:**
- Chapter item container
- Chapter name
- Chapter link

**Content Page:**
- Chapter content container

### Best Practices

1. **Look for green checkmarks** - These are unique selectors
2. **Use field hints** - Click "Title", "Author", etc. to filter
3. **Preview before copying** - Make sure it extracts the right content
4. **Test on multiple pages** - Verify selectors work across the site
5. **Prefer class selectors** - They're usually more stable than tag selectors

## 📁 File Structure

```
scripts/devtools/
├── extension/
│   ├── manifest.json      # Extension config
│   ├── background.js      # Service worker
│   ├── selector.js        # Main selector logic
│   ├── selector.css       # Styles
│   ├── README.md          # Extension docs
│   └── images/            # Icons
├── create_source_interactive.py
├── launcher.py
├── validate_config.py
├── start.bat
└── README.md              # This file
```

## 🔧 Troubleshooting

**Extension doesn't activate?**
- Make sure you're on a regular webpage (not chrome:// pages)
- Try refreshing the page

**No selectors found?**
- Make your selection area larger
- Try clicking directly on an element instead of dragging

**Selector doesn't work in your source?**
- Some sites load content dynamically
- Try a more general selector
- Check if the site uses JavaScript rendering

## 📝 Version History

- **v4.0** - Complete redesign with drag-to-select flow
- **v3.0** - Previous popup-based UI with AI features
