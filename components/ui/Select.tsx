'use client'

import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  useImperativeHandle,
} from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Loader2, X, Search } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  description?: string
  badge?: string
}

export interface SelectGroup {
  label: string
  options: SelectOption[]
}

export type SelectItem = SelectOption | SelectGroup

export function isSelectGroup(item: SelectItem): item is SelectGroup {
  return 'options' in item && Array.isArray((item as SelectGroup).options)
}

export interface SelectChangeEvent {
  target: { value: string; name?: string }
  currentTarget: { value: string; name?: string }
  type: 'change'
}

export interface SelectProps {
  id?: string
  name?: string
  label?: string
  placeholder?: string
  error?: string
  helperText?: string
  value?: string | number
  defaultValue?: string | number
  options?: SelectItem[]
  children?: React.ReactNode
  onChange?: (
    event: SelectChangeEvent | any
  ) => void
  onValueChange?: (value: string) => void
  disabled?: boolean
  loading?: boolean
  required?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  icon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  portal?: boolean
  searchable?: boolean
  clearable?: boolean
  onClear?: () => void
  autoFocus?: boolean
  tabIndex?: number
}

export interface SelectRef {
  focus: () => void
  blur: () => void
  open: () => void
  close: () => void
}

/**
 * Parses JSX children (<option>, <optgroup>) into SelectItem array
 * for backwards compatibility with legacy JSX option tags.
 */
function parseChildrenToOptions(children: React.ReactNode): SelectItem[] {
  const items: SelectItem[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    const props = child.props as any
    const childType = child.type as any
    const typeName = typeof childType === 'string' ? childType : childType?.name

    if (typeName === 'optgroup' || props.label && React.Children.count(props.children) > 0) {
      const groupOptions: SelectOption[] = []
      React.Children.forEach(props.children, (optChild) => {
        if (!React.isValidElement(optChild)) return
        const optProps = optChild.props as any
        const optVal = optProps.value !== undefined ? String(optProps.value) : ''
        const optLabel =
          typeof optProps.children === 'string'
            ? optProps.children
            : optVal
        groupOptions.push({
          value: optVal,
          label: optLabel,
          disabled: !!optProps.disabled,
        })
      })
      items.push({
        label: props.label || '',
        options: groupOptions,
      })
    } else if (typeName === 'option' || props.value !== undefined) {
      const val = props.value !== undefined ? String(props.value) : ''
      const lbl =
        typeof props.children === 'string'
          ? props.children
          : props.children !== undefined
          ? String(props.children)
          : val
      items.push({
        value: val,
        label: lbl,
        disabled: !!props.disabled,
      })
    }
  })

  return items
}

/**
 * Flatten items for indexing & keyboard navigation
 */
function flattenOptions(items: SelectItem[]): SelectOption[] {
  const flat: SelectOption[] = []
  for (const item of items) {
    if (isSelectGroup(item)) {
      flat.push(...item.options)
    } else {
      flat.push(item)
    }
  }
  return flat
}

