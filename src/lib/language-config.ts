// Comprehensive language support for Audio Journal PWA

export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  googleSpeechCode: string
  googleTranslateCode: string
  region?: string
}

// Comprehensive list of supported languages
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  // Major Languages
  { code: 'en', name: 'English', nativeName: 'English', googleSpeechCode: 'en-US', googleTranslateCode: 'en' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', googleSpeechCode: 'es-ES', googleTranslateCode: 'es' },
  { code: 'fr', name: 'French', nativeName: 'Français', googleSpeechCode: 'fr-FR', googleTranslateCode: 'fr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', googleSpeechCode: 'de-DE', googleTranslateCode: 'de' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', googleSpeechCode: 'it-IT', googleTranslateCode: 'it' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', googleSpeechCode: 'pt-BR', googleTranslateCode: 'pt' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', googleSpeechCode: 'ru-RU', googleTranslateCode: 'ru' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', googleSpeechCode: 'ja-JP', googleTranslateCode: 'ja' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', googleSpeechCode: 'ko-KR', googleTranslateCode: 'ko' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', googleSpeechCode: 'zh-CN', googleTranslateCode: 'zh' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', googleSpeechCode: 'zh-TW', googleTranslateCode: 'zh-TW' },
  
  // European Languages
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', googleSpeechCode: 'nl-NL', googleTranslateCode: 'nl' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', googleSpeechCode: 'sv-SE', googleTranslateCode: 'sv' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', googleSpeechCode: 'nb-NO', googleTranslateCode: 'no' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', googleSpeechCode: 'da-DK', googleTranslateCode: 'da' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', googleSpeechCode: 'fi-FI', googleTranslateCode: 'fi' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', googleSpeechCode: 'pl-PL', googleTranslateCode: 'pl' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', googleSpeechCode: 'cs-CZ', googleTranslateCode: 'cs' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', googleSpeechCode: 'sk-SK', googleTranslateCode: 'sk' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', googleSpeechCode: 'hu-HU', googleTranslateCode: 'hu' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', googleSpeechCode: 'ro-RO', googleTranslateCode: 'ro' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', googleSpeechCode: 'bg-BG', googleTranslateCode: 'bg' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', googleSpeechCode: 'hr-HR', googleTranslateCode: 'hr' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', googleSpeechCode: 'sr-RS', googleTranslateCode: 'sr' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', googleSpeechCode: 'sl-SI', googleTranslateCode: 'sl' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', googleSpeechCode: 'et-EE', googleTranslateCode: 'et' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', googleSpeechCode: 'lv-LV', googleTranslateCode: 'lv' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', googleSpeechCode: 'lt-LT', googleTranslateCode: 'lt' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', googleSpeechCode: 'el-GR', googleTranslateCode: 'el' },
  
  // Middle Eastern & African Languages
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', googleSpeechCode: 'ar-SA', googleTranslateCode: 'ar' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', googleSpeechCode: 'he-IL', googleTranslateCode: 'he' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', googleSpeechCode: 'tr-TR', googleTranslateCode: 'tr' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', googleSpeechCode: 'fa-IR', googleTranslateCode: 'fa' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', googleSpeechCode: 'ur-PK', googleTranslateCode: 'ur' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', googleSpeechCode: 'sw-KE', googleTranslateCode: 'sw' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', googleSpeechCode: 'am-ET', googleTranslateCode: 'am' },
  
  // South Asian Languages
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', googleSpeechCode: 'hi-IN', googleTranslateCode: 'hi' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', googleSpeechCode: 'bn-BD', googleTranslateCode: 'bn' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', googleSpeechCode: 'te-IN', googleTranslateCode: 'te' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', googleSpeechCode: 'ta-IN', googleTranslateCode: 'ta' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', googleSpeechCode: 'mr-IN', googleTranslateCode: 'mr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', googleSpeechCode: 'gu-IN', googleTranslateCode: 'gu' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', googleSpeechCode: 'kn-IN', googleTranslateCode: 'kn' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', googleSpeechCode: 'ml-IN', googleTranslateCode: 'ml' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', googleSpeechCode: 'pa-IN', googleTranslateCode: 'pa' },
  
  // Southeast Asian Languages
  { code: 'th', name: 'Thai', nativeName: 'ไทย', googleSpeechCode: 'th-TH', googleTranslateCode: 'th' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', googleSpeechCode: 'vi-VN', googleTranslateCode: 'vi' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', googleSpeechCode: 'id-ID', googleTranslateCode: 'id' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', googleSpeechCode: 'ms-MY', googleTranslateCode: 'ms' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', googleSpeechCode: 'fil-PH', googleTranslateCode: 'tl' },
  { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ', googleSpeechCode: 'my-MM', googleTranslateCode: 'my' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', googleSpeechCode: 'km-KH', googleTranslateCode: 'km' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', googleSpeechCode: 'lo-LA', googleTranslateCode: 'lo' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', googleSpeechCode: 'si-LK', googleTranslateCode: 'si' },
  
  // Regional Variants
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)', googleSpeechCode: 'en-GB', googleTranslateCode: 'en' },
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (Australia)', googleSpeechCode: 'en-AU', googleTranslateCode: 'en' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (Canada)', googleSpeechCode: 'en-CA', googleTranslateCode: 'en' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', googleSpeechCode: 'es-MX', googleTranslateCode: 'es' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', googleSpeechCode: 'es-AR', googleTranslateCode: 'es' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', googleSpeechCode: 'pt-PT', googleTranslateCode: 'pt' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)', googleSpeechCode: 'fr-CA', googleTranslateCode: 'fr' },
]

