# Component Library & UI Patterns

## Overview

This document defines the reusable component library and UI patterns for the Audio Journal PWA, built with modern React patterns and accessibility-first design.

## Design System Foundations

### Color Palette

```css
:root {
  /* Primary Colors */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;

  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Semantic Colors */
  --success-50: #ecfdf5;
  --success-500: #10b981;
  --success-600: #059669;
  --success-700: #047857;

  --warning-50: #fffbeb;
  --warning-500: #f59e0b;
  --warning-600: #d97706;
  --warning-700: #b45309;

  --error-50: #fef2f2;
  --error-500: #ef4444;
  --error-600: #dc2626;
  --error-700: #b91c1c;

  /* Special Colors */
  --audio-waveform: #3b82f6;
  --audio-background: #f3f4f6;
  --text-selection: rgba(59, 130, 246, 0.2);
}
```

### Typography Scale

```css
:root {
  /* Font Families */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Spacing Scale

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-7: 1.75rem;   /* 28px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Border Radius

```css
:root {
  --radius-sm: 0.125rem;  /* 2px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;  /* Fully rounded */
}
```

### Shadows

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}
```

## Core Components

### Button Component

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button'
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          // Variants
          'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500': variant === 'primary',
          'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500': variant === 'secondary',
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500': variant === 'outline',
          'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
          'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500': variant === 'danger',

          // Sizes
          'px-3 py-2 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',

          // States
          'opacity-50 cursor-not-allowed': disabled,
          'w-full': fullWidth
        }
      )}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}
```

### Input Component

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

function Input({
  type = 'text',
  placeholder,
  value,
  defaultValue,
  disabled = false,
  error,
  label,
  helperText,
  required = false,
  fullWidth = false,
  startIcon,
  endIcon,
  onChange,
  onBlur,
  onFocus
}: InputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const displayValue = value !== undefined ? value : internalValue;

  return (
    <div className={cn('flex flex-col', { 'w-full': fullWidth })}>
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {startIcon}
          </div>
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={displayValue}
          disabled={disabled}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          className={cn(
            'block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
            {
              'w-full': fullWidth,
              'pl-10': startIcon,
              'pr-10': endIcon,
              'border-error-500 focus:border-error-500 focus:ring-error-500': error,
              'bg-gray-50 cursor-not-allowed': disabled
            }
          )}
        />

        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {endIcon}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p className={cn('mt-1 text-sm', {
          'text-error-600': error,
          'text-gray-500': !error
        })}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
```

### Card Component

```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
}

function Card({
  title,
  subtitle,
  children,
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false,
  onClick,
  actions
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg overflow-hidden',
        {
          // Padding
          'p-0': padding === 'none',
          'p-4': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg',

          // Shadow
          'shadow-sm': shadow === 'sm',
          'shadow-md': shadow === 'md',
          'shadow-lg': shadow === 'lg',
          'shadow-xl': shadow === 'xl',

          // Border
          'border border-gray-200': border,

          // Hover
          'hover:shadow-md transition-shadow cursor-pointer': hover,

          // Clickable
          'cursor-pointer': onClick
        }
      )}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}

      {children}
    </div>
  );
}
```

## Specialized Components

### UploadZone Component

```typescript
interface UploadZoneProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  loading?: boolean;
  onFilesSelected: (files: File[]) => void;
  children?: React.ReactNode;
}

function UploadZone({
  accept = 'audio/*',
  multiple = true,
  maxSize = 500 * 1024 * 1024, // 500MB
  disabled = false,
  loading = false,
  onFilesSelected,
  children
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || loading) return;

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file =>
      file.type.startsWith('audio/') && file.size <= maxSize
    );

    if (validFiles.length > 0) {
      onFilesSelected(multiple ? validFiles : [validFiles[0]]);
    }
  }, [disabled, loading, multiple, maxSize, onFilesSelected]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesSelected(multiple ? files : [files[0]]);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        {
          'border-primary-400 bg-primary-50': isDragOver,
          'border-gray-300 hover:border-gray-400': !isDragOver && !disabled,
          'border-gray-200 bg-gray-50 cursor-not-allowed': disabled,
          'opacity-50': loading
        }
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {children || (
        <div>
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {loading ? 'Processing...' : 'Drop audio files here or click to browse'}
          </p>
        </div>
      )}
    </div>
  );
}
```

### AudioPlayer Component

```typescript
interface AudioPlayerProps {
  src: string;
  duration?: number;
  waveformData?: number[];
  showWaveform?: boolean;
  showTimestamps?: boolean;
  onTimeUpdate?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

function AudioPlayer({
  src,
  duration,
  waveformData,
  showWaveform = true,
  showTimestamps = true,
  onTimeUpdate,
  onPlay,
  onPause,
  className
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        onPause?.();
      } else {
        audioRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border p-4', className)}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {showWaveform && waveformData && (
        <Waveform
          data={waveformData}
          duration={duration || 0}
          currentTime={currentTime}
          onSeek={handleSeek}
          className="mb-4"
        />
      )}

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          className="p-2"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </Button>

        <div className="flex-1">
          <Slider
            value={currentTime}
            max={duration || 0}
            onChange={handleSeek}
            className="w-full"
          />
        </div>

        {showTimestamps && (
          <span className="text-sm text-gray-500 font-mono">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>
        )}

        <div className="flex items-center space-x-2">
          <VolumeIcon className="h-4 w-4 text-gray-400" />
          <Slider
            value={volume}
            max={1}
            step={0.1}
            onChange={setVolume}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}
```