export const Select = forwardRef<SelectRef | any, SelectProps>(function Select(
  {
    id,
    name,
    label,
    placeholder = 'Select an option...',
    error,
    helperText,
    value: controlledValue,
    defaultValue,
    options: rawOptions,
    children,
    onChange,
    onValueChange,
    disabled = false,
    loading = false,
    required = false,
    className = '',
    triggerClassName = '',
    contentClassName = '',
    icon,
    size = 'md',
    portal = true,
    searchable = false,
    clearable = false,
    onClear,
    autoFocus = false,
    tabIndex = 0,
  },
  ref
) {
  const generatedId = useId()
  const selectId = id || generatedId
  const listboxId = `${selectId}-listbox`
  const labelId = `${selectId}-label`

  // Compile options from either prop or children
  const parsedItems: SelectItem[] = React.useMemo(() => {
    if (rawOptions && rawOptions.length > 0) return rawOptions
    if (children) return parseChildrenToOptions(children)
    return []
  }, [rawOptions, children])

  const flatOptions = React.useMemo(() => flattenOptions(parsedItems), [parsedItems])

  // Controlled vs Uncontrolled state
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (isControlled) return String(controlledValue ?? '')
    if (defaultValue !== undefined) return String(defaultValue)
    return ''
  })

  const currentValue = isControlled ? String(controlledValue ?? '') : internalValue

  const selectedOption = flatOptions.find((opt) => opt.value === currentValue)

  // Dropdown open state
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuPosition, setMenuPosition] = useState<{
    top: number
    left: number
    width: number
    openUpward: boolean
    maxHeight: number
  }>({
    top: 0,
    left: 0,
    width: 0,
    openUpward: false,
    maxHeight: 260,
  })

  // Mounting check for SSR Portal
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)

  // Imperative handle
  useImperativeHandle(ref, () => ({
    focus: () => triggerRef.current?.focus(),
    blur: () => triggerRef.current?.blur(),
    open: () => openMenu(),
    close: () => closeMenu(),
  }))

  // Position calculation
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    const estimatedHeight = 240

    const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow
    const maxHeight = Math.max(160, Math.min(300, openUpward ? spaceAbove - 16 : spaceBelow - 16))

    let left = rect.left
    const width = Math.max(rect.width, 160)

    // Ensure it doesn't clip right screen edge
    if (left + width > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - width - 8)
    }

    const top = openUpward
      ? rect.top - 4
      : rect.bottom + 4

    setMenuPosition({
      top,
      left,
      width,
      openUpward,
      maxHeight,
    })
  }, [])

  const openMenu = useCallback(() => {
    if (disabled || loading) return
    updatePosition()
    setIsOpen(true)
    setSearchQuery('')
    const idx = flatOptions.findIndex((opt) => opt.value === currentValue && !opt.disabled)
    setHighlightedIndex(idx >= 0 ? idx : 0)
  }, [disabled, loading, updatePosition, flatOptions, currentValue])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setSearchQuery('')
  }, [])

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }, [isOpen, closeMenu, openMenu])

  // Commit option selection
  const selectOptionValue = useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue)
      }

      if (onChange) {
        const syntheticEvent: SelectChangeEvent = {
          target: { value: newValue, name },
          currentTarget: { value: newValue, name },
          type: 'change',
        }
        ;(syntheticEvent as any).value = newValue
        onChange(syntheticEvent)
      }

      if (onValueChange) {
        onValueChange(newValue)
      }

      closeMenu()
      triggerRef.current?.focus()
    },
    [isControlled, name, onChange, onValueChange, closeMenu]
  )

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!isOpen) return

    const handleScrollOrResize = () => {
      updatePosition()
    }

    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)

    return () => {
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [isOpen, updatePosition])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return
      }
      closeMenu()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, closeMenu])

  // Keyboard navigation on Trigger
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          openMenu()
        } else if (e.key === 'ArrowDown') {
          // Move highlight
          setHighlightedIndex((prev) => {
            let next = prev + 1
            while (next < flatOptions.length && flatOptions[next]?.disabled) {
              next++
            }
            return next < flatOptions.length ? next : prev
          })
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          openMenu()
        } else {
          setHighlightedIndex((prev) => {
            let next = prev - 1
            while (next >= 0 && flatOptions[next]?.disabled) {
              next--
            }
            return next >= 0 ? next : prev
          })
        }
        break
      case 'Escape':
        if (isOpen) {
          e.preventDefault()
          closeMenu()
        }
        break
      case 'Tab':
        if (isOpen) {
          closeMenu()
        }
        break
      default:
        // Quick type-ahead search if not already searching
        if (!isOpen && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const char = e.key.toLowerCase()
          const match = flatOptions.find(
            (o) => !o.disabled && o.label.toLowerCase().startsWith(char)
          )
          if (match) {
            selectOptionValue(match.value)
          }
        }
        break
    }
  }

  // Focus search input when searchable menu opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !contentRef.current) return
    const el = contentRef.current.querySelector(
      `[data-option-index="${highlightedIndex}"]`
    ) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [isOpen, highlightedIndex])

  // Filter items if searching
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return parsedItems
    const q = searchQuery.toLowerCase()

    return parsedItems
      .map((item) => {
        if (isSelectGroup(item)) {
          const matchingOpts = item.options.filter((o) =>
            o.label.toLowerCase().includes(q)
          )
          if (matchingOpts.length === 0) return null
          return { ...item, options: matchingOpts }
        } else {
          return item.label.toLowerCase().includes(q) ? item : null
        }
      })
      .filter(Boolean) as SelectItem[]
  }, [parsedItems, searchQuery])

  // Heights based on size prop
  const sizeStyles = {
    sm: 'h-8 text-xs px-2.5 gap-1.5',
    md: 'h-9 text-sm px-3 gap-2',
    lg: 'h-10 text-sm px-3.5 gap-2.5',
  }[size]

  // Render the Dropdown Content
  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={contentRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? labelId : undefined}
          initial={{ opacity: 0, y: menuPosition.openUpward ? 6 : -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: menuPosition.openUpward ? 4 : -4, scale: 0.98 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: menuPosition.openUpward ? undefined : `${menuPosition.top}px`,
            bottom: menuPosition.openUpward
              ? `${window.innerHeight - menuPosition.top}px`
              : undefined,
            left: `${menuPosition.left}px`,
            width: `${menuPosition.width}px`,
            maxHeight: `${menuPosition.maxHeight}px`,
            zIndex: 9999,
          }}
          className={`flex flex-col rounded-xl border border-border bg-surface-elevated/95 backdrop-blur-md shadow-2xl p-1 text-text-primary outline-none select-none overflow-hidden ${contentClassName}`}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              closeMenu()
              triggerRef.current?.focus()
            }
          }}
        >
          {/* Optional inline search bar */}
          {(searchable || flatOptions.length > 12) && (
            <div className="p-1.5 border-b border-border/60 mb-1 flex items-center gap-1.5 text-text-tertiary">
              <Search className="w-3.5 h-3.5 shrink-0 ml-1 text-text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setHighlightedIndex(0)
                }}
                placeholder="Search..."
                className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-tertiary outline-none py-1"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setHighlightedIndex((prev) => Math.min(prev + 1, flatOptions.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setHighlightedIndex((prev) => Math.max(prev - 1, 0))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    const visibleFlat = flattenOptions(filteredItems)
                    const chosen = visibleFlat[highlightedIndex] || visibleFlat[0]
                    if (chosen && !chosen.disabled) {
                      selectOptionValue(chosen.value)
                    }
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:text-text-primary rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Scrollable list of items */}
          <div className="flex-1 overflow-y-auto overscroll-contain space-y-0.5 custom-scrollbar pr-0.5">
            {filteredItems.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-text-tertiary">
                No matching options
              </div>
            ) : (
              (() => {
                let currentItemIndex = 0

                return filteredItems.map((item, itemIdx) => {
                  if (isSelectGroup(item)) {
                    return (
                      <div key={item.label || itemIdx} className="py-1">
                        {item.label && (
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary select-none">
                            {item.label}
                          </div>
                        )}
                        <div className="space-y-0.5">
                          {item.options.map((opt) => {
                            const thisIdx = currentItemIndex++
                            const isSelected = opt.value === currentValue
                            const isHighlighted = thisIdx === highlightedIndex

                            return (
                              <div
                                key={opt.value}
                                data-option-index={thisIdx}
                                role="option"
                                aria-selected={isSelected}
                                aria-disabled={opt.disabled}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!opt.disabled) selectOptionValue(opt.value)
                                }}
                                onMouseEnter={() => {
                                  if (!opt.disabled) setHighlightedIndex(thisIdx)
                                }}
                                className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-100 ${
                                  opt.disabled
                                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                                    : isSelected
                                    ? 'bg-brand/10 text-brand font-semibold'
                                    : isHighlighted
                                    ? 'bg-surface-hover text-text-primary'
                                    : 'text-text-secondary hover:text-text-primary'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  {opt.icon && (
                                    <span className="shrink-0 text-text-tertiary group-hover:text-text-primary">
                                      {opt.icon}
                                    </span>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate">{opt.label}</span>
                                    {opt.description && (
                                      <span className="text-[10px] text-text-tertiary truncate">
                                        {opt.description}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {opt.badge && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-tertiary font-bold uppercase">
                                      {opt.badge}
                                    </span>
                                  )}
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-brand shrink-0 animate-in fade-in zoom-in-75 duration-100" />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  } else {
                    const opt = item
                    const thisIdx = currentItemIndex++
                    const isSelected = opt.value === currentValue
                    const isHighlighted = thisIdx === highlightedIndex

                    return (
                      <div
                        key={opt.value}
                        data-option-index={thisIdx}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={opt.disabled}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!opt.disabled) selectOptionValue(opt.value)
                        }}
                        onMouseEnter={() => {
                          if (!opt.disabled) setHighlightedIndex(thisIdx)
                        }}
                        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-100 ${
                          opt.disabled
                            ? 'opacity-40 cursor-not-allowed pointer-events-none'
                            : isSelected
                            ? 'bg-brand/10 text-brand font-semibold'
                            : isHighlighted
                            ? 'bg-surface-hover text-text-primary'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {opt.icon && (
                            <span className="shrink-0 text-text-tertiary group-hover:text-text-primary">
                              {opt.icon}
                            </span>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{opt.label}</span>
                            {opt.description && (
                              <span className="text-[10px] text-text-tertiary truncate">
                                {opt.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {opt.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-tertiary font-bold uppercase">
                              {opt.badge}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-brand shrink-0 animate-in fade-in zoom-in-75 duration-100" />
                          )}
                        </div>
                      </div>
                    )
                  }
                })
              })()
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          id={labelId}
          htmlFor={selectId}
          className="text-xs font-semibold text-text-secondary select-none flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}

      {/* Trigger & Hidden native form element */}
      <div className="relative flex items-center w-full">
        {/* Hidden form input so FormData and standard forms work */}
        <input
          ref={hiddenInputRef}
          type="hidden"
          id={selectId}
          name={name}
          value={currentValue}
          required={required}
        />

        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-labelledby={label ? labelId : undefined}
          aria-invalid={!!error}
          disabled={disabled || loading}
          autoFocus={autoFocus}
          tabIndex={tabIndex}
          onClick={toggleMenu}
          onKeyDown={handleTriggerKeyDown}
          className={`w-full flex items-center justify-between rounded-lg border bg-surface-elevated text-text-primary font-normal transition-all duration-150 select-none ${sizeStyles} ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-surface'
              : 'cursor-pointer hover:border-border-hover'
          } ${
            error
              ? 'border-error focus-visible:border-error focus-visible:ring-1 focus-visible:ring-error/20'
              : isOpen
              ? 'border-brand ring-1 ring-brand/30 shadow-sm'
              : 'border-border focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/30'
          } ${triggerClassName}`}
        >
          {/* Left slot / icon / value */}
          <div className="flex items-center gap-2 min-w-0 pr-1.5">
            {icon && (
              <span className="shrink-0 text-text-tertiary flex items-center">
                {icon}
              </span>
            )}
            {selectedOption?.icon && (
              <span className="shrink-0 text-text-tertiary flex items-center">
                {selectedOption.icon}
              </span>
            )}

            <span
              className={`truncate text-left ${
                selectedOption
                  ? 'text-text-primary'
                  : 'text-text-tertiary'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          {/* Right slot: clear, loading, chevron */}
          <div className="flex items-center gap-1.5 shrink-0 text-text-tertiary">
            {clearable && currentValue && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation()
                  selectOptionValue('')
                  onClear?.()
                }}
                className="p-0.5 rounded hover:bg-surface-overlay hover:text-text-primary transition-colors cursor-pointer"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}

            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand shrink-0" />
            ) : (
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-brand' : 'text-text-tertiary'
                }`}
              />
            )}
          </div>
        </button>
      </div>

      {/* Render Dropdown Menu either in Portal or inline */}
      {portal && mounted && typeof document !== 'undefined'
        ? createPortal(dropdownContent, document.body)
        : dropdownContent}

      {/* Validation / Helper text */}
      {error ? (
        <p className="text-xs text-error font-medium" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-text-tertiary">{helperText}</p>
      ) : null}
    </div>
  )
})

export default Select