// Special options for automatic detection
export const AUTO_DETECT_LANGUAGE: LanguageConfig = {
  code: 'auto',
  name: 'Auto-detect',
  nativeName: 'Auto-detect',
  googleSpeechCode: 'auto',
  googleTranslateCode: 'auto'
}

export const MIXED_LANGUAGE_CONFIGS = {
  'en-hi': {
    code: 'en-hi',
    name: 'English + Hindi',
    nativeName: 'English + हिन्दी',
    googleSpeechCode: 'en-IN', // Use Indian English which better handles Hindi mixing
    googleTranslateCode: 'en',
    alternativeCodes: ['en-IN', 'hi-IN', 'en-US']
  },
  'en-es': {
    code: 'en-es',
    name: 'English + Spanish',
    nativeName: 'English + Español',
    googleSpeechCode: 'en-US',
    googleTranslateCode: 'en',
    alternativeCodes: ['en-US', 'es-US', 'es-MX']
  },
  'en-ko': {
    code: 'en-ko',
    name: 'English + Korean',
    nativeName: 'English + 한국어',
    googleSpeechCode: 'en-US',
    googleTranslateCode: 'en',
    alternativeCodes: ['en-US', 'ko-KR']
  }
}

// Helper functions
export function getLanguageByCode(code: string): LanguageConfig | undefined {
  if (code === 'auto') return AUTO_DETECT_LANGUAGE
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code || lang.googleSpeechCode === code)
}

export function getLanguageOptions(): Array<{ value: string; label: string }> {
  const mixedLanguageOptions = Object.values(MIXED_LANGUAGE_CONFIGS).map(config => ({
    value: config.code,
    label: `🔀 ${config.name} (${config.nativeName})`
  }))

  return [
    { value: 'auto', label: `🌐 ${AUTO_DETECT_LANGUAGE.name}` },
    ...mixedLanguageOptions,
    { value: '---', label: '--- Single Languages ---' },
    ...SUPPORTED_LANGUAGES.map(lang => ({
      value: lang.code,
      label: `${lang.name} (${lang.nativeName})`
    }))
  ]
}

export function getPopularLanguages(): LanguageConfig[] {
  const popularCodes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi']
  return popularCodes
    .map(code => getLanguageByCode(code))
    .filter((lang): lang is LanguageConfig => lang !== undefined)
}

export function getRegionalVariants(baseCode: string): LanguageConfig[] {
  return SUPPORTED_LANGUAGES.filter(lang => 
    lang.code.startsWith(baseCode + '-') || lang.code === baseCode
  )
}

// Language detection helpers
export function createLanguageAlternatives(primaryLanguage: string): string[] {
  const alternatives = [primaryLanguage]
  
  // Add regional variants
  const baseCode = primaryLanguage.split('-')[0] || primaryLanguage
  const variants = getRegionalVariants(baseCode)
  variants.forEach(variant => {
    if (variant.googleSpeechCode !== primaryLanguage) {
      alternatives.push(variant.googleSpeechCode)
    }
  })
  
  // Add popular fallbacks
  const fallbacks = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'zh-CN']
  fallbacks.forEach(fallback => {
    if (!alternatives.includes(fallback)) {
      alternatives.push(fallback)
    }
  })
  
  return alternatives.slice(0, 5) // Limit to 5 alternatives
}
