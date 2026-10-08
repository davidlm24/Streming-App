// PwStreamer Live — component types (documentation; the bundle is plain JS).
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

export type Platform = 'youtube' | 'facebook' | 'twitch' | 'instagram' | 'linkedin' | 'tiktok' | 'kick' | 'rumble' | 'x' | 'custom' | 'rtmp';

export interface LogoProps { /** Mark only. */ showText?: boolean; iconSize?: number; textSize?: 'sm' | 'md' | 'lg' | 'xl'; /** Console: ink only, no gradient, no glow. */ monochrome?: boolean; className?: string }
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { /** `primary` is the screen's one action; `ghost` secondary; `danger` ends or deletes. */ variant?: 'primary' | 'ghost' | 'danger'; /** `lg` only for the screen's action; `sm` on dense surfaces. */ size?: 'sm' | 'md' | 'lg'; /** Disables AND announces aria-busy; icon becomes a spinner. */ loading?: boolean; icon?: ReactNode }
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { /** Required accessible name. */ label: string; children: ReactNode }
export interface TextActionProps { onClick?: () => void; /** External link: opens a new tab and says so. */ href?: string; size?: 'xs' | 'sm'; /** Inline link in a sentence. */ underlined?: boolean; icon?: ReactNode; children: ReactNode; className?: string }
export interface MenuItem { label: string; onSelect?: () => void; icon?: ReactNode; /** Destructive: text in `sig-texto`. */ danger?: boolean }
export interface MenuProps { label: string; items: MenuItem[]; trigger?: ReactNode; triggerClassName?: string; header?: ReactNode; side?: 'down' | 'up'; align?: 'right' | 'left'; defaultOpen?: boolean }
export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> { label: string; hint?: string; /** Replaces the hint; sets aria-invalid and raises the border to `ink-hi`. */ error?: string; /** Text action beside the label. */ action?: ReactNode; mono?: boolean; as?: 'input' | 'textarea' | 'select' }
export interface StreamKeyProps { label?: string; value: string; hint?: string }
export interface SwitchProps { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean; /** Saving: stays put at 45% with aria-busy. */ busy?: boolean }
export interface SwitchRowProps extends Omit<SwitchProps, 'label'> { title: string; description?: string; label?: string }
export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> { children: ReactNode }
export interface SegmentedProps<T extends string = string> { label: string; options: { value: T; label: string }[]; value?: T; onChange?: (v: T) => void; /** Equal-width options filling the container (narrow panels). */ full?: boolean; disabled?: boolean }
export interface SliderProps { label: string; value?: number; min?: number; max?: number; step?: number; onChange?: (v: number) => void; format?: (v: number) => string; disabled?: boolean }
export interface ChipProps { children: ReactNode; onClick?: () => void; platform?: Platform; state?: 'ready' | 'pending' | 'off'; /** Pending word: "sem chave", "desligado". */ stateLabel?: string; label?: string; /** Dashed "add" chip. */ add?: boolean }
export interface PlatformIconProps { platform: Platform | string; size?: number; className?: string }
export type HealthState = 'stable' | 'unstable' | 'down' | 'reconnecting' | 'off';
export interface DestinationHealthProps { platform: Platform; name: string; /** 0–5 bars on the ramp. */ bars: number; bitrate?: number; fps?: number; dropped?: number; latency?: number; state: HealthState }
export interface DestinationHealthTableProps { rows: DestinationHealthProps[] }
export interface AppHeaderProps { current?: string; items?: { id: string; label: string }[]; onNavigate?: (id: string) => void; user?: { name: string; email: string; initials: string }; /** "Teste grátis · 12 dias" as a text action. */ trial?: string; studio?: boolean }
export interface PageHeaderProps { title: string; description?: string; action?: ReactNode }
export interface SectionProps { id: string; title: string; count?: ReactNode; action?: ReactNode; first?: boolean; children: ReactNode }
export interface ActionRowProps { title: string; description?: string; leading?: ReactNode; side?: ReactNode; onClick?: () => void; type?: 'go' | 'expand'; expanded?: boolean; controls?: string }
export interface ModalProps { isOpen?: boolean; onClose?: () => void; title?: string; description?: string; icon?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; dismissible?: boolean; busy?: boolean; ariaLabel?: string; footer?: ReactNode; /** Render inside the nearest positioned container instead of fixed. */ inline?: boolean; children?: ReactNode }
export interface ToastProps { kind?: 'success' | 'error' | 'info'; title: string; detail?: string; action?: { label: string; onClick: () => void }; onDismiss?: () => void }
export interface EmptyStateProps { children: ReactNode; boxed?: boolean; action?: { label: string; onClick?: () => void; icon?: ReactNode } }
export interface SkeletonProps { rows?: number; label?: string }
export interface EventRowProps { title: string; when?: { text: string; time: string }; meta?: string; duration?: string; /** Elapsed while recording: filled circle, word, mono time. */ recording?: string; leading?: ReactNode; action?: ReactNode; menu?: MenuItem[] }
export interface Plan { id: string; name: string; limits: string; price: string; sub?: string; features?: string[]; current?: boolean }
export interface PlanListProps { plans: Plan[]; defaultOpen?: string }
export interface UsageMeterProps { title: string; used: number; max: number; unit: string; note?: string }
export interface RegistryProps { rows: { label: string; value: ReactNode; origin?: string; editable?: boolean }[] }
export interface StatTileProps { label: string; value: string; unit?: string; delta?: string }
export interface ValueChartProps { title: string; series: { name: string; values: number[] }[]; ticks?: string[]; max?: number }
export interface StudioBarProps { session?: string; channels?: string; live?: boolean; elapsed?: string; recording?: string; /** What is missing before air ("2 canais sem chave"). */ pending?: string; onGoLive?: () => void; onEnd?: () => void; onExit?: () => void; onChannels?: () => void }
export interface OnAirProps { live?: boolean; elapsed?: string; recording?: string; pending?: string; size?: 'sm' | 'md' | 'lg'; large?: boolean; showEnd?: boolean; onGoLive?: () => void; onEnd?: () => void }
export interface Scene { id: string; name: string; program?: boolean; preview?: boolean; noScreen?: boolean }
export interface SceneRailProps { scenes: Scene[]; onChoose?: (s: Scene) => void; /** The transition keys. */ children?: ReactNode }
export interface TransitionKeysProps { hasChange: boolean; cutting?: boolean; dissolve?: number; onCut?: (t: 'corte' | 'fusao') => void }
export type StageLayout = 'camera' | 'screen' | 'pip' | 'empty';
export interface StageProps { layout?: StageLayout; guides?: boolean; ticker?: boolean; children?: ReactNode }
export interface MonitorProps { role: 'program' | 'preview'; scene: string; live?: boolean; layout?: StageLayout; guides?: boolean; children?: ReactNode; style?: object }
export interface NextCutProps { changes: string[] }
export interface AudioMeterProps { /** 0–1. */ level: number; /** dBFS; above −12 the bar rises to ink-hi. */ db?: number; peak?: number }
export interface TrayProps { state: { mic?: boolean; camera?: boolean; screen?: boolean; guides?: boolean }; onToggle?: (k: string) => void; level?: number; db?: number; peak?: number; mics?: MenuItem[]; cameras?: MenuItem[]; note?: string }
export interface ToolRailProps { active?: string; onChange?: (id: string) => void; tools?: { id: string; label: string; icon: string; description?: string }[] }
export interface LayoutPickerProps { value?: string; onChange?: (id: string) => void }
export interface StageGraphicsProps { layout?: StageLayout; guides?: boolean; graphics: { logo?: boolean; banner?: { title: string; subtitle?: string }; comment?: { author: string; text: string }; qr?: { title: string; price?: string }; timer?: { title: string; time: string }; ticker?: { tag?: string; text: string } } }
export interface ChatMessageProps { platform: Platform; author: string; time: string; text: string; pinned?: boolean; /** Moderation note ("Marcada pela moderação"). */ flagged?: string }
export interface ChatComposerProps { author?: string; placeholder?: string; /** "Vai para YouTube e Twitch". */ to?: string }