### ProgressIndicator Component

```typescript
interface ProgressIndicatorProps {
  progress: number; // 0-100
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

function ProgressIndicator({
  progress,
  variant = 'linear',
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  className
}: ProgressIndicatorProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  if (variant === 'circular') {
    const radius = size === 'sm' ? 16 : size === 'md' ? 24 : 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg
          className="transform -rotate-90"
          width={radius * 2 + 8}
          height={radius * 2 + 8}
        >
          <circle
            cx={radius + 4}
            cy={radius + 4}
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={radius + 4}
            cy={radius + 4}
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={cn({
              'text-primary-600': color === 'primary',
              'text-success-600': color === 'success',
              'text-warning-600': color === 'warning',
              'text-error-600': color === 'error'
            })}
            strokeLinecap="round"
          />
        </svg>

        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium">
              {label || `${Math.round(clampedProgress)}%`}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">{Math.round(clampedProgress)}%</span>
        </div>
      )}

      <div className={cn('bg-gray-200 rounded-full overflow-hidden', {
        'h-2': size === 'sm',
        'h-3': size === 'md',
        'h-4': size === 'lg'
      })}>
        <div
          className={cn('h-full transition-all duration-300 ease-in-out rounded-full', {
            'bg-primary-600': color === 'primary',
            'bg-success-600': color === 'success',
            'bg-warning-600': color === 'warning',
            'bg-error-600': color === 'error'
          })}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
```

## Layout Components

### Container Component

```typescript
interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  centerContent?: boolean;
  children: React.ReactNode;
  className?: string;
}

function Container({
  size = 'lg',
  padding = 'md',
  centerContent = false,
  children,
  className
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto',
        {
          // Size
          'max-w-2xl': size === 'sm',
          'max-w-4xl': size === 'md',
          'max-w-6xl': size === 'lg',
          'max-w-7xl': size === 'xl',
          'max-w-none': size === 'full',

          // Padding
          'px-4': padding === 'sm',
          'px-6': padding === 'md',
          'px-8': padding === 'lg',

          // Content alignment
          'flex items-center justify-center min-h-screen': centerContent
        },
        className
      )}
    >
      {children}
    </div>
  );
}
```

### Grid Component

```typescript
interface GridProps {
  columns?: number | { [key: string]: number };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
}

function Grid({
  columns = 1,
  gap = 'md',
  children,
  className
}: GridProps) {
  const getColumnsClass = (cols: number | { [key: string]: number }) => {
    if (typeof cols === 'number') {
      return `grid-cols-${cols}`;
    }

    return Object.entries(cols)
      .map(([breakpoint, colCount]) => `${breakpoint}:grid-cols-${colCount}`)
      .join(' ');
  };

  return (
    <div
      className={cn(
        'grid',
        getColumnsClass(columns),
        {
          'gap-0': gap === 'none',
          'gap-4': gap === 'sm',
          'gap-6': gap === 'md',
          'gap-8': gap === 'lg',
          'gap-12': gap === 'xl'
        },
        className
      )}
    >
      {children}
    </div>
  );
}
```

## Utility Components

### Spinner Component

```typescript
interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

function Spinner({ size = 'md', color = 'primary', className }: SpinnerProps) {
  return (
    <svg
      className={cn(
        'animate-spin',
        {
          'h-3 w-3': size === 'xs',
          'h-4 w-4': size === 'sm',
          'h-6 w-6': size === 'md',
          'h-8 w-8': size === 'lg',
          'h-12 w-12': size === 'xl'
        },
        {
          'text-primary-600': color === 'primary',
          'text-white': color === 'white',
          'text-gray-400': color === 'gray'
        },
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
```

### Badge Component

```typescript
interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

function Badge({
  variant = 'gray',
  size = 'md',
  children,
  className
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        {
          // Variants
          'bg-primary-100 text-primary-800': variant === 'primary',
          'bg-gray-100 text-gray-800': variant === 'secondary',
          'bg-success-100 text-success-800': variant === 'success',
          'bg-warning-100 text-warning-800': variant === 'warning',
          'bg-error-100 text-error-800': variant === 'error',
          'bg-gray-100 text-gray-800': variant === 'gray',

          // Sizes
          'px-2.5 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-sm': size === 'md'
        },
        className
      )}
    >
      {children}
    </span>
  );
}
```

## Pattern Components

### EmptyState Component

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}

      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
```

### ErrorBoundary Component

```typescript
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full mx-4">
        <div className="text-center">
          <AlertTriangleIcon className="mx-auto h-12 w-12 text-error-500 mb-4" />

          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>

          <p className="text-gray-600 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>

          <div className="flex space-x-3 justify-center">
            <Button onClick={resetError} variant="primary">
              Try again
            </Button>

            <Button onClick={() => window.location.reload()} variant="outline">
              Reload page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ComponentType<ErrorFallbackProps> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<ErrorFallbackProps> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
```

This component library provides a comprehensive set of reusable UI components following modern React patterns, accessibility standards, and consistent design principles for the Audio Journal PWA.
