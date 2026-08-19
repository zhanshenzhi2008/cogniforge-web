export type CfButtonTone =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'icon'
  | 'icon-accent'
  | 'icon-danger'

export type CfButtonMapped = {
  color: 'primary' | 'neutral' | 'error'
  variant: 'solid' | 'outline' | 'ghost'
  size: 'md' | 'xs'
}

/** 能点的主操作走实心主题色；禁用态由 CSS 统一成灰色。 */
export function mapCfButtonTone(tone: CfButtonTone): CfButtonMapped {
  if (tone === 'primary') {
    return { color: 'primary', variant: 'solid', size: 'md' }
  }
  if (tone === 'secondary') {
    return { color: 'neutral', variant: 'outline', size: 'md' }
  }
  if (tone === 'danger') {
    return { color: 'error', variant: 'solid', size: 'md' }
  }
  if (tone === 'icon-accent') {
    return { color: 'primary', variant: 'ghost', size: 'xs' }
  }
  if (tone === 'icon-danger') {
    return { color: 'error', variant: 'ghost', size: 'xs' }
  }
  return { color: 'neutral', variant: 'ghost', size: 'xs' }
}

export function cfButtonRootClass(tone: CfButtonTone, opts: {
  showLabelInline: boolean
  block?: boolean
}): string[] {
  const compact = tone.startsWith('icon')
  return [
    'cf-btn',
    `cf-btn--${tone}`,
    !opts.showLabelInline && 'cf-btn--icon-only',
    !compact && 'cf-btn--lg',
    !compact && !opts.showLabelInline && 'cf-btn--lg-icon',
    opts.block && 'cf-btn--block',
  ].filter(Boolean) as string[]
}
