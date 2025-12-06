# IReader Selector Helper v4.0

A simple, noob-friendly Chrome extension to find CSS selectors for creating IReader novel sources.

## 🎯 How It Works

1. **Click the extension icon** in your browser toolbar
2. **Drag to select** an area on the page containing the elements you want
3. **Browse the results** - see all CSS selectors found in your selection
4. **Filter & Search** - use the search box or field hints to narrow down
5. **Preview & Copy** - see what each selector matches, then copy it

## 📦 Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this `extension` folder
5. The IReader icon will appear in your toolbar

## 🔧 Features

### Smart Selector Detection
- Finds IDs, classes, tags, and attribute selectors
- Generates parent-child combinations
- Filters out generated/framework IDs (React, Vue, etc.)

### Visual Feedback
- ✓ Green checkmark = unique selector (1 match)
- ~ Yellow tilde = few matches (2-5)
- • Gray dot = many matches (6+)
- Green left border = recommended selector

### Field Hints
Quick filters for common IReader fields:
- **Title** - Novel/chapter titles
- **Author** - Author names
- **Cover** - Cover images
- **Description** - Synopsis/summary
- **Chapter** - Chapter list items
- **Content** - Chapter text content
- **Link** - URLs/hrefs
- **Status** - Ongoing/Complete
- **Genre** - Tags/categories

### Actions
- 👁 **Preview** - See the text/content this selector extracts
- 🎯 **Highlight** - Highlight matching elements on the page
- 📋 **Copy** - Copy selector to clipboard

## 💡 Tips for Noobs

### Finding the Right Selector

1. **Start with the area** - Select a region that contains what you need
2. **Look for green checkmarks** - These are unique selectors (best!)
3. **Use field hints** - Click "Title", "Author", etc. to filter relevant selectors
4. **Preview before copying** - Make sure it extracts the right content
5. **Highlight to verify** - See exactly which elements match

### Common Patterns

| What You Need | Look For |
|---------------|----------|
| Novel title | `.title`, `h1`, `.novel-title` |
| Author | `.author`, `.writer` |
| Cover image | `img`, `.cover img` |
| Chapter list | `.chapter-item`, `li` with chapter text |
| Chapter content | `.content`, `.chapter-content`, `#content` |

### For IReader Sources

When creating a source, you typically need:

1. **Explore/List page selectors:**
   - Novel card container
   - Title within card
   - Cover image within card
   - Link to novel page

2. **Detail page selectors:**
   - Novel title
   - Author
   - Description
   - Cover image
   - Status
   - Genres

3. **Chapter list selectors:**
   - Chapter item container
   - Chapter name
   - Chapter link

4. **Content page selectors:**
   - Chapter content container

## 🐛 Troubleshooting

**Extension doesn't activate?**
- Make sure you're on a regular webpage (not chrome:// pages)
- Try refreshing the page

**No selectors found?**
- Make sure your selection area is large enough
- Try selecting a different area

**Selector doesn't work in your source?**
- Some sites load content dynamically - the selector might not exist on initial page load
- Try using a more general selector

## 📝 Example Workflow

1. Go to a novel site (e.g., a novel detail page)
2. Click the IReader extension icon
3. Drag to select the area with the novel title
4. In the panel, click "Title" hint to filter
5. Find a selector with ✓ (unique match)
6. Click 👁 to preview - make sure it shows the title
7. Click 📋 to copy
8. Paste into your IReader source code

Repeat for author, description, cover, chapters, etc.

## 🔄 Version History

- **v4.0** - Complete redesign with drag-to-select flow
- **v3.0** - Previous version with popup UI
