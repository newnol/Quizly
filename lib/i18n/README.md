# Internationalization (i18n) Guide

This project supports **English** and **Vietnamese** languages.

## How to use translations in components

### 1. Import the hook

```tsx
import { useTranslation } from "@/lib/i18n/language-context"
```

### 2. Use translations in your component

```tsx
export function MyComponent() {
  const t = useTranslation()
  
  return (
    <div>
      <h1>{t.common.loading}</h1>
      <button>{t.common.save}</button>
    </div>
  )
}
```

## Adding new translations

Edit `/lib/i18n/translations.ts`:

```ts
export const translations = {
  en: {
    mySection: {
      title: "My Title",
      description: "My Description"
    }
  },
  vi: {
    mySection: {
      title: "Tiêu đề của tôi",
      description: "Mô tả của tôi"
    }
  }
}
```

Then use it:

```tsx
const t = useTranslation()
return <h1>{t.mySection.title}</h1>
```

## Available translation sections

- `common` - Common words (save, cancel, delete, etc.)
- `nav` - Navigation items
- `home` - Home page
- `sets` - Question sets
- `questions` - Questions management
- `import` - Import dialog
- `quiz` - Quiz mode
- `flashcard` - Flashcard mode
- `history` - Review history
- `footer` - Footer

## Language Toggle

The `LanguageToggle` component is already added to the main page header. Users can switch between English and Vietnamese from the dropdown menu.

